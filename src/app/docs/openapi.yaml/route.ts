/**
 * OpenAPI YAML File Server
 * Serves the raw OpenAPI YAML specification file
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

/**
 * GET /docs/openapi.yaml - Serve Raw OpenAPI YAML
 *
 * Serves the OpenAPI specification in YAML format for tools that prefer
 * the original YAML format over JSON conversion.
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📋 [OpenAPI] YAML specification requested');

    // Read the OpenAPI YAML file
    const yamlPath = path.join(process.cwd(), 'docs', 'openapi.yaml');
    const yamlContent = await fs.readFile(yamlPath, 'utf8');

    console.log('✅ [OpenAPI] YAML specification served successfully');

    // Return YAML with proper headers
    return new Response(yamlContent, {
      headers: {
        'Content-Type': 'application/x-yaml',
        'Content-Disposition': 'inline; filename="openapi.yaml"',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('❌ [OpenAPI] Failed to serve YAML specification:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      error: 'Failed to load OpenAPI YAML specification',
      message: errorMessage,
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
}

/**
 * OPTIONS /docs/openapi.yaml - CORS Support
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400' // 24 hours
    }
  });
}