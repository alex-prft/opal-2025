# Correlation ID Tracking Standards

**Document Purpose**: Standardized correlation ID implementation for debugging integration flows
**Scope**: All webhook endpoints, API integrations, and service-to-service communication
**Implementation Date**: 2025-11-20 (Production debugging session)

## 🎯 Overview

Correlation IDs provide end-to-end request tracing across OPAL ↔ OSA integration flows. They enable:
- **Debugging**: Track requests through multiple services
- **Performance Analysis**: Measure processing times across components
- **Error Investigation**: Link failures across distributed systems
- **Monitoring**: Aggregate metrics by request flow

## 📋 Correlation ID Standards

### Format Specification
```typescript
// Standard format: {service}-{timestamp}-{random}
const correlationId = `${serviceName}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

// Examples:
"opal-webhook-1732123456789-abc7def"
"osa-enhanced-1732123456790-xyz9mno"
"results-widget-1732123456791-pqr2stu"
```

**Components:**
- **Service Name**: 8-15 characters, kebab-case (e.g., `opal-webhook`, `osa-enhanced`)
- **Timestamp**: Unix timestamp in milliseconds for chronological ordering
- **Random Suffix**: 7-character alphanumeric string for uniqueness within timestamp collisions

### Service Naming Convention
| Service Type | Correlation ID Prefix | Example |
|--------------|----------------------|---------|
| OPAL Webhook Tools | `opal-webhook-*` | `opal-webhook-1732123456-abc7def` |
| OSA Enhanced Tools | `osa-enhanced-*` | `osa-enhanced-1732123456-xyz9mno` |
| Results Widgets | `results-widget-*` | `results-widget-1732123456-pqr2stu` |
| Admin APIs | `admin-api-*` | `admin-api-1732123456-mno4vwx` |
| OPAL Integration | `opal-integration-*` | `opal-integration-1732123456-def8ghi` |

## 🔧 Implementation Patterns

### 1. Request Entry Point (MANDATORY)
```typescript
// Generate correlation ID at the very beginning of request processing
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const correlationId = `opal-webhook-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  try {
    console.log('🚀 [Service Name] Request received', {
      correlationId,
      userAgent: request.headers.get('user-agent'),
      contentType: request.headers.get('content-type'),
      timestamp: new Date().toISOString()
    });

    // Rest of request processing...
  } catch (error) {
    console.error('❌ [Service Name] Request failed', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime
    });
    throw error;
  }
}
```

### 2. Service Call Propagation (MANDATORY)
```typescript
// Forward correlation ID in all outbound service calls
const forwardHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  'User-Agent': 'OSA-Service/1.0',
  'X-Correlation-ID': correlationId,  // MANDATORY: Always propagate
  'X-Request-Start': startTime.toString()
};

// Example: Calling Enhanced Tools from wrapper endpoint
const enhancedResponse = await fetch('/api/opal/enhanced-tools', {
  method: 'POST',
  headers: forwardHeaders,
  body: JSON.stringify(enhancedToolRequest)
});
```

### 3. Response Headers (MANDATORY)
```typescript
// Always include correlation ID and timing in response headers
return NextResponse.json(responseData, {
  headers: {
    'Content-Type': 'application/json',
    'X-Correlation-ID': correlationId,                    // For client debugging
    'X-Processing-Time': processingTime.toString(),       // Performance monitoring
    'X-Service-Version': '1.0.0',                        // Version tracking
    'X-Request-ID': correlationId                        // Alias for compatibility
  }
});
```

### 4. Structured Logging (MANDATORY)
```typescript
// Log format with correlation ID at key processing points
const logEvent = (level: string, message: string, additionalData: any = {}) => {
  console.log(`${level} [Service Name] ${message}`, {
    correlationId,
    timestamp: new Date().toISOString(),
    processingTime: Date.now() - startTime,
    ...additionalData
  });
};

// Usage examples:
logEvent('🚀', 'Request received', { endpoint: '/api/tools/webhook' });
logEvent('✅', 'Parameters validated', { agentName, workflowId });
logEvent('🔄', 'Transforming parameters', { sourceFormat: 'opal', targetFormat: 'enhanced' });
logEvent('📤', 'Calling downstream service', { service: 'enhanced-tools' });
logEvent('📥', 'Response received', { status: response.status, responseSize: responseText.length });
logEvent('✅', 'Request completed successfully', { finalStatus: 'success' });
```

### 5. Error Handling with Correlation (MANDATORY)
```typescript
// Include correlation ID in all error responses
catch (error) {
  const processingTime = Date.now() - startTime;

  console.error('❌ [Service Name] Error occurred', {
    correlationId,
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    processingTime,
    requestData: sanitizeForLogging(requestData) // Remove sensitive data
  });

  return NextResponse.json({
    success: false,
    error: 'Request processing failed',
    message: error instanceof Error ? error.message : 'Unknown error occurred',
    correlation_id: correlationId,              // MANDATORY: Client debugging
    processing_time_ms: processingTime,
    timestamp: new Date().toISOString(),
    service: 'opal-webhook-tool'
  }, {
    status: 500,
    headers: {
      'X-Correlation-ID': correlationId,
      'X-Processing-Time': processingTime.toString()
    }
  });
}
```

## 📊 Monitoring & Analytics

