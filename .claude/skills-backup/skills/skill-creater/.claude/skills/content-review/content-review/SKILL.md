---
name: content-review
description: Comprehensive content review and quality assurance system for OSA (Optimizely Strategy Assistant) results pages. This skill should be used when Claude needs to analyze, validate, or optimize content on OSA results pages to ensure it leverages OPAL integration data rather than being generic. Use this skill for (1) Content quality assessment across the 4 major OSA sections (Strategy Plans, Experience Optimization, Analytics Insights, DXP Tools), (2) OPAL integration validation and alignment checking, (3) Generic content detection and replacement recommendations, (4) Results-content-optimizer agent workflow coordination, (5) Content optimization based on OPAL mapping structure, or (6) Quality control for content updates and deployments.
---

# Content Review Skill for OSA

This skill provides comprehensive content review and quality assurance capabilities specifically designed for the OSA (Optimizely Strategy Assistant) project. It ensures that content on results pages leverages OPAL integration data and maintains alignment with the results-content-optimizer agent patterns.

## Core Capabilities

### 1. Content Quality Assessment
- **Generic Content Detection**: Identify placeholder content, generic recommendations, and non-personalized text
- **OPAL Data Verification**: Confirm content leverages specific OPAL integration data points
- **Quality Scoring**: Comprehensive scoring system for content effectiveness and alignment
- **Multi-Tier Analysis**: Support for all OSA navigation tiers (tier1/tier2/tier3 structure)

### 2. OPAL Integration Validation
- **Mapping Alignment**: Validate content against OPAL mapping structure and expectations
- **Component Verification**: Check for required OPAL instructions, agents, tools, and DXP tools
- **Integration Health**: Monitor OPAL integration completeness and effectiveness
- **Missing Component Detection**: Identify gaps in OPAL integration for specific content areas

### 3. Results-Content-Optimizer Coordination
- **Agent Pattern Alignment**: Ensure content follows results-content-optimizer agent workflows
- **Quality Control Integration**: Coordinate with existing quality control systems
- **Automated Optimization**: Trigger optimization workflows when content quality thresholds are not met
- **Content Flow Management**: Align with OPAL mapping for consistent content insertion flow

## OSA-Specific Implementation

### Four Major OSA Sections Support

**Strategy Plans**
- Validate company-specific context from OPAL instructions
- Ensure marketing strategy integration from OPAL workflow
- Check for implementation timelines and strategic recommendations
- Verify KPI tracking and measurement framework integration

**Optimizely DXP Tools**
- Validate tool-specific content alignment (Content Recs, CMS, ODP, WEBX, CMP)
- Check for performance metrics and analytics integration
- Ensure tool-specific recommendations and insights
- Verify multi-tool integration workflows

**Analytics Insights**
- Validate data-driven content with specific metrics
- Check for audience-specific insights from OPAL agents
- Ensure trend analysis and behavioral insights integration
- Verify engagement patterns and performance benchmarks

**Experience Optimization**
- Validate optimization-focused content with actionable recommendations
- Check for A/B testing insights and experimentation data
- Ensure personalization strategies and audience segmentation
- Verify conversion optimization and user journey mapping

### OPAL Mapping Integration

The skill uses the complete OPAL mapping structure to validate content alignment:

```typescript
// Example mapping validation for Strategy Plans > OSA
{
  "opal_instructions": ["company-overview", "marketing-strategy"],
  "opal_agents": ["strategy_workflow"],
  "opal_tools": ["workflow_data_sharing"],
  "optimizely_dxp_tools": ["Content Recs", "CMS", "ODP", "WEBX", "CMP"]
}
```

Content must demonstrate integration with these components to pass validation.

## Using the Content Review Scripts

### Content Analysis Script

Analyze individual pages or content blocks:

```bash
# Analyze specific page content
python3 scripts/content_analyzer.py \
  --tier1 "Strategy Plans" \
  --tier2 "OSA" \
  --tier3 "AI Recommendations" \
  --content-file ./page-content.txt

# Direct content analysis
python3 scripts/content_analyzer.py \
  --tier1 "Analytics Insights" \
  --tier2 "Content" \
  --content "Your content here..." \
  --output-json analysis-results.json

# Use custom OPAL mapping
python3 scripts/content_analyzer.py \
  --tier1 "Experience Optimization" \
  --tier2 "Personalization" \
  --mapping-file ./custom-opal-mapping.json \
  --content-file ./content.txt
```

### OPAL Integration Validator

Validate OPAL integration compliance:

```bash
# Validate single page OPAL integration
python3 scripts/opal_integration_validator.py \
  --tier1 "Strategy Plans" \
  --tier2 "OSA" \
  --content-file ./page-content.txt

# Validate all results pages
python3 scripts/opal_integration_validator.py \
  --validate-all-results \
  --min-score 70.0 \
  --output-json validation-report.json

# Custom validation with specific mapping
python3 scripts/opal_integration_validator.py \
  --tier1 "Optimizely DXP Tools" \
  --tier2 "Content Recs" \
  --mapping-file ./opal-mapping.json \
  --content "Page content to validate..."
```

