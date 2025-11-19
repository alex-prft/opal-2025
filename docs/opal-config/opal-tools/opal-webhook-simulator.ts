/**
 * OPAL Webhook Simulator for Testing
 *
 * Comprehensive testing utility that simulates Optimizely Opal webhooks
 * and osa_workflow_data events for end-to-end testing of the OPAL Connector.
 *
 * Features:
 * - Realistic agent execution data generation
 * - Multiple workflow simulation scenarios
 * - Agent failure simulation
 * - Performance testing with concurrent workflows
 */

import {
  OPALAgentId,
  OSAAgentData,
  OSAWorkflowParameters,
  BaseAgentExecutionResult,
  ContentReviewExecutionResult,
  GeoAuditExecutionResult,
  AudienceSuggesterExecutionResult,
  ExperimentBlueprintersExecutionResult,
  PersonalizationIdeaGeneratorExecutionResult,
  RoadmapGeneratorExecutionResult,
  IntegrationHealthExecutionResult,
  CMPOrganizerExecutionResult,
  CustomerJourneyExecutionResult
} from '@/lib/types/opal-types';
import { OPAL_AGENT_CONFIGS } from '@/lib/validation/opal-validation';

// ============================================================================
// MOCK DATA GENERATION
// ============================================================================

/**
 * Generate realistic mock execution results based on agent type
 */
class MockDataGenerator {
  private static readonly SAMPLE_CLIENTS = [
    'IFPA Strategy Demo',
    'E-commerce Optimization Co',
    'Digital Marketing Solutions',
    'Retail Experience Corp',
    'SaaS Growth Platform'
  ];

  private static readonly SAMPLE_BUSINESS_OBJECTIVES = [
    'Increase conversion rate by 15%',
    'Improve user engagement metrics',
    'Optimize customer acquisition cost',
    'Enhance personalization effectiveness',
    'Reduce bounce rate on key pages',
    'Improve mobile experience performance',
    'Increase average order value',
    'Optimize checkout funnel conversion'
  ];

