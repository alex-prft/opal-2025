# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- `npm run pre-deploy` - Complete pre-deployment validation suite

### OPAL & Production Tools
- `npm run start:opal-tools` - Start OPAL SDK tools
- `npm run deploy:prod` - Deploy to production via script

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 16 with App Router
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

### Edge Runtime Compatibility
- **Avoid Node.js modules** in middleware/API routes marked with Edge Runtime
- **Use lazy initialization** for external service clients
- **Environment-aware imports** with proper fallbacks

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
    "Debug logging in production code paths"
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
npm run build                    # Critical: Test production build
npm run validate:all            # Comprehensive validation
npm run validate:security       # Security checks (target: 34/35+)
npm run pre-deploy              # Complete validation suite
```

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
```

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

### Code Quality
- **NEVER ASSUME OR GUESS** - When in doubt, ask for clarification
- **Always verify file paths and module names** before use
- **Test your code** - No feature is complete without tests
- **Document your decisions** for future developers

## Documentation Index

For detailed information, see:
- **Agent Integration**: `docs/agent-integration-patterns.md` - Comprehensive agent usage patterns and quality control framework
- **Quality Control**: `docs/quality-control-framework-gotchas.md` - Troubleshooting, gotchas, and best practices
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

---

*This file focuses on essential patterns. Detailed implementations and case studies are in docs/*