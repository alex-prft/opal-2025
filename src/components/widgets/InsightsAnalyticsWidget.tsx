/**
 * Insights Analytics Widget - Content Performance Focused
 *
 * Implements standardized Insights Results with required hero metrics:
 * - Top Topic Contribution (interactions percentage)
 * - High-Value Segment Engagement (engagement rate)
 * - Content Concentration (top assets interaction share)
 *
 * Separates descriptive ("What's happening") from prescriptive ("What to do") content
 * NO revenue or currency-based metrics allowed
 */

'use client';

import React from 'react';
import { ResultsPageBase } from './shared/ResultsPageBase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TopicAnalysis } from './analytics/TopicAnalysis';
import { LanguageRulesIndicator } from '@/components/dev/LanguageRulesIndicator';
import { useInsightsLanguageRules } from '@/hooks/useLanguageRules';
import {
  ResultsPageContent,
  createDefaultResultsContent
} from '@/types/results-content';
import { OPALData } from '@/lib/widget-config';
import {
  TrendingUp,
  Users,
  Eye,
  BarChart3,
  Target,
  Zap,
  Globe
} from 'lucide-react';

export interface InsightsAnalyticsWidgetProps {
  data: OPALData;
  className?: string;
}

/**
 * Content performance metrics calculation
 */
interface ContentPerformanceMetrics {
  topTopicContribution: {
    topicName: string;
    percentage: number;
    interactionCount: number;
  };
  segmentEngagement: {
    highValueRate: number;
    segmentName: string;
    comparisonRate: number;
  };
  contentConcentration: {
    topAssetsPercentage: number;
    assetCount: number;
    totalAssets: number;
  };
}

/**
 * Calculate content performance metrics from OPAL data
 */
function calculateContentMetrics(data: OPALData): ContentPerformanceMetrics {
  const {
    analyticsData,
    contentTopics,
    topContent,
    userInteractions,
    engagementTrends
  } = data;

  // Calculate top topic contribution
  const topTopicContribution = calculateTopTopicContribution(contentTopics, userInteractions);

  // Calculate high-value segment engagement
  const segmentEngagement = calculateSegmentEngagement(analyticsData, userInteractions);

  // Calculate content concentration
  const contentConcentration = calculateContentConcentration(topContent, userInteractions);

  return {
    topTopicContribution,
    segmentEngagement,
    contentConcentration
  };
}

function calculateTopTopicContribution(contentTopics: any, userInteractions: any) {
  if (!contentTopics || !userInteractions) {
    return { topicName: 'Data Loading', percentage: 0, interactionCount: 0 };
  }

  const topics = Array.isArray(contentTopics) ? contentTopics : contentTopics.topics || [];
  const totalInteractions = userInteractions.totalInteractions || 1;

  // Find topic with highest interaction count
  const topTopic = topics.reduce((max: any, topic: any) => {
    const interactions = topic.interactions || topic.engagementCount || 0;
    return interactions > (max.interactions || 0) ? { ...topic, interactions } : max;
  }, { topicName: 'Mixed Content', interactions: 0 });

  const percentage = Math.round((topTopic.interactions / totalInteractions) * 100);

  return {
    topicName: topTopic.topicName || topTopic.name || 'Top Topic',
    percentage,
    interactionCount: topTopic.interactions
  };
}

function calculateSegmentEngagement(analyticsData: any, userInteractions: any) {
  if (!analyticsData || !userInteractions) {
    return { highValueRate: 0, segmentName: 'High-Value Users', comparisonRate: 0 };
  }

  // Calculate engagement rate for high-value segment vs overall
  const highValueEngagement = analyticsData.segmentEngagement?.highValue ||
                              analyticsData.highValueUsers?.engagementRate || 0;
  const overallEngagement = analyticsData.overallEngagementRate ||
                           userInteractions.averageEngagementRate || 0;

  return {
    highValueRate: Math.round(highValueEngagement * 100), // Convert to percentage
    segmentName: 'High-Value Segment',
    comparisonRate: Math.round(overallEngagement * 100)
  };
}