  /**
   * Generate random ID with prefix
   */
  static generateId(prefix: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Generate realistic execution time based on agent configuration
   */
  static generateExecutionTime(agentId: OPALAgentId): number {
    const config = OPAL_AGENT_CONFIGS[agentId];
    const baseTime = config.estimated_runtime_ms;
    const variation = 0.3; // ±30% variation
    const minTime = baseTime * (1 - variation);
    const maxTime = baseTime * (1 + variation);
    return Math.floor(Math.random() * (maxTime - minTime) + minTime);
  }

  /**
   * Generate base execution result with common fields
   */
  static generateBaseExecutionResult(): BaseAgentExecutionResult {
    const dataPoints = Math.floor(Math.random() * 5000) + 100;
    const confidence = 0.6 + (Math.random() * 0.4); // 0.6-1.0

    return {
      summary: this.generateAgentSummary(),
      recommendations: this.generateRecommendations(),
      confidence_score: Math.round(confidence * 100) / 100,
      data_points_analyzed: dataPoints,
      insights: {
        key_findings: [
          'Performance optimization opportunities identified',
          'User behavior patterns analyzed',
          'Conversion funnel bottlenecks detected'
        ],
        trend_analysis: 'Positive trajectory with seasonal variations',
        priority_score: Math.round(Math.random() * 100),
        impact_estimate: `${Math.round(Math.random() * 25 + 5)}% improvement potential`
      },
      references: [
        'https://analytics.example.com/report/123',
        'https://testing.example.com/experiment/456'
      ],
      tags: ['optimization', 'analysis', 'data-driven']
    };
  }

  static generateAgentSummary(): string {
    const summaries = [
      'Comprehensive analysis completed successfully with actionable insights identified across multiple optimization dimensions.',
      'In-depth evaluation reveals significant opportunities for performance enhancement and user experience improvement.',
      'Strategic assessment demonstrates clear paths forward with quantifiable impact potential for business objectives.',
      'Detailed analysis uncovers key optimization opportunities with data-driven recommendations for implementation.',
      'Thorough investigation provides comprehensive insights into performance drivers and improvement strategies.'
    ];
    return summaries[Math.floor(Math.random() * summaries.length)];
  }

  static generateRecommendations(): string[] {
    const allRecommendations = [
      'Implement A/B testing for key conversion elements',
      'Optimize page load speed for mobile devices',
      'Enhance personalization algorithms based on user behavior',
      'Redesign checkout flow to reduce abandonment',
      'Improve content relevancy through dynamic targeting',
      'Implement progressive profiling for lead generation',
      'Optimize email campaign timing and frequency',
      'Enhance product recommendation engine accuracy',
      'Improve site search functionality and results',
      'Implement exit-intent popups for conversion recovery'
    ];

    const count = Math.floor(Math.random() * 4) + 3; // 3-6 recommendations
    return allRecommendations
      .sort(() => 0.5 - Math.random())
      .slice(0, count);
  }

  /**
   * Generate agent-specific execution results
   */
  static generateAgentSpecificResult(agentId: OPALAgentId): any {
    const baseResult = this.generateBaseExecutionResult();

    switch (agentId) {
      case 'content_review':
        return {
          ...baseResult,
          content_quality_score: Math.floor(Math.random() * 30) + 70, // 70-100
          seo_optimization_score: Math.floor(Math.random() * 25) + 75, // 75-100
          readability_score: Math.floor(Math.random() * 20) + 80, // 80-100
          content_gaps: ['Missing H2 headings', 'Limited internal linking', 'Insufficient meta descriptions'],
          optimization_opportunities: [
            {
              type: 'seo' as const,
              description: 'Optimize title tags for target keywords',
              impact: 'high' as const
            },
            {
              type: 'readability' as const,
              description: 'Simplify complex sentences',
              impact: 'medium' as const
            }
          ],
          keyword_analysis: {
            target_keywords: ['conversion optimization', 'user experience', 'A/B testing'],
            keyword_density: 0.025,
            competitor_keywords: ['personalization', 'analytics', 'growth hacking']
          }
        } as ContentReviewExecutionResult;

      case 'geo_audit':
        return {
          ...baseResult,
          geographic_performance: [
            {
              region: 'North America',
              performance_score: 85,
              conversion_rate: 0.045,
              traffic_volume: 125000
            },
            {
              region: 'Europe',
              performance_score: 78,
              conversion_rate: 0.039,
              traffic_volume: 89000
            },
            {
              region: 'Asia Pacific',
              performance_score: 72,
              conversion_rate: 0.035,
              traffic_volume: 67000
            }
          ],
          underperforming_regions: ['Southeast Asia', 'South America'],
          growth_opportunities: [
            {
              region: 'Europe',
              potential_uplift: 15,
              recommended_actions: ['Localize content', 'Optimize for local search', 'Adjust pricing strategy']
            }
          ],
          regional_preferences: {
            payment_methods: { europe: 'SEPA', asia: 'digital_wallets', na: 'credit_cards' },
            language_localization: { europe: 'required', asia: 'highly_recommended', na: 'optional' }
          }
        } as GeoAuditExecutionResult;

      case 'audience_suggester':
        return {
          ...baseResult,
          audience_segments: [
            {
              segment_name: 'High-Value Customers',
              size_estimate: 25000,
              characteristics: { avg_order_value: 250, purchase_frequency: 'monthly' },
              conversion_potential: 85,
              targeting_criteria: { demographics: 'age_35_55', behavior: 'repeat_buyers' }
            },
            {
              segment_name: 'Mobile-First Users',
              size_estimate: 150000,
              characteristics: { device_preference: 'mobile', session_duration: 'short' },
              conversion_potential: 60,
              targeting_criteria: { device: 'mobile', time: 'evening_weekend' }
            }
          ],
          lookalike_opportunities: [
            {
              source_segment: 'High-Value Customers',
              similarity_score: 0.82,
              estimated_reach: 75000
            }
          ],
          behavioral_patterns: {
            purchase_timing: 'weekend_evenings',
            content_preferences: ['video', 'interactive'],
            engagement_channels: ['email', 'push_notifications']
          },
          demographic_insights: {
            age_distribution: { '25-34': 0.35, '35-44': 0.40, '45-54': 0.25 },
            income_brackets: { 'high': 0.30, 'medium': 0.50, 'entry': 0.20 }
          }
        } as AudienceSuggesterExecutionResult;

      case 'experiment_blueprinter':
        return {
          ...baseResult,
          experiment_proposals: [
            {
              experiment_name: 'Checkout Flow Optimization',
              hypothesis: 'Simplifying the checkout process will increase conversion rate by reducing abandonment',
              success_metrics: ['conversion_rate', 'abandonment_rate', 'time_to_complete'],
              variations: [
                {
                  name: 'Single Page Checkout',
                  description: 'Combine all checkout steps into one page',
                  implementation_details: 'Remove multi-step progress and use accordion sections'
                },
                {
                  name: 'Guest Checkout Priority',
                  description: 'Make guest checkout more prominent than account creation',
                  implementation_details: 'Move guest option above account creation with visual emphasis'
                }
              ],
              estimated_duration_days: 21,
              sample_size_required: 50000,
              expected_lift: 12,
              confidence_level: 0.95
            }
          ],
          testing_roadmap: [
            {
              quarter: 'Q1 2024',
              experiments: ['Checkout Flow Optimization', 'Product Page Layout'],
              dependencies: ['Analytics Implementation', 'Testing Infrastructure']
            }
          ],
          statistical_power_analysis: {
            minimum_detectable_effect: 0.05,
            sample_size_calculation: 'Based on current traffic and baseline conversion rate',
            expected_runtime: '3-4 weeks for statistical significance'
          }
        } as ExperimentBlueprintersExecutionResult;

      case 'personalization_idea_generator':
        return {
          ...baseResult,
          personalization_strategies: [
            {
              strategy_name: 'Behavioral Targeting',
              target_segments: ['Returning Visitors', 'High-Intent Browsers'],
              personalization_type: 'content' as const,
              implementation_complexity: 'medium' as const,
              expected_impact: 85,
              implementation_details: 'Dynamic content based on browsing history and previous interactions'
            }
          ],
          content_variations: [
            {
              element_type: 'hero_banner',
              variations: {
                new_visitors: 'Welcome message with value proposition',
                returning_customers: 'Personalized product recommendations',
                high_value: 'Exclusive offers and VIP content'
              },
              targeting_rules: { visitor_type: 'classification', purchase_history: 'value_tier' }
            }
          ],
          journey_optimizations: {
            onboarding: 'Progressive profiling with contextual ask',
            consideration: 'Comparison tools and social proof',
            purchase: 'Urgency and scarcity messaging',
            retention: 'Loyalty rewards and exclusive content'
          },
          real_time_triggers: [
            'Cart abandonment (15 minute delay)',
            'Category page exit intent',
            'Search with no results',
            'Multiple product views without add to cart'
          ]
        } as PersonalizationIdeaGeneratorExecutionResult;

      case 'roadmap_generator':
        return {
          ...baseResult,
          implementation_phases: [
            {
              phase_name: 'Foundation Setup',
              duration_weeks: 4,
              deliverables: ['Analytics infrastructure', 'Testing framework', 'Baseline measurements'],
              dependencies: ['Technical requirements', 'Team training'],
              resources_required: {
                developers: 2,
                designers: 1,
                data_analysts: 1,
                other: { project_manager: 1 }
              },
              success_criteria: ['All tracking implemented', 'Testing tools operational', 'Team onboarded']
            }
          ],
          timeline_milestones: [
            {
              milestone_name: 'MVP Launch',
              target_date: '2024-03-15',
              deliverables: ['Core functionality', 'Basic analytics', 'User feedback system'],
              stakeholders: ['Engineering', 'Product', 'Marketing']
            }
          ],
          risk_assessment: [
            {
              risk_category: 'Technical',
              probability: 'medium' as const,
              impact: 'high' as const,
              mitigation_strategy: 'Phased rollout with fallback plans'
            }
          ],
          resource_allocation: {
            development: 0.60,
            design: 0.20,
            testing: 0.15,
            management: 0.05
          }
        } as RoadmapGeneratorExecutionResult;

      case 'integration_health':
        return {
          ...baseResult,
          integration_status: [
            {
              service_name: 'Analytics API',
              status: 'healthy' as const,
              response_time_ms: 120,
              uptime_percentage: 99.8,
              last_check: new Date().toISOString(),
              error_rate: 0.002
            },
            {
              service_name: 'Content Management',
              status: 'warning' as const,
              response_time_ms: 450,
              uptime_percentage: 98.5,
              last_check: new Date().toISOString(),
              error_rate: 0.015
            }
          ],
          performance_metrics: {
            api_latency_ms: 285,
            throughput_rps: 150,
            error_count_24h: 23,
            data_sync_status: 'synced' as const
          },
          health_recommendations: [
            {
              priority: 'high' as const,
              category: 'performance' as const,
              recommendation: 'Implement caching layer for content API',
              estimated_effort: 'days' as const
            }
          ],
          integration_dependencies: {
            critical_systems: ['User Authentication', 'Payment Processing'],
            optional_systems: ['Email Marketing', 'Social Media APIs'],
            monitoring_coverage: 0.85
          }
        } as IntegrationHealthExecutionResult;

      case 'cmp_organizer':
        return {
          ...baseResult,
          campaign_workflows: [
            {
              workflow_name: 'Email Campaign Automation',
              automation_level: 75,
              efficiency_score: 82,
              bottlenecks: ['Manual approval process', 'Content review delays'],
              optimization_suggestions: ['Implement auto-approval rules', 'Streamline content templates']
            }
          ],
          process_improvements: [
            {
              current_process: 'Manual campaign setup and approval',
              improved_process: 'Template-based automation with conditional approval',
              time_savings_hours: 12,
              effort_reduction_percentage: 60
            }
          ],
          automation_opportunities: [
            {
              task_name: 'Audience Segmentation',
              current_manual_effort_hours: 8,
              automation_complexity: 'medium' as const,
              roi_estimate: 4.2
            }
          ],
          workflow_dependencies: {
            data_sources: ['CRM', 'Analytics Platform', 'Customer Database'],
            approval_chains: ['Marketing Manager', 'Compliance', 'Brand Guidelines'],
            integration_points: ['Email Platform', 'Social Media', 'Web Analytics']
          }
        } as CMPOrganizerExecutionResult;

      case 'customer_journey':
        return {
          ...baseResult,
          journey_stages: [
            {
              stage_name: 'Awareness',
              touchpoints: ['Search Engine', 'Social Media', 'Referral Links'],
              conversion_rate: 0.12,
              drop_off_rate: 0.68,
              optimization_score: 75,
              pain_points: ['Slow page load', 'Unclear value proposition'],
              opportunities: ['Improve messaging clarity', 'Add social proof']
            },
            {
              stage_name: 'Consideration',
              touchpoints: ['Product Pages', 'Comparison Tools', 'Reviews'],
              conversion_rate: 0.25,
              drop_off_rate: 0.45,
              optimization_score: 68,
              pain_points: ['Information overload', 'Missing comparison data'],
              opportunities: ['Simplify product selection', 'Add guided recommendations']
            }
          ],
          cross_channel_insights: [
            {
              channel_combination: ['Email', 'Website', 'Social Media'],
              performance_score: 82,
              user_preference: 0.65,
              attribution_weight: 0.35
            }
          ],
          journey_optimizations: [
            {
              stage: 'Consideration',
              optimization_type: 'content' as const,
              description: 'Add interactive product selector with personalized recommendations',
              expected_impact: 18,
              implementation_effort: 'medium' as const
            }
          ],
          behavioral_flows: {
            high_intent_path: 'Direct → Product → Checkout',
            research_path: 'Search → Category → Compare → Reviews → Product',
            impulse_path: 'Social → Landing → Quick Add → Checkout'
          },
          retention_insights: {
            repeat_purchase_rate: 0.32,
            average_time_to_repurchase: '45 days',
            retention_drivers: ['Product quality', 'Customer service', 'Personalized offers']
          }
        } as CustomerJourneyExecutionResult;

      default:
        return baseResult;
    }
  }

  /**
   * Generate random client name
   */
  static generateClientName(): string {
    return this.SAMPLE_CLIENTS[Math.floor(Math.random() * this.SAMPLE_CLIENTS.length)];
  }

  /**
   * Generate random business objectives
   */
  static generateBusinessObjectives(): string[] {
    const count = Math.floor(Math.random() * 3) + 2; // 2-4 objectives
    return this.SAMPLE_BUSINESS_OBJECTIVES
      .sort(() => 0.5 - Math.random())
      .slice(0, count);
  }
}

// ============================================================================
// WEBHOOK SIMULATOR
// ============================================================================

export interface SimulationConfig {
  /** Number of workflows to simulate */
  workflowCount?: number;

