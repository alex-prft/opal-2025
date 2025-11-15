// Phase 2: Intelligent Cache Management API
// Controls tiered caching, cross-page invalidation, and cache warming

import { NextRequest, NextResponse } from 'next/server';
import { intelligentCache } from '@/lib/cache/intelligent-cache-system';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const pageId = searchParams.get('pageId');
    const widgetId = searchParams.get('widgetId');

    switch (action) {
      case 'stats':
        // Get cache statistics
        const stats = intelligentCache.getCacheStatistics();
        return NextResponse.json({
          success: true,
          cache_statistics: stats,
          endpoint_info: {
            description: 'Intelligent cache system statistics',
            tiers: {
              tier1: '5min TTL, 15min validation (High priority)',
              tier2: '10min TTL, 30min validation (Medium priority)',
              tier3: '15min TTL, 45min validation (Standard)'
            }
          }
        });

      case 'get':
        // Get specific cache entry
        if (!pageId || !widgetId) {
          return NextResponse.json({
            success: false,
            error: 'pageId and widgetId are required for cache lookup'
          }, { status: 400 });
        }

        const cacheResult = await intelligentCache.getContent(pageId, widgetId);
        return NextResponse.json({
          success: true,
          cache_result: cacheResult,
          cache_key: `cache:${pageId}:${widgetId}`
        });

      default:
        return NextResponse.json({
          endpoint: 'Phase 2 Intelligent Cache Management',
          description: 'Manage tiered caching with cross-page invalidation',
          version: '2.0.0',
          actions: {
            'GET ?action=stats': 'Get cache system statistics',
            'GET ?action=get&pageId=X&widgetId=Y': 'Get specific cache entry',
            'POST action=warm': 'Trigger cache warming',
            'POST action=invalidate': 'Invalidate cache entries',
            'POST action=refresh': 'Force refresh specific cache',
            'DELETE': 'Clear all cache (maintenance mode)'
          },
          cache_tiers: {
            tier1: {
              ttl: '5 minutes',
              validation_frequency: '15 minutes',
              pages: ['strategy-plans', 'analytics-insights']
            },
            tier2: {
              ttl: '10 minutes',
              validation_frequency: '30 minutes',
              pages: ['optimizely-dxp-tools', 'experience-optimization']
            },
            tier3: {
              ttl: '15 minutes',
              validation_frequency: '45 minutes',
              pages: ['other pages']
            }
          }
        });
    }
  } catch (error) {
    console.error('❌ [Cache API] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown cache API error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, pageId, widgetId, reason } = body;

    switch (action) {
      case 'warm':
        // Trigger cache warming
        console.log('🔥 [Cache API] Triggering cache warming');
        await intelligentCache.warmupStartupCache();

        return NextResponse.json({
          success: true,
          message: 'Cache warming completed',
          action: 'cache_warming_triggered'
        });

      case 'invalidate':
        // Invalidate specific cache entries or cross-page invalidation
        if (!pageId || !widgetId) {
          return NextResponse.json({
            success: false,
            error: 'pageId and widgetId are required for cache invalidation'
          }, { status: 400 });
        }

        await intelligentCache.invalidateRelatedContent(
          pageId,
          widgetId,
          reason || 'manual_api_invalidation'
        );

        return NextResponse.json({
          success: true,
          message: `Cache invalidated for ${pageId}/${widgetId} and related content`,
          action: 'cache_invalidated',
          reason: reason || 'manual_api_invalidation'
        });

      case 'refresh':
        // Force refresh specific cache entry
        if (!pageId || !widgetId) {
          return NextResponse.json({
            success: false,
            error: 'pageId and widgetId are required for cache refresh'
          }, { status: 400 });
        }

        await intelligentCache.forceRefresh(pageId, widgetId);

        return NextResponse.json({
          success: true,
          message: `Cache force refreshed for ${pageId}/${widgetId}`,
          action: 'cache_force_refreshed'
        });

      case 'validate':
        // Trigger background validation
        console.log('🔍 [Cache API] Triggering background validation');
        await intelligentCache.validateCachedContent();

        return NextResponse.json({
          success: true,
          message: 'Background cache validation completed',
          action: 'cache_validation_triggered'
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
          available_actions: ['warm', 'invalidate', 'refresh', 'validate']
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Cache API] POST error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown cache operation error'
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    console.log('🗑️ [Cache API] Clearing all cache (maintenance mode)');

    // Clear all cache - maintenance operation
    await intelligentCache.clearAllCache();

    return NextResponse.json({
      success: true,
      message: 'All cache cleared - system ready for fresh content generation',
      action: 'cache_cleared_all',
      warning: 'This is a maintenance operation - cache will be rebuilt on next requests'
    });

  } catch (error) {
    console.error('❌ [Cache API] DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear cache'
    }, { status: 500 });
  }
}