/**
 * Real-time Webhook Stream Hook
 *
 * Uses Server-Sent Events (SSE) to provide live webhook event updates.
 * Replaces polling-based data fetching with real-time event streaming for
 * better performance and reduced server load.
 *
 * @since 1.0.0
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events}
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Represents a webhook event received from the OSA system
 *
 * @interface WebhookEvent
 * @since 1.0.0
 * @example
 * ```typescript
 * const event: WebhookEvent = {
 *   id: 'evt_123',
 *   event_type: 'workflow_completed',
 *   workflow_id: 'wf_456',
 *   workflow_name: 'strategy_workflow',
 *   agent_id: 'content_review',
 *   success: true,
 *   received_at: '2025-11-16T19:30:45.123Z',
 *   processing_time_ms: 1250
 * };
 * ```
 */
export interface WebhookEvent {
  /** Unique identifier for the webhook event */
  id: string;
  /** Type of event (e.g., 'workflow_completed', 'agent_execution', 'heartbeat') */
  event_type: string;
  /** Workflow identifier associated with this event */
  workflow_id: string;
  /** Human-readable name of the workflow (optional) */
  workflow_name?: string;
  /** OPAL agent identifier that generated this event (optional) */
  agent_id?: string;
  /** Human-readable name of the agent (optional) */
  agent_name?: string;
  /** Whether the operation was successful (optional) */
  success?: boolean;
  /** Error message if the operation failed (optional) */
  error_message?: string;
  /** Timestamp when the event was received (ISO 8601) */
  received_at?: string;
  /** Processing time in milliseconds (optional) */
  processing_time_ms?: number;
}

/**
 * Represents a message received via Server-Sent Events
 *
 * @interface StreamMessage
 * @since 1.0.0
 */
export interface StreamMessage {
  /** Type of SSE message */
  type: 'connection' | 'webhook_event' | 'heartbeat' | 'error';
  /** Optional message content */
  message?: string;
  /** Webhook event data (only for 'webhook_event' type) */
  event?: WebhookEvent;
  /** Timestamp when the message was created (ISO 8601) */
  timestamp: string;
}

/**
 * Configuration options for the useWebhookStream hook
 *
 * @interface WebhookStreamOptions
 * @since 1.0.0
 */
export interface WebhookStreamOptions {
  /** Main control switch - enables/disables the stream */
  enabled: boolean;
  /** SSE endpoint URL (default: '/api/webhook-events/stream') */
  url?: string;
  /** Callback for raw SSE messages */
  onMessage?: (event: MessageEvent) => void;
  /** Callback for SSE connection errors */
  onError?: (error: Event) => void;
  /** Maximum reconnection attempts (default: 5) */
  maxAttempts?: number;
  /** Delay between reconnection attempts in ms (default: 4000) */
  reconnectDelayMs?: number;
  /** Session ID to filter events (optional) */
  sessionId?: string;
  /** Workflow ID to filter events (optional) */
  workflowId?: string;
  /** Maximum number of events to keep in memory (default: 50) */
  maxEvents?: number;
  /** Callback when new webhook event is received */
  onEvent?: (event: WebhookEvent) => void;
  /** Callback when stream successfully connects */
  onConnect?: () => void;
  /** Callback when stream disconnects (optional) */
  onDisconnect?: () => void;
}

/**
 * Return type for the useWebhookStream hook
 *
 * @interface WebhookStreamReturn
 * @since 1.0.0
 */
export interface WebhookStreamReturn {
  /** Array of received webhook events */
  events: WebhookEvent[];
  /** Most recent webhook event (null if none) */
  latestEvent: WebhookEvent | null;
  /** Total count of received events */
  eventCount: number;
  /** Whether the stream is currently connected */
  isConnected: boolean;
  /** Current error message (null if none) */
  error: string | null;
  /** Timestamp of last received event (ISO 8601) */
  lastEventTime: string | null;
  /** Number of successful connections made */
  connectionCount: number;
  /** Whether any events have been received */
  hasEvents: boolean;
  /** Whether there was activity in the last minute */
  hasRecentActivity: boolean;
  /** Current reconnection attempt number */
  reconnectAttempt: number;
  /** Maximum number of reconnection attempts */
  maxReconnectAttempts: number;
  /** Whether the connection is healthy (connected and no errors) */
  isHealthy: boolean;
  /** Whether a reconnection is needed */
  needsReconnection: boolean;
}

/**
 * React hook for managing real-time webhook streaming via Server-Sent Events.
 *
 * This hook provides a robust SSE connection with automatic reconnection,
 * event filtering, and comprehensive error handling. It's designed to be
 * controlled (enabled/disabled) for optimal performance during Force Sync
 * workflows and other real-time scenarios.
 *
 * @param options - Configuration options for the webhook stream
 * @returns Object containing stream state, events, and connection health
 *
 * @since 1.0.0
 * @example
 * Basic usage:
 * ```typescript
 * const {
 *   events,
 *   isConnected,
 *   error,
 *   eventCount
 * } = useWebhookStream({
 *   enabled: true,
 *   onEvent: (event) => console.log('New event:', event),
 *   onConnect: () => console.log('Stream connected')
 * });
 * ```
 *
 * @example
 * Controlled streaming during Force Sync:
 * ```typescript
 * const { forceSyncActive } = useForceSyncUnified();
 * const streamingEnabled = forceSyncActive &&
 *   (process.env.NODE_ENV === 'production' ||
 *    process.env.NEXT_PUBLIC_OSA_STREAM_DEBUG === 'true');
 *
 * const webhookStream = useWebhookStream({
 *   enabled: streamingEnabled,
 *   sessionId: forceSyncCorrelationId,
 *   workflowId: forceSyncWorkflowId,
 *   onEvent: handleNewEvent,
 *   onMessage: handleRawMessage,
 *   maxEvents: 100
 * });
 * ```
 *
 * @example
 * With comprehensive error handling:
 * ```typescript
 * const stream = useWebhookStream({
 *   enabled: true,
 *   maxAttempts: 3,
 *   reconnectDelayMs: 2000,
 *   onError: (error) => {
 *     console.error('Stream failed:', error);
 *     // Implement fallback polling
 *   },
 *   onConnect: () => setStreamStatus('connected'),
 *   onDisconnect: () => setStreamStatus('disconnected')
 * });
 *
 * // Check stream health
 * if (!stream.isHealthy) {
 *   // Handle degraded performance
 * }
 * ```
 */
