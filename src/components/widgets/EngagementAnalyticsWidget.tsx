/**
 * Engagement Analytics Widget - Enhanced
 * Comprehensive analytics dashboard with advanced topic analysis and AI insights
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HeatMap } from '@/components/charts/HeatMap';
import { TrendChart } from '@/components/charts/TrendChart';
import { LineChart } from '@/components/charts/LineChart';
import { TopicAnalysis } from './analytics/TopicAnalysis';
import { OPALData } from '@/lib/widget-config';
import { TrendingUp, Users, Eye, Clock, MapPin, Search, BarChart3, Brain } from 'lucide-react';

export interface EngagementAnalyticsWidgetProps {
  data: OPALData;
  className?: string;
}

export function EngagementAnalyticsWidget({ data, className = '' }: EngagementAnalyticsWidgetProps) {
  const {
    analyticsData,
    contentTopics,
    topContent,
    userInteractions,
    engagementTrends,
    visibilityMetrics,
    semanticData,
    geoData
  } = data;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {analyticsData && (
          <>
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{analyticsData.totalPageViews?.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Page Views</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Eye className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{analyticsData.uniqueVisitors?.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Unique Visitors</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold">{analyticsData.averageSessionDuration}s</p>
                <p className="text-sm text-gray-600">Avg Session Duration</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                <p className="text-2xl font-bold">{analyticsData.conversionRate}%</p>
                <p className="text-sm text-gray-600">Conversion Rate</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Enhanced analytics tabs with Topic Analysis */}
      <Tabs defaultValue="engagement" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="topics">Topic Analysis</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="visibility">AI Visibility</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
        </TabsList>

        {/* Engagement Overview */}
        <TabsContent value="engagement">
          <div className="grid gap-4">
            {/* Engagement Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Trends</CardTitle>
                <CardDescription>
                  User engagement patterns over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {engagementTrends && engagementTrends.length > 0 ? (
                  <TrendChart
                    data={engagementTrends}
                    dataKeys={[
                      { key: 'engagement', name: 'Engagement Score', color: '#3b82f6' },
                      { key: 'sessions', name: 'Sessions', color: '#10b981' }
                    ]}
                    height={300}
                  />
                ) : (
                  <p className="text-gray-500 text-center py-8">No trend data available</p>
                )}
              </CardContent>
            </Card>

            {/* Key Metrics */}
            {analyticsData && (
              <Card>
                <CardHeader>
                  <CardTitle>Key Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Bounce Rate</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={analyticsData.bounceRate} className="w-32" />
                        <span className="text-sm font-medium w-12">{analyticsData.bounceRate}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Session Duration</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={(analyticsData.averageSessionDuration / 300) * 100} className="w-32" />
                        <span className="text-sm font-medium w-12">{analyticsData.averageSessionDuration}s</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Conversion Rate</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={analyticsData.conversionRate * 10} className="w-32" />
                        <span className="text-sm font-medium w-12">{analyticsData.conversionRate}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Advanced Topic Analysis */}
        <TabsContent value="topics">
          <TopicAnalysis topicData={contentTopics} />
        </TabsContent>

        {/* Content Analysis */}
        <TabsContent value="content">
          <div className="grid gap-4">
            {/* Topic Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Content Topics Analysis</CardTitle>
                <CardDescription>
                  Most popular content topics and their engagement levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contentTopics && contentTopics.length > 0 ? (
                  <div className="space-y-3">
                    {contentTopics.map((topic: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">{topic.topic}</h4>
                            <Badge variant="secondary">{topic.count} articles</Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Progress value={topic.engagement * 20} className="flex-1" />
                            <span className="text-sm text-gray-600">{topic.engagement}/5 engagement</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No topic data available</p>
                )}
              </CardContent>
            </Card>

            {/* Top Content */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Content</CardTitle>
                <CardDescription>
                  Highest engagement content pieces
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topContent && topContent.length > 0 ? (
                  <div className="space-y-3">
                    {topContent.map((content: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{content.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{content.views?.toLocaleString()} views</span>
                            <span>{content.engagement}/5 rating</span>
                            <span>Updated: {new Date(content.lastUpdated).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Badge variant={content.engagement > 4 ? 'default' : 'secondary'}>
                          {content.engagement > 4 ? 'High' : 'Medium'} Performance
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No content performance data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Interactions */}
        <TabsContent value="interactions">
          <div className="grid gap-4">
            {/* Interaction Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle>User Interaction Heatmap</CardTitle>
                <CardDescription>
                  Click patterns and interaction hotspots
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userInteractions?.clickHeatmap ? (
                  <HeatMap
                    data={userInteractions.clickHeatmap}
                    width={600}
                    height={400}
                  />
                ) : (
                  <p className="text-gray-500 text-center py-8">No interaction data available</p>
                )}
              </CardContent>
            </Card>

            {/* Scroll Depth */}
            {userInteractions?.scrollDepth && (
              <Card>
                <CardHeader>
                  <CardTitle>Scroll Depth Analysis</CardTitle>
                  <CardDescription>
                    How far users scroll through content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-3xl font-bold text-blue-700">{userInteractions.scrollDepth.avg}%</p>
                      <p className="text-sm text-blue-600">Average Scroll Depth</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {userInteractions.scrollDepth.segments?.map((segment: number, index: number) => (
                        <div key={index} className="text-center p-2 bg-gray-50 rounded">
                          <p className="font-semibold">{segment}%</p>
                          <p className="text-xs text-gray-600">Q{index + 1}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* AI Visibility */}
        <TabsContent value="visibility">
          <div className="grid gap-4">
            {/* Search Visibility */}
            {visibilityMetrics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="w-5 h-5" />
                    <span>Search Visibility Metrics</span>
                  </CardTitle>
                  <CardDescription>
                    AI and search engine visibility performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-700">{visibilityMetrics.searchVisibility}%</p>
                      <p className="text-sm text-green-600">Search Visibility</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-700">{visibilityMetrics.aiVisibility}%</p>
                      <p className="text-sm text-purple-600">AI Visibility</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-700">{visibilityMetrics.semanticMatches}</p>
                      <p className="text-sm text-orange-600">Semantic Matches</p>
                    </div>
                  </div>

                  {/* Keyword Rankings */}
                  {visibilityMetrics.keywordRankings && (
                    <div>
                      <h4 className="font-semibold mb-3">Top Keyword Rankings</h4>
                      <div className="space-y-2">
                        {visibilityMetrics.keywordRankings.map((keyword: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="font-medium">{keyword.keyword}</span>
                            <div className="flex items-center space-x-2">
                              <Badge variant={keyword.position <= 3 ? 'default' : 'secondary'}>
                                #{keyword.position}
                              </Badge>
                              <span className="text-sm text-gray-600">{keyword.volume?.toLocaleString()} searches</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Semantic Analysis */}
            {semanticData && (
              <Card>
                <CardHeader>
                  <CardTitle>Semantic Content Analysis</CardTitle>
                  <CardDescription>
                    Content concepts and relationships
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {/* Concepts */}
                    {semanticData.concepts && (
                      <div>
                        <h4 className="font-semibold mb-3">Key Concepts</h4>
                        <div className="space-y-2">
                          {semanticData.concepts.map((concept: any, index: number) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="font-medium">{concept.concept}</span>
                              <div className="flex items-center space-x-2">
                                <Progress value={concept.relevance * 100} className="w-24" />
                                <span className="text-sm text-gray-600 w-16">{(concept.relevance * 100).toFixed(0)}%</span>
                                <Badge variant="outline">{concept.entities} entities</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Relationships */}
                    {semanticData.relationships && (
                      <div>
                        <h4 className="font-semibold mb-3">Concept Relationships</h4>
                        <div className="space-y-2">
                          {semanticData.relationships.map((rel: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">{rel.from} → {rel.to}</span>
                              <div className="flex items-center space-x-2">
                                <Progress value={rel.strength * 100} className="w-20" />
                                <span className="text-xs text-gray-600">{(rel.strength * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Geographic Analysis */}
        <TabsContent value="geographic">
          <div className="grid gap-4">
            {/* Regional Data */}
            {geoData?.regions && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5" />
                    <span>Geographic Distribution</span>
                  </CardTitle>
                  <CardDescription>
                    Visitor engagement by region
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {geoData.regions.map((region: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">{region.country}</h4>
                            <Badge variant="secondary">{region.visitors?.toLocaleString()} visitors</Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Progress value={region.engagement * 20} className="flex-1" />
                            <span className="text-sm text-gray-600">{region.engagement}/5 engagement</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* City Performance */}
            {geoData?.cities && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Cities by Conversion</CardTitle>
                  <CardDescription>
                    Highest converting metropolitan areas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {geoData.cities.map((city: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{city.city}</h4>
                          <p className="text-sm text-gray-600">{city.visitors?.toLocaleString()} visitors</p>
                        </div>
                        <Badge variant={city.conversionRate > 3 ? 'default' : 'secondary'}>
                          {city.conversionRate}% conversion
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}