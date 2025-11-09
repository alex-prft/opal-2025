'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Star,
  Clock,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Filter,
  Zap
} from 'lucide-react';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: number; // 1-10
  effort: number; // 1-10
  phase: 'crawl' | 'walk' | 'run' | 'fly';
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: string;
  roi: number;
}

interface ImpactEffortMatrixProps {
  recommendations: Recommendation[];
  onRecommendationClick?: (recommendation: Recommendation) => void;
}

const phaseConfig = {
  crawl: {
    label: 'Crawl',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    dotColor: 'bg-gray-500'
  },
  walk: {
    label: 'Walk',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    dotColor: 'bg-blue-500'
  },
  run: {
    label: 'Run',
    color: 'bg-green-100 text-green-800 border-green-300',
    dotColor: 'bg-green-500'
  },
  fly: {
    label: 'Fly',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    dotColor: 'bg-purple-500'
  }
};

const priorityConfig = {
  critical: { icon: AlertCircle, color: 'text-red-600' },
  high: { icon: Star, color: 'text-orange-600' },
  medium: { icon: Target, color: 'text-blue-600' },
  low: { icon: Clock, color: 'text-gray-600' }
};

// Sample recommendations data
const sampleRecommendations: Recommendation[] = [
  {
    id: '1',
    title: 'Implement Basic Personalization',
    description: 'Set up location-based content delivery',
    impact: 8,
    effort: 3,
    phase: 'walk',
    category: 'Personalization',
    priority: 'high',
    estimatedTime: '2-3 weeks',
    roi: 240
  },
  {
    id: '2',
    title: 'A/B Test Homepage Hero',
    description: 'Test different hero banner messages',
    impact: 6,
    effort: 2,
    phase: 'crawl',
    category: 'Experimentation',
    priority: 'medium',
    estimatedTime: '1 week',
    roi: 150
  },
  {
    id: '3',
    title: 'Advanced Analytics Setup',
    description: 'Implement comprehensive event tracking',
    impact: 9,
    effort: 7,
    phase: 'run',
    category: 'Analytics',
    priority: 'high',
    estimatedTime: '6-8 weeks',
    roi: 420
  },
  {
    id: '4',
    title: 'AI-Powered Content Recommendations',
    description: 'Deploy machine learning content engine',
    impact: 10,
    effort: 9,
    phase: 'fly',
    category: 'AI/ML',
    priority: 'critical',
    estimatedTime: '3-4 months',
    roi: 650
  },
  {
    id: '5',
    title: 'Mobile App Push Notifications',
    description: 'Personalized mobile engagement',
    impact: 7,
    effort: 4,
    phase: 'walk',
    category: 'Mobile',
    priority: 'medium',
    estimatedTime: '3-4 weeks',
    roi: 180
  },
  {
    id: '6',
    title: 'Content Performance Audit',
    description: 'Analyze top performing content patterns',
    impact: 5,
    effort: 2,
    phase: 'crawl',
    category: 'Content',
    priority: 'low',
    estimatedTime: '1 week',
    roi: 120
  },
  {
    id: '7',
    title: 'Real-time Personalization Engine',
    description: 'Dynamic content based on user behavior',
    impact: 9,
    effort: 8,
    phase: 'fly',
    category: 'Personalization',
    priority: 'high',
    estimatedTime: '2-3 months',
    roi: 580
  },
  {
    id: '8',
    title: 'Social Media Integration',
    description: 'Connect social signals to personalization',
    impact: 4,
    effort: 6,
    phase: 'run',
    category: 'Social',
    priority: 'low',
    estimatedTime: '4-5 weeks',
    roi: 90
  }
];

