// Phase 3: Webhook-Triggered Cache Invalidation and Coordination System
// Manages intelligent cache invalidation based on webhook events and cross-page dependencies

import crypto from 'crypto';
import { supabase, isDatabaseAvailable } from '@/lib/database/supabase-client';
import { intelligentCache } from '@/lib/cache/intelligent-cache-system';
import { crossPageDependencies } from './cross-page-dependencies';

export interface CacheInvalidationRequest {
  correlation_id: string;
  trigger_source: 'webhook' | 'manual' | 'scheduled' | 'cross_page';
  invalidation_type: 'specific' | 'page_wide' | 'dependency_chain' | 'full_site';
  target_page_id?: string;
  target_widget_id?: string;
  reason: string;
  metadata?: any;
  force_immediate?: boolean;
  delay_ms?: number;
}

export interface CacheInvalidationResult {
  invalidation_id: string;
  correlation_id: string;
  success: boolean;

  // Invalidation details
  invalidation_strategy: string;
  cache_entries_invalidated: number;
  dependencies_processed: number;
  cross_page_invalidations: number;

  // Performance metrics
  total_processing_time_ms: number;
  cache_operations_time_ms: number;
  dependency_processing_time_ms: number;

  // Results by page
  page_results: Array<{
    page_id: string;
    widget_id?: string;
    cache_invalidated: boolean;
    validation_triggered: boolean;
    error?: string;
  }>;

  // Error details
  errors: string[];
  warnings: string[];
}

export interface CacheWarmingRequest {
  correlation_id: string;
  warming_type: 'targeted' | 'tier_based' | 'dependency_chain' | 'full_refresh';
  target_pages?: Array<{
    page_id: string;
    widget_id?: string;
    priority?: number;
  }>;
  warming_strategy: 'immediate' | 'scheduled' | 'lazy';
  force_refresh: boolean;
}

export interface CacheWarmingResult {
  warming_id: string;
  correlation_id: string;
  success: boolean;

  // Warming details
  pages_warmed: number;
  cache_entries_created: number;
  validation_runs: number;

  // Performance
  total_warming_time_ms: number;
  average_page_warming_ms: number;

  // Results
  warming_results: Array<{
    page_id: string;
    widget_id?: string;
    warmed: boolean;
    cache_tier: number;
    confidence_score: number;
    error?: string;
  }>;

  errors: string[];
}

/**
 * Webhook Cache Coordination System for Phase 3
 *
 * Features:
 * - Intelligent cache invalidation based on webhook triggers
 * - Cross-page dependency coordination
 * - Strategic cache warming after invalidation
 * - Performance-optimized batch operations
 * - Integration with Phase 2 intelligent cache system
 * - Real-time monitoring and statistics
 */
export class WebhookCacheCoordinator {
  private activeInvalidations = new Set<string>();
  private invalidationQueue = new Map<string, CacheInvalidationRequest>();
  private warmingQueue = new Map<string, CacheWarmingRequest>();

  private statistics = {
    total_invalidations: 0,
    successful_invalidations: 0,
    failed_invalidations: 0,
    cross_page_triggers: 0,
    cache_warming_operations: 0,
    average_invalidation_time_ms: 0
  };

  constructor() {
    console.log(`🔄 [CacheCoordinator] Webhook cache coordination system initialized`);
  }

