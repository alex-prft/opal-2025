import { NextRequest, NextResponse } from 'next/server';
import { auditAndFixMapping } from '@/lib/mapping-audit';

/**
 * POST /api/admin/fix-mapping
 * Apply auto-fix rules and generate corrected mapping file
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🔧 [Admin] Starting mapping fix process...');

    // Execute the audit and fix process
    const fixResult = await auditAndFixMapping();

    console.log('✅ [Admin] Mapping fix completed successfully:', {
      fixed_file: fixResult.fixed_file_path,
      missing_tier3_fixed: fixResult.summary.missing_tier3_fixed,
      agent_gaps_fixed: fixResult.summary.agent_gaps_fixed,
      total_sections: fixResult.summary.total_sections_checked
    });

    return NextResponse.json(
      {
        success: true,
        fixed_file_path: fixResult.fixed_file_path,
        summary: fixResult.summary,
        issues_found: fixResult.issues_found,
        message: `Successfully fixed ${fixResult.summary.missing_tier3_fixed} tier3 mappings and ${fixResult.summary.agent_gaps_fixed} agent gaps`,
        generated_at: new Date().toISOString()
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );

  } catch (error) {
    console.error('❌ [Admin] Mapping fix failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Mapping fix failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        summary: {
          total_sections_checked: 0,
          missing_tier3_fixed: 0,
          agent_gaps_fixed: 0,
          endpoint_gaps_fixed: 0
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
 * GET /api/admin/fix-mapping
 * Preview what would be fixed without actually applying changes
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Import the audit function to preview changes
    const { auditMapping } = await import('@/lib/mapping-audit');
    const { mapping, issues } = await auditMapping();

    const previewSummary = {
      total_sections: Object.values(mapping).reduce((acc, tier1) => acc + Object.keys(tier1).length, 0),
      missing_tier3_count: issues.missingTier3.length,
      agent_gaps_count: issues.agentGaps.length,
      would_fix: {
        tier3_mappings: issues.missingTier3.map(issue => `${issue.tier1} → ${issue.tier2}`),
        agent_assignments: issues.agentGaps.map(gap => ({
          section: `${gap.tier1} → ${gap.tier2}`,
          missing_agents: gap.missing
        }))
      }
    };

    return NextResponse.json(
      {
        preview: true,
        summary: previewSummary,
        issues_found: issues,
        message: issues.missingTier3.length === 0 && issues.agentGaps.length === 0
          ? 'No issues found - mapping is complete'
          : `Found ${issues.missingTier3.length} missing tier3 mappings and ${issues.agentGaps.length} agent gaps`,
        generated_at: new Date().toISOString()
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );

  } catch (error) {
    console.error('❌ [Admin] Mapping preview failed:', error);

    return NextResponse.json(
      {
        preview: true,
        error: 'Preview failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        generated_at: new Date().toISOString()
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}