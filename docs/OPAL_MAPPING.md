# OPAL Mapping System

This comprehensive mapping system aligns Strategy Dashboard areas with the OPAL ecosystem and Optimizely DXP tools, providing the foundation for accurate OSA results and enhanced personalization.

---

## Quick Reference Links

### 📖 Essential Documentation
- **[Quick Start Guide](quick-start.md)** - Get OSA running with OPAL integration in 10 minutes
- **[System Architecture](OSA_ARCHITECTURE.md)** - Technical architecture including OPAL integration details
- **[Admin Interface Guide](OSA_ADMIN.md)** - Admin management of OPAL agents and workflows
- **[API Documentation](/docs)** - Interactive API testing for OPAL endpoints

### 🚀 Live System Access
- **OPAL Agent Monitoring**: https://opal-2025.vercel.app/engine/admin/opal-monitoring
- **Data Mapping Visualization**: https://opal-2025.vercel.app/engine/admin/data-mapping
- **Agent Data Pages**: https://opal-2025.vercel.app/engine/admin/opal-monitoring/agent-data/[agent]
- **Strategy Results**: https://opal-2025.vercel.app/engine/results/

### 🔧 Key Configuration Files
- **OPAL Mapping Data**: `opal-config/opal-mapping/opal_mapping.json`
- **Agent Configurations**: `opal-config/opal-mapping/agent-configurations.json`
- **Mapping Utilities**: `opal-config/opal-mapping/mapping-utils.ts:31`
- **Environment Config**: `src/lib/config/opal-env.ts:41`

---

## Overview

The OPAL Mapping System provides a structured approach to connect:
- **Strategy Dashboard Areas** (Strategy Plans, Analytics Insights, etc.)
- **OPAL Components** (Agents, Instructions, Tools)
- **Optimizely DXP Tools** (Content Recs, CMS, ODP, WEBX, CMP)
- **Results Generation** (/engine/results/ pages and reports)
- **Enhanced Navigation** (3-tier sub-navigation structure)

## Files Structure

### Core Mapping Files
- `opal_mapping.json` - Main mapping configuration (converted from Excel)
- `types.ts` - TypeScript type definitions for the mapping system
- `mapping-utils.ts` - Utility functions for working with mappings

### Configuration Files
- `agent-configurations.json` - Detailed OPAL agent configurations
- `instruction-configurations.json` - OPAL instruction file metadata
- `tool-configurations.json` - OPAL tool specifications
- `dxp-tool-configurations.json` - Optimizely DXP tool integration details

## How OPAL Results Are Generated

### Workflow Orchestration
The OPAL system uses a sophisticated workflow engine that orchestrates result generation through multiple specialized agents:

1. **Workflow Trigger**: User initiates analysis via `OpalWorkflowEngine.triggerWorkflow()`
2. **Session Management**: Unique session IDs track workflow progress and results
3. **Asynchronous Processing**: Agents execute sequentially with fault tolerance
4. **Real-time Updates**: Progress tracking via `/api/opal/status/{session_id}`

### Agent Execution Sequence
**Ten total agents** execute in coordinated workflows - nine specialized agents plus one workflow orchestration agent (updated November 2025 with recent improvements):

```typescript
OPAL_AGENT_PORTFOLIO = [
  // Workflow Orchestration (Master Coordinator)
  'strategy_assistant_workflow', // Webhook-triggered workflow orchestration and agent coordination

  // Infrastructure & Health
  'integration_health',      // System health monitoring and API performance tracking

  // Content & Experience
  'content_review',          // Content quality analysis and optimization recommendations
  'geo_audit',              // Geographic and AI search optimization analysis

  // Audience & Personalization
  'audience_suggester',      // ODP segment analysis and targeting recommendations
  'personalization_idea_generator', // Dynamic personalization strategies and templates
  'customer_journey',        // Customer journey mapping and touchpoint optimization

  // Strategy & Planning
  'experiment_blueprinter',  // Statistical testing framework and experiment design
  'roadmap_generator',      // Strategic roadmap planning and milestone tracking
  'cmp_organizer'          // Campaign management and workflow optimization
]
```

#### Recent Agent Portfolio Optimizations (November 2025)

**Consolidated and Removed Agents:**
- `content_next_best_topics` → Integrated into Experience Optimization widgets
- `content_performance_metrics` → Merged with content_review agent capabilities
- `content_recs_topic_performance` → Enhanced ContentRecommendationsTopicPerformanceWidget
- `content_suggestions` → Consolidated into ContentSuggestionsWidget architecture
- `maturity_assessment` → Functionality moved to roadmap_generator agent
- `quick_wins_analyzer` → Integrated into strategy planning workflows
- `results_content_optimizer` → Eliminated through comprehensive Results page architecture

