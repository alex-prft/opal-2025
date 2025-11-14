'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Target, BarChart3, Activity } from 'lucide-react';

interface KPIMetric {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  target?: string | number;
  status?: 'good' | 'warning' | 'critical';
}

interface KPISummaryWidgetProps {
  title: string;
  metrics: KPIMetric[];
  className?: string;
}

export default function KPISummaryWidget({ title, metrics, className = '' }: KPISummaryWidgetProps) {
  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'good': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'critical': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'good': return <Badge className="bg-green-100 text-green-800">On Target</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800">Needs Attention</Badge>;
      case 'critical': return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      default: return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${getStatusColor(metric.status)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-600 mb-1">
                    {metric.label}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {metric.value}
                  </div>
                </div>
                {getStatusBadge(metric.status)}
              </div>

              <div className="flex items-center justify-between text-sm">
                {metric.trend && metric.trendValue && (
                  <div className={`flex items-center gap-1 ${getTrendColor(metric.trend)}`}>
                    {getTrendIcon(metric.trend)}
                    <span className="font-medium">{metric.trendValue}</span>
                  </div>
                )}

                {metric.target && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <Target className="h-3 w-3" />
                    <span className="text-xs">Target: {metric.target}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}