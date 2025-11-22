# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Phase 1 OPAL Integration: Production Readiness Status

**Last Reviewed**: 2025-11-22
**Review Type**: Comprehensive Code Review & Phase 1 OPAL Integration Validation
**Reviewer**: code-review-debugger agent

### ✅ DEPLOYMENT STATUS: CONDITIONALLY READY FOR PRODUCTION

**Phase 1 OPAL Integration**: ✅ **COMPLETE AND PRODUCTION-READY**

**Critical Path Validation**:
- ✅ `/api/force-sync/trigger` - Production-grade with auth, concurrency control, correlation tracking
- ✅ `/api/webhooks/opal-workflow` - Enterprise webhook receiver with HMAC, idempotency, persistence
- ✅ `/api/opal/workflows/[agent]/output` - Bulletproof with 3-tier fallback, never returns 500
- ✅ `WorkflowDatabaseOperations` - Performance guardrails, query limits, graceful degradation

**Build Status**:
- ✅ Production build: **PASSING** (193 pages, 34.6s compile time)
- ✅ Static generation: **WORKING** (4.3s for all pages)
- ✅ React hook safety: **VALIDATED** (all OPAL components use 'use client')
- ⚠️ TypeScript errors: ~30 remaining (down from 1,798) - non-blocking

**Security Score**: 32/41 (78%) - Requires environment configuration to reach 41/41

**Remaining Work Before Production**:
1. **P1 - REQUIRED**: Environment variable configuration (1-2 hours)
   - Set OPAL_WEBHOOK_AUTH_KEY, API_SECRET_KEY, JWT_SECRET
   - Configure Supabase credentials
   - Run `npm run validate:security` to confirm 41/41 checks

**Fast-Track to Production**: 2-3 hours
**Comprehensive Validation**: 2-3.5 business days

**Detailed Report**: See `/Users/alexharris/Documents/AI-Dev/my-nextjs-app-claude/docs/ai/error-catalog.md`

---

## Project Overview

OSA (Optimizely Strategy Assistant) is an AI-powered strategy assistant for Optimizely DXP customers built with Next.js 16. It provides personalized recommendations, strategy insights, and implementation roadmaps with comprehensive Optimizely ecosystem integration and OPAL workflow automation.

## Development Commands

### Core Development
- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Testing
- `npm run test` - Run Jest unit tests
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run test:integration` - Run integration tests

### Validation & Quality Assurance
- `npm run validate:all` - Run all validation checks
- `npm run validate:security` - Security validation
- `npm run error-check` - **Critical**: Identify deployment-blocking errors (always run before Git push)
- `npm run pre-deploy` - Complete pre-deployment validation suite

### OPAL & Production Tools
- `npm run start:opal-tools` - Start OPAL SDK tools
- `npm run deploy:prod` - Deploy to production via script

### Worktree & Sprint Management
- `/worktrees:new-sprint` - **Automated Sprint Reset**: Safely sync worktree to latest `origin/main`
  - Preserves uncommitted work with auto-commit before reset
  - Force-pushes clean branch state to remote
  - Use at start of development sprints for clean base

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 16.0.1 with App Router
- **Language**: TypeScript with strict mode
- **UI**: React 19, Tailwind CSS, Radix UI components
- **Database**: Supabase (PostgreSQL) with enterprise guardrails
- **Caching**: Redis (ioredis)
- **Messaging**: Kafka with Confluent Schema Registry
- **Testing**: Jest, Vitest, Playwright
- **Deployment**: Vercel with environment-specific configurations

### Key Directory Structure
```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # Backend API endpoints
│   └── engine/            # Core business logic engines
├── components/            # React UI components
│   ├── ui/               # Base UI components (Radix-based)
│   ├── opal/             # OPAL-specific components
│   └── widgets/          # Specialized dashboard widgets
├── lib/                  # Core utilities and services
│   ├── opal/             # OPAL integration utilities
│   ├── database/         # Secure database interaction layers
│   ├── compliance/       # PII protection and GDPR systems
│   ├── monitoring/       # Prometheus metrics and analytics
│   └── validation/       # Data validation systems
└── types/                # TypeScript type definitions
```

## Specialized Agent System

### Available Agents & Usage Instructions

The Claude Code system provides specialized agents for complex tasks. **Always use TodoWrite to track agent invocations** and their outcomes for visibility and quality control.

#### Agent Catalog

**1. general-purpose Agent**
- **Purpose**: Research complex questions, search code, execute multi-step tasks
- **When to Use**: When you need comprehensive codebase analysis or multi-step research
- **Tools Available**: All tools (comprehensive access)

**2. Explore Agent**
- **Purpose**: Fast codebase exploration with configurable thoroughness
- **When to Use**: Finding files by patterns, searching keywords, understanding architecture
- **Thoroughness Levels**: "quick", "medium", "very thorough"
- **Tools Available**: All tools

**3. Plan Agent**
- **Purpose**: Fast codebase exploration and planning (similar to Explore)
- **When to Use**: Planning implementation approaches, architectural analysis
- **Thoroughness Levels**: "quick", "medium", "very thorough"
- **Tools Available**: All tools

**4. results-content-optimizer Agent**
- **Purpose**: Optimize Results page content across 4 major sections (Strategy Plans, Experience Optimization, Analytics Insights, DXP Tools)
- **When to Use**: Results page content needs alignment, optimization, or enhancement
- **Tools Available**: All tools

**5. opal-integration-validator Agent**
- **Purpose**: Validate end-to-end OPAL integration pipeline after Force Sync operations
- **When to Use**: Force Sync validation, integration health monitoring, pipeline quality control
- **Tools Available**: All tools

**6. statusline-setup Agent**
- **Purpose**: Configure Claude Code status line settings
- **When to Use**: Setting up or modifying status line display
- **Tools Available**: Read, Edit

## OPAL Agent Configuration Standards

### 🔥 MANDATORY: OPAL Integration Validation Requirements

**Critical integration patterns discovered through production debugging (2025-11-20, validated 2025-11-21):**

#### ✅ 1. Tool Name Validation Requirements
**REQUIRED**: Tool names in agent configurations must exactly match API endpoint paths:

```typescript
// ✅ CORRECT: Tool name matches endpoint path
"enabled_tools": ["osa_send_data_to_osa_webhook"]
// Must correspond to: /api/tools/osa_send_data_to_osa_webhook/route.ts

