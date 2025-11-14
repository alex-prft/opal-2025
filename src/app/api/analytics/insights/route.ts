import { NextResponse } from 'next/server';
import { getTier3ItemsForTier2 } from '@/data/opal-mapping';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tier2Section = searchParams.get('section') || 'OSA';
    const tier1Area = 'Analytics Insights';

    // Get the tier3 items dynamically based on OPAL mapping
    const tier3Items = getTier3ItemsForTier2(tier1Area, tier2Section);

    // Simulate fetching from Optimizely DXP or OPAL agents
    // In a real implementation, this would call actual APIs
    const generateMockData = (items: string[]) => {
      const data: Record<string, any> = {};

      items.forEach(item => {
        // Generate realistic mock data based on the item name
        const baseMetric = Math.floor(Math.random() * 40) + 60; // 60-100 range
        const trends = ['up', 'down', 'stable'];
        const trend = trends[Math.floor(Math.random() * trends.length)];

        // Customize data based on item type
        if (item.toLowerCase().includes('engagement')) {
          data[item] = {
            metric: `${baseMetric}%`,
            trend,
            value: baseMetric,
            description: `User engagement rate for ${tier2Section}`,
            change: trend === 'up' ? '+12%' : trend === 'down' ? '-5%' : '±0%',
            lastUpdated: new Date().toISOString()
          };
        } else if (item.toLowerCase().includes('topics')) {
          data[item] = {
            metric: `${Math.floor(Math.random() * 20) + 5} active`,
            trend,
            value: Math.floor(Math.random() * 20) + 5,
            description: `Active content topics in ${tier2Section}`,
            change: trend === 'up' ? '+3 new' : trend === 'down' ? '-2 topics' : 'no change',
            lastUpdated: new Date().toISOString()
          };
        } else if (item.toLowerCase().includes('popular')) {
          data[item] = {
            metric: `Top ${Math.floor(Math.random() * 5) + 3} trending`,
            trend,
            value: Math.floor(Math.random() * 5) + 3,
            description: `Most popular content in ${tier2Section}`,
            change: trend === 'up' ? '+2 items' : trend === 'down' ? '-1 item' : 'stable',
            lastUpdated: new Date().toISOString()
          };
        } else if (item.toLowerCase().includes('ai') || item.toLowerCase().includes('visibility')) {
          data[item] = {
            metric: `${baseMetric}%`,
            trend,
            value: baseMetric,
            description: `AI platform visibility for ${tier2Section}`,
            change: trend === 'up' ? '+8%' : trend === 'down' ? '-3%' : '±0%',
            lastUpdated: new Date().toISOString()
          };
        } else if (item.toLowerCase().includes('semantic')) {
          data[item] = {
            metric: baseMetric > 80 ? 'High relevance' : baseMetric > 60 ? 'Medium relevance' : 'Low relevance',
            trend,
            value: baseMetric,
            description: `Semantic analysis score for ${tier2Section}`,
            change: trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable',
            lastUpdated: new Date().toISOString()
          };
        } else if (item.toLowerCase().includes('geographic')) {
          data[item] = {
            metric: `${Math.floor(Math.random() * 20) + 10} regions`,
            trend,
            value: Math.floor(Math.random() * 20) + 10,
            description: `Geographic coverage for ${tier2Section}`,
            change: trend === 'up' ? '+2 regions' : trend === 'down' ? '-1 region' : 'stable',
            lastUpdated: new Date().toISOString()
          };
        } else if (item.toLowerCase().includes('freshness')) {
          const frequencies = ['Updated daily', 'Updated weekly', 'Updated hourly'];
          data[item] = {
            metric: frequencies[Math.floor(Math.random() * frequencies.length)],
            trend,
            value: baseMetric,
            description: `Content freshness for ${tier2Section}`,
            change: trend === 'up' ? 'More frequent' : trend === 'down' ? 'Less frequent' : 'Same frequency',
            lastUpdated: new Date().toISOString()
          };
        } else {
          // Default case for any other tier3 items
          data[item] = {
            metric: `${baseMetric}%`,
            trend,
            value: baseMetric,
            description: `Analytics metric for ${item} in ${tier2Section}`,
            change: trend === 'up' ? '+' + Math.floor(Math.random() * 10 + 5) + '%' :
                   trend === 'down' ? '-' + Math.floor(Math.random() * 5 + 2) + '%' : '±0%',
            lastUpdated: new Date().toISOString()
          };
        }
      });

      return data;
    };

    const mockData = generateMockData(tier3Items);

    // Add metadata about the request
    const responseData = {
      success: true,
      tier1: tier1Area,
      tier2: tier2Section,
      tier3Items,
      data: mockData,
      timestamp: new Date().toISOString(),
      source: 'OPAL Dynamic Mapping System'
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Analytics Insights API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics insights',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Optional: Handle POST requests for updating insights configuration
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tier2Section, configuration } = body;

    // Here you would typically update OPAL agent configuration
    // or trigger data refresh for the specified section

    console.log(`Updating configuration for ${tier2Section}:`, configuration);

    return NextResponse.json({
      success: true,
      message: `Configuration updated for ${tier2Section}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics Insights Configuration Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update configuration',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}