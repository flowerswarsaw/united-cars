#!/bin/bash
set -euo pipefail

# United Cars - Database Backup Script
# Creates compressed PostgreSQL backups with rotation
# Usage: ./backup-db.sh [environment] [retention-days]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_DIR="$PROJECT_DIR/deploy/compose"
ENV_DIR="$COMPOSE_DIR/env"

# Configuration
ENVIRONMENT="${1:-prod}"
RETENTION_DAYS="${2:-14}"
BACKUP_BASE_DIR="/var/united-cars/backups"
DATE_FORMAT="%Y%m%d_%H%M%S"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

# Usage information
usage() {
    cat << EOF
Usage: $0 [environment] [retention-days]

Arguments:
  environment     Environment to backup (staging|prod, default: prod)
  retention-days  Days to retain backups (default: 14)

Examples:
  $0                    # Backup production with 14 days retention
  $0 staging            # Backup staging with 14 days retention  
  $0 prod 30            # Backup production with 30 days retention

Backup Location: $BACKUP_BASE_DIR/db/
Naming Convention: backup_YYYYMMDD_HHMMSS.sql.gz

EOF
}

# Validate arguments
validate_args() {
    if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "prod" ]]; then
        log_error "Environment must be 'staging' or 'prod'"
        usage
        exit 1
    fi
    
    if ! [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]] || [[ $RETENTION_DAYS -lt 1 ]]; then
        log_error "Retention days must be a positive integer"
        usage
        exit 1
    fi
    
    log_info "Backup environment: $ENVIRONMENT"
    log_info "Retention period: $RETENTION_DAYS days"
}

# Load environment configuration
load_environment() {
    ENV_FILE="$ENV_DIR/.$ENVIRONMENT"
    
    if [[ ! -f "$ENV_FILE" ]]; then
        log_error "Environment file not found: $ENV_FILE"
        exit 1
    fi
    
    # Load environment variables
    set -a
    source "$ENV_FILE"
    set +a
    
    log_success "Environment loaded"
}

# Check prerequisites
check_prerequisites() {
    # Check if running as appropriate user
    if [[ $EUID -eq 0 ]]; then
        log_warning "Running as root - consider using the united-cars user"
    fi
    
    # Check if docker is available
    if ! command -v docker >/dev/null 2>&1; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check if database container is running
    cd "$COMPOSE_DIR"
    if ! docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" ps db | grep -q "Up"; then
        log_error "Database container is not running"
        log_error "Start it with: docker compose -f docker-compose.$ENVIRONMENT.yml --env-file $ENV_DIR/.$ENVIRONMENT up -d db"
        exit 1
    fi
    
    # Create backup directory if it doesn't exist
    BACKUP_DIR="$BACKUP_BASE_DIR/db"
    mkdir -p "$BACKUP_DIR"
    
    # Check available disk space (warn if less than 1GB)
    local available_space
    available_space=$(df "$BACKUP_DIR" | tail -1 | awk '{print $4}')
    if [[ $available_space -lt 1048576 ]]; then  # 1GB in KB
        log_warning "Low disk space: $(df -h "$BACKUP_DIR" | tail -1 | awk '{print $4}') available"
    fi
    
    log_success "Prerequisites check passed"
}

