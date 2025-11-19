'use client';

/**
 * API Documentation Page - Client Component
 *
 * This is the actual implementation that uses React hooks and Swagger UI.
 * Loaded dynamically with SSR disabled to prevent build issues.
 */

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronLeftIcon, DocumentTextIcon, CodeBracketIcon, ServerIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

// Dynamically import Swagger UI to avoid SSR issues
const SwaggerUI = dynamic(
  () => import('swagger-ui-react'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading API Documentation...</span>
      </div>
    )
  }
);

// Import Swagger UI CSS
import 'swagger-ui-react/swagger-ui.css';

interface APIStats {
  endpoints: number;
  schemas: number;
  serverUrl: string;
  lastGenerated: string;
}

export default function APIDocumentationPageClient() {
  const [apiStats, setApiStats] = useState<APIStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch API stats from the OpenAPI spec
  useEffect(() => {
    const fetchApiStats = async () => {
      try {
        const response = await fetch('/api/openapi.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch API specification: ${response.status}`);
        }

        const spec = await response.json();

        setApiStats({
          endpoints: Object.keys(spec.paths || {}).length,
          schemas: Object.keys(spec.components?.schemas || {}).length,
          serverUrl: spec.servers?.[0]?.url || window.location.origin,
          lastGenerated: spec['x-generated-at'] || new Date().toISOString()
        });
      } catch (err) {
        console.error('Failed to fetch API stats:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    fetchApiStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            {/* Navigation */}
            <div className="flex items-center space-x-4 mb-6">
              <Link
                href="/engine/admin"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5 mr-1" />
                Back to Admin
              </Link>
            </div>

            {/* Title and Stats */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  OPAL API Documentation
                </h1>
                <p className="text-gray-600 max-w-2xl">
                  Interactive documentation for the OPAL Decision & Diagnostics API.
                  Test endpoints, explore schemas, and understand the complete integration flow.
                </p>
              </div>

              {/* API Stats */}
              {apiStats && (
                <div className="mt-6 lg:mt-0 grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <CodeBracketIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-900">{apiStats.endpoints}</div>
                    <div className="text-sm text-blue-700">Endpoints</div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <DocumentTextIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-900">{apiStats.schemas}</div>
                    <div className="text-sm text-green-700">Schemas</div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <ServerIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="text-xs font-bold text-purple-900">
                      {apiStats.serverUrl.replace('https://', '').replace('http://', '').substring(0, 12)}...
                    </div>
                    <div className="text-sm text-purple-700">Server</div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <div className="h-6 w-6 bg-yellow-600 rounded-full flex items-center justify-center">
                        <div className="h-2 w-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-yellow-900">
                      {new Date(apiStats.lastGenerated).toLocaleTimeString()}
                    </div>
                    <div className="text-sm text-yellow-700">Generated</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Documentation Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold">!</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Failed to Load API Documentation
                </h3>
                <p className="mt-2 text-sm text-red-700">
                  {error}
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="text-sm bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Quick Start Guide */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">Quick Start Guide</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white rounded p-4">
                  <h3 className="font-medium text-blue-800 mb-2">1. Authentication</h3>
                  <p className="text-blue-700">
                    Use API Key, Bearer Token, or HMAC signature headers for secure access.
                  </p>
                </div>
                <div className="bg-white rounded p-4">
                  <h3 className="font-medium text-blue-800 mb-2">2. Try Endpoints</h3>
                  <p className="text-blue-700">
                    Click "Try it out" on any endpoint below to test with real data.
                  </p>
                </div>
                <div className="bg-white rounded p-4">
                  <h3 className="font-medium text-blue-800 mb-2">3. Integration</h3>
                  <p className="text-blue-700">
                    Use the generated code samples to integrate with your applications.
                  </p>
                </div>
              </div>
            </div>

            {/* Swagger UI */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <SwaggerUI
                url="/api/openapi.json"
                deepLinking={true}
                displayOperationId={false}
                defaultModelsExpandDepth={2}
                defaultModelExpandDepth={3}
                defaultModelRendering="model"
                displayRequestDuration={true}
                docExpansion="list"
                filter={false}
                showExtensions={true}
                showCommonExtensions={true}
                tryItOutEnabled={true}
                requestSnippetsEnabled={true}
                requestSnippets={{
                  generators: {
                    "curl_bash": {
                      title: "cURL (bash)",
                      syntax: "bash"
                    },
                    "javascript_fetch": {
                      title: "JavaScript (fetch)",
                      syntax: "javascript"
                    },
                    "node_native": {
                      title: "Node.js (native)",
                      syntax: "javascript"
                    },
                    "python_requests": {
                      title: "Python (requests)",
                      syntax: "python"
                    }
                  },
                  defaultExpanded: true,
                  languages: ["curl_bash", "javascript_fetch", "node_native", "python_requests"]
                }}
                supportedSubmitMethods={['get', 'post', 'put', 'delete', 'patch', 'head', 'options']}
                validatorUrl={null} // Disable online validator for local development
                onComplete={(system: any) => {
                  console.log('Swagger UI loaded successfully', system);
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-100 border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-gray-600">
              <p>OPAL Decision & Diagnostics API v1.0.0</p>
              <p className="mt-1">
                Generated from{' '}
                <Link href="/docs/openapi.yaml" className="text-blue-600 hover:text-blue-800">
                  OpenAPI specification
                </Link>
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex space-x-4 text-sm">
                <Link
                  href="/api/openapi.json"
                  className="text-gray-600 hover:text-gray-900"
                >
                  JSON Spec
                </Link>
                <Link
                  href="/docs/openapi.yaml"
                  className="text-gray-600 hover:text-gray-900"
                >
                  YAML Spec
                </Link>
                <Link
                  href="/engine/admin"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Admin Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
