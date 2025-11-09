/**
 * Client-side authentication utilities for API calls
 * Handles Bearer token authentication for protected endpoints
 */

/**
 * Get the API secret key from environment variables
 * Uses NEXT_PUBLIC_API_SECRET_KEY for client-side access
 */
export function getClientAPISecretKey(): string {
  const secretKey = process.env.NEXT_PUBLIC_API_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Missing NEXT_PUBLIC_API_SECRET_KEY environment variable');
  }
  return secretKey;
}

/**
 * Create authorization headers for API calls
 * Returns headers object with Bearer token
 */
export function createAuthHeaders(): { [key: string]: string } {
  try {
    const apiKey = getClientAPISecretKey();
    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  } catch (error) {
    console.error('Failed to create auth headers:', error);
    // Return headers without auth - let server handle the 401 error
    return {
      'Content-Type': 'application/json'
    };
  }
}

/**
 * Enhanced fetch wrapper with automatic authentication
 * Adds Bearer token to all requests
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = createAuthHeaders();

  const enhancedOptions: RequestInit = {
    ...options,
    headers: {
      ...authHeaders,
      ...(options.headers || {})
    }
  };

  return fetch(url, enhancedOptions);
}

/**
 * Utility to check if client has valid API credentials
 */
export function hasValidAPICredentials(): boolean {
  try {
    const apiKey = getClientAPISecretKey();
    return !!apiKey && apiKey.length > 0;
  } catch {
    return false;
  }
}