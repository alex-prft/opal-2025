/**
 * PII Protection Manager - Enterprise Data Protection System
 *
 * Integrates with GDPR compliance, agent data validation, and Supabase guardrails
 * to provide comprehensive personally identifiable information protection.
 */

import crypto from 'crypto';
import { enterpriseComplianceManagement } from './enterprise-compliance-management';

// ============================================================================
// PII PROTECTION INTERFACES
// ============================================================================

export type PIIType =
  | 'email'
  | 'phone'
  | 'ssn'
  | 'credit_card'
  | 'passport'
  | 'drivers_license'
  | 'address'
  | 'name'
  | 'date_of_birth'
  | 'ip_address'
  | 'bank_account'
  | 'tax_id'
  | 'medical_record'
  | 'biometric';

export type RedactionMode =
  | 'mask'        // Replace with asterisks: ***@***.com
  | 'hash'        // SHA-256 hash: a1b2c3d4...
  | 'encrypt'     // AES encryption (reversible)
  | 'anonymize'   // Replace with generic placeholder
  | 'pseudonymize' // Consistent fake but realistic values
  | 'remove'      // Complete removal
  | 'partial'     // Show first/last characters: j***@e***.com

export interface PIIProtectionConfig {
  redaction_mode: RedactionMode;
  encryption_key?: string;
  preserve_format: boolean;          // Maintain original format (e.g., phone number structure)
  audit_redactions: boolean;         // Log all PII redaction events
  compliance_level: 'basic' | 'gdpr' | 'hipaa' | 'enterprise';
  allow_reversible: boolean;         // Allow encryption/pseudonymization
  context_aware: boolean;           // Adjust protection based on context
}

export interface PIIDetectionResult {
  detected: boolean;
  pii_type: PIIType;
  confidence_score: number;         // 0-100
  original_value: string;
  protected_value: string;
  protection_method: RedactionMode;
  is_reversible: boolean;
  audit_logged: boolean;
}

export interface PIIProtectionContext {
  operation_type: 'storage' | 'transmission' | 'display' | 'logging';
  data_classification: 'public' | 'internal' | 'confidential' | 'restricted';
  user_role: 'admin' | 'user' | 'guest' | 'system';
  legal_basis?: string;             // GDPR legal basis
  retention_period?: number;        // Days
  geographic_location?: string;     // For jurisdiction-specific rules
}

// ============================================================================
// PII PROTECTION MANAGER
// ============================================================================

export class PIIProtectionManager {
  private config: PIIProtectionConfig;
  private piiPatterns: Map<PIIType, RegExp>;
  private pseudonymCache: Map<string, string>;

  constructor(config?: Partial<PIIProtectionConfig>) {
    this.config = {
      redaction_mode: 'mask',
      preserve_format: true,
      audit_redactions: true,
      compliance_level: 'enterprise',
      allow_reversible: false,
      context_aware: true,
      ...config
    };

    this.piiPatterns = this.initializePIIPatterns();
    this.pseudonymCache = new Map();

    console.log(`🔐 [PII] PII Protection Manager initialized (${this.config.compliance_level} level)`);
  }

  /**
   * Main PII protection method with comprehensive redaction strategies
   */
  private protectPIIValue(
    originalValue: string,
    piiType: PIIType,
    context?: PIIProtectionContext
  ): string {

    console.log(`🛡️ [PII] Protecting ${piiType} value with ${this.config.redaction_mode} mode`);

    // Context-aware redaction mode selection
    const effectiveMode = this.getEffectiveRedactionMode(piiType, context);

    switch (effectiveMode) {
      case 'mask':
        return this.maskValue(originalValue, piiType);

      case 'hash':
        return this.hashValue(originalValue, piiType);

      case 'encrypt':
        if (!this.config.allow_reversible) {
          console.warn('⚠️ [PII] Encryption requested but not allowed, falling back to hash');
          return this.hashValue(originalValue, piiType);
        }
        return this.encryptValue(originalValue, piiType);

      case 'anonymize':
        return this.anonymizeValue(originalValue, piiType);

      case 'pseudonymize':
        if (!this.config.allow_reversible) {
          console.warn('⚠️ [PII] Pseudonymization requested but not allowed, falling back to anonymize');
          return this.anonymizeValue(originalValue, piiType);
        }
        return this.pseudonymizeValue(originalValue, piiType);

      case 'remove':
        return '[REDACTED]';

      case 'partial':
        return this.partialRedaction(originalValue, piiType);

      default:
        console.warn(`⚠️ [PII] Unknown redaction mode: ${effectiveMode}, falling back to mask`);
        return this.maskValue(originalValue, piiType);
    }
  }

