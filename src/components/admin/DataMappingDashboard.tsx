/**
 * Data Mapping Dashboard - Main Admin Interface
 * Comprehensive admin interface for OPAL mapping system management
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
  Database,
  BarChart3,
  Users,
  Zap,
  RefreshCw,
  Eye,
  Edit,
  Save
} from 'lucide-react';
import { MappingSchemaViewer } from './MappingSchemaViewer';
import { PersonalizationRulesEditor } from './PersonalizationRulesEditor';
import { CrossDomainCoordination } from './CrossDomainCoordination';
import { RealTimeMonitoringPanel } from './RealTimeMonitoringPanel';
import {
  MappingType,
  ConsolidatedOpalMapping,
  validateMappingConfiguration
} from '@/lib/schemas/consolidated-mapping-schema';

interface MappingStatus {
  mapping_type: MappingType;
  display_name: string;
  status: 'healthy' | 'degraded' | 'error' | 'loading';
  last_updated: string;
  confidence_score: number;
  api_status: string;
  validation_errors: string[];
}

interface AdminStats {
  total_mappings: number;
  active_rules: number;
  avg_confidence: number;
  system_health: number;
  last_sync: string;
}

export function DataMappingDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [mappingStatuses, setMappingStatuses] = useState<MappingStatus[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<MappingType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);

        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockStatuses: MappingStatus[] = [
          {
            mapping_type: 'strategy-plans',
            display_name: 'Strategy Plans',
            status: 'healthy',
            last_updated: '2025-11-12T10:30:00Z',
            confidence_score: 95,
            api_status: 'connected',
            validation_errors: []
          },
          {
            mapping_type: 'dxp-tools',
            display_name: 'Optimizely DXP Tools',
            status: 'healthy',
            last_updated: '2025-11-12T10:25:00Z',
            confidence_score: 94,
            api_status: 'connected',
            validation_errors: []
          },
          {
            mapping_type: 'analytics-insights',
            display_name: 'Analytics Insights',
            status: 'degraded',
            last_updated: '2025-11-12T10:15:00Z',
            confidence_score: 87,
            api_status: 'testing',
            validation_errors: ['Missing dimension weights configuration']
          },
          {
            mapping_type: 'experience-optimization',
            display_name: 'Experience Optimization',
            status: 'healthy',
            last_updated: '2025-11-12T10:35:00Z',
            confidence_score: 96,
            api_status: 'connected',
            validation_errors: []
          }
        ];

        const mockStats: AdminStats = {
          total_mappings: 4,
          active_rules: 16,
          avg_confidence: 93,
          system_health: 92,
          last_sync: '2025-11-12T10:35:00Z'
        };

        setMappingStatuses(mockStatuses);
        setAdminStats(mockStats);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard loading error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Loading OPAL Mapping Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">OPAL Mapping Administration</h1>
          <p className="text-gray-600 mt-1">
            Manage mapping configurations, personalization rules, and system coordination
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {adminStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Mappings</p>
                  <p className="text-2xl font-bold">{adminStats.total_mappings}</p>
                </div>
                <Database className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Rules</p>
                  <p className="text-2xl font-bold">{adminStats.active_rules}</p>
                </div>
                <Settings className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                  <p className="text-2xl font-bold">{adminStats.avg_confidence}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Health</p>
                  <p className="text-2xl font-bold">{adminStats.system_health}%</p>
                </div>
                <Zap className="h-8 w-8 text-orange-600" />
              </div>
              <Progress value={adminStats.system_health} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schemas">Schema Viewer</TabsTrigger>
          <TabsTrigger value="rules">Personalization</TabsTrigger>
          <TabsTrigger value="coordination">Cross-Domain</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mapping Status Cards */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Mapping Status</h3>
              {mappingStatuses.map((mapping) => (
                <Card key={mapping.mapping_type} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedMapping(mapping.mapping_type)}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(mapping.status)}
                        <h4 className="font-medium">{mapping.display_name}</h4>
                      </div>
                      <Badge variant={mapping.status === 'healthy' ? 'default' : 'secondary'}>
                        {mapping.confidence_score}% confidence
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">API Status:</span>
                        <span className={getStatusColor(mapping.api_status)}>{mapping.api_status}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Last Updated:</span>
                        <span>{new Date(mapping.last_updated).toLocaleString()}</span>
                      </div>
                    </div>

                    {mapping.validation_errors.length > 0 && (
                      <Alert className="mt-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {mapping.validation_errors.length} validation issue(s) detected
                        </AlertDescription>
                      </Alert>
                    )}

                    <Progress value={mapping.confidence_score} className="mt-3" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Quick Actions</h3>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configuration Management</CardTitle>
                  <CardDescription>
                    Manage mapping configurations and validation rules
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View All Schemas
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Personalization Rules
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Cross-Domain Settings
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">System Operations</CardTitle>
                  <CardDescription>
                    System maintenance and health monitoring
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync All Configurations
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    Run Database Migration
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate Health Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Schema Viewer Tab */}
        <TabsContent value="schemas">
          <MappingSchemaViewer selectedMapping={selectedMapping} />
        </TabsContent>

        {/* Personalization Rules Tab */}
        <TabsContent value="rules">
          <PersonalizationRulesEditor />
        </TabsContent>

        {/* Cross-Domain Coordination Tab */}
        <TabsContent value="coordination">
          <CrossDomainCoordination />
        </TabsContent>

        {/* Real-Time Monitoring Tab */}
        <TabsContent value="monitoring">
          <RealTimeMonitoringPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}