# OPAL Integration Best Practices Guide

**Version**: 1.0
**Last Updated**: November 2025
**Status**: Production Ready

## 🎯 **Overview**

This guide provides comprehensive best practices for integrating tools with Optimizely OPAL (Optimizely Platform for AI-driven Language models). Following these practices ensures reliable tool registration, prevents common errors, and maintains production stability.

---

## 📋 **Pre-Integration Checklist**

Before starting any OPAL integration:

- [ ] **Read Required Documentation**
  - [OPAL Discovery Format Reference](./OPAL-Discovery-Format-Reference.md)
  - [OPAL Troubleshooting Guide](./OPAL-Troubleshooting-Guide.md)
  - [Optimizely OPAL Documentation](https://docs.optimizely.com)

- [ ] **Set Up Development Environment**
  - Local development server running
  - OPAL validation script installed (`npm run validate:opal`)
  - CI/CD pipeline configured for validation

- [ ] **Plan Tool Architecture**
  - Define clear function boundaries
  - Identify required parameters
  - Plan authentication strategy
  - Consider rate limiting needs

---

## 🏗️ **Development Workflow**

### **Phase 1: Design & Planning**

#### **1.1 Function Design**
```typescript
// ✅ Good: Clear, focused function
interface ToolFunction {
  name: string;           // workflow_data_sharing
  purpose: string;        // "Retrieve campaign performance data"
  parameters: Parameter[];// Well-defined inputs
  output: OutputSchema;   // Clear return format
}

// ❌ Avoid: Multi-purpose functions
interface BadFunction {
  name: "do_everything";  // Too broad
  purpose: "Does various things"; // Unclear
}
```

#### **1.2 Parameter Planning**
```typescript
// ✅ Good: Simple, validated parameters
{
  name: "campaign_id",
  type: "string",
  description: "Unique identifier for the campaign",
  required: true
  // No default, enum, examples - these cause OPAL issues
}

// ❌ Avoid: Complex parameter structures
{
  name: "config",
  type: "object",
  properties: {...},      // Avoid nested objects
  default: {...},         // Causes 'str' object error
  enum: [...],           // Parsing issues
}
```

### **Phase 2: Implementation**

#### **2.1 Discovery Endpoint Structure**

**File**: `/src/app/api/tools/[tool]/discovery/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tool: string }> }
) {
  try {
    const { tool } = await params; // Next.js 15+ requires await

    // Load tool configuration
    const toolConfig = await loadToolConfig(tool);

    // Convert to OPAL format (CRITICAL: Array format, not object)
    const functions: OPALFunction[] = toolConfig.tools.map(toolDef => ({
      name: toolDef.name,
      description: toolDef.description,
      parameters: createOPALParameterArray(toolDef.input_schema), // Array!
      endpoint: `/tools/${toolDef.name.toLowerCase()}`,           // Relative!
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
        'Cache-Control': 'no-cache, no-store, must-revalidate', // CRITICAL: No caching
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error(`Discovery error for ${tool}:`, error);
    return NextResponse.json(
      {
        error: 'Discovery failed',
        message: error.message,
        tool: tool
      },
      { status: 500 }
    );
  }
}

// CRITICAL: Parameter conversion function
function createOPALParameterArray(schema: any): Array<{
  name: string;
  type: string;
  description: string;
  required: boolean;
}> {
  const parameters = [];

  if (!schema?.properties) return parameters;

  const requiredFields = schema.required || [];

  for (const [propName, propDef] of Object.entries(schema.properties)) {
    const param = propDef as any;

    // Clean parameter - no default, enum, examples, etc.
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

#### **2.2 Tool Configuration Files**

**File**: `/opal-config/opal-tools/[tool_name].json`

```json
{
  "name": "Workflow Tool",
  "description": "Manages workflow operations",
  "version": "1.0.0",
  "tools": [
    {
      "name": "workflow_data_sharing",
      "description": "Share workflow data with external systems",
      "input_schema": {
        "type": "object",
        "properties": {
          "workflow_id": {
            "type": "string",
            "description": "Unique identifier for the workflow"
          },
          "data_type": {
            "type": "string",
            "description": "Type of data to share (analytics, performance, etc.)"
          },
          "format": {
            "type": "string",
            "description": "Output format (json, csv, xml)"
          }
        },
        "required": ["workflow_id", "data_type"]
      }
    }
  ]
}
```

**✅ Configuration Best Practices:**
- Use clear, descriptive names
- Avoid nested objects in parameters
- Keep required fields minimal
- Provide helpful descriptions
- Use semantic versioning

**❌ Configuration Anti-Patterns:**
```json
{
  "input_schema": {
    "properties": {
      "config": {
        "type": "object",        // ❌ Nested objects cause issues
        "properties": {...}      // ❌ Complex structures
      },
      "options": {
        "default": "value",      // ❌ Causes 'str' object error
        "enum": ["a", "b"],      // ❌ Parsing problems
        "examples": ["test"]     // ❌ OPAL compatibility issues
      }
    }
  }
}
```

### **Phase 3: Testing & Validation**

#### **3.1 Local Testing Workflow**

```bash
# 1. Start development server
npm run dev

# 2. Test discovery endpoint directly
curl -s "http://localhost:3000/api/tools/workflow/discovery" | jq '.'

# 3. Validate OPAL format
npm run validate:opal -- --tool=workflow

# 4. Run full validation suite
npm run validate:opal

# 5. Check specific format requirements
curl -s "http://localhost:3000/api/tools/workflow/discovery" | jq '.functions[0].parameters | type'
# Must return: "array"

curl -s "http://localhost:3000/api/tools/workflow/discovery" | jq '.functions[0].parameters[0]'
# Must have: name, type, description, required fields only
```

#### **3.2 Deployment Testing**

```bash
# 1. Deploy to production
npm run deploy:prod

# 2. Test production endpoints
npm run validate:opal:prod

# 3. Verify no caching issues
curl -I "https://your-domain.com/api/tools/workflow/discovery" | grep -i cache-control
# Should show: no-cache, no-store, must-revalidate

# 4. Test authentication (discovery should be public)
curl -s -w '%{http_code}' "https://your-domain.com/api/tools/workflow/discovery"
# Should return: 200 (not 401 or 403)
```

#### **3.3 OPAL Registration Testing**

1. **Register in OPAL Interface**
   - Registry Name: `OSA Workflow Tool`
   - Discovery URL: `https://your-domain.com/api/tools/workflow/discovery`
   - Bearer Token: *(Leave empty for public discovery)*

2. **Verify Registration Success**
   - Functions appear in OPAL interface
   - Parameters are correctly displayed
   - Test function execution works

3. **Monitor for Errors**
   - Check OPAL logs for parsing errors
   - Verify no `'str' object has no attribute 'get'` errors
   - Test with various parameter combinations

---

## 🔧 **Development Environment Setup**

### **Required Scripts** (`package.json`)

```json
{
  "scripts": {
    "validate:opal": "npx tsx scripts/validate-opal-discovery.ts",
    "validate:opal:prod": "npx tsx scripts/validate-opal-discovery.ts --base-url=https://your-domain.com",
    "validate:opal:tool": "npx tsx scripts/validate-opal-discovery.ts --tool=",
    "deploy:prod": "./scripts/deploy-prod.sh"
  }
}
```

### **IDE Extensions** (VS Code)

```json
{
  "recommendations": [
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode"
  ]
}
```

### **Git Hooks** (`.husky/pre-commit`)

```bash
#!/bin/sh
npm run validate:opal
```

---

## 🚦 **CI/CD Integration**

### **GitHub Actions Workflow**

The OPAL validation workflow automatically:
- Tests discovery endpoints on every push/PR
- Validates OPAL format compliance
- Runs security checks
- Prevents deployment of broken endpoints

**Key Steps:**
1. **Build & Start**: Build app and start dev server
2. **Validate Local**: Test local endpoints
3. **Validate Production**: Test production endpoints (on main branch)
4. **Security Check**: Verify no sensitive data exposure
5. **Report Failures**: Create detailed failure reports

**Manual Trigger:**
```bash
# Trigger workflow manually with production validation
gh workflow run opal-validation.yml -f validate_production=true
```

---

## 🛡️ **Security Best Practices**

### **Discovery Endpoint Security**

#### **✅ Required: Public Discovery**
```typescript
// ✅ Correct: No authentication on discovery
export async function GET(request: NextRequest) {
  // No auth checks - discovery must be publicly accessible
  return NextResponse.json(discoveryData);
}
```

#### **❌ Wrong: Authenticated Discovery**
```typescript
// ❌ Wrong: This breaks OPAL registration
if (!request.headers.authorization) {
  return NextResponse.json({error: "Unauthorized"}, {status: 401});
}
```

### **Tool Execution Security**

#### **✅ Required: Authenticated Execution**
```typescript
// ✅ Correct: Auth required on tool execution
export async function POST(request: NextRequest) {
  const authResult = await validateAuth(request);
  if (!authResult.valid) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }

  // Execute tool...
}
```

### **Data Protection**

```typescript
// ✅ Safe: No sensitive data in discovery
const safeDiscovery = {
  functions: [{
    name: "get_analytics",
    description: "Retrieve analytics data", // Generic description
    parameters: [{
      name: "metric_type",
      description: "Type of metric to retrieve" // No examples or values
    }]
  }]
};

// ❌ Dangerous: Sensitive data exposure
const dangerousDiscovery = {
  functions: [{
    name: "get_user_data",
    api_key: "secret-key-123",           // ❌ Exposed secret
    database_url: "prod-db.internal",   // ❌ Internal URL
    examples: ["user_id=12345"]         // ❌ Real user ID
  }]
};
```

---

## 📊 **Monitoring & Observability**

### **Logging Strategy**

```typescript
// Tool execution logging
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    console.log(`[${requestId}] Tool execution started:`, {
      tool: toolName,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for')
    });

    const result = await executeTool(params);

    console.log(`[${requestId}] Tool execution completed:`, {
      tool: toolName,
      duration: Date.now() - startTime,
      success: true
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error(`[${requestId}] Tool execution failed:`, {
      tool: toolName,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    });

    throw error;
  }
}
```

### **Health Monitoring**

```typescript
// Health check endpoint
export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: process.uptime(),
    checks: {
      database: await checkDatabase(),
      external_apis: await checkExternalAPIs(),
      opal_discovery: await checkOPALFormat()
    }
  };

  const isHealthy = Object.values(health.checks).every(check => check.status === 'ok');

  return NextResponse.json(health, {
    status: isHealthy ? 200 : 503
  });
}
```

---

## 🔄 **Maintenance & Updates**

### **Regular Maintenance Tasks**

#### **Weekly**
- [ ] Run `npm run validate:opal:prod` to check production endpoints
- [ ] Review OPAL registration status in interface
- [ ] Check for any new OPAL error reports
- [ ] Verify CI/CD pipeline success rates

#### **Monthly**
- [ ] Update dependencies and test OPAL compatibility
- [ ] Review and update tool documentation
- [ ] Validate tool performance metrics
- [ ] Check for new OPAL platform features

#### **Quarterly**
- [ ] Conduct security audit of OPAL endpoints
- [ ] Review and optimize tool configurations
- [ ] Update OPAL integration documentation
- [ ] Plan new tool integrations

### **Version Management**

```json
{
  "version": "1.2.3",  // Semantic versioning
  "opal_version": "2024.11",  // Track OPAL compatibility
  "last_validated": "2024-11-08T10:30:00Z"
}
```

### **Breaking Change Management**

When OPAL format requirements change:

1. **Test New Format** in development environment
2. **Update Validator Script** to check new requirements
3. **Update Documentation** with new examples
4. **Deploy with Feature Flags** to enable gradual rollout
5. **Monitor Registration Success** rates after deployment

---

## 📚 **Resource Library**

### **Quick Reference Commands**

```bash
# Development
npm run dev                          # Start dev server
npm run validate:opal               # Validate all local tools
npm run validate:opal -- --tool=X  # Validate specific tool

# Testing
curl -s "URL/discovery" | jq '.'                    # View discovery response
curl -s "URL/discovery" | jq '.functions[0].parameters | type' # Check format

# Production
npm run deploy:prod                 # Deploy to production
npm run validate:opal:prod         # Validate production endpoints

# Troubleshooting
curl -I "URL/discovery"            # Check headers
curl -s -w '%{http_code}' "URL"    # Check status code
```

### **Common Error Solutions**

| Error | Cause | Solution |
|-------|-------|----------|
| `'str' object has no attribute 'get'` | JSON Schema format instead of array | Use `createOPALParameterArray()` |
| `404 Not Found` | Missing API route | Create `/api/tools/[tool]/discovery/route.ts` |
| `Discovery URL does not return valid functions` | Missing `functions` array | Ensure top-level `functions` field |
| `Functions not loading` | Caching issues | Add `no-cache` headers |
| `Unauthorized` | Auth on discovery | Remove auth from discovery endpoint |

### **Documentation Links**

- **Project Documentation**
  - [OPAL Discovery Format Reference](./OPAL-Discovery-Format-Reference.md)
  - [OPAL Troubleshooting Guide](./OPAL-Troubleshooting-Guide.md)

- **External Resources**
  - [Optimizely OPAL Documentation](https://docs.optimizely.com)
  - [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
  - [Vercel Deployment](https://vercel.com/docs)

---

## 🏆 **Success Checklist**

Before marking an OPAL integration as complete:

### **Development Checklist**
- [ ] Tool configuration follows JSON schema standards
- [ ] Discovery endpoint returns correct OPAL format
- [ ] Parameters use array format (not JSON Schema objects)
- [ ] Endpoints use relative paths
- [ ] No caching on discovery responses
- [ ] Comprehensive error handling implemented
- [ ] Security measures in place

### **Testing Checklist**
- [ ] Local validation passes (`npm run validate:opal`)
- [ ] Production validation passes (`npm run validate:opal:prod`)
- [ ] CI/CD pipeline passes all checks
- [ ] OPAL registration succeeds without errors
- [ ] Tool execution works in OPAL interface
- [ ] No `'str' object has no attribute 'get'` errors

### **Documentation Checklist**
- [ ] Tool purpose and usage documented
- [ ] Parameter descriptions are clear and helpful
- [ ] Examples provided for complex use cases
- [ ] Troubleshooting guide updated if needed
- [ ] Change log updated with new features

### **Production Checklist**
- [ ] Deployed to production environment
- [ ] Health checks passing
- [ ] Monitoring alerts configured
- [ ] Performance metrics baseline established
- [ ] Rollback plan documented

---

## 🎯 **Key Success Factors**

### **The Golden Rules**

1. **Always Use Parameter Arrays**: Never use JSON Schema objects for parameters
2. **Keep Discovery Public**: No authentication on discovery endpoints
3. **Use Relative Endpoints**: Avoid absolute paths in endpoint definitions
4. **Disable Caching**: Always use `no-cache` headers on discovery
5. **Validate Everything**: Use automated validation in development and CI/CD
6. **Test in OPAL**: Always test actual registration in OPAL interface
7. **Monitor Continuously**: Set up alerts for registration failures

### **Success Metrics**

- **Registration Success Rate**: 100% of tools register without errors
- **Discovery Response Time**: < 500ms for all discovery endpoints
- **Uptime**: 99.9% availability for discovery endpoints
- **Error Rate**: 0% `'str' object has no attribute 'get'` errors
- **CI/CD Success**: 100% validation pass rate in automated tests

**Remember**: OPAL integration success is measured by reliability and ease of use. Following these best practices ensures your tools work seamlessly with the OPAL platform and provide value to end users.