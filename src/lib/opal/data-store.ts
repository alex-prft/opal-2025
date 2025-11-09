import { OSAWorkflowInput } from '@/lib/types/maturity';

// Opal Agent Data Structures
export interface OpalAgentResult {
  agent_id: string;
  agent_name: string;
  output: any;
  success: boolean;
  error?: string;
  execution_time_ms: number;
  timestamp: string;
}

export interface OpalWorkflowResult {
  workflow_id: string;
  workflow_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  input_data: OSAWorkflowInput;
  results: {
    [key: string]: OpalAgentResult;
  };
  metadata?: {
    client_id?: string;
    project_id?: string;
    user_id?: string;
    session_id?: string;
  };
}


// In-memory data store for Opal workflow results
class OpalDataStore {
  private workflows: Map<string, OpalWorkflowResult> = new Map();
  private dailyTriggerCount: number = 0;
  private lastTriggerDate: string = '';
  private pendingWorkflows: Map<string, { sessionId: string; timestamp: number }> = new Map();

  // Daily rate limiting
  canTriggerWorkflow(): boolean {
    const today = new Date().toDateString();
    if (this.lastTriggerDate !== today) {
      this.dailyTriggerCount = 0;
      this.lastTriggerDate = today;
    }
    return this.dailyTriggerCount < 5; // 5 requests per day limit
  }

  incrementTriggerCount(): void {
    const today = new Date().toDateString();
    if (this.lastTriggerDate !== today) {
      this.dailyTriggerCount = 0;
      this.lastTriggerDate = today;
    }
    this.dailyTriggerCount++;
  }

  forceResetDailyLimit(): void {
    this.dailyTriggerCount = 0;
    this.lastTriggerDate = '';
  }

  // Workflow management
  createWorkflow(workflowId: string, inputData: OSAWorkflowInput, sessionId?: string): OpalWorkflowResult {
    const workflow: OpalWorkflowResult = {
      workflow_id: workflowId,
      workflow_name: 'get_opal',
      status: 'pending',
      started_at: new Date().toISOString(),
      input_data: inputData,
      results: {},
      metadata: {
        session_id: sessionId,
      }
    };

    this.workflows.set(workflowId, workflow);

    if (sessionId) {
      this.pendingWorkflows.set(workflowId, { sessionId, timestamp: Date.now() });
    }

    return workflow;
  }

  updateWorkflowStatus(workflowId: string, status: OpalWorkflowResult['status']): void {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      workflow.status = status;
      if (status === 'completed' || status === 'failed') {
        workflow.completed_at = new Date().toISOString();
        this.pendingWorkflows.delete(workflowId);
      }
    }
  }

  addAgentResult(workflowId: string, agentId: string, result: OpalAgentResult): void {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      workflow.results[agentId] = result;
    }
  }

  getWorkflow(workflowId: string): OpalWorkflowResult | undefined {
    return this.workflows.get(workflowId);
  }

  getWorkflowBySessionId(sessionId: string): OpalWorkflowResult | undefined {
    for (const [workflowId, workflowInfo] of this.pendingWorkflows.entries()) {
      if (workflowInfo.sessionId === sessionId) {
        return this.workflows.get(workflowId);
      }
    }
    return undefined;
  }

  getAllWorkflows(): OpalWorkflowResult[] {
    return Array.from(this.workflows.values());
  }

  getLatestWorkflow(): OpalWorkflowResult | undefined {
    const workflows = this.getAllWorkflows();
    if (workflows.length === 0) return undefined;

    return workflows.reduce((latest, current) => {
      const latestTime = new Date(latest.started_at).getTime();
      const currentTime = new Date(current.started_at).getTime();
      return currentTime > latestTime ? current : latest;
    });
  }

  // Helper method to get generic agent result
  getAgentResult(workflowId: string, agentId: string): OpalAgentResult | undefined {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow?.results[agentId]?.success) return undefined;
    return workflow.results[agentId];
  }

  // Helper method to get all results for a workflow
  getAllResults(workflowId: string): { [key: string]: OpalAgentResult } {
    const workflow = this.getWorkflow(workflowId);
    return workflow?.results || {};
  }


  // Clean up old workflows (optional)
  cleanupOldWorkflows(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    for (const [workflowId, workflow] of this.workflows.entries()) {
      const workflowAge = now - new Date(workflow.started_at).getTime();
      if (workflowAge > maxAge) {
        this.workflows.delete(workflowId);
        this.pendingWorkflows.delete(workflowId);
      }
    }
  }
}

// Export singleton instance
export const opalDataStore = new OpalDataStore();