**Enhanced Agent Capabilities:**
- **`integration_health`** → Now includes comprehensive DXP monitoring and performance analysis
- **`content_review`** → Enhanced with brand compliance checking and content quality metrics
- **`geo_audit`** → Advanced AI search optimization and regional content advisory tools
- **`audience_suggester`** → Added behavioral analysis and advanced segmentation capabilities
- **`personalization_idea_generator`** → Dynamic content optimization with engagement prediction models
- **`customer_journey`** → Enhanced lifecycle optimization and bottleneck identification
- **`experiment_blueprinter`** → Statistical testing framework with impact estimation engines
- **`roadmap_generator`** → Strategic planning with resource estimation and priority matrices
- **`cmp_organizer`** → Campaign workflow optimization with automation opportunity detection

**New Tool Registry Standardization:**
- All 42 OPAL tools now use standardized `osa_` naming prefix
- Enhanced discovery endpoints with improved error handling
- Strategic tool distribution (3-9 tools per agent) for optimal performance
- Updated agent-to-tool mappings across all registries

**Workflow Orchestration Architecture:**
The `strategy_assistant_workflow` agent serves as the master coordinator:
- **Webhook Trigger**: Activated via secure webhook for DXP data collection
- **Agent Coordination**: Orchestrates execution sequence of all 9 specialized agents
- **Data Flow Management**: Manages data sharing between agents through workflow context
- **Error Handling**: Provides fault tolerance and recovery mechanisms
- **Version 23**: Most mature agent with comprehensive workflow visualization

#### Agent Orchestration Details
- **Parallel Execution**: Some agents can run simultaneously for optimal performance
- **Dependency Management**: Strategic agents depend on data from analytical agents
- **Real-time Monitoring**: All agents tracked with 7-state lifecycle monitoring (see [Admin Guide](OSA_ADMIN.md))
- **Performance Analytics**: Execution times, success rates, and quality metrics tracked per agent

### Data Integration and Processing
- **Live API Connections**: Real-time data from Optimizely DXP tools
- **Shared Context**: Agents update shared `workflowContext` throughout execution
- **Quality Scoring**: Real-time metrics based on data freshness and completeness
- **Error Handling**: Individual agent failures don't stop entire workflow

### Result Compilation Flow
```
User Input → Workflow Trigger → Agent Sequence → Data Integration →
Results Compilation → Knowledge Base Update → Dashboard Display
```

### Current Flow (Production Ready)
```
User Input → OPAL Agents → RAG Decision Layer → Live DXP APIs → Enhanced Dashboard Results
```

## OPAL Tool Registry Enhancement (November 2025)

The OPAL tool registry has been significantly enhanced with 17 new tools achieving 100% Results page coverage:

### Tool Registry Expansion
**Before:** 23 tools supporting 43% of Results pages
**After:** 42 tools enabling 100% Results page coverage across 88+ pages

### Strategic Tool Distribution
Instead of creating new infrastructure, tools were consolidated into existing registries:

**OSA Workflow Data Tools** (8 new tools):
- `osa_store_workflow_data` → Core workflow data management
- `osa_analyze_member_behavior` → Behavioral analysis and segmentation
- `osa_create_audience_segments` → Advanced audience creation
- `osa_track_campaign_performance` → Campaign analytics and optimization
- `osa_generate_content_recommendations` → AI-driven content suggestions
- `osa_optimize_personalization` → Dynamic personalization strategies
- `osa_measure_engagement_metrics` → Comprehensive engagement tracking
- `osa_forecast_performance_trends` → Predictive analytics and forecasting

**OSA WebX Tools** (4 new tools):
- `osa_design_experiments` → Statistical experiment design
- `osa_analyze_experiment_results` → Results analysis and interpretation
- `osa_optimize_conversion_funnels` → Funnel optimization strategies
- `osa_personalize_user_experiences` → Experience personalization

**OSA CMSPaaS Tools** (5 new tools):
- `osa_analyze_content_performance` → Content effectiveness analysis
- `osa_optimize_content_strategy` → Strategic content optimization
- `osa_manage_content_lifecycle` → Content lifecycle management
- `osa_enhance_user_experience` → UX improvement recommendations
- `osa_integrate_marketing_tools` → Cross-platform integration

### Benefits of Consolidation Approach
- **Zero Infrastructure Changes:** No additional API endpoints required
- **Performance Maintained:** <200ms API response times with 74% more functionality
- **Single Authentication Model:** Unified security across all tools
- **Simplified Maintenance:** Consolidated management and monitoring

## Enhanced Navigation Structure

The system now supports a 3-tier navigation hierarchy for comprehensive results exploration:

### Tier 1: Main Categories
- **Strategy Plans**: Strategic planning and roadmaps
- **Optimizely DXP Tools**: Platform-specific insights
- **Analytics Insights**: Cross-platform analytics
- **Experience Optimization**: Optimization recommendations

### Tier 2: Sub-sections
Each main category contains specialized sub-sections:

