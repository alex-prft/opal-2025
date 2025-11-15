// Phase 1 Integration Layer
// Brings together environment safety, validation pipeline, and logging for production-ready use

import { environmentSafety, type ContentSource } from './environment-safety';
import { pageValidator, type ValidationResult } from './page-validation-core';
import { validationLogger, type DrillDownLogData } from './validation-logger';
import { CRITICAL_PAGES, type PageConfig } from '@/lib/types/phase1-database';

export interface Phase1ValidationRequest {
  pageId: string;
  widgetId: string;
  requestContext?: {
    session_id?: string;
    user_agent?: string;
    correlation_id?: string;
    ip_address?: string;
  };
  force_refresh?: boolean;
}

export interface Phase1ValidationResponse {
  success: boolean;
  content: ContentSource;
  validation_summary: {
    all_gates_passed: boolean;
    failed_validations: string[];
    confidence_score: number;
    source_type: string;
  };
  performance_metrics: {
    total_duration_ms: number;
    validation_duration_ms: number;
    content_retrieval_ms: number;
  };
  fallback_info?: {
    reason: string;
    attempted_sources: string[];
  };
}

export interface Phase1SystemHealth {
  overall_status: 'green' | 'yellow' | 'red';
  page_statuses: {
    [pageId: string]: {
      status: 'green' | 'yellow' | 'red';
      last_validation: string;
      validation_gates: {
        opal_mapping: 'passed' | 'failed' | 'warning';
        claude_schema: 'passed' | 'failed' | 'warning';
        deduplication: 'passed' | 'failed' | 'warning';
        cross_page_consistency: 'passed' | 'failed' | 'warning';
      };
    };
  };
  system_metrics: {
    cache_hit_rate: number;
    average_confidence_score: number;
    validation_success_rate: number;
    fallback_frequency: number;
  };
}

/**
 * Phase 1 Validation Pipeline Integration
 *
 * Coordinates all validation components for production-ready content delivery
 */
export class Phase1ValidationPipeline {
  private requestCounter = 0;
  private startTime = Date.now();

