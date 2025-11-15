/**
 * Maturity Specialized Widget - Digital Maturity Assessment Framework
 *
 * Evaluates organizational maturity across multiple dimensions:
 * - Personalization Maturity (0-5 scale)
 * - Content Management Maturity
 * - Experimentation Maturity
 * - Technical Maturity
 *
 * Provides gap analysis and improvement pathway recommendations
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  TrendingUp,
  BarChart3,
  Users,
  Settings,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Award
} from 'lucide-react';

interface MaturityDimension {
  name: string;
  current_score: number;
  industry_benchmark: number;
  max_score: number;
  assessment: string;
  evidence: string[];
  gap_analysis: string[];
  improvement_actions: string[];
}

interface MaturityData {
  overall_score?: number;
  maturity_level?: string;
  dimension_scores?: {
    personalization?: number;
    content_management?: number;
    experimentation?: number;
    technical?: number;
  };
  improvement_areas?: string[];
  next_level_requirements?: string[];
  benchmarking_data?: {
    industry_average?: number;
    top_quartile?: number;
    best_in_class?: number;
  };
}

interface MaturitySpecializedWidgetProps {
  data: MaturityData;
  className?: string;
}

export function MaturitySpecializedWidget({ data, className = '' }: MaturitySpecializedWidgetProps) {
  const [selectedDimension, setSelectedDimension] = useState<string>('personalization');

  // Default maturity dimensions with comprehensive data
  const defaultDimensions: Record<string, MaturityDimension> = {
    personalization: {
      name: 'Personalization Maturity',
      current_score: data.dimension_scores?.personalization || 2.8,
      industry_benchmark: 3.2,
      max_score: 5.0,
      assessment: 'Developing capabilities with basic segmentation in place',
      evidence: [
        'Basic demographic segmentation active',
        'Static content variants deployed',
        '2 active A/B tests running',
        'Email personalization implemented'
      ],
      gap_analysis: [
        'Limited behavioral targeting',
        'No real-time personalization',
        'Lack of cross-channel consistency',
        'Manual campaign management'
      ],
      improvement_actions: [
        'Implement behavioral tracking',
        'Deploy dynamic content system',
        'Establish cross-channel orchestration',
        'Automate campaign optimization'
      ]
    },
    content_management: {
      name: 'Content Management Maturity',
      current_score: data.dimension_scores?.content_management || 3.5,
      industry_benchmark: 3.1,
      max_score: 5.0,
      assessment: 'Advanced capabilities with good governance framework',
      evidence: [
        'Centralized content repository',
        'Workflow approval process',
        'Content performance tracking',
        'Multi-channel publishing'
      ],
      gap_analysis: [
        'Limited content analytics',
        'Manual optimization process',
        'Inconsistent brand compliance',
        'No AI-powered recommendations'
      ],
      improvement_actions: [
        'Implement content analytics',
        'Automate optimization workflows',
        'Deploy brand compliance tools',
        'Add AI content recommendations'
      ]
    },
    experimentation: {
      name: 'Experimentation Maturity',
      current_score: data.dimension_scores?.experimentation || 2.9,
      industry_benchmark: 3.4,
      max_score: 5.0,
      assessment: 'Basic testing capabilities with room for advanced features',
      evidence: [
        '5 A/B tests completed this quarter',
        'Statistical significance tracking',
        'Basic multivariate testing',
        'Results documentation process'
      ],
      gap_analysis: [
        'Low test velocity',
        'Limited advanced testing methods',
        'No automated optimization',
        'Lack of predictive modeling'
      ],
      improvement_actions: [
        'Increase test velocity to 10+ concurrent',
        'Implement advanced testing methods',
        'Deploy automated optimization',
        'Add predictive modeling capabilities'
      ]
    },
    technical: {
      name: 'Technical Maturity',
      current_score: data.dimension_scores?.technical || 3.7,
      industry_benchmark: 3.0,
      max_score: 5.0,
      assessment: 'Strong technical foundation with good integration capabilities',
      evidence: [
        'Modern tech stack implemented',
        'API-first architecture',
        'Real-time data processing',
        'Cloud-native infrastructure'
      ],
      gap_analysis: [
        'Limited ML/AI capabilities',
        'Data silos still exist',
        'Manual deployment processes',
        'Monitoring gaps'
      ],
      improvement_actions: [
        'Implement ML/AI platform',
        'Unify data architecture',
        'Automate CI/CD pipelines',
        'Enhance monitoring and alerting'
      ]
    }
  };

  const overallScore = data.overall_score || 3.2;
  const maturityLevel = data.maturity_level || getMaturityLevel(overallScore);

  function getMaturityLevel(score: number): string {
    if (score >= 4.5) return 'Expert';
    if (score >= 3.5) return 'Advanced';
    if (score >= 2.5) return 'Developing';
    if (score >= 1.5) return 'Basic';
    return 'Beginner';
  }

  function getMaturityColor(score: number): string {
    if (score >= 4.0) return 'text-green-600 bg-green-50';
    if (score >= 3.0) return 'text-blue-600 bg-blue-50';
    if (score >= 2.0) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  }

  function getScoreIcon(score: number) {
    if (score >= 4.0) return <Award className="w-4 h-4 text-green-600" />;
    if (score >= 3.0) return <Target className="w-4 h-4 text-blue-600" />;
    if (score >= 2.0) return <TrendingUp className="w-4 h-4 text-yellow-600" />;
    return <AlertCircle className="w-4 h-4 text-red-600" />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Maturity Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Digital Maturity Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Score */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getMaturityColor(overallScore)} mb-3`}>
                <span className="text-2xl font-bold">{overallScore.toFixed(1)}</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">Overall Maturity Score</h3>
              <Badge className={getMaturityColor(overallScore)}>
                {maturityLevel}
              </Badge>
            </div>

            {/* Benchmarking */}
            <div className="space-y-4">
              <h4 className="font-semibold">Industry Benchmarking</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Your Score</span>
                    <span className="font-semibold">{overallScore.toFixed(1)}</span>
                  </div>
                  <Progress value={(overallScore / 5) * 100} className="h-2" />
                </div>

                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Industry Average:</span>
                    <span>{data.benchmarking_data?.industry_average || '3.1'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Top Quartile:</span>
                    <span>{data.benchmarking_data?.top_quartile || '4.2'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Best in Class:</span>
                    <span>{data.benchmarking_data?.best_in_class || '4.8'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dimension Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Maturity Dimensions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(defaultDimensions).map(([dimensionKey, dimension]) => (
              <Card
                key={dimensionKey}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedDimension === dimensionKey ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedDimension(dimensionKey)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getScoreIcon(dimension.current_score)}
                    <h3 className="font-semibold text-sm">{dimension.name}</h3>
                  </div>

                  <div className="text-center mb-3">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getMaturityColor(dimension.current_score)}`}>
                      <span className="text-lg font-bold">{dimension.current_score.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Progress value={(dimension.current_score / 5) * 100} className="h-2" />
                    <div className="text-xs text-gray-500 flex justify-between">
                      <span>Industry: {dimension.industry_benchmark.toFixed(1)}</span>
                      <span>{Math.round((dimension.current_score / 5) * 100)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Dimension Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getScoreIcon(defaultDimensions[selectedDimension].current_score)}
            {defaultDimensions[selectedDimension].name} Analysis
          </CardTitle>
          <p className="text-gray-600">
            {defaultDimensions[selectedDimension].assessment}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Current Evidence */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Current Capabilities
              </h4>
              <ul className="space-y-2">
                {defaultDimensions[selectedDimension].evidence.map((evidence, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {evidence}
                  </li>
                ))}
              </ul>
            </div>

            {/* Gap Analysis */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                Gap Analysis
              </h4>
              <ul className="space-y-2">
                {defaultDimensions[selectedDimension].gap_analysis.map((gap, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    {gap}
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvement Actions */}
            <div className="lg:col-span-2">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-blue-500" />
                Recommended Improvement Actions
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {defaultDimensions[selectedDimension].improvement_actions.map((action, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm p-3 bg-blue-50 rounded-lg">
                    <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    {action}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Level Requirements */}
      {data.next_level_requirements && data.next_level_requirements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Path to Next Maturity Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                To advance from <Badge className={getMaturityColor(overallScore)}>{maturityLevel}</Badge> to the next level:
              </p>
              <ul className="space-y-2">
                {data.next_level_requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Target className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    {requirement}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}