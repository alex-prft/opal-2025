// Quick Wins Utility Functions
// Helper functions for processing and transforming Quick Wins data

import {
  QuickWin,
  ImpactEffortMatrix,
  QuickWinsOPALResponse,
  QuickWinsPageData,
  ImmediateAction,
  SuccessKPI,
  QuickWinsSummary,
  ImpactLevel,
  EffortLevel,
  MatrixQuadrant
} from '@/lib/types/quick-wins';

// Badge variant helpers
export function getImpactVariant(impact: ImpactLevel): 'default' | 'success' | 'warning' | 'destructive' {
  switch (impact) {
    case 'High': return 'success';
    case 'Medium': return 'warning';
    case 'Low': return 'default';
    default: return 'default';
  }
}

export function getEffortVariant(effort: EffortLevel): 'default' | 'success' | 'warning' | 'destructive' {
  switch (effort) {
    case 'Low': return 'success';
    case 'Medium': return 'warning';
    case 'High': return 'destructive';
    default: return 'default';
  }
}

export function getActionStatusVariant(status: ImmediateAction['status']): 'default' | 'success' | 'warning' | 'destructive' {
  switch (status) {
    case 'completed': return 'success';
    case 'in-progress': return 'warning';
    case 'pending': return 'default';
    default: return 'default';
  }
}

// Matrix quadrant definitions
export const MATRIX_QUADRANTS: MatrixQuadrant[] = [
  {
    key: 'highImpactLowEffort',
    title: 'High Impact, Low Effort',
    subtitle: 'Quick Wins ⭐',
    color: 'green',
    priority: 'high',
    description: 'These are your best opportunities - high value with minimal investment'
  },
  {
    key: 'highImpactMediumEffort',
    title: 'High Impact, Medium Effort',
    subtitle: 'Major Projects',
    color: 'blue',
    priority: 'medium',
    description: 'Valuable opportunities that require moderate investment'
  },
  {
    key: 'highImpactHighEffort',
    title: 'High Impact, High Effort',
    subtitle: 'Strategic Initiatives',
    color: 'purple',
    priority: 'low',
    description: 'Long-term strategic projects requiring significant resources'
  },
  {
    key: 'mediumImpactLowEffort',
    title: 'Medium Impact, Low Effort',
    subtitle: 'Fill-in Tasks',
    color: 'yellow',
    priority: 'medium',
    description: 'Good opportunities when resources are available'
  },
  {
    key: 'mediumImpactMediumEffort',
    title: 'Medium Impact, Medium Effort',
    subtitle: 'Standard Projects',
    color: 'gray',
    priority: 'low',
    description: 'Typical projects with balanced investment and return'
  },
  {
    key: 'mediumImpactHighEffort',
    title: 'Medium Impact, High Effort',
    subtitle: 'Questionable',
    color: 'red',
    priority: 'low',
    description: 'Consider whether the effort is worth the return'
  },
  {
    key: 'lowImpactLowEffort',
    title: 'Low Impact, Low Effort',
    subtitle: 'Trivial Tasks',
    color: 'gray',
    priority: 'low',
    description: 'Minor improvements with minimal impact'
  },
  {
    key: 'lowImpactMediumEffort',
    title: 'Low Impact, Medium Effort',
    subtitle: 'Time Wasters',
    color: 'red',
    priority: 'low',
    description: 'Avoid these - poor return on investment'
  },
  {
    key: 'lowImpactHighEffort',
    title: 'Low Impact, High Effort',
    subtitle: 'Avoid These',
    color: 'red',
    priority: 'low',
    description: 'High cost with minimal benefit - avoid unless required'
  }
];

