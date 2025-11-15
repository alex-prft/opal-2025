// Phase 2: Background Job System for Cache Management
// Handles scheduled validation, cache warming, and cross-page synchronization

import { supabase, isDatabaseAvailable } from '@/lib/database/supabase-client';
import { intelligentCache } from '@/lib/cache/intelligent-cache-system';
import { phase1Pipeline } from '@/lib/validation/phase1-integration';
import type {
  BackgroundJob,
  DEFAULT_BACKGROUND_JOB_CONFIG,
  BackgroundJobConfig
} from '@/lib/types/phase2-database';

export interface JobExecutionResult {
  job_id: string;
  success: boolean;
  duration_ms: number;
  processed_items: number;
  errors: string[];
  details?: any;
}

export interface JobScheduler {
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
  getJobStatus(jobId: string): Promise<any>;
  triggerJob(jobType: string): Promise<JobExecutionResult>;
}

/**
 * Background Job System for Scheduled Cache Management
 *
 * Manages:
 * 1. Cache Validation (Every 30 minutes)
 * 2. Cache Warming (On startup and on-demand)
 * 3. Cross-Page Synchronization (Every 15 minutes)
 * 4. Performance monitoring and job lifecycle
 */
export class BackgroundJobSystem implements JobScheduler {
  private config: BackgroundJobConfig;
  private running = false;
  private intervals = new Map<string, NodeJS.Timeout>();
  private activeJobs = new Set<string>();
  private jobStats = new Map<string, any>();

  constructor(config: Partial<BackgroundJobConfig> = {}) {
    this.config = {
      ...DEFAULT_BACKGROUND_JOB_CONFIG,
      ...config
    };

    console.log(`⚙️ [Jobs] Background job system initialized`);
    console.log(`⚙️ [Jobs] Configuration:`, {
      cache_validation: this.config.cache_validation.enabled ? this.config.cache_validation.schedule : 'disabled',
      cache_warming: this.config.cache_warming.on_startup ? 'on_startup' : 'disabled',
      cross_page_sync: this.config.cross_page_sync.enabled ? this.config.cross_page_sync.schedule : 'disabled'
    });
  }

  /**
   * Start the background job system
   */
  async start(): Promise<void> {
    if (this.running) {
      console.log(`⚙️ [Jobs] System already running`);
      return;
    }

    console.log(`🚀 [Jobs] Starting background job system`);

    try {
      // Initialize job records in database
      await this.initializeJobRecords();

      // Start cache validation job
      if (this.config.cache_validation.enabled) {
        await this.scheduleJob('cache_validation', this.config.cache_validation.schedule, () =>
          this.executeCacheValidationJob()
        );
      }

      // Start cross-page sync job
      if (this.config.cross_page_sync.enabled) {
        await this.scheduleJob('cross_page_sync', this.config.cross_page_sync.schedule, () =>
          this.executeCrossPageSyncJob()
        );
      }

      // Execute startup cache warming if enabled
      if (this.config.cache_warming.on_startup) {
        console.log(`🔥 [Jobs] Executing startup cache warming`);
        await this.executeCacheWarmingJob();
      }

      this.running = true;
      console.log(`✅ [Jobs] Background job system started successfully`);

    } catch (error) {
      console.error(`❌ [Jobs] Failed to start job system:`, error);
      throw error;
    }
  }

