/**
 * Test Script for OPAL Payload Builder
 *
 * Run with: npx tsx scripts/test-payload-builder.ts
 */

import {
  validateOpalEnvironment,
  buildOpalWorkflowPayload,
  buildForceSyncPayload,
  validateOpalPayload,
  debugPayload
} from '../src/lib/opal/payload-builder';

async function testPayloadBuilder() {
  console.log('🧪 Testing OPAL Payload Builder...\n');

  // 1. Test environment validation
  console.log('1️⃣ Environment Validation:');
  const envValidation = validateOpalEnvironment();
  console.log(`   Status: ${envValidation.isValid ? '✅ VALID' : '❌ INVALID'}`);

  if (!envValidation.isValid) {
    console.log('   Errors:');
    envValidation.errors.forEach(error => console.log(`     - ${error}`));
  } else {
    console.log('   ✅ All required environment variables configured');
  }
  console.log('');

  // 2. Test basic payload building
  console.log('2️⃣ Basic Payload Building:');
  const basicPayload = buildOpalWorkflowPayload({
    client_name: 'Test Client',
    industry: 'E-commerce',
    recipients: ['test@example.com']
  });

  if (basicPayload.success) {
    console.log('   ✅ Basic payload built successfully');
    console.log(`   Workflow: ${basicPayload.payload!.workflow_name}`);
    console.log(`   Client: ${basicPayload.payload!.input_data.client_name}`);
    console.log(`   Workspace ID: ${basicPayload.payload!.metadata.workspace_id.substring(0, 8)}...`);
  } else {
    console.log('   ❌ Basic payload building failed:');
    basicPayload.errors?.forEach(error => console.log(`     - ${error}`));
  }
  console.log('');

  // 3. Test Force Sync payload
  console.log('3️⃣ Force Sync Payload:');
  const forceSyncPayload = buildForceSyncPayload({
    client_context: {
      client_name: 'Force Sync Test',
      industry: 'Technology',
      recipients: ['admin@example.com']
    },
    sync_scope: 'all_platforms',
    triggered_by: 'test_script'
  });

  if (forceSyncPayload.success) {
    console.log('   ✅ Force Sync payload built successfully');
    console.log(`   Sync Scope: ${forceSyncPayload.payload!.input_data.sync_scope}`);
    console.log(`   Triggered By: ${forceSyncPayload.payload!.input_data.triggered_by}`);
    console.log(`   Force Sync: ${forceSyncPayload.payload!.input_data.force_sync}`);
  } else {
    console.log('   ❌ Force Sync payload building failed:');
    forceSyncPayload.errors?.forEach(error => console.log(`     - ${error}`));
  }
  console.log('');

  // 4. Test payload validation
  console.log('4️⃣ Payload Validation:');
  if (basicPayload.success) {
    const validation = validateOpalPayload(basicPayload.payload);
    console.log(`   Status: ${validation.valid ? '✅ VALID' : '❌ INVALID'}`);

    if (validation.errors.length > 0) {
      console.log('   Errors:');
      validation.errors.forEach(error => console.log(`     - ${error}`));
    }

    if (validation.warnings.length > 0) {
      console.log('   Warnings:');
      validation.warnings.forEach(warning => console.log(`     - ${warning}`));
    }

    if (validation.valid) {
      console.log('   ✅ Payload passes all validation checks');
    }
  }
  console.log('');

  // 5. Test payload debugging
  console.log('5️⃣ Payload Debug Output:');
  if (basicPayload.success) {
    debugPayload(basicPayload.payload!, true);
  }
  console.log('');

  // 6. Test missing required fields
  console.log('6️⃣ Invalid Payload Test:');
  const invalidPayload = {
    workflow_name: 'wrong_workflow',
    input_data: {
      client_name: 'Test'
      // Missing required fields
    },
    metadata: {
      // Missing required fields
    }
  };

  const invalidValidation = validateOpalPayload(invalidPayload);
  console.log(`   Status: ${invalidValidation.valid ? '✅ VALID' : '❌ INVALID (expected)'}`);
  console.log(`   Found ${invalidValidation.errors.length} validation errors (expected)`);
  invalidValidation.errors.slice(0, 3).forEach(error => console.log(`     - ${error}`));
  if (invalidValidation.errors.length > 3) {
    console.log(`     ... and ${invalidValidation.errors.length - 3} more errors`);
  }
  console.log('');

  console.log('🎉 Payload Builder Tests Complete!\n');

  // Summary
  console.log('📊 Summary:');
  console.log(`   Environment: ${envValidation.isValid ? '✅' : '❌'} Valid`);
  console.log(`   Basic Payload: ${basicPayload.success ? '✅' : '❌'} Success`);
  console.log(`   Force Sync: ${forceSyncPayload.success ? '✅' : '❌'} Success`);
  console.log(`   Validation: ${basicPayload.success && validateOpalPayload(basicPayload.payload!).valid ? '✅' : '❌'} Working`);
}

// Run the tests
testPayloadBuilder().catch(console.error);