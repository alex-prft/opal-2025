import { NextRequest, NextResponse } from 'next/server';

/**
 * User Interaction Analytics API - Tracks dashboard usage patterns for intelligent recommendations
 */

// Enhanced analytics event types
interface AnalyticsEvent {
  id: string;
  userId: string;
  sessionId: string;
  timestamp: string;
  eventType: 'page_view' | 'tab_change' | 'recommendation_click' | 'recommendation_dismiss' |
            'filter_applied' | 'custom_rule_created' | 'custom_rule_applied' | 'export_action' |
            'time_spent' | 'scroll_depth' | 'interaction_pattern';
  properties: {
    areaId?: string;
    tabId?: string;
    recommendationId?: string;
    recommendationType?: string;
    actionTaken?: string;
    filterType?: string;
    filterValue?: string;
    timeSpent?: number;
    scrollDepth?: number;
    deviceType?: string;
    userRole?: string;
    confidence?: number;
    expectedOutcome?: string;
    [key: string]: any;
  };
}

// In-memory analytics store - replace with database in production
const analyticsStore: AnalyticsEvent[] = [];
const userSessions = new Map<string, { startTime: string; events: number; lastActivity: string }>();

/**
 * POST - Track analytics events
 */
export async function POST(request: NextRequest) {
  try {
    const { eventType, properties = {}, sessionId, userId } = await request.json();

    if (!eventType) {
      return NextResponse.json(
        { error: 'Missing required field: eventType' },
        { status: 400 }
      );
    }

    // Generate event ID and enrich with session data
    const eventId = `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const finalUserId = userId || 'anonymous';
    const finalSessionId = sessionId || `session-${Date.now()}`;

    // Track session info
    if (!userSessions.has(finalSessionId)) {
      userSessions.set(finalSessionId, {
        startTime: new Date().toISOString(),
        events: 0,
        lastActivity: new Date().toISOString()
      });
    }

    const session = userSessions.get(finalSessionId)!;
    session.events += 1;
    session.lastActivity = new Date().toISOString();

    // Create analytics event with enhanced metadata
    const analyticsEvent: AnalyticsEvent = {
      id: eventId,
      userId: finalUserId,
      sessionId: finalSessionId,
      timestamp: new Date().toISOString(),
      eventType,
      properties: {
        ...properties,
        sessionEvents: session.events,
        sessionDuration: Date.now() - new Date(session.startTime).getTime(),
        deviceType: properties.deviceType || 'desktop',
        userAgent: request.headers.get('user-agent')?.slice(0, 100),
        referrer: request.headers.get('referer')
      }
    };

    // Store event
    analyticsStore.push(analyticsEvent);

    // Keep only last 10000 events to prevent memory issues
    if (analyticsStore.length > 10000) {
      analyticsStore.splice(0, analyticsStore.length - 10000);
    }

    console.log('Analytics Event Tracked:', {
      eventType,
      userId: finalUserId,
      sessionId: finalSessionId,
      areaId: properties.areaId,
      tabId: properties.tabId
    });

    return NextResponse.json({
      success: true,
      eventId,
      message: 'Event tracked successfully'
    });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({
      error: 'Failed to track analytics event',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET - Retrieve analytics data for insights
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || 'anonymous';
    const eventType = searchParams.get('event_type');
    const areaId = searchParams.get('area_id');
    const timeframe = searchParams.get('timeframe') || '24h';

    // Calculate time window
    const timeframePeriods: { [key: string]: number } = {
      '1h': 1 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const cutoffTime = new Date(Date.now() - (timeframePeriods[timeframe] || timeframePeriods['24h']));

    // Filter events
    const filteredEvents = analyticsStore.filter(event => {
      const eventTime = new Date(event.timestamp);
      const withinTimeframe = eventTime >= cutoffTime;
      const matchesUser = !userId || event.userId === userId;
      const matchesEventType = !eventType || event.eventType === eventType;
      const matchesArea = !areaId || event.properties.areaId === areaId;

      return withinTimeframe && matchesUser && matchesEventType && matchesArea;
    });

    // Generate insights
    const insights = generateAnalyticsInsights(filteredEvents, userId);

    return NextResponse.json({
      success: true,
      events: filteredEvents.length,
      timeframe,
      insights,
      data: {
        events: filteredEvents.slice(-100), // Return last 100 events for performance
        summary: insights
      }
    });

  } catch (error) {
    console.error('Analytics retrieval error:', error);
    return NextResponse.json({
      error: 'Failed to retrieve analytics data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Generate actionable insights from analytics data
 */
function generateAnalyticsInsights(events: AnalyticsEvent[], userId: string) {
  const insights = {
    userBehavior: {
      mostViewedAreas: {} as { [key: string]: number },
      mostViewedTabs: {} as { [key: string]: number },
      avgSessionDuration: 0,
      totalSessions: new Set(events.map(e => e.sessionId)).size,
      recommendationEngagement: {
        totalClicks: 0,
        totalDismissals: 0,
        engagementRate: 0
      },
      contentPreferences: {
        preferredContentTypes: {} as { [key: string]: number },
        timeSpentByArea: {} as { [key: string]: number }
      }
    },
    recommendations: {
      mostEngagingTypes: [] as { type: string; engagement: number }[],
      dismissalPatterns: [] as { reason: string; frequency: number }[],
      successfulOutcomes: [] as { outcome: string; confidence: number }[]
    },
    optimization: {
      suggestedImprovements: [] as string[],
      personalizedRecommendations: [] as string[]
    }
  };

  // Analyze events
  events.forEach(event => {
    const props = event.properties;

    // Track area and tab usage
    if (props.areaId) {
      insights.userBehavior.mostViewedAreas[props.areaId] =
        (insights.userBehavior.mostViewedAreas[props.areaId] || 0) + 1;
    }

    if (props.tabId) {
      insights.userBehavior.mostViewedTabs[props.tabId] =
        (insights.userBehavior.mostViewedTabs[props.tabId] || 0) + 1;
    }

    // Track recommendation engagement
    if (event.eventType === 'recommendation_click') {
      insights.userBehavior.recommendationEngagement.totalClicks++;
    }
    if (event.eventType === 'recommendation_dismiss') {
      insights.userBehavior.recommendationEngagement.totalDismissals++;
    }

    // Track time spent
    if (event.eventType === 'time_spent' && props.timeSpent) {
      if (props.areaId) {
        insights.userBehavior.contentPreferences.timeSpentByArea[props.areaId] =
          (insights.userBehavior.contentPreferences.timeSpentByArea[props.areaId] || 0) + props.timeSpent;
      }
    }
  });

  // Calculate engagement rate
  const totalRecommendationInteractions =
    insights.userBehavior.recommendationEngagement.totalClicks +
    insights.userBehavior.recommendationEngagement.totalDismissals;

  insights.userBehavior.recommendationEngagement.engagementRate =
    totalRecommendationInteractions > 0
      ? (insights.userBehavior.recommendationEngagement.totalClicks / totalRecommendationInteractions) * 100
      : 0;

  // Generate optimization suggestions
  const topArea = Object.entries(insights.userBehavior.mostViewedAreas)
    .sort(([,a], [,b]) => b - a)[0]?.[0];

  if (topArea) {
    insights.optimization.suggestedImprovements.push(
      `Focus on ${topArea} area recommendations - highest user engagement detected`
    );
  }

  if (insights.userBehavior.recommendationEngagement.engagementRate < 30) {
    insights.optimization.suggestedImprovements.push(
      'Improve recommendation relevance - current engagement rate below optimal'
    );
  }

  insights.optimization.personalizedRecommendations = [
    'Prioritize quick wins based on your interaction patterns',
    'Show ROI-focused recommendations for executive role',
    'Emphasize technical implementation for your preferred areas'
  ];

  return insights;
}