'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Cog } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Cog className="h-8 w-8 text-blue-600" />
          Settings
        </h1>
        <p className="text-gray-600 mt-1">Global system settings and preferences</p>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          <Cog className="h-12 w-12 mx-auto mb-2" />
          <p>System settings interface coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}