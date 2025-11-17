/**
 * Factory Workflow Engine
 *
 * Core orchestrator for the 6-phase AI Agent Factory workflow system.
 * Manages the complete lifecycle from requirements clarification to delivery.
 */

import { v4 as uuid } from 'uuid';
import {
  AgentRequirements,
  AgentSpecification,
  WorkflowPhase,
  WorkflowStatus,
  PhaseResult,
  PhaseExecutionContext,
  WorkflowEngineConfig,
  ClarificationResults,
  AgentDocumentation,
  ParallelDevelopmentResults,
  ImplementationResults,
  ValidationResults,
  DeliveryResults,
  FactoryError,
  AuditLogEntry
} from '../types';
import { ClaudeFactoryClient } from '../integration/claude-factory-client';
import { SupabaseFactoryClient } from '../integration/supabase-factory-client';
import { FactoryLogger } from '../utils/factory-logger';
import { ApprovalManager } from '../utils/approval-manager';

export class FactoryWorkflowEngine {
  private config: WorkflowEngineConfig;
  private claudeClient: ClaudeFactoryClient;
  private supabaseClient: SupabaseFactoryClient;
  private logger: FactoryLogger;
  private approvalManager: ApprovalManager;

  constructor(config: Partial<WorkflowEngineConfig> = {}) {
    // Default configuration with enterprise compliance
    this.config = {
      enableInteractiveMode: true,
      autoApprovalThreshold: 85, // 85% confidence for auto-approval
      maxRetries: 3,
      timeoutPerPhase: 60, // 60 minutes per phase
      enableAuditLogging: true,
      complianceLevel: 'enterprise',
      ...config
    };

    // Initialize clients and utilities
    this.claudeClient = new ClaudeFactoryClient();
    this.supabaseClient = new SupabaseFactoryClient();
    this.logger = new FactoryLogger('FactoryWorkflowEngine');
    this.approvalManager = new ApprovalManager(this.supabaseClient);

    this.logger.info('🏭 [FactoryWorkflowEngine] Initialized with enterprise configuration', {
      config: this.config
    });
  }

  // =============================================================================
  // Main Workflow Orchestration
  // =============================================================================

  /**
   * Create a new AI agent through the complete 6-phase workflow
   */
  async createAgent(requirements: AgentRequirements): Promise<AgentSpecification> {
    this.logger.info('🚀 [CreateAgent] Starting agent creation workflow', {
      agentName: requirements.name,
      domain: requirements.domain,
      complexity: requirements.complexity
    });

    // Create initial specification
    const specification = await this.initializeSpecification(requirements);

    try {
      // Execute all 6 phases in sequence
      await this.executePhase0Clarification(specification);
      await this.executePhase1Documentation(specification);
      await this.executePhase2ParallelDevelopment(specification);
      await this.executePhase3Implementation(specification);
      await this.executePhase4Validation(specification);
      await this.executePhase5Delivery(specification);

      // Mark as completed
      specification.status = 'completed';
      specification.currentPhase = 'completed';
      await this.saveSpecification(specification);

      this.logger.success('✅ [CreateAgent] Agent creation completed successfully', {
        agentId: specification.id,
        totalTime: Date.now() - new Date(specification.createdAt).getTime()
      });

      return specification;

    } catch (error) {
      await this.handleWorkflowError(specification, error as Error);
      throw error;
    }
  }

  // =============================================================================
  // Phase Execution Methods
  // =============================================================================

