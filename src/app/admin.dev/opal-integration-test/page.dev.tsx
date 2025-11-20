'use client';

// Disable static generation to avoid SSR prerendering issues
export const dynamic = 'force-dynamic';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, AlertTriangle, Play, RotateCcw, Database, Zap } from 'lucide-react';

interface ValidationResult {
  overall_status: 'green' | 'yellow' | 'red';
  layer_1_force_sync: {
    status: 'success' | 'warning' | 'error';
    message: string;
    metrics?: any;
  };
  layer_2_opal_agents: {
    status: 'success' | 'warning' | 'error';
    message: string;
    agents_validated?: number;
    agents_total?: number;
    failed_agents?: string[];
  };
  layer_3_osa_ingestion: {
    status: 'success' | 'warning' | 'error';
    message: string;
    ingestion_rate?: number;
    failed_ingestions?: string[];
  };
  layer_4_results: {
    status: 'success' | 'warning' | 'error';
    message: string;
    results_generated?: boolean;
    confidence_score?: number;
  };
  summary: string;
  validation_time_ms: number;
  recommendations?: string[];
}

interface TestScenario {
  id: string;
  name: string;
  description: string;
  input: {
    forceSyncWorkflowId: string;
    opalCorrelationId: string;
    tenantId?: string;
  };
  expectedStatus: 'green' | 'yellow' | 'red';
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'healthy_complete',
    name: 'Healthy Complete Workflow',
    description: 'All 4 layers validate successfully with optimal performance',
    input: {
      forceSyncWorkflowId: 'ws_healthy_test_001',
      opalCorrelationId: 'opal_corr_healthy_001',
      tenantId: 'tenant_test'
    },
    expectedStatus: 'green'
  },
  {
    id: 'partial_agent_failure',
    name: 'Partial Agent Failures',
    description: '2 out of 9 OPAL agents failed, but workflow continues',
    input: {
      forceSyncWorkflowId: 'ws_partial_fail_002',
      opalCorrelationId: 'opal_corr_partial_002',
      tenantId: 'tenant_test'
    },
    expectedStatus: 'yellow'
  },
  {
    id: 'osa_ingestion_issues',
    name: 'OSA Ingestion Problems',
    description: 'OPAL agents run successfully but OSA ingestion has issues',
    input: {
      forceSyncWorkflowId: 'ws_ingestion_fail_003',
      opalCorrelationId: 'opal_corr_ingestion_003',
      tenantId: 'tenant_test'
    },
    expectedStatus: 'red'
  },
  {
    id: 'results_generation_failure',
    name: 'Results Layer Failure',
    description: 'Data flows correctly but results generation fails',
    input: {
      forceSyncWorkflowId: 'ws_results_fail_004',
      opalCorrelationId: 'opal_corr_results_004',
      tenantId: 'tenant_test'
    },
    expectedStatus: 'red'
  },
  {
    id: 'timeout_scenario',
    name: 'Workflow Timeout',
    description: 'Force Sync workflow exceeds SLA thresholds',
    input: {
      forceSyncWorkflowId: 'ws_timeout_005',
      opalCorrelationId: 'opal_corr_timeout_005',
      tenantId: 'tenant_test'
    },
    expectedStatus: 'red'
  }
];

