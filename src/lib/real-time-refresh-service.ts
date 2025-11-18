/**
 * Real-Time Data Refresh Service
 * Content Population Roadmap - Phase 1: Real-time data updates
 *
 * Implements:
 * - Real-time data refresh within 60 seconds of source changes
 * - Intelligent freshness detection with tier-specific refresh intervals
 * - Automatic cache invalidation and background updates
 * - Performance monitoring and optimization
 * - WebSocket/SSE integration for live updates
 */

import { opalProductionClient } from './opal-production-client';
import { opalAgentManager } from './opal-agent-config';

// Refresh Configuration Types
interface RefreshConfig {
  tier1_interval: number;  // 300s (5 minutes)
  tier2_interval: number;  // 120s (2 minutes)
  tier3_interval: number;  // 60s (1 minute)
  realtime_interval: number; // 30s (30 seconds)
  background_refresh: boolean;
  max_concurrent_refreshes: number;
}

interface PagePriority {
  path: string;
  priority: 'high' | 'medium' | 'low';
  refresh_interval: number;
  last_accessed: string;
  access_count: number;
}

interface RefreshStats {
  total_refreshes: number;
  successful_refreshes: number;
  failed_refreshes: number;
  avg_refresh_time: number;
  cache_hit_rate: number;
  last_refresh_time: string;
}

/**
 * Real-Time Data Refresh Manager
 */
export class RealTimeRefreshService {
  private config: RefreshConfig;
  private refreshStats: RefreshStats;
  private activeRefreshes = new Map<string, Promise<void>>();
  private refreshQueue: string[] = [];
  private isProcessingQueue = false;

  // Page priority tracking
  private pagePriorities = new Map<string, PagePriority>();
  private highTrafficPages = new Set<string>();

  // Event listeners for real-time updates
  private eventSource: EventSource | null = null;
  private websocket: WebSocket | null = null;

  constructor(config?: Partial<RefreshConfig>) {
    this.config = {
      tier1_interval: 300,    // 5 minutes
      tier2_interval: 120,    // 2 minutes
      tier3_interval: 60,     // 1 minute
      realtime_interval: 30,  // 30 seconds
      background_refresh: true,
      max_concurrent_refreshes: 5,
      ...config
    };

    this.refreshStats = {
      total_refreshes: 0,
      successful_refreshes: 0,
      failed_refreshes: 0,
      avg_refresh_time: 0,
      cache_hit_rate: 0,
      last_refresh_time: new Date().toISOString()
    };

    this.initializeHighTrafficPages();
    this.startBackgroundRefresh();
    this.setupRealTimeUpdates();
  }

  /**
   * Initialize high-traffic pages based on Content Population Roadmap
   */
  private initializeHighTrafficPages(): void {
    // Strategy Plans - High Priority Pages
    this.addHighTrafficPage('/engine/results/strategy-plans', 'high', this.config.tier1_interval);
    this.addHighTrafficPage('/engine/results/strategy-plans/phases', 'high', this.config.tier2_interval);
    this.addHighTrafficPage('/engine/results/strategy-plans/phases/phase-1', 'high', this.config.tier3_interval);

    // DXP Tools - High Priority Pages
    this.addHighTrafficPage('/engine/results/optimizely-dxp-tools', 'high', this.config.tier1_interval);
    this.addHighTrafficPage('/engine/results/optimizely-dxp-tools/webx', 'high', this.config.tier2_interval);
    this.addHighTrafficPage('/engine/results/optimizely-dxp-tools/webx/active-experiments', 'high', this.config.realtime_interval);

    // Analytics Insights - Medium Priority
    this.addHighTrafficPage('/engine/results/analytics-insights', 'medium', this.config.tier1_interval);
    this.addHighTrafficPage('/engine/results/analytics-insights/content', 'medium', this.config.tier2_interval);
    this.addHighTrafficPage('/engine/results/analytics-insights/content/engagement', 'medium', this.config.tier3_interval);

    // Experience Optimization - High Priority
    this.addHighTrafficPage('/engine/results/experience-optimization', 'high', this.config.tier1_interval);
    this.addHighTrafficPage('/engine/results/experience-optimization/personalization', 'high', this.config.tier2_interval);
    this.addHighTrafficPage('/engine/results/experience-optimization/personalization/audience-segmentation', 'medium', this.config.tier3_interval);

    console.log(`Initialized ${this.highTrafficPages.size} high-traffic pages for real-time refresh`);
  }

  private addHighTrafficPage(path: string, priority: 'high' | 'medium' | 'low', interval: number): void {
    this.highTrafficPages.add(path);
    this.pagePriorities.set(path, {
      path,
      priority,
      refresh_interval: interval,
      last_accessed: new Date().toISOString(),
      access_count: 0
    });
  }

