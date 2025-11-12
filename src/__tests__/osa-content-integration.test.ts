// Jest globals are automatically available
import fs from 'fs';
import path from 'path';
import {
  validateAnalyticsInsightsContent,
  validateStrategyPlansContent,
  validateExperienceOptimizationContent,
  validateAgentMonitoring
} from '../schemas/osa-content-validation';

describe('OSA Content Integration Tests', () => {
  const testDataPath = path.join(__dirname, '../../src/sections');
  const monitoringPath = path.join(__dirname, '../../engine/admin/opal-monitoring/agent-data/content');

  describe('Analytics Insights Content Validation', () => {
    it('should validate analytics insights content configuration', async () => {
      const filePath = path.join(testDataPath, 'analytics-insights/content.json');

      if (fs.existsSync(filePath)) {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const validation = validateAnalyticsInsightsContent(content);

        expect(validation.success).toBe(true);

        if (validation.success) {
          expect(validation.data.section).toBe("Analytics Insights → Content");
          expect(validation.data.opal_mapping.outputs.length).toBeGreaterThan(0);

          // Validate each output has required OPAL integration fields
          validation.data.opal_mapping.outputs.forEach(output => {
            expect(output.decision_layer_impact).toBeDefined();
            expect(output.brain_learning).toBeDefined();
            expect(output.dxp_sources.length).toBeGreaterThan(0);
            expect(['AI-generated', 'static', 'hybrid']).toContain(output.type);
          });
        }
      } else {
        console.warn('Analytics insights content file not found, skipping validation test');
      }
    });

    it('should have proper tooltip structure for UI components', async () => {
      const filePath = path.join(testDataPath, 'analytics-insights/content.json');

      if (fs.existsSync(filePath)) {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        content.opal_mapping.outputs.forEach((output: any) => {
          expect(output.type_tooltip).toBeDefined();
          expect(output.tool_tooltip).toBeDefined();
          expect(output.report_tooltip).toBeDefined();
          expect(output.instructions_tooltip).toBeDefined();
        });
      }
    });

    it('should have valid agent mappings', async () => {
      const filePath = path.join(testDataPath, 'analytics-insights/content.json');

      if (fs.existsSync(filePath)) {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const validAgents = ["content_review_agent", "audience_suggester", "strategy_workflow"];

        content.opal_mapping.outputs.forEach((output: any) => {
          expect(validAgents).toContain(output.agent);
        });
      }
    });
  });

  describe('Strategy Plans Content Validation', () => {
    it('should validate strategy plans content configuration', async () => {
      const filePath = path.join(testDataPath, 'strategy-plans/content-strategy.json');

      if (fs.existsSync(filePath)) {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const validation = validateStrategyPlansContent(content);

        expect(validation.success).toBe(true);

        if (validation.success) {
          expect(validation.data.section).toBe("Strategy Plans → Content Strategy");
          expect(validation.data.strategic_components).toBeDefined();
          expect(validation.data.strategic_components.content_suggestions.length).toBeGreaterThan(0);
          expect(validation.data.strategic_components.report_recommendations.length).toBeGreaterThan(0);
        }
      } else {
        console.warn('Strategy plans content file not found, skipping validation test');
      }
    });

    it('should have valid strategic insights with confidence scores', async () => {
      const filePath = path.join(testDataPath, 'strategy-plans/content-strategy.json');

      if (fs.existsSync(filePath)) {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        content.strategic_components.strategic_insights.forEach((insight: any) => {
          expect(insight.confidence).toBeGreaterThanOrEqual(0);
          expect(insight.confidence).toBeLessThanOrEqual(1);
          expect(insight.business_impact).toBeDefined();
          expect(insight.data_requirements.length).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('Experience Optimization Content Validation', () => {
    it('should validate experience optimization content configuration', async () => {
      const filePath = path.join(testDataPath, 'experience-optimization/content.json');

      if (fs.existsSync(filePath)) {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const validation = validateExperienceOptimizationContent(content);

        expect(validation.success).toBe(true);

        if (validation.success) {
          expect(validation.data.section).toBe("Experience Optimization → Content");
          expect(validation.data.experience_optimization_features).toBeDefined();
          expect(validation.data.optimization_workflows.length).toBeGreaterThan(0);
        }
      } else {
        console.warn('Experience optimization content file not found, skipping validation test');
      }
    });

    it('should have valid optimization workflows with proper configuration', async () => {
      const filePath = path.join(testDataPath, 'experience-optimization/content.json');

      if (fs.existsSync(filePath)) {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        content.optimization_workflows.forEach((workflow: any) => {
          expect(workflow.confidence_threshold).toBeGreaterThanOrEqual(0);
          expect(workflow.confidence_threshold).toBeLessThanOrEqual(1);
          expect(workflow.steps.length).toBeGreaterThan(0);
          expect(typeof workflow.approval_required).toBe('boolean');
        });
      }
    });
  });

  describe('Agent Monitoring Validation', () => {
    const agents = ['content-review-agent', 'audience-suggester', 'strategy-workflow'];

    agents.forEach(agent => {
      it(`should validate ${agent} monitoring configuration`, async () => {
        const filePath = path.join(monitoringPath, agent, 'updates.json');

        if (fs.existsSync(filePath)) {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const validation = validateAgentMonitoring(content);

          expect(validation.success).toBe(true);

          if (validation.success) {
            expect(validation.data.category).toBe("content");
            expect(validation.data.required_updates.length).toBeGreaterThanOrEqual(0);
            expect(validation.data.new_instructions_needed.length).toBeGreaterThanOrEqual(0);
          }
        } else {
          console.warn(`${agent} monitoring file not found, skipping validation test`);
        }
      });
    });

    it('should have valid performance metrics structure', async () => {
      agents.forEach(agent => {
        const filePath = path.join(monitoringPath, agent, 'updates.json');

        if (fs.existsSync(filePath)) {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

          Object.entries(content.performance_metrics || {}).forEach(([metric, value]: [string, any]) => {
            expect(value.target).toBeDefined();
            expect(value.current).toBeDefined();
            expect(['improving', 'stable', 'declining']).toContain(value.trend);
          });
        }
      });
    });
  });

  describe('Integration Consistency Tests', () => {
    it('should have consistent field mappings across all sections', async () => {
      const sections = [
        'analytics-insights/content.json',
        'strategy-plans/content-strategy.json',
        'experience-optimization/content.json'
      ];

      const allOutputs: any[] = [];

      sections.forEach(section => {
        const filePath = path.join(testDataPath, section);
        if (fs.existsSync(filePath)) {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (content.opal_mapping?.outputs) {
            allOutputs.push(...content.opal_mapping.outputs);
          }
        }
      });

      // Check for consistent field naming across outputs
      const fieldNames = new Set();
      allOutputs.forEach(output => {
        fieldNames.add(output.field);
      });

      expect(fieldNames.size).toBeGreaterThan(0);
    });

    it('should have valid DXP source references', async () => {
      const validDXPSources = ["CMS", "ODP", "WEBX", "Content Recs", "CMP"];
      const sections = [
        'analytics-insights/content.json',
        'strategy-plans/content-strategy.json',
        'experience-optimization/content.json'
      ];

      sections.forEach(section => {
        const filePath = path.join(testDataPath, section);
        if (fs.existsSync(filePath)) {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

          content.opal_mapping?.outputs?.forEach((output: any) => {
            output.dxp_sources?.forEach((source: string) => {
              expect(validDXPSources).toContain(source);
            });
          });
        }
      });
    });

    it('should have proper personal configurator integration', async () => {
      const sections = [
        'analytics-insights/content.json',
        'strategy-plans/content-strategy.json',
        'experience-optimization/content.json'
      ];

      sections.forEach(section => {
        const filePath = path.join(testDataPath, section);
        if (fs.existsSync(filePath)) {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

          expect(content.personal_configurator_integration).toBeDefined();
          expect(content.personal_configurator_integration.user_preferences).toBeDefined();
          expect(content.personal_configurator_integration.preference_keys).toBeDefined();
          expect(Array.isArray(content.personal_configurator_integration.preference_keys)).toBe(true);
        }
      });
    });

    it('should have proper decision layer integration', async () => {
      const sections = [
        'analytics-insights/content.json',
        'strategy-plans/content-strategy.json',
        'experience-optimization/content.json'
      ];

      sections.forEach(section => {
        const filePath = path.join(testDataPath, section);
        if (fs.existsSync(filePath)) {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

          expect(content.decision_layer_integration).toBeDefined();
          expect(content.decision_layer_integration.impact_scoring).toBeDefined();
          expect(content.decision_layer_integration.confidence_weighting).toBeDefined();
        }
      });
    });

    it('should have proper brain learning integration', async () => {
      const sections = [
        'analytics-insights/content.json',
        'strategy-plans/content-strategy.json',
        'experience-optimization/content.json'
      ];

      sections.forEach(section => {
        const filePath = path.join(testDataPath, section);
        if (fs.existsSync(filePath)) {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

          expect(content.brain_learning_integration).toBeDefined();
          expect(content.brain_learning_integration.knowledge_updates).toBeDefined();
          expect(content.brain_learning_integration.pattern_recognition).toBeDefined();
          expect(Array.isArray(content.brain_learning_integration.learning_categories)).toBe(true);
        }
      });
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should have proper error handling configuration', async () => {
      const filePath = path.join(testDataPath, 'analytics-insights/content.json');

      if (fs.existsSync(filePath)) {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        expect(content.error_handling).toBeDefined();
        expect(content.error_handling.fallback_data).toBeDefined();
        expect(content.error_handling.graceful_degradation).toBeDefined();
        expect(content.error_handling.retry_policy).toBeDefined();
      }
    });

    it('should have data validation fallbacks for each output', async () => {
      const filePath = path.join(testDataPath, 'analytics-insights/content.json');

      if (fs.existsSync(filePath)) {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        content.opal_mapping.outputs.forEach((output: any) => {
          if (output.data_validation) {
            expect(output.data_validation.fallback).toBeDefined();
            expect(typeof output.data_validation.required).toBe('boolean');
          }
        });
      }
    });
  });
});