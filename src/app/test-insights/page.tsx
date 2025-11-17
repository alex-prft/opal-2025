import InsightsPageExample from '@/components/InsightsPageExample';
import { generatePageMetadata } from '@/lib/utils/page-titles';

export const metadata = generatePageMetadata({
  pageTitle: 'Test Insights',
  description: 'Test page for insights functionality and UI components.'
});

export default function TestInsightsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <InsightsPageExample />
    </div>
  );
}