  /**
   * Phase 0: Clarification - Main agent gathers detailed requirements
   */
  private async executePhase0Clarification(specification: AgentSpecification): Promise<void> {
    this.logger.info('📋 [Phase0] Starting clarification phase', {
      agentId: specification.id
    });

    const context = this.createPhaseContext(specification, 'clarification');

    try {
      // Execute clarification using Claude API
      const clarificationPrompt = this.buildClarificationPrompt(specification.requirements);
      const response = await this.claudeClient.executeSubagentPhase(
        'clarification',
        {
          input: clarificationPrompt,
          context: {
            requirements: specification.requirements,
            interactiveMode: this.config.enableInteractiveMode
          }
        }
      );

      const clarificationResults: ClarificationResults = this.parseClarificationResults(response);

      // Save phase results
      const phaseResult: PhaseResult = {
        phase: 'clarification',
        success: true,
        results: clarificationResults,
        confidenceScore: clarificationResults.confidenceScore,
        executionTime: Date.now() - new Date(context.startTime).getTime(),
        resourcesUsed: {
          claudeApiCalls: 1,
          supabaseQueries: 2,
          processingTime: Date.now() - new Date(context.startTime).getTime(),
          memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
          estimatedCost: 50 // cents
        },
        nextPhaseReady: true,
        requiresApproval: clarificationResults.confidenceScore < this.config.autoApprovalThreshold
      };

      await this.savePhaseResult(specification.id, phaseResult);

      // Update specification
      specification.clarificationResults = clarificationResults;
      specification.currentPhase = 'documentation';

      // Handle approval if needed
      if (phaseResult.requiresApproval && this.config.enableInteractiveMode) {
        await this.requestApproval(specification, 'clarification', clarificationResults);
      }

      this.logger.success('✅ [Phase0] Clarification phase completed', {
        agentId: specification.id,
        confidence: clarificationResults.confidenceScore,
        requiresApproval: phaseResult.requiresApproval
      });

    } catch (error) {
      await this.handlePhaseError(specification, 'clarification', error as Error, context);
      throw error;
    }
  }

  /**
   * Phase 1: Documentation - Planner subagent creates comprehensive specifications
   */
  private async executePhase1Documentation(specification: AgentSpecification): Promise<void> {
    this.logger.info('📚 [Phase1] Starting documentation phase', {
      agentId: specification.id
    });

    const context = this.createPhaseContext(specification, 'documentation');

    try {
      const documentationPrompt = this.buildDocumentationPrompt(
        specification.requirements,
        specification.clarificationResults!
      );

      const response = await this.claudeClient.executeSubagentPhase(
        'planner',
        {
          input: documentationPrompt,
          context: {
            requirements: specification.requirements,
            clarificationResults: specification.clarificationResults
          }
        }
      );

      const documentationResults: AgentDocumentation = this.parseDocumentationResults(response);

      const phaseResult: PhaseResult = {
        phase: 'documentation',
        success: true,
        results: documentationResults,
        confidenceScore: documentationResults.confidenceScore,
        executionTime: Date.now() - new Date(context.startTime).getTime(),
        resourcesUsed: {
          claudeApiCalls: 1,
          supabaseQueries: 2,
          processingTime: Date.now() - new Date(context.startTime).getTime(),
          memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
          estimatedCost: 75
        },
        nextPhaseReady: true,
        requiresApproval: documentationResults.confidenceScore < this.config.autoApprovalThreshold
      };

      await this.savePhaseResult(specification.id, phaseResult);

      specification.documentation = documentationResults;
      specification.currentPhase = 'parallel_development';

      if (phaseResult.requiresApproval && this.config.enableInteractiveMode) {
        await this.requestApproval(specification, 'documentation', documentationResults);
      }

      this.logger.success('✅ [Phase1] Documentation phase completed', {
        agentId: specification.id,
        confidence: documentationResults.confidenceScore
      });

    } catch (error) {
      await this.handlePhaseError(specification, 'documentation', error as Error, context);
      throw error;
    }
  }

