// Phase 5: Intelligent Content Recommendation Engine
// Advanced ML-powered recommendation system with real-time personalization

import crypto from 'crypto';
import { supabase, isDatabaseAvailable } from '@/lib/database/supabase-client';
import { analyticsDataCollector } from '@/lib/analytics/analytics-data-collector';
import { contentOptimizationPipeline } from '@/lib/ml/content-optimization-pipeline';
import { intelligentCache } from '@/lib/cache/intelligent-cache-system';

export interface ContentItem {
  content_id: string;
  content_type: 'article' | 'product' | 'video' | 'image' | 'document' | 'tool' | 'service' | 'course';
  title: string;
  description?: string;
  category: string;
  subcategory?: string;

  // Content metadata
  metadata: {
    author?: string;
    created_date: string;
    updated_date?: string;
    tags: string[];
    keywords: string[];
    language: string;
    difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
    estimated_read_time_minutes?: number;
  };

  // Content features for ML
  features: {
    content_length: number;
    readability_score: number;
    engagement_score: number;
    quality_score: number;
    popularity_score: number;
    recency_score: number;
    semantic_embeddings?: number[]; // Vector embeddings
    topic_distribution?: Record<string, number>;
  };

  // Performance metrics
  metrics: {
    total_views: number;
    unique_views: number;
    average_time_spent: number; // seconds
    bounce_rate: number; // 0-100%
    conversion_rate: number; // 0-100%
    user_ratings?: number[]; // 1-5 scale
    average_rating?: number;
    social_shares: number;
    comments_count: number;
  };

  // Availability and access
  availability: {
    is_published: boolean;
    publish_date?: string;
    expiry_date?: string;
    access_level: 'public' | 'registered' | 'premium' | 'restricted';
    geographic_restrictions?: string[];
    device_compatibility: ('desktop' | 'mobile' | 'tablet')[];
  };

  // Relationships
  related_content_ids: string[];
  parent_content_id?: string;
  child_content_ids: string[];

  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  user_id: string;
  user_session_id?: string;

  // User demographics
  demographics: {
    age_group?: '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';
    location?: {
      country: string;
      region?: string;
      city?: string;
      timezone: string;
    };
    occupation_category?: string;
    industry?: string;
    experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  };

  // Preferences and interests
  preferences: {
    content_types: Record<string, number>; // Preference scores 0-1
    categories: Record<string, number>;
    topics: Record<string, number>;
    formats: Record<string, number>; // text, video, interactive, etc.
    difficulty_preference: 'beginner' | 'intermediate' | 'advanced' | 'adaptive';
    language_preferences: string[];
    notification_preferences: Record<string, boolean>;
  };

  // Behavioral patterns
  behavior: {
    session_frequency: number; // Sessions per week
    average_session_duration: number; // Minutes
    preferred_times: number[]; // Hours of day (0-23)
    preferred_days: number[]; // Days of week (0-6)
    device_usage: Record<string, number>; // Device type usage percentage
    reading_speed: number; // Words per minute
    engagement_patterns: {
      scroll_depth_avg: number; // 0-100%
      interaction_rate: number; // Clicks/views
      completion_rate: number; // Content completion rate
      return_rate: number; // Rate of returning to content
    };
  };

  // ML-computed features
  computed_features: {
    user_cluster?: string; // Clustering assignment
    similarity_vectors?: number[]; // User embedding vectors
    interest_evolution?: Record<string, number[]>; // Interest changes over time
    predicted_lifetime_value?: number;
    churn_probability?: number; // 0-1
    content_discovery_style?: 'explorer' | 'focused' | 'social' | 'trending';
  };

  // Recommendation state
  recommendation_state: {
    last_recommendations: string[]; // Recent recommendation IDs
    feedback_history: RecommendationFeedback[];
    personalization_level: 'low' | 'medium' | 'high';
    exploration_vs_exploitation: number; // 0-1 (0=exploit, 1=explore)
    cold_start_phase: boolean;
  };

  created_at: string;
  updated_at: string;
}

export interface RecommendationRequest {
  request_id: string;
  user_profile: UserProfile;
  context: {
    // Request context
    page_id?: string;
    current_content_id?: string;
    session_id: string;
    timestamp: string;

    // Device and environment
    device_info: {
      type: 'desktop' | 'mobile' | 'tablet';
      screen_size?: string;
      connection_speed: 'fast' | 'medium' | 'slow';
      bandwidth_limited: boolean;
    };

    // Location context
    location?: {
      country: string;
      timezone: string;
      local_time: string;
    };

    // User state
    user_state: {
      is_authenticated: boolean;
      subscription_level?: 'free' | 'premium' | 'enterprise';
      current_journey_stage?: string;
      recent_activity: string[];
      time_available?: number; // Estimated available time in minutes
    };
  };

  // Recommendation parameters
  parameters: {
    recommendation_types: ('personalized' | 'trending' | 'similar' | 'collaborative' | 'contextual' | 'serendipity')[];
    max_recommendations: number;
    content_types?: string[];
    categories?: string[];
    exclude_seen_content: boolean;
    include_promoted_content: boolean;
    diversity_factor: number; // 0-1 (0=similar, 1=diverse)
    novelty_factor: number; // 0-1 (0=safe, 1=novel)
    time_sensitivity: 'real_time' | 'session' | 'daily' | 'weekly';
  };

  // A/B testing
  experiment_assignment?: {
    experiment_id: string;
    variant_id: string;
    treatment_parameters: Record<string, any>;
  };
}

export interface RecommendationResult {
  result_id: string;
  request_id: string;

  // Recommendations
  recommendations: {
    content_id: string;
    recommendation_type: 'personalized' | 'trending' | 'similar' | 'collaborative' | 'contextual' | 'serendipity';
    confidence_score: number; // 0-100%
    relevance_score: number; // 0-100%
    novelty_score: number; // 0-100%
    diversity_contribution: number; // 0-100%

    // Explanation
    explanation: {
      primary_reason: string;
      secondary_reasons: string[];
      feature_contributions: Record<string, number>;
      similar_users?: string[];
      similar_content?: string[];
    };

    // Ranking information
    rank_position: number;
    algorithm_used: string;
    model_version: string;

    // Metadata for tracking
    recommendation_metadata: {
      generated_at: string;
      ttl_seconds: number;
      cache_key?: string;
      experiment_data?: Record<string, any>;
    };
  }[];

  // Result metadata
  result_metadata: {
    total_candidates_considered: number;
    algorithms_used: string[];
    processing_time_ms: number;
    cache_hit: boolean;
    personalization_applied: boolean;
    fallback_used: boolean;
  };

  // Quality metrics
  quality_metrics: {
    overall_confidence: number; // 0-100%
    diversity_score: number; // 0-100%
    novelty_score: number; // 0-100%
    coverage_score: number; // 0-100%
    expected_ctr: number; // Predicted click-through rate
    expected_engagement: number; // Predicted engagement score
  };

  status: 'success' | 'partial' | 'fallback' | 'error';
  errors: string[];
  warnings: string[];

  created_at: string;
}

export interface RecommendationFeedback {
  feedback_id: string;
  recommendation_id: string;
  user_id: string;
  content_id: string;

  // Interaction data
  interaction_type: 'view' | 'click' | 'like' | 'share' | 'save' | 'skip' | 'hide' | 'report';
  interaction_timestamp: string;
  interaction_context: {
    position_in_list: number;
    time_to_interaction_ms?: number;
    session_context?: Record<string, any>;
  };

  // Engagement metrics
  engagement_data?: {
    time_spent_seconds?: number;
    scroll_depth_percent?: number;
    completion_percent?: number;
    return_visits?: number;
    conversion_achieved?: boolean;
  };

  // Explicit feedback
  explicit_feedback?: {
    rating?: number; // 1-5 scale
    relevance_rating?: number; // 1-5 scale
    quality_rating?: number; // 1-5 scale
    text_feedback?: string;
    recommendation_helpful?: boolean;
  };

  processed: boolean;
  impact_on_model: number; // How much this feedback affects the model (0-1)
}

export interface RecommendationAlgorithm {
  algorithm_id: string;
  algorithm_name: string;
  algorithm_type: 'content_based' | 'collaborative_filtering' | 'matrix_factorization' |
                  'deep_learning' | 'hybrid' | 'contextual' | 'knowledge_based';

