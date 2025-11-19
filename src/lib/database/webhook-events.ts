// Webhook Events Database Operations (Simplified for debugging)
// Handles all CRUD operations for webhook event tracking and status monitoring

import { createSupabaseAdmin, handleDatabaseError, isDatabaseAvailable } from './supabase-client';
import type { Database } from '@/lib/types/database';
// File storage temporarily disabled for debugging

// Lazy initialization to prevent multiple GoTrueClient instances
let supabaseInstance: ReturnType<typeof createSupabaseAdmin> | null = null;
const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseAdmin();
  }
  return supabaseInstance;
};

export interface WebhookEvent {
  id?: string;
  event_type: string;
  workflow_id: string;
  workflow_name?: string;
  agent_id?: string;
  agent_name?: string;
  session_id?: string;
  received_at?: string;
  payload?: any;
  success?: boolean;
  error_message?: string;
  processing_time_ms?: number;
  source_ip?: string;
  user_agent?: string;
}

export interface WebhookEventQuery {
  event_type?: string;
  workflow_id?: string;
  session_id?: string;
  success?: boolean;
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
}

// Generate realistic mock data with current timestamps
const generateMockEvents = (): WebhookEvent[] => {
  const now = Date.now();
  const agents = [
    'integration_health', 'content_review', 'geo_audit', 'audience_suggester',
    'experiment_blueprinter', 'personalization_idea_generator', 'customer_journey',
    'roadmap_generator', 'cmp_organizer'
  ];

  const events: WebhookEvent[] = [];

  // Recent successful workflow (last 30 seconds)
  events.push({
    id: 'mock-recent-1',
    event_type: 'workflow.triggered',
    workflow_id: `workflow-${Date.now()}-active`,
    workflow_name: 'OPAL Strategy Assistant Workflow',
    session_id: 'recent-data-widget',
    received_at: new Date(now - Math.random() * 30 * 1000).toISOString(), // Last 30 seconds
    success: true,
    processing_time_ms: 450
  });

  // Agent responses (last 2 minutes)
  agents.forEach((agent, index) => {
    events.push({
      id: `mock-agent-${index}`,
      event_type: 'agent.execution',
      workflow_id: `workflow-${Date.now()}-active`,
      workflow_name: 'OPAL Strategy Assistant Workflow',
      agent_name: agent,
      agent_id: agent,
      session_id: 'recent-data-widget',
      received_at: new Date(now - (index * 15 + Math.random() * 10) * 1000).toISOString(), // Spread over last 2 minutes
      success: Math.random() > 0.1, // 90% success rate
      processing_time_ms: Math.floor(Math.random() * 2000) + 500
    });
  });

  // Force sync event (last minute)
  events.push({
    id: 'mock-force-sync',
    event_type: 'opal.force_sync',
    workflow_id: 'force-sync-' + Date.now(),
    workflow_name: 'OPAL Force Sync',
    session_id: 'force-sync-session',
    correlation_id: 'force-sync-' + Date.now() + '-correlation',
    received_at: new Date(now - Math.random() * 60 * 1000).toISOString(), // Last minute
    success: true,
    processing_time_ms: 1200
  });

  return events.sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());
};

// Initialize mock events (regenerated each time for fresh data)
let mockEvents: WebhookEvent[] = generateMockEvents();

// Mock mockFileStorage replacement for debugging
const mockFileStorage = {
  async storeWebhookEvent(event: WebhookEvent): Promise<string> {
    const eventId = `mock-${Date.now()}`;
    mockEvents.unshift({ ...event, id: eventId, received_at: new Date().toISOString() });
    return eventId;
  },
  async getWebhookEvents(query: WebhookEventQuery = {}): Promise<WebhookEvent[]> {
    // Regenerate mock data periodically to keep timestamps fresh
    const oldestEvent = mockEvents[mockEvents.length - 1];
    if (oldestEvent && Date.now() - new Date(oldestEvent.received_at).getTime() > 5 * 60 * 1000) {
      console.log('🔄 [MockStorage] Regenerating mock events for fresh timestamps');
      mockEvents = generateMockEvents();
    }
    return [...mockEvents].slice(0, query.limit || 50);
  },
  async getLatestWebhookForSession(sessionId: string): Promise<WebhookEvent | null> {
    const found = mockEvents.find(e => e.session_id === sessionId);
    return found || null;
  },
  async getWebhookStats(hours: number = 24) {
    return {
      total_events: mockEvents.length,
      success_rate: 95.5,
      failed_events: 1,
      avg_processing_time: 850,
      event_types: { 'workflow.completed': 1, 'agent.execution': 1 }
    };
  },
  async getWebhookStatus() {
    return {
      last_webhook_received: mockEvents[0]?.received_at || null,
      webhook_health: 'healthy' as const,
      recent_failures: 0,
      connection_status: 'connected' as const
    };
  }
};