#### Strategy Plans
- **OSA**: Optimized Strategy Assistant overview
- **Quick Wins**: Immediate optimization opportunities
- **Maturity**: Organizational assessment and growth
- **Phases**: Implementation timeline and milestones
- **Roadmap**: Long-term strategic planning

#### Optimizely DXP Tools
- **Content Recs**: Visitor analytics and recommendations
- **CMS**: Content management and performance
- **ODP**: Customer profiles and segmentation
- **WEBX**: Experimentation and testing
- **CMP**: Campaign management and automation

#### Analytics Insights
- **OSA**: Strategic analytics overview
- **Content**: Content performance analytics
- **Audiences**: Audience behavior and segmentation
- **CX**: Customer experience metrics
- **Other**: Cross-platform and emerging insights

#### Experience Optimization
- **Content**: Content strategy and optimization
- **Experimentation**: Testing framework and results
- **Personalization**: Dynamic content and targeting
- **UX**: User experience and journey optimization
- **Technology**: Platform integration and performance

### Tier 3: Detailed Views
Each sub-section provides multiple analytical perspectives:
- **Engagement**: Interaction metrics and patterns
- **Topics**: Content and interest analysis
- **Popular**: High-performing elements identification
- **AI Visibility**: Search optimization and discovery
- **Semantic**: Content understanding and relevance
- **Geographic**: Location-based performance insights
- **Freshness**: Content recency and update impact

## Mapping Structure

Each Strategy Dashboard area/tab combination maps to enhanced configurations:

```json
{
  "opal_instructions": ["content-guidelines", "personas"],
  "opal_agents": ["content_review"],
  "opal_tools": ["osa_content_insight_generator", "osa_content_quality_analyzer"],
  "optimizely_dxp_tools": ["Content Recs", "CMS"],
  "navigation_structure": {
    "tier1": "Analytics Insights",
    "tier2": "Content",
    "tier3": ["Engagement", "Topics", "Popular", "AI Visibility", "Semantic", "Geographic", "Freshness"]
  },
  "widget_mappings": {
    "primary": "ContentOptimizationWidget",
    "related": ["ContentImpactAnalysisWidget", "ContentOptimizationRecommendationsWidget"]
  },
  "data_confidence": {
    "base_confidence": 85,
    "factors": ["data_freshness", "integration_health", "tool_availability"]
  }
}
```

#### Recent Mapping Enhancements (November 2025)

**New Widget Integrations:**
- `AIForSEOWidget` → SEO optimization and AI search visibility analysis
- `ContentImpactAnalysisWidget` → Content performance impact measurement
- `ContentOptimizationRecommendationsWidget` → AI-driven content improvement suggestions
- `ContentOptimizationWidget` → Comprehensive content optimization dashboard

**Enhanced Tool Naming Convention:**
All OPAL tools now follow the standardized `osa_` prefix:
- `osa_content_insight_generator` (formerly content_insight_generator)
- `osa_segment_analyzer` (formerly segment_analyzer)
- `osa_experiment_hypothesis_generator` (formerly experiment_hypothesis_generator)
- `osa_journey_mapping_analyzer` (formerly journey_mapping_analyzer)

**Improved Data Confidence Scoring:**
- Real-time confidence calculation based on data freshness
- Integration health monitoring affects confidence levels
- Tool availability impacts overall reliability scores

## Current Reports and Results Structure

### Existing /engine/results/ Pages and navigation structure with tabs and sub tabs
The system currently provides four main result categories:

1. **Strategy Plans (/engine/results/strategy)**

OSA - Strategy top recommendations across all plans
Quick Wins - Quick wins identification
Maturity - Maturity assessment
Phases - Phase planning
Roadmap - Roadmap development
   

2. **Optimizely DXP Tools (/engine/results/dxptools)**

Content Recs - Content Recs analytics
CMS - CMS performance metrics
ODP - ODP audience insights
WEBX - WEBX experiment and personalization insights
CMP - CMP campaign analytics   
   

3. **Analytics Insights (/engine/results/insights)**
OSA - Top recommendations related to analytics insights
	Sub Navigation: 
	Engagement
	Topics
	Popular
	AI Visibility
	Semantic
	Geographic
	Freshness
Content - Content performance analysis
	Sub Navigation: 
	Engagement
	Topics
	Popular
	AI Visibility
	Semantic
	Geographic
	Freshness
Audiences - Audience behavior patterns
	Sub Navigation: 
	Engagement
	Topics
	Popular
	AI Visibility
	Semantic
	Geographic
	Freshness
CX - Customer experience metrics
	Sub Navigation: 
	Engagement
	Topics
	Popular
	AI Visibility
	Semantic
	Geographic
	Freshness
Trends - Emerging trend identification  
	Sub Navigation: 
	Engagement
	Topics
	Popular
	AI Visibility
	Semantic
	Geographic
	Freshness

4. **Experience Optimization (/engine/results/optimization)**
Content - Content optimization recommendations
Experimentation - Experimentation use cases, growth ideas aligned with marketing objectives
Personalization - Personalization strategies, use cases and segmentation recommendations
UX - UX improvement suggestions
Technology - Technology integration guides

  
  
  
  
  

