'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Database, Webhook, Layers, Cog } from 'lucide-react';

const configurationsNavigation = [
  {
    name: 'Data Integrations',
    href: '/engine/admin/configurations/data-integrations',
    icon: Database,
  },
  {
    name: 'Webhooks',
    href: '/engine/admin/configurations/webhooks',
    icon: Webhook,
  },
  {
    name: 'OPAL Workflows',
    href: '/engine/admin/configurations/opal-workflows',
    icon: Layers,
  },
  {
    name: 'Settings',
    href: '/engine/admin/configurations/settings',
    icon: Cog,
  },
];

export default function ConfigurationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6" id="configurations-layout">
      <div className="border-b bg-white/30 rounded-lg" id="configurations-sub-navigation">
        <div className="px-4">
          <div className="flex space-x-8" id="configurations-nav-links">
            {configurationsNavigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  id={`configurations-nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
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

      <div id="configurations-content">
        {children}
      </div>
    </div>
  );
}