/**
 * Experimentation Results Widget - Analytics Insights & Experience Optimization
 *
 * Provides comprehensive experimentation results following the unified Results content model
 * with confidence-based messaging, Never Blank rules, and language rules compliance.
 *
 * Used across:
 * - Analytics Insights → Experimentation (5 sub-pages)
 * - Experience Optimization → Experimentation (5 sub-pages)
 */

'use client';

import React from 'react';
import { ResultsPageBase } from '@/components/widgets/shared/ResultsPageBase';
import type { ResultsPageContent } from '@/types/results-content';
import { ensureContentNeverBlank, getConfidenceLevel } from '@/types/results-content';

export interface ExperimentationResultsWidgetProps {
  tier?: 'insights' | 'optimization';
  subPage?: string;
  experimentationData?: {
    activeExperiments?: number;
    completedTests?: number;
    successRate?: number;
    performanceImpact?: string;
    confidenceScore?: number;
    programHealth?: string;
    velocity?: number;
    testingMaturity?: string;
  };
  className?: string;
}

export function ExperimentationResultsWidget({
  tier = 'insights',
  subPage = 'dashboard',
  experimentationData,
  className = ''
}: ExperimentationResultsWidgetProps) {

  // Extract data with Never Blank rules
  const activeExperiments = ensureContentNeverBlank(
    experimentationData?.activeExperiments,
    'count'
  );

  const completedTests = ensureContentNeverBlank(
    experimentationData?.completedTests,
    'count'
  );

  const successRate = ensureContentNeverBlank(
    experimentationData?.successRate,
    'percentage'
  );

  const performanceImpact = ensureContentNeverBlank(
    experimentationData?.performanceImpact || 'Analyzing...',
    'general'
  );

  // Calculate overall confidence
  const overallConfidence = Math.max(
    experimentationData?.confidenceScore || 35,
    activeExperiments.confidence,
    completedTests.confidence,
    successRate.confidence,
    performanceImpact.confidence
  );

  const confidenceLevel = getConfidenceLevel(overallConfidence);

  // Generate tier-specific content
  const resultContent: ResultsPageContent = tier === 'insights'
    ? generateInsightsContent(
        experimentationData,
        overallConfidence,
        confidenceLevel,
        {
          activeExperiments: activeExperiments.value,
          completedTests: completedTests.value,
          successRate: successRate.value,
          performanceImpact: performanceImpact.value
        }
      )
    : generateOptimizationContent(
        experimentationData,
        overallConfidence,
        confidenceLevel,
        {
          activeExperiments: activeExperiments.value,
          completedTests: completedTests.value,
          successRate: successRate.value,
          performanceImpact: performanceImpact.value
        }
      );

  return (
    <div className={className}>
      <ResultsPageBase content={resultContent} />
    </div>
  );
}

/**
 * Generate Analytics Insights → Experimentation content
 */
