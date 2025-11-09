# OPAL Discovery Endpoint Format Reference

**Version**: 2.0
**Last Updated**: November 2025
**Status**: Production Validated

## 🎯 **Critical Requirements Summary**

OPAL discovery endpoints **MUST** return this **exact format** to avoid the `'str' object has no attribute 'get'` error:

### **✅ Correct Format (Use This)**
```json
{
  "functions": [
    {
      "name": "function_name",
      "description": "What the function does",
      "parameters": [
        {
          "name": "param1",
          "type": "string",
          "description": "Parameter description",
          "required": true
        },
        {
          "name": "param2",
          "type": "number",
          "description": "Another parameter",
          "required": false
        }
      ],
      "endpoint": "/tools/function_name",
      "http_method": "POST"
    }
  ],
  "name": "Tool Name",
  "description": "Tool description",
  "version": "1.0.0"
}
```

### **❌ Common Wrong Formats (Avoid These)**

#### **Wrong: JSON Schema Object Format**
```json
{
  "functions": [
    {
      "name": "function_name",
      "parameters": {
        "type": "object",
        "properties": {
          "param1": {"type": "string"}
        },
        "required": ["param1"]
      }
    }
  ]
}
```
**Error**: OPAL expects parameter **array**, not **object**

#### **Wrong: Missing Required Fields**
```json
{
  "functions": [
    {
      "name": "function_name",
      "description": "What it does"
      // ❌ Missing: parameters, endpoint, http_method
    }
  ]
}
```
**Error**: OPAL will call `.get()` on missing fields

#### **Wrong: Absolute Endpoint Paths**
```json
{
  "functions": [
    {
      "endpoint": "/api/tools/function_name/execute"  // ❌ Wrong
      "endpoint": "/tools/function_name"              // ✅ Correct
    }
  ]
}
```

---

## 📋 **Complete Field Reference**

### **Top-Level Object**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `functions` | Array | ✅ Yes | Array of function definitions |
| `name` | String | Optional | Tool/registry display name |
| `description` | String | Optional | Tool purpose description |
| `version` | String | Optional | Tool version (e.g., "1.0.0") |

### **Function Object**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ✅ Yes | Function identifier (alphanumeric + underscores) |
| `description` | String | ✅ Yes | Clear function purpose description |
| `parameters` | Array | ✅ Yes | Array of parameter descriptor objects |
| `endpoint` | String | ✅ Yes | Relative path (e.g., "/tools/my_function") |
| `http_method` | String | ✅ Yes | HTTP method (typically "POST") |

### **Parameter Object**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ✅ Yes | Parameter name (matches function signature) |
| `type` | String | ✅ Yes | Data type: "string", "number", "boolean", "object", "array" |
| `description` | String | ✅ Yes | Clear parameter purpose description |
| `required` | Boolean | ✅ Yes | Whether parameter is mandatory |

---

## 🚨 **Critical "Don'ts" - These Cause Errors**

### **❌ Don't Use JSON Schema Format**
```json
// ❌ This breaks OPAL
"parameters": {
  "type": "object",
  "properties": {...}
}

// ✅ Use this instead
"parameters": [
  {"name": "param1", "type": "string", "required": true}
]
```

### **❌ Don't Include These Schema Properties**
```json
// ❌ These cause parsing errors
{
  "name": "param1",
  "type": "string",
  "default": "value",     // ❌ Remove
  "enum": ["a", "b"],     // ❌ Remove
  "examples": ["test"],   // ❌ Remove
  "items": {...}          // ❌ Remove for arrays
}
```

### **❌ Don't Use Absolute Paths**
```json
// ❌ Wrong - causes URL resolution issues
"endpoint": "/api/tools/my_function/execute"

// ✅ Correct - relative to discovery URL
"endpoint": "/tools/my_function"
```

