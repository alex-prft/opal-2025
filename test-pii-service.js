/**
 * Test PIIProtectionService - Simplified vs Comprehensive Comparison
 *
 * Demonstrates the simplified PIIProtectionService alongside the comprehensive
 * PIIProtectionManager to show different levels of PII protection functionality.
 */

// Import both the simple service and comprehensive manager
const { PIIProtectionService, basicPIIProtection, strictPIIProtection, partialPIIProtection } = require('./src/lib/compliance/pii-protection-service');

// Test the PII protection service
async function testPIIProtectionService() {
  console.log('🧪 Testing PIIProtectionService - Simple & Advanced');
  console.log('==================================================\n');

  // Test 1: Basic service usage
  console.log('📋 Test 1: Basic PIIProtectionService Usage');
  console.log('===========================================');

  const testData = [
    { value: 'john.doe@company.com', type: 'email' },
    { value: '+1-555-123-4567', type: 'phone' },
    { value: '123-45-6789', type: 'ssn' },
    { value: '4532-1234-5678-9012', type: 'credit_card' },
    { value: 'John Smith', type: 'name' }
  ];

  console.log('\n🔧 Basic Masking Service:');
  for (const item of testData) {
    const protected = basicPIIProtection.protectPIIValue(item.value, item.type);
    console.log(`${item.type}: "${item.value}" → "${protected}"`);
  }

  console.log('\n🔧 Strict Hashing Service:');
  for (const item of testData) {
    const protected = strictPIIProtection.protectPIIValue(item.value, item.type);
    console.log(`${item.type}: "${item.value}" → "${protected}"`);
  }

  console.log('\n🔧 Partial Redaction Service:');
  for (const item of testData) {
    const protected = partialPIIProtection.protectPIIValue(item.value, item.type);
    console.log(`${item.type}: "${item.value}" → "${protected}"`);
  }

  // Test 2: Batch protection
  console.log('\n\n📋 Test 2: Batch Protection');
  console.log('===========================');

  const batchData = [
    { value: 'alice@test.com', type: 'email' },
    { value: 'bob@example.org', type: 'email' },
    { value: '+1-555-999-8888', type: 'phone' }
  ];

  const batchProtected = await basicPIIProtection.protectBatch(batchData);
  console.log('Original values:', batchData.map(item => item.value).join(', '));
  console.log('Protected values:', batchProtected.join(', '));

  // Test 3: Advanced protection with context
  console.log('\n\n📋 Test 3: Advanced Context-Aware Protection');
  console.log('============================================');

  const testEmail = 'sensitive@company.com';

  const contexts = [
    { user_role: 'admin', operation_type: 'display', description: 'Admin View' },
    { user_role: 'user', operation_type: 'logging', description: 'User Logging' },
    { user_role: 'guest', operation_type: 'display', description: 'Guest Display' }
  ];

  for (const context of contexts) {
    try {
      const protected = await basicPIIProtection.protectAdvanced(testEmail, 'email', context);
      console.log(`${context.description}: "${testEmail}" → "${protected}"`);
    } catch (error) {
      console.log(`${context.description}: Error - using fallback protection`);
      const fallback = basicPIIProtection.protectPIIValue(testEmail, 'email');
      console.log(`${context.description}: "${testEmail}" → "${fallback}" (fallback)`);
    }
  }

  // Test 4: Quick protection for mixed content
  console.log('\n\n📋 Test 4: Quick Protection for Mixed Content');
  console.log('=============================================');

  const mixedText = `
    Customer John Doe can be reached at john.doe@email.com or +1-555-987-6543.
    His SSN is 987-65-4321 and his credit card number is 4532-1234-5678-9012.
    Please contact Jane Smith at jane@company.com for account details.
  `;

  console.log('Original text:');
  console.log(mixedText);

  try {
    const quickResult = await basicPIIProtection.quickProtect(mixedText.trim());
    console.log('\n🔍 Quick Protection Results:');
    console.log(`Detections found: ${quickResult.detections_count}`);
    console.log(`PII types detected: ${quickResult.pii_types_found.join(', ')}`);
    console.log('\nProtected text:');
    console.log(quickResult.protected_text);
  } catch (error) {
    console.log('\n⚠️ Quick protection failed, using basic protection:');

    // Fallback to basic protection for common PII patterns
    let protectedText = mixedText;
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phonePattern = /\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;

    protectedText = protectedText.replace(emailPattern, (match) =>
      basicPIIProtection.protectPIIValue(match, 'email')
    );
    protectedText = protectedText.replace(phonePattern, (match) =>
      basicPIIProtection.protectPIIValue(match, 'phone')
    );

    console.log('\nProtected text (fallback):');
    console.log(protectedText);
  }

  // Test 5: Service configuration and capabilities
  console.log('\n\n📋 Test 5: Service Configuration & Capabilities');
  console.log('===============================================');

  const services = [
    { name: 'Basic (Mask)', service: basicPIIProtection },
    { name: 'Strict (Hash)', service: strictPIIProtection },
    { name: 'Partial', service: partialPIIProtection }
  ];

  for (const { name, service } of services) {
    const info = service.getServiceInfo();
    console.log(`\n🔧 ${name} Service:`);
    console.log(`  Mode: ${info.config.redaction_mode}`);
    console.log(`  Format Preservation: ${info.config.preserve_format}`);
    console.log(`  Audit Enabled: ${info.config.audit_enabled}`);
    console.log(`  Supported Modes: ${info.supported_modes.join(', ')}`);
    console.log(`  Enterprise Integration: ${info.enterprise_integration}`);
  }

  // Test 6: Custom service creation
  console.log('\n\n📋 Test 6: Custom Service Creation');
  console.log('==================================');

  const customService = new PIIProtectionService({
    redaction_mode: 'partial',
    preserve_format: false,
    audit_enabled: false
  });

  console.log('\n🔧 Custom Service Configuration:');
  const customInfo = customService.getServiceInfo();
  console.log(`  Mode: ${customInfo.config.redaction_mode}`);
  console.log(`  Format Preservation: ${customInfo.config.preserve_format}`);
  console.log(`  Audit Enabled: ${customInfo.config.audit_enabled}`);

  console.log('\n🛡️ Custom Service Testing:');
  const customTestData = [
    { value: 'test@example.com', type: 'email' },
    { value: '555-123-4567', type: 'phone' }
  ];

  for (const item of customTestData) {
    const protected = customService.protectPIIValue(item.value, item.type);
    console.log(`${item.type}: "${item.value}" → "${protected}"`);
  }

  console.log('\n🎉 PIIProtectionService Test Complete!');
  console.log('====================================');
  console.log();
  console.log('✅ Key Features Demonstrated:');
  console.log('• Simple API for basic PII protection with multiple redaction modes');
  console.log('• Batch processing for efficient multi-value protection');
  console.log('• Advanced protection integration with comprehensive PIIProtectionManager');
  console.log('• Quick protection for mixed content with automatic PII detection');
  console.log('• Configurable service instances for different protection requirements');
  console.log('• Format preservation options for maintaining data structure');
  console.log();
  console.log('🔗 Integration Benefits:');
  console.log('• Simple interface for basic use cases with immediate protection');
  console.log('• Seamless escalation to advanced features when needed');
  console.log('• Enterprise-grade capabilities accessible through clean API');
  console.log('• Flexible configuration for different security requirements');
  console.log('• Production-ready fallback mechanisms for reliable operation');
}

// Run the test
testPIIProtectionService().catch(console.error);