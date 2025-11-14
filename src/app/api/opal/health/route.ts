/**
 * Enhanced OPAL Health API Route
 * Always returns 200 with appropriate status and fallback data
 */

import { NextRequest, NextResponse } from 'next/server';
import { HealthService } from '@/lib/health/health-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const healthService = HealthService.getInstance();

  try {
    const healthData = await healthService.getHealth();

    // Always return 200 status code for monitoring compatibility
    return NextResponse.json({
      status: healthData.status,
      data: healthData,
      timestamp: new Date().toISOString(),
      cached: healthData.fallback_used || false
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Health-Status': healthData.status,
        'X-Fallback-Used': healthData.fallback_used ? 'true' : 'false'
      }
    });

  } catch (error) {
    console.error('Health API error:', error);

    // Try to get cached data as last resort
    const cachedData = healthService.getCached();

    if (cachedData) {
      return NextResponse.json({
        status: 'degraded',
        data: {
          ...cachedData,
          status: 'degraded',
          fallback_used: true
        },
        timestamp: new Date().toISOString(),
        cached: true,
        error: 'Health check failed, using cached data'
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Health-Status': 'degraded',
          'X-Fallback-Used': 'true'
        }
      });
    }

    // Absolute fallback - minimal health response
    return NextResponse.json({
      status: 'unhealthy',
      data: null,
      timestamp: new Date().toISOString(),
      cached: false,
      error: 'Health check completely failed, no cached data available'
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': 'unhealthy',
        'X-Fallback-Used': 'false'
      }
    });
  }
}

// Force refresh endpoint
export async function POST(request: NextRequest) {
  try {
    const healthService = HealthService.getInstance();
    const healthData = await healthService.forceRefresh();

    return NextResponse.json({
      status: healthData.status,
      data: healthData,
      timestamp: new Date().toISOString(),
      cached: false,
      message: 'Health data refreshed'
    }, {
      status: 200,
      headers: {
        'X-Health-Status': healthData.status,
        'X-Fallback-Used': 'false'
      }
    });

  } catch (error) {
    console.error('Health refresh error:', error);

    return NextResponse.json({
      status: 'error',
      data: null,
      timestamp: new Date().toISOString(),
      cached: false,
      error: 'Failed to refresh health data'
    }, {
      status: 500
    });
  }
}