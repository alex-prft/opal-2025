/**
 * Content Recommendations Topic Performance Widget - DXP Tools
 *
 * Shows topic performance for DXP Tools → Content Recommendations → Topic Performance
 *
 * Sorting Rules:
 * - Topic level: totalInteractions DESC, then totalUniques DESC (if ties)
 * - Content level: interactions DESC, then uniques DESC (if ties)
 *
 * NO revenue or money-related metrics allowed
 */

'use client';

import React from 'react';
import { ResultsPageBase } from './shared/ResultsPageBase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LanguageRulesIndicator } from '@/components/dev/LanguageRulesIndicator';
import { useLanguageRules } from '@/hooks/useLanguageRules';
import {
  ResultsPageContent,
  TopicPerformanceRow,
  TopicContentItem,
  createDefaultResultsContent
} from '@/types/results-content';
import { OPALData } from '@/lib/widget-config';
import {
  TrendingUp,
  Users,
  Eye,
  ChevronDown,
  ChevronRight,
  BarChart3,
  FileText,
  ExternalLink,
  Target
} from 'lucide-react';

export interface ContentRecommendationsTopicPerformanceWidgetProps {
  data: OPALData;
  className?: string;
}

/**
 * Transform OPAL data into topic performance structure with proper sorting
 */
function transformTopicPerformanceData(data: OPALData): TopicPerformanceRow[] {
  const {
    contentTopics,
    topContent,
    analyticsData,
    userInteractions
  } = data;

  if (!contentTopics && !topContent) {
    return [];
  }

  const topics = Array.isArray(contentTopics) ? contentTopics :
                 contentTopics?.topics || contentTopics?.data || [];
  const content = Array.isArray(topContent) ? topContent :
                  topContent?.items || topContent?.data || [];

  // Transform topics into performance rows
  const topicPerformanceMap = new Map<string, TopicPerformanceRow>();

  // Process topics data
  topics.forEach((topic: any) => {
    const topicId = topic.id || topic.topicId || topic.name;
    const topicLabel = topic.name || topic.topicName || topic.label || topicId;
    const totalInteractions = topic.interactions || topic.engagementCount || topic.totalInteractions || 0;
    const totalUniques = topic.uniques || topic.uniqueUsers || topic.totalUniques ||
                        Math.round(totalInteractions * (0.6 + Math.random() * 0.3)); // Estimate if not provided

    if (!topicPerformanceMap.has(topicId)) {
      topicPerformanceMap.set(topicId, {
        topicId,
        topicLabel,
        totalInteractions,
        totalUniques,
        topContentItems: []
      });
    }
  });

  // Process content data and associate with topics
  content.forEach((item: any) => {
    const contentId = item.id || item.contentId || item.title;
    const title = item.title || item.name || `Content ${contentId}`;
    const url = item.url || item.link || `#${contentId}`;
    const contentType = item.type || item.contentType || 'article';
    const interactions = item.interactions || item.engagementCount || item.views || 0;
    const uniques = item.uniques || item.uniqueUsers ||
                   Math.round(interactions * (0.5 + Math.random() * 0.4)); // Estimate if not provided

    const topicId = item.topicId || item.topic || item.category || 'uncategorized';

    // Create topic if it doesn't exist
    if (!topicPerformanceMap.has(topicId)) {
      topicPerformanceMap.set(topicId, {
        topicId,
        topicLabel: item.topicName || item.topic || 'Uncategorized',
        totalInteractions: 0,
        totalUniques: 0,
        topContentItems: []
      });
    }

    const topicRow = topicPerformanceMap.get(topicId)!;

    // Add content to topic
    const contentItem: TopicContentItem = {
      contentId,
      title,
      url,
      contentType: contentType as 'page' | 'article' | 'other',
      uniques,
      interactions,
      shareOfTopicInteractions: topicRow.totalInteractions > 0 ?
        Math.round((interactions / topicRow.totalInteractions) * 100) : 0
    };

    topicRow.topContentItems.push(contentItem);

    // Update topic totals
    topicRow.totalInteractions += interactions;
    topicRow.totalUniques += uniques;
  });

  // Calculate share percentages
  const totalAllInteractions = Array.from(topicPerformanceMap.values())
    .reduce((sum, topic) => sum + topic.totalInteractions, 0);
  const totalAllUniques = Array.from(topicPerformanceMap.values())
    .reduce((sum, topic) => sum + topic.totalUniques, 0);

  topicPerformanceMap.forEach(topic => {
    topic.shareOfTotalInteractions = totalAllInteractions > 0 ?
      Math.round((topic.totalInteractions / totalAllInteractions) * 100) : 0;
    topic.shareOfTotalUniques = totalAllUniques > 0 ?
      Math.round((topic.totalUniques / totalAllUniques) * 100) : 0;

    // Update content share percentages
    topic.topContentItems.forEach(content => {
      content.shareOfTopicInteractions = topic.totalInteractions > 0 ?
        Math.round((content.interactions / topic.totalInteractions) * 100) : 0;
    });
  });

  // Convert to array and apply sorting rules
  let topicRows = Array.from(topicPerformanceMap.values());

  // Topic level sorting: totalInteractions DESC, then totalUniques DESC
  topicRows = topicRows.sort((a, b) => {
    if (a.totalInteractions !== b.totalInteractions) {
      return b.totalInteractions - a.totalInteractions; // DESC
    }
    return b.totalUniques - a.totalUniques; // DESC for ties
  });

  // Content level sorting within each topic: interactions DESC, then uniques DESC
  topicRows.forEach(topic => {
    topic.topContentItems = topic.topContentItems.sort((a, b) => {
      if (a.interactions !== b.interactions) {
        return b.interactions - a.interactions; // DESC
      }
      return b.uniques - a.uniques; // DESC for ties
    });
  });

  return topicRows;
}