### Current Data Sources
- **Real-time API Integration**: Live data from Optimizely DXP tools
- **Agent-Generated Insights**: AI-powered analysis and recommendations
- **Quality Scoring**: Dynamic metrics based on data freshness and completeness
- **Knowledge Base**: RAG-enhanced recommendations from accumulated insights

## Recommended New Reports and Insights

### 1. Cross-Platform Intelligence Reports
**Purpose**: Understand how different Optimizely tools work together and impact overall performance.

**New Reports**:
- **Multi-DXP Impact Analysis**: Correlation between different tool performances
- **Integration Health Dashboard**: Real-time status of all DXP tool integrations
- **Data Flow Visualization**: How data moves between systems and platforms
- **Unified Customer Journey**: Cross-platform user experience mapping

### 2. Predictive Analytics Reports
**Purpose**: Forecast future performance and identify optimization opportunities before they become critical.

**New Reports**:
- **Performance Forecasting**: Predict future content and campaign performance
- **Audience Growth Projections**: Model segment evolution and expansion
- **Conversion Probability Scoring**: Likelihood assessment for goal achievement
- **Risk Assessment Dashboard**: Identify potential issues before they occur

### 3. Competitive Intelligence Reports
**Purpose**: Understand market position and identify strategic opportunities.

**New Reports**:
- **Market Position Analysis**: Comparative performance against competitors
- **Industry Benchmarking**: Performance metrics against industry standards
- **Trend Analysis**: Emerging patterns and opportunities in your sector
- **Opportunity Identification**: Market gaps and coverage analysis

### 4. Advanced Personalization Insights
**Purpose**: Enhance personalization effectiveness through AI-driven insights.

**New Reports**:
- **AI-Driven Segment Discovery**: Automatically identify new audience segments
- **Behavioral Pattern Recognition**: Complex user behavior analysis
- **Dynamic Content Performance**: Real-time personalized content effectiveness
- **Optimization Recommendations**: Live performance adjustment suggestions

### 5. ROI and Business Impact Reports
**Purpose**: Demonstrate financial value and guide resource allocation decisions.

**New Reports**:
- **Optimization ROI Calculator**: Financial impact of optimization efforts
- **Cost-Benefit Analysis**: Resource allocation optimization guidance
- **Business Goal Alignment**: Activity alignment with strategic objectives
- **Revenue Attribution**: Track revenue back to specific optimizations

### Enhanced Existing Reports

#### Strategy Plans Enhancements
- **Confidence Intervals**: Statistical confidence for all recommendations
- **Implementation Difficulty Scoring**: Resource and complexity assessment
- **Resource Requirement Estimation**: Detailed implementation planning
- **Success Probability Metrics**: Likelihood of achieving desired outcomes

#### DXP Tools Integration Improvements
- **Real-time Data Quality Scoring**: Dynamic quality metrics instead of static percentages
- **API Performance Monitoring**: Integration health and response time tracking
- **Data Freshness Indicators**: Real-time data currency and relevance
- **Integration Health Alerts**: Proactive notification of integration issues

#### Analytics Insights Upgrades
- **Anomaly Detection**: Automated identification of unusual patterns
- **Correlation Analysis**: Relationship identification between different metrics
- **Trend Prediction**: Forecasting for key performance indicators
- **Alert System**: Notifications for significant changes and opportunities

## Example: Content Optimization Enhancement

### Current State (Simulated)
- **Data Quality**: 15% (simulated data only)
- **Recommendations**: Generic, framework-based
- **Personalization**: Basic demographic segmentation

### With Proper Integration
- **Data Quality**: 85% (real Content Recs + CMS data)
- **Recommendations**: Specific, performance-based
- **Personalization**: Behavior-driven, real-time

## Key Improvements for OSA Accuracy

### 1. Real-Time Data Integration
Replace simulated data with live APIs:
- Content Recs visitor behavior analytics
- CMS content performance metrics
- ODP unified customer profiles
- WEBX experiment results
- CMP email campaign data

### 2. Enhanced Personalization
- **Current**: Role-based filtering (Marketing, UX, Executive)
- **Enhanced**: Behavior-based personalization using real user data
- **Advanced**: Predictive recommendations based on similar organizations

### 3. Data Quality Scoring
- **Current**: Static percentages (87%, 92%, etc.)
- **Enhanced**: Real-time quality metrics from actual integrations
- **Advanced**: Confidence intervals based on data freshness and completeness

## Admin Configuration Requirements

The admin section should allow configuration of:

### 1. DXP Tool Connections
```typescript
interface DXPConnection {
  tool_name: string;
  api_endpoint: string;
  authentication: {
    type: 'oauth2' | 'api_key' | 'jwt';
    credentials: object;
  };
  data_refresh_interval: number;
  integration_status: 'connected' | 'testing' | 'error';
}
```

