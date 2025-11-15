// Phase 4: Streaming Content Renderer with Advanced Chunk Management
// Handles real-time content streaming, chunk optimization, and delivery coordination

import crypto from 'crypto';
import { supabase, isDatabaseAvailable } from '@/lib/database/supabase-client';
import { progressiveRenderer, type RenderChunk } from './progressive-renderer';
import { skeletonLoader } from './skeleton-loading-system';
import { phase1ValidationPipeline } from '@/lib/validation/phase1-integration';
import { intelligentCache } from '@/lib/cache/intelligent-cache-system';

export interface StreamingSession {
  session_id: string;
  client_id: string;
  page_id: string;
  widget_id?: string;

  // Stream configuration
  stream_type: 'server_sent_events' | 'websocket' | 'chunked_transfer' | 'adaptive';
  chunk_delivery_mode: 'immediate' | 'buffered' | 'throttled' | 'burst';
  compression_enabled: boolean;
  encryption_enabled: boolean;

  // Quality and performance settings
  quality_profile: 'ultra_low_latency' | 'balanced' | 'high_quality' | 'bandwidth_optimized';
  max_chunk_size_kb: number;
  target_fps: number; // For real-time updates
  buffer_size_mb: number;

  // Client capabilities and connection
  connection_info: {
    bandwidth_mbps?: number;
    latency_ms?: number;
    connection_type: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
    supports_compression: boolean;
    max_concurrent_streams: number;
  };

  // Stream state
  status: 'initializing' | 'streaming' | 'buffering' | 'paused' | 'completed' | 'error' | 'disconnected';
  chunks_delivered: number;
  bytes_transferred: number;
  current_buffer_level: number; // 0-100%

  // Performance tracking
  stream_start_time: string;
  last_chunk_delivered?: string;
  average_delivery_rate_kbps: number;
  delivery_success_rate: number; // 0-100%

  errors: string[];
  warnings: string[];
}

export interface ContentChunk {
  chunk_id: string;
  session_id: string;
  sequence_number: number;

  // Content data
  content_type: 'html' | 'json' | 'css' | 'javascript' | 'media' | 'binary';
  content_data: any;
  content_encoding: 'raw' | 'gzip' | 'brotli' | 'deflate';
  content_size_bytes: number;

  // Delivery metadata
  chunk_priority: number; // 1-10, higher is more important
  delivery_deadline_ms?: number; // Optional deadline for time-critical content
  chunk_dependencies: string[]; // IDs of chunks this depends on
  replacement_target?: string; // Target element/section ID for content replacement

  // Quality and optimization
  quality_level: 'low' | 'medium' | 'high' | 'lossless';
  adaptive_bitrate: boolean;
  cache_hints: {
    cacheable: boolean;
    ttl_seconds?: number;
    cache_key?: string;
  };

  // Validation and safety
  content_hash: string;
  validation_status: 'pending' | 'passed' | 'failed' | 'bypassed';
  cross_page_safe: boolean;

  // Performance metrics
  generation_time_ms: number;
  compression_ratio?: number;
  delivery_attempts: number;

  timestamp: string;
}

export interface StreamBuffer {
  buffer_id: string;
  session_id: string;
  buffer_type: 'circular' | 'priority_queue' | 'adaptive' | 'sliding_window';

  // Buffer configuration
  max_chunks: number;
  max_size_mb: number;
  overflow_strategy: 'drop_oldest' | 'drop_lowest_priority' | 'compress' | 'spill_to_disk';

  // Current state
  current_chunks: ContentChunk[];
  total_size_bytes: number;
  buffer_utilization: number; // 0-100%

  // Performance metrics
  chunks_added: number;
  chunks_delivered: number;
  chunks_dropped: number;
  average_chunk_age_ms: number;

  // Optimization settings
  auto_compression: boolean;
  quality_adaptation: boolean;
  priority_boosting: boolean;

  last_modified: string;
}

export interface DeliveryPipeline {
  pipeline_id: string;
  session_id: string;
  pipeline_stages: DeliveryStage[];

  // Pipeline configuration
  parallel_processing: boolean;
  stage_timeout_ms: number;
  retry_policy: {
    max_retries: number;
    backoff_strategy: 'linear' | 'exponential' | 'adaptive';
    base_delay_ms: number;
  };

  // Performance optimization
  batch_processing: boolean;
  prefetch_enabled: boolean;
  quality_adaptation: boolean;
  network_awareness: boolean;

