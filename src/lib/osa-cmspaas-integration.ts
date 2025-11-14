// OSA CMSPaaS Tools Integration Layer
// Bridges OSA CMSPaaS Tools with Optimizely CMS 12 PaaS content for Content Recommendations Tools

import { workflowDb } from '@/lib/database/workflow-operations';

export interface OSACMSPaaSRequest {
  tool_name: string;
  operation: string;
  parameters: Record<string, any>;
  workflow_context?: any;
}

export interface OSACMSPaaSResponse {
  success: boolean;
  tool_name: string;
  operation: string;
  data: any;
  metadata: {
    processing_time_ms: number;
    cms_source: string;
    ifpa_customization: boolean;
    timestamp: string;
  };
}

export class OSACMSPaaSIntegration {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  }

  /**
   * Process OSA CMSPaaS Tools request for content recommendations
   */
  async processContentRecommendationsRequest(request: OSACMSPaaSRequest): Promise<OSACMSPaaSResponse> {
    const startTime = Date.now();

    try {
      console.log(`🔄 [OSA CMSPaaS Integration] Processing ${request.tool_name} - ${request.operation}`);

      let result;

      switch (request.operation) {
        case 'get_content_by_topic':
          result = await this.handleContentByTopic(request.parameters);
          break;

        case 'get_content_by_section':
          result = await this.handleContentBySection(request.parameters);
          break;

        case 'get_content_catalog':
          result = await this.handleContentCatalog(request.parameters);
          break;

        case 'generate_tier_data':
          result = await this.handleTierDataGeneration(request.parameters);
          break;

        case 'refresh_cache':
          result = await this.handleCacheRefresh(request.parameters);
          break;

        default:
          throw new Error(`Unsupported OSA CMSPaaS operation: ${request.operation}`);
      }

      // Log performance metrics
      await workflowDb.logAPIPerformance({
        endpoint: `/osa-cmspaas-integration/${request.operation}`,
        method: 'POST',
        workflowId: request.workflow_context?.workflow_metadata?.workflow_id,
        responseTimeMs: Date.now() - startTime,
        statusCode: 200,
        dxpPlatform: 'osa_cmspaas_tools',
        apiCallType: request.operation
      });

      return {
        success: true,
        tool_name: request.tool_name,
        operation: request.operation,
        data: result,
        metadata: {
          processing_time_ms: Date.now() - startTime,
          cms_source: 'optimizely_cms_12_paas_with_ifpa_fallback',
          ifpa_customization: true,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [OSA CMSPaaS Integration] Failed:`, error);

      // Log error performance
      await workflowDb.logAPIPerformance({
        endpoint: `/osa-cmspaas-integration/${request.operation}`,
        method: 'POST',
        responseTimeMs: Date.now() - startTime,
        statusCode: 500,
        dxpPlatform: 'osa_cmspaas_tools',
        apiCallType: request.operation,
        errorMessage
      });

      return {
        success: false,
        tool_name: request.tool_name,
        operation: request.operation,
        data: null,
        metadata: {
          processing_time_ms: Date.now() - startTime,
          cms_source: 'error',
          ifpa_customization: false,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  private async handleContentByTopic(params: any) {
    const response = await fetch(`${this.baseUrl}/api/tools/contentrecs/by-topic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: params.topic,
        audience: params.audience || 'all',
        limit: params.limit || 10,
        content_format: params.content_format || 'all',
        workflow_context: params.workflow_context
      })
    });

    if (!response.ok) {
      throw new Error(`Content by topic request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private async handleContentBySection(params: any) {
    const response = await fetch(`${this.baseUrl}/api/tools/contentrecs/by-section`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        section: params.section,
        audience: params.audience || 'all',
        limit: params.limit || 10,
        personalization_level: params.personalization_level || 'moderate',
        workflow_context: params.workflow_context
      })
    });

    if (!response.ok) {
      throw new Error(`Content by section request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private async handleContentCatalog(params: any) {
    const queryParams = new URLSearchParams({
      catalog_type: params.catalog_type || 'both',
      include_metadata: params.include_metadata !== false ? 'true' : 'false',
      audience_filter: params.audience_filter || 'all',
      active_only: params.active_only !== false ? 'true' : 'false',
      sort_by: params.sort_by || 'popularity'
    });

    const response = await fetch(`${this.baseUrl}/api/tools/contentrecs/catalog?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Content catalog request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private async handleTierDataGeneration(params: any) {
    const response = await fetch(`${this.baseUrl}/api/tools/contentrecs/tier-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content_recommendations: params.content_recommendations,
        tier_configuration: params.tier_configuration || {
          tier1_summary: true,
          tier2_kpis: true,
          tier3_detailed: true
        },
        sop_compliance: params.sop_compliance !== false,
        confidence_scoring: params.confidence_scoring !== false,
        workflow_context: params.workflow_context
      })
    });

    if (!response.ok) {
      throw new Error(`Tier data generation request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private async handleCacheRefresh(params: any) {
    const response = await fetch(`${this.baseUrl}/api/tools/contentrecs/cache-refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cache_scope: params.cache_scope || 'all',
        force_refresh: params.force_refresh || false,
        audience_segments: params.audience_segments || [],
        priority_content: params.priority_content || [],
        cache_duration: params.cache_duration || '1_hour',
        workflow_context: params.workflow_context
      })
    });

    if (!response.ok) {
      throw new Error(`Cache refresh request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get enhanced IFPA content recommendations with OSA CMSPaaS customizations
   */
  async getEnhancedIFPARecommendations(options: {
    context: 'topic' | 'section' | 'general';
    filter_value?: string;
    member_tier?: string;
    personalization_level?: string;
    limit?: number;
  }) {
    const startTime = Date.now();

    console.log(`🎯 [OSA CMSPaaS] Getting enhanced IFPA recommendations for ${options.context}`);

    try {
      let endpoint = '/api/tools/contentrecs/';
      let requestBody: any = {
        limit: options.limit || 10,
        audience: this.mapMemberTierToAudience(options.member_tier),
        workflow_context: {
          source: 'osa_cmspaas_tools',
          enhancement_level: 'ifpa_customized'
        }
      };

      if (options.context === 'topic' && options.filter_value) {
        endpoint += 'by-topic';
        requestBody.topic = options.filter_value;
      } else if (options.context === 'section' && options.filter_value) {
        endpoint += 'by-section';
        requestBody.section = options.filter_value;
        requestBody.personalization_level = options.personalization_level || 'moderate';
      } else {
        // General catalog request
        const catalogResponse = await this.handleContentCatalog({
          catalog_type: 'both',
          include_metadata: true,
          audience_filter: this.mapMemberTierToAudience(options.member_tier)
        });
        return catalogResponse;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Enhanced IFPA recommendations request failed: ${response.status}`);
      }

      const result = await response.json();

      // Add OSA CMSPaaS enhancement metadata
      if (result.recommendations) {
        result.recommendations = result.recommendations.map((rec: any) => ({
          ...rec,
          osa_cmspaas_enhanced: true,
          ifpa_customization: {
            member_tier_optimized: !!options.member_tier,
            personalization_applied: !!options.personalization_level,
            cms_integration_active: true
          }
        }));
      }

      console.log(`✅ [OSA CMSPaaS] Enhanced ${result.recommendations?.length || 0} IFPA recommendations (${Date.now() - startTime}ms)`);
      return result;

    } catch (error) {
      console.error('❌ [OSA CMSPaaS] Enhanced recommendations failed:', error);
      throw error;
    }
  }

  private mapMemberTierToAudience(memberTier?: string): string {
    const mapping: Record<string, string> = {
      'free': 'free_members',
      'registered': 'registered_members',
      'paid': 'paid_members',
      'renewal': 'renewal_members'
    };

    return memberTier ? (mapping[memberTier.toLowerCase()] || 'all') : 'all';
  }

  /**
   * Validate OSA CMSPaaS Tools integration
   */
  async validateIntegration(): Promise<boolean> {
    try {
      console.log('🔍 [OSA CMSPaaS] Validating integration...');

      // Test basic content retrieval
      const testRequest: OSACMSPaaSRequest = {
        tool_name: 'content_recommendations',
        operation: 'get_content_catalog',
        parameters: {
          catalog_type: 'topics',
          limit: 1
        }
      };

      const response = await this.processContentRecommendationsRequest(testRequest);

      if (response.success) {
        console.log('✅ [OSA CMSPaaS] Integration validation successful');
        return true;
      } else {
        console.log('❌ [OSA CMSPaaS] Integration validation failed');
        return false;
      }

    } catch (error) {
      console.error('❌ [OSA CMSPaaS] Validation error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const osaCMSPaaSIntegration = new OSACMSPaaSIntegration();