#!/usr/bin/env tsx

/**
 * OPAL Diagnostics Consumer Startup Script
 *
 * Starts the OPAL diagnostics consumer to monitor workflow health,
 * agent performance, and system reliability metrics.
 */

import { getDiagnosticsConsumer } from '../src/lib/kafka/consumers/opal-diagnostics-consumer';

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

class DiagnosticsConsumerManager {
  private consumer: any;
  private isShuttingDown = false;

  constructor() {
    this.consumer = getDiagnosticsConsumer();
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
   * Start the diagnostics consumer
   */
  async start(): Promise<void> {
    try {
      console.log(colors.bright + colors.blue + '🔍 OPAL Diagnostics Consumer' + colors.reset);
      console.log('================================\n');

      this.info('Starting OPAL Diagnostics Consumer...');

      // Check environment
      const environment = process.env.NODE_ENV || 'development';
      this.info(`Environment: ${environment}`);

      // Start the consumer
      await this.consumer.start();

      this.success('🚀 Diagnostics Consumer started successfully');

      // Set up health check reporting
      this.startHealthReporting();

      // Keep the process running
      this.info('💡 Press Ctrl+C to stop the consumer');

      // Display initial stats
      setTimeout(() => {
        this.displayStats();
      }, 5000);

    } catch (error) {
      this.error(`Failed to start Diagnostics Consumer: ${error}`);
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

    // Log diagnostic summary every 5 minutes
    setInterval(() => {
      if (!this.isShuttingDown) {
        this.logDiagnosticSummary();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Display current statistics
   */
  private displayStats(): void {
    try {
      const summary = this.consumer.getDiagnosticSummary();
      const health = this.consumer.healthCheck();

      console.log('\n' + colors.cyan + '📊 Diagnostics Consumer Status:' + colors.reset);
      console.log(`   Status: ${health.status}`);
      console.log(`   Events Processed: ${summary.totalEventsProcessed}`);
      console.log(`   Errors: ${summary.totalErrors}`);
      console.log(`   Avg Processing Time: ${Math.round(summary.processingTimes.average)}ms`);
      console.log(`   Uptime: ${Math.round(summary.uptime / 1000)}s`);

      if (summary.totalErrors > 0) {
        const errorRate = ((summary.totalErrors / summary.totalEventsProcessed) * 100).toFixed(2);
        this.warning(`Error Rate: ${errorRate}%`);
      }

    } catch (error) {
      this.error(`Error displaying stats: ${error}`);
    }
  }

  /**
   * Log detailed diagnostic summary
   */
  private logDiagnosticSummary(): void {
    try {
      const summary = this.consumer.getDiagnosticSummary();

      this.info('=== Diagnostic Summary ===');
      this.info(`Total Events: ${summary.totalEventsProcessed}`);
      this.info(`Processing Times - Avg: ${Math.round(summary.processingTimes.average)}ms, Min: ${summary.processingTimes.min}ms, Max: ${summary.processingTimes.max}ms`);

      if (Object.keys(summary.topicStats).length > 0) {
        this.info('Topic Breakdown:');
        for (const [topic, stats] of Object.entries(summary.topicStats)) {
          this.info(`  ${topic}: ${stats.processed} events, ${stats.errors} errors`);
        }
      }

    } catch (error) {
      this.error(`Error logging diagnostic summary: ${error}`);
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
    this.warning('🛑 Shutting down Diagnostics Consumer...');

    try {
      await this.consumer.stop();
      this.success('✅ Diagnostics Consumer stopped gracefully');

      // Final stats
      this.logDiagnosticSummary();

    } catch (error) {
      this.error(`Error during shutdown: ${error}`);
    }

    process.exit(exitCode);
  }
}

// Start the consumer manager
if (require.main === module) {
  const manager = new DiagnosticsConsumerManager();
  manager.start().catch((error) => {
    console.error('Fatal error starting Diagnostics Consumer:', error);
    process.exit(1);
  });
}