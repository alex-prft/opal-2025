// Automated PII Scanner for Data Governance Compliance
// Scans for personally identifiable information in real-time

export interface PIIViolation {
  type: PIIType;
  pattern: string;
  matches: string[];
  field_path: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  suggested_action: string;
}

export type PIIType =
  | 'email'
  | 'phone'
  | 'ssn'
  | 'credit_card'
  | 'address'
  | 'name'
  | 'ip_address'
  | 'date_of_birth'
  | 'driver_license'
  | 'passport'
  | 'bank_account'
  | 'custom_id';

export interface PIIScanResult {
  violations: PIIViolation[];
  is_compliant: boolean;
  scan_timestamp: Date;
  total_violations: number;
  severity_breakdown: Record<PIIViolation['severity'], number>;
  recommendations: string[];
}

export interface PIIPattern {
  type: PIIType;
  regex: RegExp;
  severity: PIIViolation['severity'];
  description: string;
  example_matches: string[];
}

export class PIIScanner {
  private static readonly PII_PATTERNS: PIIPattern[] = [
    {
      type: 'email',
      regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      severity: 'high',
      description: 'Email address',
      example_matches: ['user@example.com', 'test.email@domain.org']
    },
    {
      type: 'phone',
      regex: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
      severity: 'high',
      description: 'Phone number (US format)',
      example_matches: ['555-123-4567', '(555) 123-4567', '+1-555-123-4567']
    },
    {
      type: 'ssn',
      regex: /\b\d{3}-\d{2}-\d{4}\b/g,
      severity: 'critical',
      description: 'Social Security Number',
      example_matches: ['123-45-6789']
    },
    {
      type: 'credit_card',
      regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
      severity: 'critical',
      description: 'Credit card number',
      example_matches: ['1234 5678 9012 3456', '1234-5678-9012-3456']
    },
    {
      type: 'address',
      regex: /\b\d{1,5}\s+([A-Za-z\s]{2,30})\s+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl|Boulevard|Blvd)\.?\b/gi,
      severity: 'medium',
      description: 'Street address',
      example_matches: ['123 Main Street', '456 Oak Avenue']
    },
    {
      type: 'ip_address',
      regex: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
      severity: 'low',
      description: 'IP address',
      example_matches: ['192.168.1.1', '10.0.0.1']
    },
    {
      type: 'date_of_birth',
      regex: /\b(0?[1-9]|1[0-2])[\/\-\.](0?[1-9]|[12][0-9]|3[01])[\/\-\.](19|20)\d{2}\b/g,
      severity: 'high',
      description: 'Date of birth',
      example_matches: ['01/01/1990', '12-31-1985']
    },
    {
      type: 'driver_license',
      regex: /\b[A-Z]{1,2}\d{6,8}\b/g,
      severity: 'high',
      description: 'Driver license number',
      example_matches: ['DL1234567', 'CA12345678']
    },
    {
      type: 'passport',
      regex: /\b[A-Z]{1,2}\d{6,9}\b/g,
      severity: 'high',
      description: 'Passport number',
      example_matches: ['A1234567', 'US123456789']
    },
    {
      type: 'bank_account',
      regex: /\b\d{8,17}\b/g,
      severity: 'critical',
      description: 'Bank account number',
      example_matches: ['12345678901234567']
    },
    {
      type: 'name',
      regex: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
      severity: 'medium',
      description: 'Full name (first last)',
      example_matches: ['John Smith', 'Jane Doe']
    }
  ];

  private static readonly FALSE_POSITIVE_PATTERNS = [
    /\b(test|example|sample|dummy|fake|mock)\b/i,
    /\b(localhost|127\.0\.0\.1|0\.0\.0\.0)\b/i,
    /\b(noreply|no-reply|admin|support|info)@/i,
  ];

  /**
   * Scan any data structure for PII
   */
  public static scanData(data: any, fieldPath: string = 'root'): PIIScanResult {
    const violations: PIIViolation[] = [];
    const scanTimestamp = new Date();

    this._scanRecursive(data, fieldPath, violations);

    const severityBreakdown = violations.reduce((acc, v) => {
      acc[v.severity] = (acc[v.severity] || 0) + 1;
      return acc;
    }, {} as Record<PIIViolation['severity'], number>);

    const isCompliant = violations.filter(v => v.severity === 'high' || v.severity === 'critical').length === 0;

    return {
      violations,
      is_compliant: isCompliant,
      scan_timestamp: scanTimestamp,
      total_violations: violations.length,
      severity_breakdown: severityBreakdown,
      recommendations: this._generateRecommendations(violations)
    };
  }

  /**
   * Scan text content for PII patterns
   */
  public static scanText(text: string, fieldPath: string = 'text'): PIIViolation[] {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const violations: PIIViolation[] = [];

    for (const pattern of this.PII_PATTERNS) {
      const matches = [...text.matchAll(pattern.regex)];

      if (matches.length > 0) {
        // Filter out false positives
        const validMatches = matches.filter(match =>
          !this._isFalsePositive(match[0], pattern.type)
        );

        if (validMatches.length > 0) {
          violations.push({
            type: pattern.type,
            pattern: pattern.regex.source,
            matches: validMatches.map(m => m[0]),
            field_path: fieldPath,
            severity: pattern.severity,
            confidence: this._calculateConfidence(validMatches, pattern),
            suggested_action: this._getSuggestedAction(pattern.type, pattern.severity)
          });
        }
      }
    }

    return violations;
  }

  /**
   * Validate OPAL workflow data before storage
   */
  public static validateWorkflowData(workflowData: {
    metadata?: any;
    input_data?: any;
    output_data?: any;
    error_details?: any;
  }): { isValid: boolean; violations: PIIViolation[]; blockers: PIIViolation[] } {
    const allViolations: PIIViolation[] = [];

    // Scan each field
    if (workflowData.metadata) {
      allViolations.push(...this.scanText(JSON.stringify(workflowData.metadata), 'metadata'));
    }
    if (workflowData.input_data) {
      allViolations.push(...this.scanText(JSON.stringify(workflowData.input_data), 'input_data'));
    }
    if (workflowData.output_data) {
      allViolations.push(...this.scanText(JSON.stringify(workflowData.output_data), 'output_data'));
    }
    if (workflowData.error_details) {
      allViolations.push(...this.scanText(JSON.stringify(workflowData.error_details), 'error_details'));
    }

    // Blocking violations (critical/high severity)
    const blockers = allViolations.filter(v => v.severity === 'critical' || v.severity === 'high');

    return {
      isValid: blockers.length === 0,
      violations: allViolations,
      blockers
    };
  }

  /**
   * Generate compliance report
   */
  public static async generateComplianceReport(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<{
    period: string;
    total_scans: number;
    violations_found: number;
    compliance_rate: number;
    top_violation_types: Array<{ type: PIIType; count: number }>;
    recommendations: string[];
  }> {
    // This would integrate with audit logs in production
    return {
      period: timeframe,
      total_scans: 0, // Would come from audit logs
      violations_found: 0,
      compliance_rate: 100,
      top_violation_types: [],
      recommendations: [
        'Continue monitoring data inputs for PII',
        'Review data classification policies',
        'Train team on PII handling procedures'
      ]
    };
  }

  /**
   * Real-time monitoring hook for API endpoints
   */
  public static createMonitoringMiddleware() {
    return (req: any, res: any, next: any) => {
      const originalSend = res.send;

      res.send = function(body: any) {
        // Scan response body for PII
        const scanResult = PIIScanner.scanData(body, 'api_response');

        if (!scanResult.is_compliant) {
          console.error('PII detected in API response:', scanResult.violations);

          // Log to audit system
          // In production, this would integrate with your logging system

          // Optionally block the response (based on severity)
          const criticalViolations = scanResult.violations.filter(v => v.severity === 'critical');
          if (criticalViolations.length > 0) {
            return originalSend.call(this, {
              error: 'Response blocked due to data governance violation',
              violations: criticalViolations.length
            });
          }
        }

        return originalSend.call(this, body);
      };

      next();
    };
  }

  // Private helper methods

  private static _scanRecursive(obj: any, path: string, violations: PIIViolation[]): void {
    if (obj === null || obj === undefined) return;

    if (typeof obj === 'string') {
      violations.push(...this.scanText(obj, path));
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        this._scanRecursive(item, `${path}[${index}]`, violations);
      });
    } else if (typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        this._scanRecursive(value, `${path}.${key}`, violations);
      });
    }
  }

  private static _isFalsePositive(match: string, type: PIIType): boolean {
    // Check against false positive patterns
    return this.FALSE_POSITIVE_PATTERNS.some(pattern => pattern.test(match));
  }

  private static _calculateConfidence(matches: RegExpMatchArray[], pattern: PIIPattern): number {
    // Simple confidence calculation based on pattern strength and context
    let confidence = 0.7; // Base confidence

    // Adjust based on pattern type
    if (['ssn', 'credit_card', 'email'].includes(pattern.type)) {
      confidence = 0.9; // High confidence for strong patterns
    }

    // Adjust based on number of matches (more matches = higher confidence)
    if (matches.length > 1) {
      confidence = Math.min(0.95, confidence + (matches.length * 0.05));
    }

    return confidence;
  }

  private static _getSuggestedAction(type: PIIType, severity: PIIViolation['severity']): string {
    const actions: Record<PIIType, string> = {
      email: 'Hash or mask email addresses',
      phone: 'Remove or mask phone numbers',
      ssn: 'IMMEDIATE ACTION: Remove SSN data',
      credit_card: 'IMMEDIATE ACTION: Remove credit card data',
      address: 'Remove or generalize address information',
      name: 'Consider using initials or removing names',
      ip_address: 'Hash IP addresses for audit purposes',
      date_of_birth: 'Remove specific birth dates',
      driver_license: 'Remove driver license numbers',
      passport: 'Remove passport numbers',
      bank_account: 'IMMEDIATE ACTION: Remove bank account data',
      custom_id: 'Review and classify custom identifiers'
    };

    return actions[type] || 'Review and classify data';
  }

  private static _generateRecommendations(violations: PIIViolation[]): string[] {
    const recommendations: string[] = [];

    const criticalCount = violations.filter(v => v.severity === 'critical').length;
    const highCount = violations.filter(v => v.severity === 'high').length;

    if (criticalCount > 0) {
      recommendations.push(`URGENT: Remove ${criticalCount} critical PII violations immediately`);
    }

    if (highCount > 0) {
      recommendations.push(`Address ${highCount} high-severity PII violations`);
    }

    const typeGroups = violations.reduce((acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
      return acc;
    }, {} as Record<PIIType, number>);

    Object.entries(typeGroups).forEach(([type, count]) => {
      recommendations.push(`Review ${count} ${type} violations`);
    });

    if (violations.length === 0) {
      recommendations.push('Data appears compliant with PII policies');
    }

    return recommendations;
  }
}

// Export types and scanner
export { PIIScanner };
export type { PIIScanResult, PIIViolation, PIIType, PIIPattern };