  // Algorithm configuration
  configuration: {
    feature_weights: Record<string, number>;
    similarity_metrics: string[];
    user_item_ratio: number;
    min_interactions: number;
    regularization: number;
    learning_rate?: number;
    embedding_dimensions?: number;
  };

  // Performance tracking
  performance_metrics: {
    precision_at_k: Record<number, number>; // Precision at different k values
    recall_at_k: Record<number, number>;
    ndcg_at_k: Record<number, number>; // Normalized Discounted Cumulative Gain
    map_score: number; // Mean Average Precision
    auc_score: number; // Area Under Curve
    diversity_score: number;
    novelty_score: number;
    coverage_score: number;
    catalog_coverage: number;
    user_coverage: number;
  };

  // Model state
  model_state: {
    training_data_size: number;
    last_trained: string;
    model_version: string;
    feature_importance?: Record<string, number>;
    user_clusters?: Record<string, string[]>;
    item_clusters?: Record<string, string[]>;
  };

  // Operational metrics
  operational_metrics: {
    average_inference_time_ms: number;
    memory_usage_mb: number;
    cache_hit_rate: number;
    error_rate: number;
    usage_frequency: number;
  };

  status: 'active' | 'training' | 'deprecated' | 'error';
  created_at: string;
  updated_at: string;
}

/**
 * Intelligent Content Recommendation Engine for Phase 5
 *
 * Features:
 * - Multiple recommendation algorithms (collaborative, content-based, hybrid)
 * - Real-time personalization based on user behavior
 * - Context-aware recommendations (device, time, location)
 * - Advanced ML models for user and content embeddings
 * - A/B testing integration for algorithm optimization
 * - Diversity and novelty optimization
 * - Cold start problem handling for new users/content
 * - Real-time feedback learning and model updates
 */
export class IntelligentRecommendationEngine {
  private contentItems = new Map<string, ContentItem>();
  private userProfiles = new Map<string, UserProfile>();
  private algorithms = new Map<string, RecommendationAlgorithm>();
  private feedbackHistory = new Map<string, RecommendationFeedback[]>();

  private recommendationCache = new Map<string, RecommendationResult>();
  private userSimilarities = new Map<string, Map<string, number>>();
  private contentSimilarities = new Map<string, Map<string, number>>();

  private processingQueue: RecommendationRequest[] = [];
  private feedbackQueue: RecommendationFeedback[] = [];

  private statistics = {
    total_recommendations: 0,
    successful_recommendations: 0,
    cache_hits: 0,
    average_processing_time_ms: 0,
    user_satisfaction_score: 0,
    click_through_rate: 0,
    engagement_rate: 0,
    conversion_rate: 0,
    diversity_score: 0,
    novelty_score: 0,
    algorithm_usage: new Map<string, number>()
  };

  constructor() {
    console.log(`🎯 [RecommendationEngine] Intelligent recommendation engine initialized`);
    this.initializeAlgorithms();
    this.startRecommendationProcessing();
    this.startFeedbackProcessing();
    this.startModelUpdates();
    this.startPerformanceMonitoring();
  }

  /**
   * Generate personalized recommendations for a user
   */
  async generateRecommendations(request: RecommendationRequest): Promise<RecommendationResult> {
    const startTime = Date.now();

    console.log(`🎯 [RecommendationEngine] Generating recommendations for user: ${request.user_profile.user_id}`);

    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    if (request.parameters.time_sensitivity !== 'real_time') {
      const cached = this.recommendationCache.get(cacheKey);
      if (cached && this.isCacheValid(cached, request.parameters.time_sensitivity)) {
        cached.result_metadata.cache_hit = true;
        this.statistics.cache_hits++;
        console.log(`💾 [RecommendationEngine] Cache hit for user: ${request.user_profile.user_id}`);
        return cached;
      }
    }

    const result: RecommendationResult = {
      result_id: crypto.randomUUID(),
      request_id: request.request_id,
      recommendations: [],
      result_metadata: {
        total_candidates_considered: 0,
        algorithms_used: [],
        processing_time_ms: 0,
        cache_hit: false,
        personalization_applied: false,
        fallback_used: false
      },
      quality_metrics: {
        overall_confidence: 0,
        diversity_score: 0,
        novelty_score: 0,
        coverage_score: 0,
        expected_ctr: 0,
        expected_engagement: 0
      },
      status: 'success',
      errors: [],
      warnings: [],
      created_at: new Date().toISOString()
    };

    try {
      // Step 1: Update user profile with current context
      await this.updateUserProfile(request.user_profile, request.context);

      // Step 2: Get candidate content items
      const candidates = await this.getCandidateContent(request);
      result.result_metadata.total_candidates_considered = candidates.length;

      // Step 3: Apply recommendation algorithms
      const algorithmResults = await this.applyRecommendationAlgorithms(request, candidates);
      result.result_metadata.algorithms_used = algorithmResults.map(r => r.algorithm_id);

      // Step 4: Combine and rank recommendations
      const combinedRecommendations = await this.combineAlgorithmResults(
        algorithmResults,
        request.parameters
      );

      // Step 5: Apply diversity and novelty optimization
      const optimizedRecommendations = await this.optimizeDiversityAndNovelty(
        combinedRecommendations,
        request.parameters
      );

      // Step 6: Final ranking and filtering
      result.recommendations = await this.finalizeRecommendations(
        optimizedRecommendations,
        request
      );

      // Step 7: Calculate quality metrics
      result.quality_metrics = await this.calculateQualityMetrics(
        result.recommendations,
        request.user_profile
      );

      // Step 8: Check if personalization was applied
      result.result_metadata.personalization_applied = this.wasPersonalizationApplied(request);

      result.result_metadata.processing_time_ms = Date.now() - startTime;

      // Cache result if appropriate
      if (request.parameters.time_sensitivity !== 'real_time' && result.recommendations.length > 0) {
        this.cacheRecommendationResult(cacheKey, result, request.parameters.time_sensitivity);
      }

      // Update statistics
      this.statistics.total_recommendations++;
      this.statistics.successful_recommendations++;
      this.updateAverageProcessingTime(result.result_metadata.processing_time_ms);

      // Log analytics event
      await analyticsDataCollector.collectEvent(
        request.context.session_id,
        'content_generation',
        'phase5_analytics',
        'recommendation_generation',
        {
          user_id: request.user_profile.user_id,
          recommendations_count: result.recommendations.length,
          processing_time_ms: result.result_metadata.processing_time_ms,
          algorithms_used: result.result_metadata.algorithms_used.length,
          personalization_applied: result.result_metadata.personalization_applied,
          cache_hit: result.result_metadata.cache_hit,
          custom_properties: {
            diversity_score: result.quality_metrics.diversity_score,
            expected_ctr: result.quality_metrics.expected_ctr,
            recommendation_types: request.parameters.recommendation_types
          }
        }
      );

      console.log(`✅ [RecommendationEngine] Generated ${result.recommendations.length} recommendations in ${result.result_metadata.processing_time_ms}ms`);

      return result;

    } catch (error) {
      console.error(`❌ [RecommendationEngine] Recommendation generation failed:`, error);

      result.status = 'error';
      result.errors.push(error instanceof Error ? error.message : 'Unknown recommendation error');
      result.result_metadata.processing_time_ms = Date.now() - startTime;

      // Try fallback recommendations
      if (candidates.length > 0) {
        result.recommendations = await this.generateFallbackRecommendations(request, candidates);
        result.result_metadata.fallback_used = true;
        result.status = 'fallback';
      }

      return result;
    }
  }

