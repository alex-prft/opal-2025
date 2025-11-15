// Phase 3: Cross-Page Dependency Tracking and Validation System
// Manages dependencies between pages and ensures cross-page consistency

import crypto from 'crypto';
import { supabase, isDatabaseAvailable } from '@/lib/database/supabase-client';
import { intelligentCache } from '@/lib/cache/intelligent-cache-system';
import { phase2Pipeline } from '@/lib/validation/phase2-integration';

export interface CrossPageDependency {
  id?: string;
  source_page_id: string;
  source_widget_id?: string;
  target_page_id: string;
  target_widget_id?: string;
  dependency_type: 'data_dependency' | 'cache_dependency' | 'validation_dependency' | 'workflow_dependency';
  dependency_strength: number; // 1=weak, 10=critical
  dependency_rules: any;
  auto_invalidate: boolean;
  invalidation_delay_ms: number;
}

export interface CrossPageValidationResult {
  validation_id: string;
  correlation_id: string;
  validation_type: 'single_page' | 'cross_page' | 'full_site' | 'dependency_chain';
  primary_page_id: string;
  primary_widget_id?: string;
  affected_pages: Array<{
    page_id: string;
    widget_id?: string;
    validation_result: 'passed' | 'failed' | 'warning' | 'skipped';
    details: any;
  }>;
  overall_result: 'passed' | 'failed' | 'warning' | 'partial';
  cross_page_consistency_score: number;
  inconsistencies_detected: any[];
  auto_corrections_applied: any[];
  manual_review_required: boolean;
}

export interface DependencyTriggerResult {
  triggered_dependencies: number;
  invalidations_performed: number;
  validations_triggered: number;
  total_processing_time_ms: number;
  errors: string[];
}

/**
 * Cross-Page Dependency System for Phase 3
 *
 * Features:
 * - Intelligent dependency tracking between pages and widgets
 * - Automatic cross-page invalidation based on relationships
 * - Consistency validation across multiple pages
 * - Dependency strength scoring and prioritization
 * - Integration with Phase 2 cache and validation systems
 */
export class CrossPageDependencySystem {
  private dependencyGraph = new Map<string, Set<CrossPageDependency>>();
  private validationQueue = new Set<string>();
  private processingLock = new Set<string>();

  constructor() {
    console.log(`🔗 [CrossPage] Dependency system initialized`);
    this.loadDependenciesFromDatabase();
  }

  /**
   * Register a new cross-page dependency
   */
  async registerDependency(dependency: Omit<CrossPageDependency, 'id'>): Promise<string> {
    const dependencyId = crypto.randomUUID();

    try {
      const fullDependency: CrossPageDependency = {
        id: dependencyId,
        ...dependency
      };

      // Store in memory graph
      this.addToGraph(fullDependency);

      // Store in database
      if (isDatabaseAvailable()) {
        await supabase.from('cross_page_dependencies').insert({
          id: dependencyId,
          source_page_id: dependency.source_page_id,
          source_widget_id: dependency.source_widget_id,
          target_page_id: dependency.target_page_id,
          target_widget_id: dependency.target_widget_id,
          dependency_type: dependency.dependency_type,
          dependency_strength: dependency.dependency_strength,
          dependency_rules: dependency.dependency_rules,
          auto_invalidate: dependency.auto_invalidate,
          invalidation_delay_ms: dependency.invalidation_delay_ms
        });
      }

      console.log(`✅ [CrossPage] Registered dependency: ${dependency.source_page_id}/${dependency.source_widget_id || '*'} -> ${dependency.target_page_id}/${dependency.target_widget_id || '*'} (${dependency.dependency_type})`);

      return dependencyId;

    } catch (error) {
      console.error(`❌ [CrossPage] Failed to register dependency:`, error);
      throw error;
    }
  }

  /**
   * Remove a cross-page dependency
   */
  async removeDependency(dependencyId: string): Promise<boolean> {
    try {
      // Remove from memory graph
      this.removeFromGraph(dependencyId);

      // Remove from database
      if (isDatabaseAvailable()) {
        const { error } = await supabase
          .from('cross_page_dependencies')
          .delete()
          .eq('id', dependencyId);

        if (error) throw error;
      }

      console.log(`🗑️ [CrossPage] Removed dependency: ${dependencyId}`);
      return true;

    } catch (error) {
      console.error(`❌ [CrossPage] Failed to remove dependency ${dependencyId}:`, error);
      return false;
    }
  }

