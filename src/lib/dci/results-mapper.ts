/**
 * OSA Results to ResultsPageContent Mapper
 *
 * Maps comprehensive OSAResults from DCI Orchestrator to the existing
 * ResultsPageContent format used by the UI components, ensuring backward
 * compatibility while leveraging enhanced DCI insights.
 */

import {
  OSAResults,
  ResultsQualityScore
} from '@/types/dci-orchestrator';

import {
  ResultsPageContent,
  ResultsPageMetric,
  ResultsPageOpportunity,
  ResultsPageNextStep,
  validateLanguageRules,
  ensureContentNeverBlank
} from '@/types/results-content';

// =============================================================================
// Main Mapping Function
// =============================================================================

/**
 * Convert OSAResults to existing ResultsPageContent format
 * Maps based on tier to focus on most relevant sections
 */
export function mapOSAResultsToResultsPageContent(
  osaResults: OSAResults,
  tier: 'strategy' | 'insights' | 'optimization' | 'dxptools',
  qualityScore?: ResultsQualityScore
): ResultsPageContent {

  const confidence = calculateOverallConfidence(osaResults, qualityScore);

  // Map hero section based on tier focus
  const hero = mapHeroSection(osaResults, tier, confidence);

  // Map overview section with business impact focus
  const overview = mapOverviewSection(osaResults, tier);

  // Map insights section with tier-specific data observations
  const insights = mapInsightsSection(osaResults, tier);

  // Map opportunities from all sections, prioritized by tier relevance
  const opportunities = mapOpportunitiesSection(osaResults, tier);

  // Map next steps with concrete implementation guidance
  const nextSteps = mapNextStepsSection(osaResults, tier);

  // Prepare meta information
  const meta = {
    tier,
    agents: extractRelevantAgents(osaResults, tier),
    maturity: osaResults.meta.maturityPhase,
    lastUpdated: osaResults.meta.generationTimestamp
  };

  return {
    hero,
    overview,
    insights,
    opportunities,
    nextSteps,
    meta
  };
}

// =============================================================================
// Hero Section Mapping
// =============================================================================

function mapHeroSection(
  osaResults: OSAResults,
  tier: 'strategy' | 'insights' | 'optimization' | 'dxptools',
  confidence: number
): ResultsPageContent['hero'] {

  const tierConfigs = {
    strategy: {
      title: `${osaResults.meta.orgName || 'Organization'} Strategic Roadmap`,
      promise: 'Comprehensive strategic plan with phased implementation timeline and milestone tracking.',
      metricsSource: () => [
        {
          label: 'Strategy Phases',
          value: osaResults.strategyPlans.phasePlan.length.toString(),
          hint: `${osaResults.meta.maturityPhase} phase focus with ${osaResults.strategyPlans.phasePlan.length} planned phases`
        },
        {
          label: 'Roadmap Items',
          value: osaResults.strategyPlans.roadmapItems.length.toString(),
          hint: `${osaResults.strategyPlans.roadmapItems.length} prioritized initiatives across focus areas`
        },
        {
          label: 'Focus Areas',
          value: extractUniqueFocusAreas(osaResults).length.toString(),
          hint: 'Strategic focus areas: content, analytics, experience, planning'
        }
      ]
    },

    insights: {
      title: 'Analytics Insights & Performance Analysis',
      promise: 'Data-driven insights identifying optimization opportunities and performance patterns.',
      metricsSource: () => [
        {
          label: 'Key Findings',
          value: osaResults.analyticsInsights.keyFindings.length.toString(),
          hint: `${osaResults.analyticsInsights.keyFindings.length} analytical insights with actionable recommendations`
        },
        {
          label: 'Data Sources',
          value: getDataSourcesCount(osaResults).toString(),
          hint: `Integrated data from ${getDataSourcesCount(osaResults)} analytical sources`
        },
        {
          label: 'High Confidence',
          value: getHighConfidenceInsightsCount(osaResults).toString(),
          hint: `${getHighConfidenceInsightsCount(osaResults)} insights with high confidence scores`
        }
      ]
    },

    optimization: {
      title: 'Experience Optimization Opportunities',
      promise: 'Systematic optimization recommendations across content, experimentation, and user experience.',
      metricsSource: () => [
        {
          label: 'Content Actions',
          value: osaResults.contentImprovements.prioritizedActions.length.toString(),
          hint: `${osaResults.contentImprovements.prioritizedActions.length} prioritized content improvement actions`
        },
        {
          label: 'Experiments',
          value: osaResults.experienceTactics.experiments.length.toString(),
          hint: `${osaResults.experienceTactics.experiments.length} experiment recommendations for systematic testing`
        },
        {
          label: 'Quick Wins',
          value: getQuickWinsCount(osaResults).toString(),
          hint: `${getQuickWinsCount(osaResults)} low-effort, high-impact optimization opportunities`
        }
      ]
    },

    dxptools: {
      title: 'DXP Tools Integration & Performance',
      promise: 'Optimizely DXP tools analysis with integration health and performance optimization.',
      metricsSource: () => [
        {
          label: 'Active Tools',
          value: osaResults.meta.optiStack.length.toString(),
          hint: `${osaResults.meta.optiStack.length} Optimizely tools in active use`
        },
        {
          label: 'Personalization',
          value: osaResults.experienceTactics.personalizationUseCases.length.toString(),
          hint: `${osaResults.experienceTactics.personalizationUseCases.length} personalization use cases identified`
        },
        {
          label: 'Integration Health',
          value: confidence > 70 ? 'Good' : confidence > 50 ? 'Fair' : 'Needs Attention',
          hint: `DXP tools integration health based on data quality and performance`
        }
      ]
    }
  };

  const config = tierConfigs[tier];

  return {
    title: config.title,
    promise: config.promise,
    metrics: config.metricsSource(),
    confidence,
    confidenceNote: confidence < 60 ? 'Building confidence as comprehensive data accumulates and analysis deepens.' : undefined
  };
}

