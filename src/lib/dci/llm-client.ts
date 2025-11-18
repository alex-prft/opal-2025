/**
 * DCI LLM Client Integration
 *
 * Production-ready LLM client with support for multiple providers
 * (OpenAI, Anthropic Claude) with comprehensive error handling,
 * retry logic, and monitoring integration.
 */

import { dciLog } from './feature-flags';

// =============================================================================
// LLM Client Types
// =============================================================================

export interface LLMClientConfig {
  provider: 'openai' | 'anthropic' | 'mock';
  apiKey?: string;
  baseURL?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason?: string;
}

export interface LLMClient {
  generateCompletion(prompt: string, config?: Partial<LLMClientConfig>): Promise<LLMResponse>;
  validateConnection(): Promise<boolean>;
  getProvider(): string;
}

// =============================================================================
// Environment Configuration
// =============================================================================

const DEFAULT_CONFIG: LLMClientConfig = {
  provider: (process.env.DCI_LLM_PROVIDER as 'openai' | 'anthropic' | 'mock') || 'mock',
  apiKey: process.env.DCI_LLM_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.DCI_LLM_BASE_URL,
  model: process.env.DCI_LLM_MODEL || 'gpt-4',
  temperature: parseFloat(process.env.DCI_LLM_TEMPERATURE || '0.1'),
  maxTokens: parseInt(process.env.DCI_LLM_MAX_TOKENS || '4000'),
  timeout: parseInt(process.env.DCI_LLM_TIMEOUT_MS || '60000'),
  retryAttempts: parseInt(process.env.DCI_LLM_RETRY_ATTEMPTS || '3'),
  retryDelay: parseInt(process.env.DCI_LLM_RETRY_DELAY_MS || '1000')
};

// =============================================================================
// OpenAI Client Implementation
// =============================================================================

class OpenAIClient implements LLMClient {
  private config: LLMClientConfig;

  constructor(config: Partial<LLMClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (!this.config.apiKey && this.config.provider === 'openai') {
      throw new Error('OpenAI API key is required when using OpenAI provider');
    }
  }

  async generateCompletion(prompt: string, overrides?: Partial<LLMClientConfig>): Promise<LLMResponse> {
    const config = { ...this.config, ...overrides };

    const requestBody = {
      model: config.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
      try {
        dciLog('debug', `OpenAI API call attempt ${attempt}/${config.retryAttempts}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        const response = await fetch(config.baseURL || 'https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
          throw new Error('Invalid response format from OpenAI API');
        }

        dciLog('info', `OpenAI API call successful on attempt ${attempt}`);

        return {
          content: data.choices[0].message.content,
          usage: data.usage ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens
          } : undefined,
          model: data.model,
          finishReason: data.choices[0].finish_reason
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        dciLog('warn', `OpenAI API call attempt ${attempt} failed:`, lastError.message);

        if (attempt < config.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, config.retryDelay * attempt));
        }
      }
    }

    throw new Error(`OpenAI API call failed after ${config.retryAttempts} attempts: ${lastError?.message}`);
  }

  async validateConnection(): Promise<boolean> {
    try {
      await this.generateCompletion('Test connection - respond with "OK"', {
        maxTokens: 10,
        temperature: 0
      });
      return true;
    } catch (error) {
      dciLog('error', 'OpenAI connection validation failed:', error);
      return false;
    }
  }

  getProvider(): string {
    return 'openai';
  }
}

// =============================================================================
// Anthropic Claude Client Implementation
// =============================================================================

class AnthropicClient implements LLMClient {
  private config: LLMClientConfig;

  constructor(config: Partial<LLMClientConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      model: config.model || 'claude-3-sonnet-20240229' // Default Claude model
    };

    if (!this.config.apiKey && this.config.provider === 'anthropic') {
      throw new Error('Anthropic API key is required when using Anthropic provider');
    }
  }

  async generateCompletion(prompt: string, overrides?: Partial<LLMClientConfig>): Promise<LLMResponse> {
    const config = { ...this.config, ...overrides };

    const requestBody = {
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
      try {
        dciLog('debug', `Anthropic API call attempt ${attempt}/${config.retryAttempts}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        const response = await fetch(config.baseURL || 'https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey!,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        if (!data.content || data.content.length === 0 || !data.content[0].text) {
          throw new Error('Invalid response format from Anthropic API');
        }

        dciLog('info', `Anthropic API call successful on attempt ${attempt}`);

        return {
          content: data.content[0].text,
          usage: data.usage ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens
          } : undefined,
          model: data.model,
          finishReason: data.stop_reason
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        dciLog('warn', `Anthropic API call attempt ${attempt} failed:`, lastError.message);

        if (attempt < config.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, config.retryDelay * attempt));
        }
      }
    }

