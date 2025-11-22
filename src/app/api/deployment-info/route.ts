import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if we have Vercel token in environment
    const vercelToken = process.env.VERCEL_TOKEN || 'D2VBPpslUFVobw2W6S3VTuV6';

    if (!vercelToken) {
      // Fallback to build time if no token available
      const buildTime = process.env.BUILD_TIME || new Date().toISOString();
      return NextResponse.json({
        timestamp: buildTime,
        source: 'build-time',
        success: true
      });
    }

    // Fetch latest deployment from Vercel API
    const response = await fetch('https://api.vercel.com/v6/deployments?projectId=opal-2025&state=READY&target=production&limit=1', {
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Vercel API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.deployments && data.deployments.length > 0) {
      const latestDeployment = data.deployments[0];
      return NextResponse.json({
        timestamp: new Date(latestDeployment.createdAt).toISOString(),
        deploymentUrl: latestDeployment.url,
        source: 'vercel-api',
        success: true
      });
    }

    // Fallback if no deployments found
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      source: 'current-time',
      success: true
    });

  } catch (error) {
    console.error('Error fetching deployment info:', error);

    // Return fallback data on error
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      source: 'fallback',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}