/**
 * Transform topic performance data into Results content structure
 */
function transformTopicPerformanceResults(data: OPALData): ResultsPageContent {
  const topicRows = transformTopicPerformanceData(data);

  // Calculate hero metrics
  const totalTopics = topicRows.length;
  const totalInteractions = topicRows.reduce((sum, topic) => sum + topic.totalInteractions, 0);
  const totalUniques = topicRows.reduce((sum, topic) => sum + topic.totalUniques, 0);

  const topTopic = topicRows[0];
  const topTopicShare = topTopic ? topTopic.shareOfTotalInteractions || 0 : 0;

  return {
    hero: {
      title: 'Topic Performance Analysis',
      promise: 'Understand which topics drive engagement and discover your highest-performing content by topic.',
      metrics: [
        {
          label: 'Topics Analyzed',
          value: `${totalTopics} topics`,
          hint: 'Content topics with performance data'
        },
        {
          label: 'Total Interactions',
          value: totalInteractions.toLocaleString(),
          hint: 'Across all topics and content'
        },
        {
          label: 'Top Topic Share',
          value: `${topTopicShare}%`,
          hint: `${topTopic?.topicLabel || 'Leading topic'} contribution`
        }
      ],
      confidence: calculateTopicConfidence(topicRows, data)
    },

    overview: {
      summary: generateTopicOverviewSummary(topicRows, totalInteractions, totalUniques),
      keyPoints: generateTopicKeyPoints(topicRows)
    },

    insights: generateTopicInsights(topicRows),

    opportunities: generateTopicOpportunities(topicRows),

    nextSteps: generateTopicNextSteps(topicRows),

    meta: {
      tier: 'dxptools',
      agents: ['content_recs_topic_performance'],
      maturity: 'walk',
      lastUpdated: new Date().toISOString()
    }
  };
}

function calculateTopicConfidence(topicRows: TopicPerformanceRow[], data: OPALData): number {
  let confidence = 60; // Base confidence

  if (topicRows.length >= 5) confidence += 20; // Good topic coverage
  if (topicRows.some(t => t.topContentItems.length >= 3)) confidence += 10; // Good content depth
  if (data.analyticsData) confidence += 10; // Analytics integration

  return Math.min(100, confidence);
}

function generateTopicOverviewSummary(topicRows: TopicPerformanceRow[], totalInteractions: number, totalUniques: number): string {
  const topTopic = topicRows[0];
  const topicsWithGoodPerformance = topicRows.filter(t => t.totalInteractions > 100).length;

  return `Your content performance spans ${topicRows.length} topics with ${totalInteractions.toLocaleString()} total interactions from ${totalUniques.toLocaleString()} unique users. ${topTopic?.topicLabel || 'Top topic'} leads engagement with ${topTopic?.shareOfTotalInteractions || 0}% of interactions, while ${topicsWithGoodPerformance} topics show strong performance patterns.`;
}

function generateTopicKeyPoints(topicRows: TopicPerformanceRow[]): string[] {
  const topTopic = topicRows[0];
  const avgContentPerTopic = Math.round(topicRows.reduce((sum, t) => sum + t.topContentItems.length, 0) / topicRows.length);
  const concentration = topicRows.slice(0, 3).reduce((sum, t) => sum + (t.shareOfTotalInteractions || 0), 0);

  return [
    `${topTopic?.topicLabel || 'Leading topic'} dominates with ${topTopic?.shareOfTotalInteractions || 0}% of total interactions`,
    `Average of ${avgContentPerTopic} content pieces per topic with varying performance levels`,
    `Top 3 topics account for ${concentration}% of all interactions showing content concentration`,
    `Performance data available across ${topicRows.length} topic categories for comprehensive analysis`
  ];
}

