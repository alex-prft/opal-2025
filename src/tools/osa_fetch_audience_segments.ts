// src/tools/osa_fetch_audience_segments.ts
import { tool, ParameterType } from "@optimizely-opal/opal-tools-sdk";

interface FetchAudienceSegmentsParams {
  member_tiers?: string[];
  engagement_levels?: string[];
  behavioral_patterns?: string[];
  geographic_filters?: Record<string, any> | null;
  include_size_estimates?: boolean;
  include_attributes?: boolean;
  workflow_id?: string;
  projectId?: string;
  limit?: number;
  page?: number;
}

interface AudienceSegment {
  segment_id: string;
  segment_name: string;
  description: string;
  size_estimate: number;
  engagement_score: number;
  value_tier: string;
  targeting_criteria: {
    behavioral_attributes: Record<string, any>;
    personalization_opportunities: string[];
  };
  implementation_priority: 'high' | 'medium' | 'low';
}

interface FetchAudienceSegmentsResult {
  success: boolean;
  audience_segments: {
    segments: AudienceSegment[];
    segment_prioritization: {
      high_priority: string[];
      medium_priority: string[];
      growth_opportunity: string[];
    };
    audience_insights: {
      total_segments: number;
      total_addressable_audience: number;
      engagement_distribution: Record<string, number>;
      cross_segment_opportunities: Array<{
        segments: string[];
        overlap_potential: string;
        strategy: string;
      }>;
    };
    implementation_roadmap: {
      immediate: { timeline: string; focus: string };
      short_term: { timeline: string; focus: string };
      long_term: { timeline: string; focus: string };
    };
  };
  _metadata: {
    data_source: string;
    processing_time_ms: number;
    correlation_id: string;
    segments_analyzed: number;
    timestamp: string;
  };
}

