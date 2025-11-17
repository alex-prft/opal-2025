import { NextRequest, NextResponse } from 'next/server';
import { forceSyncValidator } from '@/lib/webhook/force-sync-validator';

/**
 * Vercel Cron Job: Validate Pending Force Syncs
 * Runs every 10 minutes to check for completed Force Syncs that need validation
 */

export async function GET(request: NextRequest) {
  // Verify this is a cron request (Vercel adds this header)
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('🚫 [Cron] Unauthorized cron request detected');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  
  try {
    console.log('⏰ [Cron] Starting scheduled Force Sync validation job');

    // Get query parameters for configuration
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const dryRun = searchParams.get('dryRun') === 'true';

    if (dryRun) {
      console.log('🧪 [Cron] Running in dry-run mode');
    }

    // Validate pending workflows
    const result = await forceSyncValidator.validatePendingWorkflows(limit);

    const duration = Date.now() - startTime;
    
    if (!result.success) {
      console.error('❌ [Cron] Validation job failed:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error,
        duration,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    const summary = {
      success: true,
      processed: result.processed,
      successful: result.results.filter(r => r.success).length,
      failed: result.results.filter(r => !r.success).length,
      duration,
      timestamp: new Date().toISOString(),
      results: result.results
    };

    console.log('✅ [Cron] Validation job completed:', {
      processed: summary.processed,
      successful: summary.successful,
      failed: summary.failed,
      duration: `${duration}ms`
    });

    return NextResponse.json(summary);

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('❌ [Cron] Validation job crashed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Job execution failed',
      duration,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST endpoint for manual trigger (testing purposes)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { limit = 5, dryRun = false } = body;

    console.log('🔧 [Cron] Manual trigger received:', { limit, dryRun });

    const result = await forceSyncValidator.validatePendingWorkflows(limit);

    return NextResponse.json({
      success: true,
      message: 'Manual validation triggered',
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [Cron] Manual trigger failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Manual trigger failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}