  /**
   * Stop the background job system
   */
  async stop(): Promise<void> {
    if (!this.running) {
      console.log(`⚙️ [Jobs] System not running`);
      return;
    }

    console.log(`🛑 [Jobs] Stopping background job system`);

    // Clear all intervals
    for (const [jobName, interval] of this.intervals.entries()) {
      clearInterval(interval);
      console.log(`🛑 [Jobs] Stopped ${jobName} scheduler`);
    }

    this.intervals.clear();

    // Wait for active jobs to complete (with timeout)
    const timeout = 30000; // 30 seconds
    const startWait = Date.now();

    while (this.activeJobs.size > 0 && (Date.now() - startWait) < timeout) {
      console.log(`⏳ [Jobs] Waiting for ${this.activeJobs.size} active jobs to complete...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (this.activeJobs.size > 0) {
      console.warn(`⚠️ [Jobs] ${this.activeJobs.size} jobs still active after timeout`);
    }

    this.running = false;
    console.log(`✅ [Jobs] Background job system stopped`);
  }

  /**
   * Check if job system is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get job status and statistics
   */
  async getJobStatus(jobId: string): Promise<any> {
    if (!isDatabaseAvailable()) {
      return this.jobStats.get(jobId) || { status: 'unknown', message: 'Database unavailable' };
    }

    try {
      const { data, error } = await supabase
        .from('background_jobs')
        .select('*')
        .eq('job_type', jobId)
        .single();

      if (error || !data) {
        return { status: 'not_found', message: `Job ${jobId} not found` };
      }

      return {
        ...data,
        is_active: this.activeJobs.has(jobId),
        next_run_in_ms: data.next_run_at ? new Date(data.next_run_at).getTime() - Date.now() : null
      };

    } catch (error) {
      console.error(`❌ [Jobs] Error getting job status for ${jobId}:`, error);
      return { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Manually trigger a job
   */
  async triggerJob(jobType: string): Promise<JobExecutionResult> {
    console.log(`🔄 [Jobs] Manually triggering ${jobType}`);

    const startTime = Date.now();

    try {
      let result: any;

      switch (jobType) {
        case 'cache_validation':
          result = await this.executeCacheValidationJob();
          break;
        case 'cache_warming':
          result = await this.executeCacheWarmingJob();
          break;
        case 'cross_page_sync':
          result = await this.executeCrossPageSyncJob();
          break;
        default:
          throw new Error(`Unknown job type: ${jobType}`);
      }

      const executionResult: JobExecutionResult = {
        job_id: `manual_${jobType}_${Date.now()}`,
        success: true,
        duration_ms: Date.now() - startTime,
        processed_items: result.processed_items || 0,
        errors: result.errors || [],
        details: result
      };

      console.log(`✅ [Jobs] Manual ${jobType} completed in ${executionResult.duration_ms}ms`);
      return executionResult;

    } catch (error) {
      const executionResult: JobExecutionResult = {
        job_id: `manual_${jobType}_${Date.now()}`,
        success: false,
        duration_ms: Date.now() - startTime,
        processed_items: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };

      console.error(`❌ [Jobs] Manual ${jobType} failed:`, error);
      return executionResult;
    }
  }

  // Job Implementation Methods

  /**
   * Cache Validation Job - Validates cached content every 30 minutes
   */
  private async executeCacheValidationJob(): Promise<any> {
    const jobId = 'cache_validation';
    const startTime = Date.now();

    if (this.activeJobs.has(jobId)) {
      console.log(`⏳ [Jobs] Cache validation already running, skipping`);
      return { skipped: true };
    }

    this.activeJobs.add(jobId);

    try {
      console.log(`🔍 [Jobs] Starting cache validation job`);

      await this.updateJobStatus(jobId, 'running');

      // Execute intelligent cache validation
      await intelligentCache.validateCachedContent();

      // Get validation statistics
      const cacheStats = intelligentCache.getCacheStatistics();

      const result = {
        processed_items: cacheStats.memory_cache_size,
        cache_size: cacheStats.memory_cache_size,
        dependencies_tracked: cacheStats.dependencies_tracked,
        validation_jobs_active: cacheStats.validation_jobs_active,
        duration_ms: Date.now() - startTime
      };

      await this.updateJobSuccess(jobId, result, Date.now() - startTime);

      console.log(`✅ [Jobs] Cache validation completed: ${result.processed_items} entries processed`);
      return result;

    } catch (error) {
      console.error(`❌ [Jobs] Cache validation failed:`, error);
      await this.updateJobFailure(jobId, error);
      throw error;
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * Cache Warming Job - Pre-warms Tier 1 caches
   */
  private async executeCacheWarmingJob(): Promise<any> {
    const jobId = 'cache_warming';
    const startTime = Date.now();

    if (this.activeJobs.has(jobId)) {
      console.log(`⏳ [Jobs] Cache warming already running, skipping`);
      return { skipped: true };
    }

    this.activeJobs.add(jobId);

    try {
      console.log(`🔥 [Jobs] Starting cache warming job`);

      await this.updateJobStatus(jobId, 'running');

      // Execute cache warming
      await intelligentCache.warmupStartupCache();

      // Count warmed items
      const tier1Pages = this.config.cache_warming.tier1_pages;
      let processedItems = 0;

      for (const pageId of tier1Pages) {
        const pageConfig = this.getPageConfig(pageId);
        if (pageConfig) {
          processedItems += pageConfig.target_widgets.length;
        }
      }

      const result = {
        processed_items: processedItems,
        tier1_pages: tier1Pages,
        warm_immediately: this.config.cache_warming.warm_immediately,
        duration_ms: Date.now() - startTime
      };

      await this.updateJobSuccess(jobId, result, Date.now() - startTime);

      console.log(`✅ [Jobs] Cache warming completed: ${result.processed_items} widgets warmed`);
      return result;

    } catch (error) {
      console.error(`❌ [Jobs] Cache warming failed:`, error);
      await this.updateJobFailure(jobId, error);
      throw error;
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * Cross-Page Sync Job - Synchronizes cross-page consistency every 15 minutes
   */
  private async executeCrossPageSyncJob(): Promise<any> {
    const jobId = 'cross_page_sync';
    const startTime = Date.now();

    if (this.activeJobs.has(jobId)) {
      console.log(`⏳ [Jobs] Cross-page sync already running, skipping`);
      return { skipped: true };
    }

    this.activeJobs.add(jobId);

    try {
      console.log(`🔄 [Jobs] Starting cross-page sync job`);

      await this.updateJobStatus(jobId, 'running');

      const syncResults = [];
      const criticalPages = ['strategy-plans', 'optimizely-dxp-tools', 'analytics-insights', 'experience-optimization'];

      // Check cross-page consistency for each page
      for (const pageId of criticalPages) {
        const pageResult = await this.syncPageConsistency(pageId);
        syncResults.push(pageResult);
      }

      const totalSynced = syncResults.reduce((sum, result) => sum + result.synced_items, 0);
      const totalErrors = syncResults.reduce((sum, result) => sum + result.errors.length, 0);

      const result = {
        processed_items: totalSynced,
        pages_processed: criticalPages.length,
        sync_results: syncResults,
        total_errors: totalErrors,
        duration_ms: Date.now() - startTime
      };

      await this.updateJobSuccess(jobId, result, Date.now() - startTime);

      console.log(`✅ [Jobs] Cross-page sync completed: ${result.processed_items} items synced across ${result.pages_processed} pages`);
      return result;

    } catch (error) {
      console.error(`❌ [Jobs] Cross-page sync failed:`, error);
      await this.updateJobFailure(jobId, error);
      throw error;
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * Synchronize consistency for a specific page
   */
  private async syncPageConsistency(pageId: string): Promise<any> {
    try {
      console.log(`🔄 [Jobs] Syncing consistency for ${pageId}`);

      const pageConfig = this.getPageConfig(pageId);
      if (!pageConfig) {
        return { page_id: pageId, synced_items: 0, errors: ['Page configuration not found'] };
      }

      const errors: string[] = [];
      let syncedItems = 0;

      // Check each widget on the page
      for (const widgetId of pageConfig.target_widgets) {
        try {
          // Get system health for this page/widget combination
          const systemHealth = await phase1Pipeline.getSystemHealth();
          const pageStatus = systemHealth.page_statuses[pageId];

          if (pageStatus && pageStatus.status === 'red') {
            // Force refresh cache for failed pages
            await intelligentCache.forceRefresh(pageId, widgetId);
            syncedItems++;
            console.log(`🔄 [Jobs] Refreshed cache for ${pageId}/${widgetId} due to red status`);
          }

        } catch (error) {
          errors.push(`${widgetId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { page_id: pageId, synced_items: syncedItems, errors };

    } catch (error) {
      return {
        page_id: pageId,
        synced_items: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  // Job Management Methods

  private async initializeJobRecords(): Promise<void> {
    if (!isDatabaseAvailable()) {
      console.log(`📝 [Jobs] Database unavailable, job records not initialized`);
      return;
    }

    try {
      const jobs = [
        {
          job_type: 'cache_validation',
          job_name: 'Scheduled Cache Validation',
          schedule_cron: this.config.cache_validation.schedule,
          enabled: this.config.cache_validation.enabled,
          priority: 3,
          job_payload: { validation_type: 'scheduled', target_tiers: this.config.cache_validation.target_tiers },
          target_pages: ['strategy-plans', 'optimizely-dxp-tools', 'analytics-insights', 'experience-optimization']
        },
        {
          job_type: 'cache_warming',
          job_name: 'Cache Warming - Tier 1 Pages',
          enabled: this.config.cache_warming.on_startup,
          priority: 1,
          job_payload: { tier: 1, warm_immediately: this.config.cache_warming.warm_immediately },
          target_pages: this.config.cache_warming.tier1_pages
        },
        {
          job_type: 'cross_page_sync',
          job_name: 'Cross-Page Consistency Sync',
          schedule_cron: this.config.cross_page_sync.schedule,
          enabled: this.config.cross_page_sync.enabled,
          priority: 2,
          job_payload: { sync_type: 'cross_page_consistency', check_dependencies: this.config.cross_page_sync.check_dependencies },
          target_pages: ['strategy-plans', 'optimizely-dxp-tools', 'analytics-insights', 'experience-optimization']
        }
      ];

      for (const job of jobs) {
        await supabase
          .from('background_jobs')
          .upsert(job, { onConflict: 'job_type' });
      }

      console.log(`📝 [Jobs] Initialized ${jobs.length} job records`);

    } catch (error) {
      console.error(`❌ [Jobs] Failed to initialize job records:`, error);
    }
  }

  private async scheduleJob(jobType: string, schedule: string, jobFunction: () => Promise<any>): Promise<void> {
    try {
      // Parse cron schedule (simplified - just handle */N format for minutes)
      const cronMatch = schedule.match(/^\*\/(\d+) \* \* \* \*$/);
      if (!cronMatch) {
        console.error(`❌ [Jobs] Unsupported cron format: ${schedule}`);
        return;
      }

      const intervalMinutes = parseInt(cronMatch[1]);
      const intervalMs = intervalMinutes * 60 * 1000;

      console.log(`⏰ [Jobs] Scheduling ${jobType} every ${intervalMinutes} minutes`);

      const interval = setInterval(async () => {
        try {
          await jobFunction();
        } catch (error) {
          console.error(`❌ [Jobs] Scheduled ${jobType} failed:`, error);
        }
      }, intervalMs);

      this.intervals.set(jobType, interval);

      // Update next run time in database
      await this.updateNextRunTime(jobType, new Date(Date.now() + intervalMs));

    } catch (error) {
      console.error(`❌ [Jobs] Failed to schedule ${jobType}:`, error);
    }
  }

  private async updateJobStatus(jobType: string, status: string): Promise<void> {
    if (!isDatabaseAvailable()) return;

    try {
      await supabase
        .from('background_jobs')
        .update({
          status,
          last_run_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('job_type', jobType);

      this.jobStats.set(jobType, { status, last_run_at: new Date().toISOString() });

    } catch (error) {
      console.error(`❌ [Jobs] Failed to update job status:`, error);
    }
  }

  private async updateJobSuccess(jobType: string, result: any, duration: number): Promise<void> {
    if (!isDatabaseAvailable()) return;

    try {
      await supabase
        .from('background_jobs')
        .update({
          status: 'completed',
          success_count: supabase.sql`success_count + 1`,
          run_count: supabase.sql`run_count + 1`,
          last_duration_ms: duration,
          average_duration_ms: supabase.sql`
            CASE
              WHEN run_count = 0 THEN ${duration}
              ELSE (average_duration_ms * run_count + ${duration}) / (run_count + 1)
            END
          `,
          updated_at: new Date().toISOString()
        })
        .eq('job_type', jobType);

      this.jobStats.set(jobType, { status: 'completed', last_result: result, duration });

    } catch (error) {
      console.error(`❌ [Jobs] Failed to update job success:`, error);
    }
  }

  private async updateJobFailure(jobType: string, error: any): Promise<void> {
    if (!isDatabaseAvailable()) return;

    try {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await supabase
        .from('background_jobs')
        .update({
          status: 'failed',
          failure_count: supabase.sql`failure_count + 1`,
          run_count: supabase.sql`run_count + 1`,
          last_error_message: errorMessage,
          last_error_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('job_type', jobType);

      this.jobStats.set(jobType, { status: 'failed', last_error: errorMessage });

    } catch (error) {
      console.error(`❌ [Jobs] Failed to update job failure:`, error);
    }
  }

  private async updateNextRunTime(jobType: string, nextRun: Date): Promise<void> {
    if (!isDatabaseAvailable()) return;

    try {
      await supabase
        .from('background_jobs')
        .update({
          next_run_at: nextRun.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('job_type', jobType);
    } catch (error) {
      console.error(`❌ [Jobs] Failed to update next run time:`, error);
    }
  }

  // Utility Methods

  private getPageConfig(pageId: string): any {
    const pageConfigs = {
      'strategy-plans': { target_widgets: ['kpi-dashboard', 'roadmap-timeline'] },
      'analytics-insights': { target_widgets: ['analytics-dashboard', 'insights-summary'] },
      'optimizely-dxp-tools': { target_widgets: ['tool-matrix', 'integration-status'] },
      'experience-optimization': { target_widgets: ['optimization-results', 'test-recommendations'] }
    };
    return pageConfigs[pageId];
  }

  /**
   * Get job system statistics
   */
  getJobSystemStatistics(): any {
    return {
      running: this.running,
      active_jobs: Array.from(this.activeJobs),
      scheduled_jobs: Array.from(this.intervals.keys()),
      job_stats: Object.fromEntries(this.jobStats),
      configuration: this.config
    };
  }

  /**
   * Enable/disable a specific job
   */
  async enableJob(jobType: string, enabled: boolean): Promise<void> {
    if (!isDatabaseAvailable()) return;

    try {
      await supabase
        .from('background_jobs')
        .update({
          enabled,
          updated_at: new Date().toISOString()
        })
        .eq('job_type', jobType);

      console.log(`⚙️ [Jobs] ${enabled ? 'Enabled' : 'Disabled'} job: ${jobType}`);

    } catch (error) {
      console.error(`❌ [Jobs] Failed to ${enabled ? 'enable' : 'disable'} job ${jobType}:`, error);
    }
  }
}

// Export singleton instance
export const backgroundJobSystem = new BackgroundJobSystem();

// Auto-start job system (can be controlled via environment variable)
if (process.env.NODE_ENV !== 'test' && process.env.DISABLE_BACKGROUND_JOBS !== 'true') {
  // Start with a small delay to allow other systems to initialize
  setTimeout(async () => {
    try {
      await backgroundJobSystem.start();
    } catch (error) {
      console.error(`❌ [Jobs] Failed to auto-start background job system:`, error);
    }
  }, 5000); // 5 second delay
}