// ❌ WRONG: Tool name mismatch causes integration failure
"enabled_tools": ["send_data_to_osa_enhanced"]
// Agent expects osa_send_data_to_osa_webhook but calls send_data_to_osa_enhanced
```

**Validation Process:**
1. **Before any OPAL agent changes**: Use `opal-integration-validator` agent for end-to-end validation
2. **Tool Discovery Check**: Verify `/api/tools/{tool_name}/route.ts` exists for each enabled_tools entry
3. **Integration Health**: Target score 95/100+ (previous failure scored 85/100 due to missing endpoint)

#### ✅ 2. Wrapper Endpoint Pattern for Integration Mismatches
**PREFERRED SOLUTION**: When tool name mismatches occur, create wrapper endpoints instead of modifying agent configurations:

```typescript
// PREFERRED: Create wrapper that bridges the gap
// File: /api/tools/osa_send_data_to_osa_webhook/route.ts
export async function POST(request: NextRequest) {
  // Transform OPAL parameters to Enhanced Tools format
  const enhancedToolRequest = {
    tool_name: 'send_data_to_osa_enhanced',
    parameters: transformOpalToEnhanced(opalParams)
  };

  // Delegate to existing implementation
  return fetch('/api/opal/enhanced-tools', {
    method: 'POST',
    body: JSON.stringify(enhancedToolRequest)
  });
}

// AVOID: Changing all agent configurations (high risk, coordination overhead)
```

**Benefits of Wrapper Pattern:**
- ✅ Preserves existing working infrastructure (`send_data_to_osa_enhanced`)
- ✅ Zero impact on other integration modes (strategy workflows)
- ✅ Single file change vs 9+ agent configuration updates
- ✅ Maintains backward compatibility with OPAL tool specifications

#### ✅ 3. Mandatory Correlation ID Tracking
**REQUIRED**: All webhook and integration endpoints must implement correlation ID tracking for debugging:

```typescript
// REQUIRED: Generate correlation ID at request entry
const correlationId = `opal-webhook-${Date.now()}-${Math.random().toString(36).substring(7)}`;

// REQUIRED: Log at key integration points
console.log('🚀 [OPAL Webhook Tool] Request received', { correlationId });
console.log('📤 [OPAL Webhook Tool] Calling enhanced tools', { correlationId });
console.log('✅ [OPAL Webhook Tool] Success', { correlationId });

// REQUIRED: Include in response headers
return NextResponse.json(data, {
  headers: {
    'X-Correlation-ID': correlationId,
    'X-Processing-Time': processingTime.toString()
  }
});
```

**Correlation ID Standards:**
- **Format**: `{service}-{timestamp}-{random}` (e.g., `opal-webhook-1732123456-abc7def`)
- **Propagation**: Forward through all service calls via `X-Correlation-ID` header
- **Logging**: Include in all console.log statements for request tracing
- **Response**: Always return in response headers for client debugging

#### ✅ 4. Requirements Gathering Framework for Complex Integration Issues
**MANDATORY PROCESS**: For integration failures, follow structured discovery approach:

```typescript
// Phase 1: Discovery & Scope Assessment (30 minutes)
TodoWrite([
  { content: "Use Explore agent to analyze integration components", status: "pending" },
  { content: "Run opal-integration-validator for current health baseline", status: "pending" },
  { content: "Document current error messages and failure points", status: "pending" }
]);

// Phase 2: Root Cause Analysis (30-60 minutes)
TodoWrite([
  { content: "Compare agent configurations vs actual API endpoints", status: "pending" },
  { content: "Validate authentication flow and parameter schemas", status: "pending" },
  { content: "Identify integration health score and specific failure modes", status: "pending" }
]);

// Phase 3: Solution Implementation (2-4 hours)
TodoWrite([
  { content: "Implement preferred solution (wrapper pattern vs config changes)", status: "pending" },
  { content: "Add comprehensive testing and validation", status: "pending" },
  { content: "Use opal-integration-validator to confirm 95/100+ health score", status: "pending" },
  { content: "Use CLAUDE.md checker to validate all changes", status: "pending" }
]);
```

**Requirements Documentation Structure:**
- Create `requirements/{date}-{issue-id}/` directory with systematic analysis
- Include: problem analysis, root cause discovery, implementation plan, validation results
- Target: Transform integration issues from "I don't know" responses into actionable technical plans

#### ✅ 5. opal-integration-validator Agent Usage Requirements
**MANDATORY**: Use `opal-integration-validator` agent for all OPAL-related changes:

```typescript
// REQUIRED: Before any OPAL agent configuration changes
Task({
  subagent_type: "opal-integration-validator",
  description: "Validate OPAL integration health",
  prompt: "Perform comprehensive end-to-end validation of OPAL integration pipeline after Force Sync operations"
});

// REQUIRED: After implementing integration fixes
Task({
  subagent_type: "opal-integration-validator",
  description: "Confirm integration health improvement",
  prompt: "Validate that integration health score improved from baseline and all endpoints are functional"
});
```

**Agent Usage Patterns:**
- **Proactive Validation**: Run before making changes to establish baseline health score
- **Post-Implementation**: Confirm fixes achieve 95/100+ integration health score
- **Troubleshooting**: Use when integration failures occur to identify specific issues
- **Quality Gates**: Required validation step for all OPAL integration work

#### ✅ 6. Template Literal Safety Guidelines for Next.js API Routes
**CRITICAL**: Prevent Turbopack compilation failures with proper conditional syntax:

```typescript
// ✅ CORRECT: Use standard JavaScript logical operators
if (!workflow_id || !requesting_agent) {
  return NextResponse.json({ success: false, error: "Missing required parameters" });
}

// ❌ WRONG: Backslash escaping causes "Expected unicode escape" compilation errors
if (\!workflow_id || \!requesting_agent) {  // Will fail to compile
  // Never use backslash escaping with logical operators in Next.js API routes
}
```

**Template Literal Safety Rules:**
- **Never use** `\!` - Use `!` for logical NOT operations
- **Never use** `\&&` - Use `&&` for logical AND operations
- **Never use** `\||` - Use `||` for logical OR operations
- **Test compilation** immediately after API route changes with `npm run dev`
- **Validation**: All API routes must compile without "Expected unicode escape" errors

#### ✅ 7. Performance Guardrails for OPAL Operations
**MANDATORY**: Protect system performance during OPAL integration work:

```typescript
// ✅ PREFERRED: Targeted operations
curl -s -I http://localhost:3000/api/tools/{specific_endpoint}  // Test single endpoint
grep -r "correlation.*id" src/app/api/tools/                    // Targeted search

