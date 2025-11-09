import crypto from 'crypto';

/**
 * Secure Webhook Authentication Module
 * Handles OPAL webhook authentication with HMAC-SHA256 signature verification
 */

export interface WebhookAuthConfig {
  authToken: string;
  hmacSecret?: string;
  allowedIPs?: string[];
  maxAge?: number; // Maximum age of timestamp in seconds (default: 300 = 5 minutes)
}

export interface WebhookValidationResult {
  valid: boolean;
  error?: string;
  details?: {
    method: 'bearer' | 'hmac';
    tokenMatch?: boolean;
    signatureValid?: boolean;
    timestampValid?: boolean;
    ipAllowed?: boolean;
  };
}

/**
 * Validates OPAL webhook authentication
 * Supports both Bearer token and HMAC-SHA256 signature verification
 */
export function validateWebhookAuth(
  request: {
    headers: { get: (name: string) => string | null };
    body?: string;
    ip?: string;
  },
  config: WebhookAuthConfig
): WebhookValidationResult {
  const authHeader = request.headers.get('authorization');
  const signature = request.headers.get('x-webhook-signature');
  const timestamp = request.headers.get('x-webhook-timestamp');
  const clientIP = request.ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');

  // Check IP whitelist if configured
  if (config.allowedIPs && config.allowedIPs.length > 0) {
    if (!clientIP || !config.allowedIPs.includes(clientIP)) {
      return {
        valid: false,
        error: 'IP address not allowed',
        details: { method: 'bearer', ipAllowed: false }
      };
    }
  }

  // Validate required auth token is configured
  if (!config.authToken || config.authToken.length < 32) {
    return {
      valid: false,
      error: 'Webhook authentication not properly configured - token must be at least 32 characters'
    };
  }

  // Try HMAC verification first if signature and secret are present
  if (signature && config.hmacSecret && request.body) {
    return validateHMACSignature(request.body, signature, timestamp, config);
  }

  // Fallback to Bearer token validation
  if (authHeader) {
    return validateBearerToken(authHeader, config.authToken);
  }

  return {
    valid: false,
    error: 'No authentication method provided (Bearer token or HMAC signature required)'
  };
}

/**
 * Validates Bearer token authentication
 */
function validateBearerToken(authHeader: string, expectedToken: string): WebhookValidationResult {
  if (!authHeader.startsWith('Bearer ')) {
    return {
      valid: false,
      error: 'Invalid authorization header format (must start with "Bearer ")',
      details: { method: 'bearer', tokenMatch: false }
    };
  }

  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    return {
      valid: false,
      error: 'Empty Bearer token',
      details: { method: 'bearer', tokenMatch: false }
    };
  }

  // Use timing-safe comparison to prevent timing attacks
  const tokenMatch = crypto.timingSafeEqual(
    Buffer.from(token, 'utf8'),
    Buffer.from(expectedToken, 'utf8')
  );

  if (!tokenMatch) {
    return {
      valid: false,
      error: 'Invalid Bearer token',
      details: { method: 'bearer', tokenMatch: false }
    };
  }

  return {
    valid: true,
    details: { method: 'bearer', tokenMatch: true }
  };
}

/**
 * Validates HMAC-SHA256 signature
 * Expected header format: "sha256=<hex_signature>"
 */
function validateHMACSignature(
  body: string,
  signature: string,
  timestamp: string | null,
  config: WebhookAuthConfig
): WebhookValidationResult {
  if (!config.hmacSecret) {
    return {
      valid: false,
      error: 'HMAC secret not configured',
      details: { method: 'hmac', signatureValid: false }
    };
  }

  // Validate timestamp if provided (prevents replay attacks)
  const maxAge = config.maxAge || 300; // 5 minutes default
  const timestampValid = validateTimestamp(timestamp, maxAge);

  if (!timestampValid) {
    return {
      valid: false,
      error: `Invalid or expired timestamp (max age: ${maxAge} seconds)`,
      details: { method: 'hmac', timestampValid: false }
    };
  }

  // Parse signature header
  if (!signature.startsWith('sha256=')) {
    return {
      valid: false,
      error: 'Invalid signature format (must start with "sha256=")',
      details: { method: 'hmac', signatureValid: false }
    };
  }

  const providedSignature = signature.replace('sha256=', '');

  // Create payload for signature verification
  // Include timestamp if provided for replay attack prevention
  const payload = timestamp ? `${timestamp}.${body}` : body;

  // Calculate expected signature
  const expectedSignature = crypto
    .createHmac('sha256', config.hmacSecret)
    .update(payload, 'utf8')
    .digest('hex');

  // Use timing-safe comparison
  let signatureValid = false;
  try {
    signatureValid = crypto.timingSafeEqual(
      Buffer.from(providedSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid signature format',
      details: { method: 'hmac', signatureValid: false }
    };
  }

  if (!signatureValid) {
    return {
      valid: false,
      error: 'Invalid HMAC signature',
      details: { method: 'hmac', signatureValid: false, timestampValid }
    };
  }

  return {
    valid: true,
    details: { method: 'hmac', signatureValid: true, timestampValid }
  };
}

/**
 * Validates timestamp to prevent replay attacks
 */
function validateTimestamp(timestamp: string | null, maxAgeSeconds: number): boolean {
  if (!timestamp) {
    return true; // Timestamp is optional
  }

  const timestampNum = parseInt(timestamp, 10);
  if (isNaN(timestampNum)) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  const age = now - timestampNum;

  return age >= 0 && age <= maxAgeSeconds;
}

/**
 * Generates a secure webhook token for configuration
 */
export function generateWebhookToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Creates HMAC signature for outgoing webhooks
 */
export function createWebhookSignature(payload: string, secret: string, timestamp?: number): {
  signature: string;
  timestamp: string;
} {
  const ts = timestamp || Math.floor(Date.now() / 1000);
  const signaturePayload = `${ts}.${payload}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(signaturePayload, 'utf8')
    .digest('hex');

  return {
    signature: `sha256=${signature}`,
    timestamp: ts.toString()
  };
}

/**
 * Validates environment variables for webhook authentication
 */
export function validateWebhookConfig(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const authToken = process.env.OPAL_WEBHOOK_AUTH_KEY;
  const hmacSecret = process.env.OPAL_WEBHOOK_HMAC_SECRET;

  if (!authToken) {
    errors.push('OPAL_WEBHOOK_AUTH_KEY environment variable is required');
  } else if (authToken.length < 32) {
    errors.push('OPAL_WEBHOOK_AUTH_KEY must be at least 32 characters long');
  } else if (authToken === 'opal-workflow-webhook-secret-2025') {
    errors.push('OPAL_WEBHOOK_AUTH_KEY is using default/example value - change to a secure random token');
  }

  if (!hmacSecret) {
    warnings.push('OPAL_WEBHOOK_HMAC_SECRET not configured - HMAC signature verification unavailable');
  } else if (hmacSecret.length < 32) {
    warnings.push('OPAL_WEBHOOK_HMAC_SECRET should be at least 32 characters for security');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}