function calculateContentConcentration(topContent: any, userInteractions: any) {
  if (!topContent || !userInteractions) {
    return { topAssetsPercentage: 0, assetCount: 0, totalAssets: 0 };
  }

  const topAssets = Array.isArray(topContent) ? topContent.slice(0, 10) :
                    topContent.items?.slice(0, 10) || [];
  const totalInteractions = userInteractions.totalInteractions || 1;

  const topAssetsInteractions = topAssets.reduce((sum: number, asset: any) =>
    sum + (asset.interactions || asset.engagementCount || 0), 0);

  const percentage = Math.round((topAssetsInteractions / totalInteractions) * 100);

  return {
    topAssetsPercentage: percentage,
    assetCount: topAssets.length,
    totalAssets: userInteractions.totalContent || topAssets.length
  };
}

/**
 * Transform OPAL data into Insights Results content structure
 */
function transformInsightsData(data: OPALData): ResultsPageContent {
  const metrics = calculateContentMetrics(data);

  return {
    hero: {
      title: 'Content Performance Insights',
      promise: 'Understand what content resonates with your audience and where engagement concentrates.',
      metrics: [
        {
          label: 'Top Topic Contribution',
          value: `${metrics.topTopicContribution.percentage}%`,
          hint: `${metrics.topTopicContribution.topicName} drives interactions`
        },
        {
          label: 'High-Value Segment Engagement',
          value: `${metrics.segmentEngagement.highValueRate}%`,
          hint: `vs ${metrics.segmentEngagement.comparisonRate}% overall rate`
        },
        {
          label: 'Content Concentration',
          value: `${metrics.contentConcentration.topAssetsPercentage}%`,
          hint: `Top ${metrics.contentConcentration.assetCount} assets drive interactions`
        }
      ],
      confidence: calculateInsightsConfidence(data)
    },

    overview: {
      summary: generateInsightsOverviewSummary(metrics, data),
      keyPoints: generateInsightsKeyPoints(metrics, data)
    },

    insights: generateInsightsDescriptive(metrics, data),

    opportunities: generateInsightsOpportunities(metrics, data),

    nextSteps: generateInsightsNextSteps(metrics, data),

    meta: {
      tier: 'insights',
      agents: ['content_review', 'audience_suggester', 'geo_audit'],
      maturity: 'walk', // Insights typically in walk phase
      lastUpdated: new Date().toISOString()
    }
  };
}

function calculateInsightsConfidence(data: OPALData): number {
  // Base confidence on data completeness
  let confidence = 50;

  if (data.analyticsData) confidence += 15;
  if (data.contentTopics) confidence += 15;
  if (data.userInteractions) confidence += 15;
  if (data.topContent) confidence += 15;

  return Math.min(100, confidence);
}

function generateInsightsOverviewSummary(metrics: ContentPerformanceMetrics, data: OPALData): string {
  const topicDominance = metrics.topTopicContribution.percentage >= 40 ? 'strong topic focus' :
                        metrics.topTopicContribution.percentage >= 25 ? 'moderate topic concentration' :
                        'diverse topic engagement';

  const segmentPerformance = metrics.segmentEngagement.highValueRate >= 80 ? 'excellent high-value engagement' :
                            metrics.segmentEngagement.highValueRate >= 60 ? 'solid high-value engagement' :
                            'opportunity for high-value segment optimization';

  const concentration = metrics.contentConcentration.topAssetsPercentage >= 70 ? 'highly concentrated' :
                       metrics.contentConcentration.topAssetsPercentage >= 50 ? 'moderately concentrated' :
                       'well-distributed';

  return `Your content performance shows ${topicDominance} with ${metrics.topTopicContribution.topicName} leading engagement, ${segmentPerformance}, and ${concentration} interaction patterns across your content portfolio.`;
}

function generateInsightsKeyPoints(metrics: ContentPerformanceMetrics, data: OPALData): string[] {
  const points = [];

  // Topic concentration point
  if (metrics.topTopicContribution.percentage >= 30) {
    points.push(`${metrics.topTopicContribution.topicName} dominates engagement with ${metrics.topTopicContribution.percentage}% of interactions`);
  } else {
    points.push(`Content engagement is well-distributed across topics with ${metrics.topTopicContribution.topicName} leading`);
  }

  // Segment engagement point
  const segmentDiff = metrics.segmentEngagement.highValueRate - metrics.segmentEngagement.comparisonRate;
  if (segmentDiff > 20) {
    points.push(`High-value segment engagement significantly outperforms overall rate by ${segmentDiff}%`);
  } else if (segmentDiff > 0) {
    points.push(`High-value segment shows ${segmentDiff}% higher engagement than overall audience`);
  } else {
    points.push(`High-value segment engagement aligns with overall audience patterns`);
  }

  // Content concentration point
  if (metrics.contentConcentration.topAssetsPercentage >= 70) {
    points.push(`Content performance is concentrated: top ${metrics.contentConcentration.assetCount} assets drive ${metrics.contentConcentration.topAssetsPercentage}% of interactions`);
  } else {
    points.push(`Engagement is balanced across content portfolio with top assets contributing ${metrics.contentConcentration.topAssetsPercentage}%`);
  }

  // Engagement health point
  points.push('Content performance patterns indicate healthy audience engagement across key segments');

  return points;
}