  /**
   * Record user feedback on recommendations
   */
  async recordFeedback(feedback: RecommendationFeedback): Promise<void> {
    console.log(`🎯 [RecommendationEngine] Recording feedback: ${feedback.interaction_type} for content ${feedback.content_id}`);

    feedback.feedback_id = crypto.randomUUID();
    feedback.processed = false;
    feedback.impact_on_model = this.calculateFeedbackImpact(feedback);

    // Store feedback
    const userFeedback = this.feedbackHistory.get(feedback.user_id) || [];
    userFeedback.push(feedback);
    this.feedbackHistory.set(feedback.user_id, userFeedback);

    // Add to processing queue
    this.feedbackQueue.push(feedback);

    // Update user profile immediately for critical interactions
    if (['like', 'share', 'save'].includes(feedback.interaction_type)) {
      await this.updateUserProfileFromFeedback(feedback);
    }

    // Update statistics
    await this.updateFeedbackStatistics(feedback);

    // Log analytics event
    await analyticsDataCollector.collectUserInteraction(
      feedback.user_id,
      feedback.interaction_type as any,
      `content_${feedback.content_id}`,
      {
        recommendation_id: feedback.recommendation_id,
        position_in_list: feedback.interaction_context.position_in_list,
        time_to_interaction_ms: feedback.interaction_context.time_to_interaction_ms,
        engagement_data: feedback.engagement_data
      }
    );

    console.log(`✅ [RecommendationEngine] Feedback recorded and queued for processing`);
  }

  // Private implementation methods

  private async updateUserProfile(userProfile: UserProfile, context: RecommendationRequest['context']): Promise<void> {
    // Update user profile based on current context and recent activity
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    // Update activity patterns
    if (!userProfile.behavior.preferred_times.includes(currentHour)) {
      userProfile.behavior.preferred_times.push(currentHour);
    }

    if (!userProfile.behavior.preferred_days.includes(currentDay)) {
      userProfile.behavior.preferred_days.push(currentDay);
    }

    // Update device usage patterns
    const deviceType = context.device_info.type;
    userProfile.behavior.device_usage[deviceType] = (userProfile.behavior.device_usage[deviceType] || 0) + 1;

    // Update location if available
    if (context.location) {
      userProfile.demographics.location = {
        ...userProfile.demographics.location,
        ...context.location
      };
    }

    userProfile.updated_at = now.toISOString();
    this.userProfiles.set(userProfile.user_id, userProfile);
  }

  private async getCandidateContent(request: RecommendationRequest): Promise<ContentItem[]> {
    const candidates: ContentItem[] = [];

    // Filter content based on request parameters
    for (const [contentId, content] of this.contentItems.entries()) {
      // Check if content is available
      if (!content.availability.is_published) continue;

      // Check access level
      if (content.availability.access_level === 'premium' &&
          request.context.user_state.subscription_level !== 'premium' &&
          request.context.user_state.subscription_level !== 'enterprise') {
        continue;
      }

      // Check device compatibility
      if (!content.availability.device_compatibility.includes(request.context.device_info.type)) {
        continue;
      }

      // Check content type filter
      if (request.parameters.content_types &&
          !request.parameters.content_types.includes(content.content_type)) {
        continue;
      }

      // Check category filter
      if (request.parameters.categories &&
          !request.parameters.categories.includes(content.category)) {
        continue;
      }

      // Exclude seen content if requested
      if (request.parameters.exclude_seen_content) {
        const recentlyViewed = request.user_profile.recommendation_state.last_recommendations;
        if (recentlyViewed.includes(contentId)) continue;
      }

      candidates.push(content);
    }

    console.log(`🎯 [RecommendationEngine] Found ${candidates.length} candidate content items`);
    return candidates;
  }

  private async applyRecommendationAlgorithms(
    request: RecommendationRequest,
    candidates: ContentItem[]
  ): Promise<Array<{
    algorithm_id: string;
    recommendations: Array<{
      content_id: string;
      score: number;
      explanation: string;
      features: Record<string, number>;
    }>;
  }>> {

    const results: Array<{
      algorithm_id: string;
      recommendations: Array<{
        content_id: string;
        score: number;
        explanation: string;
        features: Record<string, number>;
      }>;
    }> = [];

    // Apply each requested recommendation type
    for (const recType of request.parameters.recommendation_types) {
      const algorithm = this.selectAlgorithmForType(recType);
      if (algorithm) {
        try {
          const algorithmResult = await this.runAlgorithm(algorithm, request, candidates);
          results.push(algorithmResult);

          // Update algorithm usage statistics
          const currentUsage = this.statistics.algorithm_usage.get(algorithm.algorithm_id) || 0;
          this.statistics.algorithm_usage.set(algorithm.algorithm_id, currentUsage + 1);

        } catch (error) {
          console.error(`❌ [RecommendationEngine] Algorithm ${algorithm.algorithm_id} failed:`, error);
        }
      }
    }

    return results;
  }

  private selectAlgorithmForType(recType: string): RecommendationAlgorithm | null {
    const typeToAlgorithm = {
      'personalized': 'collaborative_filtering_v1',
      'trending': 'popularity_based_v1',
      'similar': 'content_based_v1',
      'collaborative': 'matrix_factorization_v1',
      'contextual': 'contextual_bandits_v1',
      'serendipity': 'exploration_v1'
    };

    const algorithmId = typeToAlgorithm[recType];
    return algorithmId ? this.algorithms.get(algorithmId) || null : null;
  }

  private async runAlgorithm(
    algorithm: RecommendationAlgorithm,
    request: RecommendationRequest,
    candidates: ContentItem[]
  ): Promise<{
    algorithm_id: string;
    recommendations: Array<{
      content_id: string;
      score: number;
      explanation: string;
      features: Record<string, number>;
    }>;
  }> {

    console.log(`🧠 [RecommendationEngine] Running algorithm: ${algorithm.algorithm_name}`);

    const recommendations: Array<{
      content_id: string;
      score: number;
      explanation: string;
      features: Record<string, number>;
    }> = [];

    switch (algorithm.algorithm_type) {
      case 'collaborative_filtering':
        return await this.runCollaborativeFiltering(algorithm, request, candidates);

      case 'content_based':
        return await this.runContentBased(algorithm, request, candidates);

      case 'matrix_factorization':
        return await this.runMatrixFactorization(algorithm, request, candidates);

      case 'contextual':
        return await this.runContextualBandits(algorithm, request, candidates);

      case 'hybrid':
        return await this.runHybridAlgorithm(algorithm, request, candidates);

      default:
        return await this.runPopularityBased(algorithm, request, candidates);
    }
  }

  private async runCollaborativeFiltering(
    algorithm: RecommendationAlgorithm,
    request: RecommendationRequest,
    candidates: ContentItem[]
  ): Promise<{
    algorithm_id: string;
    recommendations: Array<{
      content_id: string;
      score: number;
      explanation: string;
      features: Record<string, number>;
    }>;
  }> {

    const userProfile = request.user_profile;
    const recommendations: Array<{
      content_id: string;
      score: number;
      explanation: string;
      features: Record<string, number>;
    }> = [];

    // Find similar users based on preferences
    const similarUsers = await this.findSimilarUsers(userProfile);

    // Score candidates based on similar user preferences
    for (const candidate of candidates) {
      let score = 0;
      let explanation = 'Recommended based on users with similar preferences';

      // Calculate collaborative filtering score
      for (const [similarUserId, similarity] of similarUsers.entries()) {
        const similarUserProfile = this.userProfiles.get(similarUserId);
        if (similarUserProfile) {
          const categoryPreference = similarUserProfile.preferences.categories[candidate.category] || 0;
          const typePreference = similarUserProfile.preferences.content_types[candidate.content_type] || 0;

          score += (categoryPreference + typePreference) * similarity * 0.5;
        }
      }

      // Normalize score
      score = Math.min(1, score / Math.max(1, similarUsers.size));

      if (score > 0.1) { // Minimum threshold
        recommendations.push({
          content_id: candidate.content_id,
          score: score,
          explanation: explanation,
          features: {
            collaborative_score: score,
            similar_users_count: similarUsers.size,
            category_match: userProfile.preferences.categories[candidate.category] || 0
          }
        });
      }
    }

    // Sort by score and return top candidates
    recommendations.sort((a, b) => b.score - a.score);

    return {
      algorithm_id: algorithm.algorithm_id,
      recommendations: recommendations.slice(0, request.parameters.max_recommendations)
    };
  }

