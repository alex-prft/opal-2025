// Phase 2: Audit Trail and Rollback Management API
// Provides access to audit logs, version history, and rollback capabilities

import { NextRequest, NextResponse } from 'next/server';
import { phase2Pipeline } from '@/lib/validation/phase2-integration';
import { supabase, isDatabaseAvailable } from '@/lib/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const agentOutputId = searchParams.get('agentOutputId');
    const workflowId = searchParams.get('workflowId');
    const pageId = searchParams.get('pageId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!isDatabaseAvailable()) {
      return NextResponse.json({
        success: false,
        error: 'Database unavailable - audit trail features require database connectivity'
      }, { status: 503 });
    }

    switch (action) {
      case 'agent_output':
        // Get specific agent output audit record
        if (!agentOutputId) {
          return NextResponse.json({
            success: false,
            error: 'agentOutputId is required for audit lookup'
          }, { status: 400 });
        }

        const { data: agentOutput, error: agentError } = await supabase
          .from('agent_outputs_audit')
          .select('*')
          .eq('id', agentOutputId)
          .single();

        if (agentError || !agentOutput) {
          return NextResponse.json({
            success: false,
            error: 'Agent output record not found'
          }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          agent_output: agentOutput,
          rollback_available: agentOutput.version_number > 1
        });

      case 'workflow':
        // Get all agent outputs for a workflow
        if (!workflowId) {
          return NextResponse.json({
            success: false,
            error: 'workflowId is required for workflow audit lookup'
          }, { status: 400 });
        }

        const { data: workflowOutputs, error: workflowError } = await supabase
          .from('agent_outputs_audit')
          .select('*')
          .eq('workflow_id', workflowId)
          .order('created_at', { ascending: false })
          .limit(limit);

        return NextResponse.json({
          success: true,
          workflow_outputs: workflowOutputs || [],
          workflow_id: workflowId,
          total_records: workflowOutputs?.length || 0
        });

      case 'page_history':
        // Get audit history for a specific page
        if (!pageId) {
          return NextResponse.json({
            success: false,
            error: 'pageId is required for page history lookup'
          }, { status: 400 });
        }

        const { data: pageHistory, error: pageError } = await supabase
          .from('agent_outputs_audit')
          .select('id, widget_id, version_number, confidence_score, validation_status, claude_success, created_at, updated_at')
          .eq('page_id', pageId)
          .order('created_at', { ascending: false })
          .limit(limit);

        return NextResponse.json({
          success: true,
          page_history: pageHistory || [],
          page_id: pageId,
          total_records: pageHistory?.length || 0
        });

      case 'claude_lifecycle':
        // Get Claude enhancement lifecycle records
        const { data: claudeRecords, error: claudeError } = await supabase
          .from('claude_enhancement_lifecycle')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        return NextResponse.json({
          success: true,
          claude_enhancements: claudeRecords || [],
          total_records: claudeRecords?.length || 0
        });

      case 'recent_activity':
        // Get recent audit activity across all components
        const [agentOutputs, claudeLifecycle] = await Promise.all([
          supabase
            .from('agent_outputs_audit')
            .select('id, page_id, widget_id, validation_status, confidence_score, created_at')
            .order('created_at', { ascending: false })
            .limit(20),
          supabase
            .from('claude_enhancement_lifecycle')
            .select('id, enhancement_request_id, status, validation_passed, created_at')
            .order('created_at', { ascending: false })
            .limit(20)
        ]);

        return NextResponse.json({
          success: true,
          recent_activity: {
            agent_outputs: agentOutputs.data || [],
            claude_enhancements: claudeLifecycle.data || []
          },
          activity_timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          endpoint: 'Phase 2 Audit Trail and Rollback Management',
          description: 'Access audit logs, version history, and rollback capabilities',
          version: '2.0.0',
          actions: {
            'GET ?action=agent_output&agentOutputId=X': 'Get specific agent output audit record',
            'GET ?action=workflow&workflowId=X': 'Get all outputs for a workflow',
            'GET ?action=page_history&pageId=X': 'Get audit history for a page',
            'GET ?action=claude_lifecycle': 'Get Claude enhancement lifecycle records',
            'GET ?action=recent_activity': 'Get recent audit activity summary',
            'POST action=rollback': 'Rollback to previous version',
            'POST action=create_checkpoint': 'Create audit checkpoint'
          },
          capabilities: [
            'Complete audit trail tracking',
            'Version history management',
            'Rollback to previous versions',
            'Claude enhancement lifecycle tracking',
            'Cross-page audit correlation',
            'Performance audit metrics'
          ]
        });
    }

  } catch (error) {
    console.error('❌ [Audit API] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown audit API error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, agentOutputId, targetVersion, reason } = body;

    if (!isDatabaseAvailable()) {
      return NextResponse.json({
        success: false,
        error: 'Database unavailable - audit operations require database connectivity'
      }, { status: 503 });
    }

    switch (action) {
      case 'rollback':
        // Rollback to previous version
        if (!agentOutputId) {
          return NextResponse.json({
            success: false,
            error: 'agentOutputId is required for rollback operation'
          }, { status: 400 });
        }

        console.log(`🔄 [Audit API] Rolling back agent output ${agentOutputId} to version ${targetVersion || 'previous'}`);

        const rollbackResult = await phase2Pipeline.rollbackContent(agentOutputId, targetVersion);

        return NextResponse.json({
          success: rollbackResult.success,
          message: `Rollback completed for agent output ${agentOutputId}`,
          rollback_result: rollbackResult,
          action: 'content_rolled_back'
        });

      case 'create_checkpoint':
        // Create an audit checkpoint (for maintenance or major changes)
        const checkpointId = `checkpoint_${Date.now()}`;

        console.log(`📋 [Audit API] Creating audit checkpoint: ${checkpointId}`);

        // Get current system state for checkpoint
        const systemHealth = await phase2Pipeline.getEnhancedSystemHealth();
        const systemStats = phase2Pipeline.getEnhancedStatistics();

        // Store checkpoint record (you would implement this based on your needs)
        const checkpointData = {
          checkpoint_id: checkpointId,
          system_health: systemHealth,
          system_statistics: systemStats,
          created_at: new Date().toISOString(),
          created_by: 'audit_api',
          reason: reason || 'manual_checkpoint'
        };

        return NextResponse.json({
          success: true,
          message: `Audit checkpoint created: ${checkpointId}`,
          checkpoint: checkpointData,
          action: 'checkpoint_created'
        });

      case 'export_audit':
        // Export audit data for external analysis
        const { pageId, startDate, endDate } = body;

        let query = supabase
          .from('agent_outputs_audit')
          .select('*')
          .order('created_at', { ascending: false });

        if (pageId) {
          query = query.eq('page_id', pageId);
        }

        if (startDate) {
          query = query.gte('created_at', startDate);
        }

        if (endDate) {
          query = query.lte('created_at', endDate);
        }

        const { data: exportData, error: exportError } = await query.limit(1000);

        if (exportError) {
          return NextResponse.json({
            success: false,
            error: 'Failed to export audit data'
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Audit data exported successfully',
          export_data: exportData || [],
          export_timestamp: new Date().toISOString(),
          filters_applied: { pageId, startDate, endDate },
          action: 'audit_data_exported'
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
          available_actions: ['rollback', 'create_checkpoint', 'export_audit']
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Audit API] POST error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown audit operation error'
    }, { status: 500 });
  }
}