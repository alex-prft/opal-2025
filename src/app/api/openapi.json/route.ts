/**
 * OpenAPI Specification Endpoint
 * Serves the OpenAPI YAML specification as JSON for Swagger UI and other tools
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export const runtime = 'nodejs';

/**
 * GET /api/openapi.json - Serve OpenAPI Specification
 *
 * Converts the YAML specification to JSON format for compatibility with
 * OpenAPI tools like Swagger UI, Postman, and API testing frameworks.
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📋 [OpenAPI] Specification requested');

    // Read the OpenAPI YAML file
    const yamlPath = path.join(process.cwd(), 'docs', 'openapi.yaml');
    const yamlContent = await fs.readFile(yamlPath, 'utf8');

    // Parse YAML to JavaScript object
    const openApiSpec = yaml.load(yamlContent) as any;

    // Add server URL based on request origin for dynamic server configuration
    const requestUrl = new URL(request.url);
    const serverUrl = `${requestUrl.protocol}//${requestUrl.host}`;

    // Update servers array to include current server
    if (openApiSpec.servers) {
      const currentServerExists = openApiSpec.servers.some((server: any) =>
        server.url === serverUrl
      );

      if (!currentServerExists) {
        openApiSpec.servers.unshift({
          url: serverUrl,
          description: 'Current Server'
        });
      }
    }

    // Add runtime information
    openApiSpec['x-generated-at'] = new Date().toISOString();
    openApiSpec['x-server-info'] = {
      node_version: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'development'
    };

    console.log('✅ [OpenAPI] Specification served successfully', {
      endpoints_documented: Object.keys(openApiSpec.paths || {}).length,
      schemas_defined: Object.keys(openApiSpec.components?.schemas || {}).length,
      server_url: serverUrl
    });

    // Return JSON with proper headers
    return new Response(JSON.stringify(openApiSpec, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('❌ [OpenAPI] Failed to serve specification:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      error: 'Failed to load OpenAPI specification',
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
 * OPTIONS /api/openapi.json - CORS Support
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