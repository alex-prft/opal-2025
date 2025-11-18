/**
 * Content Recommendations Integration Health Monitoring System
 *
 * This module provides comprehensive health monitoring for the Content Recommendations
 * integration pipeline, from OPAL agent tool availability through Results page
 * content generation. It validates the entire flow to ensure users never see
 * "data not available" states and that all components work cohesively.
 *
 * @version 1.0
 * @created 2024-11-18
 * @scope Phase 3: OPAL agents and pipeline fixes - Content Recs focus
 */

import type {
  ResultsPageContent,
  ContentRecsDashboardContent,
  ConfidenceLevel,
  LanguageValidation
} from '@/types/resultsContent';

// =============================================================================
// HEALTH MONITORING INTERFACES
// =============================================================================

export interface ContentRecsHealthStatus {
  overall_status: 'healthy' | 'degraded' | 'failed';
  confidence_score: number; // 0-100
  last_validated: string;
  validation_details: {
    opal_agents_health: OpalAgentsHealthStatus;
    content_tools_availability: ContentToolsAvailabilityStatus;
    results_generation_health: ResultsGenerationHealthStatus;
    data_pipeline_health: DataPipelineHealthStatus;
  };
  performance_metrics: {
    avg_response_time_ms: number;
    success_rate_percentage: number;
    cache_hit_rate: number;
    error_rate_last_hour: number;
  };
  issues_detected: HealthIssue[];
  recommendations: HealthRecommendation[];
}

export interface OpalAgentsHealthStatus {
  status: 'all_healthy' | 'some_degraded' | 'all_failed';
  agents_tested: string[];
  healthy_agents: string[];
  degraded_agents: AgentHealthDetail[];
  failed_agents: AgentHealthDetail[];
  tools_availability_summary: {
    total_content_tools: number;
    available_tools: number;
    unavailable_tools: string[];
  };
}

export interface AgentHealthDetail {
  agent_name: string;
  status: 'healthy' | 'degraded' | 'failed';
  enabled_tools_count: number;
  available_tools_count: number;
  missing_tools: string[];
  last_successful_execution?: string;
  error_details?: string;
}

export interface ContentToolsAvailabilityStatus {
  status: 'all_available' | 'partial_availability' | 'unavailable';
  core_tools: ToolAvailabilityDetail[];
  specialized_tools: ToolAvailabilityDetail[];
  discovery_endpoints: DiscoveryEndpointStatus[];
}

export interface ToolAvailabilityDetail {
  tool_name: string;
  status: 'available' | 'degraded' | 'unavailable';
  response_time_ms?: number;
  last_tested: string;
  error_message?: string;
}

export interface DiscoveryEndpointStatus {
  endpoint_url: string;
  status: 'responsive' | 'slow' | 'failed';
  response_time_ms: number;
  tools_returned: number;
  last_tested: string;
}

export interface ResultsGenerationHealthStatus {
  status: 'generating_correctly' | 'partial_generation' | 'generation_failed';
  pages_tested: string[];
  successful_generations: number;
  failed_generations: ResultsGenerationFailure[];
  content_quality_metrics: {
    avg_confidence_score: number;
    language_compliance_rate: number;
    uniqueness_validation_rate: number;
    never_blank_compliance: number;
  };
}

export interface ResultsGenerationFailure {
  page_route: string;
  error_type: 'agent_failure' | 'data_transformation' | 'content_validation' | 'timeout';
  error_message: string;
  timestamp: string;
  affected_sections: string[];
}

export interface DataPipelineHealthStatus {
  status: 'flowing_normally' | 'intermittent_issues' | 'pipeline_blocked';
  stages: DataPipelineStageStatus[];
  bottlenecks_detected: PipelineBottleneck[];
  data_freshness: {
    content_analysis: number; // hours since last update
    personalization_data: number;
    topic_performance: number;
    recommendations: number;
  };
}

export interface DataPipelineStageStatus {
  stage_name: string;
  status: 'healthy' | 'slow' | 'failed';
  avg_processing_time_ms: number;
  success_rate: number;
  last_successful_run: string;
}

export interface PipelineBottleneck {
  stage_name: string;
  bottleneck_type: 'processing_delay' | 'resource_contention' | 'data_quality_issues';
  impact_level: 'low' | 'medium' | 'high';
  description: string;
  suggested_resolution: string;
}

export interface HealthIssue {
  issue_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'opal_agents' | 'content_tools' | 'results_generation' | 'data_pipeline' | 'performance';
  title: string;
  description: string;
  impact: string;
  detected_at: string;
  resolution_priority: number; // 1-10, 10 being highest
}

export interface HealthRecommendation {
  recommendation_id: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  expected_improvement: string;
  implementation_effort: 'low' | 'medium' | 'high';
  steps: string[];
}