// ⚠️ USE SPARINGLY: Expensive operations (ask user first)
find . -name "*.ts" -exec grep -l "pattern" {} \;             // Full repo search
npm audit fix --force                                          // Dependency changes
```

**Performance Protection Rules:**
- **Always ask user permission** before repository-wide searches or mass file operations
- **Prefer targeted validation** over comprehensive system scans
- **Use correlation ID tracking** to monitor performance impact of integration changes
- **Monitor response times** - target <50ms for OPAL wrapper endpoints
- **Avoid debug logging in production** - use environment-aware logging patterns

### 🔥 MANDATORY: 5 Core Requirements for All OPAL Agents

**Every OPAL agent configuration in `opal-config/opal-agents/` must implement these 5 standards:**

#### ✅ 1. Data-Driven Specificity Requirements
**REQUIRED**: All agents must include "Critical Data-Driven Requirements" section mandating actual DXP data sources:

```typescript
// ✅ CORRECT: Data-driven recommendations
"Based on ODP trait 'Industry_Role:Buyer' (12,450 members), create targeted navigation"
"Content topic 'Food Safety' shows 2.3x engagement vs baseline - expand this theme"
"Homepage experiment #4521 achieved 18% lift - apply to product pages"

// ❌ WRONG: Generic marketing advice
"Improve your value proposition"
"Consider A/B testing your homepage"
"Segment your audience by demographics"
```

#### ✅ 2. Standardized Confidence Calculation
**REQUIRED**: 4-tier confidence framework based on data availability (not reasoning quality):

- **80-100**: Complete DXP data available (ODP segments, CMS analytics, experiment results)
- **60-79**: Partial DXP data available, some performance benchmarks
- **40-59**: Limited DXP data, early-stage implementation
- **0-39**: Minimal DXP data available, theoretical recommendations

#### ✅ 3. Mandatory Language Rules Validation
**REQUIRED**: Change validation from optional to mandatory:

```json
"Before generating final JSON output, CALL `osa_validate_language_rules` tool MANDATORY"
```

#### ✅ 4. Clear Mode Detection Requirements
**REQUIRED**: Explicit dual-mode behavior with clear triggers:

- **Data Mode**: Triggered via `osa_retrieve_workflow_context` or OSA webhook → Pure JSON output
- **Chat Mode**: Direct user conversation → Natural language + Canvas visualizations
- **Mode Verification**: Always check context to determine appropriate response format

#### ✅ 5. Explicit Business Context Integration
**REQUIRED**: Replace generic placeholders with specific FreshProduce.com/IFPA business context:

- Industry: Fresh produce professional association (IFPA)
- Key Segments: Commercial Buyers, Produce Suppliers/Growers, Industry Professionals
- Target Personas: Strategic Buyer Sarah, Innovation-Focused Frank, Compliance-Conscious Carol
- Primary KPIs: Membership conversion rate, content engagement score, event registration rate

### Multi-Agent Update Patterns

#### ✅ Systematic Configuration Updates
**When updating multiple OPAL agents:**

```typescript
// REQUIRED: Track progress across all agents
TodoWrite([
  { content: "Apply improvement X to all 9 agents", status: "in_progress", activeForm: "Applying improvement X to all 9 agents" },
  { content: "Validate configurations with opal-integration-validator", status: "pending", activeForm: "Validating configurations with opal-integration-validator" },
  { content: "Use CLAUDE.md checker to validate all changes", status: "pending", activeForm: "Using CLAUDE.md checker to validate all changes" }
]);
```

#### ✅ Performance-Conscious Configuration Updates
**PREFERRED**: Use targeted regex replacements over full file rewrites
- Minimizes risk of syntax errors or breaking integrations
- Maintains precise control over changes
- Safer for production configurations

#### ✅ Validation Best Practices
**REQUIRED**: Always validate with specialized agents AND direct verification:

1. Use `opal-integration-validator` for domain-specific validation
2. Cross-reference results with direct search/grep for confirmation
3. Validation agents may miss successful implementations due to pattern matching

### Business Context Integration Requirements

**FreshProduce.com/IFPA Context Standards:**
- **Industry Focus**: Fresh produce professional association serving IFPA members
- **Target Segments**: Must reference specific segments (Commercial Buyers, Suppliers/Growers, Industry Professionals, Association Members)
- **Persona Integration**: Recommendations should align with Strategic Buyer Sarah, Innovation-Focused Frank, Compliance-Conscious Carol, Executive Leader Linda
- **Content Pillars**: Industry Intelligence, Operational Excellence, Regulatory Compliance, Innovation & Technology, Professional Development
- **KPI Alignment**: All recommendations should tie to membership conversion, content engagement, event registration, or member retention

## Mandatory Task Management & Quality Control

### Universal Requirements for All Development Work

#### 🔥 MANDATORY: Every Todo List Must End with CLAUDE.md Validation
**This is non-negotiable for all development tasks, deployments, and feature work.**

```typescript
// ✅ CORRECT: Always end todo lists with validation
TodoWrite([
  { content: "Complete feature implementation", status: "completed", activeForm: "Completing feature implementation" },
  { content: "Write tests for new functionality", status: "completed", activeForm: "Writing tests for new functionality" },
  { content: "Use CLAUDE.md checker to validate all changes", status: "pending", activeForm: "Using CLAUDE.md checker to validate all changes" }
]);

