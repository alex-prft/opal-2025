/**
 * Real-time Webhook Stream Hook
 * Uses Server-Sent Events (SSE) to provide live webhook event updates
 * Replaces polling-based data fetching with real-time event streaming
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface WebhookEvent {
  id: string;
  event_type: string;
  workflow_id: string;
  workflow_name?: string;
  agent_id?: string;
  agent_name?: string;
  success?: boolean;
  error_message?: string;
  received_at?: string;
  processing_time_ms?: number;
}

export interface StreamMessage {
  type: 'connection' | 'webhook_event' | 'heartbeat' | 'error';
  message?: string;
  event?: WebhookEvent;
  timestamp: string;
}

interface UseWebhookStreamOptions {
  /** Whether to start streaming immediately */
  enabled?: boolean;
  /** Session ID to filter events (optional) */
  sessionId?: string;
  /** Workflow ID to filter events (optional) */
  workflowId?: string;
  /** Maximum number of events to keep in memory */
  maxEvents?: number;
  /** Callback when new event is received */
  onEvent?: (event: WebhookEvent) => void;
  /** Callback when stream connects */
  onConnect?: () => void;
  /** Callback when stream disconnects */
  onDisconnect?: () => void;
  /** Callback on stream error */
  onError?: (error: string) => void;
}

export function useWebhookStream(options: UseWebhookStreamOptions = {}) {
  const {
    enabled = true,
    sessionId,
    workflowId,
    maxEvents = 50,
    onEvent,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEventTime, setLastEventTime] = useState<string | null>(null);
  const [connectionCount, setConnectionCount] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Build SSE URL with parameters
  const buildStreamUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (sessionId) params.append('session_id', sessionId);
    if (workflowId) params.append('workflow_id', workflowId);

    const queryString = params.toString();
    return `/api/webhook-events/stream${queryString ? `?${queryString}` : ''}`;
  }, [sessionId, workflowId]);

  // Handle incoming SSE messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data: StreamMessage = JSON.parse(event.data);

      console.log(`📡 [WebhookStream] Received ${data.type}:`, data);

      switch (data.type) {
        case 'connection':
          setIsConnected(true);
          setError(null);
          reconnectAttempts.current = 0;
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
          console.error('📡 [WebhookStream] Stream error:', errorMsg);
          setError(errorMsg);
          onError?.(errorMsg);
          break;

        default:
          console.warn('📡 [WebhookStream] Unknown message type:', data.type);
      }
    } catch (err) {
      console.error('📡 [WebhookStream] Failed to parse message:', event.data, err);
      setError('Failed to parse stream message');
    }
  }, [maxEvents, onEvent, onConnect, onError]);

  // Handle connection errors
  const handleError = useCallback((event: Event) => {
    console.error('📡 [WebhookStream] Connection error:', event);
    setIsConnected(false);

    const errorMsg = 'Stream connection error';
    setError(errorMsg);
    onError?.(errorMsg);
  }, [onError]);

  // Handle connection close
  const handleClose = useCallback(() => {
    console.log('📡 [WebhookStream] Connection closed');
    setIsConnected(false);
    onDisconnect?.();

    // Attempt to reconnect if enabled and within retry limits
    if (enabled && reconnectAttempts.current < maxReconnectAttempts) {
      reconnectAttempts.current++;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // Exponential backoff, max 30s

      console.log(`📡 [WebhookStream] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);

      reconnectTimeoutRef.current = setTimeout(() => {
        if (enabled) {
          connect();
        }
      }, delay);
    } else {
      setError(
        reconnectAttempts.current >= maxReconnectAttempts
          ? 'Max reconnection attempts reached'
          : 'Stream connection closed'
      );
    }
  }, [enabled, onDisconnect]);

  // Establish SSE connection
  const connect = useCallback(() => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      const streamUrl = buildStreamUrl();
      console.log(`📡 [WebhookStream] Connecting to: ${streamUrl}`);

      const eventSource = new EventSource(streamUrl);
      eventSourceRef.current = eventSource;

      // Set up event listeners
      eventSource.addEventListener('message', handleMessage);
      eventSource.addEventListener('error', handleError);

      // Handle connection state changes
      eventSource.addEventListener('open', () => {
        console.log('📡 [WebhookStream] Connection opened');
      });

      // Handle connection close (using readyState monitoring)
      const checkConnectionState = () => {
        if (eventSource.readyState === EventSource.CLOSED) {
          handleClose();
        } else if (eventSource.readyState === EventSource.CONNECTING) {
          console.log('📡 [WebhookStream] Reconnecting...');
        }
      };

      // Check connection state periodically
      const stateCheckInterval = setInterval(checkConnectionState, 5000);

      // Clean up interval when connection closes
      eventSource.addEventListener('error', () => {
        clearInterval(stateCheckInterval);
      });

    } catch (err) {
      console.error('📡 [WebhookStream] Failed to create EventSource:', err);
      setError(`Failed to create stream: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [buildStreamUrl, handleMessage, handleError, handleClose]);

  // Disconnect from stream
  const disconnect = useCallback(() => {
    console.log('📡 [WebhookStream] Disconnecting');

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
    reconnectAttempts.current = 0;
  }, []);

  // Reset stream (disconnect and reconnect)
  const resetStream = useCallback(() => {
    console.log('📡 [WebhookStream] Resetting stream');
    disconnect();
    setEvents([]);
    setError(null);

    if (enabled) {
      // Small delay before reconnecting
      setTimeout(() => {
        connect();
      }, 1000);
    }
  }, [enabled, disconnect, connect]);

  // Effect to manage connection based on enabled state
  useEffect(() => {
    if (!enabled || (!sessionId && !workflowId)) {
      disconnect();
      return;
    }

    console.log(`📡 [WebhookStream] Starting stream (sessionId=${sessionId}, workflowId=${workflowId})`);
    connect();

    return () => {
      disconnect();
    };
  }, [enabled, sessionId, workflowId]); // Dependencies trigger reconnection

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

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

    // Connection controls
    connect,
    disconnect,
    resetStream,

    // Computed values
    hasEvents: events.length > 0,
    hasRecentActivity: lastEventTime &&
      (Date.now() - new Date(lastEventTime).getTime()) < 60000, // Active within last minute
    reconnectAttempt: reconnectAttempts.current,
    maxReconnectAttempts,

    // Connection health
    isHealthy: isConnected && !error,
    needsReconnection: !isConnected && enabled && reconnectAttempts.current < maxReconnectAttempts
  };
}