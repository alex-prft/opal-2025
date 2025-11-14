/**
 * OPAL Workflow Execution Tracker
 * Comprehensive monitoring and logging for OPAL workflow status and callbacks
 */

export interface OpalWorkflowExecution {
  correlation_id: string;
  span_id: string;
  workflow_id?: string;
  workflow_name: string;
  client_name: string;
  status: 'initiated' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  updated_at: string;
  completed_at?: string;
  duration_ms?: number;
  webhook_url: string;
  response_data?: any;
  error_details?: string;
  callback_received: boolean;
  callback_timestamp?: string;
}

export interface OpalCallbackEvent {
  correlation_id: string;
  workflow_id: string;
  agent_id: string;
  execution_status: string;
  callback_data: any;
  received_at: string;
  signature_valid: boolean;
}

class OpalWorkflowTracker {
  private static instance: OpalWorkflowTracker;
  private executions = new Map<string, OpalWorkflowExecution>();
  private callbacks = new Map<string, OpalCallbackEvent[]>();

  static getInstance(): OpalWorkflowTracker {
    if (!OpalWorkflowTracker.instance) {
      OpalWorkflowTracker.instance = new OpalWorkflowTracker();
    }
    return OpalWorkflowTracker.instance;
  }

  /**
   * Track new OPAL workflow execution
   */
  trackWorkflowInitiated(execution: Omit<OpalWorkflowExecution, 'status' | 'started_at' | 'updated_at' | 'callback_received'>): void {
    const now = new Date().toISOString();

    const workflowExecution: OpalWorkflowExecution = {
      ...execution,
      status: 'initiated',
      started_at: now,
      updated_at: now,
      callback_received: false
    };

    this.executions.set(execution.correlation_id, workflowExecution);

    console.log(`📊 [OPAL Tracker] Workflow initiated`, {
      correlation_id: execution.correlation_id,
      span_id: execution.span_id,
      workflow_name: execution.workflow_name,
      client_name: execution.client_name,
      webhook_url: execution.webhook_url
    });
  }

  /**
   * Update workflow status
   */
  updateWorkflowStatus(
    correlation_id: string,
    status: OpalWorkflowExecution['status'],
    data?: Partial<OpalWorkflowExecution>
  ): void {
    const execution = this.executions.get(correlation_id);
    if (!execution) {
      console.warn(`⚠️ [OPAL Tracker] Workflow not found: ${correlation_id}`);
      return;
    }

    const now = new Date().toISOString();
    const updated = {
      ...execution,
      status,
      updated_at: now,
      ...(status === 'completed' || status === 'failed' ? { completed_at: now } : {}),
      ...data
    };

    if (updated.completed_at && updated.started_at) {
      updated.duration_ms = new Date(updated.completed_at).getTime() - new Date(updated.started_at).getTime();
    }

    this.executions.set(correlation_id, updated);

    console.log(`📊 [OPAL Tracker] Workflow status updated`, {
      correlation_id,
      status,
      workflow_id: updated.workflow_id,
      duration_ms: updated.duration_ms,
      callback_received: updated.callback_received
    });
  }

  /**
   * Record OPAL callback received
   */
  recordCallback(callback: OpalCallbackEvent): void {
    const correlationId = callback.correlation_id;

    // Store callback
    const existingCallbacks = this.callbacks.get(correlationId) || [];
    existingCallbacks.push(callback);
    this.callbacks.set(correlationId, existingCallbacks);

    // Update execution record
    const execution = this.executions.get(correlationId);
    if (execution) {
      execution.callback_received = true;
      execution.callback_timestamp = callback.received_at;
      execution.updated_at = callback.received_at;

      // Update workflow status based on callback
      if (callback.execution_status === 'completed') {
        execution.status = 'completed';
        execution.completed_at = callback.received_at;
      } else if (callback.execution_status === 'failed') {
        execution.status = 'failed';
        execution.completed_at = callback.received_at;
      } else {
        execution.status = 'in_progress';
      }

      this.executions.set(correlationId, execution);
    }

    console.log(`📞 [OPAL Tracker] Callback received`, {
      correlation_id: correlationId,
      workflow_id: callback.workflow_id,
      agent_id: callback.agent_id,
      execution_status: callback.execution_status,
      signature_valid: callback.signature_valid,
      callback_count: existingCallbacks.length
    });
  }

