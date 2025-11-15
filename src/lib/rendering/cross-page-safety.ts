// Phase 4: Cross-Page Safety Mechanisms for Progressive Rendering
// Ensures consistency and safety during partial rendering across page navigation

import crypto from 'crypto';
import { supabase, isDatabaseAvailable } from '@/lib/database/supabase-client';
import { progressiveRenderer, type ProgressiveRenderSession } from './progressive-renderer';
import { streamingRenderer } from './streaming-content-renderer';
import { crossPageDependencies } from '@/lib/webhooks/cross-page-dependencies';
import { phase1ValidationPipeline } from '@/lib/validation/phase1-integration';

export interface SafetyContext {
  context_id: string;
  user_session_id: string;
  current_page_id: string;
  previous_page_id?: string;

  // Navigation state
  navigation_state: 'stable' | 'transitioning' | 'loading' | 'error' | 'unsafe';
  navigation_timestamp: string;
  navigation_type: 'direct' | 'back' | 'forward' | 'refresh' | 'external_link';

  // Active renders
  active_render_sessions: string[];
  active_streaming_sessions: string[];
  pending_validations: string[];

  // Safety mechanisms
  safety_locks: SafetyLock[];
  consistency_barriers: ConsistencyBarrier[];
  fallback_triggers: FallbackTrigger[];

  // Performance tracking
  context_creation_time: string;
  last_safety_check: string;
  safety_violations: SafetyViolation[];

  // Configuration
  safety_level: 'strict' | 'balanced' | 'permissive';
  auto_cleanup_enabled: boolean;
  cross_page_validation_enabled: boolean;

  warnings: string[];
  errors: string[];
}

export interface SafetyLock {
  lock_id: string;
  lock_type: 'render_consistency' | 'navigation_block' | 'content_freeze' | 'validation_hold' | 'custom';
  locked_resource: string; // Page, widget, or resource identifier
  lock_scope: 'page' | 'widget' | 'global' | 'session';

  // Lock conditions
  lock_reason: string;
  lock_priority: number; // 1-10, higher priority locks override lower ones
  auto_release_conditions: LockReleaseCondition[];
  manual_release_required: boolean;

  // Timing
  acquired_at: string;
  expires_at?: string;
  max_duration_ms: number;

  // State
  status: 'active' | 'releasing' | 'released' | 'expired' | 'violated';
  release_count: number;
  violation_count: number;

  metadata?: any;
}

export interface LockReleaseCondition {
  condition_type: 'time_elapsed' | 'render_complete' | 'validation_passed' | 'user_action' | 'navigation_stable';
  condition_params: any;
  condition_met: boolean;
  check_interval_ms?: number;
}

export interface ConsistencyBarrier {
  barrier_id: string;
  barrier_type: 'render_synchronization' | 'validation_checkpoint' | 'navigation_gate' | 'content_consistency';

  // Barrier configuration
  barrier_scope: 'page' | 'cross_page' | 'global';
  blocking_conditions: BarrierCondition[];
  timeout_ms: number;
  auto_pass_on_timeout: boolean;

  // Tracked resources
  monitored_pages: string[];
  monitored_widgets: string[];
  monitored_dependencies: string[];

  // State
  status: 'waiting' | 'checking' | 'passed' | 'failed' | 'timed_out' | 'bypassed';
  conditions_met: number;
  total_conditions: number;
  progress: number; // 0-100%

  // Performance
  created_at: string;
  resolved_at?: string;
  total_wait_time_ms?: number;

  errors: string[];
}

export interface BarrierCondition {
  condition_id: string;
  condition_type: 'render_complete' | 'validation_passed' | 'dependencies_resolved' | 'content_stable' | 'custom';
  target_resource: string;
  condition_params: any;
  status: 'pending' | 'checking' | 'satisfied' | 'failed' | 'timed_out';
  last_check: string;
}

export interface FallbackTrigger {
  trigger_id: string;
  trigger_type: 'safety_violation' | 'timeout' | 'navigation_interrupt' | 'validation_failure' | 'performance_degradation';

  // Trigger conditions
  violation_threshold: number;
  time_threshold_ms: number;
  performance_threshold: number;

  // Actions
  fallback_action: 'static_content' | 'cached_content' | 'error_page' | 'previous_state' | 'custom_handler';
  action_params: any;

  // State
  triggered: boolean;
  trigger_count: number;
  last_triggered?: string;

  // Configuration
  enabled: boolean;
  priority: number;
  cooldown_ms: number;
}

export interface SafetyViolation {
  violation_id: string;
  violation_type: 'render_inconsistency' | 'navigation_collision' | 'validation_failure' | 'timeout' | 'dependency_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';

  // Violation details
  page_id: string;
  widget_id?: string;
  resource_affected: string;
  violation_description: string;

  // Context
  render_session_id?: string;
  streaming_session_id?: string;
  navigation_context?: any;

  // Resolution
  resolution_strategy: 'ignore' | 'retry' | 'fallback' | 'abort' | 'manual_intervention';
  resolved: boolean;
  resolution_time_ms?: number;

