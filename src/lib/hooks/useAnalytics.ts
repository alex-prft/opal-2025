import { useCallback, useEffect, useRef } from 'react';

interface AnalyticsEvent {
  eventType: 'page_view' | 'tab_change' | 'recommendation_click' | 'recommendation_dismiss' |
            'filter_applied' | 'custom_rule_created' | 'custom_rule_applied' | 'export_action' |
            'time_spent' | 'scroll_depth' | 'interaction_pattern';
  properties?: {
    areaId?: string;
    tabId?: string;
    recommendationId?: string;
    recommendationType?: string;
    actionTaken?: string;
    filterType?: string;
    filterValue?: string;
    timeSpent?: number;
    scrollDepth?: number;
    userRole?: string;
    confidence?: number;
    expectedOutcome?: string;
    [key: string]: any;
  };
}

interface AnalyticsConfig {
  userId?: string;
  sessionId?: string;
  userRole?: string;
  enableTracking?: boolean;
}

export function useAnalytics(config: AnalyticsConfig = {}) {
  const sessionIdRef = useRef<string>();
  const startTimeRef = useRef<number>(Date.now());
  const lastActivityRef = useRef<number>(Date.now());

  // Generate or get session ID
  useEffect(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = config.sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  }, [config.sessionId]);

  // Track analytics event
  const track = useCallback(async (event: AnalyticsEvent) => {
    if (config.enableTracking === false) return;

    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: event.eventType,
          properties: {
            ...event.properties,
            userRole: config.userRole,
            sessionDuration: Date.now() - startTimeRef.current,
            timeSinceLastActivity: Date.now() - lastActivityRef.current,
            deviceType: typeof window !== 'undefined' ? (
              window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'
            ) : 'unknown'
          },
          sessionId: sessionIdRef.current,
          userId: config.userId || 'anonymous'
        })
      });

      if (response.ok) {
        lastActivityRef.current = Date.now();
      }
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }, [config.userId, config.userRole, config.enableTracking]);

  // Convenience methods for common events
  const trackPageView = useCallback((areaId: string, tabId?: string) => {
    track({
      eventType: 'page_view',
      properties: { areaId, tabId }
    });
  }, [track]);

  const trackTabChange = useCallback((areaId: string, fromTab: string, toTab: string) => {
    track({
      eventType: 'tab_change',
      properties: { areaId, fromTab, toTab, actionTaken: 'tab_switch' }
    });
  }, [track]);

  const trackRecommendationClick = useCallback((
    recommendationId: string,
    recommendationType: string,
    confidence: number,
    expectedOutcome: string,
    areaId?: string,
    tabId?: string
  ) => {
    track({
      eventType: 'recommendation_click',
      properties: {
        recommendationId,
        recommendationType,
        confidence,
        expectedOutcome,
        areaId,
        tabId,
        actionTaken: 'accept_recommendation'
      }
    });
  }, [track]);

  const trackRecommendationDismiss = useCallback((
    recommendationId: string,
    reason: string,
    areaId?: string,
    tabId?: string
  ) => {
    track({
      eventType: 'recommendation_dismiss',
      properties: {
        recommendationId,
        reason,
        areaId,
        tabId,
        actionTaken: 'dismiss_recommendation'
      }
    });
  }, [track]);

  const trackFilterApplied = useCallback((filterType: string, filterValue: string, areaId?: string) => {
    track({
      eventType: 'filter_applied',
      properties: {
        filterType,
        filterValue,
        areaId,
        actionTaken: 'filter_data'
      }
    });
  }, [track]);

  const trackCustomRuleCreated = useCallback((ruleType: string, areaId: string, tabId: string) => {
    track({
      eventType: 'custom_rule_created',
      properties: {
        ruleType,
        areaId,
        tabId,
        actionTaken: 'create_custom_rule'
      }
    });
  }, [track]);

  const trackTimeSpent = useCallback((areaId: string, tabId: string, timeSpent: number) => {
    track({
      eventType: 'time_spent',
      properties: {
        areaId,
        tabId,
        timeSpent
      }
    });
  }, [track]);

  const trackInteractionPattern = useCallback((
    patternType: 'deep_dive' | 'quick_scan' | 'comparison' | 'export_focused',
    areaId: string,
    details: any
  ) => {
    track({
      eventType: 'interaction_pattern',
      properties: {
        patternType,
        areaId,
        ...details
      }
    });
  }, [track]);

  // Auto-track page visibility and time spent
  useEffect(() => {
    let visibilityStartTime = Date.now();
    let isVisible = !document.hidden;

    const handleVisibilityChange = () => {
      if (!isVisible && !document.hidden) {
        // Page became visible
        visibilityStartTime = Date.now();
        isVisible = true;
      } else if (isVisible && document.hidden) {
        // Page became hidden - track time spent
        const timeSpent = Date.now() - visibilityStartTime;
        if (timeSpent > 5000) { // Only track if spent more than 5 seconds
          track({
            eventType: 'time_spent',
            properties: {
              timeSpent,
              context: 'page_visibility'
            }
          });
        }
        isVisible = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Track initial page load
    track({
      eventType: 'page_view',
      properties: {
        context: 'initial_load',
        timestamp: new Date().toISOString()
      }
    });

    // Track session end on unload
    const handleBeforeUnload = () => {
      const sessionDuration = Date.now() - startTimeRef.current;
      track({
        eventType: 'time_spent',
        properties: {
          timeSpent: sessionDuration,
          context: 'session_end'
        }
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [track]);

  return {
    track,
    trackPageView,
    trackTabChange,
    trackRecommendationClick,
    trackRecommendationDismiss,
    trackFilterApplied,
    trackCustomRuleCreated,
    trackTimeSpent,
    trackInteractionPattern,
    sessionId: sessionIdRef.current
  };
}