// Export all agent monitoring components
export { ValidatePayloadPanel } from './ValidatePayloadPanel';
export { ReplayWorkflowPanel } from './ReplayWorkflowPanel';
export { AgentDataSummaryPanel } from './AgentDataSummaryPanel';

// Combined component props type for easy integration
export interface AgentMonitoringPanelsProps {
  agentId: string;
  lastWorkflowId?: string;
  className?: string;
}