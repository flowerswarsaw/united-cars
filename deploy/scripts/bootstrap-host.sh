#!/bin/bash
set -euo pipefail

# United Cars - Host Bootstrap Script
# Prepares a fresh Ubuntu 22+ server for United Cars deployment
# Usage: curl -sSL https://raw.githubusercontent.com/your-org/united-cars/main/deploy/scripts/bootstrap-host.sh | bash

# Configuration
UNITED_CARS_USER="united-cars"
DOCKER_COMPOSE_VERSION="v2.21.0"
FAIL2BAN_CONFIG_DIR="/etc/fail2ban"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Detect OS and version
detect_os() {
    if [[ ! -f /etc/os-release ]]; then
        log_error "Cannot detect OS. This script requires Ubuntu 22+ or similar"
        exit 1
    fi
    
    source /etc/os-release
    
    if [[ "$ID" != "ubuntu" ]] && [[ "$ID_LIKE" != *"ubuntu"* ]] && [[ "$ID_LIKE" != *"debian"* ]]; then
        log_warning "This script is tested on Ubuntu 22+. Your OS: $PRETTY_NAME"
        read -p "Continue anyway? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log_info "Detected OS: $PRETTY_NAME"
}

# Update system packages
update_system() {
    log_info "Updating system packages..."
    apt-get update -qq
    apt-get upgrade -yq
    apt-get install -yq \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release \
        software-properties-common \
        ufw \
        fail2ban \
        htop \
        ncdu \
        unzip \
        jq \
        postgresql-client-common \
        postgresql-client \
        cron
    log_success "System packages updated"
}

# Create United Cars user
create_user() {
    if id "$UNITED_CARS_USER" &>/dev/null; then
        log_info "User $UNITED_CARS_USER already exists"
    else
        log_info "Creating user $UNITED_CARS_USER..."
        useradd -m -s /bin/bash -G sudo,docker "$UNITED_CARS_USER"
        log_success "User $UNITED_CARS_USER created"
    fi
    
    # Create necessary directories
    sudo -u "$UNITED_CARS_USER" mkdir -p "/home/$UNITED_CARS_USER"/{.ssh,united-cars}
    mkdir -p /var/united-cars/{uploads,logs,backups}
    chown -R "$UNITED_CARS_USER:$UNITED_CARS_USER" /var/united-cars
    chmod 755 /var/united-cars
    chmod 755 /var/united-cars/{uploads,logs,backups}
}

# Install Docker
install_docker() {
    if command -v docker &> /dev/null; then
        log_info "Docker already installed: $(docker --version)"
        return
    fi
    
    log_info "Installing Docker..."
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    apt-get update -qq
    apt-get install -yq docker-ce docker-ce-cli containerd.io
    
    # Add user to docker group
    usermod -aG docker "$UNITED_CARS_USER"
    
    # Enable and start Docker
    systemctl enable docker
    systemctl start docker
    
    log_success "Docker installed: $(docker --version)"
}

# Install Docker Compose
install_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        log_info "Docker Compose already installed: $(docker-compose --version)"
        return
    fi
    
    log_info "Installing Docker Compose..."
    
    # Download and install Docker Compose
    curl -L "https://github.com/docker/compose/releases/download/$DOCKER_COMPOSE_VERSION/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Create symlink for docker compose plugin style
    ln -sf /usr/local/bin/docker-compose /usr/local/bin/docker-compose
    
    log_success "Docker Compose installed: $(docker-compose --version)"
}

# Configure firewall
configure_firewall() {
    log_info "Configuring UFW firewall..."
    
    # Reset UFW to defaults
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (be careful not to lock yourself out!)
    ufw allow ssh
    
    # Allow HTTP and HTTPS for web traffic
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Enable UFW
    ufw --force enable
    
    log_success "Firewall configured (SSH, HTTP, HTTPS allowed)"
}

