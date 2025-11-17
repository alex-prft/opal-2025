/**
 * Integration Validation Monitoring & Alerting System
 * 
 * Provides automated monitoring and alerting for OPAL integration validation results.
 * Triggers alerts when validation status reaches yellow or red conditions.
 */

export interface AlertCondition {
  id: string;
  name: string;
  condition: 'yellow' | 'red';
  threshold?: number;
  description: string;
  enabled: boolean;
}

export interface AlertEvent {
  id: string;
  condition_id: string;
  trigger_time: string;
  validation_id: string;
  status: 'yellow' | 'red';
  message: string;
  details: any;
  acknowledged: boolean;
  resolved: boolean;
}

export interface MonitoringConfig {
  enabled: boolean;
  check_interval_ms: number;
  alert_conditions: AlertCondition[];
  notification_channels: {
    email: boolean;
    webhook: boolean;
    console: boolean;
  };
  webhook_url?: string;
  email_recipients?: string[];
}

// Default monitoring configuration
export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  enabled: true,
  check_interval_ms: 30000, // Check every 30 seconds
  alert_conditions: [
    {
      id: 'validation_failure',
      name: 'Validation Failure (Red Status)',
      condition: 'red',
      description: 'Triggers when any validation results in red (critical failure) status',
      enabled: true
    },
    {
      id: 'validation_warning',
      name: 'Validation Warning (Yellow Status)',
      condition: 'yellow',
      description: 'Triggers when validation results in yellow (warning) status',
      enabled: true
    },
    {
      id: 'repeated_failures',
      name: 'Repeated Failures',
      condition: 'red',
      threshold: 3,
      description: 'Triggers when 3 or more consecutive validations fail',
      enabled: true
    },
    {
      id: 'success_rate_low',
      name: 'Low Success Rate',
      condition: 'yellow',
      threshold: 70,
      description: 'Triggers when success rate drops below 70% in the last hour',
      enabled: true
    }
  ],
  notification_channels: {
    email: false, // Disabled by default - requires SMTP configuration
    webhook: false, // Disabled by default - requires webhook URL
    console: true // Always log to console for development
  }
};

export class IntegrationAlertManager {
  private config: MonitoringConfig;
  private activeAlerts: Map<string, AlertEvent> = new Map();
  private monitoringInterval?: NodeJS.Timeout;

  constructor(config: MonitoringConfig = DEFAULT_MONITORING_CONFIG) {
    this.config = config;
  }