    throw new Error(`Anthropic API call failed after ${config.retryAttempts} attempts: ${lastError?.message}`);
  }

  async validateConnection(): Promise<boolean> {
    try {
      await this.generateCompletion('Test connection - respond with "OK"', {
        maxTokens: 10,
        temperature: 0
      });
      return true;
    } catch (error) {
      dciLog('error', 'Anthropic connection validation failed:', error);
      return false;
    }
  }

  getProvider(): string {
    return 'anthropic';
  }
}

// =============================================================================
// Mock Client for Development/Testing
// =============================================================================

class MockLLMClient implements LLMClient {
  private config: LLMClientConfig;

  constructor(config: Partial<LLMClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async generateCompletion(prompt: string, overrides?: Partial<LLMClientConfig>): Promise<LLMResponse> {
    const config = { ...this.config, ...overrides };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Generate mock response based on prompt type
    let mockResponse: string;

    if (prompt.includes('generate_initial_results')) {
      mockResponse = this.generateMockOSAResults();
    } else if (prompt.includes('score_results')) {
      mockResponse = this.generateMockQualityScore();
    } else if (prompt.includes('refine_results_with_context')) {
      mockResponse = this.generateMockRefinedResults();
    } else if (prompt.includes('consistency_check')) {
      mockResponse = this.generateMockConsistencyResults();
    } else {
      mockResponse = 'Mock LLM response for development testing.';
    }

    dciLog('info', 'Mock LLM client generated response');

    return {
      content: mockResponse,
      usage: {
        promptTokens: Math.floor(prompt.length / 4),
        completionTokens: Math.floor(mockResponse.length / 4),
        totalTokens: Math.floor((prompt.length + mockResponse.length) / 4)
      },
      model: 'mock-model',
      finishReason: 'stop'
    };
  }

  async validateConnection(): Promise<boolean> {
    return true; // Mock client always validates successfully
  }

  getProvider(): string {
    return 'mock';
  }

  private generateMockOSAResults(): string {
    return JSON.stringify({
      meta: {
        orgName: "Mock Organization",
        industry: "Technology",
        region: "North America",
        maturityPhase: "walk",
        primaryGoals: ["Improve conversion rate", "Enhance user experience"],
        primaryKpis: ["CVR", "Engagement", "Performance"],
        optiStack: ["Optimizely WebX", "Optimizely CMS"],
        generationTimestamp: new Date().toISOString(),
        dciVersion: "1.0.0"
      },
      contentImprovements: {
        overview: "Content optimization opportunities identified across high-traffic pages",
        keyIssues: ["Mobile experience gaps", "Content freshness concerns"],
        prioritizedActions: [
          {
            id: "action-1",
            title: "Optimize mobile checkout experience",
            description: "Streamline mobile checkout flow to reduce abandonment rates",
            targetPagesOrSections: ["Checkout Flow", "Payment Pages"],
            expectedImpact: "15-20% reduction in cart abandonment",
            difficulty: "medium",
            timeFrameWeeks: 4,
            ownerType: "UX Designer",
            relatedKpis: ["CVR", "Completion Rate"]
          }
        ],
        measurementNotes: "Track completion rates and user feedback metrics"
      },
      analyticsInsights: {
        overview: "Analytics reveal key optimization opportunities",
        keyFindings: [
          {
            id: "finding-1",
            summary: "Mobile users show 35% higher bounce rate than desktop",
            metric: "Bounce Rate",
            currentValue: "45%",
            issueOrOpportunity: "issue",
            suggestedAction: "Implement mobile-first design improvements",
            relatedKpis: ["Bounce Rate", "Engagement"],
            confidence: "high",
            dataSourceHints: ["Google Analytics", "Optimizely"]
          }
        ],
        dataGaps: ["Historical trend data", "Competitive analysis"],
        recommendedAnalytics: ["Enhanced mobile tracking", "User journey mapping"]
      },
      experienceTactics: {
        overview: "Systematic experimentation opportunities identified",
        experiments: [
          {
            id: "exp-1",
            name: "Mobile Navigation Enhancement",
            hypothesis: "Simplified mobile navigation will increase page engagement",
            whereToRun: ["Mobile Homepage", "Category Pages"],
            audienceTargeting: "Mobile users",
            requiredStack: ["Optimizely WebX"],
            estimatedDurationWeeks: 3,
            successMetrics: ["Page Views", "Session Duration"],
            maturityFit: ["walk", "run"],
            implementationComplexity: "medium"
          }
        ],
        personalizationUseCases: [
          {
            id: "pers-1",
            title: "Returning User Experience",
            scenario: "Personalize experience for returning visitors",
            audienceDefinition: "Users with 2+ previous sessions",
            logicOrTrigger: "Session count and behavior history",
            contentOrExperienceChange: "Customized homepage and recommendations",
            toolsUsed: ["Optimizely WebX"],
            successMetrics: ["Return Visit Engagement", "Conversion Rate"],
            implementationEffort: "medium"
          }
        ],
        uxOptimizations: [
          {
            id: "ux-1",
            title: "Mobile Performance Enhancement",
            description: "Optimize mobile page load speeds and responsiveness",
            affectedPages: ["All mobile pages"],
            userImpact: "Faster, more responsive mobile experience",
            technicalRequirements: ["Performance optimization", "Mobile-first CSS"],
            priority: "high"
          }
        ]
      },
      strategyPlans: {
        narrativeSummary: "Strategic focus on mobile-first optimization with systematic testing approach",
        phasePlan: [
          {
            phase: "walk",
            timeHorizonMonths: 6,
            focusAreas: ["ContentImprovements", "ExperienceTactics"],
            keyInitiatives: ["Mobile experience optimization", "Systematic A/B testing"],
            dependencies: ["UX team capacity", "Development resources"],
            risks: ["Resource constraints", "Technical complexity"],
            successCriteria: ["20% improvement in mobile metrics", "Testing framework operational"],
            resourceRequirements: ["UX Designer", "Frontend Developer", "Analytics Specialist"]
          }
        ],
        roadmapItems: [
          {
            id: "roadmap-1",
            title: "Mobile-First Enhancement Initiative",
            description: "Comprehensive mobile experience optimization",
            focusArea: "ExperienceTactics",
            maturityPhase: "walk",
            startOrder: 1,
            durationWeeks: 8,
            ownerType: "Product Manager",
            relatedKpis: ["Mobile CVR", "Mobile Engagement"],
            prerequisites: ["Team alignment", "Resource allocation"],
            deliverables: ["Optimized mobile checkout", "Enhanced navigation", "Performance improvements"]
          }
        ],
        quarterlyMilestones: [
          {
            quarter: "Q1 2025",
            milestones: ["Mobile optimization completed", "Testing framework established"],
            kpiTargets: {
              "Mobile CVR": "20% improvement",
              "Mobile Bounce Rate": "15% reduction"
            }
          }
        ]
      },
      generation: {
        totalPasses: 2,
        finalQualityScore: 3.8,
        contextBucketsUsed: ["contentContext", "analyticsContext"],
        generationTimeMs: 15000,
        confidence: "medium",
        dataQualityNotes: []
      }
    }, null, 2);
  }

  private generateMockQualityScore(): string {
    return JSON.stringify({
      specificity: 3.8,
      stackAlignment: 4.2,
      maturityFit: 4.0,
      measurementRigor: 3.5,
      actionability: 3.9,
      overall: 3.9,
      issues: ["Could include more specific page URLs", "Measurement approaches could be more detailed"],
      missingAreas: [],
      recommendations: [
        "Add more specific page targeting in content improvements",
        "Include more detailed success metrics for experiments",
        "Provide more concrete timelines for roadmap items"
      ],
      contentImprovement: {
        score: 3.8,
        issues: ["Could be more specific about target pages"],
        strengths: ["Clear implementation steps", "Realistic difficulty assessment"]
      },
      analyticsInsights: {
        score: 3.7,
        issues: ["Limited data source references"],
        strengths: ["Clear metric identification", "Actionable recommendations"]
      },
      experienceTactics: {
        score: 4.0,
        issues: [],
        strengths: ["Well-designed experiments", "Realistic personalization use cases"]
      },
      strategyPlans: {
        score: 3.8,
        issues: ["Timeline could be more specific"],
        strengths: ["Clear phase structure", "Logical dependencies"]
      }
    }, null, 2);
  }

  private generateMockRefinedResults(): string {
    // Return improved version with additional context
    const results = JSON.parse(this.generateMockOSAResults());

    // Add refinements based on context
    results.contentImprovements.prioritizedActions[0].targetPagesOrSections = [
      "Homepage checkout CTA",
      "Product detail page purchase flow",
      "Cart abandonment recovery pages"
    ];

    results.analyticsInsights.keyFindings[0].dataSourceHints = [
      "Google Analytics 4",
      "Optimizely Results Dashboard",
      "Heat mapping data"
    ];

    results.generation.totalPasses = 3;
    results.generation.finalQualityScore = 4.2;
    results.generation.contextBucketsUsed = ["contentContext", "analyticsContext", "experienceTacticsContext"];

    return JSON.stringify(results, null, 2);
  }

  private generateMockConsistencyResults(): string {
    const results = JSON.parse(this.generateMockRefinedResults());

    // Ensure consistency across all sections
    results.generation.confidence = "high";
    results.generation.finalQualityScore = 4.3;

    return JSON.stringify(results, null, 2);
  }
}

// =============================================================================
// LLM Client Factory
// =============================================================================

export class LLMClientFactory {
  private static clientCache: Map<string, LLMClient> = new Map();

