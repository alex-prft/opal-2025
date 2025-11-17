/**
 * Event Triggers for Results Content Optimizer
 *
 * Defines event-based triggers that automatically run the results-content-optimizer
 * workflow when relevant data changes occur in OPAL agents or DXP tools.
 */

import { OpalAgentId, DXPToolId, OPAL_AGENTS, DXP_TOOLS } from '../clients/OpalClient';
import { getAllPageIds, getPageMapping } from '../mapping/page-agent-mappings';

// =============================================================================
// Trigger Configuration Types
// =============================================================================

export interface TriggerEvent {
  eventType: 'agent_completion' | 'tool_data_update' | 'manual_trigger' | 'schedule';
  sourceId: string; // Agent ID, Tool ID, or trigger source
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface TriggerRule {
  id: string;
  name: string;
  eventTypes: TriggerEvent['eventType'][];
  sourceIds: string[];
  conditions: TriggerCondition[];
  actions: TriggerAction[];
  enabled: boolean;
  cooldown?: number; // Minimum time between triggers in milliseconds
}

export interface TriggerCondition {
  type: 'confidence_threshold' | 'data_freshness' | 'system_health' | 'custom';
  parameters: Record<string, any>;
}

export interface TriggerAction {
  type: 'run_workflow' | 'notify' | 'log' | 'custom';
  parameters: Record<string, any>;
}

// =============================================================================
// Core Trigger Rules
// =============================================================================

export const RESULTS_CONTENT_TRIGGER_RULES: TriggerRule[] = [
  // Strategy Workflow Completion Trigger
  {
    id: 'strategy-workflow-completion',
    name: 'Strategy Workflow Completion Trigger',
    eventTypes: ['agent_completion'],
    sourceIds: [OPAL_AGENTS.STRATEGY_WORKFLOW],
    conditions: [
      {
        type: 'confidence_threshold',
        parameters: { minimum_confidence: 60 }
      },
      {
        type: 'system_health',
        parameters: { check_opal_health: true }
      }
    ],
    actions: [
      {
        type: 'run_workflow',
        parameters: {
          workflow_id: 'results-content-optimizer',
          execution_mode: 'apply',
          target_sections: ['strategy-plans'],
          confidence_threshold: 70
        }
      },
      {
        type: 'log',
        parameters: {
          level: 'info',
          message: 'Triggered results content optimization due to strategy workflow completion'
        }
      }
    ],
    enabled: true,
    cooldown: 300000 // 5 minutes
  },

  // Content Review Completion Trigger
  {
    id: 'content-review-completion',
    name: 'Content Review Completion Trigger',
    eventTypes: ['agent_completion'],
    sourceIds: [OPAL_AGENTS.CONTENT_REVIEW],
    conditions: [
      {
        type: 'confidence_threshold',
        parameters: { minimum_confidence: 65 }
      }
    ],
    actions: [
      {
        type: 'run_workflow',
        parameters: {
          workflow_id: 'results-content-optimizer',
          execution_mode: 'apply',
          target_sections: ['analytics-insights', 'experience-optimization'],
          confidence_threshold: 70
        }
      }
    ],
    enabled: true,
    cooldown: 600000 // 10 minutes
  },

  // Audience Data Update Trigger
  {
    id: 'audience-data-update',
    name: 'Audience Data Update Trigger',
    eventTypes: ['agent_completion'],
    sourceIds: [OPAL_AGENTS.AUDIENCE_SUGGESTER, OPAL_AGENTS.CUSTOMER_JOURNEY],
    conditions: [
      {
        type: 'data_freshness',
        parameters: { max_age_hours: 24 }
      }
    ],
    actions: [
      {
        type: 'run_workflow',
        parameters: {
          workflow_id: 'results-content-optimizer',
          execution_mode: 'apply',
          target_pages: [
            'analytics-insights/audiences/overview',
            'experience-optimization/personalization/overview'
          ],
          confidence_threshold: 65
        }
      }
    ],
    enabled: true,
    cooldown: 1800000 // 30 minutes
  },

  // Experimentation Results Trigger
  {
    id: 'experimentation-results-update',
    name: 'Experimentation Results Update Trigger',
    eventTypes: ['agent_completion'],
    sourceIds: [OPAL_AGENTS.EXPERIMENT_BLUEPRINTER],
    conditions: [
      {
        type: 'confidence_threshold',
        parameters: { minimum_confidence: 70 }
      }
    ],
    actions: [
      {
        type: 'run_workflow',
        parameters: {
          workflow_id: 'results-content-optimizer',
          execution_mode: 'apply',
          target_pages: [
            'analytics-insights/experimentation/overview',
            'experience-optimization/experimentation/overview'
          ],
          confidence_threshold: 75
        }
      }
    ],
    enabled: true,
    cooldown: 900000 // 15 minutes
  },

  // DXP Tools Data Update Trigger
  {
    id: 'dxp-tools-data-update',
    name: 'DXP Tools Data Update Trigger',
    eventTypes: ['tool_data_update'],
    sourceIds: [DXP_TOOLS.CONTENT_RECS, DXP_TOOLS.ODP, DXP_TOOLS.WEBX],
    conditions: [
      {
        type: 'data_freshness',
        parameters: { max_age_hours: 12 }
      },
      {
        type: 'system_health',
        parameters: { check_integration_health: true }
      }
    ],
    actions: [
      {
        type: 'run_workflow',
        parameters: {
          workflow_id: 'results-content-optimizer',
          execution_mode: 'apply',
          target_sections: ['optimizely-dxp-tools'],
          confidence_threshold: 65
        }
      }
    ],
    enabled: true,
    cooldown: 1800000 // 30 minutes
  },

  // CMP Marketing Calendar Update
  {
    id: 'cmp-calendar-update',
    name: 'CMP Marketing Calendar Update Trigger',
    eventTypes: ['tool_data_update', 'agent_completion'],
    sourceIds: [DXP_TOOLS.CMP, OPAL_AGENTS.CMP_ORGANIZER],
    conditions: [
      {
        type: 'custom',
        parameters: {
          check_calendar_changes: true,
          significant_changes_only: true
        }
      }
    ],
    actions: [
      {
        type: 'run_workflow',
        parameters: {
          workflow_id: 'results-content-optimizer',
          execution_mode: 'apply',
          target_pages: [
            'strategy-plans/osa/overview-dashboard',
            'optimizely-dxp-tools/cmp/overview'
          ],
          confidence_threshold: 70
        }
      }
    ],
    enabled: true,
    cooldown: 3600000 // 1 hour
  },

  // Integration Health Change Trigger
  {
    id: 'integration-health-change',
    name: 'Integration Health Change Trigger',
    eventTypes: ['agent_completion'],
    sourceIds: [OPAL_AGENTS.INTEGRATION_HEALTH],
    conditions: [
      {
        type: 'custom',
        parameters: {
          health_status_change: true,
          include_warnings: true
        }
      }
    ],
    actions: [
      {
        type: 'run_workflow',
        parameters: {
          workflow_id: 'results-content-optimizer',
          execution_mode: 'apply',
          target_sections: ['optimizely-dxp-tools'],
          confidence_threshold: 60
        }
      },
      {
        type: 'notify',
        parameters: {
          recipients: ['alex.harris@perficient.com'],
          template: 'integration_health_update',
          severity: 'info'
        }
      }
    ],
    enabled: true,
    cooldown: 1800000 // 30 minutes
  }
];

// =============================================================================
// Trigger Manager Class
// =============================================================================

export class ResultsContentTriggerManager {
  private activeTriggers: Map<string, TriggerRule>;
  private lastTriggerTimes: Map<string, number>;
  private eventQueue: TriggerEvent[];

