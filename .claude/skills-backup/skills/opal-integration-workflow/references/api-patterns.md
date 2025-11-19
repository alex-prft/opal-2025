# OPAL API Integration Patterns

## Common API Route Structure

All OSA OPAL API routes follow this standardized pattern:

### 1. Authentication Layer
```typescript
if (!process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY) {
  return NextResponse.json({
    success: false,
    error: 'Configuration Error',
    message: 'OPAL authentication not configured'
  }, { status: 500 });
}
```

### 2. Request Parsing with Fallback
```typescript
const body = await req.json().catch(() => ({}));
```

### 3. Correlation ID Generation
```typescript
const correlationId = `operation-${Date.now()}-${Math.random().toString(36).substring(2)}`;
```

### 4. Structured Logging
```typescript
console.log('🔄 [OPAL Operation] Starting with correlation ID:', correlationId);
```

### 5. Standardized Response Format
```typescript
return NextResponse.json({
  success: boolean,
  correlation_id?: string,
  data?: any,
  error?: string,
  message?: string
});
```

## Key API Endpoints

### Force Sync Operations
- **POST** `/api/opal/sync` - Trigger immediate OPAL workflow sync
- **GET** `/api/opal/force-sync-status` - Check force sync status
- **POST** `/api/opal/sync-async/[jobId]` - Async sync with job tracking

### Workflow Management
- **POST** `/api/opal/workflow-tracker` - Track workflow execution
- **GET** `/api/opal/workflow-data-status` - Get workflow data status

### Health & Monitoring
- **GET** `/api/opal/health-with-fallback` - Health check with fallback logic
- **GET** `/api/admin/mapping-status` - OPAL mapping validation

### Data Tier Routes
- **Dynamic Routes**: `/api/opal/tier1/[tier1]`, `/api/opal/tier2/[tier1]/[tier2]`, etc.
- **Purpose**: Hierarchical data access for OPAL content

## Error Handling Patterns

### Standard Error Response
```typescript
catch (error) {
  console.error('❌ [OPAL API] Error:', error);

  return NextResponse.json({
    success: false,
    error: 'Internal Server Error',
    message: error instanceof Error ? error.message : 'Unknown error occurred',
    correlation_id: correlationId
  }, { status: 500 });
}
```

### Configuration Validation
```typescript
const requiredEnvVars = [
  'OPAL_STRATEGY_WORKFLOW_AUTH_KEY',
  'OPAL_ENDPOINT_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    return NextResponse.json({
      success: false,
      error: 'Configuration Error',
      message: `Missing required environment variable: ${envVar}`
    }, { status: 500 });
  }
}
```

## Payload Validation Patterns

### Client Context Validation
```typescript
const clientContext = {
  client_name: body.client_name || body.client_context?.client_name,
  industry: body.industry || body.client_context?.industry,
  recipients: body.recipients || body.client_context?.recipients
};

if (!clientContext.client_name) {
  return NextResponse.json({
    success: false,
    error: 'Validation Error',
    message: 'client_name is required'
  }, { status: 400 });
}
```

### Metadata Enrichment
```typescript
const metadata = {
  correlation_id: correlationId,
  api_request: true,
  timestamp: new Date().toISOString(),
  triggered_by: body.triggered_by || 'api',
  ...body.metadata
};
```

## Performance Considerations

### Async Processing
- Use async/await for all OPAL operations
- Implement timeout handling for external calls
- Provide job tracking for long-running operations

### Caching Strategy
- Cache OPAL configuration data
- Use correlation IDs for request deduplication
- Implement fallback mechanisms for service unavailability

### Monitoring Integration
- Log all OPAL operations with correlation IDs
- Track response times and success rates
- Alert on authentication failures or configuration errors