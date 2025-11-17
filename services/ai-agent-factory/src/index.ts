/**
 * AI Agent Factory Service Entry Point
 *
 * 6-phase workflow system for creating specialized Claude API agents
 */

export * from './types';
export * from './orchestrator/factory-workflow-engine';
export * from './phases';
export * from './subagents';
export * from './integration';
export * from './utils';

// Re-export key classes for easy access
export { FactoryWorkflowEngine } from './orchestrator/factory-workflow-engine';
export { ClaudeFactoryClient } from './integration/claude-factory-client';

// Service configuration
export const AI_AGENT_FACTORY_VERSION = '0.1.0';
export const AI_AGENT_FACTORY_NAME = '@osa/ai-agent-factory';

// Service health check
export function getServiceHealth() {
  return {
    name: AI_AGENT_FACTORY_NAME,
    version: AI_AGENT_FACTORY_VERSION,
    status: 'operational',
    timestamp: new Date().toISOString(),
    features: {
      clarificationAgent: true,
      plannerSubagent: true,
      parallelDevelopment: true,
      validationSubagent: true,
      deliveryAgent: true,
      interactiveMode: true,
      enterpriseCompliance: true
    }
  };
}