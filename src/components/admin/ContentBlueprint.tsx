'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronRight,
  Layers,
  Database,
  BarChart3,
  Activity,
  Zap,
  Cpu,
  Eye,
  Gauge
} from 'lucide-react';

interface Widget {
  name: string;
  components: string[];
  data_sources: string[];
  visualizations: string[];
}

interface BlueprintTier {
  [tierName: string]: {
    widgets: Widget[];
  };
}

interface ContentBlueprintProps {
  data?: BlueprintTier;
  isLoading?: boolean;
}

export default function ContentBlueprint({ data = {}, isLoading = false }: ContentBlueprintProps) {
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(new Set());
  const [expandedWidgets, setExpandedWidgets] = useState<Set<string>>(new Set());

  // Toggle tier expansion
  const toggleTier = (tierName: string) => {
    const newExpanded = new Set(expandedTiers);
    if (newExpanded.has(tierName)) {
      newExpanded.delete(tierName);
    } else {
      newExpanded.add(tierName);
    }
    setExpandedTiers(newExpanded);
  };

  // Toggle widget expansion
  const toggleWidget = (widgetKey: string) => {
    const newExpanded = new Set(expandedWidgets);
    if (newExpanded.has(widgetKey)) {
      newExpanded.delete(widgetKey);
    } else {
      newExpanded.add(widgetKey);
    }
    setExpandedWidgets(newExpanded);
  };

  // Get icon for visualization type
  const getVisualizationIcon = (visualization: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'LineChart': <BarChart3 className="h-3 w-3" />,
      'MilestoneHeatmap': <Activity className="h-3 w-3" />,
      'StatusGrid': <Layers className="h-3 w-3" />,
      'PerformanceChart': <Gauge className="h-3 w-3" />,
      'AlertPanel': <Zap className="h-3 w-3" />,
      'HeatMap': <Activity className="h-3 w-3" />,
      'TrendChart': <BarChart3 className="h-3 w-3" />,
      'TopicCloud': <Eye className="h-3 w-3" />,
      'SemanticMap': <Cpu className="h-3 w-3" />,
      'GeoChart': <Database className="h-3 w-3" />,
      'FreshnessIndicator': <Zap className="h-3 w-3" />
    };

    return iconMap[visualization] || <BarChart3 className="h-3 w-3" />;
  };

  // Get color for data source
  const getDataSourceColor = (source: string) => {
    const colorMap: { [key: string]: string } = {
      'OPAL API': 'bg-blue-100 text-blue-800 border-blue-200',
      'Optimizely CMS': 'bg-green-100 text-green-800 border-green-200',
      'ODP': 'bg-purple-100 text-purple-800 border-purple-200',
      'System Monitoring': 'bg-orange-100 text-orange-800 border-orange-200',
      'Google Analytics': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Content Analytics': 'bg-pink-100 text-pink-800 border-pink-200',
      'Search Console': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Content Database': 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return colorMap[source] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Calculate health indicator based on data sources
  const getHealthIndicator = (dataSources: string[]) => {
    const healthyCount = dataSources.filter(source =>
      !source.includes('placeholder') && source !== 'Mock Data'
    ).length;

    const totalCount = dataSources.length;
    const healthPercentage = totalCount > 0 ? (healthyCount / totalCount) * 100 : 0;

    if (healthPercentage >= 90) return { status: 'healthy', color: 'text-green-600', label: '✅' };
    if (healthPercentage >= 70) return { status: 'warning', color: 'text-yellow-600', label: '⚠️' };
    return { status: 'error', color: 'text-red-600', label: '❌' };
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Blueprint</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading blueprint data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tiers = Object.keys(data);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Content Blueprint
        </CardTitle>
        <p className="text-sm text-gray-600">
          Widget hierarchy and data source configuration for each tier
        </p>
      </CardHeader>
      <CardContent>
        {tiers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No blueprint configuration available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tiers.map((tierName) => {
              const tierData = data[tierName];
              const isExpanded = expandedTiers.has(tierName);

              return (
                <Collapsible
                  key={tierName}
                  open={isExpanded}
                  onOpenChange={() => toggleTier(tierName)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start p-4 h-auto border border-gray-200 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span className="font-medium text-lg">{tierName}</span>
                          <Badge variant="outline" className="ml-2">
                            {tierData.widgets?.length || 0} widgets
                          </Badge>
                        </div>
                      </div>
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="mt-2">
                    <div className="pl-6 space-y-3">
                      {tierData.widgets?.map((widget, widgetIndex) => {
                        const widgetKey = `${tierName}-${widget.name}-${widgetIndex}`;
                        const isWidgetExpanded = expandedWidgets.has(widgetKey);
                        const healthIndicator = getHealthIndicator(widget.data_sources);

                        return (
                          <Collapsible
                            key={widgetKey}
                            open={isWidgetExpanded}
                            onOpenChange={() => toggleWidget(widgetKey)}
                          >
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start p-3 h-auto"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2">
                                    {isWidgetExpanded ? (
                                      <ChevronDown className="h-3 w-3" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3" />
                                    )}
                                    <span className="font-medium">{widget.name}</span>
                                    <span className={`text-sm ${healthIndicator.color}`}>
                                      {healthIndicator.label}
                                    </span>
                                  </div>
                                </div>
                              </Button>
                            </CollapsibleTrigger>

                            <CollapsibleContent className="mt-2">
                              <div className="pl-6 space-y-3 bg-gray-50 p-4 rounded-md">
                                {/* Components */}
                                <div>
                                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <Cpu className="h-4 w-4" />
                                    Components ({widget.components.length})
                                  </h5>
                                  <div className="flex flex-wrap gap-1">
                                    {widget.components.map((component, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {component}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                {/* Data Sources */}
                                <div>
                                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <Database className="h-4 w-4" />
                                    Data Sources ({widget.data_sources.length})
                                  </h5>
                                  <div className="flex flex-wrap gap-1">
                                    {widget.data_sources.map((source, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className={`text-xs ${getDataSourceColor(source)}`}
                                      >
                                        {source}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                {/* Visualizations */}
                                <div>
                                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4" />
                                    Visualizations ({widget.visualizations.length})
                                  </h5>
                                  <div className="flex flex-wrap gap-1">
                                    {widget.visualizations.map((viz, idx) => (
                                      <Badge key={idx} variant="default" className="text-xs bg-indigo-100 text-indigo-800">
                                        <span className="mr-1">{getVisualizationIcon(viz)}</span>
                                        {viz}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}