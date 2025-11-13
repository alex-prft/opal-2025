/**
 * Kafka Topic Management for OPAL → OSA Events
 *
 * This module handles automatic topic creation, configuration updates,
 * and topic health monitoring for the OPAL event architecture.
 */

import { Kafka, Admin, ITopicConfig } from 'kafkajs';
import { getKafkaConfig, OPAL_TOPICS, getTopicName } from './config';

export class OpalTopicManager {
  private kafka: Kafka;
  private admin: Admin;
  private isConnected = false;

  constructor() {
    const config = getKafkaConfig();
    this.kafka = new Kafka(config.kafka);
    this.admin = this.kafka.admin();
  }

  /**
   * Connect to Kafka cluster
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await this.admin.connect();
      this.isConnected = true;
      console.log('✅ [TopicManager] Connected to Kafka cluster');
    } catch (error) {
      console.error('❌ [TopicManager] Failed to connect to Kafka:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Kafka cluster
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.admin.disconnect();
      this.isConnected = false;
      console.log('✅ [TopicManager] Disconnected from Kafka cluster');
    } catch (error) {
      console.error('❌ [TopicManager] Error disconnecting from Kafka:', error);
      throw error;
    }
  }

  /**
   * Create all OPAL topics if they don't exist
   */
  async createOpalTopics(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to Kafka. Call connect() first.');
    }

