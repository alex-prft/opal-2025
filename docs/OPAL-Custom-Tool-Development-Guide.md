# OPAL Custom Tool Development Guide

## Overview

This guide ensures all future OPAL custom tools are developed correctly to prevent the **"Discovery URL does not return valid functions data"** error and maintain compatibility with Optimizely OPAL Tools Management Service.

## Enhanced Agent Data Monitoring System

### Agent-Specific Custom Tools

The OSA system now features 9 specialized agents, each with dedicated custom tools that provide enhanced functionality and monitoring capabilities. These tools are integrated into the agent data monitoring dashboard accessible at `/engine/admin/opal-monitoring/agent-data`.

#### Current Agent Custom Tools Portfolio:

**Integration Health Monitor**:
- `integration_health_monitor`: Continuous DXP integration status and performance monitoring
- `api_performance_analyzer`: Response time analysis and bottleneck identification across all services
- `error_pattern_detector`: Pattern detection in integration errors with automated fix suggestions

**Content Review Agent**:
- `content_insight_generator`: Content performance and freshness analysis with scoring algorithms
- `content_quality_analyzer`: Quality assessment across variations and experiments with brand compliance
- `brand_compliance_checker`: Brand consistency validation and enforcement across content variations

**Geographic Audit Agent**:
- `geo_optimizer`: AI search engine visibility improvement with regional optimization
- `ai_search_optimizer`: Content optimization for AI-powered search engines (Google AI, Bing Chat, Claude)
- `regional_content_advisor`: Region-specific content recommendations and gap analysis

**Audience Suggester Agent**:
- `segment_analyzer`: Audience performance analysis with statistical validation
- `audience_performance_tracker`: Performance metrics tracking across audience segments
- `segment_discovery_engine`: New high-potential audience segment identification with targeting recommendations

**Experiment Blueprinter Agent**:
- `experiment_hypothesis_generator`: Data-driven experiment hypothesis generation with statistical frameworks
- `impact_estimation_engine`: Potential impact estimation and statistical requirement analysis
- `experiment_prioritizer`: Experiment prioritization based on impact feasibility and resource requirements

**Personalization Idea Generator Agent**:
- `personalization_strategy_generator`: Targeted personalization strategy generation with complexity analysis
- `dynamic_content_optimizer`: Content optimization for personalized experiences across touchpoints
- `engagement_prediction_model`: Engagement outcome prediction for personalization strategies with ROI modeling

**Customer Journey Agent**:
- `journey_mapping_analyzer`: Customer journey touchpoint mapping and analysis with optimization identification
- `bottleneck_identifier`: Conversion bottleneck identification in customer journeys with resolution recommendations
- `lifecycle_optimizer`: Strategy optimization for each customer lifecycle stage with performance tracking

**Roadmap Generator Agent**:
- `strategic_roadmap_builder`: Comprehensive strategic implementation roadmap creation with timeline management
- `resource_estimation_engine`: Resource requirement estimation for roadmap items with capacity planning
- `priority_matrix_generator`: Priority matrix generation for roadmap planning with dependency mapping

**CMP Organizer Agent**:
- `campaign_workflow_optimizer`: Campaign management workflow and process optimization with automation identification
- `automation_opportunity_finder`: Campaign automation opportunity identification with implementation guidance
- `performance_benchmarker`: Campaign performance benchmarking against industry standards with improvement recommendations

### Custom Tool Integration Requirements

When developing new OPAL custom tools for agent integration, ensure the following requirements are met for proper integration with the enhanced monitoring system:

**Agent Data Structure Compliance**:
```typescript
interface AgentCustomTool {
  toolName: string;           // Unique tool identifier
  description: string;        // Clear tool capability description
  category?: string;          // Tool category for organization
  version?: string;          // Tool version for compatibility tracking
  dependencies?: string[];    // Required dependencies or prerequisites
  performance_metrics?: {     // Optional performance tracking
    execution_time_ms?: number;
    success_rate?: number;
    last_execution?: string;
  };
}
```

**OSA Integration Suggestions Structure**:
```typescript
interface OSAIntegrationSuggestions {
  recommendationService: string[];      // Enhancement suggestions for recommendation algorithms
  knowledgeRetrievalService: string[];  // Improvements for knowledge base and retrieval systems
  preferencesPolicyService: string[];   // User preference and policy management enhancements
}
```

