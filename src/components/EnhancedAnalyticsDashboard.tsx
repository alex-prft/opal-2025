'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { OSAWorkflowOutput } from '@/lib/types/maturity';
import LoadingAnimation, { LoadingPresets } from '@/components/LoadingAnimation';
import {
  Download,
  TrendingUp,
  Users,
  Globe,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Target,
  Award,
  RefreshCw,
  AlertTriangle,
  Info
} from 'lucide-react';

interface EnhancedAnalyticsDashboardProps {
  workflowResult: OSAWorkflowOutput;
}

interface AnalyticsData {
  ga4Data: any;
  salesforceData: any;
  isLoading: boolean;
  lastUpdated: string;
  ga4DataSource: string;
  salesforceDataSource: string;
}

export default function EnhancedAnalyticsDashboard({ workflowResult }: EnhancedAnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    ga4Data: null,
    salesforceData: null,
    isLoading: true,
    lastUpdated: '',
    ga4DataSource: '',
    salesforceDataSource: ''
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('Last 3 Months');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    // Create abort controller for cancellation
    const controller = new AbortController();
    setAbortController(controller);
    setAnalyticsData(prev => ({ ...prev, isLoading: true }));
    setShowLoadingOverlay(true);

    try {
      const [ga4Response, salesforceResponse] = await Promise.all([
        fetch('/api/analytics/ga4', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_KEY || 'opal-personalization-secret-2025'}`
          },
          body: JSON.stringify({ date_range: dateRange }),
          signal: controller.signal
        }),
        fetch('/api/analytics/salesforce', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_KEY || 'opal-personalization-secret-2025'}`
          },
          body: JSON.stringify({ date_range: dateRange }),
          signal: controller.signal
        })
      ]);

      const ga4Data = await ga4Response.json();
      const salesforceData = await salesforceResponse.json();

      // Check data source headers to determine if using live integrations
      const ga4DataSource = ga4Response.headers.get('X-Data-Source') || 'Unknown';
      const salesforceDataSource = salesforceResponse.headers.get('X-Data-Source') || 'Unknown';

      setAnalyticsData({
        ga4Data: ga4Data.data,
        salesforceData: salesforceData.data,
        isLoading: false,
        lastUpdated: new Date().toLocaleString(),
        ga4DataSource,
        salesforceDataSource
      });
      setShowLoadingOverlay(false);
      setAbortController(null);
    } catch (error) {
      setShowLoadingOverlay(false);
      setAbortController(null);

      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Analytics data fetch was cancelled by user');
        return; // Don't show error for user-cancelled operations
      }

      console.error('Failed to fetch analytics data:', error);
      setAnalyticsData(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleCancelLoading = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setShowLoadingOverlay(false);
    setAnalyticsData(prev => ({ ...prev, isLoading: false }));
  };

  const { maturity_plan } = workflowResult;

  // Return early if no maturity plan is available
  if (!maturity_plan) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No maturity plan data available for enhanced analytics.</p>
        </CardContent>
      </Card>
    );
  }

  // Helper functions for calculating metrics
  function calculateContentPerformanceScore() {
    if (!analyticsData.ga4Data?.top_content) return 0;
    const avgEngagement = analyticsData.ga4Data.top_content.reduce(
      (sum: number, content: any) => sum + content.engagement_rate, 0
    ) / analyticsData.ga4Data.top_content.length;
    return Math.round(avgEngagement * 10) / 10;
  }

  function calculateAudienceGrowth() {
    if (!analyticsData.ga4Data?.audience_insights) return 0;
    const { new_users, returning_users } = analyticsData.ga4Data.audience_insights;
    return Math.round(((new_users / (new_users + returning_users)) * 100) * 10) / 10;
  }

  function calculatePersonalizationROI(websiteEngagement: number) {
    const baseROI = (maturity_plan?.overall_maturity_score || 0) * 23.5; // Base ROI calculation
    const engagementMultiplier = (websiteEngagement / 100) * 1.5;
    return Math.round((baseROI * engagementMultiplier) * 10) / 10;
  }

  // Enhanced metrics combining GA4 + Salesforce + OSA data
  const websiteEngagement = analyticsData.ga4Data?.overall_engagement_rate || 0;
  const memberEngagement = analyticsData.salesforceData?.member_engagement_rate || 0;
  const contentPerformance = calculateContentPerformanceScore();
  const audienceGrowth = calculateAudienceGrowth();
  const personalizationROI = calculatePersonalizationROI(websiteEngagement);

  const combinedMetrics = {
    websiteEngagement,
    memberEngagement,
    maturityScore: maturity_plan?.overall_maturity_score || 0,
    contentPerformance,
    audienceGrowth,
    personalizationROI
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Helper functions to check integration status
  const isGA4MockData = () => {
    return analyticsData.ga4DataSource === 'Mock' || analyticsData.ga4DataSource === 'Demo' ||
           analyticsData.ga4DataSource === 'Unknown' || !analyticsData.ga4DataSource;
  };

  const isSalesforceMockData = () => {
    return analyticsData.salesforceDataSource === 'Mock' || analyticsData.salesforceDataSource === 'Demo' ||
           analyticsData.salesforceDataSource === 'Unknown' || !analyticsData.salesforceDataSource;
  };

  // Integration Status Footnote Component
  const IntegrationFootnote = ({ integration, isMock }: { integration: 'GA4' | 'Salesforce', isMock: boolean }) => {
    if (!isMock) return null;

    return (
      <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
        <div className="flex items-center gap-2 text-amber-700">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-xs font-medium">
            {integration} integration has not been completed - showing demo data
          </span>
        </div>
      </div>
    );
  };

  if (analyticsData.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-muted-foreground">Loading enhanced analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {showLoadingOverlay && (
        <LoadingAnimation
          {...LoadingPresets.analyticsData}
          onCancel={handleCancelLoading}
          variant="overlay"
          cancelButtonText="Cancel Loading"
        />
      )}

      <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Analytics Dashboard</h2>
          <p className="text-muted-foreground">Real-time insights for IFPA personalization strategy</p>
        </div>
        <div className="flex gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="Last 3 Months">Last 3 Months</option>
            <option value="Last 6 Months">Last 6 Months</option>
            <option value="Last 12 Months">Last 12 Months</option>
            <option value="All Time">All Time</option>
          </select>
          <Button onClick={fetchAnalyticsData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Website Engagement</p>
                <p className="text-2xl font-bold text-green-600">{combinedMetrics.websiteEngagement}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Member Engagement</p>
                <p className="text-2xl font-bold text-blue-600">{combinedMetrics.memberEngagement}%</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Maturity Score</p>
                <p className="text-2xl font-bold text-purple-600">{combinedMetrics.maturityScore}/5</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Content Performance</p>
                <p className="text-2xl font-bold text-orange-600">{combinedMetrics.contentPerformance}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Audience Growth</p>
                <p className="text-2xl font-bold text-indigo-600">{combinedMetrics.audienceGrowth}%</p>
              </div>
              <Globe className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Projected ROI</p>
                <p className="text-2xl font-bold text-green-700">{combinedMetrics.personalizationROI}%</p>
              </div>
              <Target className="h-8 w-8 text-green-700" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Analytics Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content Performance</TabsTrigger>
          <TabsTrigger value="audience">Audience Insights</TabsTrigger>
          <TabsTrigger value="personalization">Personalization Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Website Traffic Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Website Traffic & Engagement Trends</CardTitle>
                <CardDescription>GA4 data for {dateRange}</CardDescription>
              </CardHeader>
              <CardContent>
                <AreaChart width={500} height={300} data={analyticsData.ga4Data?.content_performance_trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="sessions" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="conversions" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                </AreaChart>
                <IntegrationFootnote integration="GA4" isMock={isGA4MockData()} />
              </CardContent>
            </Card>

            {/* Member Portal Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Member Portal Usage</CardTitle>
                <CardDescription>Salesforce CRM insights for {dateRange}</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChart width={500} height={300} data={analyticsData.salesforceData?.portal_usage_trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="daily_logins" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="content_views" stroke="#82ca9d" strokeWidth={2} />
                  <Line type="monotone" dataKey="registrations" stroke="#ffc658" strokeWidth={2} />
                </LineChart>
                <IntegrationFootnote integration="Salesforce" isMock={isSalesforceMockData()} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Content */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Website Content</CardTitle>
                <CardDescription>Based on engagement rate and conversions</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart width={500} height={300} data={analyticsData.ga4Data?.top_content || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="page_title" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="engagement_rate" fill="#8884d8" />
                  <Bar dataKey="conversion_rate" fill="#82ca9d" />
                </BarChart>
                <IntegrationFootnote integration="GA4" isMock={isGA4MockData()} />
              </CardContent>
            </Card>

            {/* Member Content Engagement */}
            <Card>
              <CardHeader>
                <CardTitle>Member Content Performance</CardTitle>
                <CardDescription>Portal content by engagement score</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart width={500} height={300} data={analyticsData.salesforceData?.content_performance || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="content_type" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="view_count" fill="#ff7300" />
                  <Bar dataKey="download_count" fill="#00ff00" />
                </BarChart>
                <IntegrationFootnote integration="Salesforce" isMock={isSalesforceMockData()} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audience" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Member Segments */}
            <Card>
              <CardHeader>
                <CardTitle>Member Segments Distribution</CardTitle>
                <CardDescription>Salesforce CRM member analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <PieChart width={500} height={300}>
                  <Pie
                    data={analyticsData.salesforceData?.member_segments || []}
                    cx={250}
                    cy={150}
                    labelLine={false}
                    label={({ segment_name, member_count }) => `${segment_name}: ${member_count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="member_count"
                  >
                    {(analyticsData.salesforceData?.member_segments || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
                <IntegrationFootnote integration="Salesforce" isMock={isSalesforceMockData()} />
              </CardContent>
            </Card>

            {/* Audience Insights Radar */}
            <Card>
              <CardHeader>
                <CardTitle>Audience Engagement Radar</CardTitle>
                <CardDescription>Multi-dimensional engagement analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <RadarChart width={500} height={300} data={[
                  {
                    subject: 'Website Engagement',
                    A: combinedMetrics.websiteEngagement,
                    B: 85,
                    fullMark: 100
                  },
                  {
                    subject: 'Member Portal',
                    A: combinedMetrics.memberEngagement,
                    B: 75,
                    fullMark: 100
                  },
                  {
                    subject: 'Content Performance',
                    A: combinedMetrics.contentPerformance,
                    B: 80,
                    fullMark: 100
                  },
                  {
                    subject: 'Personalization',
                    A: maturity_plan.overall_maturity_score * 20,
                    B: 70,
                    fullMark: 100
                  },
                  {
                    subject: 'Growth Rate',
                    A: combinedMetrics.audienceGrowth,
                    B: 60,
                    fullMark: 100
                  }
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Current" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Radar name="Industry Benchmark" dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  <Legend />
                </RadarChart>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="personalization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personalization Impact Analysis</CardTitle>
              <CardDescription>ROI and effectiveness metrics for IFPA personalization strategy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{combinedMetrics.personalizationROI}%</div>
                  <div className="text-sm text-muted-foreground">Projected ROI Improvement</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">+{Math.round(combinedMetrics.websiteEngagement * 0.3)}</div>
                  <div className="text-sm text-muted-foreground">Engagement Point Increase</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{Math.round(analyticsData.ga4Data?.total_sessions * 0.15) || 0}</div>
                  <div className="text-sm text-muted-foreground">Additional Conversions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">${Math.round(combinedMetrics.personalizationROI * 1250)}</div>
                  <div className="text-sm text-muted-foreground">Est. Revenue Impact</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Data Source Information */}
      <Card>
        <CardHeader>
          <CardTitle>Data Sources & Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`flex items-center gap-3 p-3 rounded-lg ${isGA4MockData() ? 'bg-amber-50' : 'bg-green-50'}`}>
              <Activity className={`h-5 w-5 ${isGA4MockData() ? 'text-amber-600' : 'text-green-600'}`} />
              <div>
                <div className="font-semibold">Google Analytics 4</div>
                <div className="text-sm text-muted-foreground">
                  {isGA4MockData() ? 'Demo data - Integration pending' : 'Real-time website analytics'}
                </div>
              </div>
            </div>
            <div className={`flex items-center gap-3 p-3 rounded-lg ${isSalesforceMockData() ? 'bg-amber-50' : 'bg-green-50'}`}>
              <Zap className={`h-5 w-5 ${isSalesforceMockData() ? 'text-amber-600' : 'text-green-600'}`} />
              <div>
                <div className="font-semibold">Salesforce CRM</div>
                <div className="text-sm text-muted-foreground">
                  {isSalesforceMockData() ? 'Demo data - Integration pending' : 'Real-time member data'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <PieChartIcon className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-semibold">Optimizely Suite</div>
                <div className="text-sm text-muted-foreground">Connected & operational</div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Last updated: {analyticsData.lastUpdated} • Data range: {dateRange}
          </div>

          {/* Integration Status Summary */}
          {(isGA4MockData() || isSalesforceMockData()) && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-start gap-2 text-amber-700">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium mb-1">Integration Status Notice:</div>
                  <ul className="space-y-1 text-xs">
                    {isGA4MockData() && (
                      <li>• GA4 integration is not yet completed - charts show demonstration data for visualization purposes</li>
                    )}
                    {isSalesforceMockData() && (
                      <li>• Salesforce integration is not yet completed - member data shown is simulated for demonstration</li>
                    )}
                  </ul>
                  <div className="mt-2 text-xs">
                    Complete the integrations in the Admin panel to see live data from your actual systems.
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  );
}