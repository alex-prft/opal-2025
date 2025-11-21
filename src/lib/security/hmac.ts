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
 * Enhanced with improved error handling and flexible timestamp tolerance
 *
 * @param payload - Raw payload (Buffer or string)
 * @param signature - Expected signature (hex-encoded)
 * @param secret - HMAC secret key
 * @param timestamp - Optional timestamp for time-based verification
 * @param maxAgeMs - Maximum age for timestamp validation (default: 10 minutes, increased for network tolerance)
 * @returns Verification result
 */
export function verifyHmacSignature(
  payload: Buffer | string,
  signature: string,
  secret: string,
  timestamp?: number,
  maxAgeMs: number = 10 * 60 * 1000 // 10 minutes (increased from 5 for better tolerance)
): HmacVerificationResult {
  try {
    console.log(`🐛 [HMAC Verify] Starting verification with timestamp: ${timestamp}, includeTimestamp: ${!!timestamp}`);

    // Validate inputs
    if (!payload) {
      return { isValid: false, error: 'Empty payload' };
    }
    if (!signature || signature.length === 0) {
      return { isValid: false, error: 'Empty signature' };
    }
    if (!secret || secret.length === 0) {
      return { isValid: false, error: 'Empty secret' };
    }

    // Validate signature format
    if (!/^[0-9a-fA-F]+$/.test(signature)) {
      return { isValid: false, error: 'Invalid signature format (not hex)' };
    }

    // Generate expected signature using the original timestamp from the request
    const expected = generateHmacSignature(payload, secret, !!timestamp, timestamp);

    console.log(`🐛 [HMAC Verify] Expected signature: ${expected.signature}`);
    console.log(`🐛 [HMAC Verify] Expected timestamp: ${expected.timestamp}`);
    console.log(`🐛 [HMAC Verify] Received signature: ${signature}`);

    // Prepare buffers for constant-time comparison
    let receivedBuffer: Buffer;
    let expectedBuffer: Buffer;

    try {
      receivedBuffer = Buffer.from(signature, 'hex');
      expectedBuffer = Buffer.from(expected.signature, 'hex');
    } catch (bufferError) {
      return {
        isValid: false,
        error: `Buffer conversion failed: ${bufferError instanceof Error ? bufferError.message : 'Unknown error'}`
      };
    }

    // Ensure buffers are the same length for constant-time comparison
    if (receivedBuffer.length !== expectedBuffer.length) {
      console.log(`🐛 [HMAC Verify] Length mismatch - received: ${receivedBuffer.length}, expected: ${expectedBuffer.length}`);
      return {
        isValid: false,
        error: `Signature length mismatch (received: ${receivedBuffer.length}, expected: ${expectedBuffer.length})`
      };
    }

    // Perform constant-time comparison
    const isSignatureValid = timingSafeEqual(receivedBuffer, expectedBuffer);
    console.log(`🐛 [HMAC Verify] Signature comparison result: ${isSignatureValid}`);

    if (!isSignatureValid) {
      return {
        isValid: false,
        error: 'Signature verification failed - signatures do not match'
      };
    }

    // If timestamp is provided, verify it's within acceptable range
    if (timestamp) {
      const now = Date.now();
      const age = now - timestamp;

      console.log(`🐛 [HMAC Verify] Timestamp validation - now: ${now}, timestamp: ${timestamp}, age: ${age}ms, maxAge: ${maxAgeMs}ms`);

      if (age < -60000) { // Allow 1 minute clock drift in the future
        return {
          isValid: false,
          error: `Timestamp too far in the future (${Math.abs(age)}ms ahead)`
        };
      }

      if (age > maxAgeMs) {
        return {
          isValid: false,
          error: `Timestamp too old (${age}ms > ${maxAgeMs}ms)`
        };
      }

      // Warn about clock drift but don't fail
      if (age < 0) {
        console.warn(`⚠️ [HMAC Verify] Clock drift detected: timestamp ${Math.abs(age)}ms in future (within tolerance)`);
      }
    }

    console.log(`✅ [HMAC Verify] Verification successful`);
    return {
      isValid: true,
      timestamp
    };

  } catch (error) {
    console.error(`❌ [HMAC Verify] Verification error:`, error);
    return {
      isValid: false,
      error: `HMAC verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Parse X-OSA-Signature header format: "t=timestamp,v1=signature"
 * Enhanced with better error handling and logging for diagnostics
 *
 * @param signatureHeader - Signature header value
 * @returns Parsed timestamp and signature, or null if invalid format
 */
export function parseSignatureHeader(signatureHeader: string): { timestamp: number; signature: string } | null {
  try {
    if (!signatureHeader || typeof signatureHeader !== 'string') {
      console.log(`🐛 [HMAC Parse] Invalid header type: ${typeof signatureHeader}`);
      return null;
    }

    // Normalize whitespace and split by comma
    const parts = signatureHeader.trim().split(',').map(p => p.trim());
    console.log(`🐛 [HMAC Parse] Header parts: ${JSON.stringify(parts)}`);

    const timestampPart = parts.find(p => p.startsWith('t='));
    const signaturePart = parts.find(p => p.startsWith('v1='));

    if (!timestampPart) {
      console.log(`🐛 [HMAC Parse] Missing timestamp part in: ${signatureHeader}`);
      return null;
    }

    if (!signaturePart) {
      console.log(`🐛 [HMAC Parse] Missing signature part in: ${signatureHeader}`);
      return null;
    }

    const timestampStr = timestampPart.substring(2);
    const signature = signaturePart.substring(3);
    const timestamp = parseInt(timestampStr, 10);

    if (isNaN(timestamp)) {
      console.log(`🐛 [HMAC Parse] Invalid timestamp: ${timestampStr}`);
      return null;
    }

    if (!signature || signature.length === 0) {
      console.log(`🐛 [HMAC Parse] Empty signature`);
      return null;
    }

    // Validate signature format (should be hex)
    if (!/^[0-9a-fA-F]+$/.test(signature)) {
      console.log(`🐛 [HMAC Parse] Invalid signature format: ${signature}`);
      return null;
    }

    console.log(`🐛 [HMAC Parse] Successfully parsed - timestamp: ${timestamp}, signature length: ${signature.length}`);
    return { timestamp, signature };
  } catch (error) {
    console.log(`🐛 [HMAC Parse] Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

/**
 * Test HMAC signature validation with debugging information
 * Useful for troubleshooting signature validation issues
 *
 * @param payload - Test payload
 * @param secret - HMAC secret key
 * @returns Test results with detailed information
 */
export function testHmacValidation(payload: Buffer | string, secret: string): {
  success: boolean;
  generated_signature: string;
  parsed_header: { timestamp: number; signature: string } | null;
  verification_result: HmacVerificationResult;
  debug_info: {
    payload_length: number;
    secret_length: number;
    timestamp: number;
    age_ms: number;
  };
} {
  const testPayload = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');

  // Generate a test signature
  const generatedSignature = generateWebhookSignature(testPayload, secret);

  // Parse the generated signature
  const parsedHeader = parseSignatureHeader(generatedSignature);

  // Test verification
  const verificationResult = verifyWebhookSignature(testPayload, generatedSignature, secret);

  return {
    success: verificationResult.isValid,
    generated_signature: generatedSignature,
    parsed_header: parsedHeader,
    verification_result: verificationResult,
    debug_info: {
      payload_length: testPayload.length,
      secret_length: secret.length,
      timestamp: parsedHeader?.timestamp || 0,
      age_ms: parsedHeader ? Date.now() - parsedHeader.timestamp : 0
    }
  };
}

/**
 * Validate HMAC configuration and environment setup
 *
 * @param secret - HMAC secret to validate
 * @returns Validation results with recommendations
 */
export function validateHmacSetup(secret?: string): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
  test_result?: ReturnType<typeof testHmacValidation>;
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check secret configuration
  if (!secret) {
    issues.push('HMAC secret is not configured');
    recommendations.push('Set OSA_WEBHOOK_SECRET environment variable');
  } else {
    if (secret.length < 32) {
      issues.push(`HMAC secret is too short (${secret.length} characters)`);
      recommendations.push('Use a secret with at least 32 characters for security');
    }

    if (secret.toLowerCase() === secret || secret.toUpperCase() === secret) {
      issues.push('HMAC secret lacks mixed case characters');
      recommendations.push('Use a secret with mixed case, numbers, and special characters');
    }
  }

  // Run a test if secret is available
  let testResult;
  if (secret) {
    try {
      testResult = testHmacValidation('test payload', secret);
      if (!testResult.success) {
        issues.push('HMAC validation test failed');
        recommendations.push('Check secret configuration and environment variables');
      }
    } catch (error) {
      issues.push(`HMAC test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      recommendations.push('Review HMAC implementation and dependencies');
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    recommendations,
    test_result: testResult
  };
}