  /**
   * Trigger dependency processing for a page/widget change
   */
  async triggerDependencies(
    pageId: string,
    widgetId?: string,
    changeType: 'content_update' | 'cache_invalidation' | 'validation_failure' = 'content_update',
    correlationId?: string
  ): Promise<DependencyTriggerResult> {
    const triggerId = correlationId || `trigger_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const startTime = Date.now();

    console.log(`🔗 [CrossPage] Triggering dependencies for ${pageId}/${widgetId || '*'} (${changeType}) - ${triggerId}`);

    const result: DependencyTriggerResult = {
      triggered_dependencies: 0,
      invalidations_performed: 0,
      validations_triggered: 0,
      total_processing_time_ms: 0,
      errors: []
    };

    try {
      // Prevent circular processing
      const lockKey = `${pageId}:${widgetId || 'all'}`;
      if (this.processingLock.has(lockKey)) {
        console.warn(`⚠️ [CrossPage] Circular dependency detected for ${lockKey}, skipping`);
        return result;
      }

      this.processingLock.add(lockKey);

      try {
        // Get all dependencies for this page/widget
        const dependencies = this.getDependenciesForSource(pageId, widgetId);

        // Sort by dependency strength (critical first)
        const sortedDependencies = dependencies.sort((a, b) => b.dependency_strength - a.dependency_strength);

        console.log(`🔍 [CrossPage] Found ${sortedDependencies.length} dependencies to process`);

        // Process each dependency
        for (const dependency of sortedDependencies) {
          try {
            result.triggered_dependencies++;

            // Apply invalidation delay if configured
            if (dependency.invalidation_delay_ms > 0) {
              console.log(`⏳ [CrossPage] Applying ${dependency.invalidation_delay_ms}ms delay for dependency ${dependency.id}`);
              await new Promise(resolve => setTimeout(resolve, dependency.invalidation_delay_ms));
            }

            // Perform dependency-specific actions
            await this.processDependency(dependency, changeType, triggerId, result);

            // Update trigger count
            if (isDatabaseAvailable()) {
              await supabase
                .from('cross_page_dependencies')
                .update({
                  last_triggered_at: new Date().toISOString(),
                  trigger_count: supabase.sql`trigger_count + 1`
                })
                .eq('id', dependency.id);
            }

          } catch (error) {
            const errorMsg = `Dependency ${dependency.id} processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`❌ [CrossPage] ${errorMsg}`);
            result.errors.push(errorMsg);
          }
        }

      } finally {
        this.processingLock.delete(lockKey);
      }

      result.total_processing_time_ms = Date.now() - startTime;

      console.log(`✅ [CrossPage] Dependency processing complete for ${triggerId}: ${result.triggered_dependencies} dependencies, ${result.invalidations_performed} invalidations, ${result.validations_triggered} validations in ${result.total_processing_time_ms}ms`);

      return result;

    } catch (error) {
      const errorMsg = `Dependency trigger failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ [CrossPage] ${errorMsg}`);
      result.errors.push(errorMsg);
      result.total_processing_time_ms = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Validate cross-page consistency for a given page
   */
  async validateCrossPageConsistency(
    primaryPageId: string,
    primaryWidgetId?: string,
    validationType: 'cross_page' | 'full_site' | 'dependency_chain' = 'cross_page',
    correlationId?: string
  ): Promise<CrossPageValidationResult> {
    const validationId = crypto.randomUUID();
    const finalCorrelationId = correlationId || `validation_${Date.now()}_${validationId.slice(0, 8)}`;
    const startTime = Date.now();

    console.log(`🔍 [CrossPage] Starting ${validationType} validation for ${primaryPageId}/${primaryWidgetId || '*'} - ${validationId}`);

    const result: CrossPageValidationResult = {
      validation_id: validationId,
      correlation_id: finalCorrelationId,
      validation_type: validationType,
      primary_page_id: primaryPageId,
      primary_widget_id: primaryWidgetId,
      affected_pages: [],
      overall_result: 'passed',
      cross_page_consistency_score: 100,
      inconsistencies_detected: [],
      auto_corrections_applied: [],
      manual_review_required: false
    };

    try {
      // Get pages to validate based on type
      const pagesToValidate = await this.getPagesToValidate(primaryPageId, primaryWidgetId, validationType);

      console.log(`🔍 [CrossPage] Validating ${pagesToValidate.size} pages for consistency`);

      // Validate each page
      for (const [pageId, widgets] of pagesToValidate.entries()) {
        for (const widgetId of widgets) {
          try {
            // Run Phase 2 validation for this page/widget
            const phase2Result = await phase2Pipeline.getValidatedContent({
              pageId,
              widgetId: widgetId || 'default',
              force_refresh: false,
              requestContext: {
                correlation_id: finalCorrelationId,
                source: 'cross_page_validation'
              }
            });

            const pageResult = {
              page_id: pageId,
              widget_id: widgetId,
              validation_result: phase2Result.success ? 'passed' : 'failed' as any,
              details: {
                confidence_score: phase2Result.validation_summary.confidence_score,
                cache_hit: phase2Result.cache_info.cache_hit,
                claude_attempted: phase2Result.claude_info?.enhancement_attempted || false
              }
            };

            result.affected_pages.push(pageResult);

            // Check for inconsistencies
            await this.checkForInconsistencies(result, pageResult, phase2Result);

          } catch (error) {
            console.error(`❌ [CrossPage] Validation failed for ${pageId}/${widgetId}:`, error);
            result.affected_pages.push({
              page_id: pageId,
              widget_id: widgetId,
              validation_result: 'failed',
              details: { error: error instanceof Error ? error.message : 'Unknown error' }
            });
          }
        }
      }

      // Calculate overall results
      this.calculateOverallResults(result);

      // Store validation results
      if (isDatabaseAvailable()) {
        await this.storeValidationResults(result, Date.now() - startTime);
      }

      console.log(`✅ [CrossPage] Cross-page validation complete: ${result.overall_result} (score: ${result.cross_page_consistency_score}%)`);

      return result;

    } catch (error) {
      console.error(`❌ [CrossPage] Cross-page validation failed:`, error);
      result.overall_result = 'failed';
      result.cross_page_consistency_score = 0;
      result.manual_review_required = true;
      return result;
    }
  }

  /**
   * Get all dependencies affecting a target page
   */
  getDependenciesForTarget(pageId: string, widgetId?: string): CrossPageDependency[] {
    const dependencies: CrossPageDependency[] = [];

    for (const [key, depSet] of this.dependencyGraph.entries()) {
      for (const dep of depSet) {
        if (dep.target_page_id === pageId &&
            (!widgetId || !dep.target_widget_id || dep.target_widget_id === widgetId)) {
          dependencies.push(dep);
        }
      }
    }

    return dependencies;
  }

  /**
   * Get all dependencies originating from a source page
   */
  getDependenciesForSource(pageId: string, widgetId?: string): CrossPageDependency[] {
    const key = this.generateGraphKey(pageId, widgetId);
    const dependencies = this.dependencyGraph.get(key);
    return dependencies ? Array.from(dependencies) : [];
  }

  /**
   * Get dependency statistics for monitoring
   */
  getDependencyStatistics(): {
    total_dependencies: number;
    dependencies_by_type: Record<string, number>;
    dependencies_by_strength: Record<string, number>;
    critical_dependencies: number;
    auto_invalidate_dependencies: number;
    recent_triggers: number;
  } {
    let totalDependencies = 0;
    const byType: Record<string, number> = {};
    const byStrength: Record<string, number> = {};
    let criticalDependencies = 0;
    let autoInvalidateDependencies = 0;

    for (const [key, depSet] of this.dependencyGraph.entries()) {
      for (const dep of depSet) {
        totalDependencies++;

        byType[dep.dependency_type] = (byType[dep.dependency_type] || 0) + 1;

        const strengthCategory = dep.dependency_strength >= 8 ? 'critical' :
                               dep.dependency_strength >= 6 ? 'high' :
                               dep.dependency_strength >= 4 ? 'medium' : 'low';
        byStrength[strengthCategory] = (byStrength[strengthCategory] || 0) + 1;

        if (dep.dependency_strength >= 8) criticalDependencies++;
        if (dep.auto_invalidate) autoInvalidateDependencies++;
      }
    }

    return {
      total_dependencies: totalDependencies,
      dependencies_by_type: byType,
      dependencies_by_strength: byStrength,
      critical_dependencies: criticalDependencies,
      auto_invalidate_dependencies: autoInvalidateDependencies,
      recent_triggers: 0 // Would be calculated from database in full implementation
    };
  }

  // Private helper methods

  private addToGraph(dependency: CrossPageDependency): void {
    const key = this.generateGraphKey(dependency.source_page_id, dependency.source_widget_id);
    if (!this.dependencyGraph.has(key)) {
      this.dependencyGraph.set(key, new Set());
    }
    this.dependencyGraph.get(key)!.add(dependency);
  }

  private removeFromGraph(dependencyId: string): void {
    for (const [key, depSet] of this.dependencyGraph.entries()) {
      for (const dep of depSet) {
        if (dep.id === dependencyId) {
          depSet.delete(dep);
          if (depSet.size === 0) {
            this.dependencyGraph.delete(key);
          }
          return;
        }
      }
    }
  }

  private generateGraphKey(pageId: string, widgetId?: string): string {
    return `${pageId}:${widgetId || '*'}`;
  }

  private async processDependency(
    dependency: CrossPageDependency,
    changeType: string,
    correlationId: string,
    result: DependencyTriggerResult
  ): Promise<void> {
    console.log(`🔄 [CrossPage] Processing ${dependency.dependency_type} dependency: ${dependency.source_page_id}/${dependency.source_widget_id || '*'} -> ${dependency.target_page_id}/${dependency.target_widget_id || '*'}`);

    switch (dependency.dependency_type) {
      case 'cache_dependency':
        if (dependency.auto_invalidate) {
          await intelligentCache.invalidateRelatedContent(
            dependency.target_page_id,
            dependency.target_widget_id || 'default',
            `cross_page_${changeType}_${correlationId}`
          );
          result.invalidations_performed++;
        }
        break;

      case 'validation_dependency':
        // Trigger validation for target page
        await phase2Pipeline.getValidatedContent({
          pageId: dependency.target_page_id,
          widgetId: dependency.target_widget_id || 'default',
          force_refresh: true,
          requestContext: {
            correlation_id: correlationId,
            source: 'cross_page_dependency_validation'
          }
        });
        result.validations_triggered++;
        break;

      case 'data_dependency':
        // For data dependencies, invalidate cache and trigger validation
        if (dependency.auto_invalidate) {
          await intelligentCache.forceRefresh(
            dependency.target_page_id,
            dependency.target_widget_id || 'default'
          );
          result.invalidations_performed++;
          result.validations_triggered++;
        }
        break;

      case 'workflow_dependency':
        // Custom workflow processing based on dependency rules
        if (dependency.dependency_rules?.workflow_action) {
          // Implementation would depend on specific workflow requirements
          console.log(`🔄 [CrossPage] Processing workflow dependency: ${dependency.dependency_rules.workflow_action}`);
        }
        break;
    }
  }

  private async getPagesToValidate(
    primaryPageId: string,
    primaryWidgetId?: string,
    validationType: string
  ): Promise<Map<string, Set<string | undefined>>> {
    const pagesToValidate = new Map<string, Set<string | undefined>>();

    // Always include the primary page
    if (!pagesToValidate.has(primaryPageId)) {
      pagesToValidate.set(primaryPageId, new Set());
    }
    pagesToValidate.get(primaryPageId)!.add(primaryWidgetId);

    switch (validationType) {
      case 'cross_page':
        // Include directly related pages
        const directDependencies = this.getDependenciesForSource(primaryPageId, primaryWidgetId);
        for (const dep of directDependencies) {
          if (!pagesToValidate.has(dep.target_page_id)) {
            pagesToValidate.set(dep.target_page_id, new Set());
          }
          pagesToValidate.get(dep.target_page_id)!.add(dep.target_widget_id);
        }
        break;

      case 'dependency_chain':
        // Include entire dependency chain (recursive)
        await this.addDependencyChain(primaryPageId, primaryWidgetId, pagesToValidate, new Set());
        break;

      case 'full_site':
        // Include all critical pages
        const criticalPages = ['strategy-plans', 'analytics-insights', 'optimizely-dxp-tools', 'experience-optimization'];
        for (const pageId of criticalPages) {
          if (!pagesToValidate.has(pageId)) {
            pagesToValidate.set(pageId, new Set());
          }
          pagesToValidate.get(pageId)!.add(undefined); // Validate all widgets
        }
        break;
    }

    return pagesToValidate;
  }

  private async addDependencyChain(
    pageId: string,
    widgetId: string | undefined,
    pagesToValidate: Map<string, Set<string | undefined>>,
    visited: Set<string>
  ): Promise<void> {
    const key = this.generateGraphKey(pageId, widgetId);
    if (visited.has(key)) return; // Prevent infinite loops

    visited.add(key);

    const dependencies = this.getDependenciesForSource(pageId, widgetId);
    for (const dep of dependencies) {
      if (!pagesToValidate.has(dep.target_page_id)) {
        pagesToValidate.set(dep.target_page_id, new Set());
      }
      pagesToValidate.get(dep.target_page_id)!.add(dep.target_widget_id);

      // Recursively add dependencies
      await this.addDependencyChain(dep.target_page_id, dep.target_widget_id, pagesToValidate, visited);
    }
  }

  private async checkForInconsistencies(
    result: CrossPageValidationResult,
    pageResult: any,
    phase2Result: any
  ): Promise<void> {
    // Check for confidence score inconsistencies
    if (phase2Result.validation_summary.confidence_score < 80) {
      result.inconsistencies_detected.push({
        type: 'low_confidence',
        page_id: pageResult.page_id,
        widget_id: pageResult.widget_id,
        confidence_score: phase2Result.validation_summary.confidence_score,
        threshold: 80
      });
    }

    // Check for cache inconsistencies
    if (pageResult.page_id === result.primary_page_id && !phase2Result.cache_info.cache_hit) {
      result.inconsistencies_detected.push({
        type: 'primary_page_cache_miss',
        page_id: pageResult.page_id,
        widget_id: pageResult.widget_id,
        details: 'Primary page should typically have cached content'
      });
    }
  }

  private calculateOverallResults(result: CrossPageValidationResult): void {
    const totalPages = result.affected_pages.length;
    const passedPages = result.affected_pages.filter(p => p.validation_result === 'passed').length;
    const failedPages = result.affected_pages.filter(p => p.validation_result === 'failed').length;

    // Calculate consistency score
    result.cross_page_consistency_score = Math.round((passedPages / totalPages) * 100);

    // Adjust score based on inconsistencies
    const inconsistencyPenalty = Math.min(result.inconsistencies_detected.length * 5, 30);
    result.cross_page_consistency_score = Math.max(0, result.cross_page_consistency_score - inconsistencyPenalty);

    // Determine overall result
    if (failedPages === 0 && result.inconsistencies_detected.length === 0) {
      result.overall_result = 'passed';
    } else if (failedPages > totalPages / 2) {
      result.overall_result = 'failed';
      result.manual_review_required = true;
    } else if (result.inconsistencies_detected.length > 0) {
      result.overall_result = 'warning';
    } else {
      result.overall_result = 'partial';
    }
  }

  private async storeValidationResults(result: CrossPageValidationResult, processingTimeMs: number): Promise<void> {
    try {
      await supabase.from('cross_page_validation_results').insert({
        validation_id: result.validation_id,
        correlation_id: result.correlation_id,
        validation_type: result.validation_type,
        primary_page_id: result.primary_page_id,
        primary_widget_id: result.primary_widget_id,
        affected_pages: result.affected_pages,
        dependency_chain: [], // Would include dependency IDs in full implementation
        overall_result: result.overall_result,
        primary_page_result: result.affected_pages.find(p => p.page_id === result.primary_page_id)?.validation_result || 'failed',
        cross_page_consistency_score: result.cross_page_consistency_score,
        validation_details: {
          pages_validated: result.affected_pages.length,
          inconsistencies: result.inconsistencies_detected,
          auto_corrections: result.auto_corrections_applied
        },
        inconsistencies_detected: result.inconsistencies_detected,
        auto_corrections_applied: result.auto_corrections_applied,
        manual_review_required: result.manual_review_required,
        pages_validated: result.affected_pages.length,
        dependencies_checked: 0, // Would track this in full implementation
        cache_operations_performed: 0, // Would track this in full implementation
        total_validation_time_ms: processingTimeMs
      });
    } catch (error) {
      console.error(`❌ [CrossPage] Failed to store validation results:`, error);
    }
  }

  private async loadDependenciesFromDatabase(): Promise<void> {
    if (!isDatabaseAvailable()) return;

    try {
      const { data: dependencies } = await supabase
        .from('cross_page_dependencies')
        .select('*');

      if (dependencies) {
        for (const dep of dependencies) {
          this.addToGraph(dep as CrossPageDependency);
        }
        console.log(`✅ [CrossPage] Loaded ${dependencies.length} dependencies from database`);
      }
    } catch (error) {
      console.error(`❌ [CrossPage] Failed to load dependencies from database:`, error);
    }
  }
}

// Export singleton instance
export const crossPageDependencies = new CrossPageDependencySystem();