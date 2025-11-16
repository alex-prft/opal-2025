/**
 * Enhanced Webhook Security Manager with Enterprise Compliance Integration
 *
 * Builds on the security improvements while integrating with existing
 * enterprise compliance, audit trails, and GDPR systems.
 */

import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { enterpriseComplianceManagement } from '@/lib/compliance/enterprise-compliance-management';
import { supabase, isDatabaseAvailable } from '@/lib/database/supabase-client';

// ============================================================================
// ENHANCED INTERFACES
// ============================================================================

export interface EnhancedWebhookVerificationResult {
  isValid: boolean;
  error?: 'invalid_signature_format' | 'timestamp_out_of_tolerance' | 'signature_mismatch' | 'security_violation';
  message: string;
  securityContext?: {
    source_ip?: string;
    request_id: string;
    timestamp: string;
    risk_score: number; // 0-100
    violation_logged: boolean;
  };
}

export interface SecurityViolationEvent {
  event_type: 'hmac_verification_failure' | 'timestamp_manipulation' | 'replay_attack' | 'rate_limit_exceeded';
  source_ip?: string;
  user_agent?: string;
  request_id: string;
  timestamp: string;
  signature_provided?: string;
  payload_hash?: string;
  risk_assessment: {
    risk_score: number;
    threat_indicators: string[];
    recommended_action: 'log' | 'alert' | 'block';
  };
  compliance_context: {
    gdpr_relevant: boolean;
    retention_period_years: number;
    legal_hold_applied: boolean;
  };
}

export interface WebhookSecurityConfig {
  timestamp_tolerance_ms: number;
  max_payload_size_mb: number;
  rate_limit_per_ip: number;
  rate_limit_window_ms: number;
  enable_threat_detection: boolean;
  enable_compliance_logging: boolean;
  block_suspicious_requests: boolean;
}

// ============================================================================
// ENHANCED WEBHOOK SECURITY MANAGER
// ============================================================================

export class EnhancedWebhookSecurityManager {
  private config: WebhookSecurityConfig;
  private rateLimitStore = new Map<string, { count: number; windowStart: number }>();
  private threatDetectionCache = new Map<string, { violations: number; lastViolation: number }>();

  constructor(config?: Partial<WebhookSecurityConfig>) {
    this.config = {
      timestamp_tolerance_ms: 5 * 60 * 1000, // 5 minutes
      max_payload_size_mb: 10,
      rate_limit_per_ip: 100,
      rate_limit_window_ms: 15 * 60 * 1000, // 15 minutes
      enable_threat_detection: true,
      enable_compliance_logging: true,
      block_suspicious_requests: false, // Development-friendly default
      ...config
    };

    console.log('🔐 [Security] Enhanced Webhook Security Manager initialized');
  }

