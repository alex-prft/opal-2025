/**
 * OPAL Mapping System - Main Export
 *
 * This file provides easy access to all OPAL mapping utilities and configurations.
 * Import this in your components to work with the OSA mapping system.
 */

// Export all types
export * from './types';

// Export all utilities
export * from './mapping-utils';

// Export configuration data
import agentConfigurations from './agent-configurations.json';
import instructionConfigurations from './instruction-configurations.json';
import toolConfigurations from './tool-configurations.json';
import dxpToolConfigurations from './dxp-tool-configurations.json';
import opalMappingData from './opal_mapping.json';

export {
  agentConfigurations,
  instructionConfigurations,
  toolConfigurations,
  dxpToolConfigurations,
  opalMappingData
};

// Convenience exports for common operations
export {
  getOPALMapping,
  getEnhancedEngineSummary,
  convertToMappingKey,
  analyzeDataQuality,
  getAllAreasAndSections,
  getAllOPALAgents,
  getAllOPALInstructions,
  getAllOPALTools,
  getAllDXPTools,
  getNavigationStructure,
  getTier3Navigation,
  getAllNavigationStructure,
  getAllNavigationPaths
} from './mapping-utils';