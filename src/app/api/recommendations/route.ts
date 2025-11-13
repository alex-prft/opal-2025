/**
 * Decision Layer API: /api/recommendations
 *
 * Enterprise-grade recommendations endpoint that processes OPAL agent outputs
 * and provides intelligent decision-making with evidence, confidence, and impact/effort ranking.
 *
 * Built using Base API Handler for consistency with existing OPAL system.
 */

import { NextRequest } from 'next/server';
import { createApiHandler, rateLimitConfigs } from '@/lib/api/base-api-handler';
import {
  DecisionParametersSchema,
  RecommendationsResponseSchema,
  type DecisionParameters,
  type RecommendationsResponse
} from '@/lib/schemas/decision-layer-schemas';
import { RecommendationGenerator, WorkflowStateManager } from '@/lib/services/recommendation-generator';

// Create API handler with decision-specific configuration
const handler = createApiHandler({
  endpoint: '/api/recommendations',
  validation: {
    body: DecisionParametersSchema
  },
  rateLimit: {
    enabled: true,
    windowMs: 60000,    // 1 minute window
    maxRequests: 100,   // 100 requests per minute (custom for decision endpoints)
    keyGenerator: (req, ctx) => {
      // Rate limit per IP for anonymous users, could be per user ID when auth is added
      return `recommendations:${ctx.ip}`;
    }
  },
  requireAuth: false, // Set to true when authentication is implemented
  cors: true,
  compression: true
});

/**
 * POST /api/recommendations
 *
 * Generate intelligent recommendations based on workflow data and user preferences
 *
 * @param request - Contains DecisionParameters { workflow_id, preferences }
 * @returns RecommendationsResponse with evidence, confidence, and impact/effort analysis
 */
export async function POST(request: NextRequest) {
  return handler.handle(request, async (req, context, validated) => {
    const { body }: { body: DecisionParameters } = validated;

    // Log decision request for analytics
    console.log(`🧠 [Decision Layer] Generating recommendations for workflow: ${body.workflow_id}`, {
      correlation_id: context.correlationId,
      business_objectives: body.preferences.business_objectives,
      risk_tolerance: body.preferences.risk_tolerance,
      priority_weights: body.preferences.priority_weights
    });

    // Validate workflow exists (mock validation for now)
    const workflowValidation = await WorkflowStateManager.validateWorkflow(body.workflow_id);
    if (!workflowValidation.exists) {
      throw new Error(`Workflow ${body.workflow_id} not found`);
    }

    // Generate recommendations using enterprise decision logic
    const { recommendations, metadata } = await RecommendationGenerator.generateRecommendations(body);

    // Get current workflow state
    const workflowState = WorkflowStateManager.getWorkflowState(body.workflow_id);

    // Build standardized response
    const response: RecommendationsResponse = {
      workflow_id: body.workflow_id,
      workflow_state: workflowState,
      recommendations,
      metadata
    };

    // Validate response structure (ensures OpenAPI compliance)
    const validatedResponse = RecommendationsResponseSchema.parse(response);

    console.log(`✅ [Decision Layer] Generated ${recommendations.length} recommendations`, {
      correlation_id: context.correlationId,
      workflow_id: body.workflow_id,
      recommendations_count: recommendations.length,
      processing_time_ms: metadata.processing_time_ms,
      average_confidence: recommendations.length > 0
        ? Math.round((recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length) * 100) / 100
        : 0
    });

    return validatedResponse;
  });
}

/**
 * GET /api/recommendations
 *
 * Return API information and sample request/response for documentation
 */
export async function GET(request: NextRequest) {
  const sampleHandler = createApiHandler({
    endpoint: '/api/recommendations',
    rateLimit: rateLimitConfigs.lenient, // More lenient for documentation requests
    cors: true
  });

  return sampleHandler.handle(request, async (req, context, validated) => {
    const sampleRequest = {
      workflow_id: "wf-sample-123",
      preferences: {
        priority_weights: {
          impact: 0.7,
          effort: 0.3
        },
        risk_tolerance: "medium",
        business_objectives: ["conversion", "engagement"],
        timeline_constraints: {
          start_date: "2025-11-12T00:00:00Z",
          end_date: "2025-12-12T00:00:00Z"
        }
      }
    };

    const sampleResponse = {
      workflow_id: "wf-sample-123",
      workflow_state: "in-progress",
      recommendations: [
        {
          id: "rec-sample-1",
          title: "Optimize Call-to-Action Placement",
          description: "Move primary CTAs above the fold to increase visibility and conversions",
          impact: 8,
          effort: 3,
          combined_ratio: 2.67,
          confidence: 0.89,
          confidence_breakdown: {
            data_quality: 0.91,
            agent_consensus: 0.87
          },
          category: "High",
          evidence: [
            {
              agent_type: "content_review",
              data_source: "Content Management System",
              confidence: 0.91,
              timestamp: "2025-11-12T10:00:00Z",
              summary: "Content analysis identifies engagement improvement areas"
            },
            {
              agent_type: "customer_journey",
              data_source: "Journey Analytics",
              confidence: 0.87,
              timestamp: "2025-11-12T09:30:00Z",
              summary: "Journey mapping reveals friction points to address"
            }
          ],
          tags: ["CTA", "conversion optimization", "UX"],
          estimated_timeline: "2 weeks (2025-11-12 to 2025-11-26)",
          risk_level: "low"
        }
      ],
      metadata: {
        total_recommendations: 1,
        generated_at: "2025-11-12T15:45:00.000Z",
        processing_time_ms: 245,
        agent_data_freshness: {
          oldest_evidence: "2025-11-12T09:30:00Z",
          newest_evidence: "2025-11-12T10:00:00Z"
        }
      }
    };

    return {
      endpoint: "/api/recommendations",
      description: "Decision Layer API for generating intelligent recommendations based on OPAL agent outputs",
      version: "1.0.0",
      methods: {
        POST: {
          description: "Generate recommendations for a workflow",
          rate_limit: "100 requests per minute",
          authentication_required: false,
          request_schema: sampleRequest,
          response_schema: sampleResponse
        },
        GET: {
          description: "API documentation and sample data",
          rate_limit: "1000 requests per minute"
        }
      },
      features: [
        "Evidence-based recommendations from 9 OPAL agents",
        "Confidence scoring with breakdown",
        "Impact vs effort analysis",
        "Risk assessment and filtering",
        "Priority-based sorting",
        "Timeline estimation",
        "OpenAPI compliant responses"
      ],
      agent_types: [
        "experiment_blueprinter",
        "audience_suggester",
        "content_review",
        "roadmap_generator",
        "integration_health",
        "personalization_idea_generator",
        "cmp_organizer",
        "customer_journey",
        "geo_audit"
      ],
      business_objectives: [
        "conversion",
        "retention",
        "engagement",
        "acquisition",
        "revenue",
        "personalization",
        "experience",
        "performance"
      ],
      risk_tolerance_levels: ["low", "medium", "high"],
      sample_curl: `curl -X POST http://localhost:3000/api/recommendations \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(sampleRequest, null, 2).replace(/\n/g, '\\n  ')}'`
    };
  });
}

/**
 * OPTIONS /api/recommendations
 *
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  // The Base API Handler automatically handles OPTIONS requests
  return handler.handle(request, async () => ({}));
}