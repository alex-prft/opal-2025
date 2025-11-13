/**
 * Webhook Database Service - File-Based Implementation
 *
 * Provides database operations for webhook events using file-based storage.
 * Maintains compatibility with existing webhook route while adding persistence.
 */

import { FileBasedStorage, type WebhookEventRecord } from './file-based-storage';

export interface WebhookEvent {
  workflow_id: string;
  agent_id: string;
  execution_status: 'success' | 'failure' | 'timeout';
  offset: number;
  timestamp?: string;
  agent_data?: any;
  error_details?: any;
}

/**
 * Webhook Database operations using file-based storage
 */
export class WebhookDatabase {

  /**
   * Find webhook event by deduplication hash
   */
  static async findByDedupHash(dedupHash: string): Promise<WebhookEventRecord | null> {
    return await FileBasedStorage.findWebhookEventByDedupHash(dedupHash);
  }

  /**
   * Insert new webhook event
   */
  static async insertEvent(eventData: {
    workflow_id: string;
    agent_id: string;
    offset: number | null;
    payload_json: any;
    signature_valid: boolean;
    dedup_hash: string;
    http_status: number;
    error_text: string | null;
    processing_time_ms?: number;
  }): Promise<string> {

    const eventId = `event-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Determine status based on execution results
    let status: 'success' | 'failure';
    if (eventData.signature_valid && eventData.http_status === 202) {
      status = 'success';
    } else {
      status = 'failure';
    }

    // Calculate payload size
    const payloadSize = JSON.stringify(eventData.payload_json).length;

    const webhookEvent: WebhookEventRecord = {
      id: eventId,
      workflow_id: eventData.workflow_id,
      agent_id: eventData.agent_id,
      status,
      signature_valid: eventData.signature_valid,
      received_at: new Date().toISOString(),
      processing_time_ms: eventData.processing_time_ms || 0,
      error_details: eventData.error_text,
      payload_size_bytes: payloadSize,
      dedup_hash: eventData.dedup_hash,
      http_status: eventData.http_status,
      payload_json: eventData.payload_json
    };

    await FileBasedStorage.storeWebhookEvent(webhookEvent);

    console.log('💾 [WebhookDB] Event stored to file system', {
      event_id: eventId,
      workflow_id: eventData.workflow_id,
      agent_id: eventData.agent_id,
      status,
      payload_size: payloadSize
    });

    return eventId;
  }

  /**
   * Get recent webhook events
   */
  static async getRecentEvents(limit: number = 25): Promise<WebhookEventRecord[]> {
    return await FileBasedStorage.getWebhookEvents({ limit });
  }

  /**
   * Get webhook event statistics
   */
  static async getEventStats(): Promise<{
    total_events_24h: number;
    successful_events_24h: number;
    failed_events_24h: number;
    last_event_timestamp: string | null;
    signature_valid_count: number;
    signature_valid_rate: number;
  }> {
    const stats = await FileBasedStorage.getWebhookStats();

    // Get all events for signature validation stats
    const allEvents = await FileBasedStorage.getWebhookEvents({ limit: 10000, hours: 24 * 7 }); // Last week
    const signatureValidCount = allEvents.filter(e => e.signature_valid).length;

    return {
      ...stats,
      signature_valid_count: signatureValidCount
    };
  }

  /**
   * Get filtered webhook events (for diagnostics)
   */
  static async getFilteredEvents(options: {
    limit?: number;
    status?: 'success' | 'failure' | 'all';
    agent_id?: string;
    workflow_id?: string;
    hours?: number;
  }): Promise<{
    events: WebhookEventRecord[];
    total_count: number;
  }> {
    const events = await FileBasedStorage.getWebhookEvents(options);

    // Get total count without limit for summary statistics
    const allFilteredEvents = await FileBasedStorage.getWebhookEvents({
      ...options,
      limit: 10000 // Large number to get all
    });

    return {
      events,
      total_count: allFilteredEvents.length
    };
  }

  /**
   * Convert old in-memory format to new file-based format
   * (Migration helper - can be removed after migration)
   */
  static convertLegacyEvent(legacyEvent: any): WebhookEventRecord {
    return {
      id: legacyEvent.id,
      workflow_id: legacyEvent.workflow_id || 'unknown',
      agent_id: legacyEvent.agent_id || 'unknown',
      status: (legacyEvent.signature_valid && legacyEvent.http_status === 202) ? 'success' : 'failure',
      signature_valid: legacyEvent.signature_valid || false,
      received_at: legacyEvent.received_at?.toISOString() || new Date().toISOString(),
      processing_time_ms: 0,
      error_details: legacyEvent.error_text || null,
      payload_size_bytes: JSON.stringify(legacyEvent.payload_json || {}).length,
      dedup_hash: legacyEvent.dedup_hash || `legacy-${legacyEvent.id}`,
      http_status: legacyEvent.http_status || 500,
      payload_json: legacyEvent.payload_json || {}
    };
  }
}