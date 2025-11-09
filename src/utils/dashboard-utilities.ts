/**
 * Centralized Dashboard Utility Functions
 * Shared utilities for consistent styling and behavior across all dashboard components
 */

// Status-related utility functions
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'healthy':
    case 'compliant':
    case 'active':
    case 'completed':
    case 'success':
      return 'text-green-600 bg-green-50 border-green-200';

    case 'warning':
    case 'in progress':
    case 'in_progress':
    case 'pending':
    case 'moderate':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';

    case 'critical':
    case 'non-compliant':
    case 'non_compliant':
    case 'failed':
    case 'error':
    case 'delayed':
      return 'text-red-600 bg-red-50 border-red-200';

    case 'inactive':
    case 'disabled':
    case 'draft':
      return 'text-gray-600 bg-gray-50 border-gray-200';

    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

// Score-based color utilities
export const getScoreColor = (score: number): string => {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 70) return 'text-yellow-600';
  if (score >= 60) return 'text-orange-600';
  return 'text-red-600';
};

export const getScoreColorWithBackground = (score: number): string => {
  if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  if (score >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

// Risk level utilities
export const getRiskColor = (risk: string): string => {
  switch (risk.toLowerCase()) {
    case 'low':
    case 'minimal':
      return 'text-green-600 bg-green-50 border-green-200';

    case 'medium':
    case 'moderate':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';

    case 'high':
    case 'elevated':
      return 'text-orange-600 bg-orange-50 border-orange-200';

    case 'critical':
    case 'severe':
    case 'very high':
      return 'text-red-600 bg-red-50 border-red-200';

    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

// Impact level utilities
export const getImpactColor = (impact: string): string => {
  switch (impact.toLowerCase()) {
    case 'low':
    case 'minimal':
      return 'text-green-600 bg-green-50 border-green-200';

    case 'medium':
    case 'moderate':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';

    case 'high':
    case 'significant':
      return 'text-orange-600 bg-orange-50 border-orange-200';

    case 'critical':
    case 'severe':
    case 'very high':
      return 'text-red-600 bg-red-50 border-red-200';

    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

// Priority level utilities
export const getPriorityColor = (priority: string): string => {
  switch (priority.toLowerCase()) {
    case 'low':
    case 'nice to have':
      return 'text-gray-600 bg-gray-50 border-gray-200';

    case 'medium':
    case 'moderate':
    case 'normal':
      return 'text-blue-600 bg-blue-50 border-blue-200';

    case 'high':
    case 'important':
      return 'text-orange-600 bg-orange-50 border-orange-200';

    case 'critical':
    case 'urgent':
    case 'very high':
      return 'text-red-600 bg-red-50 border-red-200';

    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

// Progress-related utilities
export const getProgressColor = (progress: number): string => {
  if (progress >= 90) return 'text-green-600 bg-green-50 border-green-200';
  if (progress >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (progress >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  if (progress >= 25) return 'text-orange-600 bg-orange-50 border-orange-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

// Chart color utilities
export const getChartColor = (index: number, total?: number): string => {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280'  // Gray
  ];

  return colors[index % colors.length];
};

export const getChartColorScheme = (scheme: 'blue' | 'green' | 'red' | 'purple' | 'orange' = 'blue'): string[] => {
  const schemes = {
    blue: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8'],
    green: ['#ECFDF5', '#D1FAE5', '#A7F3D0', '#6EE7B7', '#34D399', '#10B981', '#059669', '#047857'],
    red: ['#FEF2F2', '#FECACA', '#FCA5A5', '#F87171', '#EF4444', '#DC2626', '#B91C1C', '#991B1B'],
    purple: ['#F5F3FF', '#EDE9FE', '#DDD6FE', '#C4B5FD', '#A78BFA', '#8B5CF6', '#7C3AED', '#6D28D9'],
    orange: ['#FFF7ED', '#FFEDD5', '#FED7AA', '#FDBA74', '#FB923C', '#F97316', '#EA580C', '#C2410C']
  };

  return schemes[scheme];
};

// Trend utilities
export const getTrendColor = (trend: 'up' | 'down' | 'stable' | string): string => {
  switch (trend.toLowerCase()) {
    case 'up':
    case 'increasing':
    case 'positive':
      return 'text-green-600';

    case 'down':
    case 'decreasing':
    case 'negative':
      return 'text-red-600';

    case 'stable':
    case 'unchanged':
    case 'neutral':
      return 'text-gray-600';

    default:
      return 'text-gray-600';
  }
};

export const getTrendIcon = (trend: 'up' | 'down' | 'stable' | string): string => {
  switch (trend.toLowerCase()) {
    case 'up':
    case 'increasing':
    case 'positive':
      return '↗';

    case 'down':
    case 'decreasing':
    case 'negative':
      return '↘';

    case 'stable':
    case 'unchanged':
    case 'neutral':
      return '→';

    default:
      return '→';
  }
};

// Badge variants for consistent styling
export const getBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status.toLowerCase()) {
    case 'success':
    case 'completed':
    case 'active':
    case 'healthy':
      return 'default';

    case 'warning':
    case 'pending':
    case 'in_progress':
      return 'secondary';

    case 'error':
    case 'failed':
    case 'critical':
      return 'destructive';

    default:
      return 'outline';
  }
};

// Formatting utilities
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatScore = (score: number, maxScore: number = 100): string => {
  const percentage = (score / maxScore) * 100;
  return `${score}/${maxScore} (${formatPercentage(percentage)})`;
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string => {
  return new Intl.NumberFormat('en-US', options).format(value);
};

// Validation utilities
export const isValidScore = (score: number, min: number = 0, max: number = 100): boolean => {
  return typeof score === 'number' && score >= min && score <= max;
};

export const isValidStatus = (status: string): boolean => {
  const validStatuses = [
    'active', 'inactive', 'pending', 'completed', 'failed', 'success',
    'warning', 'error', 'healthy', 'critical', 'compliant', 'non-compliant',
    'in_progress', 'delayed', 'draft', 'disabled'
  ];
  return validStatuses.includes(status.toLowerCase());
};

export const isValidRiskLevel = (risk: string): boolean => {
  const validRisks = ['low', 'medium', 'high', 'critical', 'minimal', 'moderate', 'elevated', 'severe'];
  return validRisks.includes(risk.toLowerCase());
};

// Helper function for consistent class name generation
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Type definitions for better IntelliSense and type safety
export type StatusType = 'active' | 'inactive' | 'pending' | 'completed' | 'failed' | 'success' |
  'warning' | 'error' | 'healthy' | 'critical' | 'compliant' | 'non-compliant' | 'in_progress' |
  'delayed' | 'draft' | 'disabled';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical' | 'minimal' | 'moderate' | 'elevated' | 'severe';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical' | 'normal' | 'urgent' | 'important';

export type TrendType = 'up' | 'down' | 'stable' | 'increasing' | 'decreasing' | 'positive' | 'negative' | 'neutral';

export type ColorScheme = 'blue' | 'green' | 'red' | 'purple' | 'orange';