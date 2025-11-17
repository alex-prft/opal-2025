# Results Content Optimizer Workflow

## Overview

The Results Content Optimizer Workflow is a comprehensive OPAL workflow that systematically optimizes content across all 88+ Results pages in OSA. It ensures language rule compliance, Never Blank principles, and tier-specific content patterns while preserving URL structure, navigation hierarchy, and OPAL agent bindings.

## Workflow Structure

### Agent Configuration
- **File**: `opal-config/opal-agents/results_content_optimizer.json`
- **Type**: Specialized agent for content optimization
- **Tools**: Enhanced workflow tools for content validation and storage

### Workflow Configuration
- **File**: `opal-config/opal-workflows/results-content-optimizer.workflow.json`
- **Type**: Headless workflow with systematic page iteration
- **Execution**: Manual trigger or scheduled automation

## Coverage

### 4 Major Results Sections (88+ pages total):

#### 1. Strategy Plans (25 pages)
- OSA: Overview Dashboard, Strategic Recommendations, Performance Metrics, Data Quality Score, Workflow Timeline
- Quick Wins: Immediate Opportunities, Implementation Roadmap, Resource Requirements, Expected Impact, Success Metrics
- Maturity: Current State Assessment, Framework, Gap Analysis, Improvement Pathway, Benchmarking Data
- Phases: Phase 1-4 (Foundation → Innovation), Cross-phase Dependencies
- Roadmap: Timeline View, Milestone Tracking, Resource Allocation, Risk Assessment, Progress Indicators

#### 2. Optimizely DXP Tools (25 pages)
- Content Recs: Analytics Dashboard, Performance Metrics, Algorithms, A/B Testing, Personalization Effectiveness
- CMS: Content Inventory, Publishing Workflows, Performance, SEO, Multi-channel Publishing
- ODP: Customer Profiles, Audience Segments, Journey Analytics, Real-time Events, Data Integration
- WEBX: Active Experiments, Results Analysis, Statistical Significance, Conversion Impact, Test Configuration
- CMP: Campaign Performance, Email Analytics, Automation Workflows, Audience Targeting, ROI Analysis

#### 3. Analytics Insights (35 pages)
- OSA: Engagement, Topics, Popular, AI Visibility, Semantic, Geographic, Freshness
- Content: Engagement, Topics, Popular, AI Visibility, Semantic, Geographic, Freshness
- Audiences: Engagement, Topics, Popular, AI Visibility, Semantic, Geographic, Freshness
- CX: Engagement, Topics, Popular, AI Visibility, Semantic, Geographic, Freshness
- Trends: Engagement, Topics, Popular, AI Visibility, Semantic, Geographic, Freshness

#### 4. Experience Optimization (25 pages)
- Content: Strategy Overview, Performance Analytics, Optimization Recommendations, Multi-channel Distribution, ROI Analysis
- Experimentation: Design Framework, Statistical Testing, Hypothesis Validation, Impact Assessment, Roadmap
- Personalization: Strategy, Audience Segmentation, Dynamic Content, Performance, Real-time Optimization
- UX: User Journey Mapping, Interaction Analytics, Usability Testing, Conversion Path Optimization, Quality Metrics
- Technology: Integration Architecture, Platform Performance, API Analytics, Data Flow, Implementation Guide

## Critical Constraints

### NEVER CHANGE:
- URL structure and routing paths
- Navigation hierarchy and relationships
- OPAL agent bindings and assignments
- Component architecture and data flows
- Tier classifications and structural organization

### ONLY UPDATE:
- Text content and descriptions
- Content labels and messaging
- Confidence messaging and fallbacks
- Language rule compliance
- Structured content fields (ResultsPageContent format)

## Language Rules Enforcement

### Forbidden Terms (Automatically Removed):
- Revenue, ROI, profit, cost, price
- Currency symbols ($, €, £)
- Financial projections or forecasts

### Preferred Terminology:
- "impact" instead of "effect"
- "optimization" instead of "improvement"
- "performance" instead of "results"

