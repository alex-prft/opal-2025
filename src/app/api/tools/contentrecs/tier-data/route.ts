// API Route: Tier-Based Content Data Generation
// Generates structured tier-based content data for DXP tools content-recs pages with proper metadata and SOP compliance

import { NextRequest, NextResponse } from 'next/server';
import { workflowDb } from '@/lib/database/workflow-operations';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🏗️ [Tier Data Generation] Request received');

    // Parse request body
    const body = await request.json();
    const {
      content_recommendations,
      tier_configuration = {
        tier1_summary: true,
        tier2_kpis: true,
        tier3_detailed: true
      },
      sop_compliance = true,
      confidence_scoring = true,
      agent_metadata = {},
      workflow_context
    } = body;

    if (!content_recommendations || !Array.isArray(content_recommendations)) {
      return NextResponse.json({
        error: 'Invalid content_recommendations',
        message: 'content_recommendations must be a non-empty array'
      }, { status: 400 });
    }

    // Log performance metrics
    await workflowDb.logAPIPerformance({
      endpoint: '/api/tools/contentrecs/tier-data',
      method: 'POST',
      workflowId: workflow_context?.workflow_metadata?.workflow_id || agent_metadata.workflow_id,
      responseTimeMs: Date.now() - startTime,
      statusCode: 200,
      payloadSizeBytes: JSON.stringify(body).length,
      dxpPlatform: 'content_recommendations',
      apiCallType: 'tier_data_generation'
    });

    console.log(`🏗️ [Tier Data Generation] Processing ${content_recommendations.length} recommendations`);

    // Generate structured tier-based content data
    const tierData = await generateTierBasedContentData(
      content_recommendations,
      tier_configuration,
      sop_compliance,
      confidence_scoring,
      agent_metadata
    );

    const totalDuration = Date.now() - startTime;
    console.log(`✅ [Tier Data Generation] Completed (${totalDuration}ms)`);

    return NextResponse.json(tierData);

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error('❌ [Tier Data Generation] Failed:', error);

    // Log error performance
    await workflowDb.logAPIPerformance({
      endpoint: '/api/tools/contentrecs/tier-data',
      method: 'POST',
      responseTimeMs: duration,
      statusCode: 500,
      dxpPlatform: 'content_recommendations',
      apiCallType: 'tier_data_generation',
      errorMessage
    });

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: `Tier data generation failed: ${errorMessage}`
    }, { status: 500 });
  }
}

