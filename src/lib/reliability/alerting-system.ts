/**
 * Alerting System for OPAL Integration Failures
 * Monitors system health and sends alerts for critical issues
 */

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertCategory = 'opal_failure' | 'circuit_breaker' | 'connectivity' | 'timeout' | 'authentication' | 'system';

export interface Alert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  details: Record<string, any>;
  timestamp: string;
  correlationId?: string;
  source: string;
  resolved: boolean;
  resolvedAt?: string;
  occurrenceCount: number;
  firstOccurrence: string;
  lastOccurrence: string;
}

export interface AlertRule {
  id: string;
  name: string;
  category: AlertCategory;
  severity: AlertSeverity;
  condition: (event: AlertEvent) => boolean;
  throttlePeriod: number; // ms
  description: string;
  enabled: boolean;
}

export interface AlertEvent {
  type: string;
  category: AlertCategory;
  message: string;
  details: Record<string, any>;
  correlationId?: string;
  source: string;
  timestamp: string;
}

export interface AlertingConfig {
  /** Enable/disable alerting system */
  enabled?: boolean;
  /** Maximum alerts to keep in memory */
  maxAlerts?: number;
  /** Auto-resolve alerts after this duration (ms) */
  autoResolveAfter?: number;
  /** Enable console logging of alerts */
  enableConsoleLogging?: boolean;
  /** Enable webhook notifications */
  enableWebhooks?: boolean;
  /** Webhook URL for external alerting */
  webhookUrl?: string;
}

export class AlertingSystem {
  private alerts = new Map<string, Alert>();
  private alertRules = new Map<string, AlertRule>();
  private alertCounts = new Map<string, number>();
  private lastAlertTimes = new Map<string, number>();

  private readonly config: Required<AlertingConfig>;
  private alertIdCounter = 0;

  constructor(config: AlertingConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      maxAlerts: config.maxAlerts ?? 100,
      autoResolveAfter: config.autoResolveAfter ?? 24 * 60 * 60 * 1000, // 24 hours
      enableConsoleLogging: config.enableConsoleLogging ?? true,
      enableWebhooks: config.enableWebhooks ?? false,
      webhookUrl: config.webhookUrl ?? ''
    };

    console.log(`🚨 [Alerting] System initialized`, {
      enabled: this.config.enabled,
      maxAlerts: this.config.maxAlerts,
      autoResolveAfter: this.config.autoResolveAfter
    });

    // Setup default alert rules
    this.setupDefaultRules();

