/**
 * Chart Integration Utilities
 * Easy-to-use chart components with data transformation utilities for OPAL dashboard
 */

import React from 'react';
import {
  InteractiveGaugeChart,
  InteractiveRadarChart,
  InteractiveHeatmap,
  InteractiveGanttChart
} from './InteractiveCharts';
import {
  InteractiveFunnelChart,
  InteractiveNetworkGraph,
  InteractiveMatrixVisualization
} from './SpecializedCharts';
import { EnhancedOSAWorkflowOutput } from '@/lib/opal/opal-config';

// Data transformation utilities
export class ChartDataTransformer {
  // Transform maturity data to radar chart format
  static transformMaturityToRadar(maturity: EnhancedOSAWorkflowOutput['strategy_plans']['maturity']) {
    return maturity.dimensions.map(dimension => ({
      dimension: dimension.name.replace(' & ', ' '),
      value: dimension.score,
      maxValue: dimension.max_score,
      benchmark: maturity.industry_benchmarks.peer_average
    }));
  }

  // Transform conversion funnel data
  static transformConversionFunnel(funnelData: Array<{ stage: string; visitors: number; conversion_rate: number; drop_off_rate: number }>) {
    return funnelData.map((stage, index) => ({
      name: stage.stage,
      value: stage.visitors,
      percentage: stage.conversion_rate,
      dropOff: stage.drop_off_rate,
      color: index === 0 ? '#10B981' : index === funnelData.length - 1 ? '#EF4444' : undefined
    }));
  }

  // Transform timeline data to Gantt format
  static transformRoadmapToGantt(milestones: EnhancedOSAWorkflowOutput['strategy_plans']['roadmap']['major_milestones']) {
    return milestones.map(milestone => ({
      id: milestone.id,
      title: milestone.title,
      startDate: new Date().toISOString(), // Current date as start
      endDate: milestone.target_date,
      progress: milestone.status === 'completed' ? 100 : milestone.status === 'in_progress' ? 60 : 0,
      status: milestone.status,
      dependencies: milestone.dependencies,
      priority: milestone.impact_score > 8 ? 'high' : milestone.impact_score > 6 ? 'medium' : 'low'
    })) as any[];
  }

  // Transform engagement data to heatmap
  static transformEngagementHeatmap(timeSpentByArea: { [key: string]: number }, topSections: any[]) {
    const areas = Object.keys(timeSpentByArea);
    const sections = topSections.map(s => s.section);

    const data = areas.flatMap((area, areaIndex) =>
      sections.map((section, sectionIndex) => ({
        row: areaIndex,
        col: sectionIndex,
        value: Math.floor(Math.random() * 100), // Demo data - replace with actual engagement metrics
        label: `${Math.floor(Math.random() * 100)}%`
      }))
    );

    return { data, xLabels: sections, yLabels: areas };
  }

  // Transform network dependencies
  static transformDependencyNetwork(milestones: EnhancedOSAWorkflowOutput['strategy_plans']['roadmap']['major_milestones']) {
    const nodes = milestones.map(milestone => ({
      id: milestone.id,
      label: milestone.title.substring(0, 20) + (milestone.title.length > 20 ? '...' : ''),
      size: milestone.impact_score * 2,
      group: milestone.phase,
      color: milestone.status === 'completed' ? '#10B981' :
             milestone.status === 'in_progress' ? '#3B82F6' :
             milestone.status === 'delayed' ? '#EF4444' : '#6B7280',
      metadata: {
        impact: milestone.impact_score,
        status: milestone.status,
        deliverables: milestone.deliverables.length
      }
    }));

    const edges = milestones.flatMap(milestone =>
      milestone.dependencies.map(depId => ({
        source: depId,
        target: milestone.id,
        weight: 2
      }))
    ).filter(edge => nodes.some(n => n.id === edge.source));

    return { nodes, edges };
  }
}

