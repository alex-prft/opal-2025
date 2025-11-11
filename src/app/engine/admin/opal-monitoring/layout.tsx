'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  FileText,
  Search,
  Users,
  TestTube,
  Heart,
  Route,
  Map,
  FolderOpen
} from 'lucide-react';

const opalMonitoringNavigation = [
  {
    name: 'Content',
    href: '/engine/admin/opal-monitoring/agent-data/content',
    icon: FileText,
    description: 'Content Review Agent'
  },
  {
    name: 'AEO',
    href: '/engine/admin/opal-monitoring/agent-data/aeo',
    icon: Search,
    description: 'AI Engine Optimization'
  },
  {
    name: 'Audiences',
    href: '/engine/admin/opal-monitoring/agent-data/audiences',
    icon: Users,
    description: 'Audience Suggester'
  },
  {
    name: 'Experiments',
    href: '/engine/admin/opal-monitoring/agent-data/exp',
    icon: TestTube,
    description: 'Experiment Blueprinter'
  },
  {
    name: 'Personalization',
    href: '/engine/admin/opal-monitoring/agent-data/pers',
    icon: Heart,
    description: 'Personalization Ideas'
  },
  {
    name: 'Journeys',
    href: '/engine/admin/opal-monitoring/agent-data/journeys',
    icon: Route,
    description: 'Customer Journey Agent'
  },
  {
    name: 'Roadmap',
    href: '/engine/admin/opal-monitoring/agent-data/roadmap',
    icon: Map,
    description: 'Roadmap Generator'
  },
  {
    name: 'CMP',
    href: '/engine/admin/opal-monitoring/agent-data/cmp',
    icon: FolderOpen,
    description: 'CMP Organizer'
  },
];

export default function OpalMonitoringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div id="opal-monitoring-layout">
      {/* Sub-navigation */}
      <div className="border-b bg-white rounded-lg sticky top-16 z-30 -mt-4" id="main-nav-opal-monitoring">
        <div className="px-4">
          <div className="flex space-x-8 bg-white" id="opal-monitoring-nav-links">
            {opalMonitoringNavigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  id={`opal-nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  title={item.description}
                  className={cn(
                    'flex items-center gap-2 px-3 py-4 text-sm font-medium border-b-2 border-transparent transition-colors hover:text-blue-600 hover:border-blue-300',
                    isActive
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-500'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div id="opal-monitoring-content" className="mt-6">
        {children}
      </div>
    </div>
  );
}