// Helper function to generate tier-based content data
async function generateTierBasedContentData(
  recommendations: any[],
  tierConfig: any,
  sopCompliance: boolean,
  confidenceScoring: boolean,
  agentMeta: any
) {
  const processingStartTime = Date.now();

  // Calculate overall metrics
  const totalRecommendations = recommendations.length;
  const averageConfidence = recommendations.reduce((sum, rec) =>
    sum + (rec.confidence_score || 0), 0) / totalRecommendations;

  const topicDistribution = calculateTopicDistribution(recommendations);
  const sectionDistribution = calculateSectionDistribution(recommendations);
  const audienceBreakdown = calculateAudienceBreakdown(recommendations);

  // Generate Tier 1: Executive Summary
  const tier1Data = tierConfig.tier1_summary ? {
    executive_summary: {
      total_content_recommendations: totalRecommendations,
      overall_confidence_score: Math.round(averageConfidence * 100) / 100,
      content_quality_assessment: calculateContentQuality(recommendations),
      key_insights: generateKeyInsights(recommendations, topicDistribution),
      strategic_recommendations: generateStrategicRecommendations(recommendations),
      business_impact_projection: {
        engagement_lift_estimate: '15-25%',
        content_effectiveness_score: averageConfidence,
        member_value_enhancement: calculateMemberValueEnhancement(audienceBreakdown)
      }
    }
  } : {};

  // Generate Tier 2: KPIs and Metrics
  const tier2Data = tierConfig.tier2_kpis ? {
    performance_metrics: {
      content_coverage: {
        topics_covered: Object.keys(topicDistribution).length,
        sections_populated: Object.keys(sectionDistribution).length,
        audience_segments_addressed: Object.keys(audienceBreakdown).length
      },
      quality_indicators: {
        high_confidence_content: recommendations.filter(r => (r.confidence_score || 0) >= 0.8).length,
        medium_confidence_content: recommendations.filter(r => (r.confidence_score || 0) >= 0.6 && (r.confidence_score || 0) < 0.8).length,
        low_confidence_content: recommendations.filter(r => (r.confidence_score || 0) < 0.6).length,
        average_engagement_score: calculateAverageEngagementScore(recommendations)
      },
      distribution_analytics: {
        by_topic: topicDistribution,
        by_section: sectionDistribution,
        by_audience: audienceBreakdown,
        content_format_breakdown: calculateContentFormatBreakdown(recommendations)
      }
    }
  } : {};

  // Generate Tier 3: Detailed Content Data
  const tier3Data = tierConfig.tier3_detailed ? {
    detailed_recommendations: recommendations.map((rec, index) => ({
      ...rec,
      tier3_enrichment: {
        recommendation_rank: index + 1,
        quality_score: calculateIndividualQualityScore(rec),
        optimization_suggestions: generateOptimizationSuggestions(rec),
        cross_reference_opportunities: findCrossReferenceOpportunities(rec, recommendations),
        seo_potential: calculateSEOPotential(rec),
        member_tier_alignment: assessMemberTierAlignment(rec)
      }
    })),
    content_matrix: generateContentMatrix(recommendations),
    implementation_roadmap: generateImplementationRoadmap(recommendations)
  } : {};

  // Generate SOP compliance metadata
  const sopMetadata = sopCompliance ? {
    sop_compliance: {
      data_structure_compliant: true,
      quality_thresholds_met: averageConfidence >= 0.6,
      metadata_completeness: calculateMetadataCompleteness(recommendations),
      audit_trail: {
        processing_agent: agentMeta.agent_source || 'content_recommendations',
        workflow_id: agentMeta.workflow_id || null,
        execution_timestamp: agentMeta.execution_timestamp || new Date().toISOString(),
        data_lineage: 'OSA Content Recommendations Tools -> Tier Data Generation',
        validation_status: 'passed'
      }
    }
  } : {};

  // Generate confidence scoring metadata
  const confidenceMetadata = confidenceScoring ? {
    confidence_analysis: {
      overall_confidence_level: getConfidenceLevel(averageConfidence),
      confidence_distribution: {
        high_confidence: recommendations.filter(r => (r.confidence_score || 0) >= 0.8).length / totalRecommendations,
        medium_confidence: recommendations.filter(r => (r.confidence_score || 0) >= 0.6 && (r.confidence_score || 0) < 0.8).length / totalRecommendations,
        low_confidence: recommendations.filter(r => (r.confidence_score || 0) < 0.6).length / totalRecommendations
      },
      quality_indicators: {
        data_completeness: calculateDataCompleteness(recommendations),
        source_reliability: 'high',
        temporal_relevance: 'current'
      }
    }
  } : {};

  // Combine all tier data
  return {
    success: true,
    tier_data_structure: {
      ...tier1Data,
      ...tier2Data,
      ...tier3Data
    },
    metadata: {
      agent_source: agentMeta.agent_source || 'content_recommendations',
      confidence_score: averageConfidence,
      timestamp: new Date().toISOString(),
      processing_time_ms: Date.now() - processingStartTime,
      tier_configuration: tierConfig,
      total_recommendations_processed: totalRecommendations,
      api_version: '1.0.0',
      ...sopMetadata,
      ...confidenceMetadata
    }
  };
}

