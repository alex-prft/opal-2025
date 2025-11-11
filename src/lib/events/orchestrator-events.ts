/**
 * Orchestrator Events - Workflow and Process Event Handlers
 *
 * Provides event types and utilities for orchestrating workflows,
 * Force Sync operations, and OPAL webhook integrations.
 *
 * Uses the existing OSA Event Bus for reliable event publishing and subscription.
 */

import { publishEvent } from './event-bus';
import { generateEventId, generateCorrelationId, createEventMetadata } from './schemas';

// Orchestrator Event Types
export interface WorkflowStartedEvent {
  event_type: 'orchestration.workflow_started@1';
  event_id: string;
  correlation_id: string;
  timestamp: string;
  version: 1;
  span_id: string;
  workflow_name: string;
  workflow_type: 'opal_external_webhook' | 'internal_workflow' | 'force_sync_dual';
  client_name: string;
  triggered_by: string;
  metadata: {
    service: string;
    user_id?: string;
    component: string;
    trace_id?: string;
    [key: string]: any;
  };
}

export interface WorkflowCompletedEvent {
  event_type: 'orchestration.workflow_completed@1';
  event_id: string;
  correlation_id: string;
  timestamp: string;
  version: 1;
  span_id: string;
  workflow_name: string;
  workflow_type: 'opal_external_webhook' | 'internal_workflow' | 'force_sync_dual';
  workflow_id?: string;
  session_id?: string;
  client_name: string;
  duration_ms: number;
  success: boolean;
  response_metadata?: {
    [key: string]: any;
  };
  metadata: {
    service: string;
    user_id?: string;
    component: string;
    trace_id?: string;
    [key: string]: any;
  };
}

export interface WorkflowFailedEvent {
  event_type: 'orchestration.workflow_failed@1';
  event_id: string;
  correlation_id: string;
  timestamp: string;
  version: 1;
  span_id: string;
  workflow_name: string;
  workflow_type: 'opal_external_webhook' | 'internal_workflow' | 'force_sync_dual';
  client_name: string;
  duration_ms: number;
  error_message: string;
  error_type: string;
  failed_at_step: string;
  metadata: {
    service: string;
    user_id?: string;
    component: string;
    trace_id?: string;
    [key: string]: any;
  };
}

export interface ForceSyncStartedEvent {
  event_type: 'orchestration.force_sync_started@1';
  event_id: string;
  correlation_id: string;
  timestamp: string;
  version: 1;
  span_id: string;
  sync_scope: string;
  triggered_by: string;
  client_name?: string;
  include_rag_update: boolean;
  expected_duration_ms: number;
  metadata: {
    service: string;
    user_id?: string;
    component: string;
    trace_id?: string;
    [key: string]: any;
  };
}

export interface ForceSyncCompletedEvent {
  event_type: 'orchestration.force_sync_completed@1';
  event_id: string;
  correlation_id: string;
  timestamp: string;
  version: 1;
  span_id: string;
  sync_scope: string;
  triggered_by: string;
  client_name?: string;
  duration_ms: number;
  internal_workflow_success: boolean;
  external_opal_success: boolean;
  platforms_synced: number;
  rag_updated: boolean;
  sync_id: string;
  session_id: string;
  metadata: {
    service: string;
    user_id?: string;
    component: string;
    trace_id?: string;
    [key: string]: any;
  };
}

// Union type of all orchestrator events
export type OrchestratorEvent =
  | WorkflowStartedEvent
  | WorkflowCompletedEvent
  | WorkflowFailedEvent
  | ForceSyncStartedEvent
  | ForceSyncCompletedEvent;

/**
 * Orchestrator Event Bus - Specialized wrapper around the main event bus
 */
export class OrchestratorEventBus {
  private eventBus: any;

  constructor() {
    // Lazy load event bus to avoid circular dependency
    this.eventBus = null;
  }

  private async getEventBus() {
    if (!this.eventBus) {
      const { eventBus } = await import('./event-bus');
      this.eventBus = eventBus;
    }
    return this.eventBus;
  }

  /**
   * Emit a workflow started event
   */
  async emit(
    eventType: 'orchestration.workflow_started@1',
    data: Omit<WorkflowStartedEvent, 'event_type' | 'event_id' | 'version'>
  ): Promise<void>;

  /**
   * Emit a workflow completed event
   */
  async emit(
    eventType: 'orchestration.workflow_completed@1',
    data: Omit<WorkflowCompletedEvent, 'event_type' | 'event_id' | 'version'>
  ): Promise<void>;

