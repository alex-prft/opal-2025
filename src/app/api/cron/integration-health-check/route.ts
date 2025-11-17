import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/database/supabase-client';

/**
 * Vercel Cron Job: Integration Health Check
 * Runs every 6 hours to monitor overall OPAL integration health
 */

export async function GET(request: NextRequest) {
  // Verify this is a cron request
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('🚫 [Health Check] Unauthorized cron request detected');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  
  try {
    console.log('🏥 [Health Check] Starting integration health monitoring');

    const supabase = createSupabaseAdmin();
    
    // Get validation statistics for the last 24 hours
    const { data: recentValidations, error: validationError } = await supabase
      .from('opal_integration_validation')
      .select('overall_status, osa_reception_rate, validated_at')
      .gte('validated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('validated_at', { ascending: false });

    if (validationError) {
      throw new Error(`Failed to fetch validations: ${validationError.message}`);
    }

    // Calculate health metrics
    const totalValidations = recentValidations?.length || 0;
    const greenCount = recentValidations?.filter(v => v.overall_status === 'green').length || 0;
    const yellowCount = recentValidations?.filter(v => v.overall_status === 'yellow').length || 0;
    const redCount = recentValidations?.filter(v => v.overall_status === 'red').length || 0;

    // Calculate average reception rate
    const avgReceptionRate = totalValidations > 0 
      ? recentValidations!.reduce((sum, v) => sum + (v.osa_reception_rate || 0), 0) / totalValidations
      : 0;

    // Get pending Force Sync runs count
    const { count: pendingCount, error: pendingError } = await supabase
      .from('force_sync_runs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .eq('validation_status', 'pending');

    if (pendingError) {
      console.warn('⚠️ [Health Check] Could not fetch pending count:', pendingError.message);
    }

    // Determine overall health status
    let overallHealth: 'healthy' | 'degraded' | 'unhealthy';
    let healthScore: number;

    if (totalValidations === 0) {
      overallHealth = 'healthy'; // No data is considered healthy
      healthScore = 100;
    } else {
      const healthPercentage = (greenCount / totalValidations) * 100;
      const degradedPercentage = (yellowCount / totalValidations) * 100;
      
      if (healthPercentage >= 80) {
        overallHealth = 'healthy';
        healthScore = Math.round(85 + (healthPercentage - 80) * 0.75); // 85-100 range
      } else if (healthPercentage >= 50 || degradedPercentage >= 30) {
        overallHealth = 'degraded';
        healthScore = Math.round(50 + healthPercentage * 0.7); // 50-84 range
      } else {
        overallHealth = 'unhealthy';
        healthScore = Math.round(Math.max(10, healthPercentage * 0.8)); // 10-49 range
      }
    }

    const healthReport = {
      timestamp: new Date().toISOString(),
      overallHealth,
      healthScore,
      metrics: {
        totalValidations,
        statusDistribution: {
          green: greenCount,
          yellow: yellowCount,
          red: redCount
        },
        averageReceptionRate: Math.round(avgReceptionRate * 100) / 100,
        pendingValidations: pendingCount || 0
      },
      recommendations: generateHealthRecommendations(overallHealth, {
        avgReceptionRate,
        redCount,
        pendingCount: pendingCount || 0,
        totalValidations
      }),
      duration: Date.now() - startTime
    };

    // Log health status
    const statusEmoji = overallHealth === 'healthy' ? '✅' : overallHealth === 'degraded' ? '⚠️' : '❌';
    console.log(`${statusEmoji} [Health Check] Integration health: ${overallHealth.toUpperCase()} (${healthScore}/100)`);
    console.log(`   Validations (24h): ${totalValidations} total, ${greenCount} green, ${yellowCount} yellow, ${redCount} red`);
    console.log(`   Pending validations: ${pendingCount || 0}`);
    console.log(`   Average reception rate: ${(avgReceptionRate * 100).toFixed(1)}%`);

    // Store health report (optional - could be stored in a separate table)
    try {
      await supabase
        .from('integration_health_reports')
        .insert({
          overall_health: overallHealth,
          health_score: healthScore,
          total_validations: totalValidations,
          green_count: greenCount,
          yellow_count: yellowCount,
          red_count: redCount,
          avg_reception_rate: avgReceptionRate,
          pending_count: pendingCount || 0,
          report_data: healthReport,
          created_at: new Date().toISOString()
        });
    } catch (insertError) {
      // Don't fail the health check if we can't store the report
      console.warn('⚠️ [Health Check] Could not store health report:', insertError);
    }

    return NextResponse.json(healthReport);

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('❌ [Health Check] Health monitoring failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Health check failed',
      overallHealth: 'unhealthy',
      healthScore: 0,
      duration,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function generateHealthRecommendations(
  overallHealth: string, 
  metrics: { avgReceptionRate: number; redCount: number; pendingCount: number; totalValidations: number }
): string[] {
  const recommendations: string[] = [];

  if (overallHealth === 'unhealthy') {
    recommendations.push('🚨 Critical: Immediate investigation required for OPAL integration failures');
    
    if (metrics.avgReceptionRate < 0.5) {
      recommendations.push('📉 OSA reception rate is critically low - check webhook delivery and processing');
    }
    
    if (metrics.redCount > 0) {
      recommendations.push(`🔴 ${metrics.redCount} critical validation failures detected - review error logs`);
    }
  }

  if (overallHealth === 'degraded') {
    recommendations.push('⚠️ Integration performance is degraded - monitor closely');
    
    if (metrics.avgReceptionRate < 0.8) {
      recommendations.push('📊 OSA reception rate below optimal - investigate agent performance');
    }
  }

  if (metrics.pendingCount > 10) {
    recommendations.push(`⏳ High number of pending validations (${metrics.pendingCount}) - consider increasing validation frequency`);
  }

  if (metrics.totalValidations === 0) {
    recommendations.push('💡 No recent validation data - ensure Force Sync workflows are running');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ OPAL integration is operating normally');
  }

  return recommendations;
}

/**
 * POST endpoint for manual health check trigger
 */
export async function POST() {
  return GET(new NextRequest('http://localhost/api/cron/integration-health-check', {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` }
  }));
}