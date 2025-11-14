'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Webhook,
  Zap,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Settings,
  Play,
  ExternalLink,
  Activity
} from 'lucide-react';

interface TriggerResponse {
  success: boolean;
  workflow_id?: string;
  session_id?: string;
  message: string;
  polling_url?: string;
  error?: string;
  correlation_id: string;
  duration_ms: number;
}

interface TriggerHistory {
  timestamp: string;
  correlation_id: string;
  success: boolean;
  workflow_id?: string;
  duration_ms: number;
  message: string;
}

interface StrategyAssistantTriggerProps {
  isLoading?: boolean;
  onRefresh?: () => void;
}

export default function StrategyAssistantTrigger({
  isLoading = false,
  onRefresh
}: StrategyAssistantTriggerProps) {
  const [isTriggeringWorkflow, setIsTriggeringWorkflow] = useState(false);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [triggerResult, setTriggerResult] = useState<TriggerResponse | null>(null);
  const [triggerHistory, setTriggerHistory] = useState<TriggerHistory[]>([]);

  // Form fields for advanced mode
  const [clientName, setClientName] = useState('Admin Dashboard Test Trigger');
  const [industry, setIndustry] = useState('Technology');
  const [companySize, setCompanySize] = useState('Medium');
  const [syncScope, setSyncScope] = useState('priority_platforms');
  const [customPayload, setCustomPayload] = useState('');

  // Load trigger history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('strategy_assistant_trigger_history');
      if (saved) {
        setTriggerHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load trigger history:', error);
    }
  }, []);

  // Save trigger history to localStorage
  const saveTriggerHistory = (newHistory: TriggerHistory[]) => {
    try {
      localStorage.setItem('strategy_assistant_trigger_history', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to save trigger history:', error);
    }
  };

  // Simple trigger
  const handleSimpleTrigger = async () => {
    setIsTriggeringWorkflow(true);
    setTriggerResult(null);

    try {
      const response = await fetch('/api/opal/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_name: 'Admin Dashboard Simple Trigger',
          triggered_by: 'admin_dashboard_simple',
          sync_scope: 'quick'
        }),
      });

      const result = await response.json();
      setTriggerResult(result);

      // Add to history
      const historyEntry: TriggerHistory = {
        timestamp: new Date().toISOString(),
        correlation_id: result.correlation_id,
        success: result.success,
        workflow_id: result.workflow_id,
        duration_ms: result.duration_ms,
        message: result.message
      };

      const newHistory = [historyEntry, ...triggerHistory.slice(0, 9)]; // Keep last 10
      setTriggerHistory(newHistory);
      saveTriggerHistory(newHistory);

    } catch (error) {
      console.error('Simple trigger failed:', error);
      setTriggerResult({
        success: false,
        message: 'Failed to trigger workflow',
        error: error instanceof Error ? error.message : 'Unknown error',
        correlation_id: `error-${Date.now()}`,
        duration_ms: 0
      });
    } finally {
      setIsTriggeringWorkflow(false);
    }
  };

  // Advanced trigger with custom payload
  const handleAdvancedTrigger = async () => {
    setIsTriggeringWorkflow(true);
    setTriggerResult(null);

    try {
      let payload: any = {
        client_name: clientName,
        industry,
        company_size: companySize,
        sync_scope: syncScope,
        triggered_by: 'admin_dashboard_advanced'
      };

      // If custom payload is provided, try to merge it
      if (customPayload.trim()) {
        try {
          const customData = JSON.parse(customPayload);
          payload = { ...payload, ...customData };
        } catch (parseError) {
          throw new Error('Invalid JSON in custom payload');
        }
      }

      const response = await fetch('/api/opal/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      setTriggerResult(result);

      // Add to history
      const historyEntry: TriggerHistory = {
        timestamp: new Date().toISOString(),
        correlation_id: result.correlation_id,
        success: result.success,
        workflow_id: result.workflow_id,
        duration_ms: result.duration_ms,
        message: result.message
      };

      const newHistory = [historyEntry, ...triggerHistory.slice(0, 9)]; // Keep last 10
      setTriggerHistory(newHistory);
      saveTriggerHistory(newHistory);

    } catch (error) {
      console.error('Advanced trigger failed:', error);
      setTriggerResult({
        success: false,
        message: 'Failed to trigger workflow',
        error: error instanceof Error ? error.message : 'Unknown error',
        correlation_id: `error-${Date.now()}`,
        duration_ms: 0
      });
    } finally {
      setIsTriggeringWorkflow(false);
    }
  };

  const clearResult = () => {
    setTriggerResult(null);
  };

  const clearHistory = () => {
    setTriggerHistory([]);
    saveTriggerHistory([]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Strategy Assistant Webhook Trigger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading webhook trigger...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Strategy Assistant Webhook Trigger
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Manually trigger OPAL Strategy Assistant workflows for testing and data sync
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                onClick={onRefresh}
                variant="outline"
                size="sm"
                disabled={isTriggeringWorkflow}
              >
                <RefreshCw className={`h-4 w-4 ${isTriggeringWorkflow ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Trigger Result Display */}
        {triggerResult && (
          <div className={`p-4 rounded-lg border-2 ${
            triggerResult.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {triggerResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={`font-medium ${
                  triggerResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {triggerResult.success ? 'Workflow Triggered Successfully' : 'Trigger Failed'}
                </span>
              </div>
              <Button
                onClick={clearResult}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-2 text-sm">
              <p className={triggerResult.success ? 'text-green-700' : 'text-red-700'}>
                {triggerResult.message}
              </p>

              {triggerResult.success && (
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {triggerResult.workflow_id && (
                    <div>
                      <span className="text-gray-600">Workflow ID:</span>
                      <p className="font-mono">{triggerResult.workflow_id}</p>
                    </div>
                  )}
                  {triggerResult.session_id && (
                    <div>
                      <span className="text-gray-600">Session ID:</span>
                      <p className="font-mono">{triggerResult.session_id}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Correlation ID:</span>
                    <p className="font-mono">{triggerResult.correlation_id}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <p>{triggerResult.duration_ms}ms</p>
                  </div>
                </div>
              )}

              {triggerResult.error && (
                <p className="text-red-600 text-xs font-mono bg-red-100 p-2 rounded">
                  {triggerResult.error}
                </p>
              )}

              {triggerResult.polling_url && (
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    onClick={() => window.open(triggerResult.polling_url, '_blank')}
                    variant="outline"
                    size="sm"
                    className="h-7"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Monitor Progress
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setIsAdvancedMode(false)}
            variant={!isAdvancedMode ? "default" : "outline"}
            size="sm"
          >
            <Zap className="h-4 w-4 mr-2" />
            Simple Trigger
          </Button>
          <Button
            onClick={() => setIsAdvancedMode(true)}
            variant={isAdvancedMode ? "default" : "outline"}
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Advanced Trigger
          </Button>
        </div>

        {/* Simple Mode */}
        {!isAdvancedMode && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Quick Workflow Trigger</h3>
              <p className="text-sm text-blue-700 mb-3">
                Triggers the Strategy Assistant workflow with default parameters optimized for testing and quick data sync.
              </p>
              <Button
                onClick={handleSimpleTrigger}
                disabled={isTriggeringWorkflow}
                className="w-full"
              >
                {isTriggeringWorkflow ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Triggering Workflow...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Trigger Strategy Assistant
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Advanced Mode */}
        {isAdvancedMode && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Financial Services">Financial Services</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size</Label>
                <Select value={companySize} onValueChange={setCompanySize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Small">Small (1-50)</SelectItem>
                    <SelectItem value="Medium">Medium (51-500)</SelectItem>
                    <SelectItem value="Large">Large (501-5000)</SelectItem>
                    <SelectItem value="Enterprise">Enterprise (5000+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="syncScope">Sync Scope</Label>
                <Select value={syncScope} onValueChange={setSyncScope}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sync scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quick">Quick Sync</SelectItem>
                    <SelectItem value="priority_platforms">Priority Platforms</SelectItem>
                    <SelectItem value="full_sync">Full Sync</SelectItem>
                    <SelectItem value="test_only">Test Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customPayload">Custom Payload (JSON)</Label>
              <Textarea
                id="customPayload"
                value={customPayload}
                onChange={(e) => setCustomPayload(e.target.value)}
                placeholder='{"additional_parameter": "value"}'
                rows={3}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Optional: Additional JSON payload to merge with the trigger request
              </p>
            </div>

            <Button
              onClick={handleAdvancedTrigger}
              disabled={isTriggeringWorkflow}
              className="w-full"
            >
              {isTriggeringWorkflow ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Triggering Custom Workflow...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Trigger Custom Workflow
                </>
              )}
            </Button>
          </div>
        )}

        {/* Trigger History */}
        {triggerHistory.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Triggers
              </h3>
              <Button
                onClick={clearHistory}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                Clear History
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {triggerHistory.map((entry, index) => (
                <div
                  key={`${entry.correlation_id}-${index}`}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                >
                  <div className="flex items-center gap-2 flex-1">
                    {entry.success ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-600" />
                    )}
                    <span className="font-mono text-gray-600">
                      {entry.correlation_id.substring(0, 12)}...
                    </span>
                    <span className="text-gray-500">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.workflow_id && (
                      <Badge variant="outline" className="text-xs">
                        {entry.workflow_id.substring(0, 8)}
                      </Badge>
                    )}
                    <span className="text-gray-500">
                      {entry.duration_ms}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-4 border-t">
          <div className="flex gap-2">
            <Button
              onClick={() => window.open('/api/opal/health', '_blank')}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Activity className="h-4 w-4 mr-2" />
              View OPAL Health
            </Button>
            <Button
              onClick={() => window.open('/api/opal/trigger', '_blank')}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              API Documentation
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}