    try {
      // Get existing topics
      const existingTopics = await this.admin.listTopics();
      console.log(`📋 [TopicManager] Found ${existingTopics.length} existing topics`);

      // Prepare topics to create
      const topicsToCreate: ITopicConfig[] = [];

      for (const [topicKey, topicDef] of Object.entries(OPAL_TOPICS)) {
        const topicName = getTopicName(topicKey as keyof typeof OPAL_TOPICS);

        if (!existingTopics.includes(topicName)) {
          topicsToCreate.push({
            topic: topicName,
            numPartitions: topicDef.partitions,
            replicationFactor: topicDef.replicationFactor,
            configEntries: Object.entries(topicDef.configs).map(([key, value]) => ({
              name: key,
              value: value
            }))
          });

          console.log(`📝 [TopicManager] Will create topic: ${topicName}`);
        } else {
          console.log(`✅ [TopicManager] Topic already exists: ${topicName}`);
        }
      }

      // Create topics if needed
      if (topicsToCreate.length > 0) {
        await this.admin.createTopics({
          topics: topicsToCreate,
          waitForLeaders: true,
          timeout: 30000
        });

        console.log(`✅ [TopicManager] Created ${topicsToCreate.length} new topics`);

        // Verify topic creation
        await this.verifyTopicCreation(topicsToCreate.map(t => t.topic));
      } else {
        console.log('✅ [TopicManager] All OPAL topics already exist');
      }

    } catch (error) {
      console.error('❌ [TopicManager] Failed to create topics:', error);
      throw error;
    }
  }

  /**
   * Verify that topics were created successfully
   */
  private async verifyTopicCreation(topicNames: string[]): Promise<void> {
    try {
      const metadata = await this.admin.fetchTopicMetadata({ topics: topicNames });

      for (const topic of metadata.topics) {
        if (topic.errorCode !== 0) {
          throw new Error(`Topic ${topic.name} has error code: ${topic.errorCode}`);
        }

        console.log(`✅ [TopicManager] Verified topic: ${topic.name} (${topic.partitions.length} partitions)`);
      }
    } catch (error) {
      console.error('❌ [TopicManager] Topic verification failed:', error);
      throw error;
    }
  }

  /**
   * Get topic health status and metadata
   */
  async getTopicHealthStatus(): Promise<Record<string, any>> {
    if (!this.isConnected) {
      throw new Error('Not connected to Kafka. Call connect() first.');
    }

    try {
      const topicNames = Object.keys(OPAL_TOPICS).map(key =>
        getTopicName(key as keyof typeof OPAL_TOPICS)
      );

      const metadata = await this.admin.fetchTopicMetadata({ topics: topicNames });
      const health: Record<string, any> = {};

      for (const topic of metadata.topics) {
        health[topic.name] = {
          exists: topic.errorCode === 0,
          partitions: topic.partitions.length,
          replicationFactor: topic.partitions[0]?.replicas?.length || 0,
          leader_count: topic.partitions.filter(p => p.leader !== -1).length,
          in_sync_replicas: topic.partitions.reduce((sum, p) => sum + (p.isr?.length || 0), 0),
          error_code: topic.errorCode
        };
      }

      return health;
    } catch (error) {
      console.error('❌ [TopicManager] Failed to get topic health:', error);
      throw error;
    }
  }

  /**
   * Update topic configurations
   */
  async updateTopicConfigs(topicKey: keyof typeof OPAL_TOPICS, configs: Record<string, string>): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to Kafka. Call connect() first.');
    }

    try {
      const topicName = getTopicName(topicKey);

      await this.admin.alterConfigs({
        validateOnly: false,
        resources: [{
          type: 2, // TOPIC
          name: topicName,
          configEntries: Object.entries(configs).map(([key, value]) => ({
            name: key,
            value: value
          }))
        }]
      });

      console.log(`✅ [TopicManager] Updated config for topic: ${topicName}`);
    } catch (error) {
      console.error(`❌ [TopicManager] Failed to update config for topic ${topicKey}:`, error);
      throw error;
    }
  }

  /**
   * Delete a topic (careful!)
   */
  async deleteTopic(topicKey: keyof typeof OPAL_TOPICS): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to Kafka. Call connect() first.');
    }

    const topicName = getTopicName(topicKey);

    console.warn(`⚠️ [TopicManager] DELETING TOPIC: ${topicName}`);

    try {
      await this.admin.deleteTopics({
        topics: [topicName],
        timeout: 30000
      });

      console.log(`✅ [TopicManager] Deleted topic: ${topicName}`);
    } catch (error) {
      console.error(`❌ [TopicManager] Failed to delete topic ${topicName}:`, error);
      throw error;
    }
  }

  /**
   * List all topics with their configurations
   */
  async listAllTopics(): Promise<Record<string, any>> {
    if (!this.isConnected) {
      throw new Error('Not connected to Kafka. Call connect() first.');
    }

    try {
      const topics = await this.admin.listTopics();
      const opalTopics = topics.filter(topic =>
        Object.values(OPAL_TOPICS).some(def =>
          topic.includes(def.name)
        )
      );

      const topicDetails: Record<string, any> = {};

      if (opalTopics.length > 0) {
        const metadata = await this.admin.fetchTopicMetadata({ topics: opalTopics });

        for (const topic of metadata.topics) {
          topicDetails[topic.name] = {
            partitions: topic.partitions.length,
            replication_factor: topic.partitions[0]?.replicas?.length || 0,
            leaders: topic.partitions.map(p => p.leader),
            in_sync_replicas_count: topic.partitions.reduce((sum, p) => sum + (p.isr?.length || 0), 0)
          };
        }
      }

      return {
        total_topics: topics.length,
        opal_topics: opalTopics.length,
        topics: topicDetails
      };
    } catch (error) {
      console.error('❌ [TopicManager] Failed to list topics:', error);
      throw error;
    }
  }

  /**
   * Initialize all OPAL topics for first-time setup
   */
  async initializeOpalTopics(): Promise<void> {
    console.log('🚀 [TopicManager] Initializing OPAL topics...');

    await this.connect();

    try {
      await this.createOpalTopics();

      // Wait a moment for topics to be fully ready
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify health
      const health = await this.getTopicHealthStatus();
      const healthyTopics = Object.values(health).filter((h: any) => h.exists).length;
      const totalTopics = Object.keys(OPAL_TOPICS).length;

      console.log(`✅ [TopicManager] OPAL topics initialized: ${healthyTopics}/${totalTopics} healthy`);

      if (healthyTopics < totalTopics) {
        console.warn('⚠️ [TopicManager] Some topics may not be ready yet. Check logs above.');
      }

    } catch (error) {
      console.error('❌ [TopicManager] Failed to initialize OPAL topics:', error);
      throw error;
    }
  }
}

// Singleton instance for reuse
let topicManagerInstance: OpalTopicManager | null = null;

export function getTopicManager(): OpalTopicManager {
  if (!topicManagerInstance) {
    topicManagerInstance = new OpalTopicManager();
  }
  return topicManagerInstance;
}