  constructor() {
    this.activeTriggers = new Map();
    this.lastTriggerTimes = new Map();
    this.eventQueue = [];

    // Initialize with default trigger rules
    RESULTS_CONTENT_TRIGGER_RULES.forEach(rule => {
      if (rule.enabled) {
        this.activeTriggers.set(rule.id, rule);
      }
    });
  }

  /**
   * Process incoming trigger event
   */
  async processEvent(event: TriggerEvent): Promise<void> {
    console.log(`[TriggerManager] Processing event: ${event.eventType} from ${event.sourceId}`);

    // Add to event queue for processing
    this.eventQueue.push(event);

    // Find matching trigger rules
    const matchingRules = this.findMatchingRules(event);

    for (const rule of matchingRules) {
      await this.evaluateAndExecuteRule(rule, event);
    }
  }

  /**
   * Find trigger rules that match the incoming event
   */
  private findMatchingRules(event: TriggerEvent): TriggerRule[] {
    const matchingRules: TriggerRule[] = [];

    for (const rule of this.activeTriggers.values()) {
      // Check event type match
      if (!rule.eventTypes.includes(event.eventType)) {
        continue;
      }

      // Check source ID match
      if (!rule.sourceIds.includes(event.sourceId)) {
        continue;
      }

      // Check cooldown period
      if (this.isInCooldown(rule)) {
        console.log(`[TriggerManager] Rule ${rule.id} is in cooldown period`);
        continue;
      }

      matchingRules.push(rule);
    }

    return matchingRules;
  }

