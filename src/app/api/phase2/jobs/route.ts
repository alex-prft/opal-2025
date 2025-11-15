// Phase 2: Background Job System Management API
// Controls scheduled cache validation, warming, and cross-page sync jobs

import { NextRequest, NextResponse } from 'next/server';
import { backgroundJobSystem } from '@/lib/jobs/background-job-system';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const jobId = searchParams.get('jobId');

    switch (action) {
      case 'status':
        // Get specific job status
        if (!jobId) {
          return NextResponse.json({
            success: false,
            error: 'jobId is required for status lookup'
          }, { status: 400 });
        }

        const jobStatus = await backgroundJobSystem.getJobStatus(jobId);
        return NextResponse.json({
          success: true,
          job_status: jobStatus,
          job_id: jobId
        });

      case 'stats':
        // Get job system statistics
        const stats = backgroundJobSystem.getJobSystemStatistics();
        return NextResponse.json({
          success: true,
          job_system_statistics: stats,
          system_running: backgroundJobSystem.isRunning()
        });

      default:
        return NextResponse.json({
          endpoint: 'Phase 2 Background Job System Management',
          description: 'Manage scheduled cache validation, warming, and cross-page sync',
          version: '2.0.0',
          system_running: backgroundJobSystem.isRunning(),
          available_jobs: {
            cache_validation: 'Validates cached content every 30 minutes',
            cache_warming: 'Pre-warms Tier 1 caches on startup and on-demand',
            cross_page_sync: 'Synchronizes cross-page consistency every 15 minutes'
          },
          actions: {
            'GET ?action=status&jobId=X': 'Get specific job status and next run time',
            'GET ?action=stats': 'Get job system statistics and active jobs',
            'POST action=start': 'Start the background job system',
            'POST action=stop': 'Stop the background job system',
            'POST action=trigger&jobType=X': 'Manually trigger a specific job type',
            'POST action=enable&jobType=X': 'Enable a specific job type',
            'POST action=disable&jobType=X': 'Disable a specific job type'
          },
          job_schedules: {
            cache_validation: '*/30 * * * * (every 30 minutes)',
            cross_page_sync: '*/15 * * * * (every 15 minutes)',
            cache_warming: 'on_startup + on_demand'
          }
        });
    }

  } catch (error) {
    console.error('❌ [Jobs API] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown jobs API error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, jobType } = body;

    switch (action) {
      case 'start':
        // Start the background job system
        if (backgroundJobSystem.isRunning()) {
          return NextResponse.json({
            success: true,
            message: 'Background job system is already running',
            system_status: 'running'
          });
        }

        console.log('🚀 [Jobs API] Starting background job system');
        await backgroundJobSystem.start();

        return NextResponse.json({
          success: true,
          message: 'Background job system started successfully',
          system_status: 'running',
          action: 'job_system_started'
        });

      case 'stop':
        // Stop the background job system
        if (!backgroundJobSystem.isRunning()) {
          return NextResponse.json({
            success: true,
            message: 'Background job system is already stopped',
            system_status: 'stopped'
          });
        }

        console.log('🛑 [Jobs API] Stopping background job system');
        await backgroundJobSystem.stop();

        return NextResponse.json({
          success: true,
          message: 'Background job system stopped successfully',
          system_status: 'stopped',
          action: 'job_system_stopped'
        });

      case 'trigger':
        // Manually trigger a specific job
        if (!jobType) {
          return NextResponse.json({
            success: false,
            error: 'jobType is required for manual job triggering',
            available_job_types: ['cache_validation', 'cache_warming', 'cross_page_sync']
          }, { status: 400 });
        }

        const validJobTypes = ['cache_validation', 'cache_warming', 'cross_page_sync'];
        if (!validJobTypes.includes(jobType)) {
          return NextResponse.json({
            success: false,
            error: `Invalid jobType: ${jobType}`,
            available_job_types: validJobTypes
          }, { status: 400 });
        }

        console.log(`🔄 [Jobs API] Manually triggering ${jobType}`);
        const jobResult = await backgroundJobSystem.triggerJob(jobType);

        return NextResponse.json({
          success: jobResult.success,
          message: `Job ${jobType} ${jobResult.success ? 'completed' : 'failed'}`,
          job_result: jobResult,
          action: 'job_manually_triggered'
        });

      case 'enable':
        // Enable a specific job type
        if (!jobType) {
          return NextResponse.json({
            success: false,
            error: 'jobType is required for job enable/disable'
          }, { status: 400 });
        }

        await backgroundJobSystem.enableJob(jobType, true);

        return NextResponse.json({
          success: true,
          message: `Job ${jobType} enabled successfully`,
          job_type: jobType,
          enabled: true,
          action: 'job_enabled'
        });

      case 'disable':
        // Disable a specific job type
        if (!jobType) {
          return NextResponse.json({
            success: false,
            error: 'jobType is required for job enable/disable'
          }, { status: 400 });
        }

        await backgroundJobSystem.enableJob(jobType, false);

        return NextResponse.json({
          success: true,
          message: `Job ${jobType} disabled successfully`,
          job_type: jobType,
          enabled: false,
          action: 'job_disabled'
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
          available_actions: ['start', 'stop', 'trigger', 'enable', 'disable']
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Jobs API] POST error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown job operation error'
    }, { status: 500 });
  }
}