// =============================================================================
// Overview Section Mapping
// =============================================================================

function mapOverviewSection(
  osaResults: OSAResults,
  tier: 'strategy' | 'insights' | 'optimization' | 'dxptools'
): ResultsPageContent['overview'] {

  const tierOverviews = {
    strategy: {
      summary: osaResults.strategyPlans.narrativeSummary,
      keyPoints: [
        `Strategic roadmap spans ${osaResults.strategyPlans.phasePlan.length} phases with ${osaResults.meta.maturityPhase} phase priority`,
        `${osaResults.strategyPlans.roadmapItems.length} prioritized initiatives aligned with business goals`,
        `Focus areas include ${extractUniqueFocusAreas(osaResults).join(', ').toLowerCase()}`,
        `Success metrics tied to ${osaResults.meta.primaryKpis.join(', ')} performance indicators`
      ]
    },

    insights: {
      summary: osaResults.analyticsInsights.overview,
      keyPoints: [
        `${osaResults.analyticsInsights.keyFindings.length} key analytical findings with actionable insights`,
        `Data integration from ${getDataSourcesCount(osaResults)} sources including ${getDataSourcesList(osaResults).join(', ')}`,
        `${getHighConfidenceInsightsCount(osaResults)} high-confidence insights ready for immediate action`,
        `Analytics tracking aligned with ${osaResults.meta.primaryKpis.join(', ')} KPI measurement`
      ]
    },

    optimization: {
      summary: `Experience optimization analysis has identified ${osaResults.contentImprovements.prioritizedActions.length} content improvement opportunities and ${osaResults.experienceTactics.experiments.length} experiment recommendations to enhance user experience and performance.`,
      keyPoints: [
        `${osaResults.contentImprovements.prioritizedActions.length} prioritized content actions targeting high-impact pages and sections`,
        `${osaResults.experienceTactics.experiments.length} systematic experiments designed for ${osaResults.meta.maturityPhase} phase capabilities`,
        `${osaResults.experienceTactics.personalizationUseCases.length} personalization opportunities leveraging ${getPersonalizationTools(osaResults).join(', ')}`,
        `${getQuickWinsCount(osaResults)} quick-win opportunities identified for immediate performance gains`
      ]
    },

    dxptools: {
      summary: `DXP Tools analysis covers ${osaResults.meta.optiStack.length} active Optimizely tools with focus on integration health, performance optimization, and strategic tool utilization for maximum business impact.`,
      keyPoints: [
        `${osaResults.meta.optiStack.length} Optimizely DXP tools actively integrated: ${osaResults.meta.optiStack.join(', ')}`,
        `${osaResults.experienceTactics.personalizationUseCases.length} personalization use cases designed for current tool configuration`,
        `Integration health monitoring ensures optimal performance across all DXP touchpoints`,
        `Tool utilization optimization recommendations aligned with ${osaResults.meta.maturityPhase} phase capabilities`
      ]
    }
  };

  const config = tierOverviews[tier];

  // Apply content validation
  const summaryCheck = ensureContentNeverBlank(config.summary, 'general');
  const keyPointsCheck = ensureContentNeverBlank(config.keyPoints, 'list');

  return {
    summary: summaryCheck.value,
    keyPoints: Array.isArray(keyPointsCheck.value) ? keyPointsCheck.value : [keyPointsCheck.value]
  };
}

