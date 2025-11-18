'use client';

import React from 'react';
import { ResultsPageContent, createDefaultResultsContent } from '@/types/results-content';
import { ResultsPageBase } from '@/components/widgets/shared/ResultsPageBase';

export interface ContentImpactAnalysisWidgetProps {
  data?: any;
  className?: string;
}

function transformContentImpactAnalysisResults(data: any): ResultsPageContent {
  return {
    hero: {
      title: 'Content Impact Analysis',
      promise: 'Measuring content performance impact and strategic value across channels.',
      metrics: [
        { 
          label: 'Content Performance Score', 
          value: data?.performanceScore || 'Calculating...', 
          hint: 'Overall content effectiveness across channels' 
        },
        { 
          label: 'Engagement Impact Index', 
          value: data?.engagementIndex || 'Analyzing...', 
          hint: 'Content engagement and interaction measurement' 
        },
        { 
          label: 'Strategic Value Rating', 
          value: data?.strategicValue || '75/100', 
          hint: 'Content contribution to business objectives' 
        }
      ],
      confidence: data?.confidence || 65
    },
    overview: {
      summary: 'Content performance impact analysis provides strategic insights into how content contributes to business objectives, measuring engagement effectiveness and strategic value across distribution channels.',
      keyPoints: [
        'Performance measurement across multi-channel distribution',
        'Engagement impact assessment and optimization opportunities',
        'Strategic value evaluation for content initiatives',
        'Data-driven insights for content resource allocation'
      ]
    },
    insights: [
      {
        title: 'Content Performance Metrics',
        items: [
          'Top-performing content categories driving highest engagement',
          'Channel-specific performance variations and optimization opportunities',
          'Content lifecycle effectiveness and impact duration',
          'Audience segment engagement patterns across content types'
        ]
      },
      {
        title: 'Strategic Impact Assessment',
        items: [
          'Content alignment with business objectives and strategic goals',
          'Resource allocation effectiveness for content initiatives',
          'Long-term value generation from content investments',
          'Cross-channel integration impact on overall performance'
        ]
      },
      {
        title: 'Performance Optimization Areas',
        items: [
          'Content format optimization for maximum engagement',
          'Distribution timing and frequency analysis',
          'Audience targeting refinement opportunities',
          'Content quality enhancement recommendations'
        ]
      }
    ],
    opportunities: [
      {
        title: 'High-Impact Content Optimization',
        description: 'Focus optimization efforts on content categories showing highest engagement potential.',
        priority: 'high' as const,
        impact: 'Significant improvement in content effectiveness',
        effort: 'Medium implementation complexity'
      },
      {
        title: 'Channel-Specific Performance Enhancement',
        description: 'Tailor content strategies to optimize channel-specific performance strengths.',
        priority: 'high' as const,
        impact: 'Enhanced cross-channel content performance',
        effort: 'Moderate strategic adjustment required'
      },
      {
        title: 'Strategic Content Portfolio Rebalancing',
        description: 'Realign content portfolio based on strategic value and performance data.',
        priority: 'medium' as const,
        impact: 'Improved strategic alignment and effectiveness',
        effort: 'Strategic planning and content audit required'
      },
      {
        title: 'Advanced Performance Measurement',
        description: 'Implement advanced analytics for deeper content impact understanding.',
        priority: 'medium' as const,
        impact: 'Enhanced measurement capabilities and insights',
        effort: 'Technical implementation and process adjustment'
      }
    ],
    nextSteps: [
      {
        title: 'Conduct Content Performance Audit',
        description: 'Comprehensive review of current content performance across all channels.',
        timeframe: '2-3 weeks',
        complexity: 'Medium'
      },
      {
        title: 'Implement Performance Tracking Framework',
        description: 'Deploy advanced measurement tools for ongoing content impact assessment.',
        timeframe: '3-4 weeks',
        complexity: 'Medium-High'
      },
      {
        title: 'Develop Strategic Content Optimization Plan',
        description: 'Create actionable plan for optimizing high-impact content opportunities.',
        timeframe: '2-3 weeks',
        complexity: 'Medium'
      },
      {
        title: 'Execute Channel-Specific Enhancement Initiatives',
        description: 'Launch targeted optimization efforts for each distribution channel.',
        timeframe: '4-6 weeks',
        complexity: 'High'
      }
    ],
    meta: {
      tier: 'experience-optimization' as const,
      agents: ['content_impact_analysis', 'content_performance_optimization', 'strategic_content_planning'],
      maturity: 'foundation',
      lastUpdated: new Date().toISOString()
    }
  };
}

export function ContentImpactAnalysisWidget({
  data,
  className = ''
}: ContentImpactAnalysisWidgetProps) {
  const resultsContent = React.useMemo(() => {
    if (!data || Object.keys(data).length === 0) {
      return createDefaultResultsContent('experience-optimization', 'Content Impact Analysis');
    }
    return transformContentImpactAnalysisResults(data);
  }, [data]);

  return (
    <div className={`content-impact-analysis-widget ${className}`}>
      <ResultsPageBase content={resultsContent} />
    </div>
  );
}

export default ContentImpactAnalysisWidget;