  /** Agent IDs to include (all 9 by default) */
  agentIds?: OPALAgentId[];

  /** Delay between agent completions (ms) */
  agentDelay?: number;

  /** Failure rate (0-1) for testing error handling */
  failureRate?: number;

  /** Client name for simulation */
  clientName?: string;

  /** Business objectives for simulation */
  businessObjectives?: string[];

  /** Enable verbose logging */
  verbose?: boolean;
}

export class OpalWebhookSimulator {
  private baseUrl: string;
  private defaultConfig: SimulationConfig = {
    workflowCount: 1,
    agentIds: [
      'content_review',
      'geo_audit',
      'audience_suggester',
      'experiment_blueprinter',
      'personalization_idea_generator',
      'roadmap_generator',
      'integration_health',
      'cmp_organizer',
      'customer_journey'
    ],
    agentDelay: 2000,
    failureRate: 0.1, // 10% failure rate
    verbose: true
  };

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Simulate a complete OSA workflow with all agents
   */
  async simulateWorkflow(config: SimulationConfig = {}): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const workflowId = MockDataGenerator.generateId('workflow');

    if (finalConfig.verbose) {
      console.log(`🎭 [OpalWebhookSimulator] Starting workflow simulation: ${workflowId}`);
      console.log(`📋 Configuration:`, finalConfig);
    }