  /**
   * Track page access to dynamically adjust priorities
   */
  trackPageAccess(path: string): void {
    const existing = this.pagePriorities.get(path);
    if (existing) {
      existing.access_count++;
      existing.last_accessed = new Date().toISOString();

      // Promote to high traffic if accessed frequently
      if (existing.access_count >= 10 && existing.priority !== 'high') {
        existing.priority = 'high';
        existing.refresh_interval = Math.min(existing.refresh_interval, this.config.tier3_interval);
        this.highTrafficPages.add(path);
        console.log(`Promoted ${path} to high-traffic due to frequent access`);
      }
    } else {
      // Track new page
      this.pagePriorities.set(path, {
        path,
        priority: 'low',
        refresh_interval: this.config.tier1_interval,
        last_accessed: new Date().toISOString(),
        access_count: 1
      });
    }
  }

  /**
   * Refresh data for a specific page or section
   */
  async refreshPage(path: string, force = false): Promise<void> {
    const startTime = Date.now();

    try {
      // Check if already refreshing
      if (this.activeRefreshes.has(path) && !force) {
        console.log(`Refresh already in progress for ${path}, waiting...`);
        await this.activeRefreshes.get(path);
        return;
      }

      // Start refresh
      const refreshPromise = this.performRefresh(path, force);
      this.activeRefreshes.set(path, refreshPromise);

      await refreshPromise;

      // Update stats
      this.refreshStats.successful_refreshes++;
      const refreshTime = Date.now() - startTime;
      this.updateAverageRefreshTime(refreshTime);

      console.log(`Successfully refreshed ${path} in ${refreshTime}ms`);

    } catch (error) {
      console.error(`Failed to refresh ${path}:`, error);
      this.refreshStats.failed_refreshes++;
    } finally {
      this.activeRefreshes.delete(path);
      this.refreshStats.total_refreshes++;
      this.refreshStats.last_refresh_time = new Date().toISOString();
    }
  }

  /**
   * Perform the actual data refresh
   */
  private async performRefresh(path: string, force: boolean): Promise<void> {
    const pathSegments = path.split('/').filter(Boolean);

    if (pathSegments.length < 3) {
      throw new Error(`Invalid path format: ${path}`);
    }

    // Extract tier information from path
    const tier1 = pathSegments[2]; // e.g., 'strategy-plans'
    const tier2 = pathSegments[3]; // e.g., 'phases'
    const tier3 = pathSegments[4]; // e.g., 'phase-1-foundation-0-3-months'

    console.log(`Refreshing data for ${tier1}${tier2 ? `/${tier2}` : ''}${tier3 ? `/${tier3}` : ''}`);

    // Determine refresh level based on path depth
    if (tier3) {
      // Tier-3: Refresh detailed page content
      await Promise.all([
        opalProductionClient.refreshData(tier1, tier2, tier3),
        this.refreshAgentData(tier1, tier2, tier3)
      ]);
    } else if (tier2) {
      // Tier-2: Refresh section KPIs
      await Promise.all([
        opalProductionClient.refreshData(tier1, tier2),
        this.refreshAgentData(tier1, tier2)
      ]);
    } else {
      // Tier-1: Refresh summary metrics
      await Promise.all([
        opalProductionClient.refreshData(tier1),
        this.refreshAgentData(tier1)
      ]);
    }

    // Trigger cache invalidation
    await this.invalidatePageCache(path);
  }

  /**
   * Refresh OPAL agent data for specific section
   */
  private async refreshAgentData(tier1: string, tier2?: string, tier3?: string): Promise<void> {
    try {
      const agents = opalAgentManager.getAgentsForSection(tier1);

      if (agents.length === 0) {
        return;
      }

      // Execute relevant agents for data refresh
      const agentExecutions = agents.slice(0, 2).map(agent => ({
        agentName: agent.agent_name,
        params: {
          analysis_type: 'refresh',
          time_range: 'recent',
          output_format: 'json' as const
        }
      }));

      const results = await opalAgentManager.executeMultipleAgents(agentExecutions);

      console.log(`Refreshed agent data for ${tier1}: ${results.filter(r => r.status === 'success').length}/${results.length} successful`);

    } catch (error) {
      console.error(`Failed to refresh agent data for ${tier1}:`, error);
    }
  }

  /**
   * Invalidate cache for specific page
   */
  private async invalidatePageCache(path: string): Promise<void> {
    try {
      // This would integrate with your caching layer (Redis, etc.)
      // For now, we'll simulate cache invalidation

      const cacheKeys = this.generateCacheKeys(path);
      console.log(`Invalidating cache keys: ${cacheKeys.join(', ')}`);

      // In production, this would call Redis CACHE.DEL or similar
      // await redis.del(cacheKeys);

    } catch (error) {
      console.error(`Failed to invalidate cache for ${path}:`, error);
    }
  }

  private generateCacheKeys(path: string): string[] {
    const pathSegments = path.split('/').filter(Boolean);
    const keys: string[] = [];

    if (pathSegments.length >= 3) {
      const tier1 = pathSegments[2];
      keys.push(`tier1_${tier1}`);

      if (pathSegments.length >= 4) {
        const tier2 = pathSegments[3];
        keys.push(`tier2_${tier1}_${tier2}`);

        if (pathSegments.length >= 5) {
          const tier3 = pathSegments[4];
          keys.push(`tier3_${tier1}_${tier2}_${tier3}`);
        }
      }
    }

    return keys;
  }

