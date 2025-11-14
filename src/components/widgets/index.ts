/**
 * Simple Widget Exports (SOP-Free)
 *
 * This file exports all widgets without any validation middleware.
 * All widgets are available without restrictions or compliance requirements.
 */

// Export original widgets directly
export { StrategyPlansWidget } from './StrategyPlansWidget';
export { IntegrationHealthWidget } from './IntegrationHealthWidget';
export { EngagementAnalyticsWidget } from './EngagementAnalyticsWidget';
export { ExperimentationWidget } from './ExperimentationWidget';

// Re-export for backward compatibility
export {
  StrategyPlansWidget as _UnvalidatedStrategyPlansWidget,
  StrategyPlansWidget as _StrategyPlansWidget
} from './StrategyPlansWidget';

export {
  IntegrationHealthWidget as _UnvalidatedIntegrationHealthWidget,
  IntegrationHealthWidget as _IntegrationHealthWidget
} from './IntegrationHealthWidget';

export {
  EngagementAnalyticsWidget as _UnvalidatedEngagementAnalyticsWidget,
  EngagementAnalyticsWidget as _EngagementAnalyticsWidget
} from './EngagementAnalyticsWidget';

export {
  ExperimentationWidget as _UnvalidatedExperimentationWidget,
  ExperimentationWidget as _ExperimentationWidget
} from './ExperimentationWidget';