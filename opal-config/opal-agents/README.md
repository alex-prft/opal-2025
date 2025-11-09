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

## Agent Portfolio

### 1. Content Review Agent (`content_review.json`)
**Execution Order**: 1st | **Dependencies**: None

**Purpose**: Foundational content analysis to identify personalization opportunities, content gaps, and optimization priorities.

**Key Capabilities**:
- Content quality scoring (0-100)
- SEO readiness assessment
- Personalization potential identification
- Content gap analysis
- Brand compliance evaluation

**Data Outputs**:
- `content_quality_metrics`
- `personalization_opportunities`
- `content_optimization_priorities`
- `seo_foundation_status`

### 2. GEO Audit Agent (`geo_audit.json`)
**Execution Order**: 2nd | **Dependencies**: Content Review

**Purpose**: Technical SEO and Generative Engine Optimization audit to ensure personalization implementations perform effectively.

**Key Capabilities**:
- AI citation readiness assessment
- Schema markup validation
- Core Web Vitals analysis
- Performance baseline establishment
- Technical constraint identification

**Data Outputs**:
- `technical_seo_status`
- `performance_baseline`
- `implementation_constraints`
- `optimization_opportunities`

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

### Primary Workflow: `strategy_assistant_workflow.json`

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