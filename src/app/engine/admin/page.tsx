'use client';

import React, { useEffect } from 'react';
import { generatePageTitle, updateDocumentTitle } from '@/lib/utils/page-titles';
import { DiagnosticsPanel } from '@/components/DiagnosticsPanel';
import RecentDataComponent from '@/components/RecentDataComponent';
import RecentDataErrorBoundary from '@/components/shared/RecentDataErrorBoundary';

export default function AdminPage() {
  // Set page title
  useEffect(() => {
    const pageTitle = generatePageTitle({
      pageTitle: 'Administration',
      section: 'Engine'
    });
    updateDocumentTitle(pageTitle);
  }, []);

  return (
    <div className="space-y-8" id="admin-dashboard">
      {/* Welcome Header */}
      <div className="text-center py-8" id="admin-header">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Monitor OPAL Strategy Assistant workflow triggers and agents in real-time
        </p>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="admin-dashboard-content">

        {/* Left Column */}
        <div className="space-y-8" id="admin-left-column">
          {/* Recent Data Component - Reusable webhook and agent status monitoring */}
          <RecentDataErrorBoundary
            onError={(error, errorInfo) => {
              console.error('🚨 [AdminPage] RecentDataComponent error caught:', error, errorInfo);
            }}
          >
            <RecentDataComponent />
          </RecentDataErrorBoundary>
        </div>
        {/* End Left Column */}

        {/* Right Column */}
        <div className="space-y-8" id="admin-right-column">

          {/* Diagnostics Panel */}
          <DiagnosticsPanel className="" id="diagnostics-panel-block" />

        </div>
        {/* End Right Column */}

      </div>
      {/* End 2-Column Layout */}
    </div>
  );
}