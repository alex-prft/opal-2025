// Quick Wins Page Type Definitions
// Comprehensive TypeScript interfaces for the Quick Wins feature

export interface QuickWin {
  id: string;
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  effort: 'Low' | 'Medium' | 'High';
  timeline: string;
  confidence: number; // 0-100 percentage
  expectedROI?: string;
  resources?: string[];
  dependencies?: string[];
  successMetrics?: string[];
  category?: string;
  priority?: number;
  implementation?: {
    steps: string[];
    risks: string[];
    requirements: string[];
  };
}

export interface ImpactEffortMatrix {
  highImpactLowEffort: QuickWin[];      // Top priority - "Quick Wins"
  highImpactMediumEffort: QuickWin[];   // Major projects
  highImpactHighEffort: QuickWin[];     // Strategic initiatives
  mediumImpactLowEffort: QuickWin[];    // Fill-in tasks
  mediumImpactMediumEffort: QuickWin[]; // Standard projects
  mediumImpactHighEffort: QuickWin[];   // Questionable projects
  lowImpactLowEffort: QuickWin[];       // Trivial tasks
  lowImpactMediumEffort: QuickWin[];    // Avoid these
  lowImpactHighEffort: QuickWin[];      // Avoid these
}

export interface ImmediateAction {
  id: string;
  action: string;
  owner: string;
  deadline: string;
  status: 'pending' | 'in-progress' | 'completed';
  description?: string;
  blockers?: string[];
  estimatedHours?: number;
  associatedQuickWin?: string; // ID reference to QuickWin
}

export interface SuccessKPI {
  id: string;
  metric: string;
  current: string;
  target: string;
  timeframe: string;
  unit?: string;
  description?: string;
  category?: 'conversion' | 'engagement' | 'performance' | 'revenue' | 'cost';
  baseline?: string;
  trackingMethod?: string;
}

export interface QuickWinsPageData {
  topQuickWins: QuickWin[];
  impactEffortMatrix: ImpactEffortMatrix;
  immediateActions: ImmediateAction[];
  successKPIs: SuccessKPI[];
  summary?: QuickWinsSummary;
  metadata?: {
    lastUpdated: string;
    dataSource: string;
    confidenceLevel: number;
    analysisVersion: string;
  };
}

export interface QuickWinsSummary {
  totalOpportunities: number;
  estimatedROI: string;
  implementationTimeline: string;
  confidenceScore: number;
  resourcesRequired?: {
    development: number;
    design: number;
    marketing: number;
    budget: string;
  };
  riskLevel: 'Low' | 'Medium' | 'High';
}

// OPAL API Response Types
export interface QuickWinsOPALResponse {
  quick_wins?: QuickWin[];
  impact_matrix?: ImpactEffortMatrix;
  immediate_actions?: ImmediateAction[];
  success_metrics?: SuccessKPI[];
  summary?: string;
  confidence_score?: number;
  timestamp?: string;
  agent_source?: string;

  // Alternative field names that might come from different OPAL agents
  recommendations?: QuickWin[];
  opportunities?: QuickWin[];
  action_items?: ImmediateAction[];
  kpis?: SuccessKPI[];
  metrics?: SuccessKPI[];
}

// Widget Component Props
export interface QuickWinsWidgetProps {
  data: QuickWinsPageData;
  className?: string;
  compact?: boolean;
  showMatrix?: boolean;
  maxQuickWins?: number;
}

export interface TopQuickWinsSectionProps {
  quickWins: QuickWin[];
  maxItems?: number;
  onViewDetails?: (quickWin: QuickWin) => void;
}

export interface ImpactEffortMatrixProps {
  matrix: ImpactEffortMatrix;
  onItemSelect?: (quickWin: QuickWin) => void;
  highlightQuadrant?: keyof ImpactEffortMatrix;
}

export interface ImplementationDetailsProps {
  immediateActions: ImmediateAction[];
  successKPIs: SuccessKPI[];
  onActionUpdate?: (actionId: string, status: ImmediateAction['status']) => void;
}

// Utility Types
export type ImpactLevel = QuickWin['impact'];
export type EffortLevel = QuickWin['effort'];
export type ActionStatus = ImmediateAction['status'];
export type KPICategory = SuccessKPI['category'];

export interface MatrixQuadrant {
  key: keyof ImpactEffortMatrix;
  title: string;
  subtitle: string;
  color: 'green' | 'blue' | 'purple' | 'yellow' | 'gray' | 'red';
  priority: 'high' | 'medium' | 'low';
  description: string;
}

// Filter and Sort Options
export interface QuickWinsFilters {
  impact?: ImpactLevel[];
  effort?: EffortLevel[];
  confidence?: {
    min: number;
    max: number;
  };
  timeline?: string[];
  category?: string[];
}

export interface QuickWinsSortOptions {
  field: 'priority' | 'confidence' | 'impact' | 'effort' | 'timeline';
  direction: 'asc' | 'desc';
}

// Data Transformation Types
export interface QuickWinsTransformConfig {
  prioritizeByImpact: boolean;
  includeAllMetrics: boolean;
  maxRecommendations: number;
  confidenceThreshold: number;
}

// Error Handling
export interface QuickWinsError {
  type: 'api' | 'transformation' | 'validation';
  message: string;
  details?: any;
  retryable: boolean;
}

// Loading States
export interface QuickWinsLoadingState {
  isLoading: boolean;
  loadingStage?: 'fetching' | 'transforming' | 'rendering';
  progress?: number;
  message?: string;
}