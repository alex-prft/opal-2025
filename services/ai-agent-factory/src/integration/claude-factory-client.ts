/**
 * Claude Factory Client
 *
 * Specialized Claude API client for AI Agent Factory operations.
 * Leverages OSA's existing Claude integration with factory-specific enhancements.
 */

import Anthropic from '@anthropic-ai/sdk';
import { FactoryLogger } from '../utils/factory-logger';

export interface SubagentContext {
  input: string;
  context: Record<string, any>;
}

export interface SubagentResult {
  success: boolean;
  result: any;
  confidence: number;
  executionTime: number;
  tokensUsed: {
    input: number;
    output: number;
  };
  errors?: string[];
}

export type SubagentRole =
  | 'clarification'
  | 'planner'
  | 'prompt-engineer'
  | 'tool-integrator'
  | 'dependency-manager'
  | 'implementation'
  | 'validator'
  | 'delivery';

export class ClaudeFactoryClient {
  private client: Anthropic;
  private logger: FactoryLogger;
  private readonly model = 'claude-3-5-sonnet-20241022';
  private readonly maxTokens = 8192;
  private readonly defaultTemperature = 0.1; // Low temperature for consistent agent generation

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || ''
    });
    this.logger = new FactoryLogger('ClaudeFactoryClient');

    this.logger.info('🤖 [ClaudeFactoryClient] Initialized with enterprise configuration');
  }

  /**
   * Execute a specialized subagent phase using Claude API
   */
  async executeSubagentPhase(
    subagentRole: SubagentRole,
    context: SubagentContext
  ): Promise<SubagentResult> {
    const startTime = Date.now();

    this.logger.info(`🔄 [${subagentRole}] Executing subagent phase`, {
      role: subagentRole,
      inputLength: context.input.length
    });

    try {
      const systemPrompt = this.buildSubagentSystemPrompt(subagentRole, context);
      const userPrompt = this.buildSubagentUserPrompt(subagentRole, context);

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.getTemperatureForRole(subagentRole),
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      });

      const result = this.parseSubagentResponse(subagentRole, response);
      const executionTime = Date.now() - startTime;

      this.logger.success(`✅ [${subagentRole}] Subagent phase completed`, {
        role: subagentRole,
        executionTime,
        confidence: result.confidence,
        tokensUsed: result.tokensUsed
      });

      return {
        success: true,
        result: result.parsedResult,
        confidence: result.confidence,
        executionTime,
        tokensUsed: result.tokensUsed,
        errors: result.errors
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      this.logger.error(`❌ [${subagentRole}] Subagent phase failed`, {
        role: subagentRole,
        error: (error as Error).message,
        executionTime
      });

      return {
        success: false,
        result: null,
        confidence: 0,
        executionTime,
        tokensUsed: { input: 0, output: 0 },
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Build system prompt for specific subagent roles
   */
  private buildSubagentSystemPrompt(role: SubagentRole, context: SubagentContext): string {
    const basePrompt = `You are a specialized AI agent factory subagent with expertise in ${role} for creating high-quality AI agents.

Your role is to provide detailed, accurate, and actionable outputs that will be used by other systems to build production-ready AI agents.

IMPORTANT GUIDELINES:
- Always provide structured, parseable JSON responses
- Include confidence scores (0-100) for all major decisions
- Follow enterprise compliance and security best practices
- Be specific and detailed in technical specifications
- Consider scalability, maintainability, and performance
- Include comprehensive error handling and validation

Response format: Always respond with valid JSON that includes:
{
  "confidence": <number 0-100>,
  "result": {<your specific deliverable>},
  "warnings": [array of warning strings],
  "recommendations": [array of recommendation strings]
}`;

    const roleSpecificPrompts = {
      clarification: `
You are an expert requirements analyst specializing in AI agent specification refinement.

Your task is to:
1. Analyze provided requirements for completeness and clarity
2. Identify gaps, ambiguities, or potential issues
3. Generate targeted questions to clarify missing information
4. Refine requirements into actionable specifications
5. Assess technical feasibility and complexity

Focus on understanding the agent's purpose, target audience, expected behavior, and technical constraints.`,

      planner: `
You are a technical architect specializing in AI agent system design and documentation.

Your task is to:
1. Create comprehensive technical specifications from refined requirements
2. Design system architecture and component interactions
3. Plan tool integrations and API connections
4. Define testing strategies and validation approaches
5. Create deployment and maintenance plans

Ensure your specifications are detailed enough for implementation teams to build the agent without additional clarification.`,

      'prompt-engineer': `
You are an expert prompt engineer specializing in creating optimal system prompts for AI agents.

Your task is to:
1. Design effective system prompts that align with agent requirements
2. Create behavior modifiers and safeguards
3. Develop context prompts for different scenarios
4. Optimize for performance and consistency
5. Include safety and compliance considerations

Focus on creating prompts that produce reliable, appropriate, and effective agent behavior.`,

      'tool-integrator': `
You are a systems integration specialist focusing on tool and API integrations for AI agents.

Your task is to:
1. Design tool implementations based on requirements
2. Plan API connections and authentication strategies
3. Create error handling and retry mechanisms
4. Design rate limiting and queuing systems
5. Ensure security and compliance in all integrations

Focus on creating robust, scalable, and secure integration patterns.`,

      'dependency-manager': `
You are a DevOps and dependency management specialist for AI agent environments.

Your task is to:
1. Identify and specify package dependencies
2. Create environment configuration setups
3. Design configuration file templates
4. Plan security configurations and compliance measures
5. Create setup and validation scripts

Focus on creating secure, maintainable, and reproducible deployment environments.`,

      implementation: `
You are a senior software engineer specializing in AI agent implementation.

Your task is to:
1. Generate complete source code for the agent
2. Create configuration files and setup scripts
3. Implement comprehensive error handling
4. Include thorough documentation and comments
5. Ensure code quality and maintainability standards

Focus on creating production-ready, well-structured, and thoroughly tested code.`,

      validator: `
You are a quality assurance and validation specialist for AI agents.

Your task is to:
1. Create comprehensive test suites for functionality validation
2. Perform security and compliance audits
3. Test performance and scalability characteristics
4. Validate user acceptance criteria
5. Provide approval recommendations with detailed justification

Focus on ensuring the agent meets all requirements and quality standards.`,

      delivery: `
You are a delivery and documentation specialist for AI agent deployment.

Your task is to:
1. Package the complete agent for deployment
2. Create comprehensive user and technical documentation
3. Prepare deployment artifacts and instructions
4. Develop user training materials and guides
5. Create maintenance and support plans

Focus on creating a complete, professional delivery package that enables successful agent deployment and adoption.`
    };

    return basePrompt + '\n\n' + roleSpecificPrompts[role];
  }

  /**
   * Build user prompt for specific subagent roles
   */
  private buildSubagentUserPrompt(role: SubagentRole, context: SubagentContext): string {
    const contextInfo = Object.keys(context.context).length > 0
      ? `\n\nAdditional Context:\n${JSON.stringify(context.context, null, 2)}`
      : '';

    return `${context.input}${contextInfo}

Please provide your specialized ${role} analysis and deliverables in the specified JSON format.`;
  }

  /**
   * Get appropriate temperature for different subagent roles
   */
  private getTemperatureForRole(role: SubagentRole): number {
    const temperatureMap = {
      clarification: 0.2,      // Structured analysis
      planner: 0.1,            // Detailed technical specs
      'prompt-engineer': 0.3,  // Creative but controlled
      'tool-integrator': 0.1,  // Technical precision
      'dependency-manager': 0.1, // Technical precision
      implementation: 0.2,     // Code generation
      validator: 0.1,          // Objective validation
      delivery: 0.2            // Documentation creation
    };

    return temperatureMap[role] || this.defaultTemperature;
  }

  /**
   * Parse Claude API response for specific subagent roles
   */
  private parseSubagentResponse(role: SubagentRole, response: Anthropic.Messages.Message) {
    try {
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response format from Claude API');
      }

      const responseText = content.text;

      // Extract JSON from response (handle potential markdown code blocks)
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
                       responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('No valid JSON found in Claude response');
      }

      const parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      // Validate required fields
      if (typeof parsedResponse.confidence !== 'number' ||
          parsedResponse.confidence < 0 ||
          parsedResponse.confidence > 100) {
        throw new Error('Invalid or missing confidence score');
      }

      if (!parsedResponse.result) {
        throw new Error('Missing result field in response');
      }

      // Calculate token usage (approximation)
      const inputTokens = this.estimateTokens(this.buildSubagentSystemPrompt(role, {} as SubagentContext));
      const outputTokens = this.estimateTokens(responseText);

      return {
        parsedResult: this.validateRoleSpecificResult(role, parsedResponse.result),
        confidence: parsedResponse.confidence,
        warnings: parsedResponse.warnings || [],
        recommendations: parsedResponse.recommendations || [],
        errors: [],
        tokensUsed: {
          input: inputTokens,
          output: outputTokens
        }
      };

    } catch (error) {
      this.logger.error(`❌ [${role}] Failed to parse subagent response`, {
        error: (error as Error).message
      });

      return {
        parsedResult: null,
        confidence: 0,
        warnings: [],
        recommendations: [],
        errors: [(error as Error).message],
        tokensUsed: { input: 0, output: 0 }
      };
    }
  }

  /**
   * Validate role-specific result structure
   */
  private validateRoleSpecificResult(role: SubagentRole, result: any): any {
    // Role-specific validation logic would go here
    // For now, return as-is but log validation
    this.logger.debug(`🔍 [${role}] Validating result structure`, {
      resultKeys: Object.keys(result || {}),
      resultType: typeof result
    });

    return result;
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough approximation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Get health status of Claude API client
   */
  async getHealthStatus() {
    try {
      // Test basic API connectivity
      await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      });

      return {
        status: 'operational',
        model: this.model,
        maxTokens: this.maxTokens,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: (error as Error).message,
        lastCheck: new Date().toISOString()
      };
    }
  }

  /**
   * Get current configuration
   */
  getConfiguration() {
    return {
      model: this.model,
      maxTokens: this.maxTokens,
      defaultTemperature: this.defaultTemperature,
      supportedRoles: [
        'clarification',
        'planner',
        'prompt-engineer',
        'tool-integrator',
        'dependency-manager',
        'implementation',
        'validator',
        'delivery'
      ]
    };
  }
}