  // Impact assessment
  user_impact: 'none' | 'minor_visual' | 'functional_degradation' | 'page_unusable' | 'critical_failure';
  performance_impact: 'none' | 'slight_delay' | 'noticeable_lag' | 'significant_slowdown' | 'system_freeze';

  timestamp: string;
}

export interface CrossPageState {
  state_id: string;
  page_id: string;
  widget_states: Map<string, WidgetRenderState>;

  // Page-level state
  render_phase: 'initializing' | 'skeleton' | 'streaming' | 'completing' | 'complete' | 'error';
  last_updated: string;
  consistency_score: number; // 0-100%

  // Dependencies
  incoming_dependencies: string[];
  outgoing_dependencies: string[];
  dependency_violations: string[];

  // Safety status
  safety_locked: boolean;
  safety_warnings: string[];

  // Performance
  render_start_time: string;
  estimated_completion_ms?: number;
}

export interface WidgetRenderState {
  widget_id: string;
  page_id: string;

  // Render state
  render_status: 'pending' | 'skeleton' | 'streaming' | 'validating' | 'complete' | 'error' | 'fallback';
  content_hash?: string;
  validation_status: 'not_required' | 'pending' | 'passed' | 'failed' | 'bypassed';

  // Safety checks
  cross_page_safe: boolean;
  dependency_check_passed: boolean;
  consistency_verified: boolean;

  // Performance
  render_time_ms?: number;
  chunk_count: number;
  bytes_rendered: number;

  // Errors and warnings
  errors: string[];
  warnings: string[];

  last_updated: string;
}

/**
 * Cross-Page Safety System for Phase 4 Progressive Rendering
 *
 * Features:
 * - Navigation safety during progressive rendering
 * - Cross-page consistency validation and enforcement
 * - Safety locks and barriers for critical operations
 * - Automatic fallback triggers for safety violations
 * - Real-time monitoring of render state across pages
 * - Performance-aware safety mechanisms
 * - Integration with validation and dependency systems
 */
export class CrossPageSafetySystem {
  private safetyContexts = new Map<string, SafetyContext>();
  private crossPageStates = new Map<string, CrossPageState>();
  private activeLocks = new Map<string, SafetyLock>();
  private activeBarriers = new Map<string, ConsistencyBarrier>();
  private activeTriggers = new Map<string, FallbackTrigger>();

  private statistics = {
    total_contexts: 0,
    active_contexts: 0,
    safety_violations: 0,
    locks_acquired: 0,
    barriers_passed: 0,
    fallbacks_triggered: 0,
    consistency_checks: 0,
    average_safety_check_ms: 0
  };

  constructor() {
    console.log(`🛡️ [CrossPageSafety] Cross-page safety system initialized`);
    this.initializeDefaultTriggers();
    this.startSafetyMonitoring();
    this.startConsistencyChecks();
  }

  /**
   * Create a new safety context for a user session
   */
  async createSafetyContext(
    userSessionId: string,
    currentPageId: string,
    options?: {
      safety_level?: SafetyContext['safety_level'];
      previous_page_id?: string;
      navigation_type?: SafetyContext['navigation_type'];
    }
  ): Promise<SafetyContext> {
    const contextId = crypto.randomUUID();

    console.log(`🛡️ [CrossPageSafety] Creating safety context ${contextId} for session ${userSessionId} on page ${currentPageId}`);

    // Check for existing context and handle transition
    const existingContext = await this.findExistingContext(userSessionId);
    if (existingContext) {
      await this.handleContextTransition(existingContext, currentPageId, options?.navigation_type || 'direct');
    }

    const context: SafetyContext = {
      context_id: contextId,
      user_session_id: userSessionId,
      current_page_id: currentPageId,
      previous_page_id: options?.previous_page_id || existingContext?.current_page_id,

      navigation_state: 'loading',
      navigation_timestamp: new Date().toISOString(),
      navigation_type: options?.navigation_type || 'direct',

      active_render_sessions: [],
      active_streaming_sessions: [],
      pending_validations: [],

      safety_locks: [],
      consistency_barriers: [],
      fallback_triggers: [...this.getDefaultFallbackTriggers()],

      context_creation_time: new Date().toISOString(),
      last_safety_check: new Date().toISOString(),
      safety_violations: [],

      safety_level: options?.safety_level || 'balanced',
      auto_cleanup_enabled: true,
      cross_page_validation_enabled: true,

      warnings: [],
      errors: []
    };

    // Initialize cross-page state for current page
    await this.initializeCrossPageState(currentPageId);

    // Perform initial safety checks
    await this.performSafetyChecks(context);

    this.safetyContexts.set(contextId, context);
    this.statistics.total_contexts++;
    this.statistics.active_contexts++;

    console.log(`✅ [CrossPageSafety] Safety context ${contextId} created with ${context.safety_level} safety level`);

    return context;
  }

