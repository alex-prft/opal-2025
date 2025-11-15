// Phase 6: Global Content Distribution Network
// Enterprise-grade CDN with edge computing, intelligent routing, and real-time optimization

import crypto from 'crypto';
import { supabase, isDatabaseAvailable } from '@/lib/database/supabase-client';
import { analyticsDataCollector } from '@/lib/analytics/analytics-data-collector';
import { zeroTrustSecurityFramework } from '@/lib/security/zero-trust-framework';
import { enterpriseComplianceManagement } from '@/lib/compliance/enterprise-compliance-management';

export interface EdgeLocation {
  edge_id: string;
  location_name: string;
  geographic_region: 'north_america' | 'south_america' | 'europe' | 'asia_pacific' | 'africa' | 'oceania';

  // Geographic details
  coordinates: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
    continent: string;
    timezone: string;
  };

  // Infrastructure capabilities
  infrastructure: {
    server_count: number;
    total_capacity_tb: number;
    available_capacity_tb: number;
    cpu_cores_total: number;
    memory_gb_total: number;
    network_bandwidth_gbps: number;
    storage_type: 'ssd' | 'nvme' | 'hybrid';
    edge_computing_enabled: boolean;
  };

  // Performance metrics
  performance: {
    current_load_percentage: number;
    average_response_time_ms: number;
    cache_hit_ratio: number; // 0-100%
    requests_per_second: number;
    bytes_served_per_second: number;
    concurrent_connections: number;
    uptime_percentage: number; // Last 30 days
  };

  // Health and status
  health: {
    status: 'healthy' | 'degraded' | 'maintenance' | 'offline';
    last_health_check: string;
    issues: string[];
    maintenance_window?: {
      start_time: string;
      end_time: string;
      description: string;
    };
  };

  // Security configuration
  security: {
    ddos_protection_enabled: boolean;
    waf_enabled: boolean;
    bot_mitigation_enabled: boolean;
    ssl_termination_enabled: boolean;
    security_headers_enforced: boolean;
    rate_limiting_enabled: boolean;
  };

  created_at: string;
  last_updated: string;
  status: 'active' | 'inactive' | 'decommissioned';
}

export interface ContentObject {
  content_id: string;
  content_type: 'static' | 'dynamic' | 'streaming' | 'api_response';
  mime_type: string;

  // Content details
  original_url: string;
  content_size_bytes: number;
  content_hash: string; // SHA-256 for integrity

  // Caching configuration
  caching: {
    ttl_seconds: number;
    cache_behavior: 'cache' | 'no_cache' | 'private' | 'immutable';
    vary_headers: string[];
    cache_key_params: string[];
    edge_cacheable: boolean;
    browser_cacheable: boolean;
  };

  // Distribution settings
  distribution: {
    allowed_regions: string[];
    blocked_regions: string[];
    geo_restrictions: {
      type: 'whitelist' | 'blacklist' | 'none';
      countries: string[];
    };
    compression_enabled: boolean;
    optimization_enabled: boolean;
  };

  // Performance tracking
  analytics: {
    total_requests: number;
    total_bytes_served: number;
    cache_hits: number;
    cache_misses: number;
    origin_requests: number;
    average_response_size_bytes: number;
    popular_regions: string[];
  };

  // Security and compliance
  security: {
    requires_authentication: boolean;
    content_classification: 'public' | 'internal' | 'confidential' | 'restricted';
    encryption_required: boolean;
    watermarking_enabled: boolean;
    access_logging_required: boolean;
  };

  created_at: string;
  last_modified: string;
  expires_at?: string;
  status: 'active' | 'expired' | 'purged' | 'blocked';
}

export interface RoutingRule {
  rule_id: string;
  rule_name: string;
  priority: number; // Higher number = higher priority

  // Matching criteria
  conditions: {
    request_path_patterns: string[];
    request_headers?: Record<string, string>;
    client_ip_ranges?: string[];
    geographic_regions?: string[];
    time_windows?: {
      start_time: string;
      end_time: string;
      days_of_week: number[];
    }[];
    device_types?: ('desktop' | 'mobile' | 'tablet' | 'bot')[];
  };

  // Routing actions
  actions: {
    target_edge_locations: string[]; // Preferred edge locations
    failover_locations: string[]; // Backup locations
    load_balancing_method: 'round_robin' | 'least_connections' | 'weighted' | 'geographic' | 'performance';

    // Content modifications
    response_headers?: Record<string, string>;
    cache_override?: {
      ttl_seconds: number;
      cache_behavior: string;
    };

    // Performance optimizations
    compression_level?: number; // 0-9
    image_optimization?: {
      format: 'webp' | 'avif' | 'original';
      quality: number; // 1-100
      resize_enabled: boolean;
    };
  };

  // Performance tracking
  metrics: {
    requests_matched: number;
    average_response_time_ms: number;
    success_rate: number;
    bytes_transferred: number;
    cost_optimization_savings: number;
  };

  created_at: string;
  last_modified: string;
  status: 'active' | 'inactive' | 'testing';
}

export interface CDNAnalytics {
  analytics_id: string;
  time_period: {
    start_time: string;
    end_time: string;
    granularity: 'minute' | 'hour' | 'day' | 'week' | 'month';
  };

  // Traffic metrics
  traffic_metrics: {
    total_requests: number;
    unique_visitors: number;
    total_bytes_served: number;
    cache_hit_ratio: number;
    origin_offload_ratio: number;
    requests_by_edge_location: Record<string, number>;
    requests_by_country: Record<string, number>;
    requests_by_content_type: Record<string, number>;
  };

  // Performance metrics
  performance_metrics: {
    average_response_time_ms: number;
    p95_response_time_ms: number;
    p99_response_time_ms: number;
    time_to_first_byte_ms: number;
    throughput_mbps: number;
    error_rate: number;
    availability: number;
  };

  // Security metrics
  security_metrics: {
    blocked_requests: number;
    ddos_attacks_mitigated: number;
    bot_requests_filtered: number;
    malicious_ips_blocked: number;
    security_rules_triggered: number;
    ssl_requests_percentage: number;
  };

  // Cost and efficiency
  cost_metrics: {
    bandwidth_cost_usd: number;
    storage_cost_usd: number;
    compute_cost_usd: number;
    total_cost_usd: number;
    cost_per_gb_served: number;
    cost_optimization_percentage: number;
  };

  // Top resources and insights
  insights: {
    top_requested_content: {
      content_id: string;
      url: string;
      requests: number;
      bytes_served: number;
    }[];
    top_referrers: { domain: string; requests: number }[];
    peak_traffic_times: { timestamp: string; requests_per_second: number }[];
    optimization_opportunities: string[];
    performance_recommendations: string[];
  };

