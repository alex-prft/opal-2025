/**
 * OPAL Results Widget Configuration
 * Maps URL patterns to appropriate widgets and data requirements
 */

export interface WidgetConfig {
  urlPattern: string;
  section: string;
  widgets: {
    name: string;
    props: Record<string, string>;
    children: string[];
  }[];
}

export interface OPALData {
  // Strategy Plans data
  confidenceScore?: number;
  roadmapData?: any[];
  maturityData?: any;
  performanceMetrics?: any[];
  phaseData?: any[];

  // DXP Tools data
  integrationStatus?: any;
  performanceData?: any;
  freshnessMetrics?: any;

  // Analytics Insights data
  analyticsData?: any;
  contentTopics?: any[];
  topContent?: any[];
  userInteractions?: any;
  engagementTrends?: any[];
  visibilityMetrics?: any;
  semanticData?: any;
  geoData?: any;

  // Experience Optimization data
  experimentPlans?: any[];
  testResults?: any[];
  businessImpact?: any;
  personalizationRules?: any[];
  uxMetrics?: any;
  testSchedule?: any[];
}

export const WIDGET_CONFIG: WidgetConfig[] = [
  {
    urlPattern: "/engine/results/strategy-plans",
    section: "strategy-plans",
    widgets: [
      {
        name: "StrategyPlansWidget",
        props: {
          confidenceScore: "confidenceScore",
          roadmapData: "roadmapData",
          maturityData: "maturityData",
          performanceMetrics: "performanceMetrics",
          phaseData: "phaseData"
        },
        children: [
          "ConfidenceGauge",
          "RoadmapTimeline",
          "MaturityScoreCard",
          "LineChart",
          "MilestoneHeatmap"
        ]
      }
    ]
  },
  {
    urlPattern: "/engine/results/optimizely-dxp-tools",
    section: "optimizely-dxp-tools",
    widgets: [
      {
        name: "IntegrationHealthWidget",
        props: {
          integrationStatus: "integrationStatus",
          performanceData: "performanceData",
          freshnessMetrics: "freshnessMetrics"
        },
        children: [
          "StatusIndicator",
          "PerformanceMetrics",
          "DataFreshness"
        ]
      }
    ]
  },
  {
    urlPattern: "/engine/results/analytics-insights",
    section: "analytics-insights",
    widgets: [
      {
        name: "EngagementAnalyticsWidget",
        props: {
          analyticsData: "analyticsData",
          contentTopics: "contentTopics",
          topContent: "topContent",
          userInteractions: "userInteractions",
          engagementTrends: "engagementTrends"
        },
        children: [
          "EngagementMetrics",
          "TopicAnalysis",
          "PopularContent",
          "HeatMap",
          "TrendChart"
        ]
      },
      {
        name: "AIVisibilityWidget",
        props: {
          visibilityMetrics: "visibilityMetrics",
          semanticData: "semanticData",
          geoData: "geoData",
          freshnessMetrics: "freshnessMetrics"
        },
        children: [
          "SemanticAnalysis",
          "GeographicInsights",
          "ContentFreshness",
          "SemanticMap",
          "GeoChart"
        ]
      }
    ]
  },
  {
    urlPattern: "/engine/results/experience-optimization",
    section: "experience-optimization",
    widgets: [
      {
        name: "ExperimentationWidget",
        props: {
          experimentPlans: "experimentPlans",
          testResults: "testResults",
          businessImpact: "businessImpact",
          testSchedule: "testSchedule"
        },
        children: [
          "ExperimentDesign",
          "StatisticalAnalysis",
          "ImpactAssessment",
          "ExperimentTimeline"
        ]
      },
      {
        name: "PersonalizationWidget",
        props: {
          personalizationRules: "personalizationRules",
          uxMetrics: "uxMetrics"
        },
        children: [
          "AudienceSegments",
          "PersonalizationRules",
          "PerformanceTracking"
        ]
      },
      {
        name: "UXMetricsWidget",
        props: {
          uxMetrics: "uxMetrics"
        },
        children: [
          "UserJourneyMap",
          "InteractionAnalytics",
          "UsabilityMetrics"
        ]
      }
    ]
  }
];

/**
 * Detect section type from URL pathname
 */
export function detectSection(pathname: string): string {
  for (const config of WIDGET_CONFIG) {
    if (pathname.includes(config.section)) {
      return config.section;
    }
  }
  return 'generic';
}

/**
 * Get widget configuration for a section
 */
export function getWidgetConfig(section: string): WidgetConfig | null {
  return WIDGET_CONFIG.find(config => config.section === section) || null;
}