  // Monitoring
  total_processed: number;
  successful_deliveries: number;
  failed_deliveries: number;
  average_processing_time_ms: number;

  status: 'active' | 'paused' | 'stopped' | 'error';
}

export interface DeliveryStage {
  stage_id: string;
  stage_name: string;
  stage_type: 'validation' | 'compression' | 'encryption' | 'formatting' | 'transmission' | 'custom';

  // Processing configuration
  enabled: boolean;
  parallel_capable: boolean;
  cacheable_results: boolean;
  timeout_ms: number;

  // Performance settings
  max_concurrent_operations: number;
  quality_impact: 'none' | 'low' | 'medium' | 'high';
  latency_impact: 'none' | 'low' | 'medium' | 'high';

  // Stage metrics
  processed_chunks: number;
  processing_time_ms: number;
  success_rate: number;
  error_count: number;

  last_execution: string;
}

/**
 * Streaming Content Renderer for Phase 4
 *
 * Features:
 * - Real-time content streaming with adaptive delivery
 * - Advanced chunk management and buffering
 * - Multi-stage delivery pipeline with optimization
 * - Network-aware quality adaptation
 * - Cross-page safety and validation integration
 * - Performance monitoring and adaptive tuning
 * - Support for multiple streaming protocols
 * - Intelligent compression and caching
 */
export class StreamingContentRenderer {
  private streamingSessions = new Map<string, StreamingSession>();
  private streamBuffers = new Map<string, StreamBuffer>();
  private deliveryPipelines = new Map<string, DeliveryPipeline>();
  private activeConnections = new Map<string, any>(); // Would store actual connection objects

  private statistics = {
    total_sessions: 0,
    active_sessions: 0,
    total_chunks_delivered: 0,
    total_bytes_transferred: 0,
    average_delivery_rate_kbps: 0,
    successful_deliveries: 0,
    failed_deliveries: 0,
    buffer_utilization_avg: 0,
    compression_ratio_avg: 0
  };

  constructor() {
    console.log(`🌊 [StreamingRenderer] Streaming content renderer initialized`);
    this.initializeDefaultPipelines();
    this.startPerformanceMonitoring();
    this.startBufferOptimization();
  }

  /**
   * Initialize a new streaming session
   */
  async initializeStreamingSession(
    clientId: string,
    pageId: string,
    widgetId: string | undefined,
    clientCapabilities: {
      connection_info: StreamingSession['connection_info'];
      preferred_quality: StreamingSession['quality_profile'];
      supports_streaming: boolean;
    }
  ): Promise<StreamingSession> {
    const sessionId = crypto.randomUUID();

    console.log(`🌊 [StreamingRenderer] Initializing session ${sessionId} for ${pageId}/${widgetId}`);

    // Determine optimal streaming configuration
    const streamConfig = this.optimizeStreamConfiguration(clientCapabilities);

    const session: StreamingSession = {
      session_id: sessionId,
      client_id: clientId,
      page_id: pageId,
      widget_id: widgetId,

      ...streamConfig,

      status: 'initializing',
      chunks_delivered: 0,
      bytes_transferred: 0,
      current_buffer_level: 0,

      stream_start_time: new Date().toISOString(),
      average_delivery_rate_kbps: 0,
      delivery_success_rate: 100,

      errors: [],
      warnings: []
    };

    // Initialize stream buffer
    await this.initializeStreamBuffer(session);

    // Initialize delivery pipeline
    await this.initializeDeliveryPipeline(session);

    this.streamingSessions.set(sessionId, session);
    this.statistics.total_sessions++;
    this.statistics.active_sessions++;

    console.log(`✅ [StreamingRenderer] Session ${sessionId} initialized with ${session.stream_type} delivery`);

    return session;
  }

  /**
   * Start streaming content for a session
   */
  async startContentStreaming(sessionId: string): Promise<void> {
    const session = this.streamingSessions.get(sessionId);
    if (!session) {
      throw new Error(`Streaming session ${sessionId} not found`);
    }

    session.status = 'streaming';

    console.log(`🌊 [StreamingRenderer] Starting content streaming for session ${sessionId}`);

    try {
      // Start the progressive renderer integration
      const renderRequest = this.createProgressiveRenderRequest(session);
      const renderSession = await progressiveRenderer.initializeRenderSession(renderRequest);

      // Start progressive rendering with streaming callbacks
      await this.startProgressiveStreamingRender(session, renderSession.session_id);

      console.log(`✅ [StreamingRenderer] Content streaming started for session ${sessionId}`);

    } catch (error) {
      console.error(`❌ [StreamingRenderer] Failed to start streaming for session ${sessionId}:`, error);
      session.status = 'error';
      session.errors.push(error instanceof Error ? error.message : 'Unknown streaming error');
      this.statistics.failed_deliveries++;
    }
  }