/**
 * Generate DESCRIPTIVE insights (What's happening - no recommendations)
 */
function generateInsightsDescriptive(metrics: ContentPerformanceMetrics, data: OPALData) {
  return [
    {
      title: 'Content Engagement Patterns',
      description: 'Analysis of how users interact with different content types and topics',
      bullets: [
        `${metrics.topTopicContribution.topicName} generates the highest interaction volume`,
        'User engagement varies significantly across different content categories',
        'Interaction patterns show clear preferences for specific topic combinations'
      ]
    },
    {
      title: 'Audience Segment Performance',
      description: 'Engagement behavior analysis across different user segments',
      bullets: [
        'High-value segments display distinct engagement characteristics',
        'Engagement rates vary substantially between user segments',
        'Content resonance differs based on audience segment characteristics'
      ]
    },
    {
      title: 'Content Portfolio Analysis',
      description: 'Distribution of interactions across the content portfolio',
      bullets: [
        'Content performance follows concentration patterns typical for content portfolios',
        'Top-performing assets demonstrate significantly higher engagement rates',
        'Content interaction distribution reflects audience content preferences'
      ]
    }
  ];
}

/**
 * Generate PRESCRIPTIVE opportunities (What to do)
 */
function generateInsightsOpportunities(metrics: ContentPerformanceMetrics, data: OPALData) {
  const opportunities = [];

  // Topic-based opportunities
  if (metrics.topTopicContribution.percentage >= 40) {
    opportunities.push({
      label: `Expand content in ${metrics.topTopicContribution.topicName} to capitalize on high engagement`,
      impactLevel: 'High' as const,
      effortLevel: 'Medium' as const,
      confidence: 85
    });
  } else {
    opportunities.push({
      label: 'Develop more content in underperforming topics to balance portfolio',
      impactLevel: 'Medium' as const,
      effortLevel: 'Medium' as const,
      confidence: 75
    });
  }

  // Segment-based opportunities
  if (metrics.segmentEngagement.highValueRate < 70) {
    opportunities.push({
      label: 'Optimize content specifically for high-value segment preferences',
      impactLevel: 'High' as const,
      effortLevel: 'Low' as const,
      confidence: 80
    });
  }

  // Concentration-based opportunities
  if (metrics.contentConcentration.topAssetsPercentage >= 70) {
    opportunities.push({
      label: 'Diversify high-performing content formats to reduce concentration risk',
      impactLevel: 'Medium' as const,
      effortLevel: 'High' as const,
      confidence: 70
    });
  } else {
    opportunities.push({
      label: 'Scale successful content patterns to increase overall engagement',
      impactLevel: 'High' as const,
      effortLevel: 'Medium' as const,
      confidence: 85
    });
  }

  return opportunities;
}

/**
 * Generate prescriptive next steps
 */
function generateInsightsNextSteps(metrics: ContentPerformanceMetrics, data: OPALData) {
  return [
    {
      label: `Analyze successful elements in ${metrics.topTopicContribution.topicName} content for replication`,
      ownerHint: 'Content Team',
      timeframeHint: 'Next 2 weeks'
    },
    {
      label: 'Create content specifically targeting high-value segment preferences',
      ownerHint: 'Marketing Team',
      timeframeHint: 'Next month'
    },
    {
      label: 'Review and optimize underperforming content based on engagement patterns',
      ownerHint: 'Content Manager',
      timeframeHint: 'Next 3 weeks'
    },
    {
      label: 'Establish content performance monitoring and alerting system',
      ownerHint: 'Analytics Team',
      timeframeHint: 'Next 6 weeks'
    }
  ];
}