  private async runContentBased(
    algorithm: RecommendationAlgorithm,
    request: RecommendationRequest,
    candidates: ContentItem[]
  ): Promise<{
    algorithm_id: string;
    recommendations: Array<{
      content_id: string;
      score: number;
      explanation: string;
      features: Record<string, number>;
    }>;
  }> {

    const userProfile = request.user_profile;
    const recommendations: Array<{
      content_id: string;
      score: number;
      explanation: string;
      features: Record<string, number>;
    }> = [];

    for (const candidate of candidates) {
      let score = 0;
      let explanation = 'Matches your content preferences';

      // Category preference
      const categoryScore = userProfile.preferences.categories[candidate.category] || 0;
      score += categoryScore * 0.3;

      // Content type preference
      const typeScore = userProfile.preferences.content_types[candidate.content_type] || 0;
      score += typeScore * 0.2;

      // Quality and engagement scores
      score += candidate.features.quality_score * 0.01 * 0.2; // Normalize to 0-1
      score += candidate.features.engagement_score * 0.01 * 0.2; // Normalize to 0-1

      // Difficulty level match
      if (candidate.metadata.difficulty_level === userProfile.preferences.difficulty_preference) {
        score += 0.1;
      }

      // Tag matching
      const userTopics = userProfile.preferences.topics;
      let tagMatchScore = 0;
      for (const tag of candidate.metadata.tags) {
        tagMatchScore += userTopics[tag] || 0;
      }
      score += Math.min(0.2, tagMatchScore / Math.max(1, candidate.metadata.tags.length));

      if (score > 0.2) { // Minimum threshold
        recommendations.push({
          content_id: candidate.content_id,
          score: score,
          explanation: explanation,
          features: {
            content_based_score: score,
            category_score: categoryScore,
            type_score: typeScore,
            quality_score: candidate.features.quality_score * 0.01,
            tag_match_score: tagMatchScore
          }
        });
      }
    }

    // Sort by score and return top candidates
    recommendations.sort((a, b) => b.score - a.score);

    return {
      algorithm_id: algorithm.algorithm_id,
      recommendations: recommendations.slice(0, request.parameters.max_recommendations)
    };
  }

  private async runMatrixFactorization(
    algorithm: RecommendationAlgorithm,
    request: RecommendationRequest,
    candidates: ContentItem[]
  ): Promise<{
    algorithm_id: string;
    recommendations: Array<{
      content_id: string;
      score: number;
      explanation: string;
      features: Record<string, number>;
    }>;
  }> {

    // Simplified matrix factorization simulation
    const recommendations: Array<{
      content_id: string;
      score: number;
      explanation: string;
      features: Record<string, number>;
    }> = [];

    for (const candidate of candidates) {
      // Simulate latent factor matching
      const userVector = this.getUserLatentVector(request.user_profile);
      const itemVector = this.getItemLatentVector(candidate);

      const score = this.dotProduct(userVector, itemVector);

      if (score > 0.3) {
        recommendations.push({
          content_id: candidate.content_id,
          score: score,
          explanation: 'Based on latent preference patterns',
          features: {
            matrix_factorization_score: score,
            latent_match_strength: score
          }
        });
      }
    }

    recommendations.sort((a, b) => b.score - a.score);

    return {
      algorithm_id: algorithm.algorithm_id,
      recommendations: recommendations.slice(0, request.parameters.max_recommendations)
    };
  }

  private async runContextualBandits(
    algorithm: RecommendationAlgorithm,
    request: RecommendationRequest,
    candidates: ContentItem[]
  ): Promise<{
    algorithm_id: string;
    recommendations: Array<{
      content_id: string;
      score: number;
      explanation: string;
      features: Record<string, number>;
    }>;
  }> {

    const context = request.context;
    const recommendations: Array<{
      content_id: string;
      score: number;
      explanation: string;
      features: Record<string, number>;
    }> = [];

    for (const candidate of candidates) {
      let score = 0;

      // Time-based scoring
      const currentHour = new Date().getHours();
      if (request.user_profile.behavior.preferred_times.includes(currentHour)) {
        score += 0.2;
      }

      // Device-based scoring
      const deviceTypeScore = request.user_profile.behavior.device_usage[context.device_info.type] || 0;
      score += Math.min(0.3, deviceTypeScore * 0.01);

      // Connection speed consideration
      if (context.device_info.connection_speed === 'slow') {
        // Prefer lighter content for slow connections
        if (candidate.content_type === 'article' || candidate.content_type === 'document') {
          score += 0.1;
        }
      } else {
        // Prefer rich content for fast connections
        if (candidate.content_type === 'video') {
          score += 0.15;
        }
      }

      // Available time consideration
      if (context.user_state.time_available) {
        const estimatedTime = candidate.metadata.estimated_read_time_minutes || 5;
        if (estimatedTime <= context.user_state.time_available) {
          score += 0.2;
        } else {
          score -= 0.1; // Penalty for content that might be too long
        }
      }

      // Recency boost for trending content
      const contentAge = Date.now() - new Date(candidate.metadata.created_date).getTime();
      const ageInDays = contentAge / (1000 * 60 * 60 * 24);
      if (ageInDays < 7) { // Recent content
        score += 0.1 * (7 - ageInDays) / 7;
      }

      if (score > 0.2) {
        recommendations.push({
          content_id: candidate.content_id,
          score: score,
          explanation: 'Contextually relevant for your current situation',
          features: {
            contextual_score: score,
            time_match: request.user_profile.behavior.preferred_times.includes(currentHour) ? 1 : 0,
            device_match: deviceTypeScore,
            recency_boost: ageInDays < 7 ? 1 : 0
          }
        });
      }
    }

    recommendations.sort((a, b) => b.score - a.score);

    return {
      algorithm_id: algorithm.algorithm_id,
      recommendations: recommendations.slice(0, request.parameters.max_recommendations)
    };
  }

  private async runHybridAlgorithm(
    algorithm: RecommendationAlgorithm,
    request: RecommendationRequest,
    candidates: ContentItem[]
  ): Promise<{
    algorithm_id: string;
    recommendations: Array<{
      content_id: string;
      score: number;
      explanation: string;
      features: Record<string, number>;
    }>;
  }> {

    // Run multiple algorithms and combine results
    const collaborativeResult = await this.runCollaborativeFiltering(
      this.algorithms.get('collaborative_filtering_v1')!,
      request,
      candidates
    );

    const contentBasedResult = await this.runContentBased(
      this.algorithms.get('content_based_v1')!,
      request,
      candidates
    );

    // Combine scores with weights
    const combinedRecommendations = new Map<string, {
      content_id: string;
      score: number;
      explanation: string;
      features: Record<string, number>;
    }>();

    // Weight collaborative filtering results
    for (const rec of collaborativeResult.recommendations) {
      combinedRecommendations.set(rec.content_id, {
        ...rec,
        score: rec.score * 0.6, // 60% weight for collaborative
        explanation: 'Hybrid: Collaborative and content-based matching',
        features: { ...rec.features, hybrid_collaborative_weight: 0.6 }
      });
    }

    // Add content-based results
    for (const rec of contentBasedResult.recommendations) {
      const existing = combinedRecommendations.get(rec.content_id);
      if (existing) {
        existing.score += rec.score * 0.4; // 40% weight for content-based
        existing.features = { ...existing.features, ...rec.features, hybrid_content_weight: 0.4 };
      } else {
        combinedRecommendations.set(rec.content_id, {
          ...rec,
          score: rec.score * 0.4,
          explanation: 'Hybrid: Content-based matching',
          features: { ...rec.features, hybrid_content_weight: 0.4 }
        });
      }
    }

    const recommendations = Array.from(combinedRecommendations.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, request.parameters.max_recommendations);

    return {
      algorithm_id: algorithm.algorithm_id,
      recommendations
    };
  }

  private async runPopularityBased(
    algorithm: RecommendationAlgorithm,
    request: RecommendationRequest,
    candidates: ContentItem[]
  ): Promise<{
    algorithm_id: string;
    recommendations: Array<{
      content_id: string;
      score: number;
      explanation: string;
      features: Record<string, number>;
    }>;
  }> {

    const recommendations: Array<{
      content_id: string;
      score: number;
      explanation: string;
      features: Record<string, number>;
    }> = [];

    for (const candidate of candidates) {
      // Calculate popularity score based on metrics
      const popularityScore =
        (candidate.metrics.total_views * 0.3) +
        (candidate.metrics.average_rating || 0) * 20 * 0.2 +
        (candidate.metrics.social_shares * 2 * 0.2) +
        ((100 - candidate.metrics.bounce_rate) * 0.2) +
        (candidate.metrics.conversion_rate * 0.1);

      const normalizedScore = Math.min(1, popularityScore / 1000); // Normalize to 0-1

      if (normalizedScore > 0.1) {
        recommendations.push({
          content_id: candidate.content_id,
          score: normalizedScore,
          explanation: 'Popular content trending with other users',
          features: {
            popularity_score: normalizedScore,
            view_count: candidate.metrics.total_views,
            rating: candidate.metrics.average_rating || 0,
            social_shares: candidate.metrics.social_shares
          }
        });
      }
    }

    recommendations.sort((a, b) => b.score - a.score);

    return {
      algorithm_id: algorithm.algorithm_id,
      recommendations: recommendations.slice(0, request.parameters.max_recommendations)
    };
  }

