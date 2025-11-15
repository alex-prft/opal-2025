// Phase 4: Intelligent Skeleton Loading System
// Provides adaptive loading states and placeholders for progressive rendering

import { progressiveRenderer, type ProgressiveRenderRequest } from './progressive-renderer';

export interface SkeletonConfiguration {
  skeleton_id: string;
  page_id: string;
  widget_id?: string;
  skeleton_type: 'adaptive' | 'template_based' | 'content_aware' | 'performance_optimized';

  // Visual configuration
  animation_style: 'shimmer' | 'pulse' | 'wave' | 'static';
  color_scheme: 'light' | 'dark' | 'auto';
  border_radius: number;
  spacing_multiplier: number;

  // Adaptive behavior
  device_optimizations: {
    mobile: boolean;
    tablet: boolean;
    desktop: boolean;
  };
  performance_mode: 'high_quality' | 'balanced' | 'performance_first';
  network_aware: boolean;

  // Content predictions
  estimated_content_height?: number;
  content_sections: SkeletonSection[];
  dynamic_sizing: boolean;

  // Progressive enhancement
  fade_in_duration_ms: number;
  stagger_animation_ms: number;
  reveal_sequence: 'top_down' | 'center_out' | 'random' | 'priority_based';
}

export interface SkeletonSection {
  section_id: string;
  section_type: 'text' | 'image' | 'chart' | 'table' | 'card' | 'list' | 'custom';
  priority: number; // 1-10, higher loads first

  // Dimensions and layout
  width: string | number; // CSS width or percentage
  height: string | number; // CSS height or percentage
  aspect_ratio?: string; // e.g., "16:9", "1:1"

  // Visual properties
  variant: 'primary' | 'secondary' | 'accent' | 'muted';
  has_border: boolean;
  shadow_level: 'none' | 'subtle' | 'medium' | 'prominent';

  // Animation properties
  animation_delay_ms: number;
  animation_duration_ms: number;
  custom_keyframes?: string;

  // Content hints
  text_lines?: number;
  image_placeholder?: string;
  nested_elements?: SkeletonSection[];

  // Accessibility
  aria_label?: string;
  role?: string;
}

export interface SkeletonState {
  skeleton_id: string;
  status: 'initializing' | 'rendering' | 'animating' | 'revealing' | 'completed' | 'error';

  // Render tracking
  sections_rendered: number;
  total_sections: number;
  current_reveal_phase: number;

  // Performance metrics
  skeleton_generation_ms: number;
  first_paint_ms?: number;
  content_replace_ms?: number;

  // Progressive replacement
  sections_replaced: string[];
  replacement_queue: string[];
  reveal_progress: number; // 0-100%

  // Error handling
  fallback_triggered: boolean;
  error_details?: string;

  timestamp: string;
}

export interface AdaptiveSkeletonTemplate {
  template_id: string;
  template_name: string;
  page_patterns: string[]; // Regex patterns for page matching
  widget_patterns: string[]; // Regex patterns for widget matching

  // Template configuration
  base_configuration: Omit<SkeletonConfiguration, 'skeleton_id' | 'page_id'>;
  responsive_breakpoints: {
    mobile: Partial<SkeletonConfiguration>;
    tablet: Partial<SkeletonConfiguration>;
    desktop: Partial<SkeletonConfiguration>;
  };

  // Content analysis
  content_predictors: {
    text_length_estimator: string; // Function name or algorithm
    image_size_predictor: string;
    layout_complexity_analyzer: string;
  };

  // Performance optimization
  lazy_load_sections: string[];
  critical_sections: string[];
  preload_assets: string[];

  usage_statistics: {
    usage_count: number;
    average_satisfaction_score: number;
    performance_score: number;
    last_updated: string;
  };
}

/**
 * Intelligent Skeleton Loading System for Phase 4
 *
 * Features:
 * - Adaptive skeleton generation based on content and device
 * - Progressive revelation with smooth transitions
 * - Performance-optimized animations and rendering
 * - Content-aware placeholders with accurate sizing
 * - Cross-page consistent loading experiences
 * - Network-aware optimization and fallbacks
 * - Integration with progressive rendering system
 */
