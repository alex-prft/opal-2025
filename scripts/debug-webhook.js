#!/usr/bin/env node

/**
 * Debug Webhook Processing
 * Simple test to see what error occurs in webhook processing
 */

const crypto = require('crypto');

async function debugWebhookProcessing() {
  const baseUrl = 'http://localhost:3000';
  const hmacSecret = process.env.OSA_WEBHOOK_SECRET || 'secure-hmac-verification-secret-32chars-dev';

  // Simple valid payload
  const payload = {
    agent_id: 'integration_health',
    workflow_id: 'debug-test-123',
    agent_data: {
      status: 'completed',
      success: true,
      execution_time_ms: 2000
    },
    execution_status: 'success',
    offset: 1,
    timestamp: new Date().toISOString(),
    metadata: {
      test: true
    }
  };

  const payloadJson = JSON.stringify(payload);
  const timestamp = Date.now();

  // Generate signature
  const signatureData = timestamp.toString() + payloadJson;
  const hmac = crypto.createHmac('sha256', hmacSecret);
  hmac.update(signatureData, 'utf8');
  const signature = hmac.digest('hex');
  const signatureHeader = `t=${timestamp},v1=${signature}`;

  console.log('🧪 Debug Webhook Test');
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('Signature:', signatureHeader);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    console.log('\n📤 Sending request...');

    const response = await fetch(`${baseUrl}/api/webhooks/opal-workflow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OSA-Signature': signatureHeader,
        'User-Agent': 'Debug-Test/1.0.0'
      },
      body: payloadJson,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('\n📋 Response:');
    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers));

    const result = await response.text();
    console.log('Body:', result);

    try {
      const jsonResult = JSON.parse(result);
      console.log('Parsed JSON:', JSON.stringify(jsonResult, null, 2));
    } catch (e) {
      console.log('Body is not JSON');
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

debugWebhookProcessing();