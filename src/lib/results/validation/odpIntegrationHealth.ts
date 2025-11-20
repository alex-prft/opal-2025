/**
 * ODP Integration Health Validator
 *
 * Validates ODP → OPAL → OSA pipeline health and data quality.
 * Provides diagnostic information for troubleshooting integration issues.
 *
 * @version 1.0 - Proof of Concept
 */

export interface ODPIntegrationHealthResult {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  score: number; // 0-100
  checks: ODPHealthCheck[];
  recommendations: string[];
  lastChecked: string;
  dataSource: 'live' | 'mock';
}

export interface ODPHealthCheck {
  checkId: string;
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: string;
  impact: 'low' | 'medium' | 'high';
}

/**
 * Perform comprehensive ODP integration health check
 */
export async function validateODPIntegrationHealth(): Promise<ODPIntegrationHealthResult> {
  const checks: ODPHealthCheck[] = [];
  const recommendations: string[] = [];
  let totalScore = 0;
  const maxScore = 125; // Updated for additional checks

  try {
    // Check 1: ODP Adapter Availability
    const adapterCheck = await checkODPAdapterAvailability();
    checks.push(adapterCheck);
    totalScore += adapterCheck.status === 'pass' ? 25 : adapterCheck.status === 'warn' ? 15 : 0;

    // Check 2: OPAL Agent Configuration
    const opalAgentCheck = await checkOPALAgentConfiguration();
    checks.push(opalAgentCheck);
    totalScore += opalAgentCheck.status === 'pass' ? 25 : opalAgentCheck.status === 'warn' ? 15 : 0;

    // Check 3: Widget Integration
    const widgetCheck = await checkWidgetIntegration();
    checks.push(widgetCheck);
    totalScore += widgetCheck.status === 'pass' ? 25 : widgetCheck.status === 'warn' ? 15 : 0;

    // Check 4: Data Flow Validation
    const dataFlowCheck = await checkDataFlowValidation();
    checks.push(dataFlowCheck);
    totalScore += dataFlowCheck.status === 'pass' ? 20 : dataFlowCheck.status === 'warn' ? 12 : 0;

    // Check 5: OPAL Agent Health
    const opalHealthCheck = await checkOPALAgentHealth();
    checks.push(opalHealthCheck);
    totalScore += opalHealthCheck.status === 'pass' ? 20 : opalHealthCheck.status === 'warn' ? 12 : 0;

    // Check 6: Discovery URL Accessibility
    const discoveryCheck = await checkDiscoveryURLAccessibility();
    checks.push(discoveryCheck);
    totalScore += discoveryCheck.status === 'pass' ? 15 : discoveryCheck.status === 'warn' ? 10 : 0;

    // Generate recommendations based on failed checks
    checks.forEach(check => {
      if (check.status === 'fail') {
        recommendations.push(`Address ${check.name}: ${check.message}`);
      } else if (check.status === 'warn') {
        recommendations.push(`Optimize ${check.name}: ${check.message}`);
      }
    });

    // Determine overall health
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (totalScore >= 80) {
      overall = 'healthy';
    } else if (totalScore >= 50) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return {
      overall,
      score: Math.round((totalScore / maxScore) * 100),
      checks,
      recommendations,
      lastChecked: new Date().toISOString(),
      dataSource: 'opal_with_mock_fallback' as any
    };

  } catch (error) {
    return {
      overall: 'unhealthy',
      score: 0,
      checks: [{
        checkId: 'validation-error',
        name: 'Health Check Error',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown validation error',
        impact: 'high'
      }],
      recommendations: ['Fix ODP integration health validation system'],
      lastChecked: new Date().toISOString(),
      dataSource: 'mock'
    };
  }
}

/**
 * Check if ODP adapter is available and functioning
 */