### 2. RAG Model Settings
```typescript
interface RAGSettings {
  temperature: number;        // 0.0-1.0 for creativity vs accuracy
  max_tokens: number;         // Response length limit
  context_window: number;     // How much context to include
  confidence_threshold: number; // Minimum confidence for recommendations
}
```

### 3. Personalization Rules
```typescript
interface PersonalizationRule {
  rule_name: string;
  trigger_conditions: string[];
  data_sources: string[];
  recommendation_adjustments: object;
  priority: number;
}
```

## Usage in Strategy Dashboard

The `EngineActionsSummary` component uses this mapping to:

1. **Display Accurate Tool Information**: Shows actual OPAL components used
2. **Identify Data Gaps**: Highlights missing integrations
3. **Recommend Improvements**: Suggests specific enhancements
4. **Calculate Data Quality**: Provides realistic quality metrics

## Implementation Roadmap

### Phase 1: Enhanced Mapping (✅ Complete)
- [x] Import Excel mapping data
- [x] Create TypeScript interfaces
- [x] Build utility functions
- [x] Generate configuration files
- [x] Document comprehensive results generation process
- [x] Design enhanced navigation structure

### Phase 2: Dashboard Integration (🔄 In Progress)
- [x] Update StrategyDashboard to use real mapping
- [x] Replace hardcoded Engine Actions with dynamic data
- [x] Implement data quality calculations
- [ ] Deploy enhanced navigation structure
- [ ] Implement tier-3 detailed views

### Phase 2.5: Enhanced Navigation Implementation (📋 Planned)
- [ ] Implement 3-tier navigation in ResultsSidebar
- [ ] Create sub-navigation components for each main section
- [ ] Add detailed view routing for Analytics Insights dimensions
- [ ] Update navigation state management
- [ ] Implement responsive navigation for mobile devices

### Phase 3: New Report Categories (📋 Planned)
- [ ] Implement Cross-Platform Intelligence dashboard
- [ ] Add Predictive Analytics framework
- [ ] Develop Competitive Intelligence features
- [ ] Create Advanced Personalization insights
- [ ] Build ROI and Business Impact tracking

### Phase 3.5: Enhanced Existing Reports (📋 Planned)
- [ ] Add confidence intervals and probability scoring
- [ ] Implement real-time data quality indicators
- [ ] Create anomaly detection system
- [ ] Add correlation analysis capabilities
- [ ] Build automated alert system

### Phase 4: Admin Interface (📋 Planned)
- [ ] Create admin configuration UI
- [ ] Implement DXP tool connection management
- [ ] Add RAG model settings interface
- [ ] Build personalization rule editor
- [ ] Create report configuration dashboard

### Phase 4.5: AI-Powered Insights (📋 Planned)
- [ ] Implement machine learning-based predictions
- [ ] Add automated insight generation
- [ ] Create intelligent recommendation system
- [ ] Build adaptive personalization algorithms
- [ ] Deploy advanced analytics capabilities

### Phase 5: Production Optimization (📋 Planned)
- [ ] Optimize API performance and caching
- [ ] Implement advanced security measures
- [ ] Add comprehensive monitoring and logging
- [ ] Create disaster recovery procedures
- [ ] Deploy scalable infrastructure

## Benefits of This Approach

### For Users
- **More Accurate Insights**: Based on real data, not simulations
- **Better Personalization**: Tailored to actual behavior and performance
- **Actionable Recommendations**: Specific, implementable suggestions
- **Transparent Process**: Clear understanding of how insights are generated

### For Administrators
- **Full Control**: Configure all aspects of the OSA system
- **Monitoring**: Track data quality and system performance
- **Flexibility**: Adjust personalization rules and RAG settings
- **Scalability**: Add new DXP tools and integrations easily

## Next Steps

1. **Integrate Mapping Utilities** into the Strategy Dashboard
2. **Build Admin Configuration Interface** for DXP tool management
3. **Implement Real API Connections** to replace simulated data
4. **Deploy Enhanced Personalization** based on actual user behavior

This mapping system provides the foundation for transforming OSA from a demonstration tool into a production-ready, highly accurate, and personalized strategy assistant.

## See Also

### 📚 Core Documentation
- **[Quick Start Guide](quick-start.md)** - Essential setup including OPAL integration configuration
- **[System Architecture Guide](OSA_ARCHITECTURE.md)** - Technical details of OPAL integration within OSA microservices
- **[Admin Interface Guide](OSA_ADMIN.md)** - Managing OPAL agents and monitoring workflows

### 🔧 Technical Implementation
- **OPAL Configuration Files**: Implementation details and usage
  - `opal-config/opal-mapping/index.ts:44` - Main mapping system exports
  - `opal-config/opal-mapping/mapping-utils.ts:31` - Core utility functions
  - `opal-config/opal-mapping/types.ts` - TypeScript interfaces and types
  - `src/lib/config/opal-env.ts:41` - Environment configuration loader