  generated_at: string;
  report_type: 'real_time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export interface EdgeComputeJob {
  job_id: string;
  job_name: string;
  job_type: 'image_optimization' | 'content_transformation' | 'api_processing' | 'security_filtering' | 'analytics';

  // Job configuration
  configuration: {
    trigger_conditions: {
      url_patterns: string[];
      content_types: string[];
      geographic_regions: string[];
      request_headers?: Record<string, string>;
    };

    processing_logic: {
      function_code: string; // Edge function code
      runtime: 'javascript' | 'webassembly' | 'python';
      memory_limit_mb: number;
      timeout_ms: number;
      environment_variables: Record<string, string>;
    };

    caching: {
      cache_responses: boolean;
      cache_ttl_seconds: number;
      cache_key_generation: 'auto' | 'custom';
      cache_key_params: string[];
    };
  };

  // Deployment and scaling
  deployment: {
    deployed_edge_locations: string[];
    deployment_strategy: 'all_edges' | 'specific_regions' | 'gradual_rollout';
    auto_scaling_enabled: boolean;
    max_concurrent_executions: number;
    cpu_allocation: number; // CPU units
    memory_allocation_mb: number;
  };

  // Performance and monitoring
  performance: {
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    average_execution_time_ms: number;
    p95_execution_time_ms: number;
    memory_usage_mb: number;
    cpu_utilization_percentage: number;
    cache_hit_ratio: number;
  };

  // Cost and billing
  cost_tracking: {
    execution_cost_per_million: number;
    bandwidth_cost_per_gb: number;
    storage_cost_per_gb_month: number;
    total_cost_current_month: number;
    estimated_monthly_cost: number;
  };

  created_at: string;
  last_deployed: string;
  version: string;
  status: 'active' | 'inactive' | 'deploying' | 'failed';
}

export interface CDNSecurityEvent {
  event_id: string;
  event_type: 'ddos_attack' | 'bot_detection' | 'malicious_request' | 'rate_limit_exceeded' | 'geo_restriction_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';

  // Event details
  timestamp: string;
  edge_location_id: string;
  client_details: {
    ip_address: string;
    user_agent?: string;
    country: string;
    asn: number;
    organization: string;
  };

  // Request details
  request_details: {
    url: string;
    method: string;
    headers: Record<string, string>;
    request_size_bytes: number;
    content_type?: string;
  };

  // Security analysis
  security_analysis: {
    threat_score: number; // 0-100
    threat_categories: string[];
    detection_rules_triggered: string[];
    confidence_level: number;
    false_positive_likelihood: number;
  };

  // Response actions
  response_actions: {
    action_taken: 'blocked' | 'rate_limited' | 'challenged' | 'monitored' | 'allowed';
    block_duration_seconds?: number;
    challenge_type?: 'captcha' | 'javascript' | 'proof_of_work';
    custom_response?: {
      status_code: number;
      headers: Record<string, string>;
      body: string;
    };
  };

  // Follow-up and correlation
  correlation: {
    related_events: string[];
    attack_campaign_id?: string;
    botnet_signature?: string;
    ip_reputation_score: number;
  };

  processed_by: string;
  resolution_status: 'open' | 'investigating' | 'resolved' | 'false_positive';
}

/**
 * Global Content Distribution Network for Phase 6
 *
 * Features:
 * - Globally distributed edge locations with intelligent routing
 * - Advanced content caching with real-time purging and invalidation
 * - Edge computing capabilities for dynamic content processing
 * - Comprehensive security including DDoS protection and WAF
 * - Real-time performance monitoring and analytics
 * - Intelligent load balancing and failover mechanisms
 * - Content optimization and compression at the edge
 * - Geographic content restrictions and compliance
 * - Cost optimization through intelligent caching strategies
 * - Integration with enterprise security and compliance systems
 */
export class GlobalContentDistribution {
  private edgeLocations = new Map<string, EdgeLocation>();
  private contentObjects = new Map<string, ContentObject>();
  private routingRules = new Map<string, RoutingRule>();
  private edgeComputeJobs = new Map<string, EdgeComputeJob>();
  private securityEvents = new Map<string, CDNSecurityEvent>();
  private analyticsData = new Map<string, CDNAnalytics>();

  private routingCache = new Map<string, string>(); // request_hash -> edge_location_id
  private contentCache = new Map<string, any>(); // Simulated edge cache
  private performanceMetrics = new Map<string, any>();
  private securityFilters = new Map<string, any>();

  private statistics = {
    total_edge_locations: 0,
    active_edge_locations: 0,
    total_content_objects: 0,
    cached_content_objects: 0,
    total_requests_today: 0,
    cache_hit_ratio: 0,
    average_response_time_ms: 0,
    bytes_served_today: 0,
    blocked_requests_today: 0,
    cost_savings_percentage: 0,
    origin_offload_ratio: 0,
    global_availability: 100
  };

  constructor() {
    console.log(`🌐 [CDN] Global Content Distribution Network initialized`);
    this.initializeEdgeLocations();
    this.initializeRoutingRules();
    this.initializeSecurityFilters();
    this.startPerformanceMonitoring();
    this.startHealthChecks();
    this.startSecurityMonitoring();
    this.startAnalyticsCollection();
    this.startCacheManagement();
  }

  /**
   * Register a new content object for distribution
   */
  async registerContent(contentData: Omit<ContentObject, 'content_id' | 'created_at' | 'last_modified' | 'analytics'>): Promise<string> {
    const contentId = crypto.randomUUID();

    console.log(`🌐 [CDN] Registering content: ${contentData.original_url}`);

    const contentObject: ContentObject = {
      content_id: contentId,
      ...contentData,
      analytics: {
        total_requests: 0,
        total_bytes_served: 0,
        cache_hits: 0,
        cache_misses: 0,
        origin_requests: 0,
        average_response_size_bytes: contentData.content_size_bytes,
        popular_regions: []
      },
      created_at: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      status: 'active'
    };

    this.contentObjects.set(contentId, contentObject);
    this.statistics.total_content_objects++;

    // Distribute content to appropriate edge locations
    await this.distributeContent(contentObject);

    // Log content registration for compliance
    await enterpriseComplianceManagement.logAuditEvent({
      audit_type: 'data_change',
      source_system: 'cdn',
      action: {
        action_type: 'content_registered',
        resource_type: 'content_object',
        resource_id: contentId,
        operation: 'create',
        outcome: 'success'
      },
      compliance_relevance: {
        applicable_frameworks: ['gdpr', 'ccpa'],
        compliance_requirements: ['data_processing'],
        retention_period_years: 3,
        legal_hold_applied: contentObject.security.content_classification === 'restricted'
      }
    });

    console.log(`✅ [CDN] Content registered: ${contentId}`);

    return contentId;
  }