export class SkeletonLoadingSystem {
  private activeSkeletons = new Map<string, SkeletonState>();
  private skeletonTemplates = new Map<string, AdaptiveSkeletonTemplate>();
  private generatedSkeletons = new Map<string, SkeletonConfiguration>();

  private statistics = {
    skeletons_generated: 0,
    successful_reveals: 0,
    failed_generations: 0,
    average_generation_ms: 0,
    average_reveal_ms: 0,
    template_cache_hits: 0,
    adaptive_optimizations: 0
  };

  constructor() {
    console.log(`💀 [SkeletonLoader] Intelligent skeleton loading system initialized`);
    this.initializeDefaultTemplates();
    this.startPerformanceMonitoring();
  }

  /**
   * Generate adaptive skeleton for a page/widget combination
   */
  async generateAdaptiveSkeleton(
    pageId: string,
    widgetId: string | undefined,
    clientCapabilities: ProgressiveRenderRequest['client_capabilities'],
    options?: {
      template_override?: string;
      performance_mode?: SkeletonConfiguration['performance_mode'];
      custom_sections?: SkeletonSection[];
    }
  ): Promise<SkeletonConfiguration> {
    const skeletonId = `skeleton_${pageId}_${widgetId || 'default'}_${Date.now()}`;
    const generationStart = Date.now();

    console.log(`💀 [SkeletonLoader] Generating adaptive skeleton for ${pageId}/${widgetId} (${clientCapabilities.device_type})`);

    try {
      // Find or create template
      let template = await this.findBestTemplate(pageId, widgetId);
      if (options?.template_override) {
        template = this.skeletonTemplates.get(options.template_override) || template;
      }

      // Create base configuration from template
      const baseConfig = this.createBaseConfiguration(
        skeletonId,
        pageId,
        widgetId,
        template,
        clientCapabilities
      );

      // Apply device-specific optimizations
      const optimizedConfig = this.applyDeviceOptimizations(
        baseConfig,
        clientCapabilities,
        template
      );

      // Apply performance optimizations
      const finalConfig = this.applyPerformanceOptimizations(
        optimizedConfig,
        options?.performance_mode || 'balanced',
        clientCapabilities
      );

      // Add custom sections if provided
      if (options?.custom_sections) {
        finalConfig.content_sections.push(...options.custom_sections);
      }

      // Analyze and optimize content sections
      await this.optimizeContentSections(finalConfig, pageId, widgetId);

      // Store generated skeleton
      this.generatedSkeletons.set(skeletonId, finalConfig);

      // Update statistics
      this.statistics.skeletons_generated++;
      const generationTime = Date.now() - generationStart;
      this.updateAverageGenerationTime(generationTime);

      console.log(`✅ [SkeletonLoader] Skeleton ${skeletonId} generated: ${finalConfig.content_sections.length} sections in ${generationTime}ms`);

      return finalConfig;

    } catch (error) {
      console.error(`❌ [SkeletonLoader] Failed to generate skeleton for ${pageId}/${widgetId}:`, error);

      this.statistics.failed_generations++;

      // Return fallback skeleton
      return this.generateFallbackSkeleton(skeletonId, pageId, widgetId, clientCapabilities);
    }
  }

