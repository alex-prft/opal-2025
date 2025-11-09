# OPAL Troubleshooting Guide

**Version**: 2.0
**Last Updated**: November 2025
**Status**: Production Validated

## 🚨 **Most Common Error: `'str' object has no attribute 'get'`**

This error occurs when OPAL expects a dictionary/object but receives a string. Here's how to diagnose and fix it systematically.

---

## 🔍 **Diagnostic Workflow**

### **Step 1: Test Discovery Endpoint Directly**

```bash
# Basic connectivity test
curl -I "https://your-domain.com/api/tools/[tool]/discovery"

# Expected: HTTP/1.1 200 OK
# Expected: content-type: application/json

# Full response test
curl -s "https://your-domain.com/api/tools/[tool]/discovery" | jq '.'

# Expected: Valid JSON object with "functions" array
```

**❌ If you get HTML instead of JSON:**
- Discovery endpoint is returning error page (404/500)
- Check API route exists and is deployed
- Verify URL path matches your route structure

**❌ If you get authentication error:**
- Discovery endpoint incorrectly requires auth
- Remove auth requirements from discovery (auth goes on tool execution only)

### **Step 2: Validate Response Structure**

```bash
# Check top-level structure
curl -s "https://your-domain.com/api/tools/[tool]/discovery" | jq 'keys'

# Expected: ["functions", "name", "description", "version"] or similar
# ❌ If missing "functions": Add functions array

# Check functions array
curl -s "https://your-domain.com/api/tools/[tool]/discovery" | jq '.functions | type'

# Expected: "array"
# ❌ If "object" or "null": Fix functions field

# Check function structure
curl -s "https://your-domain.com/api/tools/[tool]/discovery" | jq '.functions[0] | keys'

# Expected: ["name", "description", "parameters", "endpoint", "http_method"]
# ❌ If missing fields: Add all required function fields
```

### **Step 3: Validate Parameter Format (Critical)**

```bash
# Check parameter format - THIS IS THE MOST COMMON ISSUE
curl -s "https://your-domain.com/api/tools/[tool]/discovery" | jq '.functions[0].parameters | type'

# Expected: "array"
# ❌ If "object": You're using JSON Schema format instead of OPAL format

# Check parameter structure
curl -s "https://your-domain.com/api/tools/[tool]/discovery" | jq '.functions[0].parameters[0]'

# Expected: {"name": "param1", "type": "string", "description": "...", "required": true}
# ❌ If you see "type": "object", "properties": {...}: Wrong format!
```

---

## 🐛 **Error Categories & Solutions**

### **Category A: Response Format Errors**

#### **A1. HTML/Text Response Instead of JSON**

**Symptoms:**
```bash
curl -s "https://domain.com/api/tools/workflow/discovery"
# Returns: <html><body>404 Not Found</body></html>
```

**Causes & Fixes:**
```typescript
// ❌ Cause: Missing/incorrect API route
// Fix: Ensure route file exists at correct path
/src/app/api/tools/[tool]/discovery/route.ts

// ❌ Cause: Route not exported properly
// Fix: Export GET function
export async function GET(request: NextRequest, { params }: { params: Promise<{ tool: string }> }) {
  // ...
}

// ❌ Cause: Authentication blocking discovery
if (!authHeader) {
  return new Response("Unauthorized", { status: 401 }); // ❌ Wrong
}

// Fix: Remove auth from discovery
export async function GET(request: NextRequest) {
  // No auth check for discovery
  return NextResponse.json(discoveryData);
}
```

#### **A2. Wrong Content-Type Header**

**Symptoms:**
```bash
curl -I "https://domain.com/api/tools/workflow/discovery"
# content-type: text/plain  # ❌ Wrong
```

**Fix:**
```typescript
return NextResponse.json(response, {
  headers: {
    'Content-Type': 'application/json', // ✅ Ensure this is set
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  }
});
```

### **Category B: Schema/Structure Errors**

#### **B1. JSON Schema Object Instead of Parameter Array**

**Symptoms:**
```json
{
  "functions": [
    {
      "parameters": {
        "type": "object",          // ❌ Wrong format
        "properties": {...},
        "required": [...]
      }
    }
  ]
}
```

**Root Cause:** Using OpenAPI/JSON Schema format instead of OPAL format

**Fix:**
```typescript
// ❌ Wrong: JSON Schema format
function createJSONSchema(schema: any) {
  return {
    type: 'object',
    properties: schema.properties,
    required: schema.required
  };
}

// ✅ Correct: OPAL parameter array format
function createOPALParameterArray(schema: any) {
  const parameters = [];
  const requiredFields = schema.required || [];

  for (const [propName, propDef] of Object.entries(schema.properties || {})) {
    parameters.push({
      name: propName,
      type: propDef.type || 'string',
      description: propDef.description || `${propName} parameter`,
      required: requiredFields.includes(propName)
    });
  }

  return parameters;
}
```

#### **B2. Missing Required Function Fields**

**Symptoms:**
```json
{
  "functions": [
    {
      "name": "my_function",
      "description": "Does something"
      // ❌ Missing: parameters, endpoint, http_method
    }
  ]
}
```

**Fix:**
```typescript
// ✅ All required fields
const opalFunction: OPALFunction = {
  name: tool.name,
  description: tool.description,
  parameters: createOPALParameterArray(tool.input_schema), // Array format
  endpoint: `/tools/${tool.name}`,                         // Relative path
  http_method: "POST"                                      // HTTP method
};
```

#### **B3. Problematic Schema Properties**