  /**
   * Register a render session with the safety system
   */
  async registerRenderSession(
    contextId: string,
    renderSessionId: string,
    pageId: string,
    widgetId?: string
  ): Promise<void> {
    const context = this.safetyContexts.get(contextId);
    if (!context) {
      throw new Error(`Safety context ${contextId} not found`);
    }

    console.log(`🛡️ [CrossPageSafety] Registering render session ${renderSessionId} for ${pageId}/${widgetId}`);

    // Add to active sessions
    if (!context.active_render_sessions.includes(renderSessionId)) {
      context.active_render_sessions.push(renderSessionId);
    }

    // Create consistency barrier for cross-page safety
    if (context.cross_page_validation_enabled) {
      await this.createConsistencyBarrier(context, renderSessionId, pageId, widgetId);
    }

    // Update cross-page state
    await this.updateCrossPageState(pageId, widgetId, 'initializing');

    // Check for potential safety issues
    await this.checkRenderSafety(context, renderSessionId, pageId, widgetId);
  }

  /**
   * Register a streaming session with the safety system
   */
  async registerStreamingSession(
    contextId: string,
    streamingSessionId: string,
    pageId: string,
    widgetId?: string
  ): Promise<void> {
    const context = this.safetyContexts.get(contextId);
    if (!context) {
      throw new Error(`Safety context ${contextId} not found`);
    }

    console.log(`🛡️ [CrossPageSafety] Registering streaming session ${streamingSessionId} for ${pageId}/${widgetId}`);

    // Add to active sessions
    if (!context.active_streaming_sessions.includes(streamingSessionId)) {
      context.active_streaming_sessions.push(streamingSessionId);
    }

    // Create safety lock for streaming consistency
    await this.createSafetyLock(context, {
      lock_type: 'render_consistency',
      locked_resource: `${pageId}/${widgetId || 'default'}`,
      lock_scope: widgetId ? 'widget' : 'page',
      lock_reason: `Streaming session ${streamingSessionId} active`,
      lock_priority: 5,
      max_duration_ms: 30000 // 30 seconds max
    });

    await this.updateCrossPageState(pageId, widgetId, 'streaming');
  }

  /**
   * Handle navigation events and ensure safety
   */
  async handleNavigation(
    contextId: string,
    targetPageId: string,
    navigationType: SafetyContext['navigation_type'] = 'direct'
  ): Promise<{ safe: boolean; issues: string[]; actions_taken: string[] }> {
    const context = this.safetyContexts.get(contextId);
    if (!context) {
      return { safe: false, issues: ['Safety context not found'], actions_taken: [] };
    }

    console.log(`🛡️ [CrossPageSafety] Handling navigation from ${context.current_page_id} to ${targetPageId} (${navigationType})`);

    const issues: string[] = [];
    const actionsTaken: string[] = [];

    // Check for active renders
    if (context.active_render_sessions.length > 0 || context.active_streaming_sessions.length > 0) {
      issues.push('Active rendering sessions detected');

      // Apply safety actions based on safety level
      switch (context.safety_level) {
        case 'strict':
          // Block navigation until renders complete
          await this.createNavigationBlock(context, 'Active renders must complete');
          actionsTaken.push('Navigation blocked until renders complete');
          break;

        case 'balanced':
          // Allow navigation but clean up safely
          await this.performSafeNavigationCleanup(context);
          actionsTaken.push('Safe cleanup performed');
          break;

        case 'permissive':
          // Allow navigation with minimal cleanup
          await this.performMinimalCleanup(context);
          actionsTaken.push('Minimal cleanup performed');
          break;
      }
    }

    // Check cross-page dependencies
    const dependencyIssues = await this.checkNavigationDependencies(context.current_page_id, targetPageId);
    if (dependencyIssues.length > 0) {
      issues.push(...dependencyIssues);
    }

    // Update navigation state
    context.previous_page_id = context.current_page_id;
    context.current_page_id = targetPageId;
    context.navigation_type = navigationType;
    context.navigation_timestamp = new Date().toISOString();
    context.navigation_state = issues.length > 0 ? 'unsafe' : 'transitioning';

    const safe = issues.length === 0;

    console.log(`${safe ? '✅' : '⚠️'} [CrossPageSafety] Navigation safety check: ${safe ? 'SAFE' : 'ISSUES DETECTED'}`);

    return { safe, issues, actions_taken: actionsTaken };
  }

  /**
   * Validate cross-page consistency
   */
  async validateCrossPageConsistency(
    pageIds: string[],
    options?: {
      strict_mode?: boolean;
      timeout_ms?: number;
      skip_dependencies?: boolean;
    }
  ): Promise<{
    consistent: boolean;
    consistency_score: number;
    violations: string[];
    page_scores: Map<string, number>;
  }> {
    const validationStart = Date.now();

    console.log(`🛡️ [CrossPageSafety] Validating cross-page consistency for ${pageIds.length} pages`);

    const violations: string[] = [];
    const pageScores = new Map<string, number>();
    let totalScore = 0;

    for (const pageId of pageIds) {
      const pageState = this.crossPageStates.get(pageId);
      if (!pageState) {
        violations.push(`Page state not found for ${pageId}`);
        pageScores.set(pageId, 0);
        continue;
      }

      // Check page consistency
      const pageConsistency = await this.checkPageConsistency(pageState, options);
      pageScores.set(pageId, pageConsistency.score);
      totalScore += pageConsistency.score;

      if (pageConsistency.violations.length > 0) {
        violations.push(...pageConsistency.violations.map(v => `${pageId}: ${v}`));
      }

      // Check dependencies if not skipped
      if (!options?.skip_dependencies) {
        const depViolations = await this.checkPageDependencies(pageId, pageState);
        if (depViolations.length > 0) {
          violations.push(...depViolations.map(v => `${pageId} dependencies: ${v}`));
        }
      }
    }

    const consistencyScore = pageIds.length > 0 ? Math.round(totalScore / pageIds.length) : 100;
    const consistent = violations.length === 0 && consistencyScore >= 90;

    this.statistics.consistency_checks++;
    const checkTime = Date.now() - validationStart;
    this.updateAverageSafetyCheckTime(checkTime);

    console.log(`${consistent ? '✅' : '⚠️'} [CrossPageSafety] Cross-page consistency check completed: ${consistencyScore}% (${checkTime}ms)`);

    return { consistent, consistency_score: consistencyScore, violations, page_scores: pageScores };
  }