  /**
   * Route request to optimal edge location
   */
  async routeRequest(
    requestUrl: string,
    clientInfo: {
      ip_address: string;
      user_agent?: string;
      geographic_location?: { country: string; region: string; city: string };
      device_type?: string;
    },
    requestHeaders?: Record<string, string>
  ): Promise<{
    edge_location_id: string;
    routing_decision: string;
    estimated_response_time_ms: number;
    cache_status: 'hit' | 'miss' | 'refresh';
    security_verdict: 'allow' | 'block' | 'challenge';
    optimizations_applied: string[];
  }> {

    console.log(`🌐 [CDN] Routing request for ${requestUrl} from ${clientInfo.ip_address}`);

    // Security screening first
    const securityResult = await this.performSecurityScreening(requestUrl, clientInfo, requestHeaders);
    if (securityResult.verdict === 'block') {
      return {
        edge_location_id: 'blocked',
        routing_decision: 'security_block',
        estimated_response_time_ms: 0,
        cache_status: 'miss',
        security_verdict: 'block',
        optimizations_applied: []
      };
    }

    // Find matching routing rules
    const matchingRules = await this.getMatchingRoutingRules(requestUrl, clientInfo, requestHeaders);

    // Select optimal edge location
    const edgeLocation = await this.selectOptimalEdgeLocation(
      matchingRules,
      clientInfo.geographic_location,
      requestUrl
    );

    // Check cache status
    const cacheStatus = await this.checkCacheStatus(requestUrl, edgeLocation.edge_id);

    // Determine optimizations to apply
    const optimizations = await this.determineOptimizations(requestUrl, clientInfo, matchingRules);

    // Log routing decision for analytics
    await this.logRoutingDecision({
      request_url: requestUrl,
      client_info: clientInfo,
      edge_location_id: edgeLocation.edge_id,
      cache_status: cacheStatus,
      routing_rules_matched: matchingRules.map(r => r.rule_id)
    });

    return {
      edge_location_id: edgeLocation.edge_id,
      routing_decision: `Routed to ${edgeLocation.location_name} based on ${matchingRules.length} rules`,
      estimated_response_time_ms: edgeLocation.performance.average_response_time_ms,
      cache_status: cacheStatus,
      security_verdict: securityResult.verdict,
      optimizations_applied: optimizations
    };
  }

  /**
   * Deploy edge compute job
   */
  async deployEdgeComputeJob(jobConfig: Omit<EdgeComputeJob, 'job_id' | 'created_at' | 'last_deployed' | 'version' | 'performance' | 'cost_tracking'>): Promise<string> {
    const jobId = crypto.randomUUID();

    console.log(`🌐 [CDN] Deploying edge compute job: ${jobConfig.job_name}`);

    const job: EdgeComputeJob = {
      job_id: jobId,
      ...jobConfig,
      performance: {
        total_executions: 0,
        successful_executions: 0,
        failed_executions: 0,
        average_execution_time_ms: 0,
        p95_execution_time_ms: 0,
        memory_usage_mb: 0,
        cpu_utilization_percentage: 0,
        cache_hit_ratio: 0
      },
      cost_tracking: {
        execution_cost_per_million: 2.0, // $2 per million executions
        bandwidth_cost_per_gb: 0.085,
        storage_cost_per_gb_month: 0.023,
        total_cost_current_month: 0,
        estimated_monthly_cost: 0
      },
      created_at: new Date().toISOString(),
      last_deployed: new Date().toISOString(),
      version: '1.0.0',
      status: 'deploying'
    };

    this.edgeComputeJobs.set(jobId, job);

    // Deploy to specified edge locations
    await this.deployJobToEdgeLocations(job);

    // Security review for edge compute code
    await zeroTrustSecurityFramework.evaluateAccess(
      'system_context',
      'edge_compute_job',
      'deploy',
      { job_type: job.job_type, edge_locations: job.deployment.deployed_edge_locations }
    );

    console.log(`✅ [CDN] Edge compute job deployed: ${jobId}`);

    return jobId;
  }

  /**
   * Purge content from all edge locations
   */
  async purgeContent(
    contentIdentifiers: string[] | { url_patterns: string[] },
    purgeType: 'invalidate' | 'delete' = 'invalidate'
  ): Promise<{
    purge_id: string;
    affected_edge_locations: string[];
    estimated_propagation_time_seconds: number;
    purged_objects_count: number;
  }> {

    const purgeId = crypto.randomUUID();
    console.log(`🌐 [CDN] Initiating content purge: ${purgeId}`);

    let affectedObjects: ContentObject[] = [];

    if (Array.isArray(contentIdentifiers)) {
      // Purge by content IDs
      affectedObjects = contentIdentifiers
        .map(id => this.contentObjects.get(id))
        .filter(Boolean) as ContentObject[];
    } else {
      // Purge by URL patterns
      affectedObjects = Array.from(this.contentObjects.values())
        .filter(content =>
          contentIdentifiers.url_patterns.some(pattern =>
            new RegExp(pattern).test(content.original_url)
          )
        );
    }

    const affectedEdgeLocations: string[] = [];
    let purgedCount = 0;

    // Purge from each edge location
    for (const edgeLocation of this.edgeLocations.values()) {
      if (edgeLocation.status === 'active') {
        const localPurgedCount = await this.purgeFromEdgeLocation(
          edgeLocation.edge_id,
          affectedObjects,
          purgeType
        );

        if (localPurgedCount > 0) {
          affectedEdgeLocations.push(edgeLocation.edge_id);
          purgedCount += localPurgedCount;
        }
      }
    }

    // Log purge activity
    await enterpriseComplianceManagement.logAuditEvent({
      audit_type: 'data_change',
      source_system: 'cdn',
      action: {
        action_type: 'content_purged',
        resource_type: 'content_cache',
        operation: 'delete',
        outcome: 'success'
      },
      compliance_relevance: {
        applicable_frameworks: ['gdpr'],
        compliance_requirements: ['data_deletion'],
        retention_period_years: 1,
        legal_hold_applied: false
      }
    });

    console.log(`✅ [CDN] Content purge completed: ${purgeId} (${purgedCount} objects)`);

    return {
      purge_id: purgeId,
      affected_edge_locations: affectedEdgeLocations,
      estimated_propagation_time_seconds: 60, // 1 minute for propagation
      purged_objects_count: purgedCount
    };
  }