### 🚀 Live System Integration
- **OPAL Agent Monitoring**: https://opal-2025.vercel.app/engine/admin/opal-monitoring
- **Individual Agent Pages**: https://opal-2025.vercel.app/engine/admin/opal-monitoring/agent-data/[agent]
- **Data Mapping Visualization**: https://opal-2025.vercel.app/engine/admin/data-mapping
- **Strategy Results Dashboard**: https://opal-2025.vercel.app/engine/results/

### 🧠 OPAL Agent Details
- **Content Analysis**: `content_review` agent for content optimization recommendations
- **Geographic Optimization**: `geo_audit` agent for AI search and regional analysis
- **Audience Intelligence**: `audience_suggester` agent for segmentation and targeting
- **Personalization Strategy**: `personalization_idea_generator` agent for dynamic content
- **Journey Optimization**: `customer_journey` agent for touchpoint analysis
- **Experiment Design**: `experiment_blueprinter` agent for testing frameworks
- **Strategic Planning**: `roadmap_generator` agent for milestone tracking
- **Campaign Management**: `cmp_organizer` agent for workflow optimization
- **System Health**: `integration_health` agent for performance monitoring

### 🔗 API Integration Points
- **OPAL Enhanced Tools**: `/api/opal/enhanced-tools` - Agent discovery and execution
- **Workflow Trigger**: `/api/opal/sync` - Manual workflow initiation
- **Agent Status Tracking**: `/api/opal/status/{session_id}` - Real-time monitoring
- **Webhook Processing**: `/api/webhooks/opal-workflow` - OPAL event handling

### 📊 Strategy Dashboard Integration
- **Results Structure**: Three-tier navigation system implementation
- **Data Quality Metrics**: Real-time confidence scoring and validation
- **Enhanced Navigation**: Multi-level results exploration and analysis
- **Performance Analytics**: Agent execution tracking and success metrics

### 🏗️ Architecture Integration
- **Microservices Mapping**: How OPAL agents integrate with OSA services
- **Event-Driven Workflows**: Real-time agent coordination and status updates
- **Circuit Breaker Patterns**: Resilient OPAL integration design
- **Data Flow Visualization**: Agent-to-service relationship mapping

---

## Advanced OPAL Integration

This section provides comprehensive technical guidance for custom tool development, integration best practices, and troubleshooting OPAL implementations.

### Custom Tool Development

#### Enhanced Agent Portfolio

The OSA system features 9 specialized OPAL agents with dedicated custom tools for comprehensive strategy analysis:

**Integration Health Monitor**:
- `integration_health_monitor`: Continuous DXP integration status monitoring
- `api_performance_analyzer`: Response time analysis and bottleneck identification
- `error_pattern_detector`: Pattern detection with automated fix suggestions

**Content Review Agent**:
- `content_insight_generator`: Content performance and freshness analysis
- `content_quality_analyzer`: Quality assessment with brand compliance validation
- `brand_compliance_checker`: Brand consistency enforcement across variations

**Geographic Audit Agent**:
- `geo_optimizer`: AI search engine visibility with regional optimization
- `ai_search_optimizer`: Content optimization for AI-powered search engines
- `regional_content_advisor`: Region-specific content recommendations

**Audience Suggester Agent**:
- `segment_analyzer`: Audience performance analysis with statistical validation
- `audience_performance_tracker`: Performance metrics across audience segments
- `segment_discovery_engine`: New high-potential audience segment identification

**Experiment Blueprinter Agent**:
- `experiment_hypothesis_generator`: Data-driven experiment hypothesis generation
- `impact_estimation_engine`: Statistical requirement analysis and impact estimation
- `experiment_prioritizer`: Experiment prioritization with resource analysis

**Personalization Idea Generator Agent**:
- `personalization_strategy_generator`: Targeted personalization strategy development
- `dynamic_content_optimizer`: Content optimization for personalized experiences
- `engagement_prediction_model`: ROI modeling for personalization strategies

**Customer Journey Agent**:
- `journey_mapping_analyzer`: Touchpoint mapping with optimization identification
- `bottleneck_identifier`: Conversion bottleneck identification with resolution
- `lifecycle_optimizer`: Customer lifecycle stage optimization

**Roadmap Generator Agent**:
- `strategic_roadmap_builder`: Implementation roadmap creation with timeline management
- `resource_estimation_engine`: Resource requirement estimation with capacity planning
- `priority_matrix_generator`: Priority matrix with dependency mapping

**CMP Organizer Agent**:
- `campaign_workflow_optimizer`: Campaign process optimization with automation identification
- `automation_opportunity_finder`: Campaign automation with implementation guidance
- `performance_benchmarker`: Campaign benchmarking against industry standards

#### Discovery Endpoint Requirements

