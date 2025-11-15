// Phase 3: Enhanced Webhook Security and Authentication System
// Provides HMAC validation, rate limiting, and cross-page security coordination

import crypto from 'crypto';
import { supabase, isDatabaseAvailable } from '@/lib/database/supabase-client';
import { intelligentCache } from '@/lib/cache/intelligent-cache-system';

export interface WebhookSecurityConfig {
  hmac_secret: string;
  rate_limit: {
    max_requests_per_minute: number;
    max_requests_per_hour: number;
    burst_limit: number;
  };
  allowed_sources: string[];
  signature_algorithms: string[];
  max_payload_size: number;
  timeout_ms: number;
}

export interface WebhookValidationResult {
  valid: boolean;
  reason?: string;
  security_score: number;
  rate_limit_remaining: number;
  details: {
    signature_valid: boolean;
    source_allowed: boolean;
    rate_limit_ok: boolean;
    payload_size_ok: boolean;
    timestamp_valid: boolean;
  };
}

export interface WebhookSecurityEvent {
  event_id: string;
  timestamp: string;
  source_ip: string;
  user_agent: string;
  event_type: 'validation_success' | 'validation_failure' | 'rate_limit_exceeded' | 'security_violation';
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Enhanced Webhook Security System for Phase 3
 *
 * Features:
 * - HMAC signature validation with multiple algorithm support
 * - Advanced rate limiting with burst detection
 * - Cross-page webhook coordination
 * - Real-time security monitoring
 * - Integration with intelligent cache for security events
 */
export class WebhookSecuritySystem {
  private config: WebhookSecurityConfig;
  private rateLimitStore = new Map<string, any>();
  private securityEvents: WebhookSecurityEvent[] = [];

  constructor(config?: Partial<WebhookSecurityConfig>) {
    this.config = {
      hmac_secret: process.env.OSA_WEBHOOK_SHARED_SECRET || process.env.OSA_WEBHOOK_SECRET || 'default-secret-change-in-production',
      rate_limit: {
        max_requests_per_minute: 60,
        max_requests_per_hour: 1000,
        burst_limit: 10
      },
      allowed_sources: ['*'], // Configure based on your OPAL/OSA setup
      signature_algorithms: ['sha256', 'sha1'],
      max_payload_size: 1024 * 1024, // 1MB
      timeout_ms: 30000,
      ...config
    };

    console.log(`🔐 [WebhookSec] Security system initialized with HMAC and rate limiting`);
  }