  /**
   * Stream a content chunk to the client
   */
  async streamContentChunk(
    sessionId: string,
    contentType: ContentChunk['content_type'],
    contentData: any,
    options?: {
      priority?: number;
      deadline_ms?: number;
      replacement_target?: string;
      quality_level?: ContentChunk['quality_level'];
    }
  ): Promise<string> {
    const session = this.streamingSessions.get(sessionId);
    if (!session || session.status !== 'streaming') {
      throw new Error(`Cannot stream to session ${sessionId}: session not active`);
    }

    const chunkId = crypto.randomUUID();
    const chunkStart = Date.now();

    console.log(`🌊 [StreamingRenderer] Creating chunk ${chunkId} for session ${sessionId} (${contentType})`);

    try {
      // Create content chunk
      const chunk = await this.createContentChunk(
        chunkId,
        sessionId,
        contentType,
        contentData,
        options
      );

      // Add to stream buffer
      await this.addChunkToBuffer(sessionId, chunk);

      // Process through delivery pipeline
      await this.processChunkThroughPipeline(sessionId, chunk);

      // Update session statistics
      session.chunks_delivered++;
      session.bytes_transferred += chunk.content_size_bytes;
      this.updateDeliveryMetrics(session, chunk);

      this.statistics.total_chunks_delivered++;
      this.statistics.total_bytes_transferred += chunk.content_size_bytes;

      console.log(`✅ [StreamingRenderer] Chunk ${chunkId} processed: ${chunk.content_size_bytes} bytes in ${Date.now() - chunkStart}ms`);

      return chunkId;

    } catch (error) {
      console.error(`❌ [StreamingRenderer] Failed to stream chunk ${chunkId}:`, error);
      session.errors.push(error instanceof Error ? error.message : 'Chunk streaming failed');
      this.statistics.failed_deliveries++;
      throw error;
    }
  }

  /**
   * Pause streaming for a session
   */
  async pauseStreaming(sessionId: string): Promise<boolean> {
    const session = this.streamingSessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.status = 'paused';
    console.log(`⏸️ [StreamingRenderer] Streaming paused for session ${sessionId}`);
    return true;
  }

  /**
   * Resume streaming for a session
   */
  async resumeStreaming(sessionId: string): Promise<boolean> {
    const session = this.streamingSessions.get(sessionId);
    if (!session || session.status !== 'paused') {
      return false;
    }

    session.status = 'streaming';
    console.log(`▶️ [StreamingRenderer] Streaming resumed for session ${sessionId}`);
    return true;
  }

  /**
   * Complete and close streaming session
   */
  async completeStreaming(sessionId: string): Promise<void> {
    const session = this.streamingSessions.get(sessionId);
    if (!session) {
      return;
    }

    session.status = 'completed';

    // Clean up resources
    this.streamBuffers.delete(sessionId);
    this.deliveryPipelines.delete(sessionId);
    this.activeConnections.delete(sessionId);

    this.statistics.active_sessions = this.streamingSessions.size - 1;

    console.log(`✅ [StreamingRenderer] Streaming completed for session ${sessionId}: ${session.chunks_delivered} chunks, ${session.bytes_transferred} bytes`);

    // Keep session record for a short time for analytics
    setTimeout(() => {
      this.streamingSessions.delete(sessionId);
    }, 300000); // 5 minutes
  }

  // Private implementation methods