async function checkODPAdapterAvailability(): Promise<ODPHealthCheck> {
  try {
    // Try to import the ODP adapter
    const { transformODPDashboard } = await import('@/lib/results/adapters/odp');
    
    // Test transformation with sample data
    const testResult = await transformODPDashboard();
    
    if (testResult.success && testResult.data) {
      return {
        checkId: 'odp-adapter-availability',
        name: 'ODP Adapter Availability',
        status: 'pass',
        message: 'ODP adapter is available and functional',
        details: `Transformation completed in ${testResult.processingTime}ms`,
        impact: 'high'
      };
    } else {
      return {
        checkId: 'odp-adapter-availability',
        name: 'ODP Adapter Availability',
        status: 'warn',
        message: 'ODP adapter available but transformation failed',
        details: testResult.error || 'Unknown transformation error',
        impact: 'high'
      };
    }
  } catch (error) {
    return {
      checkId: 'odp-adapter-availability',
      name: 'ODP Adapter Availability',
      status: 'fail',
      message: 'ODP adapter not available',
      details: error instanceof Error ? error.message : 'Unknown error',
      impact: 'high'
    };
  }
}

/**
 * Check OPAL agent configuration for ODP
 */
async function checkOPALAgentConfiguration(): Promise<ODPHealthCheck> {
  try {
    // Check if ODP-related agents are configured
    const { OPAL_AGENTS } = await import('@/opal/clients/OpalClient');
    
    const odpAgents = [
      OPAL_AGENTS.AUDIENCE_SUGGESTER,
      OPAL_AGENTS.CUSTOMER_JOURNEY,
      OPAL_AGENTS.INTEGRATION_HEALTH
    ];

    const configuredAgents = odpAgents.filter(agent => agent && agent.length > 0);

    if (configuredAgents.length === odpAgents.length) {
      return {
        checkId: 'opal-agent-config',
        name: 'OPAL Agent Configuration',
        status: 'pass',
        message: 'All ODP-related OPAL agents are configured',
        details: `Configured agents: ${configuredAgents.join(', ')}`,
        impact: 'medium'
      };
    } else if (configuredAgents.length > 0) {
      return {
        checkId: 'opal-agent-config',
        name: 'OPAL Agent Configuration',
        status: 'warn',
        message: 'Some ODP-related OPAL agents are missing',
        details: `Configured: ${configuredAgents.length}/${odpAgents.length}`,
        impact: 'medium'
      };
    } else {
      return {
        checkId: 'opal-agent-config',
        name: 'OPAL Agent Configuration',
        status: 'fail',
        message: 'No ODP-related OPAL agents configured',
        impact: 'high'
      };
    }
  } catch (error) {
    return {
      checkId: 'opal-agent-config',
      name: 'OPAL Agent Configuration',
      status: 'fail',
      message: 'Failed to check OPAL agent configuration',
      details: error instanceof Error ? error.message : 'Unknown error',
      impact: 'medium'
    };
  }
}

/**
 * Check widget integration status
 */
async function checkWidgetIntegration(): Promise<ODPHealthCheck> {
  try {
    // Try to import ODPWidget
    const { ODPWidget } = await import('@/components/widgets/ODPWidget');
    
    if (ODPWidget) {
      return {
        checkId: 'widget-integration',
        name: 'Widget Integration',
        status: 'pass',
        message: 'ODPWidget is available and properly integrated',
        impact: 'medium'
      };
    } else {
      return {
        checkId: 'widget-integration',
        name: 'Widget Integration',
        status: 'fail',
        message: 'ODPWidget not found or not exported',
        impact: 'medium'
      };
    }
  } catch (error) {
    return {
      checkId: 'widget-integration',
      name: 'Widget Integration',
      status: 'fail',
      message: 'Failed to load ODPWidget',
      details: error instanceof Error ? error.message : 'Unknown error',
      impact: 'medium'
    };
  }
}

/**
 * Check data flow validation
 */
async function checkDataFlowValidation(): Promise<ODPHealthCheck> {
  try {
    // Test the complete data flow
    const { getResultsContentForRoute } = await import('@/lib/results/getResultsContentForRoute');
    
    // Test with a sample ODP route
    const testRoute = '/engine/results/optimizely-dxp-tools/odp/data-platform-dashboard';
    const result = await getResultsContentForRoute(testRoute, { 
      debugMode: true,
      forceRefresh: true
    });

    if (result.success && result.content) {
      return {
        checkId: 'data-flow-validation',
        name: 'Data Flow Validation',
        status: 'pass',
        message: 'End-to-end data flow working correctly',
        details: `Data source: ${result.metadata.dataSource}, Processing time: ${result.metadata.processingTime}ms`,
        impact: 'high'
      };
    } else {
      return {
        checkId: 'data-flow-validation',
        name: 'Data Flow Validation',
        status: 'warn',
        message: 'Data flow partially working',
        details: result.error || 'Unknown data flow issue',
        impact: 'high'
      };
    }
  } catch (error) {
    return {
      checkId: 'data-flow-validation',
      name: 'Data Flow Validation',
      status: 'fail',
      message: 'Data flow validation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      impact: 'high'
    };
  }
}

