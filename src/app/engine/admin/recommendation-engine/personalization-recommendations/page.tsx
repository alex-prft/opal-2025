'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
export default function PersonalizationRecommendationsPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><Sparkles className="h-8 w-8 text-blue-600" />Personalization Recommendations</h1><p className="text-gray-600 mt-1">AI-powered personalization strategy recommendations</p></div>
      <Card><CardContent className="p-8 text-center text-gray-500"><Sparkles className="h-12 w-12 mx-auto mb-2" /><p>Personalization recommendations interface coming soon</p></CardContent></Card>
    </div>
  );
}