  /**
   * Enhanced webhook signature verification with comprehensive security logging
   */
  async verifyWebhookSignature(
    req: NextRequest,
    payload: Buffer,
    signatureHeader: string
  ): Promise<EnhancedWebhookVerificationResult> {

    const requestId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const sourceIP = this.getRequestIP(req);

    console.log(`🔒 [Security] Verifying webhook signature: ${requestId}`);

    try {
      // 1. Rate limiting check
      const rateLimitResult = await this.checkRateLimit(sourceIP, requestId);
      if (!rateLimitResult.allowed) {
        return await this.handleSecurityViolation({
          event_type: 'rate_limit_exceeded',
          source_ip: sourceIP,
          user_agent: req.headers.get('user-agent') || undefined,
          request_id: requestId,
          timestamp,
          risk_assessment: {
            risk_score: 85,
            threat_indicators: ['rate_limit_exceeded', 'potential_ddos'],
            recommended_action: 'block'
          },
          compliance_context: {
            gdpr_relevant: false,
            retention_period_years: 1,
            legal_hold_applied: false
          }
        });
      }

      // 2. Payload size validation
      if (payload.length > this.config.max_payload_size_mb * 1024 * 1024) {
        return await this.handleSecurityViolation({
          event_type: 'hmac_verification_failure',
          source_ip: sourceIP,
          request_id: requestId,
          timestamp,
          risk_assessment: {
            risk_score: 70,
            threat_indicators: ['oversized_payload', 'potential_dos'],
            recommended_action: 'alert'
          },
          compliance_context: {
            gdpr_relevant: false,
            retention_period_years: 7,
            legal_hold_applied: false
          }
        });
      }

      // 3. Signature format validation
      const signaturePattern = /^t=(\d+),v1=([a-f0-9]{64})$/;
      const match = signatureHeader.match(signaturePattern);

      if (!match) {
        return await this.handleSecurityViolation({
          event_type: 'hmac_verification_failure',
          source_ip: sourceIP,
          request_id: requestId,
          timestamp,
          signature_provided: signatureHeader,
          risk_assessment: {
            risk_score: 60,
            threat_indicators: ['invalid_signature_format'],
            recommended_action: 'log'
          },
          compliance_context: {
            gdpr_relevant: false,
            retention_period_years: 7,
            legal_hold_applied: false
          }
        });
      }

      const [, sigTimestamp, hash] = match;
      const tsNumber = Number(sigTimestamp);

      // 4. Timestamp validation with replay attack detection
      const currentTime = Date.now();
      const timestampDiff = Math.abs(currentTime - tsNumber);

      if (timestampDiff > this.config.timestamp_tolerance_ms) {
        const eventType = tsNumber > currentTime ? 'timestamp_manipulation' : 'replay_attack';

        return await this.handleSecurityViolation({
          event_type: eventType,
          source_ip: sourceIP,
          request_id: requestId,
          timestamp,
          signature_provided: signatureHeader,
          risk_assessment: {
            risk_score: eventType === 'timestamp_manipulation' ? 90 : 75,
            threat_indicators: [eventType, 'potential_replay'],
            recommended_action: eventType === 'timestamp_manipulation' ? 'block' : 'alert'
          },
          compliance_context: {
            gdpr_relevant: false,
            retention_period_years: 7,
            legal_hold_applied: true // High-risk security events
          }
        });
      }

      // 5. HMAC calculation and verification
      const secret = await this.getCurrentWebhookSecret();
      const expectedHash = this.calculateHMAC(payload, sigTimestamp, secret);
      const isValid = this.constantTimeCompare(hash, expectedHash);

      if (!isValid) {
        return await this.handleSecurityViolation({
          event_type: 'hmac_verification_failure',
          source_ip: sourceIP,
          request_id: requestId,
          timestamp,
          signature_provided: signatureHeader,
          payload_hash: this.hashPayload(payload),
          risk_assessment: {
            risk_score: 95, // High risk for HMAC failures
            threat_indicators: ['hmac_mismatch', 'potential_tampering'],
            recommended_action: 'block'
          },
          compliance_context: {
            gdpr_relevant: false,
            retention_period_years: 7,
            legal_hold_applied: true
          }
        });
      }

      // 6. Success - log secure verification
      await this.logSuccessfulVerification(requestId, sourceIP, timestamp);

      return {
        isValid: true,
        message: 'Signature verified successfully',
        securityContext: {
          source_ip: sourceIP,
          request_id: requestId,
          timestamp,
          risk_score: 5, // Very low risk for successful verification
          violation_logged: false
        }
      };

    } catch (error) {
      console.error(`❌ [Security] Verification error: ${requestId}`, error);

      return {
        isValid: false,
        error: 'security_violation',
        message: 'Security verification failed due to system error',
        securityContext: {
          source_ip: sourceIP,
          request_id: requestId,
          timestamp,
          risk_score: 50,
          violation_logged: true
        }
      };
    }
  }

