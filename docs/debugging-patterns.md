# Systematic Debugging Patterns & Prevention Strategies

This document provides systematic debugging frameworks and prevention strategies developed from real-world problem-solving in the OSA project.

## Root Cause Analysis Framework

When debugging complex issues, follow this 7-step systematic approach:

1. **Analyze Stack Trace**: Review error messages and compilation failures completely
2. **Trace Execution Path**: Follow data flow from UI components through API endpoints
3. **Identify Root Cause**: Look beyond symptoms to find the underlying technical failure
4. **Explain Why Bug Occurred**: Understand the environmental/architectural factors
5. **Propose Targeted Fixes**: Address root causes, not symptoms
6. **Implement Prevention Strategy**: Add safeguards to prevent recurrence
7. **Update Documentation**: Capture learnings and patterns for future reference

## Common Failure Patterns & Solutions

### 1. Production API 404 Errors (Configuration-First Pattern)

**Pattern Discovered**: Production API endpoints returning 404 despite existing in codebase
**Session**: 2025-11-22 - Integration Status API Hotfix

#### Root Cause Analysis
- **Symptom**: `GET /api/admin/osa/integration-status 404 (Not Found)` in production
- **Initial Assumption**: Missing API route file or compilation failure
- **Actual Root Cause**: Security rewrite rule in `next.config.js` blocking all `/admin/*` routes

#### Configuration-First Debugging Protocol
```bash
# Phase 1: Configuration Validation (5 minutes)
# 1. Check next.config.js rewrite rules for overly broad patterns
grep -A 10 "rewrite" next.config.js
# 2. Verify API route exists and compiles
ls -la src/app/api/admin/osa/integration-status/
# 3. Test development vs production behavior
npm run dev & curl http://localhost:3000/api/admin/osa/integration-status
npm run build && npm run start & curl http://localhost:3000/api/admin/osa/integration-status
```

#### Technical Solution
```typescript
// ❌ PROBLEMATIC: Overly broad security pattern
{
  source: '/admin/:path*',  // Blocks ALL admin routes
  destination: '/404',
}

// ✅ SOLUTION: Negative lookahead preserves API access
{
  source: '/admin/:path((?!api).*)',  // Blocks UI, allows API
  destination: '/404',
}
```

#### Prevention Strategy
- **Configuration Review**: Always review rewrite rules when adding new admin API endpoints
- **Testing Matrix**: Test both admin UI blocking (should 404) and admin API access (should work)
- **Documentation**: Document security patterns and their regex logic in comments

#### Key Learning
**Always check configuration files before searching for missing implementations.** Security measures often inadvertently block legitimate endpoints.

### 2. Edge Runtime Compatibility Issues

**Problem**: Node.js modules imported in Edge Runtime environments (middleware, API routes)
```
Error: A Node.js module is loaded ('fs') which is not supported in the Edge Runtime
```

**Root Cause**: Import chains pulling server-side modules into Edge Runtime contexts

**Prevention**:
- **Remove middleware.ts if not needed** - Edge Runtime constraints are strict
- Use `'use server'` directive consistently for server-only modules
- Create Edge Runtime-compatible alternatives for file operations
- Audit import chains: middleware → database modules → Node.js APIs
- Use runtime-specific conditional imports

**Modern Solution Pattern**:
```typescript
// Bad: Direct import causes Edge Runtime violation
import { fileBasedStorage } from './file-storage';

// Good: Environment-aware import with Edge Runtime compatibility
export const getWebhookEvents = () => {
  if (typeof window !== 'undefined' || process.env.VERCEL_ENV) {
    // Edge Runtime or client - use API endpoint
    return fetch('/api/webhook-events').then(r => r.json());
  }
  // Server environment - use direct database access
  return fileBasedStorage.getWebhookEvents();
};
```

**Production Deployment Pattern**:
```typescript
// Use ReadableStream for SSE in Edge Runtime
export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      // Edge Runtime compatible streaming
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode('data: {}\n\n'));
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache'
    }
  });
}
```

### 2. File Encoding Corruption

**Problem**: Source files corrupted with literal escape characters (`\n` instead of actual newlines)
```
Error: Unexpected token '\n' in line 301
```