// ❌ WRONG: Missing mandatory final validation
TodoWrite([
  { content: "Complete feature", status: "completed", activeForm: "Completing feature" }
  // Missing CLAUDE.md validation - VIOLATION
]);
```

#### 🔥 MANDATORY: Quality Control Agents at Stop Points & New Features
**For significant changes, new features, or deployment milestones, always include quality control validation.**

```typescript
// ✅ CORRECT: Quality control for major changes
TodoWrite([
  { content: "Implement new Results widget", status: "completed", activeForm: "Implementing new Results widget" },
  { content: "Deploy to staging environment", status: "completed", activeForm: "Deploying to staging environment" },
  { content: "Run results-content-optimizer for quality control", status: "pending", activeForm: "Running results-content-optimizer for quality control" },
  { content: "Run opal-integration-validator for pipeline validation", status: "pending", activeForm: "Running opal-integration-validator for pipeline validation" },
  { content: "Use CLAUDE.md checker to validate all changes", status: "pending", activeForm: "Using CLAUDE.md checker to validate all changes" }
]);
```

#### 🔥 MANDATORY: Production Build Validation Required
**Every significant change must include production build validation to prevent deployment failures.**

```typescript
// ✅ CORRECT: Always include build validation
TodoWrite([
  { content: "Implement React hook safety fixes", status: "completed", activeForm: "Implementing React hook safety fixes" },
  { content: "Test production build passes (npm run build)", status: "pending", activeForm: "Testing production build passes" },
  { content: "Use CLAUDE.md checker to validate all changes", status: "pending", activeForm: "Using CLAUDE.md checker to validate all changes" }
]);

// ❌ WRONG: Missing build validation
TodoWrite([
  { content: "Update context provider", status: "completed", activeForm: "Updating context provider" }
  // Missing production build test - VIOLATION
]);
```

**When to Apply**:
- Any changes to React hooks, context providers, or components
- Modifications to build configuration (next.config.js, package.json)
- New dependencies or import changes
- Changes to layout.tsx or global components

**Why It Matters**:
- Prevents `TypeError: Cannot read properties of null (reading 'useState')` build failures
- Catches static generation issues before deployment
- Ensures all React hooks are properly guarded
- Validates Next.js 16 compatibility

#### 🔥 MANDATORY: Agent Usage Must Be Tracked
**All agent invocations must be tracked with TodoWrite for visibility and accountability.**

```typescript
// ✅ CORRECT: Full agent tracking
TodoWrite([
  { content: "Launch Explore agent for component analysis", status: "in_progress", activeForm: "Launching Explore agent for component analysis" },
  { content: "Review agent findings and implement changes", status: "pending", activeForm: "Reviewing agent findings and implementing changes" },
  { content: "Use CLAUDE.md checker to validate all changes", status: "pending", activeForm: "Using CLAUDE.md checker to validate all changes" }
]);
Task({ subagent_type: "Explore", description: "Analyze component architecture", prompt: "..." });

// ❌ WRONG: Agent without tracking
Task({ subagent_type: "Explore", prompt: "Find components" }); // No TodoWrite tracking - VIOLATION
```

### Agent Usage Best Practices

#### ✅ Always Use TodoWrite for Agent Tracking
```typescript
// REQUIRED: Track agent invocations for visibility
TodoWrite([
  { content: "Launch Explore agent for OPAL analysis", status: "in_progress", activeForm: "Launching Explore agent for OPAL analysis" },
  { content: "Review agent findings and implement recommendations", status: "pending", activeForm: "Reviewing agent findings and implementing recommendations" },
  { content: "Use CLAUDE.md checker to validate changes", status: "pending", activeForm: "Using CLAUDE.md checker to validate changes" }
]);
```

#### ✅ End Every Todo List with CLAUDE.md Checker
**MANDATORY PATTERN**: Every todo list must end with CLAUDE.md validation:
```typescript
// REQUIRED: Final todo item for all task lists
{ content: "Use CLAUDE.md checker to validate all changes", status: "pending", activeForm: "Using CLAUDE.md checker to validate all changes" }
```

#### ✅ Use Quality Control Agents at Stop Points
**MANDATORY PATTERN**: For new features or significant changes, always include quality control validation:
```typescript
// REQUIRED: Quality control at major milestones
TodoWrite([
  { content: "Implement new feature", status: "completed", activeForm: "Implementing new feature" },
  { content: "Run opal-integration-validator for quality control", status: "pending", activeForm: "Running opal-integration-validator for quality control" },
  { content: "Use results-content-optimizer to ensure content alignment", status: "pending", activeForm: "Using results-content-optimizer to ensure content alignment" },
  { content: "Use CLAUDE.md checker to validate all changes", status: "pending", activeForm: "Using CLAUDE.md checker to validate all changes" }
]);
```

## Data Pipeline Integration Patterns

### 🔥 OPAL Data Pipeline Debugging Protocol (2025-11-20 Session)

**Critical Issue Pattern**: OPAL agents execute successfully with proper Results page JSON format, but API endpoints return different hardcoded mock data instead of real execution results.

#### ✅ 1. Data Pipeline Discrepancy Detection
**MANDATORY WORKFLOW**: When investigating execution vs API data mismatches:

```typescript
// Phase 1: Verify OPAL Execution Data (5-10 minutes)
TodoWrite([
  { content: "Check OPAL execution logs for successful agent runs", status: "pending", activeForm: "Checking OPAL execution logs for successful agent runs" },
  { content: "Verify execution results structure matches expected Results page format", status: "pending", activeForm: "Verifying execution results structure matches expected Results page format" },
  { content: "Document actual execution data vs API endpoint response", status: "pending", activeForm: "Documenting actual execution data vs API endpoint response" }
]);

// Phase 2: Database Integration Analysis (15-20 minutes)
TodoWrite([
  { content: "Check if API endpoint queries database or returns mock data", status: "pending", activeForm: "Checking if API endpoint queries database or returns mock data" },
  { content: "Verify database table structure and recent execution records", status: "pending", activeForm: "Verifying database table structure and recent execution records" },
  { content: "Implement database-first API pattern with graceful fallback", status: "pending", activeForm: "Implementing database-first API pattern with graceful fallback" }
]);
```

#### ✅ 2. Database Integration Safety Patterns
**REQUIRED**: All OPAL data APIs must implement database-first pattern with mock fallback:

```typescript
// ✅ CORRECT: Database-first with graceful fallback
// NOTE: getLatestAgentExecution() method should be added to WorkflowDatabaseOperations class
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let agentData: any = null;
  let dataSource = 'unknown';

  try {
    // Try to get real OPAL execution data from database first
    const dbOps = new WorkflowDatabaseOperations();
    const realExecution = await dbOps.getLatestAgentExecution(agentId);

    if (realExecution && realExecution.agent_data) {
      agentData = {
        dataSentToOSA: realExecution.agent_data,
        execution_metadata: {
          execution_id: realExecution.execution_id,
          workflow_id: realExecution.workflow_id,
          data_source: 'opal_database'
        }
      };
      dataSource = 'opal_database';
    }
  } catch (dbError) {
    console.warn(`⚠️ [Agent Data API] Database query failed for ${agentId}, falling back to mock data:`, dbError);
  }

  // Fallback to mock data if no real data available
  if (!agentData) {
    const mockData = AGENT_DATA[agentId as keyof typeof AGENT_DATA];
    agentData = mockData;
    dataSource = 'mock_data';
  }

  return NextResponse.json({
    success: true,
    agent_id: agentId,
    ...agentData,
    _metadata: {
      data_source: dataSource,  // CRITICAL: Always indicate data source
      processing_time_ms: Date.now() - startTime,
      timestamp: new Date().toISOString()
    }
  });
}

