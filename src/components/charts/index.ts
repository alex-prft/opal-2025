/**
 * Interactive Charts Library - Main Export
 * Comprehensive visualization components for OPAL dashboard
 */

// Core interactive charts
export {
  InteractiveGaugeChart,
  InteractiveRadarChart,
  InteractiveHeatmap,
  InteractiveGanttChart
} from './InteractiveCharts';

// Specialized charts
export {
  InteractiveFunnelChart,
  InteractiveNetworkGraph,
  InteractiveMatrixVisualization
} from './SpecializedCharts';

// Integration utilities and pre-configured components
export {
  OSACharts,
  ChartShowcase,
  ChartDataTransformer
} from './ChartIntegration';

// Type exports for TypeScript support
export type {
  GaugeChartProps,
  RadarChartProps,
  HeatmapProps,
  GanttChartProps,
  TimelineItem
} from './InteractiveCharts';

export type {
  FunnelChartProps,
  FunnelStage,
  NetworkGraphProps,
  NetworkNode,
  NetworkEdge,
  MatrixVisualizationProps,
  MatrixCell
} from './SpecializedCharts';

/**
 * Quick Start Usage Examples:
 *
 * // Basic gauge chart
 * import { InteractiveGaugeChart } from '@/components/charts';
 * <InteractiveGaugeChart value={75} title="Maturity Score" />
 *
 * // Pre-configured maturity radar
 * import { OSACharts } from '@/components/charts';
 * <OSACharts.MaturityRadar maturity={workflowOutput.strategy_plans.maturity} />
 *
 * // Full chart showcase
 * import { ChartShowcase } from '@/components/charts';
 * <ChartShowcase workflowOutput={workflowOutput} />
 */