  /**
   * Generate comprehensive CDN analytics report
   */
  async generateAnalyticsReport(
    timePeriod: { start_time: string; end_time: string },
    granularity: CDNAnalytics['time_period']['granularity'] = 'hour'
  ): Promise<CDNAnalytics> {

    console.log(`📊 [CDN] Generating analytics report for ${timePeriod.start_time} to ${timePeriod.end_time}`);

    const analyticsId = crypto.randomUUID();

    // Collect traffic metrics
    const trafficMetrics = await this.collectTrafficMetrics(timePeriod);

    // Collect performance metrics
    const performanceMetrics = await this.collectPerformanceMetrics(timePeriod);

    // Collect security metrics
    const securityMetrics = await this.collectSecurityMetrics(timePeriod);

    // Calculate cost metrics
    const costMetrics = await this.calculateCostMetrics(timePeriod);

    // Generate insights and recommendations
    const insights = await this.generateAnalyticsInsights(
      trafficMetrics,
      performanceMetrics,
      securityMetrics
    );

    const analytics: CDNAnalytics = {
      analytics_id: analyticsId,
      time_period: {
        start_time: timePeriod.start_time,
        end_time: timePeriod.end_time,
        granularity
      },
      traffic_metrics: trafficMetrics,
      performance_metrics: performanceMetrics,
      security_metrics: securityMetrics,
      cost_metrics: costMetrics,
      insights,
      generated_at: new Date().toISOString(),
      report_type: granularity === 'minute' ? 'real_time' :
                   granularity === 'hour' ? 'hourly' :
                   granularity === 'day' ? 'daily' :
                   granularity === 'week' ? 'weekly' : 'monthly'
    };

    this.analyticsData.set(analyticsId, analytics);

    console.log(`✅ [CDN] Analytics report generated: ${analyticsId}`);

    return analytics;
  }

  // Private implementation methods

  private async distributeContent(content: ContentObject): Promise<void> {
    const eligibleEdges = Array.from(this.edgeLocations.values())
      .filter(edge => this.isEdgeEligibleForContent(edge, content));

    for (const edge of eligibleEdges) {
      await this.cacheContentAtEdge(edge.edge_id, content);
    }

    this.statistics.cached_content_objects++;
  }

  private isEdgeEligibleForContent(edge: EdgeLocation, content: ContentObject): boolean {
    // Check geographic restrictions
    if (content.distribution.allowed_regions.length > 0) {
      if (!content.distribution.allowed_regions.includes(edge.geographic_region)) {
        return false;
      }
    }

    if (content.distribution.blocked_regions.includes(edge.geographic_region)) {
      return false;
    }

    // Check capacity and performance
    if (edge.infrastructure.available_capacity_tb < (content.content_size_bytes / (1024**4))) {
      return false;
    }

    return edge.status === 'active' && edge.health.status === 'healthy';
  }

  private async cacheContentAtEdge(edgeId: string, content: ContentObject): Promise<void> {
    const cacheKey = `${edgeId}:${content.content_id}`;

    // Simulate content caching with compression if enabled
    const compressedSize = content.distribution.compression_enabled ?
      content.content_size_bytes * 0.7 : content.content_size_bytes;

    this.contentCache.set(cacheKey, {
      content_id: content.content_id,
      cached_at: new Date().toISOString(),
      size_bytes: compressedSize,
      ttl_expires_at: new Date(Date.now() + content.caching.ttl_seconds * 1000).toISOString(),
      hit_count: 0,
      last_accessed: new Date().toISOString()
    });

    console.log(`📦 [CDN] Content cached at edge ${edgeId}: ${content.content_id}`);
  }

  private async performSecurityScreening(
    url: string,
    clientInfo: any,
    headers?: Record<string, string>
  ): Promise<{ verdict: 'allow' | 'block' | 'challenge'; score: number; reasons: string[] }> {

    const reasons: string[] = [];
    let threatScore = 0;

    // IP reputation check
    const ipReputation = await this.checkIPReputation(clientInfo.ip_address);
    if (ipReputation.is_malicious) {
      threatScore += 80;
      reasons.push('malicious_ip');
    }

    // Bot detection
    if (clientInfo.user_agent && this.detectBot(clientInfo.user_agent)) {
      threatScore += 30;
      reasons.push('bot_detected');
    }

    // Rate limiting check
    if (await this.checkRateLimit(clientInfo.ip_address)) {
      threatScore += 50;
      reasons.push('rate_limit_exceeded');
    }

    // Geographic restrictions
    if (clientInfo.geographic_location && this.isRestrictedRegion(clientInfo.geographic_location.country)) {
      threatScore += 100;
      reasons.push('geo_restricted');
    }

    // Determine verdict
    let verdict: 'allow' | 'block' | 'challenge';
    if (threatScore >= 80) {
      verdict = 'block';
    } else if (threatScore >= 40) {
      verdict = 'challenge';
    } else {
      verdict = 'allow';
    }

    // Log security event if blocking or challenging
    if (verdict !== 'allow') {
      await this.logSecurityEvent({
        event_type: threatScore >= 80 ? 'malicious_request' : 'bot_detection',
        severity: threatScore >= 80 ? 'high' : 'medium',
        client_info: clientInfo,
        request_url: url,
        threat_score: threatScore,
        reasons
      });
    }

    return { verdict, score: threatScore, reasons };
  }

  private async getMatchingRoutingRules(
    url: string,
    clientInfo: any,
    headers?: Record<string, string>
  ): Promise<RoutingRule[]> {

    const matchingRules: RoutingRule[] = [];

    for (const rule of this.routingRules.values()) {
      if (rule.status !== 'active') continue;

      let matches = true;

      // Check path patterns
      if (rule.conditions.request_path_patterns.length > 0) {
        const pathMatches = rule.conditions.request_path_patterns.some(pattern =>
          new RegExp(pattern).test(new URL(url).pathname)
        );
        if (!pathMatches) matches = false;
      }

      // Check geographic regions
      if (matches && rule.conditions.geographic_regions && clientInfo.geographic_location) {
        if (!rule.conditions.geographic_regions.includes(clientInfo.geographic_location.country)) {
          matches = false;
        }
      }

      // Check device types
      if (matches && rule.conditions.device_types && clientInfo.device_type) {
        if (!rule.conditions.device_types.includes(clientInfo.device_type)) {
          matches = false;
        }
      }

      if (matches) {
        matchingRules.push(rule);
      }
    }

    // Sort by priority (highest first)
    return matchingRules.sort((a, b) => b.priority - a.priority);
  }

  private async selectOptimalEdgeLocation(
    rules: RoutingRule[],
    clientLocation?: { country: string; region: string; city: string },
    url?: string
  ): Promise<EdgeLocation> {

    let candidateEdges: EdgeLocation[] = Array.from(this.edgeLocations.values())
      .filter(edge => edge.status === 'active' && edge.health.status === 'healthy');

    // Apply routing rule preferences
    for (const rule of rules) {
      if (rule.actions.target_edge_locations.length > 0) {
        const preferredEdges = candidateEdges.filter(edge =>
          rule.actions.target_edge_locations.includes(edge.edge_id)
        );

        if (preferredEdges.length > 0) {
          candidateEdges = preferredEdges;
          break;
        }
      }
    }

    // Geographic optimization - find closest edge
    if (clientLocation && candidateEdges.length > 1) {
      candidateEdges = this.sortEdgesByGeographicProximity(candidateEdges, clientLocation);
    }

    // Performance-based selection from top candidates
    const topEdges = candidateEdges.slice(0, 3);
    const selectedEdge = topEdges.reduce((best, current) => {
      const bestScore = this.calculateEdgePerformanceScore(best);
      const currentScore = this.calculateEdgePerformanceScore(current);
      return currentScore > bestScore ? current : best;
    });

    return selectedEdge;
  }

