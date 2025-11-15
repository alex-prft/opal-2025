'use client';

import { useEffect, useState } from 'react';
import { getTier2ItemsForTier1, getTier3ItemsForTier2 } from '@/data/opal-mapping';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Users,
  TrendingUp,
  Eye,
  Target,
  Heart,
  Brain,
  Zap,
  MessageSquare,
  Activity,
  Award,
  Calendar,
  PieChart,
  Settings
} from 'lucide-react';

interface InsightData {
  metric?: number;
  trend?: string;
  description?: string;
}

export default function InsightsPageExample() {
  const [data, setData] = useState<Record<string, InsightData>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTier2, setSelectedTier2] = useState<string>('OSA');

  // Get Analytics Insights mapping data dynamically
  const tier2Items = getTier2ItemsForTier1('Analytics Insights');
  const tier3Items = getTier3ItemsForTier2('Analytics Insights', selectedTier2);

  // Icon mapping for tier2 sections
  const tier2IconMapping = {
    'OSA': BarChart3,
    'Content': Eye,
    'Audiences': Users,
    'CX': Heart,
    'Trends': Settings
  } as const;

  useEffect(() => {
    // Fetch live data for Tier 3 views using our dynamic API
    const fetchInsightsData = async () => {
      try {
        setLoading(true);

        // Call our dynamic API endpoint with the selected tier2 section
        const url = `/api/analytics/insights${selectedTier2 ? `?section=${encodeURIComponent(selectedTier2)}` : ''}`;
        const response = await fetch(url);

        if (response.ok) {
          const json = await response.json();

          if (json.success && json.data) {
            // Transform API response to match our component's expected format
            const transformedData: Record<string, InsightData> = {};

            Object.entries(json.data).forEach(([key, value]: [string, any]) => {
              transformedData[key] = {
                metric: value.value || value.metric,
                trend: value.trend === 'up' ? '↑ Increasing' :
                       value.trend === 'down' ? '↓ Decreasing' : '→ Stable',
                description: value.description || `Analytics data for ${key}`
              };
            });

            setData(transformedData);
          } else {
            throw new Error(json.message || 'API response was not successful');
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Failed to fetch insights data:', error);

        // Fallback to client-side mock data if API fails
        const mockData: Record<string, InsightData> = {};
        tier3Items.forEach(item => {
          mockData[item] = {
            metric: Math.floor(Math.random() * 100),
            trend: ['↑ Increasing', '↓ Decreasing', '→ Stable'][Math.floor(Math.random() * 3)],
            description: `Mock analytics data for ${item}`
          };
        });
        setData(mockData);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have tier3 items to avoid unnecessary API calls
    if (tier3Items.length > 0) {
      fetchInsightsData();
    } else {
      setLoading(false);
      setData({});
    }
  }, [selectedTier2, tier3Items]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Analytics Insights</h1>
        </div>
        <p className="text-gray-600">
          Comprehensive analytics and insights across your OPAL platform using dynamic navigation structure
        </p>
      </div>

      {/* Dynamic Tier 2 Navigation Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Analytics sections">
            {tier2Items.map(tier2Item => {
              const IconComponent = tier2IconMapping[tier2Item as keyof typeof tier2IconMapping] || BarChart3;
              return (
                <button
                  key={tier2Item}
                  onClick={() => setSelectedTier2(tier2Item)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    selectedTier2 === tier2Item
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  aria-selected={selectedTier2 === tier2Item}
                >
                  <IconComponent className="h-4 w-4" />
                  {tier2Item}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Dynamic Tier 3 Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {tier3Items.map(tier3Item => {
          const itemData = data[tier3Item];

          return (
            <Card
              key={tier3Item}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{tier3Item}</h3>
                {itemData?.trend && (
                  <Badge
                    variant={
                      itemData.trend.includes('↑') ? 'default' :
                      itemData.trend.includes('↓') ? 'destructive' : 'secondary'
                    }
                    className="text-xs"
                  >
                    {itemData.trend}
                  </Badge>
                )}
              </div>

              {loading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <div>
                  {itemData?.metric !== undefined && (
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {itemData.metric}%
                    </div>
                  )}
                  <p className="text-gray-600 text-sm">
                    {itemData?.description || `Analytics data for ${tier3Item}`}
                  </p>
                </div>
              )}

              {/* Action Button */}
              <button className="mt-4 w-full bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium py-2 px-4 rounded-md text-sm transition-colors">
                View Details
              </button>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {tier3Items.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <p className="text-lg font-medium">No insights available</p>
            <p className="mt-1">Select a different section to view analytics data.</p>
          </div>
        </div>
      )}

      {/* Summary Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Dynamic Navigation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-1">Current Section</h4>
              <p className="text-blue-600">{selectedTier2}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-1">Available Views</h4>
              <p className="text-green-600">{tier3Items.length} insights</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-1">Data Source</h4>
              <p className="text-purple-600">OPAL Mapping</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-gray-800 mb-2">Available Tier 3 Views for {selectedTier2}:</h5>
            <div className="flex flex-wrap gap-2">
              {tier3Items.map(item => (
                <Badge key={item} variant="outline" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}