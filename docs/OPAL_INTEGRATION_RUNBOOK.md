# OPAL Custom Tools Integration - Operational Runbook

## Overview

This runbook provides comprehensive operational guidance for the OPAL Custom Tools integration with OSA (Optimizely Strategy Assistant). The integration enables OPAL agents to discover OSA tools and execute `send_data_to_osa_enhanced` to POST agent outputs to OSA with HMAC verification, idempotency, and robust error handling.

## Architecture

```
OPAL Agent -> Discovery (GET /api/opal/enhanced-tools) -> Tool Execution (POST /api/opal/enhanced-tools) -> Webhook Receiver (POST /api/webhooks/opal-workflow) -> Database Storage
```

### Key Components

1. **Enhanced Tools API** (`/api/opal/enhanced-tools`)
   - Tool discovery and execution
   - Retry logic with exponential backoff
   - Environment-aware routing

2. **Webhook Receiver** (`/api/webhooks/opal-workflow`)
   - HMAC-SHA256 signature verification
   - Idempotency via deduplication hashing
   - Async processing queue integration

3. **Diagnostics** (`/api/diagnostics/last-webhook`)
   - Recent webhook event analysis
   - Troubleshooting guidance
   - Configuration validation

4. **Health Check** (`/api/opal/health`)
   - Real-time status monitoring
   - Performance metrics
   - Green/Yellow/Red status indicators

## Environment Configuration

### Required Environment Variables

```bash
# Core Configuration
OSA_WEBHOOK_URL="https://your-domain.com/api/webhooks/opal-workflow"
OSA_WEBHOOK_SECRET="your-secure-webhook-secret-minimum-32-characters"
OPAL_TOOLS_DISCOVERY_URL="https://your-domain.com/api/opal/enhanced-tools"

# Optional Configuration
DEFAULT_ENVIRONMENT="production"
DIAGNOSTICS_LIMIT_DEFAULT="25"
BASE_URL="https://your-domain.com"
```

### Environment Validation

```bash
# Quick configuration check
curl -s https://your-domain.com/api/opal/health | jq '.config_checks'
```

## Health Monitoring

### Status Definitions

- **🟢 Green**: Last valid webhook < 10min, signature rate ≥ 98%, error rate ≤ 2%
- **🟡 Yellow**: System functional but degraded performance or stale data
- **🔴 Red**: Critical configuration issues or high error rates

### Health Check Commands

```bash
# Overall health status
curl -s https://opal-2025.vercel.app/api/opal/health | jq '.overall_status'

# Detailed health information
curl -s https://opal-2025.vercel.app/api/opal/health | jq '{
  status: .overall_status,
  last_webhook_minutes: .last_webhook_minutes_ago,
  signature_rate: .signature_valid_rate,
  error_rate: .error_rate_24h,
  config_issues: [.config_checks | to_entries[] | select(.value == false) | .key]
}'

# Recent webhook activity
curl -s https://opal-2025.vercel.app/api/diagnostics/last-webhook?limit=5 | jq '.events[]'
```

## Troubleshooting Guide

### "Why No Green Status?" Checklist

1. **Verify OPAL Agent Discovery**
   ```bash
   curl -s https://opal-2025.vercel.app/api/opal/enhanced-tools | jq '.tools[].name'
   # Should return: "send_data_to_osa_enhanced"
   ```

2. **Confirm Tool Name Configuration**
   - Ensure OPAL agents use exactly `send_data_to_osa_enhanced`
   - Check agent configuration matches example in `examples/opal-agent-config.json`

3. **Validate OSA_WEBHOOK_URL**
   ```bash
   echo $OSA_WEBHOOK_URL
   # Should match your deployed webhook receiver host
   ```

4. **Check Time Skew**
   ```bash
   date -u
   # Ensure system time is accurate (HMAC signatures are time-sensitive)
   ```

5. **Review Health Check**
   ```bash
   curl -s https://opal-2025.vercel.app/api/opal/health | jq '.troubleshooting'
   ```

6. **Analyze Recent Events**
   ```bash
   curl -s https://opal-2025.vercel.app/api/diagnostics/last-webhook | jq '.troubleshooting'
   ```

### Common Failure Modes & Solutions

#### 1. Signature Mismatch (401 Unauthorized)

**Symptoms**: High signature validation failure rate
**Causes**:
- Wrong webhook secret
- Raw body not used for HMAC calculation
- Time skew > 5 minutes

**Solutions**:
```bash
# Verify webhook secret configuration
curl -s https://opal-2025.vercel.app/api/opal/health | jq '.config_checks.osa_webhook_secret_configured'

# Check for time synchronization
ntpq -p

# Validate HMAC implementation (development)
node -e "
const crypto = require('crypto');
const payload = 'test';
const secret = process.env.OSA_WEBHOOK_SECRET;
const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
console.log('Test signature:', signature);
"
```

#### 2. Wrong Base URL / Environment Leak