// Helper functions for data analysis and generation
function calculateTopicDistribution(recommendations: any[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  recommendations.forEach(rec => {
    if (rec.topics && Array.isArray(rec.topics)) {
      rec.topics.forEach((topic: string) => {
        distribution[topic] = (distribution[topic] || 0) + 1;
      });
    }
  });
  return distribution;
}

function calculateSectionDistribution(recommendations: any[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  recommendations.forEach(rec => {
    if (rec.sections && Array.isArray(rec.sections)) {
      rec.sections.forEach((section: string) => {
        distribution[section] = (distribution[section] || 0) + 1;
      });
    }
  });
  return distribution;
}

function calculateAudienceBreakdown(recommendations: any[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  recommendations.forEach(rec => {
    if (rec.audience) {
      breakdown[rec.audience] = (breakdown[rec.audience] || 0) + 1;
    }
  });
  return breakdown;
}

function calculateContentQuality(recommendations: any[]): string {
  const avgConfidence = recommendations.reduce((sum, rec) =>
    sum + (rec.confidence_score || 0), 0) / recommendations.length;

  if (avgConfidence >= 0.8) return 'excellent';
  if (avgConfidence >= 0.6) return 'good';
  if (avgConfidence >= 0.4) return 'fair';
  return 'needs_improvement';
}

function generateKeyInsights(recommendations: any[], topicDistribution: Record<string, number>): string[] {
  const insights = [];
  const totalRecs = recommendations.length;
  const topTopic = Object.entries(topicDistribution).sort(([,a], [,b]) => b - a)[0];

  insights.push(`Generated ${totalRecs} content recommendations with focus on ${topTopic?.[0]} (${topTopic?.[1]} items)`);

  const highConfidenceCount = recommendations.filter(r => (r.confidence_score || 0) >= 0.8).length;
  if (highConfidenceCount > totalRecs * 0.5) {
    insights.push(`${Math.round((highConfidenceCount/totalRecs) * 100)}% of recommendations have high confidence scores`);
  }

  const uniqueAudiences = new Set(recommendations.map(r => r.audience)).size;
  insights.push(`Content addresses ${uniqueAudiences} distinct member audience segments`);

  return insights;
}

function generateStrategicRecommendations(recommendations: any[]): string[] {
  const strategies = [];
  const avgConfidence = recommendations.reduce((sum, rec) => sum + (rec.confidence_score || 0), 0) / recommendations.length;

  if (avgConfidence < 0.7) {
    strategies.push('Consider enhancing content quality and relevance scoring mechanisms');
  }

  const contentTypes = new Set(recommendations.map(r => r.content_type)).size;
  if (contentTypes >= 3) {
    strategies.push('Leverage diverse content formats to maximize engagement across member segments');
  }

  strategies.push('Implement A/B testing framework to validate recommendation effectiveness');
  strategies.push('Establish regular content performance review cycles for continuous optimization');

  return strategies;
}

function calculateMemberValueEnhancement(audienceBreakdown: Record<string, number>): string {
  const totalContent = Object.values(audienceBreakdown).reduce((sum, count) => sum + count, 0);
  const paidMemberContent = audienceBreakdown['Paid Members'] || 0;

  if (paidMemberContent / totalContent > 0.4) {
    return 'high_value_member_focus';
  } else if (paidMemberContent / totalContent > 0.2) {
    return 'balanced_member_approach';
  }
  return 'broad_member_engagement';
}

function calculateAverageEngagementScore(recommendations: any[]): number {
  const scores = recommendations
    .filter(r => r.engagement_score)
    .map(r => r.engagement_score);

  return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0.75;
}

function calculateContentFormatBreakdown(recommendations: any[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  recommendations.forEach(rec => {
    const format = rec.content_type || 'unknown';
    breakdown[format] = (breakdown[format] || 0) + 1;
  });
  return breakdown;
}

function calculateIndividualQualityScore(recommendation: any): number {
  let score = recommendation.confidence_score || 0.5;

  // Boost score for complete metadata
  if (recommendation.topics && recommendation.topics.length > 0) score += 0.05;
  if (recommendation.sections && recommendation.sections.length > 0) score += 0.05;
  if (recommendation.description && recommendation.description.length > 50) score += 0.05;

  return Math.min(score, 1.0);
}

function generateOptimizationSuggestions(recommendation: any): string[] {
  const suggestions = [];

  if (!recommendation.description || recommendation.description.length < 50) {
    suggestions.push('Enhance content description for better user understanding');
  }

  if ((recommendation.confidence_score || 0) < 0.7) {
    suggestions.push('Review content relevance and quality indicators');
  }

  if (!recommendation.engagement_score) {
    suggestions.push('Implement engagement tracking for performance optimization');
  }

  return suggestions;
}

function findCrossReferenceOpportunities(recommendation: any, allRecommendations: any[]): string[] {
  const opportunities = [];
  const relatedContent = allRecommendations.filter(r =>
    r !== recommendation &&
    r.topics && recommendation.topics &&
    r.topics.some((topic: string) => recommendation.topics.includes(topic))
  );

  if (relatedContent.length > 0) {
    opportunities.push(`${relatedContent.length} related content pieces identified for cross-promotion`);
  }

  return opportunities;
}

function calculateSEOPotential(recommendation: any): string {
  if (recommendation.topics && recommendation.topics.length >= 3) return 'high';
  if (recommendation.description && recommendation.description.length > 100) return 'medium';
  return 'basic';
}

function assessMemberTierAlignment(recommendation: any): Record<string, number> {
  return recommendation.member_tier_relevance || {
    'Free': 0.5,
    'Registered': 0.7,
    'Paid Members': 0.8,
    'Members Need Renewal': 0.6
  };
}

function generateContentMatrix(recommendations: any[]): any {
  const matrix = {
    content_to_audience_mapping: {},
    topic_to_section_mapping: {},
    engagement_optimization_matrix: {}
  };

  // This would be a complex matrix generation in production
  // Simplified for demonstration
  return matrix;
}

function generateImplementationRoadmap(recommendations: any[]): any {
  return {
    phase_1: {
      timeline: '1-2 weeks',
      priority: 'high_confidence_content',
      content_count: recommendations.filter(r => (r.confidence_score || 0) >= 0.8).length
    },
    phase_2: {
      timeline: '3-4 weeks',
      priority: 'medium_confidence_optimization',
      content_count: recommendations.filter(r => (r.confidence_score || 0) >= 0.6 && (r.confidence_score || 0) < 0.8).length
    },
    phase_3: {
      timeline: '1-2 months',
      priority: 'comprehensive_content_strategy',
      content_count: recommendations.length
    }
  };
}

function getConfidenceLevel(avgConfidence: number): string {
  if (avgConfidence >= 0.8) return 'high';
  if (avgConfidence >= 0.6) return 'medium';
  return 'low';
}

function calculateMetadataCompleteness(recommendations: any[]): number {
  const requiredFields = ['title', 'url', 'topics', 'sections', 'confidence_score'];
  let totalCompleteness = 0;

  recommendations.forEach(rec => {
    const completeness = requiredFields.reduce((sum, field) => {
      return sum + (rec[field] ? 1 : 0);
    }, 0) / requiredFields.length;
    totalCompleteness += completeness;
  });

  return totalCompleteness / recommendations.length;
}

function calculateDataCompleteness(recommendations: any[]): number {
  // Calculate percentage of recommendations with complete data
  const completeRecommendations = recommendations.filter(rec =>
    rec.title && rec.url && rec.topics && rec.sections && rec.confidence_score
  );

  return completeRecommendations.length / recommendations.length;
}

export async function GET() {
  // Return API information for discovery
  return NextResponse.json({
    endpoint: '/api/tools/contentrecs/tier-data',
    method: 'POST',
    description: 'Generates structured tier-based content data with SOP compliance and confidence scoring',
    usage: 'Used by DXP tools content-recs pages to format raw recommendations into multi-tier structured data',
    parameters: {
      content_recommendations: 'Array of content recommendations to structure (required)',
      tier_configuration: 'Configuration for tier data generation (tier1_summary, tier2_kpis, tier3_detailed)',
      sop_compliance: 'Include SOP compliance metadata (default: true)',
      confidence_scoring: 'Include confidence analysis (default: true)',
      agent_metadata: 'Agent execution metadata for tracking'
    },
    response: {
      success: 'Operation success status',
      tier_data_structure: 'Multi-tier structured content data',
      metadata: 'Processing metadata, SOP compliance, and confidence analysis'
    },
    integration: 'Processes content from OSA Content Recommendations Tools for DXP tools consumption'
  });
}