#!/bin/bash
# quick_test_audience_suggester.sh

echo "=== QUICK AUDIENCE_SUGGESTER VALIDATION ==="
echo "Testing OSA audience_suggester integration..."
echo

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Check if dev server is running
echo -e "${BLUE}1. Checking development server status...${NC}"
if curl -s http://localhost:3000/api/admin/results/status >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Development server is running on localhost:3000${NC}"
else
    echo -e "${RED}❌ Development server is not responding${NC}"
    echo "Please run: npm run dev"
    exit 1
fi

# Test 2: Check OPAL integration health
echo -e "${BLUE}2. Checking OPAL integration health...${NC}"
OPAL_HEALTH=$(curl -s http://localhost:3000/api/admin/results/status | jq -r '.opal_integration.health // "unknown"')
if [ "$OPAL_HEALTH" = "healthy" ]; then
    echo -e "${GREEN}✅ OPAL integration is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  OPAL integration status: $OPAL_HEALTH${NC}"
fi

# Test 3: Check available agents
echo -e "${BLUE}3. Checking available OPAL agents...${NC}"
AGENT_COUNT=$(curl -s http://localhost:3000/api/admin/results/status | jq -r '.opal_integration.available_agents // 0')
echo -e "${GREEN}📊 Available agents: $AGENT_COUNT${NC}"

# Test 4: Test audience_suggester endpoint
echo -e "${BLUE}4. Testing audience_suggester API endpoint...${NC}"
RESPONSE=$(curl -s "http://localhost:3000/api/opal/agent-data?agent=audience_suggester")

if echo "$RESPONSE" | jq -e '.success' >/dev/null 2>&1; then
    echo -e "${GREEN}✅ audience_suggester API endpoint is working${NC}"

    # Extract key metrics
    echo -e "${BLUE}5. Extracting audience_suggester data...${NC}"
    SEGMENTS=$(echo "$RESPONSE" | jq -r '.dataSentToOSA.segments | length // 0')
    HIGH_VALUE_SEGMENTS=$(echo "$RESPONSE" | jq -r '.dataSentToOSA.high_value_segments | length // 0')
    CONVERSION_RATE=$(echo "$RESPONSE" | jq -r '.dataSentToOSA.segment_performance_scores.conversion_rate // "N/A"')
    ENGAGEMENT_RATE=$(echo "$RESPONSE" | jq -r '.dataSentToOSA.segment_performance_scores.engagement_rate // "N/A"')
    NEW_SEGMENTS=$(echo "$RESPONSE" | jq -r '.dataSentToOSA.new_segments_discovered // 0')
    LAST_UPDATE=$(echo "$RESPONSE" | jq -r '.lastDataSent // "unknown"')

    echo -e "${GREEN}📈 Key Metrics:${NC}"
    echo -e "  • Segments: $SEGMENTS"
    echo -e "  • High-value segments: $HIGH_VALUE_SEGMENTS"
    echo -e "  • Conversion rate: $CONVERSION_RATE%"
    echo -e "  • Engagement rate: $ENGAGEMENT_RATE%"
    echo -e "  • New segments discovered: $NEW_SEGMENTS"
    echo -e "  • Last data sent: $LAST_UPDATE"

    # Test 6: Check strategy recommendations
    echo -e "${BLUE}6. Checking strategy recommendations...${NC}"
    RECOMMENDATIONS=$(echo "$RESPONSE" | jq -r '.strategyAssistance.recommendations | length // 0')
    if [ "$RECOMMENDATIONS" -gt 0 ]; then
        echo -e "${GREEN}✅ Found $RECOMMENDATIONS strategy recommendations${NC}"
        echo "$RESPONSE" | jq -r '.strategyAssistance.recommendations[]' | sed 's/^/  • /'
    else
        echo -e "${YELLOW}⚠️  No strategy recommendations found${NC}"
    fi

    # Test 7: Check Optimizely DXP tools
    echo -e "${BLUE}7. Checking Optimizely DXP tools integration...${NC}"
    DXP_TOOLS=$(echo "$RESPONSE" | jq -r '.optimizelyDxpTools | length // 0')
    if [ "$DXP_TOOLS" -gt 0 ]; then
        echo -e "${GREEN}✅ Found $DXP_TOOLS integrated DXP tools${NC}"
        echo "$RESPONSE" | jq -r '.optimizelyDxpTools[]' | sed 's/^/  • /'
    else
        echo -e "${RED}❌ No DXP tools integration found${NC}"
    fi

    # Test 8: Check custom OPAL tools
    echo -e "${BLUE}8. Checking custom OPAL tools...${NC}"
    CUSTOM_TOOLS=$(echo "$RESPONSE" | jq -r '.opalCustomTools | length // 0')
    if [ "$CUSTOM_TOOLS" -gt 0 ]; then
        echo -e "${GREEN}✅ Found $CUSTOM_TOOLS custom OPAL tools${NC}"
        echo "$RESPONSE" | jq -r '.opalCustomTools[] | "  • \(.toolName): \(.description)"'
    else
        echo -e "${YELLOW}⚠️  No custom OPAL tools found${NC}"
    fi

else
    echo -e "${RED}❌ audience_suggester API endpoint failed${NC}"
    echo "Response: $RESPONSE"
    exit 1
fi

echo
echo -e "${BLUE}=== VALIDATION SUMMARY ===${NC}"

# Overall health check
if [ "$OPAL_HEALTH" = "healthy" ] && [ "$SEGMENTS" -gt 0 ] && [ "$RECOMMENDATIONS" -gt 0 ]; then
    echo -e "${GREEN}🎉 audience_suggester integration is FULLY OPERATIONAL${NC}"
    echo -e "${GREEN}✅ All systems are working correctly${NC}"
else
    echo -e "${YELLOW}⚠️  audience_suggester integration has some issues${NC}"
    echo -e "${YELLOW}   Check the warnings above for details${NC}"
fi

echo
echo -e "${BLUE}Quick commands:${NC}"
echo -e "  • Full data: ${YELLOW}curl -s 'http://localhost:3000/api/opal/agent-data?agent=audience_suggester' | jq${NC}"
echo -e "  • System status: ${YELLOW}curl -s 'http://localhost:3000/api/admin/results/status' | jq .opal_integration${NC}"
echo -e "  • Analytics insights: ${YELLOW}curl -s 'http://localhost:3000/api/analytics/insights' | jq${NC}"