  /**
   * Emit a workflow failed event
   */
  async emit(
    eventType: 'orchestration.workflow_failed@1',
    data: Omit<WorkflowFailedEvent, 'event_type' | 'event_id' | 'version'>
  ): Promise<void>;

  /**
   * Emit a force sync started event
   */
  async emit(
    eventType: 'orchestration.force_sync_started@1',
    data: Omit<ForceSyncStartedEvent, 'event_type' | 'event_id' | 'version'>
  ): Promise<void>;

  /**
   * Emit a force sync completed event
   */
  async emit(
    eventType: 'orchestration.force_sync_completed@1',
    data: Omit<ForceSyncCompletedEvent, 'event_type' | 'event_id' | 'version'>
  ): Promise<void>;

  /**
   * Generic emit method implementation
   */
  async emit(eventType: string, data: any): Promise<void> {
    try {
      const event = {
        event_type: eventType,
        event_id: generateEventId(),
        version: 1,
        ...data
      };

      // Ensure required fields
      if (!event.correlation_id) {
        event.correlation_id = generateCorrelationId();
      }
      if (!event.timestamp) {
        event.timestamp = new Date().toISOString();
      }
      if (!event.metadata) {
        event.metadata = createEventMetadata('orchestration', undefined, 'orchestrator-events');
      }

      await publishEvent(event);

      console.log(`📡 [Orchestrator] Emitted event: ${eventType}`, {
        event_id: event.event_id,
        correlation_id: event.correlation_id,
        span_id: event.span_id
      });

    } catch (error) {
      console.error(`❌ [Orchestrator] Failed to emit event: ${eventType}`, error);
      // Re-throw to allow caller to handle appropriately
      throw error;
    }
  }

  /**
   * Subscribe to orchestrator events
   */
  async subscribe(
    eventPattern: string,
    callback: (event: OrchestratorEvent) => void | Promise<void>
  ): Promise<() => void> {
    const eventBus = await this.getEventBus();
    return eventBus.subscribe(eventPattern, callback);
  }

  /**
   * Subscribe to all workflow events
   */
  async subscribeToWorkflowEvents(
    callback: (event: WorkflowStartedEvent | WorkflowCompletedEvent | WorkflowFailedEvent) => void | Promise<void>
  ): Promise<() => void> {
    const eventBus = await this.getEventBus();
    return eventBus.subscribe('orchestration.workflow.*', callback);
  }

  /**
   * Subscribe to all force sync events
   */
  async subscribeToForceSyncEvents(
    callback: (event: ForceSyncStartedEvent | ForceSyncCompletedEvent) => void | Promise<void>
  ): Promise<() => void> {
    const eventBus = await this.getEventBus();
    return eventBus.subscribe('orchestration.force_sync.*', callback);
  }

  /**
   * Subscribe to all orchestrator events
   */
  async subscribeToAllEvents(
    callback: (event: OrchestratorEvent) => void | Promise<void>
  ): Promise<() => void> {
    const eventBus = await this.getEventBus();
    return eventBus.subscribe('orchestration.*', callback);
  }
}

// Global orchestrator event bus instance
export const orchestratorEventBus = new OrchestratorEventBus();

// Convenience functions for common event emissions
export const emitWorkflowStarted = (data: Omit<WorkflowStartedEvent, 'event_type' | 'event_id' | 'version'>) =>
  orchestratorEventBus.emit('orchestration.workflow_started@1', data);

export const emitWorkflowCompleted = (data: Omit<WorkflowCompletedEvent, 'event_type' | 'event_id' | 'version'>) =>
  orchestratorEventBus.emit('orchestration.workflow_completed@1', data);

export const emitWorkflowFailed = (data: Omit<WorkflowFailedEvent, 'event_type' | 'event_id' | 'version'>) =>
  orchestratorEventBus.emit('orchestration.workflow_failed@1', data);

export const emitForceSyncStarted = (data: Omit<ForceSyncStartedEvent, 'event_type' | 'event_id' | 'version'>) =>
  orchestratorEventBus.emit('orchestration.force_sync_started@1', data);

export const emitForceSyncCompleted = (data: Omit<ForceSyncCompletedEvent, 'event_type' | 'event_id' | 'version'>) =>
  orchestratorEventBus.emit('orchestration.force_sync_completed@1', data);

// Export types
export type {
  WorkflowStartedEvent,
  WorkflowCompletedEvent,
  WorkflowFailedEvent,
  ForceSyncStartedEvent,
  ForceSyncCompletedEvent,
  OrchestratorEvent
};