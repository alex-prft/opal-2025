import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function AudienceRecommendationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          Audience Recommendations
        </h1>
        <p className="text-gray-600 mt-1">AI-powered audience targeting and segmentation recommendations</p>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-2" />
          <p>Audience recommendations interface coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}