**Symptoms:**
```json
{
  "parameters": [
    {
      "name": "param1",
      "type": "string",
      "default": "value",      // ❌ Causes parsing issues
      "enum": ["a", "b"],      // ❌ Causes parsing issues
      "examples": ["test"]     // ❌ Causes parsing issues
    }
  ]
}
```

**Fix:**
```typescript
// ✅ Clean parameter format
const cleanParameter = {
  name: propName,
  type: propDef.type || 'string',
  description: propDef.description || `${propName} parameter`,
  required: requiredFields.includes(propName)
  // ✅ NO default, enum, examples, items, etc.
};
```

### **Category C: Path & Routing Errors**

#### **C1. Absolute vs Relative Endpoint Paths**

**Symptoms:**
```json
{
  "functions": [
    {
      "endpoint": "/api/tools/my_function/execute" // ❌ Absolute path issues
    }
  ]
}
```

**Fix:**
```typescript
// ❌ Wrong: Absolute paths can break URL resolution
endpoint: `/api/tools/${toolName}/execute`

// ✅ Correct: Relative paths
endpoint: `/tools/${toolName}`
```

#### **C2. Trailing Slash Registration Issues**

**Problem:** Registering discovery URL with trailing slash changes path resolution

```bash
# ❌ Potential Issue: Discovery URL with trailing slash
https://domain.com/api/tools/workflow/discovery/

# When OPAL calls tools, it may resolve to:
https://domain.com/api/tools/workflow/discovery/tools/my_function
# Instead of:
https://domain.com/api/tools/workflow/tools/my_function
```

**Fix:** Register discovery URL without trailing slash and use relative endpoints

### **Category D: Caching & Network Issues**

#### **D1. Stale Cached Responses**

**Symptoms:**
```bash
curl -I "https://domain.com/api/tools/workflow/discovery"
# cache-control: public, max-age=300  # ❌ Caching enabled
# age: 180                            # ❌ Serving cached response
```

**Fix:**
```typescript
return NextResponse.json(response, {
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate', // ✅ Disable caching
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});
```

#### **D2. CORS Issues**

**Fix:**
```typescript
return NextResponse.json(response, {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }
});

// Also add OPTIONS handler
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
```

---

## 🧪 **Diagnostic Commands Reference**

### **Quick Health Check**
```bash
# All-in-one validation
echo "=== OPAL Discovery Health Check ===" && \
curl -s -w "Status: %{http_code}\n" "https://your-domain.com/api/tools/workflow/discovery" | tail -1 && \
curl -s -I "https://your-domain.com/api/tools/workflow/discovery" | grep -E "(content-type|cache-control)" && \
curl -s "https://your-domain.com/api/tools/workflow/discovery" | jq -r 'keys | join(", ")' && \
curl -s "https://your-domain.com/api/tools/workflow/discovery" | jq '.functions | length' && \
curl -s "https://your-domain.com/api/tools/workflow/discovery" | jq '.functions[0].parameters | type'
```

### **Deep Structure Validation**
```bash
# Validate complete structure
URL="https://your-domain.com/api/tools/workflow/discovery"

echo "Top-level keys:"
curl -s "$URL" | jq 'keys'

echo "Function keys:"
curl -s "$URL" | jq '.functions[0] | keys'

echo "Parameter format:"
curl -s "$URL" | jq '.functions[0].parameters[0]'

echo "Endpoint format:"
curl -s "$URL" | jq '.functions[0].endpoint'
```

### **Authentication Test**
```bash
# Test without authentication
curl -s -w '%{http_code}' -o /dev/null "https://your-domain.com/api/tools/workflow/discovery"

# Should return 200, not 401/403
```

---

## 🛠️ **Quick Fixes Checklist**

When encountering `'str' object has no attribute 'get'`, check these in order:

### **1. Response Format (2 minutes)**
- [ ] Returns JSON, not HTML
- [ ] Has `functions` array at top level
- [ ] Content-Type is `application/json`

### **2. Function Structure (3 minutes)**
- [ ] Each function has: `name`, `description`, `parameters`, `endpoint`, `http_method`
- [ ] Parameters is **array**, not object
- [ ] Endpoints are relative paths (`/tools/...`)

### **3. Parameter Format (5 minutes)**
- [ ] Parameters array contains objects with: `name`, `type`, `description`, `required`
- [ ] No `default`, `enum`, `examples`, `items` properties
- [ ] Required field is boolean

### **4. Infrastructure (2 minutes)**
- [ ] No authentication required on discovery
- [ ] Caching disabled (`no-cache`)
- [ ] CORS headers present

### **5. Testing (3 minutes)**
```bash
# Run diagnostic commands
curl -s "URL" | jq '.functions[0].parameters | type'
# Must return: "array"

curl -s "URL" | jq '.functions[0].parameters[0]'
# Must have: name, type, description, required fields
```

---

## 📚 **Reference Links**

- [OPAL Discovery Format Reference](./OPAL-Discovery-Format-Reference.md)
- [OPAL Integration Best Practices](./OPAL-Integration-Best-Practices.md)
- [Optimizely OPAL Documentation](https://docs.optimizely.com)

---

## 🆘 **Emergency Debugging**

**If you're getting the error right now:**

1. **Quick Test:** `curl -s "YOUR_URL" | jq '.functions[0].parameters | type'`
   - If returns `"object"`: **This is the issue** - fix parameter format
   - If returns `"array"`: Check parameter object structure

2. **Common Fix:** Replace JSON Schema format with OPAL parameter array format

3. **Deploy & Test:** Clear caches and test again

4. **Validate:** Use diagnostic commands above to confirm fix

**Most issues are parameter format problems - fix this first!**