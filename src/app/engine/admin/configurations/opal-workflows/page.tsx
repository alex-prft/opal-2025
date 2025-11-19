import { generatePageMetadata } from '@/lib/utils/page-titles';

export const metadata = generatePageMetadata({
  pageTitle: 'OPAL Workflows',
  section: 'Engine',
  description: 'Configure and manage OPAL workflow templates.'
});

// Disable static generation to prevent SSR issues
export const dynamic = 'force-dynamic';

export default function OpalWorkflowsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          OPAL Workflows
        </h1>
        <p className="text-gray-600 mt-1">Configure and manage OPAL workflow templates</p>
      </div>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-8 text-center text-gray-500">
          <p>OPAL workflows management interface coming soon</p>
        </div>
      </div>
    </div>
  );
}