    // Generate agent data for all agents
    const agentDataList: OSAAgentData[] = finalConfig.agentIds!.map(agentId => {
      const executionTime = MockDataGenerator.generateExecutionTime(agentId);
      const success = Math.random() > finalConfig.failureRate!;

      return {
        agent_id: agentId,
        agent_name: OPAL_AGENT_CONFIGS[agentId].name,
        workflow_id: workflowId,
        execution_results: MockDataGenerator.generateAgentSpecificResult(agentId),
        metadata: {
          execution_time_ms: executionTime,
          timestamp: new Date().toISOString(),
          success: success,
          error_message: success ? undefined : `Simulated failure for testing: ${agentId}`,
          started_at: new Date(Date.now() - executionTime).toISOString(),
          completed_at: new Date().toISOString(),
          progress_percentage: success ? 100 : Math.floor(Math.random() * 50),
          retry_count: success ? 0 : Math.floor(Math.random() * 3)
        },
        output_data: {
          simulation: true,
          generated_at: new Date().toISOString(),
          agent_category: OPAL_AGENT_CONFIGS[agentId].category
        }
      };
    });

    // Create OSA workflow payload
    const workflowPayload: OSAWorkflowParameters = {
      workflow_id: workflowId,
      agent_data: agentDataList,
      client_name: finalConfig.clientName || MockDataGenerator.generateClientName(),
      business_objectives: finalConfig.businessObjectives || MockDataGenerator.generateBusinessObjectives(),
      workflow_timestamp: new Date().toISOString(),
      workflow_execution_time_ms: Math.max(...agentDataList.map(a => a.metadata.execution_time_ms)),
      workflow_metadata: {
        simulation: true,
        simulator_version: '1.0.0',
        total_agents: agentDataList.length,
        success_count: agentDataList.filter(a => a.metadata.success).length,
        failure_count: agentDataList.filter(a => !a.metadata.success).length
      }
    };

