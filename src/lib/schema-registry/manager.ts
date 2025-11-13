/**
 * Schema Registry Manager for OPAL → OSA Events
 *
 * This module handles registration, retrieval, and evolution of Avro and Protobuf schemas
 * for the OPAL event-driven architecture with proper versioning and compatibility checks.
 */

import { SchemaRegistry, SchemaType, AvroHelper } from '@kafkajs/confluent-schema-registry';
import { promises as fs } from 'fs';
import path from 'path';
import { getKafkaConfig, getSchemaSubject, OPAL_TOPICS } from '../kafka/config';

export interface SchemaRegistrationResult {
  id: number;
  subject: string;
  version: number;
  schema: string;
  schemaType: SchemaType;
}

export interface SchemaEvolutionCheck {
  isCompatible: boolean;
  compatibility: string;
  messages: string[];
}

export class OpalSchemaRegistryManager {
  private registry: SchemaRegistry;
  private schemasPath: string;

  constructor() {
    const config = getKafkaConfig();

    this.registry = new SchemaRegistry({
      host: config.schemaRegistry.url,
      auth: config.schemaRegistry.auth ? {
        username: config.schemaRegistry.auth.username,
        password: config.schemaRegistry.auth.password
      } : undefined
    });

    this.schemasPath = path.join(process.cwd(), 'schemas');
  }

  /**
   * Register all OPAL Avro schemas from the schemas directory
   */
  async registerAvroSchemas(): Promise<SchemaRegistrationResult[]> {
    const results: SchemaRegistrationResult[] = [];

    try {
      // Register event schemas
      const eventSchemas = await this.loadSchemasFromDirectory('avro/events', 'avsc');

      for (const [filename, schemaContent] of eventSchemas) {
        const topicKey = this.filenameToTopicKey(filename);
        if (topicKey) {
          const subject = getSchemaSubject(topicKey, 'avro');

          try {
            const result = await this.registerSchema(subject, schemaContent, SchemaType.AVRO);
            results.push(result);
            console.log(`✅ [SchemaRegistry] Registered Avro schema: ${subject} (ID: ${result.id})`);
          } catch (error) {
            console.error(`❌ [SchemaRegistry] Failed to register Avro schema ${subject}:`, error);
          }
        }
      }

      // Register SSE schemas
      const sseSchemas = await this.loadSchemasFromDirectory('avro/sse', 'avsc');

      for (const [filename, schemaContent] of sseSchemas) {
        const subject = `opal.events.sse.${filename.replace('.avsc', '')}-value`;

        try {
          const result = await this.registerSchema(subject, schemaContent, SchemaType.AVRO);
          results.push(result);
          console.log(`✅ [SchemaRegistry] Registered SSE Avro schema: ${subject} (ID: ${result.id})`);
        } catch (error) {
          console.error(`❌ [SchemaRegistry] Failed to register SSE Avro schema ${subject}:`, error);
        }
      }

      console.log(`✅ [SchemaRegistry] Registered ${results.length} Avro schemas`);
      return results;

    } catch (error) {
      console.error('❌ [SchemaRegistry] Failed to register Avro schemas:', error);
      throw error;
    }
  }