  /**
   * Start background refresh for high-traffic pages
   */
  private startBackgroundRefresh(): void {
    if (!this.config.background_refresh) {
      return;
    }

    // Refresh high-traffic pages on their intervals
    setInterval(() => {
      this.processRefreshQueue();
    }, 30000); // Check every 30 seconds

    // Add high-traffic pages to refresh queue
    setInterval(() => {
      this.queueHighTrafficPages();
    }, 60000); // Queue pages every minute

    console.log('Started background refresh service');
  }

  private queueHighTrafficPages(): void {
    const now = Date.now();

    for (const [path, priority] of this.pagePriorities.entries()) {
      if (priority.priority === 'high') {
        const lastRefresh = new Date(priority.last_accessed).getTime();
        const timeSinceRefresh = now - lastRefresh;

        if (timeSinceRefresh >= priority.refresh_interval * 1000) {
          this.addToQueue(path);
        }
      }
    }
  }

  private addToQueue(path: string): void {
    if (!this.refreshQueue.includes(path)) {
      this.refreshQueue.push(path);
      console.log(`Added ${path} to refresh queue`);
    }
  }

  private async processRefreshQueue(): Promise<void> {
    if (this.isProcessingQueue || this.refreshQueue.length === 0) {
      return;
    }

    if (this.activeRefreshes.size >= this.config.max_concurrent_refreshes) {
      console.log('Maximum concurrent refreshes reached, waiting...');
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Process up to max concurrent refreshes
      const batchSize = Math.min(
        this.config.max_concurrent_refreshes - this.activeRefreshes.size,
        this.refreshQueue.length
      );

      const batch = this.refreshQueue.splice(0, batchSize);

      const refreshPromises = batch.map(path =>
        this.refreshPage(path).catch(error =>
          console.error(`Background refresh failed for ${path}:`, error)
        )
      );

      await Promise.allSettled(refreshPromises);

    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Set up real-time updates via WebSocket/SSE
   */
  private setupRealTimeUpdates(): void {
    // Server-Sent Events for real-time updates
    if (typeof window !== 'undefined') {
      try {
        this.eventSource = new EventSource('/api/stream/agent-updates');

        this.eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'data_update') {
            console.log('Received real-time update:', data);
            this.handleRealTimeUpdate(data);
          }
        };

        this.eventSource.onerror = (error) => {
          console.error('EventSource error:', error);
        };

        console.log('Connected to real-time update stream');

      } catch (error) {
        console.error('Failed to setup real-time updates:', error);
      }
    }
  }

  private handleRealTimeUpdate(updateData: any): void {
    const { path, tier1, tier2, tier3 } = updateData;

    if (path && this.highTrafficPages.has(path)) {
      console.log(`Real-time update received for high-traffic page: ${path}`);
      this.addToQueue(path);
    }
  }

  /**
   * Update average refresh time with exponential moving average
   */
  private updateAverageRefreshTime(newTime: number): void {
    const alpha = 0.1; // Smoothing factor
    this.refreshStats.avg_refresh_time =
      this.refreshStats.avg_refresh_time * (1 - alpha) + newTime * alpha;
  }

  /**
   * Get refresh statistics
   */
  getRefreshStats(): RefreshStats & {
    active_refreshes: number;
    queue_length: number;
    high_traffic_pages: number;
  } {
    return {
      ...this.refreshStats,
      active_refreshes: this.activeRefreshes.size,
      queue_length: this.refreshQueue.length,
      high_traffic_pages: this.highTrafficPages.size
    };
  }

  /**
   * Force refresh all high-traffic pages
   */
  async refreshAllHighTrafficPages(): Promise<void> {
    console.log(`Force refreshing ${this.highTrafficPages.size} high-traffic pages`);

    const refreshPromises = Array.from(this.highTrafficPages).map(path =>
      this.refreshPage(path, true).catch(error =>
        console.error(`Failed to refresh ${path}:`, error)
      )
    );

    await Promise.allSettled(refreshPromises);
    console.log('Completed force refresh of all high-traffic pages');
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.eventSource) {
      this.eventSource.close();
    }
    if (this.websocket) {
      this.websocket.close();
    }

    // Clear all intervals
    // (In a real implementation, you'd track interval IDs)

    console.log('Real-time refresh service destroyed');
  }
}

// Singleton instance for application use
export const realTimeRefreshService = new RealTimeRefreshService();

// React hook for component integration
export function useRealTimeRefresh(path: string) {
  const refreshPage = async (force = false) => {
    realTimeRefreshService.trackPageAccess(path);
    return realTimeRefreshService.refreshPage(path, force);
  };

  const getStats = () => realTimeRefreshService.getRefreshStats();

  return {
    refreshPage,
    getStats
  };
}

// Export types
export type { RefreshConfig, PagePriority, RefreshStats };