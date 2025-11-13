# OPAL → OSA Event Schema Catalog

## Overview

This catalog provides a comprehensive reference for all event schemas in the OPAL → OSA event-driven architecture, including Avro and Protobuf definitions with idempotency keys and correlation IDs.

## Schema Organization

```
schemas/
├── avro/
│   ├── events/           # Core business events
│   └── sse/             # Server-Sent Events
├── protobuf/
│   ├── events/          # Core business events
│   └── sse/             # Server-Sent Events
└── SCHEMA_CATALOG.md    # This file
```

## Event Types Summary

| Event Type | Avro Schema | Protobuf Schema | Idempotency Key | Description |
|------------|-------------|-----------------|-----------------|-------------|
| **workflow-started** | `workflow-started.avsc` | `workflow_started.proto` | `workflow_id` | Workflow execution begins |
| **agent-completed** | `agent-completed.avsc` | `agent_completed.proto` | `workflow_id:agent_id:offset` | Individual agent finishes |
| **workflow-completed** | `workflow-completed.avsc` | `workflow_completed.proto` | `workflow_id` | Entire workflow finishes |
| **rag-upserted** | `rag-upserted.avsc` | `rag_upserted.proto` | `upsert_id` | Knowledge base updated |
| **decision-generated** | `decision-generated.avsc` | `decision_generated.proto` | `decision_id` | Recommendations created |
| **decision-degraded** | `decision-degraded.avsc` | `decision_degraded.proto` | `degradation_id` | Quality degradation detected |
| **preferences-updated** | `preferences-updated.avsc` | `preferences_updated.proto` | `user_id:update_type` | User settings changed |
| **agent-update** (SSE) | `sse/agent-update.avsc` | `sse/agent_update.proto` | `workflow_id:agent_id:sequence_number` | Real-time agent progress |
| **recommendation-preview** (SSE) | `sse/recommendation-preview.avsc` | `sse/recommendation_preview.proto` | `workflow_id:recommendation_id:sequence_number` | Real-time recommendation updates |

## Core Event Schemas

### 1. Workflow Started
**Trigger**: API call to `/api/orchestrations/trigger`
**Idempotency**: `workflow_id`
**Correlation**: Inherited from API request

```yaml
Subject: opal.events.workflow-started-value
Schema Version: 1.0.0
Required Fields:
  - schema_version
  - event_id
  - correlation_id
  - workflow_id
  - session_id
  - timestamp
  - source_system
  - environment
```

### 2. Agent Completed
**Trigger**: Webhook from OPAL agent
**Idempotency**: `${workflow_id}:${agent_id}:${offset}`
**Correlation**: Inherited from workflow

```yaml
Subject: opal.events.agent-completed-value
Schema Version: 1.0.0
Required Fields:
  - schema_version
  - event_id
  - correlation_id
  - workflow_id
  - agent_id (enum)
  - execution_status (enum)
  - timestamp
  - source_system
  - environment
```

### 3. Workflow Completed
**Trigger**: Internal orchestrator after all agents complete
**Idempotency**: `workflow_id`
**Correlation**: Inherited from workflow

```yaml
Subject: opal.events.workflow-completed-value
Schema Version: 1.0.0
Required Fields:
  - schema_version
  - event_id
  - correlation_id
  - workflow_id
  - session_id
  - status (enum)
  - agents_completed
  - total_agents
  - total_processing_time_ms
  - start_timestamp
  - completion_timestamp
```

### 4. RAG Upserted
**Trigger**: Knowledge base operations
**Idempotency**: `upsert_id`
**Correlation**: Links to originating workflow or external request

```yaml
Subject: opal.events.rag-upserted-value
Schema Version: 1.0.0
Required Fields:
  - schema_version
  - event_id
  - correlation_id
  - upsert_id
  - operation_type (enum)
  - documents_processed
  - documents_inserted
  - documents_updated
  - knowledge_source (enum)
  - processing_time_ms
```

### 5. Decision Generated
**Trigger**: API call to `/api/recommendations`
**Idempotency**: `decision_id`
**Correlation**: Inherited from workflow

```yaml
Subject: opal.events.decision-generated-value
Schema Version: 1.0.0
Required Fields:
  - schema_version
  - event_id
  - correlation_id
  - decision_id
  - workflow_id
  - recommendations_count
  - recommendations (array)
  - processing_metadata
```

### 6. Decision Degraded
**Trigger**: Quality monitoring system
**Idempotency**: `degradation_id`
**Correlation**: Links to original decision

```yaml
Subject: opal.events.decision-degraded-value
Schema Version: 1.0.0
Required Fields:
  - schema_version
  - event_id
  - correlation_id
  - degradation_id
  - degradation_type (enum)
  - severity (enum)
  - confidence_metrics
  - detection_metadata
```

### 7. Preferences Updated
**Trigger**: User preference changes
**Idempotency**: `${user_id}:${update_type}`
**Correlation**: Links to user session

```yaml
Subject: opal.events.preferences-updated-value
Schema Version: 1.0.0
Required Fields:
  - schema_version
  - event_id
  - correlation_id
  - user_id
  - update_type (enum)
  - updated_preferences
  - changes_detected (array)
  - triggered_by (enum)
```

## Server-Sent Event Schemas

### 8. Agent Update (SSE)
**Trigger**: Real-time agent progress
**Idempotency**: `${workflow_id}:${agent_id}:${sequence_number}`
**Correlation**: Inherited from workflow

