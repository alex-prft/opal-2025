/**
<<<<<<< HEAD
 * Utilities for Claude Requirements Gathering System
 * 
 * This file contains helper functions for managing requirements state,
 * file I/O operations, and system coordination.
 */

import * as fs from 'fs';
import * as path from 'path';

=======
 * Claude Requirements Gathering System - Core Utilities
 *
 * This file provides core utilities, interfaces, and functions for the
 * requirements gathering system following OSA architectural patterns.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

// Core interfaces following OSA TypeScript patterns
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
export interface RequirementMetadata {
  id: string;
  name: string;
  description: string;
  createdAt: string;
<<<<<<< HEAD
  status: 'ACTIVE' | 'COMPLETE' | 'INCOMPLETE' | 'CANCELED';
=======
  status: 'ACTIVE' | 'COMPLETE' | 'CANCELLED';
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
  phase: 'DISCOVERY' | 'ANALYSIS' | 'DETAIL' | 'SPEC';
  discoveryQuestionsCount: number;
  discoveryQuestionsAnswered: number;
  detailQuestionsCount: number;
  detailQuestionsAnswered: number;
<<<<<<< HEAD
=======
  lastUpdated?: string;
  completedAt?: string;
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
}

export interface Question {
  id: number;
  question: string;
<<<<<<< HEAD
  defaultAnswer: string;
  context?: string;
=======
  context?: string;
  defaultAnswer: 'YES' | 'NO';
  category: 'discovery' | 'detail';
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
}

export interface QuestionAnswer {
  question: string;
  answer: string;
  timestamp: string;
}

<<<<<<< HEAD
/**
 * Generate a unique requirement ID based on current timestamp and description
 */
export function generateRequirementId(description: string): string {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 16).replace(/[-:T]/g, '').replace(/\./g, '');
  const slug = description
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 30);
  
  return `${timestamp}-${slug}`;
}

/**
 * Get the path to the requirements directory
 */
export function getRequirementsPath(): string {
  return path.join(process.cwd(), 'requirements');
}

/**
 * Get the path to the current requirement file
 */
export function getCurrentRequirementPath(): string {
  return path.join(getRequirementsPath(), '.current-requirement');
}

/**
 * Get the current active requirement ID
 */
export function getCurrentRequirement(): string | null {
  try {
    const currentPath = getCurrentRequirementPath();
    if (fs.existsSync(currentPath)) {
      return fs.readFileSync(currentPath, 'utf8').trim();
    }
    return null;
  } catch (error) {
    console.error('Error reading current requirement:', error);
=======
export interface RequirementSummary {
  id: string;
  name: string;
  status: RequirementMetadata['status'];
  phase: RequirementMetadata['phase'];
  createdAt: string;
  completedAt?: string;
  progress: {
    discovery: string;
    detail: string;
  };
}

// Constants following CLAUDE.md patterns
const REQUIREMENTS_DIR = './requirements';
const CLAUDE_REQUIREMENTS_DIR = './claude-requirements';
const STATE_FILE = join(CLAUDE_REQUIREMENTS_DIR, 'current-requirement.json');

// Error handling following OSA production safety patterns
export class RequirementsError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'RequirementsError';
  }
}

/**
 * Generate a unique requirement ID from description
 */
export function generateRequirementId(description: string): string {
  try {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cleanDesc = description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(' ')
      .slice(0, 3)
      .join('-');

    return `req-${timestamp}-${cleanDesc}`;
  } catch (error) {
    throw new RequirementsError(`Failed to generate requirement ID: ${error.message}`, 'ID_GENERATION_ERROR');
  }
}

/**
 * Get current active requirement ID
 */
export function getCurrentRequirement(): string | null {
  try {
    if (!existsSync(STATE_FILE)) {
      return null;
    }

    const state = JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
    return state.currentRequirementId || null;
  } catch (error) {
    console.warn('Could not read current requirement state:', error.message);
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    return null;
  }
}

/**
<<<<<<< HEAD
 * Set the current active requirement ID
 */