**Critical Format Requirements:**
```typescript
// ✅ CORRECT - OPAL Functions Array Format
{
  functions: [
    {
      name: 'tool_name',
      description: 'Clear tool functionality description',
      parameters: [ // Must be array, not object
        {
          name: 'parameter_name',
          type: 'string', // 'string' | 'number' | 'boolean' | 'array' | 'object'
          description: 'Clear parameter description',
          required: true
        }
      ],
      endpoint: '/api/tool-endpoint', // Relative path
      http_method: 'POST',
      auth_required: false,
      version: '1.0.0'
    }
  ],
  name: 'Service Name',
  description: 'Service description',
  version: '1.0.0',
  sdk_version: '@optimizely-opal/opal-tools-sdk'
}

// ❌ INCORRECT - Avoid These Patterns
{
  tools: { // Wrong: Use 'functions' array
    tool_name: {
      parameters: { // Wrong: Use array format
        type: 'object',
        properties: { ... } // Causes parsing errors
      }
    }
  }
}
```

**Implementation Template:**
```typescript
// Discovery Endpoint: /src/app/api/tools/[tool]/discovery/route.ts
export async function GET(request: NextRequest, { params }: { params: Promise<{ tool: string }> }) {
  try {
    const { tool } = await params;

    const functions = [{
      name: toolConfig.name,
      description: toolConfig.description,
      parameters: createOPALParameterArray(toolConfig.input_schema),
      endpoint: `/tools/${toolConfig.name}`,
      http_method: "POST"
    }];

    return NextResponse.json({ functions }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'discovery_endpoint_error',
      functions: [] // Always include functions array
    }, { status: 500 });
  }
}

function createOPALParameterArray(schema: any) {
  const parameters = [];
  const requiredFields = schema.required || [];

  for (const [propName, propDef] of Object.entries(schema.properties || {})) {
    parameters.push({
      name: propName,
      type: propDef.type || 'string',
      description: propDef.description || `${propName} parameter`,
      required: requiredFields.includes(propName)
      // No default, enum, examples - these cause parsing errors
    });
  }

  return parameters;
}
```

### Integration Best Practices

#### Development Workflow

**Phase 1: Design & Planning**
- Define clear function boundaries with single responsibilities
- Plan simple parameter structures (avoid nested objects)
- Consider authentication strategy (public discovery, authenticated execution)
- Plan rate limiting and error handling requirements

**Phase 2: Implementation Standards**
```typescript
// Tool Configuration: /opal-config/opal-tools/[tool_name].json
{
  "name": "Tool Name",
  "description": "Clear tool purpose",
  "version": "1.0.0",
  "tools": [
    {
      "name": "function_name",
      "description": "Specific function purpose",
      "input_schema": {
        "type": "object",
        "properties": {
          "simple_param": {
            "type": "string",
            "description": "Parameter description"
          }
        },
        "required": ["simple_param"]
      }
    }
  ]
}
```

**Phase 3: Testing & Validation**
```bash
# Local Testing Workflow
npm run dev
curl -s "http://localhost:3000/api/tools/[tool]/discovery" | jq '.'
npm run validate:opal -- --tool=[tool]

# Production Deployment Testing
npm run deploy:prod
npm run validate:opal:prod
curl -I "https://domain.com/api/tools/[tool]/discovery" | grep cache-control
```

#### Security Guidelines

**Discovery Endpoint Security:**
```typescript
// ✅ Correct: Public Discovery (Required)
export async function GET(request: NextRequest) {
  // No authentication - discovery must be publicly accessible
  return NextResponse.json(discoveryData);
}

// ✅ Correct: Authenticated Tool Execution
export async function POST(request: NextRequest) {
  const authResult = await validateAuth(request);
  if (!authResult.valid) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }
  // Execute tool logic
}
```

**Data Protection:**
```typescript
// ✅ Safe Discovery Response
{
  functions: [{
    name: "analytics_tool",
    description: "Retrieve analytics data", // Generic description
    parameters: [{
      name: "metric_type",
      description: "Type of metric" // No sensitive examples
    }]
  }]
}

// ❌ Dangerous: Sensitive Data Exposure
{
  functions: [{
    api_key: "secret-key-123",     // Exposed secret
    database_url: "internal.db",   // Internal system info
    examples: ["user_id=12345"]    // Real data examples
  }]
}
```

### Troubleshooting Guide

#### Common Error: `'str' object has no attribute 'get'`

**Diagnostic Workflow:**

1. **Test Discovery Format**
```bash
# Basic connectivity
curl -I "https://domain.com/api/tools/[tool]/discovery"
# Expected: HTTP/1.1 200 OK, content-type: application/json

# Validate structure
curl -s "URL" | jq '.functions | type'
# Expected: "array" (not "object" or "null")

# Check parameter format (most common issue)
curl -s "URL" | jq '.functions[0].parameters | type'
# Expected: "array" (not "object")
```