  /**
   * Evaluate conditions and execute rule actions
   */
  private async evaluateAndExecuteRule(rule: TriggerRule, event: TriggerEvent): Promise<void> {
    console.log(`[TriggerManager] Evaluating rule: ${rule.name}`);

    // Evaluate all conditions
    const conditionResults = await Promise.all(
      rule.conditions.map(condition => this.evaluateCondition(condition, event))
    );

    // Check if all conditions are met
    const allConditionsMet = conditionResults.every(result => result === true);

    if (!allConditionsMet) {
      console.log(`[TriggerManager] Conditions not met for rule: ${rule.name}`);
      return;
    }

    console.log(`[TriggerManager] Executing actions for rule: ${rule.name}`);

    // Execute all actions
    const actionPromises = rule.actions.map(action => this.executeAction(action, event));
    await Promise.allSettled(actionPromises);

    // Update last trigger time
    this.lastTriggerTimes.set(rule.id, Date.now());
  }

  /**
   * Evaluate a single trigger condition
   */
  private async evaluateCondition(condition: TriggerCondition, event: TriggerEvent): Promise<boolean> {
    switch (condition.type) {
      case 'confidence_threshold':
        return this.evaluateConfidenceThreshold(condition, event);

      case 'data_freshness':
        return this.evaluateDataFreshness(condition, event);

      case 'system_health':
        return await this.evaluateSystemHealth(condition);

      case 'custom':
        return await this.evaluateCustomCondition(condition, event);

      default:
        console.warn(`[TriggerManager] Unknown condition type: ${condition.type}`);
        return false;
    }
  }

