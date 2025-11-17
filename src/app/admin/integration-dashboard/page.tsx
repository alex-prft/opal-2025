import { ValidationDashboard } from '@/components/admin/ValidationDashboard';
import { generatePageMetadata } from '@/lib/utils/page-titles';

export const metadata = generatePageMetadata({
  pageTitle: 'Integration Dashboard',
  section: 'Administration',
  description: 'Monitor and manage OPAL integrations and data flow.'
});

export default function IntegrationDashboardPage() {
  return <ValidationDashboard />;
}