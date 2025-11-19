'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  Eye,
  Clock,
  Target,
  MapPin,
  RefreshCw,
  BookOpen,
  Zap,
  Users,
  Calendar,
  Filter,
  Download,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Minus,
  PieChart
} from 'lucide-react';

// Sample data for charts
const engagementData = [
  { page: 'Product Guide', timeOnPage: 4.2, scrollDepth: 85, interactions: 12 },
  { page: 'Best Practices', timeOnPage: 3.8, scrollDepth: 78, interactions: 9 },
  { page: 'Case Studies', timeOnPage: 5.1, scrollDepth: 92, interactions: 15 },
  { page: 'Feature Updates', timeOnPage: 2.3, scrollDepth: 65, interactions: 6 },
  { page: 'Industry Report', timeOnPage: 6.2, scrollDepth: 88, interactions: 18 }
];

const topicData = [
  { topic: 'AI & Automation', frequency: 45, engagement: 8.7, size: 450 },
  { topic: 'Data Analytics', frequency: 32, engagement: 7.2, size: 320 },
  { topic: 'Customer Experience', frequency: 28, engagement: 8.1, size: 280 },
  { topic: 'Digital Transformation', frequency: 22, engagement: 6.8, size: 220 },
  { topic: 'Product Innovation', frequency: 18, engagement: 7.9, size: 180 },
  { topic: 'Industry Trends', frequency: 15, engagement: 6.5, size: 150 }
];

const popularContent = [
  { title: 'Complete Guide to Digital Transformation', views: 12500, interactions: 340, completionRate: 78, trend: 'up' },
  { title: 'AI Implementation Best Practices', views: 9800, interactions: 280, completionRate: 82, trend: 'up' },
  { title: '2024 Industry Report', views: 8900, interactions: 245, completionRate: 65, trend: 'down' },
  { title: 'Customer Success Stories', views: 7600, interactions: 210, completionRate: 88, trend: 'up' },
  { title: 'Product Feature Deep Dive', views: 6400, interactions: 180, completionRate: 72, trend: 'neutral' }
];

const aiVisibilityData = [
  { month: 'Jan', citations: 15, zeroClick: 23, mentions: 8 },
  { month: 'Feb', citations: 18, zeroClick: 27, mentions: 12 },
  { month: 'Mar', citations: 22, zeroClick: 31, mentions: 15 },
  { month: 'Apr', citations: 28, zeroClick: 35, mentions: 18 },
  { month: 'May', citations: 32, zeroClick: 42, mentions: 22 },
  { month: 'Jun', citations: 38, zeroClick: 48, mentions: 26 }
];

const semanticData = [
  { category: 'Schema Markup', coverage: 85, target: 95 },
  { category: 'Heading Structure', coverage: 92, target: 98 },
  { category: 'Semantic Density', coverage: 78, target: 85 },
  { category: 'Meta Descriptions', coverage: 88, target: 100 },
  { category: 'Alt Text Coverage', coverage: 73, target: 90 }
];

const geographicData = [
  { region: 'North America', engagement: 8.4, content: 45 },
  { region: 'Europe', engagement: 7.8, content: 32 },
  { region: 'Asia Pacific', engagement: 7.2, content: 18 },
  { region: 'Latin America', engagement: 6.9, content: 12 },
  { region: 'Middle East', engagement: 6.5, content: 8 }
];

