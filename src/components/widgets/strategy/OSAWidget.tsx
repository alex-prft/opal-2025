/**
 * OSA (Optimizely Strategy Assistant) Widget
 * Comprehensive widget for OSA section with all detailed content areas
 * Implements all content suggestions for the OSA main dashboard and sub-pages
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ConfidenceGauge from '@/components/opal/ConfidenceGauge';
import {
  Target,
  TrendingUp,
  BarChart3,
  Activity,
  Clock,
  ShieldCheck,
  Database,
  Workflow,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Users,
  Calendar
} from 'lucide-react';

export interface OSAWidgetProps {
  data: any;
  context?: any;
  className?: string;
}

export function OSAWidget({ data, context, className = '' }: OSAWidgetProps) {
  // Extract data with safe defaults
  const confidenceScore = data?.confidenceScore || data?.confidence_score || 85;
  const maturityLevel = data?.maturityLevel || data?.maturity_level || 3.2;
  const roiPotential = data?.roiPotential || data?.roi_potential || 125;
  const implementationTimeline = data?.implementationTimeline || data?.implementation_timeline || 6;
  const riskScore = data?.riskScore || data?.risk_score || 2.3;

  // Strategy health metrics
  const strategyHealth = data?.strategyHealth || {
    overall: 82,
    technical: 78,
    organizational: 85,
    dataQuality: 74
  };

  // Quick navigation items based on OSA subsections
  const navigationCards = [
    {
      title: 'Overview Dashboard',
      description: 'Comprehensive strategy visualization',
      icon: BarChart3,
      href: 'overview-dashboard',
      status: 'active'
    },
    {
      title: 'Strategic Recommendations',
      description: 'AI-generated actionable recommendations',
      icon: Target,
      href: 'strategic-recommendations',
      status: 'active'
    },
    {
      title: 'Performance Metrics',
      description: 'KPI tracking and measurement framework',
      icon: TrendingUp,
      href: 'performance-metrics',
      status: 'active'
    },
    {
      title: 'Data Quality Score',
      description: 'Data health and integrity assessment',
      icon: Database,
      href: 'data-quality-score',
      status: 'active'
    },
    {
      title: 'Workflow Timeline',
      description: 'Implementation timeline and dependencies',
      icon: Workflow,
      href: 'workflow-timeline',
      status: 'active'
    }
  ];

  // Recent activity feed
  const recentActivity = data?.recentActivity || [
    {
      action: 'Strategy confidence score updated',
      timestamp: '2 minutes ago',
      type: 'update',
      confidence: 85
    },
    {
      action: 'Performance baseline established',
      timestamp: '15 minutes ago',
      type: 'milestone'
    },
    {
      action: 'Data quality assessment completed',
      timestamp: '1 hour ago',
      type: 'completion'
    }
  ];

  return (
    <div className={`osa-widget-container space-y-6 ${className}`}>
      {/* Hero Section with AI Strategy Confidence Score */}
      <Card className="osa-hero-section">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Target className="h-6 w-6 text-blue-600" />
                OSA Strategy Dashboard
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                AI-powered strategy insights with real-time confidence scoring and actionable recommendations
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <ConfidenceGauge
                title="Strategy Confidence"
                score={confidenceScore}
                description="Confidence in strategy recommendations"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Maturity Level</p>
                <p className="text-2xl font-bold text-gray-900">{maturityLevel}/5.0</p>
                <p className="text-xs text-blue-600">Advanced</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">ROI Potential</p>
                <p className="text-2xl font-bold text-gray-900">{roiPotential}%</p>
                <p className="text-xs text-green-600">12 months</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-50 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Implementation</p>
                <p className="text-2xl font-bold text-gray-900">{implementationTimeline}</p>
                <p className="text-xs text-orange-600">months</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Risk Score</p>
                <p className="text-2xl font-bold text-gray-900">{riskScore}/5.0</p>
                <p className="text-xs text-yellow-600">Low Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Overview Widget */}
      <Card className="strategy-overview-widget">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Strategy Health Overview
          </CardTitle>
          <CardDescription>
            Multi-dimensional health indicators and optimization opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(strategyHealth).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-sm text-gray-600">{value}%</span>
                </div>
                <Progress value={value} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Poor</span>
                  <span>Excellent</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Cards for Quick Access */}
      <Card className="navigation-cards-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Quick Access to Analysis Categories
          </CardTitle>
          <CardDescription>
            Navigate to detailed insights and strategic analysis areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {navigationCards.map((card, index) => (
              <Card key={index} className="nav-card hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <card.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{card.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{card.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                          {card.status}
                        </Badge>
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Feed */}
      <Card className="recent-activity-feed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Recent OPAL Workflow Updates
          </CardTitle>
          <CardDescription>
            Latest activities and workflow progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div className={`p-2 rounded-full ${
                  activity.type === 'completion' ? 'bg-green-100' :
                  activity.type === 'milestone' ? 'bg-blue-100' : 'bg-orange-100'
                }`}>
                  {activity.type === 'completion' ? (
                    <CheckCircle className={`h-4 w-4 ${
                      activity.type === 'completion' ? 'text-green-600' :
                      activity.type === 'milestone' ? 'text-blue-600' : 'text-orange-600'
                    }`} />
                  ) : activity.type === 'milestone' ? (
                    <Calendar className="h-4 w-4 text-blue-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-600">{activity.timestamp}</p>
                </div>
                {activity.confidence && (
                  <Badge variant="outline">{activity.confidence}% confidence</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integration Status */}
      <Card className="integration-status">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Integration Status
          </CardTitle>
          <CardDescription>
            Connected systems and data source health
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Optimizely DXP', status: 'connected', health: 98 },
              { name: 'Analytics', status: 'connected', health: 95 },
              { name: 'CRM Integration', status: 'connected', health: 89 },
              { name: 'Data Warehouse', status: 'syncing', health: 76 }
            ].map((integration, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{integration.name}</span>
                  <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'}>
                    {integration.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Health:</span>
                    <span>{integration.health}%</span>
                  </div>
                  <Progress value={integration.health} className="h-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}