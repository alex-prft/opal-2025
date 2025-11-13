/**
 * OAuth 2.0 + PKCE Authentication Implementation
 * Enhanced security layer for admin endpoints with PKCE flow
 */

import { NextRequest } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';

// OAuth 2.0 + PKCE Configuration
export interface OAuthConfig {
  clientId: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  redirectUri: string;
  scope: string[];
  adminScopes: string[];
}

// PKCE Challenge and Verifier
export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  state: string;
}

// Access token with admin permissions
export interface AdminAccessToken {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string[];
  admin_level: 'admin' | 'super_admin' | 'data_admin' | 'technical_admin';
  user_id: string;
  issued_at: number;
}

// JWT Token payload for admin sessions
export interface AdminJWTPayload {
  sub: string; // user_id
  iat: number;
  exp: number;
  scope: string[];
  admin_level: string;
  session_id: string;
}

class OAuthPKCEService {
  private readonly config: OAuthConfig;
  private readonly jwtSecret: Uint8Array;

  constructor() {
    this.config = {
      clientId: process.env.OAUTH_CLIENT_ID || 'opal-admin-client',
      authorizationEndpoint: process.env.OAUTH_AUTHORIZATION_ENDPOINT || 'https://auth.opal.com/oauth/authorize',
      tokenEndpoint: process.env.OAUTH_TOKEN_ENDPOINT || 'https://auth.opal.com/oauth/token',
      redirectUri: process.env.OAUTH_REDIRECT_URI || 'https://localhost:3000/auth/callback',
      scope: ['read', 'write'],
      adminScopes: ['admin:read', 'admin:write', 'admin:config', 'admin:security']
    };

    // JWT secret for admin session tokens
    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
    this.jwtSecret = new TextEncoder().encode(secret);
  }

  /**
   * Generate PKCE challenge and verifier
   */
  generatePKCEChallenge(): PKCEChallenge {
    // Generate random code verifier (43-128 characters)
    const codeVerifier = crypto
      .randomBytes(32)
      .toString('base64url');

    // Create code challenge using SHA256
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // Generate state parameter for CSRF protection
    const state = crypto.randomBytes(16).toString('base64url');

    return {
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256',
      state
    };
  }

