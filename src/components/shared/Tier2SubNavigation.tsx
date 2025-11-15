'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { getTier3ItemsForTier2 } from '@/data/opal-mapping';
import {
  BarChart3,
  Target,
  TrendingUp,
  CheckCircle,
  Clock
} from 'lucide-react';

interface Tier2SubNavigationProps {
  tier1Name: string;
  tier2Name: string;
  currentTier1Url: string;
  currentTier2Url: string;
  currentTier3Url?: string;
}

// Icon mapping for tier3 items
const tier3IconMapping = {
  'Overview Dashboard': BarChart3,
  'Strategic Recommendations': Target,
  'Performance Metrics': TrendingUp,
  'Data Quality Score': CheckCircle,
  'Workflow Timeline': Clock,
  // Fallback icons for other tier3 items
  'Immediate Opportunities': Target,
  'Implementation Roadmap (30-day)': Clock,
  'Resource Requirements': CheckCircle,
  'Expected Impact': TrendingUp,
  'Success Metrics': BarChart3,
  'Current State Assessment': BarChart3,
  'Maturity Framework': Target,
  'Gap Analysis': CheckCircle,
  'Improvement Pathway': TrendingUp,
  'Benchmarking Data': BarChart3
} as const;

export default function Tier2SubNavigation({
  tier1Name,
  tier2Name,
  currentTier1Url,
  currentTier2Url,
  currentTier3Url
}: Tier2SubNavigationProps) {
  const pathname = usePathname();

  // Get tier3 items for the current tier2
  const tier3Items = getTier3ItemsForTier2(tier1Name, tier2Name);

  // Don't render if no tier3 items
  if (tier3Items.length === 0) {
    return null;
  }

  return (
    <div
      id="tier2-sub-navigation"
      className="bg-gray-50 border-b border-gray-200"
    >
      <div className="max-w-7xl mx-auto">
        <nav className="flex overflow-x-auto" role="navigation" aria-label="Sub navigation">
          <div className="flex min-w-full">
            {tier3Items.map((tier3Item, index) => {
              const tier3Url = tier3Item.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
              const href = `/engine/results/${currentTier1Url}/${currentTier2Url}/${tier3Url}`;
              const isActive = currentTier3Url === tier3Url || pathname === href;
              const Icon = tier3IconMapping[tier3Item as keyof typeof tier3IconMapping] || BarChart3;

              return (
                <Link
                  key={index}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                    isActive
                      ? 'text-blue-700 bg-white border-blue-500 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-transparent'
                  }`}
                  role="tab"
                  aria-selected={isActive}
                >
                  <Icon className="h-4 w-4" />
                  {tier3Item}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}