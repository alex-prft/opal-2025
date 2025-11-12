# OSA Opal Agents Configuration

This folder contains the complete agent configuration suite for the OSA (Optimizely Strategy Assistant) personalization workflow, designed to work seamlessly with Optimizely Opal AI platform.

## Agent Architecture Overview

The OSA agent system uses a **sequential workflow with integrated data sharing** to generate comprehensive personalization strategies. Each agent builds upon insights from previous agents, creating a synergistic approach that maximizes strategic value.

### Schema Version 2.0 Enhancements

All agents have been upgraded to Schema Version 2.0 with the following improvements:

- **Structured Output Schemas**: Consistent JSON schema validation for all agent outputs
- **Workflow Data Sharing**: Built-in data passing between agents via `workflow_data` objects
- **Integration Endpoints**: Direct OSA webhook integration and CMP platform connectivity
- **Error Resilience**: Graceful degradation and partial result handling
- **Performance Optimization**: Caching strategies and parallel execution opportunities

## Enhanced Admin Monitoring System

### Agent Data Monitoring Dashboard

The OSA system now provides comprehensive admin monitoring through a dynamic agent data dashboard system accessible at `/engine/admin/opal-monitoring/agent-data`.

#### Key Features:

**Dynamic Routing Architecture**:
- **Base Route**: `/agent-data` → Auto-redirects to `/agent-data/content`
- **Individual Agent Pages**: `/agent-data/{agent}` supporting 8 active agents
- **Integration Health**: Displayed on main dashboard (`/engine/admin/opal-monitoring`)

**Enhanced Data Structure**:
Each agent provides comprehensive monitoring data including:
- **Data Sent to OSA**: Core operational metrics and performance indicators
- **Optimizely DXP Tools Used**: Platform tool utilization and integration status
- **Strategy Assistance**: Strategic recommendations with admin editing capabilities
- **OPAL Custom Tools**: Specialized tools developed for each specific agent
- **OSA Integration Suggestions**: Enhancement recommendations for OSA services (admin editable)
  - Recommendation Service enhancements
  - Knowledge Retrieval Service improvements
  - Preferences Policy Service updates
- **Use Case Scenarios**: Real-world application examples (admin editable)
- **Next Best Actions**: Immediate implementation steps (admin editable)
- **Metadata**: Execution timestamps, agent IDs, and performance metrics

**Admin Override System**:
- **Real-time Editing**: Inline edit controls for strategic content sections
- **Persistent Storage**: File-based JSON storage in `/data/agent-overrides.json`
- **API Integration**: PUT endpoint for saving admin changes with validation
- **Change Tracking**: Audit trail with modification timestamps and user attribution

**Export and Integration**:
- **JSON Export**: Complete agent data export functionality
- **Raw Data Access**: Direct API endpoint access for technical analysis
- **Performance Metrics**: Real-time execution tracking and success rate monitoring

## Agent Portfolio

### 0. Integration Health Monitor (`integration_health`)
**Execution Order**: Continuous | **Dependencies**: None | **Admin Route**: Main Dashboard Display

**Purpose**: Monitors DXP integration status and comprehensive system health metrics for real-time operational oversight.

**Enhanced Capabilities**:
- Integration status monitoring with 99.8% uptime tracking
- API response time analysis across all services (avg 120ms)
- Error rate monitoring and health scoring (0-100 scale)
- Service availability and synchronization status tracking
- Performance baseline establishment and trending

**Enhanced Data Outputs**:
- `integration_status`: Health status indicator (healthy/warning/critical)
- `uptime_percentage`: System availability metrics
- `api_response_times`: Service-specific performance data
- `error_rates`: Error monitoring across all integrations
- `health_score`: Comprehensive system health (0-100)

**OSA Integration Suggestions**:
- **Recommendation Service**: Include API health scores in strategy recommendations, add automated alerts for threshold breaches
- **Knowledge Retrieval Service**: Pull real-time integration metrics, include historical performance trends
- **Preferences Policy Service**: Allow custom health score thresholds, enable notification preferences

**OPAL Custom Tools**:
- `integration_health_monitor`: Continuous DXP integration status monitoring
- `api_performance_analyzer`: Response time analysis and bottleneck identification
- `error_pattern_detector`: Error pattern detection with fix suggestions

### 1. Content Review Agent (`content_review`)
**Execution Order**: 1st | **Dependencies**: None | **Admin Route**: `/agent-data/content`

**Purpose**: Foundational content analysis to identify personalization opportunities, content gaps, and optimization priorities with enhanced quality metrics.

**Enhanced Capabilities**:
- Content quality scoring (87/100) with detailed variation analysis
- SEO optimization assessment (92%) and accessibility compliance (95%)
- Brand consistency evaluation (89%) across all content variations
- Content variation management (156 total, 142 approved, 14 flagged)
- Experiment content analysis with performance correlation

