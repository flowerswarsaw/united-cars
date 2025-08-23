#!/bin/bash
set -euo pipefail

# GitHub Actions Deployment Helper Scripts
# Common functions for deployment workflows

# Colors
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

# Wait for application to be healthy
wait_for_health() {
    local url="$1"
    local timeout="${2:-300}"
    local interval="${3:-10}"
    
    log_info "Waiting for application health check at $url"
    
    local count=0
    local max_count=$((timeout / interval))
    
    while [ $count -lt $max_count ]; do
        if curl -f -s "$url" >/dev/null 2>&1; then
            log_success "Health check passed"
            return 0
        fi
        
        count=$((count + 1))
        log_info "Health check attempt $count/$max_count failed, retrying in ${interval}s..."
        sleep "$interval"
    done
    
    log_error "Health check failed after ${timeout}s timeout"
    return 1
}

# Verify Docker Compose services are healthy
verify_compose_health() {
    local compose_file="$1"
    local env_file="$2"
    
    log_info "Verifying Docker Compose services health"
    
    # Check if all services are running
    local services
    services=$(docker compose -f "$compose_file" --env-file "$env_file" ps --services)
    
    for service in $services; do
        local status
        status=$(docker compose -f "$compose_file" --env-file "$env_file" ps "$service" --format "{{.Status}}")
        
        if echo "$status" | grep -q "Up\|healthy"; then
            log_success "Service $service: $status"
        else
            log_error "Service $service: $status"
            return 1
        fi
    done
    
    log_success "All services are healthy"
}

# Create deployment metadata
create_deployment_metadata() {
    local tag="$1"
    local environment="$2"
    local metadata_file="$3"
    
    cat > "$metadata_file" << EOF
{
    "deployment_id": "${GITHUB_RUN_ID:-unknown}",
    "tag": "$tag",
    "environment": "$environment",
    "commit_sha": "${GITHUB_SHA:-unknown}",
    "deployed_by": "${GITHUB_ACTOR:-unknown}",
    "deployed_at": "$(date -Iseconds)",
    "workflow_url": "https://github.com/${GITHUB_REPOSITORY:-unknown}/actions/runs/${GITHUB_RUN_ID:-unknown}"
}
EOF
    
    log_info "Deployment metadata created: $metadata_file"
}

# Test database connectivity
test_database_connection() {
    local compose_file="$1"
    local env_file="$2"
    
    log_info "Testing database connectivity"
    
    if docker compose -f "$compose_file" --env-file "$env_file" exec -T db pg_isready -U postgres >/dev/null 2>&1; then
        log_success "Database connection successful"
        return 0
    else
        log_error "Database connection failed"
        return 1
    fi
}

# Run database migration check
check_migration_status() {
    local compose_file="$1"
    local env_file="$2"
    
    log_info "Checking database migration status"
    
    local migration_count
    migration_count=$(docker compose -f "$compose_file" --env-file "$env_file" exec -T db psql -U postgres -d united_cars -t -c "SELECT COUNT(*) FROM public._prisma_migrations WHERE finished_at IS NOT NULL;" 2>/dev/null | xargs || echo "0")
    
    log_info "Applied migrations: $migration_count"
    
    if [ "$migration_count" -gt 0 ]; then
        log_success "Database has applied migrations"
        return 0
    else
        log_warning "No migrations found (this might be expected for new databases)"
        return 0
    fi
}

# Cleanup old Docker images
cleanup_docker_images() {
    local keep_count="${1:-3}"
    
    log_info "Cleaning up old Docker images (keeping last $keep_count)"
    
    # Remove old united-cars images (keep last N)
    local old_images
    old_images=$(docker images --filter "reference=*united-cars*" --format "{{.Repository}}:{{.Tag}} {{.ID}}" | tail -n +$((keep_count + 1)) | awk '{print $2}' || true)
    
    if [ -n "$old_images" ]; then
        echo "$old_images" | xargs docker rmi -f || true
        log_success "Cleaned up old Docker images"
    else
        log_info "No old images to clean up"
    fi
    
    # Remove dangling images
    docker image prune -f >/dev/null 2>&1 || true
}