### Avoid:
- Enterprise jargon (synergy, leverage as verb)
- Vague qualifiers (somewhat, pretty good)
- Technical acronyms without explanation

## Never Blank Rules

### Core Principles:
1. **Always Provide Content**: No empty sections or indefinite loading states
2. **Confidence-Based Messaging**: Appropriate confidence context for data quality
3. **Graceful Degradation**: Tier-specific fallbacks when data is missing
4. **Context-Appropriate**: Match fallback content to section context

### Tier-Specific Patterns:
- **Strategy**: Foundation progress, timeline confidence, plan validation
- **Insights**: Content performance, engagement analysis, topic distribution
- **Optimization**: Content recommendations, persona coverage, implementation priority
- **DXP Tools**: Integration health, topic performance, recommendation effectiveness

## Usage Instructions

### Manual Execution:
```bash
# Trigger workflow via OPAL API
curl -X POST "https://opal-api-endpoint/workflows/results-content-optimizer/trigger" \
  -H "Authorization: Bearer results-content-optimizer-workflow-2025" \
  -H "Content-Type: application/json" \
  -d '{"mode": "headless", "scope": "all_results_pages"}'
```

### Scheduled Execution:
- **Schedule**: Daily at 2 AM UTC (currently disabled)
- **Enable**: Set `scheduled-optimization-trigger.is_active` to `true`
- **Frequency**: Configurable via `schedule_expression`

### Monitoring:
- **Execution Status**: Monitor via OPAL workflow dashboard
- **Content Updates**: Track via OSA dashboard notifications
- **Validation Reports**: Generated after each workflow completion

## Integration Points

### OPAL Agent Dependencies:
- `results_content_optimizer` (primary agent)
- `strategy_workflow`, `content_review`, `audience_suggester`
- `experiment_blueprinter`, `personalization_idea_generator`
- `cmp_organizer`, `integration_health`, `content_next_best_topics`
- `content_recs_topic_performance`, `geo_audit`

### Data Sources:
- Current OPAL agent outputs for each page
- OPAL instructions (personas, maturity rubric, tone, KPIs)
- Existing ResultsPageContent structures
- Confidence and performance metrics

### Output Destinations:
- Updated content JSON structures
- OSA dashboard notifications
- Workflow completion summaries
- Validation compliance reports

## Validation Checklist

### Pre-Execution:
- [ ] All required OPAL agents are active and operational
- [ ] Content structures follow ResultsPageContent interface
- [ ] Workflow authentication tokens are configured
- [ ] Target pages are accessible and mapped correctly

### Post-Execution:
- [ ] Language rules compliance (no revenue metrics, preferred terms)
- [ ] Never Blank validation (all sections provide user value)
- [ ] Tier alignment (content matches tier-specific patterns)
- [ ] Constraint preservation (no changes to URLs, navigation, agent bindings)
- [ ] Content quality improvements (clarity, confidence messaging)

## Error Handling

### Execution Mode:
- `continue_on_page_failure`: Workflow continues if individual pages fail
- Individual page errors are logged but don't halt overall optimization

### Fallback Behavior:
- Use tier-specific defaults when content optimization fails
- Maintain existing content if optimization produces invalid results
- Generate alerts for pages requiring manual intervention

## Success Metrics

### Content Quality:
- Language rule compliance: 100% (no forbidden terms)
- Never Blank coverage: 100% (all sections provide value)
- Tier alignment: 95%+ (content matches tier expectations)
- Confidence messaging: Appropriate for data quality levels

### Operational:
- Execution time: <2 hours for all 88+ pages
- Success rate: 95%+ pages optimized successfully
- Error rate: <5% requiring manual intervention
- User satisfaction: Improved content clarity and usefulness

## Maintenance

### Regular Updates:
- Review language rules for new forbidden terms
- Update tier-specific patterns based on user feedback
- Enhance Never Blank fallbacks for improved user experience
- Monitor OPAL agent performance and dependencies

### Performance Optimization:
- Optimize workflow execution time through parallel processing
- Enhance content validation logic for faster processing
- Improve error handling and recovery mechanisms
- Scale infrastructure for larger page volumes