/**
 * Main Insights Analytics Widget Component
 */
export function InsightsAnalyticsWidget({ data, className = '' }: InsightsAnalyticsWidgetProps) {
  // Transform data to Results content model
  const resultsContent = React.useMemo(() => {
    if (!data || Object.keys(data).length === 0) {
      return createDefaultResultsContent('insights', 'Content Performance Insights');
    }
    return transformInsightsData(data);
  }, [data]);

  // Language rules validation with insights-specific checks
  const { validateInsightsSeparation } = useInsightsLanguageRules();

  const separationValidation = React.useMemo(() => {
    const descriptiveContent = resultsContent.insights.flatMap(i =>
      [i.title, i.description, ...i.bullets]
    );
    const prescriptiveContent = [
      ...resultsContent.opportunities.map(o => o.label),
      ...resultsContent.nextSteps.map(s => s.label)
    ];

    return validateInsightsSeparation({
      descriptive: descriptiveContent,
      prescriptive: prescriptiveContent
    });
  }, [resultsContent, validateInsightsSeparation]);

  // Custom sections for Insights-specific content
  const customSections = (
    <div className="space-y-6">
      {/* Content Performance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Detailed Content Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="topics" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="topics">Topic Performance</TabsTrigger>
              <TabsTrigger value="segments">Segment Analysis</TabsTrigger>
              <TabsTrigger value="content">Content Portfolio</TabsTrigger>
            </TabsList>

            <TabsContent value="topics">
              {data.contentTopics ? (
                <TopicAnalysis topicsData={data.contentTopics} />
              ) : (
                <div className="p-8 text-center text-gray-600">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="font-medium mb-2">Topic Analysis In Progress</h3>
                  <p className="text-sm">
                    Topic performance data will appear here as content analysis completes.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="segments">
              <div className="space-y-4">
                {data.analyticsData?.segmentData ? (
                  <div>
                    {/* Segment engagement metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">High-Value Segment</p>
                              <p className="text-2xl font-bold text-blue-600">
                                {resultsContent.hero.metrics[1]?.value}
                              </p>
                            </div>
                            <Users className="h-8 w-8 text-blue-500" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Overall Engagement</p>
                              <p className="text-2xl font-bold text-gray-600">
                                {calculateContentMetrics(data).segmentEngagement.comparisonRate}%
                              </p>
                            </div>
                            <Globe className="h-8 w-8 text-gray-500" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-600">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="font-medium mb-2">Segment Analysis Loading</h3>
                    <p className="text-sm">
                      Audience segment data will display here as analysis completes.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="content">
              <div className="space-y-4">
                {data.topContent ? (
                  <div>
                    <h4 className="font-medium mb-3">Top Performing Content</h4>
                    <div className="space-y-2">
                      {(Array.isArray(data.topContent) ? data.topContent : data.topContent.items || [])
                        .slice(0, 5)
                        .map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{item.title || item.name || `Content ${index + 1}`}</p>
                            <p className="text-xs text-gray-600">{item.type || 'Content'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-600">
                              {(item.interactions || item.engagementCount || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-600">interactions</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-600">
                    <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="font-medium mb-2">Content Analysis In Progress</h3>
                    <p className="text-sm">
                      Content performance rankings will appear here as data accumulates.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Descriptive vs Prescriptive Separation Indicator (Development) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-sm text-blue-800">Insights Content Separation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Badge variant="outline" className="mb-2">Descriptive (What's happening)</Badge>
                <p className="text-blue-700">Overview + Insights sections</p>
                <p className="text-xs text-blue-600 mt-1">
                  Score: {separationValidation.descriptive.score}%
                </p>
              </div>
              <div>
                <Badge variant="default" className="mb-2">Prescriptive (What to do)</Badge>
                <p className="text-blue-700">Opportunities + Next Steps sections</p>
                <p className="text-xs text-blue-600 mt-1">
                  Score: {separationValidation.prescriptive.score}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className={className}>
      <ResultsPageBase
        content={resultsContent}
        customSections={customSections}
      />

      {/* Development Language Rules Indicator */}
      <LanguageRulesIndicator
        content={resultsContent}
        componentName="InsightsAnalyticsWidget"
        className="mt-4"
      />
    </div>
  );
}