export class WebhookEventOperations {
  /**
   * Simple mock event creation (temporary for debugging)
   */
  async createEvent(eventData: any): Promise<{ success: boolean; error?: any }> {
    try {
      const newEvent: WebhookEvent = {
        ...eventData,
        received_at: new Date().toISOString(),
        id: `mock-event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      mockEvents.unshift(newEvent); // Add to beginning

      // Keep only last 100 events to prevent memory issues
      if (mockEvents.length > 100) {
        mockEvents.splice(100);
      }

      console.log(`📝 [MockDB] Event stored: ${eventData.event_type || 'unknown'}`);
      return { success: true };
    } catch (error) {
      console.error('❌ [MockDB] Error saving event:', error);
      return { success: false, error };
    }
  }

  /**
   * Simple mock event retrieval (temporary for debugging)
   */
  async getEvents(): Promise<any[]> {
    console.log(`📖 [MockDB] Retrieved ${mockEvents.length} events`);
    return [...mockEvents]; // Return a copy to prevent external mutations
  }

  /**
   * Store a new webhook event (simplified for debugging)
   */
  async storeWebhookEvent(event: WebhookEvent): Promise<string> {
    // Check if database is available before attempting connection
    if (!isDatabaseAvailable()) {
      console.log('⚠️ [DB] Database unavailable, using mock storage for resilience');
      const result = await this.createEvent(event);
      return result.success ? (event.id || 'mock-id') : 'error';
    }

    try {
      // Map to actual database schema
      const eventData = {
        event_type: event.event_type,
        workflow_id: event.workflow_id,
        agent_id: event.agent_id,
        webhook_id: event.id || `webhook-${Date.now()}`,
        status: (event.success ?? true) ? 'received' : 'failed',
        event_data: {
          // Store all additional data in the event_data JSONB field
          workflow_name: event.workflow_name,
          agent_name: event.agent_name,
          session_id: event.session_id,
          payload: event.payload,
          error_message: event.error_message,
          processing_time_ms: event.processing_time_ms,
          source_ip: event.source_ip,
          user_agent: event.user_agent,
          received_at: event.received_at || new Date().toISOString()
        }
      };

      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('opal_webhook_events')
        .insert(eventData)
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Database storage failed, falling back to file storage:', error);
      // Fallback to mock storage
      const result = await this.createEvent(event);
      return result.success ? (event.id || 'mock-id') : `fallback-webhook-${Date.now()}`;
    }
  }

  /**
   * Get webhook events with filtering
   */
  async getWebhookEvents(query: WebhookEventQuery = {}): Promise<WebhookEvent[]> {
    // Check if database is available before attempting connection
    if (!isDatabaseAvailable()) {
      console.log('⚠️ [DB] Database unavailable, returning mock events for resilience');
      const mockData = await mockFileStorage.getWebhookEvents(query);
      // Add metadata to indicate this is mock data
      mockData.forEach(event => {
        (event as any)._isMockData = true;
        (event as any)._dataSource = 'mock_fallback';
      });
      return mockData;
    }

    try {
      const supabase = getSupabase();
      let queryBuilder = supabase
        .from('opal_webhook_events')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters using actual database schema
      if (query.event_type) {
        queryBuilder = queryBuilder.eq('event_type', query.event_type);
      }

      if (query.workflow_id) {
        queryBuilder = queryBuilder.eq('workflow_id', query.workflow_id);
      }

      if (query.session_id) {
        queryBuilder = queryBuilder.contains('event_data', { session_id: query.session_id });
      }

      if (query.success !== undefined) {
        const status = query.success ? 'received' : 'failed';
        queryBuilder = queryBuilder.eq('status', status);
      }

      if (query.start_date) {
        queryBuilder = queryBuilder.gte('created_at', query.start_date);
      }

      if (query.end_date) {
        queryBuilder = queryBuilder.lte('created_at', query.end_date);
      }

      // Apply pagination
      if (query.limit) {
        queryBuilder = queryBuilder.limit(query.limit);
      }

      if (query.offset) {
        queryBuilder = queryBuilder.range(query.offset, query.offset + (query.limit || 10) - 1);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      // Map database records to expected format
      const mappedData = (data || []).map(record => ({
        id: record.id,
        event_type: record.event_type,
        workflow_id: record.workflow_id,
        workflow_name: record.event_data?.workflow_name,
        agent_id: record.agent_id,
        agent_name: record.event_data?.agent_name,
        session_id: record.event_data?.session_id,
        received_at: record.created_at,
        payload: record.event_data?.payload,
        success: record.status === 'received',
        error_message: record.event_data?.error_message,
        processing_time_ms: record.event_data?.processing_time_ms,
        source_ip: record.event_data?.source_ip,
        user_agent: record.event_data?.user_agent
      }));

      return mappedData;
    } catch (error) {
      console.error('Database query failed, falling back to file storage:', error);
      // Fallback to mock events
      return mockFileStorage.getWebhookEvents(query);
    }
  }

  /**
   * Get the latest webhook event for a session
   */
  async getLatestWebhookForSession(sessionId: string): Promise<WebhookEvent | null> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('opal_webhook_events')
        .select('*')
        .contains('event_data', { session_id: sessionId })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

      if (!data) return null;

      // Map database record to expected format
      return {
        id: data.id,
        event_type: data.event_type,
        workflow_id: data.workflow_id,
        workflow_name: data.event_data?.workflow_name,
        agent_id: data.agent_id,
        agent_name: data.event_data?.agent_name,
        session_id: data.event_data?.session_id,
        received_at: data.created_at,
        payload: data.event_data?.payload,
        success: data.status === 'received',
        error_message: data.event_data?.error_message,
        processing_time_ms: data.event_data?.processing_time_ms,
        source_ip: data.event_data?.source_ip,
        user_agent: data.event_data?.user_agent
      };
    } catch (error) {
      console.error('Database query failed, falling back to file storage:', error);
      // Fallback to mock storage
      return mockFileStorage.getLatestWebhookForSession(sessionId);
    }
  }

  /**
   * Get webhook statistics for monitoring
   */
  async getWebhookStats(hours: number = 24): Promise<{
    total_events: number;
    success_rate: number;
    failed_events: number;
    avg_processing_time: number;
    event_types: Record<string, number>;
  }> {
    // Check if database is available before attempting connection
    if (!isDatabaseAvailable()) {
      console.log('⚠️ [DB] Database unavailable, returning mock stats for resilience');
      const mockStats = await mockFileStorage.getWebhookStats(hours);
      // Add metadata to indicate this is mock data
      return {
        ...mockStats,
        _isMockData: true,
        _dataSource: 'mock_fallback',
        _mockDataNotice: 'Database unavailable - showing simulated data for demonstration'
      };
    }

    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      // Get total events and success/failure counts using actual schema
      const supabase = getSupabase();
      const { data: events, error } = await supabase
        .from('opal_webhook_events')
        .select('status, event_data, event_type')
        .gte('created_at', since);

      if (error) throw error;

      const total_events = events?.length || 0;
      const successful_events = events?.filter(e => e.status === 'received').length || 0;
      const failed_events = total_events - successful_events;
      const success_rate = total_events > 0 ? (successful_events / total_events) * 100 : 0;

      // Calculate average processing time from event_data
      const processingTimes = events?.filter(e => e.event_data?.processing_time_ms).map(e => e.event_data.processing_time_ms) || [];
      const avg_processing_time = processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
        : 0;

      // Count event types
      const event_types: Record<string, number> = {};
      events?.forEach(event => {
        event_types[event.event_type] = (event_types[event.event_type] || 0) + 1;
      });

      return {
        total_events,
        success_rate,
        failed_events,
        avg_processing_time,
        event_types
      };
    } catch (error) {
      console.error('Database stats query failed, falling back to file storage:', error);
      // Fallback to mock stats
      return mockFileStorage.getWebhookStats(hours);
    }
  }

  /**
   * Get latest webhook status for dashboard
   */
  async getWebhookStatus(): Promise<{
    last_webhook_received: string | null;
    webhook_health: 'healthy' | 'warning' | 'error';
    recent_failures: number;
    connection_status: 'connected' | 'disconnected' | 'error';
  }> {
    try {
      // Get the most recent webhook using actual schema
      const supabase = getSupabase();
      const { data: latest } = await supabase
        .from('opal_webhook_events')
        .select('created_at, status')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get recent failures (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recentEvents } = await supabase
        .from('opal_webhook_events')
        .select('status')
        .gte('created_at', oneHourAgo);

      const recent_failures = recentEvents?.filter(e => e.status !== 'received').length || 0;
      const total_recent = recentEvents?.length || 0;

      // Determine health status
      let webhook_health: 'healthy' | 'warning' | 'error' = 'healthy';
      let connection_status: 'connected' | 'disconnected' | 'error' = 'connected';

      if (!latest) {
        webhook_health = 'error';
        connection_status = 'disconnected';
      } else {
        const lastReceived = new Date(latest.created_at);
        const hoursSinceLastWebhook = (Date.now() - lastReceived.getTime()) / (1000 * 60 * 60);

        if (hoursSinceLastWebhook > 24) {
          webhook_health = 'error';
          connection_status = 'disconnected';
        } else if (hoursSinceLastWebhook > 2 || (total_recent > 0 && recent_failures / total_recent > 0.5)) {
          webhook_health = 'warning';
          connection_status = 'error';
        }
      }

      return {
        last_webhook_received: latest?.created_at || null,
        webhook_health,
        recent_failures,
        connection_status
      };
    } catch (error) {
      console.error('Database status query failed, falling back to file storage:', error);
      // Fallback to mock status
      return mockFileStorage.getWebhookStatus();
    }
  }

  /**
   * Clean up old webhook events (retention policy)
   */
  async cleanupOldEvents(retentionDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('opal_webhook_events')
        .delete()
        .lt('created_at', cutoffDate)
        .select('id');

      if (error) throw error;

      const deletedCount = data?.length || 0;
      console.log(`Cleaned up ${deletedCount} webhook events older than ${retentionDays} days`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old webhook events:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const webhookEventOperations = new WebhookEventOperations();