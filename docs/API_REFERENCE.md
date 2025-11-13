# OPAL Custom Tools API Reference

## Overview

This document provides comprehensive API documentation for the OPAL Custom Tools integration endpoints. All endpoints support production-grade security with HMAC verification, comprehensive error handling, and detailed logging.

## Base URL
- **Production**: `https://opal-2025.vercel.app`
- **Development**: `http://localhost:3000`

## Authentication

### HMAC Signature Authentication
All webhook endpoints require HMAC-SHA256 signature verification.

**Header Format**:
```
X-OSA-Signature: t=<timestamp>,v1=<signature>
```

**Signature Generation**:
```javascript
const payload = JSON.stringify(requestBody);
const timestamp = Date.now();
const signatureData = `${timestamp}${payload}`;
const signature = crypto.createHmac('sha256', webhookSecret)
  .update(signatureData)
  .digest('hex');
```

## Endpoints

### 1. Tool Discovery

#### GET `/api/opal/enhanced-tools`

Discover available OPAL tools and their configurations.

**Response**:
```json
{
  "tools": [
    {
      "name": "send_data_to_osa_enhanced",
      "version": "2.0.0",
      "description": "Send OPAL agent execution data to OSA with enhanced processing capabilities",
      "webhook_target_url": "https://opal-2025.vercel.app/api/webhooks/opal-workflow",
      "execution_endpoint": "https://opal-2025.vercel.app/api/opal/enhanced-tools",
      "parameters": {
        "workflow_id": "string (required)",
        "agent_id": "string (required)",
        "execution_status": "enum: success|failure|timeout (required)",
        "agent_data": "object (required)",
        "target_environment": "enum: development|staging|production (optional)",
        "offset": "number (optional)",
        "metadata": "object (optional)"
      }
    }
  ],
  "base_url": "https://opal-2025.vercel.app",
  "discovery_timestamp": "2023-11-12T10:30:00.000Z"
}
```

**cURL Example**:
```bash
curl -X GET "https://opal-2025.vercel.app/api/opal/enhanced-tools" \
  -H "Accept: application/json"
```

### 2. Tool Execution

#### POST `/api/opal/enhanced-tools`

Execute OPAL enhanced tools with agent data.

**Request Body**:
```json
{
  "tool_name": "send_data_to_osa_enhanced",
  "parameters": {
    "workflow_id": "workflow-abc123",
    "agent_id": "content-analysis-agent",
    "execution_status": "success",
    "agent_data": {
      "analysis_results": {
        "content_score": 0.87,
        "recommendations": ["Increase call-to-action prominence"],
        "categories": ["ecommerce", "conversion-optimization"],
        "confidence": 0.94
      },
      "processing_metrics": {
        "execution_time_ms": 2340,
        "memory_usage_mb": 128,
        "api_calls_made": 3
      }
    },
    "target_environment": "production",
    "offset": 1,
    "metadata": {
      "opal_version": "2.0.0",
      "source_system": "OPAL",
      "execution_timestamp": "2023-11-12T10:30:00.000Z"
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Enhanced tool execution completed successfully",
  "correlation_id": "corr-abc123-def456",
  "webhook_response": {
    "success": true,
    "event_id": "evt-789012",
    "duplicate": false
  },
  "duration_ms": 1250,
  "retry_count": 0,
  "timestamp": "2023-11-12T10:30:01.250Z"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Invalid tool name or missing required parameters",
  "details": {
    "validation_errors": [
      "tool_name must be 'send_data_to_osa_enhanced'",
      "workflow_id is required"
    ]
  },
  "correlation_id": "corr-error-123",
  "timestamp": "2023-11-12T10:30:01.250Z"
}
```

**cURL Example**:
```bash
curl -X POST "https://opal-2025.vercel.app/api/opal/enhanced-tools" \
  -H "Content-Type: application/json" \
  -H "User-Agent: OPAL-Agent/2.0" \
  -d '{
    "tool_name": "send_data_to_osa_enhanced",
    "parameters": {
      "workflow_id": "test-workflow-001",
      "agent_id": "test-agent-001",
      "execution_status": "success",
      "agent_data": {"test": "data"}
    }
  }'
```

### 3. Webhook Receiver

#### POST `/api/webhooks/opal-workflow`

Receive and process OPAL agent webhook events.

**Required Headers**:
```
Content-Type: application/json
X-OSA-Signature: t=<timestamp>,v1=<signature>
User-Agent: OPAL-Agent/2.0
```

