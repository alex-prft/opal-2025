# OPAL Discovery Endpoint Fix - Complete Documentation

## Problem Statement

**Error**: `"Discovery URL does not return valid functions data"`

This error occurred when trying to register custom OPAL tools with Optimizely OPAL Tools Management Service. The discovery endpoint was returning an incompatible format that OPAL could not parse.

## Root Cause Analysis

### Original Problem
The discovery endpoint was returning a `tools` object format instead of the `functions` array format expected by OPAL:

```json
// ❌ INCORRECT FORMAT (what we had)
{
  "tools": {
    "osa_workflow_data": {
      "name": "osa_workflow_data",
      "function": {
        "parameters": {
          "type": "object",
          "properties": { ... }
        }
      }
    }
  }
}
```

### Expected Format
OPAL Tools Management Service expects a `functions` array format:

```json
// ✅ CORRECT FORMAT (what OPAL expects)
{
  "functions": [
    {
      "name": "osa_workflow_data",
      "description": "...",
      "parameters": [
        {
          "name": "workflow_id",
          "type": "string",
          "required": true,
          "description": "..."
        }
      ],
      "endpoint": "/api/opal/osa-workflow",
      "http_method": "POST"
    }
  ]
}
```

## Solution Implementation

### 1. Discovery Endpoint Format Fix

**File**: `src/app/api/opal/discovery/route.ts`

**Key Changes**:
- Changed from `tools` object to `functions` array
- Parameters changed from JSON Schema format to OPAL parameter array format
- Added proper OPAL SDK compliance metadata

### 2. Parameter Format Transformation

**Before (JSON Schema)**:
```json
"parameters": {
  "type": "object",
  "properties": {
    "workflow_id": {
      "type": "string",
      "description": "..."
    }
  }
}
```

**After (OPAL Parameter Array)**:
```json
"parameters": [
  {
    "name": "workflow_id",
    "type": "string",
    "description": "...",
    "required": true
  }
]
```

### 3. Enhanced Validation Infrastructure

**File**: `scripts/validate-opal-discovery.ts`

**Enhancements**:
- Dual format support (legacy `functions` array + new `tools` object)
- SDK compliance validation for OPAL Tools SDK format
- Comprehensive parameter validation with proper error messages
- Anti-regression test patterns

## Technical Details

### OPAL Tools SDK Compliance

Based on `@optimizely-opal/opal-tools-sdk` documentation:

1. **Discovery Endpoint**: Must return `functions` array
2. **Parameter Format**: Array of `{name, type, description, required}` objects
3. **Function Structure**: Must include `name`, `description`, `parameters`, `endpoint`, `http_method`
4. **Authentication**: Optional `auth_required` field
5. **Versioning**: Optional `version` field for tracking

### Response Structure Requirements

```typescript
interface OPALDiscoveryResponse {
  functions: OPALFunction[];
  name?: string;
  description?: string;
  version?: string;
  supported_agents?: string[];
  discovery_generated_at?: string;
  tools_count?: number;
}

interface OPALFunction {
  name: string;
  description: string;
  parameters: OPALParameter[];
  endpoint: string;
  http_method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  auth_required?: boolean;
  version?: string;
}

interface OPALParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
}
```

## Validation & Testing

### 1. Automated Validation
- **Script**: `npm run validate:opal:prod`
- **Local**: `npx tsx scripts/validate-opal-discovery.ts --url=http://localhost:3000/api/opal/discovery`
- **Production**: `npx tsx scripts/validate-opal-discovery.ts --url=https://opal-2025.vercel.app/api/opal/discovery`

### 2. Unit Test Coverage
- **File**: `tests/unit/opal-discovery-fix.test.ts`
- **Coverage**: Functions array format validation
- **Anti-regression**: Prevents return to `tools` object format
- **Parameter validation**: Ensures OPAL parameter array format

### 3. Integration Testing
- **Discovery endpoint response structure**
- **Parameter format compliance**
- **Function definition completeness**
- **CORS and error handling**

## Deployment Process

### Production Deployment Steps
1. **Code Changes**: Updated discovery endpoint format
2. **Testing**: Validated locally with `functions` array format
3. **Deployment**: `git push` → Vercel auto-deployment
4. **Verification**: `curl https://opal-2025.vercel.app/api/opal/discovery | jq '.functions'`
5. **Validation**: `npm run validate:opal:prod`

### Rollback Plan
If issues occur:
1. **Revert commit**: `git revert HEAD`
2. **Force redeploy**: `npx vercel --prod --yes`
3. **Update alias**: `npx vercel alias <deployment-url> opal-2025.vercel.app`

## Prevention Measures

### 1. Development Guidelines

**For Future OPAL Custom Tools**:
- Always use `functions` array format in discovery endpoints
- Use OPAL parameter array format: `{name, type, description, required}`
- Include all required fields: `name`, `description`, `parameters`, `endpoint`, `http_method`
- Test with validation script before deployment

### 2. Mandatory Validation
- **Pre-deployment**: Run OPAL validation script
- **CI/CD Integration**: Add validation to deployment pipeline
- **Unit Tests**: Include discovery format tests for all new tools

### 3. Code Templates

**Discovery Endpoint Template**:
```typescript
function generateOpalDiscoveryResponse() {
  return {
    functions: [
      {
        name: 'your_tool_name',
        description: 'Clear description of what the tool does',
        parameters: [
          {
            name: 'parameter_name',
            type: 'string', // or 'number', 'boolean', 'array', 'object'
            description: 'Clear parameter description',
            required: true // or false
          }
        ],
        endpoint: '/api/your-tool-endpoint',
        http_method: 'POST',
        auth_required: false,
        version: '1.0.0'
      }
    ],
    name: 'Your Service Name',
    description: 'Service description',
    version: '1.0.0'
  };
}
```

## Troubleshooting

### Common Issues & Solutions

**Issue**: "Discovery URL does not return valid functions data"
**Solution**: Ensure response has `functions` array, not `tools` object

**Issue**: "'str' object has no attribute 'get'"
**Solution**: Verify parameters are array format, not JSON Schema objects

**Issue**: Tool not discovered by OPAL
**Solution**: Check endpoint accessibility, CORS headers, and response format

**Issue**: Parameter validation errors
**Solution**: Ensure all parameters have `name`, `type`, `description`, `required` fields

### Debugging Tools

1. **Validation Script**: `npx tsx scripts/validate-opal-discovery.ts --url=<your-url>`
2. **Manual Testing**: `curl -s <discovery-url> | jq '.'`
3. **Format Check**: `curl -s <discovery-url> | jq '.functions | length'`
4. **Parameter Check**: `curl -s <discovery-url> | jq '.functions[0].parameters'`

## References

- **OPAL Tools SDK**: `@optimizely-opal/opal-tools-sdk`
- **Original Issue**: "Discovery URL does not return valid functions data"
- **Fix Implementation**: `src/app/api/opal/discovery/route.ts`
- **Validation Infrastructure**: `scripts/validate-opal-discovery.ts`
- **Test Suite**: `tests/unit/opal-discovery-fix.test.ts`

---

**Last Updated**: 2025-11-10
**Status**: ✅ Resolved
**Validation**: ✅ All tests passing