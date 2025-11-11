import { NextRequest, NextResponse } from 'next/server';
import { AgentDataPayload } from '@/types/agent-data';
import fs from 'fs';
import path from 'path';

// Admin override store path
const OVERRIDE_STORE_PATH = path.join(process.cwd(), 'data', 'agent-overrides.json');

// Ensure data directory exists
const ensureDataDirectory = () => {
  const dataDir = path.dirname(OVERRIDE_STORE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Load admin overrides
const loadOverrides = () => {
  try {
    ensureDataDirectory();
    if (fs.existsSync(OVERRIDE_STORE_PATH)) {
      return JSON.parse(fs.readFileSync(OVERRIDE_STORE_PATH, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading overrides:', error);
  }
  return {};
};

// Save admin overrides
const saveOverrides = (overrides: any) => {
  try {
    ensureDataDirectory();
    fs.writeFileSync(OVERRIDE_STORE_PATH, JSON.stringify(overrides, null, 2));
  } catch (error) {
    console.error('Error saving overrides:', error);
  }
};

// Enhanced mock data for OPAL agents
const AGENT_DATA: Record<string, Omit<AgentDataPayload, 'success' | 'agent_id' | 'timestamp'>> = {
  integration_health: {
    dataSentToOSA: {
      integration_status: "healthy",
      uptime_percentage: 99.8,
      api_response_times: {
        experimentation: "120ms",
        personalization: "85ms",
        cms: "95ms"
      },
      error_rates: {
        experimentation: 0.01,
        personalization: 0.005,
        cms: 0.02
      },
      last_sync: "2024-11-11T12:30:00Z",
      health_score: 95
    },
    optimizelyDxpTools: [
      "Experimentation Platform",
      "Personalization Engine",
      "Content Management System",
      "Analytics Dashboard",
      "Feature Flags"
    ],
    strategyAssistance: {
      recommendations: [
        "Monitor API response times for performance optimization",
        "Review error rate patterns to identify integration issues",
        "Generate uptime reports for stakeholder communication",
        "Create alerts for critical integration failures"
      ]
    },
    opalCustomTools: [
      {
        toolName: "integration_health_monitor",
        description: "Continuously monitors DXP integration status and performance metrics"
      },
      {
        toolName: "api_performance_analyzer",
        description: "Analyzes API response times and identifies bottlenecks"
      },
      {
        toolName: "error_pattern_detector",
        description: "Detects patterns in integration errors and suggests fixes"
      }
    ],
    osaSuggestions: {
      recommendationService: [
        "Include API health scores in strategy recommendations",
        "Add automated alerts for integration threshold breaches"
      ],
      knowledgeRetrievalService: [
        "Pull real-time integration metrics for context",
        "Include historical performance trends in knowledge base"
      ],
      preferencesPolicyService: [
        "Allow users to set custom health score thresholds",
        "Enable notification preferences for different integration statuses"
      ]
    },
    useCaseScenarios: [
      "Daily health monitoring dashboard for DevOps teams",
      "Automated alerting system for integration failures",
      "Performance trend analysis for capacity planning",
      "SLA compliance reporting for stakeholders"
    ],
    nextBestActions: [
      "Set up automated monitoring dashboards",
      "Configure alerting thresholds based on business requirements",
      "Implement trending analysis for proactive maintenance"
    ],
    lastDataSent: "2024-11-11T13:25:00Z"
  },

  content_review: {
    dataSentToOSA: {
      contentScore: 87,
      variationCount: 5,
      experiments_reviewed: 23,
      content_variations: {
        total_variations: 156,
        approved_variations: 142,
        flagged_variations: 14
      },
      seo_optimization_level: 92,
      accessibility_compliance: 95,
      brand_consistency_score: 89
    },
    optimizelyDxpTools: [
      "CMS",
      "Experimentation",
      "Content Management System",
      "Web Personalization",
      "A/B Testing Suite"
    ],
    strategyAssistance: {
      recommendations: [
        "Run a content freshness audit",
        "Review semantic alignment",
        "Generate content performance reports by variation",
        "Implement automated content quality checks"
      ]
    },
    opalCustomTools: [
      {
        toolName: "content_insight_generator",
        description: "Analyzes content performance and freshness"
      },
      {
        toolName: "content_quality_analyzer",
        description: "Analyzes content quality across variations and experiments"
      },
      {
        toolName: "brand_compliance_checker",
        description: "Ensures content variations maintain brand consistency"
      }
    ],
    osaSuggestions: {
      recommendationService: [
        "Add semantic scoring to recommendations",
        "Include content freshness metrics in strategy suggestions"
      ],
      knowledgeRetrievalService: [
        "Include CMS metadata for better context",
        "Pull content performance history for analysis"
      ],
      preferencesPolicyService: [
        "Allow user to prioritize content types",
        "Enable content quality threshold settings"
      ]
    },
    useCaseScenarios: [
      "Automated content quality assurance for marketing campaigns",
      "Brand compliance checking across all content variations",
      "SEO optimization tracking and recommendations",
      "Content performance benchmarking against industry standards"
    ],
    nextBestActions: [
      "Implement automated content scoring workflows",
      "Set up brand compliance monitoring alerts",
      "Create content performance comparison dashboards"
    ],
    lastDataSent: "2024-11-11T13:20:00Z"
  },

  geo_audit: {
    dataSentToOSA: {
      geoScore: 92,
      aiReadiness: true,
      geo_regions_analyzed: 15,
      search_engine_optimization: {
        google_ai_score: 85,
        bing_chat_score: 78,
        claude_visibility: 92
      },
      content_gaps_identified: 12,
      ai_search_recommendations: 8
    },
    optimizelyDxpTools: [
      "SEO Toolkit",
      "Content Management System",
      "Personalization Engine",
      "Analytics Dashboard"
    ],
    strategyAssistance: {
      recommendations: [
        "Optimize for voice search",
        "Add structured data",
        "Create region-specific content strategies",
        "Generate AI search visibility reports"
      ]
    },
    opalCustomTools: [
      {
        toolName: "geo_optimizer",
        description: "Improves AI search engine visibility"
      },
      {
        toolName: "ai_search_optimizer",
        description: "Optimizes content for AI-powered search engines"
      },
      {
        toolName: "regional_content_advisor",
        description: "Provides region-specific content recommendations"
      }
    ],
    osaSuggestions: {
      recommendationService: [
        "Include voice search metrics",
        "Add AI readiness scoring to strategy recommendations"
      ],
      knowledgeRetrievalService: [
        "Pull structured data from CMS",
        "Include regional performance metrics in analysis"
      ],
      preferencesPolicyService: [
        "Enable AI-readiness toggle",
        "Allow users to prioritize specific search engines"
      ]
    },
    useCaseScenarios: [
      "Voice search optimization for e-commerce products",
      "Regional content strategy development",
      "AI search engine visibility improvement",
      "Structured data implementation for better discoverability"
    ],
    nextBestActions: [
      "Implement structured data markup across all content",
      "Develop voice search optimization strategies",
      "Create regional content performance tracking"
    ],
    lastDataSent: "2024-11-11T13:18:00Z"
  },

  audience_suggester: {
    dataSentToOSA: {
      segments: ["Tech Enthusiasts", "Enterprise Buyers"],
      audience_segments_analyzed: 42,
      high_value_segments: [
        "Premium_Shoppers_25_35",
        "Returning_Customers_Enterprise",
        "Mobile_First_Millennials"
      ],
      segment_performance_scores: {
        conversion_rate: 8.5,
        engagement_rate: 12.3,
        lifetime_value: 2340
      },
      new_segments_discovered: 7
    },
    optimizelyDxpTools: [
      "Audience Builder",
      "Experimentation Platform",
      "Personalization Engine",
      "Analytics Dashboard",
      "Audience Management"
    ],
    strategyAssistance: {
      recommendations: [
        "Target high-value segments",
        "Expand lookalike audiences",
        "Develop personalized experiences for top-performing audiences",
        "Implement segment-based A/B testing strategies"
      ]
    },
    opalCustomTools: [
      {
        toolName: "segment_analyzer",
        description: "Analyzes audience performance"
      },
      {
        toolName: "audience_performance_tracker",
        description: "Tracks performance metrics across audience segments"
      },
      {
        toolName: "segment_discovery_engine",
        description: "Identifies new high-potential audience segments"
      }
    ],
    osaSuggestions: {
      recommendationService: [
        "Add predictive scoring",
        "Include audience lifetime value predictions in recommendations"
      ],
      knowledgeRetrievalService: [
        "Include behavioral analytics",
        "Pull cross-platform audience data for comprehensive analysis"
      ],
      preferencesPolicyService: [
        "Let users define segment priorities",
        "Enable custom audience scoring criteria"
      ]
    },
    useCaseScenarios: [
      "Dynamic audience segmentation for personalized marketing",
      "High-value customer identification and targeting",
      "Cross-platform audience behavior analysis",
      "Predictive audience modeling for campaign optimization"
    ],
    nextBestActions: [
      "Implement predictive audience scoring models",
      "Set up cross-platform audience tracking",
      "Create dynamic segmentation workflows"
    ],
    lastDataSent: "2024-11-11T13:15:00Z"
  },

  experiment_blueprinter: {
    dataSentToOSA: {
      experiments_designed: 18,
      test_hypotheses_generated: 34,
      success_probability_scores: {
        high_confidence: 12,
        medium_confidence: 15,
        low_confidence: 7
      },
      estimated_impact: {
        conversion_lift: "12-18%",
        revenue_impact: "$125K-$180K",
        confidence_interval: "95%"
      },
      implementation_timeline: "2-3 weeks"
    },
    optimizelyDxpTools: [
      "Experimentation Platform",
      "Feature Flags",
      "Analytics Dashboard",
      "Statistical Engine"
    ],
    strategyAssistance: {
      recommendations: [
        "Prioritize high-confidence experiments for immediate implementation",
        "Create detailed experiment roadmaps with timelines",
        "Generate hypothesis validation reports",
        "Develop statistical significance tracking dashboards"
      ]
    },
    opalCustomTools: [
      {
        toolName: "experiment_hypothesis_generator",
        description: "Generates data-driven experiment hypotheses"
      },
      {
        toolName: "impact_estimation_engine",
        description: "Estimates potential impact and statistical requirements"
      },
      {
        toolName: "experiment_prioritizer",
        description: "Prioritizes experiments based on impact and feasibility"
      }
    ],
    osaSuggestions: {
      recommendationService: [
        "Include experiment success probability in recommendations",
        "Add impact estimation to strategy suggestions"
      ],
      knowledgeRetrievalService: [
        "Pull historical experiment data for better predictions",
        "Include statistical significance trends in analysis"
      ],
      preferencesPolicyService: [
        "Allow users to set risk tolerance for experiments",
        "Enable custom impact thresholds for experiment approval"
      ]
    },
    useCaseScenarios: [
      "A/B testing strategy development for product launches",
      "Conversion optimization experiment planning",
      "Risk-based experiment prioritization",
      "Statistical significance planning and tracking"
    ],
    nextBestActions: [
      "Implement automated experiment impact tracking",
      "Set up statistical significance monitoring",
      "Create experiment pipeline automation"
    ],
    lastDataSent: "2024-11-11T13:12:00Z"
  },

  personalization_idea_generator: {
    dataSentToOSA: {
      personalization_ideas_generated: 45,
      targeting_strategies: {
        behavioral_targeting: 18,
        demographic_targeting: 12,
        contextual_targeting: 15
      },
      expected_engagement_lift: "25-35%",
      implementation_complexity: {
        simple: 20,
        moderate: 15,
        complex: 10
      },
      roi_projections: "$200K-$350K annually"
    },
    optimizelyDxpTools: [
      "Personalization Engine",
      "Audience Management",
      "Experimentation Platform",
      "Real-time CDP"
    ],
    strategyAssistance: {
      recommendations: [
        "Implement simple personalization strategies first for quick wins",
        "Create personalized customer journey maps",
        "Develop dynamic content strategies",
        "Generate personalization performance reports"
      ]
    },
    opalCustomTools: [
      {
        toolName: "personalization_strategy_generator",
        description: "Generates targeted personalization strategies"
      },
      {
        toolName: "dynamic_content_optimizer",
        description: "Optimizes content for personalized experiences"
      },
      {
        toolName: "engagement_prediction_model",
        description: "Predicts engagement outcomes for personalization strategies"
      }
    ],
    osaSuggestions: {
      recommendationService: [
        "Include personalization ROI projections in recommendations",
        "Add complexity scoring to strategy suggestions"
      ],
      knowledgeRetrievalService: [
        "Pull user behavior data for personalization context",
        "Include engagement prediction models in analysis"
      ],
      preferencesPolicyService: [
        "Allow users to set personalization complexity preferences",
        "Enable ROI threshold settings for personalization strategies"
      ]
    },
    useCaseScenarios: [
      "E-commerce product recommendation personalization",
      "Content personalization for different user segments",
      "Email marketing personalization strategies",
      "Website experience optimization based on user behavior"
    ],
    nextBestActions: [
      "Implement behavioral targeting workflows",
      "Set up dynamic content personalization",
      "Create engagement prediction tracking"
    ],
    lastDataSent: "2024-11-11T13:10:00Z"
  },

  customer_journey: {
    dataSentToOSA: {
      journey_stages_mapped: 8,
      touchpoint_analysis: {
        total_touchpoints: 34,
        optimized_touchpoints: 28,
        conversion_bottlenecks: 6
      },
      customer_lifecycle_insights: {
        acquisition_rate: "15%",
        retention_rate: "68%",
        advocacy_rate: "12%"
      },
      optimization_opportunities: 22
    },
    optimizelyDxpTools: [
      "Personalization Engine",
      "Analytics Dashboard",
      "Experimentation Platform",
      "Customer Data Platform"
    ],
    strategyAssistance: {
      recommendations: [
        "Optimize identified conversion bottlenecks",
        "Create stage-specific personalization strategies",
        "Implement journey-based A/B tests",
        "Generate customer lifecycle reports"
      ]
    },
    opalCustomTools: [
      {
        toolName: "journey_mapping_analyzer",
        description: "Maps and analyzes customer journey touchpoints"
      },
      {
        toolName: "bottleneck_identifier",
        description: "Identifies conversion bottlenecks in customer journeys"
      },
      {
        toolName: "lifecycle_optimizer",
        description: "Optimizes strategies for each customer lifecycle stage"
      }
    ],
    osaSuggestions: {
      recommendationService: [
        "Include journey stage context in recommendations",
        "Add lifecycle optimization to strategy suggestions"
      ],
      knowledgeRetrievalService: [
        "Pull cross-touchpoint behavior data for analysis",
        "Include customer lifecycle metrics in context"
      ],
      preferencesPolicyService: [
        "Allow users to prioritize specific journey stages",
        "Enable custom conversion rate thresholds"
      ]
    },
    useCaseScenarios: [
      "Multi-touchpoint customer experience optimization",
      "Conversion funnel bottleneck analysis and resolution",
      "Customer lifecycle stage-specific strategy development",
      "Cross-channel journey mapping and optimization"
    ],
    nextBestActions: [
      "Implement journey stage tracking automation",
      "Set up conversion bottleneck alerting",
      "Create lifecycle-based personalization rules"
    ],
    lastDataSent: "2024-11-11T13:08:00Z"
  },

  roadmap_generator: {
    dataSentToOSA: {
      roadmap_items_generated: 67,
      priority_levels: {
        high_priority: 23,
        medium_priority: 28,
        low_priority: 16
      },
      estimated_timelines: {
        q1_2024: 18,
        q2_2024: 22,
        q3_2024: 15,
        q4_2024: 12
      },
      resource_requirements: {
        development_hours: 480,
        design_hours: 120,
        qa_hours: 96
      }
    },
    optimizelyDxpTools: [
      "Project Management",
      "Analytics Dashboard",
      "Feature Flags",
      "Experimentation Platform"
    ],
    strategyAssistance: {
      recommendations: [
        "Focus on high-priority items for Q1 implementation",
        "Create detailed project timelines with dependencies",
        "Generate resource allocation reports",
        "Implement milestone tracking and progress monitoring"
      ]
    },
    opalCustomTools: [
      {
        toolName: "strategic_roadmap_builder",
        description: "Builds comprehensive strategic implementation roadmaps"
      },
      {
        toolName: "resource_estimation_engine",
        description: "Estimates resource requirements for roadmap items"
      },
      {
        toolName: "priority_matrix_generator",
        description: "Generates priority matrices for roadmap planning"
      }
    ],
    osaSuggestions: {
      recommendationService: [
        "Include resource availability in roadmap recommendations",
        "Add timeline feasibility scoring to suggestions"
      ],
      knowledgeRetrievalService: [
        "Pull historical project completion data for estimation",
        "Include team capacity metrics in planning context"
      ],
      preferencesPolicyService: [
        "Allow users to set priority weighting preferences",
        "Enable custom timeline and resource constraints"
      ]
    },
    useCaseScenarios: [
      "Strategic initiative planning and prioritization",
      "Resource allocation optimization across projects",
      "Timeline feasibility analysis for major implementations",
      "Cross-functional roadmap coordination"
    ],
    nextBestActions: [
      "Implement automated resource tracking",
      "Set up milestone progress monitoring",
      "Create priority matrix automation"
    ],
    lastDataSent: "2024-11-11T13:05:00Z"
  },

  cmp_organizer: {
    dataSentToOSA: {
      campaigns_organized: 156,
      workflow_optimizations: {
        automation_opportunities: 23,
        efficiency_improvements: 18,
        process_standardizations: 12
      },
      campaign_performance: {
        average_roi: "340%",
        conversion_rate: "8.7%",
        engagement_rate: "15.2%"
      },
      organizational_improvements: 31
    },
    optimizelyDxpTools: [
      "Campaign Management",
      "Marketing Automation",
      "Analytics Dashboard",
      "Personalization Engine"
    ],
    strategyAssistance: {
      recommendations: [
        "Implement identified automation opportunities",
        "Standardize high-performing campaign processes",
        "Create campaign performance benchmarking reports",
        "Develop workflow efficiency measurement systems"
      ]
    },
    opalCustomTools: [
      {
        toolName: "campaign_workflow_optimizer",
        description: "Optimizes campaign management workflows and processes"
      },
      {
        toolName: "automation_opportunity_finder",
        description: "Identifies opportunities for campaign automation"
      },
      {
        toolName: "performance_benchmarker",
        description: "Benchmarks campaign performance against industry standards"
      }
    ],
    osaSuggestions: {
      recommendationService: [
        "Include workflow efficiency metrics in recommendations",
        "Add automation opportunity scoring to suggestions"
      ],
      knowledgeRetrievalService: [
        "Pull campaign performance benchmarks for context",
        "Include automation best practices in analysis"
      ],
      preferencesPolicyService: [
        "Allow users to set automation complexity preferences",
        "Enable custom performance benchmark targets"
      ]
    },
    useCaseScenarios: [
      "Marketing campaign workflow automation",
      "Cross-channel campaign coordination and optimization",
      "Campaign performance benchmarking and improvement",
      "Marketing process standardization and efficiency"
    ],
    nextBestActions: [
      "Implement campaign automation workflows",
      "Set up performance benchmarking systems",
      "Create process standardization templates"
    ],
    lastDataSent: "2024-11-11T13:02:00Z"
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent');

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    const agentData = AGENT_DATA[agentId as keyof typeof AGENT_DATA];

    if (!agentData) {
      return NextResponse.json(
        { error: `Agent data not found for ID: ${agentId}` },
        { status: 404 }
      );
    }

    // Load admin overrides and apply them
    const overrides = loadOverrides();
    const agentOverride = overrides[agentId];

    let finalAgentData = { ...agentData };

    if (agentOverride) {
      // Apply overrides for editable sections
      if (agentOverride.strategyAssistance) {
        finalAgentData.strategyAssistance = agentOverride.strategyAssistance;
      }
      if (agentOverride.osaSuggestions) {
        finalAgentData.osaSuggestions = agentOverride.osaSuggestions;
      }
      if (agentOverride.useCaseScenarios) {
        finalAgentData.useCaseScenarios = agentOverride.useCaseScenarios;
      }
      if (agentOverride.nextBestActions) {
        finalAgentData.nextBestActions = agentOverride.nextBestActions;
      }
    }

    return NextResponse.json({
      success: true,
      agent_id: agentId,
      ...finalAgentData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Agent data API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch agent data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Update Agent Data Admin Overrides (PUT)
 * Saves admin overrides for editable sections
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent');

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { section, subsection, content } = body;

    if (!section || !Array.isArray(content)) {
      return NextResponse.json(
        { error: 'Section and content array are required' },
        { status: 400 }
      );
    }

    // Load existing overrides
    const overrides = loadOverrides();

    // Initialize agent overrides if they don't exist
    if (!overrides[agentId]) {
      overrides[agentId] = {
        lastModified: new Date().toISOString()
      };
    }

    // Update the specific section
    if (section === 'strategyAssistance') {
      overrides[agentId].strategyAssistance = {
        recommendations: content
      };
    } else if (section === 'osaSuggestions' && subsection) {
      if (!overrides[agentId].osaSuggestions) {
        overrides[agentId].osaSuggestions = {
          recommendationService: [],
          knowledgeRetrievalService: [],
          preferencesPolicyService: []
        };
      }
      overrides[agentId].osaSuggestions[subsection] = content;
    } else if (section === 'useCaseScenarios') {
      overrides[agentId].useCaseScenarios = content;
    } else if (section === 'nextBestActions') {
      overrides[agentId].nextBestActions = content;
    } else {
      return NextResponse.json(
        { error: `Invalid section: ${section}` },
        { status: 400 }
      );
    }

    overrides[agentId].lastModified = new Date().toISOString();

    // Save the updated overrides
    saveOverrides(overrides);

    return NextResponse.json({
      success: true,
      message: 'Admin override saved successfully',
      agentId,
      section,
      subsection
    });

  } catch (error) {
    console.error('Admin override save error:', error);
    return NextResponse.json(
      {
        error: 'Failed to save admin override',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * OPAL Agent Data Webhook Endpoint (POST)
 * Redirects to the main OPAL webhook for consistency
 * This endpoint is referenced by opal-tools configuration
 */
export async function POST(request: NextRequest) {
  try {
    // Get the request body and headers
    const body = await request.text();
    const authHeader = request.headers.get('authorization') || '';

    // Forward to main OPAL webhook endpoint
    const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/opal-workflow`;

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'X-Forwarded-From': '/api/opal/agent-data'
      },
      body: body
    });

    const result = await response.json();

    return NextResponse.json(result, { status: response.status });

  } catch (error) {
    console.error('Agent data endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process agent data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}