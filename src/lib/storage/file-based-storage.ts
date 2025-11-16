/**
 * File-Based Storage System for Webhook Events
 *
 * Provides persistent storage for webhook events and streaming data using JSON files.
 * Designed for Phase 3 diagnostics and streaming requirements.
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface WebhookEventRecord {
  id: string;
  workflow_id: string;
  agent_id: string;
  status: 'success' | 'failure';
  signature_valid: boolean;
  received_at: string; // ISO timestamp
  processing_time_ms: number;
  error_details: string | null;
  payload_size_bytes: number;
  dedup_hash: string;
  http_status: number;
  payload_json: any;
}

export interface StreamingEventRecord {
  id: string;
  workflow_id: string;
  agent_id: string;
  event_type: 'agent_update' | 'progress' | 'recommendation_preview' | 'completion';
  data: {
    progress_percentage?: number;
    preliminary_findings?: string;
    confidence_scores?: number;
    recommendation_previews?: string;
    status: 'running' | 'completed' | 'failed';
  };
  timestamp: string; // ISO timestamp
}

export class FileBasedStorage {
  private static readonly DATA_DIR = path.join(process.cwd(), 'data');
  private static readonly WEBHOOK_EVENTS_DIR = path.join(FileBasedStorage.DATA_DIR, 'webhook-events');
  private static readonly STREAMING_EVENTS_DIR = path.join(FileBasedStorage.DATA_DIR, 'streaming-events');

  // File rotation settings
  private static readonly MAX_EVENTS_PER_FILE = 1000;
  private static readonly MAX_FILES_TO_KEEP = 10;

  /**
   * Initialize storage directories
   */
  static async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.WEBHOOK_EVENTS_DIR, { recursive: true });
      await fs.mkdir(this.STREAMING_EVENTS_DIR, { recursive: true });
      console.log('✅ [FileStorage] Storage directories initialized');
    } catch (error) {
      console.error('❌ [FileStorage] Failed to initialize directories:', error);
      throw error;
    }
  }

  /**
   * Store webhook event with automatic file rotation
   */
  static async storeWebhookEvent(event: WebhookEventRecord): Promise<void> {
    try {
      const currentFile = await this.getCurrentWebhookFile();
      const events = await this.loadEventsFromFile(currentFile);

      events.push(event);

      // Check if we need to rotate to a new file
      if (events.length >= this.MAX_EVENTS_PER_FILE) {
        await this.rotateWebhookFile(events);
      } else {
        await this.saveEventsToFile(currentFile, events);
      }

      console.log('📁 [FileStorage] Webhook event stored', {
        event_id: event.id,
        workflow_id: event.workflow_id,
        agent_id: event.agent_id,
        file: path.basename(currentFile)
      });
    } catch (error) {
      console.error('❌ [FileStorage] Failed to store webhook event:', error);
      throw error;
    }
  }

  /**
   * Store streaming event for real-time updates
   */
  static async storeStreamingEvent(event: StreamingEventRecord): Promise<void> {
    try {
      const currentFile = await this.getCurrentStreamingFile();
      const events = await this.loadEventsFromFile(currentFile);

      events.push(event);
      await this.saveEventsToFile(currentFile, events);

      console.log('📺 [FileStorage] Streaming event stored', {
        event_id: event.id,
        workflow_id: event.workflow_id,
        event_type: event.event_type,
        file: path.basename(currentFile)
      });
    } catch (error) {
      console.error('❌ [FileStorage] Failed to store streaming event:', error);
      throw error;
    }
  }

  /**
   * Retrieve webhook events with filtering
   */
  static async getWebhookEvents(options: {
    limit?: number;
    status?: 'success' | 'failure' | 'all';
    agent_id?: string;
    workflow_id?: string;
    hours?: number;
  } = {}): Promise<WebhookEventRecord[]> {
    const {
      limit = 25,
      status = 'all',
      agent_id,
      workflow_id,
      hours = 24
    } = options;

    try {
      const allEvents = await this.loadAllWebhookEvents();
      let filteredEvents = allEvents;

      // Filter by time range
      if (hours > 0) {
        const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
        filteredEvents = filteredEvents.filter(event =>
          new Date(event.received_at) >= hoursAgo
        );
      }

      // Filter by status
      if (status !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.status === status);
      }

      // Filter by agent_id
      if (agent_id) {
        filteredEvents = filteredEvents.filter(event => event.agent_id === agent_id);
      }

      // Filter by workflow_id
      if (workflow_id) {
        filteredEvents = filteredEvents.filter(event => event.workflow_id === workflow_id);
      }

      // Sort by received_at (newest first) and apply limit
      const sortedEvents = filteredEvents
        .sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime())
        .slice(0, limit);

      console.log('🔍 [FileStorage] Webhook events retrieved', {
        total_available: allEvents.length,
        after_filters: filteredEvents.length,
        returned: sortedEvents.length,
        filters: { status, agent_id, workflow_id, hours, limit }
      });

      return sortedEvents;
    } catch (error) {
      console.error('❌ [FileStorage] Failed to retrieve webhook events:', error);
      throw error;
    }
  }

  /**
   * Retrieve recent streaming events for a workflow
   */
  static async getStreamingEvents(workflowId: string, limit: number = 50): Promise<StreamingEventRecord[]> {
    try {
      const allEvents = await this.loadAllStreamingEvents();

      const workflowEvents = allEvents
        .filter(event => event.workflow_id === workflowId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      console.log('📺 [FileStorage] Streaming events retrieved', {
        workflow_id: workflowId,
        events_found: workflowEvents.length,
        limit
      });

      return workflowEvents;
    } catch (error) {
      console.error('❌ [FileStorage] Failed to retrieve streaming events:', error);
      throw error;
    }
  }

  /**
   * Find webhook event by deduplication hash
   */
  static async findWebhookEventByDedupHash(dedupHash: string): Promise<WebhookEventRecord | null> {
    try {
      const allEvents = await this.loadAllWebhookEvents();
      const event = allEvents.find(e => e.dedup_hash === dedupHash) || null;

      if (event) {
        console.log('🔍 [FileStorage] Found event by dedup hash', {
          event_id: event.id,
          dedup_hash: dedupHash.substring(0, 12) + '...'
        });
      }

      return event;
    } catch (error) {
      console.error('❌ [FileStorage] Failed to find event by dedup hash:', error);
      throw error;
    }
  }

  /**
   * Get webhook event statistics
   */
  static async getWebhookStats(): Promise<{
    total_events_24h: number;
    successful_events_24h: number;
    failed_events_24h: number;
    last_event_timestamp: string | null;
    signature_valid_rate: number;
  }> {
    try {
      const events24h = await this.getWebhookEvents({ hours: 24, limit: 10000 });
      const successfulEvents = events24h.filter(e => e.status === 'success' && e.signature_valid);
      const failedEvents = events24h.filter(e => e.status === 'failure' || !e.signature_valid);

      const allEvents = await this.loadAllWebhookEvents();
      const signatureValidCount = allEvents.filter(e => e.signature_valid).length;
      const signatureValidRate = allEvents.length > 0 ? signatureValidCount / allEvents.length : 0;

      const lastEvent = events24h.length > 0 ? events24h[0] : null;

      return {
        total_events_24h: events24h.length,
        successful_events_24h: successfulEvents.length,
        failed_events_24h: failedEvents.length,
        last_event_timestamp: lastEvent?.received_at || null,
        signature_valid_rate: signatureValidRate
      };
    } catch (error) {
      console.error('❌ [FileStorage] Failed to get webhook stats:', error);
      throw error;
    }
  }

  // Private helper methods

  private static async getCurrentWebhookFile(): Promise<string> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `webhook-events-${today}.json`;
    return path.join(this.WEBHOOK_EVENTS_DIR, filename);
  }

  private static async getCurrentStreamingFile(): Promise<string> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `streaming-events-${today}.json`;
    return path.join(this.STREAMING_EVENTS_DIR, filename);
  }

  private static async loadEventsFromFile(filePath: string): Promise<any[]> {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Handle both array format [events] and object format {events: [events]}
      if (Array.isArray(parsed)) {
        return parsed; // Direct array format
      } else if (parsed && Array.isArray(parsed.events)) {
        return parsed.events; // Object format with events property
      } else {
        // Fallback: return empty array for unexpected formats
        console.warn('⚠️ [FileStorage] Unexpected file format, returning empty array:', filePath);
        return [];
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return empty array
        return [];
      }
      throw error;
    }
  }

  private static async saveEventsToFile(filePath: string, events: any[]): Promise<void> {
    const data = JSON.stringify(events, null, 2);
    await fs.writeFile(filePath, data, 'utf-8');
  }

  private static async loadAllWebhookEvents(): Promise<WebhookEventRecord[]> {
    try {
      const files = await fs.readdir(this.WEBHOOK_EVENTS_DIR);
      const webhookFiles = files
        .filter(f => f.startsWith('webhook-events-') && f.endsWith('.json'))
        .sort()
        .reverse() // Most recent first
        .slice(0, this.MAX_FILES_TO_KEEP);

      const allEvents: WebhookEventRecord[] = [];

      for (const file of webhookFiles) {
        const filePath = path.join(this.WEBHOOK_EVENTS_DIR, file);
        const events = await this.loadEventsFromFile(filePath);
        if (Array.isArray(events)) {
          allEvents.push(...events);
        }
      }

      return allEvents;
    } catch (error) {
      console.error('❌ [FileStorage] Failed to load all webhook events:', error);
      return [];
    }
  }

  private static async loadAllStreamingEvents(): Promise<StreamingEventRecord[]> {
    try {
      const files = await fs.readdir(this.STREAMING_EVENTS_DIR);
      const streamingFiles = files
        .filter(f => f.startsWith('streaming-events-') && f.endsWith('.json'))
        .sort()
        .reverse() // Most recent first
        .slice(0, this.MAX_FILES_TO_KEEP);

      const allEvents: StreamingEventRecord[] = [];

      for (const file of streamingFiles) {
        const filePath = path.join(this.STREAMING_EVENTS_DIR, file);
        const events = await this.loadEventsFromFile(filePath);
        if (Array.isArray(events)) {
          allEvents.push(...events);
        }
      }

      return allEvents;
    } catch (error) {
      console.error('❌ [FileStorage] Failed to load all streaming events:', error);
      return [];
    }
  }

  private static async rotateWebhookFile(currentEvents: WebhookEventRecord[]): Promise<void> {
    // Save current events to current file
    const currentFile = await this.getCurrentWebhookFile();
    await this.saveEventsToFile(currentFile, currentEvents);

    // Clean up old files
    await this.cleanupOldFiles(this.WEBHOOK_EVENTS_DIR, 'webhook-events-', this.MAX_FILES_TO_KEEP);
  }

  private static async cleanupOldFiles(directory: string, prefix: string, keepCount: number): Promise<void> {
    try {
      const files = await fs.readdir(directory);
      const targetFiles = files
        .filter(f => f.startsWith(prefix) && f.endsWith('.json'))
        .sort()
        .reverse(); // Most recent first

      if (targetFiles.length > keepCount) {
        const filesToDelete = targetFiles.slice(keepCount);

        for (const file of filesToDelete) {
          const filePath = path.join(directory, file);
          await fs.unlink(filePath);
          console.log('🗑️ [FileStorage] Deleted old file:', file);
        }
      }
    } catch (error) {
      console.error('❌ [FileStorage] Failed to cleanup old files:', error);
    }
  }
}

// Initialize storage on module load
FileBasedStorage.initialize().catch(console.error);