**Enhanced Data Outputs**:
- `content_quality_score`: Comprehensive content quality metrics (0-100)
- `variation_analysis`: Total/approved/flagged content variations
- `seo_optimization_level`: Search engine optimization readiness percentage
- `accessibility_compliance`: WCAG compliance scoring
- `brand_consistency_score`: Brand guideline adherence assessment

**OSA Integration Suggestions**:
- **Recommendation Service**: Add semantic scoring to recommendations, include content freshness metrics
- **Knowledge Retrieval Service**: Include CMS metadata for better context, pull content performance history
- **Preferences Policy Service**: Allow user content type prioritization, enable quality threshold settings

**OPAL Custom Tools**:
- `content_insight_generator`: Content performance and freshness analysis
- `content_quality_analyzer`: Quality assessment across variations and experiments
- `brand_compliance_checker`: Brand consistency validation and enforcement

### 2. Geographic Audit Agent (`geo_audit`)
**Execution Order**: 2nd | **Dependencies**: Content Review | **Admin Route**: `/agent-data/aeo`

**Purpose**: Generative Engine Optimization (GEO) for AI search engines and regional performance analysis with comprehensive technical SEO assessment.

**Enhanced Capabilities**:
- GEO score assessment (92/100) with AI readiness evaluation
- Search engine optimization across platforms (Google AI: 85, Bing Chat: 78, Claude: 92)
- Regional content gap identification (12 gaps across 15 regions analyzed)
- AI search recommendation generation (8 recommendations)
- Voice search optimization and structured data validation

**Enhanced Data Outputs**:
- `geo_score`: Generative Engine Optimization effectiveness (0-100)
- `ai_readiness`: Boolean assessment for AI search engine compatibility
- `search_engine_optimization`: Platform-specific optimization scores
- `content_gaps_identified`: Regional content opportunities
- `ai_search_recommendations`: Actionable optimization suggestions

**OSA Integration Suggestions**:
- **Recommendation Service**: Include voice search metrics, add AI readiness scoring to strategy recommendations
- **Knowledge Retrieval Service**: Pull structured data from CMS, include regional performance metrics
- **Preferences Policy Service**: Enable AI-readiness toggle, allow search engine prioritization

**OPAL Custom Tools**:
- `geo_optimizer`: AI search engine visibility improvement
- `ai_search_optimizer`: Content optimization for AI-powered search engines
- `regional_content_advisor`: Region-specific content recommendations and strategies

### 3. Audience Suggester Agent (`audience_suggester.json`)
**Execution Order**: 3rd | **Dependencies**: Content Review, GEO Audit

**Purpose**: Strategic audience segmentation using ODP behavioral data and Salesforce member profiles.

**Key Capabilities**:
- High-value segment identification (3-8 segments)
- Boolean logic generation for targeting
- Personalization opportunity mapping
- Statistical viability assessment
- Cross-channel applicability analysis

**Data Outputs**:
- `audience_segments`
- `personalization_opportunities`
- `segment_prioritization`
- `implementation_requirements`

### 4. Personalization Idea Generator Agent (`personalization_idea_generator.json`)
**Execution Order**: 4th | **Dependencies**: Content Review, GEO Audit, Audience Suggester

**Purpose**: Generate strategic personalization concepts mapped to specific audience segments with implementation details.

**Key Capabilities**:
- Audience-specific idea generation
- Technical feasibility assessment
- Content requirement specification
- Implementation complexity evaluation
- ROI projection modeling

**Data Outputs**:
- `personalization_ideas`
- `implementation_specifications`
- `content_requirements`
- `technical_specifications`

### 5. Experiment Blueprinter Agent (`experiment_blueprinter.json`)
**Execution Order**: 5th | **Dependencies**: All Previous Agents

**Purpose**: Convert personalization ideas into statistically rigorous experiment specifications.

**Key Capabilities**:
- Statistical power analysis
- Sample size calculations (95% confidence, 80% power)
- Hypothesis framework development
- A/B testing design specifications
- Success measurement planning

**Data Outputs**:
- `experiment_specifications`
- `statistical_frameworks`
- `testing_roadmap`
- `measurement_plans`

### 6. CMP Organizer Agent (`cmp_organizer.json`)
**Execution Order**: 6th (Final) | **Dependencies**: All Previous Agents

**Purpose**: Compile comprehensive strategy brief and generate CMP-ready campaign specifications for stakeholder delivery.

**Key Capabilities**:
- Executive strategy brief compilation
- CMP campaign specification generation
- Implementation timeline creation
- Resource requirement planning
- Stakeholder deliverable formatting

**Data Outputs**:
- `executive_strategy_brief`
- `cmp_campaign_specifications`
- `implementation_timeline`
- `stakeholder_deliverables`

## Workflow Orchestration

