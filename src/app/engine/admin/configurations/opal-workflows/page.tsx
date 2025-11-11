'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Layers } from 'lucide-react';

export default function OpalWorkflowsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Layers className="h-8 w-8 text-blue-600" />
          OPAL Workflows
        </h1>
        <p className="text-gray-600 mt-1">Configure and manage OPAL workflow templates</p>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          <Layers className="h-12 w-12 mx-auto mb-2" />
          <p>OPAL workflows management interface coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}