# Error Prevention Guide

This document outlines strategies to prevent common runtime errors, particularly those related to undefined property access and API response handling.

## Common Error Patterns Identified

### 1. Undefined Property Access (TypeError: Cannot read properties of undefined)

**Root Cause**: Accessing properties on objects that may be null, undefined, or have different structure than expected.

**Examples of Problematic Code**:
```typescript
// DANGEROUS: Direct property access without null checks
const count = diagnosticsData.events.length; // Crashes if diagnosticsData is null
const name = event.agent_name; // Crashes if event doesn't have agent_name

// DANGEROUS: Assuming API response structure
const lastWebhook = data.lastWebhook.id; // API may not return lastWebhook
```

**Solution - Safe Property Access**:
```typescript
// SAFE: Using optional chaining
const count = diagnosticsData?.events?.length ?? 0;

// SAFE: Using safeGet helper
const safeGet = <T>(getter: () => T, defaultValue: T): T => {
  try {
    return getter() ?? defaultValue;
  } catch {
    return defaultValue;
  }
};

const count = safeGet(() => diagnosticsData.events.length, 0);
const events = safeGet(() => diagnosticsData.events, []);
```

### 2. API Response Structure Mismatches

**Root Cause**: Component interfaces not matching actual API response structure.

**Prevention Strategy**:
1. **Always validate API responses against actual data**
2. **Use TypeScript interfaces that match the real API**
3. **Test with real API responses, not mock data**

**Example - Correct Interface Definition**:
```typescript
// ✅ CORRECT: Based on actual API response
interface DiagnosticsData {
  events: Array<{
    id: string;
    workflow_id: string;
    agent_id: string;
    received_at: string;
    signature_valid: boolean;
    http_status: number;
    error_text?: string;
    dedup_hash: string;
    payload_preview: string;
  }>;
  summary: {
    total_count: number;
    returned_count: number;
    signature_valid_count: number;
    error_count: number;
    // ... more properties
  };
}

// ❌ INCORRECT: Based on assumptions
interface DiagnosticsData {
  lastWebhook?: {
    event_type: string;
    success: boolean;
    // ... properties that don't exist in actual API
  };
  recentEvents: Array<any>; // Wrong property name
  agentEvents: Array<any>;  // Wrong property name
}
```

## Implementation Guidelines

### 1. Safe Component Rendering

Always check for data existence before rendering:

```typescript
// ✅ SAFE: Conditional rendering with null checks
{diagnosticsData && safeGet(() => diagnosticsData.events, []).length > 0 && (
  <div>
    <h4>Recent Events ({safeGet(() => diagnosticsData.events.length, 0)})</h4>
    {safeGet(() => diagnosticsData.events, []).map((event) => (
      <div key={event.id}>
        {/* Safe property access */}
        <span>{event.agent_id || 'Unknown Agent'}</span>
        <span>Status: {event.http_status || 'Unknown'}</span>
      </div>
    ))}
  </div>
)}

// ❌ DANGEROUS: Direct property access
{diagnosticsData.events.length > 0 && ( // Crashes if diagnosticsData is null
  <div>
    {diagnosticsData.events.map((event) => ( // Crashes if events is undefined
      <div key={event.id}>
        <span>{event.agent_name}</span> {/* May not exist in API response */}
      </div>
    ))}
  </div>
)}
```

### 2. API Error Handling

Handle all possible API response states:

```typescript
const fetchData = async () => {
  try {
    setIsLoading(true);
    const response = await fetch('/api/endpoint');

    // Handle both successful and expected error responses (like 503)
    if (response.ok || response.status === 503) {
      const data = await response.json();

      // Validate data structure before setting state
      if (data && typeof data === 'object') {
        setData(data);
      } else {
        console.warn('API returned unexpected data structure:', data);
        setError('Invalid response format');
      }
    } else {
      // Handle unexpected errors
      console.error('Unexpected API error:', response.status);
      setError(`API error: ${response.status}`);
    }
  } catch (error) {
    console.error('Network error:', error);
    setError('Network error occurred');
  } finally {
    setIsLoading(false);
  }
};
```

### 3. TypeScript Configuration

Use strict TypeScript settings to catch errors at compile time:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": true
  }
}
```

## Testing Strategy

### 1. Error Scenario Tests

Create tests for all error conditions:

```typescript
describe('Component Error Handling', () => {
  it('should handle null data without crashing', () => {
    const { container } = render(<Component data={null} />);
    expect(container).toBeInTheDocument();
    // Should not throw errors
  });

  it('should handle malformed API responses', () => {
    const malformedData = {
      events: undefined, // Missing expected property
      summary: null      // Null instead of object
    };

    const { container } = render(<Component data={malformedData} />);
    expect(container).toBeInTheDocument();
    // Should render gracefully with defaults
  });

  it('should handle API errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<Component />);

    // Should show error state, not crash
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### 2. API Response Validation Tests

Always test with real API response structures:

```typescript
describe('API Response Validation', () => {
  it('should match actual API response structure', async () => {
    const realApiResponse = await fetch('/api/diagnostics/last-webhook?limit=1&status=all&hours=24');
    const data = await realApiResponse.json();

    // Verify the actual structure matches our interfaces
    expect(data).toHaveProperty('events');
    expect(data).toHaveProperty('summary');
    expect(Array.isArray(data.events)).toBe(true);

    if (data.events.length > 0) {
      const event = data.events[0];
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('workflow_id');
      expect(event).toHaveProperty('agent_id');
      // ... validate all expected properties
    }
  });
});
```

## Code Review Checklist

When reviewing code, check for:

- [ ] **Null Safety**: All property access uses optional chaining or null checks
- [ ] **Interface Accuracy**: TypeScript interfaces match actual API responses
- [ ] **Error Handling**: All API calls have proper try/catch and error states
- [ ] **Default Values**: All data access provides sensible defaults
- [ ] **Loading States**: Components handle loading states gracefully
- [ ] **Test Coverage**: Error scenarios are covered by tests

## Monitoring and Prevention

### 1. Runtime Error Tracking

Implement error boundaries to catch and log runtime errors:

```typescript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error, errorInfo);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh the page.</div>;
    }

    return this.props.children;
  }
}
```

### 2. API Response Monitoring

Log unexpected API response structures:

```typescript
const validateApiResponse = (data: any, expectedShape: object) => {
  const missingProperties = Object.keys(expectedShape).filter(
    key => !(key in data)
  );

  if (missingProperties.length > 0) {
    console.warn('API response missing expected properties:', missingProperties);
    // Send to monitoring service
  }
};
```

## Summary

The key to preventing these errors is:

1. **Never assume data structure** - Always validate and provide defaults
2. **Use defensive programming** - Check for null/undefined before access
3. **Test with real data** - Don't rely on mocked or assumed API responses
4. **Implement proper error boundaries** - Catch and handle errors gracefully
5. **Monitor in production** - Track and fix issues as they arise

By following these guidelines, we can prevent the TypeError crashes and create more robust, maintainable components.