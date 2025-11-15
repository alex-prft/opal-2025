// Phase 2: Intelligent Cache System with Scheduled Background Validation
// Tiered TTL, startup warming, and smart cross-page invalidation

import { supabase, isDatabaseAvailable } from '@/lib/database/supabase-client';
import { claudeIntegration } from '@/lib/claude/claude-api-integration';
import { pageValidator } from '@/lib/validation/page-validation-core';
import type {
  CacheManagement,
  DEFAULT_CACHE_CONFIG,
  CacheConfig
} from '@/lib/types/phase2-database';
import crypto from 'crypto';

export interface CacheEntry {
  cache_key: string;
  content: any;
  source_type: 'real_opal_claude' | 'cached_opal_claude' | 'opal_only' | 'static_template';
  confidence_score: number;
  tier: 1 | 2 | 3;
  expires_at: Date;
  created_at: Date;
  dependencies?: string[];
}

export interface CacheHitResult {
  hit: boolean;
  content?: any;
  source_type?: string;
  confidence_score?: number;
  age_ms?: number;
  cache_key?: string;
}

export interface CacheWarmingJob {
  page_id: string;
  widget_id: string;
  tier: number;
  priority: number;
  force_refresh: boolean;
}

/**
 * Intelligent Cache System with Tiered TTL and Background Validation
 *
 * Cache Tiers:
 * - Tier 1: 5 minutes TTL, 15-minute validation frequency (High priority pages)
 * - Tier 2: 10 minutes TTL, 30-minute validation frequency (Medium priority pages)
 * - Tier 3: 15 minutes TTL, 45-minute validation frequency (Standard pages)
 */
