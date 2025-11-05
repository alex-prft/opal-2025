'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';

interface LoadingAnimationProps {
  title?: string;
  description?: string;
  onCancel?: () => void;
  onGoBack?: () => void;
  showCounter?: boolean;
  estimatedTime?: number; // in seconds
  cancelButtonText?: string;
  backButtonText?: string;
  variant?: 'overlay' | 'card' | 'inline';
}

export default function LoadingAnimation({
  title = "Loading...",
  description = "Please wait while we process your request",
  onCancel,
  onGoBack,
  showCounter = true,
  estimatedTime = 30,
  cancelButtonText = "Cancel",
  backButtonText = "Go Back",
  variant = 'overlay'
}: LoadingAnimationProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 0.1);

      // Calculate progress based on estimated time
      if (estimatedTime > 0) {
        setProgress(prev => {
          const newProgress = Math.min((elapsedTime / estimatedTime) * 100, 95);
          return newProgress;
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [elapsedTime, estimatedTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const LoadingContent = () => (
    <>
      {/* Animated spinner */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
          <RefreshCw className="w-8 h-8 text-blue-400 animate-pulse absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Title and Description */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>

      {/* Progress Bar */}
      {showCounter && estimatedTime > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Counter */}
      {showCounter && (
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <span>Elapsed:</span>
              <span className="font-mono font-medium">{formatTime(elapsedTime)}</span>
            </div>
            {estimatedTime > 0 && (
              <>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <span>Est. Total:</span>
                  <span className="font-mono font-medium">{formatTime(estimatedTime)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-3">
        {onGoBack && (
          <Button
            variant="outline"
            onClick={onGoBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{backButtonText}</span>
          </Button>
        )}
        {onCancel && (
          <Button
            variant="destructive"
            onClick={onCancel}
            className="flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>{cancelButtonText}</span>
          </Button>
        )}
      </div>
    </>
  );

  if (variant === 'overlay') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <LoadingContent />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="p-8">
          <LoadingContent />
        </CardContent>
      </Card>
    );
  }

  // Inline variant
  return (
    <div className="w-full max-w-lg mx-auto p-8">
      <LoadingContent />
    </div>
  );
}

// Preset loading configurations
export const LoadingPresets = {
  pmgWorkflow: {
    title: "Processing PMG Workflow",
    description: "Analyzing your personalization maturity and generating recommendations...",
    estimatedTime: 15,
  },
  analyticsData: {
    title: "Loading Analytics Data",
    description: "Fetching data from integrated sources and processing insights...",
    estimatedTime: 8,
  },
  webhookStatus: {
    title: "Checking Webhook Status",
    description: "Connecting to webhook endpoints and retrieving status information...",
    estimatedTime: 5,
  },
  adminConfig: {
    title: "Loading Configuration",
    description: "Retrieving system settings and configuration data...",
    estimatedTime: 3,
  },
  useCaseData: {
    title: "Loading Use Case Details",
    description: "Generating personalized experiments and recommendations...",
    estimatedTime: 6,
  }
};