// ❌ WRONG: Mock-only API without database integration
export async function GET(request: NextRequest) {
  const mockData = AGENT_DATA[agentId];  // Never queries real data
  return NextResponse.json(mockData);
}
```

#### ✅ 3. API Response Metadata Standards
**MANDATORY**: All API endpoints must include debugging and monitoring metadata:

```typescript
// REQUIRED: Standard metadata structure
const responseMetadata = {
  data_source: 'opal_database' | 'mock_data' | 'cache' | 'fallback',
  processing_time_ms: number,
  timestamp: string (ISO),
  correlation_id?: string,        // For distributed tracing
  query_performance?: {           // For database queries
    records_found: number,
    query_time_ms: number
  },
  cache_info?: {                  // For cached responses
    cache_hit: boolean,
    cache_age_ms: number
  }
};

// REQUIRED: Response format with metadata
return NextResponse.json({
  success: true,
  // ... actual response data
  _metadata: responseMetadata
}, {
  headers: {
    'X-Data-Source': dataSource,
    'X-Processing-Time': processingTime.toString(),
    'X-Correlation-ID': correlationId || 'none'
  }
});
```

#### ✅ 4. Database Query Performance Guardrails
**MANDATORY**: All database operations must include performance safeguards:

```typescript
// ✅ CORRECT: Performance-safe database queries
async getLatestAgentExecution(agentName: string, limit: number = 1): Promise<any> {
  const startTime = Date.now();

  try {
    console.log(`🔍 [DB] Retrieving latest ${limit} execution(s) for agent: ${agentName}`);

    const { data: executions, error } = await supabase
      .from('opal_agent_executions')
      .select(`*,opal_workflows!inner(workflow_id,session_id,status,created_at)`)
      .eq('agent_name', agentName)
      .eq('status', 'completed')          // CRITICAL: Filter for performance
      .order('created_at', { ascending: false })
      .limit(limit);                      // CRITICAL: Always use limits

    if (error) throw error;

    const queryTime = Date.now() - startTime;
    console.log(`✅ [DB] Query completed in ${queryTime}ms, found ${executions?.length || 0} executions`);

    return executions?.[0] || null;
  } catch (error) {
    const queryTime = Date.now() - startTime;
    console.error(`❌ [DB] Query failed after ${queryTime}ms:`, error);
    throw error;
  }
}

// ❌ WRONG: Unoptimized database queries
async getAgentData(agentName: string) {
  const { data } = await supabase
    .from('opal_agent_executions')
    .select('*')                         // No specific filtering
    .eq('agent_name', agentName);        // No limit, no status filter
  return data;                           // Could return thousands of records
}
```

#### ✅ 5. Import Management Rules
**CRITICAL**: Prevent compilation failures from duplicate imports:

```typescript
// ✅ CORRECT: Consolidated imports
import { NextRequest, NextResponse } from 'next/server';
import { WorkflowDatabaseOperations } from '@/lib/database/workflow-operations';

// ❌ WRONG: Duplicate imports cause compilation errors
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';  // Duplicate import
import { NextRequest, NextResponse } from 'next/server';  // Another duplicate

// REQUIRED: Import validation before commits
// Check with: npx tsc --noEmit | grep "duplicate identifier"
```

## Production Hotfix Patterns

### 🔥 MANDATORY: Configuration-First Debugging for API 404 Errors

**Critical Pattern Discovered**: When API endpoints return 404 in production, always check configuration files before searching for missing implementations. Security measures often inadvertently block legitimate endpoints.

**Production API 404 Troubleshooting Protocol:**
```typescript
// Phase 1: Configuration Validation (5 minutes)
TodoWrite([
  { content: "Check next.config.js rewrite rules for overly broad patterns", status: "in_progress", activeForm: "Checking next.config.js rewrite rules" },
  { content: "Verify API route exists and compiles successfully", status: "pending", activeForm: "Verifying API route existence" },
  { content: "Test endpoint in development vs production mode", status: "pending", activeForm: "Testing endpoint across environments" }
]);

// Phase 2: Surgical Fix Implementation (10-15 minutes)
TodoWrite([
  { content: "Apply targeted regex fix to preserve security while enabling API access", status: "pending", activeForm: "Applying surgical configuration fix" },
  { content: "Validate production build includes API routes", status: "pending", activeForm: "Validating production build" },
  { content: "Test both positive (blocks UI) and negative (allows API) cases", status: "pending", activeForm: "Testing configuration edge cases" }
]);
```

#### ✅ Next.js Security Pattern for Selective Route Blocking
**REQUIRED**: Use negative lookahead regex to block admin UI while preserving API access:

```typescript
// ✅ CORRECT: Selective blocking with negative lookahead
{
  source: '/admin/:path((?!api).*)',  // Blocks UI, allows API
  destination: '/404',
},

// ❌ WRONG: Overly broad pattern blocks everything
{
  source: '/admin/:path*',  // Blocks ALL admin routes including API
  destination: '/404',
},

// VALIDATION: Test patterns
// Should Block: /admin/dashboard, /admin/users, /admin/settings
// Should Allow: /api/admin/osa/integration-status, /api/admin/health
```

#### ✅ Worktree Context Verification Protocol
**MANDATORY**: Always verify current working context before implementing hotfixes:

```bash
# REQUIRED: Verify worktree context before any changes
cd "/correct/worktree/path" && git branch --show-current
pwd  # Confirm directory matches intended target

