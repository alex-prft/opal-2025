'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ConfigurationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/engine/admin/configurations/data-integrations');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading Configurations...</h2>
        <p className="text-gray-600">You will be redirected to Data Integrations.</p>
      </div>
    </div>
  );
}