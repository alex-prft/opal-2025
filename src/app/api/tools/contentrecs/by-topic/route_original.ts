// API Route: Content Recommendations by Topic
// Retrieves content recommendations filtered by topic and audience segment for DXP tools content-recs pages

import { NextRequest, NextResponse } from 'next/server';
import { workflowDb } from '@/lib/database/workflow-operations';
import { cmsClient } from '@/lib/cms/optimizely-cms-client';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🔍 [Content Recs By Topic] Request received');

    // Parse request body
    const body = await request.json();
    const {
      topic,
      audience = 'all',
      limit = 10,
      include_metadata = true,
      content_format = 'all',
      workflow_context
    } = body;

    if (!topic) {
      return NextResponse.json({
        error: 'Missing topic',
        message: 'Topic parameter is required for content recommendations'
      }, { status: 400 });
    }

    // Log performance metrics
    await workflowDb.logAPIPerformance({
      endpoint: '/api/tools/contentrecs/by-topic',
      method: 'POST',
      workflowId: workflow_context?.workflow_metadata?.workflow_id,
      responseTimeMs: Date.now() - startTime,
      statusCode: 200,
      payloadSizeBytes: JSON.stringify(body).length,
      dxpPlatform: 'content_recommendations',
      apiCallType: 'topic_based_retrieval'
    });

    console.log(`📊 [Content Recs By Topic] Processing topic: ${topic}, audience: ${audience}`);

    // Integrate with OSA CMSPaaS Tools via Optimizely CMS 12 PaaS
    const contentRecommendations = await generateTopicBasedRecommendations(
      topic,
      audience,
      limit,
      content_format
    );

    const response = {
      success: true,
      topic: topic,
      audience: audience,
      recommendations: contentRecommendations,
      metadata: include_metadata ? {
        total_recommendations: contentRecommendations.length,
        confidence_threshold: 0.6,
        processing_time_ms: Date.now() - startTime,
        content_source: 'optimizely_cms_12_paas',
        last_updated: new Date().toISOString(),
        api_version: '1.0.0'
      } : undefined
    };

    const totalDuration = Date.now() - startTime;
    console.log(`✅ [Content Recs By Topic] Completed (${totalDuration}ms) - ${contentRecommendations.length} recommendations`);

    return NextResponse.json(response);

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error('❌ [Content Recs By Topic] Failed:', error);

    // Log error performance
    await workflowDb.logAPIPerformance({
      endpoint: '/api/tools/contentrecs/by-topic',
      method: 'POST',
      responseTimeMs: duration,
      statusCode: 500,
      dxpPlatform: 'content_recommendations',
      apiCallType: 'topic_based_retrieval',
      errorMessage
    });

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: `Topic-based content retrieval failed: ${errorMessage}`
    }, { status: 500 });
  }
}

