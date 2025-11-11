'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AgentDataRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the content agent as the default
    router.replace('/engine/admin/opal-monitoring/agent-data/content');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading Agent Data...</h2>
        <p className="text-gray-600">Redirecting to Content Review Agent.</p>
      </div>
    </div>
  );
}