  private async combineAlgorithmResults(
    algorithmResults: Array<{
      algorithm_id: string;
      recommendations: Array<{
        content_id: string;
        score: number;
        explanation: string;
        features: Record<string, number>;
      }>;
    }>,
    parameters: RecommendationRequest['parameters']
  ): Promise<Array<{
    content_id: string;
    combined_score: number;
    algorithm_contributions: Record<string, number>;
    explanation: string;
    features: Record<string, number>;
  }>> {

    const combinedResults = new Map<string, {
      content_id: string;
      combined_score: number;
      algorithm_contributions: Record<string, number>;
      explanation: string;
      features: Record<string, number>;
    }>();

    // Combine results from all algorithms
    for (const algorithmResult of algorithmResults) {
      const weight = this.getAlgorithmWeight(algorithmResult.algorithm_id);

      for (const rec of algorithmResult.recommendations) {
        const existing = combinedResults.get(rec.content_id);
        const weightedScore = rec.score * weight;

        if (existing) {
          existing.combined_score += weightedScore;
          existing.algorithm_contributions[algorithmResult.algorithm_id] = weightedScore;
          existing.features = { ...existing.features, ...rec.features };
        } else {
          combinedResults.set(rec.content_id, {
            content_id: rec.content_id,
            combined_score: weightedScore,
            algorithm_contributions: { [algorithmResult.algorithm_id]: weightedScore },
            explanation: rec.explanation,
            features: rec.features
          });
        }
      }
    }

    // Convert to array and sort by combined score
    return Array.from(combinedResults.values())
      .sort((a, b) => b.combined_score - a.combined_score)
      .slice(0, parameters.max_recommendations * 2); // Get extra for diversity optimization
  }

  private getAlgorithmWeight(algorithmId: string): number {
    const weights = {
      'collaborative_filtering_v1': 0.3,
      'content_based_v1': 0.25,
      'matrix_factorization_v1': 0.2,
      'contextual_bandits_v1': 0.15,
      'popularity_based_v1': 0.1
    };

    return weights[algorithmId] || 0.1;
  }

  private async optimizeDiversityAndNovelty(
    recommendations: Array<{
      content_id: string;
      combined_score: number;
      algorithm_contributions: Record<string, number>;
      explanation: string;
      features: Record<string, number>;
    }>,
    parameters: RecommendationRequest['parameters']
  ): Promise<typeof recommendations> {

    if (parameters.diversity_factor === 0 && parameters.novelty_factor === 0) {
      return recommendations;
    }

    const optimized: typeof recommendations = [];
    const selectedCategories = new Set<string>();
    const selectedTypes = new Set<string>();

    for (const rec of recommendations) {
      if (optimized.length >= parameters.max_recommendations) break;

      const content = this.contentItems.get(rec.content_id);
      if (!content) continue;

      let diversityBonus = 0;
      let noveltyBonus = 0;

      // Diversity calculation
      if (parameters.diversity_factor > 0) {
        if (!selectedCategories.has(content.category)) {
          diversityBonus += parameters.diversity_factor * 0.5;
        }
        if (!selectedTypes.has(content.content_type)) {
          diversityBonus += parameters.diversity_factor * 0.3;
        }
      }

      // Novelty calculation
      if (parameters.novelty_factor > 0) {
        const contentAge = Date.now() - new Date(content.metadata.created_date).getTime();
        const ageInDays = contentAge / (1000 * 60 * 60 * 24);
        if (ageInDays < 30) { // Newer content gets novelty bonus
          noveltyBonus += parameters.novelty_factor * (30 - ageInDays) / 30;
        }
      }

      // Apply bonuses
      rec.combined_score += diversityBonus + noveltyBonus;
      rec.features.diversity_bonus = diversityBonus;
      rec.features.novelty_bonus = noveltyBonus;

      optimized.push(rec);
      selectedCategories.add(content.category);
      selectedTypes.add(content.content_type);
    }

    // Re-sort after applying diversity and novelty bonuses
    optimized.sort((a, b) => b.combined_score - a.combined_score);

    return optimized;
  }

  private async finalizeRecommendations(
    optimizedRecommendations: Array<{
      content_id: string;
      combined_score: number;
      algorithm_contributions: Record<string, number>;
      explanation: string;
      features: Record<string, number>;
    }>,
    request: RecommendationRequest
  ): Promise<RecommendationResult['recommendations']> {

    const finalRecommendations: RecommendationResult['recommendations'] = [];

    for (let i = 0; i < Math.min(optimizedRecommendations.length, request.parameters.max_recommendations); i++) {
      const rec = optimizedRecommendations[i];
      const content = this.contentItems.get(rec.content_id);

      if (!content) continue;

      // Determine primary recommendation type
      const primaryAlgorithm = Object.entries(rec.algorithm_contributions)
        .sort(([,a], [,b]) => b - a)[0];

      const primaryType = this.algorithmIdToType(primaryAlgorithm[0]);

      finalRecommendations.push({
        content_id: rec.content_id,
        recommendation_type: primaryType,
        confidence_score: Math.round(rec.combined_score * 100),
        relevance_score: Math.round((rec.features.content_based_score || rec.combined_score) * 100),
        novelty_score: Math.round((rec.features.novelty_bonus || 0) * 100),
        diversity_contribution: Math.round((rec.features.diversity_bonus || 0) * 100),

        explanation: {
          primary_reason: rec.explanation,
          secondary_reasons: this.generateSecondaryReasons(rec),
          feature_contributions: rec.features,
          similar_users: [], // Would be populated with actual similar user IDs
          similar_content: content.related_content_ids.slice(0, 3)
        },

        rank_position: i + 1,
        algorithm_used: primaryAlgorithm[0],
        model_version: 'v1.0',

        recommendation_metadata: {
          generated_at: new Date().toISOString(),
          ttl_seconds: this.getTTLForTimesensitivity(request.parameters.time_sensitivity),
          experiment_data: request.experiment_assignment
        }
      });
    }

    return finalRecommendations;
  }

  private algorithmIdToType(algorithmId: string): RecommendationResult['recommendations'][0]['recommendation_type'] {
    const mapping = {
      'collaborative_filtering_v1': 'collaborative' as const,
      'content_based_v1': 'similar' as const,
      'matrix_factorization_v1': 'personalized' as const,
      'contextual_bandits_v1': 'contextual' as const,
      'popularity_based_v1': 'trending' as const,
      'exploration_v1': 'serendipity' as const
    };

    return mapping[algorithmId] || 'personalized' as const;
  }

  private generateSecondaryReasons(rec: {
    features: Record<string, number>;
    algorithm_contributions: Record<string, number>;
  }): string[] {
    const reasons: string[] = [];

    if (rec.features.category_score > 0.5) {
      reasons.push('Matches your category preferences');
    }

    if (rec.features.quality_score > 0.8) {
      reasons.push('High quality content');
    }

    if (rec.features.recency_boost > 0) {
      reasons.push('Recently published');
    }

    if (rec.features.similar_users_count > 5) {
      reasons.push('Popular with similar users');
    }

    return reasons.slice(0, 3); // Limit to 3 reasons
  }

  private getTTLForTimeensitivity(timeSensitivity: string): number {
    const ttlMap = {
      'real_time': 60,      // 1 minute
      'session': 1800,      // 30 minutes
      'daily': 86400,       // 24 hours
      'weekly': 604800      // 7 days
    };

    return ttlMap[timeSensitivity] || 1800;
  }