  /**
   * Phase 2: Parallel Development - Three specialized subagents work simultaneously
   */
  private async executePhase2ParallelDevelopment(specification: AgentSpecification): Promise<void> {
    this.logger.info('🔄 [Phase2] Starting parallel development phase', {
      agentId: specification.id
    });

    const context = this.createPhaseContext(specification, 'parallel_development');

    try {
      // Execute three subagents in parallel
      const [promptEngineeringResult, toolIntegrationResult, dependencyManagementResult] =
        await Promise.all([
          this.executePromptEngineeringSubagent(specification),
          this.executeToolIntegrationSubagent(specification),
          this.executeDependencyManagementSubagent(specification)
        ]);

      // Combine results
      const parallelResults: ParallelDevelopmentResults = {
        promptEngineering: promptEngineeringResult,
        toolIntegration: toolIntegrationResult,
        dependencyManagement: dependencyManagementResult,
        coordinationSummary: this.generateCoordinationSummary([
          promptEngineeringResult,
          toolIntegrationResult,
          dependencyManagementResult
        ]),
        overallConfidence: Math.round(
          (promptEngineeringResult.confidenceScore +
           toolIntegrationResult.confidenceScore +
           dependencyManagementResult.confidenceScore) / 3
        )
      };

      const phaseResult: PhaseResult = {
        phase: 'parallel_development',
        success: true,
        results: parallelResults,
        confidenceScore: parallelResults.overallConfidence,
        executionTime: Date.now() - new Date(context.startTime).getTime(),
        resourcesUsed: {
          claudeApiCalls: 3, // Three parallel calls
          supabaseQueries: 4,
          processingTime: Date.now() - new Date(context.startTime).getTime(),
          memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
          estimatedCost: 150 // Higher cost for parallel execution
        },
        nextPhaseReady: true,
        requiresApproval: parallelResults.overallConfidence < this.config.autoApprovalThreshold
      };

      await this.savePhaseResult(specification.id, phaseResult);

      specification.parallelDevelopment = parallelResults;
      specification.currentPhase = 'implementation';

      if (phaseResult.requiresApproval && this.config.enableInteractiveMode) {
        await this.requestApproval(specification, 'parallel_development', parallelResults);
      }

      this.logger.success('✅ [Phase2] Parallel development phase completed', {
        agentId: specification.id,
        overallConfidence: parallelResults.overallConfidence
      });

    } catch (error) {
      await this.handlePhaseError(specification, 'parallel_development', error as Error, context);
      throw error;
    }
  }

  /**
   * Phase 3: Implementation - Main agent builds the complete agent
   */
  private async executePhase3Implementation(specification: AgentSpecification): Promise<void> {
    this.logger.info('🔨 [Phase3] Starting implementation phase', {
      agentId: specification.id
    });

    const context = this.createPhaseContext(specification, 'implementation');

    try {
      const implementationPrompt = this.buildImplementationPrompt(specification);

      const response = await this.claudeClient.executeSubagentPhase(
        'implementation',
        {
          input: implementationPrompt,
          context: {
            requirements: specification.requirements,
            documentation: specification.documentation,
            parallelDevelopment: specification.parallelDevelopment
          }
        }
      );

      const implementationResults: ImplementationResults = this.parseImplementationResults(response);

      const phaseResult: PhaseResult = {
        phase: 'implementation',
        success: implementationResults.buildStatus.success,
        results: implementationResults,
        confidenceScore: implementationResults.confidenceScore,
        executionTime: Date.now() - new Date(context.startTime).getTime(),
        resourcesUsed: {
          claudeApiCalls: 1,
          supabaseQueries: 2,
          processingTime: Date.now() - new Date(context.startTime).getTime(),
          memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
          estimatedCost: 100
        },
        nextPhaseReady: implementationResults.buildStatus.success,
        requiresApproval: implementationResults.confidenceScore < this.config.autoApprovalThreshold ||
                         !implementationResults.buildStatus.success
      };

      await this.savePhaseResult(specification.id, phaseResult);

      specification.implementation = implementationResults;
      specification.currentPhase = 'validation';

      if (phaseResult.requiresApproval && this.config.enableInteractiveMode) {
        await this.requestApproval(specification, 'implementation', implementationResults);
      }

      this.logger.success('✅ [Phase3] Implementation phase completed', {
        agentId: specification.id,
        buildSuccess: implementationResults.buildStatus.success,
        confidence: implementationResults.confidenceScore
      });

    } catch (error) {
      await this.handlePhaseError(specification, 'implementation', error as Error, context);
      throw error;
    }
  }

