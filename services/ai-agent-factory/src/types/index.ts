/**
 * AI Agent Factory Types
 *
 * Core type definitions for the 6-phase agent creation workflow system
 */

import { z } from 'zod';

// =============================================================================
// Core Workflow Types
// =============================================================================

export type WorkflowPhase =
  | 'clarification'
  | 'documentation'
  | 'parallel_development'
  | 'implementation'
  | 'validation'
  | 'delivery';

export type WorkflowStatus =
  | 'not_started'
  | 'in_progress'
  | 'awaiting_approval'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type AgentComplexity = 'simple' | 'medium' | 'complex' | 'enterprise';

export type AgentDomain =
  | 'content_optimization'
  | 'audience_analysis'
  | 'experimentation'
  | 'personalization'
  | 'analytics'
  | 'workflow_automation'
  | 'general_assistant';

// =============================================================================
// Agent Specification Types
// =============================================================================

export const AgentRequirementsSchema = z.object({
  name: z.string().min(3).max(100),
  purpose: z.string().min(10).max(500),
  domain: z.enum(['content_optimization', 'audience_analysis', 'experimentation', 'personalization', 'analytics', 'workflow_automation', 'general_assistant']),
  complexity: z.enum(['simple', 'medium', 'complex', 'enterprise']),
  targetAudience: z.string().optional(),
  specialRequirements: z.array(z.string()).optional(),
  integrationPoints: z.array(z.string()).optional(),
  complianceLevel: z.enum(['basic', 'enterprise', 'healthcare', 'financial']).default('enterprise')
});

export type AgentRequirements = z.infer<typeof AgentRequirementsSchema>;

export interface AgentSpecification {
  id: string;
  requirements: AgentRequirements;
  clarificationResults?: ClarificationResults;
  documentation?: AgentDocumentation;
  parallelDevelopment?: ParallelDevelopmentResults;
  implementation?: ImplementationResults;
  validation?: ValidationResults;
  delivery?: DeliveryResults;
  currentPhase: WorkflowPhase;
  status: WorkflowStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  metadata?: Record<string, any>;
}

// =============================================================================
// Phase-Specific Result Types
// =============================================================================

export interface ClarificationResults {
  refinedRequirements: AgentRequirements;
  targetPersonas: string[];
  useCases: UseCase[];
  technicalConstraints: string[];
  businessContext: string;
  confidenceScore: number;
  questionsAsked: string[];
  answersReceived: string[];
}

export interface UseCase {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  complexity: number; // 1-10
  estimatedEffort: string;
}

export interface AgentDocumentation {
  systemPrompt: string;
  behaviorGuidelines: string[];
  toolRequirements: ToolRequirement[];
  apiIntegrations: ApiIntegration[];
  environmentConfig: EnvironmentConfig;
  testingStrategy: TestingStrategy;
  deploymentPlan: DeploymentPlan;
  confidenceScore: number;
}

export interface ToolRequirement {
  name: string;
  purpose: string;
  required: boolean;
  parameters: ToolParameter[];
  integrationComplexity: 'low' | 'medium' | 'high';
}

export interface ToolParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: string;
}

export interface ApiIntegration {
  service: string;
  endpoints: string[];
  authMethod: 'none' | 'api_key' | 'oauth' | 'bearer_token';
  rateLimit?: string;
  errorHandling: string[];
}

export interface EnvironmentConfig {
  requiredEnvVars: string[];
  optionalEnvVars: string[];
  dependencies: string[];
  minimumVersions: Record<string, string>;
}

export interface TestingStrategy {
  unitTests: TestCategory[];
  integrationTests: TestCategory[];
  performanceTests: TestCategory[];
  securityTests: TestCategory[];
  acceptanceCriteria: string[];
}

export interface TestCategory {
  category: string;
  tests: TestCase[];
  coverage: number;
}

export interface TestCase {
  name: string;
  description: string;
  type: 'unit' | 'integration' | 'performance' | 'security';
  priority: 'high' | 'medium' | 'low';
}

export interface DeploymentPlan {
  environment: 'development' | 'staging' | 'production';
  strategy: 'blue_green' | 'rolling' | 'canary' | 'immediate';
  healthChecks: string[];
  rollbackPlan: string[];
  monitoringSetup: string[];
}

// =============================================================================
// Parallel Development Phase Types
// =============================================================================

export interface ParallelDevelopmentResults {
  promptEngineering: PromptEngineeringResults;
  toolIntegration: ToolIntegrationResults;
  dependencyManagement: DependencyManagementResults;
  coordinationSummary: string;
  overallConfidence: number;
}

export interface PromptEngineeringResults {
  systemPrompt: string;
  contextPrompts: string[];
  behaviorModifiers: string[];
  safeguards: string[];
  performanceOptimizations: string[];
  confidenceScore: number;
  testPrompts: string[];
}