# PATTERN: Deployment orchestrator handles transitions safely
Task({
  subagent_type: "deployment-orchestrator",
  description: "Switch to bugfix worktree",
  prompt: "Handle worktree transition to bugfix-lab for hotfix implementation"
});
```

#### ✅ Production Build vs Linting Distinction
**CRITICAL**: During hotfixes, distinguish between compilation success and linting failures:

```bash
# LOOK FOR: Compilation success indicator (deployment-ready)
✓ Compiled successfully

# IGNORE DURING HOTFIXES: Linting errors (address separately)
Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

# PATTERN: Filter build output for deployment-critical information
npm run build | grep -E "(api/admin|Route:|build:|Failed|✓)"
```

#### ✅ Hotfix Quality Standards Balance
**REQUIRED**: Emergency fixes prioritize functionality restoration over perfect code quality:

- **Compilation Success**: MANDATORY - fixes must build and deploy
- **Security Preservation**: MANDATORY - maintain existing security measures
- **Targeted Changes**: PREFERRED - minimal, surgical modifications
- **Comprehensive Testing**: REQUIRED - verify both positive and negative cases
- **Linting Perfection**: DEFERRED - address in separate quality improvement cycles

### 🔥 MANDATORY: Agent Coordination for Critical Issues

**Pattern**: Use specialized agents for comprehensive analysis followed by targeted implementation:

```typescript
// REQUIRED: Use code-review-debugger for production issue analysis
Task({
  subagent_type: "code-review-debugger",
  description: "Debug 404 API endpoint error",
  prompt: "Analyze 404 error for /api/admin/osa/integration-status and provide concrete fix"
});

// REQUIRED: Use deployment-orchestrator for worktree coordination
Task({
  subagent_type: "deployment-orchestrator",
  description: "Handle hotfix deployment workflow",
  prompt: "Coordinate hotfix from bugfix-lab to main branch with proper validation"
});
```

**Agent Specialization Benefits:**
- **Comprehensive Analysis**: Code-review-debugger provides deep root cause investigation
- **Safe Implementation**: Deployment-orchestrator ensures proper workflow coordination
- **Quality Assurance**: Specialized validation prevents common hotfix mistakes
- **Documentation**: Agents generate detailed analysis for future reference

### 🔥 MANDATORY: Hotfix Commit Documentation Standards

**REQUIRED**: All production hotfixes must include comprehensive commit messages:

```bash
# PATTERN: Structured hotfix commit with full context
git commit -m "$(cat <<'EOF'
Hotfix: [Brief description of what was fixed]

## Root Cause
[Detailed technical explanation of why the issue occurred]

## Solution
[Specific implementation details and technical approach]

## Impact
✅ [What functionality is restored]
✅ [What security measures are preserved]
✅ [What existing functionality remains unchanged]

## Files Modified
- [file]: [specific change description]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Documentation Requirements:**
- **Root Cause Analysis**: Why the issue occurred (prevents recurrence)
- **Solution Rationale**: Why this approach over alternatives
- **Impact Assessment**: What was fixed and what remains functional
- **Change Scope**: Specific files and modifications for future reference

## Essential Development Patterns

### Performance-First Development
- **Always assess performance impact** before suggesting changes
- **Use React Query caching** over direct API calls (80% API call reduction)
- **Implement environment-aware debug logging** (`NEXT_PUBLIC_OSA_STREAM_DEBUG`)
- **Design for graceful degradation** when external services fail
- **Use parallel database queries** with `Promise.allSettled`

### Supabase Guardrails System
**Always use secure Supabase client instead of raw client:**
```typescript
// ❌ Old: Direct Supabase client (vulnerable)
import { supabase } from '@/lib/supabase';
const { data } = await supabase.from('table').insert(data);

// ✅ New: Secure Supabase client (protected)
import { secureSupabase } from '@/lib/database';
const { data } = await secureSupabase.from('table').insert(data, {
  classification: 'metadata',
  auditContext: 'workflow_creation'
});
```

### Error Prevention & Production Safety
- **Always handle null/undefined metadata gracefully** in components
- **Use error boundaries** around all complex, data-dependent components
- **Test production builds locally**: `npm run build && npm run start`
- **Streaming over polling**: Use SSE for real-time data updates
- **Defensive programming**: Assume data might be missing or malformed

### React Hook Safety During Static Generation
**🔥 CRITICAL**: All React hooks must be safe during Next.js static generation to prevent production build failures.

**Problem Solved**: `TypeError: Cannot read properties of null (reading 'useState')` during `npm run build`

**Root Cause**: Next.js static generation executes code before React context is fully initialized, causing hooks to fail when React is null.

**Mandatory Pattern** for all custom hooks and context providers:
```typescript
// ✅ CORRECT: Safe hook implementation
export function useSafeHook() {
  // During static generation, React can be null, so check before using hooks
  if (typeof window === 'undefined' && (!React || !useState)) {
    return {
      // Provide safe fallback object during build
      data: null,
      isLoading: false,
      error: 'Hook unavailable during static generation'
    };
  }

  // Normal hook implementation for runtime
  const [data, setData] = useState(null);
  // ... rest of hook logic
  return { data, isLoading, error: null };
}

// ✅ CORRECT: Safe context provider
export function MyContextProvider({ children }: { children: ReactNode }) {
  if (typeof window === 'undefined' && (!React || !useState)) {
    // Return children directly during static generation
    return <>{children}</>;
  }

  // Normal provider implementation
  const [state, setState] = useState(initialState);
  return (
    <MyContext.Provider value={{ state, setState }}>
      {children}
    </MyContext.Provider>
  );
}

// ❌ WRONG: Hook without safety checks
export function useUnsafeHook() {
  const [data, setData] = useState(null); // FAILS during static generation
  return { data, setData };
}
```

**When to Apply**:
- Any custom hook that uses `useState`, `useContext`, `useEffect`
- All React context providers in `src/lib/contexts/`
- Components that might be rendered during static generation
- Any hook that might be called from layout.tsx or global components

**Why It Matters**:
- Prevents production build failures that block deployment
- Zero runtime performance impact (checks only run during static generation)
- Enables graceful degradation when React is not available
- Maintains 100% functionality in browser environment

