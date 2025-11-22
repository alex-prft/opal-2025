'use client';

import React, { useEffect } from 'react';
import { generatePageTitle, updateDocumentTitle } from '@/lib/utils/page-titles';
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

      {/* Main Content */}
      <div className="max-w-4xl mx-auto" id="admin-dashboard-content">
        {/* OPAL Strategy Assistant Status & Force Sync Controls */}
        <RecentDataErrorBoundary
          onError={(error, errorInfo) => {
            console.error('🚨 [AdminPage] RecentDataComponent error caught:', error, errorInfo);
          }}
        >
          <RecentDataComponent />
        </RecentDataErrorBoundary>
      </div>
      {/* End Main Content */}
    </div>
  );
}