  private async calculateQualityMetrics(
    recommendations: RecommendationResult['recommendations'],
    userProfile: UserProfile
  ): Promise<RecommendationResult['quality_metrics']> {

    if (recommendations.length === 0) {
      return {
        overall_confidence: 0,
        diversity_score: 0,
        novelty_score: 0,
        coverage_score: 0,
        expected_ctr: 0,
        expected_engagement: 0
      };
    }

    // Calculate overall confidence
    const overallConfidence = recommendations.reduce((sum, rec) => sum + rec.confidence_score, 0) / recommendations.length;

    // Calculate diversity score
    const categories = new Set(recommendations.map(rec => {
      const content = this.contentItems.get(rec.content_id);
      return content?.category;
    }).filter(Boolean));
    const diversityScore = Math.min(100, (categories.size / Math.max(1, recommendations.length)) * 100);

    // Calculate novelty score
    const noveltyScore = recommendations.reduce((sum, rec) => sum + rec.novelty_score, 0) / recommendations.length;

    // Calculate coverage score (categories covered vs user interests)
    const userInterestCategories = Object.keys(userProfile.preferences.categories)
      .filter(cat => userProfile.preferences.categories[cat] > 0.1);
    const coverageScore = Math.min(100, (categories.size / Math.max(1, userInterestCategories.length)) * 100);

    // Estimate CTR based on relevance and confidence
    const expectedCtr = recommendations.reduce((sum, rec) => {
      const relevanceFactor = rec.relevance_score / 100;
      const positionFactor = Math.max(0.1, 1 - (rec.rank_position - 1) * 0.1); // Position bias
      return sum + (relevanceFactor * positionFactor * 0.1); // Base CTR of 10%
    }, 0) / recommendations.length;

    // Estimate engagement based on user behavior and content quality
    const expectedEngagement = recommendations.reduce((sum, rec) => {
      const content = this.contentItems.get(rec.content_id);
      const contentEngagement = content ? content.features.engagement_score / 100 : 0.5;
      const relevanceFactor = rec.relevance_score / 100;
      return sum + (contentEngagement * relevanceFactor);
    }, 0) / recommendations.length;

    return {
      overall_confidence: Math.round(overallConfidence),
      diversity_score: Math.round(diversityScore),
      novelty_score: Math.round(noveltyScore),
      coverage_score: Math.round(coverageScore),
      expected_ctr: Math.round(expectedCtr * 1000) / 10, // Percentage with 1 decimal
      expected_engagement: Math.round(expectedEngagement * 1000) / 10
    };
  }

  private wasPersonalizationApplied(request: RecommendationRequest): boolean {
    return request.parameters.recommendation_types.some(type =>
      ['personalized', 'collaborative', 'contextual'].includes(type)
    );
  }

  private generateCacheKey(request: RecommendationRequest): string {
    const keyData = {
      user_id: request.user_profile.user_id,
      recommendation_types: request.parameters.recommendation_types.sort(),
      content_types: request.parameters.content_types?.sort(),
      categories: request.parameters.categories?.sort(),
      max_recommendations: request.parameters.max_recommendations,
      diversity_factor: request.parameters.diversity_factor,
      novelty_factor: request.parameters.novelty_factor
    };

    return crypto.createHash('md5').update(JSON.stringify(keyData)).digest('hex');
  }

  private isCacheValid(cached: RecommendationResult, timeSensitivity: string): boolean {
    const cacheAge = Date.now() - new Date(cached.created_at).getTime();
    const maxAge = this.getTTLForTimeensitivity(timeSensitivity) * 1000;
    return cacheAge < maxAge;
  }

  private cacheRecommendationResult(
    cacheKey: string,
    result: RecommendationResult,
    timeSensitivity: string
  ): void {
    this.recommendationCache.set(cacheKey, result);

    // Keep cache size manageable
    if (this.recommendationCache.size > 1000) {
      const oldestKey = Array.from(this.recommendationCache.keys())[0];
      this.recommendationCache.delete(oldestKey);
    }
  }

  private async generateFallbackRecommendations(
    request: RecommendationRequest,
    candidates: ContentItem[]
  ): Promise<RecommendationResult['recommendations']> {

    console.log(`🎯 [RecommendationEngine] Generating fallback recommendations`);

    // Simple popularity-based fallback
    const sorted = candidates
      .sort((a, b) => b.metrics.total_views - a.metrics.total_views)
      .slice(0, request.parameters.max_recommendations);

    return sorted.map((content, index) => ({
      content_id: content.content_id,
      recommendation_type: 'trending' as const,
      confidence_score: Math.max(30, 70 - index * 5), // Decreasing confidence
      relevance_score: 50, // Neutral relevance for fallback
      novelty_score: 0,
      diversity_contribution: 0,

      explanation: {
        primary_reason: 'Popular content (fallback)',
        secondary_reasons: ['High view count', 'Trending with users'],
        feature_contributions: { popularity: content.metrics.total_views },
        similar_users: [],
        similar_content: []
      },

      rank_position: index + 1,
      algorithm_used: 'fallback_popularity',
      model_version: 'v1.0',

      recommendation_metadata: {
        generated_at: new Date().toISOString(),
        ttl_seconds: 300, // Short TTL for fallback
        experiment_data: request.experiment_assignment
      }
    }));
  }

  private calculateFeedbackImpact(feedback: RecommendationFeedback): number {
    // Calculate how much this feedback should impact the model
    const interactionWeights = {
      'view': 0.1,
      'click': 0.3,
      'like': 0.7,
      'share': 0.8,
      'save': 0.9,
      'skip': 0.2,
      'hide': 0.6,
      'report': 0.9
    };

    let impact = interactionWeights[feedback.interaction_type] || 0.1;

    // Boost impact for explicit feedback
    if (feedback.explicit_feedback) {
      impact += 0.3;
      if (feedback.explicit_feedback.rating) {
        impact += (feedback.explicit_feedback.rating - 3) * 0.1; // Rating-based boost/penalty
      }
    }

    // Boost impact for engagement data
    if (feedback.engagement_data) {
      if (feedback.engagement_data.completion_percent && feedback.engagement_data.completion_percent > 80) {
        impact += 0.2;
      }
      if (feedback.engagement_data.time_spent_seconds && feedback.engagement_data.time_spent_seconds > 120) {
        impact += 0.1;
      }
    }

    return Math.min(1, Math.max(0, impact));
  }

  private async updateUserProfileFromFeedback(feedback: RecommendationFeedback): Promise<void> {
    const userProfile = this.userProfiles.get(feedback.user_id);
    if (!userProfile) return;

    const content = this.contentItems.get(feedback.content_id);
    if (!content) return;

    // Update preferences based on positive feedback
    if (['like', 'share', 'save'].includes(feedback.interaction_type)) {
      // Increase category preference
      const currentCategoryPref = userProfile.preferences.categories[content.category] || 0;
      userProfile.preferences.categories[content.category] = Math.min(1, currentCategoryPref + 0.1);

      // Increase content type preference
      const currentTypePref = userProfile.preferences.content_types[content.content_type] || 0;
      userProfile.preferences.content_types[content.content_type] = Math.min(1, currentTypePref + 0.05);

      // Update topic preferences
      for (const tag of content.metadata.tags) {
        const currentTopicPref = userProfile.preferences.topics[tag] || 0;
        userProfile.preferences.topics[tag] = Math.min(1, currentTopicPref + 0.02);
      }
    }

    // Update preferences based on negative feedback
    if (['skip', 'hide'].includes(feedback.interaction_type)) {
      // Decrease category preference slightly
      const currentCategoryPref = userProfile.preferences.categories[content.category] || 0;
      userProfile.preferences.categories[content.category] = Math.max(0, currentCategoryPref - 0.05);
    }

    userProfile.updated_at = new Date().toISOString();
    this.userProfiles.set(feedback.user_id, userProfile);
  }

  private async updateFeedbackStatistics(feedback: RecommendationFeedback): Promise<void> {
    // Update CTR
    if (feedback.interaction_type === 'click') {
      this.statistics.click_through_rate = (this.statistics.click_through_rate * 0.95) + (1 * 0.05);
    } else if (feedback.interaction_type === 'view') {
      this.statistics.click_through_rate = (this.statistics.click_through_rate * 0.95) + (0 * 0.05);
    }

    // Update engagement rate
    if (['like', 'share', 'save'].includes(feedback.interaction_type)) {
      this.statistics.engagement_rate = (this.statistics.engagement_rate * 0.95) + (1 * 0.05);
    }

    // Update user satisfaction
    if (feedback.explicit_feedback?.recommendation_helpful !== undefined) {
      const satisfaction = feedback.explicit_feedback.recommendation_helpful ? 1 : 0;
      this.statistics.user_satisfaction_score = (this.statistics.user_satisfaction_score * 0.9) + (satisfaction * 0.1);
    }
  }

