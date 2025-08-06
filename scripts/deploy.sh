#!/bin/bash

# ===========================================
# TUTORHUB DEPLOYMENT SCRIPT
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
VERSION=${2:-$(git rev-parse HEAD)}
PROJECT_NAME="tutorhub"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo -e "${RED}❌ Invalid environment. Use 'staging' or 'production'${NC}"
    exit 1
fi

# Log functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository"
        exit 1
    fi
    
    # Check for uncommitted changes
    if [[ $(git status --porcelain) ]]; then
        log_warning "You have uncommitted changes"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Check required tools
    for tool in node npm git curl; do
        if ! command -v $tool &> /dev/null; then
            log_error "$tool is not installed"
            exit 1
        fi
    done
    
    log_success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    npm ci --production=false
    log_success "Dependencies installed"
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    # Run linting
    if npm run lint; then
        log_success "Linting passed"
    else
        log_error "Linting failed"
        exit 1
    fi
    
    # Run type checking
    if npx tsc --noEmit; then
        log_success "Type checking passed"
    else
        log_error "Type checking failed"
        exit 1
    fi
    
    # Run tests
    if npm run test:all; then
        log_success "Tests passed"
    else
        log_error "Tests failed"
        exit 1
    fi
}

# Build application
build_application() {
    log_info "Building application for $ENVIRONMENT..."
    
    # Set environment variables based on target environment
    if [[ "$ENVIRONMENT" == "production" ]]; then
        export NODE_ENV=production
        export REACT_APP_ENVIRONMENT=production
        export GENERATE_SOURCEMAP=false
    else
        export NODE_ENV=staging
        export REACT_APP_ENVIRONMENT=staging
        export GENERATE_SOURCEMAP=true
    fi
    
    # Build the application
    if npm run build; then
        log_success "Build completed successfully"
    else
        log_error "Build failed"
        exit 1
    fi
}

# Deploy to Cloudflare Pages
deploy_to_cloudflare() {
    log_info "Deploying to Cloudflare Pages ($ENVIRONMENT)..."
    
    # Determine project name based on environment
    if [[ "$ENVIRONMENT" == "production" ]]; then
        CF_PROJECT_NAME="$PROJECT_NAME"
    else
        CF_PROJECT_NAME="$PROJECT_NAME-staging"
    fi
    
    # Deploy using Wrangler (Cloudflare CLI)
    if command -v wrangler &> /dev/null; then
        if wrangler pages publish build --project-name="$CF_PROJECT_NAME"; then
            log_success "Deployed to Cloudflare Pages"
        else
            log_error "Cloudflare Pages deployment failed"
            exit 1
        fi
    else
        log_warning "Wrangler CLI not found, skipping Cloudflare deployment"
        log_info "You can deploy manually by uploading the build/ directory"
    fi
}

# Run health checks
run_health_checks() {
    local url
    if [[ "$ENVIRONMENT" == "production" ]]; then
        url="https://tutorhub.co.za"
    else
        url="https://staging.tutorhub.co.za"
    fi
    
    log_info "Running health checks on $url..."
    
    # Wait for deployment to be available
    sleep 30
    
    # Check if site is accessible
    if curl -f -s --max-time 30 "$url" > /dev/null; then
        log_success "Site is accessible"
    else
        log_error "Site health check failed"
        exit 1
    fi
    
    # Check specific endpoints
    local endpoints=("/health" "/api/health")
    for endpoint in "${endpoints[@]}"; do
        if curl -f -s --max-time 10 "$url$endpoint" > /dev/null; then
            log_success "Endpoint $endpoint is healthy"
        else
            log_warning "Endpoint $endpoint health check failed (may not exist yet)"
        fi
    done
}

# Send deployment notification
send_notification() {
    log_info "Sending deployment notification..."
    
    local webhook_url=""
    if [[ "$ENVIRONMENT" == "production" ]]; then
        webhook_url="$PROD_WEBHOOK_URL"
    else
        webhook_url="$STAGING_WEBHOOK_URL"
    fi
    
    if [[ -n "$webhook_url" ]]; then
        local payload="{
            \"text\": \"🚀 TutorHub deployed to $ENVIRONMENT\",
            \"attachments\": [{
                \"color\": \"good\",
                \"fields\": [
                    {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                    {\"title\": \"Version\", \"value\": \"$VERSION\", \"short\": true},
                    {\"title\": \"Deployed by\", \"value\": \"$(git config user.name)\", \"short\": true},
                    {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": true}
                ]
            }]
        }"
        
        if curl -X POST -H 'Content-type: application/json' \
            --data "$payload" "$webhook_url" > /dev/null 2>&1; then
            log_success "Notification sent"
        else
            log_warning "Failed to send notification"
        fi
    else
        log_info "No webhook URL configured, skipping notification"
    fi
}

# Rollback function
rollback() {
    log_warning "Rolling back deployment..."
    # Implementation would depend on your deployment strategy
    # For Cloudflare Pages, you might use a previous deployment
    log_info "Rollback functionality would be implemented here"
}

# Main deployment function
main() {
    log_info "🚀 Starting TutorHub deployment to $ENVIRONMENT"
    log_info "Version: $VERSION"
    echo
    
    # Trap errors and provide rollback option
    trap 'log_error "Deployment failed!"; read -p "Do you want to rollback? (y/N): " -n 1 -r; echo; [[ $REPLY =~ ^[Yy]$ ]] && rollback' ERR
    
    # Deployment steps
    check_prerequisites
    install_dependencies
    run_tests
    build_application
    deploy_to_cloudflare
    run_health_checks
    send_notification
    
    echo
    log_success "🎉 Deployment completed successfully!"
    log_info "Environment: $ENVIRONMENT"
    log_info "Version: $VERSION"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_info "URL: https://tutorhub.co.za"
    else
        log_info "URL: https://staging.tutorhub.co.za"
    fi
}

# Help function
show_help() {
    echo "TutorHub Deployment Script"
    echo
    echo "Usage: $0 [environment] [version]"
    echo
    echo "Arguments:"
    echo "  environment    Target environment (staging|production) [default: staging]"
    echo "  version        Version to deploy [default: current git commit]"
    echo
    echo "Examples:"
    echo "  $0 staging"
    echo "  $0 production v1.2.3"
    echo "  $0 production \$(git rev-parse HEAD)"
    echo
    echo "Environment Variables:"
    echo "  PROD_WEBHOOK_URL      Webhook URL for production notifications"
    echo "  STAGING_WEBHOOK_URL   Webhook URL for staging notifications"
    echo "  CLOUDFLARE_API_TOKEN  Cloudflare API token for deployment"
}

# Handle arguments
case "$1" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main
        ;;
esac