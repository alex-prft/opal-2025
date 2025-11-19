---
name: opal-integration-workflow
description: Comprehensive OPAL integration workflow management for OSA applications. Use when implementing OPAL API routes, workflow synchronization, force sync operations, health monitoring, or troubleshooting OPAL integration issues. Provides standardized patterns for authentication, payload validation, error handling, correlation tracking, and monitoring across all OPAL-related operations.
---

# OPAL Integration Workflow

This skill provides standardized patterns and reusable components for OPAL (Optimizely API Layer) integration within OSA applications.

## Core Capabilities

### 1. API Route Generation
Generate standardized OPAL API routes with built-in authentication, validation, and error handling:

- **Template**: Use `scripts/api-route-template.ts` as your starting point
- **Key Features**: Authentication checks, correlation ID generation, structured logging, standardized responses
- **Common Routes**: `/api/opal/sync`, `/api/opal/force-sync-status`, `/api/opal/workflow-tracker`

### 2. Validation Framework
Comprehensive validation for OPAL operations using `scripts/opal-validation-helper.ts`:

```typescript
import { OPALValidator } from './scripts/opal-validation-helper';

// Validate complete OPAL integration
const result = await OPALValidator.validateOPALIntegration(payload);
if (!result.success) {
  // Handle validation errors
  console.error('Validation failed:', result.errors);
}
```

### 3. Workflow Patterns
Standardized patterns for OPAL workflow execution:

- **Force Sync Operations**: Immediate workflow synchronization
- **Async Processing**: Long-running workflow tracking with job IDs
- **Health Monitoring**: Comprehensive health checks with fallback strategies
- **Error Recovery**: Retry mechanisms and graceful degradation

## Quick Start Guide

### Creating a New OPAL API Route

1. **Copy the template**:
   ```bash
   cp scripts/api-route-template.ts src/app/api/opal/your-endpoint/route.ts
   ```

2. **Customize for your use case**:
   - Replace the "YOUR OPAL LOGIC HERE" section
   - Update correlation ID prefix if needed
   - Add specific payload validation

3. **Use validation helper**:
   ```typescript
   import { OPALValidator } from '@/lib/opal-validation-helper';

   const validation = await OPALValidator.validateOPALIntegration(payload);
   if (!validation.success) {
     return NextResponse.json({
       success: false,
       errors: validation.errors
     }, { status: 400 });
   }
   ```

### Implementing Force Sync

Use the established patterns from `references/workflow-configuration.md`:

```typescript
const correlationId = OPALValidator.generateCorrelationId('force-sync');

const result = await triggerOpalWorkflow({
  client_name: body.client_name,
  industry: body.industry,
  force_sync: true,
  metadata: {
    correlation_id: correlationId,
    api_request: true
  }
});
```

## Reference Documentation

### API Patterns
See `references/api-patterns.md` for:
- Standard API route structures
- Error handling patterns
- Payload validation techniques
- Performance considerations

### Workflow Configuration
See `references/workflow-configuration.md` for:
- Environment setup
- Workflow payload structures
- Health check implementation
- Integration testing approaches

## Environment Setup

### Required Environment Variables
```bash
OPAL_STRATEGY_WORKFLOW_AUTH_KEY=your_auth_key
OPAL_ENDPOINT_URL=https://your-opal-instance.com/api
OPAL_PRODUCTION_ENDPOINT=https://prod-opal.com/api
OPAL_WEBHOOK_SECRET=your_webhook_secret
```

### Optional Configuration
```bash
OPAL_TIMEOUT_MS=30000
OPAL_RETRY_ATTEMPTS=3
OPAL_LOG_LEVEL=info
```

## Common Workflows

### 1. API Route Implementation
- Use `api-route-template.ts` as base
- Implement specific OPAL logic
- Add comprehensive error handling
- Include correlation ID tracking

### 2. Force Sync Implementation
- Validate authentication and payload
- Generate correlation ID
- Execute OPAL workflow with metadata
- Log results and handle errors

### 3. Health Check Implementation
- Check OPAL API connectivity
- Validate authentication status
- Monitor workflow execution status
- Implement fallback strategies

### 4. Troubleshooting Integration Issues
- Use correlation IDs to track requests
- Check authentication configuration
- Validate payload structure
- Review error logs for patterns

## Best Practices

### Authentication
- Always validate `OPAL_STRATEGY_WORKFLOW_AUTH_KEY`
- Use environment-specific endpoints
- Implement secure credential storage

### Logging
- Use structured logging with correlation IDs
- Include operation type and status
- Log performance metrics
- Sanitize sensitive data

### Error Handling
- Provide meaningful error messages
- Use appropriate HTTP status codes
- Include correlation IDs in error responses
- Implement graceful degradation

### Monitoring
- Track workflow execution metrics
- Monitor authentication failures
- Alert on high error rates
- Measure response times

## Troubleshooting Guide

### Common Issues

**Authentication Errors**
- Verify `OPAL_STRATEGY_WORKFLOW_AUTH_KEY` is set
- Check endpoint configuration
- Validate credentials haven't expired

**Payload Validation Failures**
- Ensure required fields are present (`client_name`, `industry`)
- Check data types and formats
- Review payload structure against schema

**Workflow Execution Failures**
- Check OPAL service availability
- Review correlation ID in logs
- Verify network connectivity
- Check for timeout issues

**Performance Issues**
- Monitor response times
- Check for memory leaks
- Review error rates
- Optimize payload sizes

## Integration Checklist

Before deploying OPAL integrations:

- [ ] Environment variables configured
- [ ] Authentication tested
- [ ] Payload validation implemented
- [ ] Error handling comprehensive
- [ ] Correlation ID tracking enabled
- [ ] Health checks functional
- [ ] Monitoring configured
- [ ] Fallback strategies tested
- [ ] Documentation updated
- [ ] Integration tests passing

## Support

For OPAL integration issues:
1. Check correlation ID in logs
2. Verify environment configuration
3. Test authentication separately
4. Review payload validation results
5. Check OPAL service status