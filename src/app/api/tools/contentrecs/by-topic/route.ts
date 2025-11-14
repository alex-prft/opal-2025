// API Route: Content Recommendations by Topic (CMS Integrated)
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
      content_format: content_format,
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

  // Transform CMS content to recommendation format
  let recommendations = cmsContent.map(item => ({
    title: item.title,
    url: item.url,
    description: item.description,
    topics: item.topics,
    sections: item.sections,
    confidence_score: item.confidenceScore || 0.8,
    audience: item.audience,
    content_type: item.contentType,
    publication_date: item.publishDate,
    last_modified: item.lastModified,
    engagement_score: 0.8, // Default engagement score
    metadata: item.metadata,
    source: 'optimizely_cms_12_paas'
  }));

  // If no CMS content found, fall back to enhanced IFPA content
  if (recommendations.length === 0) {
    console.log(`⚠️ No CMS content found for topic: ${topic}, using enhanced IFPA fallback content`);
    recommendations = getEnhancedIFPAContent(topic, audience, audienceMapping);
  }

  // Filter by content format if specified
  if (contentFormat !== 'all') {
    recommendations = recommendations.filter(rec => rec.content_type === contentFormat);
  }

  // Apply audience-specific filtering and scoring
  if (audience !== 'all') {
    const targetAudience = audienceMapping[audience];
    recommendations = recommendations.filter(rec =>
      rec.audience === 'All Members' ||
      rec.audience === targetAudience ||
      rec.audience === audience
    );

    // Sort by confidence score and relevance
    recommendations.sort((a, b) => b.confidence_score - a.confidence_score);
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

// Enhanced IFPA content for when CMS is not available or has no content
function getEnhancedIFPAContent(topic: string, audience: string, audienceMapping: any) {
  const ifpaContent: Record<string, any[]> = {
    'seasonal_produce': [
      {
        title: 'IFPA Winter Citrus Quality Standards & Handling Guide',
        url: '/resources/seasonal/winter-citrus-standards-2024',
        description: 'Official IFPA guidelines for winter citrus quality assessment, proper handling procedures, and optimal storage conditions to maintain freshness',
        topics: ['seasonal_produce', 'quality_standards', 'citrus', 'winter', 'handling'],
        sections: ['resource_center', 'quality_standards'],
        confidence_score: 0.94,
        audience: audience === 'all' ? 'All Members' : audienceMapping[audience] || audience,
        content_type: 'guide',
        publication_date: '2024-11-10T00:00:00Z',
        engagement_score: 0.91,
        source: 'ifpa_enhanced_content',
        member_tier_relevance: {
          'Free': 0.8,
          'Registered': 0.9,
          'Paid Members': 0.95,
          'Members Need Renewal': 0.85
        }
      },
      {
        title: 'Global Seasonal Produce Availability Calendar 2024-2025',
        url: '/tools/global-seasonal-calendar',
        description: 'Interactive tool showing peak seasons, regional availability, and sourcing recommendations for fresh produce worldwide',
        topics: ['seasonal_produce', 'availability', 'global_sourcing', 'planning'],
        sections: ['tools', 'resource_center', 'global_trade'],
        confidence_score: 0.89,
        audience: audience === 'all' ? 'All Members' : audienceMapping[audience] || audience,
        content_type: 'interactive_tool',
        publication_date: '2024-10-15T00:00:00Z',
        engagement_score: 0.93,
        source: 'ifpa_enhanced_content'
      }
    ],
    'member_benefits': [
      {
        title: 'IFPA Global Fresh Convention 2025 - Exclusive Member Benefits',
        url: '/events/gfc-2025/member-benefits',
        description: 'Access exclusive member pricing, VIP networking events, and priority registration for the world\'s largest fresh produce industry event',
        topics: ['member_benefits', 'events', 'convention', 'networking', 'vip_access'],
        sections: ['member_portal', 'events', 'vip_benefits'],
        confidence_score: 0.96,
        audience: 'Paid Members',
        content_type: 'event',
        publication_date: '2024-11-12T00:00:00Z',
        engagement_score: 0.94,
        source: 'ifpa_enhanced_content',
        member_tier_relevance: {
          'Free': 0.3,
          'Registered': 0.6,
          'Paid Members': 0.98,
          'Members Need Renewal': 0.9
        }
      },
      {
        title: 'IFPA Professional Development Certification Programs',
        url: '/education/certification-programs',
        description: 'Industry-recognized certification programs in produce safety, quality assurance, and supply chain management exclusively for IFPA members',
        topics: ['member_benefits', 'education', 'certification', 'professional_development'],
        sections: ['education', 'member_portal', 'certification'],
        confidence_score: 0.93,
        audience: 'Registered',
        content_type: 'certification',
        publication_date: '2024-11-05T00:00:00Z',
        engagement_score: 0.88,
        source: 'ifpa_enhanced_content'
      }
    ],
    'industry_news': [
      {
        title: 'Fresh Produce Industry Market Intelligence Report - November 2024',
        url: '/reports/market-intelligence-november-2024',
        description: 'Comprehensive analysis of global fresh produce markets, pricing trends, supply chain disruptions, and regulatory developments',
        topics: ['industry_news', 'market_intelligence', 'pricing', 'supply_chain', 'regulations'],
        sections: ['reports', 'market_analysis', 'member_portal'],
        confidence_score: 0.92,
        audience: audience === 'all' ? 'All Members' : audienceMapping[audience] || audience,
        content_type: 'report',
        publication_date: '2024-11-01T00:00:00Z',
        engagement_score: 0.87,
        source: 'ifpa_enhanced_content'
      }
    ],
    'food_safety': [
      {
        title: 'FSMA Produce Safety Rule: Complete Compliance Implementation Guide',
        url: '/safety/fsma-produce-safety-compliance-2024',
        description: 'Step-by-step implementation guide for FSMA Produce Safety Rule compliance including documentation templates and audit checklists',
        topics: ['food_safety', 'fsma_compliance', 'regulations', 'audit_preparation'],
        sections: ['safety', 'compliance', 'resource_center', 'templates'],
        confidence_score: 0.95,
        audience: audience === 'all' ? 'All Members' : audienceMapping[audience] || audience,
        content_type: 'compliance_guide',
        publication_date: '2024-10-20T00:00:00Z',
        engagement_score: 0.91,
        source: 'ifpa_enhanced_content'
      }
    ],
    'sustainability': [
      {
        title: 'Sustainable Fresh Produce Packaging: Innovation Showcase 2024',
        url: '/sustainability/packaging-innovation-showcase',
        description: 'Breakthrough sustainable packaging solutions for fresh produce featuring biodegradable materials, reduced plastic alternatives, and circular economy initiatives',
        topics: ['sustainability', 'packaging_innovation', 'environmental', 'circular_economy'],
        sections: ['sustainability', 'innovation', 'resource_center'],
        confidence_score: 0.88,
        audience: audience === 'all' ? 'All Members' : audienceMapping[audience] || audience,
        content_type: 'innovation_showcase',
        publication_date: '2024-11-08T00:00:00Z',
        engagement_score: 0.85,
        source: 'ifpa_enhanced_content'
      }
    ],
    'education_training': [
      {
        title: 'IFPA Fresh Produce Leadership Development Program',
        url: '/education/leadership-development',
        description: 'Comprehensive leadership training program designed specifically for fresh produce industry professionals at all career stages',
        topics: ['education_training', 'leadership', 'professional_development', 'career_advancement'],
        sections: ['education', 'leadership', 'member_portal'],
        confidence_score: 0.90,
        audience: audience === 'all' ? 'Paid Members' : audienceMapping[audience] || audience,
        content_type: 'training_program',
        publication_date: '2024-11-03T00:00:00Z',
        engagement_score: 0.86,
        source: 'ifpa_enhanced_content'
      }
    ]
  };

  return ifpaContent[topic] || [];
}

export async function GET() {
  // Return API information for discovery
  return NextResponse.json({
    endpoint: '/api/tools/contentrecs/by-topic',
    method: 'POST',
    description: 'Retrieves content recommendations filtered by topic and audience segment with CMS integration',
    usage: 'Used by DXP tools content-recs pages for topic-based content population from Optimizely CMS 12 PaaS',
    parameters: {
      topic: 'Content topic filter (required) - e.g., seasonal_produce, member_benefits, industry_news, food_safety, sustainability, education_training',
      audience: 'Target audience segment - free_members, registered_members, paid_members, renewal_members, all',
      limit: 'Maximum number of recommendations (1-50, default: 10)',
      include_metadata: 'Include recommendation metadata (default: true)',
      content_format: 'Filter by content type - article, video, infographic, resource, guide, report, tool, all'
    },
    response: {
      success: 'Operation success status',
      topic: 'Requested topic',
      audience: 'Target audience',
      recommendations: 'Array of content recommendations with confidence scores from CMS or enhanced fallback',
      metadata: 'Processing metadata and CMS integration statistics'
    },
    integration: 'Integrates with OSA CMSPaaS Tools for content retrieval from Optimizely CMS 12 PaaS with enhanced IFPA fallback content'
  });
}