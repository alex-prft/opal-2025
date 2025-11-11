'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map } from 'lucide-react';

export default function DataMappingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Map className="h-8 w-8 text-blue-600" />
          Data Mapping
        </h1>
        <p className="text-gray-600 mt-1">
          Configure data field mappings and transformations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Field Mapping Configuration</CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center text-gray-500">
          <Map className="h-12 w-12 mx-auto mb-2" />
          <p>Data mapping interface coming soon</p>
          <p className="text-sm">Configure how external data fields map to internal schemas</p>
        </CardContent>
      </Card>
    </div>
  );
}