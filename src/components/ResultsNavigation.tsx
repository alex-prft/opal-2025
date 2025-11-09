'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Download,
  Share2
} from 'lucide-react';

interface NavigationTab {
  id: string;
  label: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending' | 'error';
  progress?: number;
  itemCount?: number;
}

interface ResultsNavigationProps {
  currentTab: string;
  onTabChange: (tabId: string) => void;
  tabs: NavigationTab[];
  onSearch?: (query: string) => void;
  onFilter?: (filters: string[]) => void;
  onExport?: (tabId: string) => void;
  onShare?: (tabId: string) => void;
}

const statusConfig = {
  completed: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  'in-progress': { icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  pending: { icon: Clock, color: 'text-gray-400', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
  error: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' }
};

export default function ResultsNavigation({
  currentTab,
  onTabChange,
  tabs,
  onSearch,
  onFilter,
  onExport,
  onShare
}: ResultsNavigationProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <div className={`fixed left-0 top-0 h-full w-80 bg-white border-r transform transition-transform duration-300 z-50 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:z-auto`}>

        {/* Sidebar Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Strategy Results</h2>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

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

        {/* Search and Filter */}
        {(onSearch || onFilter) && (
          <div className="p-4 border-b space-y-3">
            {onSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search results..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && onSearch(searchQuery)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {onFilter && (
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Filter className="h-4 w-4" />
                Filter Results
              </Button>
            )}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            {tabs.map((tab, index) => {
              const isActive = tab.id === currentTab;
              const StatusIcon = statusConfig[tab.status].icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : `${statusConfig[tab.status].borderColor} ${statusConfig[tab.status].bgColor} hover:bg-opacity-70`
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
                        {tab.itemCount} items
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

        {/* Action Buttons */}
        {currentTabData && (onExport || onShare) && (
          <div className="p-4 border-t">
            <div className="space-y-2">
              {onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => onExport(currentTab)}
                >
                  <Download className="h-4 w-4" />
                  Export {currentTabData.label}
                </Button>
              )}

              {onShare && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => onShare(currentTab)}
                >
                  <Share2 className="h-4 w-4" />
                  Share {currentTabData.label}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation Bar */}
      <div className="bg-white border-b px-4 py-3 lg:pl-84">
        <div className="flex items-center justify-between">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Breadcrumb Navigation */}
          <div className="flex items-center space-x-4 flex-1 lg:flex-none">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-muted-foreground">Results</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{currentTabData?.label}</span>
            </div>

            {currentTabData?.status && (
              <Badge
                variant="secondary"
                className={`${statusConfig[currentTabData.status].color} ${statusConfig[currentTabData.status].bgColor}`}
              >
                {currentTabData.status}
              </Badge>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentTabIndex === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <span className="text-sm text-muted-foreground px-3">
              {currentTabIndex + 1} of {totalTabs}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentTabIndex === tabs.length - 1}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}