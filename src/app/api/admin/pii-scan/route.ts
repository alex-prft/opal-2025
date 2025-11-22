// PII Scanning API Endpoint for Data Governance
// Allows manual scanning and validation of data for PII compliance

import { NextRequest, NextResponse } from 'next/server';
import { PIIScanner, PIIScanResult } from '@/lib/security/pii-scanner';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { data, scan_type = 'general' } = await request.json();

    if (!data) {
      return NextResponse.json({
        error: 'No data provided for scanning'
      }, { status: 400 });
    }

    let scanResult: PIIScanResult;

    switch (scan_type) {
      case 'workflow':
        const workflowValidation = PIIScanner.validateWorkflowData(data);
        scanResult = {
          violations: workflowValidation.violations,
          is_compliant: workflowValidation.isValid,
          scan_timestamp: new Date(),
          total_violations: workflowValidation.violations.length,
          severity_breakdown: workflowValidation.violations.reduce((acc, v) => {
            acc[v.severity] = (acc[v.severity] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          recommendations: workflowValidation.violations.length > 0
            ? ['Fix workflow data violations before storage']
            : ['Workflow data is compliant']
        };
        break;

      default:
        scanResult = PIIScanner.scanData(data);
        break;
    }

    // Log the scan to audit table
    await (supabase as any)
      .from('supabase_audit_log')
      .insert({
        table_name: 'pii_scan_request',
        operation: 'PII_SCAN',
        new_data: {
          scan_type,
          violations_found: scanResult.total_violations,
          compliance_status: scanResult.is_compliant,
          severity_breakdown: scanResult.severity_breakdown
        }
      });

    return NextResponse.json({
      success: true,
      scan_result: scanResult,
      recommendations: scanResult.recommendations
    });

  } catch (error) {
    console.error('PII scan error:', error);
    return NextResponse.json({
      error: 'Internal server error during PII scan'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') as 'day' | 'week' | 'month' || 'day';

    const complianceReport = await PIIScanner.generateComplianceReport(timeframe);

    return NextResponse.json({
      success: true,
      report: complianceReport
    });

  } catch (error) {
    console.error('Compliance report error:', error);
    return NextResponse.json({
      error: 'Internal server error generating compliance report'
    }, { status: 500 });
  }
}