const freshnessData = [
  { period: 'Last 7 days', updates: 12 },
  { period: 'Last 30 days', updates: 28 },
  { period: '30-60 days', updates: 15 },
  { period: '60-90 days', updates: 8 },
  { period: '90+ days', updates: 23 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsContentDashboard() {
  const [selectedRole, setSelectedRole] = useState('marketing');
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('engagement');

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="ux">UX Designer</SelectItem>
              <SelectItem value="exec">Executive</SelectItem>
              <SelectItem value="content">Content Team</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Content Views</p>
                <p className="text-2xl font-bold">45,200</p>
                <Badge className="bg-green-100 text-green-800 mt-1">+12% vs last month</Badge>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Time on Page</p>
                <p className="text-2xl font-bold">4:32</p>
                <Badge className="bg-green-100 text-green-800 mt-1">+8% improvement</Badge>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Citations</p>
                <p className="text-2xl font-bold">192</p>
                <Badge className="bg-purple-100 text-purple-800 mt-1">+28% growth</Badge>
              </div>
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Content Freshness</p>
                <p className="text-2xl font-bold">78%</p>
                <Badge className="bg-orange-100 text-orange-800 mt-1">Needs attention</Badge>
              </div>
              <RefreshCw className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="engagement" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="ai-visibility">AI Visibility</TabsTrigger>
          <TabsTrigger value="semantic">Semantic</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="freshness">Freshness</TabsTrigger>
        </TabsList>

        {/* Content Engagement Report */}
        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Content Engagement Report
              </CardTitle>
              <CardDescription>
                Shows how well your content holds attention and resonates with audiences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Average Time on Page by Content</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="page" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="timeOnPage" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Scroll Depth Distribution</h4>
                  <div className="space-y-4">
                    {engagementData.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{item.page}</span>
                          <span>{item.scrollDepth}%</span>
                        </div>
                        <Progress value={item.scrollDepth} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Topic Performance Analysis */}
        <TabsContent value="topics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Topic Performance Analysis
              </CardTitle>
              <CardDescription>
                Tracks engagement by topic clusters to reveal what themes drive interest
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Topic vs Engagement Bubble Chart</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={topicData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="frequency" name="Frequency" />
                      <YAxis dataKey="engagement" name="Engagement" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter dataKey="size" fill="#10b981" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Top Performing Topics</h4>
                  <div className="space-y-3">
                    {topicData.slice(0, 5).map((topic, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{topic.topic}</div>
                          <div className="text-xs text-muted-foreground">
                            {topic.frequency} articles • {topic.engagement}/10 engagement
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                          Rank #{index + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Most Popular Content */}
        <TabsContent value="popular">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Most Popular Content
              </CardTitle>
              <CardDescription>
                Highlights top-performing content pieces based on engagement signals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {popularContent.map((content, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1">{content.title}</div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{content.views.toLocaleString()} views</span>
                          <span>{content.interactions} interactions</span>
                          <span>{content.completionRate}% completion</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(content.trend)}
                        <Badge variant="outline">#{index + 1}</Badge>
                      </div>
                    </div>
                    <Progress value={content.completionRate} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Visibility & Citation Report */}
        <TabsContent value="ai-visibility">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Visibility & Citation Report
              </CardTitle>
              <CardDescription>
                Tracks when your content is referenced in AI-generated answers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">AI Citation Trend</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={aiVisibilityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="citations" stroke="#8884d8" strokeWidth={2} />
                      <Line type="monotone" dataKey="zeroClick" stroke="#82ca9d" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Citation Distribution</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Google AI Overviews', value: 45 },
                          { name: 'ChatGPT Citations', value: 32 },
                          { name: 'Bing Copilot', value: 23 }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Semantic Structure & Readability */}
        <TabsContent value="semantic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Semantic Structure & Readability Report
              </CardTitle>
              <CardDescription>
                Assesses how well content is structured for machine readability and user comprehension
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {semanticData.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{item.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {item.coverage}% / {item.target}%
                        </span>
                        <Badge
                          variant={item.coverage >= item.target ? "default" : "secondary"}
                          className={item.coverage >= item.target ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                        >
                          {item.coverage >= item.target ? "On Track" : "Needs Work"}
                        </Badge>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress value={item.coverage} className="h-3" />
                      <div
                        className="absolute top-0 w-1 h-3 bg-red-400"
                        style={{ left: `${item.target}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geographic & Localization Performance */}
        <TabsContent value="geographic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Geographic & Localization Performance
              </CardTitle>
              <CardDescription>
                Shows engagement by region for localized content strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Regional Engagement</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={geographicData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="region" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="engagement" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Content Distribution by Region</h4>
                  <div className="space-y-3">
                    {geographicData.map((region, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{region.region}</div>
                          <div className="text-xs text-muted-foreground">
                            Engagement: {region.engagement}/10
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm">{region.content}</div>
                          <div className="text-xs text-muted-foreground">pieces</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Freshness & Update Frequency */}
        <TabsContent value="freshness">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Content Freshness & Update Frequency
              </CardTitle>
              <CardDescription>
                Tracks how often high-value content is updated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Update Frequency Distribution</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={freshnessData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="updates" fill="#06b6d4" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Content Requiring Updates</h4>
                  <div className="space-y-3">
                    <Card className="border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-red-100 text-red-800">Urgent</Badge>
                          <span className="text-sm text-muted-foreground">90+ days old</span>
                        </div>
                        <div className="font-medium text-sm">23 pieces need immediate updates</div>
                        <div className="text-xs text-muted-foreground">
                          High-traffic content with outdated information
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-yellow-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                          <span className="text-sm text-muted-foreground">60-90 days old</span>
                        </div>
                        <div className="font-medium text-sm">8 pieces should be reviewed</div>
                        <div className="text-xs text-muted-foreground">
                          Moderate traffic, check for accuracy
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-green-100 text-green-800">Fresh</Badge>
                          <span className="text-sm text-muted-foreground">Last 30 days</span>
                        </div>
                        <div className="font-medium text-sm">40 pieces recently updated</div>
                        <div className="text-xs text-muted-foreground">
                          Content is current and performing well
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}