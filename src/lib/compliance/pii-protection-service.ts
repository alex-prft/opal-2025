/**
 * PIIProtectionService - Simplified PII Protection Interface
 *
 * Provides a clean, simple API for basic PII protection while leveraging
 * the comprehensive PIIProtectionManager for advanced features.
 */

import crypto from 'crypto';
import { piiProtectionManager, PIIType } from './pii-protection-manager';

export interface PIIProtectionConfig {
  redaction_mode: 'mask' | 'hash' | 'remove' | 'partial';
  preserve_format?: boolean;
  audit_enabled?: boolean;
}

export class PIIProtectionService {
  private readonly config: PIIProtectionConfig;

  constructor(config: PIIProtectionConfig) {
    this.config = {
      preserve_format: true,
      audit_enabled: true,
      ...config
    };

    console.log(`🔐 [PII Service] Simple PII Protection Service initialized with ${this.config.redaction_mode} mode`);
  }

  /**
   * Main PII protection method - simplified interface
   */
  public protectPIIValue(originalValue: string, piiType: PIIType): string {
    console.log(`🛡️ [PII Service] Protecting ${piiType} value with ${this.config.redaction_mode} mode`);

    switch (this.config.redaction_mode) {
      case 'mask':
        return this.maskPII(originalValue, piiType);
      case 'hash':
        return this.hashPII(originalValue);
      case 'partial':
        return this.partialPII(originalValue, piiType);
      case 'remove':
        return '[REDACTED]';
      default:
        console.warn(`⚠️ [PII Service] Unknown redaction mode: ${this.config.redaction_mode}`);
        return originalValue;
    }
  }

  /**
   * Batch protection for multiple values
   */
  public async protectBatch(values: Array<{ value: string; type: PIIType }>): Promise<string[]> {
    return values.map(item => this.protectPIIValue(item.value, item.type));
  }

  /**
   * Advanced protection using comprehensive PIIProtectionManager
   */
  public async protectAdvanced(
    originalValue: string,
    piiType: PIIType,
    context?: { user_role?: 'admin' | 'user' | 'guest'; operation_type?: string }
  ): Promise<string> {
    const detections = await piiProtectionManager.detectAndProtectPII(originalValue, {
      operation_type: context?.operation_type as any || 'display',
      data_classification: 'confidential',
      user_role: context?.user_role || 'user'
    });

    if (detections.length > 0) {
      let protectedValue = originalValue;
      for (const detection of detections) {
        protectedValue = protectedValue.replace(detection.original_value, detection.protected_value);
      }
      return protectedValue;
    }

    return originalValue;
  }

  /**
   * Mask PII with format preservation
   */
  private maskPII(value: string, piiType: PIIType): string {
    switch (piiType) {
      case 'email':
        const emailParts = value.split('@');
        if (emailParts.length === 2) {
          const [local, domain] = emailParts;
          const maskedLocal = local.length > 2 ?
            local[0] + '*'.repeat(local.length - 2) + local[local.length - 1] :
            '*'.repeat(local.length);
          return `${maskedLocal}@${domain}`;
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
        const cleaned = value.replace(/\D/g, '');
        const masked = '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);

        // Preserve original formatting if requested
        if (this.config.preserve_format && value.includes('-')) {
          return this.restoreFormat(masked, value, '-');
        } else if (this.config.preserve_format && value.includes(' ')) {
          return this.restoreFormat(masked, value, ' ');
        }

        return masked;

      case 'name':
        const nameParts = value.split(' ');
        if (nameParts.length > 1) {
          return nameParts[0] + ' ' + nameParts.slice(1).map(part => part[0] + '.').join(' ');
        }
        return value.length > 1 ? value[0] + '*'.repeat(value.length - 1) : value;

      case 'address':
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

  /**
   * Hash PII value with type identifier
   */
  private hashPII(value: string): string {
    const salt = process.env.PII_PROTECTION_SALT || 'default-salt-change-in-production';
    const hash = crypto.createHash('sha256').update(value + salt).digest('hex');
    return `[HASH:${hash.substring(0, 8)}]`;
  }

  /**
   * Partial redaction showing some characters
   */
  private partialPII(value: string, piiType: PIIType): string {
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
          this.maskPII(value, piiType);
    }

    return this.maskPII(value, piiType);
  }

  /**
   * Restore original formatting (spaces, dashes) to masked value
   */
  private restoreFormat(maskedValue: string, originalValue: string, separator: string): string {
    const originalParts = originalValue.split(separator);
    const maskedChars = maskedValue.split('');
    let charIndex = 0;

    return originalParts.map(part => {
      const partMasked = maskedChars.slice(charIndex, charIndex + part.replace(/\D/g, '').length).join('');
      charIndex += part.replace(/\D/g, '').length;
      return partMasked;
    }).join(separator);
  }

  /**
   * Quick PII detection and protection in one call
   */
  public async quickProtect(text: string): Promise<{
    protected_text: string;
    detections_count: number;
    pii_types_found: PIIType[];
  }> {
    const detections = await piiProtectionManager.detectAndProtectPII(text, {
      operation_type: 'display',
      data_classification: 'confidential',
      user_role: 'user'
    });

    let protectedText = text;
    for (const detection of detections) {
      protectedText = protectedText.replace(detection.original_value, detection.protected_value);
    }

    return {
      protected_text: protectedText,
      detections_count: detections.length,
      pii_types_found: detections.map(d => d.pii_type)
    };
  }

  /**
   * Get service configuration and statistics
   */
  public getServiceInfo(): {
    config: PIIProtectionConfig;
    supported_modes: string[];
    enterprise_integration: boolean;
  } {
    return {
      config: { ...this.config },
      supported_modes: ['mask', 'hash', 'partial', 'remove'],
      enterprise_integration: true
    };
  }
}

// Export singleton instances for different use cases
export const basicPIIProtection = new PIIProtectionService({
  redaction_mode: 'mask',
  preserve_format: true,
  audit_enabled: true
});

export const strictPIIProtection = new PIIProtectionService({
  redaction_mode: 'hash',
  preserve_format: false,
  audit_enabled: true
});

export const partialPIIProtection = new PIIProtectionService({
  redaction_mode: 'partial',
  preserve_format: true,
  audit_enabled: true
});