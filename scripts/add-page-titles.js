#!/usr/bin/env node

/**
 * Script to systematically add page titles to all pages
 *
 * This script identifies pages that need titles and provides examples
 * of how to add them for both server and client components.
 */

const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(__dirname, '../src/app');

// Pages that already have titles implemented (to avoid duplicates)
const PAGES_WITH_TITLES = new Set([
  '/page.tsx',
  '/engine/results/page.tsx',
  '/engine/results/[tier1]/page.tsx',
  '/engine/results/[tier1]/[tier2]/page.tsx',
  '/engine/results/[tier1]/[tier2]/[tier3]/page.tsx'
]);

// Static page title mappings from our utility
const STATIC_TITLES = {
  '/how-it-works/page.tsx': { title: 'How It Works', description: 'Learn how the Optimizely Strategy Assistant works and how it can help optimize your digital experience.' },
  '/monitoring/page.tsx': { title: 'System Monitoring', description: 'Real-time monitoring and health status of the Optimizely Strategy Assistant system.' },
  '/docs/page.tsx': { title: 'Documentation', description: 'Complete documentation and guides for using the Optimizely Strategy Assistant.' },
  '/engine/page.tsx': { title: 'Strategy Engine', description: 'The core AI-powered strategy engine for generating personalized Optimizely recommendations.' },
  '/engine/admin/page.tsx': { title: 'Administration', section: 'Engine', description: 'Administrative controls and configuration for the Optimizely Strategy Assistant.' },
  '/engine/phase2-dashboard/page.tsx': { title: 'Phase 2 Dashboard', section: 'Engine', description: 'Phase 2 implementation dashboard with progress tracking and insights.' },
  '/engine/phase3-dashboard/page.tsx': { title: 'Phase 3 Dashboard', section: 'Engine', description: 'Phase 3 optimization dashboard with advanced analytics and recommendations.' },
  '/admin/integration-dashboard/page.tsx': { title: 'Integration Dashboard', section: 'Administration', description: 'Monitor and manage OPAL integrations and data flow.' },
  '/admin/opal-integration-test/page.tsx': { title: 'OPAL Integration Test', section: 'Administration', description: 'Test and validate OPAL integration connectivity and functionality.' }
};

function findAllPageFiles(dir, baseDir = dir) {
  const files = [];

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findAllPageFiles(fullPath, baseDir));
    } else if (item === 'page.tsx') {
      const relativePath = path.relative(baseDir, fullPath);
      files.push('/' + relativePath.replace(/\\/g, '/'));
    }
  }

  return files;
}

function isClientComponent(filePath) {
  const fullPath = path.join(APP_DIR, filePath.slice(1));
  if (!fs.existsSync(fullPath)) return false;

  const content = fs.readFileSync(fullPath, 'utf8');
  return content.includes("'use client'") || content.includes('"use client"');
}

function hasMetadata(filePath) {
  const fullPath = path.join(APP_DIR, filePath.slice(1));
  if (!fs.existsSync(fullPath)) return false;

  const content = fs.readFileSync(fullPath, 'utf8');
  return content.includes('export const metadata') || content.includes('generateMetadata') || content.includes('updateDocumentTitle');
}

function generateServerComponentExample(pageInfo) {
  return `// Add this to the top of ${pageInfo.path}
import { generatePageMetadata } from '@/lib/utils/page-titles';

export const metadata = generatePageMetadata({
  pageTitle: '${pageInfo.title}',
  ${pageInfo.section ? `section: '${pageInfo.section}',` : ''}
  description: '${pageInfo.description}'
});`;
}

function generateClientComponentExample(pageInfo) {
  return `// Add this import to ${pageInfo.path}
import { generatePageTitle, updateDocumentTitle } from '@/lib/utils/page-titles';

// Add this useEffect in your component
useEffect(() => {
  const pageTitle = generatePageTitle({
    pageTitle: '${pageInfo.title}'${pageInfo.section ? `, section: '${pageInfo.section}'` : ''}
  });
  updateDocumentTitle(pageTitle);
}, []);`;
}

function main() {
  console.log('🔍 Finding all page files...\n');

  const allPages = findAllPageFiles(APP_DIR);
  console.log(`Found ${allPages.length} page files total\n`);

  const pagesNeedingTitles = allPages.filter(page => {
    if (PAGES_WITH_TITLES.has(page)) return false;
    return !hasMetadata(page);
  });

  console.log(`📝 ${pagesNeedingTitles.length} pages need titles added:\n`);

  // Group by type
  const serverComponents = [];
  const clientComponents = [];
  const dynamicRoutes = [];

  pagesNeedingTitles.forEach(page => {
    if (page.includes('[') && page.includes(']')) {
      dynamicRoutes.push(page);
    } else if (isClientComponent(page)) {
      clientComponents.push(page);
    } else {
      serverComponents.push(page);
    }
  });

  console.log('🖥️  SERVER COMPONENTS (use metadata export):');
  console.log('=' .repeat(50));
  serverComponents.forEach(page => {
    const titleInfo = STATIC_TITLES[page] || {
      title: path.basename(path.dirname(page)).split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      description: `${path.basename(path.dirname(page))} page in the Optimizely Strategy Assistant.`
    };

    console.log(`\n📄 ${page}`);
    console.log(generateServerComponentExample({
      path: page,
      ...titleInfo
    }));
  });

  console.log('\n\n📱 CLIENT COMPONENTS (use useEffect with updateDocumentTitle):');
  console.log('=' .repeat(55));
  clientComponents.forEach(page => {
    const titleInfo = STATIC_TITLES[page] || {
      title: path.basename(path.dirname(page)).split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      description: `${path.basename(path.dirname(page))} page in the Optimizely Strategy Assistant.`
    };

    console.log(`\n📄 ${page}`);
    console.log(generateClientComponentExample({
      path: page,
      ...titleInfo
    }));
  });

  if (dynamicRoutes.length > 0) {
    console.log('\n\n🔀 DYNAMIC ROUTES (require custom logic):');
    console.log('=' .repeat(45));
    dynamicRoutes.forEach(page => {
      console.log(`\n📄 ${page}`);
      console.log('// This route uses dynamic segments and needs custom title generation');
      console.log('// based on the URL parameters. See the existing Results pages for examples.');
    });
  }

  console.log('\n\n✅ PAGES ALREADY IMPLEMENTED:');
  console.log('=' .repeat(35));
  PAGES_WITH_TITLES.forEach(page => {
    console.log(`✓ ${page}`);
  });

  console.log('\n\n📋 SUMMARY:');
  console.log('=' .repeat(15));
  console.log(`📊 Total pages: ${allPages.length}`);
  console.log(`✅ Pages with titles: ${PAGES_WITH_TITLES.size}`);
  console.log(`🖥️  Server components needing titles: ${serverComponents.length}`);
  console.log(`📱 Client components needing titles: ${clientComponents.length}`);
  console.log(`🔀 Dynamic routes needing titles: ${dynamicRoutes.length}`);

  console.log('\n🚀 Next steps:');
  console.log('1. Apply the server component examples above');
  console.log('2. Apply the client component examples above');
  console.log('3. Implement custom logic for dynamic routes');
  console.log('4. Test all pages to verify titles are working');
  console.log('5. Run: npm run dev and check page titles in browser tabs');
}

if (require.main === module) {
  main();
}

module.exports = { findAllPageFiles, isClientComponent, hasMetadata };