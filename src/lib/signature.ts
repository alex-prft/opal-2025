/**
 * HMAC Signature Verification for OSA Webhooks
 *
 * Provides secure webhook payload verification using HMAC-SHA256
 * with timing-safe comparison and comprehensive security logging.
 */

import crypto from 'crypto';
import { getConfig } from './config';
import { createLogger } from './logger';

const logger = createLogger('signature-verification');

export interface SignatureVerificationResult {
  valid: boolean;
  error?: string;
  timestamp?: number;
  computedSignature?: string;
  providedSignature?: string;
  details: {
    hasSignatureHeader: boolean;
    hasTimestampHeader: boolean;
    signatureFormat: 'valid' | 'invalid' | 'missing';
    timestampValid?: boolean;
    timeDifference?: number;
  };
}

/**
 * Verifies HMAC signature for webhook payloads
 */
export class SignatureVerifier {
  private readonly secret: string;
  private readonly maxTimestampAge: number;

  constructor(secret?: string, maxTimestampAge = 300000) { // 5 minutes default
    this.secret = secret || getConfig().security.hmacSecret;
    this.maxTimestampAge = maxTimestampAge;
  }

  /**
   * Verify webhook signature with comprehensive security checks
   */
  public verifySignature(
    payload: string | Buffer,
    providedSignature: string,
    timestamp?: string
  ): SignatureVerificationResult {
    const result: SignatureVerificationResult = {
      valid: false,
      details: {
        hasSignatureHeader: !!providedSignature,
        hasTimestampHeader: !!timestamp,
        signatureFormat: 'missing',
      },
    };

    try {
      // Check if signature header exists
      if (!providedSignature) {
        result.error = 'Missing X-OSA-Signature header';
        logger.warn('Webhook signature verification failed: missing signature header');
        return result;
      }

      // Parse signature format (expecting: sha256=<hex>)
      const signatureMatch = providedSignature.match(/^sha256=([a-f0-9]{64})$/);
      if (!signatureMatch) {
        result.details.signatureFormat = 'invalid';
        result.error = 'Invalid signature format. Expected: sha256=<hex>';
        logger.warn('Webhook signature verification failed: invalid signature format', {
          providedSignature: providedSignature.substring(0, 20) + '...',
        });
        return result;
      }

      result.details.signatureFormat = 'valid';
      const extractedSignature = signatureMatch[1];
      result.providedSignature = extractedSignature;

      // Verify timestamp if provided
      if (timestamp) {
        const timestampNum = parseInt(timestamp, 10);
        const currentTime = Date.now();
        const timeDifference = Math.abs(currentTime - timestampNum * 1000);

        result.timestamp = timestampNum;
        result.details.timeDifference = timeDifference;
        result.details.timestampValid = timeDifference <= this.maxTimestampAge;

        if (timeDifference > this.maxTimestampAge) {
          result.error = `Timestamp too old. Age: ${timeDifference}ms, Max: ${this.maxTimestampAge}ms`;
          logger.warn('Webhook signature verification failed: timestamp too old', {
            timestampAge: timeDifference,
            maxAge: this.maxTimestampAge,
          });
          return result;
        }
      }

      // Compute expected signature
      const payloadBuffer = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');
      const computedSignature = this.computeSignature(payloadBuffer, timestamp);
      result.computedSignature = computedSignature;

      // Timing-safe comparison to prevent timing attacks
      const isValid = this.timingSafeEquals(
        Buffer.from(extractedSignature, 'hex'),
        Buffer.from(computedSignature, 'hex')
      );

      result.valid = isValid;

      if (isValid) {
        logger.info('Webhook signature verification successful', {
          payloadSize: payloadBuffer.length,
          hasTimestamp: !!timestamp,
        });
      } else {
        result.error = 'Signature mismatch';
        logger.warn('Webhook signature verification failed: signature mismatch', {
          payloadSize: payloadBuffer.length,
          expectedSignature: computedSignature.substring(0, 16) + '...',
          providedSignature: extractedSignature.substring(0, 16) + '...',
        });
      }

      return result;

    } catch (error) {
      result.error = `Signature verification error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error('Webhook signature verification error', error);
      return result;
    }
  }

  /**
   * Compute HMAC-SHA256 signature for payload
   */
  private computeSignature(payload: Buffer, timestamp?: string): string {
    const hmac = crypto.createHmac('sha256', this.secret);

    // Include timestamp in signature if provided (recommended for replay attack prevention)
    if (timestamp) {
      hmac.update(timestamp);
      hmac.update('.');
    }

    hmac.update(payload);
    return hmac.digest('hex');
  }

  /**
   * Timing-safe comparison to prevent timing attacks
   */
  private timingSafeEquals(a: Buffer, b: Buffer): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }

    return result === 0;
  }

  /**
   * Generate signature for outgoing webhooks (for testing)
   */
  public generateSignature(payload: string | Buffer, timestamp?: string): string {
    const payloadBuffer = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');
    const signature = this.computeSignature(payloadBuffer, timestamp);
    return `sha256=${signature}`;
  }
}

/**
 * Convenience function for webhook signature verification
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  providedSignature: string,
  timestamp?: string
): SignatureVerificationResult {
  const verifier = new SignatureVerifier();
  return verifier.verifySignature(payload, providedSignature, timestamp);
}

/**
 * Express/Next.js middleware for automatic signature verification
 */
export function createSignatureMiddleware() {
  const verifier = new SignatureVerifier();

  return (req: any, res: any, next: any) => {
    const signature = req.headers['x-osa-signature'];
    const timestamp = req.headers['x-timestamp'];
    const payload = req.body;

    const verification = verifier.verifySignature(
      typeof payload === 'string' ? payload : JSON.stringify(payload),
      signature,
      timestamp
    );

    if (!verification.valid) {
      logger.warn('Middleware signature verification failed', {
        error: verification.error,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(401).json({
        error: 'Signature verification failed',
        details: verification.error,
      });
    }

    // Attach verification result to request for logging
    req.signatureVerification = verification;
    next();
  };
}

/**
 * Utility to extract and validate signature from Next.js request headers
 */
export function extractSignatureFromHeaders(headers: Headers | Record<string, string>): {
  signature?: string;
  timestamp?: string;
} {
  const getHeader = (name: string) => {
    if (headers instanceof Headers) {
      return headers.get(name);
    }
    return headers[name] || headers[name.toLowerCase()];
  };

  return {
    signature: getHeader('x-osa-signature') || getHeader('X-OSA-Signature') || undefined,
    timestamp: getHeader('x-timestamp') || getHeader('X-Timestamp') || undefined,
  };
}

/**
 * Hash generator for deduplication
 */
export function generateDeduplicationHash(
  workflowId: string,
  agentId: string | null,
  offset: number | null,
  eventType: string
): string {
  const data = `${workflowId}:${agentId || 'null'}:${offset || 'null'}:${eventType}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate correlation ID for request tracing
 */
export function generateCorrelationId(): string {
  return `cor_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Generate span ID for distributed tracing
 */
export function generateSpanId(): string {
  return `span_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
}