### Log Analysis Patterns
```bash
# Find all requests for a specific correlation ID
grep "opal-webhook-1732123456-abc7def" logs/*.log

# Monitor processing times across services
grep -E "X-Processing-Time|processing_time_ms" logs/*.log | grep "opal-webhook-1732123456-abc7def"

# Track request flow across multiple services
grep -E "correlation.*abc7def" logs/*.log | sort

# Identify slow requests (>2 seconds)
grep -E "processing_time_ms.*[2-9][0-9]{3,}" logs/*.log
```

### Performance Metrics
```typescript
// Extract metrics from correlation ID logs
interface CorrelationMetrics {
  correlationId: string;
  totalProcessingTime: number;
  serviceBreakdown: {
    [serviceName: string]: {
      processingTime: number;
      status: 'success' | 'error';
      responseSize?: number;
    };
  };
  errorCount: number;
  startTimestamp: string;
  endTimestamp: string;
}

// Example analysis:
const analyzeCorrelationFlow = (correlationId: string) => {
  // Parse logs for specific correlation ID
  // Calculate service-by-service timing
  // Identify bottlenecks and error points
  // Generate performance report
};
```

### Dashboard Integration
```typescript
// Export metrics for monitoring dashboards
const correlationMetrics = {
  correlation_id: correlationId,
  service_chain: ['opal-webhook', 'osa-enhanced', 'results-generator'],
  total_time_ms: processingTime,
  success_rate: successfulRequests / totalRequests,
  error_count: errorCount,
  timestamp: new Date().toISOString()
};

// Send to monitoring system (e.g., Prometheus, DataDog)
```

## 🔍 Debugging Workflows

### 1. End-to-End Request Tracing
```bash
# Step 1: Find correlation ID from client logs or response headers
CORRELATION_ID="opal-webhook-1732123456-abc7def"

# Step 2: Trace complete request flow
grep -r "$CORRELATION_ID" logs/ | sort

# Step 3: Identify processing timeline
grep "$CORRELATION_ID" logs/*.log | grep -E "Request received|calling|response|completed" | sort

# Step 4: Check for errors
grep "$CORRELATION_ID" logs/*.log | grep -E "ERROR|❌|failed"
```

### 2. Performance Analysis
```bash
# Find slowest requests in last hour
grep "$(date -d '1 hour ago' '+%Y-%m-%d %H:')" logs/*.log | \
  grep "processing_time_ms" | \
  awk '{print $NF}' | \
  sort -n | \
  tail -10

# Analyze specific slow request
SLOW_CORRELATION_ID="opal-webhook-1732123456-xyz9mno"
grep "$SLOW_CORRELATION_ID" logs/*.log | grep -E "processing_time|duration"
```

### 3. Integration Health Monitoring
```typescript
// Check correlation ID coverage across requests
const monitorCorrelationCoverage = () => {
  const totalRequests = getTotalRequestCount();
  const requestsWithCorrelation = getRequestsWithCorrelationId();

  const coverage = requestsWithCorrelation / totalRequests;

  if (coverage < 0.95) {
    console.warn('⚠️ Correlation ID coverage below 95%', {
      coverage,
      totalRequests,
      requestsWithCorrelation,
      missingCorrelationIds: totalRequests - requestsWithCorrelation
    });
  }

  return { coverage, totalRequests, requestsWithCorrelation };
};
```

## ✅ Validation Checklist

### Pre-Implementation Validation
- [ ] Correlation ID format follows standard pattern
- [ ] Service prefix is registered and unique
- [ ] Logging includes correlation ID at all key points
- [ ] Response headers include correlation ID and processing time
- [ ] Error responses include correlation ID for client debugging

### Post-Implementation Validation
- [ ] End-to-end request tracing works correctly
- [ ] Correlation IDs appear in downstream service logs
- [ ] Performance metrics can be extracted from logs
- [ ] Error debugging is improved with correlation tracking
- [ ] Monitoring dashboards receive correlation data

### Production Monitoring
- [ ] Correlation ID coverage > 95% of requests
- [ ] Average processing time tracking functional
- [ ] Error correlation analysis available
- [ ] Cross-service request tracing operational

## 📚 Reference Implementation

### Complete Wrapper Endpoint Example
```typescript
// /api/tools/osa_send_data_to_osa_webhook/route.ts
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const correlationId = `opal-webhook-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  try {
    console.log('🚀 [OPAL Webhook Tool] Request received', {
      correlationId,
      userAgent: request.headers.get('user-agent'),
      contentType: request.headers.get('content-type')
    });

    // Process request with correlation tracking...

    return NextResponse.json(responseData, {
      headers: {
        'X-Correlation-ID': correlationId,
        'X-Processing-Time': (Date.now() - startTime).toString()
      }
    });

  } catch (error) {
    console.error('❌ [OPAL Webhook Tool] Request failed', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime
    });

    return NextResponse.json({
      success: false,
      correlation_id: correlationId,
      processing_time_ms: Date.now() - startTime
    }, { status: 500 });
  }
}
```

## 🚀 Future Enhancements

### Advanced Correlation Features
- **Distributed Tracing**: Integration with OpenTelemetry for microservices
- **Correlation Chains**: Parent-child correlation relationships
- **Request Replay**: Ability to replay requests using correlation ID
- **Real-time Monitoring**: Live correlation ID tracking dashboard

### Integration Improvements
- **Automatic Propagation**: Middleware to auto-inject correlation IDs
- **Cross-Origin Support**: CORS-safe correlation ID handling
- **Client Libraries**: SDK for consistent correlation ID usage
- **Analytics Integration**: Automatic export to analytics platforms

---

**Document Version**: 1.0
**Last Updated**: 2025-11-20
**Implementation Status**: Production Ready
**Coverage Target**: 95%+ of all requests