  /**
   * Phase 4: Validation - Validator subagent creates tests and verifies functionality
   */
  private async executePhase4Validation(specification: AgentSpecification): Promise<void> {
    this.logger.info('🔍 [Phase4] Starting validation phase', {
      agentId: specification.id
    });

    const context = this.createPhaseContext(specification, 'validation');

    try {
      const validationPrompt = this.buildValidationPrompt(specification);

      const response = await this.claudeClient.executeSubagentPhase(
        'validator',
        {
          input: validationPrompt,
          context: {
            requirements: specification.requirements,
            implementation: specification.implementation
          }
        }
      );

      const validationResults: ValidationResults = this.parseValidationResults(response);

      const phaseResult: PhaseResult = {
        phase: 'validation',
        success: validationResults.approvalStatus === 'approved',
        results: validationResults,
        confidenceScore: validationResults.confidenceScore,
        executionTime: Date.now() - new Date(context.startTime).getTime(),
        resourcesUsed: {
          claudeApiCalls: 1,
          supabaseQueries: 2,
          processingTime: Date.now() - new Date(context.startTime).getTime(),
          memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
          estimatedCost: 75
        },
        nextPhaseReady: validationResults.approvalStatus === 'approved',
        requiresApproval: validationResults.approvalStatus !== 'approved'
      };

      await this.savePhaseResult(specification.id, phaseResult);

      specification.validation = validationResults;
      specification.currentPhase = 'delivery';

      if (phaseResult.requiresApproval && this.config.enableInteractiveMode) {
        await this.requestApproval(specification, 'validation', validationResults);
      }

      this.logger.success('✅ [Phase4] Validation phase completed', {
        agentId: specification.id,
        approvalStatus: validationResults.approvalStatus,
        confidence: validationResults.confidenceScore
      });

    } catch (error) {
      await this.handlePhaseError(specification, 'validation', error as Error, context);
      throw error;
    }
  }

  /**
   * Phase 5: Delivery - Documentation and final packaging
   */
  private async executePhase5Delivery(specification: AgentSpecification): Promise<void> {
    this.logger.info('📦 [Phase5] Starting delivery phase', {
      agentId: specification.id
    });

    const context = this.createPhaseContext(specification, 'delivery');

    try {
      const deliveryPrompt = this.buildDeliveryPrompt(specification);

      const response = await this.claudeClient.executeSubagentPhase(
        'delivery',
        {
          input: deliveryPrompt,
          context: {
            requirements: specification.requirements,
            implementation: specification.implementation,
            validation: specification.validation
          }
        }
      );

      const deliveryResults: DeliveryResults = this.parseDeliveryResults(response);

      const phaseResult: PhaseResult = {
        phase: 'delivery',
        success: true,
        results: deliveryResults,
        confidenceScore: deliveryResults.confidenceScore,
        executionTime: Date.now() - new Date(context.startTime).getTime(),
        resourcesUsed: {
          claudeApiCalls: 1,
          supabaseQueries: 2,
          processingTime: Date.now() - new Date(context.startTime).getTime(),
          memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
          estimatedCost: 60
        },
        nextPhaseReady: true,
        requiresApproval: false // Final phase - no approval needed
      };

      await this.savePhaseResult(specification.id, phaseResult);

      specification.delivery = deliveryResults;
      specification.status = 'completed';

      this.logger.success('✅ [Phase5] Delivery phase completed - Agent ready!', {
        agentId: specification.id,
        packagedAgent: deliveryResults.packagedAgent.name,
        confidence: deliveryResults.confidenceScore
      });

    } catch (error) {
      await this.handlePhaseError(specification, 'delivery', error as Error, context);
      throw error;
    }
  }

  // =============================================================================
  // Parallel Subagent Execution Methods
  // =============================================================================