  /**
   * Start skeleton rendering and animation
   */
  async startSkeletonRender(skeletonId: string): Promise<SkeletonState> {
    const skeleton = this.generatedSkeletons.get(skeletonId);
    if (!skeleton) {
      throw new Error(`Skeleton ${skeletonId} not found`);
    }

    const state: SkeletonState = {
      skeleton_id: skeletonId,
      status: 'initializing',
      sections_rendered: 0,
      total_sections: skeleton.content_sections.length,
      current_reveal_phase: 0,
      skeleton_generation_ms: 0,
      sections_replaced: [],
      replacement_queue: [...skeleton.content_sections.map(s => s.section_id)],
      reveal_progress: 0,
      fallback_triggered: false,
      timestamp: new Date().toISOString()
    };

    this.activeSkeletons.set(skeletonId, state);

    console.log(`💀 [SkeletonLoader] Starting skeleton render for ${skeletonId}: ${state.total_sections} sections`);

    try {
      // Initialize rendering
      state.status = 'rendering';

      // Render sections in priority order
      await this.renderSkeletonSections(skeleton, state);

      // Start animations
      state.status = 'animating';
      await this.startSkeletonAnimations(skeleton, state);

      console.log(`✅ [SkeletonLoader] Skeleton ${skeletonId} render completed`);

    } catch (error) {
      console.error(`❌ [SkeletonLoader] Skeleton render failed for ${skeletonId}:`, error);
      state.status = 'error';
      state.error_details = error instanceof Error ? error.message : 'Unknown error';
    }

    return state;
  }

  /**
   * Progressively replace skeleton sections with actual content
   */
  async replaceSkeletonSection(
    skeletonId: string,
    sectionId: string,
    actualContent: any,
    transition?: {
      type: 'fade' | 'slide' | 'scale' | 'morph';
      duration_ms: number;
      easing: string;
    }
  ): Promise<boolean> {
    const state = this.activeSkeletons.get(skeletonId);
    if (!state || state.status === 'error') {
      return false;
    }

    console.log(`💀 [SkeletonLoader] Replacing section ${sectionId} in skeleton ${skeletonId}`);

    try {
      // Mark section as replaced
      if (!state.sections_replaced.includes(sectionId)) {
        state.sections_replaced.push(sectionId);
      }

      // Remove from replacement queue
      const queueIndex = state.replacement_queue.indexOf(sectionId);
      if (queueIndex > -1) {
        state.replacement_queue.splice(queueIndex, 1);
      }

      // Update progress
      state.reveal_progress = Math.round((state.sections_replaced.length / state.total_sections) * 100);

      // Check if skeleton is complete
      if (state.replacement_queue.length === 0) {
        state.status = 'completed';
        state.content_replace_ms = Date.now() - new Date(state.timestamp).getTime();

        this.statistics.successful_reveals++;
        this.updateAverageRevealTime(state.content_replace_ms);

        console.log(`✅ [SkeletonLoader] Skeleton ${skeletonId} fully revealed in ${state.content_replace_ms}ms`);
      }

      return true;

    } catch (error) {
      console.error(`❌ [SkeletonLoader] Failed to replace section ${sectionId}:`, error);
      state.status = 'error';
      state.error_details = error instanceof Error ? error.message : 'Section replacement failed';
      return false;
    }
  }

  /**
   * Get skeleton HTML/CSS for rendering
   */
  generateSkeletonHTML(skeletonId: string): { html: string; css: string } {
    const skeleton = this.generatedSkeletons.get(skeletonId);
    if (!skeleton) {
      return { html: '', css: '' };
    }

    const html = this.generateSkeletonHTMLStructure(skeleton);
    const css = this.generateSkeletonCSS(skeleton);

    return { html, css };
  }

  /**
   * Get skeleton React components for rendering
   */
  generateSkeletonComponents(skeletonId: string): any {
    const skeleton = this.generatedSkeletons.get(skeletonId);
    if (!skeleton) {
      return null;
    }

    return {
      SkeletonContainer: this.createSkeletonContainer(skeleton),
      SkeletonSections: skeleton.content_sections.map(section =>
        this.createSkeletonSection(section, skeleton)
      )
    };
  }

  // Private implementation methods