# Configure Fail2Ban
configure_fail2ban() {
    log_info "Configuring Fail2Ban..."
    
    # Create custom jail configuration
    cat > "$FAIL2BAN_CONFIG_DIR/jail.local" << 'EOF'
[DEFAULT]
# Ban time: 24 hours
bantime = 86400
# Find time: 10 minutes  
findtime = 600
# Max retries before ban
maxretry = 3
# Email notifications (optional)
# destemail = admin@your-domain.com

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/united-cars/logs/*.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/united-cars/logs/*.log
maxretry = 3
EOF

    # Create custom filters for nginx/caddy
    cat > "$FAIL2BAN_CONFIG_DIR/filter.d/nginx-http-auth.conf" << 'EOF'
[Definition]
failregex = ^\s*<HOST>\s.*"(GET|POST).*" 401
ignoreregex =
EOF

    cat > "$FAIL2BAN_CONFIG_DIR/filter.d/nginx-limit-req.conf" << 'EOF'
[Definition]
failregex = ^\s*<HOST>\s.*"(GET|POST).*" 429
ignoreregex =
EOF

    # Enable and start Fail2Ban
    systemctl enable fail2ban
    systemctl restart fail2ban
    
    log_success "Fail2Ban configured and started"
}

# Setup log rotation
setup_logrotate() {
    log_info "Setting up log rotation..."
    
    cat > /etc/logrotate.d/united-cars << 'EOF'
/var/united-cars/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    su united-cars united-cars
}
EOF

    log_success "Log rotation configured"
}

# Setup backup cron job
setup_backup_cron() {
    log_info "Setting up backup cron job..."
    
    # Create backup script
    cat > /usr/local/bin/united-cars-backup << 'EOF'
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/var/united-cars/backups"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$BACKUP_DIR/backup_$DATE.log"

echo "Starting backup at $(date)" >> "$LOG_FILE"

cd /home/united-cars/united-cars
if [ -f "deploy/scripts/backup-db.sh" ]; then
    ./deploy/scripts/backup-db.sh >> "$LOG_FILE" 2>&1
else
    echo "Backup script not found" >> "$LOG_FILE"
fi

echo "Backup completed at $(date)" >> "$LOG_FILE"
EOF

    chmod +x /usr/local/bin/united-cars-backup
    
    # Add to crontab (3 AM daily)
    (crontab -u "$UNITED_CARS_USER" -l 2>/dev/null || echo "") | grep -v "united-cars-backup" | (cat; echo "0 3 * * * /usr/local/bin/united-cars-backup") | crontab -u "$UNITED_CARS_USER" -
    
    log_success "Backup cron job configured (daily at 3 AM)"
}

# Setup system monitoring
setup_monitoring() {
    log_info "Setting up basic system monitoring..."
    
    # Install and configure htop
    if ! command -v htop &> /dev/null; then
        apt-get install -yq htop
    fi
    
    # Create monitoring script
    cat > /usr/local/bin/united-cars-status << 'EOF'
#!/bin/bash
echo "United Cars System Status - $(date)"
echo "=================================="
echo
echo "System Info:"
echo "  Uptime: $(uptime -p)"
echo "  Load: $(uptime | awk -F'load average:' '{ print $2 }')"
echo "  Memory: $(free -h | grep 'Mem:' | awk '{print $3 "/" $2}')"
echo "  Disk: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')"
echo
echo "Docker Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "  Docker not running or no containers"
echo
echo "Recent Logs (last 10 lines):"
tail -10 /var/united-cars/logs/access.log 2>/dev/null || echo "  No access logs found"
EOF

    chmod +x /usr/local/bin/united-cars-status
    
    log_success "Monitoring scripts installed (run: united-cars-status)"
}

# Setup SSH keys (optional)
setup_ssh_keys() {
    log_info "SSH key setup..."
    
    # Check if we should setup SSH keys
    if [[ -n "${SSH_PUBLIC_KEY:-}" ]]; then
        log_info "Setting up SSH public key..."
        sudo -u "$UNITED_CARS_USER" mkdir -p "/home/$UNITED_CARS_USER/.ssh"
        echo "$SSH_PUBLIC_KEY" | sudo -u "$UNITED_CARS_USER" tee "/home/$UNITED_CARS_USER/.ssh/authorized_keys"
        chmod 700 "/home/$UNITED_CARS_USER/.ssh"
        chmod 600 "/home/$UNITED_CARS_USER/.ssh/authorized_keys"
        log_success "SSH public key configured"
    else
        log_warning "No SSH_PUBLIC_KEY environment variable set"
        log_info "To add your SSH key later, run:"
        log_info "  sudo -u $UNITED_CARS_USER ssh-import-id gh:yourusername"
        log_info "  or manually add to /home/$UNITED_CARS_USER/.ssh/authorized_keys"
    fi
}

# Final security hardening
security_hardening() {
    log_info "Applying security hardening..."
    
    # Secure shared memory
    echo "tmpfs /run/shm tmpfs defaults,noexec,nosuid 0 0" >> /etc/fstab
    
    # Disable unused network protocols
    cat >> /etc/modprobe.d/blacklist-rare-network.conf << 'EOF'
# Disable rare network protocols
install dccp /bin/true
install sctp /bin/true
install rds /bin/true
install tipc /bin/true
EOF

    # Set kernel parameters for security
    cat >> /etc/sysctl.d/99-united-cars-security.conf << 'EOF'
# United Cars Security Settings
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1
net.ipv4.tcp_syncookies = 1
kernel.dmesg_restrict = 1
EOF

    sysctl -p /etc/sysctl.d/99-united-cars-security.conf
    
    log_success "Security hardening applied"
}

# Print completion message
print_completion() {
    log_success "Host bootstrap completed successfully!"
    echo
    echo "=================================="
    echo "Next Steps:"
    echo "=================================="
    echo
    echo "1. Login as the united-cars user:"
    echo "   sudo su - $UNITED_CARS_USER"
    echo
    echo "2. Clone the United Cars repository:"
    echo "   git clone https://github.com/your-org/united-cars.git"
    echo "   cd united-cars"
    echo
    echo "3. Configure environment:"
    echo "   cp deploy/compose/env/.staging.example deploy/compose/env/.staging"
    echo "   # OR for production:"
    echo "   cp deploy/compose/env/.prod.example deploy/compose/env/.prod"
    echo "   # Edit the file with your actual values"
    echo
    echo "4. Deploy the application:"
    echo "   ./deploy/scripts/deploy.sh staging"
    echo "   # OR for production:"
    echo "   ./deploy/scripts/deploy.sh prod"
    echo
    echo "5. Verify deployment:"
    echo "   curl -k https://your-domain.com/api/health"
    echo
    echo "=================================="
    echo "Important Security Notes:"
    echo "=================================="
    echo "- Configure your DNS A record to point to this server"
    echo "- Update all passwords in the environment file"
    echo "- Consider setting up SSH key-only authentication"
    echo "- Monitor logs regularly: tail -f /var/united-cars/logs/*.log"
    echo "- Run system status: united-cars-status"
    echo
}

# Main execution
main() {
    log_info "Starting United Cars host bootstrap..."
    
    check_root
    detect_os
    update_system
    create_user
    install_docker
    install_docker_compose
    configure_firewall
    configure_fail2ban
    setup_logrotate
    setup_backup_cron
    setup_monitoring
    setup_ssh_keys
    security_hardening
    print_completion
}

# Run main function
main "$@"