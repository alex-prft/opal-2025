'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Activity,
  RefreshCw
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  duration?: string;
  progress?: number; // 0-100 for running steps
  error?: string;
}

interface WorkflowProgressProps {
  title: string;
  steps: WorkflowStep[];
  overallStatus: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  onRetry?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  className?: string;
}

export default function WorkflowProgress({
  title,
  steps,
  overallStatus,
  onRetry,
  onPause,
  onResume,
  className = ''
}: WorkflowProgressProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStepBorder = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-200 bg-green-50';
      case 'running': return 'border-blue-200 bg-blue-50';
      case 'failed': return 'border-red-200 bg-red-50';
      case 'paused': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getOverallStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800">
          <Activity className="h-3 w-3 mr-1" />
          Running
        </Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">
          <Pause className="h-3 w-3 mr-1" />
          Paused
        </Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">
          <Clock className="h-3 w-3 mr-1" />
          Idle
        </Badge>;
    }
  };

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const overallProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            {title}
          </div>
          {getOverallStatusBadge(overallStatus)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">
                Progress ({completedSteps}/{totalSteps} steps)
              </span>
              <span className="text-gray-500">
                {Math.round(overallProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`relative p-4 rounded-lg border-2 transition-all ${getStepBorder(step.status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStepIcon(step.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {step.name}
                      </div>

                      {step.status === 'running' && step.progress !== undefined && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Running...</span>
                            <span>{step.progress}%</span>
                          </div>
                          <div className="w-full bg-white rounded-full h-1.5">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${step.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {step.error && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          {step.error}
                        </div>
                      )}
                    </div>
                  </div>

                  {step.duration && (
                    <div className="text-xs text-gray-500 ml-2">
                      {step.duration}
                    </div>
                  )}
                </div>

                {/* Step connector line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-6 bg-gray-300"></div>
                )}
              </div>
            ))}
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t">
            {overallStatus === 'running' && onPause && (
              <Button onClick={onPause} variant="outline" size="sm">
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}

            {overallStatus === 'paused' && onResume && (
              <Button onClick={onResume} variant="outline" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}

            {(overallStatus === 'failed' || overallStatus === 'completed') && onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}

            <div className="flex-1" />

            <div className="text-xs text-gray-500">
              Last updated: {currentTime.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}