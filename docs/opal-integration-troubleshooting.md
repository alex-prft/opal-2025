# OPAL Integration Troubleshooting Guide

**Document Purpose**: Comprehensive troubleshooting guide for OPAL integration issues based on production debugging (2025-11-20)
**Target Audience**: Developers working on OPAL ↔ OSA integration
**Integration Health Target**: 95/100+ score via opal-integration-validator

## 🚨 Common Failure Patterns

### 1. Tool Name Mismatch (Most Common)

**Symptoms:**
```
"I was unable to send the report to OSA at this time"
Integration health score: 85/100 or lower
Missing endpoint errors in logs
```

**Root Cause:**
- OPAL agents configured to call: `osa_send_data_to_osa_webhook`
- Actual OSA implementation: `send_data_to_osa_enhanced`
- Tool discovery fails because endpoint path doesn't match tool name

**Diagnostic Steps:**
```bash
# 1. Check agent configuration
grep -r "enabled_tools" opal-config/opal-agents/

# 2. Verify endpoint exists
ls -la src/app/api/tools/osa_send_data_to_osa_webhook/

# 3. Check integration health
# Use opal-integration-validator agent for comprehensive check
```

**Solution Pattern - Wrapper Endpoint (PREFERRED):**
```typescript
// Create: /api/tools/{tool_name}/route.ts
export async function POST(request: NextRequest) {
  // Transform OPAL parameters → Enhanced Tools format
  const enhancedRequest = transformParameters(opalParams);

  // Delegate to existing implementation
  return fetch('/api/opal/enhanced-tools', {
    method: 'POST',
    body: JSON.stringify(enhancedRequest)
  });
}
```

**Benefits:**
- ✅ Single file change vs 9+ agent config updates
- ✅ Zero impact on working infrastructure
- ✅ Maintains backward compatibility

### 2. Parameter Schema Mismatches

**Symptoms:**
```
400 Bad Request responses
Parameter validation errors in logs
Successful tool discovery but execution failures
```

**Root Cause:**
Different parameter schemas between OPAL and Enhanced Tools:
- OPAL: `agent_name`, `execution_results`
- Enhanced: `agent_id`, `agent_data`

**Diagnostic Steps:**
```bash
# Check parameter schemas
cat opal-config/opal-tools/workflow_data_sharing.json | jq '.tools[] | select(.name=="osa_send_data_to_osa_webhook")'

# Compare with Enhanced Tools schema
grep -A 20 "send_data_to_osa_enhanced" src/app/api/opal/enhanced-tools/route.ts
```

**Solution - Parameter Transformation:**
```typescript
function transformOpalToEnhanced(opalParams) {
  return {
    tool_name: 'send_data_to_osa_enhanced',
    parameters: {
      workflow_id: opalParams.workflow_id,      // Direct mapping
      agent_id: opalParams.agent_name,          // Schema transformation
      execution_status: opalParams.metadata.execution_status || 'completed',
      agent_data: opalParams.execution_results, // Schema transformation
      target_environment: process.env.NODE_ENV,
      metadata: {
        ...opalParams.metadata,
        source: 'opal_chat_interface',
        correlation_id: generateCorrelationId()
      }
    }
  };
}
```

### 3. Authentication Forwarding Issues

**Symptoms:**
```
401 Unauthorized responses
HMAC signature validation failures
Missing authentication headers in logs
```

**Root Cause:**
Wrapper endpoints not forwarding authentication headers properly.

**Diagnostic Steps:**
```bash
# Check request headers in wrapper endpoint logs
grep "Authorization\|X-OSA-Signature" logs/

# Verify HMAC signature forwarding
curl -H "X-OSA-Signature: test" http://localhost:3000/api/tools/osa_send_data_to_osa_webhook
```

**Solution - Header Forwarding:**
```typescript
const forwardHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  'User-Agent': 'OPAL-Chat-Webhook/1.0',
  'X-Correlation-ID': correlationId
};

// Forward authentication headers if present
const authHeader = request.headers.get('authorization');
if (authHeader) {
  forwardHeaders['Authorization'] = authHeader;
}

const hmacSignature = request.headers.get('x-osa-signature');
if (hmacSignature) {
  forwardHeaders['X-OSA-Signature'] = hmacSignature;
}
```

### 4. Missing Correlation ID Tracking

**Symptoms:**
```
Difficult to debug request flows
Missing request tracking in logs
No correlation between OPAL and OSA requests
```

**Root Cause:**
No standardized correlation ID generation and propagation.

**Solution - Correlation ID Pattern:**
```typescript
// Generate at request entry
const correlationId = `opal-webhook-${Date.now()}-${Math.random().toString(36).substring(7)}`;

// Log at all key points
console.log('🚀 [OPAL Webhook Tool] Request received', { correlationId });
console.log('📤 [OPAL Webhook Tool] Calling enhanced tools', { correlationId });
console.log('✅ [OPAL Webhook Tool] Success', { correlationId });

// Include in response headers
return NextResponse.json(data, {
  headers: {
    'X-Correlation-ID': correlationId,
    'X-Processing-Time': processingTime.toString()
  }
});
```