2. **Common Fixes**
```typescript
// ❌ Problem: JSON Schema format
parameters: {
  type: 'object',
  properties: {...}
}

// ✅ Solution: OPAL array format
parameters: [
  {
    name: 'param1',
    type: 'string',
    description: 'Parameter description',
    required: true
  }
]
```

**Error Categories & Solutions:**

| Error Type | Cause | Solution |
|------------|-------|----------|
| `'str' object has no attribute 'get'` | JSON Schema format instead of array | Use `createOPALParameterArray()` |
| `Discovery URL does not return valid functions` | Missing `functions` array | Ensure top-level `functions` field |
| `404 Not Found` | Missing API route | Create discovery route file |
| `Functions not loading` | Caching issues | Add `no-cache` headers |
| `Unauthorized on discovery` | Auth on discovery endpoint | Remove auth from discovery |

#### Quick Health Check Commands

```bash
# Complete diagnostic
echo "=== OPAL Discovery Health Check ==="
URL="https://domain.com/api/tools/[tool]/discovery"
curl -s -w "Status: %{http_code}\n" "$URL" | tail -1
curl -s "$URL" | jq '.functions | length'
curl -s "$URL" | jq '.functions[0].parameters | type'
# Expected: Status 200, functions count > 0, parameters type "array"
```

#### Emergency Debugging Steps

**If getting errors right now:**

1. **Quick Format Test**: `curl -s "URL" | jq '.functions[0].parameters | type'`
   - Returns `"object"`: **This is the issue** - fix parameter format
   - Returns `"array"`: Check individual parameter structure

2. **Common Fix Pattern**: Replace JSON Schema with OPAL array format

3. **Validation**: Clear caches and test with diagnostic commands

### CI/CD Integration

#### Automated Validation

```bash
# Package.json scripts
{
  "scripts": {
    "validate:opal": "npx tsx scripts/validate-opal-discovery.ts",
    "validate:opal:prod": "npx tsx scripts/validate-opal-discovery.ts --base-url=https://domain.com",
    "validate:opal:tool": "npx tsx scripts/validate-opal-discovery.ts --tool="
  }
}

# Git hooks (.husky/pre-commit)
#!/bin/sh
npm run validate:opal
```

#### Production Monitoring

```typescript
// Health monitoring endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    checks: {
      database: await checkDatabase(),
      opal_discovery: await checkOPALFormat(),
      external_apis: await checkExternalAPIs()
    },
    timestamp: new Date().toISOString()
  });
}

// Logging strategy
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  console.log(`[${requestId}] Tool execution started`);

  try {
    const result = await executeTool(params);
    console.log(`[${requestId}] Success - Duration: ${Date.now() - startTime}ms`);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[${requestId}] Failed - ${error.message}`);
    throw error;
  }
}
```

### Maintenance Procedures

#### Regular Maintenance Tasks

**Weekly:**
- Run production validation: `npm run validate:opal:prod`
- Review OPAL registration status
- Check CI/CD pipeline success rates
- Monitor error reports and resolution

**Monthly:**
- Update dependencies and test compatibility
- Review tool performance metrics
- Validate security configurations
- Update documentation

**Quarterly:**
- Conduct security audit of endpoints
- Review and optimize configurations
- Plan new tool integrations
- Update integration documentation

#### Success Metrics

- **Registration Success Rate**: 100% tools register without errors
- **Discovery Response Time**: < 500ms for all endpoints
- **Uptime**: 99.9% availability for discovery endpoints
- **Error Rate**: 0% `'str' object` parsing errors
- **CI/CD Success**: 100% validation pass rate

### TypeScript Interfaces

```typescript
// Core OPAL Integration Types
interface OPALDiscoveryResponse {
  functions: OPALFunction[];
  name: string;
  description: string;
  version: string;
  sdk_version: string;
  discovery_generated_at: string;
}

interface OPALFunction {
  name: string;
  description: string;
  parameters: OPALParameter[];
  endpoint: string;
  http_method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  auth_required?: boolean;
  version?: string;
}

interface OPALParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
}

// Agent Custom Tool Structure
interface AgentCustomTool {
  toolName: string;
  description: string;
  category?: string;
  version?: string;
  dependencies?: string[];
  performance_metrics?: {
    execution_time_ms?: number;
    success_rate?: number;
    last_execution?: string;
  };
}
```

### Resource References

#### Quick Command Reference
```bash
# Development
npm run dev                         # Start development server
npm run validate:opal              # Validate all tools
curl -s "URL/discovery" | jq '.'   # Test discovery response

# Production
npm run deploy:prod                # Deploy to production
npm run validate:opal:prod        # Validate production endpoints
curl -I "URL/discovery"           # Check response headers

# Troubleshooting
curl -s "URL" | jq '.functions[0].parameters | type'  # Check format
curl -s -w '%{http_code}' "URL"                       # Check status
```

This advanced integration guide consolidates all OPAL development, best practices, and troubleshooting into a comprehensive reference for building reliable, production-ready OPAL integrations within the OSA ecosystem.