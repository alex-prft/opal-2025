'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';
import { getTier2ItemsForTier1, getTier3ItemsForTier2 } from '@/data/opal-mapping';

interface MegaMenuDropdownProps {
  tier1Name: string;
  tier2Name?: string;
  tier3Name?: string;
  currentTier1Url: string;
  currentTier2Url?: string;
  currentTier3Url?: string;
}

// Icon mapping for tier2 sections
const tier2IconMapping = {
  'OSA': '📊',
  'Content': '📝',
  'Audiences': '👥',
  'CX': '💝',
  'Experimentation': '🧪',
  'Personalization': '🎯',
  'Quick Wins': '📈',
  'Maturity': '📋',
  'Phases': '🗓️',
  'Roadmap': '🗺️',
  'Content Recs': '💡',
  'CMS': '⚙️',
  'ODP': '📊',
  'WEBX': '🔬',
  'CMP': '📧',
  'UX': '🎨',
  'Technology': '🔧'
} as const;

export default function MegaMenuDropdown({
  tier1Name,
  tier2Name,
  tier3Name,
  currentTier1Url,
  currentTier2Url,
  currentTier3Url
}: MegaMenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredTier2, setHoveredTier2] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Get tier 2 items
  const tier2Items = getTier2ItemsForTier1(tier1Name);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setHoveredTier2(null);
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTier2MouseEnter = (tier2Item: string) => {
    if (!isMobile) {
      setHoveredTier2(tier2Item);
    }
  };

  const handleTier2MouseLeave = () => {
    if (!isMobile) {
      setHoveredTier2(null);
    }
  };

  return (
    <div
      id="mega-menu-navigation"
      className="bg-white shadow-sm border-b relative z-50"
      ref={menuRef}
    >
      <div className="max-w-7xl mx-auto">
        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center justify-between p-4">
          <h4 className="text-sm font-semibold text-gray-700">Navigation</h4>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Desktop Navigation - Tier 2 Primary Navigation */}
        <nav className="hidden md:block" role="navigation" aria-label="Main navigation">
          <ul className="flex" role="menubar">
            {tier2Items.map((tier2Item, index) => {
              const icon = tier2IconMapping[tier2Item as keyof typeof tier2IconMapping] || '📊';
              const isActive = tier2Item === tier2Name;
              const tier3Items = getTier3ItemsForTier2(tier1Name, tier2Item);

              return (
                <li
                  key={index}
                  className="relative"
                  onMouseEnter={() => handleTier2MouseEnter(tier2Item)}
                  onMouseLeave={handleTier2MouseLeave}
                  role="none"
                >
                  <Link
                    href={`/engine/results/${currentTier1Url}/${tier2Item.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-blue-700 bg-blue-50 border-b-2 border-blue-500'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    role="menuitem"
                  >
                    <span className="text-base">{icon}</span>
                    {tier2Item}
                    {tier3Items.length > 0 && (
                      <ChevronDown className="h-3 w-3 text-gray-400" />
                    )}
                  </Link>

                  {/* Tier 3 Hover Dropdown */}
                  {hoveredTier2 === tier2Item && tier3Items.length > 0 && (
                    <div className="absolute top-full left-0 min-w-64 bg-white shadow-lg border border-gray-200 rounded-lg z-50 dropdown-panel">
                      <div className="p-4">
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            {tier2Item} Analysis Views
                          </h4>
                          {tier3Items.map((tier3Item, tier3Index) => {
                            const isActiveTier3 = tier3Item.toLowerCase().replace(/\s+/g, '-') === currentTier3Url;

                            return (
                              <Link
                                key={tier3Index}
                                href={`/engine/results/${currentTier1Url}/${tier2Item.toLowerCase().replace(/\s+/g, '-')}/${tier3Item.toLowerCase().replace(/\s+/g, '-')}`}
                                className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                                  isActiveTier3
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                                role="menuitem"
                              >
                                {tier3Item}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="p-4 space-y-3">
              {tier2Items.map((tier2Item, index) => {
                const icon = tier2IconMapping[tier2Item as keyof typeof tier2IconMapping] || '📊';
                const isActive = tier2Item === tier2Name;
                const tier3Items = getTier3ItemsForTier2(tier1Name, tier2Item);

                return (
                  <div key={index} className="space-y-2">
                    <Link
                      href={`/engine/results/${currentTier1Url}/${tier2Item.toLowerCase().replace(/\s+/g, '-')}`}
                      className={`flex items-center gap-3 p-3 rounded-lg font-medium ${
                        isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="text-base">{icon}</span>
                      {tier2Item}
                    </Link>

                    {/* Mobile Tier 3 Items */}
                    {tier3Items.length > 0 && (
                      <div className="ml-6 space-y-1">
                        {tier3Items.map((tier3Item, tier3Index) => {
                          const isActiveTier3 = tier3Item.toLowerCase().replace(/\s+/g, '-') === currentTier3Url;

                          return (
                            <Link
                              key={tier3Index}
                              href={`/engine/results/${currentTier1Url}/${tier2Item.toLowerCase().replace(/\s+/g, '-')}/${tier3Item.toLowerCase().replace(/\s+/g, '-')}`}
                              className={`block px-3 py-2 text-sm rounded-md ${
                                isActiveTier3
                                  ? 'bg-blue-50 text-blue-700 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                              onClick={() => setIsOpen(false)}
                            >
                              {tier3Item}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        /* Enhanced dropdown animations */
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-panel {
          animation: slideDown 0.15s ease-out;
        }
      `}</style>
    </div>
  );
}