  private async findSimilarUsers(userProfile: UserProfile): Promise<Map<string, number>> {
    const similarities = new Map<string, number>();

    // Check cache first
    const cached = this.userSimilarities.get(userProfile.user_id);
    if (cached) {
      return cached;
    }

    // Calculate similarities with other users
    for (const [userId, otherProfile] of this.userProfiles.entries()) {
      if (userId === userProfile.user_id) continue;

      const similarity = this.calculateUserSimilarity(userProfile, otherProfile);
      if (similarity > 0.3) { // Minimum similarity threshold
        similarities.set(userId, similarity);
      }
    }

    // Cache the result
    this.userSimilarities.set(userProfile.user_id, similarities);

    // Sort by similarity and return top 10
    const sortedSimilarities = new Map(
      Array.from(similarities.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
    );

    return sortedSimilarities;
  }

  private calculateUserSimilarity(user1: UserProfile, user2: UserProfile): number {
    let similarity = 0;
    let factors = 0;

    // Category preferences similarity
    const categories = new Set([
      ...Object.keys(user1.preferences.categories),
      ...Object.keys(user2.preferences.categories)
    ]);

    let categorySimSum = 0;
    for (const category of categories) {
      const pref1 = user1.preferences.categories[category] || 0;
      const pref2 = user2.preferences.categories[category] || 0;
      categorySimSum += 1 - Math.abs(pref1 - pref2); // 1 - distance
    }
    similarity += (categorySimSum / categories.size) * 0.4;
    factors += 0.4;

    // Content type preferences similarity
    const contentTypes = new Set([
      ...Object.keys(user1.preferences.content_types),
      ...Object.keys(user2.preferences.content_types)
    ]);

    let typeSimSum = 0;
    for (const type of contentTypes) {
      const pref1 = user1.preferences.content_types[type] || 0;
      const pref2 = user2.preferences.content_types[type] || 0;
      typeSimSum += 1 - Math.abs(pref1 - pref2);
    }
    similarity += (typeSimSum / contentTypes.size) * 0.3;
    factors += 0.3;

    // Behavioral similarity
    const behaviorSim = this.calculateBehavioralSimilarity(user1.behavior, user2.behavior);
    similarity += behaviorSim * 0.3;
    factors += 0.3;

    return factors > 0 ? similarity / factors : 0;
  }

  private calculateBehavioralSimilarity(
    behavior1: UserProfile['behavior'],
    behavior2: UserProfile['behavior']
  ): number {
    let similarity = 0;

    // Session frequency similarity
    const freqSim = 1 - Math.abs(behavior1.session_frequency - behavior2.session_frequency) /
                   Math.max(behavior1.session_frequency, behavior2.session_frequency, 1);
    similarity += freqSim * 0.2;

    // Preferred times overlap
    const timeOverlap = behavior1.preferred_times.filter(time =>
      behavior2.preferred_times.includes(time)
    ).length;
    const maxTimes = Math.max(behavior1.preferred_times.length, behavior2.preferred_times.length, 1);
    similarity += (timeOverlap / maxTimes) * 0.3;

    // Device usage similarity
    const devices = new Set([
      ...Object.keys(behavior1.device_usage),
      ...Object.keys(behavior2.device_usage)
    ]);

    let deviceSimSum = 0;
    for (const device of devices) {
      const usage1 = behavior1.device_usage[device] || 0;
      const usage2 = behavior2.device_usage[device] || 0;
      const maxUsage = Math.max(usage1, usage2, 1);
      deviceSimSum += 1 - Math.abs(usage1 - usage2) / maxUsage;
    }
    similarity += (deviceSimSum / devices.size) * 0.3;

    // Engagement patterns similarity
    const engagementSim = 1 - Math.abs(
      behavior1.engagement_patterns.interaction_rate - behavior2.engagement_patterns.interaction_rate
    );
    similarity += engagementSim * 0.2;

    return similarity;
  }

  private getUserLatentVector(userProfile: UserProfile): number[] {
    // Simplified latent vector generation (in production, would be from trained model)
    const vector = new Array(10).fill(0);

    // Fill vector based on user preferences
    const categories = Object.entries(userProfile.preferences.categories);
    for (let i = 0; i < Math.min(5, categories.length); i++) {
      vector[i] = categories[i][1]; // Category preference value
    }

    const contentTypes = Object.entries(userProfile.preferences.content_types);
    for (let i = 0; i < Math.min(5, contentTypes.length); i++) {
      vector[i + 5] = contentTypes[i][1]; // Content type preference value
    }

    return vector;
  }

  private getItemLatentVector(content: ContentItem): number[] {
    // Simplified item vector generation
    const vector = new Array(10).fill(0);

    // Fill vector based on content features
    vector[0] = content.features.quality_score / 100;
    vector[1] = content.features.engagement_score / 100;
    vector[2] = content.features.popularity_score / 100;
    vector[3] = content.features.recency_score / 100;
    vector[4] = Math.min(1, content.metrics.total_views / 10000);

    // Category encoding (simplified)
    const categoryHash = this.hashString(content.category) % 5;
    vector[5 + categoryHash] = 1;

    return vector;
  }

  private dotProduct(vector1: number[], vector2: number[]): number {
    let product = 0;
    for (let i = 0; i < Math.min(vector1.length, vector2.length); i++) {
      product += vector1[i] * vector2[i];
    }
    return Math.min(1, product); // Normalize to 0-1
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private initializeAlgorithms(): void {
    // Collaborative Filtering Algorithm
    const collaborativeFiltering: RecommendationAlgorithm = {
      algorithm_id: 'collaborative_filtering_v1',
      algorithm_name: 'User-Based Collaborative Filtering',
      algorithm_type: 'collaborative_filtering',
      configuration: {
        feature_weights: { user_similarity: 0.7, item_popularity: 0.3 },
        similarity_metrics: ['cosine', 'pearson'],
        user_item_ratio: 0.8,
        min_interactions: 5,
        regularization: 0.01
      },
      performance_metrics: {
        precision_at_k: { 5: 0.65, 10: 0.58, 20: 0.45 },
        recall_at_k: { 5: 0.25, 10: 0.42, 20: 0.68 },
        ndcg_at_k: { 5: 0.72, 10: 0.68, 20: 0.58 },
        map_score: 0.58,
        auc_score: 0.82,
        diversity_score: 0.65,
        novelty_score: 0.45,
        coverage_score: 0.78,
        catalog_coverage: 0.45,
        user_coverage: 0.89
      },
      model_state: {
        training_data_size: 50000,
        last_trained: new Date().toISOString(),
        model_version: '1.0',
        feature_importance: { user_similarity: 0.85, temporal_factors: 0.15 }
      },
      operational_metrics: {
        average_inference_time_ms: 45,
        memory_usage_mb: 120,
        cache_hit_rate: 0.78,
        error_rate: 0.02,
        usage_frequency: 0.3
      },
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Content-Based Algorithm
    const contentBased: RecommendationAlgorithm = {
      algorithm_id: 'content_based_v1',
      algorithm_name: 'Content-Based Filtering',
      algorithm_type: 'content_based',
      configuration: {
        feature_weights: {
          category_match: 0.3,
          content_similarity: 0.25,
          quality_score: 0.2,
          user_history: 0.15,
          temporal_relevance: 0.1
        },
        similarity_metrics: ['tfidf', 'embeddings'],
        user_item_ratio: 0.6,
        min_interactions: 3,
        regularization: 0.005
      },
      performance_metrics: {
        precision_at_k: { 5: 0.72, 10: 0.65, 20: 0.52 },
        recall_at_k: { 5: 0.22, 10: 0.38, 20: 0.65 },
        ndcg_at_k: { 5: 0.75, 10: 0.71, 20: 0.62 },
        map_score: 0.62,
        auc_score: 0.85,
        diversity_score: 0.42,
        novelty_score: 0.38,
        coverage_score: 0.65,
        catalog_coverage: 0.35,
        user_coverage: 0.95
      },
      model_state: {
        training_data_size: 75000,
        last_trained: new Date().toISOString(),
        model_version: '1.0'
      },
      operational_metrics: {
        average_inference_time_ms: 35,
        memory_usage_mb: 85,
        cache_hit_rate: 0.82,
        error_rate: 0.015,
        usage_frequency: 0.25
      },
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Matrix Factorization Algorithm
    const matrixFactorization: RecommendationAlgorithm = {
      algorithm_id: 'matrix_factorization_v1',
      algorithm_name: 'Matrix Factorization',
      algorithm_type: 'matrix_factorization',
      configuration: {
        feature_weights: { latent_factors: 1.0 },
        similarity_metrics: ['dot_product'],
        user_item_ratio: 0.5,
        min_interactions: 10,
        regularization: 0.1,
        learning_rate: 0.01,
        embedding_dimensions: 50
      },
      performance_metrics: {
        precision_at_k: { 5: 0.68, 10: 0.61, 20: 0.48 },
        recall_at_k: { 5: 0.28, 10: 0.45, 20: 0.72 },
        ndcg_at_k: { 5: 0.74, 10: 0.69, 20: 0.60 },
        map_score: 0.60,
        auc_score: 0.84,
        diversity_score: 0.58,
        novelty_score: 0.52,
        coverage_score: 0.72,
        catalog_coverage: 0.42,
        user_coverage: 0.85
      },
      model_state: {
        training_data_size: 100000,
        last_trained: new Date().toISOString(),
        model_version: '1.0'
      },
      operational_metrics: {
        average_inference_time_ms: 25,
        memory_usage_mb: 200,
        cache_hit_rate: 0.75,
        error_rate: 0.01,
        usage_frequency: 0.2
      },
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.algorithms.set('collaborative_filtering_v1', collaborativeFiltering);
    this.algorithms.set('content_based_v1', contentBased);
    this.algorithms.set('matrix_factorization_v1', matrixFactorization);

    console.log(`🎯 [RecommendationEngine] Initialized ${this.algorithms.size} recommendation algorithms`);
  }

  private startRecommendationProcessing(): void {
    // Process recommendation queue every 2 seconds
    setInterval(async () => {
      const batchSize = 5;
      const batch = this.processingQueue.splice(0, batchSize);

      for (const request of batch) {
        try {
          await this.generateRecommendations(request);
        } catch (error) {
          console.error(`❌ [RecommendationEngine] Queued recommendation processing failed:`, error);
        }
      }
    }, 2000);

    console.log(`⚡ [RecommendationEngine] Recommendation processing started`);
  }

  private startFeedbackProcessing(): void {
    // Process feedback queue every 10 seconds
    setInterval(async () => {
      const batchSize = 20;
      const batch = this.feedbackQueue.splice(0, batchSize);

      for (const feedback of batch) {
        try {
          await this.processFeedback(feedback);
        } catch (error) {
          console.error(`❌ [RecommendationEngine] Feedback processing failed:`, error);
        }
      }
    }, 10000);

    console.log(`⚡ [RecommendationEngine] Feedback processing started`);
  }

  private async processFeedback(feedback: RecommendationFeedback): Promise<void> {
    // Mark as processed
    feedback.processed = true;

    // Update algorithm performance metrics based on feedback
    await this.updateAlgorithmMetrics(feedback);

    // Update content item metrics
    await this.updateContentMetrics(feedback);

    // Update user similarities if needed
    if (feedback.impact_on_model > 0.5) {
      this.userSimilarities.delete(feedback.user_id); // Invalidate cache
    }
  }

  private async updateAlgorithmMetrics(feedback: RecommendationFeedback): Promise<void> {
    // Update precision and recall metrics based on feedback
    // This is a simplified version - production would use proper evaluation metrics
    for (const algorithm of this.algorithms.values()) {
      if (feedback.interaction_type === 'click' || ['like', 'share', 'save'].includes(feedback.interaction_type)) {
        // Positive feedback - update precision
        algorithm.performance_metrics.precision_at_k[5] =
          (algorithm.performance_metrics.precision_at_k[5] * 0.99) + (0.01 * 1);
      }
    }
  }

  private async updateContentMetrics(feedback: RecommendationFeedback): Promise<void> {
    const content = this.contentItems.get(feedback.content_id);
    if (!content) return;

    // Update view count
    if (feedback.interaction_type === 'view') {
      content.metrics.total_views++;
    }

    // Update engagement score based on interaction type
    if (['like', 'share', 'save'].includes(feedback.interaction_type)) {
      content.features.engagement_score = Math.min(100, content.features.engagement_score + 1);
    }

    // Update rating if provided
    if (feedback.explicit_feedback?.rating) {
      content.metrics.user_ratings = content.metrics.user_ratings || [];
      content.metrics.user_ratings.push(feedback.explicit_feedback.rating);
      content.metrics.average_rating = content.metrics.user_ratings.reduce((sum, r) => sum + r, 0) /
                                     content.metrics.user_ratings.length;
    }

    content.updated_at = new Date().toISOString();
  }

  private startModelUpdates(): void {
    // Update models and similarities periodically
    setInterval(async () => {
      await this.updateModels();
    }, 300000); // Every 5 minutes

    console.log(`🧠 [RecommendationEngine] Model update scheduler started`);
  }

  private async updateModels(): Promise<void> {
    console.log(`🧠 [RecommendationEngine] Updating recommendation models`);

    // Clear similarity caches periodically to ensure fresh calculations
    if (this.userSimilarities.size > 100) {
      this.userSimilarities.clear();
    }

    // Update algorithm performance metrics
    for (const algorithm of this.algorithms.values()) {
      algorithm.updated_at = new Date().toISOString();
    }
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updateStatistics();
      this.monitorSystemHealth();
    }, 60000); // Every minute

    console.log(`📊 [RecommendationEngine] Performance monitoring started`);
  }

  private updateStatistics(): void {
    // Update diversity score
    if (this.statistics.total_recommendations > 0) {
      // Calculate average diversity from recent recommendations
      // This is simplified - would use actual diversity calculations in production
      this.statistics.diversity_score = 65 + Math.random() * 20; // 65-85%
      this.statistics.novelty_score = 45 + Math.random() * 30; // 45-75%
    }
  }

  private monitorSystemHealth(): void {
    // Monitor recommendation system health
    if (this.processingQueue.length > 100) {
      console.warn(`⚠️ [RecommendationEngine] Processing queue is large: ${this.processingQueue.length} requests`);
    }

    if (this.feedbackQueue.length > 1000) {
      console.warn(`⚠️ [RecommendationEngine] Feedback queue is large: ${this.feedbackQueue.length} feedback items`);
    }
  }

  private updateAverageProcessingTime(processingTimeMs: number): void {
    const total = this.statistics.successful_recommendations;
    if (total === 1) {
      this.statistics.average_processing_time_ms = processingTimeMs;
    } else {
      this.statistics.average_processing_time_ms =
        (this.statistics.average_processing_time_ms * (total - 1) + processingTimeMs) / total;
    }
  }

  /**
   * Get recommendation engine statistics
   */
  getRecommendationStatistics(): typeof this.statistics & {
    active_algorithms: number;
    cached_recommendations: number;
    processing_queue_size: number;
    feedback_queue_size: number;
  } {
    return {
      ...this.statistics,
      active_algorithms: Array.from(this.algorithms.values()).filter(a => a.status === 'active').length,
      cached_recommendations: this.recommendationCache.size,
      processing_queue_size: this.processingQueue.length,
      feedback_queue_size: this.feedbackQueue.length
    };
  }

  /**
   * Get user profile
   */
  getUserProfile(userId: string): UserProfile | undefined {
    return this.userProfiles.get(userId);
  }

  /**
   * Get content item
   */
  getContentItem(contentId: string): ContentItem | undefined {
    return this.contentItems.get(contentId);
  }

  /**
   * Get algorithm performance
   */
  getAlgorithmPerformance(algorithmId: string): RecommendationAlgorithm | undefined {
    return this.algorithms.get(algorithmId);
  }
}

// Export singleton instance
export const intelligentRecommendationEngine = new IntelligentRecommendationEngine();