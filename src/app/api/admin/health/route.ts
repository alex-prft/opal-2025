// System Health Check for Data Governance
// Provides comprehensive health status for all governance components

import { NextRequest, NextResponse } from 'next/server';
import { PIIScanner } from '@/lib/security/pii-scanner';
import { auditLogger } from '@/lib/security/audit-logger';
import { purgeManager } from '@/lib/security/purge-manager';
import { sessionManager } from '@/lib/security/session-manager';
import { opalGovernance } from '@/lib/opal/governance-integration';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const healthChecks = await Promise.allSettled([
      checkPIIScanner(),
      checkAuditLogger(),
      checkPurgeManager(),
      checkSessionManager(),
      checkOPALIntegration(),
      checkDatabaseConnection(),
      checkEnvironmentConfig()
    ]);

    const results = healthChecks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          component: getComponentName(index),
          status: 'error',
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
        };
      }
    });

    const allHealthy = results.every(result => result.status === 'healthy' || result.status === 'operational');
    const hasErrors = results.some(result => result.status === 'error');
    const hasWarnings = results.some(result => result.status === 'warning' || result.status === 'degraded');

    let overallStatus = 'healthy';
    if (hasErrors) overallStatus = 'error';
    else if (hasWarnings) overallStatus = 'degraded';

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      response_time_ms: Date.now() - startTime,
      data_governance: {
        enabled: process.env.DATA_GOVERNANCE_ENABLED === 'true',
        features: {
          pii_scanning: process.env.PII_SCANNING_ENABLED === 'true',
          audit_logging: process.env.AUDIT_LOGGING_ENABLED === 'true',
          workflow_purging: process.env.WORKFLOW_PURGING_ENABLED === 'true',
          session_auditing: process.env.SESSION_AUDIT_ENABLED === 'true'
        }
      },
      components: results,
      recommendations: generateHealthRecommendations(results)
    };

    // Log health check
    if (process.env.AUDIT_LOGGING_ENABLED === 'true') {
      await auditLogger.logSecurityEvent({
        event_type: 'HEALTH_CHECK_PERFORMED',
        event_data: {
          overall_status: overallStatus,
          response_time_ms: Date.now() - startTime,
          components_checked: results.length
        },
        threat_level: 'low'
      });
    }

    return NextResponse.json(response);

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      response_time_ms: Date.now() - startTime,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function checkPIIScanner(): Promise<any> {
  try {
    // Test PII scanner with known patterns
    const testData = 'This is test data with no PII';
    const scanResult = PIIScanner.scanText(testData, 'health_check');

    const testPII = 'Test email: test@example.com';
    const piiResult = PIIScanner.scanText(testPII, 'health_check');

    return {
      component: 'pii_scanner',
      status: 'operational',
      details: {
        scanner_functional: true,
        test_scan_violations: scanResult.length,
        pii_detection_working: piiResult.length > 0,
        enabled: process.env.PII_SCANNING_ENABLED === 'true'
      }
    };

  } catch (error) {
    return {
      component: 'pii_scanner',
      status: 'error',
      error: error instanceof Error ? error.message : 'PII scanner check failed'
    };
  }
}

async function checkAuditLogger(): Promise<any> {
  try {
    const healthMetrics = await auditLogger.getHealthMetrics();

    return {
      component: 'audit_logger',
      status: healthMetrics ? 'operational' : 'degraded',
      details: {
        metrics_available: !!healthMetrics,
        enabled: process.env.AUDIT_LOGGING_ENABLED === 'true',
        recent_events: healthMetrics?.total_events_24h || 0
      }
    };

  } catch (error) {
    return {
      component: 'audit_logger',
      status: 'error',
      error: error instanceof Error ? error.message : 'Audit logger check failed'
    };
  }
}

async function checkPurgeManager(): Promise<any> {
  try {
    const purgeStatus = await purgeManager.getPurgeStatus();

    return {
      component: 'purge_manager',
      status: 'operational',
      details: {
        policies_configured: purgeStatus?.length || 0,
        enabled: process.env.WORKFLOW_PURGING_ENABLED === 'true'
      }
    };

  } catch (error) {
    return {
      component: 'purge_manager',
      status: 'error',
      error: error instanceof Error ? error.message : 'Purge manager check failed'
    };
  }
}

