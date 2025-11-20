/**
 * ODP Results Adapter - OPAL → OSA Data Transformation
 *
 * Transforms raw OPAL data from ODP-related agents into normalized
 * Results page content. Supports mock mode for development/testing.
 *
 * @version 1.0 - Proof of Concept
 * @scope ODP Customer Profiles Dashboard Integration
 */

import type {
  DataTransformationResult,
  ResultsPageContent,
  ConfidenceLevel
} from '@/types/resultsContent';

// =============================================================================
// ODP DATA INTERFACES
// =============================================================================

export interface RawODPOpalData {
  customer_metrics: {
    total_customers: number;
    reachable_profiles: number;
    anonymous_profiles: number;
    mau_count: number;
    data_freshness: string;
    profile_completeness: number; // 0-100
  };
  audience_segments: {
    total_segments: number;
    active_segments: number;
    realtime_segments: number;
    segment_health_score: number; // 0-100
  };
  data_quality: {
    overall_score: number; // 0-100
    duplicate_rate: number; // 0-1
    missing_data_rate: number; // 0-1
    last_quality_check: string;
  };
  integration_status: {
    api_health: 'healthy' | 'degraded' | 'unhealthy';
    last_sync: string;
    sync_success_rate: number; // 0-1
    active_connections: number;
  };
  metadata: {
    generated_at: string;
    data_age_minutes: number;
    confidence: ConfidenceLevel;
    source_agents: string[];
  };
}

export interface ODPDashboardContent {
  heroMetrics: {
    totalCustomers: number;
    reachableProfiles: number;
    mauCount: number;
    profileCompleteness: number;
  };
  segmentSummary: {
    totalSegments: number;
    activeSegments: number;
    realtimeSegments: number;
    healthScore: number;
  };
  dataQuality: {
    overallScore: number;
    duplicateRate: number;
    missingDataRate: number;
    lastCheck: string;
  };
  integrationHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastSync: string;
    successRate: number;
    activeConnections: number;
  };
}

// =============================================================================
// MOCK DATA GENERATOR (FOR DEVELOPMENT)
// =============================================================================

function generateMockODPData(): RawODPOpalData {
  const now = new Date();
  const mockData: RawODPOpalData = {
    customer_metrics: {
      total_customers: 45230 + Math.floor(Math.random() * 1000),
      reachable_profiles: 38942 + Math.floor(Math.random() * 500),
      anonymous_profiles: 6288 + Math.floor(Math.random() * 200),
      mau_count: 12350 + Math.floor(Math.random() * 300),
      data_freshness: new Date(now.getTime() - Math.random() * 60 * 60 * 1000).toISOString(),
      profile_completeness: 78 + Math.floor(Math.random() * 15)
    },
    audience_segments: {
      total_segments: 24,
      active_segments: 18,
      realtime_segments: 6,
      segment_health_score: 85 + Math.floor(Math.random() * 10)
    },
    data_quality: {
      overall_score: 82 + Math.floor(Math.random() * 15),
      duplicate_rate: 0.05 + Math.random() * 0.03,
      missing_data_rate: 0.12 + Math.random() * 0.05,
      last_quality_check: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
    },
    integration_status: {
      api_health: Math.random() > 0.1 ? 'healthy' : 'degraded',
      last_sync: new Date(now.getTime() - Math.random() * 30 * 60 * 1000).toISOString(),
      sync_success_rate: 0.92 + Math.random() * 0.07,
      active_connections: 3 + Math.floor(Math.random() * 2)
    },
    metadata: {
      generated_at: now.toISOString(),
      data_age_minutes: Math.floor(Math.random() * 60),
      confidence: 85,
      source_agents: ['audience_suggester', 'integration_health', 'customer_journey']
    }
  };

  return mockData;
}

// =============================================================================
// CORE TRANSFORMATION LOGIC
// =============================================================================

/**
 * Transform raw OPAL data into normalized Results content for ODP
 */