  /**
   * Generate authorization URL for OAuth 2.0 + PKCE flow
   */
  generateAuthorizationUrl(pkce: PKCEChallenge): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: [...this.config.scope, ...this.config.adminScopes].join(' '),
      state: pkce.state,
      code_challenge: pkce.codeChallenge,
      code_challenge_method: pkce.codeChallengeMethod,
      // Additional admin-specific parameters
      access_type: 'admin',
      approval_prompt: 'force'
    });

    return `${this.config.authorizationEndpoint}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    authorizationCode: string,
    codeVerifier: string,
    state: string
  ): Promise<AdminAccessToken> {
    const tokenRequest = {
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      code: authorizationCode,
      redirect_uri: this.config.redirectUri,
      code_verifier: codeVerifier,
      state: state
    };

    try {
      const response = await fetch(this.config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams(tokenRequest)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token exchange failed: ${response.status} - ${error}`);
      }

      const tokenData = await response.json();

      // Validate and enhance token with admin metadata
      const adminToken: AdminAccessToken = {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type || 'Bearer',
        expires_in: tokenData.expires_in || 3600,
        scope: tokenData.scope?.split(' ') || this.config.scope,
        admin_level: this.determineAdminLevel(tokenData.scope?.split(' ') || []),
        user_id: tokenData.user_id || 'unknown',
        issued_at: Date.now()
      };

      return adminToken;
    } catch (error) {
      console.error('OAuth token exchange error:', error);
      throw new Error(`Failed to exchange authorization code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create admin JWT session token
   */
  async createAdminJWT(accessToken: AdminAccessToken): Promise<string> {
    const payload: AdminJWTPayload = {
      sub: accessToken.user_id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + accessToken.expires_in,
      scope: accessToken.scope,
      admin_level: accessToken.admin_level,
      session_id: crypto.randomUUID()
    };

    try {
      const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime(`${accessToken.expires_in}s`)
        .sign(this.jwtSecret);

      return jwt;
    } catch (error) {
      console.error('JWT creation error:', error);
      throw new Error('Failed to create admin session token');
    }
  }

  /**
   * Verify and decode admin JWT token
   */
  async verifyAdminJWT(token: string): Promise<AdminJWTPayload> {
    try {
      const { payload } = await jwtVerify(token, this.jwtSecret);
      return payload as AdminJWTPayload;
    } catch (error) {
      console.error('JWT verification error:', error);
      throw new Error('Invalid or expired admin session token');
    }
  }

  /**
   * Extract Bearer token from Authorization header
   */
  extractBearerToken(request: NextRequest): string | null {
    const authorization = request.headers.get('authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return null;
    }
    return authorization.slice(7); // Remove 'Bearer ' prefix
  }

  /**
   * Validate admin permissions for specific actions
   */
  validateAdminPermissions(
    payload: AdminJWTPayload,
    requiredLevel: AdminAccessToken['admin_level'],
    requiredScopes: string[] = []
  ): boolean {
    // Check admin level hierarchy
    const levelHierarchy = {
      'technical_admin': 1,
      'data_admin': 2,
      'admin': 3,
      'super_admin': 4
    };

    const userLevel = levelHierarchy[payload.admin_level as keyof typeof levelHierarchy] || 0;
    const requireLevel = levelHierarchy[requiredLevel] || 0;

    if (userLevel < requireLevel) {
      return false;
    }

    // Check required scopes
    if (requiredScopes.length > 0) {
      const hasAllScopes = requiredScopes.every(scope =>
        payload.scope.includes(scope)
      );
      if (!hasAllScopes) {
        return false;
      }
    }

    return true;
  }

  /**
   * Middleware function for admin route protection
   */
  async protectAdminRoute(
    request: NextRequest,
    requiredLevel: AdminAccessToken['admin_level'] = 'admin',
    requiredScopes: string[] = []
  ): Promise<{ isAuthorized: boolean; payload?: AdminJWTPayload; error?: string }> {
    try {
      // Extract token from request
      const token = this.extractBearerToken(request);
      if (!token) {
        return {
          isAuthorized: false,
          error: 'Missing authentication token'
        };
      }

      // Verify JWT token
      const payload = await this.verifyAdminJWT(token);

      // Validate permissions
      const hasPermissions = this.validateAdminPermissions(
        payload,
        requiredLevel,
        requiredScopes
      );

      if (!hasPermissions) {
        return {
          isAuthorized: false,
          error: `Insufficient permissions. Required: ${requiredLevel}`
        };
      }

      return {
        isAuthorized: true,
        payload
      };
    } catch (error) {
      return {
        isAuthorized: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  /**
   * Refresh admin access token
   */
  async refreshAdminToken(refreshToken: string): Promise<AdminAccessToken> {
    const refreshRequest = {
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      refresh_token: refreshToken
    };

    try {
      const response = await fetch(this.config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams(refreshRequest)
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const tokenData = await response.json();

      return {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type || 'Bearer',
        expires_in: tokenData.expires_in || 3600,
        scope: tokenData.scope?.split(' ') || this.config.scope,
        admin_level: this.determineAdminLevel(tokenData.scope?.split(' ') || []),
        user_id: tokenData.user_id || 'unknown',
        issued_at: Date.now()
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error('Failed to refresh admin token');
    }
  }

  /**
   * Determine admin level based on scopes
   */
  private determineAdminLevel(scopes: string[]): AdminAccessToken['admin_level'] {
    if (scopes.includes('admin:super') || scopes.includes('admin:all')) {
      return 'super_admin';
    } else if (scopes.includes('admin:technical')) {
      return 'technical_admin';
    } else if (scopes.includes('admin:data')) {
      return 'data_admin';
    } else if (scopes.some(scope => scope.startsWith('admin:'))) {
      return 'admin';
    }
    return 'admin'; // Default fallback
  }

  /**
   * Get OAuth configuration (for client-side usage)
   */
  getPublicConfig() {
    return {
      clientId: this.config.clientId,
      authorizationEndpoint: this.config.authorizationEndpoint,
      redirectUri: this.config.redirectUri,
      scope: this.config.scope
    };
  }
}

// Export singleton instance
export const oauthService = new OAuthPKCEService();

// Helper function to create admin auth middleware
export function createAdminAuthMiddleware(
  requiredLevel: AdminAccessToken['admin_level'] = 'admin',
  requiredScopes: string[] = []
) {
  return async (request: NextRequest) => {
    return oauthService.protectAdminRoute(request, requiredLevel, requiredScopes);
  };
}

// Admin permission decorators for different access levels
export const AdminPermissions = {
  TECHNICAL_ADMIN: ['admin:technical', 'admin:infrastructure'],
  DATA_ADMIN: ['admin:data', 'admin:analytics'],
  ADMIN: ['admin:read', 'admin:write'],
  SUPER_ADMIN: ['admin:all', 'admin:config', 'admin:security']
} as const;

// Utility functions for common admin operations
export class AdminAuthUtils {
  static async requireTechnicalAdmin(request: NextRequest) {
    return oauthService.protectAdminRoute(
      request,
      'technical_admin',
      AdminPermissions.TECHNICAL_ADMIN
    );
  }

  static async requireDataAdmin(request: NextRequest) {
    return oauthService.protectAdminRoute(
      request,
      'data_admin',
      AdminPermissions.DATA_ADMIN
    );
  }

  static async requireSuperAdmin(request: NextRequest) {
    return oauthService.protectAdminRoute(
      request,
      'super_admin',
      AdminPermissions.SUPER_ADMIN
    );
  }

  static async requireAnyAdmin(request: NextRequest) {
    return oauthService.protectAdminRoute(request, 'admin');
  }
}