  private async executePromptEngineeringSubagent(specification: AgentSpecification) {
    // Implementation for prompt engineering subagent
    // This would call Claude API with specialized prompt engineering context
    return {
      systemPrompt: 'System prompt generated by prompt engineer',
      contextPrompts: ['Context prompt 1', 'Context prompt 2'],
      behaviorModifiers: ['Modifier 1', 'Modifier 2'],
      safeguards: ['Safeguard 1', 'Safeguard 2'],
      performanceOptimizations: ['Optimization 1', 'Optimization 2'],
      confidenceScore: 85,
      testPrompts: ['Test prompt 1', 'Test prompt 2']
    };
  }

  private async executeToolIntegrationSubagent(specification: AgentSpecification) {
    // Implementation for tool integration subagent
    return {
      implementedTools: [],
      apiConnections: [],
      errorHandling: [],
      rateLimiting: [],
      confidenceScore: 80
    };
  }

  private async executeDependencyManagementSubagent(specification: AgentSpecification) {
    // Implementation for dependency management subagent
    return {
      packageDependencies: [],
      environmentSetup: {
        requiredVars: [],
        optionalVars: [],
        setupScript: '',
        validationScript: ''
      },
      configurationFiles: [],
      securityConfiguration: {
        authenticationMethod: '',
        authorizationRules: [],
        dataProtection: [],
        auditLogging: [],
        complianceChecks: []
      },
      confidenceScore: 90
    };
  }

  // =============================================================================
  // Utility Methods
  // =============================================================================