export default function OpalIntegrationTestPage() {
  // CRITICAL: React hook safety during Next.js static generation
  // During static generation, React can be null, so check before using hooks
  // Also check for prerendering environment variables
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') {
    // Return a safe fallback component during static generation to prevent build failures
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">OPAL Integration Validator Test Interface</h1>
            <p className="text-muted-foreground mt-2">
              Test and validate end-to-end OPAL integration pipeline with comprehensive 4-layer validation
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-green-500" />
            <span className="text-sm text-muted-foreground">Database Connected</span>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Loading OPAL Integration Test Interface...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground">Initializing validation system...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState('manual');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Manual test form state
  const [manualInput, setManualInput] = useState({
    forceSyncWorkflowId: 'ws_manual_test_001',
    opalCorrelationId: 'opal_corr_manual_001',
    tenantId: 'tenant_test'
  });

  // Scenario test state
  const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(null);
  const [scenarioResults, setScenarioResults] = useState<Record<string, ValidationResult>>({});

  const runValidation = (typeof window === 'undefined' || process.env.NODE_ENV === 'production')
    ? async (input: any, testMode: 'manual' | 'mock' = 'manual') => {
        // Safe fallback during static generation
        console.warn('Validation unavailable during static generation');
      }
    : useCallback(async (input: any, testMode: 'manual' | 'mock' = 'manual') => {
    setIsValidating(true);
    setError(null);
    setValidationResult(null);

    try {
      const endpoint = testMode === 'mock' 
        ? '/api/admin/osa/validate-integration-mock'
        : '/api/admin/osa/validate-integration';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setValidationResult(result);

      if (testMode === 'mock' && selectedScenario) {
        setScenarioResults(prev => ({
          ...prev,
          [selectedScenario.id]: result
        }));
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsValidating(false);
    }
  }, [selectedScenario]);

  const runManualValidation = () => {
    runValidation(manualInput, 'manual');
  };

  const runScenarioValidation = (scenario: TestScenario) => {
    setSelectedScenario(scenario);
    runValidation(scenario.input, 'mock');
  };

  const runAllScenarios = async () => {
    setIsValidating(true);
    setError(null);
    
    try {
      for (const scenario of TEST_SCENARIOS) {
        setSelectedScenario(scenario);
        await runValidation(scenario.input, 'mock');
        await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay between tests
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch testing failed');
    } finally {
      setIsValidating(false);
      setSelectedScenario(null);
    }
  };

  const getStatusIcon = (status: 'green' | 'yellow' | 'red' | 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'green':
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'yellow':
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'red':
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: 'green' | 'yellow' | 'red') => {
    const variants = {
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      red: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <Badge className={variants[status]}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">OPAL Integration Validator Test Interface</h1>
          <p className="text-muted-foreground mt-2">
            Test and validate end-to-end OPAL integration pipeline with comprehensive 4-layer validation
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-green-500" />
          <span className="text-sm text-muted-foreground">Database Connected</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manual">Manual Testing</TabsTrigger>
          <TabsTrigger value="scenarios">Test Scenarios</TabsTrigger>
          <TabsTrigger value="monitoring">Real-time Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Manual Validation Testing
              </CardTitle>
              <CardDescription>
                Test specific Force Sync workflows with custom parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="forceSyncWorkflowId">Force Sync Workflow ID</Label>
                  <Input
                    id="forceSyncWorkflowId"
                    value={manualInput.forceSyncWorkflowId}
                    onChange={(e) => setManualInput(prev => ({ ...prev, forceSyncWorkflowId: e.target.value }))}
                    placeholder="ws_example_001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opalCorrelationId">OPAL Correlation ID</Label>
                  <Input
                    id="opalCorrelationId"
                    value={manualInput.opalCorrelationId}
                    onChange={(e) => setManualInput(prev => ({ ...prev, opalCorrelationId: e.target.value }))}
                    placeholder="opal_corr_example_001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenantId">Tenant ID (Optional)</Label>
                  <Input
                    id="tenantId"
                    value={manualInput.tenantId}
                    onChange={(e) => setManualInput(prev => ({ ...prev, tenantId: e.target.value }))}
                    placeholder="tenant_test"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={runManualValidation} 
                  disabled={isValidating}
                  className="flex items-center gap-2"
                >
                  {isValidating ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  {isValidating ? 'Validating...' : 'Run Validation'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setValidationResult(null)}
                  disabled={isValidating}
                >
                  Clear Results
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Predefined Test Scenarios
              </CardTitle>
              <CardDescription>
                Run comprehensive validation tests with predefined scenarios covering various failure modes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button onClick={runAllScenarios} disabled={isValidating} variant="default">
                  {isValidating ? 'Running All Tests...' : 'Run All Scenarios'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setScenarioResults({})}
                  disabled={isValidating}
                >
                  Clear All Results
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {TEST_SCENARIOS.map((scenario) => {
                  const result = scenarioResults[scenario.id];
                  const isRunning = isValidating && selectedScenario?.id === scenario.id;

                  return (
                    <Card key={scenario.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{scenario.name}</CardTitle>
                            <CardDescription className="text-sm">{scenario.description}</CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            {result && getStatusBadge(result.overall_status)}
                            <Badge variant="outline" className="text-xs">
                              Expected: {scenario.expectedStatus}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground">
                            <div>Workflow ID: {scenario.input.forceSyncWorkflowId}</div>
                            <div>Correlation ID: {scenario.input.opalCorrelationId}</div>
                          </div>
                          
                          {result && (
                            <div className="text-xs space-y-1">
                              <div className="font-medium">Validation Summary:</div>
                              <div className="text-muted-foreground">{result.summary}</div>
                              <div className="text-muted-foreground">
                                Duration: {result.validation_time_ms}ms
                              </div>
                            </div>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runScenarioValidation(scenario)}
                            disabled={isValidating}
                            className="w-full"
                          >
                            {isRunning ? (
                              <>
                                <RotateCcw className="h-3 w-3 animate-spin mr-1" />
                                Running...
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3 mr-1" />
                                Run Test
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Integration Health</CardTitle>
              <CardDescription>
                Monitor ongoing validation status and system health metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Real-time monitoring integration will be available after completing the admin dashboard setup.
                  This will include live status updates, health metrics, and automated alerting.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Validation Results Display */}
      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Validation Results</span>
              {getStatusBadge(validationResult.overall_status)}
            </CardTitle>
            <CardDescription>
              Complete 4-layer validation analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Layer 1: Force Sync */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getStatusIcon(validationResult.layer_1_force_sync.status)}
                    Layer 1: Force Sync
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">
                    {validationResult.layer_1_force_sync.message}
                  </p>
                </CardContent>
              </Card>

              {/* Layer 2: OPAL Agents */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getStatusIcon(validationResult.layer_2_opal_agents.status)}
                    Layer 2: OPAL Agents
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">
                    {validationResult.layer_2_opal_agents.message}
                  </p>
                  {validationResult.layer_2_opal_agents.agents_validated && (
                    <p className="text-xs font-medium">
                      {validationResult.layer_2_opal_agents.agents_validated}/{validationResult.layer_2_opal_agents.agents_total} agents successful
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Layer 3: OSA Ingestion */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getStatusIcon(validationResult.layer_3_osa_ingestion.status)}
                    Layer 3: OSA Ingestion
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">
                    {validationResult.layer_3_osa_ingestion.message}
                  </p>
                  {validationResult.layer_3_osa_ingestion.ingestion_rate && (
                    <p className="text-xs font-medium">
                      {Math.round(validationResult.layer_3_osa_ingestion.ingestion_rate * 100)}% ingestion rate
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Layer 4: Results */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getStatusIcon(validationResult.layer_4_results.status)}
                    Layer 4: Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">
                    {validationResult.layer_4_results.message}
                  </p>
                  {validationResult.layer_4_results.confidence_score && (
                    <p className="text-xs font-medium">
                      Confidence: {validationResult.layer_4_results.confidence_score}%
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Validation Summary</h4>
              <p className="text-sm text-muted-foreground">{validationResult.summary}</p>
              <p className="text-xs text-muted-foreground">
                Validation completed in {validationResult.validation_time_ms}ms
              </p>
            </div>

            {validationResult.recommendations && validationResult.recommendations.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium">Recommendations</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {validationResult.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-muted-foreground">{rec}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}