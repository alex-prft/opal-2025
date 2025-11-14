// API Route: Content Recommendations Catalog
// Retrieves available topics and sections for content recommendation filtering in DXP tools content-recs pages

import { NextRequest, NextResponse } from 'next/server';
import { workflowDb } from '@/lib/database/workflow-operations';
import { cmsClient } from '@/lib/cms/optimizely-cms-client';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('📚 [Content Catalog] Request received');

    const { searchParams } = new URL(request.url);
    const catalog_type = searchParams.get('catalog_type') || 'both';
    const include_metadata = searchParams.get('include_metadata') !== 'false';
    const audience_filter = searchParams.get('audience_filter') || 'all';
    const active_only = searchParams.get('active_only') !== 'false';
    const sort_by = searchParams.get('sort_by') || 'popularity';

    // Log performance metrics
    await workflowDb.logAPIPerformance({
      endpoint: '/api/tools/contentrecs/catalog',
      method: 'GET',
      responseTimeMs: Date.now() - startTime,
      statusCode: 200,
      dxpPlatform: 'content_recommendations',
      apiCallType: 'catalog_retrieval'
    });

    console.log(`📚 [Content Catalog] Processing catalog_type: ${catalog_type}, audience: ${audience_filter}`);

    // Generate catalog data from OSA CMSPaaS Tools integration via Optimizely CMS 12 PaaS
    const catalogData = await generateContentCatalog(
      catalog_type,
      include_metadata,
      audience_filter,
      active_only,
      sort_by
    );

    const response = {
      success: true,
      catalog_type: catalog_type,
      audience_filter: audience_filter,
      ...catalogData,
      metadata: include_metadata ? {
        total_topics: catalogData.topics?.length || 0,
        total_sections: catalogData.sections?.length || 0,
        processing_time_ms: Date.now() - startTime,
        content_source: 'optimizely_cms_12_paas',
        last_updated: new Date().toISOString(),
        cache_duration: '1_hour',
        api_version: '1.0.0'
      } : undefined
    };

    const totalDuration = Date.now() - startTime;
    console.log(`✅ [Content Catalog] Completed (${totalDuration}ms)`);

    return NextResponse.json(response);

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error('❌ [Content Catalog] Failed:', error);

    // Log error performance
    await workflowDb.logAPIPerformance({
      endpoint: '/api/tools/contentrecs/catalog',
      method: 'GET',
      responseTimeMs: duration,
      statusCode: 500,
      dxpPlatform: 'content_recommendations',
      apiCallType: 'catalog_retrieval',
      errorMessage
    });

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: `Content catalog retrieval failed: ${errorMessage}`
    }, { status: 500 });
  }
}

// Helper function to generate content catalog using CMS integration
async function generateContentCatalog(
  catalogType: string,
  includeMetadata: boolean,
  audienceFilter: string,
  activeOnly: boolean,
  sortBy: string
) {
  console.log(`📚 Retrieving content catalog from CMS`);

  try {
    // Get catalog from CMS client
    const cmsCatalog = await cmsClient.getContentCatalog();
    console.log(`📄 Retrieved CMS catalog: ${cmsCatalog.topics.length} topics, ${cmsCatalog.sections.length} sections`);

    // If CMS catalog is available, use it; otherwise fall back to enhanced IFPA catalog
    const catalogData = cmsCatalog.topics.length > 0 || cmsCatalog.sections.length > 0
      ? cmsCatalog
      : getEnhancedIFPACatalog();

    return processAndFilterCatalog(catalogData, catalogType, includeMetadata, audienceFilter, activeOnly, sortBy);
  } catch (error) {
    console.warn('⚠️ CMS catalog retrieval failed, using enhanced IFPA catalog:', error);
    const fallbackCatalog = getEnhancedIFPACatalog();
    return processAndFilterCatalog(fallbackCatalog, catalogType, includeMetadata, audienceFilter, activeOnly, sortBy);
  }
}