export default function ImpactEffortMatrix({
  recommendations = sampleRecommendations,
  onRecommendationClick
}: ImpactEffortMatrixProps) {
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Filter recommendations
  const filteredRecommendations = recommendations.filter(rec => {
    if (selectedPhase !== 'all' && rec.phase !== selectedPhase) return false;
    if (selectedCategory !== 'all' && rec.category !== selectedCategory) return false;
    return true;
  });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(recommendations.map(r => r.category)))];

  // Matrix dimensions (effort = x-axis, impact = y-axis)
  const matrixSize = 400;
  const padding = 40;

  const getPosition = (recommendation: Recommendation) => {
    const x = ((recommendation.effort - 1) / 9) * (matrixSize - padding * 2) + padding;
    const y = matrixSize - padding - ((recommendation.impact - 1) / 9) * (matrixSize - padding * 2);
    return { x, y };
  };

  const getQuadrantInfo = (impact: number, effort: number) => {
    if (impact >= 6 && effort <= 5) return { name: 'Quick Wins', color: 'bg-green-100', priority: 'Do First' };
    if (impact >= 6 && effort > 5) return { name: 'Major Projects', color: 'bg-blue-100', priority: 'Plan Carefully' };
    if (impact < 6 && effort <= 5) return { name: 'Fill-ins', color: 'bg-yellow-100', priority: 'Do Later' };
    return { name: 'Thankless Tasks', color: 'bg-red-100', priority: 'Avoid' };
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter by:</span>
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

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-3 ml-auto">
          <span className="text-sm text-muted-foreground">
            Showing {filteredRecommendations.length} of {recommendations.length} recommendations
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Matrix Visualization */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Impact vs Effort Matrix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <div className="relative">
                <svg width={matrixSize} height={matrixSize} className="border rounded-lg">
                  {/* Background quadrants */}
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width={matrixSize} height={matrixSize} fill="url(#grid)" />

                  {/* Quadrant backgrounds */}
                  <rect
                    x={padding}
                    y={padding}
                    width={(matrixSize - padding * 2) / 2}
                    height={(matrixSize - padding * 2) / 2}
                    fill="#dcfce7"
                    opacity="0.3"
                  />
                  <rect
                    x={padding + (matrixSize - padding * 2) / 2}
                    y={padding}
                    width={(matrixSize - padding * 2) / 2}
                    height={(matrixSize - padding * 2) / 2}
                    fill="#dbeafe"
                    opacity="0.3"
                  />
                  <rect
                    x={padding}
                    y={padding + (matrixSize - padding * 2) / 2}
                    width={(matrixSize - padding * 2) / 2}
                    height={(matrixSize - padding * 2) / 2}
                    fill="#fef3c7"
                    opacity="0.3"
                  />
                  <rect
                    x={padding + (matrixSize - padding * 2) / 2}
                    y={padding + (matrixSize - padding * 2) / 2}
                    width={(matrixSize - padding * 2) / 2}
                    height={(matrixSize - padding * 2) / 2}
                    fill="#fee2e2"
                    opacity="0.3"
                  />

                  {/* Axis lines */}
                  <line
                    x1={matrixSize / 2}
                    y1={padding}
                    x2={matrixSize / 2}
                    y2={matrixSize - padding}
                    stroke="#64748b"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                  <line
                    x1={padding}
                    y1={matrixSize / 2}
                    x2={matrixSize - padding}
                    y2={matrixSize / 2}
                    stroke="#64748b"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />

                  {/* Recommendation points */}
                  {filteredRecommendations.map((rec) => {
                    const { x, y } = getPosition(rec);
                    const phaseStyle = phaseConfig[rec.phase];
                    const isHovered = hoveredItem === rec.id;

                    return (
                      <Tooltip key={rec.id}>
                        <TooltipTrigger asChild>
                          <circle
                            cx={x}
                            cy={y}
                            r={isHovered ? 8 : 6}
                            fill={phaseStyle.dotColor.replace('bg-', '#')}
                            stroke="#fff"
                            strokeWidth="2"
                            className="cursor-pointer transition-all hover:r-8"
                            onMouseEnter={() => setHoveredItem(rec.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                            onClick={() => onRecommendationClick?.(rec)}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="p-2">
                            <div className="font-medium">{rec.title}</div>
                            <div className="text-xs text-muted-foreground">
                              Impact: {rec.impact}/10 • Effort: {rec.effort}/10
                            </div>
                            <div className="text-xs">ROI: {rec.roi}%</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}

                  {/* Axis labels */}
                  <text
                    x={matrixSize / 2}
                    y={matrixSize - 10}
                    textAnchor="middle"
                    className="text-sm fill-gray-600"
                  >
                    Effort →
                  </text>
                  <text
                    x={15}
                    y={matrixSize / 2}
                    textAnchor="middle"
                    className="text-sm fill-gray-600"
                    transform={`rotate(-90, 15, ${matrixSize / 2})`}
                  >
                    Impact →
                  </text>

                  {/* Quadrant labels */}
                  <text x={padding + 10} y={padding + 20} className="text-xs fill-green-700 font-medium">
                    Quick Wins
                  </text>
                  <text x={matrixSize - padding - 90} y={padding + 20} className="text-xs fill-blue-700 font-medium">
                    Major Projects
                  </text>
                  <text x={padding + 10} y={matrixSize - padding - 10} className="text-xs fill-yellow-700 font-medium">
                    Fill-ins
                  </text>
                  <text x={matrixSize - padding - 100} y={matrixSize - padding - 10} className="text-xs fill-red-700 font-medium">
                    Thankless Tasks
                  </text>
                </svg>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>

        {/* Legend and Quick Actions */}
        <div className="space-y-4">
          {/* Phase Legend */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Implementation Phases</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(phaseConfig).map(([phase, config]) => (
                <div key={phase} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${config.dotColor}`} />
                  <Badge variant="outline" className={config.color}>
                    {config.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {filteredRecommendations.filter(r => r.phase === phase).length}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Priority Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Priority Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredRecommendations
                .sort((a, b) => (b.impact - b.effort) - (a.impact - a.effort))
                .slice(0, 3)
                .map((rec) => {
                  const PriorityIcon = priorityConfig[rec.priority].icon;
                  return (
                    <div key={rec.id} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-start gap-2">
                        <PriorityIcon className={`h-4 w-4 mt-0.5 ${priorityConfig[rec.priority].color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{rec.title}</div>
                          <div className="text-xs text-muted-foreground">{rec.estimatedTime}</div>
                          <Badge variant="outline" className={phaseConfig[rec.phase].color + ' mt-1'}>
                            {phaseConfig[rec.phase].label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>

          {/* ROI Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                ROI Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Average ROI</span>
                  <span className="font-medium">
                    {Math.round(filteredRecommendations.reduce((acc, rec) => acc + rec.roi, 0) / filteredRecommendations.length)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">High Impact Items</span>
                  <span className="font-medium">
                    {filteredRecommendations.filter(r => r.impact >= 7).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Quick Wins</span>
                  <span className="font-medium">
                    {filteredRecommendations.filter(r => r.impact >= 6 && r.effort <= 5).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}