// Data transformation functions
export function transformQuickWinsData(opalResponse: QuickWinsOPALResponse): QuickWinsPageData {
  // Extract quick wins from various possible field names
  const quickWins = opalResponse.quick_wins ||
                   opalResponse.recommendations ||
                   opalResponse.opportunities ||
                   [];

  // Sort by priority/impact for top quick wins
  const topQuickWins = quickWins
    .sort((a, b) => {
      // Sort by impact first, then by effort (inverse), then by confidence
      const impactScore = getImpactScore(a.impact) - getImpactScore(b.impact);
      if (impactScore !== 0) return impactScore;

      const effortScore = getEffortScore(b.effort) - getEffortScore(a.effort);
      if (effortScore !== 0) return effortScore;

      return (b.confidence || 0) - (a.confidence || 0);
    })
    .slice(0, 3);

  // Build impact/effort matrix
  const impactEffortMatrix = opalResponse.impact_matrix || buildImpactEffortMatrix(quickWins);

  // Extract actions and KPIs
  const immediateActions = opalResponse.immediate_actions ||
                          opalResponse.action_items ||
                          [];

  const successKPIs = opalResponse.success_metrics ||
                     opalResponse.kpis ||
                     opalResponse.metrics ||
                     [];

  // Generate summary
  const summary = generateQuickWinsSummary(quickWins, opalResponse.confidence_score);

  return {
    topQuickWins,
    impactEffortMatrix,
    immediateActions,
    successKPIs,
    summary,
    metadata: {
      lastUpdated: new Date().toISOString(),
      dataSource: opalResponse.agent_source || 'unknown',
      confidenceLevel: opalResponse.confidence_score || 0.75,
      analysisVersion: '1.0'
    }
  };
}

// Build impact/effort matrix from quick wins array
export function buildImpactEffortMatrix(quickWins: QuickWin[]): ImpactEffortMatrix {
  const matrix: ImpactEffortMatrix = {
    highImpactLowEffort: [],
    highImpactMediumEffort: [],
    highImpactHighEffort: [],
    mediumImpactLowEffort: [],
    mediumImpactMediumEffort: [],
    mediumImpactHighEffort: [],
    lowImpactLowEffort: [],
    lowImpactMediumEffort: [],
    lowImpactHighEffort: []
  };

  quickWins.forEach(win => {
    const key = getMatrixKey(win.impact, win.effort);
    matrix[key].push(win);
  });

  // Sort each quadrant by confidence
  Object.keys(matrix).forEach(key => {
    matrix[key as keyof ImpactEffortMatrix].sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  });

  return matrix;
}

// Generate summary statistics
export function generateQuickWinsSummary(quickWins: QuickWin[], confidenceScore?: number): QuickWinsSummary {
  const totalOpportunities = quickWins.length;
  const estimatedROI = calculateTotalROI(quickWins);
  const implementationTimeline = calculateImplementationTimeline(quickWins);

  return {
    totalOpportunities,
    estimatedROI,
    implementationTimeline,
    confidenceScore: confidenceScore || calculateAverageConfidence(quickWins),
    resourcesRequired: estimateResourceRequirements(quickWins),
    riskLevel: calculateRiskLevel(quickWins)
  };
}

// Helper functions for scoring
function getImpactScore(impact: ImpactLevel): number {
  switch (impact) {
    case 'High': return 3;
    case 'Medium': return 2;
    case 'Low': return 1;
    default: return 0;
  }
}

function getEffortScore(effort: EffortLevel): number {
  switch (effort) {
    case 'Low': return 1;
    case 'Medium': return 2;
    case 'High': return 3;
    default: return 0;
  }
}

function getMatrixKey(impact: ImpactLevel, effort: EffortLevel): keyof ImpactEffortMatrix {
  const impactLower = impact.toLowerCase();
  const effortLower = effort.toLowerCase();
  return `${impactLower}Impact${effort}Effort` as keyof ImpactEffortMatrix;
}

// ROI calculation
export function calculateTotalROI(quickWins: QuickWin[]): string {
  // Extract numeric values from ROI strings and sum them
  let total = 0;
  let count = 0;

  quickWins.forEach(win => {
    if (win.expectedROI) {
      const match = win.expectedROI.match(/[\d.,]+/);
      if (match) {
        const value = parseFloat(match[0].replace(/,/g, ''));
        if (!isNaN(value)) {
          total += value;
          count++;
        }
      }
    }
  });

  if (count === 0) return 'TBD';

  // Format as currency
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(total);
}

