/**
 * Language Rules Indicator Component
 *
 * Development-only component that displays language rule violations
 * and compliance scores for content validation
 */

'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLanguageRules } from '@/hooks/useLanguageRules';
import { ResultsPageContent } from '@/types/results-content';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export interface LanguageRulesIndicatorProps {
  content: Partial<ResultsPageContent> | string;
  componentName?: string;
  className?: string;
}

/**
 * Development indicator for language rules compliance
 * Only renders in development mode
 */
export function LanguageRulesIndicator({
  content,
  componentName = 'Component',
  className = ''
}: LanguageRulesIndicatorProps) {

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const { validateText, validateContent, assessQuality, getViolationSeverity, formatViolationMessage } = useLanguageRules(componentName, {
    debugMode: true
  });

  const [isExpanded, setIsExpanded] = React.useState(false);

  // Validate content based on type
  const validation = React.useMemo(() => {
    if (typeof content === 'string') {
      return { overall: validateText(content) };
    } else {
      const sections = validateContent(content);
      const quality = assessQuality(content);
      return { sections, quality };
    }
  }, [content, validateText, validateContent, assessQuality]);

  // Calculate overall compliance
  const overallCompliance = React.useMemo(() => {
    if ('overall' in validation) {
      return validation.overall.score;
    } else if (validation.sections) {
      const scores = Object.values(validation.sections).map(s => s.score);
      return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 100;
    }
    return 100;
  }, [validation]);

  // Get all violations
  const allViolations = React.useMemo(() => {
    if ('overall' in validation) {
      return validation.overall.violations;
    } else if (validation.sections) {
      return Object.entries(validation.sections).flatMap(([section, result]) =>
        result.violations.map(v => ({ ...v, section }))
      );
    }
    return [];
  }, [validation]);

  // Determine indicator color
  const indicatorColor = overallCompliance >= 90 ? 'green' :
                        overallCompliance >= 70 ? 'yellow' : 'red';

  const indicatorIcon = overallCompliance >= 90 ? CheckCircle :
                       overallCompliance >= 70 ? AlertTriangle : AlertCircle;

  const IconComponent = indicatorIcon;

  return (
    <Card className={`border-l-4 border-l-${indicatorColor}-500 ${className}`}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <IconComponent
                  className={`h-5 w-5 text-${indicatorColor}-500`}
                />
                <div>
                  <CardTitle className="text-sm font-medium">
                    Language Rules: {componentName}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge
                      variant={overallCompliance >= 90 ? 'default' :
                               overallCompliance >= 70 ? 'secondary' : 'destructive'}
                    >
                      {overallCompliance}% Compliant
                    </Badge>
                    {allViolations.length > 0 && (
                      <span className="text-xs text-gray-600">
                        {allViolations.length} issue{allViolations.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">

            {/* Quality Assessment (if available) */}
            {'quality' in validation && validation.quality && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Content Quality Assessment</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Overall Score:</span>
                    <span className="font-medium ml-2">{validation.quality.overallScore}%</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Language Score:</span>
                    <span className="font-medium ml-2">{validation.quality.languageCompliance.score}%</span>
                  </div>
                </div>

                {validation.quality.structuralIssues.length > 0 && (
                  <div className="mt-2">
                    <span className="text-blue-700 text-sm font-medium">Structural Issues:</span>
                    <ul className="list-disc list-inside text-xs text-blue-800 mt-1">
                      {validation.quality.structuralIssues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validation.quality.recommendations.length > 0 && (
                  <div className="mt-2">
                    <span className="text-blue-700 text-sm font-medium">Recommendations:</span>
                    <ul className="list-disc list-inside text-xs text-blue-800 mt-1">
                      {validation.quality.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Violations by Section */}
            {'sections' in validation && validation.sections && (
              <div className="space-y-3">
                {Object.entries(validation.sections).map(([sectionName, sectionResult]) => (
                  <div key={sectionName} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium capitalize">{sectionName}</h4>
                      <Badge
                        variant={sectionResult.score >= 90 ? 'default' :
                                sectionResult.score >= 70 ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {sectionResult.score}%
                      </Badge>
                    </div>

                    {sectionResult.violations.length > 0 ? (
                      <div className="space-y-1">
                        {sectionResult.violations.map((violation, index) => (
                          <Alert
                            key={index}
                            className={`py-2 ${
                              getViolationSeverity(violation) === 'error' ? 'border-red-300 bg-red-50' :
                              getViolationSeverity(violation) === 'warning' ? 'border-yellow-300 bg-yellow-50' :
                              'border-blue-300 bg-blue-50'
                            }`}
                          >
                            <AlertDescription className="text-xs">
                              {formatViolationMessage(violation)}
                              {violation.suggestion && (
                                <div className="mt-1 text-gray-600">
                                  Suggestion: {violation.suggestion}
                                </div>
                              )}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-green-600 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        No violations found
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Overall Violations (for string content) */}
            {'overall' in validation && (
              <div className="space-y-2">
                {validation.overall.violations.length > 0 ? (
                  validation.overall.violations.map((violation, index) => (
                    <Alert
                      key={index}
                      className={`${
                        getViolationSeverity(violation) === 'error' ? 'border-red-300 bg-red-50' :
                        getViolationSeverity(violation) === 'warning' ? 'border-yellow-300 bg-yellow-50' :
                        'border-blue-300 bg-blue-50'
                      }`}
                    >
                      <AlertDescription className="text-sm">
                        {formatViolationMessage(violation)}
                        {violation.suggestion && (
                          <div className="mt-1 text-gray-600">
                            Suggestion: {violation.suggestion}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))
                ) : (
                  <div className="text-sm text-green-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    All language rules compliance checks passed
                  </div>
                )}
              </div>
            )}

            {/* No issues message */}
            {allViolations.length === 0 && (
              <div className="text-center py-4 text-green-600">
                <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="font-medium">Excellent compliance!</p>
                <p className="text-sm">All language rules are being followed correctly.</p>
              </div>
            )}

          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

/**
 * Compact inline indicator for quick compliance checking
 */
export function LanguageRulesInlineIndicator({
  content,
  componentName,
  className = ''
}: LanguageRulesIndicatorProps) {

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const { validateText } = useLanguageRules();

  const validation = React.useMemo(() => {
    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    return validateText(contentString);
  }, [content, validateText]);

  const hasIssues = validation.violations.length > 0;
  const score = validation.score;

  return (
    <Badge
      variant={score >= 90 ? 'default' : score >= 70 ? 'secondary' : 'destructive'}
      className={`text-xs ${className}`}
      title={hasIssues ? `${validation.violations.length} language rule violations` : 'Language rules compliant'}
    >
      {score}% LR
    </Badge>
  );
}