  /**
   * Comprehensive PII detection and protection
   */
  public async detectAndProtectPII(
    input: string,
    context?: PIIProtectionContext
  ): Promise<PIIDetectionResult[]> {

    const results: PIIDetectionResult[] = [];
    let processedInput = input;

    // Scan for all PII types
    for (const [piiType, pattern] of this.piiPatterns.entries()) {
      const matches = input.match(new RegExp(pattern.source, 'gi'));

      if (matches) {
        for (const match of matches) {
          const confidenceScore = this.calculateConfidenceScore(match, piiType);

          if (confidenceScore >= 70) { // High confidence threshold
            const protectedValue = this.protectPIIValue(match, piiType, context);

            // Replace in processed input
            processedInput = processedInput.replace(match, protectedValue);

            const result: PIIDetectionResult = {
              detected: true,
              pii_type: piiType,
              confidence_score: confidenceScore,
              original_value: match,
              protected_value: protectedValue,
              protection_method: this.getEffectiveRedactionMode(piiType, context),
              is_reversible: this.isReversibleMethod(this.getEffectiveRedactionMode(piiType, context)),
              audit_logged: false
            };

            // Audit logging
            if (this.config.audit_redactions) {
              await this.auditPIIRedaction(result, context);
              result.audit_logged = true;
            }

            results.push(result);
          }
        }
      }
    }

    return results;
  }

