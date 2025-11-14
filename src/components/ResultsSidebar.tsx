'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import RecentDataComponent from '@/components/RecentDataComponent';
import { opalMapping } from '@/data/opal-mapping';
import {
  Target,
  Settings,
  BarChart3,
  TrendingUp,
  ArrowRight,
  MessageSquare,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
  Shield,
  RefreshCw,
  LogOut
} from 'lucide-react';

// Icon mapping for navigation areas
const iconMapping = {
  'Strategy Plans': Target,
  'Optimizely DXP Tools': Settings,
  'Analytics Insights': BarChart3,
  'Experience Optimization': TrendingUp
} as const;

// Color mapping for navigation areas
const colorMapping = {
  'Strategy Plans': 'blue',
  'Optimizely DXP Tools': 'purple',
  'Analytics Insights': 'green',
  'Experience Optimization': 'orange'
} as const;

// URL mapping for navigation areas
const urlMapping = {
  'Strategy Plans': '/engine/results/strategy-plans',
  'Optimizely DXP Tools': '/engine/results/optimizely-dxp-tools',
  'Analytics Insights': '/engine/results/analytics-insights',
  'Experience Optimization': '/engine/results/experience-optimization'
} as const;

// Dynamic navigation areas from OPAL mapping
const generateNavigationAreas = () => {
  const areas = Object.keys(opalMapping).map((tier1Key) => {
    const tier1Section = opalMapping[tier1Key as keyof typeof opalMapping];
    const firstTier2 = Object.values(tier1Section)[0] as any;
    const navigationStructure = firstTier2?.navigation_structure;

    if (!navigationStructure) return null;

    const tier1Title = navigationStructure.tier1;
    return {
      id: tier1Key.toLowerCase().replace(/\s+/g, '-'),
      title: tier1Title,
      icon: iconMapping[tier1Title as keyof typeof iconMapping] || Target,
      color: colorMapping[tier1Title as keyof typeof colorMapping] || 'blue',
      url: urlMapping[tier1Title as keyof typeof urlMapping] || `/engine/results/${tier1Key.toLowerCase().replace(/\s+/g, '-')}`,
      tier2Items: Object.keys(tier1Section),
      tier3Items: tier1Section
    };
  }).filter(Boolean);

  return areas;
};

// (Cleaned up - agent status and data freshness logic moved to RecentDataComponent)

interface ResultsSidebarProps {
  currentPage?: 'strategy' | 'dxptools' | 'insights' | 'optimization';
}

