import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/database/supabase-client';
import { OpalIntegrationValidator } from '@/lib/opal/integration-validator';

/**
 * OPAL Integration Validator API Route
 * Replaces Cloud Code implementation with Next.js API route
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      forceSyncWorkflowId, 
      opalCorrelationId, 
      tenantId,
      triggerType = 'manual' // 'manual', 'webhook', 'cron'
    } = body;

    if (!forceSyncWorkflowId) {
      return NextResponse.json(
        { success: false, error: 'forceSyncWorkflowId is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 [Integration Validator] Starting validation for workflow: ${forceSyncWorkflowId}`);
    console.log(`   Trigger: ${triggerType}, Correlation: ${opalCorrelationId}, Tenant: ${tenantId}`);

    // Initialize validator
    const validator = new OpalIntegrationValidator();
    
    // Perform validation
    const validationResult = await validator.validateWorkflow({
      forceSyncWorkflowId,
      opalCorrelationId,
      tenantId
    });

    console.log(`✅ [Integration Validator] Validation completed:`, {
      workflowId: forceSyncWorkflowId,
      status: validationResult.overallStatus,
      success: validationResult.success
    });

    // Return validation result
    return NextResponse.json({
      success: true,
      validation: validationResult,
      metadata: {
        triggerType,
        validatedAt: new Date().toISOString(),
        apiVersion: '1.0'
      }
    });

  } catch (error: any) {
    console.error('❌ [Integration Validator] Validation failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Validation failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Trigger validation for pending Force Sync runs
 * Used by cron jobs and scheduled tasks
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    const dryRun = searchParams.get('dryRun') === 'true';

    console.log(`🔍 [Integration Validator] Checking for pending validations (limit: ${limit}, dryRun: ${dryRun})`);

    const supabase = createSupabaseAdmin();
    
    // Get pending Force Sync runs that need validation
    const { data: pendingRuns, error } = await supabase
      .from('force_sync_runs')
      .select('force_sync_workflow_id, opal_correlation_id, tenant_id, created_at')
      .eq('status', 'completed')
      .eq('validation_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ [Integration Validator] Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pending runs' },
        { status: 500 }
      );
    }

    if (!pendingRuns || pendingRuns.length === 0) {
      console.log('✅ [Integration Validator] No pending validations found');
      return NextResponse.json({
        success: true,
        message: 'No pending validations found',
        pendingCount: 0,
        validatedCount: 0
      });
    }

    console.log(`📋 [Integration Validator] Found ${pendingRuns.length} pending validations`);

    if (dryRun) {
      return NextResponse.json({
        success: true,
        message: `Found ${pendingRuns.length} pending validations (dry run)`,
        pendingRuns: pendingRuns.map(run => ({
          workflowId: run.force_sync_workflow_id,
          correlationId: run.opal_correlation_id,
          tenantId: run.tenant_id,
          createdAt: run.created_at
        })),
        pendingCount: pendingRuns.length,
        validatedCount: 0
      });
    }

    // Validate each pending run
    const validator = new OpalIntegrationValidator();
    const results = [];

    for (const run of pendingRuns) {
      try {
        console.log(`🔄 [Integration Validator] Validating ${run.force_sync_workflow_id}...`);
        
        const validationResult = await validator.validateWorkflow({
          forceSyncWorkflowId: run.force_sync_workflow_id,
          opalCorrelationId: run.opal_correlation_id,
          tenantId: run.tenant_id
        });

        // Mark as validated in force_sync_runs table
        await supabase
          .from('force_sync_runs')
          .update({ 
            validation_status: 'validated', 
            updated_at: new Date().toISOString() 
          })
          .eq('force_sync_workflow_id', run.force_sync_workflow_id);

        results.push({
          workflowId: run.force_sync_workflow_id,
          status: validationResult.overallStatus,
          success: validationResult.success
        });

        console.log(`✅ [Integration Validator] Validated ${run.force_sync_workflow_id}: ${validationResult.overallStatus}`);

      } catch (error: any) {
        console.error(`❌ [Integration Validator] Failed to validate ${run.force_sync_workflow_id}:`, error);
        
        results.push({
          workflowId: run.force_sync_workflow_id,
          status: 'error',
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    console.log(`✅ [Integration Validator] Batch validation completed: ${successCount}/${results.length} successful`);

    return NextResponse.json({
      success: true,
      message: `Validated ${results.length} workflows`,
      pendingCount: pendingRuns.length,
      validatedCount: successCount,
      results
    });

  } catch (error: any) {
    console.error('❌ [Integration Validator] Batch validation failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Batch validation failed'
      },
      { status: 500 }
    );
  }
}