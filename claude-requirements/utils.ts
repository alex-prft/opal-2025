/**
 * Utilities for Claude Requirements Gathering System
 * 
 * This file contains helper functions for managing requirements state,
 * file I/O operations, and system coordination.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface RequirementMetadata {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  status: 'ACTIVE' | 'COMPLETE' | 'INCOMPLETE' | 'CANCELED';
  phase: 'DISCOVERY' | 'ANALYSIS' | 'DETAIL' | 'SPEC';
  discoveryQuestionsCount: number;
  discoveryQuestionsAnswered: number;
  detailQuestionsCount: number;
  detailQuestionsAnswered: number;
}

export interface Question {
  id: number;
  question: string;
  defaultAnswer: string;
  context?: string;
}

export interface QuestionAnswer {
  question: string;
  answer: string;
  timestamp: string;
}

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
    return null;
  }
}

/**
 * Set the current active requirement ID
 */
export function setCurrentRequirement(requirementId: string): void {
  try {
    const currentPath = getCurrentRequirementPath();
    fs.writeFileSync(currentPath, requirementId, 'utf8');
  } catch (error) {
    console.error('Error setting current requirement:', error);
    throw error;
  }
}

/**
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
  }
}

/**
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
  }
}

/**
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
    return null;
  }
}

/**
 * Save metadata for a requirement
 */
export function saveRequirementMetadata(requirementId: string, metadata: RequirementMetadata): void {
  try {
    const metadataPath = path.join(getRequirementPath(requirementId), 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving requirement metadata:', error);
    throw error;
  }
}

/**
 * Append content to a file in a requirement directory
 */
export function appendToRequirementFile(requirementId: string, filename: string, content: string): void {
  try {
    const filePath = path.join(getRequirementPath(requirementId), filename);
    fs.appendFileSync(filePath, content + '\n', 'utf8');
  } catch (error) {
    console.error(`Error appending to requirement file ${filename}:`, error);
    throw error;
  }
}

/**
 * Write content to a file in a requirement directory
 */
export function writeRequirementFile(requirementId: string, filename: string, content: string): void {
  try {
    const filePath = path.join(getRequirementPath(requirementId), filename);
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (error) {
    console.error(`Error writing requirement file ${filename}:`, error);
    throw error;
  }
}

/**
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
    return null;
  }
}

/**
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
  }
}

/**
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
  }
}

/**
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
}