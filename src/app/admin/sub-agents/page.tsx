'use client';

import dynamic from 'next/dynamic';

// Make the entire page client-side to avoid SSR issues
const SubAgentsPageComponent = dynamic(() => import('./client-page'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading Sub Agents Dashboard...</p>
      </div>
    </div>
  )
});

export default function SubAgentsPage() {
  return <SubAgentsPageComponent />;
}