**Symptoms**: 404 errors, wrong endpoints called
**Solutions**:
```bash
# Check environment configuration
curl -s https://opal-2025.vercel.app/api/opal/enhanced-tools | jq '.base_url'

# Verify environment-specific URLs
export TARGET_ENV=production
curl -s https://opal-2025.vercel.app/api/opal/enhanced-tools | jq '.tools[].webhook_target_url'
```

#### 3. TLS/Proxy Header Issues

**Symptoms**: Mixed content errors, connection refused
**Solutions**:
```bash
# Test HTTPS connectivity
curl -I https://opal-2025.vercel.app/api/opal/enhanced-tools

# Check X-Forwarded-Proto handling
curl -H "X-Forwarded-Proto: https" https://opal-2025.vercel.app/api/opal/health
```

#### 4. Large Payload Issues

**Symptoms**: 413 Payload Too Large, timeouts
**Solutions**:
```bash
# Check payload size
curl -X POST https://opal-2025.vercel.app/api/opal/enhanced-tools \
  -H "Content-Type: application/json" \
  -d @large-payload.json \
  -w "Size: %{size_upload} bytes, Time: %{time_total}s\n"

# Monitor for size limits
curl -s https://opal-2025.vercel.app/api/diagnostics/last-webhook | jq '.events[] | select(.error_text | contains("size"))'
```

#### 5. CORS Issues (Browser-based Tools)

**Symptoms**: CORS preflight failures
**Solutions**:
```bash
# Check CORS headers
curl -H "Origin: https://your-admin-domain.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://opal-2025.vercel.app/api/opal/enhanced-tools -v
```

## Testing & Validation

### cURL Test Suite

#### 1. Discovery Test
```bash
# Test tool discovery
curl -X GET https://opal-2025.vercel.app/api/opal/enhanced-tools \
  -H "Accept: application/json" \
  | jq '.tools[] | {name: .name, version: .version, webhook_url: .webhook_target_url}'
```

#### 2. Enhanced Tools Execution Test
```bash
# Test tool execution with sample payload
curl -X POST https://opal-2025.vercel.app/api/opal/enhanced-tools \
  -H "Content-Type: application/json" \
  -H "User-Agent: OPAL-Agent/2.0-Test" \
  -d '{
    "tool_name": "send_data_to_osa_enhanced",
    "parameters": {
      "workflow_id": "test-workflow-001",
      "agent_id": "test-agent-001",
      "execution_status": "success",
      "target_environment": "development",
      "agent_data": {
        "test_result": "successful_execution",
        "metrics": {"duration_ms": 1250}
      },
      "metadata": {"source": "manual_test"}
    }
  }' | jq '{success: .success, duration: .duration_ms, correlation: .correlation_id}'
```

#### 3. Webhook Test (Signed)
```bash
# Generate signed webhook test
PAYLOAD='{"workflow_id":"test-webhook","agent_id":"test-agent","execution_status":"success","agent_data":{"test":true}}'
TIMESTAMP=$(date +%s)000
SECRET="your-webhook-secret-here"
SIGNATURE=$(echo -n "${TIMESTAMP}${PAYLOAD}" | openssl dgst -sha256 -hmac "${SECRET}" -hex | cut -d' ' -f2)

curl -X POST https://opal-2025.vercel.app/api/webhooks/opal-workflow \
  -H "Content-Type: application/json" \
  -H "X-OSA-Signature: t=${TIMESTAMP},v1=${SIGNATURE}" \
  -H "User-Agent: OPAL-Agent/2.0" \
  -d "${PAYLOAD}" | jq '{success: .success, event_id: .event_id, duplicate: .duplicate}'
```

#### 4. Webhook Test (Unsigned - Should Fail)
```bash
# Test unsigned webhook (should return 401)
curl -X POST https://opal-2025.vercel.app/api/webhooks/opal-workflow \
  -H "Content-Type: application/json" \
  -d '{"workflow_id":"unsigned-test","agent_id":"test","execution_status":"success"}' \
  -w "Status: %{http_code}\n" | jq '.error'
```

#### 5. Diagnostics Test
```bash
# Test diagnostics endpoint
curl -X GET "https://opal-2025.vercel.app/api/diagnostics/last-webhook?limit=3&status=all" \
  | jq '{
    total_events: .summary.total_count,
    recent_events: .events[] | {id: .id, workflow: .workflow_id, status: .http_status, valid_sig: .signature_valid}
  }'
```

#### 6. Health Check Test
```bash
# Test health endpoint
curl -X GET https://opal-2025.vercel.app/api/opal/health \
  | jq '{
    status: .overall_status,
    last_event_minutes: .last_webhook_minutes_ago,
    signature_rate: .signature_valid_rate,
    config_ok: (.config_checks | [to_entries[] | select(.value == true)] | length)
  }'
```

### Integration Test Script