// Timeline calculation
export function calculateImplementationTimeline(quickWins: QuickWin[]): string {
  if (quickWins.length === 0) return 'TBD';

  // Extract timeline information and find the most common pattern
  const timelines = quickWins
    .map(win => win.timeline)
    .filter(timeline => timeline)
    .map(timeline => timeline.toLowerCase());

  // Count frequency of different timeframes
  const timeframeCounts: Record<string, number> = {};

  timelines.forEach(timeline => {
    if (timeline.includes('week')) {
      timeframeCounts['2-4 weeks'] = (timeframeCounts['2-4 weeks'] || 0) + 1;
    } else if (timeline.includes('month')) {
      timeframeCounts['1-3 months'] = (timeframeCounts['1-3 months'] || 0) + 1;
    } else if (timeline.includes('day')) {
      timeframeCounts['1-2 weeks'] = (timeframeCounts['1-2 weeks'] || 0) + 1;
    }
  });

  // Return most common timeframe
  const mostCommon = Object.entries(timeframeCounts)
    .sort(([,a], [,b]) => b - a)[0];

  return mostCommon ? mostCommon[0] : '2-8 weeks';
}

// Confidence calculation
export function calculateAverageConfidence(quickWins: QuickWin[]): number {
  if (quickWins.length === 0) return 0.75;

  const total = quickWins.reduce((sum, win) => sum + (win.confidence || 75), 0);
  return Math.round(total / quickWins.length) / 100;
}

// Resource estimation
function estimateResourceRequirements(quickWins: QuickWin[]) {
  const effortCounts = quickWins.reduce((counts, win) => {
    counts[win.effort] = (counts[win.effort] || 0) + 1;
    return counts;
  }, {} as Record<EffortLevel, number>);

  return {
    development: (effortCounts.High || 0) * 40 + (effortCounts.Medium || 0) * 20 + (effortCounts.Low || 0) * 8,
    design: (effortCounts.High || 0) * 16 + (effortCounts.Medium || 0) * 8 + (effortCounts.Low || 0) * 4,
    marketing: (effortCounts.High || 0) * 12 + (effortCounts.Medium || 0) * 6 + (effortCounts.Low || 0) * 2,
    budget: '$50K - $200K'
  };
}

// Risk assessment
function calculateRiskLevel(quickWins: QuickWin[]): 'Low' | 'Medium' | 'High' {
  const highEffortCount = quickWins.filter(win => win.effort === 'High').length;
  const lowConfidenceCount = quickWins.filter(win => (win.confidence || 75) < 60).length;

  const riskFactors = highEffortCount + lowConfidenceCount;

  if (riskFactors > quickWins.length * 0.5) return 'High';
  if (riskFactors > quickWins.length * 0.25) return 'Medium';
  return 'Low';
}

// Progress calculation for KPIs
export function calculateProgress(current: string, target: string): number {
  // Try to extract numeric values
  const currentNum = parseFloat(current.replace(/[^\d.-]/g, ''));
  const targetNum = parseFloat(target.replace(/[^\d.-]/g, ''));

  if (isNaN(currentNum) || isNaN(targetNum) || targetNum === 0) {
    return 0;
  }

  return Math.min(Math.max((currentNum / targetNum) * 100, 0), 100);
}

// Check if string represents a numeric value
export function isNumeric(str: string): boolean {
  const num = parseFloat(str.replace(/[^\d.-]/g, ''));
  return !isNaN(num) && isFinite(num);
}

// Default matrix for fallback
export function getDefaultMatrix(): ImpactEffortMatrix {
  return {
    highImpactLowEffort: [],
    highImpactMediumEffort: [],
    highImpactHighEffort: [],
    mediumImpactLowEffort: [],
    mediumImpactMediumEffort: [],
    mediumImpactHighEffort: [],
    lowImpactLowEffort: [],
    lowImpactMediumEffort: [],
    lowImpactHighEffort: []
  };
}

// Color class helpers
export function getMatrixQuadrantColors(quadrant: keyof ImpactEffortMatrix) {
  const quadrantInfo = MATRIX_QUADRANTS.find(q => q.key === quadrant);
  if (!quadrantInfo) return 'bg-gray-50 border-gray-200';

  const colorClasses = {
    green: 'bg-green-50 border-green-200 hover:bg-green-100',
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    yellow: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    gray: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
    red: 'bg-red-50 border-red-200 hover:bg-red-100'
  };

  return colorClasses[quadrantInfo.color];
}

// Format currency values
export function formatCurrency(value: string | number): string {
  if (typeof value === 'string') {
    const match = value.match(/[\d.,]+/);
    if (match) {
      value = parseFloat(match[0].replace(/,/g, ''));
    } else {
      return value;
    }
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value as number);
}

// Format date strings
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}