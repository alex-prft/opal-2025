import { NextRequest, NextResponse } from 'next/server';
import { getMappingData } from '@/lib/mapping-utils';
import { getAuditReport } from '@/lib/mapping-audit';
import fs from 'fs';
import path from 'path';

/**
 * Read content blueprint configuration
 */
async function getContentBlueprint() {
  try {
    const blueprintPath = path.join(process.cwd(), 'opal-config', 'content_blueprint.json');
    const blueprintContent = fs.readFileSync(blueprintPath, 'utf-8');
    return JSON.parse(blueprintContent);
  } catch (error) {
    console.error('Error reading content blueprint:', error);
    return {};
  }
}

/**
 * Read results roadmap configuration
 */
async function getResultsRoadmap() {
  try {
    const roadmapPath = path.join(process.cwd(), 'opal-config', 'results_roadmap.json');
    const roadmapContent = fs.readFileSync(roadmapPath, 'utf-8');
    return JSON.parse(roadmapContent);
  } catch (error) {
    console.error('Error reading results roadmap:', error);
    return [];
  }
}

/**
 * Get simplified integration status from existing health endpoint
 */
async function getIntegrationStatus() {
  try {
    // Use the existing comprehensive health check
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const healthResponse = await fetch(`${baseUrl}/api/opal/health`, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }

    const healthData = await healthResponse.json();

    // Transform to simplified format for admin dashboard
    return {
      sdk_status: healthData.overall_status === 'green' ? 'connected' :
                 healthData.overall_status === 'yellow' ? 'connected' : 'disconnected',
      api_key: healthData.config_checks?.osa_webhook_secret_configured ? 'valid' : 'missing',
      webhook: healthData.overall_status === 'green' ? 'healthy' :
               healthData.overall_status === 'yellow' ? 'healthy' : 'unhealthy',
      sse: healthData.metrics?.uptime_indicators?.webhook_receiver_responding ? 'active' : 'inactive',
      detailed_status: healthData
    };
  } catch (error) {
    console.error('Error getting integration status:', error);

    // Fallback to environment variable checks
    return {
      sdk_status: process.env.OPAL_API_KEY ? 'connected' : 'disconnected',
      api_key: process.env.OPAL_API_KEY && !process.env.OPAL_API_KEY.includes('placeholder') ? 'valid' : 'missing',
      webhook: process.env.OPAL_WEBHOOK_URL && !process.env.OPAL_WEBHOOK_URL.includes('placeholder') ? 'healthy' : 'unhealthy',
      sse: process.env.BASE_URL ? 'active' : 'inactive',
      detailed_status: null
    };
  }
}

/**
 * GET /api/admin/mapping-status
 * Central endpoint combining all admin dashboard data
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Fetch all data in parallel for better performance
    const [
      mappingData,
      auditReport,
      contentBlueprint,
      resultsRoadmap,
      integrationStatus
    ] = await Promise.all([
      getMappingData(),
      getAuditReport(),
      getContentBlueprint(),
      getResultsRoadmap(),
      getIntegrationStatus()
    ]);

    // Combine into unified response
    const response = {
      mapping_table: mappingData.mapping_table,
      content_blueprint: contentBlueprint,
      integration_status: integrationStatus,
      results_roadmap: resultsRoadmap,
      mapping_validation_summary: {
        missing_tier3: auditReport.issues.missingTier3.length,
        agent_gaps: auditReport.issues.agentGaps.length,
        endpoint_gaps: 0, // Endpoints are auto-generated
        total_sections: auditReport.total_sections,
        complete_mappings: mappingData.validation_summary.complete_mappings,
        partial_mappings: mappingData.validation_summary.partial_mappings,
        missing_mappings: mappingData.validation_summary.missing_mappings
      },
      audit_details: {
        issues_found: auditReport.issues,
        recommendations: auditReport.recommendations
      },
      generated_at: new Date().toISOString()
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error in mapping-status endpoint:', error);

    return NextResponse.json(
      {
        error: 'Failed to retrieve mapping status',
        message: error instanceof Error ? error.message : 'Unknown error',
        mapping_table: [],
        content_blueprint: {},
        integration_status: {
          sdk_status: 'error',
          api_key: 'error',
          webhook: 'error',
          sse: 'error'
        },
        results_roadmap: [],
        mapping_validation_summary: {
          missing_tier3: 0,
          agent_gaps: 0,
          endpoint_gaps: 0,
          total_sections: 0,
          complete_mappings: 0,
          partial_mappings: 0,
          missing_mappings: 0
        },
        generated_at: new Date().toISOString()
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
}

/**
 * POST /api/admin/mapping-status
 * Force refresh of mapping status (clears any caches)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Same as GET but could include cache clearing logic if needed
  return GET(request);
}