function generateInsightsContent(
  data: any,
  confidence: number,
  confidenceLevel: any,
  processedData: any
): ResultsPageContent {
  return {
    hero: {
      title: 'Experimentation Analytics Insights',
      promise: 'Comprehensive analysis of experimentation program performance, test outcomes, and optimization opportunities.',
      metrics: [
        {
          label: 'Active Experiments',
          value: String(processedData.activeExperiments),
          hint: 'Currently running experiments with active data collection'
        },
        {
          label: 'Success Rate',
          value: `${processedData.successRate}`,
          hint: 'Percentage of experiments achieving statistical significance'
        },
        {
          label: 'Program Health',
          value: data?.programHealth || 'Building baseline',
          hint: 'Overall experimentation program maturity and effectiveness'
        }
      ],
      confidence,
      confidenceNote: confidenceLevel.showNote ? confidenceLevel.message : undefined
    },

    overview: {
      summary: 'Your experimentation program is generating valuable performance insights. We\'re analyzing test outcomes, success patterns, and optimization opportunities to enhance your testing strategy.',
      keyPoints: [
        'Active experiments are being monitored for statistical significance and performance impact',
        'Completed tests provide validated insights for optimization decisions',
        'Success rate tracking reveals testing effectiveness and hypothesis quality',
        'Program health assessment identifies opportunities for experimentation maturity growth'
      ]
    },

    insights: [
      {
        title: 'Experimentation Performance Patterns',
        description: 'Analysis of test execution patterns and outcome distributions',
        bullets: [
          `${processedData.activeExperiments} experiments are currently collecting data with proper statistical monitoring`,
          `${processedData.completedTests} tests have completed analysis with actionable insights generated`,
          `Success rate of ${processedData.successRate} indicates testing hypothesis quality and program effectiveness`,
          'Statistical rigor standards are being maintained across all experiment designs'
        ]
      },
      {
        title: 'Testing Program Health Assessment',
        description: 'Evaluation of overall experimentation program maturity and effectiveness',
        bullets: [
          'Experimentation velocity is being tracked to optimize testing cadence',
          'Hypothesis quality assessment reveals areas for testing strategy improvement',
          'Statistical power analysis ensures experiments have sufficient data for reliable conclusions',
          'Testing portfolio balance between quick wins and strategic bets is being monitored'
        ]
      },
      {
        title: 'Performance Impact Analysis',
        description: 'Measurement of optimization outcomes and business value from experimentation',
        bullets: [
          `Performance impact rating of ${processedData.performanceImpact} reflects optimization effectiveness`,
          'Conversion improvements are being tracked across winning experiment variations',
          'User experience enhancements from successful tests are being quantified',
          'Cross-platform testing consistency is ensuring reliable insights across channels'
        ]
      }
    ],

    opportunities: [
      {
        label: 'Accelerate experimentation velocity through streamlined hypothesis validation',
        impactLevel: 'High',
        effortLevel: 'Medium',
        confidence: 85
      },
      {
        label: 'Enhance statistical rigor in experiment design for more reliable insights',
        impactLevel: 'High',
        effortLevel: 'Low',
        confidence: 90
      },
      {
        label: 'Optimize testing portfolio balance between quick wins and strategic investments',
        impactLevel: 'Medium',
        effortLevel: 'Medium',
        confidence: 75
      },
      {
        label: 'Improve hypothesis quality through data-driven ideation frameworks',
        impactLevel: 'Medium',
        effortLevel: 'Low',
        confidence: 80
      }
    ],

    nextSteps: [
      {
        label: 'Continue monitoring active experiments for statistical significance and performance insights',
        ownerHint: 'Experimentation Team',
        timeframeHint: 'Ongoing'
      },
      {
        label: 'Analyze completed test results to identify optimization patterns and winning strategies',
        ownerHint: 'Analytics Team',
        timeframeHint: 'Weekly'
      },
      {
        label: 'Review testing velocity and program health metrics to optimize experimentation processes',
        ownerHint: 'Product Manager',
        timeframeHint: 'Bi-weekly'
      },
      {
        label: 'Implement learnings from successful experiments across relevant channels and audiences',
        ownerHint: 'Marketing Team',
        timeframeHint: 'Next 2 weeks'
      }
    ],

    meta: {
      tier: 'insights',
      agents: ['experiment_blueprinter', 'strategy_workflow'],
      maturity: data?.testingMaturity as any || 'crawl',
      lastUpdated: new Date().toISOString()
    }
  };
}

/**
 * Generate Experience Optimization → Experimentation content
 */
