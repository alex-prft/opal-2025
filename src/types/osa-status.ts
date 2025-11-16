/**
 * OSA Recent Status API Types
 *
 * Types for the /api/admin/osa/recent-status endpoint
 */

export type OsaRecentStatus = {
  /** Latest timestamp where a webhook from OPAL was processed successfully */
  lastWebhookAt: string | null;

  /** Latest timestamp where agent data was fully accepted and stored */
  lastAgentDataAt: string | null;

  /** The last time a Force Sync (OSA workflow trigger) was started */
  lastForceSyncAt: string | null;

  /** Current workflow status */
  lastWorkflowStatus: 'idle' | 'running' | 'completed' | 'failed';
};

/**
 * Utility function to fetch OSA recent status
 *
 * @returns Promise resolving to OSA recent status data
 */
export async function fetchOsaRecentStatus(): Promise<OsaRecentStatus> {
  const response = await fetch('/api/admin/osa/recent-status');

  if (!response.ok) {
    throw new Error(`Failed to fetch OSA status: ${response.status}`);
  }

  return response.json();
}