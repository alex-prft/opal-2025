'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import RecentDataComponent from '@/components/RecentDataComponent';
import {
  Target,
  Settings,
  BarChart3,
  TrendingUp,
  ArrowRight,
  MessageSquare,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

// Navigation areas configuration
const navigationAreas = [
  {
    id: 'strategy-plans',
    title: 'Strategy Plans',
    icon: Target,
    color: 'blue',
    url: '/engine/results/strategy'
  },
  {
    id: 'dxp-tools',
    title: 'Optimizely DXP Tools',
    icon: Settings,
    color: 'purple',
    url: '/engine/results/dxptools'
  },
  {
    id: 'analytics-insights',
    title: 'Analytics Insights',
    icon: BarChart3,
    color: 'green',
    url: '/engine/results/insights'
  },
  {
    id: 'experience-optimization',
    title: 'Experience Optimization',
    icon: TrendingUp,
    color: 'orange',
    url: '/engine/results/optimization'
  }
];

// (Cleaned up - agent status and data freshness logic moved to RecentDataComponent)

interface ResultsSidebarProps {
  currentPage?: 'strategy' | 'dxptools' | 'insights' | 'optimization';
}

export default function ResultsSidebar({ currentPage }: ResultsSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Sidebar collapse state
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Determine active area based on current path
  const getActiveAreaFromPath = (path: string) => {
    if (path.includes('/strategy')) return 'strategy-plans';
    if (path.includes('/dxptools')) return 'dxp-tools';
    if (path.includes('/insights')) return 'analytics-insights';
    if (path.includes('/optimization')) return 'experience-optimization';
    return '';
  };

  const activeArea = getActiveAreaFromPath(pathname);

  // Check if we're on the main TTYD page (exact match)
  const isTTYDActive = pathname === '/engine/results';

  return (
    <div id="sidebar-nav" className={`${isCollapsed ? 'w-16' : 'w-80'} bg-white border-r shadow-sm transition-all duration-300 ease-in-out flex flex-col`}>
      {/* Header */}
      <div id="sidebar-header" className={`${isCollapsed ? 'p-2' : 'p-6'} border-b`}>
        <div className="flex items-center justify-between">
          <Link href="/engine/results" className="flex-1">
            <div id="branding" className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} hover:bg-gray-50 rounded-lg p-2 transition-colors cursor-pointer`}>
              <div className="rounded-lg">
                <Image
                  src="/images/gradient-orb.png"
                  alt="Opal AI"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className="text-lg font-bold">Opal AI</h1>
                  <p className="text-sm text-muted-foreground">Strategy Assistant</p>
                </div>
              )}
            </div>
          </Link>

          {/* Collapse Toggle Button */}
          {!isCollapsed && (
            <button
              id="results-sidebar-collapse"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 bg-white shadow-sm ml-2"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4 text-gray-600" />
            </button>
          )}

          {/* Expand Button (when collapsed, positioned over the logo) */}
          {isCollapsed && (
            <button
              id="results-sidebar-collapse"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 bg-white shadow-sm z-10"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* TTYD (Talk To Your Data) Link */}
      <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-b border-gray-200`}>
        <Link
          href="/engine/results"
          className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 p-3'} rounded-lg transition-all border ${
            isTTYDActive
              ? 'bg-blue-50 text-blue-700 border-blue-200 border-l-4 border-l-blue-600'
              : 'text-gray-700 hover:bg-gray-50 border-gray-200'
          }`}
          title={isCollapsed ? 'Talk To Your Data' : ''}
        >
          <MessageSquare className={`h-5 w-5 ${isTTYDActive ? 'text-blue-600' : ''}`} />
          {!isCollapsed && (
            <>
              <div className="flex-1 text-left">
                <div className="font-medium">Talk To Your Data</div>
                <div className={`text-xs ${isTTYDActive ? 'text-blue-600' : 'text-muted-foreground'}`}>
                  Interactive data exploration
                </div>
              </div>
              {isTTYDActive ? (
                <ArrowRight className="h-4 w-4 text-blue-600" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
            </>
          )}
        </Link>
      </div>

      {/* Navigation Areas */}
      <div id="nav-areas" className={`${isCollapsed ? 'p-2' : 'p-4'} border-b border-gray-200`}>
        {!isCollapsed && (
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Results Dashboard
          </h2>
        )}
        <nav className="space-y-2">
          {navigationAreas.map((area) => {
            const Icon = area.icon;
            const isActive = activeArea === area.id;

            return (
              <button
                key={area.id}
                onClick={() => router.push(area.url)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 p-3'} rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isCollapsed ? area.title : ''}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                {!isCollapsed && (
                  <>
                    <span className="font-medium">{area.title}</span>
                    {isActive && <ArrowRight className="h-4 w-4 ml-auto text-blue-600" />}
                  </>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Recent Data Component - Only show when not collapsed */}
      {!isCollapsed && (
        <div className="p-4">
          <RecentDataComponent compact={true} />
        </div>
      )}
    </div>
  );
}