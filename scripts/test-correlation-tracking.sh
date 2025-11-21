#!/bin/bash

# Correlation ID Tracking Validation Script
# Tests that all OPAL endpoints properly track and return correlation IDs

echo "============================================"
echo "OPAL Correlation ID Tracking Validation"
echo "============================================"
echo ""

BASE_URL="http://localhost:3000"
TEST_CORRELATION_ID="validation-correlation-$(date +%s)"

# Tracking
TOTAL_TESTS=4
SUCCESS_COUNT=0

echo "Test Correlation ID: ${TEST_CORRELATION_ID}"
echo ""

# Test 1: osa_send_data_to_osa_webhook
echo "Test 1: osa_send_data_to_osa_webhook"
RESPONSE=$(curl -s -i -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "test_agent",
    "execution_results": {"test": true},
    "workflow_id": "test-workflow",
    "metadata": {"execution_status": "completed"},
    "correlation_id": "'${TEST_CORRELATION_ID}'"
  }' \
  "${BASE_URL}/api/tools/osa_send_data_to_osa_webhook" 2>/dev/null)

# Check for correlation ID in headers
if echo "$RESPONSE" | grep -q "X-Correlation-ID"; then
  HEADER_CORRELATION=$(echo "$RESPONSE" | grep "X-Correlation-ID" | cut -d: -f2 | tr -d ' \r')
  echo "  ✅ Correlation ID in headers: ${HEADER_CORRELATION}"
  ((SUCCESS_COUNT++))
else
  echo "  ❌ Missing correlation ID in headers"
fi

# Check for correlation ID in JSON response body
BODY=$(echo "$RESPONSE" | tail -n 1)
if echo "$BODY" | grep -q "correlation_id"; then
  BODY_CORRELATION=$(echo "$BODY" | jq -r '._metadata.correlation_id // .correlation_id' 2>/dev/null)
  echo "  ✅ Correlation ID in response: ${BODY_CORRELATION}"
else
  echo "  ⚠️  No correlation ID in response body"
fi
echo ""

# Test 2: osa_retrieve_workflow_context
echo "Test 2: osa_retrieve_workflow_context"
RESPONSE=$(curl -s -i -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "test-workflow",
    "requesting_agent": "content_review",
    "correlation_id": "'${TEST_CORRELATION_ID}'"
  }' \
  "${BASE_URL}/api/tools/osa_retrieve_workflow_context" 2>/dev/null)

if echo "$RESPONSE" | grep -q "X-Correlation-ID"; then
  HEADER_CORRELATION=$(echo "$RESPONSE" | grep "X-Correlation-ID" | cut -d: -f2 | tr -d ' \r')
  echo "  ✅ Correlation ID in headers: ${HEADER_CORRELATION}"
  ((SUCCESS_COUNT++))
else
  echo "  ❌ Missing correlation ID in headers"
fi
echo ""

# Test 3: osa_validate_language_rules
echo "Test 3: osa_validate_language_rules"
RESPONSE=$(curl -s -i -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Test content",
    "correlation_id": "'${TEST_CORRELATION_ID}'"
  }' \
  "${BASE_URL}/api/tools/osa_validate_language_rules" 2>/dev/null)

if echo "$RESPONSE" | grep -q "X-Correlation-ID"; then
  HEADER_CORRELATION=$(echo "$RESPONSE" | grep "X-Correlation-ID" | cut -d: -f2 | tr -d ' \r')
  echo "  ✅ Correlation ID in headers: ${HEADER_CORRELATION}"
  ((SUCCESS_COUNT++))
else
  echo "  ❌ Missing correlation ID in headers"
fi
echo ""

# Test 4: osa_store_workflow_data
echo "Test 4: osa_store_workflow_data"
RESPONSE=$(curl -s -i -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "content_review",
    "agent_results": {"test": true},
    "workflow_id": "test-workflow",
    "correlation_id": "'${TEST_CORRELATION_ID}'"
  }' \
  "${BASE_URL}/api/tools/osa_store_workflow_data" 2>/dev/null)

if echo "$RESPONSE" | grep -q "X-Correlation-ID"; then
  HEADER_CORRELATION=$(echo "$RESPONSE" | grep "X-Correlation-ID" | cut -d: -f2 | tr -d ' \r')
  echo "  ✅ Correlation ID in headers: ${HEADER_CORRELATION}"
  ((SUCCESS_COUNT++))
else
  echo "  ❌ Missing correlation ID in headers"
fi
echo ""

echo "============================================"
echo "Correlation Tracking Results"
echo "============================================"
echo "Tests Passed: ${SUCCESS_COUNT}/${TOTAL_TESTS}"
echo ""

if [ $SUCCESS_COUNT -eq $TOTAL_TESTS ]; then
  echo "Status: ✅ All endpoints support correlation ID tracking"
  exit 0
else
  echo "Status: ⚠️  Some endpoints missing correlation tracking"
  exit 1
fi
