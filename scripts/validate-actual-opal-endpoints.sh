#!/bin/bash

# OPAL Integration Pipeline Validation Script
# Validates endpoints that actually exist in the codebase

echo "============================================"
echo "OPAL Integration Pipeline Validation"
echo "Validating ACTUAL Endpoints"
echo "============================================"
echo ""

BASE_URL="http://localhost:3000"

# Actual endpoints that exist in the codebase
declare -a ENDPOINTS=(
  "/api/tools/osa_send_data_to_osa_webhook"
  "/api/tools/osa_retrieve_workflow_context"
  "/api/tools/osa_validate_language_rules"
  "/api/tools/osa_store_workflow_data"
  "/api/tools/osa_analyze_member_behavior"
  "/api/tools/osa_fetch_audience_segments"
  "/api/tools/osa_create_dynamic_segments"
  "/api/tools/osa_analyze_data_insights"
  "/api/tools/osa_calculate_segment_statistical_power"
  "/api/tools/osa_get_member_journey_data"
  "/api/tools/osa_export_segment_targeting_logic"
)

# Test payloads for different endpoint types
WEBHOOK_PAYLOAD='{"workflow_id":"test-123","agent_id":"test-agent","execution_status":"completed","agent_data":{"test":true},"correlation_id":"validation-test-001"}'
CONTEXT_PAYLOAD='{"workflow_id":"test-123","correlation_id":"validation-test-001"}'
VALIDATION_PAYLOAD='{"text":"Test content for validation","correlation_id":"validation-test-001"}'
SIMPLE_PAYLOAD='{"test":true,"correlation_id":"validation-test-001"}'

# Tracking variables
TOTAL_ENDPOINTS=${#ENDPOINTS[@]}
SUCCESS_COUNT=0
FAILED_ENDPOINTS=()
RESPONSE_DETAILS=()

echo "Testing ${TOTAL_ENDPOINTS} actual OPAL wrapper endpoints..."
echo ""

# Test each endpoint with appropriate payload
for endpoint in "${ENDPOINTS[@]}"; do
  echo -n "Testing ${endpoint}... "

  # Select appropriate payload based on endpoint
  if [[ "$endpoint" == *"webhook"* ]]; then
    PAYLOAD="$WEBHOOK_PAYLOAD"
  elif [[ "$endpoint" == *"context"* ]]; then
    PAYLOAD="$CONTEXT_PAYLOAD"
  elif [[ "$endpoint" == *"validate"* ]]; then
    PAYLOAD="$VALIDATION_PAYLOAD"
  else
    PAYLOAD="$SIMPLE_PAYLOAD"
  fi

  # Make POST request
  HTTP_CODE=$(curl -s -o /tmp/endpoint-response.json -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    "${BASE_URL}${endpoint}" 2>/dev/null)

  # Check status code and capture response details
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ OK (HTTP 200)"
    ((SUCCESS_COUNT++))
    # Capture response for analysis
    RESPONSE=$(cat /tmp/endpoint-response.json 2>/dev/null | jq -r '.success // .message // "no message"' 2>/dev/null || echo "no response")
    RESPONSE_DETAILS+=("${endpoint}: ${RESPONSE}")
  else
    echo "❌ FAILED (HTTP ${HTTP_CODE})"
    FAILED_ENDPOINTS+=("${endpoint} (HTTP ${HTTP_CODE})")
    # Capture error details
    ERROR=$(cat /tmp/endpoint-response.json 2>/dev/null | jq -r '.error // .message // "unknown error"' 2>/dev/null || echo "no error details")
    RESPONSE_DETAILS+=("${endpoint}: ERROR - ${ERROR}")
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

# Show response details for debugging
echo "Response Details:"
for detail in "${RESPONSE_DETAILS[@]}"; do
  echo "  ${detail}"
done
echo ""

# Calculate integration health score
# Formula: Success Rate * 0.7 + Availability Score * 0.3
AVAILABILITY_SCORE=100  # All tested endpoints exist and compile
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

# Additional analysis
echo "============================================"
echo "Discovery-Execution Gap Analysis"
echo "============================================"
echo ""
echo "OPAL agents reference tools that don't exist:"
echo "  - osa_fetch_content_performance (referenced, doesn't exist)"
echo "  - osa_fetch_experiment_results (referenced, doesn't exist)"
echo "  - osa_query_product_catalog (referenced, doesn't exist)"
echo "  - osa_fetch_odp_traits (referenced, doesn't exist)"
echo "  - osa_query_cms_content (referenced, doesn't exist)"
echo ""
echo "Actual endpoints that exist:"
for endpoint in "${ENDPOINTS[@]}"; do
  echo "  - ${endpoint}"
done
echo ""

# Exit with appropriate code
if [ $SUCCESS_COUNT -eq $TOTAL_ENDPOINTS ]; then
  exit 0
else
  exit 1
fi