  /**
   * Process webhook-triggered cache invalidation
   */
  async processWebhookInvalidation(request: CacheInvalidationRequest): Promise<CacheInvalidationResult> {
    const invalidationId = crypto.randomUUID();
    const startTime = Date.now();

    console.log(`🔄 [CacheCoordinator] Processing invalidation ${invalidationId} for ${request.target_page_id || 'multiple'}/${request.target_widget_id || 'all'} (${request.invalidation_type})`);

    const result: CacheInvalidationResult = {
      invalidation_id: invalidationId,
      correlation_id: request.correlation_id,
      success: false,
      invalidation_strategy: request.invalidation_type,
      cache_entries_invalidated: 0,
      dependencies_processed: 0,
      cross_page_invalidations: 0,
      total_processing_time_ms: 0,
      cache_operations_time_ms: 0,
      dependency_processing_time_ms: 0,
      page_results: [],
      errors: [],
      warnings: []
    };

    // Prevent concurrent invalidation of same target
    const lockKey = `${request.target_page_id || 'global'}:${request.target_widget_id || 'all'}`;
    if (this.activeInvalidations.has(lockKey)) {
      result.errors.push(`Concurrent invalidation already in progress for ${lockKey}`);
      return result;
    }

    this.activeInvalidations.add(lockKey);

    try {
      // Apply delay if specified
      if (request.delay_ms && request.delay_ms > 0) {
        console.log(`⏳ [CacheCoordinator] Applying ${request.delay_ms}ms delay before invalidation`);
        await new Promise(resolve => setTimeout(resolve, request.delay_ms));
      }

      // Execute invalidation based on type
      switch (request.invalidation_type) {
        case 'specific':
          await this.executeSpecificInvalidation(request, result);
          break;

        case 'page_wide':
          await this.executePageWideInvalidation(request, result);
          break;

        case 'dependency_chain':
          await this.executeDependencyChainInvalidation(request, result);
          break;

        case 'full_site':
          await this.executeFullSiteInvalidation(request, result);
          break;

        default:
          result.errors.push(`Unknown invalidation type: ${request.invalidation_type}`);
          return result;
      }

      // Update statistics
      this.statistics.total_invalidations++;
      if (result.success) {
        this.statistics.successful_invalidations++;
      } else {
        this.statistics.failed_invalidations++;
      }

      result.total_processing_time_ms = Date.now() - startTime;
      this.updateAverageInvalidationTime(result.total_processing_time_ms);

      // Log the invalidation
      await this.logInvalidation(request, result);

      console.log(`✅ [CacheCoordinator] Invalidation ${invalidationId} completed: ${result.cache_entries_invalidated} entries, ${result.cross_page_invalidations} cross-page in ${result.total_processing_time_ms}ms`);

      return result;

    } catch (error) {
      console.error(`❌ [CacheCoordinator] Invalidation ${invalidationId} failed:`, error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown invalidation error');
      result.total_processing_time_ms = Date.now() - startTime;

      await this.logInvalidation(request, result);
      return result;

    } finally {
      this.activeInvalidations.delete(lockKey);
    }
  }

  /**
   * Execute cache warming after invalidation
   */
  async executeWebhookCacheWarming(request: CacheWarmingRequest): Promise<CacheWarmingResult> {
    const warmingId = crypto.randomUUID();
    const startTime = Date.now();

    console.log(`🔥 [CacheCoordinator] Starting cache warming ${warmingId} (${request.warming_type})`);

    const result: CacheWarmingResult = {
      warming_id: warmingId,
      correlation_id: request.correlation_id,
      success: false,
      pages_warmed: 0,
      cache_entries_created: 0,
      validation_runs: 0,
      total_warming_time_ms: 0,
      average_page_warming_ms: 0,
      warming_results: [],
      errors: []
    };

    try {
      // Get target pages based on warming type
      const targetPages = await this.getTargetPagesForWarming(request);

      console.log(`🔥 [CacheCoordinator] Warming ${targetPages.length} target pages`);

      // Execute warming based on strategy
      if (request.warming_strategy === 'immediate') {
        await this.executeImmediateWarming(targetPages, result);
      } else if (request.warming_strategy === 'scheduled') {
        await this.scheduleWarming(targetPages, result);
      } else {
        // Lazy warming - just prepare cache entries
        await this.prepareLazyWarming(targetPages, result);
      }

      result.success = result.errors.length === 0;
      result.total_warming_time_ms = Date.now() - startTime;
      result.average_page_warming_ms = result.pages_warmed > 0 ?
        Math.round(result.total_warming_time_ms / result.pages_warmed) : 0;

      this.statistics.cache_warming_operations++;

      console.log(`✅ [CacheCoordinator] Cache warming ${warmingId} completed: ${result.pages_warmed} pages, ${result.cache_entries_created} entries in ${result.total_warming_time_ms}ms`);

      return result;

    } catch (error) {
      console.error(`❌ [CacheCoordinator] Cache warming ${warmingId} failed:`, error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown warming error');
      result.total_warming_time_ms = Date.now() - startTime;
      return result;
    }
  }

  // Private invalidation methods

  private async executeSpecificInvalidation(
    request: CacheInvalidationRequest,
    result: CacheInvalidationResult
  ): Promise<void> {
    if (!request.target_page_id) {
      result.errors.push('Specific invalidation requires target_page_id');
      return;
    }

    const cacheStart = Date.now();

    try {
      // Invalidate specific cache entry
      await intelligentCache.forceRefresh(
        request.target_page_id,
        request.target_widget_id || 'default'
      );

      result.cache_entries_invalidated = 1;
      result.page_results.push({
        page_id: request.target_page_id,
        widget_id: request.target_widget_id,
        cache_invalidated: true,
        validation_triggered: true
      });

      result.success = true;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Failed to invalidate ${request.target_page_id}/${request.target_widget_id}: ${errorMsg}`);

      result.page_results.push({
        page_id: request.target_page_id,
        widget_id: request.target_widget_id,
        cache_invalidated: false,
        validation_triggered: false,
        error: errorMsg
      });
    }

    result.cache_operations_time_ms = Date.now() - cacheStart;
  }

  private async executePageWideInvalidation(
    request: CacheInvalidationRequest,
    result: CacheInvalidationResult
  ): Promise<void> {
    if (!request.target_page_id) {
      result.errors.push('Page-wide invalidation requires target_page_id');
      return;
    }

    const cacheStart = Date.now();

    try {
      // Get all widgets for the page
      const pageWidgets = this.getPageWidgets(request.target_page_id);

      for (const widgetId of pageWidgets) {
        try {
          await intelligentCache.forceRefresh(request.target_page_id, widgetId);

          result.cache_entries_invalidated++;
          result.page_results.push({
            page_id: request.target_page_id,
            widget_id: widgetId,
            cache_invalidated: true,
            validation_triggered: true
          });

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          result.warnings.push(`Failed to invalidate ${request.target_page_id}/${widgetId}: ${errorMsg}`);

          result.page_results.push({
            page_id: request.target_page_id,
            widget_id: widgetId,
            cache_invalidated: false,
            validation_triggered: false,
            error: errorMsg
          });
        }
      }

      result.success = result.cache_entries_invalidated > 0;

    } catch (error) {
      result.errors.push(`Page-wide invalidation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    result.cache_operations_time_ms = Date.now() - cacheStart;
  }

  private async executeDependencyChainInvalidation(
    request: CacheInvalidationRequest,
    result: CacheInvalidationResult
  ): Promise<void> {
    if (!request.target_page_id) {
      result.errors.push('Dependency chain invalidation requires target_page_id');
      return;
    }

    const dependencyStart = Date.now();

    try {
      // Trigger cross-page dependencies
      const dependencyResult = await crossPageDependencies.triggerDependencies(
        request.target_page_id,
        request.target_widget_id,
        'cache_invalidation',
        request.correlation_id
      );

      result.dependencies_processed = dependencyResult.triggered_dependencies;
      result.cross_page_invalidations = dependencyResult.invalidations_performed;

      // Also invalidate the source page
      await this.executeSpecificInvalidation(request, result);

      result.success = dependencyResult.errors.length === 0 && result.errors.length === 0;

      if (dependencyResult.errors.length > 0) {
        result.warnings.push(...dependencyResult.errors);
      }

      this.statistics.cross_page_triggers++;

    } catch (error) {
      result.errors.push(`Dependency chain invalidation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    result.dependency_processing_time_ms = Date.now() - dependencyStart;
  }

  private async executeFullSiteInvalidation(
    request: CacheInvalidationRequest,
    result: CacheInvalidationResult
  ): Promise<void> {
    const cacheStart = Date.now();

    try {
      // Clear all cache
      await intelligentCache.clearAllCache();

      // Get all critical pages
      const criticalPages = ['strategy-plans', 'analytics-insights', 'optimizely-dxp-tools', 'experience-optimization'];

      for (const pageId of criticalPages) {
        const pageWidgets = this.getPageWidgets(pageId);

        for (const widgetId of pageWidgets) {
          result.page_results.push({
            page_id: pageId,
            widget_id: widgetId,
            cache_invalidated: true,
            validation_triggered: false // Will be triggered by cache warming
          });
        }
      }

      result.cache_entries_invalidated = result.page_results.length;
      result.success = true;

    } catch (error) {
      result.errors.push(`Full site invalidation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    result.cache_operations_time_ms = Date.now() - cacheStart;
  }

  // Private warming methods

  private async getTargetPagesForWarming(request: CacheWarmingRequest): Promise<Array<{
    page_id: string;
    widget_id?: string;
    priority: number;
  }>> {
    const targets: Array<{ page_id: string; widget_id?: string; priority: number }> = [];

    switch (request.warming_type) {
      case 'targeted':
        if (request.target_pages) {
          targets.push(...request.target_pages.map(p => ({ ...p, priority: p.priority || 5 })));
        }
        break;

      case 'tier_based':
        // Warm Tier 1 pages first
        const tier1Pages = ['strategy-plans', 'analytics-insights'];
        for (const pageId of tier1Pages) {
          const widgets = this.getPageWidgets(pageId);
          for (const widgetId of widgets) {
            targets.push({ page_id: pageId, widget_id: widgetId, priority: 1 });
          }
        }

        // Then Tier 2 pages
        const tier2Pages = ['optimizely-dxp-tools', 'experience-optimization'];
        for (const pageId of tier2Pages) {
          const widgets = this.getPageWidgets(pageId);
          for (const widgetId of widgets) {
            targets.push({ page_id: pageId, widget_id: widgetId, priority: 2 });
          }
        }
        break;

      case 'dependency_chain':
        // Would implement full dependency chain analysis
        break;

      case 'full_refresh':
        // All pages
        const allPages = ['strategy-plans', 'analytics-insights', 'optimizely-dxp-tools', 'experience-optimization'];
        for (const pageId of allPages) {
          const widgets = this.getPageWidgets(pageId);
          for (const widgetId of widgets) {
            targets.push({ page_id: pageId, widget_id: widgetId, priority: 3 });
          }
        }
        break;
    }

    // Sort by priority
    return targets.sort((a, b) => a.priority - b.priority);
  }

  private async executeImmediateWarming(
    targets: Array<{ page_id: string; widget_id?: string; priority: number }>,
    result: CacheWarmingResult
  ): Promise<void> {
    // Process in batches to avoid overload
    const batchSize = 3;

    for (let i = 0; i < targets.length; i += batchSize) {
      const batch = targets.slice(i, i + batchSize);

      await Promise.all(batch.map(async target => {
        try {
          const pageStart = Date.now();

          // Trigger cache warming through intelligent cache
          await intelligentCache.forceRefresh(target.page_id, target.widget_id || 'default');

          result.pages_warmed++;
          result.cache_entries_created++;
          result.validation_runs++;

          result.warming_results.push({
            page_id: target.page_id,
            widget_id: target.widget_id,
            warmed: true,
            cache_tier: target.priority,
            confidence_score: 100 // Would get actual score from cache system
          });

          console.log(`🔥 [CacheCoordinator] Warmed ${target.page_id}/${target.widget_id} in ${Date.now() - pageStart}ms`);

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to warm ${target.page_id}/${target.widget_id}: ${errorMsg}`);

          result.warming_results.push({
            page_id: target.page_id,
            widget_id: target.widget_id,
            warmed: false,
            cache_tier: target.priority,
            confidence_score: 0,
            error: errorMsg
          });
        }
      }));

      // Small delay between batches
      if (i + batchSize < targets.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  private async scheduleWarming(
    targets: Array<{ page_id: string; widget_id?: string; priority: number }>,
    result: CacheWarmingResult
  ): Promise<void> {
    // For scheduled warming, we would typically queue the warming jobs
    // For now, just mark them as scheduled

    for (const target of targets) {
      result.warming_results.push({
        page_id: target.page_id,
        widget_id: target.widget_id,
        warmed: false, // Scheduled, not yet warmed
        cache_tier: target.priority,
        confidence_score: 0
      });
    }

    result.pages_warmed = 0; // Not yet warmed
    console.log(`⏰ [CacheCoordinator] Scheduled warming for ${targets.length} pages`);
  }

  private async prepareLazyWarming(
    targets: Array<{ page_id: string; widget_id?: string; priority: number }>,
    result: CacheWarmingResult
  ): Promise<void> {
    // For lazy warming, just prepare the cache entries but don't populate them

    for (const target of targets) {
      result.warming_results.push({
        page_id: target.page_id,
        widget_id: target.widget_id,
        warmed: false, // Prepared for lazy loading
        cache_tier: target.priority,
        confidence_score: 0
      });
    }

    result.pages_warmed = targets.length; // Prepared
    console.log(`😴 [CacheCoordinator] Prepared lazy warming for ${targets.length} pages`);
  }

  // Utility methods

  private getPageWidgets(pageId: string): string[] {
    const pageWidgets: Record<string, string[]> = {
      'strategy-plans': ['kpi-dashboard', 'roadmap-timeline'],
      'analytics-insights': ['analytics-dashboard', 'insights-summary'],
      'optimizely-dxp-tools': ['tool-matrix', 'integration-status'],
      'experience-optimization': ['optimization-results', 'test-recommendations']
    };

    return pageWidgets[pageId] || ['default'];
  }

  private updateAverageInvalidationTime(durationMs: number): void {
    const totalOperations = this.statistics.total_invalidations;
    if (totalOperations === 1) {
      this.statistics.average_invalidation_time_ms = durationMs;
    } else {
      this.statistics.average_invalidation_time_ms =
        (this.statistics.average_invalidation_time_ms * (totalOperations - 1) + durationMs) / totalOperations;
    }
  }

  private async logInvalidation(
    request: CacheInvalidationRequest,
    result: CacheInvalidationResult
  ): Promise<void> {
    if (!isDatabaseAvailable()) return;

    try {
      await supabase.from('webhook_cache_operations').insert({
        id: result.invalidation_id,
        correlation_id: request.correlation_id,
        operation_type: 'invalidation',
        trigger_source: request.trigger_source,
        target_page_id: request.target_page_id,
        target_widget_id: request.target_widget_id,
        operation_details: {
          invalidation_type: request.invalidation_type,
          reason: request.reason,
          metadata: request.metadata
        },
        success: result.success,
        cache_entries_affected: result.cache_entries_invalidated,
        cross_page_operations: result.cross_page_invalidations,
        processing_time_ms: result.total_processing_time_ms,
        errors: result.errors,
        warnings: result.warnings
      });
    } catch (error) {
      console.error(`❌ [CacheCoordinator] Failed to log invalidation:`, error);
    }
  }

  /**
   * Get cache coordination statistics
   */
  getCacheCoordinationStatistics(): typeof this.statistics & {
    active_invalidations: number;
    queued_invalidations: number;
    queued_warming_operations: number;
  } {
    return {
      ...this.statistics,
      active_invalidations: this.activeInvalidations.size,
      queued_invalidations: this.invalidationQueue.size,
      queued_warming_operations: this.warmingQueue.size
    };
  }

  /**
   * Reset statistics (for testing/maintenance)
   */
  resetStatistics(): void {
    this.statistics = {
      total_invalidations: 0,
      successful_invalidations: 0,
      failed_invalidations: 0,
      cross_page_triggers: 0,
      cache_warming_operations: 0,
      average_invalidation_time_ms: 0
    };

    console.log(`🔄 [CacheCoordinator] Statistics reset`);
  }
}

// Export singleton instance
export const webhookCacheCoordinator = new WebhookCacheCoordinator();