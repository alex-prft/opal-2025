#!/usr/bin/env node

/**
 * Error Prevention Validation Script
 *
 * This script scans the codebase for common error patterns that could lead to
 * runtime crashes, particularly undefined property access patterns.
 */

const fs = require('fs');
const path = require('path');

// Patterns to check for
const DANGEROUS_PATTERNS = [
  {
    pattern: /\.\w+\.\w+(?!\?)/g, // Direct property access without optional chaining
    message: 'Potential unsafe property access - consider using optional chaining (?.) or null checks',
    severity: 'warning'
  },
  {
    pattern: /\.length(?!\s*\?\?|\s*\||^\?)/g, // Direct .length access without null check
    message: 'Direct .length access - ensure array/string is not null/undefined',
    severity: 'warning'
  },
  {
    pattern: /\.map\(/g, // Direct .map without null check
    message: 'Direct .map() call - ensure array is not null/undefined',
    severity: 'warning'
  },
  {
    pattern: /fetch\([^)]+\)[^.]*\.(json|text)\(/g, // Fetch without error handling
    message: 'Fetch call without error handling - add try/catch block',
    severity: 'error'
  }
];

// Files and directories to check
const PATHS_TO_CHECK = [
  'src/components',
  'src/app',
  'src/lib'
];

// Files to ignore
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /\.next/,
  /build/,
  /dist/
];

function shouldIgnorePath(filePath) {
  return IGNORE_PATTERNS.some(pattern => pattern.test(filePath));
}

function scanFile(filePath) {
  if (shouldIgnorePath(filePath) || !filePath.match(/\.(ts|tsx|js|jsx)$/)) {
    return [];
  }

  const issues = [];

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    DANGEROUS_PATTERNS.forEach(({ pattern, message, severity }) => {
      lines.forEach((line, lineIndex) => {
        const matches = [...line.matchAll(pattern)];
        matches.forEach(match => {
          // Skip if line contains safe patterns
          if (
            line.includes('?.') || // Optional chaining
            line.includes('??') || // Nullish coalescing
            line.includes('&&') || // Logical AND guard
            line.includes('||') || // Logical OR guard
            line.includes('try {') || // In try block
            line.includes('safeGet(') // Using safeGet helper
          ) {
            return;
          }

          issues.push({
            file: filePath,
            line: lineIndex + 1,
            column: match.index + 1,
            severity,
            message,
            code: line.trim(),
            pattern: pattern.source
          });
        });
      });
    });
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
  }

  return issues;
}

function scanDirectory(dirPath) {
  let issues = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (shouldIgnorePath(fullPath)) {
        continue;
      }

      if (entry.isDirectory()) {
        issues = issues.concat(scanDirectory(fullPath));
      } else if (entry.isFile()) {
        issues = issues.concat(scanFile(fullPath));
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
  }

  return issues;
}

function main() {
  console.log('🔍 Scanning for potential error-prone patterns...\n');

  let allIssues = [];

  // Scan specified paths
  PATHS_TO_CHECK.forEach(pathToCheck => {
    if (fs.existsSync(pathToCheck)) {
      console.log(`Scanning ${pathToCheck}...`);
      const issues = scanDirectory(pathToCheck);
      allIssues = allIssues.concat(issues);
    } else {
      console.log(`⚠️  Path ${pathToCheck} does not exist, skipping...`);
    }
  });

  // Group issues by severity
  const errors = allIssues.filter(issue => issue.severity === 'error');
  const warnings = allIssues.filter(issue => issue.severity === 'warning');

  // Display results
  console.log(`\n📊 Scan Results:`);
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Warnings: ${warnings.length}`);
  console.log(`   Total: ${allIssues.length}`);

  if (errors.length > 0) {
    console.log('\n❌ ERRORS (must fix):');
    errors.forEach(issue => {
      console.log(`   ${issue.file}:${issue.line}:${issue.column}`);
      console.log(`   ${issue.message}`);
      console.log(`   Code: ${issue.code}`);
      console.log('');
    });
  }

  if (warnings.length > 0 && process.argv.includes('--verbose')) {
    console.log('\n⚠️  WARNINGS (should review):');
    warnings.forEach(issue => {
      console.log(`   ${issue.file}:${issue.line}:${issue.column}`);
      console.log(`   ${issue.message}`);
      console.log(`   Code: ${issue.code}`);
      console.log('');
    });
  } else if (warnings.length > 0) {
    console.log('\n⚠️  Use --verbose to see warning details');
  }

  // Specific checks for our known issues
  console.log('\n🎯 Specific Issue Checks:');

  // Check for diagnosticsData.recentEvents usage
  const recentEventsIssues = allIssues.filter(issue =>
    issue.code.includes('diagnosticsData.recentEvents') ||
    issue.code.includes('diagnosticsData.agentEvents') ||
    issue.code.includes('diagnosticsData.lastWebhook')
  );

  if (recentEventsIssues.length > 0) {
    console.log('   ❌ Found usage of non-existent API properties:');
    recentEventsIssues.forEach(issue => {
      console.log(`      ${issue.file}:${issue.line} - ${issue.code}`);
    });
  } else {
    console.log('   ✅ No usage of non-existent API properties found');
  }

  // Return exit code based on errors
  const exitCode = errors.length > 0 ? 1 : 0;

  if (exitCode === 0) {
    console.log('\n✅ No critical issues found!');
  } else {
    console.log('\n❌ Critical issues found. Please fix errors before proceeding.');
  }

  console.log('\n💡 Tips:');
  console.log('   - Use optional chaining (?.) for safe property access');
  console.log('   - Use nullish coalescing (??) for default values');
  console.log('   - Implement proper error boundaries in React components');
  console.log('   - Test components with null/undefined data');
  console.log('   - Validate API response structures match your interfaces');

  process.exit(exitCode);
}

if (require.main === module) {
  main();
}

module.exports = { scanFile, scanDirectory, DANGEROUS_PATTERNS };