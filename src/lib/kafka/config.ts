/**
 * Kafka Configuration for OPAL → OSA Event-Driven Architecture
 *
 * This configuration manages Kafka connections, topic definitions, and environment-specific settings
 * for the complete OPAL event processing pipeline.
 */

import { KafkaConfig, ProducerConfig, ConsumerConfig } from 'kafkajs';

// Environment-specific configuration
export interface OpalKafkaEnvironment {
  kafka: KafkaConfig;
  schemaRegistry: {
    url: string;
    auth?: {
      username: string;
      password: string;
    };
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  topics: {
    prefix: string;
    replicationFactor: number;
    partitions: number;
  };
}

// Topic definitions for OPAL events
export interface OpalTopicDefinition {
  name: string;
  partitions: number;
  replicationFactor: number;
  configs: Record<string, string>;
  description: string;
}

// Core OPAL event topics
export const OPAL_TOPICS: Record<string, OpalTopicDefinition> = {
  WORKFLOW_STARTED: {
    name: 'opal.workflow.started',
    partitions: 6,
    replicationFactor: 1, // Development: 1, Production: 3
    configs: {
      'cleanup.policy': 'delete',
      'retention.ms': '604800000', // 7 days
      'segment.ms': '86400000',    // 1 day
      'compression.type': 'snappy',
      'min.insync.replicas': '1'
    },
    description: 'Events when OPAL workflows are initiated via API or trigger'
  },

  AGENT_COMPLETED: {
    name: 'opal.agent.completed',
    partitions: 6,
    replicationFactor: 1,
    configs: {
      'cleanup.policy': 'delete',
      'retention.ms': '604800000', // 7 days
      'segment.ms': '86400000',
      'compression.type': 'snappy',
      'min.insync.replicas': '1'
    },
    description: 'Events when individual OPAL agents complete processing'
  },

  WORKFLOW_COMPLETED: {
    name: 'opal.workflow.completed',
    partitions: 6,
    replicationFactor: 1,
    configs: {
      'cleanup.policy': 'delete',
      'retention.ms': '2592000000', // 30 days (important for analytics)
      'segment.ms': '86400000',
      'compression.type': 'snappy',
      'min.insync.replicas': '1'
    },
    description: 'Events when entire OPAL workflows finish execution'
  },

  RAG_UPSERTED: {
    name: 'opal.knowledge.upserted',
    partitions: 3,
    replicationFactor: 1,
    configs: {
      'cleanup.policy': 'delete',
      'retention.ms': '1209600000', // 14 days
      'segment.ms': '86400000',
      'compression.type': 'snappy',
      'min.insync.replicas': '1'
    },
    description: 'Events when knowledge base entries are inserted or updated'
  },

  DECISION_GENERATED: {
    name: 'opal.decision.generated',
    partitions: 6,
    replicationFactor: 1,
    configs: {
      'cleanup.policy': 'delete',
      'retention.ms': '2592000000', // 30 days
      'segment.ms': '86400000',
      'compression.type': 'snappy',
      'min.insync.replicas': '1'
    },
    description: 'Events when intelligent recommendations are generated'
  },

  DECISION_DEGRADED: {
    name: 'opal.decision.degraded',
    partitions: 3,
    replicationFactor: 1,
    configs: {
      'cleanup.policy': 'delete',
      'retention.ms': '2592000000', // 30 days (important for quality monitoring)
      'segment.ms': '86400000',
      'compression.type': 'snappy',
      'min.insync.replicas': '1'
    },
    description: 'Events when recommendation quality degrades or confidence drops'
  },

  PREFERENCES_UPDATED: {
    name: 'opal.user.preferences.updated',
    partitions: 3,
    replicationFactor: 1,
    configs: {
      'cleanup.policy': 'delete',
      'retention.ms': '604800000', // 7 days
      'segment.ms': '86400000',
      'compression.type': 'snappy',
      'min.insync.replicas': '1'
    },
    description: 'Events when user preferences or settings are updated'
  },

  // Dead Letter Queue for failed events
  DLQ: {
    name: 'opal.events.dlq',
    partitions: 3,
    replicationFactor: 1,
    configs: {
      'cleanup.policy': 'delete',
      'retention.ms': '2592000000', // 30 days (for debugging)
      'segment.ms': '86400000',
      'compression.type': 'snappy',
      'min.insync.replicas': '1'
    },
    description: 'Dead Letter Queue for events that failed processing'
  }
};

// Environment configurations
export const KAFKA_ENVIRONMENTS: Record<string, OpalKafkaEnvironment> = {
  development: {
    kafka: {
      clientId: 'opal-dev',
      brokers: ['localhost:9092'],
      retry: {
        initialRetryTime: 100,
        retries: 8
      },
      connectionTimeout: 3000,
      requestTimeout: 25000,
      logLevel: 1, // INFO level
    },
    schemaRegistry: {
      url: 'http://localhost:8081'
    },
    redis: {
      host: 'localhost',
      port: 6379,
      db: 0
    },
    topics: {
      prefix: '',
      replicationFactor: 1,
      partitions: 6
    }
  },

  staging: {
    kafka: {
      clientId: 'opal-staging',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      ssl: true,
      sasl: {
        mechanism: 'SCRAM-SHA-256',
        username: process.env.KAFKA_USERNAME || '',
        password: process.env.KAFKA_PASSWORD || ''
      },
      retry: {
        initialRetryTime: 300,
        retries: 10
      },
      connectionTimeout: 10000,
      requestTimeout: 30000,
    },
    schemaRegistry: {
      url: process.env.SCHEMA_REGISTRY_URL || 'http://localhost:8081',
      auth: {
        username: process.env.SCHEMA_REGISTRY_USERNAME || '',
        password: process.env.SCHEMA_REGISTRY_PASSWORD || ''
      }
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: 0
    },
    topics: {
      prefix: 'staging-',
      replicationFactor: 2,
      partitions: 6
    }
  },

  production: {
    kafka: {
      clientId: 'opal-prod',
      brokers: (process.env.KAFKA_BROKERS || '').split(','),
      ssl: true,
      sasl: {
        mechanism: 'SCRAM-SHA-512',
        username: process.env.KAFKA_USERNAME || '',
        password: process.env.KAFKA_PASSWORD || ''
      },
      retry: {
        initialRetryTime: 500,
        retries: 15
      },
      connectionTimeout: 15000,
      requestTimeout: 45000,
    },
    schemaRegistry: {
      url: process.env.SCHEMA_REGISTRY_URL || '',
      auth: {
        username: process.env.SCHEMA_REGISTRY_USERNAME || '',
        password: process.env.SCHEMA_REGISTRY_PASSWORD || ''
      }
    },
    redis: {
      host: process.env.REDIS_HOST || '',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: 0
    },
    topics: {
      prefix: '',
      replicationFactor: 3,
      partitions: 12
    }
  }
};

// Producer configuration
export const PRODUCER_CONFIG: ProducerConfig = {
  maxInFlightRequests: 1,
  idempotent: true,
  transactionTimeout: 30000,
  retry: {
    initialRetryTime: 100,
    retries: 5
  }
};

// Consumer group configurations
export const CONSUMER_GROUPS = {
  DIAGNOSTICS: {
    groupId: 'opal-diagnostics',
    config: {
      sessionTimeout: 30000,
      rebalanceTimeout: 60000,
      heartbeatInterval: 3000,
      maxBytesPerPartition: 1048576, // 1MB
      minBytes: 1,
      maxBytes: 10485760, // 10MB
      maxWaitTimeInMs: 5000,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    } as ConsumerConfig
  },

  RECOMMENDATIONS: {
    groupId: 'opal-recommendations',
    config: {
      sessionTimeout: 30000,
      rebalanceTimeout: 60000,
      heartbeatInterval: 3000,
      maxBytesPerPartition: 1048576,
      minBytes: 1,
      maxBytes: 10485760,
      maxWaitTimeInMs: 5000,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    } as ConsumerConfig
  },

  ANALYTICS: {
    groupId: 'opal-analytics',
    config: {
      sessionTimeout: 30000,
      rebalanceTimeout: 60000,
      heartbeatInterval: 3000,
      maxBytesPerPartition: 2097152, // 2MB for analytics
      minBytes: 1,
      maxBytes: 20971520, // 20MB
      maxWaitTimeInMs: 10000,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    } as ConsumerConfig
  }
};

// Get current environment configuration
export function getKafkaConfig(): OpalKafkaEnvironment {
  const env = process.env.NODE_ENV || 'development';
  return KAFKA_ENVIRONMENTS[env] || KAFKA_ENVIRONMENTS.development;
}

// Get topic name with environment prefix
export function getTopicName(topicKey: keyof typeof OPAL_TOPICS): string {
  const config = getKafkaConfig();
  const topic = OPAL_TOPICS[topicKey];
  return `${config.topics.prefix}${topic.name}`;
}

// Schema Registry subject naming convention
export function getSchemaSubject(topicKey: keyof typeof OPAL_TOPICS, format: 'avro' | 'protobuf' = 'avro'): string {
  const topicName = getTopicName(topicKey);
  return `${topicName}-value`;
}

// Idempotency key generators for each event type
export const IDEMPOTENCY_KEY_GENERATORS = {
  WORKFLOW_STARTED: (event: any) => event.workflow_id,
  AGENT_COMPLETED: (event: any) => `${event.workflow_id}:${event.agent_id}:${event.offset || 0}`,
  WORKFLOW_COMPLETED: (event: any) => event.workflow_id,
  RAG_UPSERTED: (event: any) => event.upsert_id,
  DECISION_GENERATED: (event: any) => event.decision_id,
  DECISION_DEGRADED: (event: any) => event.degradation_id,
  PREFERENCES_UPDATED: (event: any) => `${event.user_id}:${event.update_type}`,
  DLQ: (event: any) => `dlq:${event.original_event_id || event.event_id}`
};

// Partition key generators for optimal distribution
export const PARTITION_KEY_GENERATORS = {
  WORKFLOW_STARTED: (event: any) => event.workflow_id,
  AGENT_COMPLETED: (event: any) => event.workflow_id,
  WORKFLOW_COMPLETED: (event: any) => event.workflow_id,
  RAG_UPSERTED: (event: any) => event.knowledge_source || event.agent_id,
  DECISION_GENERATED: (event: any) => event.workflow_id,
  DECISION_DEGRADED: (event: any) => event.original_decision_id || event.degradation_id,
  PREFERENCES_UPDATED: (event: any) => event.user_id,
  DLQ: (event: any) => event.original_topic || 'unknown'
};

export default {
  OPAL_TOPICS,
  KAFKA_ENVIRONMENTS,
  PRODUCER_CONFIG,
  CONSUMER_GROUPS,
  getKafkaConfig,
  getTopicName,
  getSchemaSubject,
  IDEMPOTENCY_KEY_GENERATORS,
  PARTITION_KEY_GENERATORS
};