  private async initializeSpecification(requirements: AgentRequirements): Promise<AgentSpecification> {
    const specification: AgentSpecification = {
      id: uuid(),
      requirements,
      currentPhase: 'clarification',
      status: 'not_started',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.saveSpecification(specification);
    return specification;
  }

  private createPhaseContext(
    specification: AgentSpecification,
    phase: WorkflowPhase
  ): PhaseExecutionContext {
    return {
      specificationId: specification.id,
      phase,
      retryCount: 0,
      startTime: new Date().toISOString(),
      timeoutAt: new Date(Date.now() + this.config.timeoutPerPhase * 60 * 1000).toISOString()
    };
  }

  private generateCoordinationSummary(results: any[]): string {
    return `Parallel development coordination completed with ${results.length} subagents. Average confidence: ${
      results.reduce((acc, r) => acc + r.confidenceScore, 0) / results.length
    }%.`;
  }

  private async saveSpecification(specification: AgentSpecification): Promise<void> {
    await this.supabaseClient.saveSpecification(specification);
  }

  private async savePhaseResult(specificationId: string, result: PhaseResult): Promise<void> {
    await this.supabaseClient.savePhaseResult(specificationId, result);
  }

  private async requestApproval(
    specification: AgentSpecification,
    phase: WorkflowPhase,
    results: any
  ): Promise<void> {
    specification.status = 'awaiting_approval';
    await this.approvalManager.requestApproval(specification.id, phase, results);
    await this.saveSpecification(specification);
  }

  private async handleWorkflowError(specification: AgentSpecification, error: Error): Promise<void> {
    specification.status = 'failed';
    await this.supabaseClient.logError(specification.id, {
      errorType: 'system_error',
      phase: specification.currentPhase,
      errorMessage: error.message,
      errorDetails: { stack: error.stack },
      recoverable: false,
      suggestedAction: 'Manual investigation required'
    });
    await this.saveSpecification(specification);
  }

  private async handlePhaseError(
    specification: AgentSpecification,
    phase: WorkflowPhase,
    error: Error,
    context: PhaseExecutionContext
  ): Promise<void> {
    this.logger.error(`❌ [${phase}] Phase execution failed`, {
      agentId: specification.id,
      error: error.message,
      retryCount: context.retryCount
    });

    await this.supabaseClient.logError(specification.id, {
      errorType: 'system_error',
      phase,
      errorMessage: error.message,
      errorDetails: { stack: error.stack, context },
      recoverable: context.retryCount < this.config.maxRetries,
      suggestedAction: context.retryCount < this.config.maxRetries ? 'Retry execution' : 'Manual review required'
    });
  }

  // =============================================================================
  // Prompt Building Methods (Placeholder implementations)
  // =============================================================================

  private buildClarificationPrompt(requirements: AgentRequirements): string {
    return `You are an expert AI agent requirements analyst. Please analyze and clarify the following agent requirements: ${JSON.stringify(requirements)}`;
  }

  private buildDocumentationPrompt(requirements: AgentRequirements, clarification: ClarificationResults): string {
    return `Create comprehensive technical documentation for an AI agent based on requirements and clarification results.`;
  }

  private buildImplementationPrompt(specification: AgentSpecification): string {
    return `Implement the complete AI agent based on the provided specifications.`;
  }

  private buildValidationPrompt(specification: AgentSpecification): string {
    return `Validate the implemented AI agent for functionality, security, and compliance.`;
  }

  private buildDeliveryPrompt(specification: AgentSpecification): string {
    return `Package the validated AI agent for final delivery with complete documentation.`;
  }

  // =============================================================================
  // Result Parsing Methods (Placeholder implementations)
  // =============================================================================

  private parseClarificationResults(response: any): ClarificationResults {
    // Parse Claude API response into ClarificationResults structure
    return {
      refinedRequirements: response.refinedRequirements || {},
      targetPersonas: response.targetPersonas || [],
      useCases: response.useCases || [],
      technicalConstraints: response.technicalConstraints || [],
      businessContext: response.businessContext || '',
      confidenceScore: response.confidenceScore || 75,
      questionsAsked: response.questionsAsked || [],
      answersReceived: response.answersReceived || []
    };
  }

  private parseDocumentationResults(response: any): AgentDocumentation {
    // Parse documentation results
    return response as AgentDocumentation;
  }

  private parseImplementationResults(response: any): ImplementationResults {
    // Parse implementation results
    return response as ImplementationResults;
  }

  private parseValidationResults(response: any): ValidationResults {
    // Parse validation results
    return response as ValidationResults;
  }

  private parseDeliveryResults(response: any): DeliveryResults {
    // Parse delivery results
    return response as DeliveryResults;
  }

  // =============================================================================
  // Public API Methods
  // =============================================================================

  /**
   * Get the current status of an agent creation workflow
   */
  async getAgentStatus(agentId: string): Promise<AgentSpecification | null> {
    return await this.supabaseClient.getSpecification(agentId);
  }

  /**
   * Pause an ongoing agent creation workflow
   */
  async pauseWorkflow(agentId: string): Promise<void> {
    const specification = await this.supabaseClient.getSpecification(agentId);
    if (specification) {
      specification.status = 'paused';
      await this.saveSpecification(specification);
    }
  }

  /**
   * Resume a paused agent creation workflow
   */
  async resumeWorkflow(agentId: string): Promise<void> {
    const specification = await this.supabaseClient.getSpecification(agentId);
    if (specification && specification.status === 'paused') {
      specification.status = 'in_progress';
      await this.saveSpecification(specification);
    }
  }

  /**
   * Cancel an agent creation workflow
   */
  async cancelWorkflow(agentId: string): Promise<void> {
    const specification = await this.supabaseClient.getSpecification(agentId);
    if (specification) {
      specification.status = 'cancelled';
      await this.saveSpecification(specification);
    }
  }

  /**
   * Update workflow engine configuration
   */
  updateConfig(updates: Partial<WorkflowEngineConfig>): void {
    this.config = { ...this.config, ...updates };
    this.logger.info('🔧 [UpdateConfig] Workflow engine configuration updated', {
      updates
    });
  }

  /**
   * Get workflow engine health status
   */
  async getHealthStatus() {
    return {
      engine: 'operational',
      claude: await this.claudeClient.getHealthStatus(),
      supabase: await this.supabaseClient.getHealthStatus(),
      config: this.config,
      timestamp: new Date().toISOString()
    };
  }
}