    // Setup periodic cleanup
    setInterval(() => {
      this.cleanupOldAlerts();
    }, 60 * 60 * 1000); // Cleanup every hour
  }

  /**
   * Process an alert event
   */
  processEvent(event: AlertEvent): Alert | null {
    if (!this.config.enabled) {
      return null;
    }

    // Check all alert rules
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      if (rule.condition(event)) {
        return this.triggerAlert(rule, event);
      }
    }

    return null;
  }

  /**
   * Trigger an alert based on a rule and event
   */
  private triggerAlert(rule: AlertRule, event: AlertEvent): Alert {
    const ruleKey = `${rule.id}:${event.correlationId || 'global'}`;
    const now = Date.now();

    // Check throttling
    const lastAlertTime = this.lastAlertTimes.get(ruleKey) || 0;
    if (now - lastAlertTime < rule.throttlePeriod) {
      // Update occurrence count for existing alert
      const existingAlerts = Array.from(this.alerts.values()).filter(
        alert => alert.category === rule.category &&
                 alert.correlationId === event.correlationId &&
                 !alert.resolved
      );

      if (existingAlerts.length > 0) {
        const alert = existingAlerts[0];
        alert.occurrenceCount++;
        alert.lastOccurrence = event.timestamp;

        console.log(`🔔 [Alerting] Alert occurrence updated`, {
          id: alert.id,
          count: alert.occurrenceCount,
          category: alert.category
        });

        return alert;
      }
    }

    // Create new alert
    const alertId = `alert-${++this.alertIdCounter}-${Date.now()}`;
    const alert: Alert = {
      id: alertId,
      category: rule.category,
      severity: rule.severity,
      title: `OPAL ${rule.category.replace('_', ' ').toUpperCase()}: ${rule.name}`,
      message: event.message,
      details: {
        ...event.details,
        ruleName: rule.name,
        ruleDescription: rule.description
      },
      timestamp: event.timestamp,
      correlationId: event.correlationId,
      source: event.source,
      resolved: false,
      occurrenceCount: 1,
      firstOccurrence: event.timestamp,
      lastOccurrence: event.timestamp
    };

    // Store alert
    this.alerts.set(alertId, alert);
    this.lastAlertTimes.set(ruleKey, now);

    // Log alert
    if (this.config.enableConsoleLogging) {
      this.logAlert(alert);
    }

    // Send webhook notification
    if (this.config.enableWebhooks && this.config.webhookUrl) {
      this.sendWebhookNotification(alert).catch(error => {
        console.error(`❌ [Alerting] Webhook notification failed:`, error);
      });
    }

    // Cleanup if we have too many alerts
    this.enforceMaxAlerts();

    console.log(`🚨 [Alerting] Alert triggered`, {
      id: alertId,
      category: rule.category,
      severity: rule.severity,
      correlationId: event.correlationId
    });

    return alert;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string, reason = 'Manual resolution'): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.resolved) {
      return false;
    }

    alert.resolved = true;
    alert.resolvedAt = new Date().toISOString();
    alert.details.resolutionReason = reason;

    console.log(`✅ [Alerting] Alert resolved`, {
      id: alertId,
      reason,
      duration: Date.now() - new Date(alert.timestamp).getTime()
    });

    return true;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Get alerts by category
   */
  getAlertsByCategory(category: AlertCategory): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.category === category);
  }

  /**
   * Get alert statistics
   */
  getStats() {
    const allAlerts = Array.from(this.alerts.values());
    const activeAlerts = allAlerts.filter(alert => !alert.resolved);

    const by_severity = allAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<AlertSeverity, number>);

    const by_category = allAlerts.reduce((acc, alert) => {
      acc[alert.category] = (acc[alert.category] || 0) + 1;
      return acc;
    }, {} as Record<AlertCategory, number>);

    return {
      totalAlerts: allAlerts.length,
      activeAlerts: activeAlerts.length,
      resolvedAlerts: allAlerts.length - activeAlerts.length,
      by_severity,
      by_category,
      rules: {
        total: this.alertRules.size,
        enabled: Array.from(this.alertRules.values()).filter(rule => rule.enabled).length
      }
    };
  }

  /**
   * Setup default alerting rules
   */
  private setupDefaultRules(): void {
    const rules: AlertRule[] = [
      {
        id: 'opal_webhook_failure',
        name: 'OPAL Webhook Call Failed',
        category: 'opal_failure',
        severity: 'high',
        throttlePeriod: 5 * 60 * 1000, // 5 minutes
        description: 'OPAL webhook API call failed',
        enabled: true,
        condition: (event) =>
          event.type === 'opal_webhook_failed' ||
          event.message.toLowerCase().includes('opal webhook failed')
      },

      {
        id: 'opal_authentication_failure',
        name: 'OPAL Authentication Failed',
        category: 'authentication',
        severity: 'critical',
        throttlePeriod: 10 * 60 * 1000, // 10 minutes
        description: 'OPAL API authentication or authorization failed',
        enabled: true,
        condition: (event) =>
          event.type === 'opal_auth_failed' ||
          event.message.includes('401') ||
          event.message.includes('403') ||
          event.message.toLowerCase().includes('unauthorized')
      },

      {
        id: 'circuit_breaker_opened',
        name: 'Circuit Breaker Opened',
        category: 'circuit_breaker',
        severity: 'high',
        throttlePeriod: 15 * 60 * 1000, // 15 minutes
        description: 'Circuit breaker opened due to repeated failures',
        enabled: true,
        condition: (event) =>
          event.type === 'circuit_breaker_opened' ||
          event.message.toLowerCase().includes('circuit breaker') &&
          event.message.toLowerCase().includes('open')
      },

      {
        id: 'opal_timeout',
        name: 'OPAL Request Timeout',
        category: 'timeout',
        severity: 'medium',
        throttlePeriod: 10 * 60 * 1000, // 10 minutes
        description: 'OPAL API request timed out',
        enabled: true,
        condition: (event) =>
          event.type === 'opal_timeout' ||
          event.message.toLowerCase().includes('timeout') ||
          event.message.toLowerCase().includes('timed out')
      },

      {
        id: 'connectivity_failure',
        name: 'OPAL Connectivity Failure',
        category: 'connectivity',
        severity: 'medium',
        throttlePeriod: 5 * 60 * 1000, // 5 minutes
        description: 'Network connectivity issue with OPAL API',
        enabled: true,
        condition: (event) =>
          event.type === 'connectivity_failure' ||
          event.message.includes('fetch failed') ||
          event.message.includes('ECONNRESET') ||
          event.message.includes('ENOTFOUND')
      },

      {
        id: 'multiple_failures',
        name: 'Multiple OPAL Failures',
        category: 'system',
        severity: 'critical',
        throttlePeriod: 30 * 60 * 1000, // 30 minutes
        description: 'Multiple OPAL failures in short time period',
        enabled: true,
        condition: (event) => {
          if (!event.correlationId) return false;

          const recentAlerts = Array.from(this.alerts.values()).filter(
            alert => alert.correlationId === event.correlationId &&
                     Date.now() - new Date(alert.timestamp).getTime() < 10 * 60 * 1000 && // Last 10 minutes
                     alert.category === 'opal_failure'
          );

          return recentAlerts.length >= 3;
        }
      }
    ];

    rules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });

    console.log(`📋 [Alerting] Loaded ${rules.length} default rules`);
  }

  /**
   * Log alert to console with appropriate formatting
   */
  private logAlert(alert: Alert): void {
    const severityEmoji = {
      low: '🟡',
      medium: '🟠',
      high: '🔴',
      critical: '🚨'
    };

    const emoji = severityEmoji[alert.severity];
    console.log(`${emoji} [ALERT ${alert.severity.toUpperCase()}] ${alert.title}`, {
      id: alert.id,
      message: alert.message,
      category: alert.category,
      correlationId: alert.correlationId,
      source: alert.source,
      details: alert.details
    });
  }

  /**
   * Send webhook notification for alert
   */
  private async sendWebhookNotification(alert: Alert): Promise<void> {
    if (!this.config.webhookUrl) return;

    try {
      const payload = {
        alert: {
          id: alert.id,
          title: alert.title,
          message: alert.message,
          severity: alert.severity,
          category: alert.category,
          timestamp: alert.timestamp,
          source: alert.source,
          correlationId: alert.correlationId
        },
        system: 'OPAL Integration',
        environment: process.env.NODE_ENV || 'development'
      };

      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OPAL-Alerting-System/1.0'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook responded with ${response.status}: ${response.statusText}`);
      }

      console.log(`📤 [Alerting] Webhook notification sent for alert ${alert.id}`);

    } catch (error) {
      console.error(`❌ [Alerting] Webhook notification failed for alert ${alert.id}:`, error);
    }
  }

  /**
   * Cleanup old alerts and enforce max limits
   */
  private cleanupOldAlerts(): void {
    const now = Date.now();
    let cleanedCount = 0;

    // Auto-resolve old alerts
    for (const alert of this.alerts.values()) {
      if (!alert.resolved &&
          now - new Date(alert.timestamp).getTime() > this.config.autoResolveAfter) {
        this.resolveAlert(alert.id, 'Auto-resolved due to age');
        cleanedCount++;
      }
    }

    // Remove very old resolved alerts
    const cutoffTime = now - (this.config.autoResolveAfter * 2);
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.resolved &&
          alert.resolvedAt &&
          new Date(alert.resolvedAt).getTime() < cutoffTime) {
        this.alerts.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 [Alerting] Cleaned up ${cleanedCount} old alerts`);
    }

    this.enforceMaxAlerts();
  }

  /**
   * Enforce maximum alert limit
   */
  private enforceMaxAlerts(): void {
    if (this.alerts.size <= this.config.maxAlerts) return;

    // Remove oldest resolved alerts first
    const sortedAlerts = Array.from(this.alerts.entries())
      .sort(([, a], [, b]) => {
        if (a.resolved !== b.resolved) {
          return a.resolved ? -1 : 1; // Resolved alerts first
        }
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });

    const toRemove = sortedAlerts.slice(0, this.alerts.size - this.config.maxAlerts);

    for (const [id] of toRemove) {
      this.alerts.delete(id);
    }

    if (toRemove.length > 0) {
      console.log(`📊 [Alerting] Removed ${toRemove.length} alerts to enforce limit (${this.config.maxAlerts})`);
    }
  }

  /**
   * Add or update an alert rule
   */
  addRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    console.log(`📝 [Alerting] Added rule: ${rule.name} (${rule.id})`);
  }

  /**
   * Remove an alert rule
   */
  removeRule(ruleId: string): boolean {
    const removed = this.alertRules.delete(ruleId);
    if (removed) {
      console.log(`🗑️ [Alerting] Removed rule: ${ruleId}`);
    }
    return removed;
  }
}

// Global alerting system instance
let globalAlertingSystem: AlertingSystem | null = null;

/**
 * Get or create global alerting system instance
 */
export function getAlertingSystem(): AlertingSystem {
  if (!globalAlertingSystem) {
    globalAlertingSystem = new AlertingSystem({
      enabled: process.env.NODE_ENV !== 'test',
      maxAlerts: 200,
      autoResolveAfter: 24 * 60 * 60 * 1000, // 24 hours
      enableConsoleLogging: true,
      enableWebhooks: false // Enable if webhook URL is configured
    });
  }

  return globalAlertingSystem;
}

/**
 * Convenience function to send OPAL failure alert
 */
export function alertOPALFailure(
  message: string,
  details: Record<string, any> = {},
  correlationId?: string
): Alert | null {
  const alerting = getAlertingSystem();

  return alerting.processEvent({
    type: 'opal_webhook_failed',
    category: 'opal_failure',
    message,
    details,
    correlationId,
    source: 'OPAL Integration',
    timestamp: new Date().toISOString()
  });
}

/**
 * Convenience function to send circuit breaker alert
 */
export function alertCircuitBreakerOpened(
  circuitName: string,
  reason: string,
  details: Record<string, any> = {}
): Alert | null {
  const alerting = getAlertingSystem();

  return alerting.processEvent({
    type: 'circuit_breaker_opened',
    category: 'circuit_breaker',
    message: `Circuit breaker '${circuitName}' opened: ${reason}`,
    details: { circuitName, reason, ...details },
    source: 'Circuit Breaker',
    timestamp: new Date().toISOString()
  });
}