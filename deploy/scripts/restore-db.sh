#!/bin/bash
set -euo pipefail

# United Cars - Database Restore Script
# Restores PostgreSQL database from backup with safety checks
# Usage: ./restore-db.sh [environment] [backup-file]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_DIR="$PROJECT_DIR/deploy/compose"
ENV_DIR="$COMPOSE_DIR/env"

# Configuration
ENVIRONMENT="${1:-}"
BACKUP_FILE="${2:-}"
BACKUP_BASE_DIR="/var/united-cars/backups"

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
Usage: $0 [environment] [backup-file]

Arguments:
  environment   Environment to restore to (staging|prod)
  backup-file   Path to backup file to restore

Examples:
  $0 staging /var/united-cars/backups/db/backup_20231201_143022.sql.gz
  $0 prod /var/united-cars/backups/db/backup_20231201_143022.sql.gz

Available backups:
EOF
    
    if ls "$BACKUP_BASE_DIR"/db/backup_*.sql.gz >/dev/null 2>&1; then
        ls -lht "$BACKUP_BASE_DIR"/db/backup_*.sql.gz | head -10 | while read -r line; do
            echo "  $(echo "$line" | awk '{print $9 " (" $5 ", " $6 " " $7 " " $8 ")"}')"
        done
    else
        echo "  No backups found in $BACKUP_BASE_DIR/db/"
    fi
    
    echo
    echo "⚠️  WARNING: This operation will REPLACE the current database!"
    echo "   Make sure to create a backup before proceeding."
    echo
}

# Validate arguments
validate_args() {
    if [[ -z "$ENVIRONMENT" ]]; then
        log_error "Environment is required"
        usage
        exit 1
    fi
    
    if [[ -z "$BACKUP_FILE" ]]; then
        log_error "Backup file is required"
        usage
        exit 1
    fi
    
    if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "prod" ]]; then
        log_error "Environment must be 'staging' or 'prod'"
        usage
        exit 1
    fi
    
    if [[ ! -f "$BACKUP_FILE" ]]; then
        log_error "Backup file not found: $BACKUP_FILE"
        
        # Suggest available backups
        log_info "Available backups:"
        if ls "$BACKUP_BASE_DIR"/db/backup_*.sql.gz >/dev/null 2>&1; then
            ls -lht "$BACKUP_BASE_DIR"/db/backup_*.sql.gz | head -5
        fi
        exit 1
    fi
    
    log_info "Restore environment: $ENVIRONMENT"
    log_info "Backup file: $BACKUP_FILE"
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

# Safety confirmations
safety_confirmations() {
    echo
    log_warning "⚠️  DATABASE RESTORE WARNING ⚠️"
    echo
    echo "This operation will:"
    echo "  1. STOP the web application"
    echo "  2. DROP the current database"
    echo "  3. RESTORE from backup: $(basename "$BACKUP_FILE")"
    echo "  4. All current data will be LOST"
    echo
    echo "Target environment: $ENVIRONMENT"
    echo "Target database: $DOMAIN"
    echo
    
    # Show backup information if metadata exists
    local metadata_file="${BACKUP_FILE%.sql.gz}.meta"
    if [[ -f "$metadata_file" ]]; then
        echo "Backup information:"
        jq -r '"  Created: " + .backup_date + "\n  Size: " + .backup_size + "\n  Schema version: " + .schema_version' "$metadata_file" 2>/dev/null || echo "  Metadata file exists but couldn't be parsed"
        echo
    fi
    
    # Production requires additional confirmation
    if [[ "$ENVIRONMENT" == "prod" ]]; then
        log_error "🚨 PRODUCTION ENVIRONMENT DETECTED 🚨"
        echo
        echo "You are about to restore the PRODUCTION database!"
        echo "This action is IRREVERSIBLE and will affect live users."
        echo
        read -p "Type 'RESTORE PRODUCTION DATABASE' to confirm: " -r
        if [[ "$REPLY" != "RESTORE PRODUCTION DATABASE" ]]; then
            log_info "Restore cancelled"
            exit 0
        fi
    fi
    
    # Final confirmation
    read -p "Are you absolutely sure you want to proceed? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Restore cancelled"
        exit 0
    fi
    
    # Additional typing confirmation for production
    if [[ "$ENVIRONMENT" == "prod" ]]; then
        read -p "Type 'YES' to proceed with production restore: " -r
        if [[ "$REPLY" != "YES" ]]; then
            log_info "Restore cancelled"
            exit 0
        fi
    fi
}