// Process and filter catalog data
function processAndFilterCatalog(
  catalogData: any,
  catalogType: string,
  includeMetadata: boolean,
  audienceFilter: string,
  activeOnly: boolean,
  sortBy: string
) {
  let { topics: topicsCatalog = [], sections: sectionsCatalog = [] } = catalogData;

  // Filter by audience if specified
  let filteredTopics = topicsCatalog;
  let filteredSections = sectionsCatalog;

  if (audienceFilter !== 'all') {
    const audienceMapping = {
      'free_members': 'Free',
      'registered_members': 'Registered',
      'paid_members': 'Paid Members',
      'renewal_members': 'Members Need Renewal'
    };

    const targetAudience = audienceMapping[audienceFilter as keyof typeof audienceMapping];

    if (targetAudience) {
      // Filter based on audience relevance threshold (>= 0.6)
      filteredTopics = topicsCatalog.filter((topic: any) =>
        topic.audience_relevance?.[targetAudience] >= 0.6
      );
      filteredSections = sectionsCatalog.filter((section: any) =>
        section.audience_relevance?.[targetAudience] >= 0.6
      );
    }
  }

  // Filter active only
  if (activeOnly) {
    filteredTopics = filteredTopics.filter((topic: any) => topic.active !== false);
    filteredSections = filteredSections.filter((section: any) => section.active !== false);
  }

  // Sort based on sort_by parameter
  const sortFunction = (a: any, b: any) => {
    switch (sortBy) {
      case 'alphabetical':
        return a.name.localeCompare(b.name);
      case 'recent':
        return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();
      case 'relevance':
        if (audienceFilter !== 'all') {
          const audienceMapping = {
            'free_members': 'Free',
            'registered_members': 'Registered',
            'paid_members': 'Paid Members',
            'renewal_members': 'Members Need Renewal'
          };
          const targetAudience = audienceMapping[audienceFilter as keyof typeof audienceMapping];
          if (targetAudience) {
            return (b.audience_relevance?.[targetAudience] || 0) - (a.audience_relevance?.[targetAudience] || 0);
          }
        }
        return (b.popularity_score || 0) - (a.popularity_score || 0);
      case 'popularity':
      default:
        return (b.popularity_score || 0) - (a.popularity_score || 0);
    }
  };

  filteredTopics.sort(sortFunction);
  filteredSections.sort(sortFunction);

  // Build response based on catalog_type
  const result: any = {};

  if (catalogType === 'topics' || catalogType === 'both') {
    result.topics = includeMetadata ? filteredTopics : filteredTopics.map((t: any) => ({
      id: t.id,
      name: t.name,
      description: t.description
    }));
  }

  if (catalogType === 'sections' || catalogType === 'both') {
    result.sections = includeMetadata ? filteredSections : filteredSections.map((s: any) => ({
      id: s.id,
      name: s.name,
      description: s.description
    }));
  }

  return result;
}