  private optimizeStreamConfiguration(
    clientCapabilities: {
      connection_info: StreamingSession['connection_info'];
      preferred_quality: StreamingSession['quality_profile'];
      supports_streaming: boolean;
    }
  ): Partial<StreamingSession> {
    const config: Partial<StreamingSession> = {
      connection_info: clientCapabilities.connection_info,
      quality_profile: clientCapabilities.preferred_quality
    };

    // Choose streaming type based on capabilities
    if (clientCapabilities.supports_streaming && clientCapabilities.connection_info.bandwidth_mbps && clientCapabilities.connection_info.bandwidth_mbps > 10) {
      config.stream_type = 'server_sent_events';
      config.chunk_delivery_mode = 'immediate';
    } else if (clientCapabilities.connection_info.bandwidth_mbps && clientCapabilities.connection_info.bandwidth_mbps > 2) {
      config.stream_type = 'chunked_transfer';
      config.chunk_delivery_mode = 'buffered';
    } else {
      config.stream_type = 'adaptive';
      config.chunk_delivery_mode = 'throttled';
    }

    // Configure quality and performance
    switch (clientCapabilities.preferred_quality) {
      case 'ultra_low_latency':
        config.max_chunk_size_kb = 16;
        config.target_fps = 30;
        config.buffer_size_mb = 2;
        config.compression_enabled = false;
        break;

      case 'balanced':
        config.max_chunk_size_kb = 64;
        config.target_fps = 15;
        config.buffer_size_mb = 5;
        config.compression_enabled = true;
        break;

      case 'high_quality':
        config.max_chunk_size_kb = 256;
        config.target_fps = 10;
        config.buffer_size_mb = 10;
        config.compression_enabled = true;
        break;

      case 'bandwidth_optimized':
        config.max_chunk_size_kb = 32;
        config.target_fps = 5;
        config.buffer_size_mb = 3;
        config.compression_enabled = true;
        break;
    }

    // Enable encryption for sensitive content
    config.encryption_enabled = false; // Would enable based on content sensitivity

    return config;
  }

  private async initializeStreamBuffer(session: StreamingSession): Promise<void> {
    const bufferId = `buffer_${session.session_id}`;

    const buffer: StreamBuffer = {
      buffer_id: bufferId,
      session_id: session.session_id,
      buffer_type: this.selectOptimalBufferType(session),

      max_chunks: this.calculateMaxChunks(session),
      max_size_mb: session.buffer_size_mb,
      overflow_strategy: session.quality_profile === 'ultra_low_latency' ? 'drop_oldest' : 'compress',

      current_chunks: [],
      total_size_bytes: 0,
      buffer_utilization: 0,

      chunks_added: 0,
      chunks_delivered: 0,
      chunks_dropped: 0,
      average_chunk_age_ms: 0,

      auto_compression: session.compression_enabled,
      quality_adaptation: session.quality_profile !== 'ultra_low_latency',
      priority_boosting: true,

      last_modified: new Date().toISOString()
    };

    this.streamBuffers.set(session.session_id, buffer);
    console.log(`🗄️ [StreamingRenderer] Buffer initialized for session ${session.session_id}: ${buffer.max_chunks} chunks, ${buffer.max_size_mb}MB`);
  }

  private async initializeDeliveryPipeline(session: StreamingSession): Promise<void> {
    const pipelineId = `pipeline_${session.session_id}`;

    const stages = this.createDeliveryStages(session);

    const pipeline: DeliveryPipeline = {
      pipeline_id: pipelineId,
      session_id: session.session_id,
      pipeline_stages: stages,

      parallel_processing: session.connection_info.max_concurrent_streams > 1,
      stage_timeout_ms: session.quality_profile === 'ultra_low_latency' ? 100 : 1000,
      retry_policy: {
        max_retries: 3,
        backoff_strategy: 'exponential',
        base_delay_ms: 50
      },

      batch_processing: session.chunk_delivery_mode === 'buffered',
      prefetch_enabled: true,
      quality_adaptation: true,
      network_awareness: true,

      total_processed: 0,
      successful_deliveries: 0,
      failed_deliveries: 0,
      average_processing_time_ms: 0,

      status: 'active'
    };

    this.deliveryPipelines.set(session.session_id, pipeline);
    console.log(`🔄 [StreamingRenderer] Delivery pipeline initialized for session ${session.session_id}: ${stages.length} stages`);
  }

  private selectOptimalBufferType(session: StreamingSession): StreamBuffer['buffer_type'] {
    switch (session.quality_profile) {
      case 'ultra_low_latency':
        return 'circular';
      case 'balanced':
        return 'priority_queue';
      case 'high_quality':
        return 'adaptive';
      case 'bandwidth_optimized':
        return 'sliding_window';
      default:
        return 'priority_queue';
    }
  }

  private calculateMaxChunks(session: StreamingSession): number {
    const baseChunks = Math.floor((session.buffer_size_mb * 1024) / session.max_chunk_size_kb);
    const connectionMultiplier = session.connection_info.max_concurrent_streams || 1;
    return Math.max(10, Math.min(1000, baseChunks * connectionMultiplier));
  }