```bash
#!/bin/bash
# integration-test.sh - Complete OPAL integration test

set -e

BASE_URL="https://opal-2025.vercel.app"
WEBHOOK_SECRET="your-webhook-secret-here"

echo "🧪 OPAL Integration Test Suite"
echo "================================"

# Test 1: Discovery
echo "1. Testing tool discovery..."
DISCOVERY=$(curl -s "${BASE_URL}/api/opal/enhanced-tools")
TOOL_COUNT=$(echo "$DISCOVERY" | jq '.tools | length')
if [ "$TOOL_COUNT" -eq 1 ]; then
  echo "✅ Discovery successful (${TOOL_COUNT} tool found)"
else
  echo "❌ Discovery failed (expected 1 tool, got ${TOOL_COUNT})"
  exit 1
fi

# Test 2: Tool execution
echo "2. Testing tool execution..."
EXECUTION=$(curl -s -X POST "${BASE_URL}/api/opal/enhanced-tools" \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "send_data_to_osa_enhanced",
    "parameters": {
      "workflow_id": "integration-test-001",
      "agent_id": "test-suite-agent",
      "execution_status": "success",
      "agent_data": {"test": "integration"}
    }
  }')

SUCCESS=$(echo "$EXECUTION" | jq -r '.success')
if [ "$SUCCESS" == "true" ]; then
  echo "✅ Tool execution successful"
else
  echo "❌ Tool execution failed"
  echo "$EXECUTION" | jq '.error // .message'
  exit 1
fi

# Test 3: Health check
echo "3. Testing health check..."
HEALTH=$(curl -s "${BASE_URL}/api/opal/health")
STATUS=$(echo "$HEALTH" | jq -r '.overall_status')
echo "   Health status: $STATUS"

# Test 4: Diagnostics
echo "4. Testing diagnostics..."
DIAGNOSTICS=$(curl -s "${BASE_URL}/api/diagnostics/last-webhook?limit=1")
EVENT_COUNT=$(echo "$DIAGNOSTICS" | jq '.summary.total_count')
echo "   Recent events: $EVENT_COUNT"

echo "🎉 Integration test complete!"
echo "   - Discovery: ✅"
echo "   - Execution: ✅"
echo "   - Health: $STATUS"
echo "   - Events: $EVENT_COUNT"
```

## Performance Monitoring

### Key Metrics to Monitor

```bash
# Response times
curl -w "Time: %{time_total}s, Size: %{size_download} bytes\n" \
  -o /dev/null -s https://opal-2025.vercel.app/api/opal/health

# Error rates
curl -s https://opal-2025.vercel.app/api/opal/health | jq '.error_rate_24h * 100'

# Signature validation rate
curl -s https://opal-2025.vercel.app/api/opal/health | jq '.signature_valid_rate * 100'

# Event throughput
curl -s https://opal-2025.vercel.app/api/diagnostics/last-webhook | jq '.summary.total_count'
```

### Alerting Thresholds

- **Response Time**: > 5 seconds
- **Error Rate**: > 5%
- **Signature Failure Rate**: > 2%
- **No Events**: > 15 minutes
- **Health Status**: Red for > 5 minutes

## Scaling Considerations

### Database Performance

```sql
-- Monitor webhook event volume
SELECT
  DATE_TRUNC('hour', received_at) as hour,
  COUNT(*) as events,
  AVG(CASE WHEN signature_valid THEN 1 ELSE 0 END) as signature_rate
FROM opal_webhook_events
WHERE received_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;

-- Check index usage
EXPLAIN ANALYZE SELECT * FROM opal_webhook_events
WHERE workflow_id = 'example' AND received_at > NOW() - INTERVAL '1 hour';
```

### Rate Limiting

```bash
# Monitor request patterns
curl -s https://opal-2025.vercel.app/api/diagnostics/last-webhook | \
  jq '.events | group_by(.workflow_id) | map({workflow: .[0].workflow_id, count: length})'
```

## Security Checklist

- [ ] Webhook secret is 32+ characters
- [ ] HTTPS enforced for all endpoints
- [ ] HMAC signatures validated with constant-time comparison
- [ ] Raw request body used for signature verification
- [ ] Time-based replay attack protection (5-minute window)
- [ ] Input validation on all payloads
- [ ] Error messages don't leak sensitive information
- [ ] Access logs configured and monitored

## Deployment Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates valid
- [ ] Health checks passing

### Post-deployment
- [ ] Discovery endpoint accessible
- [ ] Webhook receiver responding
- [ ] HMAC verification working
- [ ] Diagnostics showing green status
- [ ] Integration tests passing

## Support & Escalation

### Log Analysis
```bash
# Check recent errors
curl -s https://opal-2025.vercel.app/api/diagnostics/last-webhook?status=failure | \
  jq '.events[] | {time: .received_at, error: .error_text}'

# Monitor signature failures
curl -s https://opal-2025.vercel.app/api/diagnostics/last-webhook | \
  jq '.events[] | select(.signature_valid == false) | {time: .received_at, workflow: .workflow_id}'
```

### Emergency Procedures

1. **Service Degradation**: Check health endpoint, review recent errors
2. **Complete Outage**: Verify DNS, SSL, and infrastructure
3. **High Error Rate**: Check webhook secret, time sync, payload validation
4. **Security Incident**: Rotate webhook secret, audit access logs

For additional support, review:
- Application logs via Vercel dashboard
- Database performance metrics
- External OPAL agent configurations
- Network connectivity between services