## Quality Standards and Thresholds

### Content Quality Scoring
- **90-100**: Excellent - Highly personalized, data-driven content with comprehensive OPAL integration
- **70-89**: Good - Well-integrated content with minor optimization opportunities
- **50-69**: Acceptable - Basic OPAL integration with improvement needed
- **30-49**: Poor - Minimal OPAL usage, significant generic content
- **0-29**: Failing - Generic content with no OPAL integration

### OPAL Alignment Scoring
- **Required Components**: 25 points each for tier structure, OPAL instructions, agents, tools
- **DXP Tools Integration**: 5 points per tool mentioned
- **Content Specificity**: Bonus points for data-driven insights and personalized recommendations

### Validation Thresholds
- **Production Deployment**: Minimum 70% content quality score
- **OPAL Integration**: At least 50% of expected OPAL components must be present
- **Generic Content**: Zero tolerance for placeholder or TODO content in production
- **Agent Alignment**: Must reference at least one expected OPAL agent per section

## Integration with Results-Content-Optimizer Agent

### Workflow Coordination
1. **Pre-Optimization Analysis**: Run content analysis before optimization
2. **Component Validation**: Validate OPAL integration alignment
3. **Quality Assessment**: Generate quality scores and recommendations
4. **Optimization Triggers**: Automatically trigger results-content-optimizer when thresholds are not met
5. **Post-Optimization Validation**: Re-validate content after optimization

### Agent Communication Patterns
```typescript
// Example workflow integration
const contentAnalysis = await analyzeContent(tier1, tier2, tier3, content);

if (contentAnalysis.contentQualityScore < 70) {
  // Trigger results-content-optimizer agent
  await triggerResultsContentOptimizer({
    tier1, tier2, tier3,
    currentScore: contentAnalysis.contentQualityScore,
    recommendations: contentAnalysis.recommendations,
    missingOpalIntegrations: contentAnalysis.missingOpalIntegrations
  });
}
```

## Content Improvement Workflows

### Generic Content Replacement
1. **Detection**: Identify generic content patterns and placeholder text
2. **OPAL Data Sourcing**: Determine available OPAL data for personalization
3. **Replacement Strategy**: Generate data-driven content alternatives
4. **Integration Testing**: Validate new content against OPAL mapping
5. **Quality Assurance**: Confirm improved quality scores post-replacement

### OPAL Integration Enhancement
1. **Gap Analysis**: Identify missing OPAL components for specific pages
2. **Component Integration**: Add required OPAL instructions, agents, and tools
3. **DXP Tools Alignment**: Ensure relevant Optimizely DXP tools are referenced
4. **Content Personalization**: Leverage OPAL data for user-specific content
5. **Validation**: Confirm complete OPAL integration alignment

### Quality Control Process
1. **Automated Analysis**: Run content analysis scripts on updated content
2. **Threshold Validation**: Ensure content meets minimum quality standards
3. **OPAL Compliance**: Verify complete OPAL integration requirements
4. **Performance Impact**: Assess content changes on user engagement metrics
5. **Continuous Monitoring**: Ongoing quality assessment and optimization

## Best Practices

### Content Creation Guidelines
- **Data-First Approach**: Always start with available OPAL data and insights
- **Personalization Priority**: Prefer user-specific content over generic recommendations
- **Multi-Tool Integration**: Reference multiple relevant Optimizely DXP tools when appropriate
- **Actionable Insights**: Provide specific, implementable recommendations
- **Performance Context**: Include relevant metrics and performance indicators

### Quality Assurance Patterns
- **Pre-Deployment Validation**: Always run content analysis before publishing
- **Threshold Compliance**: Maintain minimum 70% quality scores for production content
- **OPAL Alignment**: Ensure at least 50% OPAL component integration
- **Agent Coordination**: Coordinate with results-content-optimizer for comprehensive optimization
- **Continuous Improvement**: Regular content review and optimization cycles

### Integration Maintenance
- **Mapping Updates**: Sync with OPAL mapping changes and updates
- **Agent Compatibility**: Maintain compatibility with results-content-optimizer patterns
- **Tool Evolution**: Adapt to new Optimizely DXP tools and capabilities
- **Performance Monitoring**: Track content effectiveness and user engagement
- **Feedback Loops**: Implement feedback mechanisms for continuous content improvement

## Troubleshooting Common Issues

### Low Quality Scores
- **Issue**: Content quality score below 70%
- **Solution**: Run content analyzer to identify specific issues, integrate more OPAL data points, remove generic content patterns

### Missing OPAL Integration
- **Issue**: OPAL integration validation failures
- **Solution**: Check OPAL mapping alignment, add missing components (instructions, agents, tools), verify DXP tools integration

### Generic Content Detection
- **Issue**: Generic content patterns detected
- **Solution**: Replace with data-driven alternatives, leverage OPAL insights, add user-specific recommendations

### Agent Coordination Problems
- **Issue**: Results-content-optimizer agent conflicts
- **Solution**: Review agent communication patterns, ensure proper workflow coordination, validate integration points

For advanced troubleshooting and detailed technical reference, see the reference files in this skill's documentation.