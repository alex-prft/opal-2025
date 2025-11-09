#!/usr/bin/env ts-node

/**
 * Basic SDK Test - Non-decorator approach
 * Tests the OPAL Tools SDK without decorators to validate core functionality
 */

import express from 'express';
import { ToolsService } from '@optimizely-opal/opal-tools-sdk';

const PORT = 3001;

async function testBasicSDKFunctionality() {
  try {
    console.log('🚀 Testing Basic SDK Functionality...');
    console.log('📋 Creating Express app with ToolsService');

    const app = express();
    app.use(express.json());

    // Initialize the ToolsService - this should create a /discovery endpoint
    const toolsService = new ToolsService(app);

    console.log('✅ ToolsService initialized successfully');
    console.log('🔍 Starting server...');

    app.listen(PORT, () => {
      console.log(`✅ Basic SDK test server started on port ${PORT}`);
      console.log(`📡 Discovery endpoint: http://localhost:${PORT}/discovery`);
      console.log('');
      console.log('🧪 Test Results:');
      console.log('   ✓ Express app creation: SUCCESS');
      console.log('   ✓ ToolsService initialization: SUCCESS');
      console.log('   ✓ Server startup: SUCCESS');
      console.log('');
      console.log('Press Ctrl+C to stop the test');
    });

    // Test endpoint
    app.get('/test', (req, res) => {
      res.json({
        status: 'success',
        message: 'Basic SDK integration working',
        sdk_version: '@optimizely-opal/opal-tools-sdk@0.1.3-dev',
        timestamp: new Date().toISOString()
      });
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\\n🛑 Shutting down basic test server...');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Basic SDK test failed:', error);
    process.exit(1);
  }
}

// Start the test
testBasicSDKFunctionality();