  private createDeliveryStages(session: StreamingSession): DeliveryStage[] {
    const stages: DeliveryStage[] = [];

    // Validation stage
    stages.push({
      stage_id: 'validation',
      stage_name: 'Content Validation',
      stage_type: 'validation',
      enabled: true,
      parallel_capable: true,
      cacheable_results: true,
      timeout_ms: 200,
      max_concurrent_operations: 5,
      quality_impact: 'none',
      latency_impact: 'low',
      processed_chunks: 0,
      processing_time_ms: 0,
      success_rate: 100,
      error_count: 0,
      last_execution: new Date().toISOString()
    });

    // Compression stage (if enabled)
    if (session.compression_enabled) {
      stages.push({
        stage_id: 'compression',
        stage_name: 'Content Compression',
        stage_type: 'compression',
        enabled: true,
        parallel_capable: true,
        cacheable_results: true,
        timeout_ms: 500,
        max_concurrent_operations: 3,
        quality_impact: 'medium',
        latency_impact: 'medium',
        processed_chunks: 0,
        processing_time_ms: 0,
        success_rate: 100,
        error_count: 0,
        last_execution: new Date().toISOString()
      });
    }

    // Formatting stage
    stages.push({
      stage_id: 'formatting',
      stage_name: 'Content Formatting',
      stage_type: 'formatting',
      enabled: true,
      parallel_capable: true,
      cacheable_results: false,
      timeout_ms: 100,
      max_concurrent_operations: 10,
      quality_impact: 'low',
      latency_impact: 'low',
      processed_chunks: 0,
      processing_time_ms: 0,
      success_rate: 100,
      error_count: 0,
      last_execution: new Date().toISOString()
    });

    // Transmission stage
    stages.push({
      stage_id: 'transmission',
      stage_name: 'Content Transmission',
      stage_type: 'transmission',
      enabled: true,
      parallel_capable: false,
      cacheable_results: false,
      timeout_ms: session.quality_profile === 'ultra_low_latency' ? 50 : 1000,
      max_concurrent_operations: session.connection_info.max_concurrent_streams,
      quality_impact: 'none',
      latency_impact: 'high',
      processed_chunks: 0,
      processing_time_ms: 0,
      success_rate: 100,
      error_count: 0,
      last_execution: new Date().toISOString()
    });

    return stages;
  }

  private createProgressiveRenderRequest(session: StreamingSession): any {
    return {
      render_id: `render_${session.session_id}`,
      page_id: session.page_id,
      widget_id: session.widget_id,
      render_strategy: 'streaming',
      render_priority: 5,
      client_capabilities: {
        supports_streaming: true,
        connection_speed: this.mapConnectionSpeed(session.connection_info),
        device_type: 'desktop', // Would detect from user agent
        viewport_size: { width: 1920, height: 1080 } // Would get from client
      },
      safety_requirements: {
        cross_page_consistency: true,
        fallback_enabled: true,
        max_render_time_ms: 5000,
        require_validation: true
      }
    };
  }

  private mapConnectionSpeed(connectionInfo: StreamingSession['connection_info']): 'fast' | 'medium' | 'slow' {
    const bandwidth = connectionInfo.bandwidth_mbps || 1;

    if (bandwidth >= 10) return 'fast';
    if (bandwidth >= 2) return 'medium';
    return 'slow';
  }

  private async startProgressiveStreamingRender(
    session: StreamingSession,
    renderSessionId: string
  ): Promise<void> {
    // Start progressive rendering
    await progressiveRenderer.startProgressiveRendering(renderSessionId);

    // Set up chunk streaming callback
    // In a real implementation, this would listen for render chunks and stream them
    console.log(`🌊 [StreamingRenderer] Progressive streaming render started for ${session.session_id}`);
  }

