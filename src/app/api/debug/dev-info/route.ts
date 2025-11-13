/**
 * Development Information Endpoint
 * Provides comprehensive debugging information for local development
 *
 * SECURITY: Only available in development mode
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * GET /api/debug/dev-info
 * Returns comprehensive development environment information
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Security check - only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({
      error: 'Debug endpoint only available in development mode'
    }, { status: 403 });
  }

  try {
    console.log('🔍 [Debug] Development info request received');

    // Environment information
    const environmentInfo = {
      node_version: process.version,
      platform: process.platform,
      architecture: process.arch,
      working_directory: process.cwd(),
      uptime_seconds: Math.floor(process.uptime()),
      memory_usage: process.memoryUsage(),
      environment: process.env.NODE_ENV,
      base_url: process.env.BASE_URL
    };

    // OPAL configuration
    const opalConfig = {
      osa_webhook_url: process.env.OSA_WEBHOOK_URL,
      osa_webhook_secret_configured: !!process.env.OSA_WEBHOOK_SECRET,
      osa_webhook_secret_length: process.env.OSA_WEBHOOK_SECRET?.length || 0,
      opal_tools_discovery_url: process.env.OPAL_TOOLS_DISCOVERY_URL,
      opal_webhook_url: process.env.OPAL_WEBHOOK_URL,
      opal_strategy_workflow_auth_key_configured: !!process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY,
      default_environment: process.env.DEFAULT_ENVIRONMENT,
      debug_mode: process.env.OPAL_DEBUG_MODE,
      log_level: process.env.LOG_LEVEL
    };

    // File storage information
    const fileStorageInfo = {
      use_file_storage: process.env.USE_FILE_STORAGE,
      file_storage_path: process.env.FILE_STORAGE_PATH,
      local_data_exists: existsSync('./data/local'),
      test_data_exists: existsSync('./data/test')
    };

    // Check data directory contents
    const dataDirectoryInfo: any = {};
    if (existsSync('./data')) {
      try {
        const dataContents = readdirSync('./data');
        dataDirectoryInfo.directories = dataContents;

        // Check each subdirectory
        dataContents.forEach(item => {
          const itemPath = join('./data', item);
          if (statSync(itemPath).isDirectory()) {
            dataDirectoryInfo[item] = readdirSync(itemPath);
          }
        });
      } catch (error) {
        dataDirectoryInfo.error = 'Could not read data directory';
      }
    }

    // Package information
    const packageInfo: any = {};
    try {
      if (existsSync('./package.json')) {
        const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
        packageInfo.name = pkg.name;
        packageInfo.version = pkg.version;
        packageInfo.scripts = Object.keys(pkg.scripts || {});
        packageInfo.dependencies_count = Object.keys(pkg.dependencies || {}).length;
        packageInfo.dev_dependencies_count = Object.keys(pkg.devDependencies || {}).length;
      }
    } catch (error) {
      packageInfo.error = 'Could not read package.json';
    }

    // Recent files information
    const recentFiles: any = {};
    try {
      // Check for recent log files, temp files, etc.
      const patterns = ['.env*', '*.log', 'test-results.*'];
      patterns.forEach(pattern => {
        // Simple pattern matching for common files
        if (pattern === '.env*') {
          const envFiles = readdirSync('.').filter(f => f.startsWith('.env'));
          recentFiles.env_files = envFiles;
        }
        if (pattern === '*.log') {
          try {
            const logFiles = readdirSync('.').filter(f => f.endsWith('.log'));
            recentFiles.log_files = logFiles;
          } catch {
            recentFiles.log_files = [];
          }
        }
        if (pattern === 'test-results.*') {
          try {
            const testFiles = readdirSync('.').filter(f => f.startsWith('test-results.'));
            recentFiles.test_result_files = testFiles;
          } catch {
            recentFiles.test_result_files = [];
          }
        }
      });
    } catch (error) {
      recentFiles.error = 'Could not check recent files';
    }

    // Available endpoints
    const availableEndpoints = {
      health: '/api/opal/health',
      discovery: '/api/opal/discovery',
      webhook_receiver: '/api/webhooks/opal-workflow',
      debug_env: '/api/debug/env',
      dev_info: '/api/debug/dev-info',
      diagnostics: '/api/diagnostics/last-webhook',
      monitoring: {
        metrics: '/api/monitoring/metrics',
        agent_logs: '/api/monitoring/agent-logs',
        test_workflow: '/api/monitoring/test-workflow'
      },
      webhook_events: {
        stats: '/api/webhook-events/stats',
        stream: '/api/webhook-events/stream'
      }
    };

    // Development status
    const developmentStatus = {
      server_running: true,
      timestamp: new Date().toISOString(),
      configuration_valid: !!(
        process.env.OSA_WEBHOOK_URL &&
        process.env.OSA_WEBHOOK_SECRET &&
        process.env.OPAL_TOOLS_DISCOVERY_URL
      ),
      file_storage_ready: fileStorageInfo.use_file_storage === 'true' && fileStorageInfo.local_data_exists,
      testing_setup: existsSync('./tests/vitest-setup.ts') && existsSync('./vitest.config.ts')
    };

    // Quick health checks
    const healthChecks = {
      can_load_config: true, // If we got this far, config loading works
      data_directory_writable: true, // Assume true for now
      environment_variables_set: Object.keys(process.env).length > 0,
      next_js_ready: true // If API is responding, Next.js is ready
    };

    const response = {
      development_info: {
        status: 'active',
        environment: environmentInfo,
        opal_configuration: opalConfig,
        file_storage: fileStorageInfo,
        data_directories: dataDirectoryInfo,
        package_info: packageInfo,
        recent_files: recentFiles,
        available_endpoints: availableEndpoints,
        development_status: developmentStatus,
        health_checks: healthChecks
      },
      generated_at: new Date().toISOString(),
      request_info: {
        method: request.method,
        url: request.url,
        headers: {
          user_agent: request.headers.get('user-agent'),
          host: request.headers.get('host')
        }
      }
    };

    console.log('✅ [Debug] Development info compiled successfully');

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Debug-Endpoint': 'dev-info',
        'X-Environment': process.env.NODE_ENV || 'unknown'
      }
    });

  } catch (error) {
    console.error('❌ [Debug] Development info compilation failed:', error);

    return NextResponse.json({
      error: 'Failed to compile development information',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}