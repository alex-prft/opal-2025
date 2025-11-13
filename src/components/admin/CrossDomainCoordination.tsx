/**
 * Cross-Domain Coordination Component
 * Manages coordination and insight sharing between different mapping domains
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  ArrowRight,
  Settings,
  Share2,
  Zap,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Network,
  TrendingUp
} from 'lucide-react';
import { MappingType } from '@/lib/schemas/consolidated-mapping-schema';

interface CoordinationSetting {
  id: string;
  source_mapping: MappingType;
  target_mapping: MappingType;
  coordination_type: 'insight_sharing' | 'kpi_alignment' | 'resource_coordination';
  is_enabled: boolean;
  priority_weight: number;
  sharing_rules: {
    insights?: string[];
    kpis?: string[];
    resources?: string[];
    frequency: 'real-time' | 'hourly' | 'daily' | 'weekly';
  };
  performance_metrics: {
    coordination_count: number;
    success_rate: number;
    avg_processing_time: number;
    last_coordination: string;
  };
}

interface DomainInsight {
  domain: MappingType;
  status: 'healthy' | 'degraded' | 'error';
  insights_shared: number;
  insights_received: number;
  coordination_score: number;
}

export function CrossDomainCoordination() {
  const [coordinationSettings, setCoordinationSettings] = useState<CoordinationSetting[]>([]);
  const [domainInsights, setDomainInsights] = useState<DomainInsight[]>([]);
  const [globalCoordinationEnabled, setGlobalCoordinationEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCoordinationData();
  }, []);

  const loadCoordinationData = async () => {
    setIsLoading(true);
    try {
      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockSettings: CoordinationSetting[] = [
        {
          id: '1',
          source_mapping: 'analytics-insights',
          target_mapping: 'experience-optimization',
          coordination_type: 'insight_sharing',
          is_enabled: true,
          priority_weight: 1.0,
          sharing_rules: {
            insights: ['engagement_patterns', 'performance_metrics'],
            frequency: 'real-time'
          },
          performance_metrics: {
            coordination_count: 1247,
            success_rate: 0.96,
            avg_processing_time: 45,
            last_coordination: '2025-11-12T11:45:00Z'
          }
        },
        {
          id: '2',
          source_mapping: 'experience-optimization',
          target_mapping: 'strategy-plans',
          coordination_type: 'kpi_alignment',
          is_enabled: true,
          priority_weight: 0.8,
          sharing_rules: {
            kpis: ['optimization_roi', 'implementation_success'],
            frequency: 'daily'
          },
          performance_metrics: {
            coordination_count: 156,
            success_rate: 0.92,
            avg_processing_time: 67,
            last_coordination: '2025-11-12T09:30:00Z'
          }
        },
        {
          id: '3',
          source_mapping: 'dxp-tools',
          target_mapping: 'experience-optimization',
          coordination_type: 'resource_coordination',
          is_enabled: true,
          priority_weight: 0.9,
          sharing_rules: {
            resources: ['api_capacity', 'processing_power'],
            frequency: 'hourly'
          },
          performance_metrics: {
            coordination_count: 89,
            success_rate: 0.94,
            avg_processing_time: 32,
            last_coordination: '2025-11-12T11:30:00Z'
          }
        },
        {
          id: '4',
          source_mapping: 'strategy-plans',
          target_mapping: 'analytics-insights',
          coordination_type: 'insight_sharing',
          is_enabled: false,
          priority_weight: 0.7,
          sharing_rules: {
            insights: ['strategic_priorities', 'business_objectives'],
            frequency: 'weekly'
          },
          performance_metrics: {
            coordination_count: 23,
            success_rate: 0.87,
            avg_processing_time: 78,
            last_coordination: '2025-11-10T14:20:00Z'
          }
        }
      ];

      const mockDomainInsights: DomainInsight[] = [
        {
          domain: 'analytics-insights',
          status: 'healthy',
          insights_shared: 1247,
          insights_received: 23,
          coordination_score: 94
        },
        {
          domain: 'experience-optimization',
          status: 'healthy',
          insights_shared: 156,
          insights_received: 1336,
          coordination_score: 96
        },
        {
          domain: 'strategy-plans',
          status: 'degraded',
          insights_shared: 23,
          insights_received: 156,
          coordination_score: 78
        },
        {
          domain: 'dxp-tools',
          status: 'healthy',
          insights_shared: 89,
          insights_received: 0,
          coordination_score: 87
        }
      ];

      setCoordinationSettings(mockSettings);
      setDomainInsights(mockDomainInsights);
    } catch (error) {
      console.error('Failed to load coordination data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCoordination = (settingId: string) => {
    setCoordinationSettings(prev =>
      prev.map(setting =>
        setting.id === settingId
          ? { ...setting, is_enabled: !setting.is_enabled }
          : setting
      )
    );
  };

  const updatePriorityWeight = (settingId: string, weight: number) => {
    setCoordinationSettings(prev =>
      prev.map(setting =>
        setting.id === settingId
          ? { ...setting, priority_weight: weight }
          : setting
      )
    );
  };

  const getMappingDisplayName = (mappingType: MappingType) => {
    const names = {
      'strategy-plans': 'Strategy Plans',
      'dxp-tools': 'DXP Tools',
      'analytics-insights': 'Analytics Insights',
      'experience-optimization': 'Experience Optimization'
    };
    return names[mappingType];
  };

  const getCoordinationTypeIcon = (type: CoordinationSetting['coordination_type']) => {
    switch (type) {
      case 'insight_sharing': return <Share2 className="h-4 w-4" />;
      case 'kpi_alignment': return <BarChart3 className="h-4 w-4" />;
      case 'resource_coordination': return <Zap className="h-4 w-4" />;
    }
  };

  const getCoordinationTypeColor = (type: CoordinationSetting['coordination_type']) => {
    switch (type) {
      case 'insight_sharing': return 'bg-blue-100 text-blue-800';
      case 'kpi_alignment': return 'bg-green-100 text-green-800';
      case 'resource_coordination': return 'bg-orange-100 text-orange-800';
    }
  };

  const getStatusIcon = (status: DomainInsight['status']) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Network className="h-8 w-8 animate-pulse mx-auto text-blue-600" />
          <p className="text-gray-600">Loading cross-domain coordination settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Cross-Domain Coordination</h2>
          <p className="text-gray-600 mt-1">
            Configure coordination and insight sharing between different mapping domains
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="global-coordination"
              checked={globalCoordinationEnabled}
              onCheckedChange={setGlobalCoordinationEnabled}
            />
            <Label htmlFor="global-coordination">Global Coordination</Label>
          </div>
          <Button variant="outline" size="sm" onClick={loadCoordinationData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Global Status Alert */}
      {!globalCoordinationEnabled && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Global cross-domain coordination is currently disabled. Individual coordination settings will not be active.
          </AlertDescription>
        </Alert>
      )}

      {/* Domain Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {domainInsights.map((domain) => (
          <Card key={domain.domain}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(domain.status)}
                  <h3 className="font-medium text-sm">{getMappingDisplayName(domain.domain)}</h3>
                </div>
                <Badge variant="outline">{domain.coordination_score}% score</Badge>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Insights Shared:</span>
                  <span className="font-medium">{domain.insights_shared}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Insights Received:</span>
                  <span className="font-medium">{domain.insights_received}</span>
                </div>
                <Progress value={domain.coordination_score} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coordination Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Network className="h-5 w-5" />
            <span>Coordination Settings</span>
          </CardTitle>
          <CardDescription>
            Configure how different mapping domains coordinate and share insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {coordinationSettings.map((setting) => (
              <div key={setting.id} className="border rounded-lg p-4 space-y-4">
                {/* Coordination Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">
                        {getMappingDisplayName(setting.source_mapping)}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-sm">
                        {getMappingDisplayName(setting.target_mapping)}
                      </span>
                    </div>

                    <Badge className={getCoordinationTypeColor(setting.coordination_type)}>
                      {getCoordinationTypeIcon(setting.coordination_type)}
                      <span className="ml-1 capitalize">
                        {setting.coordination_type.replace('_', ' ')}
                      </span>
                    </Badge>
                  </div>

                  <Switch
                    checked={setting.is_enabled && globalCoordinationEnabled}
                    onCheckedChange={() => toggleCoordination(setting.id)}
                    disabled={!globalCoordinationEnabled}
                  />
                </div>

                {/* Configuration Details */}
                {setting.is_enabled && globalCoordinationEnabled && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Priority Weight */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Priority Weight: {setting.priority_weight.toFixed(1)}
                      </Label>
                      <Slider
                        value={[setting.priority_weight]}
                        onValueChange={([value]) => updatePriorityWeight(setting.id, value)}
                        min={0.1}
                        max={2.0}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    {/* Sharing Rules */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Sharing Configuration</Label>
                      <div className="text-sm text-gray-600 space-y-1">
                        {setting.sharing_rules.insights && (
                          <div>Insights: {setting.sharing_rules.insights.join(', ')}</div>
                        )}
                        {setting.sharing_rules.kpis && (
                          <div>KPIs: {setting.sharing_rules.kpis.join(', ')}</div>
                        )}
                        {setting.sharing_rules.resources && (
                          <div>Resources: {setting.sharing_rules.resources.join(', ')}</div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Frequency: {setting.sharing_rules.frequency}</span>
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Performance</Label>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-3 w-3" />
                          <span>{(setting.performance_metrics.success_rate * 100).toFixed(1)}% success</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="h-3 w-3" />
                          <span>{setting.performance_metrics.coordination_count} coordinations</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3" />
                          <span>{setting.performance_metrics.avg_processing_time}ms avg</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Last: {new Date(setting.performance_metrics.last_coordination).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Disabled State */}
                {(!setting.is_enabled || !globalCoordinationEnabled) && (
                  <div className="text-sm text-gray-500 italic">
                    Coordination is currently disabled
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coordination Matrix Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Coordination Matrix</CardTitle>
          <CardDescription>
            Visual representation of cross-domain coordination relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2 text-sm">
            {/* Header Row */}
            <div></div>
            <div className="text-center font-medium">Strategy</div>
            <div className="text-center font-medium">DXP Tools</div>
            <div className="text-center font-medium">Analytics</div>
            <div className="text-center font-medium">Experience</div>

            {/* Matrix Rows */}
            {['strategy-plans', 'dxp-tools', 'analytics-insights', 'experience-optimization'].map((sourceType) => (
              <React.Fragment key={sourceType}>
                <div className="font-medium py-2">
                  {getMappingDisplayName(sourceType as MappingType).split(' ')[0]}
                </div>
                {['strategy-plans', 'dxp-tools', 'analytics-insights', 'experience-optimization'].map((targetType) => {
                  const coordination = coordinationSettings.find(
                    s => s.source_mapping === sourceType && s.target_mapping === targetType
                  );

                  if (sourceType === targetType) {
                    return <div key={targetType} className="bg-gray-100 rounded p-2 text-center">-</div>;
                  }

                  return (
                    <div key={targetType} className="text-center">
                      {coordination ? (
                        <div className={`rounded p-2 ${
                          coordination.is_enabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {coordination.is_enabled ? '✓' : '○'}
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded p-2">○</div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 rounded"></div>
              <span>Active coordination</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-100 rounded"></div>
              <span>Inactive coordination</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-50 rounded"></div>
              <span>No coordination configured</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}