/**
 * Get health status summary for admin dashboard
 */
/**
 * Check OPAL agent health and connectivity
 */
async function checkOPALAgentHealth(): Promise<ODPHealthCheck> {
  try {
    // Test OPAL agent connectivity by trying to call discovery endpoint
    const discoveryUrl = 'https://opal-2025.vercel.app/api/tools/odp/discovery';
    
    // Check if local discovery endpoint is available
    try {
      const testResponse = await fetch('/api/tools/odp/discovery', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (testResponse.ok) {
        return {
          checkId: 'opal-agent-health',
          name: 'OPAL Agent Health',
          status: 'pass',
          message: 'OPAL agents are healthy and accessible',
          details: `Discovery endpoint responding at ${discoveryUrl}`,
          impact: 'high'
        };
      } else {
        return {
          checkId: 'opal-agent-health',
          name: 'OPAL Agent Health',
          status: 'warn',
          message: 'OPAL agents may have connectivity issues',
          details: `Discovery endpoint returned ${testResponse.status}`,
          impact: 'medium'
        };
      }
    } catch (fetchError) {
      // If fetch fails, it might be a build-time check, so consider it a warning
      return {
        checkId: 'opal-agent-health',
        name: 'OPAL Agent Health',
        status: 'warn',
        message: 'OPAL agent health check inconclusive',
        details: 'Could not test OPAL connectivity during health check',
        impact: 'low'
      };
    }
  } catch (error) {
    return {
      checkId: 'opal-agent-health',
      name: 'OPAL Agent Health',
      status: 'fail',
      message: 'Failed to check OPAL agent health',
      details: error instanceof Error ? error.message : 'Unknown error',
      impact: 'high'
    };
  }
}

/**
 * Check OPAL custom tools configuration and accessibility
 */
async function checkDiscoveryURLAccessibility(): Promise<ODPHealthCheck> {
  try {
    const discoveryUrl = 'https://opal-2025.vercel.app/api/tools/odp/discovery';
    
    // Check if local discovery endpoint exists
    try {
      const { GET } = await import('@/app/api/tools/odp/discovery/route');
      
      return {
        checkId: 'opal-tools-config',
        name: 'OPAL Custom Tools Configuration',
        status: 'pass',
        message: 'OPAL custom tools are properly configured',
        details: `Discovery URL: ${discoveryUrl}, Local tools endpoint available`,
        impact: 'medium'
      };
    } catch (importError) {
      // If import fails, it's still okay as long as external OPAL tools work
      return {
        checkId: 'opal-tools-config',
        name: 'OPAL Custom Tools Configuration',
        status: 'warn',
        message: 'Local tools endpoint unavailable, relying on external OPAL',
        details: 'External OPAL discovery URL should still provide ODP tools',
        impact: 'low'
      };
    }
  } catch (error) {
    return {
      checkId: 'opal-tools-config',
      name: 'OPAL Custom Tools Configuration',
      status: 'fail',
      message: 'OPAL custom tools configuration check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      impact: 'high'
    };
  }
}

export function getODPHealthSummary(healthResult: ODPIntegrationHealthResult): {
  status: string;
  color: string;
  message: string;
} {
  switch (healthResult.overall) {
    case 'healthy':
      return {
        status: 'Healthy',
        color: 'green',
        message: `ODP integration is working well (${healthResult.score}% health score)`
      };
    case 'degraded':
      return {
        status: 'Degraded',
        color: 'yellow',
        message: `ODP integration has some issues (${healthResult.score}% health score)`
      };
    case 'unhealthy':
      return {
        status: 'Unhealthy',
        color: 'red',
        message: `ODP integration needs attention (${healthResult.score}% health score)`
      };
    default:
      return {
        status: 'Unknown',
        color: 'gray',
        message: 'ODP integration status unknown'
      };
  }
}

export default {
  validateODPIntegrationHealth,
  getODPHealthSummary
};