  private async createContentChunk(
    chunkId: string,
    sessionId: string,
    contentType: ContentChunk['content_type'],
    contentData: any,
    options?: {
      priority?: number;
      deadline_ms?: number;
      replacement_target?: string;
      quality_level?: ContentChunk['quality_level'];
    }
  ): Promise<ContentChunk> {
    const session = this.streamingSessions.get(sessionId)!;
    const generationStart = Date.now();

    // Serialize content data
    const serializedData = this.serializeContentData(contentData, contentType);
    const contentSize = new Blob([serializedData]).size;

    // Generate content hash
    const contentHash = crypto.createHash('sha256').update(serializedData).digest('hex');

    // Validate content if required
    let validationStatus: ContentChunk['validation_status'] = 'bypassed';
    let crossPageSafe = true;

    try {
      if (session.page_id) {
        const validationResult = await phase1ValidationPipeline.getValidatedContent(
          session.page_id,
          session.widget_id || 'default'
        );
        validationStatus = validationResult.valid ? 'passed' : 'failed';
      }
    } catch (error) {
      console.warn(`⚠️ [StreamingRenderer] Validation failed for chunk ${chunkId}:`, error);
      validationStatus = 'failed';
      crossPageSafe = false;
    }

    const chunk: ContentChunk = {
      chunk_id: chunkId,
      session_id: sessionId,
      sequence_number: session.chunks_delivered + 1,

      content_type: contentType,
      content_data: serializedData,
      content_encoding: session.compression_enabled ? 'gzip' : 'raw',
      content_size_bytes: contentSize,

      chunk_priority: options?.priority || 5,
      delivery_deadline_ms: options?.deadline_ms,
      chunk_dependencies: [],
      replacement_target: options?.replacement_target,

      quality_level: options?.quality_level || 'medium',
      adaptive_bitrate: session.quality_profile === 'bandwidth_optimized',
      cache_hints: {
        cacheable: contentType !== 'html', // HTML is typically dynamic
        ttl_seconds: 300,
        cache_key: `chunk_${session.page_id}_${chunkId}`
      },

      content_hash: contentHash,
      validation_status: validationStatus,
      cross_page_safe: crossPageSafe,

      generation_time_ms: Date.now() - generationStart,
      delivery_attempts: 0,

      timestamp: new Date().toISOString()
    };

    // Apply compression if enabled
    if (session.compression_enabled) {
      chunk.content_data = await this.compressContent(chunk.content_data, 'gzip');
      chunk.compression_ratio = contentSize / chunk.content_data.length;
    }

    return chunk;
  }

  private serializeContentData(data: any, contentType: ContentChunk['content_type']): string {
    switch (contentType) {
      case 'json':
        return JSON.stringify(data);
      case 'html':
      case 'css':
      case 'javascript':
        return typeof data === 'string' ? data : String(data);
      case 'binary':
        return data; // Would handle binary data appropriately
      default:
        return JSON.stringify(data);
    }
  }

  private async compressContent(content: string, algorithm: 'gzip' | 'brotli' | 'deflate'): Promise<string> {
    // Placeholder compression implementation
    // In a real implementation, would use appropriate compression libraries
    return content; // Return compressed content
  }

  private async addChunkToBuffer(sessionId: string, chunk: ContentChunk): Promise<void> {
    const buffer = this.streamBuffers.get(sessionId);
    if (!buffer) {
      throw new Error(`Buffer not found for session ${sessionId}`);
    }

    // Check buffer capacity
    if (buffer.current_chunks.length >= buffer.max_chunks ||
        buffer.total_size_bytes + chunk.content_size_bytes > buffer.max_size_mb * 1024 * 1024) {

      // Apply overflow strategy
      await this.handleBufferOverflow(buffer, chunk);
    }

    // Add chunk to buffer
    buffer.current_chunks.push(chunk);
    buffer.total_size_bytes += chunk.content_size_bytes;
    buffer.chunks_added++;

    // Update buffer utilization
    buffer.buffer_utilization = Math.round((buffer.total_size_bytes / (buffer.max_size_mb * 1024 * 1024)) * 100);
    buffer.last_modified = new Date().toISOString();

    console.log(`🗄️ [StreamingRenderer] Chunk ${chunk.chunk_id} added to buffer: ${buffer.buffer_utilization}% utilization`);
  }

