import { NextRequest, NextResponse } from 'next/server';
import { requireAuthentication, createAuthErrorResponse } from '@/lib/utils/auth';
import { opalDataStore } from '@/lib/opal/supabase-data-store';

/**
 * OPAL Admin: Reset Daily Rate Limit
 * Internal command: reset_opal
 */

export async function POST(request: NextRequest) {
  try {
    // Authenticate request with stricter admin validation
    const authResult = requireAuthentication(request);
    if (!authResult.isValid) {
      console.error('🚫 [Admin] Unauthorized reset attempt:', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(createAuthErrorResponse(authResult.error!), { status: 401 });
    }

    console.log('🔧 [Admin] Rate limit reset requested by authenticated user');

    // Force reset the daily limit by clearing database records
    const resetCount = await opalDataStore.forceResetDailyLimit();

    // Log the administrative action for audit trail
    console.log('✅ [Admin] Daily rate limit reset completed:', {
      resetCount,
      resetBy: 'admin-user',
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({
      success: true,
      message: 'Daily OPAL workflow rate limit has been reset',
      details: {
        command: 'reset_opal',
        resetCount,
        newLimit: 5,
        resetAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [Admin] Rate limit reset failed:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to reset rate limit',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = requireAuthentication(request);
    if (!authResult.isValid) {
      return NextResponse.json(createAuthErrorResponse(authResult.error!), { status: 401 });
    }

    // Get current rate limit status
    const canTrigger = await opalDataStore.canTriggerWorkflow();
    const latestWorkflow = await opalDataStore.getLatestWorkflow();

    return NextResponse.json({
      command: 'reset_opal',
      description: 'Reset daily OPAL workflow rate limit (5 per day)',
      currentStatus: {
        canTriggerWorkflow: canTrigger,
        dailyLimitReached: !canTrigger,
        lastWorkflow: latestWorkflow ? {
          workflow_id: latestWorkflow.workflow_id,
          status: latestWorkflow.status,
          started_at: latestWorkflow.started_at
        } : null
      },
      usage: {
        method: 'POST',
        endpoint: '/api/opal/admin/reset-limit',
        headers: {
          'Authorization': 'Bearer <admin-token>',
          'Content-Type': 'application/json'
        }
      }
    });

  } catch (error) {
    console.error('❌ [Admin] Rate limit status check failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check rate limit status'
    }, { status: 500 });
  }
}