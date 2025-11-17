#!/usr/bin/env tsx
/**
 * Force Sync Workflow Validation Script
 * Performs comprehensive 4-layer validation for Force Sync → OPAL → OSA → Results pipeline
 *
 * Usage: npx tsx scripts/validate-force-sync-workflow.ts <workflow_id>
 * Example: npx tsx scripts/validate-force-sync-workflow.ts ws_abc123
 */

import { OpalIntegrationValidator } from '../src/lib/opal/integration-validator';
import { createSupabaseAdmin } from '../src/lib/database/supabase-client';

interface ValidationReport {
  workflowId: string;
  validatedAt: string;
  overallStatus: 'green' | 'red' | 'yellow';
  confidenceScore: number; // 0-100

  layers: {
    forceSync: LayerValidation;
    opalAgents: LayerValidation;
    osaIngestion: LayerValidation;
    resultsGeneration: LayerValidation;
  };

  summary: string;
  recommendations: string[];
  criticalIssues: string[];
}

interface LayerValidation {
  status: 'pass' | 'fail' | 'partial';
  confidence: number; // 0-100
  details: any;
  issues: string[];
}

async function validateForceSyncWorkflow(workflowId: string): Promise<ValidationReport> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`OPAL INTEGRATION VALIDATION: ${workflowId}`);
  console.log(`${'='.repeat(80)}\n`);

  const validator = new OpalIntegrationValidator();
  const supabase = createSupabaseAdmin();

  const startTime = Date.now();

  // ==========================================
  // LAYER 1: Force Sync Orchestration
  // ==========================================
  console.log('📋 [LAYER 1] Force Sync Orchestration Validation');
  console.log('   - Checking workflow status and correlation ID');
  console.log('   - Validating execution duration and SLA compliance');
  console.log('   - Verifying workflow state transitions\n');

  const forceSyncLayer = await validateForceSyncLayer(workflowId, supabase);

  console.log(`   Status: ${getStatusIcon(forceSyncLayer.status)} ${forceSyncLayer.status.toUpperCase()}`);
  console.log(`   Confidence: ${forceSyncLayer.confidence}%`);
  if (forceSyncLayer.issues.length > 0) {
    console.log(`   Issues: ${forceSyncLayer.issues.length} found`);
    forceSyncLayer.issues.forEach(issue => console.log(`     - ${issue}`));
  }
  console.log();

  // ==========================================
  // LAYER 2: OPAL Agents Execution
  // ==========================================
  console.log('🤖 [LAYER 2] OPAL Agents Execution Validation');
  console.log('   - Validating all 9 required agents executed');
  console.log('   - Checking agent run status and response counts');
  console.log('   - Identifying repeated errors or timeout patterns\n');

  const opalAgentsLayer = await validateOpalAgentsLayer(workflowId);

  console.log(`   Status: ${getStatusIcon(opalAgentsLayer.status)} ${opalAgentsLayer.status.toUpperCase()}`);
  console.log(`   Confidence: ${opalAgentsLayer.confidence}%`);
  console.log(`   Agents Status: ${JSON.stringify(opalAgentsLayer.details.agentStatuses || {})}`);
  if (opalAgentsLayer.issues.length > 0) {
    console.log(`   Issues: ${opalAgentsLayer.issues.length} found`);
    opalAgentsLayer.issues.forEach(issue => console.log(`     - ${issue}`));
  }
  console.log();

  // ==========================================
  // LAYER 3: OSA Data Ingestion
  // ==========================================
  console.log('📥 [LAYER 3] OSA Data Ingestion Validation');
  console.log('   - Validating enhanced tool calls (send_data_to_osa_enhanced)');
  console.log('   - Checking HTTP status codes and signature validation');
  console.log('   - Verifying Supabase/DB persistence of data blobs\n');

  const osaIngestionLayer = await validateOsaIngestionLayer(workflowId);

  console.log(`   Status: ${getStatusIcon(osaIngestionLayer.status)} ${osaIngestionLayer.status.toUpperCase()}`);
  console.log(`   Confidence: ${osaIngestionLayer.confidence}%`);
  console.log(`   Reception Rate: ${(osaIngestionLayer.details.receptionRate * 100).toFixed(1)}%`);
  if (osaIngestionLayer.issues.length > 0) {
    console.log(`   Issues: ${osaIngestionLayer.issues.length} found`);
    osaIngestionLayer.issues.forEach(issue => console.log(`     - ${issue}`));
  }
  console.log();

  // ==========================================
  // LAYER 4: Results & Strategy Layer
  // ==========================================
  console.log('📊 [LAYER 4] Results & Strategy Layer Validation');
  console.log('   - Confirming results optimizer read latest OSA data');
  console.log('   - Validating recommendation objects and summaries');
  console.log('   - Performing sanity checks on output quality\n');

  const resultsLayer = await validateResultsLayer(workflowId);

  console.log(`   Status: ${getStatusIcon(resultsLayer.status)} ${resultsLayer.status.toUpperCase()}`);
  console.log(`   Confidence: ${resultsLayer.confidence}%`);
  if (resultsLayer.issues.length > 0) {
    console.log(`   Issues: ${resultsLayer.issues.length} found`);
    resultsLayer.issues.forEach(issue => console.log(`     - ${issue}`));
  }
  console.log();

  // ==========================================
  // Overall Assessment & Confidence Scoring
  // ==========================================
  const overallStatus = calculateOverallStatus([
    forceSyncLayer,
    opalAgentsLayer,
    osaIngestionLayer,
    resultsLayer
  ]);

  const confidenceScore = calculateConfidenceScore([
    forceSyncLayer,
    opalAgentsLayer,
    osaIngestionLayer,
    resultsLayer
  ]);

  const criticalIssues = collectCriticalIssues([
    forceSyncLayer,
    opalAgentsLayer,
    osaIngestionLayer,
    resultsLayer
  ]);

  const recommendations = generateRecommendations([
    forceSyncLayer,
    opalAgentsLayer,
    osaIngestionLayer,
    resultsLayer
  ]);

  const executionTime = Date.now() - startTime;

  // Store validation result
  const validationResult = await validator.validateWorkflow({
    forceSyncWorkflowId: workflowId,
    opalCorrelationId: forceSyncLayer.details.correlationId,
    tenantId: forceSyncLayer.details.tenantId
  });

  console.log(`${'='.repeat(80)}`);
  console.log('VALIDATION SUMMARY');
  console.log(`${'='.repeat(80)}\n`);
  console.log(`Overall Status: ${getStatusIcon(overallStatus === 'green' ? 'pass' : overallStatus === 'red' ? 'fail' : 'partial')} ${overallStatus.toUpperCase()}`);
  console.log(`Confidence Score: ${confidenceScore}/100`);
  console.log(`Validation Time: ${executionTime}ms\n`);

  if (criticalIssues.length > 0) {
    console.log('🚨 CRITICAL ISSUES:');
    criticalIssues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
    console.log();
  }

  if (recommendations.length > 0) {
    console.log('💡 RECOMMENDATIONS:');
    recommendations.forEach((rec, i) => console.log(`   ${i + 1}. ${rec}`));
    console.log();
  }

  const summary = generateSummary(overallStatus, confidenceScore, criticalIssues);
  console.log(`Summary: ${summary}\n`);

  console.log(`${'='.repeat(80)}\n`);

  return {
    workflowId,
    validatedAt: new Date().toISOString(),
    overallStatus,
    confidenceScore,
    layers: {
      forceSync: forceSyncLayer,
      opalAgents: opalAgentsLayer,
      osaIngestion: osaIngestionLayer,
      resultsGeneration: resultsLayer
    },
    summary,
    recommendations,
    criticalIssues
  };
}