// Pre-configured chart components for common use cases
export const OSACharts = {
  // Maturity Assessment Radar
  MaturityRadar: ({ maturity }: { maturity: EnhancedOSAWorkflowOutput['strategy_plans']['maturity'] }) => (
    <InteractiveRadarChart
      data={ChartDataTransformer.transformMaturityToRadar(maturity)}
      size={280}
      animated={true}
      showBenchmark={true}
      colorScheme="blue"
    />
  ),

  // Overall Score Gauge
  OverallScoreGauge: ({ score, title }: { score: number; title: string }) => (
    <InteractiveGaugeChart
      value={score}
      maxValue={100}
      title={title}
      size="large"
      colorScheme={score > 80 ? 'green' : score > 60 ? 'blue' : score > 40 ? 'orange' : 'red'}
      showPercentage={true}
      animated={true}
      thresholds={[
        { value: 90, color: '#10B981', label: 'Excellent' },
        { value: 70, color: '#3B82F6', label: 'Good' },
        { value: 50, color: '#F59E0B', label: 'Fair' },
        { value: 30, color: '#EF4444', label: 'Poor' }
      ]}
    />
  ),

  // Conversion Funnel
  ConversionFunnel: ({ funnelData }: { funnelData: any[] }) => (
    <InteractiveFunnelChart
      stages={ChartDataTransformer.transformConversionFunnel(funnelData)}
      height={300}
      animated={true}
      colorScheme="gradient"
      showPercentages={true}
      showValues={true}
    />
  ),

  // Project Timeline
  ProjectTimeline: ({ milestones }: { milestones: EnhancedOSAWorkflowOutput['strategy_plans']['roadmap']['major_milestones'] }) => (
    <InteractiveGanttChart
      items={ChartDataTransformer.transformRoadmapToGantt(milestones)}
      showDependencies={true}
      compactMode={false}
      onItemClick={(item) => console.log('Clicked milestone:', item)}
    />
  ),

  // Engagement Heatmap
  EngagementHeatmap: ({ timeSpentByArea, topSections }: { timeSpentByArea: { [key: string]: number }, topSections: any[] }) => {
    const { data, xLabels, yLabels } = ChartDataTransformer.transformEngagementHeatmap(timeSpentByArea, topSections);
    return (
      <InteractiveHeatmap
        data={data}
        xLabels={xLabels}
        yLabels={yLabels}
        colorScheme="blue"
        cellSize={35}
        showValues={true}
        onCellClick={(x, y, data) => console.log('Clicked cell:', { x, y, data })}
      />
    );
  },

  // Dependency Network
  DependencyNetwork: ({ milestones }: { milestones: EnhancedOSAWorkflowOutput['strategy_plans']['roadmap']['major_milestones'] }) => {
    const { nodes, edges } = ChartDataTransformer.transformDependencyNetwork(milestones);
    return (
      <InteractiveNetworkGraph
        nodes={nodes}
        edges={edges}
        width={500}
        height={350}
        animated={true}
        showLabels={true}
        onNodeClick={(node) => console.log('Clicked node:', node)}
      />
    );
  },

  // KPI Dashboard Grid
  KPIGrid: ({ kpis }: { kpis: Array<{ title: string; value: number; target?: number; trend?: 'up' | 'down' | 'stable' }> }) => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <OSACharts.OverallScoreGauge
            score={kpi.value}
            title={kpi.title}
          />
          {kpi.target && (
            <div className="mt-2 text-center text-xs text-gray-600">
              Target: {kpi.target}
              {kpi.trend && (
                <span className={`ml-2 ${
                  kpi.trend === 'up' ? 'text-green-600' :
                  kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {kpi.trend === 'up' ? '↗' : kpi.trend === 'down' ? '↘' : '→'}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
};

// Chart showcase component for testing and demonstration
export const ChartShowcase: React.FC<{ workflowOutput: EnhancedOSAWorkflowOutput }> = ({ workflowOutput }) => {
  const sampleKPIs = [
    { title: 'Engagement Score', value: workflowOutput.analytics.userBehavior.engagementScore, target: 85, trend: 'up' as const },
    { title: 'Maturity Score', value: workflowOutput.strategy_plans.maturity.overall_score, target: 80, trend: 'up' as const },
    { title: 'Success Rate', value: workflowOutput.recommendations.recommendation_performance.success_rate, target: 90, trend: 'stable' as const },
    { title: 'Implementation Rate', value: workflowOutput.recommendations.recommendation_performance.implementation_rate, target: 70, trend: 'up' as const }
  ];

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Interactive Charts Showcase</h2>
        <p className="text-gray-600 mb-6">Comprehensive visualization components for OPAL dashboard analytics</p>
      </div>

      {/* KPI Overview */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">KPI Dashboard</h3>
        <OSACharts.KPIGrid kpis={sampleKPIs} />
      </div>

      {/* Maturity Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Maturity Assessment</h3>
          <OSACharts.MaturityRadar maturity={workflowOutput.strategy_plans.maturity} />
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall Score</h3>
          <div className="flex justify-center">
            <OSACharts.OverallScoreGauge
              score={workflowOutput.strategy_plans.maturity.overall_score}
              title="Maturity Level"
            />
          </div>
        </div>
      </div>

      {/* Conversion Analysis */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Conversion Funnel Analysis</h3>
        <OSACharts.ConversionFunnel funnelData={workflowOutput.analytics_insights.cx_analytics.conversion_funnel} />
      </div>

      {/* Engagement Heatmap */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">User Engagement Heatmap</h3>
        <OSACharts.EngagementHeatmap
          timeSpentByArea={workflowOutput.analytics.userBehavior.timeSpentByArea}
          topSections={workflowOutput.analytics.contentEngagement.topViewedSections}
        />
      </div>

      {/* Dependency Network */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Dependencies Network</h3>
        <OSACharts.DependencyNetwork milestones={workflowOutput.strategy_plans.roadmap.major_milestones} />
      </div>

      {/* Project Timeline */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Strategic Roadmap Timeline</h3>
        <OSACharts.ProjectTimeline milestones={workflowOutput.strategy_plans.roadmap.major_milestones} />
      </div>

      {/* Matrix Visualization Demo */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Impact vs Effort Matrix</h3>
        <InteractiveMatrixVisualization
          data={workflowOutput.strategy_plans.quick_wins.impact_effort_matrix.map((item, index) => ({
            row: Math.floor(item.effort / 3),
            col: Math.floor(item.impact / 3),
            value: item.priority === 'high' ? 3 : item.priority === 'medium' ? 2 : 1,
            label: item.title.substring(0, 10),
            metadata: item
          }))}
          rows={['Low Effort', 'Medium Effort', 'High Effort']}
          columns={['Low Impact', 'Medium Impact', 'High Impact']}
          cellSize={60}
          colorScheme="category"
          onCellClick={(cell) => console.log('Matrix cell clicked:', cell)}
        />
      </div>

      {/* Interactive Features Demo */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Interactive Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium mb-2">Available Interactions:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Hover effects with detailed tooltips</li>
              <li>Click interactions for drill-down analysis</li>
              <li>Animated transitions and loading states</li>
              <li>Responsive design for all screen sizes</li>
              <li>Customizable color schemes and themes</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Chart Types Available:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Gauge charts with thresholds and progress</li>
              <li>Radar charts with benchmark comparisons</li>
              <li>Interactive heatmaps with cell details</li>
              <li>Gantt charts with dependency tracking</li>
              <li>Funnel analysis with drop-off metrics</li>
              <li>Network graphs with force-directed layout</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OSACharts;