  private async initializeDefaultTemplates(): Promise<void> {
    // Dashboard template
    const dashboardTemplate: AdaptiveSkeletonTemplate = {
      template_id: 'dashboard_default',
      template_name: 'Default Dashboard Layout',
      page_patterns: ['.*dashboard.*', '.*analytics.*', '.*insights.*'],
      widget_patterns: ['.*kpi.*', '.*chart.*', '.*metric.*'],
      base_configuration: {
        skeleton_type: 'content_aware',
        animation_style: 'shimmer',
        color_scheme: 'auto',
        border_radius: 8,
        spacing_multiplier: 1.0,
        device_optimizations: {
          mobile: true,
          tablet: true,
          desktop: true
        },
        performance_mode: 'balanced',
        network_aware: true,
        content_sections: [
          {
            section_id: 'header',
            section_type: 'text',
            priority: 10,
            width: '100%',
            height: 60,
            variant: 'primary',
            has_border: false,
            shadow_level: 'none',
            animation_delay_ms: 0,
            animation_duration_ms: 1200,
            text_lines: 1,
            aria_label: 'Loading header'
          },
          {
            section_id: 'main_content',
            section_type: 'card',
            priority: 8,
            width: '100%',
            height: 400,
            variant: 'secondary',
            has_border: true,
            shadow_level: 'subtle',
            animation_delay_ms: 200,
            animation_duration_ms: 1200,
            aria_label: 'Loading main content'
          }
        ],
        fade_in_duration_ms: 300,
        stagger_animation_ms: 100,
        reveal_sequence: 'priority_based',
        dynamic_sizing: true
      },
      responsive_breakpoints: {
        mobile: {
          content_sections: [
            {
              section_id: 'header',
              section_type: 'text',
              priority: 10,
              width: '100%',
              height: 48,
              variant: 'primary',
              has_border: false,
              shadow_level: 'none',
              animation_delay_ms: 0,
              animation_duration_ms: 1000,
              text_lines: 1
            }
          ]
        },
        tablet: {},
        desktop: {}
      },
      content_predictors: {
        text_length_estimator: 'adaptive_text_predictor',
        image_size_predictor: 'responsive_image_predictor',
        layout_complexity_analyzer: 'dashboard_complexity_analyzer'
      },
      lazy_load_sections: ['footer', 'sidebar'],
      critical_sections: ['header', 'main_content'],
      preload_assets: [],
      usage_statistics: {
        usage_count: 0,
        average_satisfaction_score: 0,
        performance_score: 100,
        last_updated: new Date().toISOString()
      }
    };

    this.skeletonTemplates.set(dashboardTemplate.template_id, dashboardTemplate);

    // Strategy Plans template
    const strategyTemplate: AdaptiveSkeletonTemplate = {
      template_id: 'strategy_plans_default',
      template_name: 'Strategy Plans Layout',
      page_patterns: ['strategy-plans.*'],
      widget_patterns: ['.*plans.*', '.*roadmap.*', '.*timeline.*'],
      base_configuration: {
        skeleton_type: 'template_based',
        animation_style: 'wave',
        color_scheme: 'auto',
        border_radius: 12,
        spacing_multiplier: 1.2,
        device_optimizations: {
          mobile: true,
          tablet: true,
          desktop: true
        },
        performance_mode: 'balanced',
        network_aware: true,
        content_sections: [
          {
            section_id: 'title',
            section_type: 'text',
            priority: 10,
            width: '100%',
            height: 80,
            variant: 'primary',
            has_border: false,
            shadow_level: 'none',
            animation_delay_ms: 0,
            animation_duration_ms: 1500,
            text_lines: 2
          },
          {
            section_id: 'roadmap',
            section_type: 'chart',
            priority: 9,
            width: '100%',
            height: 350,
            aspect_ratio: '16:9',
            variant: 'accent',
            has_border: true,
            shadow_level: 'medium',
            animation_delay_ms: 300,
            animation_duration_ms: 1500
          },
          {
            section_id: 'metrics_grid',
            section_type: 'card',
            priority: 7,
            width: '100%',
            height: 200,
            variant: 'secondary',
            has_border: true,
            shadow_level: 'subtle',
            animation_delay_ms: 600,
            animation_duration_ms: 1200,
            nested_elements: [
              {
                section_id: 'metric_1',
                section_type: 'text',
                priority: 5,
                width: '30%',
                height: 60,
                variant: 'muted',
                has_border: false,
                shadow_level: 'none',
                animation_delay_ms: 800,
                animation_duration_ms: 1000,
                text_lines: 3
              }
            ]
          }
        ],
        fade_in_duration_ms: 400,
        stagger_animation_ms: 150,
        reveal_sequence: 'top_down',
        dynamic_sizing: true
      },
      responsive_breakpoints: {
        mobile: {
          content_sections: [
            {
              section_id: 'roadmap',
              section_type: 'chart',
              priority: 9,
              width: '100%',
              height: 250,
              aspect_ratio: '4:3'
            }
          ]
        },
        tablet: {},
        desktop: {}
      },
      content_predictors: {
        text_length_estimator: 'strategy_text_predictor',
        image_size_predictor: 'chart_size_predictor',
        layout_complexity_analyzer: 'strategy_layout_analyzer'
      },
      lazy_load_sections: ['metrics_grid'],
      critical_sections: ['title', 'roadmap'],
      preload_assets: [],
      usage_statistics: {
        usage_count: 0,
        average_satisfaction_score: 0,
        performance_score: 100,
        last_updated: new Date().toISOString()
      }
    };

    this.skeletonTemplates.set(strategyTemplate.template_id, strategyTemplate);

    console.log(`💀 [SkeletonLoader] Initialized ${this.skeletonTemplates.size} default templates`);
  }