export function useWebhookStream({
  enabled,
  url = '/api/webhook-events/stream',
  onMessage,
  onError,
  maxAttempts = 5,
  reconnectDelayMs = 4000,
  sessionId,
  workflowId,
  maxEvents = 50,
  onEvent,
  onConnect,
  onDisconnect,
}: WebhookStreamOptions): WebhookStreamReturn {
  const eventSourceRef = useRef<EventSource | null>(null);
  const attemptsRef = useRef(0);

  const isDebug =
    typeof window !== 'undefined' &&
    (process.env.NEXT_PUBLIC_OSA_STREAM_DEBUG === 'true');

  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEventTime, setLastEventTime] = useState<string | null>(null);
  const [connectionCount, setConnectionCount] = useState(0);

  // Build SSE URL with parameters
  const buildStreamUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (sessionId) params.append('session_id', sessionId);
    if (workflowId) params.append('workflow_id', workflowId);

    const queryString = params.toString();
    return `${url}${queryString ? `?${queryString}` : ''}`;
  }, [url, sessionId, workflowId]);

  // Handle incoming SSE messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data: StreamMessage = JSON.parse(event.data);

      if (isDebug) {
        console.log(`📡 [WebhookStream] Received ${data.type}:`, data);
      }

      switch (data.type) {
        case 'connection':
          setIsConnected(true);
          setError(null);
          attemptsRef.current = 0;
          setConnectionCount(prev => prev + 1);
          onConnect?.();
          break;

        case 'webhook_event':
          if (data.event) {
            setEvents(prevEvents => {
              const newEvents = [data.event!, ...prevEvents];
              // Keep only the most recent events
              return newEvents.slice(0, maxEvents);
            });
            setLastEventTime(data.event.received_at || data.timestamp);
            onEvent?.(data.event);
          }
          break;

        case 'heartbeat':
          // Update last heartbeat time to show connection is alive
          setLastEventTime(data.timestamp);
          break;

        case 'error':
          const errorMsg = data.message || 'Stream error occurred';
          if (isDebug) {
            console.error('📡 [WebhookStream] Stream error:', errorMsg);
          }
          setError(errorMsg);
          break;

        default:
          if (isDebug) {
            console.warn('📡 [WebhookStream] Unknown message type:', data.type);
          }
      }
    } catch (err) {
      if (isDebug) {
        console.error('📡 [WebhookStream] Failed to parse message:', event.data, err);
      }
      setError('Failed to parse stream message');
    }
  }, [maxEvents, onEvent, onConnect, isDebug]);


  useEffect(() => {
    // If not enabled, ensure we fully disconnect and reset.
    if (!enabled) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      attemptsRef.current = 0;
      return;
    }

    if (eventSourceRef.current) return; // already connected

    const connect = () => {
      if (isDebug) {
        console.log('[WebhookStream] Connecting to', buildStreamUrl());
      }

      const es = new EventSource(buildStreamUrl());
      eventSourceRef.current = es;

      es.onmessage = (evt) => {
        // Handle the message through existing logic
        handleMessage(evt);
        onMessage?.(evt);
      };

      es.onerror = (evt) => {
        if (isDebug) {
          console.warn(
            `[WebhookStream] error, reconnecting in ${reconnectDelayMs}ms (attempt ${attemptsRef.current + 1}/${maxAttempts})`,
            evt
          );
        }

        es.close();
        eventSourceRef.current = null;
        attemptsRef.current += 1;

        if (attemptsRef.current >= maxAttempts) {
          if (isDebug) {
            console.warn('[WebhookStream] Max attempts reached, giving up');
          }
          onError?.(evt);
          return;
        }

        setTimeout(connect, reconnectDelayMs);
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      attemptsRef.current = 0;
    };
  }, [enabled, buildStreamUrl, onMessage, onError, maxAttempts, reconnectDelayMs, isDebug, handleMessage]);

  return {
    // Event data
    events,
    latestEvent: events[0] || null,
    eventCount: events.length,

    // Connection state
    isConnected,
    error,
    lastEventTime,
    connectionCount,

    // Computed values
    hasEvents: events.length > 0,
    hasRecentActivity: lastEventTime &&
      (Date.now() - new Date(lastEventTime).getTime()) < 60000, // Active within last minute
    reconnectAttempt: attemptsRef.current,
    maxReconnectAttempts: maxAttempts,

    // Connection health
    isHealthy: isConnected && !error,
    needsReconnection: !isConnected && enabled && attemptsRef.current < maxAttempts
  };
}