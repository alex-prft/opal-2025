# React Hook Safety During Static Generation

## Overview

This guide explains how to prevent "Cannot read properties of null (reading 'useState')" errors that occur during Next.js static generation when React hooks are called before React is fully initialized.

## Problem Description

### Symptoms
- Build fails with `TypeError: Cannot read properties of null (reading 'useState')`
- Error occurs during static generation phase (`npm run build`)
- Development server (`npm run dev`) works fine
- Error stack trace points to React hook usage

### Root Cause
Next.js static generation executes components before React runtime is fully available. During this phase:
1. React context can be `null` or `undefined`
2. Hook functions (`useState`, `useContext`, `useEffect`) are not available
3. Components that use hooks during static generation fail

### Framework Context
- **Next.js 15.x + React 19**: Common occurrence due to timing changes
- **Next.js 16.x + React 19**: More frequent (reason for downgrade to 15.x)
- **Client Components**: Still subject to static generation for SSR/SSG

## Solution Pattern

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

## Implementation Guidelines

### When to Apply
- ✅ All custom hooks using `useState`, `useContext`, `useEffect`
- ✅ All React context providers in `src/lib/contexts/`
- ✅ Components that might be rendered during static generation

### Performance Impact
- **✅ Zero Runtime Cost**: Checks only run during build phase
- **✅ No Bundle Impact**: Conditions are eliminated in production

## Testing

```bash
# Test static generation
npm run build

# Ensure dev server works
npm run dev
```

## Current Implementations
- `src/lib/providers/QueryProvider.tsx` - React Query provider safety
- `src/lib/contexts/GuardrailsContext.tsx` - Supabase guardrails context

---
**Last Updated**: November 20, 2025 | **Status**: Production Ready ✅
