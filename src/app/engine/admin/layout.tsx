import { ServiceStatusProvider } from '@/components/ServiceStatusProvider';
import ServiceStatusFooter from '@/components/ServiceStatusFooter';
import AdminHeader from '@/components/AdminHeader';
import AdminNavigation from '@/components/AdminNavigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceStatusProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* Header */}
        <AdminHeader />

        {/* Navigation */}
        <AdminNavigation />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-4">
          {children}
        </main>

        <ServiceStatusFooter />
      </div>
    </ServiceStatusProvider>
  );
}