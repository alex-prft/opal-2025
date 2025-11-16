#!/usr/bin/env node

/**
 * Strategy Workflow Activity Monitor
 *
 * Monitors for strategy_workflow agent activity and OSA data reception
 * Generates alerts when no activity is detected for extended periods
 */

const fs = require('fs').promises;
const path = require('path');

class StrategyWorkflowMonitor {
  constructor() {
    this.monitoringStarted = new Date().toISOString();
    this.checkIntervalMs = 30000; // Check every 30 seconds
    this.alertThresholdHours = 1; // Alert if no activity for 1 hour
    this.logFile = path.join(__dirname, '..', 'logs', 'strategy-workflow-monitor.log');
    this.lastActivityFile = path.join(__dirname, '..', 'data', 'last-strategy-activity.json');
  }

  async initialize() {
    console.log('🔍 [Strategy Monitor] Initializing monitoring system...');

    // Ensure log directory exists
    await fs.mkdir(path.dirname(this.logFile), { recursive: true });
    await fs.mkdir(path.dirname(this.lastActivityFile), { recursive: true });

    // Log startup
    await this.log('Monitor started', {
      monitoring_started: this.monitoringStarted,
      check_interval_ms: this.checkIntervalMs,
      alert_threshold_hours: this.alertThresholdHours
    });

    console.log('✅ [Strategy Monitor] Initialized successfully');
  }