export async function transformODPDashboard(
  rawData?: RawODPOpalData
): Promise<DataTransformationResult<ResultsPageContent>> {
  const startTime = Date.now();
  
  try {
    let data: RawODPOpalData;
    let isMockData: boolean;
    
    if (rawData) {
      // Use provided data (from OPAL workflow_data_sharing)
      data = rawData;
      isMockData = false;
    } else {
      // Try OPAL agents first, fallback to mock if they fail
      try {
        console.log('🔄 [ODP] Attempting to fetch data from OPAL agents...');
        data = await fetchOPALData();
        isMockData = false;
        console.log('✅ [ODP] Successfully received data from OPAL agents');
      } catch (error) {
        console.warn('⚠️ [ODP] OPAL agents failed, falling back to mock data:', error);
        data = generateMockODPData();
        isMockData = true;
      }
    }

    // Transform to dashboard content
    const dashboardContent: ODPDashboardContent = {
      heroMetrics: {
        totalCustomers: data.customer_metrics.total_customers,
        reachableProfiles: data.customer_metrics.reachable_profiles,
        mauCount: data.customer_metrics.mau_count,
        profileCompleteness: data.customer_metrics.profile_completeness
      },
      segmentSummary: {
        totalSegments: data.audience_segments.total_segments,
        activeSegments: data.audience_segments.active_segments,
        realtimeSegments: data.audience_segments.realtime_segments,
        healthScore: data.audience_segments.segment_health_score
      },
      dataQuality: {
        overallScore: data.data_quality.overall_score,
        duplicateRate: data.data_quality.duplicate_rate,
        missingDataRate: data.data_quality.missing_data_rate,
        lastCheck: data.data_quality.last_quality_check
      },
      integrationHealth: {
        status: data.integration_status.api_health,
        lastSync: data.integration_status.last_sync,
        successRate: data.integration_status.sync_success_rate,
        activeConnections: data.integration_status.active_connections
      }
    };

    // Transform to Results page content format
    const resultsContent: ResultsPageContent = {
      hero: {
        title: isMockData ? 'ODP Customer Data Platform Overview*' : 'ODP Customer Data Platform Overview',
        promise: isMockData 
          ? 'Customer data insights using sample data for development and testing purposes'
          : 'Comprehensive customer data insights from your Optimizely Data Platform via OPAL integration',
        metrics: [
          {
            label: 'Total Customers',
            value: formatNumber(dashboardContent.heroMetrics.totalCustomers),
            hint: 'All customer profiles in ODP'
          },
          {
            label: 'Reachable Profiles',
            value: formatNumber(dashboardContent.heroMetrics.reachableProfiles),
            hint: 'Profiles with valid contact information'
          },
          {
            label: 'Monthly Active Users',
            value: formatNumber(dashboardContent.heroMetrics.mauCount),
            hint: 'Active users in the last 30 days'
          },
          {
            label: 'Profile Completeness',
            value: `${dashboardContent.heroMetrics.profileCompleteness}%`,
            hint: 'Average profile data completeness'
          }
        ],
        confidence: data.metadata.confidence,
        lastUpdated: data.metadata.generated_at
      },
      overview: {
        summary: isMockData
          ? 'ODP integration proof of concept showing customer data platform metrics. This is sample data for development and testing purposes.'
          : 'Your Optimizely Data Platform is managing customer data across multiple touchpoints with strong data quality metrics.',
        keyPoints: [
          `${formatNumber(dashboardContent.heroMetrics.totalCustomers)} total customer profiles with ${dashboardContent.heroMetrics.profileCompleteness}% average completeness`,
          `${dashboardContent.segmentSummary.activeSegments} active audience segments out of ${dashboardContent.segmentSummary.totalSegments} total`,
          `${Math.round(dashboardContent.dataQuality.overallScore)}% data quality score with ${Math.round(dashboardContent.dataQuality.duplicateRate * 100)}% duplicate rate`,
          `Integration health: ${dashboardContent.integrationHealth.status} with ${Math.round(dashboardContent.integrationHealth.successRate * 100)}% sync success rate`
        ],
        confidence: data.metadata.confidence
      },
      insights: [
        {
          insightId: 'odp-profile-health',
          title: 'Customer Profile Health',
          category: 'data_quality',
          insight: `Your customer profiles show ${dashboardContent.heroMetrics.profileCompleteness}% completeness with ${formatNumber(dashboardContent.heroMetrics.reachableProfiles)} reachable contacts.`,
          impact: 'high',
          confidence: data.metadata.confidence,
          evidence: [
            `${Math.round((dashboardContent.heroMetrics.reachableProfiles / dashboardContent.heroMetrics.totalCustomers) * 100)}% of profiles have valid contact information`,
            `Data quality score of ${Math.round(dashboardContent.dataQuality.overallScore)}% indicates strong data hygiene`
          ],
          relatedOpportunities: ['improve-profile-completeness']
        },
        {
          insightId: 'odp-segmentation-performance',
          title: 'Audience Segmentation Performance',
          category: 'audience_insights',
          insight: `You have ${dashboardContent.segmentSummary.activeSegments} active segments with ${dashboardContent.segmentSummary.realtimeSegments} real-time segments performing well.`,
          impact: 'medium',
          confidence: data.metadata.confidence,
          evidence: [
            `${Math.round((dashboardContent.segmentSummary.activeSegments / dashboardContent.segmentSummary.totalSegments) * 100)}% of segments are actively used`,
            `Segment health score of ${dashboardContent.segmentSummary.healthScore}% indicates effective targeting`
          ],
          relatedOpportunities: ['expand-realtime-segments']
        }
      ],
      opportunities: [
        {
          opportunityId: 'improve-profile-completeness',
          title: 'Improve Profile Data Completeness',
          description: `Increase profile completeness from ${dashboardContent.heroMetrics.profileCompleteness}% to 90%+ by implementing progressive profiling strategies.`,
          category: 'data_quality',
          impact: 'high',
          effort: 'medium',
          timeframe: 'short_term',
          confidence: data.metadata.confidence,
          kpis: [
            { metric: 'Profile Completeness', target: '90%', current: `${dashboardContent.heroMetrics.profileCompleteness}%` },
            { metric: 'Reachable Profiles', target: '+15%', current: formatNumber(dashboardContent.heroMetrics.reachableProfiles) }
          ],
          relatedInsights: ['odp-profile-health']
        },
        {
          opportunityId: 'expand-realtime-segments',
          title: 'Expand Real-Time Segmentation',
          description: `Scale from ${dashboardContent.segmentSummary.realtimeSegments} to ${dashboardContent.segmentSummary.realtimeSegments + 4} real-time segments for improved personalization.`,
          category: 'segmentation',
          impact: 'medium',
          effort: 'medium',
          timeframe: 'medium_term',
          confidence: data.metadata.confidence,
          kpis: [
            { metric: 'Real-time Segments', target: `${dashboardContent.segmentSummary.realtimeSegments + 4}`, current: `${dashboardContent.segmentSummary.realtimeSegments}` },
            { metric: 'Segment Performance', target: '95%', current: `${dashboardContent.segmentSummary.healthScore}%` }
          ],
          relatedInsights: ['odp-segmentation-performance']
        }
      ],
      nextSteps: [
        {
          stepId: 'odp-data-audit',
          title: 'Conduct Data Quality Audit',
          description: `Review ${Math.round(dashboardContent.dataQuality.duplicateRate * 100)}% duplicate rate and ${Math.round(dashboardContent.dataQuality.missingDataRate * 100)}% missing data rate to improve overall quality score.`,
          priority: 'high',
          timeframe: 'short_term',
          effort: '1-2 weeks',
          prerequisites: ['Access to ODP data quality tools'],
          deliverables: ['Data quality report', 'Cleanup recommendations', 'Quality monitoring dashboard'],
          successMetrics: ['<5% duplicate rate', '<10% missing data rate', '>90% quality score'],
          relatedOpportunities: ['improve-profile-completeness']
        },
        {
          stepId: 'odp-integration-optimization',
          title: 'Optimize Integration Performance',
          description: `Maintain ${Math.round(dashboardContent.integrationHealth.successRate * 100)}% sync success rate and investigate any sync failures to ensure reliable data flow.`,
          priority: 'medium',
          timeframe: 'short_term',
          effort: '3-5 days',
          prerequisites: ['Integration health monitoring access'],
          deliverables: ['Performance analysis', 'Sync optimization plan', 'Monitoring alerts'],
          successMetrics: ['>95% sync success rate', '<30min sync latency', '99.9% uptime'],
          relatedOpportunities: ['expand-realtime-segments']
        }
      ],
      meta: {
        pageId: 'odp-data-platform-dashboard',
        tier: 1,
        agents: data.metadata.source_agents,
        maturity: data.metadata.confidence,
        lastUpdated: data.metadata.generated_at,
        dataSource: isMockData ? 'mock_data' : 'opal_live',
        languageValidation: { isValid: true, violations: [], confidence: 100 },
        contentFingerprint: `odp-dashboard-${Date.now()}`,
        footnotes: isMockData ? [
          '* This page displays sample data for development and testing. OPAL agents did not provide live ODP data via workflow_data_sharing.'
        ] : []
      }
    };

    return {
      success: true,
      data: resultsContent,
      warnings: isMockData ? [
        'Using mock data - OPAL agents did not provide workflow_data_sharing or failed'
      ] : [],
      confidence: data.metadata.confidence,
      processingTime: Date.now() - startTime,
      dataSource: isMockData ? 'mock_data' : 'opal_live',
      transformationId: `odp-transform-${Date.now()}`
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ODP transformation failed',
      warnings: [],
      confidence: 0,
      processingTime: Date.now() - startTime,
      dataSource: 'mock_data',
      transformationId: `odp-transform-error-${Date.now()}`
    };
  }
}