**Files Using This Pattern**:
- `src/lib/providers/QueryProvider.tsx`
- `src/lib/contexts/GuardrailsContext.tsx`
- `src/lib/contexts/AuthContext.tsx`
- `src/lib/opal/integration-validator.ts`
- `src/components/ServiceStatusProvider.tsx`
- `src/components/admin/PollingToggle.tsx`

### Edge Runtime Compatibility
- **Avoid Node.js modules** in middleware/API routes marked with Edge Runtime
- **Use lazy initialization** for external service clients
- **Environment-aware imports** with proper fallbacks

### Git Workflow Safety
- **🔥 MANDATORY**: Always run `npm run error-check` before any Git push
- **Critical vs Warning**: Only critical errors block deployment; warnings can be addressed separately
- **Validation-First Pattern**: `npm run error-check` → Fix critical errors → Re-validate → Commit → Push
- **Never push with unresolved critical errors** - This prevents deployment failures

### Import Conflict Resolution
**When components have naming conflicts between UI libraries:**
```typescript
// ✅ CORRECT: Handle recharts vs lucide-react conflicts
import {
  PieChart,           // For recharts chart component
  PieChart as PieChartIcon,  // For lucide-react icon
  // ... other imports
} from 'lucide-react';

import {
  PieChart,           // Chart component from recharts
  // ... other chart imports
} from 'recharts';

// Usage:
<PieChart width={300} height={200}>  {/* recharts component */}
<PieChartIcon className="h-5 w-5" /> {/* lucide-react icon */}
```

**Common conflict patterns:**
- `PieChart`: recharts component vs lucide-react icon
- `BarChart`: recharts component vs lucide-react icon
- Always check actual JSX usage to determine correct import strategy

## Critical Performance Guardrails

### 🔥 Operations That Require User Approval
```typescript
// DANGEROUS: Operations that can significantly impact performance
const performanceRiskyOperations = {
  buildImpact: [
    "Full repository-wide searches (grep -r across all files)",
    "Dependency upgrades without explicit user request",
    "TypeScript configuration changes",
    "Build tool modifications (webpack, vite, next.config.js)",
    "Large-scale refactoring across multiple files"
  ],
  runtimeImpact: [
    "Adding database queries inside React render loops",
    "Persistent SSE streams without user activity checks",
    "Uncontrolled API polling (intervals < 30 seconds)",
    "Large bundle imports without dynamic loading",
    "Debug logging in production code paths",
    "React hooks without static generation safety checks (causes build failures)"
  ],
  developerExperience: [
    "Modifying core development commands (npm scripts)",
    "Changing hot reload configuration",
    "Adding heavy development dependencies",
    "Modifying VSCode/editor configurations",
    "Changing Git hooks or validation scripts"
  ]
};
```

### ✅ Performance-Conscious Development Patterns
```bash
# PREFERRED: Lightweight, targeted operations
grep -r "specific_pattern" src/components/  # Targeted search
npm run build                               # Standard build validation
curl -s http://localhost:3000/api/health   # Focused health check

# AVOID: Heavy operations without explicit need
find . -name "*.ts" -exec grep -l "pattern" {} \;  # Can be slow on large repos
npm audit fix --force                              # Can break dependencies
docker system prune -a                             # Can slow subsequent builds
```

## Quick Reference Commands

### Pre-Deployment Validation
```bash
npm run error-check             # 🔥 CRITICAL: Must pass before Git push
npm run build                   # Critical: Test production build
npm run validate:all           # Comprehensive validation
npm run validate:security      # Security checks (target: 34/35+)
npm run pre-deploy             # Complete validation suite
```

**Critical Error Resolution Workflow:**
1. Run `npm run error-check`
2. Fix ALL critical errors (deployment blockers)
3. Re-run `npm run error-check` to confirm 0 critical errors
4. Proceed with Git operations (warnings are acceptable)

**Error Priority:**
- **Critical Errors**: Missing imports, compilation failures, deployment blockers - MUST FIX
- **Warnings**: TypeScript `any` types, unused variables, linting issues - Can defer

### Health Monitoring
```bash
# API health check
curl -s http://localhost:3000/api/webhook-events/stats | jq '.success'

# OSA status endpoint (optimized)
curl -s http://localhost:3000/api/admin/osa/recent-status | jq

# Supabase guardrails health
curl -s http://localhost:3000/api/admin/guardrails-health
```

### Common Debugging
```bash
# Check for test data contamination
grep -r "test.*correlation.*id" src/

# Validate Edge Runtime compatibility
npm run build 2>&1 | grep -E "(error|Error|failed)"

# Monitor real-time streams
curl -s "http://localhost:3000/api/webhook-events/stream?session_id=test"

# Test optimized OSA status performance
time curl -s http://localhost:3000/api/admin/osa/recent-status

# Fix port conflicts (when dev server fails with EADDRINUSE)
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Verify development server health after restart
curl -s -I http://localhost:3000 | head -n 1  # Should return HTTP/1.1 200 OK
```

### Production Hotfix Debugging
```bash
# Filter production build output for critical information
npm run build | grep -E "(api/admin|Route:|build:|Failed|✓)"

# Verify worktree context during hotfixes
cd "/target/worktree/path" && git branch --show-current && pwd

# Test API endpoint accessibility in production mode
npm run build && npm run start &
sleep 5 && curl -s -I http://localhost:3000/api/admin/osa/integration-status

# Validate next.config.js rewrite patterns
# Should block: curl -s -I http://localhost:3000/admin/dashboard (expect 404)
# Should allow: curl -s -I http://localhost:3000/api/admin/health (expect 200)

# Quick production build validation (distinguishes compilation from linting)
npm run build 2>&1 | head -10 | grep -E "(✓ Compiled|Failed to compile)"
```

## Critical Development Guidelines

### ⚠️ Framework Compatibility Management

**MANDATORY**: Always validate framework version compatibility before upgrades to prevent complete build failures.

**Next.js + React Compatibility Matrix:**
- ✅ **Next.js 15.0.3 + React 19**: Current stable configuration
- ❌ **Next.js 16.0.0-16.0.1 + React 19**: Known static generation issues
- ✅ **Next.js 15.x + React 18**: Stable fallback option