export default function ResultsSidebar({ }: ResultsSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Sidebar collapse state
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Expanded tier navigation states
  const [expandedTier1, setExpandedTier1] = useState<string | null>(null);
  const [expandedTier2, setExpandedTier2] = useState<string | null>(null);

  // Generate dynamic navigation areas
  const navigationAreas = generateNavigationAreas();

  // Determine active area based on current path - more comprehensive matching
  const getActiveAreaFromPath = (path: string) => {
    // Check for tier 1, tier 2, and tier 3 paths
    if (path.includes('/engine/results/strategy-plans')) return 'strategy-plans';
    if (path.includes('/engine/results/optimizely-dxp-tools')) return 'optimizely-dxp-tools';
    if (path.includes('/engine/results/analytics-insights')) return 'analytics-insights';
    if (path.includes('/engine/results/experience-optimization')) return 'experience-optimization';

    // Legacy path support
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
      <div id="nav-areas" className={`${isCollapsed ? 'p-2' : 'p-4'} border-b border-gray-200 max-h-96 overflow-y-auto`}>
        {!isCollapsed && (
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Results Dashboard
          </h2>
        )}
        <nav className="space-y-1" role="navigation" aria-label="Main navigation">
          {navigationAreas.map((area) => {
            if (!area) return null;

            const Icon = area.icon;
            const isActive = activeArea === area.id;
            const isTier1Expanded = expandedTier1 === area.id;

            return (
              <div key={area.id} className="space-y-1">
                {/* Tier 1 - Main Categories */}
                <div className="flex items-center">
                  <Link
                    href={area.url}
                    className={`flex-1 flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 p-3'} rounded-lg transition-all ${
                      isActive
                        ? 'bg-blue-100 text-blue-800 border-l-4 border-blue-500 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    title={isCollapsed ? area.title : ''}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-500'}`} />
                    {!isCollapsed && (
                      <>
                        <span className="font-medium flex-1 text-left text-sm">{area.title}</span>
                        {isActive && <ArrowRight className="h-4 w-4 text-blue-700" />}
                      </>
                    )}
                  </Link>
                  {!isCollapsed && area.tier2Items?.length > 0 && (
                    <button
                      onClick={() => setExpandedTier1(isTier1Expanded ? null : area.id)}
                      className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                      title={isTier1Expanded ? 'Collapse' : 'Expand'}
                      aria-expanded={isTier1Expanded}
                      aria-controls={`tier2-${area.id}`}
                    >
                      {isTier1Expanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  )}
                </div>

                {/* Tier 2 - Sub-sections */}
                {!isCollapsed && isTier1Expanded && area.tier2Items && (
                  <div id={`tier2-${area.id}`} className="ml-4 space-y-1" role="group" aria-label={`${area.title} subsections`}>
                    {area.tier2Items.map((tier2Key) => {
                      const tier2Data = area.tier3Items?.[tier2Key as keyof typeof area.tier3Items] as any;
                      const tier2Structure = tier2Data?.navigation_structure;
                      const tier2Title = tier2Structure?.tier2 || tier2Key;
                      const tier3Items = tier2Structure?.tier3 || [];
                      const isTier2Expanded = expandedTier2 === `${area.id}-${tier2Key}`;

                      return (
                        <div key={tier2Key} className="space-y-1">
                          {/* Tier 2 Button */}
                          <div className="flex items-center">
                            <Link
                              href={`${area.url}/${tier2Key.toLowerCase().replace(/\s+/g, '-')}`}
                              className="flex-1 flex items-center gap-2 p-2 rounded-md text-sm transition-all hover:bg-gray-50 text-gray-600"
                            >
                              <span className="flex-1 text-left font-medium">{tier2Title}</span>
                            </Link>
                            {tier3Items.length > 0 && (
                              <button
                                onClick={() => {
                                  const tier2Id = `${area.id}-${tier2Key}`;
                                  setExpandedTier2(isTier2Expanded ? null : tier2Id);
                                }}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                aria-expanded={isTier2Expanded}
                                aria-controls={`tier3-${area.id}-${tier2Key}`}
                              >
                                {isTier2Expanded ? (
                                  <ChevronDown className="h-3 w-3 text-gray-400" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 text-gray-400" />
                                )}
                              </button>
                            )}
                          </div>

                          {/* Tier 3 - Detailed Views */}
                          {isTier2Expanded && tier3Items.length > 0 && (
                            <div id={`tier3-${area.id}-${tier2Key}`} className="ml-4 space-y-1" role="group" aria-label={`${tier2Title} detailed views`}>
                              {tier3Items.map((tier3Item: string, index: number) => {
                                const tier3Url = `${area.url}/${tier2Key.toLowerCase().replace(/\s+/g, '-')}/${encodeURIComponent(tier3Item.toLowerCase().replace(/\s+/g, '-'))}`;
                                return (
                                  <Link
                                    key={index}
                                    href={tier3Url}
                                    className="w-full flex items-center gap-2 p-2 rounded-md text-xs transition-all hover:bg-blue-50 hover:text-blue-700 text-gray-500"
                                    title={tier3Item}
                                  >
                                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                    <span className="flex-1 text-left">{tier3Item}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Recent Data Component - Only show when not collapsed */}
      {!isCollapsed && (
        <div className="p-4 flex-shrink-0">
          <RecentDataComponent compact={true} />
        </div>
      )}

      {/* Quick Action Links - Only show when not collapsed */}
      {!isCollapsed && (
        <div className="px-4 pb-4 flex-shrink-0">
          <div className="space-y-2">
            <Link
              href="/engine/admin"
              className="w-full flex items-center gap-3 p-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Shield className="h-4 w-4 text-gray-500" />
              <span>Admin</span>
            </Link>
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/opal/sync', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      sync_scope: 'priority_platforms',
                      triggered_by: 'manual_force_sync',
                      client_context: {
                        client_name: 'Force Sync from Sidebar',
                        recipients: ['admin@opal.ai']
                      }
                    })
                  });
                  if (response.ok) {
                    console.log('Force sync initiated successfully');
                  }
                } catch (error) {
                  console.error('Force sync failed:', error);
                }
              }}
              className="w-full flex items-center gap-3 p-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4 text-gray-500" />
              <span>Force Sync</span>
            </button>
            <button
              onClick={() => {
                // Clear session storage and redirect to home
                sessionStorage.clear();
                window.location.href = '/';
              }}
              className="w-full flex items-center gap-3 p-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="h-4 w-4 text-gray-500" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}