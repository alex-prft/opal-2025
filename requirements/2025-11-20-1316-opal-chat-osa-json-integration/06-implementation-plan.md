# Implementation Plan

**Requirement ID:** 2025-11-20-1316-opal-chat-osa-json-integration
**Implementation Approach:** Create Missing Endpoint Wrapper (Option 1)
**Estimated Time:** 3-6 hours total
**Risk Level:** LOW

## 🎯 **Implementation Strategy**

Create a new API endpoint `/api/tools/osa_send_data_to_osa_webhook/route.ts` that acts as a wrapper around the existing `send_data_to_osa_enhanced` implementation.

**Core Pattern:**
```
OPAL Chat → osa_send_data_to_osa_webhook → Parameter Transform → send_data_to_osa_enhanced → OSA Results
```

## 📋 **Detailed Implementation Steps**

### **Step 1: Create Wrapper Endpoint** (1-2 hours)

**File:** `src/app/api/tools/osa_send_data_to_osa_webhook/route.ts`

**Implementation Requirements:**
1. **Accept OPAL agent parameters:**
   - `agent_name`: string
   - `execution_results`: object
   - `workflow_id`: string
   - `metadata`: object

2. **Transform to enhanced tool format:**
   - Map to `send_data_to_osa_enhanced` parameter schema
   - Preserve authentication headers
   - Maintain request context

3. **Delegate to existing implementation:**
   - Call `/api/opal/enhanced-tools` with `tool_name: "send_data_to_osa_enhanced"`
   - Forward transformed parameters
   - Return response to OPAL

### **Step 2: Parameter Transformation Logic** (30 minutes)

**Input Schema** (from `workflow_data_sharing.json`):
```typescript
interface OpalWebhookParams {
  agent_name: string;
  execution_results: object;
  workflow_id: string;
  metadata: {
    execution_status: string;
    execution_time_ms: number;
    timestamp: string;
    success: boolean;
  };
  webhook_endpoint?: string;
}
```

**Output Schema** (for enhanced tools):
```typescript
interface EnhancedToolParams {
  tool_name: "send_data_to_osa_enhanced";
  parameters: {
    // Transform opal params to enhanced format
  };
}
```

### **Step 3: Authentication & Error Handling** (30 minutes)

1. **Forward Authentication:**
   - HMAC signatures from OPAL
   - Bearer tokens
   - Preserve security headers

2. **Error Response Pattern:**
   - Match existing OPAL tool response format
   - Provide clear success/failure messages
   - Log errors for debugging

### **Step 4: Testing & Validation** (1-2 hours)

1. **Unit Tests:**
   - Parameter transformation accuracy
   - Authentication forwarding
   - Error handling scenarios

2. **Integration Tests:**
   - End-to-end OPAL chat flow
   - Webhook delivery verification
   - Results page data validation

3. **Regression Tests:**
   - Ensure workflow mode continues working
   - Validate existing enhanced tools unchanged

### **Step 5: Deployment** (30 minutes)

1. **Staging Deployment:**
   - Deploy wrapper endpoint
   - Run integration tests
   - Validate chat interface behavior

2. **Production Deployment:**
   - Deploy to production
   - Monitor for errors
   - Validate success metrics

## 🔧 **Technical Implementation Details**

### **Endpoint Structure**
```typescript
// /api/tools/osa_send_data_to_osa_webhook/route.ts

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Parse OPAL parameters
    const opalParams = await request.json();

    // 2. Transform to enhanced tool format
    const enhancedParams = transformToEnhancedFormat(opalParams);

    // 3. Forward to existing implementation
    const response = await fetch('/api/opal/enhanced-tools', {
      method: 'POST',
      headers: forwardAuthHeaders(request.headers),
      body: JSON.stringify(enhancedParams)
    });

    // 4. Return response to OPAL
    return NextResponse.json(await response.json());

  } catch (error) {
    return handleOpalError(error);
  }
}
```

### **Parameter Transformation**
```typescript
function transformToEnhancedFormat(opalParams: OpalWebhookParams) {
  return {
    tool_name: "send_data_to_osa_enhanced",
    parameters: {
      agent_name: opalParams.agent_name,
      workflow_data: opalParams.execution_results,
      workflow_id: opalParams.workflow_id,
      execution_metadata: opalParams.metadata
    }
  };
}
```

## 🚨 **Risk Mitigation**

### **Low Risk Factors**
- ✅ Using proven existing code (`send_data_to_osa_enhanced`)
- ✅ No changes to working components
- ✅ Simple wrapper pattern
- ✅ Comprehensive validation performed

### **Mitigation Strategies**
1. **Rollback Plan:** Remove new endpoint if issues occur
2. **Monitoring:** Log all requests for debugging
3. **Testing:** Comprehensive test coverage before deployment
4. **Gradual Deployment:** Staging validation before production

## 📊 **Success Metrics**

### **Immediate Validation**
- [ ] OPAL chat interface no longer shows error message
- [ ] JSON data successfully sent to OSA after user says "OSA"
- [ ] Strategy workflow mode continues working unchanged
- [ ] Authentication mechanisms function correctly

### **24-Hour Monitoring**
- [ ] Zero regression issues reported
- [ ] Chat interface success rate > 95%
- [ ] Response times < 2 seconds
- [ ] No authentication failures

## 🔄 **Quality Control Integration**

Following CLAUDE.md mandatory patterns:

1. **Agent Usage Tracking:** ✅ opal-integration-validator used
2. **Production Build Validation:** Required after implementation
3. **CLAUDE.md Checker:** Final mandatory validation step

## ⏱️ **Timeline**

- **Hour 0-2:** Implement wrapper endpoint
- **Hour 2-3:** Add transformation logic and error handling
- **Hour 3-4:** Testing and validation
- **Hour 4-5:** Staging deployment and verification
- **Hour 5-6:** Production deployment and monitoring

**Total Estimated Time:** 3-6 hours from start to production validation