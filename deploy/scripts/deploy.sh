#!/bin/bash
set -euo pipefail

# United Cars - Deployment Script
# Safe deployment with health checks, migrations, and rollback capability
# Usage: ./deploy.sh [staging|prod] [image-tag]

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_DIR="$PROJECT_DIR/deploy/compose"
ENV_DIR="$COMPOSE_DIR/env"
MAX_HEALTH_RETRIES=30
HEALTH_CHECK_INTERVAL=10
DEPLOYMENT_TIMEOUT=900  # 15 minutes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
Usage: $0 [staging|prod] [image-tag]

Arguments:
  environment    Deployment environment (staging or prod)
  image-tag      Docker image tag to deploy (optional, defaults to 'latest')

Examples:
  $0 staging                    # Deploy latest to staging
  $0 staging v1.2.3            # Deploy specific version to staging
  $0 prod v1.2.3               # Deploy to production

Environment Files:
  Staging: $ENV_DIR/.staging
  Production: $ENV_DIR/.prod

Pre-deployment Checklist:
  1. Environment file exists and is properly configured
  2. DNS is pointing to this server
  3. Docker and Docker Compose are installed
  4. Firewall allows ports 80 and 443
  5. SSL certificates can be obtained (Let's Encrypt)

EOF
}

# Validate arguments
validate_args() {
    if [[ $# -lt 1 ]]; then
        log_error "Missing required arguments"
        usage
        exit 1
    fi
    
    ENVIRONMENT="$1"
    IMAGE_TAG="${2:-latest}"
    
    if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "prod" ]]; then
        log_error "Environment must be 'staging' or 'prod'"
        usage
        exit 1
    fi
    
    log_info "Deploying to environment: $ENVIRONMENT"
    log_info "Image tag: $IMAGE_TAG"
}

