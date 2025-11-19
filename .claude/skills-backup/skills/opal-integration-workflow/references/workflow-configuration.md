# OPAL Workflow Configuration Patterns

## Environment Configuration

### Required Environment Variables
```bash
# Authentication
OPAL_STRATEGY_WORKFLOW_AUTH_KEY=your_auth_key_here
OPAL_ENDPOINT_URL=https://your-opal-instance.com/api

# Production-specific
OPAL_PRODUCTION_ENDPOINT=https://prod-opal.com/api
OPAL_WEBHOOK_SECRET=your_webhook_secret

# Optional but recommended
OPAL_TIMEOUT_MS=30000
OPAL_RETRY_ATTEMPTS=3
OPAL_LOG_LEVEL=info
```

### Environment-Specific Configuration
```typescript
const opalConfig = {
  development: {
    endpoint: process.env.OPAL_ENDPOINT_URL,
    timeout: 10000,
    retries: 1,
    logging: 'debug'
  },
  production: {
    endpoint: process.env.OPAL_PRODUCTION_ENDPOINT,
    timeout: 30000,
    retries: 3,
    logging: 'error'
  }
};
```

## Workflow Trigger Patterns

### Standard Workflow Payload
```typescript
interface OPALWorkflowPayload {
  // Required fields
  client_name: string;
  industry: string;

  // Context fields
  client_context?: {
    client_name: string;
    industry: string;
    recipients: string[];
  };

  // Business context
  company_size?: string;
  current_capabilities?: string[];
  business_objectives?: string[];
  additional_marketing_technology?: string[];
  timeline_preference?: string;
  budget_range?: string;

  // Operational fields
  sync_scope?: string;
  triggered_by?: string;
  force_sync?: boolean;

  // Metadata
  metadata?: {
    correlation_id: string;
    api_request: boolean;
    timestamp: string;
    [key: string]: any;
  };
}
```

### Workflow Execution Patterns
```typescript
async function executeOPALWorkflow(payload: OPALWorkflowPayload) {
  const correlationId = generateCorrelationId('workflow');

  try {
    console.log('🚀 [OPAL Workflow] Starting execution:', correlationId);

    // 1. Validate payload
    const validation = await validateWorkflowPayload(payload);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // 2. Enrich with metadata
    const enrichedPayload = {
      ...payload,
      metadata: {
        correlation_id: correlationId,
        execution_start: new Date().toISOString(),
        ...payload.metadata
      }
    };

    // 3. Execute workflow
    const result = await triggerOpalWorkflow(enrichedPayload);

    // 4. Log completion
    console.log('✅ [OPAL Workflow] Execution complete:', {
      correlationId,
      success: result.success,
      duration: Date.now() - startTime
    });

    return result;

  } catch (error) {
    console.error('❌ [OPAL Workflow] Execution failed:', error);
    throw error;
  }
}
```

## Force Sync Configuration

### Force Sync Triggers
```typescript
const forceSyncConfig = {
  // Automatic triggers
  schedules: [
    { cron: '0 */6 * * *', description: 'Every 6 hours' },
    { cron: '0 9 * * 1', description: 'Monday 9 AM' }
  ],

  // Manual triggers
  manual: {
    auth_required: true,
    rate_limit: '5/minute',
    allowed_roles: ['admin', 'workflow_manager']
  },

  // API triggers
  api: {
    endpoint: '/api/opal/sync',
    auth_method: 'bearer_token',
    payload_validation: true
  }
};
```

### Force Sync Workflow Steps
1. **Validation Phase**
   - Authentication check
   - Payload validation
   - Rate limit enforcement

2. **Preparation Phase**
   - Generate correlation ID
   - Enrich metadata
   - Log workflow start

3. **Execution Phase**
   - Trigger OPAL workflow
   - Monitor execution status
   - Handle retries if needed

4. **Completion Phase**
   - Log results
   - Update tracking database
   - Send notifications if configured

## Health Check Configuration

### OPAL Health Monitoring
```typescript
interface OPALHealthCheck {
  opal_api_status: 'healthy' | 'unhealthy' | 'unknown';
  auth_status: 'valid' | 'invalid' | 'expired';
  workflow_status: 'active' | 'inactive' | 'error';
  last_sync: string | null;
  active_workflows: number;
  error_rate: number;
}

async function performHealthCheck(): Promise<OPALHealthCheck> {
  // Implementation for comprehensive health checking
}
```

### Fallback Strategies
```typescript
const fallbackConfig = {
  // API unavailable
  api_fallback: {
    use_cached_data: true,
    cache_max_age: 3600, // 1 hour
    fallback_message: 'Using cached OPAL data'
  },

  // Authentication failure
  auth_fallback: {
    retry_attempts: 3,
    backoff_strategy: 'exponential',
    fallback_to_readonly: true
  },

  // Workflow failure
  workflow_fallback: {
    queue_for_retry: true,
    max_queue_size: 100,
    retry_delay: 300 // 5 minutes
  }
};
```

## Integration Testing Configuration

### Test Payloads
```typescript
const testPayloads = {
  minimal: {
    client_name: 'Test Client',
    industry: 'Technology'
  },

  complete: {
    client_name: 'Complete Test Client',
    industry: 'Healthcare',
    company_size: 'Enterprise',
    current_capabilities: ['CRM', 'Marketing Automation'],
    business_objectives: ['Increase conversions', 'Improve customer experience'],
    timeline_preference: '3-6 months',
    budget_range: '$50k-$100k'
  },

  invalid: {
    // Missing required fields for testing validation
    industry: 'Technology'
  }
};
```

### Monitoring Configuration
```typescript
const monitoringConfig = {
  metrics: {
    workflow_executions: 'counter',
    workflow_duration: 'histogram',
    error_rate: 'gauge',
    active_workflows: 'gauge'
  },

  alerts: {
    high_error_rate: { threshold: 0.1, duration: '5m' },
    slow_workflows: { threshold: 30000, duration: '2m' },
    auth_failures: { threshold: 5, duration: '1m' }
  }
};
```