  /**
   * Create a safety lock
   */
  async createSafetyLock(
    context: SafetyContext,
    lockConfig: Omit<SafetyLock, 'lock_id' | 'acquired_at' | 'status' | 'release_count' | 'violation_count'>
  ): Promise<string> {
    const lockId = crypto.randomUUID();

    const lock: SafetyLock = {
      lock_id: lockId,
      acquired_at: new Date().toISOString(),
      status: 'active',
      release_count: 0,
      violation_count: 0,
      auto_release_conditions: [],
      ...lockConfig
    };

    // Add expiration if specified
    if (lock.max_duration_ms > 0) {
      lock.expires_at = new Date(Date.now() + lock.max_duration_ms).toISOString();
    }

    context.safety_locks.push(lock);
    this.activeLocks.set(lockId, lock);
    this.statistics.locks_acquired++;

    console.log(`🔒 [CrossPageSafety] Safety lock ${lockId} acquired: ${lock.lock_type} on ${lock.locked_resource}`);

    return lockId;
  }

  /**
   * Release a safety lock
   */
  async releaseSafetyLock(lockId: string, reason: string = 'Manual release'): Promise<boolean> {
    const lock = this.activeLocks.get(lockId);
    if (!lock || lock.status !== 'active') {
      return false;
    }

    lock.status = 'releasing';
    lock.release_count++;

    console.log(`🔓 [CrossPageSafety] Releasing safety lock ${lockId}: ${reason}`);

    // Perform lock-specific cleanup
    await this.performLockCleanup(lock);

    lock.status = 'released';
    this.activeLocks.delete(lockId);

    // Remove from context
    for (const context of this.safetyContexts.values()) {
      const lockIndex = context.safety_locks.findIndex(l => l.lock_id === lockId);
      if (lockIndex > -1) {
        context.safety_locks.splice(lockIndex, 1);
        break;
      }
    }

    console.log(`✅ [CrossPageSafety] Safety lock ${lockId} released`);

    return true;
  }

  // Private implementation methods

  private async findExistingContext(userSessionId: string): Promise<SafetyContext | undefined> {
    for (const context of this.safetyContexts.values()) {
      if (context.user_session_id === userSessionId &&
          ['loading', 'transitioning'].includes(context.navigation_state)) {
        return context;
      }
    }
    return undefined;
  }

  private async handleContextTransition(
    existingContext: SafetyContext,
    newPageId: string,
    navigationType: SafetyContext['navigation_type']
  ): Promise<void> {
    console.log(`🛡️ [CrossPageSafety] Handling context transition from ${existingContext.current_page_id} to ${newPageId}`);

    // Check for active operations
    if (existingContext.active_render_sessions.length > 0 || existingContext.active_streaming_sessions.length > 0) {
      // Create safety violation
      const violation: SafetyViolation = {
        violation_id: crypto.randomUUID(),
        violation_type: 'navigation_collision',
        severity: 'medium',
        page_id: existingContext.current_page_id,
        resource_affected: 'navigation',
        violation_description: `Navigation attempted while ${existingContext.active_render_sessions.length} renders and ${existingContext.active_streaming_sessions.length} streams active`,
        resolution_strategy: 'retry',
        resolved: false,
        user_impact: 'minor_visual',
        performance_impact: 'slight_delay',
        timestamp: new Date().toISOString()
      };

      existingContext.safety_violations.push(violation);
      this.statistics.safety_violations++;
    }

    // Update context state
    existingContext.navigation_state = 'transitioning';
  }

  private async initializeCrossPageState(pageId: string): Promise<void> {
    if (this.crossPageStates.has(pageId)) {
      return; // Already initialized
    }

    const state: CrossPageState = {
      state_id: crypto.randomUUID(),
      page_id: pageId,
      widget_states: new Map<string, WidgetRenderState>(),
      render_phase: 'initializing',
      last_updated: new Date().toISOString(),
      consistency_score: 100,
      incoming_dependencies: [],
      outgoing_dependencies: [],
      dependency_violations: [],
      safety_locked: false,
      safety_warnings: [],
      render_start_time: new Date().toISOString()
    };

    // Get dependencies from Phase 3 system
    try {
      const dependencies = await crossPageDependencies.getPageDependencies(pageId);
      state.incoming_dependencies = dependencies.incoming_pages;
      state.outgoing_dependencies = dependencies.outgoing_pages;
    } catch (error) {
      console.warn(`⚠️ [CrossPageSafety] Failed to get dependencies for ${pageId}:`, error);
    }

    this.crossPageStates.set(pageId, state);

    console.log(`🛡️ [CrossPageSafety] Cross-page state initialized for ${pageId}`);
  }