// Enhanced IFPA catalog for fallback or when CMS is not available
function getEnhancedIFPACatalog() {
  // IFPA Content Topics (from OSA CMSPaaS Tools)
  const topicsCatalog = [
    {
      id: 'seasonal_produce',
      name: 'Seasonal Produce',
      description: 'Seasonal availability, quality standards, and sourcing information for fresh produce',
      content_count: 42,
      popularity_score: 0.92,
      last_updated: '2024-11-10T00:00:00Z',
      audience_relevance: {
        'Free': 0.8,
        'Registered': 0.9,
        'Paid Members': 0.95,
        'Members Need Renewal': 0.85
      },
      categories: ['sourcing', 'quality', 'availability'],
      active: true
    },
    {
      id: 'member_benefits',
      name: 'Member Benefits',
      description: 'Exclusive member resources, networking opportunities, and certification programs',
      content_count: 28,
      popularity_score: 0.88,
      last_updated: '2024-11-08T00:00:00Z',
      audience_relevance: {
        'Free': 0.6,
        'Registered': 0.85,
        'Paid Members': 0.98,
        'Members Need Renewal': 0.95
      },
      categories: ['membership', 'benefits', 'networking'],
      active: true
    },
    {
      id: 'industry_news',
      name: 'Industry News',
      description: 'Latest developments, market trends, and regulatory updates in fresh produce',
      content_count: 156,
      popularity_score: 0.85,
      last_updated: '2024-11-12T00:00:00Z',
      audience_relevance: {
        'Free': 0.7,
        'Registered': 0.8,
        'Paid Members': 0.9,
        'Members Need Renewal': 0.75
      },
      categories: ['news', 'market_trends', 'regulations'],
      active: true
    },
    {
      id: 'sustainability',
      name: 'Sustainability',
      description: 'Environmental initiatives, sustainable practices, and eco-friendly solutions',
      content_count: 34,
      popularity_score: 0.78,
      last_updated: '2024-11-05T00:00:00Z',
      audience_relevance: {
        'Free': 0.65,
        'Registered': 0.75,
        'Paid Members': 0.88,
        'Members Need Renewal': 0.70
      },
      categories: ['environment', 'sustainability', 'innovation'],
      active: true
    },
    {
      id: 'food_safety',
      name: 'Food Safety',
      description: 'Safety protocols, compliance guidelines, and best practices for fresh produce',
      content_count: 67,
      popularity_score: 0.91,
      last_updated: '2024-11-07T00:00:00Z',
      audience_relevance: {
        'Free': 0.75,
        'Registered': 0.9,
        'Paid Members': 0.95,
        'Members Need Renewal': 0.85
      },
      categories: ['safety', 'compliance', 'protocols'],
      active: true
    },
    {
      id: 'education_training',
      name: 'Education & Training',
      description: 'Professional development, certification courses, and educational resources',
      content_count: 45,
      popularity_score: 0.82,
      last_updated: '2024-11-03T00:00:00Z',
      audience_relevance: {
        'Free': 0.5,
        'Registered': 0.8,
        'Paid Members': 0.95,
        'Members Need Renewal': 0.88
      },
      categories: ['education', 'certification', 'training'],
      active: true
    }
  ];

  // IFPA Website Sections (from OSA CMSPaaS Tools)
  const sectionsCatalog = [
    {
      id: 'homepage_hero',
      name: 'Homepage Hero',
      description: 'Primary homepage banner and featured content area',
      content_count: 8,
      popularity_score: 0.95,
      last_updated: '2024-11-12T00:00:00Z',
      audience_relevance: {
        'Free': 1.0,
        'Registered': 1.0,
        'Paid Members': 1.0,
        'Members Need Renewal': 1.0
      },
      content_types: ['hero_banner', 'featured_content', 'announcements'],
      active: true
    },
    {
      id: 'member_portal',
      name: 'Member Portal',
      description: 'Member-exclusive dashboard and resources section',
      content_count: 95,
      popularity_score: 0.89,
      last_updated: '2024-11-11T00:00:00Z',
      audience_relevance: {
        'Free': 0.3,
        'Registered': 0.8,
        'Paid Members': 0.95,
        'Members Need Renewal': 0.9
      },
      content_types: ['dashboard', 'member_resources', 'exclusive_content'],
      active: true
    },
    {
      id: 'resource_center',
      name: 'Resource Center',
      description: 'Educational materials, guides, and industry resources',
      content_count: 127,
      popularity_score: 0.87,
      last_updated: '2024-11-09T00:00:00Z',
      audience_relevance: {
        'Free': 0.7,
        'Registered': 0.85,
        'Paid Members': 0.9,
        'Members Need Renewal': 0.8
      },
      content_types: ['guides', 'whitepapers', 'tools'],
      active: true
    },
    {
      id: 'news_updates',
      name: 'News & Updates',
      description: 'Industry news, press releases, and regular updates',
      content_count: 203,
      popularity_score: 0.83,
      last_updated: '2024-11-12T00:00:00Z',
      audience_relevance: {
        'Free': 0.8,
        'Registered': 0.85,
        'Paid Members': 0.9,
        'Members Need Renewal': 0.75
      },
      content_types: ['news_articles', 'press_releases', 'newsletters'],
      active: true
    },
    {
      id: 'education',
      name: 'Education Hub',
      description: 'Training programs, certifications, and educational content',
      content_count: 76,
      popularity_score: 0.81,
      last_updated: '2024-11-08T00:00:00Z',
      audience_relevance: {
        'Free': 0.6,
        'Registered': 0.85,
        'Paid Members': 0.95,
        'Members Need Renewal': 0.9
      },
      content_types: ['courses', 'certifications', 'webinars'],
      active: true
    },
    {
      id: 'events',
      name: 'Events & Conferences',
      description: 'Industry events, conferences, and networking opportunities',
      content_count: 52,
      popularity_score: 0.79,
      last_updated: '2024-11-10T00:00:00Z',
      audience_relevance: {
        'Free': 0.5,
        'Registered': 0.8,
        'Paid Members': 0.95,
        'Members Need Renewal': 0.85
      },
      content_types: ['event_listings', 'conference_info', 'registration'],
      active: true
    }
  ];

  return {
    topics: topicsCatalog,
    sections: sectionsCatalog
  };
}

export async function POST() {
  // Return API information for discovery
  return NextResponse.json({
    endpoint: '/api/tools/contentrecs/catalog',
    method: 'GET',
    description: 'Retrieves available topics and sections for content recommendation filtering',
    usage: 'Used by DXP tools content-recs pages to populate filter options and content categories',
    parameters: {
      catalog_type: 'Type of catalog to retrieve - topics, sections, both (default: both)',
      include_metadata: 'Include detailed metadata - true, false (default: true)',
      audience_filter: 'Filter by audience relevance - free_members, registered_members, paid_members, renewal_members, all',
      active_only: 'Only return active content categories - true, false (default: true)',
      sort_by: 'Sort order - alphabetical, popularity, recent, relevance (default: popularity)'
    },
    response: {
      success: 'Operation success status',
      catalog_type: 'Requested catalog type',
      audience_filter: 'Applied audience filter',
      topics: 'Array of available content topics (if requested)',
      sections: 'Array of available content sections (if requested)',
      metadata: 'Catalog statistics and processing information'
    },
    integration: 'Integrates with OSA CMSPaaS Tools for content categorization from Optimizely CMS 12 PaaS'
  });
}