  /**
   * Enhanced security violation handling with compliance integration
   */
  private async handleSecurityViolation(
    violationEvent: SecurityViolationEvent
  ): Promise<EnhancedWebhookVerificationResult> {

    console.warn(`⚠️ [Security] Security violation detected: ${violationEvent.event_type} from ${violationEvent.source_ip}`);

    try {
      // 1. Update threat detection cache
      if (violationEvent.source_ip && this.config.enable_threat_detection) {
        await this.updateThreatDetection(violationEvent.source_ip, violationEvent.risk_assessment.risk_score);
      }

      // 2. Log to enterprise compliance system
      if (this.config.enable_compliance_logging) {
        await enterpriseComplianceManagement.logAuditEvent({
          audit_type: 'security_event',
          source_system: 'webhook_security_manager',
          action: {
            action_type: 'security_violation_detected',
            resource_type: 'webhook_endpoint',
            resource_id: violationEvent.request_id,
            operation: 'signature_verification',
            outcome: 'failure'
          },
          compliance_relevance: {
            applicable_frameworks: ['iso27001', 'nist'],
            compliance_requirements: ['access_control', 'incident_logging'],
            retention_period_years: violationEvent.compliance_context.retention_period_years,
            legal_hold_applied: violationEvent.compliance_context.legal_hold_applied
          }
        });
      }

      // 3. Store security event in database (if available)
      if (isDatabaseAvailable()) {
        await this.storeSecurityEvent(violationEvent);
      }

      // 4. Check if request should be blocked
      const shouldBlock = this.config.block_suspicious_requests &&
                         violationEvent.risk_assessment.recommended_action === 'block';

      return {
        isValid: false,
        error: violationEvent.event_type,
        message: this.getSecurityViolationMessage(violationEvent.event_type, shouldBlock),
        securityContext: {
          source_ip: violationEvent.source_ip,
          request_id: violationEvent.request_id,
          timestamp: violationEvent.timestamp,
          risk_score: violationEvent.risk_assessment.risk_score,
          violation_logged: true
        }
      };

    } catch (loggingError) {
      console.error(`❌ [Security] Failed to log security violation:`, loggingError);

      return {
        isValid: false,
        error: 'security_violation',
        message: 'Security violation detected and logging failed',
        securityContext: {
          source_ip: violationEvent.source_ip,
          request_id: violationEvent.request_id,
          timestamp: violationEvent.timestamp,
          risk_score: violationEvent.risk_assessment.risk_score,
          violation_logged: false
        }
      };
    }
  }

  // ============================================================================
  // ENHANCED HELPER METHODS
  // ============================================================================

  /**
   * Production-safe IP extraction with comprehensive header support
   */
  private getRequestIP(req: NextRequest): string | undefined {
    // Priority order: x-forwarded-for (first IP) → x-real-ip → cf-connecting-ip → fallback
    const forwardedFor = req.headers.get('x-forwarded-for');
    if (forwardedFor) {
      const firstIP = forwardedFor.split(',')[0].trim();
      if (this.isValidIP(firstIP)) return firstIP;
    }

    const realIP = req.headers.get('x-real-ip');
    if (realIP && this.isValidIP(realIP)) return realIP;

    const cfIP = req.headers.get('cf-connecting-ip'); // Cloudflare
    if (cfIP && this.isValidIP(cfIP)) return cfIP;

    return undefined; // Graceful fallback
  }

  /**
   * Rate limiting with sliding window algorithm
   */
  private async checkRateLimit(sourceIP: string | undefined, requestId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
    if (!sourceIP || !this.config.rate_limit_per_ip) {
      return { allowed: true, current: 0, limit: this.config.rate_limit_per_ip };
    }

    const now = Date.now();
    const windowStart = now - this.config.rate_limit_window_ms;

    // Clean old entries
    for (const [ip, data] of this.rateLimitStore.entries()) {
      if (data.windowStart < windowStart) {
        this.rateLimitStore.delete(ip);
      }
    }

    // Check current IP rate
    const current = this.rateLimitStore.get(sourceIP);
    if (!current) {
      this.rateLimitStore.set(sourceIP, { count: 1, windowStart: now });
      return { allowed: true, current: 1, limit: this.config.rate_limit_per_ip };
    }

    if (current.windowStart < windowStart) {
      // Reset window
      this.rateLimitStore.set(sourceIP, { count: 1, windowStart: now });
      return { allowed: true, current: 1, limit: this.config.rate_limit_per_ip };
    }

    current.count++;
    const allowed = current.count <= this.config.rate_limit_per_ip;

    console.log(`🚦 [Security] Rate limit check for ${sourceIP}: ${current.count}/${this.config.rate_limit_per_ip} (${allowed ? 'ALLOWED' : 'BLOCKED'})`);

    return { allowed, current: current.count, limit: this.config.rate_limit_per_ip };
  }

