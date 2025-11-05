'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingAnimation, { LoadingPresets } from '@/components/LoadingAnimation';
import {
  Globe,
  MapPin,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users,
  Calendar,
  Filter,
  RefreshCw,
  Download,
  ExternalLink
} from 'lucide-react';

interface GeoAuditData {
  overview: {
    total_regions: number;
    active_markets: number;
    compliance_score: number;
    last_updated: string;
  };
  regional_performance: Array<{
    region: string;
    members: number;
    engagement_rate: number;
    growth_rate: number;
    compliance_status: 'compliant' | 'warning' | 'non-compliant';
    recommendations: string[];
  }>;
  regulatory_analysis: Array<{
    country: string;
    regulations: string[];
    compliance_level: number;
    required_actions: string[];
    deadline?: string;
  }>;
  market_opportunities: Array<{
    region: string;
    opportunity_type: string;
    potential_value: string;
    implementation_effort: 'Low' | 'Medium' | 'High';
    timeline: string;
  }>;
}

export default function GeoAuditDashboard() {
  const [auditData, setAuditData] = useState<GeoAuditData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

  const fetchGeoAuditData = async () => {
    const controller = new AbortController();
    setAbortController(controller);
    setIsLoading(true);
    setShowLoadingOverlay(true);

    try {
      const response = await fetch('/api/tools/geo_audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer opal-personalization-secret-2025'
        },
        body: JSON.stringify({
          analyze_regions: true,
          include_compliance: true,
          include_opportunities: true
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`GEO Audit failed: ${response.status}`);
      }

      const result = await response.json();
      setAuditData(result.data);
      setShowLoadingOverlay(false);
    } catch (error) {
      setShowLoadingOverlay(false);

      if (error instanceof Error && error.name === 'AbortError') {
        console.log('GEO Audit was cancelled by user');
        return;
      }

      console.error('GEO Audit error:', error);

      // Fallback to demo data
      setAuditData({
        overview: {
          total_regions: 45,
          active_markets: 28,
          compliance_score: 87,
          last_updated: new Date().toISOString()
        },
        regional_performance: [
          {
            region: 'North America',
            members: 12450,
            engagement_rate: 73,
            growth_rate: 12,
            compliance_status: 'compliant',
            recommendations: ['Expand midwest outreach', 'Enhance mobile experience']
          },
          {
            region: 'Europe',
            members: 8920,
            engagement_rate: 68,
            growth_rate: 8,
            compliance_status: 'warning',
            recommendations: ['GDPR documentation update', 'Cookie consent optimization']
          },
          {
            region: 'Asia Pacific',
            members: 3450,
            engagement_rate: 81,
            growth_rate: 25,
            compliance_status: 'compliant',
            recommendations: ['Localization improvements', 'Regional content strategy']
          }
        ],
        regulatory_analysis: [
          {
            country: 'European Union',
            regulations: ['GDPR', 'Digital Services Act', 'AI Act'],
            compliance_level: 85,
            required_actions: ['Update privacy policy', 'Implement AI transparency measures'],
            deadline: '2024-12-31'
          },
          {
            country: 'United States',
            regulations: ['CCPA', 'COPPA', 'CAN-SPAM'],
            compliance_level: 92,
            required_actions: ['Annual privacy assessment'],
            deadline: '2024-06-30'
          }
        ],
        market_opportunities: [
          {
            region: 'Latin America',
            opportunity_type: 'Market Expansion',
            potential_value: '$2.3M ARR',
            implementation_effort: 'Medium',
            timeline: '6-9 months'
          },
          {
            region: 'Southeast Asia',
            opportunity_type: 'Partnership Development',
            potential_value: '$1.8M ARR',
            implementation_effort: 'High',
            timeline: '12-15 months'
          }
        ]
      });
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleCancelAudit = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setShowLoadingOverlay(false);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchGeoAuditData();
  }, []);

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'non-compliant': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      {showLoadingOverlay && (
        <LoadingAnimation
          title="Running GEO Audit Analysis"
          description="Analyzing regional performance, compliance status, and market opportunities..."
          estimatedTime={12}
          onCancel={handleCancelAudit}
          variant="overlay"
          cancelButtonText="Cancel Analysis"
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="w-6 h-6" />
              Geographic Audit Dashboard
            </h2>
            <p className="text-muted-foreground">Regional performance, compliance, and market opportunity analysis</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchGeoAuditData} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {auditData && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Regions</p>
                      <p className="text-2xl font-bold">{auditData.overview.total_regions}</p>
                    </div>
                    <Globe className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Markets</p>
                      <p className="text-2xl font-bold">{auditData.overview.active_markets}</p>
                    </div>
                    <MapPin className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Compliance Score</p>
                      <p className="text-2xl font-bold">{auditData.overview.compliance_score}%</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="text-sm font-medium">
                        {new Date(auditData.overview.last_updated).toLocaleDateString()}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="performance" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="performance">Regional Performance</TabsTrigger>
                <TabsTrigger value="compliance">Regulatory Compliance</TabsTrigger>
                <TabsTrigger value="opportunities">Market Opportunities</TabsTrigger>
                <TabsTrigger value="recommendations">Action Items</TabsTrigger>
              </TabsList>

              <TabsContent value="performance" className="space-y-6">
                <div className="grid gap-6">
                  {auditData.regional_performance.map((region, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{region.region}</span>
                          <Badge className={getComplianceColor(region.compliance_status)}>
                            {region.compliance_status.replace('-', ' ').toUpperCase()}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{region.members.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">Members</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{region.engagement_rate}%</div>
                            <div className="text-sm text-muted-foreground">Engagement Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">+{region.growth_rate}%</div>
                            <div className="text-sm text-muted-foreground">Growth Rate</div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Recommendations:</h4>
                          <ul className="space-y-1">
                            {region.recommendations.map((rec, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                                <TrendingUp className="h-3 w-3" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="compliance" className="space-y-6">
                <div className="grid gap-6">
                  {auditData.regulatory_analysis.map((country, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{country.country}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{country.compliance_level}%</span>
                            <Badge variant={country.compliance_level >= 90 ? 'default' : 'secondary'}>
                              {country.compliance_level >= 90 ? 'Excellent' : 'Needs Attention'}
                            </Badge>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Applicable Regulations:</h4>
                            <div className="flex flex-wrap gap-2">
                              {country.regulations.map((reg, idx) => (
                                <Badge key={idx} variant="outline">{reg}</Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Required Actions:</h4>
                            <ul className="space-y-1">
                              {country.required_actions.map((action, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                          {country.deadline && (
                            <div className="pt-2 border-t">
                              <div className="text-sm text-red-600 font-medium">
                                Deadline: {new Date(country.deadline).toLocaleDateString()}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="opportunities" className="space-y-6">
                <div className="grid gap-6">
                  {auditData.market_opportunities.map((opportunity, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{opportunity.region}</h3>
                            <p className="text-muted-foreground">{opportunity.opportunity_type}</p>
                          </div>
                          <Badge className={getEffortColor(opportunity.implementation_effort)}>
                            {opportunity.implementation_effort} Effort
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Potential Value</div>
                            <div className="text-xl font-bold text-green-600">{opportunity.potential_value}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Timeline</div>
                            <div className="font-medium">{opportunity.timeline}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Prioritized Action Items</CardTitle>
                    <CardDescription>
                      Key recommendations based on audit findings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Card className="border-l-4 border-l-red-500 bg-red-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <span className="font-medium text-red-600">High Priority</span>
                          </div>
                          <p className="text-sm">Update GDPR compliance documentation for European markets</p>
                          <p className="text-xs text-muted-foreground mt-1">Deadline: Dec 31, 2024</p>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-l-yellow-500 bg-yellow-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-yellow-600" />
                            <span className="font-medium text-yellow-600">Medium Priority</span>
                          </div>
                          <p className="text-sm">Expand market presence in Asia Pacific region</p>
                          <p className="text-xs text-muted-foreground mt-1">Estimated ROI: +25% growth</p>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-l-green-500 bg-green-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-600">Low Priority</span>
                          </div>
                          <p className="text-sm">Optimize mobile experience for North American members</p>
                          <p className="text-xs text-muted-foreground mt-1">Incremental improvement opportunity</p>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </>
  );
}