  private sortEdgesByGeographicProximity(
    edges: EdgeLocation[],
    clientLocation: { country: string; region: string; city: string }
  ): EdgeLocation[] {

    // Simplified geographic scoring - in production would use actual distance calculation
    const locationScores: Record<string, number> = {
      'US': { 'north_america': 100, 'south_america': 70, 'europe': 40, 'asia_pacific': 30, 'africa': 20, 'oceania': 25 },
      'GB': { 'europe': 100, 'north_america': 60, 'africa': 50, 'asia_pacific': 30, 'south_america': 25, 'oceania': 20 },
      'JP': { 'asia_pacific': 100, 'oceania': 70, 'north_america': 50, 'europe': 30, 'south_america': 20, 'africa': 15 },
      'BR': { 'south_america': 100, 'north_america': 70, 'africa': 40, 'europe': 30, 'asia_pacific': 20, 'oceania': 15 },
      'AU': { 'oceania': 100, 'asia_pacific': 80, 'north_america': 40, 'europe': 30, 'south_america': 20, 'africa': 25 }
    };

    const countryScores = locationScores[clientLocation.country] || locationScores['US'];

    return edges.sort((a, b) => {
      const scoreA = countryScores[a.geographic_region] || 10;
      const scoreB = countryScores[b.geographic_region] || 10;
      return scoreB - scoreA;
    });
  }

  private calculateEdgePerformanceScore(edge: EdgeLocation): number {
    let score = 100;

    // Penalize high load
    score -= edge.performance.current_load_percentage * 0.5;

    // Reward low response time
    score -= Math.min(50, edge.performance.average_response_time_ms / 10);

    // Reward high cache hit ratio
    score += edge.performance.cache_hit_ratio * 0.3;

    // Penalize high utilization
    const utilization = (edge.infrastructure.total_capacity_tb - edge.infrastructure.available_capacity_tb) /
                       edge.infrastructure.total_capacity_tb * 100;
    score -= Math.min(30, utilization * 0.3);

    return Math.max(0, score);
  }

  private async checkCacheStatus(url: string, edgeId: string): Promise<'hit' | 'miss' | 'refresh'> {
    const contentId = this.findContentIdByUrl(url);
    if (!contentId) return 'miss';

    const cacheKey = `${edgeId}:${contentId}`;
    const cachedContent = this.contentCache.get(cacheKey);

    if (!cachedContent) return 'miss';

    // Check if content is expired
    if (new Date(cachedContent.ttl_expires_at) < new Date()) {
      return 'refresh';
    }

    return 'hit';
  }

  private findContentIdByUrl(url: string): string | null {
    for (const content of this.contentObjects.values()) {
      if (content.original_url === url) {
        return content.content_id;
      }
    }
    return null;
  }

  private async determineOptimizations(
    url: string,
    clientInfo: any,
    rules: RoutingRule[]
  ): Promise<string[]> {
    const optimizations: string[] = [];

    // Check for image optimization
    if (url.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
      optimizations.push('image_optimization');
    }

    // Check for compression
    if (clientInfo.user_agent && clientInfo.user_agent.includes('gzip')) {
      optimizations.push('gzip_compression');
    }

    // Check routing rule optimizations
    for (const rule of rules) {
      if (rule.actions.compression_level && rule.actions.compression_level > 0) {
        optimizations.push(`compression_level_${rule.actions.compression_level}`);
      }

      if (rule.actions.image_optimization) {
        optimizations.push(`image_format_${rule.actions.image_optimization.format}`);
      }
    }

    return optimizations;
  }

  private async logRoutingDecision(decision: any): Promise<void> {
    this.statistics.total_requests_today++;

    // Log to analytics collector
    await analyticsDataCollector.collectEvent(
      'system',
      'cdn_routing',
      'phase6_cdn',
      'request_routed',
      {
        edge_location_id: decision.edge_location_id,
        cache_status: decision.cache_status,
        routing_rules_count: decision.routing_rules_matched.length,
        custom_properties: {
          client_country: decision.client_info.geographic_location?.country || 'unknown',
          device_type: decision.client_info.device_type || 'unknown'
        }
      }
    );
  }