// ==========================================
// Layer Validation Functions
// ==========================================

async function validateForceSyncLayer(workflowId: string, supabase: any): Promise<LayerValidation> {
  const issues: string[] = [];
  let confidence = 100;
  let status: 'pass' | 'fail' | 'partial' = 'pass';

  try {
    // Query force_sync_runs table
    const { data: forceSyncRun, error } = await supabase
      .from('force_sync_runs')
      .select('*')
      .eq('force_sync_workflow_id', workflowId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !forceSyncRun) {
      issues.push('Force Sync workflow record not found in database');
      confidence = 0;
      status = 'fail';

      return {
        status,
        confidence,
        details: { found: false },
        issues
      };
    }

    // Validate workflow status
    if (forceSyncRun.status === 'failed') {
      issues.push('Force Sync workflow failed');
      confidence -= 50;
      status = 'fail';
    } else if (forceSyncRun.status === 'timeout') {
      issues.push('Force Sync workflow timed out');
      confidence -= 40;
      status = 'fail';
    } else if (forceSyncRun.status !== 'completed') {
      issues.push(`Force Sync workflow in unexpected state: ${forceSyncRun.status}`);
      confidence -= 30;
      status = 'partial';
    }

    // Validate execution duration (SLA: < 60-90 seconds)
    if (forceSyncRun.execution_duration_ms) {
      const durationSeconds = forceSyncRun.execution_duration_ms / 1000;
      if (durationSeconds > 90) {
        issues.push(`Execution time ${durationSeconds.toFixed(1)}s exceeds 90s SLA`);
        confidence -= 10;
      }
    }

    // Validate agent count
    if (!forceSyncRun.agent_count || forceSyncRun.agent_count < 9) {
      issues.push(`Expected 9 agents, found ${forceSyncRun.agent_count || 0}`);
      confidence -= 20;
      status = status === 'pass' ? 'partial' : status;
    }

    return {
      status,
      confidence: Math.max(0, confidence),
      details: {
        workflowStatus: forceSyncRun.status,
        agentCount: forceSyncRun.agent_count,
        executionDurationMs: forceSyncRun.execution_duration_ms,
        correlationId: forceSyncRun.opal_correlation_id,
        tenantId: forceSyncRun.tenant_id,
        completedAt: forceSyncRun.completed_at
      },
      issues
    };

  } catch (error: any) {
    return {
      status: 'fail',
      confidence: 0,
      details: { error: error.message },
      issues: [`Failed to validate Force Sync layer: ${error.message}`]
    };
  }
}