# Create safety backup before restore
create_safety_backup() {
    log_info "Creating safety backup of current database..."
    
    cd "$COMPOSE_DIR"
    
    # Check if database is running
    if docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" ps db | grep -q "Up"; then
        local safety_backup_file
        safety_backup_file="$BACKUP_BASE_DIR/db/pre-restore-safety-backup_$(date +%Y%m%d_%H%M%S).sql.gz"
        
        # Create safety backup
        docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" exec -T db pg_dump \
            -U postgres \
            -d united_cars \
            --clean \
            --if-exists \
            --no-owner \
            --no-acl | gzip > "$safety_backup_file"
        
        if [[ -f "$safety_backup_file" && -s "$safety_backup_file" ]]; then
            log_success "Safety backup created: $safety_backup_file"
            export SAFETY_BACKUP_FILE="$safety_backup_file"
        else
            log_error "Failed to create safety backup"
            exit 1
        fi
    else
        log_info "Database not running - skipping safety backup"
    fi
}

# Verify backup file integrity
verify_backup() {
    log_info "Verifying backup file integrity..."
    
    # Check if file is a valid gzip
    if ! gunzip -t "$BACKUP_FILE"; then
        log_error "Backup file is corrupted or not a valid gzip file"
        exit 1
    fi
    
    # Check if it contains PostgreSQL dump
    if ! gunzip -c "$BACKUP_FILE" | head -10 | grep -q "PostgreSQL database dump"; then
        log_error "File does not appear to be a PostgreSQL dump"
        exit 1
    fi
    
    # Get basic statistics
    local uncompressed_size
    uncompressed_size=$(gunzip -l "$BACKUP_FILE" | tail -1 | awk '{print $2}')
    local compressed_size
    compressed_size=$(ls -l "$BACKUP_FILE" | awk '{print $5}')
    
    log_success "Backup verification passed"
    log_info "Compressed size: $(numfmt --to=iec "$compressed_size")"
    log_info "Uncompressed size: $(numfmt --to=iec "$uncompressed_size")"
}

# Stop application services
stop_application() {
    log_info "Stopping application services..."
    
    cd "$COMPOSE_DIR"
    
    # Stop web application and caddy (keep database running)
    docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" stop web caddy || true
    
    log_success "Application services stopped"
}

# Perform database restore
perform_restore() {
    log_info "Starting database restore..."
    
    cd "$COMPOSE_DIR"
    
    # Ensure database is running
    docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" up -d db
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    local retry_count=0
    while [[ $retry_count -lt 30 ]]; do
        if docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" exec -T db pg_isready -U postgres >/dev/null 2>&1; then
            break
        fi
        retry_count=$((retry_count + 1))
        if [[ $retry_count -eq 30 ]]; then
            log_error "Database failed to become ready"
            exit 1
        fi
        sleep 2
    done
    
    log_success "Database is ready"
    
    # Check if we have a custom format backup (more efficient)
    local custom_backup="${BACKUP_FILE%.sql.gz}.custom"
    
    if [[ -f "$custom_backup" ]]; then
        log_info "Using custom format backup for faster restore..."
        
        # Restore using pg_restore (faster for custom format)
        docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" exec -T db pg_restore \
            -U postgres \
            -d united_cars \
            --clean \
            --if-exists \
            --no-owner \
            --no-acl \
            --verbose < "$custom_backup"
    else
        log_info "Using SQL format backup..."
        
        # Restore from gzipped SQL file
        gunzip -c "$BACKUP_FILE" | docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" exec -T db psql \
            -U postgres \
            -d united_cars \
            --quiet
    fi
    
    # Verify restore was successful
    local table_count
    table_count=$(docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" exec -T db psql \
        -U postgres \
        -d united_cars \
        -t \
        -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    
    if [[ "$table_count" -gt 0 ]]; then
        log_success "Database restore completed successfully"
        log_info "Restored $table_count tables"
    else
        log_error "Database restore may have failed (no tables found)"
        exit 1
    fi
}

# Run post-restore tasks
post_restore_tasks() {
    log_info "Running post-restore tasks..."
    
    cd "$COMPOSE_DIR"
    
    # Run any pending migrations (in case backup is from older schema version)
    log_info "Running database migrations..."
    docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" up migrate || {
        log_warning "Migration failed - this may be expected if backup is current"
    }
    
    # Update database statistics
    log_info "Updating database statistics..."
    docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" exec -T db psql \
        -U postgres \
        -d united_cars \
        -c "ANALYZE;" >/dev/null
    
    log_success "Post-restore tasks completed"
}