  private async updateCrossPageState(
    pageId: string,
    widgetId: string | undefined,
    phase: CrossPageState['render_phase']
  ): Promise<void> {
    const state = this.crossPageStates.get(pageId);
    if (!state) {
      await this.initializeCrossPageState(pageId);
      return this.updateCrossPageState(pageId, widgetId, phase);
    }

    state.render_phase = phase;
    state.last_updated = new Date().toISOString();

    // Update widget state if specified
    if (widgetId) {
      let widgetState = state.widget_states.get(widgetId);
      if (!widgetState) {
        widgetState = {
          widget_id: widgetId,
          page_id: pageId,
          render_status: 'pending',
          validation_status: 'not_required',
          cross_page_safe: true,
          dependency_check_passed: true,
          consistency_verified: true,
          chunk_count: 0,
          bytes_rendered: 0,
          errors: [],
          warnings: [],
          last_updated: new Date().toISOString()
        };
        state.widget_states.set(widgetId, widgetState);
      }

      widgetState.render_status = this.mapPhaseToWidgetStatus(phase);
      widgetState.last_updated = new Date().toISOString();
    }

    // Update consistency score
    await this.updateConsistencyScore(state);
  }

  private mapPhaseToWidgetStatus(phase: CrossPageState['render_phase']): WidgetRenderState['render_status'] {
    const mapping: Record<string, WidgetRenderState['render_status']> = {
      'initializing': 'pending',
      'skeleton': 'skeleton',
      'streaming': 'streaming',
      'completing': 'validating',
      'complete': 'complete',
      'error': 'error'
    };
    return mapping[phase] || 'pending';
  }

  private async performSafetyChecks(context: SafetyContext): Promise<void> {
    const checkStart = Date.now();

    console.log(`🛡️ [CrossPageSafety] Performing safety checks for context ${context.context_id}`);

    // Check for lock violations
    await this.checkLockViolations(context);

    // Check barrier conditions
    await this.checkBarrierConditions(context);

    // Check fallback triggers
    await this.checkFallbackTriggers(context);

    // Update last safety check time
    context.last_safety_check = new Date().toISOString();

    const checkTime = Date.now() - checkStart;
    this.updateAverageSafetyCheckTime(checkTime);
  }

  private async createConsistencyBarrier(
    context: SafetyContext,
    renderSessionId: string,
    pageId: string,
    widgetId?: string
  ): Promise<void> {
    const barrierId = crypto.randomUUID();

    const barrier: ConsistencyBarrier = {
      barrier_id: barrierId,
      barrier_type: 'render_synchronization',
      barrier_scope: 'page',
      blocking_conditions: [
        {
          condition_id: crypto.randomUUID(),
          condition_type: 'render_complete',
          target_resource: renderSessionId,
          condition_params: { pageId, widgetId },
          status: 'pending',
          last_check: new Date().toISOString()
        }
      ],
      timeout_ms: 10000, // 10 seconds
      auto_pass_on_timeout: true,
      monitored_pages: [pageId],
      monitored_widgets: widgetId ? [widgetId] : [],
      monitored_dependencies: [],
      status: 'waiting',
      conditions_met: 0,
      total_conditions: 1,
      progress: 0,
      created_at: new Date().toISOString(),
      errors: []
    };

    context.consistency_barriers.push(barrier);
    this.activeBarriers.set(barrierId, barrier);

    console.log(`🚧 [CrossPageSafety] Consistency barrier ${barrierId} created for render session ${renderSessionId}`);
  }

  private async createNavigationBlock(context: SafetyContext, reason: string): Promise<void> {
    const lockId = await this.createSafetyLock(context, {
      lock_type: 'navigation_block',
      locked_resource: 'navigation',
      lock_scope: 'global',
      lock_reason: reason,
      lock_priority: 9,
      max_duration_ms: 15000, // 15 seconds max
      manual_release_required: false,
      auto_release_conditions: [
        {
          condition_type: 'render_complete',
          condition_params: { sessions: context.active_render_sessions },
          condition_met: false,
          check_interval_ms: 1000
        }
      ]
    });

    context.navigation_state = 'unsafe';

    console.log(`🚫 [CrossPageSafety] Navigation blocked: ${reason} (Lock ${lockId})`);
  }

