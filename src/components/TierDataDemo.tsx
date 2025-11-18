/**
 * Tier Data Integration Demo
 * Demonstrates the three-tier OPAL data integration system
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTierOPALData } from '@/hooks/useTierOPALData';
import { RefreshCw, Database, Clock, Server, TrendingUp, Users, BarChart3 } from 'lucide-react';

export function TierDataDemo() {
  const [selectedTier1, setSelectedTier1] = useState('strategy-plans');
  const [selectedTier2, setSelectedTier2] = useState('phases');
  const [selectedTier3, setSelectedTier3] = useState('phase-1');

  // Use the enhanced tier data hook
  const tierData = useTierOPALData(selectedTier1, selectedTier2, selectedTier3, {
    enableAutoRefresh: true,
    refreshInterval: 30000, // 30 seconds for demo
    prefetchTiers: true
  });

  const tier1Options = [
    { value: 'strategy-plans', label: 'Strategy Plans' },
    { value: 'optimizely-dxp-tools', label: 'Optimizely DXP Tools' },
    { value: 'analytics-insights', label: 'Analytics Insights' },
    { value: 'experience-optimization', label: 'Experience Optimization' }
  ];

  const tier2Options = {
    'strategy-plans': [
      { value: 'phases', label: 'Phases' },
      { value: 'osa', label: 'OSA' },
      { value: 'quick-wins', label: 'Quick Wins' }
    ],
    'optimizely-dxp-tools': [
      { value: 'webx', label: 'WEBX' },
      { value: 'content-recs', label: 'Content Recs' },
      { value: 'cms', label: 'CMS' }
    ],
    'analytics-insights': [
      { value: 'content', label: 'Content' },
      { value: 'audiences', label: 'Audiences' },
      { value: 'cx', label: 'Customer Experience' }
    ],
    'experience-optimization': [
      { value: 'experimentation', label: 'Experimentation' },
      { value: 'personalization', label: 'Personalization' },
      { value: 'ux', label: 'UX Optimization' }
    ]
  };

  const tier3Options = {
    'phases': [
      { value: 'phase-1', label: 'Phase 1: Foundation' },
      { value: 'phase-2', label: 'Phase 2: Growth' },
      { value: 'phase-3', label: 'Phase 3: Optimization' }
    ],
    'webx': [
      { value: 'active-experiments', label: 'Active Experiments' },
      { value: 'statistical-significance', label: 'Statistical Significance' },
      { value: 'results-analysis', label: 'Results Analysis' }
    ],
    'content': [
      { value: 'engagement', label: 'Content Engagement' },
      { value: 'topics', label: 'Content Topics' },
      { value: 'popular', label: 'Popular Content' }
    ]
  };

  const getFreshnessColor = (freshness?: string) => {
    switch (freshness) {
      case 'fresh': return 'bg-green-100 text-green-800';
      case 'stale': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'api': return <Server className="h-4 w-4" />;
      case 'cache': return <Database className="h-4 w-4" />;
      case 'mock': return <TrendingUp className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            OPAL Tier Data Integration Demo
          </CardTitle>
          <p className="text-gray-600">
            Demonstrates tier-1 summary metrics, tier-2 section KPIs, and tier-3 detailed content integration
          </p>
        </CardHeader>
        <CardContent>
          {/* Tier Selection Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Tier 1 (Section)</label>
              <select
                value={selectedTier1}
                onChange={(e) => setSelectedTier1(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                {tier1Options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tier 2 (Subsection)</label>
              <select
                value={selectedTier2}
                onChange={(e) => setSelectedTier2(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                {tier2Options[selectedTier1 as keyof typeof tier2Options]?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tier 3 (Page)</label>
              <select
                value={selectedTier3}
                onChange={(e) => setSelectedTier3(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                {tier3Options[selectedTier2 as keyof typeof tier3Options]?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Data Loading Status */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Badge variant={tierData.isLoading ? 'secondary' : 'outline'}>
                {tierData.isLoading ? 'Loading...' : 'Loaded'}
              </Badge>
              {tierData.hasError && (
                <Badge variant="destructive">Error</Badge>
              )}
            </div>
            <Button
              onClick={() => tierData.refresh()}
              disabled={tierData.isLoading}
              size="sm"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>

          {/* Tier Data Display */}
          <Tabs defaultValue="tier1" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tier1">Tier 1: Summary Metrics</TabsTrigger>
              <TabsTrigger value="tier2">Tier 2: Section KPIs</TabsTrigger>
              <TabsTrigger value="tier3">Tier 3: Detailed Content</TabsTrigger>
            </TabsList>

            <TabsContent value="tier1">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Tier 1: High-Level Summary Metrics
                    </CardTitle>
                    {tierData.tier1.metadata && (
                      <div className="flex items-center gap-2">
                        <Badge className={getFreshnessColor(tierData.tier1.metadata.freshness)}>
                          {tierData.tier1.metadata.freshness}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          {getSourceIcon(tierData.tier1.metadata.source)}
                          {tierData.tier1.metadata.source}
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {tierData.tier1.data ? (
                    <div className="space-y-4">
                      {/* Overall Health */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h3 className="font-semibold text-blue-900">Overall Health</h3>
                          <p className="text-2xl font-bold text-blue-700">{tierData.tier1.data.overallHealth.score}</p>
                          <p className="text-sm text-blue-600">{tierData.tier1.data.overallHealth.status}</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h3 className="font-semibold text-green-900">Total Users</h3>
                          <p className="text-2xl font-bold text-green-700">{tierData.tier1.data.keyMetrics.totalUsers?.toLocaleString()}</p>
                          <p className="text-sm text-green-600">Active Users</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <h3 className="font-semibold text-purple-900">Engagement Rate</h3>
                          <p className="text-2xl font-bold text-purple-700">{tierData.tier1.data.keyMetrics.engagementRate}%</p>
                          <p className="text-sm text-purple-600">User Engagement</p>
                        </div>
                      </div>

                      {/* System Status */}
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-2">System Status</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">API Health:</span>
                            <span className="ml-2 font-medium">{tierData.tier1.data.systemStatus.apiHealth}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Data Freshness:</span>
                            <span className="ml-2 font-medium">{tierData.tier1.data.systemStatus.dataFreshness}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Integration:</span>
                            <span className="ml-2 font-medium">{tierData.tier1.data.systemStatus.integrationStatus}</span>
                          </div>
                        </div>
                      </div>

                      {/* Alerts */}
                      <div>
                        <h3 className="font-semibold mb-2">System Alerts</h3>
                        <div className="space-y-2">
                          {tierData.tier1.data.alerts.map((alert, index) => (
                            <div key={index} className={`p-3 rounded-lg ${
                              alert.type === 'error' ? 'bg-red-50 text-red-800' :
                              alert.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                              'bg-blue-50 text-blue-800'
                            }`}>
                              <p className="text-sm font-medium">{alert.message}</p>
                              <p className="text-xs opacity-70">
                                {new Date(alert.timestamp).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">No tier-1 data available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tier2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Tier 2: Section KPIs
                    </CardTitle>
                    {tierData.tier2.metadata && (
                      <div className="flex items-center gap-2">
                        <Badge className={getFreshnessColor(tierData.tier2.metadata.freshness)}>
                          {tierData.tier2.metadata.freshness}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          {getSourceIcon(tierData.tier2.metadata.source)}
                          {tierData.tier2.metadata.source}
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {tierData.tier2.data ? (
                    <div className="space-y-4">
                      {/* Performance Score */}
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                        <h3 className="font-semibold mb-2">Section Performance</h3>
                        <div className="flex items-center justify-between">
                          <span>Overall Score:</span>
                          <span className="text-2xl font-bold">{tierData.tier2.data.performance.score}</span>
                        </div>
                      </div>

                      {/* Primary KPIs */}
                      <div>
                        <h3 className="font-semibold mb-3">Primary KPIs</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {tierData.tier2.data.kpis.primary.map((kpi, index) => (
                            <div key={index} className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{kpi.name}</span>
                                <Badge variant={kpi.trendDirection === 'up' ? 'default' : 'secondary'}>
                                  {kpi.trendDirection === 'up' ? '↗' : kpi.trendDirection === 'down' ? '↘' : '→'} {Math.abs(kpi.trend)}%
                                </Badge>
                              </div>
                              <div className="text-2xl font-bold mb-1">
                                {kpi.value} {kpi.unit}
                              </div>
                              {kpi.target && (
                                <div className="text-sm text-gray-600">
                                  Target: {kpi.target} {kpi.unit}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Insights */}
                      <div>
                        <h3 className="font-semibold mb-3">AI Insights</h3>
                        <div className="space-y-2">
                          {tierData.tier2.data.insights.map((insight, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{insight.title}</span>
                                <Badge variant={
                                  insight.priority === 'critical' ? 'destructive' :
                                  insight.priority === 'high' ? 'secondary' : 'outline'
                                }>
                                  {insight.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-700">{insight.description}</p>
                              <p className="text-xs text-gray-500 mt-1">Impact: {insight.impact}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">No tier-2 data available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tier3">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Tier 3: Detailed Content
                    </CardTitle>
                    {tierData.tier3.metadata && (
                      <div className="flex items-center gap-2">
                        <Badge className={getFreshnessColor(tierData.tier3.metadata.freshness)}>
                          {tierData.tier3.metadata.freshness}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          {getSourceIcon(tierData.tier3.metadata.source)}
                          {tierData.tier3.metadata.source}
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {tierData.tier3.data ? (
                    <div className="space-y-4">
                      {/* Page Info */}
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-2">{tierData.tier3.data.pageName}</h3>
                        <p className="text-sm text-gray-600 mb-2">{tierData.tier3.data.data.content.summary}</p>
                        <div className="flex items-center gap-2">
                          <Badge>{tierData.tier3.data.contentType}</Badge>
                          <Badge variant="outline">{tierData.tier3.data.pageId}</Badge>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div>
                        <h3 className="font-semibold mb-3">Page Metrics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {tierData.tier3.data.data.metrics.map((metric) => (
                            <div key={metric.id} className="p-4 border rounded-lg">
                              <h4 className="font-medium mb-1">{metric.name}</h4>
                              <div className="text-2xl font-bold mb-1">
                                {typeof metric.value === 'number'
                                  ? metric.format === 'currency' ? `$${metric.value.toLocaleString()}`
                                  : metric.format === 'percentage' ? `${metric.value}%`
                                  : metric.value.toLocaleString()
                                  : metric.value
                                }
                              </div>
                              {metric.comparison && (
                                <div className={`text-sm ${
                                  metric.comparison.change >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {metric.comparison.change >= 0 ? '+' : ''}{metric.comparison.change}
                                  {metric.comparison.changeType === 'percentage' ? '%' : ''}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AI Insights */}
                      <div>
                        <h3 className="font-semibold mb-3">AI Insights</h3>
                        <div className="space-y-2">
                          {tierData.tier3.data.enrichment.aiInsights?.map((insight, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{insight.title}</span>
                                <Badge variant="outline">{insight.confidence}% confidence</Badge>
                              </div>
                              <p className="text-sm text-gray-700 mb-1">{insight.description}</p>
                              <p className="text-xs text-gray-500">Source: {insight.source}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">No tier-3 data available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}