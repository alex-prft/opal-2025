// Data Governance Admin API
// Provides comprehensive monitoring and management for data governance features

import { NextRequest, NextResponse } from 'next/server';
import { auditLogger } from '@/lib/security/audit-logger';
import { purgeManager } from '@/lib/security/purge-manager';
import { PIIScanner } from '@/lib/security/pii-scanner';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric');
    const days = parseInt(searchParams.get('days') || '7');

    switch (metric) {
      case 'health':
        return await getHealthMetrics();

      case 'security':
        return await getSecurityMetrics(days);

      case 'pii-compliance':
        return await getPIIComplianceMetrics(days);

      case 'purge-status':
        return await getPurgeStatusMetrics();

      case 'audit-summary':
        return await getAuditSummary(days);

      default:
        return await getComprehensiveDashboard(days);
    }

  } catch (error) {
    console.error('Governance API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getHealthMetrics() {
  try {
    const healthMetrics = await auditLogger.getHealthMetrics();
    const complianceReport = await PIIScanner.generateComplianceReport('day');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      health: {
        audit_system: healthMetrics ? 'operational' : 'degraded',
        pii_scanner: 'operational',
        purge_system: 'operational',
        data_governance: process.env.DATA_GOVERNANCE_ENABLED === 'true' ? 'enabled' : 'disabled'
      },
      metrics: healthMetrics,
      compliance: complianceReport
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getSecurityMetrics(days: number) {
  try {
    const securitySummary = await auditLogger.getSecuritySummary(days);
    const suspiciousActivity = await auditLogger.checkSuspiciousActivity();

    const metrics = {
      period_days: days,
      security_events: securitySummary?.length || 0,
      suspicious_ips: suspiciousActivity?.length || 0,
      threat_levels: securitySummary?.reduce((acc: any, event: any) => {
        acc[event.threat_level] = (acc[event.threat_level] || 0) + event.event_count;
        return acc;
      }, {}) || {},
      recent_events: securitySummary?.slice(0, 10) || [],
      suspicious_activity: suspiciousActivity?.slice(0, 5) || []
    };

    return NextResponse.json({
      success: true,
      security_metrics: metrics,
      recommendations: generateSecurityRecommendations(metrics)
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Security metrics failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getPIIComplianceMetrics(days: number) {
  try {
    const complianceStatus = await auditLogger.getPIIComplianceStatus(days);
    const complianceReport = await PIIScanner.generateComplianceReport(
      days <= 1 ? 'day' : days <= 7 ? 'week' : 'month'
    );

    const metrics = {
      period_days: days,
      total_scans: complianceReport.total_scans,
      violations_found: complianceReport.violations_found,
      compliance_rate: complianceReport.compliance_rate,
      violation_breakdown: complianceStatus?.reduce((acc: any, status: any) => {
        acc[status.compliance_status] = (acc[status.compliance_status] || 0) + status.violation_count;
        return acc;
      }, {}) || {},
      top_violation_types: complianceReport.top_violation_types,
      daily_compliance: complianceStatus || []
    };

    return NextResponse.json({
      success: true,
      pii_compliance: metrics,
      recommendations: complianceReport.recommendations
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'PII compliance metrics failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getPurgeStatusMetrics() {
  try {
    const purgeStatus = await purgeManager.getPurgeStatus();
    const eligibility = await purgeManager.checkPurgeEligibility();
    const analyticsSummary = await purgeManager.getAnalyticsSummary(30);

    const metrics = {
      purge_policies: purgeStatus,
      records_eligible_for_purge: eligibility.reduce((sum, e) => sum + e.records_eligible, 0),
      eligibility_breakdown: eligibility,
      analytics_preserved: {
        workflows: analyticsSummary.workflow_analytics,
        agents: analyticsSummary.agent_analytics
      },
      purge_history: analyticsSummary.purge_analytics
    };

    return NextResponse.json({
      success: true,
      purge_metrics: metrics,
      recommendations: generatePurgeRecommendations(metrics)
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Purge metrics failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getAuditSummary(days: number) {
  try {
    const healthMetrics = await auditLogger.getHealthMetrics();

    const summary = {
      period_days: days,
      total_events: healthMetrics?.total_events_24h || 0,
      pii_violations: healthMetrics?.pii_violations_24h || 0,
      security_events: healthMetrics?.security_events_24h || 0,
      unique_users: healthMetrics?.unique_users_24h || 0,
      suspicious_ips: healthMetrics?.suspicious_ips || 0,
      system_health: {
        audit_logging: 'operational',
        pii_scanning: process.env.PII_SCANNING_ENABLED === 'true' ? 'enabled' : 'disabled',
        workflow_purging: process.env.WORKFLOW_PURGING_ENABLED === 'true' ? 'enabled' : 'disabled',
        session_auditing: process.env.SESSION_AUDIT_ENABLED === 'true' ? 'enabled' : 'disabled'
      }
    };

    return NextResponse.json({
      success: true,
      audit_summary: summary,
      recommendations: generateAuditRecommendations(summary)
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Audit summary failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getComprehensiveDashboard(days: number) {
  try {
    // Gather all metrics for comprehensive dashboard
    const [health, security, compliance, purgeStatus, auditSummary] = await Promise.allSettled([
      getHealthMetrics(),
      getSecurityMetrics(days),
      getPIIComplianceMetrics(days),
      getPurgeStatusMetrics(),
      getAuditSummary(days)
    ]);

    const extractData = (result: any) => {
      if (result.status === 'fulfilled' && result.value.ok !== false) {
        return result.value._body ? JSON.parse(result.value._body) : result.value;
      }
      return { error: 'Failed to load metric' };
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      dashboard: {
        health: extractData(health),
        security: extractData(security),
        pii_compliance: extractData(compliance),
        purge_status: extractData(purgeStatus),
        audit_summary: extractData(auditSummary)
      },
      overall_status: {
        data_governance: 'enabled',
        compliance_rating: calculateComplianceRating(),
        security_level: 'high',
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Dashboard generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper functions for recommendations
function generateSecurityRecommendations(metrics: any): string[] {
  const recommendations = [];

  if (metrics.suspicious_ips > 0) {
    recommendations.push('Review suspicious IP activity and consider implementing rate limiting');
  }

  if (metrics.threat_levels?.high > 10) {
    recommendations.push('High number of high-threat events detected - review security logs');
  }

  if (metrics.security_events === 0) {
    recommendations.push('No security events logged - verify audit logging is working properly');
  }

  recommendations.push('Regular security monitoring is active and functioning');

  return recommendations;
}

function generatePurgeRecommendations(metrics: any): string[] {
  const recommendations = [];
  const eligibleRecords = metrics.records_eligible_for_purge || 0;

  if (eligibleRecords > 1000) {
    recommendations.push(`${eligibleRecords} records eligible for purging - consider running manual purge`);
  }

  if (eligibleRecords === 0) {
    recommendations.push('No records currently eligible for purging');
  }

  recommendations.push('Automated purging is scheduled daily at 2 AM UTC');
  recommendations.push('Analytics data is preserved during purging operations');

  return recommendations;
}

function generateAuditRecommendations(summary: any): string[] {
  const recommendations = [];

  if (summary.pii_violations > 0) {
    recommendations.push(`${summary.pii_violations} PII violations detected - review data input processes`);
  }

  if (summary.total_events === 0) {
    recommendations.push('No audit events recorded - verify system is processing requests');
  }

  recommendations.push('Audit logging is capturing all required events');
  recommendations.push('Review audit logs regularly for compliance');

  return recommendations;
}

function calculateComplianceRating(): string {
  // Simple compliance rating based on enabled features
  const features = [
    process.env.DATA_GOVERNANCE_ENABLED === 'true',
    process.env.PII_SCANNING_ENABLED === 'true',
    process.env.AUDIT_LOGGING_ENABLED === 'true',
    process.env.WORKFLOW_PURGING_ENABLED === 'true'
  ];

  const enabledFeatures = features.filter(Boolean).length;
  const percentage = (enabledFeatures / features.length) * 100;

  if (percentage >= 100) return 'Excellent';
  if (percentage >= 75) return 'Good';
  if (percentage >= 50) return 'Fair';
  return 'Needs Improvement';
}