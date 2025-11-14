'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isLast?: boolean;
}

interface BreadcrumbSearchHeaderProps {
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  customBreadcrumbs?: BreadcrumbItem[];
  className?: string;
}

const BreadcrumbSearchHeader: React.FC<BreadcrumbSearchHeaderProps> = ({
  onSearch,
  searchPlaceholder = "Search Your Data",
  customBreadcrumbs,
  className = ""
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customBreadcrumbs) {
      return customBreadcrumbs;
    }

    const pathSegments = pathname.split('/').filter(segment => segment !== '');
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with Home/Results
    breadcrumbs.push({
      label: 'Results',
      href: '/engine/results'
    });

    // Build breadcrumbs from path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Skip the first segment if it's 'engine'
      if (segment === 'engine') {
        return;
      }

      // Format segment names
      let label = segment;

      // Handle special cases
      switch (segment) {
        case 'results':
          return; // Skip since we already have Results as root
        case 'strategy-plans':
          label = 'Strategy Plans';
          break;
        case 'dxptools':
          label = 'DXP Tools';
          break;
        case 'optimization':
          label = 'Experience Optimization';
          break;
        case 'insights':
          label = 'Analytics Insights';
          break;
        case 'admin':
          label = 'Admin';
          break;
        case 'logs':
          label = 'Logs';
          break;
        default:
          // Capitalize and replace dashes with spaces
          label = segment.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
      }

      const isLast = index === pathSegments.length - 1;

      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
        isLast
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Optional: Implement real-time search
    if (onSearch && query.length > 2) {
      // Debounce search calls here if needed
      const timeoutId = setTimeout(() => {
        onSearch(query.trim());
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  };

  return (
    <div id="results-content-header" className={`flex items-center justify-between py-4 px-6 bg-white/80 backdrop-blur-sm border-b border-gray-200 ${className}`}>
      {/* Breadcrumbs - Left Side */}
      <nav className="flex items-center space-x-1 text-sm" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-1">
          {breadcrumbs.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
              )}
              {item.href && !item.isLast ? (
                <Link
                  href={item.href}
                  className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={`font-medium ${item.isLast ? 'text-gray-900' : 'text-gray-600'}`}>
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Search Box - Right Side */}
      <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 pr-4 py-2 w-64 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        {searchQuery && (
          <Button
            type="submit"
            size="sm"
            className="px-3 py-2"
          >
            Search
          </Button>
        )}
      </form>
    </div>
  );
};

export default BreadcrumbSearchHeader;