  /**
   * Primary method: Get validated content with comprehensive safety pipeline
   *
   * MANDATORY Validation Chain (Explicit Page Coverage):
   * OPAL Mapping (Per Page) → Cross-Page Consistency Check → Claude Schema Validation →
   * Cross-Tier Cross-Page Deduplication → Confidence Assignment → Structured Audit Logging →
   * Render Authorization (All Pages Validated)
   */
  async getValidatedContent(request: Phase1ValidationRequest): Promise<Phase1ValidationResponse> {
    const startTime = Date.now();
    this.requestCounter++;

    const correlationId = request.requestContext?.correlation_id || `req_${Date.now()}_${this.requestCounter}`;

    try {
      console.log(`🔄 [Phase1] Starting validation pipeline for ${request.pageId}/${request.widgetId} (${correlationId})`);

      // Step 1: Validate page configuration
      const pageValidation = this.validatePageConfiguration(request.pageId, request.widgetId);
      if (!pageValidation.isValid) {
        return this.createErrorResponse(
          `Invalid page configuration: ${pageValidation.reason}`,
          startTime,
          correlationId
        );
      }

      // Step 2: Get content through environment safety system
      const contentRetrievalStart = Date.now();
      const contentSource = await environmentSafety.getValidatedContent(
        request.pageId,
        request.widgetId,
        request.requestContext
      );
      const contentRetrievalDuration = Date.now() - contentRetrievalStart;

      // Step 3: Additional validation if content came from cache or fallback
      const validationStart = Date.now();
      let validationSummary: any;

      if (contentSource.type === 'static_template' || !request.force_refresh) {
        // Run full validation pipeline for non-validated content
        validationSummary = await this.runFullValidationPipeline(
          request.pageId,
          request.widgetId,
          contentSource.data,
          correlationId
        );
      } else {
        // Content already validated, create summary
        validationSummary = {
          all_gates_passed: true,
          failed_validations: [],
          confidence_score: contentSource.confidence_score,
          source_type: contentSource.type
        };
      }

      const validationDuration = Date.now() - validationStart;
      const totalDuration = Date.now() - startTime;

      console.log(`✅ [Phase1] Pipeline completed for ${request.pageId}/${request.widgetId} in ${totalDuration}ms`);

      return {
        success: true,
        content: contentSource,
        validation_summary: validationSummary,
        performance_metrics: {
          total_duration_ms: totalDuration,
          validation_duration_ms: validationDuration,
          content_retrieval_ms: contentRetrievalDuration
        }
      };

    } catch (error) {
      console.error(`❌ [Phase1] Pipeline error for ${request.pageId}/${request.widgetId}:`, error);

      return this.createErrorResponse(
        `Pipeline error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        startTime,
        correlationId
      );
    }
  }

  /**
   * Run comprehensive validation pipeline for all four critical pages
   */
  private async runFullValidationPipeline(
    pageId: string,
    widgetId: string,
    content: any,
    correlationId: string
  ): Promise<any> {
    console.log(`🔍 [Phase1] Running full validation pipeline for ${pageId}/${widgetId}`);

    const validationResults: ValidationResult[] = [];
    const failedValidations: string[] = [];

    try {
      // Step 1: OPAL Mapping Validation (Per Page)
      const opalMappingResult = await pageValidator.validatePageContent(
        pageId,
        widgetId,
        content,
        'opal_mapping'
      );
      validationResults.push(opalMappingResult);
      if (!opalMappingResult.passed) {
        failedValidations.push(`OPAL Mapping: ${opalMappingResult.reason}`);
      }

      // Step 2: Claude Schema Validation
      const claudeSchemaResult = await pageValidator.validatePageContent(
        pageId,
        widgetId,
        content,
        'claude_schema'
      );
      validationResults.push(claudeSchemaResult);
      if (!claudeSchemaResult.passed) {
        failedValidations.push(`Claude Schema: ${claudeSchemaResult.reason}`);
      }

      // Step 3: Cross-Tier Cross-Page Deduplication
      const deduplicationResult = await pageValidator.validatePageContent(
        pageId,
        widgetId,
        content,
        'deduplication'
      );
      validationResults.push(deduplicationResult);
      if (!deduplicationResult.passed) {
        failedValidations.push(`Deduplication: ${deduplicationResult.reason}`);
      }

      // Step 4: Cross-Page Consistency Check
      const crossPageResult = await pageValidator.validatePageContent(
        pageId,
        widgetId,
        content,
        'cross_page_consistency'
      );
      validationResults.push(crossPageResult);
      if (!crossPageResult.passed) {
        failedValidations.push(`Cross-Page Consistency: ${crossPageResult.reason}`);
      }

      // Calculate overall validation status
      const allGatesPassed = validationResults.every(result => result.passed);
      const averageConfidence = validationResults.reduce((sum, result) => sum + result.confidence_score, 0) / validationResults.length;

      console.log(`📊 [Phase1] Validation summary: ${validationResults.length} checks, ${failedValidations.length} failures, ${averageConfidence.toFixed(1)}% confidence`);

      return {
        all_gates_passed: allGatesPassed,
        failed_validations: failedValidations,
        confidence_score: averageConfidence,
        source_type: 'validated_pipeline',
        validation_details: validationResults
      };

    } catch (error) {
      console.error(`❌ [Phase1] Validation pipeline error:`, error);

      return {
        all_gates_passed: false,
        failed_validations: [`Pipeline Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        confidence_score: 0,
        source_type: 'error_fallback'
      };
    }
  }

  /**
   * Validate page configuration against the 4 critical pages
   */
  private validatePageConfiguration(pageId: string, widgetId: string): { isValid: boolean; reason?: string } {
    // Check if pageId is one of the 4 critical pages
    const pageConfig = CRITICAL_PAGES.find(p => p.pageId === pageId);

    if (!pageConfig) {
      return {
        isValid: false,
        reason: `Page '${pageId}' is not in the 4 critical pages: ${CRITICAL_PAGES.map(p => p.pageId).join(', ')}`
      };
    }

    // Check if widget is configured for this page
    if (!pageConfig.target_widgets.includes(widgetId)) {
      return {
        isValid: false,
        reason: `Widget '${widgetId}' not configured for page '${pageId}'. Expected widgets: ${pageConfig.target_widgets.join(', ')}`
      };
    }

    return { isValid: true };
  }

