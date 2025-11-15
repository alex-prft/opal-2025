'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { safeRound, makeSafeForChildren } from '@/lib/utils/number-formatting';

interface ConfidenceGaugeProps {
  title: string;
  score: number; // 0-100
  description?: string;
  factors?: Array<{
    name: string;
    score: number;
    impact: 'high' | 'medium' | 'low';
  }>;
  className?: string;
}

export default function ConfidenceGauge({
  title,
  score,
  description,
  factors = [],
  className = ''
}: ConfidenceGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(makeSafeForChildren(score, 0));
    }, 300);
    return () => clearTimeout(timer);
  }, [score]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'from-green-500 to-green-600';
    if (score >= 60) return 'from-yellow-500 to-yellow-600';
    if (score >= 40) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'High Confidence', icon: CheckCircle, className: 'bg-green-100 text-green-800' };
    if (score >= 60) return { label: 'Good Confidence', icon: Activity, className: 'bg-yellow-100 text-yellow-800' };
    if (score >= 40) return { label: 'Moderate Confidence', icon: AlertTriangle, className: 'bg-orange-100 text-orange-800' };
    return { label: 'Low Confidence', icon: XCircle, className: 'bg-red-100 text-red-800' };
  };

  const badge = getScoreBadge(score);
  const BadgeIcon = badge.icon;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            {title}
          </div>
          <Badge className={badge.className}>
            <BadgeIcon className="h-3 w-3 mr-1" />
            {badge.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Circular Progress Gauge */}
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32">
              {/* Background Circle */}
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                {/* Progress Circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${safeRound((makeSafeForChildren(animatedScore, 0) / 100) * 314, 0)} 314`}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" className={`stop-color-${getScoreBackground(score).split('-')[1]}-500`} />
                    <stop offset="100%" className={`stop-color-${getScoreBackground(score).split('-')[3]}-600`} />
                  </linearGradient>
                </defs>
              </svg>

              {/* Score Text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                    {safeRound(animatedScore, 0)}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    SCORE
                  </div>
                </div>
              </div>
            </div>

            {description && (
              <p className="text-sm text-gray-600 text-center mt-4 max-w-md">
                {description}
              </p>
            )}
          </div>

          {/* Confidence Factors */}
          {factors.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Contributing Factors</h4>
              <div className="space-y-2">
                {factors.map((factor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700">
                        {factor.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              factor.score >= 80 ? 'bg-green-500' :
                              factor.score >= 60 ? 'bg-yellow-500' :
                              factor.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${safeRound(factor.score, 0)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 w-8">
                          {safeRound(factor.score, 0)}%
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`ml-2 text-xs ${
                        factor.impact === 'high' ? 'border-red-200 text-red-700' :
                        factor.impact === 'medium' ? 'border-yellow-200 text-yellow-700' :
                        'border-gray-200 text-gray-600'
                      }`}
                    >
                      {factor.impact} impact
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}