# Perform database backup
perform_backup() {
    local timestamp
    timestamp=$(date +"$DATE_FORMAT")
    local backup_file="$BACKUP_DIR/backup_$timestamp.sql.gz"
    local temp_file="$BACKUP_DIR/backup_$timestamp.sql"
    local metadata_file="$BACKUP_DIR/backup_$timestamp.meta"
    
    log_info "Starting database backup to: $backup_file"
    
    cd "$COMPOSE_DIR"
    
    # Get database information
    local db_size
    db_size=$(docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" exec -T db psql -U postgres -d united_cars -t -c "SELECT pg_size_pretty(pg_database_size('united_cars'));" 2>/dev/null | xargs || echo "unknown")
    
    log_info "Database size: $db_size"
    
    # Create metadata file
    cat > "$metadata_file" << EOF
{
    "backup_date": "$(date -Iseconds)",
    "environment": "$ENVIRONMENT",
    "database_size": "$db_size",
    "backup_file": "$(basename "$backup_file")",
    "retention_days": $RETENTION_DAYS,
    "schema_version": "$(docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" exec -T web node -e "console.log(process.env.IMAGE_TAG || 'unknown')" 2>/dev/null | tr -d '\r' || echo 'unknown')"
}
EOF
    
    # Perform the backup with progress indication
    log_info "Dumping database (this may take a while for large databases)..."
    
    # Use pg_dump with verbose output and custom format for better compression and restore options
    if docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" exec -T db pg_dump \
        -U postgres \
        -d united_cars \
        --verbose \
        --clean \
        --if-exists \
        --format=custom \
        --compress=9 \
        --no-owner \
        --no-acl > "$temp_file.custom" 2>/dev/null; then
        
        # Also create a plain SQL backup for easier inspection
        docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" exec -T db pg_dump \
            -U postgres \
            -d united_cars \
            --clean \
            --if-exists \
            --no-owner \
            --no-acl > "$temp_file" 2>/dev/null
        
        # Compress the plain SQL backup
        gzip "$temp_file"
        
        # Keep the custom format backup as well (more efficient for large restores)
        mv "$temp_file.custom" "$backup_file.custom"
        
    else
        log_error "Database backup failed"
        rm -f "$temp_file" "$temp_file.custom" "$metadata_file"
        exit 1
    fi
    
    # Verify backup integrity
    if [[ -f "$backup_file" && -s "$backup_file" ]]; then
        # Test that the backup can be decompressed
        if gunzip -t "$backup_file" 2>/dev/null; then
            local backup_size
            backup_size=$(ls -lh "$backup_file" | awk '{print $5}')
            log_success "Backup completed successfully"
            log_info "Backup file: $backup_file"
            log_info "Backup size: $backup_size"
            
            # Update metadata with final size
            local temp_meta
            temp_meta=$(mktemp)
            jq --arg size "$backup_size" '.backup_size = $size' "$metadata_file" > "$temp_meta" && mv "$temp_meta" "$metadata_file"
            
        else
            log_error "Backup file is corrupted (failed gzip test)"
            rm -f "$backup_file" "$backup_file.custom" "$metadata_file"
            exit 1
        fi
    else
        log_error "Backup file was not created or is empty"
        exit 1
    fi
}

# Clean up old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    
    local deleted_count=0
    
    # Find and delete old backup files
    while IFS= read -r -d '' file; do
        log_info "Deleting old backup: $(basename "$file")"
        rm -f "$file"
        # Also delete associated files
        rm -f "${file%.sql.gz}.meta"
        rm -f "${file%.sql.gz}.custom"
        deleted_count=$((deleted_count + 1))
    done < <(find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -print0 2>/dev/null || true)
    
    if [[ $deleted_count -gt 0 ]]; then
        log_success "Deleted $deleted_count old backup(s)"
    else
        log_info "No old backups to delete"
    fi
    
    # Show current backup inventory
    log_info "Current backup inventory:"
    if ls "$BACKUP_DIR"/backup_*.sql.gz >/dev/null 2>&1; then
        ls -lh "$BACKUP_DIR"/backup_*.sql.gz | while read -r line; do
            local file_info
            file_info=$(echo "$line" | awk '{print $9 " (" $5 ", " $6 " " $7 " " $8 ")"}')
            echo "  $file_info"
        done
    else
        echo "  No backups found"
    fi
}