# Send deployment notification to Slack/Discord
send_deployment_notification() {
    local webhook_url="$1"
    local status="$2"
    local tag="$3"
    local environment="$4"
    local url="$5"
    
    if [ -z "$webhook_url" ]; then
        log_info "No webhook URL provided, skipping notification"
        return 0
    fi
    
    local color
    local emoji
    if [ "$status" = "success" ]; then
        color="good"
        emoji="✅"
    elif [ "$status" = "warning" ]; then
        color="warning"
        emoji="⚠️"
    else
        color="danger"
        emoji="❌"
    fi
    
    local payload
    payload=$(cat << EOF
{
    "text": "$emoji United Cars Deployment $status",
    "attachments": [
        {
            "color": "$color",
            "fields": [
                {"title": "Environment", "value": "$environment", "short": true},
                {"title": "Release", "value": "$tag", "short": true},
                {"title": "Status", "value": "$emoji $status", "short": true},
                {"title": "Deployed by", "value": "${GITHUB_ACTOR:-unknown}", "short": true},
                {"title": "URL", "value": "$url", "short": false},
                {"title": "Workflow", "value": "https://github.com/${GITHUB_REPOSITORY:-unknown}/actions/runs/${GITHUB_RUN_ID:-unknown}", "short": false}
            ],
            "ts": $(date +%s)
        }
    ]
}
EOF
    )
    
    if curl -X POST -H 'Content-type: application/json' --data "$payload" "$webhook_url" >/dev/null 2>&1; then
        log_success "Deployment notification sent"
    else
        log_warning "Failed to send deployment notification"
    fi
}

# Rollback to previous version
rollback_deployment() {
    local environment="$1"
    local compose_file="$2"
    local env_file="$3"
    local backup_file="${4:-}"
    
    log_warning "Starting rollback for $environment environment"
    
    # Stop current services
    log_info "Stopping current services..."
    docker compose -f "$compose_file" --env-file "$env_file" down
    
    # If backup file provided, restore database
    if [ -n "$backup_file" ] && [ -f "$backup_file" ]; then
        log_info "Restoring database from backup: $backup_file"
        if ! ./deploy/scripts/restore-db.sh "$environment" "$backup_file"; then
            log_error "Database restore failed during rollback"
            return 1
        fi
    fi
    
    # Get previous version
    local previous_version_file="$HOME/united-cars/.previous-${environment}-version"
    if [ -f "$previous_version_file" ]; then
        local previous_version
        previous_version=$(cat "$previous_version_file")
        log_info "Rolling back to previous version: $previous_version"
        
        # Update IMAGE_TAG in environment file
        sed -i.bak "s/^IMAGE_TAG=.*/IMAGE_TAG=$previous_version/" "$env_file"
    else
        log_warning "No previous version found, using latest stable"
        sed -i.bak "s/^IMAGE_TAG=.*/IMAGE_TAG=latest/" "$env_file"
    fi
    
    # Start services with previous version
    log_info "Starting services with rolled back version..."
    docker compose -f "$compose_file" --env-file "$env_file" up -d
    
    # Wait for health check
    local health_url
    if [ "$environment" = "prod" ]; then
        health_url="https://$(grep '^DOMAIN=' "$env_file" | cut -d'=' -f2)/api/health"
    else
        health_url="http://localhost:3000/api/health"
    fi
    
    if wait_for_health "$health_url" 180 10; then
        log_success "Rollback completed successfully"
        return 0
    else
        log_error "Rollback failed - application not healthy"
        return 1
    fi
}

# Export functions for use in other scripts
export -f log_info log_success log_warning log_error
export -f wait_for_health verify_compose_health create_deployment_metadata
export -f test_database_connection check_migration_status cleanup_docker_images
export -f send_deployment_notification rollback_deployment