**Request Body**:
```json
{
  "workflow_id": "workflow-abc123",
  "agent_id": "content-analysis-agent",
  "execution_status": "success",
  "agent_data": {
    "results": "analysis completed",
    "metrics": {"duration": 2340}
  },
  "timestamp": "2023-11-12T10:30:00.000Z",
  "offset": 1,
  "metadata": {
    "source": "OPAL",
    "version": "2.0.0"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "event_id": "evt-789012",
  "duplicate": false,
  "signature_valid": true,
  "processing_time_ms": 45,
  "timestamp": "2023-11-12T10:30:00.045Z"
}
```

**Error Responses**:

*401 Unauthorized - Invalid Signature*:
```json
{
  "success": false,
  "error": "Signature verification failed",
  "message": "HMAC signature is invalid or timestamp is too old",
  "timestamp": "2023-11-12T10:30:00.000Z"
}
```

*409 Conflict - Duplicate Event*:
```json
{
  "success": true,
  "message": "Duplicate event ignored",
  "event_id": "evt-789012",
  "duplicate": true,
  "original_timestamp": "2023-11-12T10:29:30.000Z"
}
```

### 4. Health Check

#### GET `/api/opal/health`

Get comprehensive health status of OPAL integration.

**Response**:
```json
{
  "overall_status": "green",
  "last_webhook_minutes_ago": 3,
  "signature_valid_rate": 0.996,
  "error_rate_24h": 0.012,
  "config_checks": {
    "osa_webhook_secret_configured": true,
    "osa_webhook_url_configured": true,
    "opal_tools_discovery_url_configured": true
  },
  "metrics": {
    "total_events_24h": 1247,
    "successful_events_24h": 1232,
    "failed_events_24h": 15,
    "last_event_timestamp": "2023-11-12T10:27:00.000Z",
    "signature_validation_rate": 0.996,
    "error_rate_24h": 0.012,
    "uptime_indicators": {
      "webhook_receiver_responding": true,
      "configuration_loaded": true,
      "database_accessible": true
    }
  },
  "status_details": {
    "status_reason": "All systems operational - recent webhook activity with high success rate",
    "last_status_change": "2023-11-12T09:15:00.000Z",
    "status_history": {
      "green_periods_24h": 23,
      "downtime_minutes_24h": 0,
      "last_green_timestamp": "2023-11-12T10:27:00.000Z"
    }
  },
  "endpoints": {
    "discovery": "https://opal-2025.vercel.app/api/opal/enhanced-tools",
    "webhook_receiver": "https://opal-2025.vercel.app/api/webhooks/opal-workflow",
    "diagnostics": "https://opal-2025.vercel.app/api/diagnostics/last-webhook",
    "health_check": "https://opal-2025.vercel.app/api/opal/health"
  },
  "generated_at": "2023-11-12T10:30:00.000Z"
}
```

**Status Levels**:
- **🟢 Green**: Optimal performance, recent events, low error rate
- **🟡 Yellow**: Functional but degraded (stale data or minor issues)
- **🔴 Red**: Critical issues (configuration problems or high error rate)

### 5. Diagnostics

#### GET `/api/diagnostics/last-webhook`

Retrieve recent webhook events for troubleshooting.

**Query Parameters**:
- `limit` (optional): Number of events to return (default: 25, max: 100)
- `status` (optional): Filter by HTTP status (`success`, `failure`, `all`)
- `workflow_id` (optional): Filter by specific workflow ID
- `signature_valid` (optional): Filter by signature validation (`true`, `false`)

**Response**:
```json
{
  "events": [
    {
      "id": "evt-789012",
      "workflow_id": "workflow-abc123",
      "agent_id": "content-analysis-agent",
      "received_at": "2023-11-12T10:27:00.000Z",
      "http_status": 202,
      "signature_valid": true,
      "processing_status": "completed",
      "error_text": null,
      "payload_size_bytes": 1024,
      "processing_time_ms": 45
    }
  ],
  "summary": {
    "total_count": 1247,
    "success_count": 1232,
    "failure_count": 15,
    "signature_valid_count": 1240,
    "signature_invalid_count": 7,
    "average_processing_time_ms": 38,
    "last_event_timestamp": "2023-11-12T10:27:00.000Z"
  },
  "troubleshooting": {
    "recent_errors": [
      {
        "timestamp": "2023-11-12T09:45:00.000Z",
        "error": "Signature verification failed",
        "frequency": 3
      }
    ],
    "recommendations": [
      "Check OPAL agent time synchronization",
      "Verify webhook secret configuration"
    ]
  },
  "generated_at": "2023-11-12T10:30:00.000Z"
}
```