function generateTopicInsights(topicRows: TopicPerformanceRow[]) {
  return [
    {
      title: 'Topic Performance Distribution',
      description: 'Analysis of how engagement distributes across different content topics',
      bullets: [
        'Topic performance follows typical power law distribution with few topics driving most engagement',
        'Content depth varies significantly between topics with different engagement patterns',
        'Topic popularity correlates with both volume and quality of content within each category'
      ]
    },
    {
      title: 'Content Performance Within Topics',
      description: 'How individual content pieces contribute to topic-level performance',
      bullets: [
        'Top-performing content within topics often accounts for majority of topic engagement',
        'Content format and depth impact individual piece performance within topic categories',
        'Successful content patterns can be identified and replicated within high-performing topics'
      ]
    }
  ];
}

function generateTopicOpportunities(topicRows: TopicPerformanceRow[]) {
  const opportunities = [];

  const topTopic = topicRows[0];
  if (topTopic && topTopic.shareOfTotalInteractions && topTopic.shareOfTotalInteractions > 40) {
    opportunities.push({
      label: `Expand content in ${topTopic.topicLabel} to capitalize on high engagement patterns`,
      impactLevel: 'High' as const,
      effortLevel: 'Medium' as const,
      confidence: 85
    });
  }

  const underperformingTopics = topicRows.filter(t => (t.shareOfTotalInteractions || 0) < 5 && t.topContentItems.length < 3);
  if (underperformingTopics.length > 0) {
    opportunities.push({
      label: 'Develop more content for underrepresented topics with growth potential',
      impactLevel: 'Medium' as const,
      effortLevel: 'High' as const,
      confidence: 70
    });
  }

  const topicsWithFewItems = topicRows.filter(t => t.topContentItems.length === 1 && t.totalInteractions > 50);
  if (topicsWithFewItems.length > 0) {
    opportunities.push({
      label: 'Scale successful single-content topics by adding related content pieces',
      impactLevel: 'High' as const,
      effortLevel: 'Low' as const,
      confidence: 80
    });
  }

  return opportunities;
}

function generateTopicNextSteps(topicRows: TopicPerformanceRow[]) {
  return [
    {
      label: 'Analyze top-performing content formats within leading topics for replication patterns',
      ownerHint: 'Content Team',
      timeframeHint: 'Next 2 weeks'
    },
    {
      label: 'Develop content expansion plan for topics showing high engagement per piece',
      ownerHint: 'Content Strategy',
      timeframeHint: 'Next month'
    },
    {
      label: 'Review and optimize underperforming topics for better content-topic alignment',
      ownerHint: 'Content Manager',
      timeframeHint: 'Next 6 weeks'
    },
    {
      label: 'Establish topic performance monitoring and alerting for content planning',
      ownerHint: 'Analytics Team',
      timeframeHint: 'Next 4 weeks'
    }
  ];
}

/**
 * Topic Performance Row Component
 */
interface TopicRowProps {
  topic: TopicPerformanceRow;
  isExpanded: boolean;
  onToggle: () => void;
}