  /**
   * Threat detection with adaptive scoring
   */
  private async updateThreatDetection(sourceIP: string, riskScore: number): Promise<void> {
    const now = Date.now();
    const existing = this.threatDetectionCache.get(sourceIP);

    if (!existing) {
      this.threatDetectionCache.set(sourceIP, {
        violations: 1,
        lastViolation: now
      });
      return;
    }

    // Increment violations and update timestamp
    existing.violations++;
    existing.lastViolation = now;

    // Alert on repeated violations
    if (existing.violations >= 5) {
      console.error(`🚨 [Security] High-risk IP detected: ${sourceIP} (${existing.violations} violations)`);

      // Could trigger additional security measures here
      await this.escalateSecurityThreat(sourceIP, existing.violations, riskScore);
    }
  }

  /**
   * Store security events in database for investigation
   */
  private async storeSecurityEvent(event: SecurityViolationEvent): Promise<void> {
    try {
      const { error } = await supabase
        .from('security_events')
        .insert({
          event_type: event.event_type,
          source_ip: event.source_ip,
          user_agent: event.user_agent,
          request_id: event.request_id,
          risk_score: event.risk_assessment.risk_score,
          threat_indicators: event.risk_assessment.threat_indicators,
          signature_provided: event.signature_provided,
          payload_hash: event.payload_hash,
          created_at: event.timestamp
        });

      if (error) {
        console.error('❌ [Security] Failed to store security event:', error);
      } else {
        console.log(`📋 [Security] Security event stored: ${event.request_id}`);
      }
    } catch (error) {
      console.error('❌ [Security] Database error storing security event:', error);
    }
  }

  /**
   * Log successful verification for audit trails
   */
  private async logSuccessfulVerification(requestId: string, sourceIP: string | undefined, timestamp: string): Promise<void> {
    if (this.config.enable_compliance_logging) {
      await enterpriseComplianceManagement.logAuditEvent({
        audit_type: 'access_event',
        source_system: 'webhook_security_manager',
        action: {
          action_type: 'webhook_signature_verified',
          resource_type: 'webhook_endpoint',
          resource_id: requestId,
          operation: 'signature_verification',
          outcome: 'success'
        },
        compliance_relevance: {
          applicable_frameworks: ['iso27001'],
          compliance_requirements: ['access_logging'],
          retention_period_years: 1,
          legal_hold_applied: false
        }
      });
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private async getCurrentWebhookSecret(): Promise<string> {
    const secret = process.env.OPAL_WEBHOOK_HMAC_SECRET || process.env.WEBHOOK_SECRET;
    if (!secret) {
      throw new Error('Webhook secret not configured');
    }
    return secret;
  }

  private calculateHMAC(payload: Buffer, timestamp: string, secret: string): string {
    const signedPayload = timestamp + '.' + payload.toString();
    return crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
  }

  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  private hashPayload(payload: Buffer): string {
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  private isValidIP(ip: string): boolean {
    // Simple IP validation - could be enhanced with more comprehensive checks
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  private getSecurityViolationMessage(eventType: SecurityViolationEvent['event_type'], blocked: boolean): string {
    const messages = {
      'hmac_verification_failure': 'HMAC signature verification failed',
      'timestamp_manipulation': 'Request timestamp indicates potential manipulation',
      'replay_attack': 'Request timestamp suggests potential replay attack',
      'rate_limit_exceeded': 'Rate limit exceeded for source IP'
    };

    const baseMessage = messages[eventType] || 'Security violation detected';
    return blocked ? `${baseMessage} - Request blocked` : baseMessage;
  }

  private async escalateSecurityThreat(sourceIP: string, violationCount: number, riskScore: number): Promise<void> {
    // In production, this could trigger additional security measures:
    // - Add IP to temporary block list
    // - Send alerts to security team
    // - Integrate with external threat intelligence

    console.warn(`🚨 [Security] Escalating security threat from ${sourceIP}: ${violationCount} violations, risk score: ${riskScore}`);
  }

  /**
   * Get security statistics for monitoring
   */
  public getSecurityStatistics(): {
    active_rate_limits: number;
    threat_ips_tracked: number;
    config: WebhookSecurityConfig;
  } {
    return {
      active_rate_limits: this.rateLimitStore.size,
      threat_ips_tracked: this.threatDetectionCache.size,
      config: { ...this.config }
    };
  }
}

// Export singleton instance
export const enhancedWebhookSecurity = new EnhancedWebhookSecurityManager();