### Primary Workflow: `strategy_workflow.json`

The master workflow configuration that orchestrates all agents in sequence with comprehensive data sharing and error handling.

**Workflow Features**:
- **Sequential Execution**: Each agent builds upon previous insights
- **Data Persistence**: Shared context maintained throughout workflow
- **Error Resilience**: Continues with partial data if agents fail
- **Quality Assurance**: Validation checkpoints at each stage
- **Multi-Integration**: OSA webhook, CMP platform, and email delivery

**Trigger Options**:
1. **Webhook Trigger**: Primary trigger from OSA application
2. **Scheduled Trigger**: Monthly strategy refresh (configurable)

## Data Sharing Architecture

### Inter-Agent Communication

Each agent receives a `workflow_context` parameter containing:

```json
{
  "workflow_context": {
    "content_analysis": "outputs_from_content_review_agent",
    "geo_analysis": "outputs_from_geo_audit_agent",
    "audience_analysis": "outputs_from_audience_suggester_agent",
    "personalization_strategy": "outputs_from_idea_generator_agent",
    "experiment_portfolio": "outputs_from_experiment_blueprinter_agent"
  }
}
```

### OSA Integration Points

All agents include `send_data_to_osa_webhook` tool for real-time data transmission to:
- `${OSA_BASE_URL}/api/opal/agent-data` (individual agent results)
- `${OSA_BASE_URL}/api/opal/workflow-results` (final compilation)

### CMP Platform Integration

The CMP Organizer agent provides direct integration with Campaign Management Platform:
- Campaign specification export
- Audience segment synchronization
- Content asset organization
- Performance measurement setup

## Implementation Guidelines

### Environment Variables Required

```bash
# OSA Integration
OSA_BASE_URL=https://your-osa-application-url.com
OPAL_SHARED_DATA_ENDPOINT=https://opal-data-store-endpoint
OPAL_RESULT_STORAGE_ENDPOINT=https://result-storage-endpoint

# Optimizely Platform APIs
ODP_API_KEY=your_odp_api_key
ODP_BASE_URL=https://function.zaius.com/twilio_segment
EXPERIMENTATION_API_KEY=your_experimentation_api_key
EXPERIMENTATION_BASE_URL=https://api.optimizely.com/v2

# CMP Integration
CMP_API_KEY=your_cmp_api_key
CMP_BASE_URL=https://api.optimizely.com/v2
CMP_WORKSPACE_ID=your_cmp_workspace_id

# Notification Services
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_SENDER_EMAIL=noreply@yourdomain.com
```

### Agent Deployment Checklist

1. **Upload Agent Configurations**: Deploy all JSON files to Opal platform
2. **Configure Webhooks**: Set up webhook authentication and endpoints
3. **Test Data Flow**: Validate inter-agent data sharing
4. **Verify Integrations**: Confirm OSA and CMP connectivity
5. **Performance Testing**: Execute test workflows and validate timing
6. **Stakeholder Training**: Brief teams on deliverable formats

## Quality Assurance Framework

### Validation Checkpoints

Each workflow execution includes automated quality validation:

- **Content Analysis**: Minimum 3 personalization opportunities identified
- **Audience Strategy**: Minimum 3 viable segments with sufficient size
- **Experiment Design**: Proper statistical power analysis for all experiments
- **Strategy Synthesis**: All workflow insights integrated into final brief

### Error Handling Strategy

- **Graceful Degradation**: Continue workflow with available data if agents fail
- **Partial Results**: Generate strategy brief even with incomplete data
- **Simulation Mode**: Fallback to simulated results if APIs unavailable
- **Notification System**: Alert stakeholders of quality issues or failures

## Performance Optimization

### Execution Efficiency

- **Parallel Opportunities**: Content and GEO audits can run simultaneously
- **Caching Strategy**: Content analysis cached 24h, technical audits 12h
- **Resource Management**: Maximum 2 concurrent agents, priority queuing
- **Timeout Management**: Escalation strategy for long-running agents

### Success Metrics

- **Workflow Completion Rate**: Target >95%
- **Data Quality Score**: Target >0.8/1.0
- **Execution Time**: Target <2 hours end-to-end
- **Stakeholder Satisfaction**: Target >4.5/5 strategy brief quality

## Support and Troubleshooting

### Common Issues

1. **Agent Timeout**: Increase timeout_seconds in workflow configuration
2. **Data Quality Low**: Review input parameters and API connectivity
3. **Integration Failures**: Verify webhook authentication and endpoint URLs
4. **Content Analysis Incomplete**: Confirm website accessibility and crawl permissions

### Monitoring and Alerts

- Real-time workflow progress tracking via OSA webhooks
- Automated email notifications for completion and errors
- Performance metrics dashboard integration
- Quality assurance reporting and trending

For technical support or configuration questions, refer to the OSA application documentation or contact the development team.