# Start application services
start_application() {
    log_info "Starting application services..."
    
    cd "$COMPOSE_DIR"
    
    # Start web application
    docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" up -d web
    
    # Wait for web application to be healthy
    log_info "Waiting for web application to be ready..."
    local retry_count=0
    while [[ $retry_count -lt 30 ]]; do
        if docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" ps web | grep -q "healthy"; then
            break
        fi
        retry_count=$((retry_count + 1))
        if [[ $retry_count -eq 30 ]]; then
            log_warning "Web application is taking longer than expected to be ready"
            break
        fi
        sleep 5
    done
    
    # Start reverse proxy
    docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" up -d caddy
    
    log_success "Application services started"
}

# Verify application functionality
verify_application() {
    log_info "Verifying application functionality..."
    
    # Internal health check
    cd "$COMPOSE_DIR"
    if docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" exec -T web curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        log_success "Internal health check passed"
    else
        log_warning "Internal health check failed"
        return 1
    fi
    
    # External health check (if possible)
    local retry_count=0
    while [[ $retry_count -lt 5 ]]; do
        if curl -f -k "https://$DOMAIN/api/health" >/dev/null 2>&1; then
            log_success "External health check passed"
            break
        fi
        retry_count=$((retry_count + 1))
        if [[ $retry_count -eq 5 ]]; then
            log_warning "External health check failed - may be SSL/DNS issue"
        fi
        sleep 3
    done
    
    return 0
}

# Print restore summary
print_summary() {
    log_success "Database restore completed successfully!"
    echo
    echo "=================================="
    echo "Restore Summary"
    echo "=================================="
    echo "Environment: $ENVIRONMENT"
    echo "Restored from: $(basename "$BACKUP_FILE")"
    echo "Completed: $(date)"
    echo
    echo "URLs:"
    echo "  Application: https://$DOMAIN"
    echo "  Health Check: https://$DOMAIN/api/health"
    echo
    if [[ -n "${SAFETY_BACKUP_FILE:-}" ]]; then
        echo "Safety backup created: $SAFETY_BACKUP_FILE"
        echo "  (Previous database state preserved)"
        echo
    fi
    echo "Next steps:"
    echo "  1. Test application functionality"
    echo "  2. Verify data integrity"
    echo "  3. Monitor application logs"
    echo
    echo "Monitor with:"
    echo "  docker compose -f $COMPOSE_DIR/docker-compose.$ENVIRONMENT.yml --env-file $ENV_DIR/.$ENVIRONMENT logs -f"
    echo
}

# Main function
main() {
    local start_time
    start_time=$(date +%s)
    
    log_info "Starting United Cars database restore..."
    
    validate_args
    load_environment
    verify_backup
    safety_confirmations
    create_safety_backup
    stop_application
    perform_restore
    post_restore_tasks
    start_application
    
    if ! verify_application; then
        log_warning "Application verification had issues - check logs"
    fi
    
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    print_summary
    log_success "Restore completed in ${duration}s"
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