async function checkSessionManager(): Promise<any> {
  try {
    // Test session manager functionality
    const testSessionCount = await sessionManager.getActiveSessionCount();

    return {
      component: 'session_manager',
      status: 'operational',
      details: {
        active_sessions: testSessionCount,
        enabled: process.env.SESSION_AUDIT_ENABLED === 'true'
      }
    };

  } catch (error) {
    return {
      component: 'session_manager',
      status: 'error',
      error: error instanceof Error ? error.message : 'Session manager check failed'
    };
  }
}

async function checkOPALIntegration(): Promise<any> {
  try {
    const governanceStatus = await opalGovernance.getGovernanceStatus();

    return {
      component: 'opal_integration',
      status: governanceStatus.enabled ? 'operational' : 'disabled',
      details: {
        enabled: governanceStatus.enabled,
        features_enabled: Object.values(governanceStatus.features).filter(Boolean).length,
        total_features: Object.keys(governanceStatus.features).length,
        compliance_rating: governanceStatus.compliance_rating
      }
    };

  } catch (error) {
    return {
      component: 'opal_integration',
      status: 'error',
      error: error instanceof Error ? error.message : 'OPAL integration check failed'
    };
  }
}

async function checkDatabaseConnection(): Promise<any> {
  try {
    // Import the supabase client to test connection
    const { supabase } = await import('@/lib/supabase');

    const { error } = await supabase.from('information_schema.tables').select('table_name').limit(1);

    if (error) {
      return {
        component: 'database_connection',
        status: 'warning',
        details: {
          connected: false,
          error: error.message,
          using_fallback: true
        }
      };
    }

    return {
      component: 'database_connection',
      status: 'operational',
      details: {
        connected: true,
        supabase_available: true
      }
    };

  } catch (error) {
    return {
      component: 'database_connection',
      status: 'warning',
      details: {
        connected: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
        using_fallback: true
      }
    };
  }
}

async function checkEnvironmentConfig(): Promise<any> {
  try {
    const requiredEnvVars = [
      'DATA_GOVERNANCE_ENABLED',
      'PII_SCANNING_ENABLED',
      'AUDIT_LOGGING_ENABLED',
      'WORKFLOW_PURGING_ENABLED'
    ];

    const optionalEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missingRequired = requiredEnvVars.filter(envVar => !process.env[envVar]);
    const missingOptional = optionalEnvVars.filter(envVar => !process.env[envVar]);

    let status = 'operational';
    if (missingRequired.length > 0) status = 'error';
    else if (missingOptional.length > 0) status = 'warning';

    return {
      component: 'environment_config',
      status,
      details: {
        required_vars_present: requiredEnvVars.length - missingRequired.length,
        total_required_vars: requiredEnvVars.length,
        missing_required: missingRequired,
        missing_optional: missingOptional,
        governance_enabled: process.env.DATA_GOVERNANCE_ENABLED === 'true'
      }
    };

  } catch (error) {
    return {
      component: 'environment_config',
      status: 'error',
      error: error instanceof Error ? error.message : 'Environment config check failed'
    };
  }
}

function getComponentName(index: number): string {
  const components = [
    'pii_scanner',
    'audit_logger',
    'purge_manager',
    'session_manager',
    'opal_integration',
    'database_connection',
    'environment_config'
  ];
  return components[index] || 'unknown_component';
}

function generateHealthRecommendations(results: any[]): string[] {
  const recommendations = [];

  const errorComponents = results.filter(r => r.status === 'error');
  const warningComponents = results.filter(r => r.status === 'warning' || r.status === 'degraded');

  if (errorComponents.length > 0) {
    recommendations.push(`Fix ${errorComponents.length} critical component(s): ${errorComponents.map(c => c.component).join(', ')}`);
  }

  if (warningComponents.length > 0) {
    recommendations.push(`Address ${warningComponents.length} warning(s) in: ${warningComponents.map(c => c.component).join(', ')}`);
  }

  const envConfig = results.find(r => r.component === 'environment_config');
  if (envConfig && envConfig.details?.missing_optional?.length > 0) {
    recommendations.push('Configure optional Supabase environment variables for full functionality');
  }

  if (errorComponents.length === 0 && warningComponents.length === 0) {
    recommendations.push('All governance systems are operational');
    recommendations.push('Monitor regularly for continued compliance');
  }

  return recommendations;
}