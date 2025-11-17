/**
 * Admin API: Results Content Rollback
 *
 * Provides rollback capabilities for Results page content with
 * comprehensive audit logging and validation.
 */

import { NextRequest, NextResponse } from 'next/server';
// Temporarily commented out to fix Turbopack build issues
// TODO: Re-enable after fixing dynamic import issues in audit-logger
// import {
//   auditLogger,
//   rollbackContent,
//   getPageHistory,
//   RollbackRequest,
//   RollbackResult
// } from '../../../../../../services/results-content-optimizer/audit-logger';
import { validatePageId } from '../../../../../opal/mapping/page-agent-mappings';

// =============================================================================
// Request/Response Types
// =============================================================================

// Temporary types while audit-logger import is disabled
interface RollbackRequest {
  pageId: string;
  targetTimestamp?: string;
  reason: string;
  dryRun?: boolean;
}

interface RollbackResult {
  success: boolean;
  pageId: string;
  rolledBackTo: string;
  backupPath: string;
  restoredContent?: any;
  message: string;
}

interface RollbackContentRequest {
  pageId: string;
  targetTimestamp?: string; // ISO string, if not provided, rolls back to previous version
  reason: string;
  requestedBy: string;
  dryRun?: boolean;
}

interface RollbackContentResponse {
  success: boolean;
  message: string;
  rollback_result?: RollbackResult;
  available_backups?: Array<{
    timestamp: string;
    confidence_score: number;
    backup_path: string;
    reason: string;
  }>;
  error?: string;
}

interface PageHistoryResponse {
  success: boolean;
  pageId: string;
  history: Array<{
    timestamp: string;
    operation: string;
    result: string;
    confidence_score?: number;
    triggered_by?: string;
    processing_time_ms?: number;
    backup_path?: string;
  }>;
  available_backups: Array<{
    timestamp: string;
    confidence_score: number;
    backup_path: string;
    reason: string;
  }>;
  error?: string;
}

// =============================================================================
// Request Handlers
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body: RollbackContentRequest = await request.json();

    // Validate request
    const validation = validateRollbackRequest(body);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Request validation failed',
          error: validation.errors.join(', ')
        } as RollbackContentResponse,
        { status: 400 }
      );
    }

    console.log(`[RollbackContent] Processing rollback request for ${body.pageId}`, {
      targetTimestamp: body.targetTimestamp,
      requestedBy: body.requestedBy,
      dryRun: body.dryRun || false
    });

    // Get available backups
    const backups = await auditLogger.listBackups(body.pageId);

    if (backups.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: `No backups available for page: ${body.pageId}`,
          error: 'No backups found'
        } as RollbackContentResponse,
        { status: 404 }
      );
    }

    // Perform rollback
    const rollbackRequest: RollbackRequest = {
      pageId: body.pageId,
      targetTimestamp: body.targetTimestamp,
      reason: body.reason,
      requestedBy: body.requestedBy,
      dryRun: body.dryRun || false
    };

    const rollbackResult = await rollbackContent(rollbackRequest);

    const response: RollbackContentResponse = {
      success: rollbackResult.success,
      message: rollbackResult.message,
      rollback_result: rollbackResult,
      available_backups: backups.map(backup => ({
        timestamp: backup.timestamp,
        confidence_score: backup.originalContent.dataLineage.confidenceScore,
        backup_path: backup.backupPath,
        reason: backup.reason
      }))
    };

    const statusCode = rollbackResult.success ? 200 : 500;
    return NextResponse.json(response, { status: statusCode });

  } catch (error) {
    console.error('[RollbackContent] Error processing rollback request:', error);

    const response: RollbackContentResponse = {
      success: false,
      message: 'Internal server error during rollback',
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const pageId = url.searchParams.get('pageId');

    if (!pageId) {
      return NextResponse.json(
        {
          success: false,
          error: 'pageId parameter is required'
        },
        { status: 400 }
      );
    }

    // Validate page ID
    if (!validatePageId(pageId)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid pageId: ${pageId}`
        },
        { status: 400 }
      );
    }

    console.log(`[RollbackContent] Getting history for page: ${pageId}`);

    // Get page history
    const history = await getPageHistory(pageId);

    // Get available backups
    const backups = await auditLogger.listBackups(pageId);

    const response: PageHistoryResponse = {
      success: true,
      pageId,
      history: history.map(entry => ({
        timestamp: entry.timestamp,
        operation: entry.operation,
        result: entry.result,
        confidence_score: entry.details.confidenceScore,
        triggered_by: entry.details.triggeredBy,
        processing_time_ms: entry.details.processingTimeMs,
        backup_path: entry.details.backupPath
      })),
      available_backups: backups.map(backup => ({
        timestamp: backup.timestamp,
        confidence_score: backup.originalContent.dataLineage.confidenceScore,
        backup_path: backup.backupPath,
        reason: backup.reason
      }))
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[RollbackContent] Error getting page history:', error);

    const response = {
      success: false,
      pageId: '',
      history: [],
      available_backups: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// =============================================================================
// Validation Functions
// =============================================================================

function validateRollbackRequest(body: RollbackContentRequest): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required fields
  if (!body.pageId) {
    errors.push('pageId is required');
  } else if (!validatePageId(body.pageId)) {
    errors.push(`Invalid pageId: ${body.pageId}`);
  }

  if (!body.reason || body.reason.trim().length === 0) {
    errors.push('reason is required and cannot be empty');
  }

  if (!body.requestedBy || body.requestedBy.trim().length === 0) {
    errors.push('requestedBy is required and cannot be empty');
  }

  // Validate timestamp format if provided
  if (body.targetTimestamp) {
    try {
      const date = new Date(body.targetTimestamp);
      if (isNaN(date.getTime())) {
        errors.push(`Invalid targetTimestamp format: ${body.targetTimestamp}`);
      }
    } catch (error) {
      errors.push(`Invalid targetTimestamp format: ${body.targetTimestamp}`);
    }
  }

  // Warnings
  if (!body.dryRun) {
    warnings.push('This rollback will modify the generated content file');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}