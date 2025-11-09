/**
 * OPAL Mapping Types
 *
 * These types define the structure for mapping Strategy Dashboard areas
 * to their corresponding OPAL components and Optimizely DXP tools.
 */

export interface OPALMapping {
  opal_instructions: string[];
  opal_agents: string[];
  opal_tools: string[];
  optimizely_dxp_tools: string[];
}

export interface AreaMapping {
  [subSection: string]: OPALMapping;
}

export interface CompleteOPALMapping {
  [mainArea: string]: AreaMapping;
}

/**
 * OPAL Agent Configurations
 */
export interface OPALAgent {
  name: string;
  description: string;
  capabilities: string[];
  instructions_required: string[];
  tools_used: string[];
}

/**
 * OPAL Instruction Configurations
 */
export interface OPALInstruction {
  filename: string;
  title: string;
  description: string;
  content_type: 'guideline' | 'framework' | 'template' | 'rubric';
  applicable_areas: string[];
}

/**
 * OPAL Tool Configurations
 */
export interface OPALTool {
  name: string;
  description: string;
  dxp_integration: string[];
  data_sources: string[];
  output_format: string;
}

/**
 * Optimizely DXP Tool Configurations
 */
export interface OptimizelyDXPTool {
  name: string;
  description: string;
  api_endpoints: string[];
  data_types: string[];
  integration_status: 'connected' | 'simulated' | 'not_configured';
}

/**
 * Admin Configuration for OSA Alignment
 */
export interface OSAConfiguration {
  mapping: CompleteOPALMapping;
  agents: { [name: string]: OPALAgent };
  instructions: { [filename: string]: OPALInstruction };
  tools: { [name: string]: OPALTool };
  dxp_tools: { [name: string]: OptimizelyDXPTool };
  personalization_settings: {
    rag_model_settings: {
      temperature: number;
      max_tokens: number;
      context_window: number;
    };
    data_quality_thresholds: {
      minimum_confidence: number;
      required_data_sources: number;
    };
  };
}

/**
 * Result Enhancement Interface
 * Used to improve accuracy and personalization of OSA results
 */
export interface ResultEnhancement {
  area: string;
  sub_section: string;
  current_data_quality: number;
  missing_integrations: string[];
  recommended_improvements: string[];
  personalization_opportunities: string[];
  estimated_accuracy_improvement: number;
}