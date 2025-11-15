/**
 * Admin API: Fallback Statistics
 *
 * Returns fallback usage statistics for monitoring dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    console.log('[Admin API] Fetching fallback statistics...');

    // Fetch fallback usage from the last 7 days
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('opal_fallback_usage')
      .select('*')
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false });

    if (fallbackError) {
      console.error('[Admin API] Error fetching fallback data:', fallbackError);
      // Return empty data if database error
      return NextResponse.json({
        fallbacks: [],
        total_fallbacks: 0,
        unique_pages: 0,
        last_updated: new Date().toISOString()
      });
    }

    // Group fallbacks by page_id and agent_name
    const fallbackGroups = new Map<string, {
      page_id: string;
      agent_name: string;
      fallback_count: number;
      last_fallback: string;
      reasons: string[];
      latest_reason: string;
    }>();

    if (fallbackData && fallbackData.length > 0) {
      fallbackData.forEach(fallback => {
        const key = `${fallback.page_id}-${fallback.agent_name}`;

        if (fallbackGroups.has(key)) {
          const existing = fallbackGroups.get(key)!;
          existing.fallback_count += 1;
          existing.reasons.push(fallback.reason || 'Unknown');

          // Update if this is more recent
          if (new Date(fallback.timestamp) > new Date(existing.last_fallback)) {
            existing.last_fallback = fallback.timestamp;
            existing.latest_reason = fallback.reason || 'Unknown';
          }
        } else {
          fallbackGroups.set(key, {
            page_id: fallback.page_id,
            agent_name: fallback.agent_name,
            fallback_count: 1,
            last_fallback: fallback.timestamp,
            reasons: [fallback.reason || 'Unknown'],
            latest_reason: fallback.reason || 'Unknown'
          });
        }
      });
    }

    // Convert to array and sort by fallback count (descending)
    const fallbackStats = Array.from(fallbackGroups.values())
      .map(group => ({
        page_id: group.page_id,
        agent_name: group.agent_name,
        fallback_count: group.fallback_count,
        last_fallback: group.last_fallback,
        reason: group.latest_reason,
        all_reasons: [...new Set(group.reasons)] // Unique reasons
      }))
      .sort((a, b) => b.fallback_count - a.fallback_count);

    // Calculate summary statistics
    const totalFallbacks = fallbackData?.length || 0;
    const uniquePages = new Set(fallbackStats.map(f => f.page_id)).size;

    // Get top reasons for fallbacks
    const allReasons = fallbackData?.map(f => f.reason || 'Unknown') || [];
    const reasonCounts = new Map<string, number>();
    allReasons.forEach(reason => {
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    });

    const topReasons = Array.from(reasonCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }));

    console.log('[Admin API] Fallback statistics calculated:', {
      totalFallbacks,
      uniquePages,
      topFallbacks: fallbackStats.slice(0, 3).map(f => ({
        page: f.page_id,
        agent: f.agent_name,
        count: f.fallback_count
      }))
    });

    return NextResponse.json({
      fallbacks: fallbackStats,
      total_fallbacks: totalFallbacks,
      unique_pages: uniquePages,
      top_reasons: topReasons,
      time_range: '7 days',
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Admin API] Error in fallback-stats endpoint:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}