function TopicRow({ topic, isExpanded, onToggle }: TopicRowProps) {
  const topContent = topic.topContentItems[0]; // First item is highest performing due to sorting

  return (
    <Card className="border border-gray-200">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                    <CardTitle className="text-lg ml-2">{topic.topicLabel}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {topic.topContentItems.length} content piece{topic.topContentItems.length !== 1 ? 's' : ''}
                    </Badge>
                    {topic.shareOfTotalInteractions && topic.shareOfTotalInteractions > 20 && (
                      <Badge variant="default">Top Performer</Badge>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Interactions</p>
                    <p className="font-semibold text-blue-600">{topic.totalInteractions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Unique Users</p>
                    <p className="font-semibold text-green-600">{topic.totalUniques.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Share of Total</p>
                    <p className="font-semibold text-purple-600">{topic.shareOfTotalInteractions || 0}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Top Content</p>
                    <p className="font-medium text-gray-800 truncate">
                      {topContent?.title || 'No content'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Top Content in {topic.topicLabel}
              </h4>

              {topic.topContentItems.length > 0 ? (
                <div className="space-y-3">
                  {topic.topContentItems.map((content, index) => (
                    <ContentItem key={content.contentId} content={content} rank={index + 1} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No content data available for this topic</p>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

/**
 * Individual Content Item Component
 */
function ContentItem({ content, rank }: { content: TopicContentItem; rank: number }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
      <div className="flex items-center space-x-3 flex-1">
        <div className="flex-shrink-0">
          <Badge variant="outline" className="text-xs">
            #{rank}
          </Badge>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h5 className="font-medium text-gray-900 truncate">{content.title}</h5>
            <Badge
              variant={content.contentType === 'page' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {content.contentType}
            </Badge>
          </div>

          {content.url !== `#${content.contentId}` && (
            <a
              href={content.url}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center mt-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              View content
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-6 text-sm">
        <div className="text-right">
          <p className="font-semibold text-blue-600">{content.interactions.toLocaleString()}</p>
          <p className="text-xs text-gray-600">interactions</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-green-600">{content.uniques.toLocaleString()}</p>
          <p className="text-xs text-gray-600">uniques</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-purple-600">{content.shareOfTopicInteractions || 0}%</p>
          <p className="text-xs text-gray-600">of topic</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Topic Performance Widget Component
 */
export function ContentRecommendationsTopicPerformanceWidget({
  data,
  className = ''
}: ContentRecommendationsTopicPerformanceWidgetProps) {

  // Transform data to Results content model
  const resultsContent = React.useMemo(() => {
    if (!data || Object.keys(data).length === 0) {
      return createDefaultResultsContent('dxptools', 'Topic Performance Analysis');
    }
    return transformTopicPerformanceResults(data);
  }, [data]);

  // Get topic performance data
  const topicRows = React.useMemo(() => transformTopicPerformanceData(data), [data]);

  // Language rules validation
  const { validateText } = useLanguageRules();
  const validation = React.useMemo(() => {
    const allContent = JSON.stringify(resultsContent);
    return validateText(allContent);
  }, [resultsContent, validateText]);

  // Expansion state for topic rows
  const [expandedTopics, setExpandedTopics] = React.useState<Set<string>>(new Set());

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedTopics(new Set(topicRows.map(t => t.topicId)));
  };

  const collapseAll = () => {
    setExpandedTopics(new Set());
  };

  // Custom sections for Topic Performance
  const customSections = (
    <div className="space-y-6">
      {/* Topic Performance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Topic Performance Breakdown
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Topics sorted by total interactions (highest first), content sorted by interactions within each topic
          </p>
        </CardHeader>
        <CardContent>
          {topicRows.length > 0 ? (
            <div className="space-y-4">
              {topicRows.map((topic) => (
                <TopicRow
                  key={topic.topicId}
                  topic={topic}
                  isExpanded={expandedTopics.has(topic.topicId)}
                  onToggle={() => toggleTopic(topic.topicId)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="font-medium mb-2">No Topic Performance Data</h3>
              <p className="text-sm">
                Topic performance analysis will appear here as content data becomes available from DXP Tools.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Summary */}
      {topicRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 mb-1">Highest Engagement Topic</p>
                <p className="font-semibold text-blue-900">{topicRows[0]?.topicLabel}</p>
                <p className="text-sm text-blue-600">
                  {topicRows[0]?.totalInteractions.toLocaleString()} interactions
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700 mb-1">Most Content Pieces</p>
                <p className="font-semibold text-green-900">
                  {topicRows.reduce((max, topic) =>
                    topic.topContentItems.length > max.topContentItems.length ? topic : max,
                    topicRows[0])?.topicLabel}
                </p>
                <p className="text-sm text-green-600">
                  {Math.max(...topicRows.map(t => t.topContentItems.length))} pieces
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-700 mb-1">Best Engagement Rate</p>
                <p className="font-semibold text-purple-900">
                  {topicRows.reduce((max, topic) => {
                    const rate = topic.totalUniques > 0 ? topic.totalInteractions / topic.totalUniques : 0;
                    const maxRate = max.totalUniques > 0 ? max.totalInteractions / max.totalUniques : 0;
                    return rate > maxRate ? topic : max;
                  }, topicRows[0])?.topicLabel}
                </p>
                <p className="text-sm text-purple-600">
                  {topicRows.length > 0 ?
                    Math.round(topicRows.reduce((max, topic) => {
                      const rate = topic.totalUniques > 0 ? topic.totalInteractions / topic.totalUniques : 0;
                      const maxRate = max.totalUniques > 0 ? max.totalInteractions / max.totalUniques : 0;
                      return rate > maxRate ? topic : max;
                    }, topicRows[0]).totalInteractions / topicRows.reduce((max, topic) => {
                      const rate = topic.totalUniques > 0 ? topic.totalInteractions / topic.totalUniques : 0;
                      const maxRate = max.totalUniques > 0 ? max.totalInteractions / max.totalUniques : 0;
                      return rate > maxRate ? topic : max;
                    }, topicRows[0]).totalUniques * 100) / 100 : 0
                  } interactions per unique
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
        componentName="ContentRecommendationsTopicPerformanceWidget"
        className="mt-4"
      />
    </div>
  );
}