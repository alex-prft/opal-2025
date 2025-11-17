/**
 * Approval Manager
 *
 * Manages interactive approval workflow for AI Agent Factory phases.
 * Handles approval requests, notifications, and approval lifecycle management.
 */

import { v4 as uuid } from 'uuid';
import {
  ApprovalRequest,
  ApprovalResponse,
  WorkflowPhase,
  NotificationEvent
} from '../types';
import { SupabaseFactoryClient } from '../integration/supabase-factory-client';
import { FactoryLogger } from './factory-logger';

export interface ApprovalManagerConfig {
  defaultExpirationHours: number;
  maxPendingApprovals: number;
  enableNotifications: boolean;
  autoApprovalRoles: string[];
  requireDualApproval: boolean;
}

export class ApprovalManager {
  private supabaseClient: SupabaseFactoryClient;
  private logger: FactoryLogger;
  private config: ApprovalManagerConfig;

  constructor(
    supabaseClient: SupabaseFactoryClient,
    config: Partial<ApprovalManagerConfig> = {}
  ) {
    this.supabaseClient = supabaseClient;
    this.logger = new FactoryLogger('ApprovalManager');
    
    // Default configuration with enterprise compliance
    this.config = {
      defaultExpirationHours: 24,
      maxPendingApprovals: 10,
      enableNotifications: true,
      autoApprovalRoles: ['admin', 'factory_admin'],
      requireDualApproval: false,
      ...config
    };

    this.logger.info('🔐 [ApprovalManager] Initialized with enterprise configuration', {
      config: this.config
    });
  }

  // =============================================================================
  // Approval Request Management
  // =============================================================================