export class IntelligentCacheSystem {
  private config: CacheConfig;
  private memoryCache = new Map<string, CacheEntry>();
  private dependencies = new Map<string, Set<string>>(); // cache_key -> dependent keys
  private validationJobs = new Set<string>(); // Currently validating keys
  private startupComplete = false;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      ...DEFAULT_CACHE_CONFIG,
      ...config
    };

    console.log(`💾 [Cache] Intelligent cache system initialized`);
    console.log(`💾 [Cache] Tier configuration:`, {
      tier1: `${this.config.tier1.ttl_seconds}s TTL, ${this.config.tier1.validation_frequency_minutes}m validation`,
      tier2: `${this.config.tier2.ttl_seconds}s TTL, ${this.config.tier2.validation_frequency_minutes}m validation`,
      tier3: `${this.config.tier3.ttl_seconds}s TTL, ${this.config.tier3.validation_frequency_minutes}m validation`
    });
  }

  /**
   * Get content from cache with intelligent fallback
   */
  async getContent(pageId: string, widgetId: string): Promise<CacheHitResult> {
    const cacheKey = this.generateCacheKey(pageId, widgetId);
    const startTime = Date.now();

    try {
      // Check memory cache first
      const memoryResult = this.checkMemoryCache(cacheKey);
      if (memoryResult.hit) {
        await this.recordCacheHit(cacheKey, Date.now() - startTime);
        console.log(`💾 [Cache] Memory hit for ${pageId}/${widgetId} (${memoryResult.age_ms}ms old)`);
        return memoryResult;
      }

      // Check database cache
      const dbResult = await this.checkDatabaseCache(cacheKey);
      if (dbResult.hit) {
        // Load into memory cache
        await this.loadIntoMemoryCache(cacheKey, dbResult);
        await this.recordCacheHit(cacheKey, Date.now() - startTime);
        console.log(`💾 [Cache] Database hit for ${pageId}/${widgetId}`);
        return dbResult;
      }

      // Cache miss - record and return
      await this.recordCacheMiss(cacheKey, Date.now() - startTime);
      console.log(`💾 [Cache] Miss for ${pageId}/${widgetId}`);

      return { hit: false };

    } catch (error) {
      console.error(`❌ [Cache] Error getting content for ${pageId}/${widgetId}:`, error);
      await this.recordCacheMiss(cacheKey, Date.now() - startTime);
      return { hit: false };
    }
  }

  /**
   * Store content in cache with tier-based TTL
   */
  async storeContent(
    pageId: string,
    widgetId: string,
    content: any,
    sourceType: string,
    confidenceScore: number
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(pageId, widgetId);
    const tier = this.getTierForPage(pageId);
    const ttl = this.getTTLForTier(tier);
    const expiresAt = new Date(Date.now() + ttl * 1000);

    try {
      const contentHash = this.generateContentHash(content);

      // Create cache entry
      const cacheEntry: CacheEntry = {
        cache_key: cacheKey,
        content,
        source_type: sourceType as any,
        confidence_score: confidenceScore,
        tier,
        expires_at: expiresAt,
        created_at: new Date(),
        dependencies: this.calculateDependencies(pageId, widgetId, content)
      };

      // Store in memory cache
      this.memoryCache.set(cacheKey, cacheEntry);

      // Store in database cache
      await this.storeDatabaseCache(cacheEntry, contentHash);

      // Update dependencies
      await this.updateDependencies(cacheKey, cacheEntry.dependencies || []);

      // Schedule validation
      await this.scheduleValidation(cacheKey, tier);

      console.log(`💾 [Cache] Stored ${pageId}/${widgetId} (Tier ${tier}, TTL: ${ttl}s, confidence: ${confidenceScore}%)`);

    } catch (error) {
      console.error(`❌ [Cache] Error storing content for ${pageId}/${widgetId}:`, error);
    }
  }

  /**
   * Startup cache warming for Tier 1 pages
   */
  async warmupStartupCache(): Promise<void> {
    if (this.startupComplete) {
      console.log(`💾 [Cache] Startup warming already completed`);
      return;
    }

    console.log(`🔥 [Cache] Starting cache warming for Tier 1 pages`);

    const warmingJobs: CacheWarmingJob[] = [];

    // Create warming jobs for Tier 1 pages
    for (const pageId of this.config.tier1.pages) {
      const pageConfig = this.getPageConfig(pageId);
      if (pageConfig) {
        for (const widgetId of pageConfig.target_widgets) {
          warmingJobs.push({
            page_id: pageId,
            widget_id: widgetId,
            tier: 1,
            priority: 1, // Highest priority
            force_refresh: true
          });
        }
      }
    }

    console.log(`🔥 [Cache] Created ${warmingJobs.length} warming jobs`);

    // Execute warming jobs in parallel (with concurrency limit)
    const concurrency = 3;
    for (let i = 0; i < warmingJobs.length; i += concurrency) {
      const batch = warmingJobs.slice(i, i + concurrency);
      await Promise.all(batch.map(job => this.executeWarmingJob(job)));
    }

    this.startupComplete = true;
    console.log(`✅ [Cache] Startup cache warming completed`);
  }

  /**
   * Scheduled background validation for high-traffic widgets
   */
  async validateCachedContent(): Promise<void> {
    console.log(`🔍 [Cache] Starting scheduled background validation`);

    try {
      // Get cache entries that need validation
      const entriesNeedingValidation = await this.getEntriesNeedingValidation();

      if (entriesNeedingValidation.length === 0) {
        console.log(`🔍 [Cache] No entries need validation at this time`);
        return;
      }

      console.log(`🔍 [Cache] Validating ${entriesNeedingValidation.length} cache entries`);

      // Validate entries in parallel (with concurrency limit)
      const concurrency = 2;
      for (let i = 0; i < entriesNeedingValidation.length; i += concurrency) {
        const batch = entriesNeedingValidation.slice(i, i + concurrency);
        await Promise.all(batch.map(entry => this.validateCacheEntry(entry)));
      }

      console.log(`✅ [Cache] Scheduled validation completed`);

    } catch (error) {
      console.error(`❌ [Cache] Error in scheduled validation:`, error);
    }
  }

  /**
   * Smart cross-page invalidation based on dependencies
   */
  async invalidateRelatedContent(pageId: string, widgetId: string, reason: string): Promise<void> {
    const cacheKey = this.generateCacheKey(pageId, widgetId);

    console.log(`🔄 [Cache] Starting cross-page invalidation for ${pageId}/${widgetId} (reason: ${reason})`);

    try {
      // Get all dependent cache keys
      const dependentKeys = this.dependencies.get(cacheKey) || new Set();
      const invalidatedKeys: string[] = [cacheKey];

      // Invalidate the primary cache entry
      await this.invalidateCacheEntry(cacheKey, reason);

      // Invalidate dependent entries
      for (const dependentKey of dependentKeys) {
        await this.invalidateCacheEntry(dependentKey, `dependency_invalidated: ${cacheKey}`);
        invalidatedKeys.push(dependentKey);

        // Get transitive dependencies
        const transitiveDependents = this.dependencies.get(dependentKey) || new Set();
        for (const transitiveKey of transitiveDependents) {
          if (!invalidatedKeys.includes(transitiveKey)) {
            await this.invalidateCacheEntry(transitiveKey, `transitive_dependency: ${dependentKey}`);
            invalidatedKeys.push(transitiveKey);
          }
        }
      }

      console.log(`🔄 [Cache] Cross-page invalidation completed: ${invalidatedKeys.length} entries invalidated`);

    } catch (error) {
      console.error(`❌ [Cache] Error in cross-page invalidation:`, error);
    }
  }

  /**
   * Force refresh cache for specific page/widget
   */
  async forceRefresh(pageId: string, widgetId: string): Promise<void> {
    const cacheKey = this.generateCacheKey(pageId, widgetId);

    console.log(`🔄 [Cache] Force refresh requested for ${pageId}/${widgetId}`);

    // Invalidate current cache
    await this.invalidateCacheEntry(cacheKey, 'force_refresh');

    // Execute warming job to rebuild cache
    const warmingJob: CacheWarmingJob = {
      page_id: pageId,
      widget_id: widgetId,
      tier: this.getTierForPage(pageId),
      priority: 1,
      force_refresh: true
    };

    await this.executeWarmingJob(warmingJob);

    console.log(`✅ [Cache] Force refresh completed for ${pageId}/${widgetId}`);
  }

  // Private Methods

  private checkMemoryCache(cacheKey: string): CacheHitResult {
    const entry = this.memoryCache.get(cacheKey);

    if (!entry) {
      return { hit: false };
    }

    // Check if expired
    if (entry.expires_at < new Date()) {
      this.memoryCache.delete(cacheKey);
      return { hit: false };
    }

    return {
      hit: true,
      content: entry.content,
      source_type: entry.source_type,
      confidence_score: entry.confidence_score,
      age_ms: Date.now() - entry.created_at.getTime(),
      cache_key: cacheKey
    };
  }

  private async checkDatabaseCache(cacheKey: string): Promise<CacheHitResult> {
    if (!isDatabaseAvailable()) {
      return { hit: false };
    }

    try {
      const { data, error } = await supabase
        .from('cache_management')
        .select('*')
        .eq('cache_key', cacheKey)
        .eq('validation_status', 'valid')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return { hit: false };
      }

      return {
        hit: true,
        content: data.cached_content,
        source_type: data.cache_source,
        confidence_score: this.calculateConfidenceFromSource(data.cache_source),
        age_ms: Date.now() - new Date(data.created_at).getTime(),
        cache_key: cacheKey
      };

    } catch (error) {
      console.error(`❌ [Cache] Database cache check error:`, error);
      return { hit: false };
    }
  }

  private async loadIntoMemoryCache(cacheKey: string, dbResult: CacheHitResult): Promise<void> {
    if (!dbResult.content) return;

    const tier = this.extractTierFromCacheKey(cacheKey);
    const ttl = this.getTTLForTier(tier);

    const cacheEntry: CacheEntry = {
      cache_key: cacheKey,
      content: dbResult.content,
      source_type: dbResult.source_type as any,
      confidence_score: dbResult.confidence_score || 70,
      tier,
      expires_at: new Date(Date.now() + ttl * 1000),
      created_at: new Date()
    };

    this.memoryCache.set(cacheKey, cacheEntry);
  }

  private async storeDatabaseCache(entry: CacheEntry, contentHash: string): Promise<void> {
    if (!isDatabaseAvailable()) return;

    try {
      const validationFrequency = this.getValidationFrequencyForTier(entry.tier);
      const nextValidation = new Date(Date.now() + validationFrequency * 60 * 1000);

      const dbRecord: Partial<CacheManagement> = {
        cache_key: entry.cache_key,
        page_id: this.extractPageIdFromKey(entry.cache_key),
        widget_id: this.extractWidgetIdFromKey(entry.cache_key),
        tier: entry.tier,
        ttl_seconds: this.getTTLForTier(entry.tier),
        cached_content: entry.content,
        content_hash: contentHash,
        cache_source: entry.source_type,
        last_validated_at: new Date().toISOString(),
        validation_status: 'valid',
        validation_frequency_minutes: validationFrequency,
        next_validation_at: nextValidation.toISOString(),
        dependent_cache_keys: entry.dependencies || [],
        dependency_cache_keys: [],
        hit_count: 0,
        miss_count: 0,
        expires_at: entry.expires_at.toISOString()
      };

      await supabase
        .from('cache_management')
        .upsert(dbRecord, { onConflict: 'cache_key' });

    } catch (error) {
      console.error(`❌ [Cache] Database storage error:`, error);
    }
  }

  private async executeWarmingJob(job: CacheWarmingJob): Promise<void> {
    const cacheKey = this.generateCacheKey(job.page_id, job.widget_id);

    try {
      console.log(`🔥 [Cache] Warming ${job.page_id}/${job.widget_id} (Tier ${job.tier})`);

      // Check if already warm and not forcing refresh
      if (!job.force_refresh) {
        const existing = await this.checkMemoryCache(cacheKey);
        if (existing.hit) {
          console.log(`🔥 [Cache] Already warm: ${job.page_id}/${job.widget_id}`);
          return;
        }
      }

      // Generate fresh content (simulate content generation)
      const freshContent = await this.generateFreshContent(job.page_id, job.widget_id);

      // Store in cache
      await this.storeContent(
        job.page_id,
        job.widget_id,
        freshContent.content,
        freshContent.source_type,
        freshContent.confidence_score
      );

      console.log(`✅ [Cache] Warmed ${job.page_id}/${job.widget_id}`);

    } catch (error) {
      console.error(`❌ [Cache] Warming job failed for ${job.page_id}/${job.widget_id}:`, error);
    }
  }

  private async generateFreshContent(pageId: string, widgetId: string): Promise<any> {
    // Simulate content generation with validation pipeline
    // In production, this would call the actual content generation system

    const mockOpalData = {
      id: `${pageId}_${widgetId}`,
      type: widgetId,
      tier: this.getTierForPage(pageId),
      metrics: {
        engagement_rate: Math.random() * 0.5 + 0.5,
        conversion_rate: Math.random() * 0.2 + 0.1,
        page_views: Math.floor(Math.random() * 10000) + 5000
      },
      timestamp: new Date().toISOString(),
      source: 'cache_warming'
    };

    return {
      content: mockOpalData,
      source_type: 'opal_only',
      confidence_score: 100
    };
  }

  private async getEntriesNeedingValidation(): Promise<any[]> {
    if (!isDatabaseAvailable()) return [];

    try {
      const { data, error } = await supabase
        .from('cache_management')
        .select('*')
        .eq('validation_status', 'valid')
        .lt('next_validation_at', new Date().toISOString())
        .limit(20);

      return data || [];

    } catch (error) {
      console.error(`❌ [Cache] Error getting entries needing validation:`, error);
      return [];
    }
  }

  private async validateCacheEntry(entry: any): Promise<void> {
    const cacheKey = entry.cache_key;

    if (this.validationJobs.has(cacheKey)) {
      return; // Already validating
    }

    this.validationJobs.add(cacheKey);

    try {
      console.log(`🔍 [Cache] Validating ${entry.page_id}/${entry.widget_id}`);

      // Mark as validating
      await this.updateValidationStatus(cacheKey, 'validating');

      // Run validation pipeline
      const validationResults = await Promise.all([
        pageValidator.validatePageContent(entry.page_id, entry.widget_id, entry.cached_content, 'opal_mapping'),
        pageValidator.validatePageContent(entry.page_id, entry.widget_id, entry.cached_content, 'deduplication')
      ]);

      const allPassed = validationResults.every(result => result.passed);

      if (allPassed) {
        // Validation passed - update next validation time
        const validationFrequency = this.getValidationFrequencyForTier(entry.tier);
        const nextValidation = new Date(Date.now() + validationFrequency * 60 * 1000);

        await this.updateValidationStatus(cacheKey, 'valid', nextValidation);
        console.log(`✅ [Cache] Validation passed for ${entry.page_id}/${entry.widget_id}`);
      } else {
        // Validation failed - invalidate cache
        await this.invalidateCacheEntry(cacheKey, 'validation_failed');
        console.log(`❌ [Cache] Validation failed for ${entry.page_id}/${entry.widget_id}`);
      }

    } catch (error) {
      console.error(`❌ [Cache] Validation error for ${cacheKey}:`, error);
      await this.updateValidationStatus(cacheKey, 'invalid');
    } finally {
      this.validationJobs.delete(cacheKey);
    }
  }

  private async updateValidationStatus(cacheKey: string, status: string, nextValidation?: Date): Promise<void> {
    if (!isDatabaseAvailable()) return;

    try {
      const updateData: any = {
        validation_status: status,
        last_validated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (nextValidation) {
        updateData.next_validation_at = nextValidation.toISOString();
      }

      await supabase
        .from('cache_management')
        .update(updateData)
        .eq('cache_key', cacheKey);

    } catch (error) {
      console.error(`❌ [Cache] Error updating validation status:`, error);
    }
  }

  private async invalidateCacheEntry(cacheKey: string, reason: string): Promise<void> {
    // Remove from memory cache
    this.memoryCache.delete(cacheKey);

    // Update database cache status
    if (isDatabaseAvailable()) {
      try {
        await supabase
          .from('cache_management')
          .update({
            validation_status: 'invalid',
            invalidated_at: new Date().toISOString(),
            invalidation_reason: reason
          })
          .eq('cache_key', cacheKey);
      } catch (error) {
        console.error(`❌ [Cache] Error invalidating cache entry:`, error);
      }
    }

    console.log(`🗑️ [Cache] Invalidated ${this.extractPageIdFromKey(cacheKey)}/${this.extractWidgetIdFromKey(cacheKey)} (${reason})`);
  }

  private async updateDependencies(cacheKey: string, dependencies: string[]): Promise<void> {
    // Clear existing dependencies for this cache key
    for (const [depKey, dependents] of this.dependencies.entries()) {
      dependents.delete(cacheKey);
    }

    // Add new dependencies
    for (const dependency of dependencies) {
      if (!this.dependencies.has(dependency)) {
        this.dependencies.set(dependency, new Set());
      }
      this.dependencies.get(dependency)!.add(cacheKey);
    }
  }

  private async scheduleValidation(cacheKey: string, tier: number): Promise<void> {
    const validationFrequency = this.getValidationFrequencyForTier(tier);
    const nextValidation = new Date(Date.now() + validationFrequency * 60 * 1000);

    if (isDatabaseAvailable()) {
      try {
        await supabase
          .from('cache_management')
          .update({
            next_validation_at: nextValidation.toISOString()
          })
          .eq('cache_key', cacheKey);
      } catch (error) {
        console.error(`❌ [Cache] Error scheduling validation:`, error);
      }
    }
  }

  private calculateDependencies(pageId: string, widgetId: string, content: any): string[] {
    const dependencies: string[] = [];

    // Cross-page dependencies based on related pages
    const pageConfig = this.getPageConfig(pageId);
    if (pageConfig?.related_pages) {
      for (const relatedPageId of pageConfig.related_pages) {
        dependencies.push(this.generateCacheKey(relatedPageId, widgetId));
      }
    }

    return dependencies;
  }

  private async recordCacheHit(cacheKey: string, retrievalTime: number): Promise<void> {
    if (!isDatabaseAvailable()) return;

    try {
      await supabase
        .from('cache_management')
        .update({
          hit_count: supabase.sql`hit_count + 1`,
          last_hit_at: new Date().toISOString(),
          average_retrieval_time_ms: supabase.sql`
            CASE
              WHEN hit_count = 0 THEN ${retrievalTime}
              ELSE (average_retrieval_time_ms * hit_count + ${retrievalTime}) / (hit_count + 1)
            END
          `
        })
        .eq('cache_key', cacheKey);
    } catch (error) {
      // Non-critical error, just log
      console.debug(`Cache hit recording failed for ${cacheKey}:`, error);
    }
  }

  private async recordCacheMiss(cacheKey: string, retrievalTime: number): Promise<void> {
    if (!isDatabaseAvailable()) return;

    try {
      await supabase
        .from('cache_management')
        .update({
          miss_count: supabase.sql`miss_count + 1`
        })
        .eq('cache_key', cacheKey);
    } catch (error) {
      // Non-critical error, just log
      console.debug(`Cache miss recording failed for ${cacheKey}:`, error);
    }
  }

  // Utility Methods

  private generateCacheKey(pageId: string, widgetId: string): string {
    return `cache:${pageId}:${widgetId}`;
  }

  private generateContentHash(content: any): string {
    const contentString = JSON.stringify(content, Object.keys(content).sort());
    return crypto.createHash('sha256').update(contentString).digest('hex');
  }

  private getTierForPage(pageId: string): 1 | 2 | 3 {
    if (this.config.tier1.pages.includes(pageId)) return 1;
    if (this.config.tier2.pages.includes(pageId)) return 2;
    return 3;
  }

  private getTTLForTier(tier: number): number {
    switch (tier) {
      case 1: return this.config.tier1.ttl_seconds;
      case 2: return this.config.tier2.ttl_seconds;
      case 3: return this.config.tier3.ttl_seconds;
      default: return this.config.tier3.ttl_seconds;
    }
  }

  private getValidationFrequencyForTier(tier: number): number {
    switch (tier) {
      case 1: return this.config.tier1.validation_frequency_minutes;
      case 2: return this.config.tier2.validation_frequency_minutes;
      case 3: return this.config.tier3.validation_frequency_minutes;
      default: return this.config.tier3.validation_frequency_minutes;
    }
  }

  private calculateConfidenceFromSource(sourceType: string): number {
    const confidenceMap = {
      'real_opal_claude': 99,
      'cached_opal_claude': 95,
      'opal_only': 100,
      'static_template': 70
    };
    return confidenceMap[sourceType] || 70;
  }

  private extractPageIdFromKey(cacheKey: string): string {
    return cacheKey.split(':')[1] || '';
  }

  private extractWidgetIdFromKey(cacheKey: string): string {
    return cacheKey.split(':')[2] || '';
  }

  private extractTierFromCacheKey(cacheKey: string): 1 | 2 | 3 {
    const pageId = this.extractPageIdFromKey(cacheKey);
    return this.getTierForPage(pageId);
  }

  private getPageConfig(pageId: string): any {
    // This should integrate with your existing page configuration
    // For now, return basic config
    const pageConfigs = {
      'strategy-plans': { target_widgets: ['kpi-dashboard', 'roadmap-timeline'], related_pages: ['analytics-insights'] },
      'analytics-insights': { target_widgets: ['analytics-dashboard', 'insights-summary'], related_pages: ['strategy-plans'] },
      'optimizely-dxp-tools': { target_widgets: ['tool-matrix', 'integration-status'], related_pages: ['experience-optimization'] },
      'experience-optimization': { target_widgets: ['optimization-results', 'test-recommendations'], related_pages: ['optimizely-dxp-tools'] }
    };
    return pageConfigs[pageId];
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStatistics(): any {
    return {
      memory_cache_size: this.memoryCache.size,
      dependencies_tracked: this.dependencies.size,
      validation_jobs_active: this.validationJobs.size,
      startup_complete: this.startupComplete,
      tier_configuration: this.config
    };
  }

  /**
   * Clear all cache (for testing/maintenance)
   */
  async clearAllCache(): Promise<void> {
    console.log(`🗑️ [Cache] Clearing all cache`);

    // Clear memory cache
    this.memoryCache.clear();
    this.dependencies.clear();
    this.validationJobs.clear();

    // Clear database cache
    if (isDatabaseAvailable()) {
      try {
        await supabase
          .from('cache_management')
          .update({
            validation_status: 'invalid',
            invalidated_at: new Date().toISOString(),
            invalidation_reason: 'manual_clear_all'
          })
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all records
      } catch (error) {
        console.error(`❌ [Cache] Error clearing database cache:`, error);
      }
    }

    this.startupComplete = false;
    console.log(`✅ [Cache] All cache cleared`);
  }
}

// Export singleton instance
export const intelligentCache = new IntelligentCacheSystem();