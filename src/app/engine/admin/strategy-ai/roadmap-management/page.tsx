'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar, FileText, TrendingUp } from 'lucide-react';

export default function RoadmapManagementPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Strategic Roadmap Management</h1>
        <p className="text-gray-600 mt-1">
          Configure AI-driven roadmap generation and strategic timeline planning
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roadmap Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Roadmap Generation Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Timeline Horizon</Label>
              <Select defaultValue="12">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                  <SelectItem value="18">18 months</SelectItem>
                  <SelectItem value="24">24 months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority Weighting Algorithm</Label>
              <Select defaultValue="impact_effort">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="impact_effort">Impact vs Effort Matrix</SelectItem>
                  <SelectItem value="roi_based">ROI-Based Scoring</SelectItem>
                  <SelectItem value="strategic_alignment">Strategic Alignment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Auto-generate Dependencies</Label>
              <Switch defaultChecked={true} />
            </div>

            <div className="flex items-center justify-between">
              <Label>Include Resource Planning</Label>
              <Switch defaultChecked={false} />
            </div>
          </CardContent>
        </Card>

        {/* Roadmap Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Roadmap Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Fresh Produce Growth</h4>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Active
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  Optimized for fresh produce e-commerce growth strategies
                </p>
                <div className="text-xs text-gray-500">Last used: 2 days ago</div>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Digital Transformation</h4>
                  <Badge variant="outline">
                    Template
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  Standard digital transformation roadmap template
                </p>
                <div className="text-xs text-gray-500">Industry standard</div>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Personalization Maturity</h4>
                  <Badge variant="outline">
                    Template
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  Crawl-Walk-Run-Fly progression template
                </p>
                <div className="text-xs text-gray-500">Optimizely recommended</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Roadmap Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Current Roadmap Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">23</div>
              <div className="text-sm text-blue-700 mt-1">Total Initiatives</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">8</div>
              <div className="text-sm text-green-700 mt-1">In Progress</div>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">12</div>
              <div className="text-sm text-orange-700 mt-1">Planned</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">3</div>
              <div className="text-sm text-purple-700 mt-1">Completed</div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Next Milestone: Q1 2024</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Launch personalized product recommendations</div>
                  <div className="text-xs text-gray-600">Fresh Produce category</div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  85% complete
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Implement advanced audience segmentation</div>
                  <div className="text-xs text-gray-600">Multi-channel targeting</div>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  60% complete
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}