// Core handler function
async function osaFetchAudienceSegments(
  params: FetchAudienceSegmentsParams
): Promise<FetchAudienceSegmentsResult> {
  const startTime = Date.now();
  const {
    member_tiers = ['premium', 'commercial', 'standard'],
    engagement_levels = ['high', 'medium', 'low'],
    behavioral_patterns = ['seasonal_purchasing', 'content_engagement'],
    geographic_filters = null,
    include_size_estimates = true,
    include_attributes = true,
    workflow_id,
    projectId,
    limit = 50,
    page = 1,
  } = params;

  const correlationId = `opal-audience-segments-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  console.log('🎯 [OPAL SDK] osa_fetch_audience_segments request received', { correlationId });

  try {
    // Determine environment-aware API endpoint
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://opal-2025.vercel.app');

    // First, try to delegate to existing ODP segments endpoint
    const odpEndpoint = `${baseUrl}/api/tools/odp/segments`;

    const odpRequest = {
      segment_criteria: {
        member_tiers,
        engagement_levels,
        behavioral_patterns,
        geographic_filters
      },
      include_size_estimates,
      include_attributes,
      workflow_context: {
        workflow_metadata: {
          workflow_id: workflow_id || `audience_analysis_${Date.now()}`,
          agent_id: 'audience_suggester',
          correlation_id: correlationId
        }
      }
    };

    console.log('📤 [OPAL SDK] Calling ODP segments endpoint', { correlationId });

    const odpResponse = await fetch(odpEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId
      },
      body: JSON.stringify(odpRequest)
    });

    let audienceSegmentsData: FetchAudienceSegmentsResult;

    if (odpResponse.ok) {
      const odpData = await odpResponse.json();

      // Transform ODP response to expected format
      audienceSegmentsData = {
        success: true,
        audience_segments: {
          segments: odpData.data?.recommended_segments?.map((segment: any) => ({
            segment_id: segment.segment_id,
            segment_name: segment.name,
            description: segment.description,
            size_estimate: segment.size_estimate,
            engagement_score: segment.engagement_score,
            value_tier: segment.value_tier,
            targeting_criteria: {
              behavioral_attributes: segment.attributes,
              personalization_opportunities: segment.personalization_opportunities
            },
            implementation_priority: segment.segment_id === 'premium_produce_buyers' ? 'high' :
                                   segment.segment_id === 'bulk_commercial_buyers' ? 'high' : 'medium'
          })) || [],
          segment_prioritization: odpData.data?.segment_prioritization || {
            high_priority: ['premium_produce_buyers', 'bulk_commercial_buyers'],
            medium_priority: ['health_conscious_shoppers'],
            growth_opportunity: ['seasonal_home_cooks']
          },
          audience_insights: {
            total_segments: odpData.data?.recommended_segments?.length || 0,
            total_addressable_audience: odpData.data?.audience_insights?.total_estimated_reach || 0,
            engagement_distribution: odpData.data?.audience_insights?.engagement_distribution || {},
            cross_segment_opportunities: odpData.data?.audience_insights?.cross_segment_opportunities || []
          },
          implementation_roadmap: odpData.data?.implementation_roadmap || {
            immediate: { timeline: '0-4 weeks', focus: 'high_priority_segments' },
            short_term: { timeline: '1-3 months', focus: 'medium_priority_segments' },
            long_term: { timeline: '3-6 months', focus: 'growth_segments' }
          }
        },
        _metadata: {
          data_source: 'odp_segments_delegation',
          processing_time_ms: Date.now() - startTime,
          correlation_id: correlationId,
          segments_analyzed: odpData.data?.recommended_segments?.length || 0,
          timestamp: new Date().toISOString()
        }
      };

      console.log('✅ [OPAL SDK] Successfully delegated to ODP segments endpoint', {
        correlationId,
        segmentsFound: audienceSegmentsData.audience_segments.segments.length
      });

    } else {
      // Graceful fallback to mock data if delegation fails
      console.warn('⚠️ [OPAL SDK] ODP segments API delegation failed, using mock data', { correlationId });

      audienceSegmentsData = {
        success: true,
        audience_segments: {
          segments: [
            {
              segment_id: 'strategic_buyers',
              segment_name: 'Strategic Buyers',
              description: 'Professional buyers making strategic purchasing decisions for organizations',
              size_estimate: 15000,
              engagement_score: 0.82,
              value_tier: 'premium',
              targeting_criteria: {
                behavioral_attributes: {
                  decision_making_role: 'primary',
                  purchase_volume: 'high',
                  research_behavior: 'extensive'
                },
                personalization_opportunities: [
                  'Technical specification content',
                  'Bulk pricing information',
                  'Supplier relationship content'
                ]
              },
              implementation_priority: 'high'
            },
            {
              segment_id: 'quality_conscious_consumers',
              segment_name: 'Quality-Conscious Consumers',
              description: 'Individual consumers prioritizing product quality and freshness',
              size_estimate: 28500,
              engagement_score: 0.71,
              value_tier: 'standard',
              targeting_criteria: {
                behavioral_attributes: {
                  quality_focus: 'high',
                  price_sensitivity: 'medium',
                  brand_loyalty: 'moderate'
                },
                personalization_opportunities: [
                  'Quality certification content',
                  'Freshness indicators',
                  'Source and origin information'
                ]
              },
              implementation_priority: 'medium'
            }
          ],
          segment_prioritization: {
            high_priority: ['strategic_buyers'],
            medium_priority: ['quality_conscious_consumers'],
            growth_opportunity: ['seasonal_shoppers']
          },
          audience_insights: {
            total_segments: 2,
            total_addressable_audience: 43500,
            engagement_distribution: {
              high_engagement: 0.30,
              medium_engagement: 0.50,
              developing_engagement: 0.20
            },
            cross_segment_opportunities: [
              {
                segments: ['strategic_buyers', 'quality_conscious_consumers'],
                overlap_potential: 'medium',
                strategy: 'Quality-focused B2B messaging'
              }
            ]
          },
          implementation_roadmap: {
            immediate: {
              timeline: '0-4 weeks',
              focus: 'Strategic buyer segment activation'
            },
            short_term: {
              timeline: '1-3 months',
              focus: 'Quality consumer personalization'
            },
            long_term: {
              timeline: '3-6 months',
              focus: 'Cross-segment optimization'
            }
          }
        },
        _metadata: {
          data_source: 'mock_data_fallback',
          processing_time_ms: Date.now() - startTime,
          correlation_id: correlationId,
          segments_analyzed: 2,
          timestamp: new Date().toISOString()
        }
      };
    }

    return audienceSegmentsData;

  } catch (error) {
    console.error('❌ [OPAL SDK] Audience segments fetch failed:', error);

    return {
      success: false,
      audience_segments: {
        segments: [],
        segment_prioritization: { high_priority: [], medium_priority: [], growth_opportunity: [] },
        audience_insights: {
          total_segments: 0,
          total_addressable_audience: 0,
          engagement_distribution: {},
          cross_segment_opportunities: []
        },
        implementation_roadmap: {
          immediate: { timeline: '', focus: '' },
          short_term: { timeline: '', focus: '' },
          long_term: { timeline: '', focus: '' }
        }
      },
      _metadata: {
        data_source: 'error',
        processing_time_ms: Date.now() - startTime,
        correlation_id: correlationId,
        segments_analyzed: 0,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Register tool with OPAL SDK
tool({
  name: "osa_fetch_audience_segments",
  description: "Retrieves existing audience segments from Optimizely ODP including metadata, performance data, and implementation roadmaps for OSA strategy development.",
  parameters: [
    {
      name: "member_tiers",
      type: ParameterType.List,
      description: "Member tier segments to include (premium, commercial, standard, trial)",
      required: false,
    },
    {
      name: "engagement_levels",
      type: ParameterType.List,
      description: "Engagement level filters (high, medium, low, inactive)",
      required: false,
    },
    {
      name: "behavioral_patterns",
      type: ParameterType.List,
      description: "Behavioral pattern criteria (seasonal_purchasing, content_engagement, event_participation)",
      required: false,
    },
    {
      name: "geographic_filters",
      type: ParameterType.Dictionary,
      description: "Geographic targeting filters and constraints",
      required: false,
    },
    {
      name: "include_size_estimates",
      type: ParameterType.Boolean,
      description: "Include segment size estimates in response (default: true)",
      required: false,
    },
    {
      name: "include_attributes",
      type: ParameterType.Boolean,
      description: "Include detailed segment attributes and characteristics (default: true)",
      required: false,
    },
    {
      name: "workflow_id",
      type: ParameterType.String,
      description: "Optional workflow identifier for correlation tracking",
      required: false,
    },
    {
      name: "projectId",
      type: ParameterType.String,
      description: "Optional ODP project identifier if tenant uses project-based organization",
      required: false,
    },
    {
      name: "limit",
      type: ParameterType.Number,
      description: "Max number of segments to return (default: 50)",
      required: false,
    },
    {
      name: "page",
      type: ParameterType.Number,
      description: "Page of results to fetch (default: 1)",
      required: false,
    },
  ],
})(osaFetchAudienceSegments);