# Schema Versioning & Backward Compatibility Guide

## Overview

This guide defines the versioning strategy and backward compatibility approach for OPAL → OSA event schemas. Our event-driven architecture relies on both Avro and Protobuf schemas to ensure reliable data exchange across distributed systems.

## Versioning Strategy

### Semantic Versioning

We follow semantic versioning (SemVer) for all event schemas:

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Breaking changes that require consumer updates
- **MINOR**: Backward-compatible additions (new optional fields)
- **PATCH**: Bug fixes or documentation updates

**Current Version**: `1.0.0`

### Version Field

Every event schema includes a `schema_version` field:

**Avro Example**:
```json
{
  "name": "schema_version",
  "type": "string",
  "default": "1.0.0",
  "doc": "Schema version for backward compatibility tracking"
}
```

**Protobuf Example**:
```proto
// Schema version for backward compatibility tracking
string schema_version = 1;
```

## Backward Compatibility Rules

### ✅ ALLOWED Changes (Minor/Patch Versions)

1. **Add Optional Fields**
   - New fields with default values
   - Fields marked as `optional` in Protobuf
   - Fields with `"null"` union and `"default": null` in Avro

2. **Add Enum Values**
   - New enum symbols (at the end of the list)
   - Must not change existing enum order

3. **Documentation Updates**
   - Field descriptions and comments
   - Schema documentation

4. **Default Value Changes**
   - Only for newly added fields
   - Must not change existing field defaults

### ❌ FORBIDDEN Changes (Breaking - Requires Major Version)

1. **Remove Fields**
   - Deleting any existing field

2. **Change Field Types**
   - Changing data types (e.g., `string` → `int`)
   - Modifying logical types

3. **Change Field Names**
   - Renaming existing fields

4. **Change Required Status**
   - Making optional fields required
   - Removing default values from required fields

5. **Reorder Enum Values**
   - Changing enum symbol order in Avro
   - Changing enum number assignments in Protobuf

6. **Change Field Numbers** (Protobuf only)
   - Protobuf field numbers are immutable

## Idempotency Keys

### Purpose

Idempotency keys ensure events can be safely retried and deduplicated across distributed systems.

### Implementation

Each event type defines specific fields as idempotency keys:

#### Core Event Idempotency Keys

| Event Type | Primary Keys | Secondary Keys |
|------------|-------------|----------------|
| `workflow-started` | `workflow_id` | - |
| `agent-completed` | `workflow_id`, `agent_id` | `offset` |
| `workflow-completed` | `workflow_id` | - |
| `rag-upserted` | `upsert_id` | - |
| `decision-generated` | `decision_id` | - |
| `decision-degraded` | `degradation_id` | `original_decision_id` |
| `preferences-updated` | `user_id`, `update_type` | `session_id` |

#### SSE Event Idempotency Keys

| Event Type | Primary Keys | Ordering Key |
|------------|-------------|-------------|
| `agent-update` | `workflow_id`, `agent_id` | `sequence_number` |
| `recommendation-preview` | `workflow_id`, `recommendation_id` | `sequence_number` |

### Usage Example

```javascript
// Generate idempotency key for agent completion
const idempotencyKey = `${workflow_id}:${agent_id}:${offset}`;

// Check for existing event before processing
if (!eventExists(idempotencyKey)) {
  processEvent(event);
  markEventProcessed(idempotencyKey);
}
```

## Correlation IDs

### Purpose

Correlation IDs enable distributed tracing across the entire OPAL → OSA data flow.

### Format

```
api-{timestamp}-{random}
webhook-{timestamp}-{random}
stream-{timestamp}-{random}
```

### Propagation

1. **API Request**: Generated at entry point
2. **Webhook Event**: Inherited from triggering request
3. **SSE Stream**: Links to originating workflow
4. **Decision Generation**: Connects all related events

### Example Flow

```
api-1762961202697-ipoahk
├── workflow-started (correlation_id: api-1762961202697-ipoahk)
├── agent-completed (correlation_id: api-1762961202697-ipoahk)
├── decision-generated (correlation_id: api-1762961202697-ipoahk)
└── sse events (correlation_id: api-1762961202697-ipoahk)
```

## Environment Handling

### Environment Field

All schemas include an environment enum:

**Avro**:
```json
{
  "name": "environment",
  "type": {
    "type": "enum",
    "name": "Environment",
    "symbols": ["development", "staging", "production"]
  },
  "default": "development"
}
```