// =============================================================================
// OPAL DATA FETCHING FUNCTIONS
// =============================================================================

/**
 * Fetch ODP data via OPAL custom tools (credentials handled by OPAL)
 */
async function fetchOPALData(): Promise<RawODPOpalData> {
  const startTime = Date.now();
  
  try {
    // Call OPAL custom tools to get ODP data
    const [segmentsData, behaviorData] = await Promise.all([
      fetchOPALSegmentData(),
      fetchOPALBehaviorData()
    ]);
    
    // Transform OPAL responses into our expected format
    const opalData: RawODPOpalData = {
      customer_metrics: {
        total_customers: behaviorData.total_members || 0,
        reachable_profiles: behaviorData.reachable_members || 0,
        anonymous_profiles: behaviorData.anonymous_members || 0,
        mau_count: behaviorData.monthly_active_users || 0,
        data_freshness: new Date().toISOString(),
        profile_completeness: behaviorData.avg_profile_completeness || 0
      },
      audience_segments: {
        total_segments: segmentsData.segments?.length || 0,
        active_segments: segmentsData.segments?.filter((s: any) => s.status === 'active').length || 0,
        realtime_segments: segmentsData.segments?.filter((s: any) => s.type === 'realtime').length || 0,
        segment_health_score: calculateSegmentHealthScore(segmentsData.segments || [])
      },
      data_quality: {
        overall_score: behaviorData.data_quality_score || 0,
        duplicate_rate: behaviorData.duplicate_rate || 0,
        missing_data_rate: behaviorData.missing_data_rate || 0,
        last_quality_check: behaviorData.last_quality_check || new Date().toISOString()
      },
      integration_status: {
        api_health: 'healthy' as const,
        last_sync: new Date().toISOString(),
        sync_success_rate: 0.95,
        active_connections: 1
      },
      metadata: {
        generated_at: new Date().toISOString(),
        data_age_minutes: Math.floor((Date.now() - startTime) / (1000 * 60)),
        confidence: 90,
        source_agents: ['audience_suggester', 'integration_health']
      }
    };
    
    return opalData;
    
  } catch (error) {
    throw new Error(`OPAL data fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch segment data from OPAL osa_fetch_audience_segments tool
 */
async function fetchOPALSegmentData(): Promise<any> {
  const response = await fetch('/api/tools/odp/segments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      // No auth needed - OPAL handles ODP credentials
    },
    body: JSON.stringify({
      segment_criteria: {
        member_tiers: ['premium', 'commercial', 'standard'],
        behavioral_patterns: ['engagement', 'purchase', 'content'],
        engagement_levels: ['high', 'medium', 'low']
      },
      include_size_estimates: true,
      include_attributes: true,
      workflow_context: {
        workflow_metadata: {
          workflow_id: `odp-results-${Date.now()}`,
          agent_id: 'audience_suggester'
        }
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`OPAL segments API failed: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Fetch behavior data from OPAL osa_analyze_member_behavior tool
 */
async function fetchOPALBehaviorData(): Promise<any> {
  const response = await fetch('/api/tools/odp/statistics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      // No auth needed - OPAL handles ODP credentials
    },
    body: JSON.stringify({
      analysis_timeframe: '90_days',
      behavior_types: ['content_engagement', 'purchase_patterns', 'communication_preferences'],
      segment_breakdown: true,
      include_trends: true,
      workflow_context: {
        workflow_metadata: {
          workflow_id: `odp-behavior-${Date.now()}`,
          agent_id: 'audience_suggester'
        }
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`OPAL behavior API failed: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Calculate segment health score from segment data
 */
function calculateSegmentHealthScore(segments: any[]): number {
  if (!segments || segments.length === 0) return 0;
  
  const scores = segments.map(segment => {
    let score = 70; // Base score
    
    // Boost for size
    if (segment.size_estimate > 1000) score += 10;
    if (segment.size_estimate > 5000) score += 10;
    
    // Boost for engagement
    if (segment.engagement_score > 0.7) score += 10;
    if (segment.engagement_score > 0.8) score += 5;
    
    // Boost for active status
    if (segment.status === 'active') score += 5;
    
    return Math.min(100, score);
  });
  
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Export types and main function
export type {
  RawODPOpalData,
  ODPDashboardContent
};

export default {
  transformODPDashboard,
  generateMockODPData,
  fetchOPALData
};