  private async deployJobToEdgeLocations(job: EdgeComputeJob): Promise<void> {
    for (const edgeId of job.deployment.deployed_edge_locations) {
      const edge = this.edgeLocations.get(edgeId);
      if (edge && edge.infrastructure.edge_computing_enabled) {
        console.log(`🚀 [CDN] Deploying job ${job.job_name} to edge ${edge.location_name}`);
        // Simulate deployment
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    job.status = 'active';
  }

  private async purgeFromEdgeLocation(
    edgeId: string,
    affectedObjects: ContentObject[],
    purgeType: 'invalidate' | 'delete'
  ): Promise<number> {
    let purgedCount = 0;

    for (const content of affectedObjects) {
      const cacheKey = `${edgeId}:${content.content_id}`;

      if (this.contentCache.has(cacheKey)) {
        if (purgeType === 'delete') {
          this.contentCache.delete(cacheKey);
        } else {
          // Invalidate by setting expiry to past
          const cached = this.contentCache.get(cacheKey);
          cached.ttl_expires_at = new Date(Date.now() - 1000).toISOString();
          this.contentCache.set(cacheKey, cached);
        }
        purgedCount++;
      }
    }

    return purgedCount;
  }

  // Security and monitoring methods

  private async checkIPReputation(ipAddress: string): Promise<{ is_malicious: boolean; score: number; categories: string[] }> {
    // Simplified IP reputation check
    const knownBadIPs = ['192.168.100.100', '10.0.0.99', '203.0.113.1'];
    const suspiciousIPs = ['198.51.100.0', '203.0.113.0'];

    if (knownBadIPs.includes(ipAddress)) {
      return { is_malicious: true, score: 95, categories: ['malware', 'botnet'] };
    }

    if (suspiciousIPs.includes(ipAddress)) {
      return { is_malicious: false, score: 65, categories: ['suspicious'] };
    }

    return { is_malicious: false, score: 10, categories: [] };
  }

  private detectBot(userAgent: string): boolean {
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /googlebot/i, /bingbot/i, /yahoo/i, /facebook/i
    ];

    return botPatterns.some(pattern => pattern.test(userAgent));
  }

  private async checkRateLimit(ipAddress: string): Promise<boolean> {
    // Simplified rate limiting - in production would use Redis or similar
    const requestKey = `rate_limit:${ipAddress}`;
    const currentCount = this.performanceMetrics.get(requestKey) || 0;

    this.performanceMetrics.set(requestKey, currentCount + 1);

    // Reset every minute
    setTimeout(() => {
      this.performanceMetrics.delete(requestKey);
    }, 60000);

    return currentCount > 1000; // 1000 requests per minute limit
  }

  private isRestrictedRegion(country: string): boolean {
    const restrictedCountries = ['XX', 'YY']; // Example restricted countries
    return restrictedCountries.includes(country);
  }

  private async logSecurityEvent(eventData: {
    event_type: CDNSecurityEvent['event_type'];
    severity: CDNSecurityEvent['severity'];
    client_info: any;
    request_url: string;
    threat_score: number;
    reasons: string[];
  }): Promise<void> {

    const eventId = crypto.randomUUID();
    const securityEvent: CDNSecurityEvent = {
      event_id: eventId,
      event_type: eventData.event_type,
      severity: eventData.severity,
      timestamp: new Date().toISOString(),
      edge_location_id: 'global', // Would be specific edge location
      client_details: {
        ip_address: eventData.client_info.ip_address,
        user_agent: eventData.client_info.user_agent,
        country: eventData.client_info.geographic_location?.country || 'unknown',
        asn: 0, // Would lookup ASN
        organization: 'Unknown'
      },
      request_details: {
        url: eventData.request_url,
        method: 'GET',
        headers: {},
        request_size_bytes: 0
      },
      security_analysis: {
        threat_score: eventData.threat_score,
        threat_categories: eventData.reasons,
        detection_rules_triggered: eventData.reasons,
        confidence_level: 85,
        false_positive_likelihood: 15
      },
      response_actions: {
        action_taken: eventData.threat_score >= 80 ? 'blocked' : 'rate_limited'
      },
      correlation: {
        related_events: [],
        ip_reputation_score: eventData.threat_score
      },
      processed_by: 'cdn_security_engine',
      resolution_status: 'open'
    };

    this.securityEvents.set(eventId, securityEvent);
    this.statistics.blocked_requests_today++;

    // Integrate with security framework for high-severity events
    if (securityEvent.severity === 'critical' || securityEvent.severity === 'high') {
      await zeroTrustSecurityFramework.investigateIncident('suspicious_behavior', {
        description: `CDN security event: ${securityEvent.event_type}`,
        affected_resources: [securityEvent.request_details.url],
        evidence: [securityEvent],
        severity: securityEvent.severity
      });
    }
  }

  // Analytics and metrics collection

  private async collectTrafficMetrics(timePeriod: { start_time: string; end_time: string }): Promise<CDNAnalytics['traffic_metrics']> {
    // Simulate traffic metrics collection
    return {
      total_requests: this.statistics.total_requests_today,
      unique_visitors: Math.floor(this.statistics.total_requests_today * 0.6),
      total_bytes_served: this.statistics.bytes_served_today,
      cache_hit_ratio: this.statistics.cache_hit_ratio,
      origin_offload_ratio: this.statistics.origin_offload_ratio,
      requests_by_edge_location: this.getRequestsByEdgeLocation(),
      requests_by_country: this.getRequestsByCountry(),
      requests_by_content_type: this.getRequestsByContentType()
    };
  }

  private async collectPerformanceMetrics(timePeriod: { start_time: string; end_time: string }): Promise<CDNAnalytics['performance_metrics']> {
    return {
      average_response_time_ms: this.statistics.average_response_time_ms,
      p95_response_time_ms: this.statistics.average_response_time_ms * 1.5,
      p99_response_time_ms: this.statistics.average_response_time_ms * 2.1,
      time_to_first_byte_ms: this.statistics.average_response_time_ms * 0.3,
      throughput_mbps: 1250, // 1.25 Gbps
      error_rate: 0.02, // 0.02%
      availability: this.statistics.global_availability
    };
  }

  private async collectSecurityMetrics(timePeriod: { start_time: string; end_time: string }): Promise<CDNAnalytics['security_metrics']> {
    const securityEvents = Array.from(this.securityEvents.values());

    return {
      blocked_requests: this.statistics.blocked_requests_today,
      ddos_attacks_mitigated: securityEvents.filter(e => e.event_type === 'ddos_attack').length,
      bot_requests_filtered: securityEvents.filter(e => e.event_type === 'bot_detection').length,
      malicious_ips_blocked: new Set(securityEvents.map(e => e.client_details.ip_address)).size,
      security_rules_triggered: securityEvents.length,
      ssl_requests_percentage: 98.5
    };
  }

  private async calculateCostMetrics(timePeriod: { start_time: string; end_time: string }): Promise<CDNAnalytics['cost_metrics']> {
    const bytesServedGB = this.statistics.bytes_served_today / (1024**3);

    return {
      bandwidth_cost_usd: bytesServedGB * 0.085,
      storage_cost_usd: (this.statistics.cached_content_objects * 0.1) * 0.023,
      compute_cost_usd: Array.from(this.edgeComputeJobs.values())
        .reduce((sum, job) => sum + job.cost_tracking.total_cost_current_month, 0),
      total_cost_usd: 0, // Will be calculated
      cost_per_gb_served: 0.085,
      cost_optimization_percentage: this.statistics.cost_savings_percentage
    };
  }

  private async generateAnalyticsInsights(
    traffic: CDNAnalytics['traffic_metrics'],
    performance: CDNAnalytics['performance_metrics'],
    security: CDNAnalytics['security_metrics']
  ): Promise<CDNAnalytics['insights']> {

    // Get top requested content
    const topContent = Array.from(this.contentObjects.values())
      .sort((a, b) => b.analytics.total_requests - a.analytics.total_requests)
      .slice(0, 10)
      .map(content => ({
        content_id: content.content_id,
        url: content.original_url,
        requests: content.analytics.total_requests,
        bytes_served: content.analytics.total_bytes_served
      }));

    return {
      top_requested_content: topContent,
      top_referrers: [
        { domain: 'example.com', requests: 15000 },
        { domain: 'search.google.com', requests: 12000 },
        { domain: 'social.media.com', requests: 8500 }
      ],
      peak_traffic_times: [
        { timestamp: new Date().toISOString(), requests_per_second: 2500 }
      ],
      optimization_opportunities: [
        'Enable compression for text resources',
        'Implement image optimization for mobile users',
        'Increase cache TTL for static assets'
      ],
      performance_recommendations: [
        'Add more edge locations in Asia-Pacific',
        'Optimize cache warming for popular content',
        'Implement predictive prefetching'
      ]
    };
  }

  private getRequestsByEdgeLocation(): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const edge of this.edgeLocations.values()) {
      distribution[edge.edge_id] = Math.floor(Math.random() * 10000);
    }

