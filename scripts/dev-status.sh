#!/bin/bash

# OPAL/OSA Development Status Checker
# Provides a quick overview of the local development environment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 OPAL/OSA Development Environment Status${NC}"
echo "=============================================="
echo ""

# Check if server is running
echo -e "${BLUE}📡 Server Status${NC}"
if curl -s http://localhost:3000/api/opal/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}✅ Development server is running at http://localhost:3000${NC}"

    # Get health status
    HEALTH_STATUS=$(curl -s http://localhost:3000/api/opal/health | jq -r .overall_status 2>/dev/null || echo "unknown")
    case $HEALTH_STATUS in
        "green")
            echo -e "  ${GREEN}✅ Health Status: GREEN - All systems operational${NC}"
            ;;
        "yellow")
            echo -e "  ${YELLOW}⚠️  Health Status: YELLOW - Configuration valid, awaiting events${NC}"
            ;;
        "red")
            echo -e "  ${RED}❌ Health Status: RED - Configuration issues detected${NC}"
            ;;
        *)
            echo -e "  ${YELLOW}❓ Health Status: Unknown${NC}"
            ;;
    esac
else
    echo -e "  ${RED}❌ Development server is not running${NC}"
    echo -e "  ${BLUE}💡 Run: npm run dev${NC}"
    echo ""
    exit 1
fi

echo ""

# Check configuration
echo -e "${BLUE}⚙️  Configuration Status${NC}"
if curl -s http://localhost:3000/api/debug/dev-info > /dev/null 2>&1; then
    DEV_INFO=$(curl -s http://localhost:3000/api/debug/dev-info)

    CONFIG_VALID=$(echo "$DEV_INFO" | jq -r .development_info.development_status.configuration_valid 2>/dev/null || echo "false")
    FILE_STORAGE_READY=$(echo "$DEV_INFO" | jq -r .development_info.development_status.file_storage_ready 2>/dev/null || echo "false")
    TESTING_SETUP=$(echo "$DEV_INFO" | jq -r .development_info.development_status.testing_setup 2>/dev/null || echo "false")

    if [ "$CONFIG_VALID" = "true" ]; then
        echo -e "  ${GREEN}✅ OPAL configuration is valid${NC}"
    else
        echo -e "  ${RED}❌ OPAL configuration has issues${NC}"
    fi

    if [ "$FILE_STORAGE_READY" = "true" ]; then
        echo -e "  ${GREEN}✅ File-based storage is ready${NC}"
    else
        echo -e "  ${YELLOW}⚠️  File-based storage needs setup${NC}"
    fi

    if [ "$TESTING_SETUP" = "true" ]; then
        echo -e "  ${GREEN}✅ Testing environment is configured${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Testing environment needs setup${NC}"
    fi
else
    echo -e "  ${YELLOW}⚠️  Could not retrieve configuration status${NC}"
fi

echo ""

# Check key endpoints
echo -e "${BLUE}🔗 Key Endpoints${NC}"
ENDPOINTS=(
    "health:/api/opal/health"
    "discovery:/api/opal/discovery"
    "webhook:/api/webhooks/opal-workflow"
    "debug:/api/debug/dev-info"
)

for endpoint in "${ENDPOINTS[@]}"; do
    NAME="${endpoint%%:*}"
    PATH="${endpoint##*:}"

    if curl -s "http://localhost:3000$PATH" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅ $NAME: http://localhost:3000$PATH${NC}"
    else
        echo -e "  ${RED}❌ $NAME: http://localhost:3000$PATH${NC}"
    fi
done

echo ""

# Environment info
echo -e "${BLUE}🌍 Environment Information${NC}"
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"
echo "  Working Directory: $(pwd | sed "s|$HOME|~|")"
echo "  Environment: ${NODE_ENV:-development}"

echo ""

# Quick commands
echo -e "${BLUE}🛠️  Quick Commands${NC}"
echo "  Start dev server: npm run dev"
echo "  Run tests: npm run test:unit"
echo "  Check health: curl http://localhost:3000/api/opal/health | jq ."
echo "  Debug info: curl http://localhost:3000/api/debug/dev-info | jq ."
echo "  Setup environment: ./scripts/setup-local-dev.sh"

echo ""

# File storage check
echo -e "${BLUE}📁 Data Storage${NC}"
if [ -d "data/local" ]; then
    LOCAL_FILES=$(ls data/local 2>/dev/null | wc -l | tr -d ' ')
    echo -e "  ${GREEN}✅ Local storage: data/local/ ($LOCAL_FILES files)${NC}"
else
    echo -e "  ${YELLOW}⚠️  Local storage directory not found${NC}"
fi

if [ -d "data/test" ]; then
    TEST_FILES=$(ls data/test 2>/dev/null | wc -l | tr -d ' ')
    echo -e "  ${GREEN}✅ Test storage: data/test/ ($TEST_FILES files)${NC}"
else
    echo -e "  ${YELLOW}⚠️  Test storage directory not found${NC}"
fi

echo ""

# Final status
if [ "$CONFIG_VALID" = "true" ] && curl -s http://localhost:3000/api/opal/health > /dev/null 2>&1; then
    echo -e "${GREEN}🎉 Development environment is ready for OPAL/OSA development!${NC}"
    echo -e "${BLUE}💡 Visit http://localhost:3000 to get started${NC}"
else
    echo -e "${YELLOW}⚠️  Development environment needs attention${NC}"
    echo -e "${BLUE}💡 Run: ./scripts/setup-local-dev.sh to fix issues${NC}"
fi

echo ""