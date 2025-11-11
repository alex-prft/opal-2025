'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function StrategyAIPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the influence factors page as the default Strategy AI page
    router.replace('/engine/admin/strategy-ai/influence-factors');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]" id="strategy-ai-redirect-page">
      <div className="text-center" id="loading-state">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading Strategy AI...</h2>
        <p className="text-gray-600">You will be redirected to the Influence Factors section.</p>
      </div>
    </div>
  );
}