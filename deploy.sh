#!/bin/bash

# 10bis Automation Deployment Script
# This script helps deploy the automation system on a Linux server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="10bis-automation"
NODE_MIN_VERSION="14"

# Functions
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
    if [[ $EUID -eq 0 ]]; then
        log_warning "Running as root. Consider using a regular user for better security."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Check system requirements
check_requirements() {
    log_info "Checking system requirements..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js version $NODE_MIN_VERSION or higher."
        log_info "Installation commands:"
        log_info "Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs"
        log_info "CentOS/RHEL: curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash - && sudo yum install -y nodejs"
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $NODE_VERSION -lt $NODE_MIN_VERSION ]]; then
        log_error "Node.js version $NODE_VERSION is too old. Please upgrade to version $NODE_MIN_VERSION or higher."
        exit 1
    fi
    
    log_success "Node.js version $(node --version) is compatible"
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    log_success "npm version $(npm --version) is available"
    
    # Check if cron is installed and running
    if ! command -v crontab &> /dev/null; then
        log_error "cron is not installed. Please install cron service."
        exit 1
    fi
    
    # Check if cron service is running
    if ! systemctl is-active --quiet cron 2>/dev/null && ! systemctl is-active --quiet crond 2>/dev/null; then
        log_warning "Cron service may not be running. Attempting to start..."
        if systemctl start cron 2>/dev/null || systemctl start crond 2>/dev/null; then
            log_success "Cron service started"
        else
            log_error "Failed to start cron service. Please start it manually."
        fi
    else
        log_success "Cron service is running"
    fi
}

# Install dependencies
install_dependencies() {
    log_info "Installing Node.js dependencies..."
    
    if [[ ! -f "package.json" ]]; then
        log_error "package.json not found. Make sure you're in the project directory."
        exit 1
    fi
    
    npm install
    log_success "Dependencies installed successfully"
}

# Set up file permissions
setup_permissions() {
    log_info "Setting up file permissions..."
    
    # Make scripts executable
    chmod +x refresh-token.js load-credit.js test.js 2>/dev/null || true
    
    # Secure config file
    if [[ -f "config.json" ]]; then
        chmod 600 config.json
        log_success "Config file secured (600 permissions)"
    fi
    
    # Create logs directory with proper permissions
    mkdir -p logs
    chmod 755 logs
    
    log_success "File permissions configured"
}

# Test the installation
test_installation() {
    log_info "Testing the installation..."
    
    # Run the test suite
    if node test.js; then
        log_success "All tests passed!"
    else
        log_error "Some tests failed. Please check the logs and fix any issues."
        exit 1
    fi
}

# Configure cron jobs
setup_cron() {
    log_info "Setting up cron jobs..."
    
    # Get current directory
    CURRENT_DIR=$(pwd)
    
    # Get Node.js path
    NODE_PATH=$(which node)
    
    log_info "Project directory: $CURRENT_DIR"
    log_info "Node.js path: $NODE_PATH"
    
    # Create temporary crontab file
    TEMP_CRON=$(mktemp)
    
    # Get existing crontab (if any)
    crontab -l 2>/dev/null > "$TEMP_CRON" || true
    
    # Check if our cron jobs already exist
    if grep -q "10bis-automation" "$TEMP_CRON" 2>/dev/null; then
        log_warning "10bis automation cron jobs already exist. Skipping cron setup."
        log_info "To manually update cron jobs, edit with: crontab -e"
        rm "$TEMP_CRON"
        return
    fi
    
    # Add our cron jobs
    cat >> "$TEMP_CRON" << EOF

# 10bis Automation - Token Refresh (every 10 minutes)
*/10 * * * * $NODE_PATH $CURRENT_DIR/refresh-token.js >> $CURRENT_DIR/logs/cron.log 2>&1

# 10bis Automation - Credit Loading (daily at 10 AM, excluding Friday and Saturday)
0 10 * * 0,1,2,3,4 $NODE_PATH $CURRENT_DIR/load-credit.js >> $CURRENT_DIR/logs/cron.log 2>&1
EOF
    
    # Install the new crontab
    if crontab "$TEMP_CRON"; then
        log_success "Cron jobs installed successfully"
        log_info "Token refresh: Every 10 minutes"
        log_info "Credit loading: Daily at 10 AM (excluding weekends)"
    else
        log_error "Failed to install cron jobs"
        rm "$TEMP_CRON"
        exit 1
    fi
    
    rm "$TEMP_CRON"
    
    # Show current crontab
    log_info "Current crontab:"
    crontab -l | grep -A 5 -B 1 "10bis"
}

# Configure the system
configure_system() {
    log_info "Configuring the system..."
    
    # Check if config.json has been customized
    if grep -q '""' config.json; then
        log_warning "config.json contains empty values. Please update it with your 10bis credentials:"
        log_info "- AccessToken: Your current access token"
        log_info "- RefreshToken: Your refresh token"
        log_info "- Amount: Credit amount to load (e.g., '100')"
        log_info "- MoneycardId: Your money card ID"
        log_info ""
        log_info "Edit the file: nano config.json"
        
        read -p "Have you configured config.json? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_warning "Please configure config.json before continuing."
            return 1
        fi
    fi
    
    log_success "System configuration completed"
}

# Show deployment summary
show_summary() {
    log_success "=== Deployment Summary ==="
    log_info "Project installed in: $(pwd)"
    log_info "Node.js version: $(node --version)"
    log_info "Dependencies: Installed"
    log_info "Permissions: Configured"
    log_info "Tests: Passed"
    log_info "Cron jobs: Configured"
    log_info ""
    log_info "=== Next Steps ==="
    log_info "1. Update config.json with your 10bis credentials"
    log_info "2. Test manually: npm run refresh-token"
    log_info "3. Test credit loading: node load-credit.js --test"
    log_info "4. Monitor logs: tail -f logs/refresh.log"
    log_info ""
    log_info "=== Monitoring ==="
    log_info "View cron jobs: crontab -l"
    log_info "Check logs: ls -la logs/"
    log_info "Test system: node test.js"
    log_info ""
    log_success "Deployment completed successfully!"
}

# Main deployment function
main() {
    log_info "Starting 10bis Automation deployment..."
    
    check_root
    check_requirements
    install_dependencies
    setup_permissions
    test_installation
    
    if configure_system; then
        setup_cron
        show_summary
    else
        log_warning "Deployment completed but configuration is incomplete."
        log_info "Please update config.json and run: ./deploy.sh --configure-only"
    fi
}

# Handle command line arguments
case "${1:-}" in
    --configure-only)
        configure_system && setup_cron && show_summary
        ;;
    --test-only)
        test_installation
        ;;
    --cron-only)
        setup_cron
        ;;
    --help)
        echo "Usage: $0 [option]"
        echo "Options:"
        echo "  --configure-only  Only configure and setup cron jobs"
        echo "  --test-only       Only run tests"
        echo "  --cron-only       Only setup cron jobs"
        echo "  --help            Show this help message"
        ;;
    *)
        main
        ;;
esac