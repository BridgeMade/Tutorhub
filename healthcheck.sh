#!/bin/sh

# ===========================================
# HEALTH CHECK SCRIPT FOR TUTORHUB
# ===========================================

set -e

# Configuration
HOST=${HEALTH_CHECK_HOST:-localhost}
PORT=${HEALTH_CHECK_PORT:-8080}
TIMEOUT=${HEALTH_CHECK_TIMEOUT:-10}
MAX_RETRIES=${HEALTH_CHECK_MAX_RETRIES:-3}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - HEALTHCHECK: $1"
}

# Check if curl is available
if ! command -v curl >/dev/null 2>&1; then
    log "${RED}ERROR: curl is not installed${NC}"
    exit 1
fi

# Health check function
check_health() {
    local retry_count=0
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        log "Health check attempt $((retry_count + 1))/$MAX_RETRIES"
        
        # Check main application
        if curl -f -s --max-time $TIMEOUT "http://$HOST:$PORT/health" >/dev/null 2>&1; then
            log "${GREEN}✓ Application health check passed${NC}"
            
            # Check if main page loads
            if curl -f -s --max-time $TIMEOUT "http://$HOST:$PORT/" >/dev/null 2>&1; then
                log "${GREEN}✓ Main page accessible${NC}"
                
                # Check static assets
                if curl -f -s --max-time $TIMEOUT -I "http://$HOST:$PORT/static/css/" >/dev/null 2>&1 || \
                   curl -f -s --max-time $TIMEOUT -I "http://$HOST:$PORT/manifest.json" >/dev/null 2>&1; then
                    log "${GREEN}✓ Static assets accessible${NC}"
                    log "${GREEN}All health checks passed${NC}"
                    exit 0
                else
                    log "${YELLOW}⚠ Static assets check failed (non-critical)${NC}"
                    log "${GREEN}Core health checks passed${NC}"
                    exit 0
                fi
            else
                log "${RED}✗ Main page not accessible${NC}"
            fi
        else
            log "${RED}✗ Application health check failed${NC}"
        fi
        
        retry_count=$((retry_count + 1))
        
        if [ $retry_count -lt $MAX_RETRIES ]; then
            log "Retrying in 2 seconds..."
            sleep 2
        fi
    done
    
    log "${RED}Health check failed after $MAX_RETRIES attempts${NC}"
    exit 1
}

# Additional checks for production
production_checks() {
    if [ "$NODE_ENV" = "production" ]; then
        log "Running production-specific health checks..."
        
        # Check memory usage
        MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
        if [ "$MEMORY_USAGE" -gt 95 ]; then
            log "${RED}⚠ High memory usage: ${MEMORY_USAGE}%${NC}"
        else
            log "${GREEN}✓ Memory usage OK: ${MEMORY_USAGE}%${NC}"
        fi
        
        # Check disk space
        DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
        if [ "$DISK_USAGE" -gt 90 ]; then
            log "${RED}⚠ High disk usage: ${DISK_USAGE}%${NC}"
        else
            log "${GREEN}✓ Disk usage OK: ${DISK_USAGE}%${NC}"
        fi
    fi
}

# Main execution
log "Starting TutorHub health check..."
log "Target: http://$HOST:$PORT"
log "Timeout: ${TIMEOUT}s, Max retries: $MAX_RETRIES"

check_health
production_checks

log "${GREEN}Health check completed successfully${NC}"