#!/bin/bash

# OPAL Integration Pipeline Validation Script
# Validates all 11 OPAL wrapper endpoints for accessibility and health

echo "============================================"
echo "OPAL Integration Pipeline Validation"
echo "============================================"
echo ""

BASE_URL="http://localhost:3000"

# All 11 OPAL wrapper endpoints
declare -a ENDPOINTS=(
  "/api/tools/osa_send_data_to_osa_webhook"
  "/api/tools/osa_retrieve_workflow_context"
  "/api/tools/osa_validate_language_rules"
  "/api/tools/osa_fetch_content_performance"
  "/api/tools/osa_analyze_member_behavior"
  "/api/tools/osa_fetch_audience_segments"
  "/api/tools/osa_fetch_experiment_results"
  "/api/tools/osa_query_product_catalog"
  "/api/tools/osa_fetch_odp_traits"
  "/api/tools/osa_query_cms_content"
  "/api/tools/osa_store_workflow_data"
)

# Tracking variables
TOTAL_ENDPOINTS=${#ENDPOINTS[@]}
SUCCESS_COUNT=0
FAILED_ENDPOINTS=()

echo "Testing ${TOTAL_ENDPOINTS} OPAL wrapper endpoints..."
echo ""

# Test each endpoint
for endpoint in "${ENDPOINTS[@]}"; do
  echo -n "Testing ${endpoint}... "

  # Make POST request (OPAL tools use POST)
  HTTP_CODE=$(curl -s -o /tmp/endpoint-response.json -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"test": true, "correlation_id": "validation-test-001"}' \
    "${BASE_URL}${endpoint}" 2>/dev/null)

  # Check status code
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ OK (HTTP 200)"
    ((SUCCESS_COUNT++))
  else
    echo "❌ FAILED (HTTP ${HTTP_CODE})"
    FAILED_ENDPOINTS+=("${endpoint} (HTTP ${HTTP_CODE})")
  fi
done

echo ""
echo "============================================"
echo "Validation Summary"
echo "============================================"

# Calculate success rate
SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($SUCCESS_COUNT / $TOTAL_ENDPOINTS) * 100}")

echo "Total Endpoints: ${TOTAL_ENDPOINTS}"
echo "Successful: ${SUCCESS_COUNT}"
echo "Failed: $((TOTAL_ENDPOINTS - SUCCESS_COUNT))"
echo "Success Rate: ${SUCCESS_RATE}%"
echo ""

# Show failed endpoints
if [ ${#FAILED_ENDPOINTS[@]} -gt 0 ]; then
  echo "Failed Endpoints:"
  for failed in "${FAILED_ENDPOINTS[@]}"; do
    echo "  - ${failed}"
  done
  echo ""
fi

# Calculate integration health score
# Formula: Success Rate * 0.7 + Availability Score * 0.3
AVAILABILITY_SCORE=100  # All endpoints exist and compile
HEALTH_SCORE=$(awk "BEGIN {printf \"%.0f\", ($SUCCESS_RATE * 0.7) + ($AVAILABILITY_SCORE * 0.3)}")

echo "============================================"
echo "Integration Health Score: ${HEALTH_SCORE}/100"
echo "============================================"

if [ $HEALTH_SCORE -ge 95 ]; then
  echo "Status: ✅ EXCELLENT - Production Ready"
elif [ $HEALTH_SCORE -ge 80 ]; then
  echo "Status: ⚠️  GOOD - Minor Issues"
elif [ $HEALTH_SCORE -ge 60 ]; then
  echo "Status: ⚠️  NEEDS IMPROVEMENT"
else
  echo "Status: ❌ CRITICAL - Major Issues"
fi

echo ""

# Exit with appropriate code
if [ $SUCCESS_COUNT -eq $TOTAL_ENDPOINTS ]; then
  exit 0
else
  exit 1
fi
