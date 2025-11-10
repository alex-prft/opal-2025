import Link from 'next/link';
import {
  Monitor,
  Settings,
  Database,
  Activity,
  Shield,
  ArrowLeft
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/engine/results"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Results
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Admin Console
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Activity className="h-4 w-4" />
              <span>System Status: Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            <Link
              href="/admin/opal-monitoring"
              className="flex items-center gap-2 px-1 py-4 border-b-2 border-blue-500 text-blue-600 text-sm font-medium"
            >
              <Monitor className="h-4 w-4" />
              OPAL Monitoring
            </Link>
            <Link
              href="/admin/system-settings"
              className="flex items-center gap-2 px-1 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              <Settings className="h-4 w-4" />
              System Settings
            </Link>
            <Link
              href="/admin/database"
              className="flex items-center gap-2 px-1 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              <Database className="h-4 w-4" />
              Database
            </Link>
          </div>
        </div>
      </nav>

      {/* Admin Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Admin Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              OPAL Connector - Admin Console v1.0.0
            </div>
            <div className="flex items-center gap-4">
              <span>Last Updated: {new Date().toLocaleString()}</span>
              <a href="#" className="hover:text-gray-700">Documentation</a>
              <a href="#" className="hover:text-gray-700">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}