  /**
   * Start the monitoring system
   */
  startMonitoring(): void {
    if (!this.config.enabled) {
      console.log('[IntegrationAlerts] Monitoring is disabled');
      return;
    }

    if (this.monitoringInterval) {
      console.log('[IntegrationAlerts] Monitoring already running');
      return;
    }

    console.log(`[IntegrationAlerts] Starting monitoring with ${this.config.check_interval_ms}ms interval`);
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkValidationStatus();
      } catch (error) {
        console.error('[IntegrationAlerts] Monitoring check failed:', error);
      }
    }, this.config.check_interval_ms);

    // Run initial check
    this.checkValidationStatus();
  }

  /**
   * Stop the monitoring system
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      console.log('[IntegrationAlerts] Monitoring stopped');
    }
  }

  /**
   * Check current validation status and trigger alerts if needed
   */
  private async checkValidationStatus(): Promise<void> {
    try {
      // Fetch recent validation results
      const response = await fetch('/api/admin/osa/integration-status?limit=20');
      if (!response.ok) {
        throw new Error(`Failed to fetch validation status: ${response.status}`);
      }

      const data = await response.json();
      const validations = data.validations || [];

      if (validations.length === 0) {
        return; // No validations to check
      }

      // Check each alert condition
      for (const condition of this.config.alert_conditions) {
        if (!condition.enabled) continue;

        await this.evaluateAlertCondition(condition, validations);
      }

    } catch (error) {
      console.error('[IntegrationAlerts] Status check failed:', error);
    }
  }

  /**
   * Evaluate a specific alert condition against validation data
   */
  private async evaluateAlertCondition(condition: AlertCondition, validations: any[]): Promise<void> {
    const latestValidation = validations[0];
    
    switch (condition.id) {
      case 'validation_failure':
        if (latestValidation.overall_status === 'red') {
          await this.triggerAlert(condition, latestValidation, 
            `Critical validation failure detected for workflow ${latestValidation.force_sync_workflow_id}`
          );
        }
        break;

      case 'validation_warning':
        if (latestValidation.overall_status === 'yellow') {
          await this.triggerAlert(condition, latestValidation, 
            `Validation warning detected for workflow ${latestValidation.force_sync_workflow_id}`
          );
        }
        break;

      case 'repeated_failures':
        const recentFailures = validations.slice(0, condition.threshold || 3);
        const allRed = recentFailures.every(v => v.overall_status === 'red');
        if (allRed && recentFailures.length >= (condition.threshold || 3)) {
          await this.triggerAlert(condition, latestValidation, 
            `${condition.threshold || 3} consecutive validation failures detected`
          );
        }
        break;

      case 'success_rate_low':
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentValidations = validations.filter(v => 
          new Date(v.created_at) > oneHourAgo
        );
        
        if (recentValidations.length > 0) {
          const successCount = recentValidations.filter(v => v.overall_status === 'green').length;
          const successRate = (successCount / recentValidations.length) * 100;
          
          if (successRate < (condition.threshold || 70)) {
            await this.triggerAlert(condition, latestValidation, 
              `Success rate dropped to ${Math.round(successRate)}% (${successCount}/${recentValidations.length} validations in last hour)`
            );
          }
        }
        break;
    }
  }

  /**
   * Trigger an alert for a specific condition
   */
  private async triggerAlert(condition: AlertCondition, validation: any, message: string): Promise<void> {
    const alertId = `${condition.id}_${validation.id}_${Date.now()}`;
    const existingAlertKey = `${condition.id}_${validation.force_sync_workflow_id}`;
    
    // Avoid duplicate alerts for the same condition and workflow
    if (this.activeAlerts.has(existingAlertKey)) {
      return;
    }

    const alertEvent: AlertEvent = {
      id: alertId,
      condition_id: condition.id,
      trigger_time: new Date().toISOString(),
      validation_id: validation.id,
      status: condition.condition,
      message,
      details: {
        workflow_id: validation.force_sync_workflow_id,
        correlation_id: validation.opal_correlation_id,
        overall_status: validation.overall_status,
        validation_summary: validation.validation_summary,
        layer_statuses: {
          layer_1: validation.layer_1_status,
          layer_2: validation.layer_2_status,
          layer_3: validation.layer_3_status,
          layer_4: validation.layer_4_status
        }
      },
      acknowledged: false,
      resolved: false
    };

    // Store the alert
    this.activeAlerts.set(existingAlertKey, alertEvent);

    // Send notifications
    await this.sendNotifications(alertEvent);

    // Auto-resolve single validation alerts after 5 minutes
    if (condition.id === 'validation_failure' || condition.id === 'validation_warning') {
      setTimeout(() => {
        this.resolveAlert(existingAlertKey);
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Send alert notifications through configured channels
   */
  private async sendNotifications(alert: AlertEvent): Promise<void> {
    const { notification_channels } = this.config;

    // Console notification (always enabled for development)
    if (notification_channels.console) {
      const emoji = alert.status === 'red' ? '🚨' : '⚠️';
      console.log(`${emoji} [IntegrationAlert] ${alert.message}`);
      console.log('Alert Details:', {
        id: alert.id,
        condition: alert.condition_id,
        time: alert.trigger_time,
        validation_id: alert.validation_id,
        workflow_id: alert.details.workflow_id
      });
    }

    // Webhook notification
    if (notification_channels.webhook && this.config.webhook_url) {
      try {
        await fetch(this.config.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'opal_integration_alert',
            alert,
            timestamp: new Date().toISOString()
          })
        });
      } catch (error) {
        console.error('[IntegrationAlerts] Webhook notification failed:', error);
      }
    }

    // Email notification (placeholder - requires SMTP setup)
    if (notification_channels.email && this.config.email_recipients) {
      console.log(`[IntegrationAlerts] Email notification would be sent to: ${this.config.email_recipients.join(', ')}`);
      console.log(`Subject: OPAL Integration Alert - ${alert.status.toUpperCase()}`);
      console.log(`Message: ${alert.message}`);
    }
  }

  /**
   * Resolve an active alert
   */
  resolveAlert(alertKey: string): void {
    const alert = this.activeAlerts.get(alertKey);
    if (alert) {
      alert.resolved = true;
      console.log(`[IntegrationAlerts] Alert resolved: ${alert.id}`);
      this.activeAlerts.delete(alertKey);
    }
  }

  /**
   * Acknowledge an active alert
   */
  acknowledgeAlert(alertKey: string): void {
    const alert = this.activeAlerts.get(alertKey);
    if (alert) {
      alert.acknowledged = true;
      console.log(`[IntegrationAlerts] Alert acknowledged: ${alert.id}`);
    }
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): AlertEvent[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.monitoringInterval) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * Get current monitoring configuration
   */
  getConfig(): MonitoringConfig {
    return { ...this.config };
  }
}

// Global alert manager instance
let globalAlertManager: IntegrationAlertManager | null = null;

/**
 * Get or create the global alert manager instance
 */
export function getAlertManager(): IntegrationAlertManager {
  if (!globalAlertManager) {
    globalAlertManager = new IntegrationAlertManager();
  }
  return globalAlertManager;
}

/**
 * Initialize monitoring with custom configuration
 */
export function initializeMonitoring(config?: Partial<MonitoringConfig>): IntegrationAlertManager {
  const alertManager = getAlertManager();
  
  if (config) {
    alertManager.updateConfig(config);
  }
  
  alertManager.startMonitoring();
  return alertManager;
}

/**
 * Shutdown monitoring system
 */
export function shutdownMonitoring(): void {
  if (globalAlertManager) {
    globalAlertManager.stopMonitoring();
  }
}