// =============================================================================
// Insights Section Mapping
// =============================================================================

function mapInsightsSection(
  osaResults: OSAResults,
  tier: 'strategy' | 'insights' | 'optimization' | 'dxptools'
): ResultsPageContent['insights'] {

  const tierInsights = {
    strategy: [
      {
        title: 'Strategic Planning Analysis',
        description: 'Comprehensive analysis of strategic initiatives and implementation roadmap',
        bullets: [
          `${osaResults.strategyPlans.phasePlan.length} strategic phases planned with ${osaResults.meta.maturityPhase} phase priority`,
          `${osaResults.strategyPlans.roadmapItems.length} roadmap items prioritized by business impact and implementation feasibility`,
          `${osaResults.strategyPlans.quarterlyMilestones.length} quarterly milestones established for progress tracking`,
          `Strategic alignment with ${osaResults.meta.primaryGoals.join(', ')} business objectives`
        ]
      }
    ],

    insights: osaResults.analyticsInsights.keyFindings.slice(0, 3).map(finding => ({
      title: `Analytics Finding: ${finding.metric}`,
      description: finding.summary,
      bullets: [
        `Current performance: ${finding.currentValue || 'Measuring'}`,
        `Analysis type: ${finding.issueOrOpportunity === 'opportunity' ? 'Opportunity identified' : finding.issueOrOpportunity === 'issue' ? 'Issue requiring attention' : 'Performance monitoring'}`,
        `Recommended action: ${finding.suggestedAction}`,
        `Confidence level: ${finding.confidence} based on ${finding.dataSourceHints?.join(', ') || 'analytical assessment'}`
      ]
    })),

    optimization: [
      {
        title: 'Content Optimization Analysis',
        description: osaResults.contentImprovements.overview,
        bullets: [
          `${osaResults.contentImprovements.prioritizedActions.length} content improvement actions identified and prioritized`,
          `Key issues addressed: ${osaResults.contentImprovements.keyIssues.join(', ')}`,
          `Implementation timeline spans ${getTimeframeRange(osaResults.contentImprovements.prioritizedActions)} weeks`,
          `Content optimization measurement: ${osaResults.contentImprovements.measurementNotes}`
        ]
      },
      {
        title: 'Experience Enhancement Opportunities',
        description: osaResults.experienceTactics.overview,
        bullets: [
          `${osaResults.experienceTactics.experiments.length} systematic experiments recommended for testing`,
          `${osaResults.experienceTactics.personalizationUseCases.length} personalization use cases designed for current capabilities`,
          `${osaResults.experienceTactics.uxOptimizations.length} UX optimization opportunities identified`,
          `Experience tactics aligned with ${osaResults.meta.maturityPhase} phase implementation capacity`
        ]
      }
    ],

    dxptools: [
      {
        title: 'DXP Tools Performance Analysis',
        description: `Analysis of ${osaResults.meta.optiStack.length} active Optimizely DXP tools and their integration effectiveness`,
        bullets: [
          `Active tool stack: ${osaResults.meta.optiStack.join(', ')}`,
          `${osaResults.experienceTactics.personalizationUseCases.length} personalization opportunities utilizing current DXP capabilities`,
          `Integration health assessment indicates ${calculateOverallConfidence(osaResults) > 70 ? 'good' : 'moderate'} performance`,
          `Tool utilization optimization recommendations focus on maximizing ${osaResults.meta.primaryKpis.join(' and ')} performance`
        ]
      }
    ]
  };

  const insights = tierInsights[tier];

  // Ensure insights are never blank and properly formatted
  return insights.map((insight, index) => ({
    title: ensureContentNeverBlank(insight.title, 'general').value,
    description: ensureContentNeverBlank(insight.description, 'general').value,
    bullets: insight.bullets.map(bullet => ensureContentNeverBlank(bullet, 'general').value)
  }));
}