  private async findBestTemplate(
    pageId: string,
    widgetId?: string
  ): Promise<AdaptiveSkeletonTemplate> {
    // Find template by pattern matching
    for (const template of this.skeletonTemplates.values()) {
      const pageMatch = template.page_patterns.some(pattern =>
        new RegExp(pattern).test(pageId)
      );

      const widgetMatch = !widgetId || template.widget_patterns.some(pattern =>
        new RegExp(pattern).test(widgetId)
      );

      if (pageMatch && widgetMatch) {
        this.statistics.template_cache_hits++;
        return template;
      }
    }

    // Return default template
    return this.skeletonTemplates.get('dashboard_default')!;
  }

  private createBaseConfiguration(
    skeletonId: string,
    pageId: string,
    widgetId: string | undefined,
    template: AdaptiveSkeletonTemplate,
    clientCapabilities: ProgressiveRenderRequest['client_capabilities']
  ): SkeletonConfiguration {
    return {
      skeleton_id: skeletonId,
      page_id: pageId,
      widget_id: widgetId,
      ...template.base_configuration
    };
  }

  private applyDeviceOptimizations(
    config: SkeletonConfiguration,
    clientCapabilities: ProgressiveRenderRequest['client_capabilities'],
    template: AdaptiveSkeletonTemplate
  ): SkeletonConfiguration {
    const deviceConfig = template.responsive_breakpoints[clientCapabilities.device_type];

    if (deviceConfig) {
      // Merge device-specific configurations
      Object.assign(config, deviceConfig);

      // Merge device-specific sections
      if (deviceConfig.content_sections) {
        config.content_sections = this.mergeSkeletonSections(
          config.content_sections,
          deviceConfig.content_sections
        );
      }

      this.statistics.adaptive_optimizations++;
    }

    return config;
  }

  private applyPerformanceOptimizations(
    config: SkeletonConfiguration,
    performanceMode: SkeletonConfiguration['performance_mode'],
    clientCapabilities: ProgressiveRenderRequest['client_capabilities']
  ): SkeletonConfiguration {
    switch (performanceMode) {
      case 'performance_first':
        config.animation_style = 'static';
        config.fade_in_duration_ms = 100;
        config.stagger_animation_ms = 0;
        // Reduce section complexity
        config.content_sections = config.content_sections.filter(s => s.priority >= 8);
        break;

      case 'high_quality':
        config.animation_style = 'wave';
        config.fade_in_duration_ms = 600;
        config.stagger_animation_ms = 200;
        break;

      case 'balanced':
      default:
        // Keep default settings but adjust for connection speed
        if (clientCapabilities.connection_speed === 'slow') {
          config.animation_style = 'pulse';
          config.fade_in_duration_ms = 200;
          config.stagger_animation_ms = 50;
        }
        break;
    }

    return config;
  }

