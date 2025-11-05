'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  FileText,
  TrendingUp,
  Users,
  Eye,
  Download,
  Share2,
  Clock,
  Star,
  Target,
  Zap,
  Award,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  category: 'Article' | 'Video' | 'Webinar' | 'Report' | 'Event' | 'Newsletter';
  performance_score: number;
  engagement_metrics: {
    views: number;
    downloads: number;
    shares: number;
    time_spent: number;
    bounce_rate: number;
    conversion_rate: number;
  };
  audience_metrics: {
    member_engagement: number;
    prospect_engagement: number;
    industry_relevance: number;
  };
  personalization_score: number;
  published_date: string;
  author: string;
  tags: string[];
  optimization_recommendations: string[];
}

interface ContentPerformanceData {
  content_items: ContentItem[];
  category_performance: Array<{
    category: string;
    avg_score: number;
    total_content: number;
    engagement_rate: number;
  }>;
  trending_topics: Array<{
    topic: string;
    score: number;
    growth: number;
    content_count: number;
  }>;
  personalization_opportunities: Array<{
    opportunity: string;
    potential_impact: number;
    effort_level: 'Low' | 'Medium' | 'High';
    priority: 'High' | 'Medium' | 'Low';
  }>;
}

export default function ContentPerformanceScoring() {
  const [performanceData, setPerformanceData] = useState<ContentPerformanceData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock IFPA content performance data
  const mockPerformanceData: ContentPerformanceData = {
    content_items: [
      {
        id: 'sustainability-trends-2024',
        title: 'Sustainability Trends in Fresh Produce: 2024 Outlook',
        category: 'Report',
        performance_score: 92,
        engagement_metrics: {
          views: 3420,
          downloads: 856,
          shares: 127,
          time_spent: 8.4,
          bounce_rate: 23,
          conversion_rate: 12.8
        },
        audience_metrics: {
          member_engagement: 87,
          prospect_engagement: 74,
          industry_relevance: 95
        },
        personalization_score: 89,
        published_date: '2024-01-15',
        author: 'IFPA Sustainability Committee',
        tags: ['sustainability', 'trends', 'environment', 'consumer-behavior'],
        optimization_recommendations: [
          'Add interactive sustainability calculator',
          'Create member-specific action items',
          'Develop follow-up webinar series'
        ]
      },
      {
        id: 'supply-chain-digital-transformation',
        title: 'Digital Transformation in Fresh Produce Supply Chain',
        category: 'Webinar',
        performance_score: 88,
        engagement_metrics: {
          views: 2890,
          downloads: 0,
          shares: 94,
          time_spent: 45.2,
          bounce_rate: 15,
          conversion_rate: 18.5
        },
        audience_metrics: {
          member_engagement: 91,
          prospect_engagement: 69,
          industry_relevance: 92
        },
        personalization_score: 76,
        published_date: '2024-02-08',
        author: 'Tech Innovation Panel',
        tags: ['digital-transformation', 'supply-chain', 'technology', 'innovation'],
        optimization_recommendations: [
          'Create role-specific follow-up content',
          'Add technology assessment tool',
          'Segment by company size for recommendations'
        ]
      },
      {
        id: 'food-safety-certification-guide',
        title: 'Complete Guide to Food Safety Certifications',
        category: 'Article',
        performance_score: 85,
        engagement_metrics: {
          views: 4180,
          downloads: 1203,
          shares: 78,
          time_spent: 6.7,
          bounce_rate: 28,
          conversion_rate: 9.4
        },
        audience_metrics: {
          member_engagement: 82,
          prospect_engagement: 88,
          industry_relevance: 89
        },
        personalization_score: 71,
        published_date: '2024-01-28',
        author: 'Food Safety Team',
        tags: ['food-safety', 'certification', 'compliance', 'best-practices'],
        optimization_recommendations: [
          'Add certification timeline calculator',
          'Create company-size specific recommendations',
          'Include interactive checklist'
        ]
      },
      {
        id: 'global-trade-update-q1',
        title: 'Q1 2024 Global Trade Update: Fresh Produce Markets',
        category: 'Newsletter',
        performance_score: 79,
        engagement_metrics: {
          views: 5240,
          downloads: 0,
          shares: 156,
          time_spent: 4.2,
          bounce_rate: 35,
          conversion_rate: 6.8
        },
        audience_metrics: {
          member_engagement: 85,
          prospect_engagement: 58,
          industry_relevance: 87
        },
        personalization_score: 64,
        published_date: '2024-03-01',
        author: 'Global Trade Team',
        tags: ['global-trade', 'market-analysis', 'quarterly-update', 'economics'],
        optimization_recommendations: [
          'Personalize by geographic region',
          'Add member-specific market alerts',
          'Include interactive market data dashboard'
        ]
      },
      {
        id: 'consumer-trends-video-series',
        title: 'Consumer Trends Video Series: Gen Z and Fresh Produce',
        category: 'Video',
        performance_score: 91,
        engagement_metrics: {
          views: 6750,
          downloads: 0,
          shares: 289,
          time_spent: 12.8,
          bounce_rate: 18,
          conversion_rate: 15.2
        },
        audience_metrics: {
          member_engagement: 89,
          prospect_engagement: 86,
          industry_relevance: 93
        },
        personalization_score: 83,
        published_date: '2024-02-20',
        author: 'Consumer Insights Team',
        tags: ['consumer-trends', 'gen-z', 'marketing', 'demographics'],
        optimization_recommendations: [
          'Create age-group specific content versions',
          'Add interactive trend predictor tool',
          'Develop companion marketing toolkit'
        ]
      }
    ],
    category_performance: [
      { category: 'Report', avg_score: 89, total_content: 12, engagement_rate: 84 },
      { category: 'Video', avg_score: 87, total_content: 8, engagement_rate: 92 },
      { category: 'Webinar', avg_score: 85, total_content: 15, engagement_rate: 78 },
      { category: 'Article', avg_score: 82, total_content: 34, engagement_rate: 76 },
      { category: 'Newsletter', avg_score: 79, total_content: 6, engagement_rate: 71 },
      { category: 'Event', avg_score: 86, total_content: 9, engagement_rate: 89 }
    ],
    trending_topics: [
      { topic: 'Sustainability', score: 94, growth: 23, content_count: 18 },
      { topic: 'Digital Innovation', score: 89, growth: 31, content_count: 14 },
      { topic: 'Consumer Behavior', score: 87, growth: 18, content_count: 22 },
      { topic: 'Supply Chain', score: 85, growth: 15, content_count: 16 },
      { topic: 'Food Safety', score: 83, growth: 8, content_count: 25 },
      { topic: 'Global Trade', score: 81, growth: 12, content_count: 19 }
    ],
    personalization_opportunities: [
      {
        opportunity: 'Member Role-Based Content Paths',
        potential_impact: 85,
        effort_level: 'Medium',
        priority: 'High'
      },
      {
        opportunity: 'Geographic Market Personalization',
        potential_impact: 78,
        effort_level: 'High',
        priority: 'High'
      },
      {
        opportunity: 'Company Size-Specific Resources',
        potential_impact: 72,
        effort_level: 'Low',
        priority: 'Medium'
      },
      {
        opportunity: 'Industry Segment Content Curation',
        potential_impact: 89,
        effort_level: 'Medium',
        priority: 'High'
      },
      {
        opportunity: 'Engagement-Based Content Recommendations',
        potential_impact: 81,
        effort_level: 'High',
        priority: 'Medium'
      }
    ]
  };

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setPerformanceData(mockPerformanceData);
    setIsLoading(false);
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPerformanceIcon = (score: number) => {
    if (score >= 85) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (score >= 70) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <Target className="h-5 w-5 text-red-500" />;
  };

  const filteredContent = selectedCategory === 'all'
    ? performanceData?.content_items
    : performanceData?.content_items.filter(item => item.category === selectedCategory);

  if (isLoading || !performanceData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mr-3" />
          <span>Loading content performance data...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Award className="h-6 w-6" />
            Content Performance Scoring
          </h2>
          <p className="text-muted-foreground">
            AI-powered content analysis and personalization recommendations for IFPA
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={loadPerformanceData} disabled={isLoading} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Performance Score</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(performanceData.content_items.reduce((sum, item) => sum + item.performance_score, 0) / performanceData.content_items.length)}
                </p>
              </div>
              <Star className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Performing</p>
                <p className="text-2xl font-bold text-green-600">
                  {performanceData.content_items.filter(item => item.performance_score >= 85).length}
                </p>
                <p className="text-xs text-muted-foreground">pieces (85+ score)</p>
              </div>
              <Award className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Engagement</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(performanceData.content_items.reduce((sum, item) => sum + item.engagement_metrics.views, 0) / 1000).toFixed(1)}K
                </p>
                <p className="text-xs text-muted-foreground">views</p>
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold text-orange-600">
                  {(performanceData.content_items.reduce((sum, item) => sum + item.engagement_metrics.conversion_rate, 0) / performanceData.content_items.length).toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Performance Overview</TabsTrigger>
          <TabsTrigger value="content">Content Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trending Topics</TabsTrigger>
          <TabsTrigger value="opportunities">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Category Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Performance by Content Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData.category_performance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg_score" fill="#3b82f6" name="Avg Performance Score" />
                  <Bar dataKey="engagement_rate" fill="#10b981" name="Engagement Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trending Topics Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Topic Performance Radar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={performanceData.trending_topics}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="topic" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Performance Score"
                    dataKey="score"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Growth Rate"
                    dataKey="growth"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All Content ({performanceData.content_items.length})
            </Button>
            {Array.from(new Set(performanceData.content_items.map(item => item.category))).map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category} ({performanceData.content_items.filter(item => item.category === category).length})
              </Button>
            ))}
          </div>

          {/* Content Items List */}
          <div className="space-y-4">
            {filteredContent?.map((content) => (
              <Card key={content.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getPerformanceIcon(content.performance_score)}
                        <h3 className="font-semibold text-lg">{content.title}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <Badge variant="outline">{content.category}</Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(content.published_date).toLocaleDateString()}
                        </span>
                        <span>{content.author}</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {content.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(content.performance_score)}`}>
                        {content.performance_score}/100
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">{content.engagement_metrics.views.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">{content.engagement_metrics.shares}</div>
                      <div className="text-xs text-muted-foreground">Shares</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">{content.engagement_metrics.time_spent}m</div>
                      <div className="text-xs text-muted-foreground">Avg Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-orange-600">{content.engagement_metrics.conversion_rate}%</div>
                      <div className="text-xs text-muted-foreground">Conversion</div>
                    </div>
                  </div>

                  {content.optimization_recommendations.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Optimization Opportunities
                      </h4>
                      <ul className="space-y-1">
                        {content.optimization_recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-yellow-500 mt-1">→</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {performanceData.trending_topics.map((topic, index) => (
              <Card key={topic.topic}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{topic.topic}</h3>
                      <p className="text-muted-foreground text-sm">{topic.content_count} pieces of content</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{topic.score}</div>
                      <div className="text-sm text-green-600">+{topic.growth}% growth</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${topic.score}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          <div className="space-y-4">
            {performanceData.personalization_opportunities.map((opportunity, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{opportunity.opportunity}</h3>
                      <div className="flex items-center gap-4">
                        <Badge className={
                          opportunity.priority === 'High' ? 'bg-red-100 text-red-800' :
                          opportunity.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }>
                          {opportunity.priority} Priority
                        </Badge>
                        <Badge className={
                          opportunity.effort_level === 'Low' ? 'bg-green-100 text-green-700' :
                          opportunity.effort_level === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }>
                          {opportunity.effort_level} Effort
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">{opportunity.potential_impact}%</div>
                      <div className="text-sm text-muted-foreground">Potential Impact</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}