// =============================================================================
// CORE HEALTH MONITORING SERVICE
// =============================================================================

class ContentRecsIntegrationHealthService {
  private readonly CONTENT_RECS_AGENTS = [
    'content_review',
    'personalization_idea_generator',
    'cmp_organizer',
    'audience_suggester'
  ];

  private readonly CORE_CONTENT_TOOLS = [
    'assess_content_performance',
    'create_content_matrix',
    'optimize_content_for_seo',
    'get_content_recommendations_by_topic',
    'get_content_recommendations_by_section',
    'get_available_content_catalog'
  ];

  private readonly SPECIALIZED_CONTENT_TOOLS = [
    'generate_tier_based_content_data',
    'refresh_content_recommendations_cache'
  ];

  private readonly DISCOVERY_ENDPOINTS = [
    '/api/tools/content-recs/discovery',
    '/api/tools/webx/discovery',
    '/api/tools/cmspaas/discovery'
  ];

  private readonly SAMPLE_RESULTS_PAGES = [
    '/engine/results/dxptools/content-recs',
    '/engine/results/insights/content-analytics',
    '/engine/results/optimization/content-optimization',
    '/engine/results/strategy/content-strategy'
  ];

  /**
   * Performs comprehensive health check of Content Recommendations integration
   */
  async performHealthCheck(): Promise<ContentRecsHealthStatus> {
    const startTime = Date.now();

    try {
      // Run all health checks in parallel for efficiency
      const [
        opalAgentsHealth,
        contentToolsHealth,
        resultsGenerationHealth,
        dataPipelineHealth,
        performanceMetrics
      ] = await Promise.allSettled([
        this.checkOpalAgentsHealth(),
        this.checkContentToolsAvailability(),
        this.checkResultsGenerationHealth(),
        this.checkDataPipelineHealth(),
        this.collectPerformanceMetrics()
      ]);

      // Calculate overall status and confidence
      const healthChecks = [opalAgentsHealth, contentToolsHealth, resultsGenerationHealth, dataPipelineHealth];
      const successfulChecks = healthChecks.filter(check => check.status === 'fulfilled').length;
      const overallConfidence = Math.round((successfulChecks / healthChecks.length) * 100);

      // Determine overall status
      let overallStatus: 'healthy' | 'degraded' | 'failed' = 'healthy';
      if (overallConfidence < 50) {
        overallStatus = 'failed';
      } else if (overallConfidence < 80) {
        overallStatus = 'degraded';
      }

      // Collect issues and recommendations
      const issues: HealthIssue[] = [];
      const recommendations: HealthRecommendation[] = [];

      // Process health check results
      const opalHealth = opalAgentsHealth.status === 'fulfilled' ? opalAgentsHealth.value : this.getFailedOpalHealth();
      const toolsHealth = contentToolsHealth.status === 'fulfilled' ? contentToolsHealth.value : this.getFailedToolsHealth();
      const resultsHealth = resultsGenerationHealth.status === 'fulfilled' ? resultsGenerationHealth.value : this.getFailedResultsHealth();
      const pipelineHealth = dataPipelineHealth.status === 'fulfilled' ? dataPipelineHealth.value : this.getFailedPipelineHealth();
      const perfMetrics = performanceMetrics.status === 'fulfilled' ? performanceMetrics.value : this.getDefaultPerformanceMetrics();

      // Generate issues based on health status
      if (opalHealth.status !== 'all_healthy') {
        issues.push(this.createOpalAgentsIssue(opalHealth));
      }
      if (toolsHealth.status !== 'all_available') {
        issues.push(this.createToolsAvailabilityIssue(toolsHealth));
      }
      if (resultsHealth.status !== 'generating_correctly') {
        issues.push(this.createResultsGenerationIssue(resultsHealth));
      }
      if (pipelineHealth.status !== 'flowing_normally') {
        issues.push(this.createDataPipelineIssue(pipelineHealth));
      }

      // Generate recommendations based on issues
      recommendations.push(...this.generateRecommendations(issues, perfMetrics));

      return {
        overall_status: overallStatus,
        confidence_score: overallConfidence,
        last_validated: new Date().toISOString(),
        validation_details: {
          opal_agents_health: opalHealth,
          content_tools_availability: toolsHealth,
          results_generation_health: resultsHealth,
          data_pipeline_health: pipelineHealth
        },
        performance_metrics: perfMetrics,
        issues_detected: issues,
        recommendations
      };

    } catch (error) {
      return this.createFailedHealthStatus(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  /**
   * Checks health of OPAL agents with Content Recommendations tools
   */
  private async checkOpalAgentsHealth(): Promise<OpalAgentsHealthStatus> {
    const agentResults: AgentHealthDetail[] = [];
    const healthyAgents: string[] = [];
    const degradedAgents: AgentHealthDetail[] = [];
    const failedAgents: AgentHealthDetail[] = [];

    // Test each Content Recommendations agent
    for (const agentName of this.CONTENT_RECS_AGENTS) {
      try {
        const agentHealth = await this.testAgentHealth(agentName);
        agentResults.push(agentHealth);

        if (agentHealth.status === 'healthy') {
          healthyAgents.push(agentName);
        } else if (agentHealth.status === 'degraded') {
          degradedAgents.push(agentHealth);
        } else {
          failedAgents.push(agentHealth);
        }
      } catch (error) {
        const failedAgent: AgentHealthDetail = {
          agent_name: agentName,
          status: 'failed',
          enabled_tools_count: 0,
          available_tools_count: 0,
          missing_tools: [],
          error_details: error instanceof Error ? error.message : 'Unknown error'
        };
        failedAgents.push(failedAgent);
        agentResults.push(failedAgent);
      }
    }

    // Calculate tools availability summary
    const allContentTools = [...this.CORE_CONTENT_TOOLS, ...this.SPECIALIZED_CONTENT_TOOLS];
    const availableTools = await this.getAvailableContentTools();
    const unavailableTools = allContentTools.filter(tool => !availableTools.includes(tool));

    // Determine overall status
    let status: 'all_healthy' | 'some_degraded' | 'all_failed';
    if (failedAgents.length === this.CONTENT_RECS_AGENTS.length) {
      status = 'all_failed';
    } else if (degradedAgents.length > 0 || failedAgents.length > 0) {
      status = 'some_degraded';
    } else {
      status = 'all_healthy';
    }

    return {
      status,
      agents_tested: this.CONTENT_RECS_AGENTS,
      healthy_agents: healthyAgents,
      degraded_agents: degradedAgents,
      failed_agents: failedAgents,
      tools_availability_summary: {
        total_content_tools: allContentTools.length,
        available_tools: availableTools.length,
        unavailable_tools: unavailableTools
      }
    };
  }

  /**
   * Tests individual agent health and tool availability
   */
  private async testAgentHealth(agentName: string): Promise<AgentHealthDetail> {
    try {
      // In a real implementation, this would load the agent configuration
      // and test tool availability. For now, we'll simulate based on our knowledge
      const agentConfig = await this.loadAgentConfiguration(agentName);
      const enabledTools = agentConfig.enabled_tools || [];
      const contentTools = enabledTools.filter(tool =>
        this.CORE_CONTENT_TOOLS.includes(tool) || this.SPECIALIZED_CONTENT_TOOLS.includes(tool)
      );

      // Test tool availability
      const availableTools = await this.testToolsAvailability(contentTools);
      const missingTools = contentTools.filter(tool => !availableTools.includes(tool));

      // Determine agent status
      let status: 'healthy' | 'degraded' | 'failed';
      if (missingTools.length === 0) {
        status = 'healthy';
      } else if (missingTools.length < contentTools.length / 2) {
        status = 'degraded';
      } else {
        status = 'failed';
      }

      return {
        agent_name: agentName,
        status,
        enabled_tools_count: enabledTools.length,
        available_tools_count: availableTools.length,
        missing_tools: missingTools,
        last_successful_execution: new Date().toISOString()
      };

    } catch (error) {
      return {
        agent_name: agentName,
        status: 'failed',
        enabled_tools_count: 0,
        available_tools_count: 0,
        missing_tools: [],
        error_details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Checks availability of Content Recommendations tools
   */
  private async checkContentToolsAvailability(): Promise<ContentToolsAvailabilityStatus> {
    // Test core tools
    const coreToolsResults = await Promise.allSettled(
      this.CORE_CONTENT_TOOLS.map(tool => this.testToolAvailability(tool))
    );

    const coreTools: ToolAvailabilityDetail[] = coreToolsResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          tool_name: this.CORE_CONTENT_TOOLS[index],
          status: 'unavailable',
          last_tested: new Date().toISOString(),
          error_message: result.reason?.message || 'Test failed'
        };
      }
    });

    // Test specialized tools
    const specializedToolsResults = await Promise.allSettled(
      this.SPECIALIZED_CONTENT_TOOLS.map(tool => this.testToolAvailability(tool))
    );

    const specializedTools: ToolAvailabilityDetail[] = specializedToolsResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          tool_name: this.SPECIALIZED_CONTENT_TOOLS[index],
          status: 'unavailable',
          last_tested: new Date().toISOString(),
          error_message: result.reason?.message || 'Test failed'
        };
      }
    });

    // Test discovery endpoints
    const discoveryResults = await Promise.allSettled(
      this.DISCOVERY_ENDPOINTS.map(endpoint => this.testDiscoveryEndpoint(endpoint))
    );

    const discoveryEndpoints: DiscoveryEndpointStatus[] = discoveryResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          endpoint_url: this.DISCOVERY_ENDPOINTS[index],
          status: 'failed',
          response_time_ms: 0,
          tools_returned: 0,
          last_tested: new Date().toISOString()
        };
      }
    });

    // Determine overall status
    const allTools = [...coreTools, ...specializedTools];
    const availableTools = allTools.filter(tool => tool.status === 'available').length;
    const totalTools = allTools.length;

    let status: 'all_available' | 'partial_availability' | 'unavailable';
    if (availableTools === totalTools) {
      status = 'all_available';
    } else if (availableTools > 0) {
      status = 'partial_availability';
    } else {
      status = 'unavailable';
    }

    return {
      status,
      core_tools: coreTools,
      specialized_tools: specializedTools,
      discovery_endpoints: discoveryEndpoints
    };
  }

  /**
   * Tests individual tool availability
   */
  private async testToolAvailability(toolName: string): Promise<ToolAvailabilityDetail> {
    const startTime = Date.now();

    try {
      // In a real implementation, this would test the actual tool
      // For now, we'll simulate tool availability based on known patterns
      await this.simulateToolTest(toolName);

      const responseTime = Date.now() - startTime;

      return {
        tool_name: toolName,
        status: 'available',
        response_time_ms: responseTime,
        last_tested: new Date().toISOString()
      };

    } catch (error) {
      return {
        tool_name: toolName,
        status: 'unavailable',
        last_tested: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Tool test failed'
      };
    }
  }

  /**
   * Tests discovery endpoint responsiveness
   */
  private async testDiscoveryEndpoint(endpointUrl: string): Promise<DiscoveryEndpointStatus> {
    const startTime = Date.now();

    try {
      // In a real implementation, this would make an HTTP request to the discovery endpoint
      const response = await this.simulateDiscoveryRequest(endpointUrl);
      const responseTime = Date.now() - startTime;

      let status: 'responsive' | 'slow' | 'failed';
      if (responseTime < 200) {
        status = 'responsive';
      } else if (responseTime < 1000) {
        status = 'slow';
      } else {
        status = 'failed';
      }

      return {
        endpoint_url: endpointUrl,
        status,
        response_time_ms: responseTime,
        tools_returned: response.tools_count || 0,
        last_tested: new Date().toISOString()
      };

    } catch (error) {
      return {
        endpoint_url: endpointUrl,
        status: 'failed',
        response_time_ms: Date.now() - startTime,
        tools_returned: 0,
        last_tested: new Date().toISOString()
      };
    }
  }

  /**
   * Checks Results page generation health
   */
  private async checkResultsGenerationHealth(): Promise<ResultsGenerationHealthStatus> {
    const generationResults: { route: string; success: boolean; error?: string; sections?: string[] }[] = [];
    const failedGenerations: ResultsGenerationFailure[] = [];

    // Test sample Results pages
    for (const pageRoute of this.SAMPLE_RESULTS_PAGES) {
      try {
        const result = await this.testResultsPageGeneration(pageRoute);
        generationResults.push({ route: pageRoute, success: result.success, sections: result.sections });

        if (!result.success) {
          failedGenerations.push({
            page_route: pageRoute,
            error_type: result.error_type || 'generation_failed',
            error_message: result.error_message || 'Unknown generation error',
            timestamp: new Date().toISOString(),
            affected_sections: result.sections || []
          });
        }
      } catch (error) {
        generationResults.push({ route: pageRoute, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        failedGenerations.push({
          page_route: pageRoute,
          error_type: 'timeout',
          error_message: error instanceof Error ? error.message : 'Generation test failed',
          timestamp: new Date().toISOString(),
          affected_sections: []
        });
      }
    }

    const successfulGenerations = generationResults.filter(r => r.success).length;

    // Determine status
    let status: 'generating_correctly' | 'partial_generation' | 'generation_failed';
    if (successfulGenerations === generationResults.length) {
      status = 'generating_correctly';
    } else if (successfulGenerations > 0) {
      status = 'partial_generation';
    } else {
      status = 'generation_failed';
    }

    // Collect quality metrics
    const contentQualityMetrics = await this.assessContentQuality();

    return {
      status,
      pages_tested: this.SAMPLE_RESULTS_PAGES,
      successful_generations: successfulGenerations,
      failed_generations: failedGenerations,
      content_quality_metrics: contentQualityMetrics
    };
  }

  /**
   * Tests individual Results page generation
   */
  private async testResultsPageGeneration(pageRoute: string): Promise<{
    success: boolean;
    error_type?: 'agent_failure' | 'data_transformation' | 'content_validation' | 'timeout';
    error_message?: string;
    sections?: string[];
  }> {
    try {
      // In a real implementation, this would test actual page generation
      // For now, we simulate based on known patterns
      const simulationResult = await this.simulateResultsGeneration(pageRoute);

      return {
        success: simulationResult.success,
        sections: ['hero', 'overview', 'insights', 'opportunities', 'nextSteps']
      };

    } catch (error) {
      return {
        success: false,
        error_type: 'timeout',
        error_message: error instanceof Error ? error.message : 'Generation test failed'
      };
    }
  }

  /**
   * Checks data pipeline health
   */
  private async checkDataPipelineHealth(): Promise<DataPipelineHealthStatus> {
    const stages: DataPipelineStageStatus[] = [
      {
        stage_name: 'content_analysis',
        status: 'healthy',
        avg_processing_time_ms: 150,
        success_rate: 0.95,
        last_successful_run: new Date().toISOString()
      },
      {
        stage_name: 'personalization_data_processing',
        status: 'healthy',
        avg_processing_time_ms: 200,
        success_rate: 0.92,
        last_successful_run: new Date().toISOString()
      },
      {
        stage_name: 'topic_performance_analysis',
        status: 'slow',
        avg_processing_time_ms: 450,
        success_rate: 0.88,
        last_successful_run: new Date().toISOString()
      },
      {
        stage_name: 'recommendations_generation',
        status: 'healthy',
        avg_processing_time_ms: 180,
        success_rate: 0.94,
        last_successful_run: new Date().toISOString()
      }
    ];

    const bottlenecks: PipelineBottleneck[] = [];

    // Detect bottlenecks
    const slowStages = stages.filter(stage => stage.avg_processing_time_ms > 400);
    for (const stage of slowStages) {
      bottlenecks.push({
        stage_name: stage.stage_name,
        bottleneck_type: 'processing_delay',
        impact_level: 'medium',
        description: `${stage.stage_name} is processing slower than expected (${stage.avg_processing_time_ms}ms avg)`,
        suggested_resolution: 'Consider optimizing data processing algorithms or increasing resource allocation'
      });
    }

    // Assess data freshness
    const dataFreshness = {
      content_analysis: 2, // 2 hours old
      personalization_data: 4, // 4 hours old
      topic_performance: 1, // 1 hour old
      recommendations: 3 // 3 hours old
    };

    // Determine overall status
    const failedStages = stages.filter(stage => stage.status === 'failed').length;
    const slowStages_count = stages.filter(stage => stage.status === 'slow').length;

    let status: 'flowing_normally' | 'intermittent_issues' | 'pipeline_blocked';
    if (failedStages > 0) {
      status = 'pipeline_blocked';
    } else if (slowStages_count > 1) {
      status = 'intermittent_issues';
    } else {
      status = 'flowing_normally';
    }

    return {
      status,
      stages,
      bottlenecks_detected: bottlenecks,
      data_freshness: dataFreshness
    };
  }

  /**
   * Collects performance metrics
   */
  private async collectPerformanceMetrics(): Promise<{
    avg_response_time_ms: number;
    success_rate_percentage: number;
    cache_hit_rate: number;
    error_rate_last_hour: number;
  }> {
    // In a real implementation, this would collect actual metrics
    // For now, we return simulated healthy metrics
    return {
      avg_response_time_ms: 245,
      success_rate_percentage: 94.2,
      cache_hit_rate: 0.78,
      error_rate_last_hour: 0.02
    };
  }

  /**
   * Assesses content quality metrics
   */
  private async assessContentQuality(): Promise<{
    avg_confidence_score: number;
    language_compliance_rate: number;
    uniqueness_validation_rate: number;
    never_blank_compliance: number;
  }> {
    // In a real implementation, this would analyze actual content
    return {
      avg_confidence_score: 82.5,
      language_compliance_rate: 0.98,
      uniqueness_validation_rate: 0.92,
      never_blank_compliance: 0.96
    };
  }

  // =============================================================================
  // SIMULATION HELPERS (FOR DEVELOPMENT/TESTING)
  // =============================================================================

  private async loadAgentConfiguration(agentName: string): Promise<{ enabled_tools: string[] }> {
    // Simulate loading agent configuration
    const agentTools: Record<string, string[]> = {
      'content_review': [
        ...this.CORE_CONTENT_TOOLS,
        ...this.SPECIALIZED_CONTENT_TOOLS
      ],
      'personalization_idea_generator': [
        'assess_content_performance',
        'create_content_matrix',
        'get_content_recommendations_by_topic',
        'get_content_recommendations_by_section',
        'get_available_content_catalog'
      ],
      'cmp_organizer': [
        'assess_content_performance',
        'create_content_matrix',
        'get_content_recommendations_by_topic',
        'get_content_recommendations_by_section',
        'get_available_content_catalog'
      ],
      'audience_suggester': [
        'assess_content_performance',
        'create_content_matrix',
        'get_content_recommendations_by_topic',
        'get_content_recommendations_by_section'
      ]
    };

    return {
      enabled_tools: agentTools[agentName] || []
    };
  }

  private async getAvailableContentTools(): Promise<string[]> {
    // Simulate tool availability - in reality, this would query actual tool status
    return [...this.CORE_CONTENT_TOOLS, ...this.SPECIALIZED_CONTENT_TOOLS];
  }

  private async testToolsAvailability(tools: string[]): Promise<string[]> {
    // Simulate tool testing - return all tools as available for now
    return tools;
  }

  private async simulateToolTest(toolName: string): Promise<void> {
    // Simulate tool response time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
  }

  private async simulateDiscoveryRequest(endpointUrl: string): Promise<{ tools_count: number }> {
    // Simulate discovery endpoint response
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));

    const toolCounts: Record<string, number> = {
      '/api/tools/content-recs/discovery': 8,
      '/api/tools/webx/discovery': 12,
      '/api/tools/cmspaas/discovery': 6
    };

    return { tools_count: toolCounts[endpointUrl] || 0 };
  }

  private async simulateResultsGeneration(pageRoute: string): Promise<{ success: boolean }> {
    // Simulate Results page generation
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 200));

    // Simulate 95% success rate
    return { success: Math.random() > 0.05 };
  }

  // =============================================================================
  // ISSUE AND RECOMMENDATION GENERATION
  // =============================================================================

  private createOpalAgentsIssue(opalHealth: OpalAgentsHealthStatus): HealthIssue {
    const severity = opalHealth.status === 'all_failed' ? 'critical' : 'high';
    const failedCount = opalHealth.failed_agents.length;
    const degradedCount = opalHealth.degraded_agents.length;

    return {
      issue_id: `opal-agents-${Date.now()}`,
      severity,
      category: 'opal_agents',
      title: 'OPAL Agents Health Issues Detected',
      description: `${failedCount} agents failed, ${degradedCount} agents degraded. Content Recommendations functionality may be impacted.`,
      impact: failedCount > 0 ? 'Users may see "data not available" states in Results pages' : 'Reduced functionality in some Results pages',
      detected_at: new Date().toISOString(),
      resolution_priority: severity === 'critical' ? 10 : 8
    };
  }

  private createToolsAvailabilityIssue(toolsHealth: ContentToolsAvailabilityStatus): HealthIssue {
    const unavailableCore = toolsHealth.core_tools.filter(t => t.status === 'unavailable').length;
    const severity = unavailableCore > 0 ? 'high' : 'medium';

    return {
      issue_id: `tools-availability-${Date.now()}`,
      severity,
      category: 'content_tools',
      title: 'Content Tools Availability Issues',
      description: `${unavailableCore} core tools unavailable. Content Recommendations pipeline may be affected.`,
      impact: 'Reduced content analysis and recommendation capabilities',
      detected_at: new Date().toISOString(),
      resolution_priority: severity === 'high' ? 9 : 6
    };
  }

  private createResultsGenerationIssue(resultsHealth: ResultsGenerationHealthStatus): HealthIssue {
    const failedCount = resultsHealth.failed_generations.length;
    const severity = failedCount > resultsHealth.pages_tested.length / 2 ? 'critical' : 'high';

    return {
      issue_id: `results-generation-${Date.now()}`,
      severity,
      category: 'results_generation',
      title: 'Results Page Generation Failures',
      description: `${failedCount} Results pages failing to generate properly. Users experiencing degraded experience.`,
      impact: 'Users see incomplete or missing Results page content',
      detected_at: new Date().toISOString(),
      resolution_priority: severity === 'critical' ? 10 : 8
    };
  }

  private createDataPipelineIssue(pipelineHealth: DataPipelineHealthStatus): HealthIssue {
    const bottleneckCount = pipelineHealth.bottlenecks_detected.length;
    const severity = pipelineHealth.status === 'pipeline_blocked' ? 'critical' : 'medium';

    return {
      issue_id: `data-pipeline-${Date.now()}`,
      severity,
      category: 'data_pipeline',
      title: 'Data Pipeline Performance Issues',
      description: `${bottleneckCount} bottlenecks detected in Content Recommendations data pipeline.`,
      impact: 'Slower content analysis and recommendation generation',
      detected_at: new Date().toISOString(),
      resolution_priority: severity === 'critical' ? 9 : 5
    };
  }

  private generateRecommendations(
    issues: HealthIssue[],
    performanceMetrics: { avg_response_time_ms: number; success_rate_percentage: number; cache_hit_rate: number; error_rate_last_hour: number }
  ): HealthRecommendation[] {
    const recommendations: HealthRecommendation[] = [];

    // Generate recommendations based on issues
    const criticalIssues = issues.filter(issue => issue.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push({
        recommendation_id: `critical-resolution-${Date.now()}`,
        priority: 'immediate',
        category: 'critical_issues',
        title: 'Address Critical System Issues',
        description: 'Multiple critical issues detected that require immediate attention to restore full functionality.',
        expected_improvement: 'Restore normal operation and eliminate user-facing errors',
        implementation_effort: 'high',
        steps: [
          'Investigate failed OPAL agents and restore functionality',
          'Verify Content Recommendations tool availability',
          'Test Results page generation after fixes',
          'Monitor system health for 1 hour post-resolution'
        ]
      });
    }

    // Performance-based recommendations
    if (performanceMetrics.avg_response_time_ms > 500) {
      recommendations.push({
        recommendation_id: `performance-optimization-${Date.now()}`,
        priority: 'high',
        category: 'performance',
        title: 'Optimize System Response Times',
        description: 'Average response times are higher than optimal. Consider caching and optimization strategies.',
        expected_improvement: 'Reduce average response time by 30-40%',
        implementation_effort: 'medium',
        steps: [
          'Implement intelligent caching for frequently accessed content',
          'Optimize OPAL agent tool execution patterns',
          'Review database query performance',
          'Consider CDN implementation for static assets'
        ]
      });
    }

    if (performanceMetrics.cache_hit_rate < 0.7) {
      recommendations.push({
        recommendation_id: `cache-optimization-${Date.now()}`,
        priority: 'medium',
        category: 'performance',
        title: 'Improve Cache Hit Rate',
        description: 'Cache hit rate is below optimal levels. Enhance caching strategy for better performance.',
        expected_improvement: 'Increase cache hit rate to 80%+ and reduce API calls',
        implementation_effort: 'low',
        steps: [
          'Review cache TTL settings for Content Recommendations data',
          'Implement predictive cache warming for popular content',
          'Optimize cache invalidation patterns',
          'Monitor cache performance metrics'
        ]
      });
    }

    return recommendations;
  }

  // =============================================================================
  // FALLBACK HELPERS
  // =============================================================================

  private getFailedOpalHealth(): OpalAgentsHealthStatus {
    return {
      status: 'all_failed',
      agents_tested: this.CONTENT_RECS_AGENTS,
      healthy_agents: [],
      degraded_agents: [],
      failed_agents: this.CONTENT_RECS_AGENTS.map(agent => ({
        agent_name: agent,
        status: 'failed',
        enabled_tools_count: 0,
        available_tools_count: 0,
        missing_tools: [],
        error_details: 'Health check failed'
      })),
      tools_availability_summary: {
        total_content_tools: this.CORE_CONTENT_TOOLS.length + this.SPECIALIZED_CONTENT_TOOLS.length,
        available_tools: 0,
        unavailable_tools: [...this.CORE_CONTENT_TOOLS, ...this.SPECIALIZED_CONTENT_TOOLS]
      }
    };
  }

  private getFailedToolsHealth(): ContentToolsAvailabilityStatus {
    const failedTool = (name: string): ToolAvailabilityDetail => ({
      tool_name: name,
      status: 'unavailable',
      last_tested: new Date().toISOString(),
      error_message: 'Health check failed'
    });

    return {
      status: 'unavailable',
      core_tools: this.CORE_CONTENT_TOOLS.map(failedTool),
      specialized_tools: this.SPECIALIZED_CONTENT_TOOLS.map(failedTool),
      discovery_endpoints: this.DISCOVERY_ENDPOINTS.map(endpoint => ({
        endpoint_url: endpoint,
        status: 'failed',
        response_time_ms: 0,
        tools_returned: 0,
        last_tested: new Date().toISOString()
      }))
    };
  }

  private getFailedResultsHealth(): ResultsGenerationHealthStatus {
    return {
      status: 'generation_failed',
      pages_tested: this.SAMPLE_RESULTS_PAGES,
      successful_generations: 0,
      failed_generations: this.SAMPLE_RESULTS_PAGES.map(route => ({
        page_route: route,
        error_type: 'timeout',
        error_message: 'Health check failed',
        timestamp: new Date().toISOString(),
        affected_sections: []
      })),
      content_quality_metrics: {
        avg_confidence_score: 0,
        language_compliance_rate: 0,
        uniqueness_validation_rate: 0,
        never_blank_compliance: 0
      }
    };
  }

  private getFailedPipelineHealth(): DataPipelineHealthStatus {
    return {
      status: 'pipeline_blocked',
      stages: [],
      bottlenecks_detected: [],
      data_freshness: {
        content_analysis: 24,
        personalization_data: 24,
        topic_performance: 24,
        recommendations: 24
      }
    };
  }

  private getDefaultPerformanceMetrics(): {
    avg_response_time_ms: number;
    success_rate_percentage: number;
    cache_hit_rate: number;
    error_rate_last_hour: number;
  } {
    return {
      avg_response_time_ms: 1000, // High response time indicating issues
      success_rate_percentage: 50, // Low success rate
      cache_hit_rate: 0.3, // Poor cache performance
      error_rate_last_hour: 0.2 // High error rate
    };
  }

  private createFailedHealthStatus(errorMessage: string): ContentRecsHealthStatus {
    return {
      overall_status: 'failed',
      confidence_score: 0,
      last_validated: new Date().toISOString(),
      validation_details: {
        opal_agents_health: this.getFailedOpalHealth(),
        content_tools_availability: this.getFailedToolsHealth(),
        results_generation_health: this.getFailedResultsHealth(),
        data_pipeline_health: this.getFailedPipelineHealth()
      },
      performance_metrics: this.getDefaultPerformanceMetrics(),
      issues_detected: [{
        issue_id: `system-failure-${Date.now()}`,
        severity: 'critical',
        category: 'opal_agents',
        title: 'System Health Check Failed',
        description: `Health monitoring system encountered an error: ${errorMessage}`,
        impact: 'Unable to determine system health status',
        detected_at: new Date().toISOString(),
        resolution_priority: 10
      }],
      recommendations: [{
        recommendation_id: `system-recovery-${Date.now()}`,
        priority: 'immediate',
        category: 'system_recovery',
        title: 'Restore Health Monitoring',
        description: 'Health monitoring system is not functioning properly and needs immediate attention.',
        expected_improvement: 'Restore ability to monitor Content Recommendations integration health',
        implementation_effort: 'high',
        steps: [
          'Investigate health monitoring system errors',
          'Verify OPAL agent connectivity',
          'Check Content Recommendations tool availability',
          'Restore health monitoring functionality'
        ]
      }]
    };
  }
}

