# OPAL Mapping System

This folder contains the comprehensive mapping system that aligns the Strategy Dashboard areas with the OPAL ecosystem and Optimizely DXP tools. This mapping is essential for improving OSA accuracy and personalization results.

## Overview

The OPAL Mapping System provides a structured approach to connect:
- **Strategy Dashboard Areas** (Strategy Plans, Analytics Insights, etc.)
- **OPAL Components** (Agents, Instructions, Tools)
- **Optimizely DXP Tools** (Content Recs, CMS, ODP, WEBX, CMP)

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

## How OSA Works Together

### Current Flow (Simulated)
```
User Input → OPAL Agents → RAG Decision Layer → Simulated DXP Data → Dashboard Results
```

### Intended Flow (With Real Integration)
```
User Input → OPAL Agents → RAG Decision Layer → Live DXP APIs → Enhanced Dashboard Results
```

## Mapping Structure

Each Strategy Dashboard area/tab combination maps to:

```json
{
  "opal_instructions": ["content-guidelines", "personas"],
  "opal_agents": ["content_review"],
  "opal_tools": ["osa_contentrecs_tools"],
  "optimizely_dxp_tools": ["Content Recs", "CMS"]
}
```

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

## Implementation Steps

### Phase 1: Enhanced Mapping (✅ Complete)
- [x] Import Excel mapping data
- [x] Create TypeScript interfaces
- [x] Build utility functions
- [x] Generate configuration files

### Phase 2: Dashboard Integration (🔄 In Progress)
- [ ] Update StrategyDashboard to use real mapping
- [ ] Replace hardcoded Engine Actions with dynamic data
- [ ] Implement data quality calculations

### Phase 3: Admin Interface
- [ ] Create admin configuration UI
- [ ] Implement DXP tool connection management
- [ ] Add RAG model settings interface
- [ ] Build personalization rule editor

### Phase 4: Real Integration
- [ ] Implement DXP API connectors
- [ ] Add real-time data processing
- [ ] Enable dynamic personalization
- [ ] Deploy production-ready system

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