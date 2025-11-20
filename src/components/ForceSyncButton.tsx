'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useForceSyncUnified } from '@/hooks/useForceSyncUnified';
import {
  RefreshCw,
  Database,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  XCircle,
  RotateCcw
} from 'lucide-react';

interface ForceSyncButtonProps {
  variant?: 'button' | 'card';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ForceSyncButton({
  variant = 'button',
  size = 'md',
  className = ''
}: ForceSyncButtonProps) {
  const {
    syncStatus,
    triggerSync,
    cancelSync,
    retrySync,
    isLoading,
    isActive,
    canCancel,
    canRetry,
    lastSyncTime,
    error
  } = useForceSyncUnified();

  const handleTriggerSync = async (syncScope: 'quick' | 'full' = 'quick') => {
    try {
      await triggerSync({
        sync_scope: syncScope,
        client_context: {
          client_name: 'Force Sync Button',
          industry: 'System Administration'
        },
        triggered_by: 'force_sync_button_ui'
      });
    } catch (error) {
      console.error('Failed to trigger sync:', error);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelSync();
    } catch (error) {
      console.error('Failed to cancel sync:', error);
    }
  };

  const handleRetry = async () => {
    try {
      await retrySync();
    } catch (error) {
      console.error('Failed to retry sync:', error);
    }
  };

  const formatDuration = (startTime?: string): string => {
    if (!startTime) return '0:00';
    const elapsed = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
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
          {/* Sync Status Display */}
          {isActive ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm font-medium">
                  {syncStatus.message || 'Syncing platforms...'}
                </span>
              </div>

              {syncStatus.started_at && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Running for {formatDuration(syncStatus.started_at)}
                  </span>
                </div>
              )}

              {syncStatus.progress !== undefined && syncStatus.progress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{syncStatus.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${syncStatus.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {syncStatus.details && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Sync Details:</span>
                  {typeof syncStatus.details === 'object' && (
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      {Object.entries(syncStatus.details).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {lastSyncTime ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">
                    Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
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
            {canRetry ? (
              <Button
                onClick={handleRetry}
                disabled={isLoading}
                size="sm"
                className="flex-1"
                variant="outline"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            ) : canCancel ? (
              <Button
                onClick={handleCancel}
                disabled={isLoading}
                size="sm"
                className="flex-1"
                variant="destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => handleTriggerSync('quick')}
                  disabled={isLoading || isActive}
                  size="sm"
                  className="flex-1"
                  data-testid="force-sync-trigger"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Quick Sync
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => handleTriggerSync('full')}
                  disabled={isLoading || isActive}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  {isLoading ? (
                    'Please Wait...'
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Full Sync
                    </>
                  )}
                </Button>
              </>
            )}
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
      onClick={() => handleTriggerSync('quick')}
      disabled={isLoading || isActive}
      size={buttonSize}
      variant="outline"
      className={`gap-2 ${className}`}
      data-testid="force-sync-trigger"
    >
      {isActive ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : isLoading ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Starting...
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