```yaml
Subject: opal.events.sse.agent-update-value
Schema Version: 1.0.0
Streaming Endpoint: /api/stream/agent-updates
Required Fields:
  - schema_version
  - stream_id
  - correlation_id
  - workflow_id
  - agent_id (enum)
  - sequence_number
  - progress_percentage
  - status (enum)
```

### 9. Recommendation Preview (SSE)
**Trigger**: Real-time recommendation updates
**Idempotency**: `${workflow_id}:${recommendation_id}:${sequence_number}`
**Correlation**: Inherited from workflow

```yaml
Subject: opal.events.sse.recommendation-preview-value
Schema Version: 1.0.0
Streaming Endpoint: /api/stream/agent-updates
Required Fields:
  - schema_version
  - stream_id
  - correlation_id
  - workflow_id
  - recommendation_id
  - sequence_number
  - update_type (enum)
  - contributing_agent_id (enum)
  - recommendation_preview
  - processing_progress
```

## Enum Definitions

### Agent Types
```
- experiment_blueprinter
- audience_suggester
- content_review
- roadmap_generator
- integration_health
- personalization_idea_generator
- cmp_organizer
- customer_journey
- geo_audit
```

### Execution Status
```
- success
- failure
- timeout
```

### Environment
```
- development
- staging
- production
```

### Workflow Status
```
- completed
- failed
- timeout
- cancelled
```

## Schema Registry Subjects

### Production Naming Convention
```
opal.events.{event-name}-value     # Event data
opal.events.{event-name}-key       # Partition key (optional)
opal.events.sse.{event-name}-value # SSE event data
```

### Example Subjects
```
opal.events.workflow-started-value
opal.events.agent-completed-value
opal.events.workflow-completed-value
opal.events.rag-upserted-value
opal.events.decision-generated-value
opal.events.decision-degraded-value
opal.events.preferences-updated-value
opal.events.sse.agent-update-value
opal.events.sse.recommendation-preview-value
```

## Kafka Topic Recommendations

### Topic Naming
```
opal.events.workflow.started
opal.events.agent.completed
opal.events.workflow.completed
opal.events.knowledge.upserted
opal.events.decision.generated
opal.events.decision.degraded
opal.events.user.preferences.updated
opal.events.sse.agent.updates
opal.events.sse.recommendation.previews
```

### Topic Configuration
```yaml
Partitions: 6 (allows parallel processing)
Replication Factor: 3 (production)
Cleanup Policy: delete
Retention: 7 days (events), 24 hours (SSE)
Compression: snappy
```

## Data Flow Examples

### Complete Workflow Flow
```
1. workflow-started (workflow_id: wf-123)
   ├── correlation_id: api-1762961202697-ipoahk
   └── triggers: 9 agent executions

2. agent-completed × 9 (workflow_id: wf-123)
   ├── correlation_id: api-1762961202697-ipoahk
   ├── idempotency: wf-123:content_review:3
   └── each agent reports completion

3. workflow-completed (workflow_id: wf-123)
   ├── correlation_id: api-1762961202697-ipoahk
   └── summarizes all agent results

4. decision-generated (decision_id: dec-456)
   ├── correlation_id: api-1762961202697-ipoahk
   ├── workflow_id: wf-123
   └── contains aggregated recommendations
```

### SSE Streaming Flow
```
1. Client connects: /api/stream/agent-updates?workflow_id=wf-123

2. agent-update events (every 5 seconds)
   ├── workflow_id: wf-123
   ├── agent_id: content_review
   ├── sequence_number: 1, 2, 3...
   └── progress_percentage: 25, 50, 75, 100

3. recommendation-preview events (on milestones)
   ├── workflow_id: wf-123
   ├── recommendation_id: rec-789
   ├── sequence_number: 1, 2, 3...
   └── confidence updates and evidence
```

## Version Evolution Examples

### Adding Optional Field (v1.0.0 → v1.1.0)
```diff
// workflow-started.avsc
{
  "name": "workflow_id", "type": "string"
},
+ {
+   "name": "priority_level",
+   "type": ["null", "string"],
+   "default": null,
+   "doc": "Workflow execution priority"
+ }
```

### Adding Enum Value (v1.1.0 → v1.2.0)
```diff
// agent types enum
{
  "type": "enum",
  "name": "AgentType",
  "symbols": [
    "experiment_blueprinter",
    "audience_suggester",
    // ... existing agents
+   "security_auditor"
  ]
}
```

## Usage Examples

### Publishing Event (Node.js)
```javascript
const event = {
  schema_version: '1.0.0',
  event_id: generateEventId(),
  correlation_id: 'api-1762961202697-ipoahk',
  workflow_id: 'wf-123456789',
  // ... other fields
};

await producer.publishWorkflowStarted(event);
```

### Consuming with Idempotency
```javascript
const idempotencyKey = `${event.workflow_id}:${event.agent_id}:${event.offset}`;
const processed = await redis.get(`processed:${idempotencyKey}`);

if (!processed) {
  await processEvent(event);
  await redis.setex(`processed:${idempotencyKey}`, 86400, Date.now());
}
```

## References

- [Schema Versioning Guide](./SCHEMA_VERSIONING_GUIDE.md)
- [Schema Registry Configuration](./SCHEMA_REGISTRY_CONFIG.md)
- [OpenAPI Specification](./openapi.yaml)
- [OPAL Integration Runbook](./OPAL_INTEGRATION_RUNBOOK.md)