**cURL Examples**:
```bash
# Get last 10 events
curl -s "https://opal-2025.vercel.app/api/diagnostics/last-webhook?limit=10"

# Get only failed events
curl -s "https://opal-2025.vercel.app/api/diagnostics/last-webhook?status=failure"

# Get events for specific workflow
curl -s "https://opal-2025.vercel.app/api/diagnostics/last-webhook?workflow_id=workflow-abc123"
```

## Error Codes

| HTTP Code | Description | Common Causes |
|-----------|-------------|---------------|
| 200 | Success | Request processed successfully |
| 202 | Accepted | Webhook received and queued for processing |
| 400 | Bad Request | Invalid request format or missing parameters |
| 401 | Unauthorized | Invalid or missing HMAC signature |
| 409 | Conflict | Duplicate event (idempotency check) |
| 422 | Unprocessable Entity | Request format valid but data validation failed |
| 500 | Internal Server Error | Server-side processing error |
| 503 | Service Unavailable | System health check failed (red status) |

## Rate Limiting

- **Discovery Endpoint**: 100 requests per minute per IP
- **Tool Execution**: 1000 requests per minute per agent
- **Webhook Receiver**: 5000 requests per minute total
- **Health/Diagnostics**: 200 requests per minute per IP

## Response Headers

All endpoints include standard headers:
```
Content-Type: application/json
X-Request-ID: unique-request-identifier
X-Processing-Time-MS: processing-duration-milliseconds
Cache-Control: no-cache (for dynamic content)
```

Health endpoint includes additional headers:
```
X-Health-Status: green|yellow|red
X-Last-Event-Minutes-Ago: minutes-since-last-webhook
```

## Webhook Event Schema

### Required Fields
```typescript
{
  workflow_id: string;     // OPAL workflow identifier
  agent_id: string;        // OPAL agent identifier
  execution_status: 'success' | 'failure' | 'timeout';
}
```

### Optional Fields
```typescript
{
  agent_data?: object;     // Agent execution results
  timestamp?: string;      // ISO 8601 timestamp
  offset?: number;         // Sequence number for ordering
  target_environment?: 'development' | 'staging' | 'production';
  metadata?: {             // Additional context
    opal_version?: string;
    source_system?: string;
    execution_timestamp?: string;
    [key: string]: any;
  };
}
```

## SDK Examples

### Node.js SDK Usage
```javascript
const { OPALClient } = require('@your-org/opal-client');

const client = new OPALClient({
  baseUrl: 'https://opal-2025.vercel.app',
  webhookSecret: process.env.OSA_WEBHOOK_SECRET,
  agentId: 'my-agent-001'
});

// Execute tool
const result = await client.executeTool('send_data_to_osa_enhanced', {
  workflow_id: 'workflow-123',
  execution_status: 'success',
  agent_data: { result: 'analysis complete' }
});

// Send webhook
await client.sendWebhook({
  workflow_id: 'workflow-123',
  agent_id: 'my-agent-001',
  execution_status: 'success',
  agent_data: { result: 'processing complete' }
});
```

### Python SDK Usage
```python
from opal_client import OPALClient

client = OPALClient(
    base_url='https://opal-2025.vercel.app',
    webhook_secret=os.environ['OSA_WEBHOOK_SECRET'],
    agent_id='my-agent-001'
)

# Execute tool
result = client.execute_tool('send_data_to_osa_enhanced', {
    'workflow_id': 'workflow-123',
    'execution_status': 'success',
    'agent_data': {'result': 'analysis complete'}
})

# Send webhook
client.send_webhook({
    'workflow_id': 'workflow-123',
    'agent_id': 'my-agent-001',
    'execution_status': 'success',
    'agent_data': {'result': 'processing complete'}
})
```

## Testing and Validation

### Test Payloads
Reference the `examples/opal-agent-config.json` file for complete test payload examples.

### Signature Testing
```bash
# Generate test signature
PAYLOAD='{"workflow_id":"test","agent_id":"test","execution_status":"success"}'
TIMESTAMP=$(date +%s)000
SECRET="your-webhook-secret"
SIGNATURE=$(echo -n "${TIMESTAMP}${PAYLOAD}" | openssl dgst -sha256 -hmac "${SECRET}" -hex | cut -d' ' -f2)

echo "X-OSA-Signature: t=${TIMESTAMP},v1=${SIGNATURE}"
```

## Support

For technical support and bug reports:
- **Documentation**: [OPAL Integration Runbook](./OPAL_INTEGRATION_RUNBOOK.md)
- **Issues**: GitHub Issues or internal ticketing system
- **Emergency**: On-call engineering support
- **Monitoring**: Use health check and diagnostics endpoints for real-time status