/**
 * Webhook Security Validation
 *
 * Comprehensive HMAC signature validation and Bearer token authentication
 * for OPAL webhook integrations with detailed failure logging.
 */

import crypto from 'crypto';

export interface WebhookValidationResult {
  valid: boolean;
  method: 'bearer' | 'hmac' | 'none';
  error_message?: string;
  validation_details: {
    bearer_token_present: boolean;
    bearer_token_valid?: boolean;
    hmac_signature_present: boolean;
    hmac_signature_valid?: boolean;
    timestamp_valid?: boolean;
    request_timestamp?: string;
  };
}

export interface WebhookRequest {
  headers: Headers | Record<string, string>;
  body: string | Buffer;
  method: string;
  url: string;
}

export class WebhookSecurityValidator {
  private bearerTokens: Set<string>;
  private hmacSecrets: Map<string, string>;
  private maxTimestampAge: number;

  constructor() {
    // Initialize valid bearer tokens
    this.bearerTokens = new Set();
    if (process.env.OPAL_WEBHOOK_AUTH_KEY) {
      this.bearerTokens.add(process.env.OPAL_WEBHOOK_AUTH_KEY);
    }
    if (process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY) {
      this.bearerTokens.add(process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY);
    }

    // Initialize HMAC secrets
    this.hmacSecrets = new Map();
    if (process.env.OPAL_WEBHOOK_HMAC_SECRET) {
      this.hmacSecrets.set('opal', process.env.OPAL_WEBHOOK_HMAC_SECRET);
    }

    // Maximum age for timestamp validation (5 minutes)
    this.maxTimestampAge = 5 * 60 * 1000;
  }

  /**
   * Validates webhook request using Bearer token or HMAC signature
   */
  async validateWebhookRequest(
    request: WebhookRequest,
    source: 'force_sync' | 'custom_tools' | 'manual' = 'manual'
  ): Promise<WebhookValidationResult> {
    const startTime = Date.now();
    const headers = this.normalizeHeaders(request.headers);

    console.log(`🔐 [Webhook Security] Validating webhook request from ${source}`, {
      method: request.method,
      url: request.url,
      bearer_present: !!headers.authorization,
      hmac_present: !!(headers['x-webhook-signature'] || headers['x-hub-signature-256']),
      timestamp_present: !!headers['x-timestamp']
    });

    const validationResult: WebhookValidationResult = {
      valid: false,
      method: 'none',
      validation_details: {
        bearer_token_present: false,
        hmac_signature_present: false
      }
    };

    try {
      // 1. Check Bearer token authentication
      if (headers.authorization) {
        const bearerResult = await this.validateBearerToken(headers.authorization);
        validationResult.validation_details.bearer_token_present = true;
        validationResult.validation_details.bearer_token_valid = bearerResult.valid;

        if (bearerResult.valid) {
          validationResult.valid = true;
          validationResult.method = 'bearer';

          console.log(`✅ [Webhook Security] Bearer token validation passed (${Date.now() - startTime}ms)`);

          // Log successful validation attempt
          this.logValidationAttempt(request, validationResult, source, Date.now() - startTime);

          return validationResult;
        } else {
          console.warn(`⚠️ [Webhook Security] Bearer token validation failed: ${bearerResult.error}`);
          validationResult.error_message = bearerResult.error;
        }
      }

      // 2. Check HMAC signature authentication
      const hmacSignature = headers['x-webhook-signature'] || headers['x-hub-signature-256'];
      if (hmacSignature) {
        const hmacResult = await this.validateHMACSignature(
          hmacSignature,
          request.body,
          headers['x-timestamp']
        );

        validationResult.validation_details.hmac_signature_present = true;
        validationResult.validation_details.hmac_signature_valid = hmacResult.valid;
        validationResult.validation_details.timestamp_valid = hmacResult.timestampValid;
        validationResult.validation_details.request_timestamp = headers['x-timestamp'];

        if (hmacResult.valid) {
          validationResult.valid = true;
          validationResult.method = 'hmac';

          console.log(`✅ [Webhook Security] HMAC signature validation passed (${Date.now() - startTime}ms)`);

          // Log successful validation attempt
          this.logValidationAttempt(request, validationResult, source, Date.now() - startTime);

          return validationResult;
        } else {
          console.warn(`⚠️ [Webhook Security] HMAC signature validation failed: ${hmacResult.error}`);
          validationResult.error_message = hmacResult.error;
        }
      }

      // 3. No valid authentication found
      console.error(`❌ [Webhook Security] No valid authentication method found (${Date.now() - startTime}ms)`, {
        bearer_token_present: validationResult.validation_details.bearer_token_present,
        hmac_signature_present: validationResult.validation_details.hmac_signature_present
      });

      validationResult.error_message = 'No valid Bearer token or HMAC signature provided';

      // Log failed validation attempt
      this.logValidationAttempt(request, validationResult, source, Date.now() - startTime);

      return validationResult;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';

      console.error(`💥 [Webhook Security] Validation exception (${duration}ms):`, errorMessage);

      validationResult.error_message = `Validation error: ${errorMessage}`;

      // Log validation exception
      this.logValidationAttempt(request, validationResult, source, duration);

      return validationResult;
    }
  }

