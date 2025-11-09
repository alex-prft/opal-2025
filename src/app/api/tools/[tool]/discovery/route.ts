import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * BULLETPROOF OPAL Tool Discovery Endpoint
 * Addresses all sources of "'str' object has no attribute 'get'" errors
 *
 * Critical fixes:
 * - Comprehensive input validation
 * - Robust schema cleaning and transformation
 * - Proper error handling and logging
 * - OPAL-compatible JSON structure
 * - Type safety and edge case handling
 */

interface OPALFunction {
  name: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
  }>;
  endpoint: string;
  http_method: string;
}

interface OPALDiscoveryResponse {
  functions: OPALFunction[];
  name?: string;
  description?: string;
  version?: string;
}

interface ToolConfig {
  name?: string;
  description?: string;
  version?: string;
  tools?: Array<{
    name: string;
    description: string;
    input_schema?: any;
    parameters?: any;
  }>;
}

const TOOL_MAPPINGS: Record<string, string> = {
  'workflow': 'workflow_data_sharing.json',
  'odp': 'osa_odp_tools.json',
  'contentrecs': 'osa_contentrecs_tools.json',
  'webx': 'osa_webx_tools.json',
  'cmp': 'osa_cmp_tools.json',
  'cmspaas': 'osa_cmspaas_tools.json'
};

/**
 * Convert JSON Schema to OPAL parameter array format
 * OPAL expects: [{"name": "param1", "type": "string", "description": "...", "required": true}]
 * Not: {"type": "object", "properties": {...}, "required": [...]}
 */
function createOPALParameterArray(schema: any): Array<{name: string, type: string, description: string, required: boolean}> {
  const parameters: Array<{name: string, type: string, description: string, required: boolean}> = [];

  if (!schema || typeof schema !== 'object' || !schema.properties) {
    return parameters;
  }

  const properties = schema.properties;
  const requiredFields = Array.isArray(schema.required) ? schema.required : [];

  for (const [propName, propDef] of Object.entries(properties)) {
    if (typeof propDef === 'object' && propDef !== null) {
      const param = propDef as any;

      parameters.push({
        name: propName,
        type: param.type || 'string',
        description: param.description || `${propName} parameter`,
        required: requiredFields.includes(propName)
      });
    }
  }

  return parameters;
}

/**
 * Transform tool definition to OPAL function format with comprehensive error prevention
 */
