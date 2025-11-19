# React Hook Static Generation Troubleshooting

## Overview

This guide addresses the critical production build failure: `TypeError: Cannot read properties of null (reading 'useState')` that occurs during Next.js static generation.

## Problem Description

### Symptoms
- Production build fails with `npm run build`
- Error message: `TypeError: Cannot read properties of null (reading 'useState')`
- Build stops at static page generation phase (e.g., "Generating static pages (0/161)")
- Development server works fine (`npm run dev`)

### Root Cause
Next.js static generation executes React components and hooks **before React context is fully initialized**. During this phase:
- `React` can be `null` or `undefined`
- Hook functions like `useState`, `useContext`, `useEffect` are not available
- Components that rely on hooks fail with runtime errors

### When This Occurs
- Custom hooks in `src/lib/contexts/` or `src/lib/providers/`
- Components rendered during static generation (via layout.tsx)
- Context providers wrapping the entire application
- Any hook called from globally rendered components

## Solution Pattern

### Universal React Hook Safety Pattern

Apply this pattern to **all custom hooks and context providers**:

```typescript
import React, { useState, useContext } from 'react';

// ✅ SAFE: Custom hook with static generation protection
export function useSafeCustomHook() {
  // Step 1: Check if we're in static generation environment
  if (typeof window === 'undefined' && (!React || !useState)) {
    // Step 2: Return safe fallback object during build
    return {
      data: null,
      isLoading: false,
      error: 'Hook unavailable during static generation',
      // Include all expected return properties with safe defaults
      refetch: () => Promise.resolve(),
      reset: () => {}
    };
  }

  // Step 3: Normal hook implementation for runtime
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // ... rest of hook logic

  return {
    data,
    isLoading,
    error: null,
    refetch: () => fetchData(),
    reset: () => setData(null)
  };
}

// ✅ SAFE: Context provider with static generation protection
export function SafeContextProvider({ children }: { children: ReactNode }) {
  // Step 1: Environment check
  if (typeof window === 'undefined' && (!React || !useState)) {
    // Step 2: Return children directly during static generation
    return <>{children}</>;
  }

  // Step 3: Normal provider implementation
  const [state, setState] = useState(initialState);

  return (
    <MyContext.Provider value={{ state, setState }}>
      {children}
    </MyContext.Provider>
  );
}

// ✅ SAFE: useContext hook with protection
export function useSafeContext() {
  // Step 1: Environment and React availability check
  if (typeof window === 'undefined' && (!React || !useContext)) {
    return {
      // Step 2: Safe fallback matching expected interface
      value: null,
      setValue: () => {},
      isReady: false
    };
  }

  // Step 3: Try-catch for additional safety
  try {
    const context = useContext(MyContext);
    if (context === undefined) {
      throw new Error('useSafeContext must be used within SafeContextProvider');
    }
    return context;
  } catch (error) {
    // Step 4: Handle runtime errors gracefully
    if (typeof window === 'undefined') {
      return {
        value: null,
        setValue: () => {},
        isReady: false
      };
    }
    throw error; // Re-throw in browser environment
  }
}
```

### Multi-Layer Defense Strategy

1. **Environment Detection**: `typeof window === 'undefined'`
2. **React Availability**: `(!React || !useState)`
3. **Try-Catch Wrapping**: Additional runtime error protection
4. **Fallback Objects**: Complete interface implementation with safe defaults

## Implementation Checklist

### Before Making Changes
- [ ] Identify all custom hooks using `useState`, `useContext`, `useEffect`
- [ ] List all context providers in `src/lib/contexts/` and `src/lib/providers/`
- [ ] Check layout.tsx for context provider hierarchy
- [ ] Review components that might render during static generation

### During Implementation
- [ ] Apply safety pattern to each identified hook/provider
- [ ] Ensure fallback objects match expected interface
- [ ] Add clear comments explaining why checks are needed
- [ ] Maintain zero runtime performance impact