  /**
   * Validates Bearer token
   */
  private async validateBearerToken(authHeader: string): Promise<{ valid: boolean; error?: string }> {
    if (!authHeader.startsWith('Bearer ')) {
      return { valid: false, error: 'Authorization header must start with "Bearer "' };
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return { valid: false, error: 'Bearer token is empty' };
    }

    if (token.length < 16) {
      return { valid: false, error: 'Bearer token is too short (minimum 16 characters)' };
    }

    if (this.bearerTokens.has(token)) {
      return { valid: true };
    }

    // Check against development fallback tokens
    const developmentTokens = [
      'dev-fallback-key',
      'opal-workflow-webhook-secret-2025'
    ];

    if (process.env.NODE_ENV === 'development' && developmentTokens.includes(token)) {
      console.log('🧪 [Webhook Security] Using development fallback token');
      return { valid: true };
    }

    return { valid: false, error: 'Bearer token not recognized' };
  }

  /**
   * Validates HMAC signature
   */
  private async validateHMACSignature(
    signature: string,
    body: string | Buffer,
    timestamp?: string
  ): Promise<{ valid: boolean; timestampValid: boolean; error?: string }> {
    // Validate timestamp if provided
    let timestampValid = true;
    if (timestamp) {
      const timestampMs = parseInt(timestamp) * 1000; // Assume seconds, convert to ms
      const age = Date.now() - timestampMs;

      if (age > this.maxTimestampAge) {
        timestampValid = false;
        return {
          valid: false,
          timestampValid: false,
          error: `Request timestamp is too old (${Math.round(age / 1000)}s > ${this.maxTimestampAge / 1000}s)`
        };
      }
    }

    // Extract signature format
    let algorithm = 'sha256';
    let providedSignature = signature;

    if (signature.startsWith('sha256=')) {
      providedSignature = signature.substring(7);
    } else if (signature.startsWith('sha1=')) {
      algorithm = 'sha1';
      providedSignature = signature.substring(5);
    }

    // Try each configured HMAC secret
    for (const [secretName, secret] of this.hmacSecrets.entries()) {
      try {
        const payload = timestamp ? `${timestamp}.${body}` : body;
        const expectedSignature = crypto
          .createHmac(algorithm, secret)
          .update(payload, 'utf8')
          .digest('hex');

        if (crypto.timingSafeEqual(
          Buffer.from(providedSignature, 'hex'),
          Buffer.from(expectedSignature, 'hex')
        )) {
          console.log(`✅ [Webhook Security] HMAC signature valid with secret: ${secretName}`);
          return { valid: true, timestampValid };
        }
      } catch (error) {
        console.error(`❌ [Webhook Security] HMAC validation error with secret ${secretName}:`, error);
      }
    }

    return {
      valid: false,
      timestampValid,
      error: 'HMAC signature does not match any configured secrets'
    };
  }

  /**
   * Normalizes headers to lowercase for consistent access
   */
  private normalizeHeaders(headers: Headers | Record<string, string>): Record<string, string> {
    const normalized: Record<string, string> = {};

    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        normalized[key.toLowerCase()] = value;
      });
    } else {
      Object.entries(headers).forEach(([key, value]) => {
        normalized[key.toLowerCase()] = value;
      });
    }

    return normalized;
  }

  /**
   * Logs validation attempt for diagnostics
   */
  private logValidationAttempt(
    request: WebhookRequest,
    result: WebhookValidationResult,
    source: 'force_sync' | 'custom_tools' | 'manual',
    duration: number
  ): void {
    try {
      const headers = this.normalizeHeaders(request.headers);

      // Log validation attempt details to console for now
      console.log(`📊 [Webhook Security] Validation attempt logged`, {
        url: request.url,
        method: request.method,
        payload_size_bytes: typeof request.body === 'string'
          ? Buffer.byteLength(request.body, 'utf8')
          : request.body.length,
        response_time_ms: duration,
        success: result.valid,
        error_message: result.error_message,
        source,
        auth_method: result.method,
        validation_result: result.valid ? 'success' : 'failure'
      });
    } catch (error) {
      console.error('❌ [Webhook Security] Failed to log validation attempt:', error);
    }
  }

  /**
   * Masks sensitive information in headers
   */
  private maskSensitiveHeaders(headers: Record<string, string>): Record<string, string> {
    const masked = { ...headers };

    if (masked.authorization) {
      masked.authorization = `Bearer ${masked.authorization.substring(7, 15)}...`;
    }

    Object.keys(masked).forEach(key => {
      if (key.includes('secret') || key.includes('signature') || key.includes('token')) {
        masked[key] = `${masked[key].substring(0, 8)}...`;
      }
    });

    return masked;
  }

  /**
   * Gets validation configuration status
   */
  getValidationStatus(): {
    bearer_tokens_configured: number;
    hmac_secrets_configured: number;
    max_timestamp_age_seconds: number;
    validation_methods_available: string[];
  } {
    return {
      bearer_tokens_configured: this.bearerTokens.size,
      hmac_secrets_configured: this.hmacSecrets.size,
      max_timestamp_age_seconds: this.maxTimestampAge / 1000,
      validation_methods_available: [
        ...(this.bearerTokens.size > 0 ? ['bearer'] : []),
        ...(this.hmacSecrets.size > 0 ? ['hmac'] : [])
      ]
    };
  }
}

// Global validator instance
export const webhookValidator = new WebhookSecurityValidator();