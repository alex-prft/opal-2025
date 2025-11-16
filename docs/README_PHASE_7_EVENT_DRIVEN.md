# Phase 7: Event-Driven Architecture Implementation

## Overview

This document describes the complete implementation of Phase 7: Event-Driven Architecture for OPAL → OSA integration. The system provides a production-ready event backbone using Apache Kafka, Confluent Schema Registry, Redis for idempotency, and Prometheus metrics for observability.

## Architecture Components

### Core Services

1. **Apache Kafka** - Event streaming platform
2. **Confluent Schema Registry** - Schema management and validation
3. **Redis** - Idempotency tracking and caching
4. **Zookeeper** - Kafka cluster coordination
5. **Kafka UI** - Web-based management interface

### OPAL Integration Points

- **Webhook Ingestion** → `opal.workflow.started`
- **Agent Completion** → `opal.agent.completed`
- **Workflow Completion** → `opal.workflow.completed`
- **Decision Generation** → `opal.decision.generated`
- **Knowledge Updates** → `opal.knowledge.upserted`
- **Quality Monitoring** → `opal.decision.degraded`
- **User Preferences** → `opal.user.preferences.updated`

## Quick Start

### 1. Initialize the Event System

```bash
# Start all services and initialize topics/schemas
./scripts/kafka-init.sh
```

### 2. Test the Producer

```bash
# Run comprehensive producer tests
npm run kafka:test-producer
```

### 3. Start Event Consumers

```bash
# Start diagnostics consumer
npm run kafka:start-diagnostics

# Start recommendations consumer (separate terminal)
npm run kafka:start-recommendations
```

### 4. Monitor with Kafka UI

