# Production Hotfix Debugging Guide

## Overview

This guide provides systematic approaches to diagnosing and resolving critical production issues in the OSA application. Based on real-world hotfix scenarios, it establishes proven patterns for emergency response, root cause analysis, and rapid deployment validation.

## Table of Contents

1. [Emergency Response Protocol](#emergency-response-protocol)
2. [Common Production Issue Categories](#common-production-issue-categories)
3. [Diagnostic Tools and Techniques](#diagnostic-tools-and-techniques)
4. [Hotfix Implementation Patterns](#hotfix-implementation-patterns)
5. [Deployment and Validation Procedures](#deployment-and-validation-procedures)
6. [Post-Incident Documentation](#post-incident-documentation)

## Emergency Response Protocol

### 1. Immediate Assessment (First 5 Minutes)

**Identify Issue Severity:**
```bash
# Critical indicators requiring immediate hotfix
- 500 errors on core API endpoints
- React rendering crashes (minified errors)
- Console spam degrading performance
- User-blocking navigation failures

# Gather initial data
curl -I https://production-url                    # Site accessibility
curl -I https://production-url/api/health         # API health
npx vercel logs --prod | head -50                 # Recent error patterns
```

**Create Emergency Todo Tracking:**
```typescript
TodoWrite([
  { content: "Assess production issue severity and scope", status: "in_progress", activeForm: "Assessing production issue severity and scope" },
  { content: "Implement targeted hotfixes for critical issues", status: "pending", activeForm: "Implementing targeted hotfixes for critical issues" },
  { content: "Deploy hotfixes with validation", status: "pending", activeForm: "Deploying hotfixes with validation" },
  { content: "Validate production stability post-deployment", status: "pending", activeForm: "Validating production stability post-deployment" },
  { content: "Use CLAUDE.md checker to validate all changes", status: "pending", activeForm: "Using CLAUDE.md checker to validate all changes" }
]);
```

### 2. Root Cause Analysis (Next 10 Minutes)

**Browser Console Analysis:**
```javascript
// Look for specific error patterns
React Error #418 - Minified error (text rendering/hydration issues)
API 500 errors - Server-side failures with specific endpoints
404 routing errors - Client-side navigation failures
Console spam - Debug logging flooding production
```

**Server Log Analysis:**
```bash
# Filter for specific error patterns
npx vercel logs --prod | grep -E "(500|Error|error)" | head -20

# Check API endpoint status
for endpoint in "/api/admin/osa/integration-status" "/api/webhook-events/stats"; do
  echo "Testing $endpoint:"
  curl -s "https://production-url$endpoint" | jq -e '.success' || echo "❌ Failed"
done
```

## Common Production Issue Categories

### 1. API 500 Errors - Database Dependencies

**Root Cause Pattern:**
- Production database missing tables/schemas that exist in development
- API endpoints assume database resources exist without graceful fallbacks

**Example Error:**
```
PGRST116: relation "opal_integration_validation" does not exist
```

**Hotfix Pattern:**
```typescript
// Add specific error detection and graceful fallback
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase.from('table').select('*');

    if (error) {
      // Critical: Detect specific PostgreSQL error codes
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return NextResponse.json({
          success: false,
          error: 'System initialization in progress',
          fallback: true
        }, { status: 404 }); // Appropriate status for missing resource
      }

      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}
```

### 2. React Error #418 - Metadata Structure Issues

**Root Cause Pattern:**
- Next.js 16 + React 19 compatibility issues with metadata configuration
- Array structures used where object structures required

**Example Error:**
```
Error: Minified React error #418
```

**Hotfix Pattern:**
```typescript
// WRONG: Array structure causes React error #418
export const metadata: Metadata = {
  icons: [
    { url: '/images/icon.png', type: 'image/png' },
    { url: '/images/icon.png', type: 'image/png', sizes: '32x32' }
  ]
};

// CORRECT: Object structure compatible with React 19
export const metadata: Metadata = {
  title: "OSA Application",
  description: "AI-powered strategy assistant",
  icons: {
    icon: '/images/gradient-orb.png',
    shortcut: '/images/gradient-orb.png',
    apple: '/images/gradient-orb.png',
  },
};
```

### 3. Console Spam - Debug Logging in Production

**Root Cause Pattern:**
- Debug console.log statements execute in production builds
- Performance degradation from excessive logging

**Example Issue:**
```javascript
// Production console flooded with:
[WidgetRenderer] Checking Experience Optimization for path: /engine/results/optimization/content
[WidgetRenderer] Experience Optimization path detected: /engine/results/optimization/content
[WidgetRenderer DEBUG] Path: /engine/results/optimization/content
```

**Hotfix Pattern:**
```typescript
// WRONG: Always executes debug logging
const renderConditionalContent = () => {
  console.log('[WidgetRenderer] Checking conditions...'); // ❌
  console.log('[WidgetRenderer] Path:', path); // ❌
  console.log('[WidgetRenderer] Context:', context); // ❌
};

// CORRECT: Environment-aware logging
const renderConditionalContent = () => {
  // Development-only debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('[WidgetRenderer DEBUG] Path analysis:', { path, context });
  }

  // Clean production code
  const hasContentOptimizationWidget =
    context.detection.tierMapping?.widgets?.primary === 'ContentOptimizationWidget';

  return hasContentOptimizationWidget ? renderWidget() : renderFallback();
};
```

### 4. 404 Routing Errors - Client-Side Navigation

**Root Cause Pattern:**
- URL construction creating malformed paths
- Client-side navigation not matching server-side routing

**Example Error:**
```
Failed to load resource: the server responded with a status of 404 (Not Found)
/engine/results/optimizely-dxp-tools/content-recs/a/b-testing-results
```

**Diagnostic Approach:**
```bash
# Test URL patterns manually
curl -I https://production-url/engine/results/optimizely-dxp-tools/content-recs/ab-testing-results
# vs
curl -I https://production-url/engine/results/optimizely-dxp-tools/content-recs/a/b-testing-results

# Check routing configuration
grep -r "ab-testing-results\|a/b-testing" src/app/
```

## Diagnostic Tools and Techniques

### 1. Browser Developer Tools

**Console Error Analysis:**
```javascript
// Filter console for specific patterns
console.log = (() => {
  const log = console.log;
  return function(...args) {
    if (args[0] && args[0].includes('[WidgetRenderer]')) {
      // Track debug spam patterns
    }
    log.apply(console, args);
  };
})();
```

**Network Tab Analysis:**
- Look for repeated failing requests (API 500s)
- Identify malformed URL patterns (404s)
- Monitor request/response timing for performance issues

### 2. Server-Side Diagnostics

**Vercel Production Logs:**
```bash
# Real-time log monitoring
npx vercel logs --prod --follow

# Filter for specific error patterns
npx vercel logs --prod | grep -E "(500|Error|error|PGRST)" | head -20

# Search for specific endpoint failures
npx vercel logs --prod | grep "/api/admin/osa/integration-status"
```

**API Endpoint Testing:**
```bash
# Test specific endpoints with detailed output
curl -v https://production-url/api/admin/osa/integration-status 2>&1 | head -20

# Test with different HTTP methods
curl -X POST https://production-url/api/endpoint -H "Content-Type: application/json" -d '{}'
```

### 3. Database Connection Testing

**Supabase Connection Validation:**
```bash
# Test database connectivity through API
curl -s https://production-url/api/health | jq '.database'

# Check for schema mismatches
curl -s https://production-url/api/admin/osa/integration-status | jq '.error' | grep -i "does not exist"
```

## Hotfix Implementation Patterns

### 1. Graceful API Fallbacks

**Implementation Strategy:**
```typescript
// Template for resilient API endpoints
export async function GET(request: NextRequest) {
  try {
    // Primary operation
    const result = await primaryOperation();

    if (result.error) {
      // Specific error handling
      if (result.error.code === 'EXPECTED_ERROR_CODE') {
        return gracefulFallbackResponse();
      }

      // Generic error handling
      return errorResponse(result.error);
    }

    return successResponse(result.data);
  } catch (err: any) {
    // Catch-all error handling
    return unexpectedErrorResponse(err);
  }
}

function gracefulFallbackResponse() {
  return NextResponse.json({
    success: false,
    error: 'Service initialization in progress',
    fallback: true,
    retryAfter: 300 // seconds
  }, { status: 503 }); // Service Unavailable
}
```

### 2. Environment-Aware Code Patterns

**Conditional Execution:**
```typescript
// Development vs Production behavior
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Conditional logging
if (isDevelopment) {
  console.log('[Debug] Processing:', data);
}

// Conditional features
const debugMode = isDevelopment && process.env.DEBUG_MODE === 'true';
if (debugMode) {
  // Enhanced debugging features
}
```

### 3. Metadata Configuration Patterns

**Next.js 16 + React 19 Compatible:**
```typescript
// Correct metadata structure
export const metadata: Metadata = {
  title: {
    default: 'OSA - Optimizely Strategy Assistant',
    template: '%s | OSA'
  },
  description: 'AI-powered strategy assistant for Optimizely DXP customers',
  keywords: ['Optimizely', 'Strategy', 'AI', 'DXP'],
  authors: [{ name: 'Perficient', url: 'https://perficient.com' }],
  creator: 'Perficient',
  publisher: 'Perficient',
  icons: {
    icon: [
      { url: '/images/gradient-orb.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/gradient-orb.png', sizes: '16x16', type: 'image/png' }
    ],
    shortcut: '/images/gradient-orb.png',
    apple: [
      { url: '/images/gradient-orb.png', sizes: '180x180', type: 'image/png' }
    ]
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'OSA - Optimizely Strategy Assistant',
    description: 'AI-powered strategy assistant for Optimizely DXP customers',
    url: process.env.NEXT_PUBLIC_BASE_URL,
    siteName: 'OSA',
    images: [
      {
        url: '/images/gradient-orb.png',
        width: 1200,
        height: 630,
        alt: 'OSA - Optimizely Strategy Assistant'
      }
    ],
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OSA - Optimizely Strategy Assistant',
    description: 'AI-powered strategy assistant for Optimizely DXP customers',
    images: ['/images/gradient-orb.png']
  }
};
```

## Deployment and Validation Procedures

### 1. Pre-Deployment Validation

**Local Testing Sequence:**
```bash
# 1. Development server testing
npm run dev
# Navigate to affected pages and verify fixes

# 2. Production build testing
npm run build
npm run start

# 3. Specific endpoint testing
curl http://localhost:3000/api/admin/osa/integration-status | jq
curl http://localhost:3000/engine/results/strategy

# 4. Console log verification
# Open browser dev tools, navigate pages, verify no debug spam
```

### 2. Production Deployment

**Deployment Sequence:**
```bash
# 1. Environment setup
export VERCEL_TOKEN="your_token"
export NEXT_PUBLIC_BASE_URL="https://your-domain.vercel.app"

# 2. Deploy with validation
npx vercel --prod --yes

# 3. Capture deployment details
DEPLOYMENT_URL=$(npx vercel --prod --yes | grep -o 'https://[^/]*\.vercel\.app')
echo "Deployment URL: $DEPLOYMENT_URL"
```

### 3. Post-Deployment Validation

**Comprehensive Validation:**
```bash
# 1. Site accessibility
curl -I $DEPLOYMENT_URL
if [ $? -eq 0 ]; then
  echo "✅ Site accessible"
else
  echo "❌ Site inaccessible"
fi

# 2. API endpoints
curl -s $DEPLOYMENT_URL/api/admin/osa/integration-status | jq -e '.success == false and .fallback == true'
if [ $? -eq 0 ]; then
  echo "✅ API graceful fallback working"
else
  echo "❌ API fallback failed"
fi

# 3. Key pages
for page in "/engine/results/strategy" "/engine/results/insights" "/engine/results/optimization"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" $DEPLOYMENT_URL$page)
  if [ $status -eq 200 ]; then
    echo "✅ Page $page accessible"
  else
    echo "❌ Page $page failed (status: $status)"
  fi
done

# 4. Console log verification
echo "🔍 Manual verification required:"
echo "1. Open $DEPLOYMENT_URL in browser"
echo "2. Check console for debug spam reduction"
echo "3. Navigate to /engine/results/optimization/content"
echo "4. Verify no React error #418"
```

### 4. Performance Validation

**Load Time Testing:**
```bash
# Test page load performance
time curl -s $DEPLOYMENT_URL > /dev/null
echo "Page load time captured above"

# Test API response times
time curl -s $DEPLOYMENT_URL/api/admin/osa/integration-status > /dev/null
echo "API response time captured above"
```

## Post-Incident Documentation

### 1. Incident Summary Template

```markdown
## Production Incident Summary

**Date:** [YYYY-MM-DD HH:MM UTC]
**Duration:** [Total incident duration]
**Severity:** [Critical/High/Medium/Low]

### Issues Identified
1. **API 500 Errors** - [Specific endpoint and cause]
2. **React Error #418** - [Metadata configuration issue]
3. **Console Spam** - [Debug logging in production]
4. **404 Routing** - [Client-side navigation issue]

### Root Causes
- [Specific technical causes]
- [Process gaps that allowed issues]
- [Environmental differences not caught in testing]

### Resolution Actions
1. [Specific hotfix implementations]
2. [Deployment steps taken]
3. [Validation procedures followed]

### Lessons Learned
- [What worked well in response]
- [What could be improved]
- [Patterns to prevent similar issues]

### Follow-up Actions
- [ ] Update pre-deployment testing procedures
- [ ] Add specific validation checks
- [ ] Update documentation
- [ ] Schedule team retrospective
```

### 2. Pattern Documentation

**Update CLAUDE.md:**
- Add new gotchas and solutions discovered
- Update validation procedures
- Include specific error patterns and fixes

**Create Case Studies:**
- Document complex debugging scenarios
- Include before/after code comparisons
- Provide step-by-step resolution processes

### 3. Preventive Measures

**Enhanced Pre-deployment Testing:**
```bash
# Add to npm run pre-deploy script
echo "=== Production Hotfix Prevention Checks ==="

# 1. Metadata validation
npm run build 2>&1 | grep -i "metadata\|icon" && echo "❌ Metadata warnings detected" || echo "✅ Metadata validation passed"

# 2. Console spam detection
grep -r "console\.log" src/ --exclude-dir=__tests__ | grep -v "NODE_ENV" && echo "❌ Unconditional console.log detected" || echo "✅ Console logging validation passed"

# 3. API error handling validation
grep -r "NextResponse\.json.*error" src/app/api/ | grep -v "fallback\|graceful" && echo "⚠️  Generic error handling detected" || echo "✅ Error handling validation passed"

# 4. Database dependency validation
grep -r "supabase\.from" src/ | grep -v "catch\|error" && echo "⚠️  Unguarded database calls detected" || echo "✅ Database call validation passed"
```

**Monitoring Improvements:**
- Add specific alerts for error patterns discovered
- Implement automated validation of critical endpoints
- Set up dashboard monitoring for console spam detection
- Create automated tests for metadata configuration

## Quick Reference Commands

### Emergency Diagnostics
```bash
# Site status
curl -I https://production-url

# Recent errors
npx vercel logs --prod | grep -E "(500|Error)" | head -10

# API health
curl -s https://production-url/api/admin/osa/integration-status | jq

# Console spam check
npx vercel logs --prod | grep -c "\[WidgetRenderer\]"
```

### Hotfix Deployment
```bash
# Quick deployment with validation
npm run build && npm run start &
sleep 10
curl http://localhost:3000/api/problematic-endpoint
npx vercel --prod --yes
curl -I https://production-url
```

### Post-Deployment Validation
```bash
# Comprehensive validation
for endpoint in "/api/health" "/api/admin/osa/integration-status"; do
  echo "Testing $endpoint:"
  curl -s https://production-url$endpoint | jq -e '.success' || echo "❌ Failed"
done
```

---

**This guide should be updated after each production incident to capture new patterns and improve response procedures.**