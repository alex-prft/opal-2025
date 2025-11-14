#!/usr/bin/env node
/**
 * OPAL Agent Mapping Validation Script
 *
 * Validates that all OPAL agent mappings in the SOP-compliant data service
 * are properly configured and follow SOP requirements
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating OPAL Agent Mappings...\n');

// Read the SOP-compliant data service file
const dataServicePath = path.join(__dirname, '../src/lib/sop-compliant-opal-data-service.ts');

let dataServiceContent;
try {
  dataServiceContent = fs.readFileSync(dataServicePath, 'utf8');
} catch (error) {
  console.error('❌ ERROR: Could not read SOP-compliant data service file');
  console.error(`   Path: ${dataServicePath}`);
  console.error(`   Error: ${error.message}`);
  process.exit(1);
}

// Extract AGENT_MAPPINGS from the file
const agentMappingsMatch = dataServiceContent.match(/AGENT_MAPPINGS\s*=\s*{([^}]+)}/s);

if (!agentMappingsMatch) {
  console.error('❌ ERROR: Could not find AGENT_MAPPINGS in data service file');
  process.exit(1);
}

const agentMappingsContent = agentMappingsMatch[1];

// Parse the mappings (simplified parser for validation)
const mappingLines = agentMappingsContent.split('\n')
  .map(line => line.trim())
  .filter(line => line && !line.startsWith('//'))
  .filter(line => line.includes(':'));

const mappings = {};
let validationErrors = [];
let warnings = [];

mappingLines.forEach(line => {
  const match = line.match(/['"`]([^'"`]+)['"`]\s*:\s*\[([^\]]+)\]/);
  if (match) {
    const pagePattern = match[1];
    const agentsStr = match[2];
    const agents = agentsStr.split(',')
      .map(agent => agent.trim().replace(/['"]/g, ''));

    mappings[pagePattern] = agents;
  }
});

console.log(`📋 Found ${Object.keys(mappings).length} agent mappings to validate\n`);

// Define valid OPAL agents (from SOP validation middleware)
const validOPALAgents = [
  'strategy_workflow',
  'roadmap_generator',
  'content_review',
  'audience_suggester',
  'geo_audit',
  'experiment_blueprinter',
  'personalization_idea_generator',
  'customer_journey',
  'integration_health',
  'cmp_organizer'
];

// Define expected page patterns (from SOP requirements)
const expectedPagePatterns = [
  'strategy-plans',
  'strategy-osa',
  'strategy-quick-wins',
  'strategy-maturity',
  'strategy-roadmap',
  'insights-content',
  'insights-audiences',
  'insights-cx',
  'optimization-experimentation',
  'optimization-personalization',
  'optimization-ux',
  'dxptools-webx',
  'dxptools-content-recs',
  'dxptools-cms',
  'dxptools-odp',
  'dxptools-cmp'
];

// Validation 1: Check that all expected patterns are mapped
console.log('1️⃣ Checking coverage of expected page patterns...');
expectedPagePatterns.forEach(pattern => {
  if (!mappings[pattern]) {
    validationErrors.push(`Missing mapping for expected page pattern: ${pattern}`);
  } else {
    console.log(`   ✅ ${pattern}: ${mappings[pattern].join(', ')}`);
  }
});

// Validation 2: Check that all mapped agents are valid
console.log('\n2️⃣ Checking agent validity...');
Object.entries(mappings).forEach(([pattern, agents]) => {
  agents.forEach(agent => {
    if (!validOPALAgents.includes(agent)) {
      validationErrors.push(`Invalid agent "${agent}" in mapping for ${pattern}`);
    }
  });
});

// Validation 3: Check page pattern format compliance
console.log('3️⃣ Checking page pattern format compliance...');
Object.keys(mappings).forEach(pattern => {
  // Should follow tier1-tier2 format
  if (!/^[a-z]+-[a-z]+(-[a-z]+)?$/.test(pattern)) {
    validationErrors.push(`Invalid page pattern format: ${pattern} (should be tier1-tier2 or tier1-tier2-tier3)`);
  }
});

// Validation 4: Check for primary/secondary agent assignments
console.log('4️⃣ Checking agent assignment patterns...');
Object.entries(mappings).forEach(([pattern, agents]) => {
  if (agents.length === 0) {
    validationErrors.push(`No agents assigned to pattern: ${pattern}`);
  } else if (agents.length > 3) {
    warnings.push(`Pattern ${pattern} has many agents (${agents.length}): may impact performance`);
  }
});

// Validation 5: Check for strategic agent distribution
console.log('5️⃣ Checking strategic agent distribution...');
const agentUsage = {};
validOPALAgents.forEach(agent => {
  agentUsage[agent] = 0;
});

Object.values(mappings).forEach(agents => {
  agents.forEach(agent => {
    if (agentUsage[agent] !== undefined) {
      agentUsage[agent]++;
    }
  });
});

const unusedAgents = Object.entries(agentUsage)
  .filter(([agent, count]) => count === 0)
  .map(([agent, count]) => agent);

if (unusedAgents.length > 0) {
  warnings.push(`Unused OPAL agents: ${unusedAgents.join(', ')}`);
}

// Validation 6: Tier-specific agent assignments
console.log('6️⃣ Checking tier-specific agent logic...');
const tierSpecificChecks = {
  'strategy': ['strategy_workflow', 'roadmap_generator'],
  'insights': ['content_review', 'audience_suggester', 'geo_audit'],
  'optimization': ['experiment_blueprinter', 'personalization_idea_generator', 'customer_journey'],
  'dxptools': ['integration_health', 'cmp_organizer']
};

Object.entries(mappings).forEach(([pattern, agents]) => {
  const tier1 = pattern.split('-')[0];
  const expectedAgents = tierSpecificChecks[tier1];

  if (expectedAgents) {
    const hasValidAgent = agents.some(agent => expectedAgents.includes(agent));
    if (!hasValidAgent) {
      validationErrors.push(`Pattern ${pattern} should use agents from: ${expectedAgents.join(', ')}`);
    }
  }
});

// Report results
console.log('\n📊 VALIDATION RESULTS\n');

if (validationErrors.length === 0) {
  console.log('✅ SOP AGENT MAPPINGS: VALID');
  console.log(`   • ${Object.keys(mappings).length} page patterns mapped`);
  console.log(`   • ${validOPALAgents.length} valid OPAL agents available`);
  console.log(`   • ${Object.values(agentUsage).reduce((sum, count) => sum + count, 0)} total agent assignments`);
} else {
  console.log('❌ SOP AGENT MAPPINGS: INVALID');
  console.log('\n🚫 ERRORS:');
  validationErrors.forEach(error => {
    console.log(`   • ${error}`);
  });
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach(warning => {
    console.log(`   • ${warning}`);
  });
}

// Agent usage summary
console.log('\n📈 AGENT USAGE SUMMARY:');
Object.entries(agentUsage)
  .sort(([,a], [,b]) => b - a)
  .forEach(([agent, count]) => {
    const status = count === 0 ? '⚪' : count >= 3 ? '🔴' : count >= 2 ? '🟡' : '🟢';
    console.log(`   ${status} ${agent}: ${count} mappings`);
  });

// Mapping coverage by tier
console.log('\n🗂️  TIER COVERAGE:');
const tierCoverage = {};
Object.keys(mappings).forEach(pattern => {
  const tier1 = pattern.split('-')[0];
  tierCoverage[tier1] = (tierCoverage[tier1] || 0) + 1;
});

Object.entries(tierCoverage).forEach(([tier, count]) => {
  console.log(`   📁 ${tier}: ${count} page patterns`);
});

console.log('\n');

if (validationErrors.length > 0) {
  console.error('❌ OPAL agent mapping validation failed');
  process.exit(1);
} else {
  console.log('✅ OPAL agent mapping validation passed');
  process.exit(0);
}