  /**
   * Batch PII protection for agent data
   */
  public async protectAgentData(
    agentData: Record<string, any>,
    context?: PIIProtectionContext
  ): Promise<{
    protected_data: Record<string, any>;
    pii_detections: PIIDetectionResult[];
  }> {

    const protectedData = { ...agentData };
    const allDetections: PIIDetectionResult[] = [];

    // Recursively scan and protect all string values
    const processObject = async (obj: any, path: string[] = []): Promise<void> => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = [...path, key];

        if (typeof value === 'string') {
          const detections = await this.detectAndProtectPII(value, {
            ...context,
            operation_type: 'storage', // Agent data is typically stored
            data_classification: 'confidential'
          });

          if (detections.length > 0) {
            // Replace original value with protected value
            let protectedValue = value;
            for (const detection of detections) {
              protectedValue = protectedValue.replace(
                detection.original_value,
                detection.protected_value
              );
            }

            // Update the object at current path
            this.setNestedValue(protectedData, currentPath, protectedValue);
            allDetections.push(...detections);
          }
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          await processObject(value, currentPath);
        } else if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            if (typeof value[i] === 'string') {
              const detections = await this.detectAndProtectPII(value[i], context);
              if (detections.length > 0) {
                let protectedValue = value[i];
                for (const detection of detections) {
                  protectedValue = protectedValue.replace(
                    detection.original_value,
                    detection.protected_value
                  );
                }
                value[i] = protectedValue;
                allDetections.push(...detections);
              }
            } else if (typeof value[i] === 'object') {
              await processObject(value[i], [...currentPath, i.toString()]);
            }
          }
        }
      }
    };

    await processObject(protectedData);

    console.log(`🛡️ [PII] Protected agent data: ${allDetections.length} PII instances found and protected`);

    return {
      protected_data: protectedData,
      pii_detections: allDetections
    };
  }

  // ============================================================================
  // REDACTION METHODS
  // ============================================================================

  private maskValue(value: string, piiType: PIIType): string {
    switch (piiType) {
      case 'email':
        const emailParts = value.split('@');
        if (emailParts.length === 2) {
          const [local, domain] = emailParts;
          const maskedLocal = local.length > 2 ?
            local[0] + '*'.repeat(local.length - 2) + local[local.length - 1] :
            '*'.repeat(local.length);
          const domainParts = domain.split('.');
          const maskedDomain = domainParts.length > 1 ?
            domainParts[0][0] + '*'.repeat(Math.max(0, domainParts[0].length - 1)) + '.' + domainParts.slice(1).join('.') :
            '*'.repeat(domain.length);
          return `${maskedLocal}@${maskedDomain}`;
        }
        return '*'.repeat(value.length);

      case 'phone':
        if (this.config.preserve_format) {
          return value.replace(/\d/g, '*');
        }
        return '*'.repeat(value.length);

      case 'ssn':
        if (value.includes('-')) {
          return '***-**-' + value.slice(-4);
        }
        return '*'.repeat(value.length - 4) + value.slice(-4);

      case 'credit_card':
        // Show last 4 digits
        const cleaned = value.replace(/\D/g, '');
        return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);

      case 'address':
        // Mask street number and name, keep city/state
        const addressParts = value.split(',');
        if (addressParts.length >= 2) {
          const maskedStreet = '*'.repeat(addressParts[0].trim().length);
          return [maskedStreet, ...addressParts.slice(1)].join(',');
        }
        return '*'.repeat(value.length);

      default:
        // Generic masking - show first and last character for longer values
        if (value.length <= 3) {
          return '*'.repeat(value.length);
        }
        return value[0] + '*'.repeat(value.length - 2) + value[value.length - 1];
    }
  }

  private hashValue(value: string, piiType: PIIType): string {
    const hash = crypto.createHash('sha256').update(value + this.getSalt()).digest('hex');
    return `[HASH:${piiType}:${hash.substring(0, 8)}]`;
  }

  private encryptValue(value: string, piiType: PIIType): string {
    if (!this.config.encryption_key) {
      console.warn('⚠️ [PII] Encryption key not configured, falling back to hash');
      return this.hashValue(value, piiType);
    }

    try {
      const cipher = crypto.createCipher('aes-256-cbc', this.config.encryption_key);
      let encrypted = cipher.update(value, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return `[ENC:${piiType}:${encrypted}]`;
    } catch (error) {
      console.error('❌ [PII] Encryption failed:', error);
      return this.hashValue(value, piiType);
    }
  }

  private anonymizeValue(value: string, piiType: PIIType): string {
    const anonymousValues: Record<PIIType, string> = {
      email: 'user@example.com',
      phone: '+1-555-0100',
      ssn: '000-00-0000',
      credit_card: '0000-0000-0000-0000',
      passport: 'P000000000',
      drivers_license: 'DL000000000',
      address: '123 Main St, Anytown, ST 00000',
      name: 'Anonymous User',
      date_of_birth: '1900-01-01',
      ip_address: '0.0.0.0',
      bank_account: '000000000',
      tax_id: '00-0000000',
      medical_record: 'MR000000',
      biometric: '[BIOMETRIC_DATA]'
    };

    return anonymousValues[piiType] || '[ANONYMOUS]';
  }

  private pseudonymizeValue(value: string, piiType: PIIType): string {
    // Generate consistent pseudonym for the same input
    const cached = this.pseudonymCache.get(value);
    if (cached) return cached;

    const seed = crypto.createHash('md5').update(value + this.getSalt()).digest('hex');
    const pseudonym = this.generatePseudonym(piiType, seed);

    this.pseudonymCache.set(value, pseudonym);
    return pseudonym;
  }

  private partialRedaction(value: string, piiType: PIIType): string {
    switch (piiType) {
      case 'email':
        const emailParts = value.split('@');
        if (emailParts.length === 2) {
          const [local, domain] = emailParts;
          const partialLocal = local.length > 3 ?
            local.substring(0, 2) + '*'.repeat(local.length - 3) + local[local.length - 1] :
            local[0] + '*'.repeat(Math.max(0, local.length - 1));
          return `${partialLocal}@${domain}`;
        }
        break;

      case 'phone':
        if (value.length >= 6) {
          return value.substring(0, 3) + '*'.repeat(value.length - 6) + value.slice(-3);
        }
        break;

      case 'name':
        const nameParts = value.split(' ');
        if (nameParts.length > 1) {
          return nameParts[0] + ' ' + nameParts.slice(1).map(part => part[0] + '.').join(' ');
        }
        return value.length > 1 ? value[0] + '*'.repeat(value.length - 1) : value;

      default:
        return value.length > 4 ?
          value.substring(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2) :
          this.maskValue(value, piiType);
    }

    return this.maskValue(value, piiType);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private getEffectiveRedactionMode(piiType: PIIType, context?: PIIProtectionContext): RedactionMode {
    if (!this.config.context_aware || !context) {
      return this.config.redaction_mode;
    }

    // High-risk PII types get stronger protection
    const highRiskTypes: PIIType[] = ['ssn', 'credit_card', 'medical_record', 'biometric'];

    if (highRiskTypes.includes(piiType)) {
      if (context.operation_type === 'logging' || context.operation_type === 'display') {
        return 'hash';
      }
      if (context.data_classification === 'restricted') {
        return 'encrypt';
      }
    }

    // Adjust based on user role
    if (context.user_role === 'guest') {
      return 'remove';
    } else if (context.user_role === 'user') {
      return 'partial';
    }

    return this.config.redaction_mode;
  }

  private calculateConfidenceScore(value: string, piiType: PIIType): number {
    // Enhanced confidence scoring based on pattern match quality
    const pattern = this.piiPatterns.get(piiType);
    if (!pattern) return 0;

    let score = 50; // Base score for pattern match

    switch (piiType) {
      case 'email':
        if (value.includes('@') && value.includes('.')) score += 30;
        if (!/\s/.test(value)) score += 10;
        if (value.length >= 5) score += 10;
        break;

      case 'phone':
        const digits = value.replace(/\D/g, '');
        if (digits.length === 10 || digits.length === 11) score += 30;
        if (/^\+?1?[\s\-\(\)]?\d{3}[\s\-\)]?\d{3}[\s\-]?\d{4}$/.test(value)) score += 20;
        break;

      case 'ssn':
        if (/^\d{3}-\d{2}-\d{4}$/.test(value)) score += 40;
        if (!/^000|666|9\d{2}/.test(value)) score += 10;
        break;

      case 'credit_card':
        const ccDigits = value.replace(/\D/g, '');
        if (ccDigits.length >= 13 && ccDigits.length <= 19) score += 20;
        if (this.luhnCheck(ccDigits)) score += 30;
        break;

      default:
        score += 20; // Default confidence boost for other types
    }

    return Math.min(100, score);
  }

  private initializePIIPatterns(): Map<PIIType, RegExp> {
    return new Map<PIIType, RegExp>([
      ['email', /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/],
      ['phone', /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/],
      ['ssn', /\b\d{3}-?\d{2}-?\d{4}\b/],
      ['credit_card', /\b(?:\d{4}[-\s]?){3}\d{4}\b/],
      ['ip_address', /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/],
      ['passport', /\b[A-Z]{1,2}\d{6,9}\b/],
      ['drivers_license', /\b[A-Z]{1,2}\d{6,8}\b/],
      ['bank_account', /\b\d{8,17}\b/],
      ['tax_id', /\b\d{2}-\d{7}\b/],
      ['date_of_birth', /\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}\b/]
    ]);
  }

  private generatePseudonym(piiType: PIIType, seed: string): string {
    // Generate realistic but fake values based on seed
    const seedNum = parseInt(seed.substring(0, 8), 16);

    switch (piiType) {
      case 'email':
        const firstNames = ['john', 'jane', 'alex', 'chris', 'taylor'];
        const lastNames = ['smith', 'doe', 'johnson', 'brown', 'davis'];
        const domains = ['example.com', 'test.org', 'sample.net'];

        const firstName = firstNames[seedNum % firstNames.length];
        const lastName = lastNames[(seedNum >> 4) % lastNames.length];
        const domain = domains[(seedNum >> 8) % domains.length];

        return `${firstName}.${lastName}@${domain}`;

      case 'name':
        const names = ['John Smith', 'Jane Doe', 'Alex Johnson', 'Chris Brown', 'Taylor Davis'];
        return names[seedNum % names.length];

      case 'phone':
        const areaCode = 555;
        const exchange = 100 + (seedNum % 899);
        const number = 1000 + (seedNum % 8999);
        return `+1-${areaCode}-${exchange}-${number}`;

      default:
        return `[PSEUDO:${piiType}:${seed.substring(0, 8)}]`;
    }
  }

  private getSalt(): string {
    return process.env.PII_PROTECTION_SALT || 'default-salt-change-in-production';
  }

  private luhnCheck(cardNumber: string): boolean {
    // Luhn algorithm for credit card validation
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  private setNestedValue(obj: any, path: string[], value: any): void {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      if (!(path[i] in current)) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
  }

  private isReversibleMethod(method: RedactionMode): boolean {
    return method === 'encrypt' || method === 'pseudonymize';
  }

  private async auditPIIRedaction(detection: PIIDetectionResult, context?: PIIProtectionContext): Promise<void> {
    try {
      await enterpriseComplianceManagement.logAuditEvent({
        audit_type: 'data_protection_event',
        source_system: 'pii_protection_manager',
        action: {
          action_type: 'pii_redaction_applied',
          resource_type: 'sensitive_data',
          resource_id: crypto.createHash('md5').update(detection.original_value).digest('hex').substring(0, 8),
          operation: 'redact',
          outcome: 'success'
        },
        compliance_relevance: {
          applicable_frameworks: ['gdpr', 'ccpa', 'hipaa'],
          compliance_requirements: ['data_minimization', 'privacy_by_design'],
          retention_period_years: 7,
          legal_hold_applied: false
        }
      });
    } catch (error) {
      console.error('❌ [PII] Failed to audit PII redaction:', error);
    }
  }

  /**
   * Get PII protection statistics
   */
  public getProtectionStatistics(): {
    total_pseudonyms_cached: number;
    config: PIIProtectionConfig;
    supported_pii_types: PIIType[];
  } {
    return {
      total_pseudonyms_cached: this.pseudonymCache.size,
      config: { ...this.config },
      supported_pii_types: Array.from(this.piiPatterns.keys())
    };
  }
}

// Export singleton instance
export const piiProtectionManager = new PIIProtectionManager();