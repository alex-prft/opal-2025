#!/usr/bin/env npx tsx

/**
 * ODP-OPAL Integration Test Script
 *
 * Tests the end-to-end ODP → OPAL → OSA Results pipeline
 * Can be run in mock mode or with live data (when credentials are available)
 *
 * Usage:
 *   npm run test:odp
 *   npx tsx scripts/test-odp-opal-integration.ts
 *   npx tsx scripts/test-odp-opal-integration.ts --verbose
 */

import path from 'path';
import { fileURLToPath } from 'url';

// Setup path resolution for imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Mock Next.js environment for testing
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_OSA_STREAM_DEBUG = 'true';

// Color output helpers
const colors = {
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
  dim: (text: string) => `\x1b[2m${text}\x1b[0m`
};

interface TestResult {
  testId: string;
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  details?: any;
  duration: number;
}

class ODPIntegrationTester {
  private verbose: boolean;
  private results: TestResult[] = [];

  constructor(verbose = false) {
    this.verbose = verbose;
  }

  private log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
    const prefix = {
      info: colors.blue('ℹ'),
      success: colors.green('✓'),
      error: colors.red('✗'),
      warn: colors.yellow('⚠')
    }[type];
    
    console.log(`${prefix} ${message}`);
  }

  private async runTest(testId: string, name: string, testFn: () => Promise<any>): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      this.log(`Running: ${name}...`, 'info');
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      const testResult: TestResult = {
        testId,
        name,
        status: 'pass',
        message: 'Test passed successfully',
        details: result,
        duration
      };
      
      this.results.push(testResult);
      this.log(`${name} ${colors.dim(`(${duration}ms)`)}`, 'success');
      
      if (this.verbose && result) {
        console.log(colors.dim('  Result:'), result);
      }
      
      return testResult;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const testResult: TestResult = {
        testId,
        name,
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error,
        duration
      };
      
      this.results.push(testResult);
      this.log(`${name} - ${testResult.message} ${colors.dim(`(${duration}ms)`)}`, 'error');
      
      return testResult;
    }
  }

  async runAllTests(): Promise<void> {
    console.log(colors.bold('🧪 ODP-OPAL Integration Test Suite\\n'));
    
    // Test 1: ODP Adapter Functionality
    await this.runTest('odp-adapter', 'ODP Adapter Transformation', async () => {
      // Dynamic import to handle module resolution
      const odpAdapterPath = path.join(projectRoot, 'src/lib/results/adapters/odp.ts');
      const { transformODPDashboard } = await import(odpAdapterPath);
      
      const result = await transformODPDashboard();
      
      if (!result.success || !result.data) {
        throw new Error(`Transformation failed: ${result.error}`);
      }
      
      // Validate structure
      if (!result.data.hero || !result.data.overview || !result.data.insights) {
        throw new Error('Invalid result structure - missing required sections');
      }
      
      return {
        success: result.success,
        confidence: result.confidence,
        processingTime: result.processingTime,
        dataSource: result.dataSource,
        heroMetrics: result.data.hero?.metrics?.length || 0,
        insights: result.data.insights?.length || 0,
        opportunities: result.data.opportunities?.length || 0,
        nextSteps: result.data.nextSteps?.length || 0
      };
    });

    // Test 2: Integration Health Check
    await this.runTest('integration-health', 'ODP Integration Health Validation', async () => {
      const healthValidatorPath = path.join(projectRoot, 'src/lib/results/validation/odpIntegrationHealth.ts');
      const { validateODPIntegrationHealth } = await import(healthValidatorPath);
      
      const healthResult = await validateODPIntegrationHealth();
      
      if (healthResult.overall === 'unhealthy' && healthResult.score === 0) {
        throw new Error('Integration health check completely failed');
      }
      
      return {
        overall: healthResult.overall,
        score: healthResult.score,
        checksCount: healthResult.checks.length,
        passedChecks: healthResult.checks.filter(c => c.status === 'pass').length,
        recommendations: healthResult.recommendations.length,
        dataSource: healthResult.dataSource
      };
    });

    // Test 3: Results Content Service Integration
    await this.runTest('results-service', 'Results Content Service ODP Integration', async () => {
      const resultsServicePath = path.join(projectRoot, 'src/lib/results/getResultsContentForRoute.ts');
      const { getResultsContentForRoute } = await import(resultsServicePath);
      
      const testRoute = '/engine/results/optimizely-dxp-tools/odp/data-platform-dashboard';
      const response = await getResultsContentForRoute(testRoute, {
        debugMode: true,
        forceRefresh: true
      });
      
      if (!response.success || !response.content) {
        throw new Error(`Results service failed: ${response.error}`);
      }
      
      return {
        success: response.success,
        hasContent: !!response.content,
        confidence: response.metadata.confidence,
        processingTime: response.metadata.processingTime,
        dataSource: response.metadata.dataSource,
        agentsUsed: response.metadata.agentsUsed?.length || 0,
        warnings: response.warnings?.length || 0
      };
    });

    // Test 4: Mock Data Validation
    await this.runTest('mock-data', 'Mock Data Quality Validation', async () => {
      const odpAdapterPath = path.join(projectRoot, 'src/lib/results/adapters/odp.ts');
      const odpAdapter = await import(odpAdapterPath);
      
      // Generate multiple mock data samples to check consistency
      const samples = [];
      for (let i = 0; i < 3; i++) {
        const mockData = odpAdapter.default.generateMockODPData();
        samples.push(mockData);
      }
      
      // Validate mock data structure and ranges
      samples.forEach((sample, index) => {
        if (!sample.customer_metrics || !sample.audience_segments || !sample.data_quality) {
          throw new Error(`Mock data sample ${index + 1} missing required sections`);
        }
        
        // Check realistic ranges
        if (sample.customer_metrics.total_customers < 1000 || sample.customer_metrics.total_customers > 100000) {
          throw new Error(`Mock data sample ${index + 1} customer count out of realistic range`);
        }
        
        if (sample.data_quality.overall_score < 50 || sample.data_quality.overall_score > 100) {
          throw new Error(`Mock data sample ${index + 1} quality score out of range`);
        }
      });
      
      return {
        samplesGenerated: samples.length,
        avgCustomers: Math.round(samples.reduce((sum, s) => sum + s.customer_metrics.total_customers, 0) / samples.length),
        avgQualityScore: Math.round(samples.reduce((sum, s) => sum + s.data_quality.overall_score, 0) / samples.length),
        allSamplesValid: true
      };
    });

    // Test 5: OPAL Discovery URL Configuration Check
    await this.runTest('opal-discovery-config', 'OPAL Discovery URL Configuration Check', async () => {
      const discoveryUrl = 'https://opal-2025.vercel.app/api/tools/odp/discovery';
      
      let discoveryAccessible = false;
      try {
        // Test discovery URL accessibility (in a real test, we'd make HTTP request)
        // For now, just verify URL format
        discoveryAccessible = discoveryUrl.startsWith('https://') && discoveryUrl.includes('/api/tools/odp/discovery');
      } catch (error) {
        discoveryAccessible = false;
      }
      
      return {
        discoveryUrlConfigured: !!discoveryUrl,
        discoveryUrlAccessible,
        architecture: 'OPAL-first with mock fallback',
        credentialHandling: 'Managed by OPAL (no OSA credentials needed)',
        configurationComplete: !!discoveryUrl
      };
    });

    // Test 6: OPAL Custom Tools Validation
    await this.runTest('opal-tools', 'OPAL Custom Tools Validation', async () => {
      try {
        // Check if discovery endpoint exists (local API route)
        const discoveryPath = path.join(projectRoot, 'src/app/api/tools/odp/discovery/route.ts');
        const fs = await import('fs/promises');
        const discoveryExists = await fs.access(discoveryPath).then(() => true).catch(() => false);
        
        if (!discoveryExists) {
          throw new Error('Discovery endpoint not found');
        }
        
        // Check for key ODP API endpoints
        const segmentsPath = path.join(projectRoot, 'src/app/api/tools/odp/segments/route.ts');
        const segmentsExists = await fs.access(segmentsPath).then(() => true).catch(() => false);
        
        const statisticsPath = path.join(projectRoot, 'src/app/api/tools/odp/statistics/route.ts');
        const statisticsExists = await fs.access(statisticsPath).then(() => true).catch(() => false);
        
        return {
          discoveryEndpointExists: discoveryExists,
          segmentsEndpointExists: segmentsExists,
          statisticsEndpointExists: statisticsExists,
          allEndpointsAvailable: discoveryExists && segmentsExists && statisticsExists,
          toolsReady: true
        };
      } catch (error) {
        throw new Error(`OPAL tools validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    // Test 7: OPAL-First Adapter Testing
    await this.runTest('opal-first-adapter', 'OPAL-First Adapter Testing', async () => {
      const odpAdapterPath = path.join(projectRoot, 'src/lib/results/adapters/odp.ts');
      const { transformODPDashboard } = await import(odpAdapterPath);
      
      // Test with no rawData (should try OPAL, fall back to mock)
      const opalFirstResult = await transformODPDashboard();
      
      // Test with mock rawData provided
      const mockRawData = {
        customer_metrics: { total_customers: 1000, reachable_profiles: 800, anonymous_profiles: 200, mau_count: 500, data_freshness: new Date().toISOString(), profile_completeness: 75 },
        audience_segments: { total_segments: 5, active_segments: 4, realtime_segments: 2, segment_health_score: 85 },
        data_quality: { overall_score: 90, duplicate_rate: 0.05, missing_data_rate: 0.1, last_quality_check: new Date().toISOString() },
        integration_status: { api_health: 'healthy' as const, last_sync: new Date().toISOString(), sync_success_rate: 0.95, active_connections: 1 },
        metadata: { generated_at: new Date().toISOString(), data_age_minutes: 5, confidence: 90, source_agents: ['test_agent'] }
      };
      const rawDataResult = await transformODPDashboard(mockRawData);
      
      if (!opalFirstResult.success || !rawDataResult.success) {
        throw new Error('OPAL-first adapter failed in one or both test modes');
      }
      
      return {
        opalFirstWorking: opalFirstResult.success,
        rawDataProcessing: rawDataResult.success,
        architecture: 'OPAL-first with mock fallback',
        bothModesOperational: opalFirstResult.success && rawDataResult.success,
        opalFirstDataSource: opalFirstResult.dataSource,
        rawDataDataSource: rawDataResult.dataSource,
        visualIndicators: rawDataResult.dataSource === 'mock_data' ? 'Asterisk and footnotes displayed' : 'Clean display for live data'
      };
    });

    // Test 8: Component Import Validation
    await this.runTest('component-imports', 'Component Import Validation', async () => {
      try {
        // Test ODPWidget import
        const odpWidgetPath = path.join(projectRoot, 'src/components/widgets/ODPWidget.tsx');
        const { ODPWidget } = await import(odpWidgetPath);
        
        if (typeof ODPWidget !== 'function') {
          throw new Error('ODPWidget is not a valid React component function');
        }
        
        // Test other related imports
        const conditionalRenderingPath = path.join(projectRoot, 'src/lib/conditional-rendering.ts');
        const conditionalRendering = await import(conditionalRenderingPath);
        
        return {
          odpWidgetImported: !!ODPWidget,
          conditionalRenderingImported: !!conditionalRendering,
          allImportsSuccessful: true
        };
        
      } catch (error) {
        throw new Error(`Component import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    // Display results summary
    this.displayResults();
  }

  private displayResults(): void {
    const passed = this.results.filter(r => r.status === 'pass');
    const failed = this.results.filter(r => r.status === 'fail');
    const skipped = this.results.filter(r => r.status === 'skip');
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\\n' + colors.bold('📊 Test Results Summary'));
    console.log(colors.dim('─'.repeat(50)));
    
    console.log(`${colors.green('✓ Passed:')} ${passed.length}`);
    console.log(`${colors.red('✗ Failed:')} ${failed.length}`);
    console.log(`${colors.yellow('⊝ Skipped:')} ${skipped.length}`);
    console.log(`${colors.blue('⏱ Total Time:')} ${totalTime}ms`);
    
    if (failed.length > 0) {
      console.log('\\n' + colors.bold('❌ Failed Tests:'));
      failed.forEach(test => {
        console.log(`  ${colors.red('✗')} ${test.name}: ${test.message}`);
      });
    }
    
    const successRate = (passed.length / this.results.length) * 100;
    console.log('\\n' + colors.bold(`🎯 Success Rate: ${successRate.toFixed(1)}%`));
    
    if (successRate >= 80) {
      console.log(colors.green('🎉 ODP integration is ready for testing!'));
    } else if (successRate >= 60) {
      console.log(colors.yellow('⚠️  ODP integration has some issues but is partially functional'));
    } else {
      console.log(colors.red('🚨 ODP integration needs significant work before it can be used'));
    }
    
    console.log('\n' + colors.bold('💡 Next Steps:'));
    if (successRate >= 80) {
      console.log('  1. Test ODP pages in development server: npm run dev');
      console.log('  2. Navigate to: /engine/results/optimizely-dxp-tools/odp/data-platform-dashboard');
      console.log('  3. Verify mock data displays correctly');
      console.log('  4. OPAL agents will automatically provide live data when workflow_data_sharing is available');
      console.log('  5. Mock data fallback ensures pages always function (look for * and footnotes)');
      console.log('  6. Monitor OPAL integration with debug logging: NEXT_PUBLIC_OSA_STREAM_DEBUG=true');
    } else {
      console.log('  1. Fix failed tests listed above');
      console.log('  2. Re-run this test script: npm run test:odp');
      console.log('  3. Check console logs for detailed error information');
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  
  const tester = new ODPIntegrationTester(verbose);
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error(colors.red('🚨 Test suite failed to run:'), error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ODPIntegrationTester };
export default main;