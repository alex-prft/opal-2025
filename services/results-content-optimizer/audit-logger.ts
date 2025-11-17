/**
 * Audit Logger for Results Content Optimizer
 *
 * Provides comprehensive logging, audit trail, and rollback capabilities
 * for the results-content-optimizer system.
 */

import fs from 'fs/promises';
import path from 'path';
import { ResultPageContent, ContentBackup } from '../../src/results/schemas/ResultPage';

// =============================================================================
// Audit Types
// =============================================================================

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  operation: 'generate' | 'update' | 'rollback' | 'backup' | 'validation';
  pageId: string;
  executionMode: 'preview' | 'apply';
  result: 'success' | 'failure' | 'skipped' | 'warning';
  details: AuditLogDetails;
  metadata: AuditLogMetadata;
}

export interface AuditLogDetails {
  // Operation specifics
  previousContent?: Partial<ResultPageContent>;
  newContent?: Partial<ResultPageContent>;
  backupPath?: string;
  confidenceScore?: number;

  // Processing info
  processingTimeMs?: number;
  sourceAgents?: string[];
  sourceTools?: string[];
  validationWarnings?: string[];

  // Error info
  errorMessage?: string;
  errorStack?: string;

  // User/system info
  triggeredBy?: 'schedule' | 'event-trigger' | 'manual' | 'api';
  triggerSource?: string;
}

export interface AuditLogMetadata {
  workflowId?: string;
  executionId?: string;
  opalInstructionsVersion?: string;
  agentVersion?: string;
  systemVersion?: string;
  environment?: string;
  correlationId?: string;
}

export interface RollbackRequest {
  pageId: string;
  targetTimestamp?: string; // ISO string, if not provided, rolls back to previous version
  reason: string;
  requestedBy: string;
  dryRun?: boolean;
}

export interface RollbackResult {
  success: boolean;
  pageId: string;
  rolledBackTo: string; // timestamp
  backupPath: string;
  restoredContent: ResultPageContent;
  message: string;
}

// =============================================================================
// Main Audit Logger Class
// =============================================================================

export class ResultsContentAuditLogger {
  private logDirectory: string;
  private backupDirectory: string;
  private maxLogAge: number; // in milliseconds
  private maxBackupAge: number; // in milliseconds

  constructor(config?: {
    logDirectory?: string;
    backupDirectory?: string;
    maxLogAgeDays?: number;
    maxBackupAgeDays?: number;
  }) {
    this.logDirectory = config?.logDirectory || path.join(process.cwd(), 'logs', 'results-content-optimizer');
    this.backupDirectory = config?.backupDirectory || path.join(process.cwd(), 'src', 'results', 'generated-backups');
    this.maxLogAge = (config?.maxLogAgeDays || 30) * 24 * 60 * 60 * 1000;
    this.maxBackupAge = (config?.maxBackupAgeDays || 7) * 24 * 60 * 60 * 1000;

    this.ensureDirectories();
  }

  // ===========================================================================
  // Audit Logging Methods
  // ===========================================================================

  /**
   * Log content generation operation
   */
  async logContentGeneration(params: {
    pageId: string;
    executionMode: 'preview' | 'apply';
    result: 'success' | 'failure' | 'skipped';
    previousContent?: ResultPageContent;
    newContent?: ResultPageContent;
    processingTimeMs: number;
    confidenceScore?: number;
    sourceAgents: string[];
    sourceTools: string[];
    validationWarnings?: string[];
    backupPath?: string;
    errorMessage?: string;
    triggeredBy?: string;
    triggerSource?: string;
    metadata?: Partial<AuditLogMetadata>;
  }): Promise<void> {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      operation: 'generate',
      pageId: params.pageId,
      executionMode: params.executionMode,
      result: params.result,
      details: {
        previousContent: params.previousContent ? {
          pageId: params.previousContent.pageId,
          tier: params.previousContent.tier,
          dataLineage: params.previousContent.dataLineage
        } : undefined,
        newContent: params.newContent ? {
          pageId: params.newContent.pageId,
          tier: params.newContent.tier,
          dataLineage: params.newContent.dataLineage
        } : undefined,
        backupPath: params.backupPath,
        confidenceScore: params.confidenceScore,
        processingTimeMs: params.processingTimeMs,
        sourceAgents: params.sourceAgents,
        sourceTools: params.sourceTools,
        validationWarnings: params.validationWarnings,
        errorMessage: params.errorMessage,
        triggeredBy: params.triggeredBy as any,
        triggerSource: params.triggerSource
      },
      metadata: {
        ...params.metadata,
        environment: process.env.NODE_ENV || 'development',
        systemVersion: process.env.npm_package_version || '1.0.0'
      }
    };