function transformToOPALFunction(tool: any): OPALFunction | null {
  try {
    // Validate required fields
    if (!tool || typeof tool !== 'object') {
      console.warn('Invalid tool object:', tool);
      return null;
    }

    if (!tool.name || typeof tool.name !== 'string') {
      console.warn('Tool missing valid name:', tool);
      return null;
    }

    if (!tool.description || typeof tool.description !== 'string') {
      console.warn('Tool missing valid description:', tool);
      return null;
    }

    // Get schema from either input_schema or parameters field
    const rawSchema = tool.input_schema || tool.parameters;
    const parametersArray = createOPALParameterArray(rawSchema);

    return {
      name: tool.name,
      description: tool.description,
      parameters: parametersArray,
      endpoint: `/tools/${tool.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      http_method: "POST"
    };
  } catch (error) {
    console.error('Error transforming tool to OPAL function:', error, tool);
    return null;
  }
}

/**
 * Validate tool configuration structure
 */
function validateToolConfig(config: any): ToolConfig | null {
  try {
    if (!config || typeof config !== 'object') {
      return null;
    }

    // Ensure tools array exists and is valid
    if (!Array.isArray(config.tools)) {
      console.warn('Tool config missing valid tools array:', config);
      return null;
    }

    return {
      name: typeof config.name === 'string' ? config.name : 'Unknown Tool',
      description: typeof config.description === 'string' ? config.description : 'Tool description',
      version: typeof config.version === 'string' ? config.version : '1.0.0',
      tools: config.tools
    };
  } catch (error) {
    console.error('Error validating tool config:', error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tool: string }> }
) {
  let toolParam: string = '';

  try {
    const resolvedParams = await params;
    toolParam = resolvedParams.tool;

    console.log(`[OPAL Discovery] Processing request for tool: ${toolParam}`);

    // Validate tool parameter
    if (!toolParam || typeof toolParam !== 'string') {
      console.error('[OPAL Discovery] Invalid tool parameter:', toolParam);
      return NextResponse.json(
        {
          error: 'Invalid tool parameter',
          message: 'Tool parameter must be a valid string',
          available_tools: Object.keys(TOOL_MAPPINGS)
        },
        { status: 400 }
      );
    }

    // Check if tool exists in mappings
    const toolFile = TOOL_MAPPINGS[toolParam];
    if (!toolFile) {
      console.error('[OPAL Discovery] Unknown tool requested:', toolParam);
      return NextResponse.json(
        {
          error: `Unknown tool: ${toolParam}`,
          available_tools: Object.keys(TOOL_MAPPINGS)
        },
        { status: 404 }
      );
    }

    // Validate file exists
    const toolPath = join(process.cwd(), 'opal-config', 'opal-tools', toolFile);
    if (!existsSync(toolPath)) {
      console.error('[OPAL Discovery] Tool config file not found:', toolPath);
      return NextResponse.json(
        {
          error: 'Tool configuration not found',
          message: `Configuration file for ${toolParam} does not exist`,
          tool: toolParam
        },
        { status: 404 }
      );
    }

    // Read and parse tool configuration
    let toolConfig: ToolConfig;
    try {
      const configContent = readFileSync(toolPath, 'utf8');
      const rawConfig = JSON.parse(configContent);
      const validatedConfig = validateToolConfig(rawConfig);

      if (!validatedConfig) {
        throw new Error('Invalid tool configuration structure');
      }

      toolConfig = validatedConfig;
      console.log(`[OPAL Discovery] Successfully loaded config for ${toolParam}`, {
        toolCount: toolConfig.tools?.length || 0,
        name: toolConfig.name
      });
    } catch (parseError) {
      console.error('[OPAL Discovery] Failed to parse tool config:', parseError);
      return NextResponse.json(
        {
          error: 'Invalid tool configuration',
          message: parseError instanceof Error ? parseError.message : 'Configuration parsing failed',
          tool: toolParam
        },
        { status: 500 }
      );
    }

    // Transform tools to OPAL functions
    const functions: OPALFunction[] = [];

    for (const tool of toolConfig.tools || []) {
      const opalFunction = transformToOPALFunction(tool);
      if (opalFunction) {
        functions.push(opalFunction);
      } else {
        console.warn(`[OPAL Discovery] Skipped invalid tool: ${tool?.name || 'unknown'}`);
      }
    }

    if (functions.length === 0) {
      console.warn(`[OPAL Discovery] No valid functions found for ${toolParam}`);
      return NextResponse.json(
        {
          error: 'No valid functions found',
          message: 'Tool configuration contains no valid function definitions',
          tool: toolParam
        },
        { status: 500 }
      );
    }

    // Create bulletproof OPAL response
    const discoveryResponse: OPALDiscoveryResponse = {
      functions: functions,
      name: toolConfig.name,
      description: toolConfig.description,
      version: toolConfig.version
    };

    console.log(`[OPAL Discovery] Successfully generated response for ${toolParam}`, {
      functionCount: functions.length,
      functionNames: functions.map(f => f.name)
    });

    return NextResponse.json(discoveryResponse, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'no-cache, no-store, must-revalidate' // Disable all caching for OPAL compatibility
      }
    });

  } catch (error) {
    console.error(`[OPAL Discovery] Unexpected error for tool ${toolParam}:`, error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        tool: toolParam || 'unknown',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Robust CORS handler
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400' // 24 hours
    }
  });
}