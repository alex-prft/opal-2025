import { NextRequest, NextResponse } from 'next/server';
import { getAlertManager, initializeMonitoring, shutdownMonitoring } from '@/lib/monitoring/integration-alerts';
import { createEmailServiceFromEnv } from '@/lib/email/daily-report-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const alertManager = getAlertManager();

    switch (action) {
      case 'status':
        return NextResponse.json({
          status: 'operational',
          config: alertManager.getConfig(),
          active_alerts: alertManager.getActiveAlerts(),
          timestamp: new Date().toISOString()
        });

      case 'alerts':
        return NextResponse.json({
          active_alerts: alertManager.getActiveAlerts(),
          timestamp: new Date().toISOString()
        });

      case 'config':
        return NextResponse.json({
          config: alertManager.getConfig(),
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          status: 'operational',
          monitoring_enabled: alertManager.getConfig().enabled,
          active_alerts_count: alertManager.getActiveAlerts().length,
          timestamp: new Date().toISOString()
        });
    }

  } catch (error) {
    console.error('[Monitoring API] GET Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get monitoring status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;

    const alertManager = getAlertManager();

    switch (action) {
      case 'start':
        alertManager.startMonitoring();
        return NextResponse.json({
          success: true,
          message: 'Monitoring started successfully',
          config: alertManager.getConfig(),
          timestamp: new Date().toISOString()
        });

      case 'stop':
        alertManager.stopMonitoring();
        return NextResponse.json({
          success: true,
          message: 'Monitoring stopped successfully',
          timestamp: new Date().toISOString()
        });

      case 'restart':
        alertManager.stopMonitoring();
        alertManager.startMonitoring();
        return NextResponse.json({
          success: true,
          message: 'Monitoring restarted successfully',
          config: alertManager.getConfig(),
          timestamp: new Date().toISOString()
        });

      case 'update_config':
        if (!config) {
          return NextResponse.json(
            { error: 'Configuration object required for update_config action' },
            { status: 400 }
          );
        }
        
        alertManager.updateConfig(config);
        return NextResponse.json({
          success: true,
          message: 'Configuration updated successfully',
          config: alertManager.getConfig(),
          timestamp: new Date().toISOString()
        });

      case 'acknowledge_alert':
        const { alert_key } = body;
        if (!alert_key) {
          return NextResponse.json(
            { error: 'alert_key required for acknowledge_alert action' },
            { status: 400 }
          );
        }

        alertManager.acknowledgeAlert(alert_key);
        return NextResponse.json({
          success: true,
          message: `Alert ${alert_key} acknowledged successfully`,
          timestamp: new Date().toISOString()
        });

      case 'resolve_alert':
        const { alert_key: resolveKey } = body;
        if (!resolveKey) {
          return NextResponse.json(
            { error: 'alert_key required for resolve_alert action' },
            { status: 400 }
          );
        }

        alertManager.resolveAlert(resolveKey);
        return NextResponse.json({
          success: true,
          message: `Alert ${resolveKey} resolved successfully`,
          timestamp: new Date().toISOString()
        });

      case 'initialize':
        const initializedManager = initializeMonitoring(config);
        return NextResponse.json({
          success: true,
          message: 'Monitoring system initialized successfully',
          config: initializedManager.getConfig(),
          timestamp: new Date().toISOString()
        });

      case 'test_email':
        return await testEmailConfiguration();

      case 'daily_report_status':
        return NextResponse.json({
          success: true,
          daily_reports: {
            enabled: true,
            schedule: ['1:30 AM UTC', '9:30 AM UTC'],
            timezone: 'UTC',
            email_configured: !!process.env.REPORT_EMAIL_RECIPIENTS,
            last_report: null // Would track from database in production
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('[Monitoring API] POST Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process monitoring request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    shutdownMonitoring();
    
    return NextResponse.json({
      success: true,
      message: 'Monitoring system shutdown successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Monitoring API] DELETE Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to shutdown monitoring',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function testEmailConfiguration(): Promise<NextResponse> {
  try {
    const emailService = createEmailServiceFromEnv();
    
    if (!emailService) {
      return NextResponse.json({
        success: false,
        message: 'Email service not configured',
        details: 'Missing email configuration environment variables',
        configuration_guide: '/docs/daily-reports-setup.md'
      }, { status: 400 });
    }

    const testResult = await emailService.testEmailConfig();
    
    return NextResponse.json({
      success: testResult.success,
      message: testResult.message,
      email_provider: process.env.EMAIL_PROVIDER || 'webhook',
      recipients: (process.env.REPORT_EMAIL_RECIPIENTS || '').split(',').filter(Boolean),
      from_address: process.env.REPORT_EMAIL_FROM || 'Not configured',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Monitoring API] Email test error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Email test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}