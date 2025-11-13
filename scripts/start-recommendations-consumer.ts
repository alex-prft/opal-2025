#!/usr/bin/env tsx

/**
 * OPAL Recommendations Consumer Startup Script
 *
 * Starts the OPAL recommendations consumer to process decisions,
 * apply user preferences, and enhance recommendations.
 */

import { getRecommendationsConsumer } from '../src/lib/kafka/consumers/opal-recommendations-consumer';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class RecommendationsConsumerManager {
  private consumer: any;
  private isShuttingDown = false;

  constructor() {
    this.consumer = getRecommendationsConsumer();
    this.setupSignalHandlers();
  }

  private log(level: string, message: string, color: string = colors.reset) {
    const timestamp = new Date().toISOString();
    console.log(`${color}[${timestamp}] ${level}: ${message}${colors.reset}`);
  }

  private info(message: string) {
    this.log('INFO', message, colors.blue);
  }

  private success(message: string) {
    this.log('SUCCESS', message, colors.green);
  }

  private warning(message: string) {
    this.log('WARNING', message, colors.yellow);
  }

  private error(message: string) {
    this.log('ERROR', message, colors.red);
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    process.on('SIGINT', this.shutdown.bind(this));
    process.on('SIGTERM', this.shutdown.bind(this));
    process.on('SIGHUP', this.shutdown.bind(this));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.error(`Uncaught exception: ${error.message}`);
      console.error(error.stack);
      this.shutdown(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.error(`Unhandled rejection at ${promise}: ${reason}`);
      this.shutdown(1);
    });
  }

  /**
   * Start the recommendations consumer
   */
  async start(): Promise<void> {
    try {
      console.log(colors.bright + colors.blue + '🎯 OPAL Recommendations Consumer' + colors.reset);
      console.log('===================================\n');

      this.info('Starting OPAL Recommendations Consumer...');

      // Check environment
      const environment = process.env.NODE_ENV || 'development';
      this.info(`Environment: ${environment}`);

      // Start the consumer
      await this.consumer.start();

      this.success('🚀 Recommendations Consumer started successfully');

      // Set up health check reporting
      this.startHealthReporting();

      // Keep the process running
      this.info('💡 Press Ctrl+C to stop the consumer');

      // Display initial stats
      setTimeout(() => {
        this.displayStats();
      }, 5000);

    } catch (error) {
      this.error(`Failed to start Recommendations Consumer: ${error}`);
      process.exit(1);
    }
  }

  /**
   * Start periodic health reporting
   */
  private startHealthReporting(): void {
    // Report health every 30 seconds
    setInterval(() => {
      if (!this.isShuttingDown) {
        this.displayStats();
      }
    }, 30000);

    // Log recommendation metrics every 5 minutes
    setInterval(() => {
      if (!this.isShuttingDown) {
        this.logRecommendationMetrics();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Display current statistics
   */
  private displayStats(): void {
    try {
      const summary = this.consumer.getConsumerSummary();
      const health = this.consumer.healthCheck();

      console.log('\n' + colors.cyan + '📊 Recommendations Consumer Status:' + colors.reset);
      console.log(`   Status: ${health.status}`);
      console.log(`   Recommendations Processed: ${summary.totalRecommendationsProcessed}`);
      console.log(`   Decisions Processed: ${summary.totalDecisionsProcessed}`);
      console.log(`   Avg Processing Time: ${summary.averageProcessingTime}ms`);
      console.log(`   Enhancement Success Rate: ${summary.enhancementSuccessRate}%`);

      if (health.details && health.details.cacheSize !== undefined) {
        console.log(`   Preference Cache Size: ${health.details.cacheSize}`);
      }

    } catch (error) {
      this.error(`Error displaying stats: ${error}`);
    }
  }

  /**
   * Log detailed recommendation metrics
   */
  private logRecommendationMetrics(): void {
    try {
      const summary = this.consumer.getConsumerSummary();

      this.info('=== Recommendation Metrics ===');
      this.info(`Total Recommendations: ${summary.totalRecommendationsProcessed}`);
      this.info(`Total Decisions: ${summary.totalDecisionsProcessed}`);
      this.info(`Enhancement Success Rate: ${summary.enhancementSuccessRate}%`);
      this.info(`Average Processing Time: ${summary.averageProcessingTime}ms`);

      if (summary.recentActivity.length > 0) {
        this.info('Recent Activity:');
        summary.recentActivity.forEach((activity, index) => {
          const status = activity.success ? '✅' : '❌';
          this.info(`  ${status} ${activity.eventType} (${activity.processingTimeMs}ms)`);
        });
      }

    } catch (error) {
      this.error(`Error logging recommendation metrics: ${error}`);
    }
  }

  /**
   * Graceful shutdown
   */
  private async shutdown(exitCode: number = 0): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    this.warning('🛑 Shutting down Recommendations Consumer...');

    try {
      await this.consumer.stop();
      this.success('✅ Recommendations Consumer stopped gracefully');

      // Final metrics
      this.logRecommendationMetrics();

    } catch (error) {
      this.error(`Error during shutdown: ${error}`);
    }

    process.exit(exitCode);
  }
}

// Start the consumer manager
if (require.main === module) {
  const manager = new RecommendationsConsumerManager();
  manager.start().catch((error) => {
    console.error('Fatal error starting Recommendations Consumer:', error);
    process.exit(1);
  });
}