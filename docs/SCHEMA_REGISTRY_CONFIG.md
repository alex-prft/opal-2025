# OPAL Schema Registry Configuration

## Overview

This document outlines the configuration and usage of the Confluent Schema Registry integration for OPAL → OSA event-driven architecture. The Schema Registry provides centralized schema management for Avro and Protobuf schemas used in Kafka event streaming.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   OPAL Events   │───▶│  Schema Registry │───▶│  Kafka Brokers  │
│  (Producers)    │    │  (Validation)    │    │   (Storage)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Event Consumers│
                       │  (Diagnostics &  │
                       │ Recommendations) │
                       └──────────────────┘
```

## Schema Registry Setup

### Docker Compose Configuration

```yaml
version: '3.8'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    hostname: zookeeper
    container_name: zookeeper
    ports:
      - "2181:2181"
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    hostname: broker
    container_name: broker
    depends_on:
      - zookeeper
    ports:
      - "29092:29092"
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: 'zookeeper:2181'
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://broker:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1

  schema-registry:
    image: confluentinc/cp-schema-registry:7.4.0
    hostname: schema-registry
    container_name: schema-registry
    depends_on:
      - kafka
    ports:
      - "8081:8081"
    environment:
      SCHEMA_REGISTRY_HOST_NAME: schema-registry
      SCHEMA_REGISTRY_KAFKASTORE_BOOTSTRAP_SERVERS: 'broker:29092'
      SCHEMA_REGISTRY_LISTENERS: http://0.0.0.0:8081
      SCHEMA_REGISTRY_COMPATIBILITY_LEVEL: BACKWARD
```

### Environment Variables

```bash
# Schema Registry Configuration
SCHEMA_REGISTRY_URL=http://localhost:8081
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# OPAL Schema Configuration
OPAL_SCHEMA_REGISTRY_AUTH_KEY=your-auth-key
OPAL_SCHEMA_COMPATIBILITY_LEVEL=BACKWARD
OPAL_SCHEMA_AUTO_REGISTER=true
```

## Schema Registration

### Automated Registration Script

```bash
#!/bin/bash
# scripts/register-schemas.sh

SCHEMA_REGISTRY_URL=${SCHEMA_REGISTRY_URL:-"http://localhost:8081"}
SCHEMAS_DIR="./schemas"