  private async optimizeContentSections(
    config: SkeletonConfiguration,
    pageId: string,
    widgetId?: string
  ): Promise<void> {
    // Sort sections by priority (higher priority first)
    config.content_sections.sort((a, b) => b.priority - a.priority);

    // Optimize animation delays based on reveal sequence
    this.optimizeAnimationSequence(config);

    // Predict content dimensions if dynamic sizing is enabled
    if (config.dynamic_sizing) {
      await this.predictContentDimensions(config, pageId, widgetId);
    }
  }

  private optimizeAnimationSequence(config: SkeletonConfiguration): void {
    switch (config.reveal_sequence) {
      case 'priority_based':
        config.content_sections.forEach((section, index) => {
          section.animation_delay_ms = index * config.stagger_animation_ms;
        });
        break;

      case 'top_down':
        config.content_sections.forEach((section, index) => {
          section.animation_delay_ms = index * config.stagger_animation_ms;
        });
        break;

      case 'center_out':
        const middle = Math.floor(config.content_sections.length / 2);
        config.content_sections.forEach((section, index) => {
          const distance = Math.abs(index - middle);
          section.animation_delay_ms = distance * config.stagger_animation_ms;
        });
        break;

      case 'random':
        const delays = Array.from({ length: config.content_sections.length }, (_, i) => i * config.stagger_animation_ms);
        this.shuffleArray(delays);
        config.content_sections.forEach((section, index) => {
          section.animation_delay_ms = delays[index];
        });
        break;
    }
  }

  private async predictContentDimensions(
    config: SkeletonConfiguration,
    pageId: string,
    widgetId?: string
  ): Promise<void> {
    // This would integrate with Phase 2 cache to get historical content data
    // For now, provide reasonable defaults based on section type

    config.content_sections.forEach(section => {
      if (section.section_type === 'text' && typeof section.height === 'number') {
        // Predict text height based on lines
        const lineHeight = 1.5; // em
        const fontSize = 16; // px
        const predictedHeight = (section.text_lines || 1) * lineHeight * fontSize;
        section.height = Math.max(predictedHeight, section.height as number);
      }
    });
  }

  private mergeSkeletonSections(
    baseSections: SkeletonSection[],
    overrideSections: SkeletonSection[]
  ): SkeletonSection[] {
    const merged = [...baseSections];

    overrideSections.forEach(override => {
      const existingIndex = merged.findIndex(s => s.section_id === override.section_id);
      if (existingIndex > -1) {
        // Merge with existing section
        merged[existingIndex] = { ...merged[existingIndex], ...override };
      } else {
        // Add new section
        merged.push(override);
      }
    });

    return merged;
  }

  private generateFallbackSkeleton(
    skeletonId: string,
    pageId: string,
    widgetId: string | undefined,
    clientCapabilities: ProgressiveRenderRequest['client_capabilities']
  ): SkeletonConfiguration {
    return {
      skeleton_id: skeletonId,
      page_id: pageId,
      widget_id: widgetId,
      skeleton_type: 'performance_optimized',
      animation_style: 'static',
      color_scheme: 'auto',
      border_radius: 4,
      spacing_multiplier: 1.0,
      device_optimizations: {
        mobile: true,
        tablet: true,
        desktop: true
      },
      performance_mode: 'performance_first',
      network_aware: false,
      content_sections: [
        {
          section_id: 'fallback_content',
          section_type: 'card',
          priority: 10,
          width: '100%',
          height: clientCapabilities.device_type === 'mobile' ? 200 : 300,
          variant: 'muted',
          has_border: true,
          shadow_level: 'subtle',
          animation_delay_ms: 0,
          animation_duration_ms: 0,
          aria_label: 'Loading content'
        }
      ],
      fade_in_duration_ms: 100,
      stagger_animation_ms: 0,
      reveal_sequence: 'priority_based',
      dynamic_sizing: false
    };
  }