  /**
   * Register all OPAL Protobuf schemas from the schemas directory
   */
  async registerProtobufSchemas(): Promise<SchemaRegistrationResult[]> {
    const results: SchemaRegistrationResult[] = [];

    try {
      // Register event schemas
      const eventSchemas = await this.loadSchemasFromDirectory('protobuf/events', 'proto');

      for (const [filename, schemaContent] of eventSchemas) {
        const topicKey = this.filenameToTopicKey(filename);
        if (topicKey) {
          const subject = getSchemaSubject(topicKey, 'protobuf');

          try {
            const result = await this.registerSchema(subject, schemaContent, SchemaType.PROTOBUF);
            results.push(result);
            console.log(`✅ [SchemaRegistry] Registered Protobuf schema: ${subject} (ID: ${result.id})`);
          } catch (error) {
            console.error(`❌ [SchemaRegistry] Failed to register Protobuf schema ${subject}:`, error);
          }
        }
      }

      // Register SSE schemas
      const sseSchemas = await this.loadSchemasFromDirectory('protobuf/sse', 'proto');

      for (const [filename, schemaContent] of sseSchemas) {
        const subject = `opal.events.sse.${filename.replace('.proto', '').replace('_', '-')}-value`;

        try {
          const result = await this.registerSchema(subject, schemaContent, SchemaType.PROTOBUF);
          results.push(result);
          console.log(`✅ [SchemaRegistry] Registered SSE Protobuf schema: ${subject} (ID: ${result.id})`);
        } catch (error) {
          console.error(`❌ [SchemaRegistry] Failed to register SSE Protobuf schema ${subject}:`, error);
        }
      }

      console.log(`✅ [SchemaRegistry] Registered ${results.length} Protobuf schemas`);
      return results;

    } catch (error) {
      console.error('❌ [SchemaRegistry] Failed to register Protobuf schemas:', error);
      throw error;
    }
  }

  /**
   * Register a single schema
   */
  private async registerSchema(
    subject: string,
    schemaContent: string,
    schemaType: SchemaType
  ): Promise<SchemaRegistrationResult> {
    try {
      // Check if schema already exists
      let existingSchema;
      try {
        existingSchema = await this.registry.getLatestSchema(subject);
        console.log(`📋 [SchemaRegistry] Found existing schema for ${subject}`);
      } catch (error) {
        // Schema doesn't exist, which is fine
        console.log(`📝 [SchemaRegistry] No existing schema for ${subject}, will create new`);
      }

      // Parse schema content based on type
      let schema: any;
      if (schemaType === SchemaType.AVRO) {
        schema = JSON.parse(schemaContent);
      } else {
        schema = schemaContent; // Protobuf is plain text
      }

      // Register the schema
      const id = await this.registry.register(
        { type: schemaType, schema },
        { subject }
      );

      // Get the version
      const latestSchema = await this.registry.getLatestSchema(subject);

      return {
        id,
        subject,
        version: latestSchema.version,
        schema: schemaContent,
        schemaType
      };

    } catch (error) {
      console.error(`❌ [SchemaRegistry] Registration failed for ${subject}:`, error);
      throw error;
    }
  }