**Root Cause**: File encoding issues during copy/paste or version control operations

**Prevention**:
- Always validate TypeScript compilation before deployment: `npm run build`
- Use consistent file encodings (UTF-8)
- Implement pre-commit hooks with syntax validation
- Monitor for unusual escape character patterns in diffs

**Detection Pattern**:
```bash
# Check for literal escape characters
grep -n '\\n' src/**/*.ts | grep -v 'string literals'
```

### 3. Polling vs Real-time Updates

**Problem**: Components using outdated polling mechanisms causing performance issues

**Root Cause**: Legacy architectures not utilizing available streaming/SSE capabilities

**Prevention**:
- Prefer Server-Sent Events (SSE) over polling for real-time data
- Implement graceful degradation: Stream → Polling → Manual refresh
- Monitor connection health and provide visual feedback
- Use connection pooling and reconnection logic

**Modern Pattern**:
```typescript
// Bad: Aggressive polling
setInterval(() => fetchData(), 1000);

// Good: Real-time stream with fallback
const stream = useWebhookStream({
  onEvent: handleNewData,
  onError: () => startFallbackPolling()
});
```

### 4. Production Deployment Failures

**Problem**: Components working in development but failing in production

**Root Cause**: Environment differences, missing metadata handling, hydration mismatches

**Prevention**:
- **Test production builds locally**: `npm run build && npm run start`
- Handle null/undefined metadata gracefully in components
- Use proper error boundaries for React hydration errors
- Implement graceful degradation for missing data
- Test Edge Runtime compatibility before deployment

**Production-Safe Component Pattern**:
```typescript
// Bad: Assumes metadata always exists
const MyWidget = ({ data }) => {
  return <div>{data.metadata.title}</div>; // Crashes in production
};

// Good: Defensive programming with fallbacks
const MyWidget = ({ data }) => {
  const title = data?.metadata?.title || 'Untitled';
  const isLoading = !data;

  if (isLoading) {
    return <WidgetSkeleton />;
  }

  return (
    <div>
      <h2>{title}</h2>
      {data.content && <ContentRenderer content={data.content} />}
    </div>
  );
};
```

## Development Workflow Safeguards

### Pre-Commit Validation
```bash
npm run validate:runtime-errors
npm run error-check
npm run validate:jsx-parsing
npm run test:jsx-regression
npm run guardrails:test      # Validate Supabase guardrails
```

### Pre-Deploy Validation
```bash
npm run build               # Critical: Catches compilation issues
npm run validate:all        # Comprehensive validation suite
npm run test:unit          # Unit test validation
npm run guardrails:health  # Supabase guardrails health check
npm run pre-deploy         # Complete pre-deployment validation
```

### Production Deployment Validation
```bash
npm run build              # Build production bundle
npm run start             # Test production server locally
npm run guardrails:test   # Validate data protection systems
npm run test:integration  # Integration test suite
npm run deploy:prod       # Deploy to production (with validation)
```

### Real-time Monitoring Patterns

1. **API Health Monitoring**: Continuous validation of endpoint accessibility
2. **Stream Connection Health**: Visual indicators for real-time data flow
3. **Compilation Status**: Build success/failure monitoring
4. **Import Boundary Enforcement**: Automated detection of client/server violations

## Debugging Tools & Commands

### Investigation Commands
```bash
# Find import dependency chains
grep -r "import.*database" src/ | head -10

# Check for Node.js modules in client code
find src/ -name "*.ts" | xargs grep -l "require('fs')"

# Validate API endpoint responses
curl -s http://localhost:3000/api/webhook-events/stats | head -5

# Check server compilation status
npm run build 2>&1 | grep -E "(error|Error|failed)"
```

### Performance & Health Monitoring
```bash
# Monitor real-time stream connections
curl -s "http://localhost:3000/api/webhook-events/stream?session_id=test"

# Check memory usage patterns
ps aux | grep node | head -2

# Validate file encoding integrity
file -I src/lib/database/*.ts
```

## When to Apply These Patterns

