/**
 * Unified Force Sync Service
 * Centralizes all force sync operations with consistent behavior and monitoring
 */

import { triggerOpalWorkflow } from '@/lib/opal/trigger-workflow';
import { EventEmitter } from 'events';
import { createSupabaseAdmin } from '@/lib/database/supabase-client';

export interface ForceSyncOptions {
  sync_scope?: 'quick' | 'full' | 'priority_platforms' | 'all_platforms' | 'odp_only';
  client_context?: {
    client_name?: string;
    industry?: string;
    recipients?: string[];
  };
  triggered_by?: string;
  metadata?: Record<string, any>;
}

export interface ForceSyncResult {
  success: boolean;
  correlation_id: string;
  session_id?: string;
  workflow_id?: string;
  polling_url?: string;
  message: string;
  details?: any;
  error?: string;
  duration_ms: number;
  timestamp: string;
}

export interface SyncStatus {
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'timeout';
  progress: number; // 0-100
  message: string;
  started_at: string;
  updated_at: string;
  details?: any;
}

class SyncSession {
  public readonly id: string;
  public readonly correlationId: string;
  public status: SyncStatus;
  private timeoutId?: NodeJS.Timeout;

  constructor(correlationId: string) {
    this.id = `sync-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    this.correlationId = correlationId;
    this.status = {
      status: 'pending',
      progress: 0,
      message: 'Initializing force sync...',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Set 10-minute timeout
    this.timeoutId = setTimeout(() => {
      this.updateStatus({
        status: 'timeout',
        progress: 0,
        message: 'Force sync timed out after 10 minutes'
      });
    }, 10 * 60 * 1000);
  }

  updateStatus(update: Partial<SyncStatus>) {
    this.status = {
      ...this.status,
      ...update,
      updated_at: new Date().toISOString()
    };

    if (update.status === 'completed' || update.status === 'failed' || update.status === 'timeout') {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
    }
  }

  destroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}

export class ForceSyncService extends EventEmitter {
  private static instance: ForceSyncService;
  private sessions = new Map<string, SyncSession>();
  private lastSyncTimestamp?: string;

  static getInstance(): ForceSyncService {
    if (!ForceSyncService.instance) {
      ForceSyncService.instance = new ForceSyncService();
    }
    return ForceSyncService.instance;
  }

  async triggerSync(options: ForceSyncOptions = {}): Promise<ForceSyncResult> {
    const startTime = Date.now();
    const correlationId = `force-sync-${Date.now()}-${Math.random().toString(36).substring(2)}`;

    // Create sync session
    const session = new SyncSession(correlationId);
    this.sessions.set(session.id, session);

    // Emit sync started event
    this.emit('sync:started', { session_id: session.id, correlation_id: correlationId, options });

    try {
      session.updateStatus({
        status: 'in_progress',
        progress: 10,
        message: 'Triggering OPAL workflow...'
      });

      // Prepare sync request
      const syncRequest = {
        client_name: options.client_context?.client_name || 'OSA Admin Dashboard',
        industry: options.client_context?.industry || 'Technology',
        company_size: 'Medium',
        current_capabilities: ['DXP Integration', 'Data Synchronization'],
        business_objectives: ['Update RAG Model', 'Refresh DXP Insights'],
        additional_marketing_technology: ['All Integrated Platforms'],
        timeline_preference: '6-months',
        budget_range: '50k-100k',
        recipients: options.client_context?.recipients || ['admin@example.com'],
        sync_scope: this.mapSyncScope(options.sync_scope || 'quick'),
        triggered_by: options.triggered_by || 'admin_dashboard',
        force_sync: true,
        metadata: {
          correlation_id: correlationId,
          session_id: session.id,
          dashboard_trigger: true,
          ...options.metadata
        }
      };

      session.updateStatus({
        progress: 30,
        message: 'Connecting to OPAL workflow engine...'
      });

      // Trigger the actual workflow
      const result = await triggerOpalWorkflow(syncRequest);

      session.updateStatus({
        progress: 60,
        message: 'OPAL workflow initiated, monitoring progress...'
      });

      // Simulate progress updates (in real implementation, this would poll actual status)
      setTimeout(() => {
        if (session.status.status === 'in_progress') {
          session.updateStatus({
            progress: 80,
            message: 'Processing workflow data...'
          });
        }
      }, 2000);

      setTimeout(async () => {
        if (session.status.status === 'in_progress') {
          session.updateStatus({
            status: result.success ? 'completed' : 'failed',
            progress: 100,
            message: result.success ? 'Force sync completed successfully' : 'Force sync failed',
            details: result
          });

          if (result.success) {
            this.lastSyncTimestamp = new Date().toISOString();

            // Write Force Sync event to database for recent-status API
            try {
              const supabase = createSupabaseAdmin();
              console.log(`📊 [Force Sync] Attempting database write for correlation: ${correlationId}`);

              const insertData = {
                workflow_id: result.workflow_id || correlationId,
                correlation_id: correlationId,
                triggered_by: 'force_sync',
                trigger_timestamp: this.lastSyncTimestamp,
                status: 'completed',
                session_id: session.id, // Add session_id at top level (required field)
                client_name: options.client_context?.client_name || 'Force Sync Service', // Required field
                metadata: {
                  session_id: session.id,
                  sync_scope: options.sync_scope || 'quick',
                  dashboard_trigger: true,
                  ...options.metadata
                }
              };

              const { data, error } = await supabase
                .from('opal_webhook_events')
                .insert({
                  webhook_id: correlationId,           // Use webhook_id instead of correlation_id
                  workflow_id: correlationId,          // Also store as workflow_id for consistency
                  event_type: 'force_sync_completed',
                  agent_id: 'force_sync_service',
                  status: 'completed',                 // Use status instead of execution_status
                  event_data: {                        // Store all metadata in event_data JSONB
                    triggered_by: 'force_sync',
                    success: true,
                    execution_status: 'success',
                    session_id: session.id,
                    client_name: insertData.client_name,
                    correlation_id: correlationId,
                    timestamp: this.lastSyncTimestamp,
                    ...insertData.metadata
                  }
                })
                .select('id, created_at, workflow_id');

              if (error) {
                console.error('❌ [Force Sync] Database insert error:', error);
                console.error('❌ [Force Sync] Insert data was:', insertData);
              } else {
                console.log(`🚀 [Force Sync] Database event recorded successfully:`, data);
              }
            } catch (dbError) {
              console.error('💥 [Force Sync] Database operation failed:', dbError);
              // Don't fail the entire operation if database write fails
            }

            this.emit('sync:completed', {
              session_id: session.id,
              correlation_id: correlationId,
              result
            });
          } else {
            this.emit('sync:failed', {
              session_id: session.id,
              correlation_id: correlationId,
              error: result.error
            });
          }
        }
      }, 4000);

      const duration = Date.now() - startTime;

      const syncResult: ForceSyncResult = {
        success: result.success,
        correlation_id: correlationId,
        session_id: session.id,
        workflow_id: result.workflow_id,
        polling_url: `/api/force-sync/status/${session.id}`,
        message: result.success ? 'Force sync initiated successfully' : 'Force sync failed to initiate',
        details: result,
        error: result.error,
        duration_ms: duration,
        timestamp: new Date().toISOString()
      };

      return syncResult;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      session.updateStatus({
        status: 'failed',
        progress: 0,
        message: `Force sync failed: ${errorMessage}`,
        details: { error: errorMessage }
      });

      this.emit('sync:error', {
        session_id: session.id,
        correlation_id: correlationId,
        error: errorMessage
      });

      return {
        success: false,
        correlation_id: correlationId,
        session_id: session.id,
        polling_url: `/api/force-sync/status/${session.id}`,
        message: 'Force sync failed to initiate',
        error: errorMessage,
        duration_ms: duration,
        timestamp: new Date().toISOString()
      };

    } finally {
      // Clean up session after 1 hour
      setTimeout(() => {
        this.sessions.delete(session.id);
        session.destroy();
      }, 60 * 60 * 1000);
    }
  }

  getSessionStatus(sessionId: string): SyncStatus | null {
    const session = this.sessions.get(sessionId);
    return session ? session.status : null;
  }

  getAllActiveSessions(): Array<{ id: string; status: SyncStatus }> {
    return Array.from(this.sessions.entries())
      .filter(([, session]) =>
        session.status.status === 'pending' || session.status.status === 'in_progress'
      )
      .map(([id, session]) => ({ id, status: session.status }));
  }

  getLastSyncTimestamp(): string | null {
    return this.lastSyncTimestamp || null;
  }

  private mapSyncScope(scope: string): string {
    switch (scope) {
      case 'quick':
        return 'priority_platforms';
      case 'full':
        return 'all_platforms';
      default:
        return scope;
    }
  }

  // Cancel a running sync
  async cancelSync(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status.status === 'completed' || session.status.status === 'failed') {
      return false;
    }

    session.updateStatus({
      status: 'failed',
      message: 'Force sync cancelled by user'
    });

    this.emit('sync:cancelled', { session_id: sessionId });
    return true;
  }

  // Retry a failed sync
  async retrySync(sessionId: string): Promise<ForceSyncResult | null> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status.status !== 'failed') {
      return null;
    }

    // Extract original options from session details if available
    const options: ForceSyncOptions = {
      triggered_by: 'retry',
      metadata: {
        original_session_id: sessionId,
        retry_attempt: true
      }
    };

    return this.triggerSync(options);
  }
}