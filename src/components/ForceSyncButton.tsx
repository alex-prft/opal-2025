'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { authenticatedFetch } from '@/lib/utils/client-auth';
import {
  RefreshCw,
  Database,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap
} from 'lucide-react';

interface ForceSyncButtonProps {
  variant?: 'button' | 'card';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface SyncStatus {
  isRunning: boolean;
  sessionId?: string;
  syncId?: string;
  startTime?: Date;
  platforms?: string[];
  estimatedDuration?: string;
}

export default function ForceSyncButton({
  variant = 'button',
  size = 'md',
  className = ''
}: ForceSyncButtonProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ isRunning: false });
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerForceSync = async (syncScope: string = 'priority_platforms') => {
    try {
      setError(null);
      setSyncStatus({ isRunning: true });

      console.log(`🚀 [Force Sync] Triggering ${syncScope} sync...`);

      const response = await authenticatedFetch('/api/opal/sync', {
        method: 'POST',
        body: JSON.stringify({
          sync_scope: syncScope,
          include_rag_update: true,
          triggered_by: 'manual_user_request',
          client_context: {
            client_name: 'Manual Sync Operation',
            industry: 'System Administration'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Sync failed: ${response.status}`);
      }

      const syncResult = await response.json();

      setSyncStatus({
        isRunning: true,
        sessionId: syncResult.session_id,
        syncId: syncResult.sync_id,
        startTime: new Date(),
        platforms: syncResult.sync_details.platforms_included,
        estimatedDuration: syncResult.sync_details.estimated_duration
      });

      // Poll for completion
      pollSyncStatus(syncResult.session_id);

    } catch (error) {
      console.error('❌ [Force Sync] Failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown sync error');
      setSyncStatus({ isRunning: false });
    }
  };

  const pollSyncStatus = async (sessionId: string) => {
    try {
      let attempts = 0;
      const maxAttempts = 120; // 10 minutes max
      const pollInterval = 5000; // 5 seconds

      const poll = async (): Promise<void> => {
        if (attempts >= maxAttempts) {
          throw new Error('Sync timeout - please check system logs');
        }

        attempts++;

        const statusResponse = await authenticatedFetch(`/api/opal/status/${sessionId}`, {
          method: 'GET'
        });

        if (!statusResponse.ok) {
          throw new Error(`Status check failed: ${statusResponse.status}`);
        }

        const statusData = await statusResponse.json();

        if (statusData.status === 'completed') {
          console.log('✅ [Force Sync] Sync completed successfully');
          setSyncStatus({ isRunning: false });
          setLastSyncTime(new Date());
        } else if (statusData.status === 'failed') {
          throw new Error(`Sync failed: ${statusData.error_message || 'Unknown error'}`);
        } else {
          // Still running, continue polling
          setTimeout(poll, pollInterval);
        }
      };

      await poll();

    } catch (error) {
      console.error('❌ [Force Sync] Polling failed:', error);
      setError(error instanceof Error ? error.message : 'Sync monitoring failed');
      setSyncStatus({ isRunning: false });
    }
  };

  const formatDuration = (startTime: Date): string => {
    const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (variant === 'card') {
    return (
      <Card className={`w-full max-w-md ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            DXP Data Sync
          </CardTitle>
          <CardDescription>
            Manually refresh data from all integrated Optimizely platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sync Status */}
          {syncStatus.isRunning ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm font-medium">Syncing platforms...</span>
              </div>

              {syncStatus.startTime && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Running for {formatDuration(syncStatus.startTime)}
                  </span>
                </div>
              )}

              {syncStatus.platforms && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Syncing platforms:</span>
                  <div className="flex flex-wrap gap-1">
                    {syncStatus.platforms.map((platform, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {syncStatus.estimatedDuration && (
                <p className="text-xs text-gray-500">
                  Estimated duration: {syncStatus.estimatedDuration}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {lastSyncTime ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">
                    Last sync: {lastSyncTime.toLocaleTimeString()}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  No recent sync activity
                </p>
              )}

              {error && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => triggerForceSync('priority_platforms')}
              disabled={syncStatus.isRunning}
              size="sm"
              className="flex-1"
            >
              {syncStatus.isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Syncing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Quick Sync
                </>
              )}
            </Button>

            <Button
              onClick={() => triggerForceSync('all_platforms')}
              disabled={syncStatus.isRunning}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              {syncStatus.isRunning ? (
                'Please Wait...'
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Full Sync
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Quick Sync:</strong> Priority platforms (6-8 min)</p>
            <p><strong>Full Sync:</strong> All platforms (8-12 min)</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Button variant
  const buttonSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default';

  return (
    <Button
      onClick={() => triggerForceSync('priority_platforms')}
      disabled={syncStatus.isRunning}
      size={buttonSize}
      variant="outline"
      className={`gap-2 ${className}`}
    >
      {syncStatus.isRunning ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          Force Sync
        </>
      )}
    </Button>
  );
}