    await this.writeLogEntry(entry);
  }

  /**
   * Log rollback operation
   */
  async logRollback(params: {
    pageId: string;
    result: 'success' | 'failure';
    targetTimestamp: string;
    backupPath: string;
    restoredContent?: ResultPageContent;
    reason: string;
    requestedBy: string;
    errorMessage?: string;
    metadata?: Partial<AuditLogMetadata>;
  }): Promise<void> {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      operation: 'rollback',
      pageId: params.pageId,
      executionMode: 'apply',
      result: params.result,
      details: {
        backupPath: params.backupPath,
        newContent: params.restoredContent ? {
          pageId: params.restoredContent.pageId,
          tier: params.restoredContent.tier,
          dataLineage: params.restoredContent.dataLineage
        } : undefined,
        errorMessage: params.errorMessage,
        triggeredBy: 'manual',
        triggerSource: params.requestedBy
      },
      metadata: {
        ...params.metadata,
        correlationId: `rollback-${params.pageId}-${Date.now()}`,
        environment: process.env.NODE_ENV || 'development'
      }
    };

    await this.writeLogEntry(entry);
  }

  /**
   * Log validation operation
   */
  async logValidation(params: {
    pageId: string;
    result: 'success' | 'warning' | 'failure';
    validationWarnings: string[];
    confidenceScore: number;
    errorMessage?: string;
    metadata?: Partial<AuditLogMetadata>;
  }): Promise<void> {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      operation: 'validation',
      pageId: params.pageId,
      executionMode: 'preview',
      result: params.result,
      details: {
        confidenceScore: params.confidenceScore,
        validationWarnings: params.validationWarnings,
        errorMessage: params.errorMessage
      },
      metadata: {
        ...params.metadata,
        environment: process.env.NODE_ENV || 'development'
      }
    };

    await this.writeLogEntry(entry);
  }

  // ===========================================================================
  // Backup Management Methods
  // ===========================================================================

  /**
   * Create backup of existing content
   */
  async createBackup(pageId: string, content: ResultPageContent, reason: string = 'pre-update'): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(
      this.backupDirectory,
      pageId.replace(/\//g, '_'),
      `${timestamp}.ts`
    );

    // Ensure backup directory exists
    await fs.mkdir(path.dirname(backupPath), { recursive: true });

    // Create backup content with metadata
    const backupContent = `/**
 * BACKUP: ${pageId}
 * Created: ${new Date().toISOString()}
 * Reason: ${reason}
 * Original confidence: ${content.dataLineage.confidenceScore}
 * Original agents: ${content.dataLineage.sourceAgents.join(', ')}
 */

import { ResultPageContent } from '../../schemas/ResultPage';

const content: ResultPageContent = ${JSON.stringify(content, null, 2)};

export default content;
export const backupMetadata = {
  pageId: '${pageId}',
  backupTimestamp: '${new Date().toISOString()}',
  originalConfidence: ${content.dataLineage.confidenceScore},
  reason: '${reason}'
};`;

    await fs.writeFile(backupPath, backupContent, 'utf-8');

    // Log backup creation
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      operation: 'backup',
      pageId,
      executionMode: 'apply',
      result: 'success',
      details: {
        backupPath,
        confidenceScore: content.dataLineage.confidenceScore,
        sourceAgents: content.dataLineage.sourceAgents,
        sourceTools: content.dataLineage.sourceTools
      },
      metadata: {
        environment: process.env.NODE_ENV || 'development'
      }
    };

    await this.writeLogEntry(entry);

    return backupPath;
  }

  /**
   * List available backups for a page
   */
  async listBackups(pageId: string): Promise<ContentBackup[]> {
    const pageBackupDir = path.join(this.backupDirectory, pageId.replace(/\//g, '_'));

    try {
      const files = await fs.readdir(pageBackupDir);
      const backups: ContentBackup[] = [];

      for (const file of files) {
        if (file.endsWith('.ts')) {
          const filePath = path.join(pageBackupDir, file);
          const stats = await fs.stat(filePath);

          // Extract timestamp from filename
          const timestamp = file.replace('.ts', '');

          try {
            // Read backup content to get original content
            const backupContent = await fs.readFile(filePath, 'utf-8');
            const contentMatch = backupContent.match(/const content: ResultPageContent = (.*?);/s);

            if (contentMatch) {
              const originalContent = JSON.parse(contentMatch[1]) as ResultPageContent;

              backups.push({
                pageId,
                backupPath: filePath,
                originalContent,
                timestamp: stats.birthtime.toISOString(),
                reason: 'auto-backup' // Could extract from comment if needed
              });
            }
          } catch (error) {
            console.warn(`[AuditLogger] Failed to parse backup file ${filePath}:`, error);
          }
        }
      }

      return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return []; // No backups directory exists
      }
      throw error;
    }
  }

  /**
   * Rollback to a previous version
   */
  async rollback(request: RollbackRequest): Promise<RollbackResult> {
    try {
      const backups = await this.listBackups(request.pageId);

      if (backups.length === 0) {
        throw new Error(`No backups available for page: ${request.pageId}`);
      }

      // Find target backup
      let targetBackup: ContentBackup;
      if (request.targetTimestamp) {
        const target = backups.find(b => b.timestamp === request.targetTimestamp);
        if (!target) {
          throw new Error(`No backup found for timestamp: ${request.targetTimestamp}`);
        }
        targetBackup = target;
      } else {
        // Use most recent backup
        targetBackup = backups[0];
      }

      if (request.dryRun) {
        return {
          success: true,
          pageId: request.pageId,
          rolledBackTo: targetBackup.timestamp,
          backupPath: targetBackup.backupPath,
          restoredContent: targetBackup.originalContent,
          message: 'Dry run completed successfully - no changes made'
        };
      }

      // Create current version backup before rollback
      const currentContentPath = path.join(
        process.cwd(),
        'src/results/generated',
        `${request.pageId}.ts`
      );

      let currentContent: ResultPageContent | null = null;
      try {
        // Read content file instead of using dynamic import (Turbopack compatibility)
        if (await fs.access(currentContentPath).then(() => true).catch(() => false)) {
          const contentFileContent = await fs.readFile(currentContentPath, 'utf-8');
          // Since these are generated TS files, we need to extract the content
          // For now, assume the content exists and is accessible via file system
          // In a full implementation, this would parse the TS file or use a different storage method
          console.log(`[AuditLogger] Current content file exists: ${currentContentPath}`);
        }

        if (currentContent) {
          await this.createBackup(request.pageId, currentContent, 'pre-rollback');
        }
      } catch (error) {
        console.warn(`[AuditLogger] Could not backup current content before rollback:`, error);
      }

      // Restore content from backup
      const restoredContent = targetBackup.originalContent;

      // Update metadata to reflect rollback
      restoredContent.dataLineage.lastUpdatedBy = 'results-content-optimizer';
      restoredContent.dataLineage.lastUpdatedAt = new Date().toISOString();

      // Write restored content
      const restoredContentString = `/**
 * AUTO-GENERATED BY results-content-optimizer. DO NOT EDIT BY HAND.
 *
 * RESTORED FROM BACKUP: ${targetBackup.timestamp}
 * Rollback reason: ${request.reason}
 * Requested by: ${request.requestedBy}
 * Rollback timestamp: ${new Date().toISOString()}
 */

import { ResultPageContent } from '../../schemas/ResultPage';

const content: ResultPageContent = ${JSON.stringify(restoredContent, null, 2)};

export default content;`;

      await fs.writeFile(currentContentPath, restoredContentString, 'utf-8');

      // Log rollback operation
      await this.logRollback({
        pageId: request.pageId,
        result: 'success',
        targetTimestamp: targetBackup.timestamp,
        backupPath: targetBackup.backupPath,
        restoredContent,
        reason: request.reason,
        requestedBy: request.requestedBy
      });

      return {
        success: true,
        pageId: request.pageId,
        rolledBackTo: targetBackup.timestamp,
        backupPath: targetBackup.backupPath,
        restoredContent,
        message: `Successfully rolled back to version from ${targetBackup.timestamp}`
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.logRollback({
        pageId: request.pageId,
        result: 'failure',
        targetTimestamp: request.targetTimestamp || 'latest',
        backupPath: '',
        reason: request.reason,
        requestedBy: request.requestedBy,
        errorMessage
      });

      return {
        success: false,
        pageId: request.pageId,
        rolledBackTo: '',
        backupPath: '',
        restoredContent: {} as ResultPageContent,
        message: `Rollback failed: ${errorMessage}`
      };
    }
  }

  // ===========================================================================
  // Query and Analysis Methods
  // ===========================================================================

  /**
   * Get audit logs for a specific page
   */
  async getPageAuditLogs(pageId: string, limit: number = 50): Promise<AuditLogEntry[]> {
    const logs = await this.readAllLogs();

    return logs
      .filter(log => log.pageId === pageId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get recent audit logs across all pages
   */
  async getRecentAuditLogs(limit: number = 100): Promise<AuditLogEntry[]> {
    const logs = await this.readAllLogs();

    return logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(since?: string): Promise<{
    totalOperations: number;
    operationsByType: Record<string, number>;
    operationsByResult: Record<string, number>;
    averageConfidenceScore: number;
    averageProcessingTime: number;
    pagesModified: number;
    recentFailures: AuditLogEntry[];
  }> {
    const logs = await this.readAllLogs();
    const filteredLogs = since
      ? logs.filter(log => new Date(log.timestamp) >= new Date(since))
      : logs;

    const operationsByType: Record<string, number> = {};
    const operationsByResult: Record<string, number> = {};
    const uniquePages = new Set<string>();
    let totalConfidence = 0;
    let confidenceCount = 0;
    let totalProcessingTime = 0;
    let processingTimeCount = 0;

    filteredLogs.forEach(log => {
      // Count by operation type
      operationsByType[log.operation] = (operationsByType[log.operation] || 0) + 1;

      // Count by result
      operationsByResult[log.result] = (operationsByResult[log.result] || 0) + 1;

      // Track unique pages
      uniquePages.add(log.pageId);

      // Aggregate confidence scores
      if (log.details.confidenceScore !== undefined) {
        totalConfidence += log.details.confidenceScore;
        confidenceCount++;
      }

      // Aggregate processing times
      if (log.details.processingTimeMs !== undefined) {
        totalProcessingTime += log.details.processingTimeMs;
        processingTimeCount++;
      }
    });

    const recentFailures = filteredLogs
      .filter(log => log.result === 'failure')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return {
      totalOperations: filteredLogs.length,
      operationsByType,
      operationsByResult,
      averageConfidenceScore: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
      averageProcessingTime: processingTimeCount > 0 ? totalProcessingTime / processingTimeCount : 0,
      pagesModified: uniquePages.size,
      recentFailures
    };
  }

  // ===========================================================================
  // Maintenance Methods
  // ===========================================================================

  /**
   * Clean up old logs and backups
   */
  async cleanup(): Promise<{ logsDeleted: number; backupsDeleted: number }> {
    const now = Date.now();
    let logsDeleted = 0;
    let backupsDeleted = 0;

    // Clean up old log files
    try {
      const logFiles = await fs.readdir(this.logDirectory);

      for (const file of logFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.logDirectory, file);
          const stats = await fs.stat(filePath);

          if (now - stats.birthtime.getTime() > this.maxLogAge) {
            await fs.unlink(filePath);
            logsDeleted++;
          }
        }
      }
    } catch (error) {
      console.warn('[AuditLogger] Error cleaning up logs:', error);
    }

    // Clean up old backup files
    try {
      const backupDirs = await fs.readdir(this.backupDirectory);

      for (const dir of backupDirs) {
        const dirPath = path.join(this.backupDirectory, dir);
        const dirStats = await fs.stat(dirPath);

        if (dirStats.isDirectory()) {
          const backupFiles = await fs.readdir(dirPath);

          for (const file of backupFiles) {
            if (file.endsWith('.ts')) {
              const filePath = path.join(dirPath, file);
              const stats = await fs.stat(filePath);

              if (now - stats.birthtime.getTime() > this.maxBackupAge) {
                await fs.unlink(filePath);
                backupsDeleted++;
              }
            }
          }

          // Remove empty directories
          const remainingFiles = await fs.readdir(dirPath);
          if (remainingFiles.length === 0) {
            await fs.rmdir(dirPath);
          }
        }
      }
    } catch (error) {
      console.warn('[AuditLogger] Error cleaning up backups:', error);
    }

    return { logsDeleted, backupsDeleted };
  }

  // ===========================================================================
  // Private Helper Methods
  // ===========================================================================

  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.logDirectory, { recursive: true });
    await fs.mkdir(this.backupDirectory, { recursive: true });
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async writeLogEntry(entry: AuditLogEntry): Promise<void> {
    const date = new Date(entry.timestamp).toISOString().split('T')[0];
    const logFile = path.join(this.logDirectory, `${date}.json`);

    // Read existing log file or create new one
    let existingLogs: AuditLogEntry[] = [];
    try {
      const existingContent = await fs.readFile(logFile, 'utf-8');
      existingLogs = JSON.parse(existingContent);
    } catch (error) {
      // File doesn't exist or is invalid, start with empty array
    }

    // Add new entry
    existingLogs.push(entry);

    // Write back to file
    await fs.writeFile(logFile, JSON.stringify(existingLogs, null, 2), 'utf-8');

    // Also log to console for immediate visibility
    console.log(`[AuditLogger] ${entry.operation.toUpperCase()} ${entry.result.toUpperCase()}: ${entry.pageId}`, {
      timestamp: entry.timestamp,
      details: entry.details
    });
  }

  private async readAllLogs(): Promise<AuditLogEntry[]> {
    const allLogs: AuditLogEntry[] = [];

    try {
      const logFiles = await fs.readdir(this.logDirectory);

      for (const file of logFiles) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(this.logDirectory, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const logs = JSON.parse(content) as AuditLogEntry[];
            allLogs.push(...logs);
          } catch (error) {
            console.warn(`[AuditLogger] Error reading log file ${file}:`, error);
          }
        }
      }
    } catch (error) {
      console.warn('[AuditLogger] Error reading log directory:', error);
    }

    return allLogs;
  }
}

// =============================================================================
// Singleton Instance and Exports
// =============================================================================

export const auditLogger = new ResultsContentAuditLogger();

// Export convenience functions
export async function logContentGeneration(params: Parameters<ResultsContentAuditLogger['logContentGeneration']>[0]): Promise<void> {
  return auditLogger.logContentGeneration(params);
}

export async function createBackup(pageId: string, content: ResultPageContent, reason?: string): Promise<string> {
  return auditLogger.createBackup(pageId, content, reason);
}

export async function rollbackContent(request: RollbackRequest): Promise<RollbackResult> {
  return auditLogger.rollback(request);
}

export async function getPageHistory(pageId: string): Promise<AuditLogEntry[]> {
  return auditLogger.getPageAuditLogs(pageId);
}

export async function getSystemStats(): Promise<ReturnType<ResultsContentAuditLogger['getAuditStats']>> {
  return auditLogger.getAuditStats();
}