    // Send to OSA workflow endpoint
    await this.sendToOSAEndpoint(workflowPayload, finalConfig.verbose);

    if (finalConfig.verbose) {
      console.log(`✅ [OpalWebhookSimulator] Workflow simulation completed: ${workflowId}`);
    }
  }

  /**
   * Simulate multiple concurrent workflows for performance testing
   */
  async simulateMultipleWorkflows(config: SimulationConfig = {}): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config };

    console.log(`🚀 [OpalWebhookSimulator] Starting ${finalConfig.workflowCount} concurrent workflow simulations`);

    const promises = Array.from({ length: finalConfig.workflowCount! }, (_, index) =>
      this.simulateWorkflow({
        ...finalConfig,
        verbose: false // Reduce log noise for concurrent simulations
      })
    );

    const startTime = Date.now();
    await Promise.all(promises);
    const totalTime = Date.now() - startTime;

    console.log(`✅ [OpalWebhookSimulator] Completed ${finalConfig.workflowCount} workflows in ${totalTime}ms`);
    console.log(`📊 Performance: ${Math.round(finalConfig.workflowCount! / (totalTime / 1000))} workflows/second`);
  }

  /**
   * Send workflow data to OSA endpoint
   */
  private async sendToOSAEndpoint(payload: OSAWorkflowParameters, verbose: boolean = true): Promise<void> {
    try {
      const url = `${this.baseUrl}/api/opal/osa-workflow`;

      if (verbose) {
        console.log(`📤 [OpalWebhookSimulator] Sending to ${url}:`, {
          workflow_id: payload.workflow_id,
          agent_count: payload.agent_data.length,
          client: payload.client_name
        });
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-simulation-token',
          'User-Agent': 'OpalWebhookSimulator/1.0.0'
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseData.message || 'Unknown error'}`);
      }

      if (verbose) {
        console.log(`✅ [OpalWebhookSimulator] Response:`, {
          status: responseData.status,
          agents_received: responseData.agents_received?.length || 0,
          message: responseData.message
        });
      }

    } catch (error) {
      console.error(`❌ [OpalWebhookSimulator] Failed to send workflow data:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        workflow_id: payload.workflow_id
      });
      throw error;
    }
  }

  /**
   * Test specific agent with custom data
   */
  async testAgent(
    agentId: OPALAgentId,
    customData?: Partial<OSAAgentData>
  ): Promise<void> {
    console.log(`🧪 [OpalWebhookSimulator] Testing individual agent: ${agentId}`);

    const workflowId = MockDataGenerator.generateId('test');
    const executionTime = MockDataGenerator.generateExecutionTime(agentId);

    const agentData: OSAAgentData = {
      agent_id: agentId,
      agent_name: OPAL_AGENT_CONFIGS[agentId].name,
      workflow_id: workflowId,
      execution_results: MockDataGenerator.generateAgentSpecificResult(agentId),
      metadata: {
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString(),
        success: true,
        started_at: new Date(Date.now() - executionTime).toISOString(),
        completed_at: new Date().toISOString()
      },
      output_data: {
        test_mode: true,
        agent_category: OPAL_AGENT_CONFIGS[agentId].category
      },
      ...customData
    };

    const workflowPayload: OSAWorkflowParameters = {
      workflow_id: workflowId,
      agent_data: [agentData],
      client_name: 'Test Client - Individual Agent',
      business_objectives: ['Test agent functionality'],
      workflow_timestamp: new Date().toISOString()
    };

    await this.sendToOSAEndpoint(workflowPayload, true);
    console.log(`✅ [OpalWebhookSimulator] Agent test completed: ${agentId}`);
  }

  /**
   * Simulate agent failure scenarios
   */
  async simulateFailureScenarios(): Promise<void> {
    console.log(`💥 [OpalWebhookSimulator] Testing failure scenarios`);

    const scenarios = [
      { name: 'Validation Error', failureRate: 0, invalidData: true },
      { name: 'Agent Processing Error', failureRate: 1, invalidData: false },
      { name: 'Partial Workflow Failure', failureRate: 0.5, invalidData: false }
    ];

    for (const scenario of scenarios) {
      console.log(`🧪 Testing scenario: ${scenario.name}`);

      const config: SimulationConfig = {
        workflowCount: 1,
        failureRate: scenario.failureRate,
        agentIds: ['content_review', 'geo_audit', 'audience_suggester'], // Subset for faster testing
        verbose: true
      };

      try {
        await this.simulateWorkflow(config);
        console.log(`✅ Scenario completed: ${scenario.name}`);
      } catch (error) {
        console.log(`⚠️ Scenario failed as expected: ${scenario.name} - ${error}`);
      }
    }

    console.log(`✅ [OpalWebhookSimulator] Failure scenario testing completed`);
  }
}

// ============================================================================
// EXPORT AND USAGE
// ============================================================================

export { MockDataGenerator };

// Example usage:
// const simulator = new OpalWebhookSimulator();
// await simulator.simulateWorkflow({ verbose: true });
// await simulator.simulateMultipleWorkflows({ workflowCount: 5 });
// await simulator.testAgent('content_review');
// await simulator.simulateFailureScenarios();