This guide ensures all future OPAL custom tools are developed correctly to prevent technical errors and maintain compatibility with the enhanced agent monitoring system.

## ⚠️ Critical Requirements

### 1. Discovery Endpoint Format

**✅ CORRECT - Use Functions Array:**
```typescript
function generateOpalDiscoveryResponse() {
  return {
    functions: [ // ← MUST be 'functions' array
      {
        name: 'your_tool_name',
        description: 'Clear description of what the tool does',
        parameters: [ // ← MUST be parameter array, not JSON Schema object
          {
            name: 'parameter_name',
            type: 'string',
            description: 'Clear parameter description',
            required: true
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
    version: '1.0.0',
    sdk_version: '@optimizely-opal/opal-tools-sdk'
  };
}
```

**❌ INCORRECT - Do NOT use Tools Object:**
```typescript
// ❌ This causes "Discovery URL does not return valid functions data"
return {
  tools: { // ← WRONG: Don't use 'tools' object
    your_tool_name: {
      function: {
        parameters: { // ← WRONG: Don't use JSON Schema format
          type: 'object',
          properties: { ... }
        }
      }
    }
  }
};
```

### 2. Parameter Format Requirements

**✅ CORRECT - OPAL Parameter Array:**
```typescript
parameters: [
  {
    name: 'workflow_id',
    type: 'string', // 'string' | 'number' | 'boolean' | 'array' | 'object'
    description: 'Unique identifier for the workflow execution',
    required: true
  },
  {
    name: 'optional_param',
    type: 'number',
    description: 'Optional numeric parameter',
    required: false
  }
]
```

**❌ INCORRECT - JSON Schema Format:**
```typescript
// ❌ This causes OPAL parsing errors
parameters: {
  type: 'object',
  properties: {
    workflow_id: {
      type: 'string',
      description: '...'
    }
  },
  required: ['workflow_id']
}
```

## Step-by-Step Development Process

### 1. Create Discovery Endpoint

**File**: `src/app/api/your-tool/discovery/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

function generateOpalDiscoveryResponse() {
  return {
    functions: [
      {
        name: 'your_tool_name',
        description: 'Detailed description of tool functionality',
        parameters: [
          // Add your parameters here using OPAL format
          {
            name: 'required_param',
            type: 'string',
            description: 'Description of required parameter',
            required: true
          },
          {
            name: 'optional_param',
            type: 'array',
            description: 'Description of optional parameter',
            required: false
          }
        ],
        endpoint: '/api/your-tool/execute',
        http_method: 'POST',
        auth_required: false,
        version: '1.0.0'
      }
    ],
    name: 'Your Tool Service Name',
    description: 'Service description',
    version: '1.0.0',
    sdk_version: '@optimizely-opal/opal-tools-sdk',
    discovery_generated_at: new Date().toISOString()
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const discoveryResponse = generateOpalDiscoveryResponse();

    return NextResponse.json(discoveryResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'discovery_endpoint_error',
      message: error instanceof Error ? error.message : 'Unknown error',
      functions: [] // Always include functions array, even on error
    }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
```

### 2. Create Tool Implementation

**File**: `src/app/api/your-tool/execute/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

interface YourToolParameters {
  required_param: string;
  optional_param?: any[];
}

interface YourToolResponse {
  status: 'success' | 'error';
  data: any;
  message: string;
  timestamp: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const parameters: YourToolParameters = await request.json();

    // Validate required parameters
    if (!parameters.required_param) {
      return NextResponse.json({
        status: 'error',
        message: 'Missing required parameter: required_param',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Implement your tool logic here
    const result = await processYourTool(parameters);

    const response: YourToolResponse = {
      status: 'success',
      data: result,
      message: 'Tool executed successfully',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function processYourTool(parameters: YourToolParameters) {
  // Implement your tool's core functionality
  return {
    processed: true,
    input: parameters.required_param,
    result: 'Your tool result here'
  };
}
```

### 3. Create Unit Tests