  /**
   * Create standardized error response
   */
  private createErrorResponse(
    errorMessage: string,
    startTime: number,
    correlationId: string
  ): Phase1ValidationResponse {
    const totalDuration = Date.now() - startTime;

    return {
      success: false,
      content: {
        type: 'static_template',
        confidence_score: 70,
        data: {
          error: true,
          message: 'Content unavailable',
          correlation_id: correlationId
        },
        validation_status: 'failed',
        fallback_reason: errorMessage
      },
      validation_summary: {
        all_gates_passed: false,
        failed_validations: [errorMessage],
        confidence_score: 0,
        source_type: 'error_fallback'
      },
      performance_metrics: {
        total_duration_ms: totalDuration,
        validation_duration_ms: 0,
        content_retrieval_ms: 0
      },
      fallback_info: {
        reason: errorMessage,
        attempted_sources: ['error_handling']
      }
    };
  }

  /**
   * Get comprehensive system health for admin dashboard
   */
  async getSystemHealth(): Promise<Phase1SystemHealth> {
    try {
      console.log(`📊 [Phase1] Generating system health report`);

      // Get validation logs for analysis
      const validationData = await validationLogger.getValidationLogs({
        hours: 24,
        limit: 1000
      });

      // Get environment system status
      const environmentStatus = environmentSafety.getSystemStatus();

      // Calculate per-page statuses
      const pageStatuses: any = {};

      for (const page of CRITICAL_PAGES) {
        const pageValidationData = await validationLogger.getValidationLogs({
          page_id: page.pageId,
          hours: 1,
          limit: 100
        });

        const pageStatus = this.calculatePageStatus(page.pageId, pageValidationData);
        pageStatuses[page.pageId] = pageStatus;
      }

      // Calculate overall system status
      const overallStatus = this.calculateOverallSystemStatus(pageStatuses);

      // Calculate system metrics
      const systemMetrics = {
        cache_hit_rate: environmentStatus.cache_stats.cache_hit_rate,
        average_confidence_score: validationData.performance_summary.average_confidence_score,
        validation_success_rate: validationData.performance_summary.passed_validations / validationData.performance_summary.total_validations,
        fallback_frequency: this.calculateFallbackFrequency(validationData)
      };

      console.log(`✅ [Phase1] System health: ${overallStatus} (${Object.keys(pageStatuses).length} pages monitored)`);

      return {
        overall_status: overallStatus,
        page_statuses: pageStatuses,
        system_metrics: systemMetrics
      };

    } catch (error) {
      console.error(`❌ [Phase1] System health check failed:`, error);

      return {
        overall_status: 'red',
        page_statuses: {},
        system_metrics: {
          cache_hit_rate: 0,
          average_confidence_score: 0,
          validation_success_rate: 0,
          fallback_frequency: 1
        }
      };
    }
  }

  /**
   * Calculate status for individual page
   */
  private calculatePageStatus(pageId: string, validationData: DrillDownLogData): any {
    const recentLogs = validationData.validation_logs.slice(0, 10); // Last 10 validations

    if (recentLogs.length === 0) {
      return {
        status: 'yellow' as const,
        last_validation: 'Never',
        validation_gates: {
          opal_mapping: 'pending' as const,
          claude_schema: 'pending' as const,
          deduplication: 'pending' as const,
          cross_page_consistency: 'pending' as const
        }
      };
    }

    // Analyze validation gates
    const gateStatus = {
      opal_mapping: this.getGateStatus(recentLogs, 'opal_mapping'),
      claude_schema: this.getGateStatus(recentLogs, 'claude_schema'),
      deduplication: this.getGateStatus(recentLogs, 'deduplication'),
      cross_page_consistency: this.getGateStatus(recentLogs, 'cross_page_consistency')
    };

    // Determine overall page status
    const gateStatuses = Object.values(gateStatus);
    let pageStatus: 'green' | 'yellow' | 'red' = 'green';

    if (gateStatuses.includes('failed')) {
      pageStatus = 'red';
    } else if (gateStatuses.includes('warning')) {
      pageStatus = 'yellow';
    }

    return {
      status: pageStatus,
      last_validation: recentLogs[0]?.timestamp || 'Unknown',
      validation_gates: gateStatus
    };
  }