# Send backup notification (if configured)
send_notification() {
    local backup_file="$1"
    local backup_size="$2"
    
    # Check if notification webhook is configured
    if [[ -n "${BACKUP_WEBHOOK_URL:-}" ]]; then
        log_info "Sending backup notification..."
        
        local payload
        payload=$(cat << EOF
{
    "text": "✅ United Cars Database Backup Completed",
    "attachments": [
        {
            "color": "good",
            "fields": [
                {"title": "Environment", "value": "$ENVIRONMENT", "short": true},
                {"title": "Backup Size", "value": "$backup_size", "short": true},
                {"title": "File", "value": "$(basename "$backup_file")", "short": false},
                {"title": "Timestamp", "value": "$(date)", "short": false}
            ]
        }
    ]
}
EOF
        )
        
        curl -X POST -H 'Content-type: application/json' \
            --data "$payload" \
            "$BACKUP_WEBHOOK_URL" >/dev/null 2>&1 || log_warning "Failed to send notification"
    fi
}

# Create backup verification script
create_verification_script() {
    local backup_file="$1"
    local verify_script="${backup_file%.sql.gz}_verify.sh"
    
    cat > "$verify_script" << EOF
#!/bin/bash
# Backup Verification Script
# Generated: $(date)

set -euo pipefail

BACKUP_FILE="$backup_file"
CUSTOM_BACKUP_FILE="${backup_file%.sql.gz}.custom"

echo "Verifying backup: \$BACKUP_FILE"

# Test gzip integrity
if gunzip -t "\$BACKUP_FILE"; then
    echo "✅ Backup file integrity: OK"
else
    echo "❌ Backup file integrity: FAILED"
    exit 1
fi

# Test SQL syntax (basic check)
if gunzip -c "\$BACKUP_FILE" | head -100 | grep -q "PostgreSQL database dump"; then
    echo "✅ Backup format: OK"
else
    echo "❌ Backup format: Invalid"
    exit 1
fi

# Show backup statistics
echo
echo "Backup Statistics:"
echo "  File size: \$(ls -lh "\$BACKUP_FILE" | awk '{print \$5}')"
echo "  Created: \$(ls -l "\$BACKUP_FILE" | awk '{print \$6 " " \$7 " " \$8}')"

if [[ -f "\$CUSTOM_BACKUP_FILE" ]]; then
    echo "  Custom format: \$(ls -lh "\$CUSTOM_BACKUP_FILE" | awk '{print \$5}')"
fi

echo
echo "To restore this backup:"
echo "  ./restore-db.sh $ENVIRONMENT \$BACKUP_FILE"

EOF
    
    chmod +x "$verify_script"
    log_info "Verification script created: $verify_script"
}

# Print backup summary
print_summary() {
    local backup_file="$1"
    local backup_size="$2"
    
    log_success "Database backup completed successfully!"
    echo
    echo "=================================="
    echo "Backup Summary"
    echo "=================================="
    echo "Environment: $ENVIRONMENT"
    echo "Backup file: $backup_file"
    echo "Backup size: $backup_size"
    echo "Created: $(date)"
    echo "Retention: $RETENTION_DAYS days"
    echo
    echo "Files created:"
    echo "  SQL backup: $backup_file"
    echo "  Custom format: ${backup_file%.sql.gz}.custom"
    echo "  Metadata: ${backup_file%.sql.gz}.meta"
    echo "  Verification: ${backup_file%.sql.gz}_verify.sh"
    echo
    echo "To verify backup:"
    echo "  ${backup_file%.sql.gz}_verify.sh"
    echo
    echo "To restore backup:"
    echo "  ./restore-db.sh $ENVIRONMENT $backup_file"
    echo
}

# Main function
main() {
    local start_time
    start_time=$(date +%s)
    
    log_info "Starting United Cars database backup..."
    
    validate_args
    load_environment
    check_prerequisites
    
    # Perform backup
    perform_backup
    
    # Get final backup info
    local latest_backup
    latest_backup=$(ls -t "$BACKUP_DIR"/backup_*.sql.gz | head -1)
    local backup_size
    backup_size=$(ls -lh "$latest_backup" | awk '{print $5}')
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Create verification script
    create_verification_script "$latest_backup"
    
    # Send notification if configured
    send_notification "$latest_backup" "$backup_size"
    
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    print_summary "$latest_backup" "$backup_size"
    log_success "Backup completed in ${duration}s"
}

# Handle command line execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Check for help flag
    if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
        usage
        exit 0
    fi
    
    main "$@"
fi