  /**
   * Execute a trigger action
   */
  private async executeAction(action: TriggerAction, event: TriggerEvent): Promise<void> {
    try {
      switch (action.type) {
        case 'run_workflow':
          await this.executeWorkflowAction(action, event);
          break;

        case 'notify':
          await this.executeNotifyAction(action, event);
          break;

        case 'log':
          this.executeLogAction(action, event);
          break;

        case 'custom':
          await this.executeCustomAction(action, event);
          break;

        default:
          console.warn(`[TriggerManager] Unknown action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`[TriggerManager] Error executing action ${action.type}:`, error);
    }
  }

  /**
   * Execute workflow action
   */
  private async executeWorkflowAction(action: TriggerAction, event: TriggerEvent): Promise<void> {
    const workflowParams = action.parameters;

    console.log(`[TriggerManager] Triggering workflow: ${workflowParams.workflow_id}`);

    // Make API call to trigger workflow
    const response = await fetch('/api/admin/results/trigger-optimization', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Trigger-Source': 'event-trigger',
        'X-Source-Event': event.eventType,
        'X-Source-ID': event.sourceId
      },
      body: JSON.stringify({
        workflow_id: workflowParams.workflow_id,
        execution_parameters: {
          execution_mode: workflowParams.execution_mode || 'apply',
          target_sections: workflowParams.target_sections,
          target_pages: workflowParams.target_pages,
          confidence_threshold: workflowParams.confidence_threshold || 70
        },
        trigger_metadata: {
          triggered_by: 'event-trigger',
          source_event: event,
          timestamp: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Workflow trigger failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`[TriggerManager] Workflow triggered successfully:`, result);
  }

  /**
   * Execute notification action
   */
  private async executeNotifyAction(action: TriggerAction, event: TriggerEvent): Promise<void> {
    const notifyParams = action.parameters;

    console.log(`[TriggerManager] Sending notification:`, notifyParams);

    // Implementation would send notification via configured channels
    // This is a placeholder for the actual notification implementation
  }

  /**
   * Execute log action
   */
  private executeLogAction(action: TriggerAction, event: TriggerEvent): void {
    const logParams = action.parameters;
    const level = logParams.level || 'info';
    const message = logParams.message || 'Trigger action executed';

    console.log(`[TriggerManager][${level.toUpperCase()}] ${message}`, {
      event,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Execute custom action
   */
  private async executeCustomAction(action: TriggerAction, event: TriggerEvent): Promise<void> {
    console.log(`[TriggerManager] Executing custom action with parameters:`, action.parameters);
    // Implementation for custom actions would go here
  }

  /**
   * Evaluate confidence threshold condition
   */
  private evaluateConfidenceThreshold(condition: TriggerCondition, event: TriggerEvent): boolean {
    const minConfidence = condition.parameters.minimum_confidence || 0;
    const eventConfidence = event.metadata?.confidence || 0;

    return eventConfidence >= minConfidence;
  }

  /**
   * Evaluate data freshness condition
   */
  private evaluateDataFreshness(condition: TriggerCondition, event: TriggerEvent): boolean {
    const maxAgeHours = condition.parameters.max_age_hours || 24;
    const eventTimestamp = new Date(event.timestamp).getTime();
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds

    return (Date.now() - eventTimestamp) <= maxAge;
  }

  /**
   * Evaluate system health condition
   */
  private async evaluateSystemHealth(condition: TriggerCondition): Promise<boolean> {
    try {
      if (condition.parameters.check_opal_health) {
        const response = await fetch('/api/opal/health');
        if (!response.ok) return false;
      }

      if (condition.parameters.check_integration_health) {
        const response = await fetch('/api/admin/guardrails-health');
        if (!response.ok) return false;
      }

      return true;
    } catch (error) {
      console.error('[TriggerManager] System health check failed:', error);
      return false;
    }
  }

  /**
   * Evaluate custom condition
   */
  private async evaluateCustomCondition(condition: TriggerCondition, event: TriggerEvent): Promise<boolean> {
    // Implementation for custom conditions would go here
    console.log(`[TriggerManager] Evaluating custom condition:`, condition.parameters);
    return true; // Placeholder
  }

  /**
   * Check if rule is in cooldown period
   */
  private isInCooldown(rule: TriggerRule): boolean {
    if (!rule.cooldown) return false;

    const lastTriggerTime = this.lastTriggerTimes.get(rule.id);
    if (!lastTriggerTime) return false;

    return (Date.now() - lastTriggerTime) < rule.cooldown;
  }

  /**
   * Get trigger statistics
   */
  public getStats() {
    return {
      activeTriggers: this.activeTriggers.size,
      eventQueueSize: this.eventQueue.length,
      recentTriggers: Array.from(this.lastTriggerTimes.entries())
        .map(([ruleId, timestamp]) => ({
          ruleId,
          lastTriggered: new Date(timestamp).toISOString()
        }))
        .sort((a, b) => new Date(b.lastTriggered).getTime() - new Date(a.lastTriggered).getTime())
        .slice(0, 10)
    };
  }
}

// =============================================================================
// Singleton Instance and Exports
// =============================================================================

export const triggerManager = new ResultsContentTriggerManager();

// Export helper functions
export function processEvent(event: TriggerEvent): Promise<void> {
  return triggerManager.processEvent(event);
}

export function getTriggerStats() {
  return triggerManager.getStats();
}

export { RESULTS_CONTENT_TRIGGER_RULES };