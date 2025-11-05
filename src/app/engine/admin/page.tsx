'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Calendar, Settings, Database, Users, TrendingUp, AlertCircle, Save, RefreshCw, Webhook, Activity, CheckCircle, XCircle, TestTube, Key } from 'lucide-react';
import { DateRangePicker } from '@/components/DateRangePicker';
import LoadingAnimation, { LoadingPresets } from '@/components/LoadingAnimation';
import OpalWorkflowManager from '@/components/OpalWorkflowManager';
import { ServiceStatusProvider, useServiceErrorListener } from '@/components/ServiceStatusProvider';
import ServiceStatusFooter from '@/components/ServiceStatusFooter';

interface ConfigurationSettings {
  maturityWeights: {
    analytics: number;
    personalization: number;
    testing: number;
    optimization: number;
  };
  recommendationEngine: {
    confidenceThreshold: number;
    maxRecommendations: number;
    includeIndustryBenchmarks: boolean;
    prioritizeQuickWins: boolean;
  };
  dataIntegrations: {
    salesforce: {
      enabled: boolean;
      refreshInterval: number;
      syncFields: string[];
    };
    ga4: {
      enabled: boolean;
      lookbackDays: number;
      includeBehaviorData: boolean;
    };
    optimizely: {
      enabled: boolean;
      includeArchivedExperiments: boolean;
      minimumSampleSize: number;
    };
  };
  notifications: {
    emailEnabled: boolean;
    slackEnabled: boolean;
    weeklyReports: boolean;
  };
}

interface InfluenceFactors {
  formResponses: {
    currentPhase: string;
    targetPhase: string;
    industryFocus: string;
    teamSize: number;
    budget: string;
    timeline: string;
    influence: number;
  };
  analyticsData: {
    trafficVolume: number;
    conversionRate: number;
    segmentCount: number;
    influence: number;
  };
  integrationHealth: {
    salesforce: 'healthy' | 'warning' | 'error';
    ga4: 'healthy' | 'warning' | 'error';
    optimizely: 'healthy' | 'warning' | 'error';
    sendgrid: 'healthy' | 'warning' | 'error';
    influence: number;
  };
}