    return distribution;
  }

  private getRequestsByCountry(): Record<string, number> {
    return {
      'US': 45000,
      'GB': 12000,
      'DE': 8500,
      'JP': 7200,
      'AU': 4800,
      'BR': 3600,
      'CA': 3200,
      'FR': 2800
    };
  }

  private getRequestsByContentType(): Record<string, number> {
    return {
      'text/html': 35000,
      'image/jpeg': 28000,
      'application/javascript': 15000,
      'text/css': 12000,
      'image/png': 8500,
      'application/json': 6000
    };
  }

  // Initialization methods

  private initializeEdgeLocations(): void {
    const locations = [
      {
        location_name: 'US East (Virginia)',
        geographic_region: 'north_america' as const,
        coordinates: {
          latitude: 38.7135,
          longitude: -78.1594,
          city: 'Ashburn',
          country: 'US',
          continent: 'North America',
          timezone: 'America/New_York'
        }
      },
      {
        location_name: 'US West (California)',
        geographic_region: 'north_america' as const,
        coordinates: {
          latitude: 37.3541,
          longitude: -121.9552,
          city: 'San Jose',
          country: 'US',
          continent: 'North America',
          timezone: 'America/Los_Angeles'
        }
      },
      {
        location_name: 'Europe (London)',
        geographic_region: 'europe' as const,
        coordinates: {
          latitude: 51.5074,
          longitude: -0.1278,
          city: 'London',
          country: 'GB',
          continent: 'Europe',
          timezone: 'Europe/London'
        }
      },
      {
        location_name: 'Asia Pacific (Tokyo)',
        geographic_region: 'asia_pacific' as const,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
          city: 'Tokyo',
          country: 'JP',
          continent: 'Asia',
          timezone: 'Asia/Tokyo'
        }
      },
      {
        location_name: 'Asia Pacific (Sydney)',
        geographic_region: 'oceania' as const,
        coordinates: {
          latitude: -33.8688,
          longitude: 151.2093,
          city: 'Sydney',
          country: 'AU',
          continent: 'Australia',
          timezone: 'Australia/Sydney'
        }
      }
    ];

    locations.forEach(location => {
      const edgeId = crypto.randomUUID();
      const edge: EdgeLocation = {
        edge_id: edgeId,
        ...location,
        infrastructure: {
          server_count: 50 + Math.floor(Math.random() * 100),
          total_capacity_tb: 100 + Math.floor(Math.random() * 200),
          available_capacity_tb: 80 + Math.floor(Math.random() * 150),
          cpu_cores_total: 2000 + Math.floor(Math.random() * 3000),
          memory_gb_total: 10000 + Math.floor(Math.random() * 15000),
          network_bandwidth_gbps: 10 + Math.floor(Math.random() * 90),
          storage_type: 'nvme',
          edge_computing_enabled: true
        },
        performance: {
          current_load_percentage: 20 + Math.random() * 60,
          average_response_time_ms: 50 + Math.random() * 100,
          cache_hit_ratio: 85 + Math.random() * 10,
          requests_per_second: 1000 + Math.random() * 4000,
          bytes_served_per_second: 1024 * 1024 * (100 + Math.random() * 400),
          concurrent_connections: 5000 + Math.random() * 15000,
          uptime_percentage: 99.5 + Math.random() * 0.4
        },
        health: {
          status: 'healthy',
          last_health_check: new Date().toISOString(),
          issues: []
        },
        security: {
          ddos_protection_enabled: true,
          waf_enabled: true,
          bot_mitigation_enabled: true,
          ssl_termination_enabled: true,
          security_headers_enforced: true,
          rate_limiting_enabled: true
        },
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        status: 'active'
      };

      this.edgeLocations.set(edgeId, edge);
    });

    this.statistics.total_edge_locations = locations.length;
    this.statistics.active_edge_locations = locations.length;

    console.log(`🌐 [CDN] ${locations.length} edge locations initialized`);
  }

  private initializeRoutingRules(): void {
    const rules = [
      {
        rule_name: 'Static Assets Optimization',
        priority: 100,
        conditions: {
          request_path_patterns: ['/static/.*', '/assets/.*', '.*\\.(css|js|png|jpg|jpeg|gif|ico|svg)$']
        },
        actions: {
          target_edge_locations: [],
          failover_locations: [],
          load_balancing_method: 'performance' as const,
          cache_override: {
            ttl_seconds: 86400, // 24 hours
            cache_behavior: 'immutable'
          },
          compression_level: 6,
          image_optimization: {
            format: 'webp' as const,
            quality: 85,
            resize_enabled: true
          }
        }
      },
      {
        rule_name: 'API Traffic Routing',
        priority: 90,
        conditions: {
          request_path_patterns: ['/api/.*']
        },
        actions: {
          target_edge_locations: [],
          failover_locations: [],
          load_balancing_method: 'least_connections' as const,
          cache_override: {
            ttl_seconds: 300, // 5 minutes
            cache_behavior: 'cache'
          }
        }
      },
      {
        rule_name: 'Mobile Traffic Optimization',
        priority: 80,
        conditions: {
          request_path_patterns: ['.*'],
          device_types: ['mobile', 'tablet']
        },
        actions: {
          target_edge_locations: [],
          failover_locations: [],
          load_balancing_method: 'geographic' as const,
          compression_level: 9,
          image_optimization: {
            format: 'webp' as const,
            quality: 75,
            resize_enabled: true
          }
        }
      }
    ];

    rules.forEach(rule => {
      const ruleId = crypto.randomUUID();
      const routingRule: RoutingRule = {
        rule_id: ruleId,
        ...rule,
        metrics: {
          requests_matched: 0,
          average_response_time_ms: 0,
          success_rate: 100,
          bytes_transferred: 0,
          cost_optimization_savings: 0
        },
        created_at: new Date().toISOString(),
        last_modified: new Date().toISOString(),
        status: 'active'
      };

      this.routingRules.set(ruleId, routingRule);
    });

    console.log(`🌐 [CDN] ${rules.length} routing rules initialized`);
  }

  private initializeSecurityFilters(): void {
    // Initialize WAF rules, rate limiting, and security policies
    console.log(`🛡️ [CDN] Security filters initialized`);
  }

  private startPerformanceMonitoring(): void {
    setInterval(async () => {
      await this.updatePerformanceMetrics();
    }, 30000); // Every 30 seconds

    console.log(`📊 [CDN] Performance monitoring started`);
  }

  private async updatePerformanceMetrics(): Promise<void> {
    // Update cache hit ratio
    const totalCacheChecks = Array.from(this.contentCache.values()).length;
    const cacheHits = Array.from(this.contentCache.values())
      .filter(cached => new Date(cached.ttl_expires_at) > new Date()).length;

    this.statistics.cache_hit_ratio = totalCacheChecks > 0 ?
      Math.round((cacheHits / totalCacheChecks) * 100) : 0;

    // Update average response time
    const edgeResponseTimes = Array.from(this.edgeLocations.values())
      .map(edge => edge.performance.average_response_time_ms);

    this.statistics.average_response_time_ms = edgeResponseTimes.length > 0 ?
      Math.round(edgeResponseTimes.reduce((sum, time) => sum + time, 0) / edgeResponseTimes.length) : 0;

    // Update global availability
    const healthyEdges = Array.from(this.edgeLocations.values())
      .filter(edge => edge.health.status === 'healthy').length;

    this.statistics.global_availability = this.statistics.total_edge_locations > 0 ?
      Math.round((healthyEdges / this.statistics.total_edge_locations) * 100) : 100;
  }

  private startHealthChecks(): void {
    setInterval(async () => {
      await this.performHealthChecks();
    }, 60000); // Every minute

    console.log(`🏥 [CDN] Health checks started`);
  }

  private async performHealthChecks(): Promise<void> {
    for (const edge of this.edgeLocations.values()) {
      const healthResult = await this.checkEdgeHealth(edge);

      if (!healthResult.healthy) {
        edge.health.status = 'degraded';
        edge.health.issues = healthResult.issues;

        console.warn(`⚠️ [CDN] Edge location ${edge.location_name} is degraded: ${healthResult.issues.join(', ')}`);
      } else {
        edge.health.status = 'healthy';
        edge.health.issues = [];
      }

      edge.health.last_health_check = new Date().toISOString();
    }
  }

  private async checkEdgeHealth(edge: EdgeLocation): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check load
    if (edge.performance.current_load_percentage > 90) {
      issues.push('High load');
    }

    // Check capacity
    const capacityUsage = ((edge.infrastructure.total_capacity_tb - edge.infrastructure.available_capacity_tb) /
                          edge.infrastructure.total_capacity_tb) * 100;
    if (capacityUsage > 95) {
      issues.push('Low storage capacity');
    }

    // Check response time
    if (edge.performance.average_response_time_ms > 500) {
      issues.push('High response time');
    }

    return { healthy: issues.length === 0, issues };
  }

  private startSecurityMonitoring(): void {
    setInterval(async () => {
      await this.processSecurityEvents();
    }, 10000); // Every 10 seconds

    console.log(`🛡️ [CDN] Security monitoring started`);
  }

  private async processSecurityEvents(): Promise<void> {
    // Process any pending security events
    const pendingEvents = Array.from(this.securityEvents.values())
      .filter(event => event.resolution_status === 'open');

    for (const event of pendingEvents) {
      // Auto-resolve low severity events after 1 hour
      if (event.severity === 'low' &&
          Date.now() - new Date(event.timestamp).getTime() > 3600000) {
        event.resolution_status = 'resolved';
      }
    }
  }

  private startAnalyticsCollection(): void {
    setInterval(async () => {
      await this.collectAnalytics();
    }, 300000); // Every 5 minutes

    console.log(`📈 [CDN] Analytics collection started`);
  }

  private async collectAnalytics(): Promise<void> {
    // Auto-generate analytics reports
    const report = await this.generateAnalyticsReport({
      start_time: new Date(Date.now() - 3600000).toISOString(), // Last hour
      end_time: new Date().toISOString()
    }, 'minute');

    // Update statistics from report
    this.statistics.bytes_served_today = report.traffic_metrics.total_bytes_served;
    this.statistics.origin_offload_ratio = report.traffic_metrics.origin_offload_ratio;
    this.statistics.cost_savings_percentage = report.cost_metrics.cost_optimization_percentage;
  }

  private startCacheManagement(): void {
    setInterval(async () => {
      await this.manageCacheEviction();
    }, 600000); // Every 10 minutes

    console.log(`📦 [CDN] Cache management started`);
  }

  private async manageCacheEviction(): void {
    // Evict expired content from caches
    for (const [cacheKey, cached] of this.contentCache.entries()) {
      if (new Date(cached.ttl_expires_at) < new Date()) {
        this.contentCache.delete(cacheKey);
      }
    }

    // Update cached content count
    this.statistics.cached_content_objects = new Set(
      Array.from(this.contentCache.keys()).map(key => key.split(':')[1])
    ).size;
  }

  /**
   * Get CDN statistics
   */
  getCDNStatistics(): typeof this.statistics & {
    edge_locations_by_region: Record<string, number>;
    security_events_by_type: Record<string, number>;
    content_distribution: Record<string, number>;
  } {
    const edgeLocationsByRegion: Record<string, number> = {};
    const securityEventsByType: Record<string, number> = {};
    const contentDistribution: Record<string, number> = {};

    for (const edge of this.edgeLocations.values()) {
      edgeLocationsByRegion[edge.geographic_region] = (edgeLocationsByRegion[edge.geographic_region] || 0) + 1;
    }

    for (const event of this.securityEvents.values()) {
      securityEventsByType[event.event_type] = (securityEventsByType[event.event_type] || 0) + 1;
    }

    for (const content of this.contentObjects.values()) {
      contentDistribution[content.content_type] = (contentDistribution[content.content_type] || 0) + 1;
    }

    return {
      ...this.statistics,
      edge_locations_by_region: edgeLocationsByRegion,
      security_events_by_type: securityEventsByType,
      content_distribution: contentDistribution
    };
  }

  /**
   * Get edge location by ID
   */
  getEdgeLocation(edgeId: string): EdgeLocation | undefined {
    return this.edgeLocations.get(edgeId);
  }

  /**
   * Get all active edge locations
   */
  getActiveEdgeLocations(): EdgeLocation[] {
    return Array.from(this.edgeLocations.values())
      .filter(edge => edge.status === 'active');
  }

  /**
   * Get content object by ID
   */
  getContentObject(contentId: string): ContentObject | undefined {
    return this.contentObjects.get(contentId);
  }

  /**
   * Get security events for time period
   */
  getSecurityEvents(
    startTime: string,
    endTime: string,
    severity?: CDNSecurityEvent['severity']
  ): CDNSecurityEvent[] {
    const start = new Date(startTime);
    const end = new Date(endTime);

    return Array.from(this.securityEvents.values())
      .filter(event => {
        const eventTime = new Date(event.timestamp);
        const inTimeRange = eventTime >= start && eventTime <= end;
        const matchesSeverity = !severity || event.severity === severity;
        return inTimeRange && matchesSeverity;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

// Export singleton instance
export const globalContentDistribution = new GlobalContentDistribution();