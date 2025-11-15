'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Menu,
  Target,
  Settings,
  BarChart3,
  TrendingUp,
  ChevronRight,
  BookOpen,
  Users,
  Eye,
  Palette,
  Database,
  Globe,
  MessageSquare,
  Lightbulb,
  Map,
  Calendar,
  Zap
} from 'lucide-react';

interface MobileOrganizedResultsProps {
  activeArea: string;
  onAreaChange: (areaId: string) => void;
  onSectionSelect: (areaId: string, sectionId: string) => void;
}

const resultAreas = [
  {
    id: 'strategy-plans',
    title: 'Strategy Plans',
    description: 'Strategic roadmaps and maturity assessments',
    icon: Target,
    color: 'blue',
    sections: [
      { id: 'maturity-overview', title: 'Maturity Assessment Overview', icon: BarChart3 },
      { id: 'personalization-plan', title: 'Personalization Maturity Plan', icon: Users },
      { id: 'phased-recommendations', title: 'Phased Recommendations', icon: Map },
      { id: 'example-roadmap', title: 'Example Roadmap', icon: Calendar }
    ]
  },
  {
    id: 'dxp-tools',
    title: 'Optimizely DXP Tools',
    description: 'Digital experience platform capabilities',
    icon: Settings,
    color: 'purple',
    sections: [
      { id: 'content-recommendations', title: 'Content Recommendations', icon: Lightbulb },
      { id: 'cms', title: 'CMS', icon: BookOpen },
      { id: 'odp', title: 'ODP', icon: Database },
      { id: 'webx', title: 'Web Experimentation', icon: Zap },
      { id: 'cmp', title: 'Campaign Management', icon: MessageSquare }
    ]
  },
  {
    id: 'analytics-insights',
    title: 'Analytics Insights',
    description: 'Data-driven insights and metrics',
    icon: BarChart3,
    color: 'green',
    sections: [
      { id: 'content-analytics', title: 'Content', icon: BookOpen },
      { id: 'audience-analytics', title: 'Audiences', icon: Users },
      { id: 'customer-experience', title: 'Customer Experience', icon: Eye },
      { id: 'trends-analytics', title: 'Trends', icon: TrendingUp }
    ]
  },
  {
    id: 'experience-optimization',
    title: 'Experience Optimization',
    description: 'Optimization strategies and tools',
    icon: TrendingUp,
    color: 'orange',
    sections: [
      { id: 'content-optimization', title: 'Content', icon: Palette },
      { id: 'experimentation', title: 'Experimentation', icon: Zap },
      { id: 'personalization', title: 'Personalization', icon: Users },
      { id: 'user-experience', title: 'User Experience', icon: Eye },
      { id: 'technology', title: 'Technology', icon: Settings }
    ]
  }
];

const colorSchemes = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', accent: 'bg-blue-600' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', accent: 'bg-purple-600' },
  green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', accent: 'bg-green-600' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', accent: 'bg-orange-600' }
};

export default function MobileOrganizedResults({
  activeArea,
  onAreaChange,
  onSectionSelect
}: MobileOrganizedResultsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const activeAreaData = resultAreas.find(area => area.id === activeArea);
  const colorScheme = activeAreaData ? colorSchemes[activeAreaData.color as keyof typeof colorSchemes] : colorSchemes.blue;

  return (
    <div className="lg:hidden">
      {/* Mobile Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <MobileNavigationContent
                areas={resultAreas}
                activeArea={activeArea}
                onAreaChange={(areaId) => {
                  onAreaChange(areaId);
                  setIsMenuOpen(false);
                }}
                onSectionSelect={(areaId, sectionId) => {
                  onSectionSelect(areaId, sectionId);
                  setIsMenuOpen(false);
                }}
              />
            </SheetContent>
          </Sheet>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">
                {activeAreaData?.title}
              </span>
              <Badge variant="secondary" className={`text-xs ${colorScheme.text}`}>
                {activeAreaData?.sections.length} sections
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {activeAreaData?.description}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Area Tabs */}
      <div className="bg-white border-b px-4 py-2 overflow-x-auto">
        <Tabs value={activeArea} onValueChange={onAreaChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4 gap-1 h-auto bg-transparent p-0">
            {resultAreas.map((area) => {
              const Icon = area.icon;
              const scheme = colorSchemes[area.color as keyof typeof colorSchemes];
              const isActive = area.id === activeArea;

              return (
                <TabsTrigger
                  key={area.id}
                  value={area.id}
                  className={`flex flex-col items-center gap-1 p-2 text-xs transition-all data-[state=active]:bg-transparent ${
                    isActive ? scheme.text : 'text-muted-foreground'
                  }`}
                >
                  <div className={`p-1.5 rounded-md ${isActive ? scheme.accent : 'bg-gray-100'}`}>
                    <Icon className={`h-3 w-3 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <span className="truncate w-full text-center">{area.title}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Section Quick Links */}
      {activeAreaData && (
        <div className="bg-gray-50 border-b px-4 py-3">
          <div className="text-xs text-muted-foreground mb-2">Quick Navigation</div>
          <div className="flex gap-2 overflow-x-auto">
            {activeAreaData.sections.map((section) => {
              const SectionIcon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => onSectionSelect(activeArea, section.id)}
                  className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border text-xs whitespace-nowrap hover:bg-gray-50 transition-colors"
                >
                  <SectionIcon className="h-3 w-3 text-muted-foreground" />
                  {section.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="bg-blue-50 border-b px-4 py-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-blue-700">Progress</span>
          <span className="text-blue-600 font-medium">3 of 4 areas reviewed</span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-1 mt-1">
          <div className="bg-blue-600 h-1 rounded-full" style={{ width: '75%' }} />
        </div>
      </div>
    </div>
  );
}

// Mobile Navigation Content Component
function MobileNavigationContent({
  areas,
  activeArea,
  onAreaChange,
  onSectionSelect
}: {
  areas: typeof resultAreas;
  activeArea: string;
  onAreaChange: (areaId: string) => void;
  onSectionSelect: (areaId: string, sectionId: string) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold mb-2">Strategy Results</h2>
        <p className="text-sm text-muted-foreground">Navigate through organized insights</p>
      </div>

      {/* Areas List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {areas.map((area) => {
            const Icon = area.icon;
            const scheme = colorSchemes[area.color as keyof typeof colorSchemes];
            const isActive = area.id === activeArea;

            return (
              <div key={area.id} className="space-y-2">
                <button
                  onClick={() => onAreaChange(area.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isActive
                      ? `${scheme.bg} ${scheme.border}`
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${isActive ? scheme.accent : 'bg-gray-100'}`}>
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium text-sm ${isActive ? scheme.text : 'text-gray-900'}`}>
                        {area.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {area.sections.length} sections
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>

                {/* Sections for active area */}
                {isActive && (
                  <div className="ml-6 space-y-1">
                    {area.sections.map((section) => {
                      const SectionIcon = section.icon;
                      return (
                        <button
                          key={section.id}
                          onClick={() => onSectionSelect(area.id, section.id)}
                          className="w-full text-left p-2 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <SectionIcon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm text-gray-700">{section.title}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <div className="text-xs text-muted-foreground text-center">
          Tap sections to navigate • Swipe to explore areas
        </div>
      </div>
    </div>
  );
}