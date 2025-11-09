#!/usr/bin/env node

/**
 * Comprehensive Dashboard Validation Script
 * Automatically detects missing Lucide React icon imports and utility function imports
 * Run with: node scripts/validate-icons.js
 */

const fs = require('fs');
const path = require('path');

function validateIconImports(filePath) {
  console.log(`🔍 Validating icon imports in: ${filePath}`);

  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Extract current imports from lucide-react
    const importMatch = content.match(/import\s*{([^}]+)}\s*from\s*['"]lucide-react['"];?/s);
    if (!importMatch) {
      console.log('❌ No lucide-react imports found');
      return false;
    }

    const currentImports = importMatch[1]
      .split(',')
      .map(imp => imp.trim())
      .filter(imp => imp.length > 0);

    console.log(`📦 Currently imported: ${currentImports.length} icons`);

    // Find all potential icon usages (PascalCase JSX elements)
    const iconUsages = new Set();
    const jsxIconPattern = /<([A-Z][a-zA-Z0-9]*)\s*(?:\/?>|\s)/g;
    let match;

    while ((match = jsxIconPattern.exec(content)) !== null) {
      const iconName = match[1];
      // Filter out known React/component names that aren't icons
      const knownComponents = [
        'Card', 'CardContent', 'CardDescription', 'CardHeader', 'CardTitle',
        'Button', 'Badge', 'Tabs', 'TabsList', 'TabsTrigger', 'TabsContent',
        'Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue',
        'DropdownMenu', 'DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuTrigger',
        'Progress', 'Accordion', 'AccordionContent', 'AccordionItem', 'AccordionTrigger',
        'ImpactEffortMatrix', 'TimelineRoadmap', 'AnalyticsContentDashboard'
      ];

      if (!knownComponents.includes(iconName)) {
        iconUsages.add(iconName);
      }
    }

    console.log(`🎯 Found ${iconUsages.size} potential icon usages`);

    // Find missing imports
    const missingIcons = Array.from(iconUsages).filter(icon => !currentImports.includes(icon));

    if (missingIcons.length === 0) {
      console.log('✅ All icons are properly imported!');
      return true;
    }

    console.log(`❌ Found ${missingIcons.length} missing icon imports:`);
    console.log(missingIcons.map(icon => `  - ${icon}`).join('\n'));

    // Generate the complete import statement
    const allIcons = [...currentImports, ...missingIcons].sort();
    const importStatement = `import {\n${allIcons.map(icon => `  ${icon}`).join(',\n')}\n} from 'lucide-react';`;

    console.log('\n🔧 Updated import statement:');
    console.log(importStatement);

    return false;

  } catch (error) {
    console.error('❌ Error validating icons:', error.message);
    return false;
  }
}

function validateUtilityImports(filePath) {
  console.log(`🔧 Validating utility function imports in: ${filePath}`);

  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Extract current imports from dashboard utilities
    const utilityImportMatch = content.match(/import\s*{([^}]+)}\s*from\s*['"]@\/utils\/dashboard-utilities['"];?/s);
    const currentUtilityImports = utilityImportMatch
      ? utilityImportMatch[1]
          .split(',')
          .map(imp => imp.trim())
          .filter(imp => imp.length > 0)
      : [];

    console.log(`📦 Currently imported utility functions: ${currentUtilityImports.length}`);

    // Define available utility functions from dashboard-utilities.ts
    const availableUtilities = [
      'getStatusColor',
      'getScoreColor',
      'getScoreColorWithBackground',
      'getRiskColor',
      'getImpactColor',
      'getPriorityColor',
      'getProgressColor',
      'getChartColor',
      'getChartColorScheme',
      'getTrendColor',
      'getTrendIcon',
      'getBadgeVariant',
      'formatPercentage',
      'formatScore',
      'formatCurrency',
      'formatNumber',
      'isValidScore',
      'isValidStatus',
      'isValidRiskLevel',
      'cn'
    ];

    // Find potential utility function usages
    const utilityUsages = new Set();

    // Look for function calls that match utility function patterns
    availableUtilities.forEach(utilityName => {
      const pattern = new RegExp(`\\b${utilityName}\\s*\\(`, 'g');
      if (pattern.test(content)) {
        utilityUsages.add(utilityName);
      }
    });

    console.log(`🎯 Found ${utilityUsages.size} utility function usages`);

    // Find missing imports
    const missingUtilities = Array.from(utilityUsages).filter(utility =>
      !currentUtilityImports.includes(utility)
    );

    if (missingUtilities.length === 0) {
      console.log('✅ All utility functions are properly imported!');
      return true;
    }

    console.log(`❌ Found ${missingUtilities.length} missing utility function imports:`);
    console.log(missingUtilities.map(utility => `  - ${utility}`).join('\n'));

    // Generate the complete import statement
    const allUtilities = [...new Set([...currentUtilityImports, ...missingUtilities])].sort();
    const importStatement = `import {\n${allUtilities.map(utility => `  ${utility}`).join(',\n')}\n} from '@/utils/dashboard-utilities';`;

    console.log('\n🔧 Updated utility import statement:');
    console.log(importStatement);

    return false;

  } catch (error) {
    console.error('❌ Error validating utility imports:', error.message);
    return false;
  }
}

// Main execution
const targetFile = path.join(process.cwd(), 'src/components/StrategyDashboard.tsx');

if (!fs.existsSync(targetFile)) {
  console.error('❌ StrategyDashboard.tsx not found');
  process.exit(1);
}

console.log('🚀 Running comprehensive dashboard validation...\n');

const iconValidation = validateIconImports(targetFile);
console.log(''); // Empty line for spacing

const utilityValidation = validateUtilityImports(targetFile);
console.log(''); // Empty line for spacing

const overallValid = iconValidation && utilityValidation;

if (overallValid) {
  console.log('🎉 All validations passed! Dashboard is properly configured.');
} else {
  console.log('⚠️  Some validations failed. Please review the issues above.');
}

process.exit(overallValid ? 0 : 1);