'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface NavigationTab {
  id: string;
  label: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending' | 'error';
  progress?: number;
  itemCount?: number;
}

interface MobileResultsNavigationProps {
  currentTab: string;
  onTabChange: (tabId: string) => void;
  tabs: NavigationTab[];
  onSearch?: (query: string) => void;
  onFilter?: () => void;
}

const statusConfig = {
  completed: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
  'in-progress': { icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  pending: { icon: Clock, color: 'text-gray-400', bgColor: 'bg-gray-50' },
  error: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50' }
};

export default function MobileResultsNavigation({
  currentTab,
  onTabChange,
  tabs,
  onSearch,
  onFilter
}: MobileResultsNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentTabIndex = tabs.findIndex(tab => tab.id === currentTab);
  const currentTabData = tabs[currentTabIndex];

  const handlePrevious = () => {
    if (currentTabIndex > 0) {
      onTabChange(tabs[currentTabIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentTabIndex < tabs.length - 1) {
      onTabChange(tabs[currentTabIndex + 1].id);
    }
  };

  const completedTabs = tabs.filter(tab => tab.status === 'completed').length;
  const totalTabs = tabs.length;

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        {/* Left Side - Menu and Current Tab */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <MobileNavigationContent
                tabs={tabs}
                currentTab={currentTab}
                onTabChange={(tabId) => {
                  onTabChange(tabId);
                  setIsOpen(false);
                }}
                onSearch={onSearch}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                completedTabs={completedTabs}
                totalTabs={totalTabs}
              />
            </SheetContent>
          </Sheet>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium truncate">
                {currentTabData?.label}
              </span>
              {currentTabData?.status && (
                <Badge
                  variant="secondary"
                  className={`text-xs ${statusConfig[currentTabData.status].color}`}
                >
                  {currentTabData.status}
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {currentTabIndex + 1} of {totalTabs}
            </div>
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center space-x-1">
          {onSearch && (
            <Button variant="ghost" size="sm" className="p-2">
              <Search className="h-4 w-4" />
            </Button>
          )}

          {onFilter && (
            <Button variant="ghost" size="sm" className="p-2">
              <Filter className="h-4 w-4" />
            </Button>
          )}

          <Button variant="ghost" size="sm" className="p-2">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="lg:hidden bg-white border-b px-4 py-2">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            disabled={currentTabIndex === 0}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-xs">Prev</span>
          </Button>

          {/* Progress Dots */}
          <div className="flex items-center space-x-1">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentTabIndex
                    ? 'bg-blue-600 scale-125'
                    : tab.status === 'completed'
                    ? 'bg-green-500'
                    : tab.status === 'in-progress'
                    ? 'bg-blue-400'
                    : tab.status === 'error'
                    ? 'bg-red-400'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={currentTabIndex === tabs.length - 1}
            className="flex items-center gap-1"
          >
            <span className="text-xs">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(completedTabs / totalTabs) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Progress</span>
            <span>{completedTabs}/{totalTabs} completed</span>
          </div>
        </div>
      </div>

      {/* Mobile Swipe Gesture Hint */}
      <div className="lg:hidden bg-blue-50 border-b px-4 py-2">
        <div className="text-xs text-blue-700 text-center">
          💡 Swipe left/right or use arrow keys to navigate between sections
        </div>
      </div>
    </>
  );
}

// Separate component for sheet content
function MobileNavigationContent({
  tabs,
  currentTab,
  onTabChange,
  onSearch,
  searchQuery,
  onSearchChange,
  completedTabs,
  totalTabs
}: {
  tabs: NavigationTab[];
  currentTab: string;
  onTabChange: (tabId: string) => void;
  onSearch?: (query: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  completedTabs: number;
  totalTabs: number;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold mb-4">Strategy Results</h2>

        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{completedTabs}/{totalTabs} sections</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(completedTabs / totalTabs) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Search */}
      {onSearch && (
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search results..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSearch(searchQuery)}
              className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {tabs.map((tab, index) => {
            const isActive = tab.id === currentTab;
            const StatusIcon = statusConfig[tab.status].icon;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <StatusIcon className={`h-4 w-4 ${statusConfig[tab.status].color}`} />
                  </div>
                  {tab.itemCount && (
                    <Badge variant="secondary" className="text-xs">
                      {tab.itemCount}
                    </Badge>
                  )}
                </div>

                <h3 className="font-medium text-sm mb-1">{tab.label}</h3>
                <p className="text-xs text-muted-foreground mb-2">{tab.description}</p>

                {tab.progress !== undefined && (
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-blue-500 h-1 rounded-full transition-all duration-500"
                      style={{ width: `${tab.progress}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}