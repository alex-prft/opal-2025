'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Bell, 
  BellOff, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Settings,
  Activity,
  Mail,
  Clock,
  Calendar
} from 'lucide-react';

interface AlertCondition {
  id: string;
  name: string;
  condition: 'yellow' | 'red';
  threshold?: number;
  description: string;
  enabled: boolean;
}

interface MonitoringConfig {
  enabled: boolean;
  check_interval_ms: number;
  alert_conditions: AlertCondition[];
  notification_channels: {
    email: boolean;
    webhook: boolean;
    console: boolean;
  };
  webhook_url?: string;
  email_recipients?: string[];
}

interface AlertEvent {
  id: string;
  condition_id: string;
  trigger_time: string;
  validation_id: string;
  status: 'yellow' | 'red';
  message: string;
  details: any;
  acknowledged: boolean;
  resolved: boolean;
}

export function MonitoringConfig() {
  const [config, setConfig] = useState<MonitoringConfig | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<AlertEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monitoringStatus, setMonitoringStatus] = useState<'unknown' | 'running' | 'stopped'>('unknown');
  const [emailTestResult, setEmailTestResult] = useState<string | null>(null);
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  const fetchMonitoringStatus = async () => {
    try {
      setError(null);

      const response = await fetch('/api/admin/osa/monitoring?action=status');
      if (!response.ok) {
        throw new Error(`Failed to fetch monitoring status: ${response.status}`);
      }

      const data = await response.json();
      setConfig(data.config);
      setActiveAlerts(data.active_alerts || []);
      setMonitoringStatus(data.config.enabled ? 'running' : 'stopped');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch monitoring status');
    } finally {
      setIsLoading(false);
    }
  };

  const updateMonitoringAction = async (action: string, additionalData?: any) => {
    try {
      setIsUpdating(true);
      setError(null);

      const response = await fetch('/api/admin/osa/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ...additionalData
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} monitoring: ${response.status}`);
      }

      const result = await response.json();
      
      // Refresh status after action
      await fetchMonitoringStatus();
      
      return result;

    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} monitoring`);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  const startMonitoring = () => updateMonitoringAction('start');
  const stopMonitoring = () => updateMonitoringAction('stop');
  const restartMonitoring = () => updateMonitoringAction('restart');

  const updateConfig = async (newConfig: Partial<MonitoringConfig>) => {
    await updateMonitoringAction('update_config', { config: newConfig });
  };

  const acknowledgeAlert = async (alertKey: string) => {
    await updateMonitoringAction('acknowledge_alert', { alert_key: alertKey });
  };

  const resolveAlert = async (alertKey: string) => {
    await updateMonitoringAction('resolve_alert', { alert_key: alertKey });
  };

  const toggleAlertCondition = async (conditionId: string, enabled: boolean) => {
    if (!config) return;

    const updatedConditions = config.alert_conditions.map(condition =>
      condition.id === conditionId ? { ...condition, enabled } : condition
    );

    await updateConfig({
      alert_conditions: updatedConditions
    });
  };

  const updateNotificationChannel = async (channel: string, enabled: boolean) => {
    if (!config) return;

    await updateConfig({
      notification_channels: {
        ...config.notification_channels,
        [channel]: enabled
      }
    });
  };

  const testEmailConfiguration = async () => {
    try {
      setIsTestingEmail(true);
      setEmailTestResult(null);

      const response = await fetch('/api/admin/osa/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_email' })
      });

      const result = await response.json();
      
      if (result.success) {
        setEmailTestResult(`✅ Test email sent successfully! Check your inbox.`);
      } else {
        setEmailTestResult(`❌ ${result.message || 'Email test failed'}`);
      }

    } catch (error) {
      setEmailTestResult(`❌ Email test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingEmail(false);
    }
  };

  useEffect(() => {
    fetchMonitoringStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMonitoringStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: 'running' | 'stopped' | 'unknown') => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-green-500" />;
      case 'stopped':
        return <Square className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: 'running' | 'stopped' | 'unknown') => {
    const variants = {
      running: 'bg-green-100 text-green-800 border-green-200',
      stopped: 'bg-red-100 text-red-800 border-red-200',
      unknown: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };

    return (
      <Badge className={variants[status]}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  const getAlertStatusIcon = (alert: AlertEvent) => {
    if (alert.resolved) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (alert.acknowledged) {
      return <Bell className="h-4 w-4 text-blue-500" />;
    } else if (alert.status === 'red') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monitoring & Alerts</CardTitle>
          <CardDescription>Loading monitoring configuration...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RotateCcw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Monitoring & Alerts System
              </CardTitle>
              <CardDescription>
                Configure automated monitoring and alerting for integration validation status
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(monitoringStatus)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Monitoring Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={startMonitoring}
              disabled={isUpdating || monitoringStatus === 'running'}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start Monitoring
            </Button>
            <Button
              variant="outline"
              onClick={stopMonitoring}
              disabled={isUpdating || monitoringStatus === 'stopped'}
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Stop Monitoring
            </Button>
            <Button
              variant="outline"
              onClick={restartMonitoring}
              disabled={isUpdating}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Restart
            </Button>
          </div>

          {config && (
            <>
              <Separator />

              {/* Alert Conditions Configuration */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Alert Conditions</h4>
                <div className="space-y-2">
                  {config.alert_conditions.map((condition) => (
                    <div key={condition.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{condition.name}</div>
                        <div className="text-xs text-muted-foreground">{condition.description}</div>
                        {condition.threshold && (
                          <div className="text-xs text-muted-foreground">
                            Threshold: {condition.threshold}
                          </div>
                        )}
                      </div>
                      <Switch
                        checked={condition.enabled}
                        onCheckedChange={(enabled) => toggleAlertCondition(condition.id, enabled)}
                        disabled={isUpdating}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Notification Channels */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Notification Channels</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <span className="text-sm">Console Logging</span>
                    </div>
                    <Switch
                      checked={config.notification_channels.console}
                      onCheckedChange={(enabled) => updateNotificationChannel('console', enabled)}
                      disabled={isUpdating}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <span className="text-sm">Webhook Notifications</span>
                    </div>
                    <Switch
                      checked={config.notification_channels.webhook}
                      onCheckedChange={(enabled) => updateNotificationChannel('webhook', enabled)}
                      disabled={isUpdating}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <span className="text-sm">Email Notifications</span>
                    </div>
                    <Switch
                      checked={config.notification_channels.email}
                      onCheckedChange={(enabled) => updateNotificationChannel('email', enabled)}
                      disabled={isUpdating}
                    />
                  </div>
                </div>

                {config.notification_channels.webhook && (
                  <div className="space-y-2">
                    <Label htmlFor="webhook_url" className="text-sm">Webhook URL</Label>
                    <Input
                      id="webhook_url"
                      value={config.webhook_url || ''}
                      onChange={(e) => updateConfig({ webhook_url: e.target.value })}
                      placeholder="https://your-webhook-endpoint.com/alerts"
                      className="text-sm"
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Monitoring Settings */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Monitoring Settings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="check_interval" className="text-sm">Check Interval (seconds)</Label>
                    <Input
                      id="check_interval"
                      type="number"
                      value={Math.round(config.check_interval_ms / 1000)}
                      onChange={(e) => updateConfig({ check_interval_ms: parseInt(e.target.value) * 1000 })}
                      min="10"
                      max="300"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Daily Reports Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Reports
          </CardTitle>
          <CardDescription>
            Automated daily validation reports sent via email at 1:30 AM and 9:30 AM UTC
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Schedule</span>
              </div>
              <div className="text-sm text-muted-foreground">
                • 1:30 AM UTC (Early morning report)<br/>
                • 9:30 AM UTC (Business hours report)
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="text-sm font-medium">Email Status</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Recipients: {process.env.NEXT_PUBLIC_REPORT_EMAIL_RECIPIENTS || 'Not configured'}<br/>
                Provider: {process.env.NEXT_PUBLIC_EMAIL_PROVIDER || 'Not configured'}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Email Configuration Test</h4>
            <div className="flex items-center gap-2">
              <Button
                onClick={testEmailConfiguration}
                disabled={isTestingEmail}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                {isTestingEmail ? 'Testing...' : 'Test Email Configuration'}
              </Button>
            </div>
            
            {emailTestResult && (
              <Alert className={emailTestResult.startsWith('✅') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <AlertDescription className="text-sm">
                  {emailTestResult}
                </AlertDescription>
              </Alert>
            )}

            <div className="text-xs text-muted-foreground">
              📋 <strong>Setup Guide:</strong> See <code>/docs/daily-reports-setup.md</code> for complete configuration instructions
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Report Content</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium mb-2">📊 Summary Statistics</div>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• Total validations (24h)</li>
                  <li>• Success rate with trends</li>
                  <li>• Performance metrics</li>
                  <li>• Health status indicators</li>
                </ul>
              </div>
              <div>
                <div className="font-medium mb-2">⚠️ Issues & Insights</div>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• Recent validation failures</li>
                  <li>• Trend analysis</li>
                  <li>• Layer-specific issues</li>
                  <li>• Performance recommendations</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Active Alerts ({activeAlerts.length})
            </CardTitle>
            <CardDescription>
              Current alerts requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <div key={alert.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getAlertStatusIcon(alert)}
                      <div>
                        <div className="font-medium text-sm">{alert.message}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(alert.trigger_time).toLocaleString()} • Workflow: {alert.details.workflow_id}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!alert.acknowledged && !alert.resolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acknowledgeAlert(`${alert.condition_id}_${alert.details.workflow_id}`)}
                        >
                          Acknowledge
                        </Button>
                      )}
                      {!alert.resolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveAlert(`${alert.condition_id}_${alert.details.workflow_id}`)}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Condition: {alert.condition_id} • Status: {alert.status} • Validation: {alert.validation_id}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}