// =============================================================================
// Opportunities Section Mapping
// =============================================================================

function mapOpportunitiesSection(
  osaResults: OSAResults,
  tier: 'strategy' | 'insights' | 'optimization' | 'dxptools'
): ResultsPageOpportunity[] {

  const allOpportunities: ResultsPageOpportunity[] = [];

  // Map content improvement opportunities
  osaResults.contentImprovements.prioritizedActions.forEach(action => {
    allOpportunities.push({
      label: `${action.title}: ${action.description}`,
      impactLevel: action.expectedImpact.toLowerCase().includes('high') ? 'High' :
                   action.expectedImpact.toLowerCase().includes('low') ? 'Low' : 'Medium',
      effortLevel: action.difficulty === 'low' ? 'Low' :
                   action.difficulty === 'high' ? 'High' : 'Medium',
      confidence: 80 // Content improvements typically have high confidence
    });
  });

  // Map analytics insights opportunities
  osaResults.analyticsInsights.keyFindings
    .filter(finding => finding.issueOrOpportunity === 'opportunity')
    .forEach(finding => {
      allOpportunities.push({
        label: `Analytics Opportunity: ${finding.suggestedAction}`,
        impactLevel: finding.confidence === 'high' ? 'High' : 'Medium',
        effortLevel: 'Medium', // Analytics opportunities typically medium effort
        confidence: finding.confidence === 'high' ? 85 : finding.confidence === 'medium' ? 70 : 55
      });
    });

  // Map experience tactics opportunities
  osaResults.experienceTactics.experiments
    .filter(exp => exp.maturityFit.includes(osaResults.meta.maturityPhase))
    .slice(0, 3) // Limit to top 3 experiments
    .forEach(experiment => {
      allOpportunities.push({
        label: `${experiment.name}: ${experiment.hypothesis}`,
        impactLevel: experiment.expectedLift ? 'High' : 'Medium',
        effortLevel: experiment.implementationComplexity === 'low' ? 'Low' :
                     experiment.implementationComplexity === 'high' ? 'High' : 'Medium',
        confidence: 75
      });
    });

  // Filter and prioritize opportunities by tier relevance
  const prioritizedOpportunities = prioritizeOpportunitiesByTier(allOpportunities, tier);

  // Ensure we have at least one opportunity with fallback
  if (prioritizedOpportunities.length === 0) {
    prioritizedOpportunities.push({
      label: 'Continue systematic data collection and analysis to identify optimization opportunities',
      impactLevel: 'Medium',
      effortLevel: 'Low',
      confidence: 60
    });
  }

  return prioritizedOpportunities.slice(0, 5); // Limit to top 5 opportunities
}

// =============================================================================
// Next Steps Section Mapping
// =============================================================================