Open [http://localhost:8080](http://localhost:8080) to monitor topics, messages, and consumers.

## Project Structure

```
├── docker-compose.yml                     # Complete Kafka ecosystem
├── src/lib/kafka/
│   ├── config.ts                         # Environment-specific configuration
│   ├── topic-manager.ts                  # Automatic topic management
│   ├── producers/
│   │   └── opal-event-producer.ts        # Main event producer
│   └── consumers/
│       ├── opal-diagnostics-consumer.ts  # Diagnostics event processor
│       └── opal-recommendations-consumer.ts # Recommendations processor
├── src/lib/schema-registry/
│   └── manager.ts                        # Avro/Protobuf schema management
├── src/lib/idempotency/
│   └── manager.ts                        # Redis-based deduplication
├── src/lib/metrics/
│   └── collector.ts                      # Prometheus metrics
├── scripts/
│   ├── kafka-init.sh                     # System initialization
│   └── kafka-test-producer.ts            # Producer testing suite
└── docs/
    └── SCHEMA_REGISTRY_CONFIG.md          # Schema management guide
```

## Event Types and Schemas

### Workflow Started
- **Topic**: `opal.workflow.started`
- **Trigger**: OPAL webhook receives workflow request
- **Schema**: Contains workflow_id, client_name, preferences, estimated_duration

### Agent Completed
- **Topic**: `opal.agent.completed`
- **Trigger**: Individual agent finishes processing
- **Schema**: Contains agent_id, execution_status, processing_time_ms, agent_data

### Decision Generated
- **Topic**: `opal.decision.generated`
- **Trigger**: Decision API generates recommendations
- **Schema**: Contains decision_id, recommendations array, confidence scores

### Example Agent Completed Event

```json
{
  "schema_version": "1.0.0",
  "event_id": "evt-1731408000000-abc123def",
  "correlation_id": "corr-abc123",
  "workflow_id": "wf-123",
  "agent_id": "content_review",
  "offset": 1,
  "execution_status": "success",
  "processing_time_ms": 1200,
  "agent_data": {
    "recommendations": ["CTA below fold reduces conversions"],
    "confidence_score": 0.92
  },
  "timestamp": 1731408000000,
  "source_system": "opal-webhook",
  "environment": "production"
}
```

## Configuration

### Environment Variables

```bash
# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_USERNAME=               # Optional for SASL
KAFKA_PASSWORD=               # Optional for SASL

# Schema Registry
SCHEMA_REGISTRY_URL=http://localhost:8081
SCHEMA_REGISTRY_USERNAME=     # Optional
SCHEMA_REGISTRY_PASSWORD=     # Optional

# Redis (Idempotency)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=               # Optional

# Environment
NODE_ENV=development          # development | staging | production
```

### Production Configuration

For production deployment, the system automatically:
- Uses 3x replication factor for topics
- Enables SASL authentication
- Implements SSL/TLS encryption
- Scales to 12 partitions per topic
- Sets longer retention periods

## Key Features

### 1. **Idempotency & Exactly-Once Delivery**
- Redis-based deduplication prevents duplicate processing
- Configurable TTL for idempotency keys (default: 24 hours)
- Batch operations for high-throughput scenarios

### 2. **Schema Management**
- Automatic registration of Avro and Protobuf schemas
- Backward compatibility enforcement
- Version evolution support
- Schema validation at publish time

### 3. **Intelligent Event Processing**
- **Diagnostics Consumer**: Monitors workflow health, agent performance
- **Recommendations Consumer**: Processes decisions, applies user preferences
- Correlation ID tracking for distributed tracing

### 4. **Observability & Monitoring**
- Prometheus metrics for event throughput, consumer lag, error rates
- Health check endpoints for all components
- Comprehensive logging with structured output

### 5. **Reliability & Error Handling**
- Dead Letter Queue (DLQ) for failed events
- Exponential backoff retry logic
- Circuit breaker patterns
- Graceful degradation strategies

## API Usage

### Publishing Events

```typescript
import { getOpalEventProducer } from '@/lib/kafka/producers/opal-event-producer';

const producer = getOpalEventProducer();
await producer.connect();

// Publish workflow started
const result = await producer.publishWorkflowStarted({
  workflow_id: 'wf-123',
  session_id: 'sess-456',
  client_name: 'example-client',
  workflow_name: 'strategy_workflow'
}, {
  correlationId: 'corr-789',
  timestamp: Date.now(),
  source: 'opal-api',
  environment: 'production'
});
```

### Consuming Events

```typescript
import { getDiagnosticsConsumer } from '@/lib/kafka/consumers/opal-diagnostics-consumer';

const consumer = getDiagnosticsConsumer();
await consumer.start();

// Get processing statistics
const summary = consumer.getDiagnosticSummary();
console.log('Events processed:', summary.totalEventsProcessed);
```

### Health Monitoring

```typescript
// Check producer health
const producerHealth = await producer.healthCheck();
console.log('Producer status:', producerHealth.status);

// Check consumer health
const consumerHealth = consumer.healthCheck();
console.log('Consumer lag:', consumerHealth.details.timeSinceLastEvent);

// Get metrics
const metrics = await metricsCollector.getMetricsJson();
```

## Deployment

### Development

```bash
# Start development environment
docker-compose up -d
./scripts/kafka-init.sh
npm run dev
```

### Production

```bash
# Set production environment variables
export NODE_ENV=production
export KAFKA_BROKERS=broker1:9092,broker2:9092,broker3:9092
export SCHEMA_REGISTRY_URL=https://schema-registry.example.com

# Initialize production environment
./scripts/kafka-init.sh
npm run start
```

## Monitoring & Troubleshooting

### Service URLs
- **Kafka UI**: http://localhost:8080
- **Schema Registry**: http://localhost:8081
- **Metrics Endpoint**: http://localhost:3000/api/metrics
- **Health Check**: http://localhost:3000/api/health

### Common Commands

```bash
# View Kafka topics
kafka-topics --bootstrap-server localhost:9092 --list

# Check consumer group status
kafka-consumer-groups --bootstrap-server localhost:9092 --group opal-diagnostics --describe

# View Schema Registry subjects
curl http://localhost:8081/subjects

# Monitor Redis idempotency keys
redis-cli keys "opal:idempotency:*"

# View service logs
docker-compose logs -f kafka
docker-compose logs -f schema-registry
```

### Health Checks

```bash
# Test producer functionality
npm run kafka:test-producer

# Check topic health
curl http://localhost:3000/api/kafka/health

# Verify schema registry
curl http://localhost:8081/subjects | jq
```

## Performance Tuning

### Producer Optimization
- **Batching**: Configure `batch.size` and `linger.ms` for throughput
- **Compression**: Use `snappy` compression for balanced performance
- **Partitioning**: Distribute load using workflow_id as partition key

### Consumer Optimization
- **Concurrency**: Adjust `partitionsConsumedConcurrently` based on load
- **Prefetching**: Configure `maxBytesPerPartition` for optimal memory usage
- **Offset Management**: Use manual commit for exactly-once processing

### Schema Registry Optimization
- **Caching**: Enable schema caching for frequently used schemas
- **Connection Pooling**: Reuse connections for better performance
- **Compression**: Use schema compression for large schemas

## Security Considerations

### Authentication & Authorization
- SASL/SCRAM authentication for Kafka
- HTTP Basic Auth for Schema Registry
- Redis AUTH for secure access
- TLS encryption for all connections

### Data Protection
- Schema validation prevents malformed data
- Idempotency keys prevent replay attacks
- Correlation IDs for audit trails
- PII handling compliance

## Backward Compatibility

The implementation maintains full backward compatibility with existing OPAL systems:

- ✅ **Existing OPAL integrations** continue to work unchanged
- ✅ **Force Sync functionality** operates alongside event processing
- ✅ **OPAL mapping system** remains fully functional
- ✅ **Custom OPAL tools** integrate seamlessly
- ✅ **Webhook processing** enhanced with event publishing

## Troubleshooting Guide

### Common Issues

#### 1. **Kafka Connection Errors**
```bash
# Check Kafka status
docker-compose ps kafka
docker-compose logs kafka

# Verify broker connectivity
kafka-broker-api-versions --bootstrap-server localhost:9092
```

#### 2. **Schema Registry Issues**
```bash
# Check schema registry health
curl http://localhost:8081/subjects

# Test schema registration
curl -X POST -H "Content-Type: application/json" \
  -d '{"schema": "test"}' \
  http://localhost:8081/subjects/test-subject/versions
```

#### 3. **Consumer Lag**
```bash
# Check consumer group lag
kafka-consumer-groups --bootstrap-server localhost:9092 \
  --group opal-diagnostics --describe

# Scale consumers if needed
docker-compose up --scale consumer=3
```

#### 4. **Redis Connection Issues**
```bash
# Test Redis connectivity
redis-cli ping

# Check idempotency keys
redis-cli scan 0 match "opal:idempotency:*"
```

## Next Steps

1. **Phase 8**: Real-time dashboards and analytics
2. **Phase 9**: ML-powered recommendation optimization
3. **Phase 10**: Multi-tenant isolation and scaling

## Support

For issues or questions:
1. Check the troubleshooting guide above
2. Review logs: `docker-compose logs -f [service]`
3. Run health checks: `npm run kafka:test-producer`
4. Monitor Kafka UI: http://localhost:8080

---

**Phase 7: Event-Driven Architecture** ✅ **Complete**

The OPAL system now features a production-ready event-driven architecture with comprehensive monitoring, reliability, and observability capabilities.