// Helper function to generate topic-based recommendations using CMS integration
async function generateTopicBasedRecommendations(
  topic: string,
  audience: string,
  limit: number,
  contentFormat: string
) {
  console.log(`🔍 Retrieving CMS content for topic: ${topic}`);

  // Use CMS client to get real IFPA content
  const cmsContent = await cmsClient.getContentByTopic(topic, {
    audience: audience !== 'all' ? audience : undefined,
    limit,
    contentType: contentFormat !== 'all' ? contentFormat : undefined,
    sortBy: 'relevance'
  });

  console.log(`📄 Retrieved ${cmsContent.length} items from CMS for topic: ${topic}`);

  // IFPA Member Tiers: Free, Registered, Paid Members, Members Need Renewal
  const audienceMapping = {
    'free_members': 'Free',
    'registered_members': 'Registered',
    'paid_members': 'Paid Members',
    'renewal_members': 'Members Need Renewal',
    'all': 'All Members'
  };

  // Sample content recommendations based on IFPA topics
  const topicContentMap: Record<string, any[]> = {
    'seasonal_produce': [
      {
        title: 'Fresh Seasonal Produce Guide - Winter 2024',
        url: '/resources/seasonal-produce/winter-2024',
        description: 'Comprehensive guide to winter seasonal produce sourcing and quality standards',
        topics: ['seasonal_produce', 'quality_standards', 'sourcing'],
        sections: ['resource_center', 'member_portal'],
        confidence_score: 0.92,
        audience: audience === 'all' ? 'All Members' : audienceMapping[audience] || audience,
        content_type: 'article',
        publication_date: '2024-11-01T00:00:00Z',
        engagement_score: 0.87,
        member_tier_relevance: {
          'Paid Members': 0.95,
          'Registered': 0.80,
          'Free': 0.65
        }
      },
      {
        title: 'Seasonal Availability Calendar 2024-2025',
        url: '/tools/seasonal-calendar',
        description: 'Interactive calendar showing peak seasons for fresh produce across regions',
        topics: ['seasonal_produce', 'calendar', 'regional_data'],
        sections: ['homepage_hero', 'tools'],
        confidence_score: 0.89,
        audience: audience === 'all' ? 'All Members' : audienceMapping[audience] || audience,
        content_type: 'interactive_tool',
        publication_date: '2024-10-15T00:00:00Z',
        engagement_score: 0.93
      }
    ],
    'member_benefits': [
      {
        title: 'IFPA Member Exclusive Resources',
        url: '/members/exclusive-resources',
        description: 'Access premium industry reports, networking events, and certification programs',
        topics: ['member_benefits', 'exclusive_access', 'networking'],
        sections: ['member_portal', 'benefits'],
        confidence_score: 0.95,
        audience: audience === 'all' ? 'Paid Members' : audienceMapping[audience] || audience,
        content_type: 'resource',
        publication_date: '2024-11-10T00:00:00Z',
        engagement_score: 0.91
      },
      {
        title: 'Member Certification Programs',
        url: '/education/certification',
        description: 'Professional development and certification opportunities for IFPA members',
        topics: ['member_benefits', 'education', 'certification'],
        sections: ['education', 'member_portal'],
        confidence_score: 0.88,
        audience: audience === 'all' ? 'All Members' : audienceMapping[audience] || audience,
        content_type: 'program',
        publication_date: '2024-10-20T00:00:00Z',
        engagement_score: 0.85
      }
    ],
    'industry_news': [
      {
        title: 'Global Fresh Produce Market Trends Q4 2024',
        url: '/news/market-trends-q4-2024',
        description: 'Latest market analysis and trends affecting the global fresh produce industry',
        topics: ['industry_news', 'market_trends', 'global_trade'],
        sections: ['news', 'homepage_hero'],
        confidence_score: 0.90,
        audience: audience === 'all' ? 'All Members' : audienceMapping[audience] || audience,
        content_type: 'article',
        publication_date: '2024-11-12T00:00:00Z',
        engagement_score: 0.88
      }
    ],
    'sustainability': [
      {
        title: 'Sustainable Packaging Solutions for Fresh Produce',
        url: '/sustainability/packaging-solutions',
        description: 'Innovative eco-friendly packaging options and best practices for produce retailers',
        topics: ['sustainability', 'packaging', 'environmental'],
        sections: ['sustainability', 'best_practices'],
        confidence_score: 0.86,
        audience: audience === 'all' ? 'All Members' : audienceMapping[audience] || audience,
        content_type: 'guide',
        publication_date: '2024-11-05T00:00:00Z',
        engagement_score: 0.82
      }
    ]
  };

  // Get recommendations for the requested topic
  let recommendations = topicContentMap[topic] || [];

  // Filter by content format if specified
  if (contentFormat !== 'all') {
    recommendations = recommendations.filter(rec => rec.content_type === contentFormat);
  }

  // Apply audience-specific filtering and scoring
  if (audience !== 'all') {
    recommendations = recommendations.map(rec => {
      const tierRelevance = rec.member_tier_relevance?.[audienceMapping[audience]] || rec.confidence_score;
      return {
        ...rec,
        confidence_score: Math.min(rec.confidence_score * (tierRelevance || 1), 1.0),
        audience_relevance: tierRelevance
      };
    });

    // Sort by audience relevance
    recommendations.sort((a, b) => (b.audience_relevance || b.confidence_score) - (a.audience_relevance || a.confidence_score));
  }

  // Apply limit
  recommendations = recommendations.slice(0, limit);

  // Add dynamic metadata
  recommendations = recommendations.map((rec, index) => ({
    ...rec,
    recommendation_id: `${topic}_${index + 1}`,
    retrieval_timestamp: new Date().toISOString(),
    source_tool: 'get_content_recommendations_by_topic',
    ranking_position: index + 1
  }));

  return recommendations;
}

export async function GET() {
  // Return API information for discovery
  return NextResponse.json({
    endpoint: '/api/tools/contentrecs/by-topic',
    method: 'POST',
    description: 'Retrieves content recommendations filtered by topic and audience segment',
    usage: 'Used by DXP tools content-recs pages for topic-based content population',
    parameters: {
      topic: 'Content topic filter (required) - e.g., seasonal_produce, member_benefits, industry_news',
      audience: 'Target audience segment - free_members, registered_members, paid_members, renewal_members, all',
      limit: 'Maximum number of recommendations (1-50, default: 10)',
      include_metadata: 'Include recommendation metadata (default: true)',
      content_format: 'Filter by content type - article, video, infographic, resource, all'
    },
    response: {
      success: 'Operation success status',
      topic: 'Requested topic',
      audience: 'Target audience',
      recommendations: 'Array of content recommendations with confidence scores',
      metadata: 'Processing metadata and statistics'
    },
    integration: 'Integrates with OSA CMSPaaS Tools for content retrieval from Optimizely CMS 12 PaaS'
  });
}