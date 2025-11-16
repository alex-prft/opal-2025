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

### Core Integration Points
- **Optimizely Data Platform (ODP)**: Customer data and audience management
- **Optimizely Experimentation**: A/B testing and feature flags
- **OPAL (Optimizely AI-Powered Automation Layer)**: AI workflow orchestration
- **Supabase**: Database with enterprise-grade PII protection guardrails
- **Salesforce**: CRM integration for lead management

## Key Files for Understanding

### Core OPAL Integration
- `src/lib/simple-opal-data-service.ts` - Core OPAL integration service
- `src/components/opal/ContentRenderer.tsx` - OPAL content rendering
- `opal-config/opal-agents/` - OPAL agent configurations

### Database & Security
- `src/lib/database/` - **Secure Supabase integration with guardrails**
- `src/lib/compliance/pii-protection-manager.ts` - **Enterprise PII protection**
- `src/lib/compliance/gdpr-streamlined.ts` - **GDPR compliance system**

### Component Architecture
- `src/components/widgets/WidgetRenderer.tsx` - **Production-hardened widget system**
- `src/components/shared/ContentRendererErrorBoundary.tsx` - **Error boundary patterns**

### API & Streaming
- `src/app/api/webhook-events/stream/route.ts` - **Edge Runtime SSE streaming**
- `src/hooks/useWebhookStream.ts` - **Real-time streaming hooks**

## Essential Development Patterns

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

### 7-Step Webhook Streaming Optimization (November 2025)

**Achievement**: 93% performance improvement (11.1s → 825ms page load times)

This optimization replaced aggressive polling with intelligent caching and controlled SSE streaming:

#### Step 1: Lightweight Status API
```typescript
// GET /api/admin/osa/recent-status
export async function GET() {
  const [webhookResult, agentResult, forceSyncResult] = await Promise.allSettled([
    getLatestWebhookEvent(),
    getLatestAgentData(),
    getLatestForceSync()
  ]);
  // Returns structured status with graceful degradation
}
```

#### Step 2: React Query Integration
```typescript
// useRecentOsaStatus hook
export function useRecentOsaStatus() {
  return useQuery<OsaRecentStatus>({
    queryKey: ['osa-recent-status'],
    staleTime: 5 * 60 * 1000, // 5-minute intelligent caching
    refetchOnWindowFocus: false
  });
}
```

#### Key Patterns to Follow:
- **Prefer React Query caching over direct API calls** (80% API call reduction)
- **Use controlled SSE streaming only when needed** (during Force Sync workflows)
- **Implement environment-aware debug logging** (`NEXT_PUBLIC_OSA_STREAM_DEBUG`)
- **Design for graceful degradation** when external services fail
- **Use parallel database queries** with `Promise.allSettled`

#### Critical Mistakes to Avoid:
- ❌ **Never use aggressive polling** (every 2-3 seconds causes server overload)
- ❌ **Don't enable persistent SSE streams** when not actively needed
- ❌ **Avoid generic session IDs** - use workflow-specific correlation IDs
- ❌ **Don't leave debug logging enabled** in production builds
- ❌ **Never skip cache invalidation** on workflow completion

#### New Files Added:
- `src/app/api/admin/osa/recent-status/route.ts` - Optimized status endpoint
- `src/hooks/useRecentOsaStatus.ts` - React Query integration hook
- Enhanced `src/hooks/useWebhookStream.ts` - Controlled streaming patterns

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

## OPAL Workflow System

The application features sophisticated OPAL integration with 9 specialized agents:
- **Tool Discovery**: Complete registry for OPAL agent registration
- **Workflow Orchestration**: End-to-end personalization strategy generation
- **Agent Configurations**: JSON configurations in `opal-config/opal-agents/`

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

# Strategy workflow monitoring
node scripts/monitor-strategy-workflow.js
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

# Check React Query cache performance (via browser dev tools)
# Look for 'osa-recent-status' queries with stale cache indicators
```

## Additional Documentation

For detailed information, see:
- **Performance Optimization**: `docs/webhook-streaming-optimization-patterns.md` - 7-step optimization architecture & patterns
- **Case Studies**: `docs/case-studies/` - Real-world problem-solving examples
- **Debugging Guide**: `docs/debugging-patterns.md` - Systematic troubleshooting framework
- **Enterprise Patterns**: `docs/enterprise-patterns.md` - Service architecture patterns
- **Deployment Guide**: `docs/SUPABASE_INTEGRATION_COMPLETE.md` - Production deployment checklist

## Success Indicators

✅ **API Endpoints**: Return 200 status with proper JSON responses
✅ **Compilation**: `npm run build` completes without errors
✅ **Edge Runtime Compatibility**: No Node.js modules in Edge Runtime contexts
✅ **Supabase Guardrails**: PII protection and audit logging active
✅ **Real-time Updates**: Components receive data via SSE streams
✅ **Security Compliance**: All guardrails enabled, compliance score > 95%

---

*Keep this file focused and essential. Detailed patterns and case studies belong in docs/*