**File**: `tests/unit/your-tool-discovery.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/your-tool/discovery/route';
import { NextRequest } from 'next/server';

describe('Your Tool Discovery Endpoint', () => {
  it('must return functions array format (prevent OPAL error)', async () => {
    const request = new NextRequest('http://localhost:3000/api/your-tool/discovery');
    const response = await GET(request);
    const data = await response.json();

    // ✅ Critical validation: Must have functions array
    expect(data).toHaveProperty('functions');
    expect(Array.isArray(data.functions)).toBe(true);
    expect(data.functions.length).toBeGreaterThan(0);

    // ❌ Must NOT have tools object
    expect(data).not.toHaveProperty('tools');
  });

  it('parameters must use OPAL array format', async () => {
    const request = new NextRequest('http://localhost:3000/api/your-tool/discovery');
    const response = await GET(request);
    const data = await response.json();

    const parameters = data.functions[0].parameters;

    // Must be array, not object
    expect(Array.isArray(parameters)).toBe(true);

    // Each parameter must have OPAL structure
    parameters.forEach((param: any) => {
      expect(param).toHaveProperty('name');
      expect(param).toHaveProperty('type');
      expect(param).toHaveProperty('description');
      expect(param).toHaveProperty('required');
    });
  });
});
```

## Validation Checklist

Before deploying any OPAL custom tool, ensure:

### ✅ Discovery Format Validation
- [ ] Response has `functions` array (not `tools` object)
- [ ] Each function has `name`, `description`, `parameters`, `endpoint`, `http_method`
- [ ] Parameters are array format with `{name, type, description, required}`
- [ ] No JSON Schema format (`type: 'object', properties: {}`)

### ✅ Testing Requirements
- [ ] Unit tests for discovery endpoint format
- [ ] Anti-regression tests to prevent `tools` object format
- [ ] Parameter format validation tests
- [ ] Error handling maintains `functions` array consistency

### ✅ Validation Commands
```bash
# 1. Format validation
curl -s http://localhost:3000/api/your-tool/discovery | jq '.functions | length'

# 2. Parameter structure check
curl -s http://localhost:3000/api/your-tool/discovery | jq '.functions[0].parameters'

# 3. Run OPAL validation script
npx tsx scripts/validate-opal-discovery.ts --url=http://localhost:3000/api/your-tool/discovery

# 4. Run unit tests
npm run test:unit tests/unit/your-tool-discovery.test.ts
```

## Deployment Process

### 1. Development Testing
```bash
# Start development server
npm run dev

# Test discovery endpoint
curl -s http://localhost:3000/api/your-tool/discovery | jq '.'

# Validate format
npx tsx scripts/validate-opal-discovery.ts --url=http://localhost:3000/api/your-tool/discovery
```

### 2. Production Deployment
```bash
# Run tests
npm run test:unit

# Deploy to production
git add .
git commit -m "Add new OPAL custom tool: your_tool_name"
git push

# Validate production
npx tsx scripts/validate-opal-discovery.ts --url=https://your-domain.vercel.app/api/your-tool/discovery
```

### 3. OPAL Registration
1. **Discovery URL**: `https://your-domain.vercel.app/api/your-tool/discovery`
2. **Tool Endpoint**: `https://your-domain.vercel.app/api/your-tool/execute`
3. **Method**: POST
4. **Authentication**: As required by your tool

## Common Pitfalls to Avoid

### ❌ Format Errors
1. **Using `tools` object instead of `functions` array**
2. **JSON Schema parameter format instead of OPAL array format**
3. **Missing required fields in function definition**
4. **Incorrect parameter types or structure**

### ❌ Testing Errors
1. **Not testing discovery format before deployment**
2. **Missing anti-regression tests**
3. **Not validating production endpoints**

### ❌ Deployment Errors
1. **Not running validation scripts**
2. **Missing CORS headers**
3. **Incorrect endpoint paths**

## TypeScript Interfaces

```typescript
// OPAL Discovery Response Format
interface OPALDiscoveryResponse {
  functions: OPALFunction[];
  name: string;
  description: string;
  version: string;
  sdk_version: string;
  discovery_generated_at: string;
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

## Resources

- **Fix Documentation**: `docs/OPAL-Discovery-Fix-Documentation.md`
- **Validation Script**: `scripts/validate-opal-discovery.ts`
- **Unit Test Template**: `tests/unit/opal-discovery-fix.test.ts`
- **Working Example**: `src/app/api/opal/discovery/route.ts`

---

**Following this guide prevents the "Discovery URL does not return valid functions data" error and ensures all OPAL custom tools work correctly with Optimizely OPAL Tools Management Service.**