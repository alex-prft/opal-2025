'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckSquare,
  Square,
  Target,
  TrendingUp,
  BarChart3,
  Settings,
  Users,
  Eye,
  Heart,
  Activity,
  ArrowRight,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import KPISummaryWidget from './KPISummaryWidget';
import ConfidenceGauge from './ConfidenceGauge';
import WorkflowProgress from './WorkflowProgress';
import IntegrationHealth from './IntegrationHealth';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
  effort: string;
  completed?: boolean;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  targetValue: string;
  currentValue: string;
  deadline?: string;
  progress: number;
}

interface ContentRendererProps {
  tier1Name: string;
  tier2Name?: string;
  tier3Name?: string;
  mappingType: 'Strategy Plans' | 'Optimizely DXP Tools' | 'Analytics Insights' | 'Experience Optimization';
}

export default function ContentRenderer({ tier1Name, tier2Name, tier3Name, mappingType }: ContentRendererProps) {
  // KPI accordion state - closed by default
  const [isKPIExpanded, setIsKPIExpanded] = useState(false);

  // Mock data generators based on mapping type and tier
  const generateKPIData = () => {
    switch (mappingType) {
      case 'Strategy Plans':
        return [
          { label: 'Strategy Completion', value: '68%', trend: 'up', trendValue: '+12%', target: '85%', status: 'warning' as const },
          { label: 'ROI Impact', value: '$2.4M', trend: 'up', trendValue: '+18%', target: '$3M', status: 'good' as const },
          { label: 'Time to Value', value: '45 days', trend: 'down', trendValue: '-8 days', target: '30 days', status: 'good' as const }
        ];
      case 'Optimizely DXP Tools':
        return [
          { label: 'Active Experiments', value: '12', trend: 'up', trendValue: '+3', status: 'good' as const },
          { label: 'Conversion Lift', value: '23.5%', trend: 'up', trendValue: '+5.2%', target: '25%', status: 'good' as const },
          { label: 'Content Engagement', value: '78%', trend: 'stable', trendValue: '0%', target: '80%', status: 'warning' as const }
        ];
      case 'Analytics Insights':
        return [
          { label: 'Data Quality Score', value: '92%', trend: 'up', trendValue: '+3%', target: '95%', status: 'good' as const },
          { label: 'Audience Reach', value: '145K', trend: 'up', trendValue: '+12K', status: 'good' as const },
          { label: 'Engagement Rate', value: '4.7%', trend: 'down', trendValue: '-0.3%', target: '5.5%', status: 'warning' as const }
        ];
      case 'Experience Optimization':
        return [
          { label: 'Experience Score', value: '8.2/10', trend: 'up', trendValue: '+0.4', target: '9.0', status: 'good' as const },
          { label: 'Personalization Lift', value: '31%', trend: 'up', trendValue: '+7%', target: '35%', status: 'good' as const },
          { label: 'Page Load Time', value: '1.8s', trend: 'down', trendValue: '-0.2s', target: '1.5s', status: 'warning' as const }
        ];
      default:
        return [];
    }
  };

  const generateRecommendations = (): Recommendation[] => {
    switch (mappingType) {
      case 'Strategy Plans':
        return [
          {
            id: '1',
            title: 'Implement Quick Win Optimizations',
            description: 'Focus on high-impact, low-effort improvements to boost immediate ROI',
            priority: 'high',
            impact: 'High',
            effort: 'Low'
          },
          {
            id: '2',
            title: 'Develop Phase 2 Roadmap',
            description: 'Plan next quarter strategic initiatives based on current maturity assessment',
            priority: 'medium',
            impact: 'High',
            effort: 'Medium'
          }
        ];
      case 'Analytics Insights':
        return [
          {
            id: '1',
            title: 'Enhance Semantic Analysis',
            description: 'Improve content categorization and topic modeling for better insights',
            priority: 'high',
            impact: 'Medium',
            effort: 'Medium'
          },
          {
            id: '2',
            title: 'Expand Geographic Targeting',
            description: 'Add regional analysis for better audience segmentation',
            priority: 'medium',
            impact: 'Medium',
            effort: 'High'
          }
        ];
      default:
        return [
          {
            id: '1',
            title: `Optimize ${tier2Name || tier1Name} Performance`,
            description: 'Analyze and improve key performance indicators for this section',
            priority: 'medium',
            impact: 'Medium',
            effort: 'Medium'
          }
        ];
    }
  };

  const generateGoals = (): Goal[] => {
    switch (mappingType) {
      case 'Strategy Plans':
        return [
          {
            id: '1',
            title: 'Achieve 90% Strategy Implementation',
            description: 'Complete all strategic initiatives within target timeframe',
            currentValue: '68%',
            targetValue: '90%',
            progress: 68,
            deadline: '2024-12-31'
          }
        ];
      case 'Experience Optimization':
        return [
          {
            id: '1',
            title: 'Improve Overall Experience Score',
            description: 'Enhance user experience across all touchpoints',
            currentValue: '8.2',
            targetValue: '9.0',
            progress: 82,
            deadline: '2024-11-30'
          }
        ];
      default:
        return [];
    }
  };

  const generateWorkflowSteps = () => {
    return [
      { id: '1', name: 'Data Collection', status: 'completed' as const, duration: '2m 15s' },
      { id: '2', name: 'Analysis Processing', status: 'running' as const, progress: 67 },
      { id: '3', name: 'Report Generation', status: 'pending' as const }
    ];
  };

  const generateIntegrations = () => {
    const baseIntegrations = [
      {
        id: 'opal-api',
        name: 'OPAL API',
        status: 'healthy' as const,
        lastChecked: new Date(),
        responseTime: 145,
        uptime: 99.2,
        description: 'Core OPAL API services'
      }
    ];

    switch (mappingType) {
      case 'Optimizely DXP Tools':
        return [
          ...baseIntegrations,
          {
            id: 'optimizely-web',
            name: 'Optimizely Web',
            status: 'healthy' as const,
            lastChecked: new Date(),
            responseTime: 89,
            uptime: 98.7,
            description: 'Web experimentation platform'
          },
          {
            id: 'optimizely-cms',
            name: 'Optimizely CMS',
            status: 'warning' as const,
            lastChecked: new Date(),
            responseTime: 234,
            uptime: 97.1,
            errorCount: 3,
            description: 'Content management system'
          }
        ];
      case 'Analytics Insights':
        return [
          ...baseIntegrations,
          {
            id: 'analytics-engine',
            name: 'Analytics Engine',
            status: 'healthy' as const,
            lastChecked: new Date(),
            responseTime: 67,
            uptime: 99.8,
            description: 'Data processing and insights engine'
          }
        ];
      default:
        return baseIntegrations;
    }
  };

  const kpiData = generateKPIData();
  const recommendations = generateRecommendations();
  const goals = generateGoals();
  const workflowSteps = generateWorkflowSteps();
  const integrations = generateIntegrations();

  const getIcon = (type: string) => {
    switch (type) {
      case 'Strategy Plans': return Target;
      case 'Optimizely DXP Tools': return Settings;
      case 'Analytics Insights': return BarChart3;
      case 'Experience Optimization': return TrendingUp;
      default: return Activity;
    }
  };

  const Icon = getIcon(mappingType);

  return (
    <div className="space-y-6">
      {/* KPI Summary - Accordion */}
      <div id="kpi-summary-section" className="border rounded-lg overflow-hidden">
        {/* Accordion Header */}
        <button
          onClick={() => setIsKPIExpanded(!isKPIExpanded)}
          className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-semibold text-gray-900">Key Performance Indicators</h4>
              <p className="text-sm text-gray-600">
                View current metrics and performance data
              </p>
            </div>
          </div>
          {isKPIExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>

        {/* Accordion Content */}
        {isKPIExpanded && (
          <div className="border-t bg-gray-50 p-4">
            <KPISummaryWidget
              title=""
              metrics={kpiData}
            />
          </div>
        )}
      </div>

      {/* Tier-specific content */}
      {!tier3Name && (
        <div id="tier-specific-content-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Confidence Score */}
          <div id="confidence-gauge-section">
            <ConfidenceGauge
              title="Confidence Score"
              score={mappingType === 'Analytics Insights' ? 92 : mappingType === 'Strategy Plans' ? 78 : 85}
              description={
                mappingType === 'Analytics Insights'
                  ? "High confidence in data quality and insights accuracy"
                  : mappingType === 'Strategy Plans'
                  ? "Strategic recommendations based on current analysis"
                  : "Overall system performance and reliability"
              }
              factors={[
                { name: 'Data Quality', score: 95, impact: 'high' },
                { name: 'Sample Size', score: 88, impact: 'medium' },
                { name: 'Time Range', score: 82, impact: 'low' }
              ]}
            />
          </div>

          {/* Workflow Progress */}
          <div id="workflow-progress-section">
            <WorkflowProgress
              title="Current Workflow"
              steps={workflowSteps}
              overallStatus="running"
            />
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div id="recommendations-section">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                Recommended Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <button className="mt-1">
                      {rec.completed ? (
                        <CheckSquare className="h-4 w-4 text-green-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{rec.title}</h4>
                        <Badge
                          className={
                            rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                            rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {rec.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Impact: {rec.impact}</span>
                        <span>Effort: {rec.effort}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Goals */}
      {goals.length > 0 && (
        <div id="strategic-goals-section">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Strategic Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{goal.title}</h4>
                      {goal.deadline && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {new Date(goal.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress: {goal.currentValue} / {goal.targetValue}</span>
                        <span>{goal.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Integration Health - Show for DXP Tools and Analytics */}
      {(mappingType === 'Optimizely DXP Tools' || mappingType === 'Analytics Insights') && (
        <div id="integration-health-section">
          <IntegrationHealth
            title="Integration Health"
            integrations={integrations}
          />
        </div>
      )}
    </div>
  );
}