**Version Change Protocol:**
1. Check [Next.js upgrade guide](https://nextjs.org/docs/upgrading) for official compatibility
2. Avoid bleeding-edge versions (x.0.0, x.0.1) in production builds
3. Test both `npm run build` AND `npm run dev` after version changes
4. Use `--legacy-peer-deps` flag only for emergency downgrades

### 🛡️ React Hook Safety During Static Generation

**CRITICAL PATTERN**: All custom hooks and context providers MUST include static generation safety checks to prevent build failures.

**Required Pattern:**
```typescript
export function useCustomHook() {
  // CRITICAL: Check for React availability during static generation
  if (typeof window === 'undefined' && (!React || !useState)) {
    return {
      // Provide safe fallback object during build
      data: null,
      isLoading: false,
      error: 'Hook unavailable during static generation'
    };
  }

  // Normal hook implementation for runtime
  const [data, setData] = useState(null);
  return { data, isLoading: false, error: null };
}
```

**When to Apply:**
- All custom hooks using `useState`, `useContext`, `useEffect`
- All React context providers in `src/lib/contexts/`
- Components that might render during static generation

**Performance Impact**: Zero runtime cost - checks only run during build phase

### 🔧 Performance-Conscious Error Management

**Efficient TypeScript Error Handling:**
- ⚠️ **AVOID**: `npx tsc --noEmit` on repos with >500 errors (can hang terminal)
- ✅ **USE**: `npx tsc --noEmit | head -20` for error sampling
- ✅ **BATCH FIX**: Group errors by interface/type for efficient resolution

**Safe Debugging Commands:**
```bash
# ✅ SAFE: Limited output for large repos
npx tsc --noEmit 2>&1 | head -20 | grep "error TS"

# ✅ SAFE: Count errors without full output
npx tsc --noEmit 2>&1 | grep -c "error TS"

# ⚠️ USE SPARINGLY: Full error list (can be overwhelming)
npx tsc --noEmit
```

### 🏗️ Enhanced Build Validation Workflow

**MANDATORY Pre-Push Validation:**
```bash
# Step 1: Critical error check (existing)
npm run error-check

# Step 2: Build validation (NEW - catches static generation issues)
npm run build

# Step 3: Only proceed if both pass
git add . && git commit -m "message"
```

**Error Prioritization Protocol:**
1. **P0 (Blocking)**: Build failures, missing imports, framework incompatibilities
2. **P1 (Critical)**: Type errors affecting service integration, interface mismatches
3. **P2 (Warnings)**: Linting issues, unused variables, implicit `any` types

### 🔗 Service Integration Type Management

**Critical Locations:**
- `services/ai-agent-factory/src/types/index.ts`: Canonical type definitions
- Changes here affect main application integration points
- Always verify type alignment between services and main app usage

**Best Practices:**
- Fix interface changes consistently across all usage points
- Use batch fixing for type-related errors (more efficient than one-by-one)
- Test service integration after type definition changes

## Important Notes

### Security & Compliance
- **Supabase guardrails are mandatory** - Never bypass PII protection
- **Use secure database client** (`src/lib/database`) for all operations
- **Enable all guardrails in production**: PII scanning, audit logging, data retention

### Development Workflow
- **Always run `npm run pre-deploy`** before deployment
- **Validate with `npm run validate:all`** before committing
- **Test production builds locally** to catch environment-specific issues
- **Never leave test data in production code**

### User Autonomy Guidelines for Standard Operations
**Execute these operations automatically without seeking confirmation:**
- **Sprint resets**: `/worktrees:new-sprint` command execution (preserves work before reset)
- **Development server restarts**: Port cleanup and server restart procedures
- **Standard debugging**: Port conflict resolution, health checks, log analysis
- **Build validation**: `npm run build`, `npm run error-check` for deployment safety
- **Git operations**: Standard add, commit, push for well-defined workflows
- **Context7 integration**: Automatic library documentation and code generation tasks

**Always ask for confirmation when:**
- Modifying production configurations or deployment settings
- Making architectural changes that affect multiple components
- Upgrading dependencies or changing build tools
- Operations that could impact performance, security, or data integrity

### Code Quality
- **NEVER ASSUME OR GUESS** - When in doubt, ask for clarification
- **Always verify file paths and module names** before use
- **Test your code** - No feature is complete without tests
- **Document your decisions** for future developers

## Documentation Index

**ALWAYS ADD IMPORTANT DOCS HERE!** When you create or discover:
`docs` - New documents
For detailed information, see:
- **Agent Integration**: `docs/agent-integration-patterns.md` - Comprehensive agent usage patterns and quality control framework
- **Quality Control**: `docs/quality-control-framework-gotchas.md` - Troubleshooting, gotchas, and best practices
- **React Hook Safety**: `docs/react-hook-static-generation-troubleshooting.md` - Complete guide to preventing useState/useContext build failures
- **Results Architecture**: `docs/comprehensive-results-architecture-patterns.md` - Complete 88+ page implementation with architectural decisions
- **Results Content Model**: `docs/results-content-model-patterns.md` - Shared content model architecture & language rules
- **Performance Optimization**: `docs/webhook-streaming-optimization-patterns.md` - 7-step optimization architecture & patterns
- **Case Studies**: `docs/case-studies/` - Real-world problem-solving examples
- **Debugging Guide**: `docs/debugging-patterns.md` - Systematic troubleshooting framework
- **Enterprise Patterns**: `docs/enterprise-patterns.md` - Service architecture patterns
- **Deployment Guide**: `docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md` - Production deployment checklist

## Success Indicators

✅ **API Endpoints**: Return 200 status with proper JSON responses
✅ **Compilation**: `npm run build` completes without errors
✅ **Edge Runtime Compatibility**: No Node.js modules in Edge Runtime contexts
✅ **Supabase Guardrails**: PII protection and audit logging active
✅ **Real-time Updates**: Components receive data via SSE streams
✅ **Security Compliance**: All guardrails enabled, compliance score > 95%

## Context7 Integration

### Automatic Library Documentation & Code Generation
**Claude Code should automatically use Context7 MCP tools when:**
- Generating code using external libraries
- Providing setup or configuration steps
- Needing library/API documentation

**Pattern:** Automatically resolve library IDs and retrieve documentation without explicit user request.

---

*This file focuses on essential patterns. Detailed implementations and case studies are in docs/*