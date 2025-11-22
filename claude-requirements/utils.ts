/**
 * Claude Requirements Gathering System - Core Utilities
 *
 * This file provides core utilities, interfaces, and functions for the
 * requirements gathering system following OSA architectural patterns.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

// Core interfaces following OSA TypeScript patterns
export interface RequirementMetadata {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  status: 'ACTIVE' | 'COMPLETE' | 'CANCELLED';
  phase: 'DISCOVERY' | 'ANALYSIS' | 'DETAIL' | 'SPEC';
  discoveryQuestionsCount: number;
  discoveryQuestionsAnswered: number;
  detailQuestionsCount: number;
  detailQuestionsAnswered: number;
  lastUpdated?: string;
  completedAt?: string;
}

export interface Question {
  id: number;
  question: string;
  context?: string;
  defaultAnswer: 'YES' | 'NO';
  category: 'discovery' | 'detail';
}

export interface QuestionAnswer {
  question: string;
  answer: string;
  timestamp: string;
}

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
    return null;
  }
}

/**
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
  }
}

/**
 * Clear current active requirement
 */
export function clearCurrentRequirement(): void {
  try {
    if (existsSync(STATE_FILE)) {
      writeFileSync(STATE_FILE, JSON.stringify({ currentRequirementId: null, clearedAt: new Date().toISOString() }, null, 2));
    }
  } catch (error) {
    console.warn('Could not clear current requirement:', error.message);
  }
}

/**
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
  }
}

/**
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
    return null;
  }
}

/**
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
  }
}

/**
 * Write content to a requirement file
 */
export function writeRequirementFile(requirementId: string, filename: string, content: string): void {
  try {
    const filePath = join(REQUIREMENTS_DIR, requirementId, filename);
    writeFileSync(filePath, content, 'utf-8');
  } catch (error) {
    throw new RequirementsError(`Failed to write file ${filename}: ${error.message}`, 'FILE_WRITE_ERROR');
  }
}

/**
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
  }
}

/**
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
    return null;
  }
}

/**
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
  }
}

/**
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
  }
}

/**
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
}