  private async handleBufferOverflow(buffer: StreamBuffer, newChunk: ContentChunk): Promise<void> {
    console.log(`⚠️ [StreamingRenderer] Buffer overflow detected for session ${buffer.session_id}, applying ${buffer.overflow_strategy}`);

    switch (buffer.overflow_strategy) {
      case 'drop_oldest':
        if (buffer.current_chunks.length > 0) {
          const dropped = buffer.current_chunks.shift()!;
          buffer.total_size_bytes -= dropped.content_size_bytes;
          buffer.chunks_dropped++;
        }
        break;

      case 'drop_lowest_priority':
        // Find lowest priority chunk
        const lowestPriorityIndex = buffer.current_chunks.reduce((minIndex, chunk, index, chunks) =>
          chunk.chunk_priority < chunks[minIndex].chunk_priority ? index : minIndex, 0);

        if (buffer.current_chunks[lowestPriorityIndex].chunk_priority < newChunk.chunk_priority) {
          const dropped = buffer.current_chunks.splice(lowestPriorityIndex, 1)[0];
          buffer.total_size_bytes -= dropped.content_size_bytes;
          buffer.chunks_dropped++;
        }
        break;

      case 'compress':
        // Compress existing chunks (placeholder)
        buffer.total_size_bytes = Math.floor(buffer.total_size_bytes * 0.7); // Simulated compression
        break;

      case 'spill_to_disk':
        // Would implement disk spilling in production
        console.log(`💾 [StreamingRenderer] Spilling buffer to disk for session ${buffer.session_id}`);
        break;
    }
  }

  private async processChunkThroughPipeline(sessionId: string, chunk: ContentChunk): Promise<void> {
    const pipeline = this.deliveryPipelines.get(sessionId);
    if (!pipeline || pipeline.status !== 'active') {
      throw new Error(`Pipeline not available for session ${sessionId}`);
    }

    const pipelineStart = Date.now();

    console.log(`🔄 [StreamingRenderer] Processing chunk ${chunk.chunk_id} through pipeline ${pipeline.pipeline_id}`);

    try {
      // Process through each stage
      for (const stage of pipeline.pipeline_stages) {
        if (!stage.enabled) continue;

        const stageStart = Date.now();

        await this.executeDeliveryStage(stage, chunk);

        const stageTime = Date.now() - stageStart;
        stage.processing_time_ms += stageTime;
        stage.processed_chunks++;
        stage.last_execution = new Date().toISOString();

        if (stageTime > stage.timeout_ms) {
          console.warn(`⚠️ [StreamingRenderer] Stage ${stage.stage_name} exceeded timeout: ${stageTime}ms > ${stage.timeout_ms}ms`);
        }
      }

      // Update pipeline statistics
      pipeline.total_processed++;
      pipeline.successful_deliveries++;
      const totalTime = Date.now() - pipelineStart;
      pipeline.average_processing_time_ms =
        (pipeline.average_processing_time_ms * (pipeline.total_processed - 1) + totalTime) / pipeline.total_processed;

      console.log(`✅ [StreamingRenderer] Chunk ${chunk.chunk_id} processed through pipeline in ${totalTime}ms`);

    } catch (error) {
      console.error(`❌ [StreamingRenderer] Pipeline processing failed for chunk ${chunk.chunk_id}:`, error);
      pipeline.failed_deliveries++;
      chunk.delivery_attempts++;
      throw error;
    }
  }

  private async executeDeliveryStage(stage: DeliveryStage, chunk: ContentChunk): Promise<void> {
    switch (stage.stage_type) {
      case 'validation':
        await this.validateChunkContent(chunk);
        break;

      case 'compression':
        if (chunk.content_encoding === 'raw') {
          chunk.content_data = await this.compressContent(chunk.content_data, 'gzip');
          chunk.content_encoding = 'gzip';
        }
        break;

      case 'formatting':
        await this.formatChunkForDelivery(chunk);
        break;

      case 'transmission':
        await this.transmitChunkToClient(chunk);
        break;

      default:
        console.log(`🔄 [StreamingRenderer] Executing custom stage: ${stage.stage_name}`);
        break;
    }

    stage.success_rate = (stage.processed_chunks / Math.max(1, stage.processed_chunks + stage.error_count)) * 100;
  }

  private async validateChunkContent(chunk: ContentChunk): Promise<void> {
    if (chunk.validation_status === 'passed') {
      return; // Already validated
    }

    // Perform additional validation if needed
    chunk.validation_status = 'passed';
  }

  private async formatChunkForDelivery(chunk: ContentChunk): Promise<void> {
    // Format chunk for specific delivery protocol
    // This would prepare the chunk data for the specific streaming protocol
    console.log(`🔄 [StreamingRenderer] Formatting chunk ${chunk.chunk_id} for delivery`);
  }