  /**
   * Check schema compatibility for evolution
   */
  async checkSchemaCompatibility(
    subject: string,
    newSchema: string,
    schemaType: SchemaType
  ): Promise<SchemaEvolutionCheck> {
    try {
      let schema: any;
      if (schemaType === SchemaType.AVRO) {
        schema = JSON.parse(newSchema);
      } else {
        schema = newSchema;
      }

      const compatibility = await this.registry.checkCompatibility(
        subject,
        { type: schemaType, schema }
      );

      return {
        isCompatible: compatibility.is_compatible,
        compatibility: 'BACKWARD', // Default for OPAL
        messages: compatibility.messages || []
      };

    } catch (error) {
      console.error(`❌ [SchemaRegistry] Compatibility check failed for ${subject}:`, error);
      return {
        isCompatible: false,
        compatibility: 'UNKNOWN',
        messages: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get schema by ID for encoding/decoding
   */
  async getSchemaById(id: number): Promise<any> {
    try {
      return await this.registry.getSchema(id);
    } catch (error) {
      console.error(`❌ [SchemaRegistry] Failed to get schema by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get latest schema for a subject
   */
  async getLatestSchema(subject: string): Promise<any> {
    try {
      return await this.registry.getLatestSchema(subject);
    } catch (error) {
      console.error(`❌ [SchemaRegistry] Failed to get latest schema for ${subject}:`, error);
      throw error;
    }
  }

  /**
   * Encode message with schema
   */
  async encode(subject: string, message: any): Promise<Buffer> {
    try {
      return await this.registry.encode(subject, message);
    } catch (error) {
      console.error(`❌ [SchemaRegistry] Failed to encode message for ${subject}:`, error);
      throw error;
    }
  }

  /**
   * Decode message with schema
   */
  async decode(buffer: Buffer): Promise<any> {
    try {
      return await this.registry.decode(buffer);
    } catch (error) {
      console.error('❌ [SchemaRegistry] Failed to decode message:', error);
      throw error;
    }
  }

  /**
   * List all subjects in the registry
   */
  async listSubjects(): Promise<string[]> {
    try {
      return await this.registry.getSubjects();
    } catch (error) {
      console.error('❌ [SchemaRegistry] Failed to list subjects:', error);
      throw error;
    }
  }

  /**
   * Get all versions for a subject
   */
  async getSubjectVersions(subject: string): Promise<number[]> {
    try {
      return await this.registry.getVersions(subject);
    } catch (error) {
      console.error(`❌ [SchemaRegistry] Failed to get versions for ${subject}:`, error);
      throw error;
    }
  }

  /**
   * Load schemas from directory
   */
  private async loadSchemasFromDirectory(
    directory: string,
    extension: string
  ): Promise<Map<string, string>> {
    const schemas = new Map<string, string>();
    const dirPath = path.join(this.schemasPath, directory);

    try {
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        if (file.endsWith(`.${extension}`)) {
          const filePath = path.join(dirPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          schemas.set(file, content);
        }
      }

      console.log(`📂 [SchemaRegistry] Loaded ${schemas.size} ${extension} schemas from ${directory}`);
      return schemas;

    } catch (error) {
      console.error(`❌ [SchemaRegistry] Failed to load schemas from ${directory}:`, error);
      throw error;
    }
  }

  /**
   * Convert filename to topic key
   */
  private filenameToTopicKey(filename: string): keyof typeof OPAL_TOPICS | null {
    const mapping: Record<string, keyof typeof OPAL_TOPICS> = {
      'workflow-started': 'WORKFLOW_STARTED',
      'workflow_started': 'WORKFLOW_STARTED',
      'agent-completed': 'AGENT_COMPLETED',
      'agent_completed': 'AGENT_COMPLETED',
      'workflow-completed': 'WORKFLOW_COMPLETED',
      'workflow_completed': 'WORKFLOW_COMPLETED',
      'rag-upserted': 'RAG_UPSERTED',
      'rag_upserted': 'RAG_UPSERTED',
      'decision-generated': 'DECISION_GENERATED',
      'decision_generated': 'DECISION_GENERATED',
      'decision-degraded': 'DECISION_DEGRADED',
      'decision_degraded': 'DECISION_DEGRADED',
      'preferences-updated': 'PREFERENCES_UPDATED',
      'preferences_updated': 'PREFERENCES_UPDATED'
    };

    const baseName = filename.replace(/\.(avsc|proto)$/, '');
    return mapping[baseName] || null;
  }

  /**
   * Initialize all OPAL schemas in the registry
   */
  async initializeOpalSchemas(): Promise<void> {
    console.log('🚀 [SchemaRegistry] Initializing OPAL schemas...');

    try {
      // Register Avro schemas
      const avroResults = await this.registerAvroSchemas();

      // Register Protobuf schemas
      const protobufResults = await this.registerProtobufSchemas();

      const totalRegistered = avroResults.length + protobufResults.length;
      console.log(`✅ [SchemaRegistry] Initialized ${totalRegistered} OPAL schemas`);
      console.log(`   - Avro: ${avroResults.length} schemas`);
      console.log(`   - Protobuf: ${protobufResults.length} schemas`);

      // List all registered subjects for verification
      const subjects = await this.listSubjects();
      const opalSubjects = subjects.filter(s => s.includes('opal'));
      console.log(`📋 [SchemaRegistry] Total OPAL subjects: ${opalSubjects.length}`);

    } catch (error) {
      console.error('❌ [SchemaRegistry] Failed to initialize OPAL schemas:', error);
      throw error;
    }
  }
}

// Singleton instance for reuse
let schemaRegistryInstance: OpalSchemaRegistryManager | null = null;

export function getSchemaRegistryManager(): OpalSchemaRegistryManager {
  if (!schemaRegistryInstance) {
    schemaRegistryInstance = new OpalSchemaRegistryManager();
  }
  return schemaRegistryInstance;
}