  async checkOSAActivity() {
    try {
      // Check OSA workflow data reception
      const response = await fetch('http://localhost:3000/api/webhook-events/stats?hours=24');
      const statsData = await response.json();

      if (statsData.success && statsData.osaWorkflowData) {
        const osaData = statsData.osaWorkflowData;

        if (osaData.lastOSAToolExecution) {
          const lastActivity = new Date(osaData.lastOSAToolExecution);
          const now = new Date();
          const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);

          await this.recordActivity('osa_tool_execution', {
            last_execution: osaData.lastOSAToolExecution,
            total_executions: osaData.totalOSAToolExecutions,
            successful_receptions: osaData.successfulReceptions,
            hours_since_activity: hoursSinceActivity
          });

          if (hoursSinceActivity > this.alertThresholdHours) {
            await this.generateAlert('no_osa_activity', {
              hours_since_activity: hoursSinceActivity,
              last_execution: osaData.lastOSAToolExecution
            });
          }
        } else {
          await this.generateAlert('no_osa_data', {
            message: 'No OSA tool executions found in the system'
          });
        }
      }

      // Check for strategy_workflow specific events
      const eventsResponse = await fetch('http://localhost:3000/api/diagnostics/last-webhook?limit=100&hours=24');
      const eventsData = await eventsResponse.json();

      if (eventsData.success && eventsData.data.events) {
        const strategyEvents = eventsData.data.events.filter(event =>
          event.workflow_name === 'strategy_workflow' ||
          event.agent_id === 'strategy_workflow' ||
          (event.workflow_name && event.workflow_name.toLowerCase().includes('strategy'))
        );

        if (strategyEvents.length > 0) {
          const lastEvent = strategyEvents[0];
          await this.recordActivity('strategy_workflow_event', {
            event_id: lastEvent.id,
            event_type: lastEvent.event_type,
            timestamp: lastEvent.timestamp,
            workflow_id: lastEvent.workflow_id
          });
        }
      }

    } catch (error) {
      await this.log('Error checking OSA activity', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  async checkWorkflowOrchestration() {
    try {
      // Check for any workflow orchestration activity
      const response = await fetch('http://localhost:3000/api/opal/force-sync-status?hours=24');
      const forceSyncData = await response.json();

      if (forceSyncData.lastForceSync) {
        const lastSync = new Date(forceSyncData.lastForceSync);
        const now = new Date();
        const hoursSinceSync = (now - lastSync) / (1000 * 60 * 60);

        await this.recordActivity('force_sync_detected', {
          last_sync: forceSyncData.lastForceSync,
          workflow_id: forceSyncData.forceSyncWorkflowId,
          success: forceSyncData.forceSyncSuccess,
          agent_count: forceSyncData.forceSyncAgentCount,
          hours_since_sync: hoursSinceSync
        });

        if (hoursSinceSync > this.alertThresholdHours * 6) { // 6 hour threshold for force sync
          await this.generateAlert('stale_force_sync', {
            hours_since_sync: hoursSinceSync,
            last_sync: forceSyncData.lastForceSync
          });
        }
      }

    } catch (error) {
      await this.log('Error checking workflow orchestration', {
        error: error.message
      });
    }
  }

  async recordActivity(activityType, details) {
    const activity = {
      type: activityType,
      timestamp: new Date().toISOString(),
      details: details
    };

    // Update last activity file
    try {
      await fs.writeFile(this.lastActivityFile, JSON.stringify(activity, null, 2));
    } catch (error) {
      console.error('Failed to record activity:', error);
    }

    await this.log('Activity detected', activity);
    console.log(`📊 [Strategy Monitor] ${activityType}:`, details);
  }

  async generateAlert(alertType, details) {
    const alert = {
      type: alertType,
      severity: 'warning',
      timestamp: new Date().toISOString(),
      details: details
    };

    await this.log('Alert generated', alert);
    console.log(`⚠️ [Strategy Monitor] ALERT - ${alertType}:`, details);

    // In a production system, this would send notifications (email, Slack, etc.)
    return alert;
  }

  async log(message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message: message,
      data: data
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    try {
      await fs.appendFile(this.logFile, logLine);
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  async getLastActivity() {
    try {
      const data = await fs.readFile(this.lastActivityFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async generateReport() {
    const lastActivity = await this.getLastActivity();
    const now = new Date();

    const report = {
      monitoring_status: 'active',
      monitoring_since: this.monitoringStarted,
      last_check: now.toISOString(),
      last_activity: lastActivity,
      recommendations: []
    };

    if (!lastActivity) {
      report.recommendations.push('No strategy_workflow activity detected since monitoring started');
    } else {
      const hoursSinceActivity = (now - new Date(lastActivity.timestamp)) / (1000 * 60 * 60);

      if (hoursSinceActivity > this.alertThresholdHours) {
        report.recommendations.push(`No activity for ${hoursSinceActivity.toFixed(1)} hours - consider checking OPAL agent status`);
      } else {
        report.recommendations.push('Strategy workflow activity detected recently');
      }
    }

    console.log('📋 [Strategy Monitor] Status Report:');
    console.log(JSON.stringify(report, null, 2));
    return report;
  }

  async startMonitoring() {
    console.log('🚀 [Strategy Monitor] Starting continuous monitoring...');
    console.log(`⏱️ [Strategy Monitor] Check interval: ${this.checkIntervalMs}ms`);
    console.log(`⚠️ [Strategy Monitor] Alert threshold: ${this.alertThresholdHours} hours`);

    // Initial check
    await this.checkOSAActivity();
    await this.checkWorkflowOrchestration();

    // Set up interval monitoring
    setInterval(async () => {
      try {
        await this.checkOSAActivity();
        await this.checkWorkflowOrchestration();
      } catch (error) {
        await this.log('Monitoring check failed', { error: error.message });
      }
    }, this.checkIntervalMs);

    // Generate report every hour
    setInterval(async () => {
      await this.generateReport();
    }, 60 * 60 * 1000); // Every hour

    console.log('✅ [Strategy Monitor] Monitoring started successfully');
  }
}

// Run monitor if called directly
if (require.main === module) {
  const monitor = new StrategyWorkflowMonitor();

  monitor.initialize().then(() => {
    return monitor.startMonitoring();
  }).catch(error => {
    console.error('❌ [Strategy Monitor] Failed to start:', error);
    process.exit(1);
  });

  // Generate immediate report
  setTimeout(async () => {
    await monitor.generateReport();
  }, 5000);
}

module.exports = { StrategyWorkflowMonitor };