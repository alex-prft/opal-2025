// Session Management with Data Governance Compliance
// Stores session metadata in Supabase, tokens in Redis/memory

import { createHash } from 'crypto';
import { supabase } from '@/lib/supabase';

export interface SessionMetadata {
  session_id: string;
  user_id: string; // Internal OSA user, not customer
  created_at: Date;
  last_activity: Date;
  session_type: 'admin' | 'workflow' | 'api';
  ip_hash: string; // Hashed, not raw IP
  user_agent_hash: string; // Hashed user agent
  expires_at: Date;
}

export interface SessionToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

class SessionManager {
  private tokenCache = new Map<string, SessionToken>(); // In-memory for now, move to Redis in production

  /**
   * Hash sensitive data before storing
   */
  private hashSensitiveData(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Create a new session with compliant data storage
   */
  async createSession(
    userId: string,
    sessionType: SessionMetadata['session_type'],
    clientIP: string,
    userAgent: string,
    tokens: SessionToken
  ): Promise<string> {
    const sessionId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (tokens.expires_in * 1000));

    // Store tokens in memory/Redis (NOT Supabase)
    this.tokenCache.set(sessionId, tokens);

    // Store only metadata in Supabase (NO PII, NO tokens)
    const sessionMetadata: Omit<SessionMetadata, 'session_id'> = {
      user_id: userId,
      created_at: now,
      last_activity: now,
      session_type: sessionType,
      ip_hash: this.hashSensitiveData(clientIP), // Hash IP for audit purposes
      user_agent_hash: this.hashSensitiveData(userAgent), // Hash user agent
      expires_at: expiresAt,
    };

    const { error } = await supabase
      .from('session_metadata')
      .insert({
        session_id: sessionId,
        ...sessionMetadata,
      });

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return sessionId;
  }

  /**
   * Retrieve session tokens (from cache/Redis, not Supabase)
   */
  async getSessionTokens(sessionId: string): Promise<SessionToken | null> {
    // Get from memory cache (in production, use Redis)
    return this.tokenCache.get(sessionId) || null;
  }

  /**
   * Retrieve session metadata (from Supabase)
   */
  async getSessionMetadata(sessionId: string): Promise<SessionMetadata | null> {
    const { data, error } = await supabase
      .from('session_metadata')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as SessionMetadata;
  }

  /**
   * Update session activity (audit trail in Supabase)
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('session_metadata')
      .update({ last_activity: new Date() })
      .eq('session_id', sessionId);

    if (error) {
      console.error('Failed to update session activity:', error);
    }
  }

  /**
   * Validate session and check expiration
   */
  async validateSession(sessionId: string): Promise<boolean> {
    const metadata = await this.getSessionMetadata(sessionId);
    const tokens = await this.getSessionTokens(sessionId);

    if (!metadata || !tokens) {
      return false;
    }

    const now = new Date();
    if (now > metadata.expires_at) {
      // Session expired, clean up
      await this.destroySession(sessionId);
      return false;
    }

    // Update last activity
    await this.updateSessionActivity(sessionId);
    return true;
  }

  /**
   * Destroy session (remove from both cache and Supabase)
   */
  async destroySession(sessionId: string): Promise<void> {
    // Remove tokens from cache/Redis
    this.tokenCache.delete(sessionId);

    // Mark session as ended in Supabase (keep for audit)
    const { error } = await supabase
      .from('session_metadata')
      .update({
        expires_at: new Date(), // Expire immediately
        last_activity: new Date()
      })
      .eq('session_id', sessionId);

    if (error) {
      console.error('Failed to mark session as expired:', error);
    }
  }

  /**
   * Cleanup expired sessions (run periodically)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();

    // Remove expired tokens from cache
    let cacheCleanupCount = 0;
    for (const [sessionId] of this.tokenCache) {
      const metadata = await this.getSessionMetadata(sessionId);
      if (!metadata || now > metadata.expires_at) {
        this.tokenCache.delete(sessionId);
        cacheCleanupCount++;
      }
    }

    // Sessions in Supabase are kept for audit purposes, just marked as expired
    // Actual deletion happens via the retention policy (after 1 year)

    return cacheCleanupCount;
  }

  /**
   * Get active session count by type (for monitoring)
   */
  async getActiveSessionCount(sessionType?: SessionMetadata['session_type']): Promise<number> {
    const now = new Date();

    let query = supabase
      .from('session_metadata')
      .select('session_id', { count: 'exact' })
      .gt('expires_at', now.toISOString());

    if (sessionType) {
      query = query.eq('session_type', sessionType);
    }

    const { count } = await query;
    return count || 0;
  }

  /**
   * Audit session creation patterns (for security monitoring)
   */
  async auditSessionPatterns(timeframeHours: number = 24): Promise<{
    total_sessions: number;
    unique_users: number;
    session_types: Record<string, number>;
    suspicious_activity: boolean;
  }> {
    const since = new Date(Date.now() - (timeframeHours * 60 * 60 * 1000));

    const { data: sessions } = await supabase
      .from('session_metadata')
      .select('user_id, session_type, ip_hash, created_at')
      .gte('created_at', since.toISOString());

    if (!sessions) {
      return {
        total_sessions: 0,
        unique_users: 0,
        session_types: {},
        suspicious_activity: false
      };
    }

    const uniqueUsers = new Set(sessions.map(s => s.user_id)).size;
    const sessionTypes = sessions.reduce((acc, session) => {
      acc[session.session_type] = (acc[session.session_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Check for suspicious patterns (same IP hash with many different users)
    const ipUserMap = new Map<string, Set<string>>();
    sessions.forEach(session => {
      if (!ipUserMap.has(session.ip_hash)) {
        ipUserMap.set(session.ip_hash, new Set());
      }
      ipUserMap.get(session.ip_hash)!.add(session.user_id);
    });

    const suspicious_activity = Array.from(ipUserMap.values())
      .some(userSet => userSet.size > 5); // More than 5 users from same IP

    return {
      total_sessions: sessions.length,
      unique_users: uniqueUsers,
      session_types: sessionTypes,
      suspicious_activity
    };
  }
}

export const sessionManager = new SessionManager();

// Export types for use in other modules
export type { SessionMetadata, SessionToken };