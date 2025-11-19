/**
 * Debug script to test Ask Assistant configuration and section mapping
 */

// Test the section mapping
const testSectionMapping = () => {
  console.log('=== TESTING SECTION MAPPING ===');

  // Import the functions
  const { getResultsSectionKey } = require('./src/lib/askAssistant/sectionMapping.ts');
  const { getAskAssistantConfig } = require('./src/lib/askAssistant/config.ts');

  // Test cases
  const testCases = [
    {
      name: 'strategy-plans/quick-wins',
      tier1: 'strategy-plans',
      tier2: 'quick-wins',
      tier3: undefined,
      pathname: '/engine/results/strategy-plans/quick-wins'
    }
  ];

  testCases.forEach(testCase => {
    console.log(`\n--- Testing: ${testCase.name} ---`);
    console.log(`Input: tier1="${testCase.tier1}", tier2="${testCase.tier2}", tier3="${testCase.tier3}", pathname="${testCase.pathname}"`);

    try {
      const sectionKey = getResultsSectionKey(testCase.tier1, testCase.tier2, testCase.tier3, testCase.pathname);
      console.log(`Section Key: ${sectionKey}`);

      if (sectionKey) {
        const config = getAskAssistantConfig(sectionKey);
        console.log(`Config Found: ${!!config}`);

        if (config) {
          console.log(`Expert Prompt Starts with TODO: ${config.expertPromptExample.startsWith('TODO:')}`);
          console.log(`Should be Available: ${config && !config.expertPromptExample.startsWith('TODO:')}`);
          console.log(`Config Label: ${config.label}`);
          console.log(`Config Description: ${config.description.substring(0, 100)}...`);
        }
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  });
};

// Run the test
try {
  testSectionMapping();
} catch (error) {
  console.error('Failed to run test:', error.message);
  console.log('Note: This script needs to be run from the project root with Node.js that supports ES modules');
}