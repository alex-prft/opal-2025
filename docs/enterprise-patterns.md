# Enterprise Service Patterns - OSA Project

This document captures architectural decisions, patterns, and lessons learned from implementing enterprise-grade services for the OSA (Optimizely Strategy Assistant) application.

## Architecture Overview

### Service Layer Design Pattern

**Problem Solved**: Need for enterprise-grade PII protection, metrics monitoring, and webhook delivery with proper error handling and retry logic.

**Approach**: Implemented three core service layers following domain-driven design:
- **Compliance Layer**: PII protection with configurable redaction strategies
- **Monitoring Layer**: Prometheus metrics with OSA-specific business metrics
- **Communication Layer**: Webhook delivery with exponential backoff retry logic

**Why This Approach**:
- **Separation of Concerns**: Each service handles a single responsibility
- **Configuration-Driven**: All services support runtime configuration updates
- **Observability**: Comprehensive logging and metrics for production monitoring
- **Resilience**: Built-in error handling, retries, and graceful degradation

### File Structure
```
src/lib/
├── compliance/
│   ├── pii-protection-manager.ts       # Complete PII protection engine
│   └── gdpr-streamlined.ts             # GDPR compliance system
├── monitoring/
│   ├── prometheus-metrics.ts           # Professional prom-client integration
│   └── metrics-manager.ts              # Custom metrics management
└── webhooks/
    └── webhook-delivery-service.ts     # Enterprise webhook delivery
src/app/api/admin/
├── prometheus/route.ts                 # Prometheus metrics endpoint
├── metrics/route.ts                    # Custom metrics endpoint
└── webhooks/route.ts                   # Webhook management API
```

## Core Patterns

### 1. Enterprise Service Pattern

**Implementation Pattern**:
```typescript
export class ServiceName {
  private config: ServiceConfig;

  constructor(config: Partial<ServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    console.log('📊 [Service] Initialized with enterprise configuration');
  }

  // Core business method
  async primaryMethod(params): Promise<Result> {
    // Input validation
    // Business logic with error handling
    // Metrics recording
    // Comprehensive logging
    return result;
  }

  // Configuration management
  updateConfig(updates: Partial<ServiceConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}
```

**Future Changes Should Follow**:
- Always provide default configuration with enterprise-grade defaults
- Include comprehensive console logging with service prefixes
- Implement configuration update methods for runtime changes
- Export singleton instances for convenience
- Follow consistent error handling patterns

### 2. Context-Aware PII Protection Pattern

**Implementation**:
```typescript
// ✅ Role and operation-based protection strategy
const protectionLevel = determineProtectionLevel(userRole, operationType, dataClassification);
const redactionMode = selectOptimalRedactionMode(piiType, protectionLevel, complianceRequirements);
const protectedValue = applyRedaction(originalValue, redactionMode, retainFormat);

// ✅ Multi-Mode Redaction System
export type RedactionMode =
  | 'mask'        // Replace with asterisks: ***@***.com
  | 'hash'        // SHA-256 hash: a1b2c3d4...
  | 'encrypt'     // AES encryption (reversible)
  | 'anonymize'   // Replace with generic placeholder
  | 'pseudonymize' // Consistent fake but realistic values
  | 'remove'      // Complete removal
  | 'partial'     // Show first/last characters: j***@e***.com
```

### 3. Metrics Integration Pattern

**Problem Solved**: Need standardized metrics collection across all services with both Prometheus compatibility and custom analytics.

**Implementation**:
```typescript
// Record business metrics
prometheusMetrics.recordPIIProtection(type, mode, duration, confidence);
prometheusMetrics.recordWebhookProcessing(agentId, status, duration, type, size);
prometheusMetrics.recordAgentExecution(agentId, status, duration, workflow, confidence);

// Record API metrics
prometheusMetrics.recordAPIRequest(method, endpoint, statusCode, duration, userAgent);
```

**Pattern Guidelines**:
- Use descriptive metric names with `osa_` prefix for business metrics
- Include relevant labels for filtering and aggregation
- Record both success and failure scenarios
- Use appropriate metric types (counter, gauge, histogram)
- Integrate metrics recording in all service methods

### 4. Retry Logic Pattern

**Problem Solved**: Network reliability and graceful handling of temporary failures in webhook delivery.

