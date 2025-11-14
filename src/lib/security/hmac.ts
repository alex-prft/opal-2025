/**
 * HMAC Utilities for OPAL Webhook Security
 * Production-grade HMAC signing and verification with constant-time comparison
 */

import { createHmac, timingSafeEqual } from 'crypto';

export interface HmacSignatureResult {
  signature: string;
  timestamp: number;
}

export interface HmacVerificationResult {
  isValid: boolean;
  timestamp?: number;
  error?: string;
}

/**
 * Generate HMAC-SHA256 signature for webhook payload
 *
 * @param payload - Raw payload (Buffer or string)
 * @param secret - HMAC secret key
 * @param includeTimestamp - Whether to include timestamp in signature (default: true)
 * @returns Signature result with hex-encoded signature and timestamp
 */
export function generateHmacSignature(
  payload: Buffer | string,
  secret: string,
  includeTimestamp: boolean = true,
  providedTimestamp?: number
): HmacSignatureResult {
  const timestamp = providedTimestamp || (includeTimestamp ? Date.now() : 0);
  const payloadBuffer = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');

  // Create signature with optional timestamp
  let signatureData: Buffer;
  if (includeTimestamp) {
    const timestampBuffer = Buffer.from(timestamp.toString(), 'utf8');
    signatureData = Buffer.concat([timestampBuffer, payloadBuffer]);
  } else {
    signatureData = payloadBuffer;
  }

  const hmac = createHmac('sha256', secret);
  hmac.update(signatureData);
  const signature = hmac.digest('hex');

  return {
    signature,
    timestamp
  };
}

/**
 * Verify HMAC-SHA256 signature with constant-time comparison
 *
 * @param payload - Raw payload (Buffer or string)
 * @param signature - Expected signature (hex-encoded)
 * @param secret - HMAC secret key
 * @param timestamp - Optional timestamp for time-based verification
 * @param maxAgeMs - Maximum age for timestamp validation (default: 5 minutes)
 * @returns Verification result
 */
export function verifyHmacSignature(
  payload: Buffer | string,
  signature: string,
  secret: string,
  timestamp?: number,
  maxAgeMs: number = 5 * 60 * 1000 // 5 minutes
): HmacVerificationResult {
  try {
    console.log(`🐛 [HMAC Verify] Input timestamp: ${timestamp}, includeTimestamp: ${!!timestamp}`);

    // Generate expected signature using the original timestamp from the request
    const expected = generateHmacSignature(payload, secret, !!timestamp, timestamp);

    console.log(`🐛 [HMAC Verify] Expected signature: ${expected.signature}`);
    console.log(`🐛 [HMAC Verify] Expected timestamp: ${expected.timestamp}`);
    console.log(`🐛 [HMAC Verify] Received signature: ${signature}`);

    // Prepare buffers for constant-time comparison
    const receivedBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expected.signature, 'hex');

    // Ensure buffers are the same length for constant-time comparison
    if (receivedBuffer.length !== expectedBuffer.length) {
      return {
        isValid: false,
        error: 'Signature length mismatch'
      };
    }

    // Perform constant-time comparison
    const isSignatureValid = timingSafeEqual(receivedBuffer, expectedBuffer);

    if (!isSignatureValid) {
      return {
        isValid: false,
        error: 'Signature verification failed'
      };
    }

    // If timestamp is provided, verify it's within acceptable range
    if (timestamp) {
      const now = Date.now();
      const age = now - timestamp;

      if (age < 0) {
        return {
          isValid: false,
          error: 'Timestamp is in the future'
        };
      }

      if (age > maxAgeMs) {
        return {
          isValid: false,
          error: `Timestamp too old (${age}ms > ${maxAgeMs}ms)`
        };
      }
    }

    return {
      isValid: true,
      timestamp
    };

  } catch (error) {
    return {
      isValid: false,
      error: `HMAC verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Parse X-OSA-Signature header format: "t=timestamp,v1=signature"
 *
 * @param signatureHeader - Signature header value
 * @returns Parsed timestamp and signature, or null if invalid format
 */
export function parseSignatureHeader(signatureHeader: string): { timestamp: number; signature: string } | null {
  try {
    const parts = signatureHeader.split(',');
    const timestampPart = parts.find(p => p.startsWith('t='));
    const signaturePart = parts.find(p => p.startsWith('v1='));

    if (!timestampPart || !signaturePart) {
      return null;
    }

    const timestamp = parseInt(timestampPart.substring(2), 10);
    const signature = signaturePart.substring(3);

    if (isNaN(timestamp) || !signature) {
      return null;
    }

    return { timestamp, signature };
  } catch {
    return null;
  }
}

/**
 * Format signature for X-OSA-Signature header: "t=timestamp,v1=signature"
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @param signature - Hex-encoded signature
 * @returns Formatted signature header value
 */
export function formatSignatureHeader(timestamp: number, signature: string): string {
  return `t=${timestamp},v1=${signature}`;
}

/**
 * Verify webhook signature from HTTP headers
 *
 * @param payload - Raw request payload
 * @param signatureHeader - X-OSA-Signature header value
 * @param secret - HMAC secret key
 * @param maxAgeMs - Maximum age for timestamp validation
 * @returns Verification result
 */
export function verifyWebhookSignature(
  payload: Buffer | string,
  signatureHeader: string,
  secret: string,
  maxAgeMs?: number
): HmacVerificationResult {
  const parsed = parseSignatureHeader(signatureHeader);
  if (!parsed) {
    return {
      isValid: false,
      error: 'Invalid signature header format'
    };
  }

  return verifyHmacSignature(payload, parsed.signature, secret, parsed.timestamp, maxAgeMs);
}

/**
 * Generate webhook signature for outgoing requests
 *
 * @param payload - Request payload
 * @param secret - HMAC secret key
 * @returns Formatted signature header value
 */
export function generateWebhookSignature(payload: Buffer | string, secret: string): string {
  const result = generateHmacSignature(payload, secret, true);
  return formatSignatureHeader(result.timestamp, result.signature);
}