# Register Avro schemas
echo "Registering Avro schemas..."
for schema_file in $SCHEMAS_DIR/avro/events/*.avsc; do
  if [ -f "$schema_file" ]; then
    schema_name=$(basename "$schema_file" .avsc)
    subject_name="opal.events.${schema_name}-value"

    echo "Registering $subject_name..."

    # Create the registration payload
    payload=$(jq -n --rawfile schema "$schema_file" '{"schema": $schema}')

    # Register the schema
    curl -X POST \
      -H "Content-Type: application/vnd.schemaregistry.v1+json" \
      -d "$payload" \
      "$SCHEMA_REGISTRY_URL/subjects/$subject_name/versions"

    echo "✅ Registered $subject_name"
  fi
done

# Register Protobuf schemas
echo "Registering Protobuf schemas..."
for proto_file in $SCHEMAS_DIR/protobuf/events/*.proto; do
  if [ -f "$proto_file" ]; then
    schema_name=$(basename "$proto_file" .proto)
    subject_name="opal.events.${schema_name}-value"

    echo "Registering $subject_name (Protobuf)..."

    # Create the registration payload for Protobuf
    schema_content=$(cat "$proto_file" | sed 's/"/\\"/g' | tr -d '\n')
    payload="{\"schemaType\": \"PROTOBUF\", \"schema\": \"$schema_content\"}"

    # Register the schema
    curl -X POST \
      -H "Content-Type: application/vnd.schemaregistry.v1+json" \
      -d "$payload" \
      "$SCHEMA_REGISTRY_URL/subjects/$subject_name/versions"

    echo "✅ Registered $subject_name (Protobuf)"
  fi
done

echo "Schema registration complete!"
```

### Manual Registration Examples

#### Register Avro Schema

```bash
# Register workflow-started Avro schema
curl -X POST \
  -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  -d '{
    "schema": "$(cat schemas/avro/events/workflow-started.avsc | jq tostring)"
  }' \
  http://localhost:8081/subjects/opal.events.workflow-started-value/versions
```

#### Register Protobuf Schema

```bash
# Register agent-completed Protobuf schema
curl -X POST \
  -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  -d '{
    "schemaType": "PROTOBUF",
    "schema": "$(cat schemas/protobuf/events/agent_completed.proto | sed \"s/\"/\\\\\"/g\" | tr -d \"\n\")"
  }' \
  http://localhost:8081/subjects/opal.events.agent-completed-value/versions
```

## Producer Implementation

### Node.js Avro Producer

```javascript
// lib/producers/avro-producer.js
const avro = require('avsc');
const kafka = require('kafkajs');
const { SchemaRegistry } = require('@kafkajs/confluent-schema-registry');

class AvroEventProducer {
  constructor(config) {
    this.kafka = kafka({
      clientId: 'opal-avro-producer',
      brokers: config.kafka.brokers,
    });

    this.registry = new SchemaRegistry({
      host: config.schemaRegistry.url,
    });

    this.producer = this.kafka.producer();
  }

  async connect() {
    await this.producer.connect();
  }

  async disconnect() {
    await this.producer.disconnect();
  }

  async publishWorkflowStarted(workflowData) {
    const subject = 'opal.events.workflow-started-value';
    const schema = await this.registry.getLatestSchema(subject);

    const event = {
      schema_version: '1.0.0',
      event_id: generateEventId(),
      correlation_id: workflowData.correlation_id,
      workflow_id: workflowData.workflow_id,
      session_id: workflowData.session_id,
      workflow_name: 'strategy_workflow',
      triggered_by: workflowData.triggered_by,
      client_name: workflowData.client_name,
      engine_form: workflowData.engine_form,
      preferences: workflowData.preferences,
      webhook_url: workflowData.webhook_url,
      estimated_duration: workflowData.estimated_duration,
      timestamp: Date.now(),
      source_system: 'opal-api',
      environment: process.env.NODE_ENV || 'development'
    };

    // Encode the event using the schema
    const encodedValue = await this.registry.encode(schema.id, event);

    // Publish to Kafka
    await this.producer.send({
      topic: 'opal.events.workflow.started',
      messages: [{
        key: workflowData.workflow_id,
        value: encodedValue,
        headers: {
          'event_type': 'workflow.started',
          'schema_version': event.schema_version,
          'correlation_id': event.correlation_id
        }
      }]
    });

    console.log(`✅ Published workflow-started event: ${event.workflow_id}`);
  }

  async publishAgentCompleted(agentData) {
    const subject = 'opal.events.agent-completed-value';
    const schema = await this.registry.getLatestSchema(subject);

    const event = {
      schema_version: '1.0.0',
      event_id: generateEventId(),
      correlation_id: agentData.correlation_id,
      workflow_id: agentData.workflow_id,
      agent_id: agentData.agent_id,
      offset: agentData.offset,
      execution_status: agentData.execution_status,
      processing_time_ms: agentData.processing_time_ms,
      agent_data: agentData.agent_data,
      timestamp: Date.now(),
      source_system: 'opal-webhook',
      environment: process.env.NODE_ENV || 'development',
      signature_valid: agentData.signature_valid,
      payload_size_bytes: agentData.payload_size_bytes
    };

    const encodedValue = await this.registry.encode(schema.id, event);

    // Use compound key for idempotency
    const messageKey = `${event.workflow_id}:${event.agent_id}:${event.offset}`;

    await this.producer.send({
      topic: 'opal.events.agent.completed',
      messages: [{
        key: messageKey,
        value: encodedValue,
        headers: {
          'event_type': 'agent.completed',
          'schema_version': event.schema_version,
          'correlation_id': event.correlation_id,
          'idempotency_key': messageKey
        }
      }]
    });

    console.log(`✅ Published agent-completed event: ${messageKey}`);
  }
}

function generateEventId() {
  return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = AvroEventProducer;
```

### Protocol Buffers Producer

```javascript
// lib/producers/protobuf-producer.js
const protobuf = require('protobufjs');
const kafka = require('kafkajs');
const { SchemaRegistry } = require('@kafkajs/confluent-schema-registry');

class ProtobufEventProducer {
  constructor(config) {
    this.kafka = kafka({
      clientId: 'opal-protobuf-producer',
      brokers: config.kafka.brokers,
    });

    this.registry = new SchemaRegistry({
      host: config.schemaRegistry.url,
    });

    this.producer = this.kafka.producer();
    this.messageTypes = new Map();
  }

  async connect() {
    await this.producer.connect();
    await this.loadProtobufSchemas();
  }

  async loadProtobufSchemas() {
    // Load workflow started schema
    const workflowStartedRoot = await protobuf.load('schemas/protobuf/events/workflow_started.proto');
    this.messageTypes.set('WorkflowStarted', workflowStartedRoot.lookupType('com.opal.events.workflow.WorkflowStarted'));

    // Load agent completed schema
    const agentCompletedRoot = await protobuf.load('schemas/protobuf/events/agent_completed.proto');
    this.messageTypes.set('AgentCompleted', agentCompletedRoot.lookupType('com.opal.events.agent.AgentCompleted'));

    // Load other schemas...
  }

  async publishDecisionGenerated(decisionData) {
    const subject = 'opal.events.decision-generated-value';
    const MessageType = this.messageTypes.get('DecisionGenerated');

    const event = {
      schemaVersion: '1.0.0',
      eventId: generateEventId(),
      correlationId: decisionData.correlation_id,
      decisionId: decisionData.decision_id,
      workflowId: decisionData.workflow_id,
      sessionId: decisionData.session_id,
      recommendationsCount: decisionData.recommendations.length,
      recommendations: decisionData.recommendations.map(rec => ({
        title: rec.title,
        description: rec.description,
        impactScore: rec.impact_score,
        effortScore: rec.effort_score,
        combinedRatio: rec.combined_ratio,
        confidence: rec.confidence,
        category: rec.category,
        priority: rec.priority,
        evidence: rec.evidence?.map(ev => ({
          agentType: ev.agent_type,
          dataSource: ev.data_source,
          confidence: ev.confidence,
          summary: ev.summary
        })) || []
      })),
      userPreferences: decisionData.user_preferences,
      processingMetadata: {
        processingTimeMs: decisionData.processing_time_ms,
        agentsConsulted: decisionData.agents_consulted,
        dataSourcesAnalyzed: decisionData.data_sources_analyzed,
        confidenceThreshold: decisionData.confidence_threshold,
        rankingAlgorithm: decisionData.ranking_algorithm
      },
      workflowState: decisionData.workflow_state,
      clientName: decisionData.client_name,
      timestamp: {
        seconds: Math.floor(Date.now() / 1000),
        nanos: (Date.now() % 1000) * 1000000
      },
      sourceSystem: 'decision-engine',
      environment: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT'
    };

    // Verify the message
    const errMsg = MessageType.verify(event);
    if (errMsg) {
      throw new Error(`Invalid DecisionGenerated message: ${errMsg}`);
    }

    // Encode the message
    const message = MessageType.create(event);
    const buffer = MessageType.encode(message).finish();

    // Register with schema registry and get encoded value
    const encodedValue = await this.registry.encode(subject, buffer);

    await this.producer.send({
      topic: 'opal.events.decision.generated',
      messages: [{
        key: event.decisionId,
        value: encodedValue,
        headers: {
          'event_type': 'decision.generated',
          'schema_version': event.schemaVersion,
          'correlation_id': event.correlationId
        }
      }]
    });

    console.log(`✅ Published decision-generated event: ${event.decisionId}`);
  }
}

module.exports = ProtobufEventProducer;
```

## Consumer Implementation

### Avro Consumer with Idempotency

```javascript
// lib/consumers/avro-consumer.js
const kafka = require('kafkajs');
const { SchemaRegistry } = require('@kafkajs/confluent-schema-registry');
const Redis = require('redis');

class AvroEventConsumer {
  constructor(config) {
    this.kafka = kafka({
      clientId: 'opal-avro-consumer',
      brokers: config.kafka.brokers,
    });

    this.registry = new SchemaRegistry({
      host: config.schemaRegistry.url,
    });

    this.consumer = this.kafka.consumer({
      groupId: 'opal-event-processors',
      maxWaitTimeInMs: 3000
    });

    // Redis for idempotency tracking
    this.redis = Redis.createClient(config.redis);

    this.eventHandlers = new Map();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.eventHandlers.set('workflow.started', this.handleWorkflowStarted.bind(this));
    this.eventHandlers.set('agent.completed', this.handleAgentCompleted.bind(this));
    this.eventHandlers.set('workflow.completed', this.handleWorkflowCompleted.bind(this));
    this.eventHandlers.set('decision.generated', this.handleDecisionGenerated.bind(this));
  }

  async connect() {
    await this.consumer.connect();
    await this.redis.connect();
  }

  async subscribe(topics) {
    for (const topic of topics) {
      await this.consumer.subscribe({ topic });
    }

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          await this.processMessage(topic, message);
        } catch (error) {
          console.error(`Error processing message from ${topic}:`, error);
          // Implement dead letter queue logic here
        }
      },
    });
  }

  async processMessage(topic, message) {
    // Decode the message
    const decodedValue = await this.registry.decode(message.value);

    // Extract event metadata
    const eventType = message.headers?.event_type?.toString();
    const correlationId = message.headers?.correlation_id?.toString();
    const idempotencyKey = this.generateIdempotencyKey(decodedValue, eventType);

    // Check for duplicate processing
    const processed = await this.redis.get(`processed:${idempotencyKey}`);
    if (processed) {
      console.log(`⏭️  Skipping already processed event: ${idempotencyKey}`);
      return;
    }

    // Validate schema version compatibility
    if (!this.isVersionCompatible(decodedValue.schema_version)) {
      throw new Error(`Incompatible schema version: ${decodedValue.schema_version}`);
    }

    // Process the event
    const handler = this.eventHandlers.get(eventType);
    if (handler) {
      await handler(decodedValue, { correlationId, idempotencyKey });

      // Mark as processed with TTL (24 hours)
      await this.redis.setex(`processed:${idempotencyKey}`, 86400, Date.now().toString());

      console.log(`✅ Processed ${eventType}: ${idempotencyKey}`);
    } else {
      console.warn(`⚠️  No handler for event type: ${eventType}`);
    }
  }

  generateIdempotencyKey(event, eventType) {
    switch (eventType) {
      case 'workflow.started':
        return event.workflow_id;
      case 'agent.completed':
        return `${event.workflow_id}:${event.agent_id}:${event.offset}`;
      case 'workflow.completed':
        return event.workflow_id;
      case 'decision.generated':
        return event.decision_id;
      default:
        return event.event_id;
    }
  }

  isVersionCompatible(eventVersion) {
    const [eventMajor] = eventVersion.split('.');
    const [consumerMajor] = '1.0.0'.split('.'); // Consumer version
    return eventMajor === consumerMajor;
  }

  async handleWorkflowStarted(event, metadata) {
    console.log(`🚀 Workflow started: ${event.workflow_id}`);

    // Update workflow tracking
    await this.updateWorkflowState(event.workflow_id, {
      status: 'started',
      session_id: event.session_id,
      client_name: event.client_name,
      started_at: new Date(event.timestamp),
      correlation_id: metadata.correlationId
    });

    // Trigger downstream processes
    await this.initializeAgentTracking(event.workflow_id);
  }

  async handleAgentCompleted(event, metadata) {
    console.log(`🤖 Agent completed: ${event.agent_id} (${event.execution_status})`);

    // Update agent tracking
    await this.updateAgentState(event.workflow_id, event.agent_id, {
      status: event.execution_status,
      processing_time: event.processing_time_ms,
      completed_at: new Date(event.timestamp),
      recommendations: event.agent_data?.recommendations || [],
      confidence_score: event.agent_data?.confidence_score
    });

    // Check if workflow is complete
    const workflowComplete = await this.checkWorkflowCompletion(event.workflow_id);
    if (workflowComplete) {
      await this.triggerWorkflowCompletion(event.workflow_id);
    }
  }

  async handleDecisionGenerated(event, metadata) {
    console.log(`🧠 Decision generated: ${event.decision_id} (${event.recommendations_count} recommendations)`);

    // Store recommendations
    await this.storeRecommendations(event.workflow_id, event.recommendations);

    // Trigger notifications if configured
    if (event.user_preferences?.notification_settings?.workflow_updates) {
      await this.sendRecommendationNotification(event);
    }
  }

  // Helper methods for state management
  async updateWorkflowState(workflowId, state) {
    // Implementation for workflow state tracking
  }

  async updateAgentState(workflowId, agentId, state) {
    // Implementation for agent state tracking
  }

  async checkWorkflowCompletion(workflowId) {
    // Implementation to check if all agents completed
  }
}

module.exports = AvroEventConsumer;
```

## Schema Registry Management

### Schema Evolution Script

```javascript
// scripts/schema-evolution.js
const { SchemaRegistry } = require('@kafkajs/confluent-schema-registry');

class SchemaEvolutionManager {
  constructor(registryUrl) {
    this.registry = new SchemaRegistry({ host: registryUrl });
  }

  async checkCompatibility(subject, newSchema) {
    try {
      const result = await this.registry.checkCompatibility(subject, newSchema);
      console.log(`✅ Schema compatibility check passed for ${subject}`);
      return result;
    } catch (error) {
      console.error(`❌ Schema compatibility check failed for ${subject}:`, error.message);
      throw error;
    }
  }

  async evolveSchema(subject, newSchemaPath, version) {
    const fs = require('fs');
    const newSchema = JSON.parse(fs.readFileSync(newSchemaPath, 'utf8'));

    // Update schema version
    newSchema.version = version;

    // Check backward compatibility
    await this.checkCompatibility(subject, newSchema);

    // Register the new version
    const schemaId = await this.registry.register(subject, newSchema);
    console.log(`✅ Registered ${subject} v${version} with ID: ${schemaId}`);

    return schemaId;
  }

  async listSchemaVersions(subject) {
    try {
      const versions = await this.registry.getVersions(subject);
      console.log(`Schema versions for ${subject}:`, versions);
      return versions;
    } catch (error) {
      console.error(`Error listing versions for ${subject}:`, error.message);
      throw error;
    }
  }

  async getSchemaEvolutionHistory(subject) {
    const versions = await this.getVersions(subject);
    const history = [];

    for (const version of versions) {
      const schema = await this.registry.getSchema(subject, { version });
      history.push({
        version,
        schema,
        registeredAt: new Date() // Schema registry doesn't store timestamps
      });
    }

    return history;
  }
}

// Usage example
async function evolveWorkflowSchema() {
  const manager = new SchemaEvolutionManager('http://localhost:8081');

  try {
    // Evolve workflow-started schema to v1.1.0
    await manager.evolveSchema(
      'opal.events.workflow-started-value',
      './schemas/avro/events/workflow-started-v1.1.0.avsc',
      '1.1.0'
    );

    console.log('Schema evolution completed successfully!');
  } catch (error) {
    console.error('Schema evolution failed:', error);
    process.exit(1);
  }
}

module.exports = SchemaEvolutionManager;
```

## Configuration Examples

### Production Configuration

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  schema-registry:
    image: confluentinc/cp-schema-registry:7.4.0
    environment:
      SCHEMA_REGISTRY_HOST_NAME: schema-registry
      SCHEMA_REGISTRY_KAFKASTORE_BOOTSTRAP_SERVERS: 'broker1:9092,broker2:9092,broker3:9092'
      SCHEMA_REGISTRY_LISTENERS: http://0.0.0.0:8081

      # Production settings
      SCHEMA_REGISTRY_COMPATIBILITY_LEVEL: BACKWARD
      SCHEMA_REGISTRY_SCHEMA_CACHE_SIZE: 10000
      SCHEMA_REGISTRY_KAFKASTORE_TIMEOUT_MS: 10000

      # Security
      SCHEMA_REGISTRY_AUTHENTICATION_METHOD: BASIC
      SCHEMA_REGISTRY_AUTHENTICATION_ROLES: admin,developer
      SCHEMA_REGISTRY_AUTHENTICATION_REALM: SchemaRegistry-Props

      # Monitoring
      SCHEMA_REGISTRY_JMX_HOSTNAME: schema-registry
      SCHEMA_REGISTRY_JMX_PORT: 9999
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
```

### Environment-Specific Settings

```javascript
// config/schema-registry.js
const config = {
  development: {
    schemaRegistry: {
      url: 'http://localhost:8081',
      compatibility: 'BACKWARD',
      autoRegister: true,
      cacheSize: 100
    },
    kafka: {
      brokers: ['localhost:9092'],
      ssl: false,
      sasl: null
    }
  },

  staging: {
    schemaRegistry: {
      url: process.env.SCHEMA_REGISTRY_URL,
      compatibility: 'BACKWARD',
      autoRegister: false,
      cacheSize: 1000,
      auth: {
        username: process.env.SCHEMA_REGISTRY_USER,
        password: process.env.SCHEMA_REGISTRY_PASSWORD
      }
    },
    kafka: {
      brokers: process.env.KAFKA_BROKERS.split(','),
      ssl: true,
      sasl: {
        mechanism: 'SCRAM-SHA-256',
        username: process.env.KAFKA_USER,
        password: process.env.KAFKA_PASSWORD
      }
    }
  },

  production: {
    schemaRegistry: {
      url: process.env.SCHEMA_REGISTRY_URL,
      compatibility: 'BACKWARD_TRANSITIVE',
      autoRegister: false,
      cacheSize: 10000,
      auth: {
        username: process.env.SCHEMA_REGISTRY_USER,
        password: process.env.SCHEMA_REGISTRY_PASSWORD
      }
    },
    kafka: {
      brokers: process.env.KAFKA_BROKERS.split(','),
      ssl: true,
      sasl: {
        mechanism: 'SCRAM-SHA-512',
        username: process.env.KAFKA_USER,
        password: process.env.KAFKA_PASSWORD
      }
    }
  }
};

module.exports = config[process.env.NODE_ENV || 'development'];
```

## Monitoring & Alerts

### Schema Registry Metrics

```javascript
// lib/monitoring/schema-metrics.js
const prometheus = require('prom-client');

const schemaMetrics = {
  registrations: new prometheus.Counter({
    name: 'schema_registrations_total',
    help: 'Total number of schema registrations',
    labelNames: ['subject', 'version', 'format']
  }),

  compatibilityChecks: new prometheus.Counter({
    name: 'schema_compatibility_checks_total',
    help: 'Total number of compatibility checks',
    labelNames: ['subject', 'result']
  }),

  encodingLatency: new prometheus.Histogram({
    name: 'schema_encoding_duration_seconds',
    help: 'Time spent encoding messages',
    labelNames: ['subject', 'format']
  }),

  decodingLatency: new prometheus.Histogram({
    name: 'schema_decoding_duration_seconds',
    help: 'Time spent decoding messages',
    labelNames: ['subject', 'format']
  }),

  versionSkew: new prometheus.Gauge({
    name: 'schema_version_skew',
    help: 'Difference between producer and consumer schema versions',
    labelNames: ['subject']
  })
};

module.exports = schemaMetrics;
```

### Health Checks

```javascript
// lib/health/schema-registry-health.js
class SchemaRegistryHealthCheck {
  constructor(registryUrl) {
    this.registryUrl = registryUrl;
  }

  async checkHealth() {
    try {
      // Check registry connectivity
      const response = await fetch(`${this.registryUrl}/subjects`);
      if (!response.ok) {
        throw new Error(`Registry returned ${response.status}`);
      }

      // Check specific schema availability
      const subjects = await response.json();
      const expectedSubjects = [
        'opal.events.workflow-started-value',
        'opal.events.agent-completed-value',
        'opal.events.decision-generated-value'
      ];

      const missingSubjects = expectedSubjects.filter(
        subject => !subjects.includes(subject)
      );

      if (missingSubjects.length > 0) {
        throw new Error(`Missing subjects: ${missingSubjects.join(', ')}`);
      }

      return {
        status: 'healthy',
        subjects: subjects.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = SchemaRegistryHealthCheck;
```

This comprehensive configuration guide provides everything needed to implement and manage schema registry for the OPAL → OSA event-driven architecture with proper versioning, idempotency, and monitoring.