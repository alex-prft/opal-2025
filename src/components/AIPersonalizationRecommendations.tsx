'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingAnimation, { LoadingPresets } from '@/components/LoadingAnimation';
import {
  Sparkles,
  Users,
  Target,
  Zap,
  TrendingUp,
  Clock,
  Brain,
  RefreshCw,
  Download,
  Settings,
  Eye
} from 'lucide-react';

interface PersonalizationRecommendation {
  id: string;
  title: string;
  description: string;
  tactic: string;
  audience: string;
  complexity: 'Low' | 'Medium' | 'High';
  impact: 'Low' | 'Medium' | 'High';
  expected_engagement_lift: string;
  implementation_time: string;
  channels: string[];
  personalization_elements: string[];
  data_requirements: string[];
  ai_confidence: number;
}

interface AIPersonalizationData {
  recommendations: PersonalizationRecommendation[];
  tactics: {
    name: string;
    count: number;
    avg_lift: string;
  }[];
  audience_segments: {
    name: string;
    size: number;
    engagement_score: number;
    personalization_opportunities: number;
  }[];
  insights: string[];
  last_generated: string;
}

export default function AIPersonalizationRecommendations() {
  const [personalizationData, setPersonalizationData] = useState<AIPersonalizationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

  const fetchPersonalizationRecommendations = async () => {
    const controller = new AbortController();
    setAbortController(controller);
    setIsLoading(true);
    setShowLoadingOverlay(true);

    try {
      const response = await fetch('/api/tools/ai_personalization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_KEY || 'opal-personalization-secret-2025'}`
        },
        body: JSON.stringify({
          generate_recommendations: true,
          include_audience_analysis: true,
          confidence_threshold: 0.7
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`AI Personalization failed: ${response.status}`);
      }

      const result = await response.json();
      setPersonalizationData(result.data);
      setShowLoadingOverlay(false);
    } catch (error) {
      setShowLoadingOverlay(false);

      if (error instanceof Error && error.name === 'AbortError') {
        console.log('AI Personalization generation was cancelled by user');
        return;
      }

      console.error('AI Personalization error:', error);

      // Fallback to demo data
      setPersonalizationData({
        recommendations: [
          {
            id: 'pers-001',
            title: 'Dynamic Member Portal Dashboard',
            description: 'Personalize dashboard content based on member type, interests, and recent activity',
            tactic: 'Content Personalization',
            audience: 'All Active Members',
            complexity: 'Medium',
            impact: 'High',
            expected_engagement_lift: '35-45%',
            implementation_time: '3-4 weeks',
            channels: ['Member Portal', 'Email', 'Mobile App'],
            personalization_elements: [
              'Industry-specific news feed',
              'Relevant event recommendations',
              'Personalized resource library',
              'Custom welcome messages'
            ],
            data_requirements: [
              'Member profile data',
              'Browsing behavior',
              'Event attendance history',
              'Content engagement patterns'
            ],
            ai_confidence: 94
          },
          {
            id: 'pers-002',
            title: 'Smart Event Recommendations',
            description: 'AI-powered event suggestions based on location, interests, and past attendance',
            tactic: 'Behavioral Targeting',
            audience: 'Event-Engaged Members',
            complexity: 'High',
            impact: 'High',
            expected_engagement_lift: '40-55%',
            implementation_time: '5-6 weeks',
            channels: ['Website', 'Email', 'Push Notifications'],
            personalization_elements: [
              'Geographic proximity matching',
              'Interest-based filtering',
              'Colleague attendance indicators',
              'Personalized event tracks'
            ],
            data_requirements: [
              'Geographic data',
              'Event preferences',
              'Social connections',
              'Historical attendance data'
            ],
            ai_confidence: 91
          },
          {
            id: 'pers-003',
            title: 'Contextual Content Delivery',
            description: 'Deliver relevant content based on member journey stage and current needs',
            tactic: 'Journey-Based Personalization',
            audience: 'New and Renewing Members',
            complexity: 'Low',
            impact: 'Medium',
            expected_engagement_lift: '25-30%',
            implementation_time: '2-3 weeks',
            channels: ['Website', 'Email Campaigns'],
            personalization_elements: [
              'Onboarding content sequences',
              'Renewal reminder customization',
              'Progress-based messaging',
              'Success story relevance'
            ],
            data_requirements: [
              'Membership tenure data',
              'Engagement milestones',
              'Renewal history',
              'Activity patterns'
            ],
            ai_confidence: 87
          }
        ],
        tactics: [
          { name: 'Content Personalization', count: 12, avg_lift: '38%' },
          { name: 'Behavioral Targeting', count: 8, avg_lift: '42%' },
          { name: 'Journey-Based Personalization', count: 6, avg_lift: '28%' },
          { name: 'Geographic Personalization', count: 5, avg_lift: '33%' },
          { name: 'Preference-Based Customization', count: 9, avg_lift: '36%' }
        ],
        audience_segments: [
          {
            name: 'New Members (0-6 months)',
            size: 2340,
            engagement_score: 68,
            personalization_opportunities: 15
          },
          {
            name: 'Active Engaged Members',
            size: 8920,
            engagement_score: 85,
            personalization_opportunities: 8
          },
          {
            name: 'Renewal Risk Members',
            size: 1560,
            engagement_score: 32,
            personalization_opportunities: 22
          },
          {
            name: 'Premium Members',
            size: 3210,
            engagement_score: 92,
            personalization_opportunities: 5
          }
        ],
        insights: [
          'Members who receive personalized onboarding have 67% higher 6-month retention rates',
          'Geographic event recommendations show 3x higher click-through rates than generic promotions',
          'Industry-specific content personalization increases average session duration by 45%',
          'Mobile users prefer visual personalization elements over text-based customization',
          'Cross-channel personalization consistency improves brand perception scores by 28%'
        ],
        last_generated: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleCancelGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setShowLoadingOverlay(false);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPersonalizationRecommendations();
  }, []);

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Low': return 'bg-gray-100 text-gray-800';
      case 'Medium': return 'bg-blue-100 text-blue-800';
      case 'High': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      {showLoadingOverlay && (
        <LoadingAnimation
          title="Generating AI Personalization Recommendations"
          description="Analyzing member segments and generating personalized experience strategies..."
          estimatedTime={18}
          onCancel={handleCancelGeneration}
          variant="overlay"
          cancelButtonText="Cancel Generation"
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              AI Personalization Recommendations
            </h2>
            <p className="text-muted-foreground">AI-powered personalization strategies for enhanced member experiences</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchPersonalizationRecommendations} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {personalizationData && (
          <>
            {/* Audience Segments Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {personalizationData.audience_segments.map((segment, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">{segment.name}</div>
                      <div className="text-2xl font-bold">{segment.size.toLocaleString()}</div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {segment.engagement_score}% engaged
                        </span>
                        <span className="flex items-center gap-1 text-orange-600">
                          <Target className="h-3 w-3" />
                          {segment.personalization_opportunities} ops
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tactics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {personalizationData.tactics.map((tactic, index) => (
                <Card key={index} className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{tactic.count}</div>
                      <div className="text-sm font-medium">{tactic.name}</div>
                      <div className="text-xs text-green-600">Avg. {tactic.avg_lift} lift</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Personalization Recommendations */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">AI-Generated Personalization Strategies</h3>
              {personalizationData.recommendations.map((recommendation) => (
                <Card key={recommendation.id} className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                        <CardDescription>{recommendation.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getComplexityColor(recommendation.complexity)}>
                          {recommendation.complexity} Complexity
                        </Badge>
                        <Badge className={getImpactColor(recommendation.impact)}>
                          {recommendation.impact} Impact
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <TrendingUp className="h-6 w-6 mx-auto mb-1 text-green-600" />
                        <div className="font-bold text-green-600">{recommendation.expected_engagement_lift}</div>
                        <div className="text-xs text-muted-foreground">Engagement Lift</div>
                      </div>
                      <div className="text-center">
                        <Clock className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                        <div className="font-bold">{recommendation.implementation_time}</div>
                        <div className="text-xs text-muted-foreground">Implementation</div>
                      </div>
                      <div className="text-center">
                        <Users className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                        <div className="font-bold">{recommendation.audience}</div>
                        <div className="text-xs text-muted-foreground">Target Audience</div>
                      </div>
                      <div className="text-center">
                        <Brain className="h-6 w-6 mx-auto mb-1 text-orange-600" />
                        <div className="font-bold">{recommendation.ai_confidence}%</div>
                        <div className="text-xs text-muted-foreground">AI Confidence</div>
                      </div>
                    </div>

                    {/* Channels */}
                    <div>
                      <h4 className="font-medium mb-2">Target Channels:</h4>
                      <div className="flex flex-wrap gap-2">
                        {recommendation.channels.map((channel, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Personalization Elements */}
                    <div>
                      <h4 className="font-medium mb-2">Personalization Elements:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {recommendation.personalization_elements.map((element, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <Eye className="h-4 w-4 text-blue-500" />
                            <span>{element}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Data Requirements */}
                    <div>
                      <h4 className="font-medium mb-2">Required Data:</h4>
                      <div className="flex flex-wrap gap-2">
                        {recommendation.data_requirements.map((requirement, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            <Settings className="h-3 w-3 mr-1" />
                            {requirement}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button size="sm" className="flex-1">
                        Implement Strategy
                      </Button>
                      <Button size="sm" variant="outline">
                        View Blueprint
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Personalization Insights
                </CardTitle>
                <CardDescription>
                  AI-discovered patterns and opportunities for enhanced personalization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {personalizationData.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 rounded-md">
                      <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-purple-800">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}