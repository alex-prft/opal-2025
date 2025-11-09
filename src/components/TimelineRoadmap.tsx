'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Target,
  Zap,
  TrendingUp,
  Filter,
  PlayCircle,
  PauseCircle
} from 'lucide-react';

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  phase: 'crawl' | 'walk' | 'run' | 'fly';
  startDate: Date;
  endDate: Date;
  progress: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  dependencies: string[];
  assignee?: string;
  estimatedEffort: number; // weeks
  roi: number;
}

interface TimelineRoadmapProps {
  items?: TimelineItem[];
  viewMode?: 'quarters' | 'months' | 'weeks';
}

const phaseConfig = {
  crawl: { label: 'Crawl', color: 'bg-gray-100 text-gray-800', accent: 'bg-gray-500' },
  walk: { label: 'Walk', color: 'bg-blue-100 text-blue-800', accent: 'bg-blue-500' },
  run: { label: 'Run', color: 'bg-green-100 text-green-800', accent: 'bg-green-500' },
  fly: { label: 'Fly', color: 'bg-purple-100 text-purple-800', accent: 'bg-purple-500' }
};

const statusConfig = {
  'not-started': { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100' },
  'in-progress': { icon: PlayCircle, color: 'text-blue-600', bg: 'bg-blue-100' },
  completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  blocked: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' }
};

// Sample timeline data
const sampleTimelineItems: TimelineItem[] = [
  {
    id: '1',
    title: 'Content Performance Audit',
    description: 'Analyze current content effectiveness and identify optimization opportunities',
    phase: 'crawl',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-01-29'),
    progress: 100,
    status: 'completed',
    priority: 'medium',
    category: 'Content Strategy',
    dependencies: [],
    assignee: 'Marketing Team',
    estimatedEffort: 2,
    roi: 150
  },
  {
    id: '2',
    title: 'Basic Personalization Setup',
    description: 'Implement location-based content delivery and basic user segmentation',
    phase: 'walk',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-02-21'),
    progress: 75,
    status: 'in-progress',
    priority: 'high',
    category: 'Personalization',
    dependencies: ['1'],
    assignee: 'Dev Team',
    estimatedEffort: 3,
    roi: 240
  },
  {
    id: '3',
    title: 'A/B Testing Framework',
    description: 'Set up comprehensive experimentation platform and processes',
    phase: 'walk',
    startDate: new Date('2024-02-15'),
    endDate: new Date('2024-03-15'),
    progress: 45,
    status: 'in-progress',
    priority: 'high',
    category: 'Experimentation',
    dependencies: ['1'],
    assignee: 'UX Team',
    estimatedEffort: 4,
    roi: 320
  },
  {
    id: '4',
    title: 'Advanced Analytics Implementation',
    description: 'Deploy comprehensive event tracking and customer journey analysis',
    phase: 'run',
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-04-15'),
    progress: 20,
    status: 'in-progress',
    priority: 'critical',
    category: 'Analytics',
    dependencies: ['2', '3'],
    assignee: 'Data Team',
    estimatedEffort: 6,
    roi: 450
  },
  {
    id: '5',
    title: 'Real-time Personalization Engine',
    description: 'Implement AI-driven dynamic content personalization',
    phase: 'run',
    startDate: new Date('2024-04-01'),
    endDate: new Date('2024-06-15'),
    progress: 0,
    status: 'not-started',
    priority: 'high',
    category: 'AI/ML',
    dependencies: ['4'],
    assignee: 'AI Team',
    estimatedEffort: 10,
    roi: 650
  },
  {
    id: '6',
    title: 'Omnichannel Experience Optimization',
    description: 'Unified personalization across all customer touchpoints',
    phase: 'fly',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-08-30'),
    progress: 0,
    status: 'not-started',
    priority: 'critical',
    category: 'Experience',
    dependencies: ['5'],
    assignee: 'CX Team',
    estimatedEffort: 12,
    roi: 850
  },
  {
    id: '7',
    title: 'Predictive Analytics Platform',
    description: 'AI-powered customer behavior prediction and recommendations',
    phase: 'fly',
    startDate: new Date('2024-07-15'),
    endDate: new Date('2024-10-30'),
    progress: 0,
    status: 'not-started',
    priority: 'medium',
    category: 'AI/ML',
    dependencies: ['5', '6'],
    assignee: 'Data Science',
    estimatedEffort: 14,
    roi: 950
  }
];

export default function TimelineRoadmap({
  items = sampleTimelineItems,
  viewMode = 'months'
}: TimelineRoadmapProps) {
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentViewMode, setCurrentViewMode] = useState(viewMode);

  // Filter items
  const filteredItems = items.filter(item => {
    if (selectedPhase !== 'all' && item.phase !== selectedPhase) return false;
    if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
    return true;
  });

  // Sort by start date
  const sortedItems = [...filteredItems].sort((a, b) =>
    a.startDate.getTime() - b.startDate.getTime()
  );

  // Calculate timeline bounds
  const startDate = new Date(Math.min(...items.map(item => item.startDate.getTime())));
  const endDate = new Date(Math.max(...items.map(item => item.endDate.getTime())));
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const getItemPosition = (item: TimelineItem) => {
    const itemStart = Math.ceil((item.startDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const itemDuration = Math.ceil((item.endDate.getTime() - item.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const left = (itemStart / totalDays) * 100;
    const width = (itemDuration / totalDays) * 100;
    return { left: `${left}%`, width: `${width}%` };
  };

  const getOverallProgress = () => {
    const totalROI = items.reduce((sum, item) => sum + (item.roi * (item.progress / 100)), 0);
    const maxROI = items.reduce((sum, item) => sum + item.roi, 0);
    return maxROI > 0 ? (totalROI / maxROI) * 100 : 0;
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

          <Select value={selectedPhase} onValueChange={setSelectedPhase}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Phases</SelectItem>
              {Object.entries(phaseConfig).map(([phase, config]) => (
                <SelectItem key={phase} value={phase}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not-started">Not Started</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">View:</span>
          <Select value={currentViewMode} onValueChange={setCurrentViewMode}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weeks">Weeks</SelectItem>
              <SelectItem value="months">Months</SelectItem>
              <SelectItem value="quarters">Quarters</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-bold">{Math.round(getOverallProgress())}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <Progress value={getOverallProgress()} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">
                  {items.filter(item => item.status === 'in-progress').length}
                </p>
              </div>
              <PlayCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {items.filter(item => item.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total ROI</p>
                <p className="text-2xl font-bold">
                  {Math.round(items.reduce((sum, item) => sum + item.roi, 0))}%
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Implementation Timeline
          </CardTitle>
          <CardDescription>
            Visual roadmap showing project phases and dependencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Time scale */}
            <div className="relative h-8 bg-gray-50 rounded border">
              <div className="absolute inset-0 flex">
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date(startDate);
                  date.setMonth(date.getMonth() + i);
                  return (
                    <div
                      key={i}
                      className="flex-1 border-r border-gray-200 px-2 py-1 text-xs text-center"
                    >
                      {date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline items */}
            <div className="space-y-3">
              {sortedItems.map((item, index) => {
                const position = getItemPosition(item);
                const StatusIcon = statusConfig[item.status].icon;
                const phaseStyle = phaseConfig[item.phase];

                return (
                  <div key={item.id} className="relative">
                    {/* Item row */}
                    <div className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3 w-80">
                        <StatusIcon className={`h-5 w-5 ${statusConfig[item.status].color}`} />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm">{item.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={phaseStyle.color}>
                              {phaseStyle.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {item.estimatedEffort}w
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Timeline bar */}
                      <div className="flex-1 relative h-6 bg-gray-100 rounded">
                        <div
                          className={`absolute top-0 h-full ${phaseStyle.accent} rounded flex items-center justify-center text-white text-xs font-medium`}
                          style={position}
                        >
                          {item.progress > 0 && `${item.progress}%`}
                        </div>

                        {/* Progress overlay */}
                        {item.progress > 0 && (
                          <div
                            className="absolute top-0 h-full bg-white bg-opacity-30 rounded-r"
                            style={{
                              left: position.left,
                              width: `${parseFloat(position.width) * (item.progress / 100)}%`
                            }}
                          />
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="w-32 text-right">
                        <div className="text-xs text-muted-foreground">{item.assignee}</div>
                        <div className="text-sm font-medium">ROI: {item.roi}%</div>
                      </div>
                    </div>

                    {/* Dependencies */}
                    {item.dependencies.length > 0 && (
                      <div className="ml-12 mt-1 text-xs text-muted-foreground">
                        Dependencies: {item.dependencies.join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(phaseConfig).map(([phase, config]) => {
          const phaseItems = filteredItems.filter(item => item.phase === phase);
          const avgProgress = phaseItems.length > 0
            ? phaseItems.reduce((sum, item) => sum + item.progress, 0) / phaseItems.length
            : 0;

          return (
            <Card key={phase}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${config.accent}`} />
                  {config.label} Phase
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Items</span>
                    <span className="font-medium">{phaseItems.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{Math.round(avgProgress)}%</span>
                  </div>
                  <Progress value={avgProgress} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {phaseItems.filter(item => item.status === 'completed').length} completed,{' '}
                    {phaseItems.filter(item => item.status === 'in-progress').length} in progress
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}