## 🔧 Debugging Workflow

### Step 1: Integration Health Check (5 minutes)
```typescript
// Use opal-integration-validator agent
Task({
  subagent_type: "opal-integration-validator",
  description: "Check OPAL integration health",
  prompt: "Perform comprehensive validation and provide health score"
});
```

**Expected Output:**
- Integration health score (target: 95/100+)
- Specific failure points identified
- Tool discovery results
- Authentication flow validation

### Step 2: Component Analysis (10 minutes)
```bash
# Check agent configurations
find opal-config/opal-agents/ -name "*.json" -exec grep -l "osa_send_data_to_osa_webhook" {} \;

# Verify API endpoint existence
ls -la src/app/api/tools/osa_send_data_to_osa_webhook/

# Check Enhanced Tools implementation
grep -A 10 "send_data_to_osa_enhanced" src/app/api/opal/enhanced-tools/route.ts
```

### Step 3: End-to-End Testing (15 minutes)
```bash
# Test tool discovery
curl http://localhost:3000/api/tools/osa_send_data_to_osa_webhook

# Test parameter transformation
curl -X POST http://localhost:3000/api/tools/osa_send_data_to_osa_webhook \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: test-123" \
  -d '{
    "agent_name": "audience_suggester",
    "execution_results": {"test": "data"},
    "workflow_id": "test-workflow-123",
    "metadata": {"execution_status": "completed"}
  }'

# Check correlation ID in response headers
curl -i -X POST ... | grep "X-Correlation-ID"
```

### Step 4: Integration Health Re-validation (5 minutes)
```typescript
// After fixes, re-run validation
Task({
  subagent_type: "opal-integration-validator",
  description: "Confirm integration health improvement",
  prompt: "Validate that fixes resolved issues and health score improved"
});
```

## 🎯 Solution Decision Matrix

| Issue Type | Wrapper Endpoint | Agent Config Update | Hybrid Approach |
|------------|------------------|---------------------|-----------------|
| **Tool Name Mismatch** | ✅ **PREFERRED** (1 file) | ❌ High risk (9+ files) | ⚠️ Complex |
| **Parameter Schema** | ✅ **PREFERRED** (transform logic) | ❌ Breaking changes | ⚠️ Maintenance overhead |
| **Auth Forwarding** | ✅ **PREFERRED** (centralized) | ❌ Scattered logic | ❌ Not applicable |
| **New Tool Addition** | ⚠️ Per case | ✅ **PREFERRED** | ❌ Not applicable |

**General Recommendation:** Use wrapper endpoint pattern for mismatches, direct agent config for new functionality.

## 📊 Success Metrics & Monitoring

### Integration Health Targets
- **Baseline**: 85/100 (before fixes)
- **Target**: 95/100+ (after fixes)
- **Production**: 98/100+ (sustained)

### Key Performance Indicators
```typescript
// Monitor in production
const integrationMetrics = {
  healthScore: 98,              // opal-integration-validator result
  successRate: 0.99,           // Successful webhook deliveries
  avgResponseTime: 1200,       // Processing time (ms)
  errorRate: 0.01,             // Request failure rate
  correlationCoverage: 1.0     // Requests with correlation IDs
};
```

### Alerting Thresholds
- **Critical**: Health score < 90/100
- **Warning**: Success rate < 95%
- **Info**: Response time > 2000ms

## 🔄 Prevention Strategies

### 1. Pre-Development Validation
```typescript
// MANDATORY: Before any OPAL changes
TodoWrite([
  { content: "Run opal-integration-validator for baseline", status: "pending" },
  { content: "Document current integration health score", status: "pending" },
  { content: "Plan changes with wrapper pattern preference", status: "pending" }
]);
```

### 2. Tool Name Validation Rules
- **Rule**: Tool name in agent config MUST match API endpoint path exactly
- **Pattern**: `/api/tools/{tool_name}/route.ts`
- **Validation**: Automated check in CI/CD pipeline

### 3. Correlation ID Standards
- **Format**: `{service}-{timestamp}-{random}`
- **Propagation**: All service calls via `X-Correlation-ID` header
- **Logging**: Include in every console.log statement

### 4. Documentation Updates
- **Agent Changes**: Update CLAUDE.md integration patterns
- **New Tools**: Document in troubleshooting guide
- **Lessons Learned**: Capture in case studies

## 📚 Reference Links

- **CLAUDE.md**: Project collaboration guidelines with OPAL patterns
- **Implementation Plan**: `requirements/2025-11-20-1316-opal-chat-osa-json-integration/`
- **Wrapper Endpoint**: `/api/tools/osa_send_data_to_osa_webhook/route.ts`
- **Agent Configs**: `opal-config/opal-agents/`
- **Tool Specs**: `opal-config/opal-tools/workflow_data_sharing.json`

---

**Last Updated**: 2025-11-20
**Integration Health**: 98/100 (validated)
**Status**: Production ready with comprehensive monitoring