**Implementation Pattern**:
```typescript
for (let attemptNumber = 1; attemptNumber <= maxAttempts; attemptNumber++) {
  const attempt = await this.attemptOperation(params, attemptNumber);

  if (isSuccessful(attempt)) {
    await this.recordSuccess(attempt);
    return successResult;
  }

  if (!shouldRetry(attempt)) break;

  if (attemptNumber < maxAttempts) {
    const delay = calculateBackoffDelay(attemptNumber);
    await this.sleep(delay);
  }
}
```

**Future Retry Implementations Should**:
- Use exponential backoff with jitter to prevent thundering herd
- Implement smart retry logic based on error types/status codes
- Include timeout handling with AbortController
- Log each attempt with clear success/failure indicators
- Record comprehensive metrics for retry effectiveness

### 5. Recursive Data Structure Protection

**Problem Solved**: Deep PII protection for complex nested agent data structures.

**Implementation**:
```typescript
// ✅ Deep scanning and protection for complex objects
function protectNestedData(obj, protectionContext) {
  return recursivelyProcess(obj, (value, path) => {
    if (containsPII(value)) {
      return protectPIIValue(value, detectPIIType(value), protectionContext);
    }
    return value;
  });
}

// ✅ Agent Data Recursive Protection
public async protectAgentData(
  agentData: Record<string, any>,
  context?: PIIProtectionContext
): Promise<{
  protected_data: Record<string, any>;
  pii_detections: PIIDetectionResult[];
}> {
  const protectedData = { ...agentData };
  const allDetections: PIIDetectionResult[] = [];

  // Recursively scan and protect all string values
  const processObject = async (obj: any, path: string[] = []): Promise<void> => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        const detections = await this.detectAndProtectPII(value, context);
        if (detections.length > 0) {
          // Replace with protected values and track detections
          allDetections.push(...detections);
        }
      } else if (typeof value === 'object' && value !== null) {
        await processObject(value, [...path, key]);
      }
    }
  };

  await processObject(protectedData);
  return { protected_data: protectedData, pii_detections: allDetections };
}
```

### 6. API Endpoint Pattern

**Problem Solved**: Consistent API design for service management with proper error handling and metrics.

**Standard Structure**:
```typescript
export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json();

    switch (action) {
      case 'primary_action':
        return await handlePrimaryAction(params);
      // ... other actions
      default:
        return NextResponse.json({
          error: 'Unknown action',
          available_actions: [/* list actions */]
        }, { status: 400 });
    }
  } catch (error) {
    // Error logging and metrics
    return NextResponse.json({
      error: 'Service-specific error message',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
```

### 7. Enterprise Compliance Integration Pattern

**Problem Solved**: Comprehensive audit trails with regulatory framework support.

**Implementation**:
```typescript
// ✅ Complete audit trail with enterprise integration
private async auditPIIRedaction(detection: PIIDetectionResult, context?: PIIProtectionContext): Promise<void> {
  try {
    await enterpriseComplianceManagement.logAuditEvent({
      audit_type: 'data_protection_event',
      source_system: 'pii_protection_manager',
      action: {
        action_type: 'pii_redaction_applied',
        resource_type: 'sensitive_data',
        operation: 'redact',
        outcome: 'success'
      },
      compliance_relevance: {
        applicable_frameworks: ['gdpr', 'ccpa', 'hipaa'],
        compliance_requirements: ['data_minimization', 'privacy_by_design'],
        retention_period_years: 7,
        legal_hold_applied: false
      }
    });
  } catch (error) {
    console.error('❌ [PII] Failed to audit PII redaction:', error);
  }
}
```

### 8. Performance-Optimized Processing Pattern

**Problem Solved**: Efficient batch processing with intelligent caching.

**Implementation**:
```typescript
// ✅ Batch processing with intelligent caching
class PIIProtectionManager {
  private pseudonymCache = new Map<string, string>();  // Consistent pseudonyms
  private piiPatterns = new Map<PIIType, RegExp>();    // Compiled regex patterns

  // Batch process multiple values efficiently
  async protectBatch(values: string[], context: PIIProtectionContext): Promise<string[]> {
    return Promise.all(values.map(value => this.detectAndProtectPII(value, context)));
  }

  // Intelligent caching for performance
  private getCachedPattern(piiType: PIIType): RegExp {
    if (!this.piiPatterns.has(piiType)) {
      this.piiPatterns.set(piiType, this.compilePattern(piiType));
    }
    return this.piiPatterns.get(piiType)!;
  }
}
```