  /**
   * Comprehensive webhook validation with security scoring
   */
  async validateWebhook(
    payload: string,
    headers: Record<string, string>,
    clientInfo: {
      ip: string;
      userAgent: string;
      timestamp: number;
    }
  ): Promise<WebhookValidationResult> {
    const validationStart = Date.now();
    const eventId = crypto.randomUUID();

    console.log(`🔍 [WebhookSec] Validating webhook ${eventId} from ${clientInfo.ip}`);

    try {
      // Initialize validation result
      const validation: WebhookValidationResult = {
        valid: false,
        security_score: 0,
        rate_limit_remaining: 0,
        details: {
          signature_valid: false,
          source_allowed: false,
          rate_limit_ok: false,
          payload_size_ok: false,
          timestamp_valid: false
        }
      };

      // 1. Payload size validation
      validation.details.payload_size_ok = payload.length <= this.config.max_payload_size;
      if (!validation.details.payload_size_ok) {
        await this.logSecurityEvent({
          event_id: eventId,
          timestamp: new Date().toISOString(),
          source_ip: clientInfo.ip,
          user_agent: clientInfo.userAgent,
          event_type: 'security_violation',
          details: { reason: 'payload_too_large', size: payload.length, max_size: this.config.max_payload_size },
          severity: 'high'
        });

        return {
          ...validation,
          reason: `Payload size ${payload.length} exceeds maximum ${this.config.max_payload_size} bytes`
        };
      }

      // 2. Timestamp validation (prevent replay attacks)
      const timestampTolerance = 300000; // 5 minutes
      const currentTime = Date.now();
      validation.details.timestamp_valid = Math.abs(currentTime - clientInfo.timestamp) < timestampTolerance;

      // 3. Rate limiting validation
      const rateLimitResult = await this.checkRateLimit(clientInfo.ip);
      validation.details.rate_limit_ok = rateLimitResult.allowed;
      validation.rate_limit_remaining = rateLimitResult.remaining;

      if (!rateLimitResult.allowed) {
        await this.logSecurityEvent({
          event_id: eventId,
          timestamp: new Date().toISOString(),
          source_ip: clientInfo.ip,
          user_agent: clientInfo.userAgent,
          event_type: 'rate_limit_exceeded',
          details: { limit_type: rateLimitResult.limit_type, current_count: rateLimitResult.current_count },
          severity: 'medium'
        });

        return {
          ...validation,
          reason: `Rate limit exceeded: ${rateLimitResult.limit_type} (${rateLimitResult.current_count} requests)`
        };
      }

      // 4. Source IP validation (if configured)
      validation.details.source_allowed = this.validateSourceIP(clientInfo.ip);
      if (!validation.details.source_allowed) {
        await this.logSecurityEvent({
          event_id: eventId,
          timestamp: new Date().toISOString(),
          source_ip: clientInfo.ip,
          user_agent: clientInfo.userAgent,
          event_type: 'security_violation',
          details: { reason: 'source_not_allowed', allowed_sources: this.config.allowed_sources },
          severity: 'high'
        });

        return {
          ...validation,
          reason: `Source IP ${clientInfo.ip} not in allowed sources list`
        };
      }

      // 5. HMAC signature validation
      const signatureResult = await this.validateHMACSignature(payload, headers);
      validation.details.signature_valid = signatureResult.valid;

      if (!signatureResult.valid) {
        await this.logSecurityEvent({
          event_id: eventId,
          timestamp: new Date().toISOString(),
          source_ip: clientInfo.ip,
          user_agent: clientInfo.userAgent,
          event_type: 'validation_failure',
          details: { reason: 'invalid_signature', signature_details: signatureResult.details },
          severity: 'critical'
        });

        return {
          ...validation,
          reason: `Invalid HMAC signature: ${signatureResult.reason}`
        };
      }

      // 6. Calculate security score
      validation.security_score = this.calculateSecurityScore(validation.details);

      // 7. Final validation
      validation.valid = Object.values(validation.details).every(check => check === true);

      // Log successful validation
      if (validation.valid) {
        await this.logSecurityEvent({
          event_id: eventId,
          timestamp: new Date().toISOString(),
          source_ip: clientInfo.ip,
          user_agent: clientInfo.userAgent,
          event_type: 'validation_success',
          details: {
            security_score: validation.security_score,
            validation_time_ms: Date.now() - validationStart,
            payload_size: payload.length
          },
          severity: 'low'
        });

        console.log(`✅ [WebhookSec] Webhook ${eventId} validated successfully (score: ${validation.security_score})`);
      }

      return validation;

    } catch (error) {
      console.error(`❌ [WebhookSec] Validation error for ${eventId}:`, error);

      await this.logSecurityEvent({
        event_id: eventId,
        timestamp: new Date().toISOString(),
        source_ip: clientInfo.ip,
        user_agent: clientInfo.userAgent,
        event_type: 'security_violation',
        details: { reason: 'validation_error', error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'critical'
      });

      return {
        valid: false,
        reason: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        security_score: 0,
        rate_limit_remaining: 0,
        details: {
          signature_valid: false,
          source_allowed: false,
          rate_limit_ok: false,
          payload_size_ok: false,
          timestamp_valid: false
        }
      };
    }
  }

  /**
   * HMAC signature validation with multiple algorithm support
   */
  private async validateHMACSignature(
    payload: string,
    headers: Record<string, string>
  ): Promise<{ valid: boolean; reason?: string; details?: any }> {
    try {
      // Extract signature from headers (support multiple header formats)
      const signature = headers['x-hub-signature-256'] ||
                       headers['x-signature-256'] ||
                       headers['x-hub-signature'] ||
                       headers['x-signature'] ||
                       headers['signature'];

      if (!signature) {
        return {
          valid: false,
          reason: 'No signature header found',
          details: { available_headers: Object.keys(headers) }
        };
      }

      // Parse signature format (e.g., "sha256=abc123" or "sha1=def456")
      const [algorithm, hash] = signature.split('=');
      if (!algorithm || !hash) {
        return {
          valid: false,
          reason: 'Invalid signature format',
          details: { signature_format: signature }
        };
      }

      // Validate algorithm
      if (!this.config.signature_algorithms.includes(algorithm)) {
        return {
          valid: false,
          reason: `Unsupported signature algorithm: ${algorithm}`,
          details: { supported_algorithms: this.config.signature_algorithms }
        };
      }

      // Calculate expected signature
      const expectedSignature = crypto
        .createHmac(algorithm, this.config.hmac_secret)
        .update(payload, 'utf8')
        .digest('hex');

      // Constant-time comparison to prevent timing attacks
      const valid = crypto.timingSafeEqual(
        Buffer.from(hash, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

      return {
        valid,
        details: {
          algorithm,
          signature_length: hash.length,
          expected_length: expectedSignature.length
        }
      };

    } catch (error) {
      return {
        valid: false,
        reason: `HMAC validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      };
    }
  }

  /**
   * Advanced rate limiting with burst detection
   */
  private async checkRateLimit(clientIP: string): Promise<{
    allowed: boolean;
    remaining: number;
    limit_type?: string;
    current_count?: number;
  }> {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const hour = Math.floor(now / 3600000);

    const minuteKey = `${clientIP}:${minute}`;
    const hourKey = `${clientIP}:${hour}`;
    const burstKey = `${clientIP}:burst`;

    // Get current counts
    const minuteCount = this.rateLimitStore.get(minuteKey) || 0;
    const hourCount = this.rateLimitStore.get(hourKey) || 0;
    const burstData = this.rateLimitStore.get(burstKey) || { count: 0, window_start: now };

    // Check burst limit (10 requests in 10 seconds)
    if (now - burstData.window_start > 10000) {
      // Reset burst window
      burstData.count = 0;
      burstData.window_start = now;
    }

    if (burstData.count >= this.config.rate_limit.burst_limit) {
      return {
        allowed: false,
        remaining: 0,
        limit_type: 'burst',
        current_count: burstData.count
      };
    }

    // Check minute limit
    if (minuteCount >= this.config.rate_limit.max_requests_per_minute) {
      return {
        allowed: false,
        remaining: 0,
        limit_type: 'per_minute',
        current_count: minuteCount
      };
    }

    // Check hour limit
    if (hourCount >= this.config.rate_limit.max_requests_per_hour) {
      return {
        allowed: false,
        remaining: 0,
        limit_type: 'per_hour',
        current_count: hourCount
      };
    }

    // Update counters
    this.rateLimitStore.set(minuteKey, minuteCount + 1);
    this.rateLimitStore.set(hourKey, hourCount + 1);
    burstData.count++;
    this.rateLimitStore.set(burstKey, burstData);

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      this.cleanupRateLimitStore();
    }

    return {
      allowed: true,
      remaining: Math.min(
        this.config.rate_limit.max_requests_per_minute - (minuteCount + 1),
        this.config.rate_limit.max_requests_per_hour - (hourCount + 1),
        this.config.rate_limit.burst_limit - burstData.count
      )
    };
  }

  /**
   * Validate source IP against allowed list
   */
  private validateSourceIP(clientIP: string): boolean {
    // If no restrictions configured, allow all
    if (this.config.allowed_sources.includes('*')) {
      return true;
    }

    // Check exact matches and CIDR ranges
    for (const allowedSource of this.config.allowed_sources) {
      if (allowedSource === clientIP) {
        return true;
      }

      // Basic CIDR support (you might want to use a library for full CIDR support)
      if (allowedSource.includes('/')) {
        // Simplified CIDR check - implement full CIDR logic as needed
        const [network, mask] = allowedSource.split('/');
        if (clientIP.startsWith(network.split('.').slice(0, parseInt(mask) / 8).join('.'))) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Calculate security score based on validation results
   */
  private calculateSecurityScore(details: WebhookValidationResult['details']): number {
    let score = 0;

    if (details.signature_valid) score += 40;
    if (details.source_allowed) score += 20;
    if (details.rate_limit_ok) score += 15;
    if (details.payload_size_ok) score += 15;
    if (details.timestamp_valid) score += 10;

    return score;
  }

  /**
   * Log security events for monitoring and analysis
   */
  private async logSecurityEvent(event: WebhookSecurityEvent): Promise<void> {
    // Store in memory for immediate access
    this.securityEvents.push(event);

    // Keep only last 1000 events in memory
    if (this.securityEvents.length > 1000) {
      this.securityEvents.shift();
    }

    // Store in database if available
    if (isDatabaseAvailable()) {
      try {
        await supabase.from('webhook_security_events').insert({
          event_id: event.event_id,
          timestamp: event.timestamp,
          source_ip: event.source_ip,
          user_agent: event.user_agent,
          event_type: event.event_type,
          event_details: event.details,
          severity: event.severity
        });
      } catch (error) {
        console.warn(`⚠️ [WebhookSec] Failed to log security event to database:`, error);
      }
    }

    // Trigger cache invalidation for critical events
    if (event.severity === 'critical' || event.event_type === 'security_violation') {
      console.warn(`🚨 [WebhookSec] Critical security event: ${event.event_type} from ${event.source_ip}`);

      // You might want to trigger additional security measures here
      // such as temporary IP blocking or alerting
    }
  }

  /**
   * Clean up old rate limiting entries
   */
  private cleanupRateLimitStore(): void {
    const now = Date.now();
    const hourAgo = Math.floor((now - 3600000) / 3600000);
    const minuteAgo = Math.floor((now - 60000) / 60000);

    for (const [key, value] of this.rateLimitStore.entries()) {
      if (key.includes(':burst')) {
        const burstData = value as { count: number; window_start: number };
        if (now - burstData.window_start > 10000) {
          this.rateLimitStore.delete(key);
        }
      } else if (key.includes(`:${hourAgo}`) || key.includes(`:${minuteAgo}`)) {
        this.rateLimitStore.delete(key);
      }
    }

    console.log(`🧹 [WebhookSec] Cleaned up rate limit store, ${this.rateLimitStore.size} entries remaining`);
  }

  /**
   * Get security statistics for monitoring
   */
  getSecurityStatistics(): {
    total_events: number;
    events_by_type: Record<string, number>;
    events_by_severity: Record<string, number>;
    recent_events: WebhookSecurityEvent[];
    rate_limit_store_size: number;
    active_ips: string[];
  } {
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const activeIPs = new Set<string>();

    this.securityEvents.forEach(event => {
      eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      activeIPs.add(event.source_ip);
    });

    return {
      total_events: this.securityEvents.length,
      events_by_type: eventsByType,
      events_by_severity: eventsBySeverity,
      recent_events: this.securityEvents.slice(-10),
      rate_limit_store_size: this.rateLimitStore.size,
      active_ips: Array.from(activeIPs)
    };
  }

  /**
   * Reset security counters (for testing/maintenance)
   */
  resetSecurityCounters(): void {
    this.rateLimitStore.clear();
    this.securityEvents.length = 0;
    console.log(`🔄 [WebhookSec] Security counters reset`);
  }
}

// Export singleton instance
export const webhookSecurity = new WebhookSecuritySystem();