function mapNextStepsSection(
  osaResults: OSAResults,
  tier: 'strategy' | 'insights' | 'optimization' | 'dxptools'
): ResultsPageNextStep[] {

  const nextSteps: ResultsPageNextStep[] = [];

  // Add tier-specific next steps based on focus
  switch (tier) {
    case 'strategy':
      // Add strategic planning next steps
      osaResults.strategyPlans.roadmapItems
        .sort((a, b) => a.startOrder - b.startOrder)
        .slice(0, 3)
        .forEach(item => {
          nextSteps.push({
            label: item.title,
            ownerHint: item.ownerType || 'Strategy Team',
            timeframeHint: item.durationWeeks ? `${item.durationWeeks} weeks` : 'Next quarter'
          });
        });
      break;

    case 'insights':
      // Add analytics-focused next steps
      osaResults.analyticsInsights.keyFindings
        .filter(finding => finding.confidence === 'high')
        .slice(0, 3)
        .forEach(finding => {
          nextSteps.push({
            label: finding.suggestedAction,
            ownerHint: 'Analytics Team',
            timeframeHint: 'Next 2 weeks'
          });
        });
      break;

    case 'optimization':
      // Add optimization-focused next steps
      osaResults.contentImprovements.prioritizedActions
        .sort((a, b) => (a.difficulty === 'low' ? 0 : a.difficulty === 'medium' ? 1 : 2) -
                       (b.difficulty === 'low' ? 0 : b.difficulty === 'medium' ? 1 : 2))
        .slice(0, 2)
        .forEach(action => {
          nextSteps.push({
            label: action.title,
            ownerHint: action.ownerType || 'Content Team',
            timeframeHint: action.timeFrameWeeks ? `${action.timeFrameWeeks} weeks` : 'Next month'
          });
        });

      // Add experiment next step
      if (osaResults.experienceTactics.experiments.length > 0) {
        const topExperiment = osaResults.experienceTactics.experiments[0];
        nextSteps.push({
          label: `Launch experiment: ${topExperiment.name}`,
          ownerHint: 'Experience Team',
          timeframeHint: topExperiment.estimatedDurationWeeks ? `${topExperiment.estimatedDurationWeeks} weeks` : 'Next month'
        });
      }
      break;

    case 'dxptools':
      // Add DXP tools next steps
      nextSteps.push({
        label: 'Review DXP tools integration health and performance metrics',
        ownerHint: 'Technical Team',
        timeframeHint: 'Next week'
      });

      if (osaResults.experienceTactics.personalizationUseCases.length > 0) {
        nextSteps.push({
          label: `Implement personalization: ${osaResults.experienceTactics.personalizationUseCases[0].title}`,
          ownerHint: 'Personalization Team',
          timeframeHint: 'Next month'
        });
      }
      break;
  }

  // Ensure we have at least 2 next steps
  if (nextSteps.length < 2) {
    nextSteps.push({
      label: 'Continue data collection and performance monitoring',
      ownerHint: 'Analytics Team',
      timeframeHint: 'Ongoing'
    });

    nextSteps.push({
      label: 'Review and validate optimization recommendations',
      ownerHint: 'Strategy Team',
      timeframeHint: 'Next week'
    });
  }

  return nextSteps.slice(0, 4); // Limit to 4 next steps
}

// =============================================================================
// Utility Functions
// =============================================================================

function calculateOverallConfidence(
  osaResults: OSAResults,
  qualityScore?: ResultsQualityScore
): number {
  if (qualityScore) {
    // Use quality score for confidence calculation
    return Math.round((qualityScore.overall / 5) * 100);
  }

  // Calculate based on generation metadata
  const baseConfidence = osaResults.generation.confidence === 'high' ? 80 :
                        osaResults.generation.confidence === 'medium' ? 60 : 40;

  // Adjust based on data quality factors
  let adjustment = 0;

  if (osaResults.generation.contextBucketsUsed.length >= 3) adjustment += 10;
  if (osaResults.generation.totalPasses >= 2) adjustment += 5;
  if (osaResults.generation.dataQualityNotes && osaResults.generation.dataQualityNotes.length === 0) adjustment += 5;

  return Math.min(baseConfidence + adjustment, 95);
}

function extractUniqueFocusAreas(osaResults: OSAResults): string[] {
  const focusAreas = new Set<string>();

  osaResults.strategyPlans.phasePlan.forEach(phase => {
    phase.focusAreas.forEach(area => focusAreas.add(area));
  });

  osaResults.strategyPlans.roadmapItems.forEach(item => {
    focusAreas.add(item.focusArea);
  });

  return Array.from(focusAreas);
}

