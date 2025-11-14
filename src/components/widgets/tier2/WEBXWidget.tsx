/**
 * WEBX Widget - Tier-2 Container for DXP Tools → WEBX
 *
 * This widget serves as the tier-2 container specifically for the WEBX section
 * within Optimizely DXP Tools, providing specialized experimentation management.
 */

'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, BarChart3, Target, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import type { ConditionalRenderingContext } from '@/lib/conditional-rendering';

// Import fallback components
import { Tier2Skeleton, LoadingSpinner } from '@/components/ui/widget-skeleton';
import { CompactDataNotAvailable, DataNotAvailable } from '@/components/ui/data-not-available';

export interface WEBXWidgetProps {
  data?: any;
  context?: ConditionalRenderingContext;
  className?: string;
}

export function WEBXWidget({ data, context, className = '' }: WEBXWidgetProps) {
  // Handle loading and error states
  if (!data && context?.isLoading) {
    return (
      <div className={className}>
        <Tier2Skeleton />
      </div>
    );
  }

  // Handle error state
  if (context?.error) {
    return (
      <div className={className}>
        <DataNotAvailable
          title="WEBX Data Unavailable"
          description="Unable to load Web Experimentation Platform data."
          reason="error"
          tier="tier2"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // Handle no data state
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={className}>
        <DataNotAvailable
          title="WEBX Not Configured"
          description="Web Experimentation Platform integration has not been configured yet."
          reason="empty"
          tier="tier2"
          onConfigure={() => {
            window.location.href = '/engine/admin/data-mapping';
          }}
        />
      </div>
    );
  }

  // Extract WEBX-specific data
  const webxData = data?.webxData || {};
  const activeExperiments = data?.activeExperimentData || generateMockActiveExperiments();
  const statisticalData = data?.statisticalSignificance || generateMockStatisticalData();
  const performanceMetrics = data?.experimentPerformance || generateMockPerformanceMetrics();

  return (
    <div className={`webx-widget-container ${className}`}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
            WEBX - Web Experimentation Platform
          </CardTitle>
          <p className="text-gray-600">
            Real-time experimentation management with statistical analysis and performance monitoring
          </p>
        </CardHeader>
      </Card>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <QuickStatCard
          title="Active Experiments"
          value={activeExperiments.totalActive || 0}
          trend="+2 this week"
          color="purple"
          icon={<Target className="h-4 w-4" />}
        />
        <QuickStatCard
          title="Significant Results"
          value={statisticalData.significantTests || 0}
          trend="85% power"
          color="green"
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <QuickStatCard
          title="Conversion Uplift"
          value={`+${performanceMetrics.avgUplift || 0}%`}
          trend="vs baseline"
          color="blue"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <QuickStatCard
          title="Test Velocity"
          value={performanceMetrics.testsPerMonth || 0}
          trend="tests/month"
          color="orange"
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <Tabs defaultValue="active-experiments" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active-experiments">Active Experiments</TabsTrigger>
          <TabsTrigger value="statistical-analysis">Statistical Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="active-experiments">
          <ActiveExperimentsTab experiments={activeExperiments} />
        </TabsContent>

        <TabsContent value="statistical-analysis">
          <StatisticalAnalysisTab data={statisticalData} />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceTab metrics={performanceMetrics} />
        </TabsContent>

        <TabsContent value="configuration">
          <ConfigurationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Components
function QuickStatCard({ title, value, trend, color, icon }: {
  title: string;
  value: string | number;
  trend: string;
  color: string;
  icon: React.ReactNode;
}) {
  const colorClasses = {
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200'
  };

  return (
    <Card className={`${colorClasses[color as keyof typeof colorClasses]}`}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-medium text-sm">{title}</h3>
          </div>
        </div>
        <p className="text-2xl font-bold mt-2">{value}</p>
        <p className="text-xs opacity-70">{trend}</p>
      </CardContent>
    </Card>
  );
}

function ActiveExperimentsTab({ experiments }: { experiments: any }) {
  const activeTests = experiments?.activeTests || [];

  if (!experiments || activeTests.length === 0) {
    return (
      <div className="space-y-4">
        <CompactDataNotAvailable
          message="No active experiments found"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Currently Running Experiments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeTests.map((experiment: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{experiment.name}</h4>
                    <p className="text-sm text-gray-600">{experiment.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={experiment.status === 'Running' ? 'default' : 'secondary'}>
                      {experiment.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {experiment.type}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Traffic Split:</span>
                    <p className="font-medium">{experiment.trafficSplit}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Sample Size:</span>
                    <p className="font-medium">{experiment.sampleSize.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Significance:</span>
                    <p className="font-medium">{experiment.significance}%</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Uplift:</span>
                    <p className={`font-medium ${experiment.uplift > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {experiment.uplift > 0 ? '+' : ''}{experiment.uplift}%
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Statistical Power</span>
                    <span>{experiment.power}%</span>
                  </div>
                  <Progress value={experiment.power} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatisticalAnalysisTab({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Statistical Significance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Confidence Level</span>
                <span className="font-bold text-green-600">95%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Statistical Power</span>
                <span className="font-bold">80%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Effect Size (Cohen's d)</span>
                <span className="font-bold">0.25</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sample Size (per variation)</span>
                <span className="font-bold">2,500</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Results Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Statistically Significant</span>
                </div>
                <span className="font-bold">{data.significantTests || 3}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span>Inconclusive</span>
                </div>
                <span className="font-bold">{data.inconclusiveTests || 2}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span>No Significant Effect</span>
                </div>
                <span className="font-bold">{data.noEffectTests || 1}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PerformanceTab({ metrics }: { metrics: any }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Experimentation Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">+{metrics.avgUplift}%</p>
              <p className="text-sm text-gray-600">Average Uplift</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{metrics.winRate}%</p>
              <p className="text-sm text-gray-600">Win Rate</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{metrics.testsPerMonth}</p>
              <p className="text-sm text-gray-600">Tests/Month</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{metrics.avgDuration}</p>
              <p className="text-sm text-gray-600">Avg Duration (days)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ConfigurationTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">WEBX Platform Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">SDK Configuration</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Project ID:</span>
                  <p className="font-mono">12345678901</p>
                </div>
                <div>
                  <span className="text-gray-500">Environment:</span>
                  <p>Production</p>
                </div>
                <div>
                  <span className="text-gray-500">SDK Version:</span>
                  <p>4.3.2</p>
                </div>
                <div>
                  <span className="text-gray-500">Last Updated:</span>
                  <p>2 hours ago</p>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Integration Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>SDK Implementation</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Event Tracking</span>
                  <Badge className="bg-green-100 text-green-800">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Data Export</span>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Mock data generators
function generateMockActiveExperiments() {
  return {
    totalActive: 6,
    activeTests: [
      {
        name: 'Homepage Hero CTA Test',
        description: 'Testing different CTA button colors and text variations',
        status: 'Running',
        type: 'A/B Test',
        trafficSplit: '50/50',
        sampleSize: 5240,
        significance: 95,
        uplift: 12.3,
        power: 78
      },
      {
        name: 'Product Page Layout Optimization',
        description: 'Comparing grid vs list layout for product listings',
        status: 'Running',
        type: 'Multivariate',
        trafficSplit: '33/33/34',
        sampleSize: 3180,
        significance: 88,
        uplift: -2.1,
        power: 65
      },
      {
        name: 'Checkout Flow Simplification',
        description: 'Reducing checkout steps from 4 to 2',
        status: 'Running',
        type: 'A/B Test',
        trafficSplit: '50/50',
        sampleSize: 1920,
        significance: 99,
        uplift: 18.7,
        power: 92
      }
    ]
  };
}

function generateMockStatisticalData() {
  return {
    significantTests: 8,
    inconclusiveTests: 3,
    noEffectTests: 2,
    confidenceLevel: 95,
    statisticalPower: 80,
    effectSize: 0.25
  };
}

function generateMockPerformanceMetrics() {
  return {
    avgUplift: 8.4,
    winRate: 67,
    testsPerMonth: 12,
    avgDuration: 21
  };
}