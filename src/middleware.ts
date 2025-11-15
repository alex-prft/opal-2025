// Data Governance Middleware for OSA
// Automatically integrates PII scanning, audit logging, and security monitoring

import { NextRequest, NextResponse } from 'next/server';
import { auditLogger } from '@/lib/security/audit-logger';
import { PIIScanner } from '@/lib/security/pii-scanner';

// Routes that require enhanced security monitoring
const SENSITIVE_ROUTES = [
  '/api/opal/',
  '/api/admin/',
  '/api/phase1/',
  '/api/phase2/',
  '/api/phase3/',
  '/engine/admin/',
  '/engine/results/'
];

// Routes that handle customer data and need PII scanning
const CUSTOMER_DATA_ROUTES = [
  '/api/opal/workflows/',
  '/api/phase1/',
  '/api/phase2/',
  '/api/phase3/'
];

// Admin routes that require additional audit logging
const ADMIN_ROUTES = [
  '/api/admin/',
  '/engine/admin/'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and non-sensitive routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/health') ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // Check if data governance is enabled
  const governanceEnabled = process.env.DATA_GOVERNANCE_ENABLED === 'true';
  const auditEnabled = process.env.AUDIT_LOGGING_ENABLED === 'true';
  const piiScanningEnabled = process.env.PII_SCANNING_ENABLED === 'true';

  if (!governanceEnabled) {
    return NextResponse.next();
  }

  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  // Extract client information for audit logging
  const clientIP = request.ip ||
                  request.headers.get('x-forwarded-for')?.split(',')[0] ||
                  request.headers.get('x-real-ip') ||
                  '127.0.0.1';

  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Set request context for audit logging
  if (auditEnabled) {
    try {
      auditLogger.setRequestContext({
        clientIP,
        userAgent,
        requestId,
        sessionId: request.headers.get('x-session-id') || undefined
      });
    } catch (error) {
      console.warn('Failed to set audit context:', error);
    }
  }

  // Determine security level based on route
  const isSensitiveRoute = SENSITIVE_ROUTES.some(route => pathname.startsWith(route));
  const isCustomerDataRoute = CUSTOMER_DATA_ROUTES.some(route => pathname.startsWith(route));
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));

  let response: NextResponse;

  try {
    // Clone request for potential body scanning
    const requestClone = request.clone();
    let requestBody: any = null;

    // Scan request body for PII if it's a customer data route
    if (isCustomerDataRoute && piiScanningEnabled && request.method !== 'GET') {
      try {
        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          const body = await requestClone.text();

          if (body) {
            requestBody = JSON.parse(body);

            // Scan for PII in request body
            const scanResult = PIIScanner.scanData(requestBody, 'request_body');

            if (!scanResult.is_compliant) {
              // Block critical PII violations
              const criticalViolations = scanResult.violations.filter(v =>
                v.severity === 'critical' || v.severity === 'high'
              );

              if (criticalViolations.length > 0) {
                await auditLogger.logPIIViolation({
                  violation_data: {
                    violations: criticalViolations.map(v => ({
                      type: v.type,
                      field: v.field_path,
                      severity: v.severity
                    })),
                    table: 'request_body',
                    operation: 'HTTP_REQUEST'
                  },
                  severity: 'critical',
                  table_context: pathname
                });

                return NextResponse.json({
                  error: 'Request blocked due to data governance violation',
                  code: 'PII_VIOLATION',
                  violations: criticalViolations.length,
                  message: 'Please remove personally identifiable information from your request'
                }, { status: 400 });
              }

              // Log non-critical violations for review
              if (scanResult.violations.length > 0) {
                await auditLogger.logPIIViolation({
                  violation_data: {
                    violations: scanResult.violations.map(v => ({
                      type: v.type,
                      field: v.field_path,
                      severity: v.severity
                    })),
                    table: 'request_body',
                    operation: 'HTTP_REQUEST'
                  },
                  severity: 'medium',
                  table_context: pathname
                });
              }
            }
          }
        }
      } catch (error) {
        console.warn('PII scanning failed for request:', error);
      }
    }

    // Continue with request processing
    response = NextResponse.next();

    // Add security headers
    response.headers.set('X-Request-ID', requestId);
    response.headers.set('X-Data-Governance', 'enabled');

    if (isSensitiveRoute) {
      response.headers.set('X-Security-Level', 'high');
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    }

    // Log access for audit trail
    if (auditEnabled) {
      const executionTime = Date.now() - startTime;

      await auditLogger.logAuditEvent({
        table_name: 'http_requests',
        operation: `${request.method}_${pathname}`,
        new_data: {
          method: request.method,
          pathname,
          execution_time_ms: executionTime,
          user_agent_hash: auditLogger['hashSensitiveData'] ?
            auditLogger['hashSensitiveData'](userAgent) : 'hashed',
          security_level: isSensitiveRoute ? 'high' : 'normal',
          has_request_body: requestBody !== null,
          pii_scanned: isCustomerDataRoute && piiScanningEnabled
        },
        threat_level: isAdminRoute ? 'medium' : 'low',
        audit_category: 'access',
        compliance_status: 'compliant'
      });
    }

    // Log security events for sensitive routes
    if (isSensitiveRoute && auditEnabled) {
      await auditLogger.logSecurityEvent({
        event_type: 'SENSITIVE_ROUTE_ACCESS',
        event_data: {
          pathname,
          method: request.method,
          is_admin: isAdminRoute,
          execution_time_ms: Date.now() - startTime
        },
        threat_level: isAdminRoute ? 'medium' : 'low'
      });
    }

    return response;

  } catch (error) {
    console.error('Middleware error:', error);

    // Log the error
    if (auditEnabled) {
      try {
        await auditLogger.logSecurityEvent({
          event_type: 'MIDDLEWARE_ERROR',
          event_data: {
            pathname,
            error: error instanceof Error ? error.message : 'Unknown error',
            execution_time_ms: Date.now() - startTime
          },
          threat_level: 'high'
        });
      } catch (auditError) {
        console.error('Failed to log middleware error:', auditError);
      }
    }

    // Continue processing even if middleware fails
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/health (health checks)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api/health|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};