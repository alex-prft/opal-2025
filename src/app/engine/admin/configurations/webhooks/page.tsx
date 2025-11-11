'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Webhook } from 'lucide-react';

export default function WebhooksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Webhook className="h-8 w-8 text-blue-600" />
          Webhooks Configuration
        </h1>
        <p className="text-gray-600 mt-1">Configure webhook endpoints and event subscriptions</p>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          <Webhook className="h-12 w-12 mx-auto mb-2" />
          <p>Webhooks configuration interface coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}