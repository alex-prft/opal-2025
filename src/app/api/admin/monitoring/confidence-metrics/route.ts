/**
 * Admin API: Confidence Metrics
 *
 * Returns overall confidence score metrics for monitoring dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy initialization of Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: NextRequest) {
  try {
    console.log('[Admin API] Fetching confidence metrics...');

    // Get Supabase client with error handling
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (configError) {
      console.warn('[Admin API] Supabase configuration not available, returning fallback metrics');
      // Return fallback metrics when Supabase is not configured
      return NextResponse.json({
        overall_health: 'warning' as const,
        average_confidence: 0.75,
        agents_below_threshold: 0,
        fallback_usage_rate: 0,
        total_requests: 0,
        fallback_count: 0,
        last_updated: new Date().toISOString(),
        note: 'Using fallback metrics - Supabase not configured'
      });
    }

    // Fetch recent confidence scores
    const { data: confidenceScores, error: confidenceError } = await supabase
      .from('opal_confidence_scores')
      .select('*')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('timestamp', { ascending: false });

    if (confidenceError) {
      console.error('[Admin API] Error fetching confidence scores:', confidenceError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Fetch fallback usage
    const { data: fallbackUsage, error: fallbackError } = await supabase
      .from('opal_fallback_usage')
      .select('*')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (fallbackError) {
      console.warn('[Admin API] Error fetching fallback usage:', fallbackError);
    }

    // Calculate metrics
    const totalRequests = confidenceScores?.length || 0;
    const fallbackCount = fallbackUsage?.length || 0;

    let averageConfidence = 0.75; // Default
    let agentsBelowThreshold = 0;

    if (confidenceScores && confidenceScores.length > 0) {
      // Calculate average confidence
      const validScores = confidenceScores
        .map(score => score.confidence_score)
        .filter(score => typeof score === 'number' && !isNaN(score));

      if (validScores.length > 0) {
        averageConfidence = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
      }

      // Count agents below threshold (0.6)
      agentsBelowThreshold = validScores.filter(score => score < 0.6).length;
    }

    // Calculate fallback usage rate
    const fallbackUsageRate = totalRequests > 0 ? fallbackCount / totalRequests : 0;

    // Determine overall health
    let overallHealth: 'healthy' | 'warning' | 'critical';
    if (averageConfidence >= 0.8 && fallbackUsageRate <= 0.1) {
      overallHealth = 'healthy';
    } else if (averageConfidence >= 0.6 && fallbackUsageRate <= 0.3) {
      overallHealth = 'warning';
    } else {
      overallHealth = 'critical';
    }

    const metrics = {
      overall_health: overallHealth,
      average_confidence: averageConfidence,
      agents_below_threshold: agentsBelowThreshold,
      fallback_usage_rate: fallbackUsageRate,
      total_requests: totalRequests,
      fallback_count: fallbackCount,
      last_updated: new Date().toISOString()
    };

    console.log('[Admin API] Confidence metrics calculated:', {
      avgConfidence: averageConfidence.toFixed(3),
      belowThreshold: agentsBelowThreshold,
      fallbackRate: (fallbackUsageRate * 100).toFixed(1) + '%',
      health: overallHealth
    });

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('[Admin API] Error in confidence-metrics endpoint:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}