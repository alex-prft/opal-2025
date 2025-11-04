import { NextRequest, NextResponse } from 'next/server';
import { requireAuthentication } from '@/lib/utils/auth';

/**
 * Debug endpoint to check environment variables
 * Only accessible with authentication
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate request
    const authResult = requireAuthentication(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const envCheck = {
      API_SECRET_KEY: process.env.API_SECRET_KEY ? 'present' : 'missing',
      ODP_API_KEY: process.env.ODP_API_KEY ? 'present' : 'missing',
      CMP_API_KEY: process.env.CMP_API_KEY ? 'present' : 'missing',
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'present' : 'missing',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'not set',
      NODE_ENV: process.env.NODE_ENV || 'not set'
    };

    const isDemoMode = !process.env.ODP_API_KEY || !process.env.CMP_API_KEY || !process.env.SENDGRID_API_KEY;

    return NextResponse.json({
      success: true,
      environment: envCheck,
      isDemoMode,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Debug endpoint failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}