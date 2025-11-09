'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingAnimation, { LoadingPresets } from '@/components/LoadingAnimation';
import {
  Database,
  Users,
  TrendingUp,
  BarChart3,
  Target,
  Globe,
  Calendar,
  RefreshCw,
  Download,
  Brain,
  Eye,
  Filter
} from 'lucide-react';

interface DataInsightsData {
  audience_insights: {
    total_profiles: number;
    active_segments: number;
    data_quality_score: number;
    last_sync: string;
  };
  audience_segments: Array<{
    id: string;
    name: string;
    size: number;
    growth_rate: number;
    engagement_score: number;
    key_attributes: string[];
    recommended_actions: string[];
  }>;
  behavioral_patterns: Array<{
    pattern_name: string;
    description: string;
    frequency: number;
    impact_score: number;
    recommended_strategy: string;
  }>;
  trending_attributes: Array<{
    attribute: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    change_percentage: number;
    business_implication: string;
  }>;
  data_recommendations: Array<{
    type: 'enrichment' | 'activation' | 'segmentation' | 'targeting';
    priority: 'High' | 'Medium' | 'Low';
    title: string;
    description: string;
    expected_impact: string;
    implementation_effort: 'Low' | 'Medium' | 'High';
  }>;
}

export default function DataInsightsDashboard() {
  const [insightsData, setInsightsData] = useState<DataInsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

  const fetchDataInsights = async () => {
    const controller = new AbortController();
    setAbortController(controller);
    setIsLoading(true);
    setShowLoadingOverlay(true);

    try {
      const response = await fetch('/api/tools/data_insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_KEY || 'opal-personalization-secret-2025'}`
        },
        body: JSON.stringify({
          analyze_audience: true,
          include_behavioral_patterns: true,
          include_recommendations: true
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Data Insights failed: ${response.status}`);
      }

      const result = await response.json();
      setInsightsData(result.data);
      setShowLoadingOverlay(false);
    } catch (error) {
      setShowLoadingOverlay(false);

      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Data Insights analysis was cancelled by user');
        return;
      }

      console.error('Data Insights error:', error);

      // Fallback to demo data
      setInsightsData({
        audience_insights: {
          total_profiles: 24580,
          active_segments: 18,
          data_quality_score: 87,
          last_sync: new Date().toISOString()
        },
        audience_segments: [
          {
            id: 'seg-001',
            name: 'Premium Engaged Members',
            size: 3250,
            growth_rate: 12,
            engagement_score: 94,
            key_attributes: ['High LTV', 'Frequent Event Attendee', 'Premium Tier', 'Mobile First'],
            recommended_actions: [
              'Exclusive content campaigns',
              'VIP event early access',
              'Personalized industry reports'
            ]
          },
          {
            id: 'seg-002',
            name: 'New Member Onboarders',
            size: 2890,
            growth_rate: 45,
            engagement_score: 68,
            key_attributes: ['Recent Signup', 'High Initial Activity', 'Email Responsive', 'Content Consumers'],
            recommended_actions: [
              'Structured onboarding sequence',
              'Peer connection programs',
              'Educational content paths'
            ]
          },
          {
            id: 'seg-003',
            name: 'At-Risk Renewers',
            size: 1240,
            growth_rate: -8,
            engagement_score: 32,
            key_attributes: ['Low Recent Activity', 'Overdue Renewal', 'Price Sensitive', 'Geographic Outliers'],
            recommended_actions: [
              'Win-back campaigns',
              'Value demonstration content',
              'Flexible renewal options'
            ]
          },
          {
            id: 'seg-004',
            name: 'Regional Leaders',
            size: 890,
            growth_rate: 18,
            engagement_score: 89,
            key_attributes: ['Industry Influencers', 'Event Speakers', 'High Social Engagement', 'Advocacy Potential'],
            recommended_actions: [
              'Ambassador programs',
              'Speaking opportunities',
              'Exclusive networking events'
            ]
          }
        ],
        behavioral_patterns: [
          {
            pattern_name: 'Mobile-First Engagement',
            description: 'Members increasingly prefer mobile interactions over desktop',
            frequency: 78,
            impact_score: 92,
            recommended_strategy: 'Prioritize mobile-optimized experiences and push notifications'
          },
          {
            pattern_name: 'Event-Driven Content Consumption',
            description: 'Content engagement spikes 3x around industry events',
            frequency: 65,
            impact_score: 85,
            recommended_strategy: 'Time content releases with industry calendar and event cycles'
          },
          {
            pattern_name: 'Peer Influence Networks',
            description: 'Members follow activity patterns of their geographic and industry peers',
            frequency: 72,
            impact_score: 88,
            recommended_strategy: 'Leverage social proof and peer recommendations in campaigns'
          }
        ],
        trending_attributes: [
          {
            attribute: 'Sustainability Focus',
            trend: 'increasing',
            change_percentage: 34,
            business_implication: 'Growing demand for sustainable produce practices and certification content'
          },
          {
            attribute: 'Technology Adoption',
            trend: 'increasing',
            change_percentage: 28,
            business_implication: 'Higher interest in AgTech solutions and digital transformation resources'
          },
          {
            attribute: 'Supply Chain Concerns',
            trend: 'increasing',
            change_percentage: 22,
            business_implication: 'Increased engagement with logistics and supply chain optimization content'
          },
          {
            attribute: 'Price Sensitivity',
            trend: 'decreasing',
            change_percentage: -15,
            business_implication: 'Members showing reduced price sensitivity, focusing more on value and quality'
          }
        ],
        data_recommendations: [
          {
            type: 'enrichment',
            priority: 'High',
            title: 'Enhance Behavioral Tracking',
            description: 'Implement advanced event tracking for deeper behavioral insights',
            expected_impact: '25% improvement in personalization accuracy',
            implementation_effort: 'Medium'
          },
          {
            type: 'segmentation',
            priority: 'High',
            title: 'Create Dynamic Segment Rules',
            description: 'Implement real-time segmentation based on engagement patterns',
            expected_impact: '40% increase in campaign relevance',
            implementation_effort: 'High'
          },
          {
            type: 'activation',
            priority: 'Medium',
            title: 'Cross-Channel Journey Mapping',
            description: 'Connect member interactions across web, email, and events',
            expected_impact: '30% improvement in customer journey understanding',
            implementation_effort: 'High'
          },
          {
            type: 'targeting',
            priority: 'Medium',
            title: 'Predictive Renewal Modeling',
            description: 'Build ML models to predict renewal likelihood',
            expected_impact: '20% reduction in churn risk',
            implementation_effort: 'Medium'
          }
        ]
      });
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleCancelAnalysis = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setShowLoadingOverlay(false);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDataInsights();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-green-600';
      case 'decreasing': return 'text-red-600';
      case 'stable': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '↗';
      case 'decreasing': return '↘';
      case 'stable': return '→';
      default: return '→';
    }
  };

  return (
    <>
      {showLoadingOverlay && (
        <LoadingAnimation
          title="Analyzing Data Platform Insights"
          description="Processing audience data, behavioral patterns, and generating actionable recommendations..."
          estimatedTime={20}
          onCancel={handleCancelAnalysis}
          variant="overlay"
          cancelButtonText="Cancel Analysis"
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Database className="w-6 h-6" />
              Data Platform Insights
            </h2>
            <p className="text-muted-foreground">Optimizely Data Platform audience analytics and recommendations</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchDataInsights} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {insightsData && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Profiles</p>
                      <p className="text-2xl font-bold">{insightsData.audience_insights.total_profiles.toLocaleString()}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Segments</p>
                      <p className="text-2xl font-bold">{insightsData.audience_insights.active_segments}</p>
                    </div>
                    <Target className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Data Quality</p>
                      <p className="text-2xl font-bold">{insightsData.audience_insights.data_quality_score}%</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Last Sync</p>
                      <p className="text-sm font-medium">
                        {new Date(insightsData.audience_insights.last_sync).toLocaleDateString()}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="segments" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="segments">Audience Segments</TabsTrigger>
                <TabsTrigger value="patterns">Behavioral Patterns</TabsTrigger>
                <TabsTrigger value="trends">Trending Attributes</TabsTrigger>
                <TabsTrigger value="recommendations">Data Recommendations</TabsTrigger>
              </TabsList>

              <TabsContent value="segments" className="space-y-6">
                <div className="grid gap-6">
                  {insightsData.audience_segments.map((segment) => (
                    <Card key={segment.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{segment.name}</CardTitle>
                            <CardDescription>
                              {segment.size.toLocaleString()} members • {segment.engagement_score}% engaged
                            </CardDescription>
                          </div>
                          <Badge variant={segment.growth_rate > 0 ? 'default' : 'secondary'}>
                            {segment.growth_rate > 0 ? '+' : ''}{segment.growth_rate}% growth
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Key Attributes:</h4>
                            <div className="flex flex-wrap gap-2">
                              {segment.key_attributes.map((attr, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  <Eye className="h-3 w-3 mr-1" />
                                  {attr}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Recommended Actions:</h4>
                            <ul className="space-y-1">
                              {segment.recommended_actions.map((action, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                                  <Target className="h-3 w-3 text-blue-500" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="patterns" className="space-y-6">
                <div className="grid gap-6">
                  {insightsData.behavioral_patterns.map((pattern, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{pattern.pattern_name}</h3>
                              <p className="text-muted-foreground">{pattern.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">{pattern.frequency}%</div>
                              <div className="text-xs text-muted-foreground">Frequency</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground">Impact Score</div>
                              <div className="text-xl font-bold text-green-600">{pattern.impact_score}/100</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Recommended Strategy</div>
                              <div className="text-sm font-medium">{pattern.recommended_strategy}</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="trends" className="space-y-6">
                <div className="grid gap-4">
                  {insightsData.trending_attributes.map((trend, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-medium">{trend.attribute}</h3>
                            <p className="text-sm text-muted-foreground">{trend.business_implication}</p>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${getTrendColor(trend.trend)}`}>
                              {getTrendIcon(trend.trend)} {Math.abs(trend.change_percentage)}%
                            </div>
                            <div className="text-xs text-muted-foreground capitalize">{trend.trend}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-6">
                <div className="grid gap-4">
                  {insightsData.data_recommendations.map((recommendation, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{recommendation.title}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {recommendation.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{recommendation.description}</p>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={getPriorityColor(recommendation.priority)}>
                                {recommendation.priority}
                              </Badge>
                              <Badge className={getEffortColor(recommendation.implementation_effort)}>
                                {recommendation.implementation_effort} Effort
                              </Badge>
                            </div>
                          </div>
                          <div className="bg-green-50 p-3 rounded-md">
                            <div className="text-sm font-medium text-green-800">Expected Impact:</div>
                            <div className="text-sm text-green-700">{recommendation.expected_impact}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </>
  );
}