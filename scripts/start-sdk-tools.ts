#!/usr/bin/env ts-node

/**
 * Standalone OPAL Tools Service
 * Runs SDK-compliant tools on a separate port following official SDK patterns
 *
 * Usage: npm run start:opal-tools
 * or: ts-node scripts/start-sdk-tools.ts
 */

import { initializeSDKCompliantTools } from '../src/lib/opal/sdk-compliant-tools';

const PORT = process.env.OPAL_TOOLS_PORT ? parseInt(process.env.OPAL_TOOLS_PORT) : 3001;

async function startSDKToolsService() {
  try {
    console.log('🚀 Starting SDK-Compliant OPAL Tools Service...');
    console.log('📋 Following @optimizely-opal/opal-tools-sdk patterns');
    console.log('');

    const app = initializeSDKCompliantTools(PORT);

    app.listen(PORT, () => {
      console.log('✅ SDK-Compliant OPAL Tools Service started successfully!');
      console.log('');
      console.log('📡 Service Endpoints:');
      console.log(`   🔍 Discovery: http://localhost:${PORT}/discovery`);
      console.log(`   🔧 Tools API: http://localhost:${PORT}/tools`);
      console.log('');
      console.log('🛠️  Available Enhanced Tools:');
      console.log('   1. analyze_website_content_enhanced');
      console.log('      - Interactive content analysis with real-time config');
      console.log('      - Quality scoring and personalization opportunities');
      console.log('');
      console.log('   2. generate_audience_segments_enhanced');
      console.log('      - ML-powered segmentation with statistical validation');
      console.log('      - Interactive parameter tuning');
      console.log('');
      console.log('   3. create_experiment_blueprint_enhanced');
      console.log('      - Statistical power analysis and ROI projections');
      console.log('      - Interactive experiment designer');
      console.log('');
      console.log('   4. send_data_to_osa_enhanced');
      console.log('      - Intelligent OSA webhook delivery');
      console.log('      - Environment routing and retry logic');
      console.log('      - ⭐ Fixes the webhook configuration issue!');
      console.log('');
      console.log('🔗 Integration:');
      console.log('   • Update OPAL agent configs to use these enhanced tools');
      console.log(`   • Set discovery_url to: http://localhost:${PORT}/discovery`);
      console.log('   • Configure send_data_to_osa_enhanced for proper webhook delivery');
      console.log('');
      console.log('🎯 SDK Benefits:');
      console.log('   ✓ Type-safe parameter validation');
      console.log('   ✓ Interactive Island UI components');
      console.log('   ✓ Automatic discovery endpoint generation');
      console.log('   ✓ Built-in error handling and retry logic');
      console.log('   ✓ Standardized response formats');
      console.log('');
      console.log('Press Ctrl+C to stop the service');
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\\n🛑 Shutting down SDK Tools Service...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\\n🛑 Shutting down SDK Tools Service...');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start SDK Tools Service:', error);
    process.exit(1);
  }
}

// Start the service
startSDKToolsService();