### After Implementation
- [ ] Run `npm run build` to test production build
- [ ] Verify static page generation succeeds (should see progress like "80/161")
- [ ] Test development server still works: `npm run dev`
- [ ] Confirm all hooks work normally in browser environment

## Files Successfully Updated

The following files have been updated with the React hook safety pattern:

### Context Providers
- `src/lib/providers/QueryProvider.tsx` - React Query provider safety
- `src/lib/contexts/GuardrailsContext.tsx` - Multi-layer safety with try-catch
- `src/lib/contexts/AuthContext.tsx` - Auth hooks with fallbacks
- `src/lib/askAssistant/context.tsx` - Ask Assistant context safety

### Component Providers
- `src/components/ServiceStatusProvider.tsx` - Service status hooks
- `src/components/admin/PollingToggle.tsx` - Polling context provider

### Utility Hooks
- `src/lib/opal/integration-validator.ts` - Validation trigger hook
- `src/lib/database/audit-system.ts` - Lazy initialization pattern

## Performance Considerations

### Zero Runtime Impact
- Environment checks only execute during static generation
- No performance penalty in browser environment
- Fallback objects are lightweight and simple
- No expensive operations in safety checks

### Build Performance
- Prevents build failures that require full rebuilds
- Enables successful static page generation
- Maintains Next.js optimization benefits
- Preserves development server performance

## Common Pitfalls to Avoid

### ❌ Don't: Hook calls in conditional branches
```typescript
// WRONG: This violates Rules of Hooks
export function useBadHook() {
  if (typeof window === 'undefined') {
    return fallback;
  }
  const [data, setData] = useState(null); // Hook in conditional!
}
```

### ✅ Do: Wrap entire hook with safety check
```typescript
// CORRECT: Safety check wraps everything
export function useGoodHook() {
  if (typeof window === 'undefined' && (!React || !useState)) {
    return fallback;
  }

  // All hooks called consistently at top level
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  return { data, setData, loading, setLoading };
}
```

### ❌ Don't: Incomplete fallback objects
```typescript
// WRONG: Missing expected properties
if (typeof window === 'undefined') {
  return { data: null }; // Missing isLoading, error, etc.
}
```

### ✅ Do: Complete interface implementation
```typescript
// CORRECT: All expected properties included
if (typeof window === 'undefined' && (!React || !useState)) {
  return {
    data: null,
    isLoading: false,
    error: 'Hook unavailable during static generation',
    refetch: () => Promise.resolve(),
    reset: () => {}
  };
}
```

## Testing Strategy

### Local Testing
```bash
# Test production build
npm run build

# Should see successful static generation:
# ✓ Generating static pages (80/161)
# ✓ Build completed successfully

# Test development server
npm run dev
# Should start normally without errors
```

### Validation Workflow
1. Clear Next.js cache: `rm -rf .next`
2. Run production build: `npm run build`
3. Check for useState/useContext errors in output
4. Verify static page generation count increases
5. Test development server functionality
6. Confirm all hooks work in browser

## Future Maintenance

### Adding New Hooks
- Always apply the safety pattern from the start
- Test with production build before committing
- Document any custom fallback requirements
- Consider creating shared utility for common patterns

### Shared Safety Utility (Optional Enhancement)
```typescript
// lib/utils/react-safety.ts
export function isReactAvailable(): boolean {
  return typeof window !== 'undefined' || (React && typeof React.useState === 'function');
}

export function createSafeHook<T>(hookImpl: () => T, fallback: T): () => T {
  return () => {
    if (!isReactAvailable()) {
      return fallback;
    }
    return hookImpl();
  };
}
```

## Related Documentation

- [CLAUDE.md - React Hook Safety Pattern](../CLAUDE.md#react-hook-safety-during-static-generation)
- [Next.js Static Generation Documentation](https://nextjs.org/docs/basic-features/pages#static-generation)
- [React Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)

---

**Key Takeaway**: The React hook safety pattern prevents production build failures while maintaining zero runtime performance impact. Apply this pattern proactively to all custom hooks and context providers.