- **Compilation Failures**: Always check import boundaries first
- **Runtime Errors**: Validate API accessibility before debugging component logic
- **Performance Issues**: Consider streaming over polling for real-time data
- **File Corruption**: Implement syntax validation in CI/CD pipeline
- **Complex Debugging**: Use systematic 7-step analysis framework

## Prevention Strategies

### Test Data Contamination Prevention
```typescript
// ❌ Never do this in production
const testCorrelationId = 'force-sync-1763058306856-98zafy3p7bu';
opalCorrelationId: opalCorrelationId || testCorrelationId,

// ✅ Always do this instead
opalCorrelationId: opalCorrelationId || null,
```

**Detection**: Add pre-deploy script to scan for hardcoded test IDs
```bash
# Add to CI/CD pipeline
grep -r "test.*correlation.*id" src/ && exit 1
```

### Event Amplification Prevention
```typescript
// ❌ Every event triggers full refresh
onEvent: (event) => fetchDashboardData()

// ✅ Throttled and filtered events
const throttledFetch = useCallback(debounce(fetchDashboardData, 2000), []);
onEvent: (event) => {
  if (!isDuplicateEvent(event.id) && isRelevantEvent(event)) {
    throttledFetch();
  }
}
```

### Polling Loop Prevention
```typescript
// ❌ Blind polling without validation
useEffect(() => startPolling(workflowId), [workflowId]);

// ✅ Validated polling with circuit breaker
useEffect(() => {
  if (workflowId && await validateWorkflowExists(workflowId)) {
    startPolling(workflowId);
  }
}, [workflowId]);
```

### Enhanced Error Boundary Pattern
```typescript
// ✅ Production-safe component wrapper
<RecentDataErrorBoundary
  onError={(error, errorInfo) => reportError(error, errorInfo)}
>
  <RecentDataComponent compact={true} />
</RecentDataErrorBoundary>
```

## Troubleshooting Checklist

### 🔍 **Investigation Phase**
- [ ] Check browser console for error patterns and frequency
- [ ] Identify if errors are polling loops, API failures, or data issues
- [ ] Use Network tab to monitor API request frequency
- [ ] Check for hardcoded test values in codebase

### 🎯 **Root Cause Analysis**
- [ ] Trace data flow from UI component through API to database
- [ ] Identify event triggers and cascading API calls
- [ ] Check for missing validation before external calls
- [ ] Verify fallback mechanisms provide good user experience

### ✅ **Solution Validation**
- [ ] Test production build locally: `npm run build && npm run start`
- [ ] Verify no test data in production code: `grep -r "test.*correlation" src/`
- [ ] Confirm API endpoints return proper status codes
- [ ] Check error boundaries catch and display failures gracefully
- [ ] Validate real-time streams use proper session/workflow IDs

### 🛡️ **Prevention Implementation**
- [ ] Add validation scripts to CI/CD pipeline
- [ ] Implement error boundaries around complex components
- [ ] Add throttling/debouncing to event-driven API calls
- [ ] Create user notifications for fallback data scenarios
- [ ] Document new patterns for future reference

## Success Indicators

✅ **API Endpoints**: Return 200 status with proper JSON responses
✅ **Compilation**: `npm run build` completes without errors
✅ **Edge Runtime Compatibility**: No Node.js modules in Edge Runtime contexts
✅ **Production Deployment**: Components work in production with proper error handling
✅ **Supabase Guardrails**: PII protection, audit logging, and data retention active
✅ **Real-time Updates**: Components receive data via SSE streams, not polling
✅ **Security Compliance**: All guardrails enabled and compliance score > 95%
✅ **Performance**: Production overhead < 50ms per database operation
✅ **Documentation**: Debugging patterns and learnings captured for future reference

## Key Learnings

1. **Never leave test data in production code** - Always use environment-specific configurations
2. **Validate external dependencies** before starting dependent processes
3. **Implement throttling** for any event-driven API calls
4. **Use specific correlation IDs** instead of generic session identifiers
5. **Provide clear user feedback** when showing fallback/mock data
6. **Test production builds locally** to catch environment-specific issues
7. **Add error boundaries** around all complex, data-dependent components

---

*This document is continuously updated with new debugging patterns and prevention strategies discovered during development.*