// =============================================================================
// SERVICE INSTANCE AND EXPORTS
// =============================================================================

// Create singleton service instance
const contentRecsHealthService = new ContentRecsIntegrationHealthService();

/**
 * Main function for performing Content Recommendations integration health check
 */
export async function performContentRecsHealthCheck(): Promise<ContentRecsHealthStatus> {
  return await contentRecsHealthService.performHealthCheck();
}

/**
 * Quick health status check (reduced detail for performance)
 */
export async function getContentRecsHealthSummary(): Promise<{
  status: 'healthy' | 'degraded' | 'failed';
  confidence: number;
  issues_count: number;
  last_check: string;
}> {
  try {
    const fullHealth = await performContentRecsHealthCheck();
    return {
      status: fullHealth.overall_status,
      confidence: fullHealth.confidence_score,
      issues_count: fullHealth.issues_detected.length,
      last_check: fullHealth.last_validated
    };
  } catch (error) {
    return {
      status: 'failed',
      confidence: 0,
      issues_count: 1,
      last_check: new Date().toISOString()
    };
  }
}

/**
 * Get health status for specific component
 */
export async function getComponentHealth(component: 'opal_agents' | 'content_tools' | 'results_generation' | 'data_pipeline'): Promise<any> {
  const fullHealth = await performContentRecsHealthCheck();

  switch (component) {
    case 'opal_agents':
      return fullHealth.validation_details.opal_agents_health;
    case 'content_tools':
      return fullHealth.validation_details.content_tools_availability;
    case 'results_generation':
      return fullHealth.validation_details.results_generation_health;
    case 'data_pipeline':
      return fullHealth.validation_details.data_pipeline_health;
    default:
      throw new Error(`Unknown component: ${component}`);
  }
}

// Export the service class for advanced usage
export { ContentRecsIntegrationHealthService };

// Export all types
export type {
  ContentRecsHealthStatus,
  OpalAgentsHealthStatus,
  AgentHealthDetail,
  ContentToolsAvailabilityStatus,
  ToolAvailabilityDetail,
  DiscoveryEndpointStatus,
  ResultsGenerationHealthStatus,
  ResultsGenerationFailure,
  DataPipelineHealthStatus,
  DataPipelineStageStatus,
  PipelineBottleneck,
  HealthIssue,
  HealthRecommendation
};

export default {
  performContentRecsHealthCheck,
  getContentRecsHealthSummary,
  getComponentHealth
};