export interface ToolIntegrationResults {
  implementedTools: ImplementedTool[];
  apiConnections: ApiConnection[];
  errorHandling: ErrorHandlingStrategy[];
  rateLimiting: RateLimitingStrategy[];
  confidenceScore: number;
}

export interface ImplementedTool {
  name: string;
  implementation: string;
  testSuite: string;
  documentation: string;
  performanceMetrics: Record<string, number>;
}

export interface ApiConnection {
  service: string;
  implementation: string;
  authentication: string;
  errorHandling: string;
  testCoverage: number;
}

export interface ErrorHandlingStrategy {
  errorType: string;
  strategy: string;
  fallbackBehavior: string;
  recoverySteps: string[];
}

export interface RateLimitingStrategy {
  api: string;
  limits: Record<string, number>;
  backoffStrategy: string;
  queueingLogic?: string;
}

export interface DependencyManagementResults {
  packageDependencies: PackageDependency[];
  environmentSetup: EnvironmentSetup;
  configurationFiles: ConfigurationFile[];
  securityConfiguration: SecurityConfiguration;
  confidenceScore: number;
}

export interface PackageDependency {
  name: string;
  version: string;
  purpose: string;
  security: 'safe' | 'review_needed' | 'vulnerable';
  alternatives?: string[];
}

export interface EnvironmentSetup {
  requiredVars: EnvironmentVariable[];
  optionalVars: EnvironmentVariable[];
  setupScript: string;
  validationScript: string;
}

export interface EnvironmentVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  required: boolean;
  defaultValue?: string;
  validation?: string;
}

export interface ConfigurationFile {
  path: string;
  content: string;
  purpose: string;
  template: boolean;
}

export interface SecurityConfiguration {
  authenticationMethod: string;
  authorizationRules: string[];
  dataProtection: string[];
  auditLogging: string[];
  complianceChecks: string[];
}

// =============================================================================
// Implementation & Validation Types
// =============================================================================

export interface ImplementationResults {
  sourceCode: SourceCodeDeliverable[];
  configuration: ConfigurationDeliverable[];
  documentation: DocumentationDeliverable[];
  buildStatus: BuildStatus;
  confidenceScore: number;
}

export interface SourceCodeDeliverable {
  filePath: string;
  content: string;
  type: 'main' | 'test' | 'config' | 'utility';
  language: string;
  linesOfCode: number;
  complexity: number;
}

export interface ConfigurationDeliverable {
  type: 'package.json' | 'tsconfig.json' | 'env.template' | 'docker' | 'other';
  content: string;
  path: string;
  purpose: string;
}

export interface DocumentationDeliverable {
  type: 'readme' | 'api' | 'user_guide' | 'deployment' | 'troubleshooting';
  content: string;
  format: 'markdown' | 'json' | 'yaml' | 'text';
  completeness: number; // 0-100
}

export interface BuildStatus {
  success: boolean;
  errors: BuildError[];
  warnings: BuildWarning[];
  testResults: TestResults;
  codeQuality: CodeQualityMetrics;
}

export interface BuildError {
  file: string;
  line: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  type: 'syntax' | 'type' | 'logic' | 'security';
}

export interface BuildWarning {
  file: string;
  line: number;
  message: string;
  suggestion?: string;
}

export interface TestResults {
  total: number;
  passed: number;
  failed: number;
  coverage: number;
  failedTests: FailedTest[];
}

export interface FailedTest {
  name: string;
  error: string;
  suggestion: string;
}

export interface CodeQualityMetrics {
  complexity: number;
  maintainability: number;
  reliability: number;
  security: number;
  coverage: number;
}

export interface ValidationResults {
  functionalTests: TestResults;
  performanceTests: PerformanceTestResults;
  securityTests: SecurityTestResults;
  complianceCheck: ComplianceCheckResults;
  userAcceptanceTests: UserAcceptanceTestResults;
  confidenceScore: number;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'needs_revision';
}

export interface PerformanceTestResults {
  responseTime: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
  bottlenecks: string[];
  recommendations: string[];
}

export interface SecurityTestResults {
  vulnerabilities: SecurityVulnerability[];
  complianceScore: number;
  recommendations: string[];
  auditTrail: string[];
}

export interface SecurityVulnerability {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  location: string;
  recommendation: string;
  cve?: string;
}

export interface ComplianceCheckResults {
  gdprCompliant: boolean;
  piiHandling: 'compliant' | 'needs_review' | 'non_compliant';
  dataRetention: 'compliant' | 'needs_review' | 'non_compliant';
  auditLogging: 'compliant' | 'needs_review' | 'non_compliant';
  recommendations: string[];
}

export interface UserAcceptanceTestResults {
  testCases: UserTestCase[];
  overallSatisfaction: number; // 1-5
  usabilityScore: number; // 1-100
  feedback: string[];
  recommendations: string[];
}

export interface UserTestCase {
  scenario: string;
  expected: string;
  actual: string;
  passed: boolean;
  feedback?: string;
}

// =============================================================================
// Delivery Types
// =============================================================================

