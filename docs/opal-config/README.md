# OPAL Configuration System

This folder contains the complete OPAL (Optimizely Assistant Platform) configuration system that powers the OSA (Optimizely Strategy Assistant). All OPAL components, mappings, and configurations are organized here for easy management and maintenance.

## Folder Structure

```
opal-config/
├── opal-agents/           # OPAL agent configurations and capabilities
├── opal-instructions/     # Instruction files (.md) that guide agent behavior
├── opal-mapping/         # Mapping system connecting dashboard areas to OPAL components
└── opal-tools/           # OPAL tool configurations for DXP integrations
```

## Component Overview

### 🤖 opal-agents/
Contains JSON configuration files for each OPAL agent:
- `strategy_workflow.json` - Primary strategic planning agent
- `content_review.json` - Content performance analysis agent
- `audience_suggester.json` - Audience segmentation and personalization agent
- `experiment_blueprinter.json` - A/B testing and experimentation agent
- `personalization_idea_generator.json` - Personalization strategy agent
- `cmp_organizer.json` - Campaign management platform agent
- `geo_audit.json` - Geographic analysis and optimization agent

### 📋 opal-instructions/
Contains Markdown instruction files that provide context and guidelines:
- `1-company-overview.md` - Company context and business objectives
- `2-marketing-strategy.md` - Marketing goals and strategic framework
- `3-brand-tone-guidelines.md` - Brand voice and messaging standards
- `4-personas.md` - Customer personas and audience segments
- `5-personalization-maturity-rubric.md` - Crawl-Walk-Run-Fly maturity framework
- `6-content-guidelines.md` - Content creation and optimization standards
- `7-data-governance-privacy.md` - Privacy compliance and data handling
- `8-kpi-experimentation.md` - KPI definitions and testing methodologies
- `9-technical-implementation-guidelines.md` - Technical integration requirements

### 🗺️ opal-mapping/
Contains the mapping system that connects Strategy Dashboard areas to OPAL components:
- `opal_mapping.json` - Core mapping data (converted from Excel)
- `mapping-utils.ts` - Utility functions for working with mappings
- `types.ts` - TypeScript interfaces for the mapping system
- `*-configurations.json` - Detailed configuration files for all components

### 🔧 opal-tools/
Contains JSON configuration files for OPAL tools that interface with DXP systems:
- `workflow_data_sharing.json` - Central data orchestration tool
- `osa_contentrecs_tools.json` - Content Recommendations integration
- `osa_cmspaas_tools.json` - CMS platform integration
- `osa_odp_tools.json` - Optimizely Data Platform integration
- `osa_webx_tools.json` - Web Experimentation integration
- `osa_cmp_tools.json` - Campaign Management Platform integration

## How It All Works Together

### 1. User Interaction Flow
```
User selects area → Dashboard maps to OPAL components → Agents process with instructions → Tools gather data → Results displayed
```

### 2. Configuration Mapping
Each Strategy Dashboard area/tab combination maps to specific:
- **OPAL Agents** (which AI processes the request)
- **OPAL Instructions** (what context guides the processing)
- **OPAL Tools** (which integrations provide data)
- **DXP Tools** (which Optimizely products supply information)

### 3. Example: Analytics Insights → Content
When a user views "Analytics Insights → Content":
- **Agent**: `content_review` analyzes content performance
- **Instructions**: Uses `content-guidelines.md` and `kpi-experimentation.md`
- **Tools**: `workflow_data_sharing` orchestrates data
- **DXP Tools**: Content Recs, CMS, and CMP provide real performance data

## Key Benefits

### For Developers
- **Modular Architecture**: Each component is independently configurable
- **Clear Dependencies**: Mapping shows exactly which components work together
- **Easy Maintenance**: All configurations in one organized location
- **Type Safety**: Full TypeScript support for all interfaces

### for Administrators
- **Full Control**: Configure every aspect of the OSA system
- **Transparency**: See exactly how insights are generated
- **Flexibility**: Add new agents, instructions, or tools easily
- **Monitoring**: Track which components are active and their performance

### For Users
- **Accurate Insights**: Based on properly mapped OPAL components
- **Consistent Experience**: All areas follow the same configuration patterns
- **Personalized Results**: Tailored to specific roles and organizational context
- **Actionable Recommendations**: Generated using real performance data

## Configuration Management

### Adding New Components

#### New OPAL Agent
1. Create JSON file in `opal-agents/`
2. Add to `opal-mapping/agent-configurations.json`
3. Update mapping in `opal-mapping/opal_mapping.json`
4. Reference in relevant dashboard areas

#### New Instruction File
1. Create .md file in `opal-instructions/`
2. Add metadata to `opal-mapping/instruction-configurations.json`
3. Reference in agent configurations
4. Update mapping for relevant areas

#### New OPAL Tool
1. Create JSON file in `opal-tools/`
2. Add to `opal-mapping/tool-configurations.json`
3. Configure DXP integrations
4. Update mapping for areas that should use it

### Modifying Mappings
1. Update `opal-mapping/opal_mapping.json` for area/component relationships
2. Modify configuration files to adjust capabilities
3. Update instruction files to refine agent behavior
4. Test changes through Strategy Dashboard

## Development Workflow

### 1. Local Development
```bash
# All configurations are in opal-config/
cd opal-config/

# Modify agent behavior
edit opal-agents/strategy_workflow.json

# Update instructions
edit opal-instructions/2-marketing-strategy.md

# Adjust mappings
edit opal-mapping/opal_mapping.json
```

### 2. Testing Changes
- Use Strategy Dashboard to verify updated configurations
- Check Engine Actions sections to see configuration details
- Monitor data quality scores and recommendations

### 3. Production Deployment
- All configurations deploy automatically with the application
- No separate deployment needed for OPAL config changes
- Changes take effect immediately upon deployment

## Next Steps

1. **Admin Interface**: Build UI to manage these configurations
2. **Real DXP Integration**: Connect tools to actual Optimizely APIs
3. **Performance Monitoring**: Track agent performance and data quality
4. **Advanced Personalization**: Implement behavior-based rule engine

This configuration system provides the foundation for a fully customizable, highly accurate, and properly integrated OSA system.