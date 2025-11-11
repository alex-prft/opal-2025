'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Users, Settings, Calendar } from 'lucide-react';

const strategyAINavigation = [
  {
    name: 'Influence Factors',
    href: '/engine/admin/strategy-ai/influence-factors',
    icon: Users,
  },
  {
    name: 'Maturity Scoring',
    href: '/engine/admin/strategy-ai/maturity-scoring',
    icon: Settings,
  },
  {
    name: 'Roadmap Management',
    href: '/engine/admin/strategy-ai/roadmap-management',
    icon: Calendar,
  },
];

export default function StrategyAILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6" id="strategy-ai-layout">
      {/* Sub-navigation */}
      <div className="border-b bg-white/30 rounded-lg" id="strategy-ai-sub-navigation">
        <div className="px-4">
          <div className="flex space-x-8" id="strategy-ai-nav-links">
            {strategyAINavigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  id={`strategy-ai-nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
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
      <div id="strategy-ai-content">
        {children}
      </div>
    </div>
  );
}