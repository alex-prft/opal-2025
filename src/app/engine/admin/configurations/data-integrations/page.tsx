'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export default function DataIntegrationsPage() {
  const integrations = [
    { name: 'Optimizely Web', status: 'connected', lastSync: '2 minutes ago' },
    { name: 'Google Analytics 4', status: 'connected', lastSync: '5 minutes ago' },
    { name: 'Salesforce', status: 'warning', lastSync: '1 hour ago' },
    { name: 'SendGrid', status: 'connected', lastSync: '15 minutes ago' },
    { name: 'Shopify', status: 'disconnected', lastSync: '2 days ago' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'disconnected': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-50 text-green-700 border-green-200';
      case 'warning': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'disconnected': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Database className="h-8 w-8 text-blue-600" />
          Data Integrations
        </h1>
        <p className="text-gray-600 mt-1">
          Manage connections to external data sources and platforms
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {integrations.map((integration, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(integration.status)}
                  <div>
                    <h3 className="font-semibold">{integration.name}</h3>
                    <p className="text-sm text-gray-600">Last sync: {integration.lastSync}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(integration.status)}>
                    {integration.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}