'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Eye,
  Download
} from 'lucide-react';

interface ProgressItem {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending' | 'error';
  progress: number;
  priority: 'high' | 'medium' | 'low';
  impact: 'positive' | 'negative' | 'neutral';
  estimatedTime?: string;
  completedAt?: Date;
  actionRequired?: boolean;
}

interface ResultsProgressTrackerProps {
  items: ProgressItem[];
  onItemClick?: (itemId: string) => void;
  onItemAction?: (itemId: string, action: string) => void;
  title?: string;
  showProgress?: boolean;
  showActions?: boolean;
}

const statusConfig = {
  completed: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Completed'
  },
  'in-progress': {
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'In Progress'
  },
  pending: {
    icon: Clock,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    label: 'Pending'
  },
  error: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Needs Attention'
  }
};

const priorityConfig = {
  high: { color: 'bg-red-100 text-red-800', label: 'High' },
  medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
  low: { color: 'bg-green-100 text-green-800', label: 'Low' }
};

const impactConfig = {
  positive: { icon: TrendingUp, color: 'text-green-600' },
  negative: { icon: TrendingDown, color: 'text-red-600' },
  neutral: { icon: Minus, color: 'text-gray-400' }
};

export default function ResultsProgressTracker({
  items,
  onItemClick,
  onItemAction,
  title = 'Progress Overview',
  showProgress = true,
  showActions = true
}: ResultsProgressTrackerProps) {
  const totalItems = items.length;
  const completedItems = items.filter(item => item.status === 'completed').length;
  const inProgressItems = items.filter(item => item.status === 'in-progress').length;
  const pendingItems = items.filter(item => item.status === 'pending').length;
  const errorItems = items.filter(item => item.status === 'error').length;
  const overallProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const sortedItems = [...items].sort((a, b) => {
    // Sort by status priority: error > in-progress > pending > completed
    const statusPriority = { error: 4, 'in-progress': 3, pending: 2, completed: 1 };
    const statusDiff = statusPriority[b.status] - statusPriority[a.status];
    if (statusDiff !== 0) return statusDiff;

    // Then by priority: high > medium > low
    const priorityLevel = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityLevel[b.priority] - priorityLevel[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Finally by progress (descending)
    return b.progress - a.progress;
  });

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Track your strategy implementation progress
            </p>
          </div>

          {showProgress && (
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(overallProgress)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {completedItems}/{totalItems} completed
              </div>
            </div>
          )}
        </div>

        {/* Overall Progress Bar */}
        {showProgress && (
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{Math.round(overallProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-full transition-all duration-1000 ease-out"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Status Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-green-600 font-semibold text-lg">{completedItems}</div>
            <div className="text-green-700 text-sm">Completed</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-blue-600 font-semibold text-lg">{inProgressItems}</div>
            <div className="text-blue-700 text-sm">In Progress</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-gray-600 font-semibold text-lg">{pendingItems}</div>
            <div className="text-gray-700 text-sm">Pending</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-red-600 font-semibold text-lg">{errorItems}</div>
            <div className="text-red-700 text-sm">Need Attention</div>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-3">
          {sortedItems.map((item) => {
            const StatusIcon = statusConfig[item.status].icon;
            const ImpactIcon = impactConfig[item.impact].icon;

            return (
              <div
                key={item.id}
                className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md cursor-pointer ${
                  statusConfig[item.status].borderColor
                } ${statusConfig[item.status].bgColor}`}
                onClick={() => onItemClick?.(item.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <StatusIcon
                        className={`h-5 w-5 ${statusConfig[item.status].color}`}
                      />
                      <h4 className="font-medium text-sm">{item.title}</h4>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${priorityConfig[item.priority].color}`}
                      >
                        {priorityConfig[item.priority].label}
                      </Badge>
                      {item.actionRequired && (
                        <Badge variant="destructive" className="text-xs">
                          Action Required
                        </Badge>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground mb-3">
                      {item.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              item.status === 'completed'
                                ? 'bg-green-500'
                                : item.status === 'in-progress'
                                ? 'bg-blue-500'
                                : item.status === 'error'
                                ? 'bg-red-500'
                                : 'bg-gray-300'
                            }`}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        {item.progress}%
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <ImpactIcon
                            className={`h-3 w-3 ${impactConfig[item.impact].color}`}
                          />
                          <span className="capitalize">{item.impact} impact</span>
                        </div>
                        {item.estimatedTime && (
                          <span>Est. {item.estimatedTime}</span>
                        )}
                        {item.completedAt && (
                          <span>
                            Completed {item.completedAt.toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-xs ${statusConfig[item.status].color}`}
                      >
                        {statusConfig[item.status].label}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  {showActions && (
                    <div className="ml-4 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemAction?.(item.id, 'view');
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {item.status === 'completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onItemAction?.(item.id, 'download');
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}

                      {item.actionRequired && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onItemAction?.(item.id, 'action');
                          }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              No progress items to display
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}