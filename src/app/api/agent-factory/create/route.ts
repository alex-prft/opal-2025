/**
 * AI Agent Factory - Create Agent API Endpoint
 *
 * POST /api/agent-factory/create
 * Creates a new AI agent through the 6-phase workflow system
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { FactoryWorkflowEngine } from '../../../../../services/ai-agent-factory/src/orchestrator/factory-workflow-engine';
import { AgentRequirementsSchema } from '../../../../../services/ai-agent-factory/src/types';
import { supabase as secureSupabase } from '@/lib/database';

// Request validation schema
const CreateAgentRequestSchema = z.object({
  requirements: AgentRequirementsSchema,
  userId: z.string().optional(),
  projectId: z.string().optional(),
  interactiveMode: z.boolean().default(true)
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateAgentRequestSchema.parse(body);

    // Initialize workflow engine
    const workflowEngine = new FactoryWorkflowEngine({
      enableInteractiveMode: validatedData.interactiveMode,
      autoApprovalThreshold: 85,
      maxRetries: 3,
      timeoutPerPhase: 60,
      enableAuditLogging: true,
      complianceLevel: 'enterprise'
    });

    // Log the agent creation request
    console.log('🚀 [AgentFactory] Creating new agent', {
      agentName: validatedData.requirements.name,
      domain: validatedData.requirements.domain,
      complexity: validatedData.requirements.complexity,
      userId: validatedData.userId,
      timestamp: new Date().toISOString()
    });

    // Start the agent creation workflow (async)
    const agentCreationPromise = workflowEngine.createAgent(validatedData.requirements);

    // For interactive mode, return immediately with workflow status
    if (validatedData.interactiveMode) {
      // The workflow will be created and can be monitored via status endpoints
      const initialSpecification = await workflowEngine.getAgentStatus('pending-creation');
      
      return NextResponse.json({
        success: true,
        message: 'Agent creation workflow started successfully',
        data: {
          workflowId: 'workflow-' + Date.now(), // Would be actual workflow ID
          status: 'initializing',
          phase: 'clarification',
          interactiveMode: true,
          estimatedDuration: '4-6 hours',
          nextAction: 'Starting requirements clarification phase',
          monitoringEndpoint: '/api/agent-factory/status'
        }
      }, { status: 202 }); // Accepted
    }

    // For non-interactive mode, wait for completion (not recommended for production)
    try {
      const completedAgent = await agentCreationPromise;
      
      return NextResponse.json({
        success: true,
        message: 'Agent created successfully',
        data: {
          agent: {
            id: completedAgent.id,
            name: completedAgent.requirements.name,
            status: completedAgent.status,
            phase: completedAgent.currentPhase,
            createdAt: completedAgent.createdAt,
            completedAt: new Date().toISOString()
          },
          deliveryPackage: completedAgent.delivery ? {
            packagedAgent: completedAgent.delivery.packagedAgent,
            documentation: completedAgent.delivery.documentation,
            deploymentArtifacts: completedAgent.delivery.deploymentArtifacts
          } : null
        }
      });

    } catch (workflowError) {
      console.error('❌ [AgentFactory] Workflow execution failed', {
        error: (workflowError as Error).message,
        agentName: validatedData.requirements.name
      });

      return NextResponse.json({
        success: false,
        error: 'Agent creation workflow failed',
        details: (workflowError as Error).message,
        supportAction: 'Check workflow logs and contact support if needed'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ [AgentFactory] API endpoint error', {
      error: (error as Error).message,
      stack: (error as Error).stack
    });

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        })),
        example: {
          requirements: {
            name: 'Content Optimizer Agent',
            purpose: 'Optimize content performance for specific audiences',
            domain: 'content_optimization',
            complexity: 'medium',
            targetAudience: 'Marketing teams and content creators',
            specialRequirements: ['Real-time optimization', 'A/B testing integration'],
            integrationPoints: ['Optimizely', 'Google Analytics'],
            complianceLevel: 'enterprise'
          },
          interactiveMode: true
        }
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error ocurred while processing your agent creation request'
    }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}