  /**
   * Request approval for a workflow phase
   */
  async requestApproval(
    specificationId: string,
    phase: WorkflowPhase,
    results: any,
    requestReason?: string
  ): Promise<string> {
    try {
      this.logger.info('📝 [RequestApproval] Creating approval request', {
        specificationId,
        phase,
        reason: requestReason
      });

      // Check for existing pending approvals
      const existingApprovals = await this.getPendingApprovals(specificationId, phase);
      if (existingApprovals.length > 0) {
        this.logger.warning('⚠️ [RequestApproval] Pending approval already exists', {
          specificationId,
          phase,
          existingCount: existingApprovals.length
        });
        return existingApprovals[0].id;
      }

      // Create approval request
      const approvalRequest: ApprovalRequest = {
        specificationId,
        phase,
        results,
        recommendedAction: this.analyzeResults(results),
        reason: requestReason || this.generateApprovalReason(phase, results),
        reviewers: await this.getEligibleReviewers(specificationId, phase),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.config.defaultExpirationHours * 3600000).toISOString()
      };

      // Save approval request to database
      const approvalId = await this.saveApprovalRequest(approvalRequest);

      // Send notifications to reviewers
      if (this.config.enableNotifications) {
        await this.sendApprovalNotifications(approvalRequest, approvalId);
      }

      this.logger.success('✅ [RequestApproval] Approval request created successfully', {
        approvalId,
        specificationId,
        phase,
        reviewers: approvalRequest.reviewers.length
      });

      return approvalId;

    } catch (error) {
      this.logger.error('❌ [RequestApproval] Failed to create approval request', {
        specificationId,
        phase,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Submit approval response
   */
  async submitApproval(
    approvalId: string,
    response: Omit<ApprovalResponse, 'requestId' | 'reviewedAt'>
  ): Promise<void> {
    try {
      this.logger.info('🗳️ [SubmitApproval] Processing approval response', {
        approvalId,
        action: response.action,
        reviewerId: response.reviewerId
      });

      // Get approval request
      const approvalRequest = await this.getApprovalRequest(approvalId);
      if (!approvalRequest) {
        throw new Error(`Approval request ${approvalId} not found`);
      }

      // Validate reviewer authorization
      await this.validateReviewerAuthorization(response.reviewerId, approvalRequest);

      // Create approval response
      const approvalResponse: ApprovalResponse = {
        requestId: approvalId,
        reviewedAt: new Date().toISOString(),
        ...response
      };

      // Save approval response
      await this.saveApprovalResponse(approvalResponse);

      // Update approval request status
      await this.updateApprovalStatus(approvalId, this.mapActionToStatus(response.action));

      // Handle dual approval requirement if configured
      if (this.config.requireDualApproval && response.action === 'approve') {
        const approvalCount = await this.getApprovalCount(approvalId);
        if (approvalCount < 2) {
          this.logger.info('🔄 [SubmitApproval] Dual approval required, waiting for second approval', {
            approvalId,
            currentApprovals: approvalCount
          });
          return;
        }
      }

      // Send notification about approval decision
      if (this.config.enableNotifications) {
        await this.sendApprovalDecisionNotification(approvalRequest, approvalResponse);
      }

      this.logger.success('✅ [SubmitApproval] Approval response processed successfully', {
        approvalId,
        action: response.action,
        finalStatus: this.mapActionToStatus(response.action)
      });

    } catch (error) {
      this.logger.error('❌ [SubmitApproval] Failed to process approval response', {
        approvalId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get approval status for a specification phase
   */
  async getApprovalStatus(specificationId: string, phase: WorkflowPhase): Promise<{
    status: 'none' | 'pending' | 'approved' | 'rejected' | 'expired';
    approvalId?: string;
    reviewedBy?: string;
    reviewedAt?: string;
    feedback?: string;
  }> {
    try {
      // Get most recent approval for this phase
      const approvals = await this.getApprovals(specificationId, phase);
      
      if (approvals.length === 0) {
        return { status: 'none' };
      }

      const latestApproval = approvals[0]; // Assumes sorted by created_at desc

      return {
        status: latestApproval.status,
        approvalId: latestApproval.id,
        reviewedBy: latestApproval.reviewer_id,
        reviewedAt: latestApproval.reviewed_at,
        feedback: latestApproval.reviewer_feedback
      };

    } catch (error) {
      this.logger.error('❌ [GetApprovalStatus] Failed to get approval status', {
        specificationId,
        phase,
        error: (error as Error).message
      });
      
      return { status: 'none' };
    }
  }

  // =============================================================================
  // Approval Analysis and Recommendations
  // =============================================================================

  /**
   * Analyze phase results and recommend approval action
   */
  private analyzeResults(results: any): 'approve' | 'reject' | 'request_revision' {
    try {
      // Basic analysis based on confidence score
      if (results.confidenceScore >= 85) {
        return 'approve';
      } else if (results.confidenceScore >= 60) {
        return 'request_revision';
      } else {
        return 'reject';
      }
    } catch (error) {
      this.logger.warning('⚠️ [AnalyzeResults] Failed to analyze results, defaulting to manual review', {
        error: (error as Error).message
      });
      return 'request_revision';
    }
  }

  /**
   * Generate appropriate approval reason based on phase and results
   */
  private generateApprovalReason(phase: WorkflowPhase, results: any): string {
    const reasons = {
      clarification: `Phase ${phase} completed with ${results.confidenceScore || 'unknown'}% confidence. Requirements clarification needs review for completeness and accuracy.`,
      documentation: `Technical documentation generated with ${results.confidenceScore || 'unknown'}% confidence. Please review specifications for implementation readiness.`,
      parallel_development: `Parallel development phase completed. Please review prompt engineering, tool integration, and dependency management outputs for quality and consistency.`,
      implementation: `Agent implementation completed with ${results.buildStatus?.success ? 'successful' : 'failed'} build status. Code review and validation required.`,
      validation: `Validation phase completed with ${results.approvalStatus || 'pending'} status. Security, compliance, and functionality tests need approval.`,
      delivery: `Final delivery package prepared. Documentation, deployment artifacts, and training materials ready for approval.`
    };

    return reasons[phase] || `Phase ${phase} completed and requires approval to proceed.`;
  }

  /**
   * Get eligible reviewers for a specification and phase
   */
  private async getEligibleReviewers(specificationId: string, phase: WorkflowPhase): Promise<string[]> {
    try {
      // In a real implementation, this would query user roles and permissions
      // For now, return configured reviewers based on phase requirements
      
      const phaseReviewers = {
        clarification: ['requirements_analyst', 'product_manager'],
        documentation: ['tech_lead', 'senior_engineer'],
        parallel_development: ['tech_lead', 'prompt_engineer', 'integration_specialist'],
        implementation: ['senior_engineer', 'tech_lead'],
        validation: ['qa_engineer', 'security_analyst'],
        delivery: ['product_manager', 'deployment_engineer']
      };

      const eligibleRoles = phaseReviewers[phase] || ['admin'];
      
      // In production, this would query actual users with these roles
      // For now, return placeholder reviewers
      return ['admin', 'factory_reviewer'];

    } catch (error) {
      this.logger.warning('⚠️ [GetEligibleReviewers] Failed to get eligible reviewers, using defaults', {
        specificationId,
        phase,
        error: (error as Error).message
      });
      
      return ['admin'];
    }
  }

  // =============================================================================
  // Database Operations
  // =============================================================================

  /**
   * Save approval request to database
   */
  private async saveApprovalRequest(request: ApprovalRequest): Promise<string> {
    try {
      const approvalId = uuid();

      // Use Supabase client to insert approval request
      const { error } = await this.supabaseClient['client']
        .from('agent_factory_approvals')
        .insert({
          id: approvalId,
          specification_id: request.specificationId,
          phase: request.phase,
          requested_action: request.recommendedAction,
          request_reason: request.reason,
          phase_results: request.results,
          status: 'pending',
          created_at: request.createdAt,
          expires_at: request.expiresAt,
          notifications_sent: 0
        });

      if (error) {
        throw new Error(`Failed to save approval request: ${error.message}`);
      }

      return approvalId;

    } catch (error) {
      this.logger.error('❌ [SaveApprovalRequest] Database operation failed', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Save approval response to database
   */
  private async saveApprovalResponse(response: ApprovalResponse): Promise<void> {
    try {
      // Update the approval record with reviewer response
      const { error } = await this.supabaseClient['client']
        .from('agent_factory_approvals')
        .update({
          reviewer_id: response.reviewerId,
          reviewed_at: response.reviewedAt,
          reviewer_feedback: response.feedback
        })
        .eq('id', response.requestId);

      if (error) {
        throw new Error(`Failed to save approval response: ${error.message}`);
      }

    } catch (error) {
      this.logger.error('❌ [SaveApprovalResponse] Database operation failed', {
        requestId: response.requestId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Update approval status
   */
  private async updateApprovalStatus(approvalId: string, status: string): Promise<void> {
    try {
      const { error } = await this.supabaseClient['client']
        .from('agent_factory_approvals')
        .update({ status })
        .eq('id', approvalId);

      if (error) {
        throw new Error(`Failed to update approval status: ${error.message}`);
      }

    } catch (error) {
      this.logger.error('❌ [UpdateApprovalStatus] Database operation failed', {
        approvalId,
        status,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get approval request by ID
   */
  private async getApprovalRequest(approvalId: string): Promise<any> {
    try {
      const { data, error } = await this.supabaseClient['client']
        .from('agent_factory_approvals')
        .select('*')
        .eq('id', approvalId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to get approval request: ${error.message}`);
      }

      return data;

    } catch (error) {
      this.logger.error('❌ [GetApprovalRequest] Database operation failed', {
        approvalId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get pending approvals for specification and phase
   */
  private async getPendingApprovals(specificationId: string, phase?: WorkflowPhase): Promise<any[]> {
    try {
      let query = this.supabaseClient['client']
        .from('agent_factory_approvals')
        .select('*')
        .eq('specification_id', specificationId)
        .eq('status', 'pending');

      if (phase) {
        query = query.eq('phase', phase);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get pending approvals: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      this.logger.error('❌ [GetPendingApprovals] Database operation failed', {
        specificationId,
        phase,
        error: (error as Error).message
      });
      return [];
    }
  }

  /**
   * Get all approvals for specification and phase
   */
  private async getApprovals(specificationId: string, phase: WorkflowPhase): Promise<any[]> {
    try {
      const { data, error } = await this.supabaseClient['client']
        .from('agent_factory_approvals')
        .select('*')
        .eq('specification_id', specificationId)
        .eq('phase', phase)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get approvals: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      this.logger.error('❌ [GetApprovals] Database operation failed', {
        specificationId,
        phase,
        error: (error as Error).message
      });
      return [];
    }
  }

  /**
   * Get approval count for dual approval scenarios
   */
  private async getApprovalCount(approvalId: string): Promise<number> {
    try {
      // For dual approval, count approved responses for this request
      // This would require a separate approval_responses table in production
      // For now, return 1 (assuming single approval model)
      return 1;

    } catch (error) {
      this.logger.error('❌ [GetApprovalCount] Failed to get approval count', {
        approvalId,
        error: (error as Error).message
      });
      return 0;
    }
  }

  // =============================================================================
  // Notification System
  // =============================================================================

  /**
   * Send approval notifications to eligible reviewers
   */
  private async sendApprovalNotifications(request: ApprovalRequest, approvalId: string): Promise<void> {
    try {
      const notificationEvent: NotificationEvent = {
        type: 'approval_needed',
        specificationId: request.specificationId,
        phase: request.phase,
        message: `Approval needed for ${request.phase} phase: ${request.reason}`,
        severity: 'info',
        recipients: request.reviewers,
        metadata: {
          approvalId,
          expiresAt: request.expiresAt,
          recommendedAction: request.recommendedAction
        }
      };

      // In production, this would integrate with email/Slack/Teams notification systems
      this.logger.info('📧 [SendApprovalNotifications] Approval notifications sent', {
        approvalId,
        recipients: request.reviewers.length,
        phase: request.phase
      });

      // TODO: Integrate with OSA's notification system

    } catch (error) {
      this.logger.warning('⚠️ [SendApprovalNotifications] Failed to send notifications', {
        approvalId,
        error: (error as Error).message
      });
    }
  }

  /**
   * Send approval decision notification
   */
  private async sendApprovalDecisionNotification(
    request: ApprovalRequest,
    response: ApprovalResponse
  ): Promise<void> {
    try {
      const notificationEvent: NotificationEvent = {
        type: response.action === 'approve' ? 'phase_completed' : 'error_occurred',
        specificationId: request.specificationId,
        phase: request.phase,
        message: `${request.phase} phase ${response.action}ed by ${response.reviewerId}${response.feedback ? `: ${response.feedback}` : ''}`,
        severity: response.action === 'approve' ? 'success' : 'warning',
        recipients: ['agent_creator'], // Would be actual user who created the agent
        metadata: {
          action: response.action,
          reviewerId: response.reviewerId,
          feedback: response.feedback
        }
      };

      this.logger.info('📢 [SendApprovalDecisionNotification] Decision notification sent', {
        approvalId: response.requestId,
        action: response.action,
        phase: request.phase
      });

      // TODO: Integrate with OSA's notification system

    } catch (error) {
      this.logger.warning('⚠️ [SendApprovalDecisionNotification] Failed to send decision notification', {
        approvalId: response.requestId,
        error: (error as Error).message
      });
    }
  }

  // =============================================================================
  // Validation and Authorization
  // =============================================================================

  /**
   * Validate reviewer authorization
   */
  private async validateReviewerAuthorization(reviewerId: string, request: ApprovalRequest): Promise<void> {
    try {
      // In production, this would validate reviewer permissions and role-based access
      // For now, perform basic validation

      if (!reviewerId || reviewerId.trim() === '') {
        throw new Error('Reviewer ID is required');
      }

      // Check if reviewer is in eligible reviewers list
      if (!request.reviewers.includes(reviewerId) && !this.config.autoApprovalRoles.includes(reviewerId)) {
        throw new Error(`Reviewer ${reviewerId} is not authorized for this approval`);
      }

      // Check if approval has expired
      if (new Date() > new Date(request.expiresAt)) {
        throw new Error('Approval request has expired');
      }

      this.logger.debug('✅ [ValidateReviewerAuthorization] Reviewer authorization validated', {
        reviewerId,
        phase: request.phase
      });

    } catch (error) {
      this.logger.error('❌ [ValidateReviewerAuthorization] Authorization validation failed', {
        reviewerId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  // =============================================================================
  // Utility Methods
  // =============================================================================

  /**
   * Map approval action to database status
   */
  private mapActionToStatus(action: 'approve' | 'reject' | 'request_revision'): string {
    const statusMap = {
      'approve': 'approved',
      'reject': 'rejected',
      'request_revision': 'rejected' // Treated as rejection requiring revision
    };

    return statusMap[action] || 'pending';
  }

  /**
   * Clean up expired approval requests
   */
  async cleanupExpiredApprovals(): Promise<number> {
    try {
      this.logger.info('🧹 [CleanupExpiredApprovals] Starting expired approvals cleanup');

      const { data, error } = await this.supabaseClient['client']
        .from('agent_factory_approvals')
        .update({ status: 'expired' })
        .eq('status', 'pending')
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) {
        throw new Error(`Failed to cleanup expired approvals: ${error.message}`);
      }

      const cleanedCount = data?.length || 0;

      this.logger.success('✅ [CleanupExpiredApprovals] Expired approvals cleanup completed', {
        cleanedCount
      });

      return cleanedCount;

    } catch (error) {
      this.logger.error('❌ [CleanupExpiredApprovals] Cleanup failed', {
        error: (error as Error).message
      });
      return 0;
    }
  }

  /**
   * Get approval statistics
   */
  async getApprovalStatistics(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    expired: number;
    averageApprovalTime: number;
  }> {
    try {
      const { data, error } = await this.supabaseClient['client']
        .from('agent_factory_approvals')
        .select('status, created_at, reviewed_at');

      if (error) {
        throw new Error(`Failed to get approval statistics: ${error.message}`);
      }

      const approvals = data || [];
      const stats = {
        total: approvals.length,
        pending: approvals.filter(a => a.status === 'pending').length,
        approved: approvals.filter(a => a.status === 'approved').length,
        rejected: approvals.filter(a => a.status === 'rejected').length,
        expired: approvals.filter(a => a.status === 'expired').length,
        averageApprovalTime: 0
      };

      // Calculate average approval time for completed approvals
      const completedApprovals = approvals.filter(a => a.reviewed_at && a.created_at);
      if (completedApprovals.length > 0) {
        const totalTime = completedApprovals.reduce((sum, approval) => {
          const created = new Date(approval.created_at).getTime();
          const reviewed = new Date(approval.reviewed_at).getTime();
          return sum + (reviewed - created);
        }, 0);
        
        stats.averageApprovalTime = Math.round(totalTime / completedApprovals.length / 3600000 * 100) / 100; // Hours
      }

      return stats;

    } catch (error) {
      this.logger.error('❌ [GetApprovalStatistics] Failed to get statistics', {
        error: (error as Error).message
      });
      
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        expired: 0,
        averageApprovalTime: 0
      };
    }
  }

  /**
   * Get current configuration
   */
  getConfiguration(): ApprovalManagerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfiguration(updates: Partial<ApprovalManagerConfig>): void {
    this.config = { ...this.config, ...updates };
    this.logger.info('🔧 [UpdateConfiguration] Approval manager configuration updated', {
      updates
    });
  }
}