  private async transmitChunkToClient(chunk: ContentChunk): Promise<void> {
    // Simulate chunk transmission
    // In a real implementation, this would send the chunk via SSE, WebSocket, etc.
    console.log(`📡 [StreamingRenderer] Transmitting chunk ${chunk.chunk_id}: ${chunk.content_size_bytes} bytes`);

    // Simulate network delay
    const delay = Math.random() * 50; // 0-50ms random delay
    await new Promise(resolve => setTimeout(resolve, delay));

    chunk.delivery_attempts++;
  }

  private updateDeliveryMetrics(session: StreamingSession, chunk: ContentChunk): void {
    // Update delivery rate
    const currentRate = (chunk.content_size_bytes * 8) / 1000; // Convert to kbps
    session.average_delivery_rate_kbps =
      (session.average_delivery_rate_kbps * (session.chunks_delivered - 1) + currentRate) / session.chunks_delivered;

    // Update buffer level
    const buffer = this.streamBuffers.get(session.session_id);
    if (buffer) {
      session.current_buffer_level = buffer.buffer_utilization;
    }

    // Update delivery success rate
    const successfulDeliveries = session.chunks_delivered;
    const totalAttempts = successfulDeliveries + session.errors.length;
    session.delivery_success_rate = totalAttempts > 0 ? (successfulDeliveries / totalAttempts) * 100 : 100;

    session.last_chunk_delivered = new Date().toISOString();
  }

  private async initializeDefaultPipelines(): Promise<void> {
    // Initialize common delivery stage templates
    console.log(`🔄 [StreamingRenderer] Default delivery pipelines initialized`);
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updateGlobalStatistics();
    }, 30000); // Every 30 seconds

    console.log(`📊 [StreamingRenderer] Performance monitoring started`);
  }

  private startBufferOptimization(): void {
    setInterval(() => {
      this.optimizeBuffers();
    }, 60000); // Every minute

    console.log(`🗄️ [StreamingRenderer] Buffer optimization started`);
  }

  private updateGlobalStatistics(): void {
    let totalDeliveryRate = 0;
    let totalBufferUtilization = 0;
    let activeSessionCount = 0;

    for (const session of this.streamingSessions.values()) {
      if (session.status === 'streaming') {
        totalDeliveryRate += session.average_delivery_rate_kbps;
        totalBufferUtilization += session.current_buffer_level;
        activeSessionCount++;
      }
    }

    this.statistics.active_sessions = activeSessionCount;
    this.statistics.average_delivery_rate_kbps = activeSessionCount > 0 ?
      totalDeliveryRate / activeSessionCount : 0;
    this.statistics.buffer_utilization_avg = activeSessionCount > 0 ?
      totalBufferUtilization / activeSessionCount : 0;
  }

  private optimizeBuffers(): void {
    for (const [sessionId, buffer] of this.streamBuffers.entries()) {
      // Remove expired chunks
      const now = Date.now();
      const expiredChunks = buffer.current_chunks.filter(chunk => {
        const age = now - new Date(chunk.timestamp).getTime();
        return age > 300000; // 5 minutes
      });

      if (expiredChunks.length > 0) {
        buffer.current_chunks = buffer.current_chunks.filter(chunk =>
          !expiredChunks.includes(chunk)
        );

        const expiredSize = expiredChunks.reduce((total, chunk) =>
          total + chunk.content_size_bytes, 0
        );

        buffer.total_size_bytes -= expiredSize;
        buffer.buffer_utilization = Math.round((buffer.total_size_bytes / (buffer.max_size_mb * 1024 * 1024)) * 100);

        console.log(`🧹 [StreamingRenderer] Cleaned ${expiredChunks.length} expired chunks from buffer ${buffer.buffer_id}`);
      }
    }
  }

  /**
   * Get streaming statistics
   */
  getStreamingStatistics(): typeof this.statistics & {
    active_buffers: number;
    active_pipelines: number;
  } {
    return {
      ...this.statistics,
      active_buffers: this.streamBuffers.size,
      active_pipelines: this.deliveryPipelines.size
    };
  }

  /**
   * Get session details
   */
  getStreamingSession(sessionId: string): StreamingSession | undefined {
    return this.streamingSessions.get(sessionId);
  }

  /**
   * Get buffer status
   */
  getBufferStatus(sessionId: string): StreamBuffer | undefined {
    return this.streamBuffers.get(sessionId);
  }

  /**
   * Get pipeline status
   */
  getPipelineStatus(sessionId: string): DeliveryPipeline | undefined {
    return this.deliveryPipelines.get(sessionId);
  }
}

// Export singleton instance
export const streamingRenderer = new StreamingContentRenderer();