function AdminPageContent() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    to: new Date()
  });

  const [config, setConfig] = useState<ConfigurationSettings>({
    maturityWeights: {
      analytics: 25,
      personalization: 30,
      testing: 25,
      optimization: 20
    },
    recommendationEngine: {
      confidenceThreshold: 0.7,
      maxRecommendations: 8,
      includeIndustryBenchmarks: true,
      prioritizeQuickWins: false
    },
    dataIntegrations: {
      salesforce: {
        enabled: true,
        refreshInterval: 24,
        syncFields: ['engagement_score', 'lifecycle_stage', 'customer_tier']
      },
      ga4: {
        enabled: true,
        lookbackDays: 90,
        includeBehaviorData: true
      },
      optimizely: {
        enabled: true,
        includeArchivedExperiments: true,
        minimumSampleSize: 1000
      }
    },
    notifications: {
      emailEnabled: true,
      slackEnabled: false,
      weeklyReports: true
    }
  });

  const [influenceFactors, setInfluenceFactors] = useState<InfluenceFactors>({
    formResponses: {
      currentPhase: 'Explore',
      targetPhase: 'Run',
      industryFocus: 'Fresh Produce',
      teamSize: 8,
      budget: '$50k-100k',
      timeline: '6 months',
      influence: 35
    },
    analyticsData: {
      trafficVolume: 87340,
      conversionRate: 2.4,
      segmentCount: 12,
      influence: 25
    },
    integrationHealth: {
      salesforce: 'healthy',
      ga4: 'healthy',
      optimizely: 'warning',
      sendgrid: 'healthy',
      influence: 40
    }
  });

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize service error listener
  useServiceErrorListener();

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      // Simulate API call to save configuration
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save configuration:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section: string, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof ConfigurationSettings],
        [key]: value
      }
    }));
    setUnsavedChanges(true);
  };

  const updateNestedConfig = (section: string, subsection: string, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof ConfigurationSettings],
        [subsection]: {
          ...(prev[section as keyof ConfigurationSettings] as any)[subsection],
          [key]: value
        }
      }
    }));
    setUnsavedChanges(true);
  };

  const getHealthStatusColor = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthStatusText = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy': return 'Operational';
      case 'warning': return 'Issues Detected';
      case 'error': return 'Connection Error';
      default: return 'Unknown';
    }
  };

  // Webhook Management Section Component
  function WebhookManagementSection() {
    const [webhookStatus, setWebhookStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [abortController, setAbortController] = useState<AbortController | null>(null);
    const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

    const fetchWebhookStatus = async () => {
      const controller = new AbortController();
      setAbortController(controller);
      setLoading(true);
      setShowLoadingOverlay(true);

      try {
        const response = await fetch('/api/webhooks/management', {
          signal: controller.signal
        });
        const data = await response.json();
        setWebhookStatus(data);
        setShowLoadingOverlay(false);
      } catch (error) {
        setShowLoadingOverlay(false);

        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Webhook status fetch was cancelled by user');
          return;
        }

        console.error('Failed to fetch webhook status:', error);
      } finally {
        setLoading(false);
        setAbortController(null);
      }
    };

    const handleCancelWebhookLoad = () => {
      if (abortController) {
        abortController.abort();
        setAbortController(null);
      }
      setShowLoadingOverlay(false);
      setLoading(false);
    };

    useEffect(() => {
      fetchWebhookStatus();
    }, []);

    const testWebhook = async (provider: 'ga4' | 'salesforce') => {
      try {
        const response = await fetch(`/api/webhooks/management?action=test&provider=${provider}`);
        const result = await response.json();
        alert(result.message);
        fetchWebhookStatus(); // Refresh status
      } catch (error) {
        alert(`Failed to test ${provider} webhook`);
      }
    };

    const clearErrors = async (provider: 'ga4' | 'salesforce') => {
      try {
        const response = await fetch('/api/webhooks/management', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear_errors', provider })
        });
        const result = await response.json();
        alert(result.message);
        fetchWebhookStatus(); // Refresh status
      } catch (error) {
        alert(`Failed to clear ${provider} errors`);
      }
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="w-5 h-5" />
              Real-time Data Sync Status
            </CardTitle>
            <p className="text-sm text-gray-600">
              Monitor and manage webhook endpoints for real-time data synchronization
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                <span>Loading webhook status...</span>
              </div>
            ) : webhookStatus ? (
              <div className="space-y-6">
                {/* System Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {webhookStatus.system_info.webhook_processing_enabled ? 'ON' : 'OFF'}
                    </div>
                    <div className="text-sm text-gray-600">Processing Status</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{webhookStatus.system_info.uptime}</div>
                    <div className="text-sm text-gray-600">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{webhookStatus.system_info.memory_usage}</div>
                    <div className="text-sm text-gray-600">Memory Usage</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {process.env.WEBHOOK_RATE_LIMIT_PER_MINUTE || 100}/min
                    </div>
                    <div className="text-sm text-gray-600">Rate Limit</div>
                  </div>
                </div>

                {/* GA4 Webhook */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Activity className="w-6 h-6 text-blue-600" />
                        <div>
                          <h3 className="font-semibold text-lg">Google Analytics 4 Webhook</h3>
                          <p className="text-sm text-gray-600">{webhookStatus.webhooks.ga4.endpoint}</p>
                        </div>
                      </div>
                      {webhookStatus.webhooks.ga4.enabled ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-xl font-bold text-blue-600">
                          {webhookStatus.webhooks.ga4.total_received}
                        </div>
                        <div className="text-xs text-gray-600">Total Received</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-green-600">
                          {webhookStatus.webhooks.ga4.error_rate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600">Error Rate</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {webhookStatus.webhooks.ga4.last_received
                            ? new Date(webhookStatus.webhooks.ga4.last_received).toLocaleString()
                            : 'Never'
                          }
                        </div>
                        <div className="text-xs text-gray-600">Last Received</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => testWebhook('ga4')}>
                          <TestTube className="w-4 h-4 mr-1" />
                          Test
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => clearErrors('ga4')}>
                          Clear Errors
                        </Button>
                      </div>
                    </div>

                    {webhookStatus.webhooks.ga4.recent_errors.length > 0 && (
                      <div className="mt-4 p-3 bg-red-50 rounded-md">
                        <h4 className="text-sm font-medium text-red-800 mb-2">Recent Errors:</h4>
                        <ul className="text-xs text-red-700 space-y-1">
                          {webhookStatus.webhooks.ga4.recent_errors.map((error: string, index: number) => (
                            <li key={index} className="truncate">{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Salesforce Webhook */}
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Database className="w-6 h-6 text-green-600" />
                        <div>
                          <h3 className="font-semibold text-lg">Salesforce CRM Webhook</h3>
                          <p className="text-sm text-gray-600">{webhookStatus.webhooks.salesforce.endpoint}</p>
                        </div>
                      </div>
                      {webhookStatus.webhooks.salesforce.enabled ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-xl font-bold text-green-600">
                          {webhookStatus.webhooks.salesforce.total_received}
                        </div>
                        <div className="text-xs text-gray-600">Total Received</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-green-600">
                          {webhookStatus.webhooks.salesforce.error_rate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600">Error Rate</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {webhookStatus.webhooks.salesforce.last_received
                            ? new Date(webhookStatus.webhooks.salesforce.last_received).toLocaleString()
                            : 'Never'
                          }
                        </div>
                        <div className="text-xs text-gray-600">Last Received</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => testWebhook('salesforce')}>
                          <TestTube className="w-4 h-4 mr-1" />
                          Test
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => clearErrors('salesforce')}>
                          Clear Errors
                        </Button>
                      </div>
                    </div>

                    {webhookStatus.webhooks.salesforce.recent_errors.length > 0 && (
                      <div className="mt-4 p-3 bg-red-50 rounded-md">
                        <h4 className="text-sm font-medium text-red-800 mb-2">Recent Errors:</h4>
                        <ul className="text-xs text-red-700 space-y-1">
                          {webhookStatus.webhooks.salesforce.recent_errors.map((error: string, index: number) => (
                            <li key={index} className="truncate">{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Webhook Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5" />
                      Webhook Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="font-medium">GA4 Webhook URL</Label>
                          <div className="p-3 bg-gray-100 rounded-md text-sm font-mono">
                            {process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/ga4
                          </div>
                          <p className="text-xs text-gray-600">
                            Configure this URL in your GA4 property settings for real-time data sync
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Salesforce Webhook URL</Label>
                          <div className="p-3 bg-gray-100 rounded-md text-sm font-mono">
                            {process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/salesforce
                          </div>
                          <p className="text-xs text-gray-600">
                            Configure this URL in your Salesforce org's outbound messaging or Process Builder
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Refresh webhook status</span>
                          <Button size="sm" variant="outline" onClick={fetchWebhookStatus}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Failed to load webhook status
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🔧 Admin Configuration
            </h1>
            <p className="text-gray-600">
              Configure system settings and view influence factors for personalization results
            </p>
          </div>

          <div className="flex items-center gap-4">
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />

            <Button
              onClick={handleSaveConfig}
              disabled={!unsavedChanges || saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Unsaved Changes Alert */}
        {unsavedChanges && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-3">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">You have unsaved configuration changes</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="influence" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="influence">Influence Factors</TabsTrigger>
            <TabsTrigger value="maturity">Maturity Scoring</TabsTrigger>
            <TabsTrigger value="integrations">Data Integrations</TabsTrigger>
            <TabsTrigger value="webhooks">Webhook Management</TabsTrigger>
            <TabsTrigger value="opal-workflows">Opal Workflows</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendation Engine</TabsTrigger>
          </TabsList>

          {/* Influence Factors Tab */}
          <TabsContent value="influence" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Form Responses Influence */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Form Responses
                    <Badge variant="secondary">{influenceFactors.formResponses.influence}% influence</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Current Phase</Label>
                    <div className="text-2xl font-bold text-blue-600">
                      {influenceFactors.formResponses.currentPhase}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Target Phase</Label>
                    <div className="text-2xl font-bold text-green-600">
                      {influenceFactors.formResponses.targetPhase}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <Label className="text-xs text-gray-500">Industry</Label>
                      <div className="font-medium">{influenceFactors.formResponses.industryFocus}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Team Size</Label>
                      <div className="font-medium">{influenceFactors.formResponses.teamSize} people</div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Budget</Label>
                      <div className="font-medium">{influenceFactors.formResponses.budget}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Timeline</Label>
                      <div className="font-medium">{influenceFactors.formResponses.timeline}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Analytics Data Influence */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Analytics Data
                    <Badge variant="secondary">{influenceFactors.analyticsData.influence}% influence</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Monthly Sessions</Label>
                    <div className="text-2xl font-bold text-green-600">
                      {influenceFactors.analyticsData.trafficVolume.toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Conversion Rate</Label>
                    <div className="text-2xl font-bold text-blue-600">
                      {influenceFactors.analyticsData.conversionRate}%
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Label className="text-xs text-gray-500">Active Segments</Label>
                    <div className="text-lg font-medium">{influenceFactors.analyticsData.segmentCount} segments</div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Date Range: {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>

              {/* Integration Health Influence */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-purple-600" />
                    Integration Health
                    <Badge variant="secondary">{influenceFactors.integrationHealth.influence}% influence</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(influenceFactors.integrationHealth).filter(([key]) => key !== 'influence').map(([integration, status]) => (
                    <div key={integration} className="flex items-center justify-between">
                      <span className="font-medium capitalize">{integration}</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getHealthStatusColor(status as any)}`} />
                        <span className="text-sm text-gray-600">
                          {getHealthStatusText(status as any)}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t text-xs text-gray-500">
                    Integration health affects data quality and recommendation confidence
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Influence Weight Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Factor Influence Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Form Responses</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${influenceFactors.formResponses.influence}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12">{influenceFactors.formResponses.influence}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Analytics Data</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${influenceFactors.analyticsData.influence}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12">{influenceFactors.analyticsData.influence}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Integration Health</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${influenceFactors.integrationHealth.influence}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12">{influenceFactors.integrationHealth.influence}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maturity Scoring Tab */}
          <TabsContent value="maturity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Maturity Assessment Weights</CardTitle>
                <p className="text-sm text-gray-600">
                  Adjust how different factors contribute to the overall maturity score
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(config.maturityWeights).map(([category, weight]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="capitalize font-medium">{category}</Label>
                      <span className="text-sm font-medium">{weight}%</span>
                    </div>
                    <Slider
                      value={[weight]}
                      onValueChange={(value) => updateConfig('maturityWeights', category, value[0])}
                      max={50}
                      min={5}
                      step={5}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500">
                      Weight: {weight}% - {category === 'analytics' ? 'Data collection and measurement capabilities' :
                              category === 'personalization' ? 'Content and experience customization' :
                              category === 'testing' ? 'A/B testing and experimentation processes' :
                              'Conversion rate and performance optimization'}
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Total: {Object.values(config.maturityWeights).reduce((a, b) => a + b, 0)}%
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Salesforce Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Salesforce Integration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Salesforce</Label>
                    <Switch
                      checked={config.dataIntegrations.salesforce.enabled}
                      onCheckedChange={(checked) => updateNestedConfig('dataIntegrations', 'salesforce', 'enabled', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Refresh Interval (hours)</Label>
                    <Input
                      type="number"
                      value={config.dataIntegrations.salesforce.refreshInterval}
                      onChange={(e) => updateNestedConfig('dataIntegrations', 'salesforce', 'refreshInterval', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Sync Fields</Label>
                    <Textarea
                      value={config.dataIntegrations.salesforce.syncFields.join(', ')}
                      onChange={(e) => updateNestedConfig('dataIntegrations', 'salesforce', 'syncFields', e.target.value.split(', '))}
                      placeholder="engagement_score, lifecycle_stage, customer_tier"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Google Analytics 4 Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Google Analytics 4</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable GA4</Label>
                    <Switch
                      checked={config.dataIntegrations.ga4.enabled}
                      onCheckedChange={(checked) => updateNestedConfig('dataIntegrations', 'ga4', 'enabled', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Lookback Days</Label>
                    <Input
                      type="number"
                      value={config.dataIntegrations.ga4.lookbackDays}
                      onChange={(e) => updateNestedConfig('dataIntegrations', 'ga4', 'lookbackDays', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Include Behavior Data</Label>
                    <Switch
                      checked={config.dataIntegrations.ga4.includeBehaviorData}
                      onCheckedChange={(checked) => updateNestedConfig('dataIntegrations', 'ga4', 'includeBehaviorData', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Optimizely Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Optimizely Integration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Optimizely</Label>
                    <Switch
                      checked={config.dataIntegrations.optimizely.enabled}
                      onCheckedChange={(checked) => updateNestedConfig('dataIntegrations', 'optimizely', 'enabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Include Archived Experiments</Label>
                    <Switch
                      checked={config.dataIntegrations.optimizely.includeArchivedExperiments}
                      onCheckedChange={(checked) => updateNestedConfig('dataIntegrations', 'optimizely', 'includeArchivedExperiments', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Minimum Sample Size</Label>
                    <Input
                      type="number"
                      value={config.dataIntegrations.optimizely.minimumSampleSize}
                      onChange={(e) => updateNestedConfig('dataIntegrations', 'optimizely', 'minimumSampleSize', parseInt(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notifications Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Email Notifications</Label>
                    <Switch
                      checked={config.notifications.emailEnabled}
                      onCheckedChange={(checked) => updateConfig('notifications', 'emailEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Slack Notifications</Label>
                    <Switch
                      checked={config.notifications.slackEnabled}
                      onCheckedChange={(checked) => updateConfig('notifications', 'slackEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Weekly Reports</Label>
                    <Switch
                      checked={config.notifications.weeklyReports}
                      onCheckedChange={(checked) => updateConfig('notifications', 'weeklyReports', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Webhook Management Tab */}
          <TabsContent value="webhooks" className="space-y-6">
            <WebhookManagementSection />
          </TabsContent>

          {/* Opal Workflows Tab */}
          <TabsContent value="opal-workflows" className="space-y-6">
            <OpalWorkflowManager />
          </TabsContent>

          {/* Recommendation Engine Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recommendation Engine Settings</CardTitle>
                <p className="text-sm text-gray-600">
                  Configure how the AI generates personalization recommendations
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Confidence Threshold</Label>
                  <Slider
                    value={[config.recommendationEngine.confidenceThreshold * 100]}
                    onValueChange={(value) => updateConfig('recommendationEngine', 'confidenceThreshold', value[0] / 100)}
                    max={100}
                    min={50}
                    step={5}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500">
                    Current: {(config.recommendationEngine.confidenceThreshold * 100).toFixed(0)}% - Only show recommendations above this confidence level
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Maximum Recommendations</Label>
                  <Input
                    type="number"
                    value={config.recommendationEngine.maxRecommendations}
                    onChange={(e) => updateConfig('recommendationEngine', 'maxRecommendations', parseInt(e.target.value))}
                    min="1"
                    max="20"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Include Industry Benchmarks</Label>
                  <Switch
                    checked={config.recommendationEngine.includeIndustryBenchmarks}
                    onCheckedChange={(checked) => updateConfig('recommendationEngine', 'includeIndustryBenchmarks', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Prioritize Quick Wins</Label>
                  <Switch
                    checked={config.recommendationEngine.prioritizeQuickWins}
                    onCheckedChange={(checked) => updateConfig('recommendationEngine', 'prioritizeQuickWins', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <ServiceStatusFooter />
    </div>
  );
}

export default function AdminPage() {
  return (
    <ServiceStatusProvider>
      <AdminPageContent />
    </ServiceStatusProvider>
  );
}