### **❌ Don't Require Auth on Discovery**
```typescript
// ❌ Wrong - discovery must be anonymous
if (!request.headers.authorization) {
  return NextResponse.json({error: "Unauthorized"}, {status: 401});
}

// ✅ Correct - discovery is always public
export async function GET(request: NextRequest) {
  // No auth check on discovery endpoint
}
```

### **❌ Don't Cache Discovery Responses**
```typescript
// ❌ Wrong - caching causes stale responses
return NextResponse.json(response, {
  headers: {
    'Cache-Control': 'public, max-age=300'  // ❌ Remove
  }
});

// ✅ Correct - disable caching
return NextResponse.json(response, {
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  }
});
```

---

## 🔧 **Implementation Examples**

### **TypeScript Interface**
```typescript
interface OPALFunction {
  name: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
  }>;
  endpoint: string;
  http_method: string;
}

interface OPALDiscoveryResponse {
  functions: OPALFunction[];
  name?: string;
  description?: string;
  version?: string;
}
```

### **Parameter Conversion Function**
```typescript
function createOPALParameterArray(schema: any): Array<{
  name: string,
  type: string,
  description: string,
  required: boolean
}> {
  const parameters = [];

  if (!schema?.properties) return parameters;

  const requiredFields = schema.required || [];

  for (const [propName, propDef] of Object.entries(schema.properties)) {
    const param = propDef as any;

    parameters.push({
      name: propName,
      type: param.type || 'string',
      description: param.description || `${propName} parameter`,
      required: requiredFields.includes(propName)
    });
  }

  return parameters;
}
```

### **Next.js API Route Example**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tool: string }> }
) {
  try {
    const { tool } = await params;

    // Load tool configuration
    const toolConfig = await loadToolConfig(tool);

    // Convert to OPAL format
    const functions: OPALFunction[] = toolConfig.tools.map(toolDef => ({
      name: toolDef.name,
      description: toolDef.description,
      parameters: createOPALParameterArray(toolDef.input_schema),
      endpoint: `/tools/${toolDef.name.toLowerCase()}`,
      http_method: "POST"
    }));

    const response: OPALDiscoveryResponse = {
      functions,
      name: toolConfig.name,
      description: toolConfig.description,
      version: toolConfig.version
    };

    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Discovery failed', message: error.message },
      { status: 500 }
    );
  }
}
```

---

## ✅ **Validation Checklist**

Before deploying any OPAL discovery endpoint, verify:

### **Response Format**
- [ ] Returns HTTP 200 status
- [ ] Content-Type is `application/json`
- [ ] Top-level object has `functions` array
- [ ] Each function has all 5 required fields: `name`, `description`, `parameters`, `endpoint`, `http_method`
- [ ] Parameters field is **array**, not object
- [ ] Endpoint paths are relative (start with `/tools/`)

### **Authentication & Caching**
- [ ] Discovery endpoint requires **no authentication**
- [ ] Cache-Control header disables caching
- [ ] CORS headers allow cross-origin access

### **Parameter Validation**
- [ ] Each parameter has: `name`, `type`, `description`, `required`
- [ ] No `default`, `enum`, `examples`, or `items` properties
- [ ] Required field is boolean, not string array

### **Testing Commands**
```bash
# Test basic response
curl -s "https://your-domain.com/api/tools/workflow/discovery" | jq '.'

# Verify structure
curl -s "https://your-domain.com/api/tools/workflow/discovery" | jq 'keys'

# Check parameter format
curl -s "https://your-domain.com/api/tools/workflow/discovery" | jq '.functions[0].parameters | type'

# Verify no auth required
curl -s -w '%{http_code}' "https://your-domain.com/api/tools/workflow/discovery"
```

---

## 📚 **References**

- [Optimizely OPAL Documentation](https://docs.optimizely.com)
- [Community Examples](https://github.com/optimizely/opal-examples)
- [Support FAQ](https://support.optimizely.com/hc/en-us/articles/opal-tools)

---

**⚠️ Critical**: This format is **mandatory** for OPAL compatibility. Deviations will cause the `'str' object has no attribute 'get'` error and prevent tool registration.