/**
 * AI Agent Factory - Status API Endpoint
 *
 * GET /api/agent-factory/status?agentId=<id>
 * GET /api/agent-factory/status (list all agents for user)
 * Returns current status of agent creation workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { FactoryWorkflowEngine } from '../../../../../services/ai-agent-factory/src/orchestrator/factory-workflow-engine';
import { SupabaseFactoryClient } from '../../../../../services/ai-agent-factory/src/integration/supabase-factory-client';

// Query parameters validation
const StatusQuerySchema = z.object({
  agentId: z.string().optional(),
  userId: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'awaiting_approval', 'paused', 'completed', 'failed', 'cancelled']).optional(),
  phase: z.enum(['clarification', 'documentation', 'parallel_development', 'implementation', 'validation', 'delivery']).optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
  offset: z.coerce.number().min(0).default(0)
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = StatusQuerySchema.parse(queryParams);

    // Initialize clients
    const supabaseClient = new SupabaseFactoryClient();
    const workflowEngine = new FactoryWorkflowEngine();

    console.log('📊 [AgentFactory] Status request', {
      agentId: validatedQuery.agentId,
      userId: validatedQuery.userId,
      filters: {
        status: validatedQuery.status,
        phase: validatedQuery.phase
      }
    });

    // Single agent status request
    if (validatedQuery.agentId) {
      const specification = await workflowEngine.getAgentStatus(validatedQuery.agentId);
      
      if (!specification) {
        return NextResponse.json({
          success: false,
          error: 'Agent not found',
          message: `Agent with ID ${validatedQuery.agentId} does not exist`
        }, { status: 404 });
      }

      // Get approval status for current phase
      const approvalManager = new (await import('../../../../../services/ai-agent-factory/src/utils/approval-manager')).ApprovalManager(supabaseClient);
      const approvalStatus = await approvalManager.getApprovalStatus(specification.id, specification.currentPhase);

      // Get phase results
      const phaseResults = await supabaseClient.getPhaseResults(specification.id);

      return NextResponse.json({
        success: true,
        data: {
          agent: {
            id: specification.id,
            name: specification.requirements.name,
            status: specification.status,
            currentPhase: specification.currentPhase,
            createdAt: specification.createdAt,
            updatedAt: specification.updatedAt,
            createdBy: specification.createdBy
          },
          progress: {
            totalPhases: 6,
            completedPhases: phaseResults.filter(r => r.success).length,
            currentPhaseProgress: specification.status === 'in_progress' ? 50 : 
                                  ['completed', 'awaiting_approval'].includes(specification.status) ? 100 : 0,
            overallProgress: Math.round((phaseResults.filter(r => r.success).length / 6) * 100)
          },
          currentPhase: {
            phase: specification.currentPhase,
            status: specification.status,
            approvalStatus: approvalStatus.status,
            approvalRequired: approvalStatus.status === 'pending',
            reviewedBy: approvalStatus.reviewedBy,
            reviewedAt: approvalStatus.reviewedAt,
            feedback: approvalStatus.feedback
          },
          phaseHistory: phaseResults.map(result => ({
            phase: result.phase,
            success: result.success,
            confidenceScore: result.confidence_score,
            executionTime: result.execution_time_ms,
            completedAt: result.completed_at,
            errors: result.errors || [],
            warnings: result.warnings || []
          })),
          nextActions: generateNextActions(specification, approvalStatus),
          estimatedCompletion: calculateEstimatedCompletion(specification, phaseResults)
        }
      });
    }

    // List agents request
    const specifications = await supabaseClient.listSpecifications({
      status: validatedQuery.status,
      phase: validatedQuery.phase,
      createdBy: validatedQuery.userId,
      limit: validatedQuery.limit,
      offset: validatedQuery.offset
    });

    const agentSummaries = await Promise.all(
      specifications.map(async (spec) => {
        const phaseResults = await supabaseClient.getPhaseResults(spec.id);
        const approvalManager = new (await import('../../../../../services/ai-agent-factory/src/utils/approval-manager')).ApprovalManager(supabaseClient);
        const approvalStatus = await approvalManager.getApprovalStatus(spec.id, spec.currentPhase);

        return {
          id: spec.id,
          name: spec.requirements.name,
          domain: spec.requirements.domain,
          complexity: spec.requirements.complexity,
          status: spec.status,
          currentPhase: spec.currentPhase,
          progress: Math.round((phaseResults.filter(r => r.success).length / 6) * 100),
          approvalRequired: approvalStatus.status === 'pending',
          createdAt: spec.createdAt,
          updatedAt: spec.updatedAt,
          createdBy: spec.createdBy
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        agents: agentSummaries,
        pagination: {
          total: agentSummaries.length, // Would be actual total from database
          limit: validatedQuery.limit,
          offset: validatedQuery.offset,
          hasMore: agentSummaries.length === validatedQuery.limit
        },
        summary: {
          totalAgents: agentSummaries.length,
          byStatus: agentSummaries.reduce((acc, agent) => {
            acc[agent.status] = (acc[agent.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          pendingApprovals: agentSummaries.filter(a => a.approvalRequired).length
        }
      }
    });

  } catch (error) {
    console.error('❌ [AgentFactory] Status API error', {
      error: (error as Error).message,
      stack: (error as Error).stack
    });

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve agent status'
    }, { status: 500 });
  }
}

/**
 * Generate next actions based on current agent and approval status
 */
function generateNextActions(specification: any, approvalStatus: any): string[] {
  const actions = [];

  switch (specification.status) {
    case 'not_started':
      actions.push('Workflow will begin automatically');
      break;
    
    case 'in_progress':
      actions.push(`${specification.currentPhase} phase is currently executing`);
      break;
    
    case 'awaiting_approval':
      if (approvalStatus.status === 'pending') {
        actions.push(`Waiting for approval from ${approvalStatus.reviewedBy || 'eligible reviewers'}`);
        actions.push('Review phase results and provide approval');
      }
      break;
    
    case 'paused':
      actions.push('Workflow is paused - resume when ready');
      break;
    
    case 'completed':
      actions.push('Agent creation completed successfully');
      actions.push('Review delivery package and deploy');
      break;
    
    case 'failed':
      actions.push('Workflow failed - review errors and retry');
      break;
    
    case 'cancelled':
      actions.push('Workflow was cancelled');
      break;
  }

  return actions;
}

/**
 * Calculate estimated completion time based on current progress
 */
function calculateEstimatedCompletion(specification: any, phaseResults: any[]): string {
  const completedPhases = phaseResults.filter(r => r.success).length;
  const totalPhases = 6;
  const remainingPhases = totalPhases - completedPhases;

  if (specification.status === 'completed') {
    return 'Completed';
  }

  if (specification.status === 'failed' || specification.status === 'cancelled') {
    return 'N/A';
  }

  if (specification.status === 'awaiting_approval') {
    return 'Waiting for approval';
  }

  // Estimate based on average phase duration (45 minutes per phase)
  const averagePhaseMinutes = 45;
  const estimatedMinutes = remainingPhases * averagePhaseMinutes;

  if (estimatedMinutes < 60) {
    return `~${estimatedMinutes} minutes`;
  } else {
    const hours = Math.round(estimatedMinutes / 60 * 10) / 10;
    return `~${hours} hours`;
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}