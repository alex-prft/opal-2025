'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Monitor, TrendingUp, Settings, Map, BarChart } from 'lucide-react';

const mainNavigation = [
  {
    name: 'OPAL Monitoring',
    href: '/engine/admin/opal-monitoring',
    icon: Monitor,
  },
  {
    name: 'Strategy AI',
    href: '/engine/admin/strategy-ai',
    icon: TrendingUp,
  },
  {
    name: 'Configurations',
    href: '/engine/admin/configurations',
    icon: Settings,
  },
  {
    name: 'Data Mapping',
    href: '/engine/admin/data-mapping',
    icon: Map,
  },
  {
    name: 'Recommendation Engine',
    href: '/engine/admin/recommendation-engine',
    icon: BarChart,
  },
];

export default function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-40" id="admin-main-navigation">
      <div className="container mx-auto px-4">
        <div className="flex space-x-8" id="main-nav-links">
          {mainNavigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                id={`main-nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
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
    </nav>
  );
}