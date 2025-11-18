'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal } from 'lucide-react';

export default function AdminLogsPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Terminal className="h-8 w-8 text-green-600" />
            Admin Logs
          </h1>
          <p className="text-gray-600 mt-1">
            System logging and monitoring interface
          </p>
        </div>
      </div>

      {/* Development Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Admin Logging Feature
          </CardTitle>
          <CardDescription>
            Administrative logging interface is temporarily unavailable during the build process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-gray-500">
            <Terminal className="h-12 w-12 mx-auto mb-4 text-gray-600" />
            <p className="text-lg font-medium">Admin Logs Feature</p>
            <p className="text-sm">This page will be enhanced with full administrative logging functionality.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}