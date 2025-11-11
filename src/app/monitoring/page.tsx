import EnhancedOpalMonitoringDashboard from '@/components/EnhancedOpalMonitoringDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OPAL Monitoring Dashboard - Strategy Platform',
  description: 'Real-time monitoring and analytics for OPAL agents and workflows',
};

export default function MonitoringPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <EnhancedOpalMonitoringDashboard />
      </div>
    </div>
  );
}