  private async performSafeNavigationCleanup(context: SafetyContext): Promise<void> {
    console.log(`🧹 [CrossPageSafety] Performing safe navigation cleanup for context ${context.context_id}`);

    // Cancel non-critical render sessions
    for (const sessionId of context.active_render_sessions) {
      try {
        await progressiveRenderer.cancelRenderSession(sessionId);
        console.log(`🛑 [CrossPageSafety] Cancelled render session ${sessionId}`);
      } catch (error) {
        console.warn(`⚠️ [CrossPageSafety] Failed to cancel render session ${sessionId}:`, error);
      }
    }

    // Complete streaming sessions gracefully
    for (const sessionId of context.active_streaming_sessions) {
      try {
        await streamingRenderer.completeStreaming(sessionId);
        console.log(`✅ [CrossPageSafety] Completed streaming session ${sessionId}`);
      } catch (error) {
        console.warn(`⚠️ [CrossPageSafety] Failed to complete streaming session ${sessionId}:`, error);
      }
    }

    // Clear active sessions
    context.active_render_sessions = [];
    context.active_streaming_sessions = [];
    context.navigation_state = 'transitioning';
  }

  private async performMinimalCleanup(context: SafetyContext): Promise<void> {
    console.log(`🧹 [CrossPageSafety] Performing minimal cleanup for context ${context.context_id}`);

    // Just clear the session lists, let them complete naturally
    context.active_render_sessions = [];
    context.active_streaming_sessions = [];
    context.navigation_state = 'transitioning';
  }