  /**
   * Get workflow execution details
   */
  getWorkflowExecution(correlation_id: string): OpalWorkflowExecution | undefined {
    return this.executions.get(correlation_id);
  }

  /**
   * Get callbacks for workflow
   */
  getWorkflowCallbacks(correlation_id: string): OpalCallbackEvent[] {
    return this.callbacks.get(correlation_id) || [];
  }

  /**
   * Get all active workflows
   */
  getActiveWorkflows(): OpalWorkflowExecution[] {
    return Array.from(this.executions.values()).filter(
      execution => execution.status === 'initiated' || execution.status === 'in_progress'
    );
  }

  /**
   * Get all workflows (active and completed)
   */
  getAllWorkflows(): OpalWorkflowExecution[] {
    return Array.from(this.executions.values());
  }

  /**
   * Get workflow statistics
   */
  getWorkflowStats(hours: number = 24): {
    total_workflows: number;
    successful_workflows: number;
    failed_workflows: number;
    active_workflows: number;
    callback_success_rate: number;
    average_duration_ms: number;
  } {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const recentExecutions = Array.from(this.executions.values()).filter(
      execution => execution.started_at >= cutoff
    );

    const completed = recentExecutions.filter(e => e.status === 'completed');
    const failed = recentExecutions.filter(e => e.status === 'failed');
    const active = recentExecutions.filter(e => e.status === 'initiated' || e.status === 'in_progress');
    const withCallbacks = recentExecutions.filter(e => e.callback_received);

    const avgDuration = completed.length > 0
      ? completed.reduce((sum, e) => sum + (e.duration_ms || 0), 0) / completed.length
      : 0;

    return {
      total_workflows: recentExecutions.length,
      successful_workflows: completed.length,
      failed_workflows: failed.length,
      active_workflows: active.length,
      callback_success_rate: recentExecutions.length > 0 ? withCallbacks.length / recentExecutions.length : 0,
      average_duration_ms: avgDuration
    };
  }

  /**
   * Generate monitoring report
   */
  generateMonitoringReport(): {
    summary: ReturnType<typeof this.getWorkflowStats>;
    active_workflows: OpalWorkflowExecution[];
    recent_completions: OpalWorkflowExecution[];
    failed_workflows: OpalWorkflowExecution[];
  } {
    const stats = this.getWorkflowStats();
    const activeWorkflows = this.getActiveWorkflows();

    const allExecutions = Array.from(this.executions.values());
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const recentCompletions = allExecutions
      .filter(e => e.status === 'completed' && e.completed_at && e.completed_at >= cutoff)
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
      .slice(0, 10);

    const failedWorkflows = allExecutions
      .filter(e => e.status === 'failed' && e.completed_at && e.completed_at >= cutoff)
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
      .slice(0, 10);

    return {
      summary: stats,
      active_workflows: activeWorkflows,
      recent_completions: recentCompletions,
      failed_workflows: failedWorkflows
    };
  }

  /**
   * Clear old executions (cleanup)
   */
  cleanup(olderThanHours: number = 72): void {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString();
    let removedCount = 0;

    for (const [correlationId, execution] of this.executions.entries()) {
      if (execution.started_at < cutoff &&
          (execution.status === 'completed' || execution.status === 'failed')) {
        this.executions.delete(correlationId);
        this.callbacks.delete(correlationId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 [OPAL Tracker] Cleaned up ${removedCount} old workflow executions`);
    }
  }
}

export const opalWorkflowTracker = OpalWorkflowTracker.getInstance();