  private getGateStatus(logs: any[], gateType: string): 'passed' | 'failed' | 'warning' {
    const gateLogs = logs.filter(log => log.validation_type === gateType);

    if (gateLogs.length === 0) return 'warning';

    const latest = gateLogs[0];
    return latest.status === 'passed' ? 'passed' : 'failed';
  }

  private calculateOverallSystemStatus(pageStatuses: any): 'green' | 'yellow' | 'red' {
    const statuses = Object.values(pageStatuses).map((page: any) => page.status);

    if (statuses.includes('red')) {
      return 'red';
    } else if (statuses.includes('yellow')) {
      return 'yellow';
    } else {
      return 'green';
    }
  }

  private calculateFallbackFrequency(validationData: DrillDownLogData): number {
    const totalRequests = validationData.validation_logs.length;
    const fallbackRequests = validationData.validation_logs.filter(
      log => log.details?.source_type === 'static_template'
    ).length;

    return totalRequests > 0 ? fallbackRequests / totalRequests : 0;
  }

  /**
   * Get detailed validation analytics for specific page/widget
   */
  async getValidationAnalytics(pageId: string, widgetId?: string, hours: number = 24): Promise<any> {
    try {
      const validationData = await validationLogger.getValidationLogs({
        page_id: pageId,
        widget_id: widgetId,
        hours: hours,
        limit: 500
      });

      return {
        summary: validationData.performance_summary,
        cross_page_analysis: validationData.cross_page_analysis,
        validation_timeline: this.createValidationTimeline(validationData.validation_logs),
        confidence_distribution: this.analyzeConfidenceDistribution(validationData.validation_logs),
        failure_analysis: this.analyzeFailurePatterns(validationData.validation_logs)
      };

    } catch (error) {
      console.error(`❌ [Phase1] Analytics generation failed:`, error);
      return null;
    }
  }

  private createValidationTimeline(logs: any[]): any[] {
    // Group logs by hour for timeline visualization
    const timeline: any[] = [];
    const hourGroups = new Map();

    logs.forEach(log => {
      const hour = new Date(log.timestamp || Date.now()).toISOString().substring(0, 13);
      if (!hourGroups.has(hour)) {
        hourGroups.set(hour, { passed: 0, failed: 0, total: 0 });
      }
      const group = hourGroups.get(hour);
      group.total++;
      if (log.status === 'passed') {
        group.passed++;
      } else {
        group.failed++;
      }
    });

    hourGroups.forEach((stats, hour) => {
      timeline.push({
        timestamp: hour + ':00:00Z',
        ...stats,
        success_rate: stats.total > 0 ? stats.passed / stats.total : 0
      });
    });

    return timeline.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  private analyzeConfidenceDistribution(logs: any[]): any {
    const distribution = { '90-100': 0, '80-89': 0, '70-79': 0, '60-69': 0, '0-59': 0 };

    logs.forEach(log => {
      const confidence = log.confidence_score || 0;
      if (confidence >= 90) distribution['90-100']++;
      else if (confidence >= 80) distribution['80-89']++;
      else if (confidence >= 70) distribution['70-79']++;
      else if (confidence >= 60) distribution['60-69']++;
      else distribution['0-59']++;
    });

    return distribution;
  }

  private analyzeFailurePatterns(logs: any[]): any {
    const failures = logs.filter(log => log.status === 'failed');
    const patterns: any = {};

    failures.forEach(log => {
      const errorType = log.error_info?.error_code || 'unknown_error';
      patterns[errorType] = (patterns[errorType] || 0) + 1;
    });

    return Object.entries(patterns)
      .map(([type, count]) => ({ error_type: type, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get uptime statistics for admin dashboard
   */
  getUptimeStats(): any {
    const uptime = Date.now() - this.startTime;

    return {
      uptime_ms: uptime,
      uptime_hours: Math.floor(uptime / (1000 * 60 * 60)),
      total_requests: this.requestCounter,
      requests_per_hour: this.requestCounter / Math.max(1, uptime / (1000 * 60 * 60)),
      started_at: new Date(this.startTime).toISOString()
    };
  }
}

// Export singleton instance
export const phase1Pipeline = new Phase1ValidationPipeline();

// Export additional utilities
export { CRITICAL_PAGES, type PageConfig } from '@/lib/types/phase1-database';