  private async renderSkeletonSections(
    skeleton: SkeletonConfiguration,
    state: SkeletonState
  ): Promise<void> {
    // Simulate section rendering
    for (const section of skeleton.content_sections) {
      state.sections_rendered++;

      // Small delay to simulate rendering time
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  private async startSkeletonAnimations(
    skeleton: SkeletonConfiguration,
    state: SkeletonState
  ): Promise<void> {
    // Start staggered animations
    state.first_paint_ms = Date.now() - new Date(state.timestamp).getTime();

    // Simulate animation start
    await new Promise(resolve => setTimeout(resolve, skeleton.fade_in_duration_ms));
  }

  private generateSkeletonHTMLStructure(skeleton: SkeletonConfiguration): string {
    const sections = skeleton.content_sections.map(section =>
      this.generateSectionHTML(section, skeleton)
    ).join('\n');

    return `
      <div class="skeleton-container" data-skeleton-id="${skeleton.skeleton_id}">
        ${sections}
      </div>
    `;
  }

  private generateSectionHTML(section: SkeletonSection, skeleton: SkeletonConfiguration): string {
    const classes = [
      'skeleton-section',
      `skeleton-${section.section_type}`,
      `skeleton-${section.variant}`,
      `skeleton-animation-${skeleton.animation_style}`
    ];

    if (section.has_border) classes.push('skeleton-bordered');
    if (section.shadow_level !== 'none') classes.push(`skeleton-shadow-${section.shadow_level}`);

    const styles = [
      `width: ${typeof section.width === 'number' ? section.width + 'px' : section.width}`,
      `height: ${typeof section.height === 'number' ? section.height + 'px' : section.height}`,
      `border-radius: ${skeleton.border_radius}px`,
      `animation-delay: ${section.animation_delay_ms}ms`,
      `animation-duration: ${section.animation_duration_ms}ms`
    ];

    const nestedHTML = section.nested_elements ?
      section.nested_elements.map(nested => this.generateSectionHTML(nested, skeleton)).join('\n') : '';

    return `
      <div
        class="${classes.join(' ')}"
        data-section-id="${section.section_id}"
        style="${styles.join('; ')}"
        ${section.aria_label ? `aria-label="${section.aria_label}"` : ''}
        ${section.role ? `role="${section.role}"` : ''}
      >
        ${nestedHTML}
      </div>
    `;
  }

  private generateSkeletonCSS(skeleton: SkeletonConfiguration): string {
    const animationCSS = this.generateAnimationCSS(skeleton.animation_style);
    const colorSchemeCSS = this.generateColorSchemeCSS(skeleton.color_scheme);

    return `
      .skeleton-container {
        width: 100%;
        padding: ${8 * skeleton.spacing_multiplier}px;
      }

      .skeleton-section {
        background: var(--skeleton-bg-color);
        position: relative;
        overflow: hidden;
        margin-bottom: ${16 * skeleton.spacing_multiplier}px;
      }

      .skeleton-bordered {
        border: 1px solid var(--skeleton-border-color);
      }

      .skeleton-shadow-subtle {
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .skeleton-shadow-medium {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .skeleton-shadow-prominent {
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      }

      ${animationCSS}
      ${colorSchemeCSS}
    `;
  }

  private generateAnimationCSS(animationStyle: SkeletonConfiguration['animation_style']): string {
    switch (animationStyle) {
      case 'shimmer':
        return `
          .skeleton-animation-shimmer::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            transform: translateX(-100%);
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
            animation: shimmer 2s infinite;
          }

          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
        `;

      case 'pulse':
        return `
          .skeleton-animation-pulse {
            animation: pulse 2s infinite ease-in-out;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `;

      case 'wave':
        return `
          .skeleton-animation-wave {
            animation: wave 1.6s linear infinite;
          }

          @keyframes wave {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
            100% { transform: translateX(100%); }
          }
        `;

      case 'static':
      default:
        return '';
    }
  }

  private generateColorSchemeCSS(colorScheme: SkeletonConfiguration['color_scheme']): string {
    const lightColors = `
      --skeleton-bg-color: #f3f4f6;
      --skeleton-border-color: #e5e7eb;
    `;

    const darkColors = `
      --skeleton-bg-color: #374151;
      --skeleton-border-color: #4b5563;
    `;

    switch (colorScheme) {
      case 'light':
        return `:root { ${lightColors} }`;

      case 'dark':
        return `:root { ${darkColors} }`;

      case 'auto':
      default:
        return `
          :root { ${lightColors} }
          @media (prefers-color-scheme: dark) {
            :root { ${darkColors} }
          }
        `;
    }
  }

  private createSkeletonContainer(skeleton: SkeletonConfiguration): any {
    // This would return a React component
    return {
      type: 'SkeletonContainer',
      props: {
        skeletonId: skeleton.skeleton_id,
        className: 'skeleton-container',
        'data-skeleton-id': skeleton.skeleton_id
      }
    };
  }

  private createSkeletonSection(section: SkeletonSection, skeleton: SkeletonConfiguration): any {
    // This would return a React component
    return {
      type: 'SkeletonSection',
      props: {
        sectionId: section.section_id,
        sectionType: section.section_type,
        className: `skeleton-section skeleton-${section.section_type}`,
        style: {
          width: typeof section.width === 'number' ? `${section.width}px` : section.width,
          height: typeof section.height === 'number' ? `${section.height}px` : section.height,
          borderRadius: `${skeleton.border_radius}px`,
          animationDelay: `${section.animation_delay_ms}ms`,
          animationDuration: `${section.animation_duration_ms}ms`
        },
        'aria-label': section.aria_label,
        role: section.role,
        'data-section-id': section.section_id
      }
    };
  }

  // Utility methods

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private updateAverageGenerationTime(generationTimeMs: number): void {
    const totalGenerated = this.statistics.skeletons_generated;
    if (totalGenerated === 1) {
      this.statistics.average_generation_ms = generationTimeMs;
    } else {
      this.statistics.average_generation_ms =
        (this.statistics.average_generation_ms * (totalGenerated - 1) + generationTimeMs) / totalGenerated;
    }
  }

  private updateAverageRevealTime(revealTimeMs: number): void {
    const totalReveals = this.statistics.successful_reveals;
    if (totalReveals === 1) {
      this.statistics.average_reveal_ms = revealTimeMs;
    } else {
      this.statistics.average_reveal_ms =
        (this.statistics.average_reveal_ms * (totalReveals - 1) + revealTimeMs) / totalReveals;
    }
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      // Clean up completed skeletons
      for (const [skeletonId, state] of this.activeSkeletons.entries()) {
        if (state.status === 'completed' || state.status === 'error') {
          const age = Date.now() - new Date(state.timestamp).getTime();
          if (age > 300000) { // 5 minutes
            this.activeSkeletons.delete(skeletonId);
            this.generatedSkeletons.delete(skeletonId);
          }
        }
      }
    }, 60000); // Every minute

    console.log(`📊 [SkeletonLoader] Performance monitoring started`);
  }

  /**
   * Get skeleton loading statistics
   */
  getSkeletonStatistics(): typeof this.statistics & {
    active_skeletons: number;
    cached_templates: number;
  } {
    return {
      ...this.statistics,
      active_skeletons: this.activeSkeletons.size,
      cached_templates: this.skeletonTemplates.size
    };
  }

  /**
   * Get active skeleton state
   */
  getSkeletonState(skeletonId: string): SkeletonState | undefined {
    return this.activeSkeletons.get(skeletonId);
  }

  /**
   * Add custom skeleton template
   */
  addSkeletonTemplate(template: AdaptiveSkeletonTemplate): void {
    this.skeletonTemplates.set(template.template_id, template);
    console.log(`💀 [SkeletonLoader] Added custom template: ${template.template_name}`);
  }

  /**
   * Remove skeleton template
   */
  removeSkeletonTemplate(templateId: string): boolean {
    const removed = this.skeletonTemplates.delete(templateId);
    if (removed) {
      console.log(`💀 [SkeletonLoader] Removed template: ${templateId}`);
    }
    return removed;
  }
}

// Export singleton instance
export const skeletonLoader = new SkeletonLoadingSystem();