  private async checkNavigationDependencies(fromPageId: string, toPageId: string): Promise<string[]> {
    const issues: string[] = [];

    try {
      // Check if navigation would break dependencies
      const result = await crossPageDependencies.validatePageConsistency(fromPageId);
      if (!result.consistent) {
        issues.push(`Dependency violations on source page: ${result.issues.join(', ')}`);
      }

      const targetResult = await crossPageDependencies.validatePageConsistency(toPageId);
      if (!targetResult.consistent) {
        issues.push(`Dependency violations on target page: ${targetResult.issues.join(', ')}`);
      }
    } catch (error) {
      issues.push(`Dependency check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return issues;
  }

  private async checkPageConsistency(
    pageState: CrossPageState,
    options?: { strict_mode?: boolean; timeout_ms?: number }
  ): Promise<{ score: number; violations: string[] }> {
    const violations: string[] = [];
    let score = 100;

    // Check render phase consistency
    if (pageState.render_phase === 'error') {
      violations.push('Page in error state');
      score -= 50;
    }

    // Check widget consistency
    let inconsistentWidgets = 0;
    for (const [widgetId, widgetState] of pageState.widget_states.entries()) {
      if (!widgetState.consistency_verified) {
        violations.push(`Widget ${widgetId} consistency not verified`);
        inconsistentWidgets++;
      }

      if (widgetState.errors.length > 0) {
        violations.push(`Widget ${widgetId} has ${widgetState.errors.length} errors`);
        score -= 10;
      }
    }

    // Reduce score based on inconsistent widgets
    if (pageState.widget_states.size > 0) {
      const inconsistencyRatio = inconsistentWidgets / pageState.widget_states.size;
      score -= Math.round(inconsistencyRatio * 30);
    }

    return { score: Math.max(0, score), violations };
  }

  private async checkPageDependencies(pageId: string, pageState: CrossPageState): Promise<string[]> {
    const violations: string[] = [];

    // Check if dependency violations exist
    if (pageState.dependency_violations.length > 0) {
      violations.push(...pageState.dependency_violations);
    }

    return violations;
  }

  private async updateConsistencyScore(state: CrossPageState): Promise<void> {
    const { score } = await this.checkPageConsistency(state);
    state.consistency_score = score;
  }

  private async checkRenderSafety(
    context: SafetyContext,
    renderSessionId: string,
    pageId: string,
    widgetId?: string
  ): Promise<void> {
    // Check for concurrent renders that might conflict
    const concurrentRenders = context.active_render_sessions.length;
    if (concurrentRenders > 3) { // Arbitrary threshold
      const violation: SafetyViolation = {
        violation_id: crypto.randomUUID(),
        violation_type: 'render_inconsistency',
        severity: 'medium',
        page_id: pageId,
        widget_id: widgetId,
        resource_affected: 'render_performance',
        violation_description: `Too many concurrent renders: ${concurrentRenders}`,
        resolution_strategy: 'fallback',
        resolved: false,
        user_impact: 'noticeable_lag',
        performance_impact: 'significant_slowdown',
        timestamp: new Date().toISOString()
      };

      context.safety_violations.push(violation);
      this.statistics.safety_violations++;
    }
  }

  private async checkLockViolations(context: SafetyContext): Promise<void> {
    const now = Date.now();

    for (const lock of context.safety_locks) {
      if (lock.status !== 'active') continue;

      // Check expiration
      if (lock.expires_at && new Date(lock.expires_at).getTime() <= now) {
        lock.status = 'expired';
        console.warn(`⏰ [CrossPageSafety] Lock ${lock.lock_id} expired`);
      }

      // Check auto-release conditions
      for (const condition of lock.auto_release_conditions) {
        const conditionMet = await this.checkLockReleaseCondition(condition);
        if (conditionMet && !condition.condition_met) {
          condition.condition_met = true;

          // If all conditions met, release lock
          const allConditionsMet = lock.auto_release_conditions.every(c => c.condition_met);
          if (allConditionsMet) {
            await this.releaseSafetyLock(lock.lock_id, 'Auto-release conditions met');
          }
        }
      }
    }
  }

  private async checkBarrierConditions(context: SafetyContext): Promise<void> {
    for (const barrier of context.consistency_barriers) {
      if (barrier.status !== 'waiting') continue;

      let conditionsMet = 0;

      for (const condition of barrier.blocking_conditions) {
        if (condition.status === 'satisfied') {
          conditionsMet++;
          continue;
        }

        const satisfied = await this.checkBarrierCondition(condition);
        if (satisfied) {
          condition.status = 'satisfied';
          conditionsMet++;
        }
      }

      barrier.conditions_met = conditionsMet;
      barrier.progress = Math.round((conditionsMet / barrier.total_conditions) * 100);

      if (conditionsMet === barrier.total_conditions) {
        barrier.status = 'passed';
        barrier.resolved_at = new Date().toISOString();
        barrier.total_wait_time_ms = Date.now() - new Date(barrier.created_at).getTime();
        this.statistics.barriers_passed++;

        console.log(`🚧 [CrossPageSafety] Consistency barrier ${barrier.barrier_id} passed`);
      }
    }
  }

  private async checkFallbackTriggers(context: SafetyContext): Promise<void> {
    for (const trigger of context.fallback_triggers) {
      if (!trigger.enabled || trigger.triggered) continue;

      const shouldTrigger = await this.evaluateFallbackTrigger(trigger, context);
      if (shouldTrigger) {
        await this.executeFallbackTrigger(trigger, context);
      }
    }
  }

  private async checkLockReleaseCondition(condition: LockReleaseCondition): Promise<boolean> {
    switch (condition.condition_type) {
      case 'time_elapsed':
        const elapsed = Date.now() - (condition.condition_params.startTime || Date.now());
        return elapsed >= condition.condition_params.duration_ms;

      case 'render_complete':
        // Check if render sessions are complete
        const sessions = condition.condition_params.sessions || [];
        for (const sessionId of sessions) {
          const session = progressiveRenderer.getActiveSession(sessionId);
          if (session && session.status !== 'completed' && session.status !== 'failed') {
            return false;
          }
        }
        return true;

      default:
        return false;
    }
  }

  private async checkBarrierCondition(condition: BarrierCondition): Promise<boolean> {
    condition.last_check = new Date().toISOString();

    switch (condition.condition_type) {
      case 'render_complete':
        const session = progressiveRenderer.getActiveSession(condition.target_resource);
        return !session || session.status === 'completed' || session.status === 'failed';

      case 'validation_passed':
        try {
          const result = await phase1ValidationPipeline.getValidatedContent(
            condition.condition_params.pageId,
            condition.condition_params.widgetId
          );
          return result.valid;
        } catch {
          return false;
        }

      default:
        return false;
    }
  }

  private async evaluateFallbackTrigger(trigger: FallbackTrigger, context: SafetyContext): Promise<boolean> {
    switch (trigger.trigger_type) {
      case 'safety_violation':
        return context.safety_violations.length >= trigger.violation_threshold;

      case 'timeout':
        const elapsed = Date.now() - new Date(context.context_creation_time).getTime();
        return elapsed >= trigger.time_threshold_ms;

      default:
        return false;
    }
  }

  private async executeFallbackTrigger(trigger: FallbackTrigger, context: SafetyContext): Promise<void> {
    console.log(`🚨 [CrossPageSafety] Executing fallback trigger ${trigger.trigger_id}: ${trigger.trigger_type}`);

    trigger.triggered = true;
    trigger.trigger_count++;
    trigger.last_triggered = new Date().toISOString();
    this.statistics.fallbacks_triggered++;

    // Execute fallback action
    switch (trigger.fallback_action) {
      case 'static_content':
        await this.fallbackToStaticContent(context);
        break;

      case 'cached_content':
        await this.fallbackToCachedContent(context);
        break;

      case 'previous_state':
        await this.fallbackToPreviousState(context);
        break;

      default:
        console.warn(`⚠️ [CrossPageSafety] Unknown fallback action: ${trigger.fallback_action}`);
        break;
    }
  }

  private async fallbackToStaticContent(context: SafetyContext): Promise<void> {
    console.log(`📄 [CrossPageSafety] Falling back to static content for context ${context.context_id}`);

    // Cancel all active operations
    await this.performSafeNavigationCleanup(context);

    // Set navigation state to stable
    context.navigation_state = 'stable';
  }

  private async fallbackToCachedContent(context: SafetyContext): Promise<void> {
    console.log(`💾 [CrossPageSafety] Falling back to cached content for context ${context.context_id}`);

    try {
      // Try to get cached content from Phase 2 system
      const cachedContent = await intelligentCache.getCachedContent(
        context.current_page_id,
        'default'
      );

      if (cachedContent) {
        await this.performSafeNavigationCleanup(context);
        context.navigation_state = 'stable';
      } else {
        // Fall back to static content if no cache
        await this.fallbackToStaticContent(context);
      }
    } catch (error) {
      console.error(`❌ [CrossPageSafety] Failed to fallback to cached content:`, error);
      await this.fallbackToStaticContent(context);
    }
  }

  private async fallbackToPreviousState(context: SafetyContext): Promise<void> {
    console.log(`⏪ [CrossPageSafety] Falling back to previous state for context ${context.context_id}`);

    if (context.previous_page_id) {
      // Reset to previous page
      context.current_page_id = context.previous_page_id;
      context.previous_page_id = undefined;
    }

    await this.performSafeNavigationCleanup(context);
    context.navigation_state = 'stable';
  }

  private async performLockCleanup(lock: SafetyLock): Promise<void> {
    console.log(`🧹 [CrossPageSafety] Performing cleanup for lock ${lock.lock_id}`);

    // Perform lock-specific cleanup based on lock type
    switch (lock.lock_type) {
      case 'navigation_block':
        // No specific cleanup needed for navigation blocks
        break;

      case 'render_consistency':
        // Ensure render operations are properly cleaned up
        break;

      default:
        console.log(`🔧 [CrossPageSafety] Custom lock cleanup for ${lock.lock_type}`);
        break;
    }
  }

  private getDefaultFallbackTriggers(): FallbackTrigger[] {
    return [
      {
        trigger_id: crypto.randomUUID(),
        trigger_type: 'safety_violation',
        violation_threshold: 3,
        time_threshold_ms: 0,
        performance_threshold: 0,
        fallback_action: 'cached_content',
        action_params: {},
        triggered: false,
        trigger_count: 0,
        enabled: true,
        priority: 5,
        cooldown_ms: 30000
      },
      {
        trigger_id: crypto.randomUUID(),
        trigger_type: 'timeout',
        violation_threshold: 0,
        time_threshold_ms: 15000, // 15 seconds
        performance_threshold: 0,
        fallback_action: 'static_content',
        action_params: {},
        triggered: false,
        trigger_count: 0,
        enabled: true,
        priority: 8,
        cooldown_ms: 60000
      }
    ];
  }

  private initializeDefaultTriggers(): void {
    console.log(`🚨 [CrossPageSafety] Default fallback triggers initialized`);
  }

  private startSafetyMonitoring(): void {
    setInterval(async () => {
      await this.performGlobalSafetyCheck();
    }, 5000); // Every 5 seconds

    console.log(`🛡️ [CrossPageSafety] Safety monitoring started`);
  }

  private startConsistencyChecks(): void {
    setInterval(async () => {
      await this.performGlobalConsistencyCheck();
    }, 15000); // Every 15 seconds

    console.log(`🔄 [CrossPageSafety] Consistency checks started`);
  }

  private async performGlobalSafetyCheck(): Promise<void> {
    for (const context of this.safetyContexts.values()) {
      if (['loading', 'transitioning'].includes(context.navigation_state)) {
        await this.performSafetyChecks(context);
      }
    }
  }

  private async performGlobalConsistencyCheck(): Promise<void> {
    const pageIds = Array.from(this.crossPageStates.keys());
    if (pageIds.length > 0) {
      await this.validateCrossPageConsistency(pageIds, { timeout_ms: 5000 });
    }
  }

  private updateAverageSafetyCheckTime(checkTimeMs: number): void {
    const totalChecks = this.statistics.consistency_checks;
    if (totalChecks === 1) {
      this.statistics.average_safety_check_ms = checkTimeMs;
    } else {
      this.statistics.average_safety_check_ms =
        (this.statistics.average_safety_check_ms * (totalChecks - 1) + checkTimeMs) / totalChecks;
    }
  }

  /**
   * Get cross-page safety statistics
   */
  getCrossPageSafetyStatistics(): typeof this.statistics & {
    active_locks: number;
    active_barriers: number;
    active_page_states: number;
  } {
    return {
      ...this.statistics,
      active_locks: this.activeLocks.size,
      active_barriers: this.activeBarriers.size,
      active_page_states: this.crossPageStates.size
    };
  }

  /**
   * Get safety context
   */
  getSafetyContext(contextId: string): SafetyContext | undefined {
    return this.safetyContexts.get(contextId);
  }

  /**
   * Get cross-page state
   */
  getCrossPageState(pageId: string): CrossPageState | undefined {
    return this.crossPageStates.get(pageId);
  }

  /**
   * Force cleanup of inactive contexts
   */
  async cleanupInactiveContexts(): Promise<number> {
    const now = Date.now();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes
    let cleaned = 0;

    for (const [contextId, context] of this.safetyContexts.entries()) {
      const age = now - new Date(context.context_creation_time).getTime();

      if (age > inactiveThreshold && context.navigation_state === 'stable') {
        // Clean up locks and barriers
        for (const lock of context.safety_locks) {
          await this.releaseSafetyLock(lock.lock_id, 'Context cleanup');
        }

        this.safetyContexts.delete(contextId);
        cleaned++;
      }
    }

    this.statistics.active_contexts = this.safetyContexts.size;

    console.log(`🧹 [CrossPageSafety] Cleaned up ${cleaned} inactive contexts`);

    return cleaned;
  }
}

// Export singleton instance
export const crossPageSafety = new CrossPageSafetySystem();