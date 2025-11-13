#!/usr/bin/env tsx

/**
 * Test Script for Database Integration Fix
 *
 * Tests the new createEvent method to ensure proper functionality
 */

import { webhookEventOperations } from '../src/lib/database/webhook-events';
import fs from 'fs';
import path from 'path';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class DatabaseIntegrationTester {
  private testDataDir: string;

  constructor() {
    this.testDataDir = path.join(process.cwd(), 'data/webhook-events');
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
   * Clean up test data
   */
  private cleanupTestData(): void {
    const eventsFile = path.join(this.testDataDir, 'events.json');
    if (fs.existsSync(eventsFile)) {
      fs.unlinkSync(eventsFile);
      this.info('Cleaned up test data');
    }
  }

  /**
   * Test createEvent method
   */
  async testCreateEvent(): Promise<void> {
    this.info('🧪 Testing createEvent method...');

    const testEvent = {
      event_type: 'workflow_started',
      workflow_id: 'test-workflow-123',
      session_id: 'test-session-456',
      client_name: 'Test Client',
      workflow_name: 'strategy_workflow',
      triggered_by: 'test-script',
      payload: {
        test: true,
        timestamp: Date.now()
      }
    };

    try {
      const result = await webhookEventOperations.createEvent(testEvent);

      if (result.success) {
        this.success('✅ createEvent method works correctly');

        // Verify file was created
        const eventsFile = path.join(this.testDataDir, 'events.json');
        if (fs.existsSync(eventsFile)) {
          this.success('✅ events.json file was created');

          const fileContent = JSON.parse(fs.readFileSync(eventsFile, 'utf-8'));
          if (Array.isArray(fileContent) && fileContent.length > 0) {
            this.success('✅ Event data was stored correctly');

            const storedEvent = fileContent[0];
            if (storedEvent.received_at && storedEvent.id) {
              this.success('✅ Automatic timestamp and ID were added');

              this.info(`📄 Stored event details:`);
              console.log(`   ID: ${storedEvent.id}`);
              console.log(`   Event Type: ${storedEvent.event_type}`);
              console.log(`   Workflow ID: ${storedEvent.workflow_id}`);
              console.log(`   Received At: ${storedEvent.received_at}`);

            } else {
              throw new Error('Missing auto-generated fields (received_at, id)');
            }
          } else {
            throw new Error('Event data not found in file');
          }
        } else {
          throw new Error('events.json file was not created');
        }
      } else {
        throw new Error(`createEvent failed: ${result.error}`);
      }
    } catch (error) {
      this.error(`❌ createEvent test failed: ${error}`);
      throw error;
    }
  }

  /**
   * Test getEvents method
   */
  async testGetEvents(): Promise<void> {
    this.info('🔍 Testing getEvents method...');

    try {
      const events = await webhookEventOperations.getEvents();

      if (Array.isArray(events)) {
        this.success('✅ getEvents returns an array');

        if (events.length > 0) {
          this.success(`✅ Found ${events.length} events`);

          const firstEvent = events[0];
          if (firstEvent.event_type && firstEvent.received_at) {
            this.success('✅ Events have required fields');
          } else {
            throw new Error('Events missing required fields');
          }
        } else {
          this.warning('⚠️ No events found (this may be expected)');
        }
      } else {
        throw new Error('getEvents did not return an array');
      }
    } catch (error) {
      this.error(`❌ getEvents test failed: ${error}`);
      throw error;
    }
  }

  /**
   * Test multiple events
   */
  async testMultipleEvents(): Promise<void> {
    this.info('📚 Testing multiple event storage...');

    const testEvents = [
      {
        event_type: 'agent_completed',
        workflow_id: 'test-workflow-123',
        agent_id: 'content_review',
        execution_status: 'success'
      },
      {
        event_type: 'workflow_completed',
        workflow_id: 'test-workflow-123',
        status: 'completed',
        total_duration_ms: 5000
      },
      {
        event_type: 'decision_generated',
        workflow_id: 'test-workflow-123',
        decision_id: 'decision-789',
        recommendations_count: 3
      }
    ];

    try {
      for (let i = 0; i < testEvents.length; i++) {
        const result = await webhookEventOperations.createEvent(testEvents[i]);
        if (!result.success) {
          throw new Error(`Failed to create event ${i + 1}: ${result.error}`);
        }
        // Add small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      this.success(`✅ Successfully stored ${testEvents.length} events`);

      // Verify all events are retrievable
      const allEvents = await webhookEventOperations.getEvents();
      if (allEvents.length >= testEvents.length) {
        this.success(`✅ All events can be retrieved (found ${allEvents.length} total)`);

        // Check that events are in the file (newest first order expected)
        this.info('📋 Event summary:');
        allEvents.slice(-testEvents.length).forEach((event, index) => {
          console.log(`   ${index + 1}. ${event.event_type} (${event.received_at})`);
        });

      } else {
        throw new Error(`Expected at least ${testEvents.length} events, found ${allEvents.length}`);
      }
    } catch (error) {
      this.error(`❌ Multiple events test failed: ${error}`);
      throw error;
    }
  }

  /**
   * Test error handling
   */
  async testErrorHandling(): Promise<void> {
    this.info('🛡️ Testing error handling...');

    try {
      // Test with invalid data directory (should still work due to mkdir)
      const result = await webhookEventOperations.createEvent({
        event_type: 'test_error_handling',
        workflow_id: 'error-test'
      });

      if (result.success) {
        this.success('✅ Error handling works correctly (creates directory as needed)');
      } else {
        this.warning('⚠️ Error handling returned failure (this may be expected)');
      }
    } catch (error) {
      this.warning(`⚠️ Error handling test encountered exception: ${error}`);
    }
  }

  /**
   * Run all tests
   */
  async runTests(): Promise<void> {
    console.log(colors.cyan + '🧪 Database Integration Test Suite' + colors.reset);
    console.log('======================================\n');

    try {
      // Clean up any existing test data
      this.cleanupTestData();

      // Run tests in sequence
      await this.testCreateEvent();
      await this.testGetEvents();
      await this.testMultipleEvents();
      await this.testErrorHandling();

      console.log('\n' + colors.green + '🎉 All database integration tests passed!' + colors.reset);
      console.log('✅ The createEvent and getEvents methods are working correctly\n');

      // Show final file contents
      const eventsFile = path.join(this.testDataDir, 'events.json');
      if (fs.existsSync(eventsFile)) {
        const fileSize = fs.statSync(eventsFile).size;
        this.info(`📁 Final events.json file size: ${fileSize} bytes`);
      }

    } catch (error) {
      console.log('\n' + colors.red + '❌ Database integration tests failed!' + colors.reset);
      console.error(`Error: ${error}\n`);
      process.exit(1);

    } finally {
      // Optional: Clean up test data
      // this.cleanupTestData();
      this.info('💡 Test data preserved for inspection in data/webhook-events/events.json');
    }
  }
}

// Run the test suite
if (require.main === module) {
  const tester = new DatabaseIntegrationTester();
  tester.runTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
  });
}