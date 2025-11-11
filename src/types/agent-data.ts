export interface AgentDataPayload {
  success: boolean;
  agent_id: string;
  dataSentToOSA: Record<string, any>;
  optimizelyDxpTools: string[];
  strategyAssistance: {
    recommendations: string[];
  };
  opalCustomTools: {
    toolName: string;
    description: string;
  }[];
  osaSuggestions: {
    recommendationService: string[];
    knowledgeRetrievalService: string[];
    preferencesPolicyService: string[];
  };
  useCaseScenarios?: string[];
  nextBestActions?: string[];
  lastDataSent?: string;
  timestamp: string;
}

export interface AgentOverride {
  strategyAssistance?: {
    recommendations: string[];
  };
  osaSuggestions?: {
    recommendationService: string[];
    knowledgeRetrievalService: string[];
    preferencesPolicyService: string[];
  };
  useCaseScenarios?: string[];
  nextBestActions?: string[];
  lastModified: string;
}

export interface AgentOverrideStore {
  [agentId: string]: AgentOverride;
}

// Agent route mapping
export const AGENT_ROUTES = {
  content: 'content_review',
  aeo: 'geo_audit',
  audiences: 'audience_suggester',
  exp: 'experiment_blueprinter',
  pers: 'personalization_idea_generator',
  journeys: 'customer_journey',
  roadmap: 'roadmap_generator',
  cmp: 'cmp_organizer'
} as const;

export type AgentRoute = keyof typeof AGENT_ROUTES;
export type AgentId = typeof AGENT_ROUTES[AgentRoute];

// Agent display names
export const AGENT_NAMES = {
  content_review: 'Content Review Agent',
  geo_audit: 'Generative Engine Optimization Audit',
  audience_suggester: 'Audience Suggester',
  experiment_blueprinter: 'Experiment Blueprinter',
  personalization_idea_generator: 'Personalization Idea Generator',
  customer_journey: 'Customer Journey Agent',
  roadmap_generator: 'Roadmap Generator',
  cmp_organizer: 'CMP Organizer',
  integration_health: 'Integration Health Monitor'
} as const;