## Testing Strategy

### Comprehensive Test Coverage

**Test Implementation Pattern**:
```javascript
// Create mock implementations for isolated testing
class MockServiceImplementation {
  // Replicate core functionality without external dependencies
  // Include error simulation capabilities
  // Provide detailed logging for test validation
}

async function testServiceScenarios() {
  // Test 1: Success scenarios
  // Test 2: Retry logic and error handling
  // Test 3: Configuration edge cases
  // Test 4: Performance characteristics
  // Test 5: Integration scenarios
}
```

**Future Testing Should Include**:
- Mock server implementations for external dependencies
- Error injection testing for resilience validation
- Performance benchmarking with realistic data sizes
- Configuration validation across different environments
- End-to-end integration testing with live services

## Performance Considerations

### Response Time Targets
- **PII Protection**: < 50ms per operation, < 500ms for batch processing
- **Metrics Export**: < 100ms for Prometheus format, < 200ms for JSON
- **Webhook Delivery**: < 30s total including all retries

### Memory Management
- Use streaming for large PII datasets
- Implement metric cleanup for long-running processes
- Clear attempt history for completed webhook deliveries
- Monitor memory usage in batch operations

### Error Rate Thresholds
- **PII Protection**: < 0.1% failure rate for valid inputs
- **Webhook Delivery**: > 95% eventual success rate with retries
- **Metrics Collection**: Zero data loss tolerance

## Common Gotchas & Mistakes

### 1. PII Protection Service

**Common Mistakes to Avoid**:
- ❌ **Don't** use simple string replacement for PII redaction
- ❌ **Don't** ignore edge cases like empty strings or special characters
- ❌ **Don't** hardcode redaction patterns without configuration
- ❌ **Don't** forget to handle batch processing for performance

**Best Practices**:
- ✅ **Do** use regex patterns with proper validation
- ✅ **Do** provide multiple redaction modes (mask, hash, partial, remove)
- ✅ **Do** include confidence scoring for PII detection
- ✅ **Do** implement batch processing for large datasets

### 2. Prometheus Metrics Integration

**Critical Implementation Issues**:
- ❌ **Wrong**: `registry.get('register').metrics()` - This pattern fails
- ✅ **Correct**: `await this.registry.metrics()` - Direct registry access

**Best Practices**:
- ✅ Use `collectDefaultMetrics()` for system monitoring
- ✅ Design histogram buckets appropriate for your data ranges
- ✅ Include business context in metric labels (agent_id, workflow_type, etc.)
- ✅ Export metrics in both Prometheus and JSON formats for flexibility

### 3. Webhook Delivery Service

**Network and Retry Gotchas**:
- ❌ **Don't** retry all 4xx errors (most are permanent failures)
- ❌ **Don't** implement fixed delay retries (causes thundering herd)
- ❌ **Don't** ignore timeout handling (can cause hanging requests)

**Correct Implementation**:
- ✅ Use exponential backoff with jitter (10% recommended)
- ✅ Implement smart retry logic based on HTTP status codes
- ✅ Use AbortController for timeout handling
- ✅ Classify errors properly (network vs. application vs. permanent)

## Future Development Guidelines

### When Adding New Services
1. **Follow the Enterprise Service Pattern** documented above
2. **Include comprehensive metrics** from day one
3. **Implement proper error handling** with classification
4. **Provide configuration management** capabilities
5. **Create thorough test coverage** including error scenarios
6. **Document all patterns and gotchas** in this file

### Code Review Checklist
- [ ] Service follows established patterns
- [ ] Metrics integration implemented properly
- [ ] Error handling covers all scenarios
- [ ] Configuration is externalized and validated
- [ ] Tests cover success, failure, and edge cases
- [ ] Performance targets are met
- [ ] Documentation is updated

### Monitoring and Alerting
- Set up alerts for service error rates > 1%
- Monitor webhook delivery success rates
- Track PII protection performance metrics
- Alert on configuration changes
- Monitor memory usage for batch operations

---

## Contact and Support

For questions about these patterns or implementations:
- Review this document first
- Check existing service implementations as examples
- Test thoroughly before production deployment
- Update this document with new learnings

*Last Updated: November 16, 2025*