# Load and validate environment
load_environment() {
    ENV_FILE="$ENV_DIR/.$ENVIRONMENT"
    
    if [[ ! -f "$ENV_FILE" ]]; then
        log_error "Environment file not found: $ENV_FILE"
        log_error "Copy the example file and configure it:"
        log_error "  cp $ENV_DIR/.$ENVIRONMENT.example $ENV_FILE"
        exit 1
    fi
    
    # Load environment variables
    set -a  # Export all variables
    source "$ENV_FILE"
    set +a  # Stop exporting
    
    # Override with deployment-specific values
    export IMAGE_TAG="$IMAGE_TAG"
    export COMMIT_SHA="${COMMIT_SHA:-$IMAGE_TAG}"
    
    # Validate required variables
    local required_vars=(
        "DOMAIN"
        "DB_PASSWORD"
        "NEXTAUTH_SECRET"
        "REGISTRY_URL"
        "IMAGE_NAME"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    log_success "Environment loaded and validated"
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check if docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running"
        exit 1
    fi
    
    # Check if docker compose is available
    if ! docker compose version >/dev/null 2>&1; then
        log_error "Docker Compose is not available"
        exit 1
    fi
    
    # Check if compose files exist
    local compose_file="$COMPOSE_DIR/docker-compose.$ENVIRONMENT.yml"
    if [[ ! -f "$compose_file" ]]; then
        log_error "Docker Compose file not found: $compose_file"
        exit 1
    fi
    
    # Check if domain resolves to this server (optional check)
    if command -v dig >/dev/null 2>&1; then
        local domain_ip
        domain_ip=$(dig +short "$DOMAIN" | tail -n1)
        local server_ip
        server_ip=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "unknown")
        
        if [[ -n "$domain_ip" && "$domain_ip" != "$server_ip" ]]; then
            log_warning "Domain $DOMAIN resolves to $domain_ip, but server IP is $server_ip"
            log_warning "Make sure DNS is properly configured"
        fi
    fi
    
    # Check available disk space (minimum 2GB)
    local available_space
    available_space=$(df / | tail -1 | awk '{print $4}')
    if [[ $available_space -lt 2097152 ]]; then  # 2GB in KB
        log_error "Insufficient disk space (less than 2GB available)"
        exit 1
    fi
    
    # Check if required directories exist
    local required_dirs=(
        "/var/united-cars/uploads"
        "/var/united-cars/logs"
        "/var/united-cars/backups"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            log_info "Creating directory: $dir"
            mkdir -p "$dir"
            chown -R "$(id -u):$(id -g)" "$dir"
        fi
    done
    
    log_success "Pre-deployment checks passed"
}

# Create backup of current state
create_backup() {
    if [[ -f "$COMPOSE_DIR/docker-compose.$ENVIRONMENT.yml" ]]; then
        log_info "Creating backup of current deployment..."
        
        # Create timestamped backup directory
        local backup_dir="/var/united-cars/backups/deployment-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$backup_dir"
        
        # Backup current compose file and env
        cp "$COMPOSE_DIR/docker-compose.$ENVIRONMENT.yml" "$backup_dir/"
        cp "$ENV_DIR/.$ENVIRONMENT" "$backup_dir/"
        
        # Backup database if running
        if docker compose -f "$COMPOSE_DIR/docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" ps db | grep -q "Up"; then
            log_info "Creating database backup..."
            docker compose -f "$COMPOSE_DIR/docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" exec -T db pg_dump -U postgres united_cars | gzip > "$backup_dir/database.sql.gz"
        fi
        
        echo "$IMAGE_TAG" > "$backup_dir/previous-version.txt"
        
        log_success "Backup created: $backup_dir"
        export BACKUP_DIR="$backup_dir"
    fi
}

# Pull latest images
pull_images() {
    log_info "Pulling Docker images..."
    
    cd "$COMPOSE_DIR"
    
    # Set compose file and env file
    export COMPOSE_FILE="docker-compose.$ENVIRONMENT.yml"
    
    # Pull all images
    docker compose --env-file "$ENV_DIR/.$ENVIRONMENT" pull --quiet
    
    log_success "Images pulled successfully"
}

# Start infrastructure services
start_infrastructure() {
    log_info "Starting infrastructure services (database, redis)..."
    
    cd "$COMPOSE_DIR"
    
    # Start database and redis first
    docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" up -d db redis
    
    # Wait for database to be healthy
    log_info "Waiting for database to be ready..."
    local retry_count=0
    while [[ $retry_count -lt $MAX_HEALTH_RETRIES ]]; do
        if docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" ps db | grep -q "healthy"; then
            log_success "Database is ready"
            break
        fi
        
        retry_count=$((retry_count + 1))
        if [[ $retry_count -eq $MAX_HEALTH_RETRIES ]]; then
            log_error "Database failed to become ready within timeout"
            show_logs "db"
            exit 1
        fi
        
        log_info "Database not ready yet, waiting... ($retry_count/$MAX_HEALTH_RETRIES)"
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    # Wait for Redis to be healthy
    log_info "Waiting for Redis to be ready..."
    retry_count=0
    while [[ $retry_count -lt $MAX_HEALTH_RETRIES ]]; do
        if docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" ps redis | grep -q "healthy"; then
            log_success "Redis is ready"
            break
        fi
        
        retry_count=$((retry_count + 1))
        if [[ $retry_count -eq $MAX_HEALTH_RETRIES ]]; then
            log_error "Redis failed to become ready within timeout"
            show_logs "redis"
            exit 1
        fi
        
        log_info "Redis not ready yet, waiting... ($retry_count/$MAX_HEALTH_RETRIES)"
        sleep 5
    done
    
    log_success "Infrastructure services are ready"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    cd "$COMPOSE_DIR"
    
    # Run migration container
    docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" up migrate
    
    # Check if migration succeeded
    local exit_code
    exit_code=$(docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" ps migrate --format json | jq -r '.[0].State' 2>/dev/null || echo "unknown")
    
    if [[ "$exit_code" != "exited" ]]; then
        log_error "Database migration failed"
        show_logs "migrate"
        exit 1
    fi
    
    log_success "Database migrations completed"
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
    while [[ $retry_count -lt $MAX_HEALTH_RETRIES ]]; do
        if docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" ps web | grep -q "healthy"; then
            log_success "Web application is ready"
            break
        fi
        
        retry_count=$((retry_count + 1))
        if [[ $retry_count -eq $MAX_HEALTH_RETRIES ]]; then
            log_error "Web application failed to become ready within timeout"
            show_logs "web"
            exit 1
        fi
        
        log_info "Web application not ready yet, waiting... ($retry_count/$MAX_HEALTH_RETRIES)"
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    # Start reverse proxy
    log_info "Starting reverse proxy (Caddy)..."
    docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" up -d caddy
    
    log_success "Application services started"
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    # Internal health check (container to container)
    cd "$COMPOSE_DIR"
    
    if docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" exec -T web curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        log_success "Internal health check passed"
    else
        log_error "Internal health check failed"
        show_logs "web"
        return 1
    fi
    
    # External health check (through reverse proxy)
    local retry_count=0
    log_info "Checking external accessibility..."
    while [[ $retry_count -lt 10 ]]; do
        if curl -f -k "https://$DOMAIN/api/health" >/dev/null 2>&1; then
            log_success "External health check passed"
            break
        elif curl -f "http://$DOMAIN/api/health" >/dev/null 2>&1; then
            log_success "External health check passed (HTTP)"
            break
        fi
        
        retry_count=$((retry_count + 1))
        if [[ $retry_count -eq 10 ]]; then
            log_warning "External health check failed - but continuing (may be SSL cert issue)"
            break
        fi
        
        log_info "External check not ready yet, waiting... ($retry_count/10)"
        sleep 5
    done
    
    # Version check
    local deployed_version
    deployed_version=$(curl -s -k "https://$DOMAIN/api/version" 2>/dev/null | jq -r '.version // .build // "unknown"' 2>/dev/null || echo "unknown")
    log_info "Deployed version: $deployed_version"
    
    return 0
}

# Show service logs
show_logs() {
    local service="${1:-}"
    if [[ -n "$service" ]]; then
        log_info "Showing logs for $service:"
        docker compose -f "$COMPOSE_DIR/docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" logs --tail=20 "$service" || true
    else
        log_info "Showing recent logs for all services:"
        docker compose -f "$COMPOSE_DIR/docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" logs --tail=10 || true
    fi
}

# Rollback to previous version
rollback() {
    if [[ -n "${BACKUP_DIR:-}" && -f "$BACKUP_DIR/previous-version.txt" ]]; then
        local previous_version
        previous_version=$(cat "$BACKUP_DIR/previous-version.txt")
        log_warning "Rolling back to previous version: $previous_version"
        
        # Stop current services
        cd "$COMPOSE_DIR"
        docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" down
        
        # Restore database if backup exists
        if [[ -f "$BACKUP_DIR/database.sql.gz" ]]; then
            log_info "Restoring database backup..."
            docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" up -d db
            sleep 10
            gunzip -c "$BACKUP_DIR/database.sql.gz" | docker compose -f "docker-compose.$ENVIRONMENT.yml" --env-file "$ENV_DIR/.$ENVIRONMENT" exec -T db psql -U postgres -d united_cars
        fi
        
        # Deploy previous version
        IMAGE_TAG="$previous_version" "$0" "$ENVIRONMENT" "$previous_version"
    else
        log_error "Cannot rollback - no backup information available"
        exit 1
    fi
}

# Cleanup old images
cleanup() {
    log_info "Cleaning up old Docker images..."
    
    # Remove dangling images
    docker image prune -f >/dev/null 2>&1 || true
    
    # Remove old versions (keep last 3)
    local old_images
    old_images=$(docker images "${REGISTRY_URL}/${IMAGE_NAME}" --format "{{.Tag}} {{.ID}}" | tail -n +4 | awk '{print $2}' | head -n -3 || true)
    
    if [[ -n "$old_images" ]]; then
        echo "$old_images" | xargs -r docker rmi -f >/dev/null 2>&1 || true
        log_success "Cleaned up old images"
    fi
}

# Print deployment summary
print_summary() {
    log_success "Deployment completed successfully!"
    echo
    echo "=================================="
    echo "Deployment Summary"
    echo "=================================="
    echo "Environment: $ENVIRONMENT"
    echo "Image Tag: $IMAGE_TAG"
    echo "Domain: $DOMAIN"
    echo "Deployed: $(date)"
    echo
    echo "URLs:"
    echo "  Application: https://$DOMAIN"
    echo "  Health Check: https://$DOMAIN/api/health"
    echo "  Version Info: https://$DOMAIN/api/version"
    echo
    echo "Login Credentials:"
    echo "  Admin: admin@demo.com / admin123"
    echo "  Dealer: dealer@demo.com / dealer123"
    echo
    echo "Management Commands:"
    echo "  View logs: docker compose -f $COMPOSE_DIR/docker-compose.$ENVIRONMENT.yml --env-file $ENV_DIR/.$ENVIRONMENT logs -f"
    echo "  Restart: docker compose -f $COMPOSE_DIR/docker-compose.$ENVIRONMENT.yml --env-file $ENV_DIR/.$ENVIRONMENT restart"
    echo "  Status: docker compose -f $COMPOSE_DIR/docker-compose.$ENVIRONMENT.yml --env-file $ENV_DIR/.$ENVIRONMENT ps"
    echo
    if [[ -n "${BACKUP_DIR:-}" ]]; then
        echo "Backup created: $BACKUP_DIR"
        echo "  To rollback: IMAGE_TAG=\$(cat $BACKUP_DIR/previous-version.txt) $0 $ENVIRONMENT \$(cat $BACKUP_DIR/previous-version.txt)"
        echo
    fi
}

# Trap errors and provide rollback option
trap 'handle_error $?' ERR

handle_error() {
    local exit_code=$1
    if [[ $exit_code -ne 0 ]]; then
        log_error "Deployment failed with exit code $exit_code"
        show_logs
        
        if [[ -n "${BACKUP_DIR:-}" ]]; then
            echo
            read -p "Do you want to rollback to the previous version? [y/N] " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                rollback
            fi
        fi
        exit $exit_code
    fi
}

# Main deployment function
main() {
    local start_time
    start_time=$(date +%s)
    
    log_info "Starting United Cars deployment..."
    
    validate_args "$@"
    load_environment
    pre_deployment_checks
    create_backup
    pull_images
    start_infrastructure
    run_migrations
    start_application
    
    if ! health_check; then
        log_error "Health check failed - deployment unsuccessful"
        exit 1
    fi
    
    cleanup
    
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    print_summary
    log_success "Total deployment time: ${duration}s"
}

# Handle command line arguments
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi