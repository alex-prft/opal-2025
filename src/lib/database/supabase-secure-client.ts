/**
 * Secure Supabase Client Wrapper
 * 
 * This module provides a secure wrapper around Supabase operations that enforces
 * data governance policies, PII protection, and audit logging requirements.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import { supabaseGuardrails, DataClassification } from './supabase-guardrails';
import { createSupabaseAdmin } from './supabase-client';

export interface SecureOperationOptions {
  classification?: DataClassification;
  bypassValidation?: boolean;
  requireExplicitApproval?: boolean;
  auditContext?: string;
}

/**
 * Secure Supabase client that enforces all data governance policies
 */
export class SecureSupabaseClient {
  private client: SupabaseClient<Database>;
  private tableName: string;
  
  constructor(client?: SupabaseClient<Database>) {
    this.client = client || createSupabaseAdmin();
    this.tableName = '';
  }
  
  /**
   * Secure table selector with guardrails validation
   */
  from(table: keyof Database['public']['Tables']) {
    this.tableName = table as string;
    return new SecureTableOperations(this.client, this.tableName);
  }
  
  /**
   * Execute RPC calls with validation
   */
  async rpc(
    fn: string, 
    params?: Record<string, any>,
    options: SecureOperationOptions = {}
  ) {
    // Validate RPC operation
    const validation = await supabaseGuardrails.validateDataOperation(
      `rpc_${fn}`,
      'read', // RPC calls are generally read operations
      params,
      options.classification
    );
    
    if (!validation.allowed && !options.bypassValidation) {
      throw new Error(`RPC operation blocked: ${validation.reason}`);
    }
    
    return this.client.rpc(fn, params);
  }
}

/**
 * Secure table operations with comprehensive validation
 */
export class SecureTableOperations {
  constructor(
    private client: SupabaseClient<Database>,
    private tableName: string
  ) {}
  
  /**
   * Secure SELECT operations
   */
  async select(
    columns: string = '*',
    options: SecureOperationOptions = {}
  ) {
    const validation = await supabaseGuardrails.validateDataOperation(
      this.tableName,
      'read',
      null,
      options.classification
    );
    
    if (!validation.allowed && !options.bypassValidation) {
      throw new Error(`SELECT operation blocked: ${validation.reason}`);
    }
    
    return new SecureQueryBuilder(
      this.client.from(this.tableName).select(columns),
      this.tableName,
      'read',
      options
    );
  }
  
  /**
   * Secure INSERT operations with PII scanning
   */
  async insert(
    data: any,
    options: SecureOperationOptions = {}
  ) {
    const validation = await supabaseGuardrails.validateDataOperation(
      this.tableName,
      'write',
      data,
      options.classification
    );
    
    if (!validation.allowed && !options.bypassValidation) {
      throw new Error(`INSERT operation blocked: ${validation.reason}`);
    }
    
    // Use sanitized data if available
    const finalData = validation.sanitizedData || data;
    
    return new SecureQueryBuilder(
      this.client.from(this.tableName).insert(finalData),
      this.tableName,
      'write',
      options
    );
  }
  
  /**
   * Secure UPDATE operations
   */
  async update(
    data: any,
    options: SecureOperationOptions = {}
  ) {
    const validation = await supabaseGuardrails.validateDataOperation(
      this.tableName,
      'update',
      data,
      options.classification
    );
    
    if (!validation.allowed && !options.bypassValidation) {
      throw new Error(`UPDATE operation blocked: ${validation.reason}`);
    }
    
    const finalData = validation.sanitizedData || data;
    
    return new SecureQueryBuilder(
      this.client.from(this.tableName).update(finalData),
      this.tableName,
      'update',
      options
    );
  }
  
  /**
   * Secure DELETE operations with audit logging
   */
  async delete(options: SecureOperationOptions = {}) {
    const validation = await supabaseGuardrails.validateDataOperation(
      this.tableName,
      'delete',
      null,
      options.classification
    );
    
    if (!validation.allowed && !options.bypassValidation) {
      throw new Error(`DELETE operation blocked: ${validation.reason}`);
    }
    
    return new SecureQueryBuilder(
      this.client.from(this.tableName).delete(),
      this.tableName,
      'delete',
      options
    );
  }
  
  /**
   * Secure UPSERT operations
   */
  async upsert(
    data: any,
    options: SecureOperationOptions = {}
  ) {
    const validation = await supabaseGuardrails.validateDataOperation(
      this.tableName,
      'write',
      data,
      options.classification
    );
    
    if (!validation.allowed && !options.bypassValidation) {
      throw new Error(`UPSERT operation blocked: ${validation.reason}`);
    }
    
    const finalData = validation.sanitizedData || data;
    
    return new SecureQueryBuilder(
      this.client.from(this.tableName).upsert(finalData),
      this.tableName,
      'write',
      options
    );
  }
}

/**
 * Secure query builder that maintains validation context
 */
export class SecureQueryBuilder {
  constructor(
    private query: any,
    private tableName: string,
    private operation: string,
    private options: SecureOperationOptions
  ) {}
  
  // Proxy common query methods while maintaining security context
  eq(column: string, value: any) {
    return new SecureQueryBuilder(
      this.query.eq(column, value),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  neq(column: string, value: any) {
    return new SecureQueryBuilder(
      this.query.neq(column, value),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  gt(column: string, value: any) {
    return new SecureQueryBuilder(
      this.query.gt(column, value),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  gte(column: string, value: any) {
    return new SecureQueryBuilder(
      this.query.gte(column, value),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  lt(column: string, value: any) {
    return new SecureQueryBuilder(
      this.query.lt(column, value),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  lte(column: string, value: any) {
    return new SecureQueryBuilder(
      this.query.lte(column, value),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  like(column: string, pattern: string) {
    return new SecureQueryBuilder(
      this.query.like(column, pattern),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  ilike(column: string, pattern: string) {
    return new SecureQueryBuilder(
      this.query.ilike(column, pattern),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  is(column: string, value: any) {
    return new SecureQueryBuilder(
      this.query.is(column, value),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  in(column: string, values: any[]) {
    return new SecureQueryBuilder(
      this.query.in(column, values),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  contains(column: string, value: any) {
    return new SecureQueryBuilder(
      this.query.contains(column, value),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  containedBy(column: string, value: any) {
    return new SecureQueryBuilder(
      this.query.containedBy(column, value),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  rangeGt(column: string, value: any) {
    return new SecureQueryBuilder(
      this.query.rangeGt(column, value),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  rangeGte(column: string, value: any) {
    return new SecureQueryBuilder(
      this.query.rangeGte(column, value),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  rangeLt(column: string, value: any) {
    return new SecureQueryBuilder(
      this.query.rangeLt(column, value),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  rangeLte(column: string, value: any) {
    return new SecureQueryBuilder(
      this.query.rangeLte(column, value),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  rangeAdjacent(column: string, value: any) {
    return new SecureQueryBuilder(
      this.query.rangeAdjacent(column, value),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  overlaps(column: string, value: any) {
    return new SecureQueryBuilder(
      this.query.overlaps(column, value),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  textSearch(column: string, query: string, config?: { type?: 'plain' | 'phrase' | 'websearch' }) {
    return new SecureQueryBuilder(
      this.query.textSearch(column, query, config),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  match(query: Record<string, any>) {
    return new SecureQueryBuilder(
      this.query.match(query),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  not(column: string, operator: string, value: any) {
    return new SecureQueryBuilder(
      this.query.not(column, operator, value),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  or(filters: string, foreignTable?: string) {
    return new SecureQueryBuilder(
      this.query.or(filters, foreignTable),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  filter(column: string, operator: string, value: any) {
    return new SecureQueryBuilder(
      this.query.filter(column, operator, value),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean; foreignTable?: string }) {
    return new SecureQueryBuilder(
      this.query.order(column, options),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  limit(count: number, foreignTable?: string) {
    return new SecureQueryBuilder(
      this.query.limit(count, foreignTable),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  range(from: number, to: number, foreignTable?: string) {
    return new SecureQueryBuilder(
      this.query.range(from, to, foreignTable),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  abortSignal(signal: AbortSignal) {
    return new SecureQueryBuilder(
      this.query.abortSignal(signal),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  single() {
    return new SecureQueryBuilder(
      this.query.single(),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  maybeSingle() {
    return new SecureQueryBuilder(
      this.query.maybeSingle(),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  csv() {
    return new SecureQueryBuilder(
      this.query.csv(),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  geojson() {
    return new SecureQueryBuilder(
      this.query.geojson(),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  explain(options?: { analyze?: boolean; verbose?: boolean; settings?: boolean; buffers?: boolean; wal?: boolean; format?: 'json' | 'text' }) {
    return new SecureQueryBuilder(
      this.query.explain(options),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  rollback() {
    return new SecureQueryBuilder(
      this.query.rollback(),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  returns() {
    return new SecureQueryBuilder(
      this.query.returns(),
      this.tableName,
      this.operation,
      this.options
    );
  }
  
  /**
   * Execute the query with final validation and audit logging
   */
  async execute() {
    const startTime = performance.now();
    
    try {
      const result = await this.query;
      const endTime = performance.now();
      
      // Log successful operation for audit
      await this.logOperation('SUCCESS', endTime - startTime);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      
      // Log failed operation
      await this.logOperation('ERROR', endTime - startTime, error);
      
      throw error;
    }
  }
  
  /**
   * Convenience method that automatically executes the query
   */
  then(onfulfilled?: any, onrejected?: any) {
    return this.execute().then(onfulfilled, onrejected);
  }
  
  /**
   * Log operation for audit trails
   */
  private async logOperation(
    status: 'SUCCESS' | 'ERROR',
    duration: number,
    error?: any
  ) {
    try {
      const logEntry = {
        event_type: 'DATABASE_OPERATION',
        table_name: this.tableName,
        operation: this.operation,
        status,
        duration_ms: Math.round(duration),
        details: {
          classification: this.options.classification,
          audit_context: this.options.auditContext,
          timestamp: new Date().toISOString(),
          error_message: error?.message
        },
        created_at: new Date().toISOString()
      };
      
      // Use raw client to avoid infinite recursion
      const rawClient = createSupabaseAdmin();
      await rawClient
        .from('supabase_audit_log')
        .insert(logEntry);
        
    } catch (auditError) {
      console.error('Failed to log database operation:', auditError);
      // Don't throw audit errors to avoid disrupting the main operation
    }
  }
}

/**
 * Factory function to create secure Supabase client
 */
export function createSecureSupabaseClient(client?: SupabaseClient<Database>): SecureSupabaseClient {
  return new SecureSupabaseClient(client);
}

/**
 * Default secure client instance for application use
 */
export const secureSupabase = createSecureSupabaseClient();