  static createClient(config?: Partial<LLMClientConfig>): LLMClient {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const cacheKey = `${finalConfig.provider}-${finalConfig.model}`;

    if (this.clientCache.has(cacheKey)) {
      return this.clientCache.get(cacheKey)!;
    }

    let client: LLMClient;

    switch (finalConfig.provider) {
      case 'openai':
        client = new OpenAIClient(finalConfig);
        break;
      case 'anthropic':
        client = new AnthropicClient(finalConfig);
        break;
      case 'mock':
      default:
        client = new MockLLMClient(finalConfig);
        break;
    }

    this.clientCache.set(cacheKey, client);
    dciLog('info', `Created ${finalConfig.provider} LLM client with model ${finalConfig.model}`);

    return client;
  }

  static async validateAllClients(): Promise<{ [provider: string]: boolean }> {
    const results: { [provider: string]: boolean } = {};

    for (const [key, client] of this.clientCache.entries()) {
      try {
        results[key] = await client.validateConnection();
      } catch (error) {
        results[key] = false;
        dciLog('error', `Client validation failed for ${key}:`, error);
      }
    }

    return results;
  }

  static clearCache(): void {
    this.clientCache.clear();
    dciLog('info', 'LLM client cache cleared');
  }
}

// =============================================================================
// Default Export
// =============================================================================

/**
 * Get the default LLM client based on environment configuration
 */
export function getLLMClient(config?: Partial<LLMClientConfig>): LLMClient {
  return LLMClientFactory.createClient(config);
}

/**
 * Validate LLM client connection
 */
export async function validateLLMConnection(config?: Partial<LLMClientConfig>): Promise<boolean> {
  try {
    const client = getLLMClient(config);
    return await client.validateConnection();
  } catch (error) {
    dciLog('error', 'LLM connection validation failed:', error);
    return false;
  }
}

// =============================================================================
// Export All Types and Classes
// =============================================================================

export {
  type LLMClientConfig,
  type LLMResponse,
  type LLMClient,
  OpenAIClient,
  AnthropicClient,
  MockLLMClient,
  DEFAULT_CONFIG as DEFAULT_LLM_CONFIG
};