**Protobuf**:
```proto
enum Environment {
  ENVIRONMENT_UNSPECIFIED = 0;
  DEVELOPMENT = 1;
  STAGING = 2;
  PRODUCTION = 3;
}
Environment environment = 15;
```

### Environment-Specific Behavior

- **Development**: Relaxed validation, verbose logging
- **Staging**: Production-like validation, structured logging
- **Production**: Strict validation, minimal logging

## Schema Evolution Examples

### Example 1: Adding Optional Field (Minor Version 1.1.0)

**Before (v1.0.0)**:
```json
{
  "type": "record",
  "name": "WorkflowStarted",
  "fields": [
    {"name": "workflow_id", "type": "string"},
    {"name": "session_id", "type": "string"}
  ]
}
```

**After (v1.1.0)**:
```json
{
  "type": "record",
  "name": "WorkflowStarted",
  "fields": [
    {"name": "workflow_id", "type": "string"},
    {"name": "session_id", "type": "string"},
    {"name": "priority", "type": ["null", "string"], "default": null}
  ]
}
```

### Example 2: Adding Enum Value (Minor Version 1.2.0)

**Before (v1.1.0)**:
```json
{
  "type": "enum",
  "name": "WorkflowType",
  "symbols": ["strategy_workflow"]
}
```

**After (v1.2.0)**:
```json
{
  "type": "enum",
  "name": "WorkflowType",
  "symbols": ["strategy_workflow", "analysis_workflow"]
}
```

### Example 3: Breaking Change (Major Version 2.0.0)

**Before (v1.2.0)**:
```json
{"name": "processing_time", "type": "string"}
```

**After (v2.0.0)**:
```json
{"name": "processing_time_ms", "type": "long"}
```

## Consumer Guidelines

### Schema Registry Integration

1. **Always specify schema version** when producing events
2. **Use schema registry** for version resolution
3. **Handle multiple versions** in consumers
4. **Validate against schema** before processing

### Version Compatibility Matrix

| Producer Version | Consumer Version | Compatible | Notes |
|-----------------|------------------|------------|--------|
| 1.0.0 | 1.0.0 | ✅ | Perfect match |
| 1.1.0 | 1.0.0 | ✅ | Forward compatible |
| 1.0.0 | 1.1.0 | ✅ | Backward compatible |
| 2.0.0 | 1.x.x | ❌ | Breaking change |
| 1.x.x | 2.0.0 | ❌ | Breaking change |

### Error Handling

```javascript
// Consumer version compatibility check
function canProcessEvent(event) {
  const [producerMajor] = event.schema_version.split('.');
  const [consumerMajor] = CONSUMER_VERSION.split('.');

  if (producerMajor !== consumerMajor) {
    throw new Error(`Incompatible schema version: ${event.schema_version}`);
  }

  return true;
}
```

## Migration Strategies

### Rolling Deployment

1. **Phase 1**: Deploy consumers with multi-version support
2. **Phase 2**: Deploy producers with new schema version
3. **Phase 3**: Verify compatibility across environments
4. **Phase 4**: Remove old version support

### Blue-Green Deployment

1. **Prepare**: New environment with updated schemas
2. **Switch**: Route traffic to new environment
3. **Validate**: Confirm no compatibility issues
4. **Cleanup**: Decommission old environment

## Monitoring & Alerts

### Schema Version Metrics

- **Version Distribution**: Track schema versions in use
- **Compatibility Errors**: Monitor version mismatches
- **Migration Progress**: Track adoption of new versions

### Alert Conditions

1. **High Error Rate**: Schema validation failures
2. **Version Skew**: Large gaps between producer/consumer versions
3. **Breaking Changes**: Major version mismatches

## Best Practices

### For Schema Designers

1. **Design for Extension**: Use optional fields liberally
2. **Avoid Breaking Changes**: Plan schema evolution carefully
3. **Document Changes**: Maintain clear migration guides
4. **Test Compatibility**: Validate with existing consumers

### For Producers

1. **Set Version Explicitly**: Don't rely on defaults
2. **Validate Before Send**: Schema validation on publish
3. **Include All Required Fields**: Ensure completeness
4. **Use Meaningful Defaults**: Facilitate compatibility

### For Consumers

1. **Handle Missing Fields**: Gracefully handle optional fields
2. **Validate Schema Version**: Check compatibility
3. **Log Version Metrics**: Track version usage
4. **Plan for Evolution**: Design for schema changes

## Schema Registry Configuration

See [Schema Registry Configuration Guide](./SCHEMA_REGISTRY_CONFIG.md) for detailed setup and usage examples.