function getDataSourcesCount(osaResults: OSAResults): number {
  const dataSources = new Set<string>();

  osaResults.analyticsInsights.keyFindings.forEach(finding => {
    if (finding.dataSourceHints) {
      finding.dataSourceHints.forEach(source => dataSources.add(source));
    }
  });

  return dataSources.size || 3; // Default minimum count
}

function getDataSourcesList(osaResults: OSAResults): string[] {
  const dataSources = new Set<string>();

  osaResults.analyticsInsights.keyFindings.forEach(finding => {
    if (finding.dataSourceHints) {
      finding.dataSourceHints.forEach(source => dataSources.add(source));
    }
  });

  return Array.from(dataSources).slice(0, 3); // Top 3 sources
}

function getHighConfidenceInsightsCount(osaResults: OSAResults): number {
  return osaResults.analyticsInsights.keyFindings
    .filter(finding => finding.confidence === 'high').length;
}

function getQuickWinsCount(osaResults: OSAResults): number {
  const quickWinActions = osaResults.contentImprovements.prioritizedActions
    .filter(action => action.difficulty === 'low').length;

  const quickWinExperiments = osaResults.experienceTactics.experiments
    .filter(exp => exp.implementationComplexity === 'low').length;

  return quickWinActions + quickWinExperiments;
}

function getPersonalizationTools(osaResults: OSAResults): string[] {
  const tools = new Set<string>();

  osaResults.experienceTactics.personalizationUseCases.forEach(useCase => {
    useCase.toolsUsed.forEach(tool => tools.add(tool));
  });

  return Array.from(tools);
}

function getTimeframeRange(actions: any[]): string {
  const timeframes = actions
    .map(action => action.timeFrameWeeks)
    .filter(weeks => typeof weeks === 'number')
    .sort((a, b) => a - b);

  if (timeframes.length === 0) return '2-8';

  const min = Math.min(...timeframes);
  const max = Math.max(...timeframes);

  return min === max ? min.toString() : `${min}-${max}`;
}

function prioritizeOpportunitiesByTier(
  opportunities: ResultsPageOpportunity[],
  tier: 'strategy' | 'insights' | 'optimization' | 'dxptools'
): ResultsPageOpportunity[] {

  // Filter opportunities based on tier focus
  const filtered = opportunities.filter(opp => {
    const label = opp.label.toLowerCase();

    switch (tier) {
      case 'strategy':
        return label.includes('strategic') || label.includes('roadmap') || label.includes('plan');
      case 'insights':
        return label.includes('analytics') || label.includes('insight') || label.includes('data');
      case 'optimization':
        return label.includes('content') || label.includes('experiment') || label.includes('optimization');
      case 'dxptools':
        return label.includes('personalization') || label.includes('integration') || label.includes('tool');
      default:
        return true;
    }
  });

  // Sort by impact and confidence
  return filtered.sort((a, b) => {
    const aScore = (a.impactLevel === 'High' ? 3 : a.impactLevel === 'Medium' ? 2 : 1) + (a.confidence / 100);
    const bScore = (b.impactLevel === 'High' ? 3 : b.impactLevel === 'Medium' ? 2 : 1) + (b.confidence / 100);
    return bScore - aScore;
  });
}

function extractRelevantAgents(
  osaResults: OSAResults,
  tier: 'strategy' | 'insights' | 'optimization' | 'dxptools'
): string[] {

  const tierAgents = {
    strategy: ['strategy_workflow', 'roadmap_generator'],
    insights: ['analytics_insights', 'audience_suggester'],
    optimization: ['content_next_best_topics', 'experiment_blueprinter'],
    dxptools: ['content_recs_topic_performance', 'integration_health']
  };

  return tierAgents[tier] || ['results-content-optimizer'];
}

// =============================================================================
// Export Functions
// =============================================================================

export {
  calculateOverallConfidence,
  extractUniqueFocusAreas,
  getQuickWinsCount
};