function generateOptimizationContent(
  data: any,
  confidence: number,
  confidenceLevel: any,
  processedData: any
): ResultsPageContent {
  return {
    hero: {
      title: 'Experimentation Optimization Results',
      promise: 'Strategic experimentation recommendations and testing roadmap optimization for maximum learning velocity and business impact.',
      metrics: [
        {
          label: 'Testing Velocity',
          value: data?.velocity ? `${data.velocity}/month` : 'Calculating...',
          hint: 'Number of experiments launched per month'
        },
        {
          label: 'Performance Impact',
          value: processedData.performanceImpact,
          hint: 'Overall optimization impact from successful experiments'
        },
        {
          label: 'Program Maturity',
          value: data?.testingMaturity || 'Foundation',
          hint: 'Experimentation program sophistication level'
        }
      ],
      confidence,
      confidenceNote: confidenceLevel.showNote ? confidenceLevel.message : undefined
    },

    overview: {
      summary: 'Your experimentation optimization strategy focuses on maximizing learning velocity while maintaining statistical rigor. We\'re identifying high-impact testing opportunities and streamlining experiment execution processes.',
      keyPoints: [
        'Testing velocity optimization balances speed with statistical validity requirements',
        'Experiment prioritization framework identifies highest-value testing opportunities',
        'Statistical rigor standards ensure reliable insights and actionable conclusions',
        'Program maturity assessment guides strategic experimentation capability development'
      ]
    },

    insights: [
      {
        title: 'Strategic Testing Opportunities',
        description: 'High-priority experimentation opportunities aligned with business objectives',
        bullets: [
          'Quick win experiments with low implementation complexity and high learning potential',
          'Strategic bet tests targeting major optimization opportunities with significant impact',
          'Hypothesis validation experiments building foundational understanding of user behavior',
          'Cross-platform coordination opportunities ensuring consistent optimization insights'
        ]
      },
      {
        title: 'Experimentation Process Optimization',
        description: 'Analysis of testing workflow efficiency and velocity enhancement opportunities',
        bullets: [
          `Current testing velocity of ${data?.velocity || 'establishing baseline'} provides foundation for optimization`,
          'Experiment design framework streamlines hypothesis development and test specification',
          'Statistical power analysis automation reduces design time while maintaining rigor',
          'Results analysis acceleration through automated statistical significance testing'
        ]
      },
      {
        title: 'Program Maturity Development',
        description: 'Strategic roadmap for advancing experimentation capabilities and sophistication',
        bullets: [
          `Current maturity phase: ${data?.testingMaturity || 'Foundation'} - building core capabilities`,
          'Statistical rigor standards established ensuring reliable experiment outcomes',
          'Multivariate testing capabilities being developed for complex optimization scenarios',
          'Cross-functional experimentation culture strengthening through knowledge sharing'
        ]
      }
    ],

    opportunities: [
      {
        label: 'Implement automated experiment design and statistical analysis pipeline',
        impactLevel: 'High',
        effortLevel: 'High',
        confidence: 85
      },
      {
        label: 'Develop multivariate testing capabilities for complex optimization challenges',
        impactLevel: 'High',
        effortLevel: 'Medium',
        confidence: 80
      },
      {
        label: 'Create cross-platform testing coordination framework for consistent insights',
        impactLevel: 'Medium',
        effortLevel: 'Medium',
        confidence: 75
      },
      {
        label: 'Build experimentation velocity optimization through process streamlining',
        impactLevel: 'Medium',
        effortLevel: 'Low',
        confidence: 90
      }
    ],

    nextSteps: [
      {
        label: 'Prioritize high-impact experimentation opportunities using strategic testing framework',
        ownerHint: 'Product Strategy Team',
        timeframeHint: 'Next week'
      },
      {
        label: 'Design experiments with statistical rigor using power analysis and hypothesis validation',
        ownerHint: 'Data Science Team',
        timeframeHint: 'Ongoing'
      },
      {
        label: 'Optimize testing velocity through process automation and workflow streamlining',
        ownerHint: 'Experimentation Team',
        timeframeHint: 'Next 3 weeks'
      },
      {
        label: 'Advance program maturity by developing advanced testing capabilities',
        ownerHint: 'Analytics Leadership',
        timeframeHint: 'Next quarter'
      }
    ],

    meta: {
      tier: 'optimization',
      agents: ['experiment_blueprinter', 'strategy_workflow'],
      maturity: data?.testingMaturity as any || 'crawl',
      lastUpdated: new Date().toISOString()
    }
  };
}

export default ExperimentationResultsWidget;
