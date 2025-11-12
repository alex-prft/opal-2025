# OPAL Agent Monitoring Data

This directory contains monitoring configuration and data for all OPAL agents organized by category and agent type.

## Directory Structure

```
agent-data/
├── aeo/
│   ├── geo-audit/           # AEO/GEO analysis agent
│   ├── content-review/      # Content SEO optimization
│   └── technical-optimization/ # Technology stack optimization
├── audiences/
│   ├── audience-suggester/  # Audience segmentation and analysis
│   └── personalization/     # Personalization opportunities
├── content/
│   ├── content-review-agent/ # Content analysis and optimization
│   ├── audience-suggester/   # Content-audience matching
│   └── strategy-assistant-workflow/ # Content strategy workflows
├── experimentation/
│   ├── experiment-blueprinter/ # Experiment design and analysis
│   └── results-analysis/    # Experiment results processing
├── personalization/
│   └── personalization-idea-generator/ # Personalization strategies
├── cmp/
│   └── cmp-organizer/       # Campaign management optimization
├── roadmap/
│   └── strategy-assistant-workflow/ # Strategic roadmap generation
└── journeys/
    └── customer-journey/    # Customer journey mapping and optimization
```

## Monitoring Configuration Files

Each agent directory contains:

- `agent-config.json` - Agent configuration and monitoring settings
- `performance-metrics.json` - Historical performance data (auto-generated)
- `health-status.json` - Current health status (auto-updated)
- `logs/` - Agent-specific log files

## Configuration Schema

Each `agent-config.json` follows this schema:

```json
{
  "agent": "agent_name",
  "category": "Category Name",
  "section": "OSA Section → Subsection",
  "version": "2.x.x",
  "last_updated": "YYYY-MM-DD",
  "monitoring_config": {
    "performance_metrics": {
      "response_time_threshold_ms": 5000,
      "accuracy_threshold": 0.85,
      "confidence_threshold": 0.75
    },
    "health_checks": {
      "enabled": true,
      "interval_seconds": 300,
      "timeout_seconds": 30
    },
    "logging": {
      "level": "info|debug|warn|error",
      "include_request_data": true,
      "include_response_data": true,
      "retention_days": 30
    }
  },
  "capabilities": {
    "capability_name": {
      "enabled": true,
      "priority": "high|medium|low",
      "estimated_processing_time_ms": 3000
    }
  },
  "data_sources": {
    "primary": ["CMS", "ODP", "WEBX", "Content Recs", "CMP"],
    "secondary": [],
    "refresh_interval_minutes": 15
  },
  "validation_rules": {
    "required_outputs": ["output1", "output2"],
    "confidence_validation": true,
    "data_quality_checks": true
  }
}
```

## Agent Categories

### Analytics Insights
- **AEO/GEO**: SEO performance, keyword opportunities, local search optimization
- **Content**: Engagement metrics, content effectiveness, audience resonance
- **Audiences**: Segmentation analysis, behavioral patterns, lifecycle mapping
- **CX**: Customer journey mapping, touchpoint effectiveness

### Experience Optimization
- **Technology**: Infrastructure optimization, API performance, integration analysis
- **Experimentation**: Experiment design, statistical analysis, results interpretation
- **Personalization**: Dynamic rules, real-time optimization, behavioral triggers

### Strategy Plans
- **Strategic Roadmap**: Strategic planning, quick wins identification, initiative prioritization

### Optimizely DXP Tools
- **CMP**: Campaign optimization, email automation, performance analysis

## Monitoring Integration

This monitoring system integrates with:

1. **OPAL Core Engine** - Agent performance tracking
2. **OSA Dashboard** - Real-time monitoring displays
3. **Alert System** - Performance threshold notifications
4. **Analytics Pipeline** - Historical analysis and reporting

## Update History

- **2025-11-11**: Initial implementation with v2.1.0 schema
- **2025-11-11**: Added technical optimization agent for Experience Optimization → Technology
- **2025-11-11**: Updated all categories to align with OSA section mappings

## Usage

The monitoring system automatically:
1. Tracks agent performance metrics
2. Monitors health status and availability
3. Validates output quality and confidence
4. Manages log rotation and retention
5. Triggers alerts for performance issues

For manual monitoring queries, use the OPAL Admin Dashboard or API endpoints.