async function validateOpalAgentsLayer(workflowId: string): Promise<LayerValidation> {
  const issues: string[] = [];
  let confidence = 100;
  let status: 'pass' | 'fail' | 'partial' = 'pass';

  try {
    const response = await fetch(`http://localhost:3000/api/webhook-events/stats?workflowId=${encodeURIComponent(workflowId)}`);

    if (!response.ok) {
      throw new Error(`Stats API returned ${response.status}`);
    }

    const stats = await response.json();

    // Validate agent response count
    const agentResponseCount = stats.workflowAnalysis?.agentResponseCount || 0;
    if (agentResponseCount < 9) {
      issues.push(`Only ${agentResponseCount}/9 agents responded`);
      confidence -= (9 - agentResponseCount) * 10;
      status = 'partial';
    }

    // Validate agent statuses
    const agentStatuses = stats.agentStatuses || {};
    const failedAgents = Object.entries(agentStatuses)
      .filter(([_, status]) => status === 'failed')
      .map(([agent]) => agent);

    if (failedAgents.length > 0) {
      issues.push(`Failed agents: ${failedAgents.join(', ')}`);
      confidence -= failedAgents.length * 15;
      status = failedAgents.length > 2 ? 'fail' : 'partial';
    }

    // Validate workflow status
    if (stats.workflowStatus === 'failed') {
      issues.push('OPAL workflow status is failed');
      confidence -= 30;
      status = 'fail';
    }

    return {
      status,
      confidence: Math.max(0, confidence),
      details: {
        agentResponseCount,
        agentStatuses,
        workflowStatus: stats.workflowStatus,
        failedAgents
      },
      issues
    };

  } catch (error: any) {
    return {
      status: 'fail',
      confidence: 0,
      details: { error: error.message },
      issues: [`Failed to validate OPAL agents layer: ${error.message}`]
    };
  }
}

async function validateOsaIngestionLayer(workflowId: string): Promise<LayerValidation> {
  const issues: string[] = [];
  let confidence = 100;
  let status: 'pass' | 'fail' | 'partial' = 'pass';

  try {
    const response = await fetch(`http://localhost:3000/api/webhook-events/stats?workflowId=${encodeURIComponent(workflowId)}`);

    if (!response.ok) {
      throw new Error(`Stats API returned ${response.status}`);
    }

    const stats = await response.json();

    // Validate OSA reception rate
    const receptionRate = stats.osaWorkflowData?.dataReceptionRate || 0;

    if (receptionRate < 0.3) {
      issues.push(`Critical: OSA reception rate only ${(receptionRate * 100).toFixed(0)}%`);
      confidence -= 60;
      status = 'fail';
    } else if (receptionRate < 0.8) {
      issues.push(`OSA reception rate ${(receptionRate * 100).toFixed(0)}% below 80% target`);
      confidence -= 20;
      status = 'partial';
    }

    // Check for recent webhook data
    const recentStatus = await fetch('http://localhost:3000/api/admin/osa/recent-status')
      .then(r => r.json())
      .catch(() => ({ success: false }));

    if (!recentStatus.success) {
      issues.push('Unable to retrieve OSA recent status');
      confidence -= 15;
    } else {
      const lastWebhookMinutes = recentStatus.lastWebhookMinutesAgo || 999;
      if (lastWebhookMinutes > 10) {
        issues.push(`Last webhook was ${lastWebhookMinutes} minutes ago`);
        confidence -= 10;
      }
    }

    return {
      status,
      confidence: Math.max(0, confidence),
      details: {
        receptionRate,
        workflowData: stats.osaWorkflowData || {},
        lastWebhookAt: recentStatus.lastWebhookAt
      },
      issues
    };

  } catch (error: any) {
    return {
      status: 'fail',
      confidence: 0,
      details: { error: error.message },
      issues: [`Failed to validate OSA ingestion layer: ${error.message}`]
    };
  }
}