export interface DeliveryResults {
  packagedAgent: PackagedAgent;
  documentation: FinalDocumentation;
  deploymentArtifacts: DeploymentArtifact[];
  userTraining: UserTrainingPackage;
  maintenancePlan: MaintenancePlan;
  handoffNotes: string[];
  confidenceScore: number;
}

export interface PackagedAgent {
  id: string;
  name: string;
  version: string;
  description: string;
  sourceCode: string; // Base64 encoded zip
  configuration: Record<string, any>;
  installationScript: string;
  healthCheckEndpoint: string;
}

export interface FinalDocumentation {
  userGuide: string;
  technicalDocumentation: string;
  apiReference: string;
  troubleshootingGuide: string;
  deploymentGuide: string;
  maintenanceGuide: string;
}

export interface DeploymentArtifact {
  type: 'docker' | 'kubernetes' | 'serverless' | 'vm' | 'container';
  content: string;
  instructions: string;
  healthChecks: string[];
  rollbackSteps: string[];
}

export interface UserTrainingPackage {
  quickStart: string;
  tutorials: Tutorial[];
  videoGuides: VideoGuide[];
  faqSection: FAQ[];
  supportContacts: string[];
}

export interface Tutorial {
  title: string;
  description: string;
  steps: TutorialStep[];
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface TutorialStep {
  step: number;
  title: string;
  instruction: string;
  expectedOutcome: string;
  troubleshooting?: string;
}

export interface VideoGuide {
  title: string;
  description: string;
  url: string;
  duration: string;
  topics: string[];
}

export interface FAQ {
  question: string;
  answer: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

export interface MaintenancePlan {
  updateSchedule: string;
  monitoringRequirements: string[];
  backupStrategy: string;
  performanceBaselines: Record<string, number>;
  escalationProcedure: string[];
  supportLevel: 'basic' | 'standard' | 'premium' | 'enterprise';
}

// =============================================================================
// Workflow Engine Types
// =============================================================================

export interface WorkflowEngineConfig {
  enableInteractiveMode: boolean;
  autoApprovalThreshold: number; // 0-100
  maxRetries: number;
  timeoutPerPhase: number; // minutes
  enableAuditLogging: boolean;
  complianceLevel: 'basic' | 'enterprise' | 'healthcare' | 'financial';
}

export interface PhaseExecutionContext {
  specificationId: string;
  phase: WorkflowPhase;
  previousResults?: any;
  userFeedback?: string[];
  retryCount: number;
  startTime: string;
  timeoutAt: string;
}

export interface PhaseResult {
  phase: WorkflowPhase;
  success: boolean;
  results: any;
  confidenceScore: number;
  executionTime: number;
  resourcesUsed: ResourceUsage;
  nextPhaseReady: boolean;
  requiresApproval: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface ResourceUsage {
  claudeApiCalls: number;
  supabaseQueries: number;
  processingTime: number;
  memoryUsage: number;
  estimatedCost: number;
}

// =============================================================================
// Approval & Notification Types
// =============================================================================

export interface ApprovalRequest {
  specificationId: string;
  phase: WorkflowPhase;
  results: any;
  recommendedAction: 'approve' | 'reject' | 'request_revision';
  reason: string;
  reviewers: string[];
  createdAt: string;
  expiresAt: string;
}

export interface ApprovalResponse {
  requestId: string;
  action: 'approve' | 'reject' | 'request_revision';
  feedback?: string;
  reviewerId: string;
  reviewedAt: string;
}

export interface NotificationEvent {
  type: 'phase_completed' | 'approval_needed' | 'error_occurred' | 'agent_delivered';
  specificationId: string;
  phase?: WorkflowPhase;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  recipients: string[];
  metadata?: Record<string, any>;
}

// =============================================================================
// Error & Logging Types
// =============================================================================

export interface FactoryError {
  id: string;
  specificationId: string;
  phase: WorkflowPhase;
  errorType: 'claude_api' | 'supabase' | 'validation' | 'timeout' | 'user_error' | 'system_error';
  message: string;
  details?: Record<string, any>;
  recoverable: boolean;
  suggestedAction: string;
  occurredAt: string;
}

export interface AuditLogEntry {
  id: string;
  specificationId: string;
  action: string;
  phase?: WorkflowPhase;
  userId?: string;
  details: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

// =============================================================================
// Integration Types
// =============================================================================

export interface ClaudeApiConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  retryAttempts: number;
  timeoutMs: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey: string;
  enablePiiProtection: boolean;
  enableAuditLogging: boolean;
  dataRetentionDays: number;
}

export interface OpalIntegrationConfig {
  enabled: boolean;
  workflowEndpoint: string;
  authToken: string;
  registerAsAgent: boolean;
  toolDiscoveryEndpoint: string;
}

// =============================================================================
// Utility Types
// =============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Export all schemas for runtime validation
export const schemas = {
  AgentRequirementsSchema,
} as const;