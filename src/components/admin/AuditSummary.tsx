'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, BarChart3 } from 'lucide-react';

interface AuditSummaryData {
  missing_tier3: number;
  agent_gaps: number;
  endpoint_gaps: number;
  total_sections: number;
  complete_mappings: number;
  partial_mappings: number;
  missing_mappings: number;
}

interface AuditSummaryProps {
  data?: AuditSummaryData;
  isLoading?: boolean;
}

export default function AuditSummary({ data, isLoading = false }: AuditSummaryProps) {
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Loading audit summary...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="mb-6 border-gray-200">
        <CardContent className="p-4">
          <div className="text-sm text-gray-500">No audit data available</div>
        </CardContent>
      </Card>
    );
  }

  const hasIssues = data.missing_tier3 > 0 || data.agent_gaps > 0 || data.endpoint_gaps > 0;
  const completionPercentage = data.total_sections > 0
    ? Math.round((data.complete_mappings / data.total_sections) * 100)
    : 0;

  return (
    <Card className={`mb-6 ${hasIssues ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Mapping Audit Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Sections */}
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data.total_sections}</div>
            <div className="text-xs text-gray-600">Sections Checked</div>
          </div>

          {/* Completion Rate */}
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completionPercentage}%</div>
            <div className="text-xs text-gray-600">Complete</div>
          </div>

          {/* Missing Tier3 */}
          <div className="text-center">
            <div className={`text-2xl font-bold ${data.missing_tier3 > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {data.missing_tier3}
            </div>
            <div className="text-xs text-gray-600">Missing Tier3</div>
          </div>

          {/* Agent Gaps */}
          <div className="text-center">
            <div className={`text-2xl font-bold ${data.agent_gaps > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {data.agent_gaps}
            </div>
            <div className="text-xs text-gray-600">Agent Gaps</div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Mapping Status Breakdown:</span>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1"
              >
                <CheckCircle className="h-3 w-3" />
                {data.complete_mappings} Complete
              </Badge>
              {data.partial_mappings > 0 && (
                <Badge
                  variant="outline"
                  className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1"
                >
                  <AlertTriangle className="h-3 w-3" />
                  {data.partial_mappings} Partial
                </Badge>
              )}
              {data.missing_mappings > 0 && (
                <Badge
                  variant="outline"
                  className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1"
                >
                  <XCircle className="h-3 w-3" />
                  {data.missing_mappings} Missing
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Issues Summary */}
        {hasIssues ? (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 mb-1">Issues Found</p>
                <ul className="text-yellow-700 text-xs space-y-1">
                  {data.missing_tier3 > 0 && (
                    <li>• {data.missing_tier3} sections need Tier3 navigation structure</li>
                  )}
                  {data.agent_gaps > 0 && (
                    <li>• {data.agent_gaps} sections have agent assignment gaps</li>
                  )}
                  {data.endpoint_gaps > 0 && (
                    <li>• {data.endpoint_gaps} sections missing result endpoints</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium text-green-800">
                All mappings are complete - no fixes needed! 🎉
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}