export function setCurrentRequirement(requirementId: string): void {
  try {
    const currentPath = getCurrentRequirementPath();
    fs.writeFileSync(currentPath, requirementId, 'utf8');
  } catch (error) {
    console.error('Error setting current requirement:', error);
    throw error;
=======
 * Set current active requirement ID
 */
export function setCurrentRequirement(requirementId: string): void {
  try {
    if (!existsSync(CLAUDE_REQUIREMENTS_DIR)) {
      mkdirSync(CLAUDE_REQUIREMENTS_DIR, { recursive: true });
    }

    const state = { currentRequirementId: requirementId, updatedAt: new Date().toISOString() };
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    throw new RequirementsError(`Failed to set current requirement: ${error.message}`, 'STATE_WRITE_ERROR');
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
  }
}

/**
<<<<<<< HEAD
 * Clear the current active requirement
 */
export function clearCurrentRequirement(): void {
  try {
    const currentPath = getCurrentRequirementPath();
    if (fs.existsSync(currentPath)) {
      fs.unlinkSync(currentPath);
    }
  } catch (error) {
    console.error('Error clearing current requirement:', error);
=======
 * Clear current active requirement
 */
export function clearCurrentRequirement(): void {
  try {
    if (existsSync(STATE_FILE)) {
      writeFileSync(STATE_FILE, JSON.stringify({ currentRequirementId: null, clearedAt: new Date().toISOString() }, null, 2));
    }
  } catch (error) {
    console.warn('Could not clear current requirement:', error.message);
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
  }
}

/**
<<<<<<< HEAD
 * Get the path to a specific requirement directory
 */
export function getRequirementPath(requirementId: string): string {
  return path.join(getRequirementsPath(), requirementId);
}

/**
 * Create a new requirement directory with initial structure
 */
export function createRequirementDirectory(requirementId: string): void {
  const reqPath = getRequirementPath(requirementId);
  if (!fs.existsSync(reqPath)) {
    fs.mkdirSync(reqPath, { recursive: true });
=======
 * Create directory for a requirement
 */
export function createRequirementDirectory(requirementId: string): void {
  try {
    const reqDir = join(REQUIREMENTS_DIR, requirementId);
    if (!existsSync(reqDir)) {
      mkdirSync(reqDir, { recursive: true });
    }
  } catch (error) {
    throw new RequirementsError(`Failed to create requirement directory: ${error.message}`, 'DIRECTORY_CREATE_ERROR');
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
  }
}

/**
<<<<<<< HEAD
 * Load metadata for a requirement
 */
export function loadRequirementMetadata(requirementId: string): RequirementMetadata | null {
  try {
    const metadataPath = path.join(getRequirementPath(requirementId), 'metadata.json');
    if (fs.existsSync(metadataPath)) {
      const content = fs.readFileSync(metadataPath, 'utf8');
      return JSON.parse(content);
    }
    return null;
  } catch (error) {
    console.error('Error loading requirement metadata:', error);
=======
 * Load requirement metadata with error handling
 */
export function loadRequirementMetadata(requirementId: string): RequirementMetadata | null {
  try {
    const metadataPath = join(REQUIREMENTS_DIR, requirementId, 'metadata.json');
    if (!existsSync(metadataPath)) {
      return null;
    }

    const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));
    return metadata as RequirementMetadata;
  } catch (error) {
    console.warn(`Could not load metadata for ${requirementId}:`, error.message);
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    return null;
  }
}

/**
<<<<<<< HEAD
 * Save metadata for a requirement
 */
export function saveRequirementMetadata(requirementId: string, metadata: RequirementMetadata): void {
  try {
    const metadataPath = path.join(getRequirementPath(requirementId), 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving requirement metadata:', error);
    throw error;
=======
 * Save requirement metadata with validation
 */
export function saveRequirementMetadata(requirementId: string, metadata: RequirementMetadata): void {
  try {
    // Validate metadata structure
    if (!metadata.id || !metadata.name || !metadata.status) {
      throw new RequirementsError('Invalid metadata: missing required fields', 'METADATA_VALIDATION_ERROR');
    }

    const metadataPath = join(REQUIREMENTS_DIR, requirementId, 'metadata.json');
    metadata.lastUpdated = new Date().toISOString();

    writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  } catch (error) {
    throw new RequirementsError(`Failed to save metadata: ${error.message}`, 'METADATA_SAVE_ERROR');
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
  }
}

/**
<<<<<<< HEAD
 * Append content to a file in a requirement directory
 */
export function appendToRequirementFile(requirementId: string, filename: string, content: string): void {
  try {
    const filePath = path.join(getRequirementPath(requirementId), filename);
    fs.appendFileSync(filePath, content + '\n', 'utf8');
  } catch (error) {
    console.error(`Error appending to requirement file ${filename}:`, error);
    throw error;
=======
 * Write content to a requirement file
 */
export function writeRequirementFile(requirementId: string, filename: string, content: string): void {
  try {
    const filePath = join(REQUIREMENTS_DIR, requirementId, filename);
    writeFileSync(filePath, content, 'utf-8');
  } catch (error) {
    throw new RequirementsError(`Failed to write file ${filename}: ${error.message}`, 'FILE_WRITE_ERROR');
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
  }
}

/**
<<<<<<< HEAD
 * Write content to a file in a requirement directory
 */
export function writeRequirementFile(requirementId: string, filename: string, content: string): void {
  try {
    const filePath = path.join(getRequirementPath(requirementId), filename);
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (error) {
    console.error(`Error writing requirement file ${filename}:`, error);
    throw error;
=======
 * Append content to a requirement file
 */
export function appendToRequirementFile(requirementId: string, filename: string, content: string): void {
  try {
    const filePath = join(REQUIREMENTS_DIR, requirementId, filename);
    let existing = '';

    if (existsSync(filePath)) {
      existing = readFileSync(filePath, 'utf-8');
    }

    writeFileSync(filePath, existing + content, 'utf-8');
  } catch (error) {
    throw new RequirementsError(`Failed to append to file ${filename}: ${error.message}`, 'FILE_APPEND_ERROR');
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
  }
}

/**
<<<<<<< HEAD
 * Read content from a file in a requirement directory
 */
export function readRequirementFile(requirementId: string, filename: string): string | null {
  try {
    const filePath = path.join(getRequirementPath(requirementId), filename);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    return null;
  } catch (error) {
    console.error(`Error reading requirement file ${filename}:`, error);
=======
 * Read content from a requirement file
 */
export function readRequirementFile(requirementId: string, filename: string): string | null {
  try {
    const filePath = join(REQUIREMENTS_DIR, requirementId, filename);
    if (!existsSync(filePath)) {
      return null;
    }

    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.warn(`Could not read file ${filename}:`, error.message);
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
    return null;
  }
}

/**
<<<<<<< HEAD
 * List all requirements with their metadata
 */
export function listAllRequirements(): Array<{ id: string; metadata: RequirementMetadata | null }> {
  try {
    const requirementsPath = getRequirementsPath();
    if (!fs.existsSync(requirementsPath)) {
      return [];
    }

    const items = fs.readdirSync(requirementsPath, { withFileTypes: true });
    const requirements = items
      .filter(item => item.isDirectory())
      .map(item => ({
        id: item.name,
        metadata: loadRequirementMetadata(item.name)
      }))
      .filter(req => req.metadata !== null);

    return requirements;
  } catch (error) {
    console.error('Error listing requirements:', error);
    return [];
=======
 * Update the requirements index with current status
 */
export function updateRequirementsIndex(): void {
  try {
    if (!existsSync(REQUIREMENTS_DIR)) {
      mkdirSync(REQUIREMENTS_DIR, { recursive: true });
    }

    const requirements = listAllRequirements();

    let indexContent = `# Requirements Index\n\n`;
    indexContent += `**Last Updated:** ${new Date().toLocaleString()}\n\n`;
    indexContent += `## Summary\n\n`;
    indexContent += `- **Total Requirements:** ${requirements.length}\n`;
    indexContent += `- **Active:** ${requirements.filter(r => r.status === 'ACTIVE').length}\n`;
    indexContent += `- **Complete:** ${requirements.filter(r => r.status === 'COMPLETE').length}\n`;
    indexContent += `- **Cancelled:** ${requirements.filter(r => r.status === 'CANCELLED').length}\n\n`;

    if (requirements.length > 0) {
      indexContent += `## Requirements List\n\n`;
      indexContent += `| ID | Name | Status | Phase | Progress | Created |\n`;
      indexContent += `|---|---|---|---|---|---|\n`;

      requirements.forEach(req => {
        indexContent += `| ${req.id} | ${req.name} | ${req.status} | ${req.phase} | D:${req.progress.discovery} T:${req.progress.detail} | ${new Date(req.createdAt).toLocaleDateString()} |\n`;
      });

      indexContent += `\n`;
    }

    indexContent += `## Usage\n\n`;
    indexContent += `- **Start New Requirement:** \`/requirements-start [description]\`\n`;
    indexContent += `- **Check Status:** \`/requirements-status\`\n`;
    indexContent += `- **View Current:** \`/requirements-current\`\n`;
    indexContent += `- **List All:** \`/requirements-list\`\n`;
    indexContent += `- **End Current:** \`/requirements-end\`\n\n`;
    indexContent += `*Generated by Claude Requirements Gathering System*\n`;

    writeFileSync(join(REQUIREMENTS_DIR, 'index.md'), indexContent);
  } catch (error) {
    console.warn('Could not update requirements index:', error.message);
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
  }
}

/**
<<<<<<< HEAD
 * Update the requirements index file
 */
export function updateRequirementsIndex(): void {
  try {
    const requirements = listAllRequirements();
    const indexPath = path.join(getRequirementsPath(), 'index.md');
    
    let content = '# Requirements Index\n\n';
    content += 'This file contains a summary of all requirements in this project.\n\n';
    content += '| Feature Name | Status | Phase | Created | Path |\n';
    content += '|--------------|--------|-------|---------|------|\n';

    requirements.forEach(req => {
      if (req.metadata) {
        const status = getStatusEmoji(req.metadata.status);
        const phase = req.metadata.phase;
        const created = new Date(req.metadata.createdAt).toLocaleDateString();
        const path = req.id;
        
        content += `| ${req.metadata.name} | ${status} ${req.metadata.status} | ${phase} | ${created} | \`${path}/\` |\n`;
      }
    });

    content += '\n## Status Legend\n\n';
    content += '- ✅ COMPLETE: Ready for implementation\n';
    content += '- 🟢 ACTIVE: Currently being defined\n';
    content += '- ⚠️ INCOMPLETE: Paused or partially complete\n';
    content += '- ❌ CANCELED: Canceled or obsolete\n';

    fs.writeFileSync(indexPath, content, 'utf8');
  } catch (error) {
    console.error('Error updating requirements index:', error);
  }
}

/**
 * Get emoji for requirement status
 */
function getStatusEmoji(status: RequirementMetadata['status']): string {
  switch (status) {
    case 'COMPLETE': return '✅';
    case 'ACTIVE': return '🟢';
    case 'INCOMPLETE': return '⚠️';
    case 'CANCELED': return '❌';
    default: return '❓';
=======
 * List all requirements with summary information
 */
export function listAllRequirements(): RequirementSummary[] {
  try {
    if (!existsSync(REQUIREMENTS_DIR)) {
      return [];
    }

    const requirements: RequirementSummary[] = [];
    const dirs = readdirSync(REQUIREMENTS_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const dir of dirs) {
      const metadata = loadRequirementMetadata(dir);
      if (metadata) {
        requirements.push({
          id: metadata.id,
          name: metadata.name,
          status: metadata.status,
          phase: metadata.phase,
          createdAt: metadata.createdAt,
          completedAt: metadata.completedAt,
          progress: {
            discovery: `${metadata.discoveryQuestionsAnswered}/${metadata.discoveryQuestionsCount}`,
            detail: `${metadata.detailQuestionsAnswered}/${metadata.detailQuestionsCount}`
          }
        });
      }
    }

    // Sort by creation date (newest first)
    return requirements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn('Could not list requirements:', error.message);
    return [];
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
  }
}

/**
<<<<<<< HEAD
 * Generate discovery questions based on the initial request and OSA context
 */
export function generateDiscoveryQuestions(description: string): Question[] {
  const questions: Question[] = [
    {
      id: 1,
      question: "Will users interact with this feature through the OSA UI?",
      defaultAnswer: "YES",
      context: "Most OSA features are user-facing through the web interface"
    },
    {
      id: 2,
      question: "Does this feature primarily affect content recommendations or analytics insights?",
      defaultAnswer: "content",
      context: "Understanding the primary focus helps determine implementation approach"
    },
    {
      id: 3,
      question: "Should this feature be visible to non-admin users?",
      defaultAnswer: "YES",
      context: "Most OSA features are designed for end users, not just administrators"
    },
    {
      id: 4,
      question: "Should this feature be aware of the DCI Orchestrator / results-content-optimizer flows?",
      defaultAnswer: "YES when related to Results",
      context: "Results-related features should integrate with the DCI system"
    },
    {
      id: 5,
      question: "Is this required for the current milestone or can it be phased?",
      defaultAnswer: "phased",
      context: "Most features can be delivered incrementally for better risk management"
    }
  ];

  return questions;
}

/**
 * Generate detailed technical questions based on discovery answers and code analysis
 */
export function generateDetailQuestions(discoveryAnswers: QuestionAnswer[], codeAnalysis: string): Question[] {
  const questions: Question[] = [
    {
      id: 1,
      question: "Should we reuse existing services and components where possible?",
      defaultAnswer: "YES",
      context: "Leveraging existing patterns reduces development time and maintains consistency"
    },
    {
      id: 2,
      question: "Should this appear in the existing navigation structure?",
      defaultAnswer: "YES if it fits existing categories",
      context: "Consistent navigation improves user experience"
    },
    {
      id: 3,
      question: "Should this feature participate in the DCI-based Results pipeline?",
      defaultAnswer: "YES for Results-related features",
      context: "Results features should integrate with the orchestrated content system"
    },
    {
      id: 4,
      question: "Is it acceptable to roll this out behind a feature flag initially?",
      defaultAnswer: "YES",
      context: "Feature flags enable safer deployments and gradual rollouts"
    },
    {
      id: 5,
      question: "Should we log this feature's usage to existing analytics hooks?",
      defaultAnswer: "YES",
      context: "Analytics help track feature adoption and success"
    }
  ];

  return questions;
=======
 * Generate discovery questions based on OSA priorities
 */
export function generateDiscoveryQuestions(description: string): Question[] {
  return [
    {
      id: 1,
      question: "Will this feature primarily involve changes to the OSA UI that users interact with?",
      context: "This helps determine if we need UI components, navigation changes, or user experience considerations.",
      defaultAnswer: "YES",
      category: "discovery"
    },
    {
      id: 2,
      question: "Should this feature be accessible to non-admin users (regular OSA users)?",
      context: "This affects authentication patterns, user permissions, and feature placement within OSA.",
      defaultAnswer: "YES",
      category: "discovery"
    },
    {
      id: 3,
      question: "Which OSA Results tier should this feature be placed in: Strategy Plans, DXP Tools, Analytics Insights, or Experience Optimization?",
      context: "OSA has 4 equal Results tiers. This determines architectural integration patterns, navigation placement, and OPAL agent assignments.",
      defaultAnswer: "Analytics Insights",
      category: "discovery"
    },
    {
      id: 4,
      question: "Will this feature need to integrate with or be aware of the DCI Orchestrator workflows?",
      context: "DCI integration affects Results page placement, OPAL agent involvement, and data flow patterns.",
      defaultAnswer: "NO",
      category: "discovery"
    },
    {
      id: 5,
      question: "Should this feature be included in the main OSA navigation or be accessible through Results pages?",
      context: "This determines architectural placement and affects user discovery patterns within OSA.",
      defaultAnswer: "YES",
      category: "discovery"
    }
  ];
}

/**
 * Generate detail questions based on discovery answers and context
 */
export function generateDetailQuestions(discoveryAnswers: QuestionAnswer[], contextAnalysis: string): Question[] {
  return [
    {
      id: 1,
      question: "Should this feature be implemented as a new React component in src/components/?",
      context: "This determines the primary implementation approach and file organization.",
      defaultAnswer: "YES",
      category: "detail"
    },
    {
      id: 2,
      question: "Will this feature require new API endpoints in src/app/api/?",
      context: "This affects backend implementation requirements and data flow architecture.",
      defaultAnswer: "NO",
      category: "detail"
    },
    {
      id: 3,
      question: "Should this feature use the existing OSA widget pattern for consistent UI/UX?",
      context: "Widget pattern provides standardized layout, error handling, and integration with OSA themes.",
      defaultAnswer: "YES",
      category: "detail"
    },
    {
      id: 4,
      question: "Will this feature need to store or retrieve data from the Supabase database?",
      context: "This determines if we need secure database client usage and data persistence patterns.",
      defaultAnswer: "NO",
      category: "detail"
    },
    {
      id: 5,
      question: "Should this feature be released using feature flags for safe rollout?",
      context: "Feature flags allow gradual rollout and quick rollback if issues arise in production.",
      defaultAnswer: "YES",
      category: "detail"
    }
  ];
}

/**
 * Validate requirement structure and completeness
 */
export function validateRequirement(requirementId: string): { valid: boolean; errors: string[] } {
  try {
    const errors: string[] = [];

    // Check if requirement directory exists
    const reqDir = join(REQUIREMENTS_DIR, requirementId);
    if (!existsSync(reqDir)) {
      errors.push('Requirement directory does not exist');
      return { valid: false, errors };
    }

    // Check metadata
    const metadata = loadRequirementMetadata(requirementId);
    if (!metadata) {
      errors.push('Metadata file missing or invalid');
    } else {
      if (!metadata.id || !metadata.name || !metadata.description) {
        errors.push('Metadata missing required fields');
      }
    }

    // Check for required files based on status
    if (metadata?.status === 'COMPLETE') {
      const requiredFiles = [
        '00-initial-request.md',
        '02-discovery-answers.md',
        '05-detail-answers.md',
        '06-requirements-spec.md'
      ];

      for (const file of requiredFiles) {
        if (!readRequirementFile(requirementId, file)) {
          errors.push(`Missing required file: ${file}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  } catch (error) {
    return { valid: false, errors: [`Validation error: ${error.message}`] };
  }
}

/**
 * Clean up incomplete or corrupted requirements
 */
export function cleanupRequirement(requirementId: string): boolean {
  try {
    const metadata = loadRequirementMetadata(requirementId);
    if (!metadata) {
      console.warn(`No metadata found for ${requirementId}, cannot cleanup safely`);
      return false;
    }

    // Only cleanup if not complete or if explicitly corrupted
    if (metadata.status === 'COMPLETE') {
      console.warn(`Requirement ${requirementId} is marked complete, not cleaning up`);
      return false;
    }

    // Mark as cancelled instead of deleting
    metadata.status = 'CANCELLED';
    metadata.completedAt = new Date().toISOString();
    saveRequirementMetadata(requirementId, metadata);

    // Clear if it's the current requirement
    const current = getCurrentRequirement();
    if (current === requirementId) {
      clearCurrentRequirement();
    }

    updateRequirementsIndex();
    return true;
  } catch (error) {
    console.error(`Failed to cleanup requirement ${requirementId}:`, error.message);
    return false;
  }
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
}