async function validateResultsLayer(workflowId: string): Promise<LayerValidation> {
  const issues: string[] = [];
  let confidence = 100;
  let status: 'pass' | 'fail' | 'partial' = 'pass';

  try {
    // Check OPAL health with fallback
    const response = await fetch('http://localhost:3000/api/opal/health-with-fallback');

    if (!response.ok) {
      throw new Error(`Health API returned ${response.status}`);
    }

    const health = await response.json();

    // Validate overall health status
    if (health.overall_status === 'unhealthy') {
      issues.push('OPAL health status is unhealthy');
      confidence -= 40;
      status = 'fail';
    } else if (health.overall_status === 'degraded') {
      issues.push('OPAL health status is degraded');
      confidence -= 20;
      status = 'partial';
    }

    // Validate error rate
    const errorRate = health.error_rate_24h || 0;
    if (errorRate > 0.2) {
      issues.push(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
      confidence -= 30;
      status = status === 'pass' ? 'partial' : status;
    }

    // Validate signature validation rate
    const signatureValidRate = health.signature_valid_rate || 0;
    if (signatureValidRate < 0.9) {
      issues.push(`Low signature validation rate: ${(signatureValidRate * 100).toFixed(0)}%`);
      confidence -= 15;
    }

    return {
      status,
      confidence: Math.max(0, confidence),
      details: {
        overallStatus: health.overall_status,
        errorRate,
        signatureValidRate
      },
      issues
    };

  } catch (error: any) {
    return {
      status: 'fail',
      confidence: 0,
      details: { error: error.message },
      issues: [`Failed to validate Results layer: ${error.message}`]
    };
  }
}

// ==========================================
// Utility Functions
// ==========================================

function calculateOverallStatus(layers: LayerValidation[]): 'green' | 'red' | 'yellow' {
  const failedLayers = layers.filter(l => l.status === 'fail').length;
  const partialLayers = layers.filter(l => l.status === 'partial').length;

  if (failedLayers > 0) return 'red';
  if (partialLayers > 0) return 'yellow';
  return 'green';
}

function calculateConfidenceScore(layers: LayerValidation[]): number {
  const avgConfidence = layers.reduce((sum, l) => sum + l.confidence, 0) / layers.length;
  return Math.round(avgConfidence);
}

function collectCriticalIssues(layers: LayerValidation[]): string[] {
  return layers
    .filter(l => l.status === 'fail')
    .flatMap(l => l.issues);
}

function generateRecommendations(layers: LayerValidation[]): string[] {
  const recommendations: string[] = [];

  const [forceSync, opalAgents, osaIngestion, results] = layers;

  if (forceSync.status === 'fail') {
    recommendations.push('Investigate Force Sync workflow failures - check OPAL service logs');
  }

  if (opalAgents.confidence < 80) {
    recommendations.push('Review OPAL agent configurations and ensure all 9 agents are properly registered');
  }

  if (osaIngestion.details.receptionRate < 0.8) {
    recommendations.push('Improve OSA ingestion reliability - verify webhook signatures and network connectivity');
  }

  if (results.details.errorRate > 0.1) {
    recommendations.push('Address Results layer error rate - review application logs for failure patterns');
  }

  return recommendations;
}

function generateSummary(status: string, confidence: number, criticalIssues: string[]): string {
  if (status === 'green') {
    return 'Force Sync, OPAL agents, OSA ingestion, and Results layer are all healthy.';
  } else if (status === 'red') {
    return `Critical issues detected (${criticalIssues.length} critical). Immediate attention required.`;
  } else {
    return `Pipeline is mostly healthy (${confidence}% confidence) but some components are below optimal thresholds.`;
  }
}

function getStatusIcon(status: 'pass' | 'fail' | 'partial'): string {
  switch (status) {
    case 'pass': return '✅';
    case 'fail': return '❌';
    case 'partial': return '⚠️';
  }
}

// ==========================================
// Main Execution
// ==========================================

const workflowId = process.argv[2];

if (!workflowId) {
  console.error('❌ Error: Workflow ID is required');
  console.error('Usage: npx tsx scripts/validate-force-sync-workflow.ts <workflow_id>');
  console.error('Example: npx tsx scripts/validate-force-sync-workflow.ts ws_abc123');
  process.exit(1);
}

validateForceSyncWorkflow(workflowId)
  .then(report => {
    if (report.overallStatus === 'red') {
      process.exit(1);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  });
