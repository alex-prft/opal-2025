'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Brain } from 'lucide-react';
export default function MLModelsPage() {
  return (
    <div className="space-y-6" id="ml-models-page">
      <div id="page-header">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Brain className="h-8 w-8 text-blue-600" />
          ML Models
        </h1>
        <p className="text-gray-600 mt-1">Machine learning model configuration and management</p>
      </div>
      <Card id="ml-models-placeholder-card">
        <CardContent className="p-8 text-center text-gray-500" id="coming-soon-content">
          <Brain className="h-12 w-12 mx-auto mb-2" />
          <p>ML Models interface coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
