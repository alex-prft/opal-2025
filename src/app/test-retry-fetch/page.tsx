/**
 * Fetch with Retry Test Page
 * Demonstrates the enhanced fetch retry utility
 */

'use client';

import React, { useState } from 'react';
import {
  fetchWithRetry,
  fetchWithRetrySimple,
  fetchJsonWithRetry,
  RetryPresets,
  type RetryOptions,
  type RetryResult
} from '@/lib/utils/fetch-with-retry';

export default function TestRetryFetchPage() {
  const [results, setResults] = useState<Array<{
    id: string;
    type: string;
    url: string;
    result: any;
    timestamp: string;
  }>>([]);

  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  const addResult = (id: string, type: string, url: string, result: any) => {
    setResults(prev => [{
      id,
      type,
      url,
      result,
      timestamp: new Date().toISOString()
    }, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const testFetch = async (id: string, type: string, url: string, options?: RetryOptions) => {
    setIsLoading(prev => ({ ...prev, [id]: true }));

    try {
      const result = await fetchWithRetry(url, {}, options);
      addResult(id, type, url, result);
    } catch (error) {
      addResult(id, type, url, { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const testSimpleFetch = async (id: string) => {
    setIsLoading(prev => ({ ...prev, [id]: true }));

    try {
      const result = await fetchWithRetrySimple('https://httpbin.org/status/500');
      addResult(id, 'Simple', 'httpbin.org/status/500', result);
    } catch (error) {
      addResult(id, 'Simple', 'httpbin.org/status/500', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const testJsonFetch = async (id: string) => {
    setIsLoading(prev => ({ ...prev, [id]: true }));

    try {
      const result = await fetchJsonWithRetry<{ origin: string }>('https://httpbin.org/ip', {
        retryOptions: RetryPresets.standard
      });
      addResult(id, 'JSON', 'httpbin.org/ip', result);
    } catch (error) {
      addResult(id, 'JSON', 'httpbin.org/ip', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Fetch with Retry Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing the enhanced retry utility with various scenarios
          </p>
        </div>

        {/* Original vs Enhanced Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Original vs Enhanced Implementation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-red-600 dark:text-red-400">❌ Original Function</h3>
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <code className="text-sm text-red-800 dark:text-red-200 whitespace-pre-wrap">
{`const fetchWithRetry = async (url: string, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res.json();
    } catch (e) {
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return { status: 'degraded' };
};`}
                </code>
                <div className="mt-3 text-sm text-red-700 dark:text-red-300 space-y-1">
                  <div>⚠️ No timeout protection</div>
                  <div>⚠️ Linear backoff only</div>
                  <div>⚠️ Retries all HTTP errors</div>
                  <div>⚠️ Generic error response</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-green-600 dark:text-green-400">✅ Enhanced Solution</h3>
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <code className="text-sm text-green-800 dark:text-green-200">
{`// Enhanced with full configuration
const result = await fetchWithRetry(url, {}, {
  retries: 3,
  timeout: 10000,
  backoffStrategy: 'exponential',
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
});

// Returns detailed result
{
  success: boolean,
  status: 'success' | 'error' | 'timeout' | 'degraded',
  data?: any,
  statusCode?: number,
  attempts: number,
  totalDuration: number
}`}
                </code>
                <div className="mt-3 text-sm text-green-700 dark:text-green-300 space-y-1">
                  <div>✅ Timeout protection</div>
                  <div>✅ Exponential backoff with jitter</div>
                  <div>✅ Smart retry logic</div>
                  <div>✅ Detailed error information</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Test Controls</h2>
            <button
              onClick={clearResults}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Clear Results
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Success Case */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Success Case</h3>
              <button
                onClick={() => testFetch('success', 'Success', 'https://httpbin.org/json')}
                disabled={isLoading.success}
                className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isLoading.success ? 'Testing...' : 'Test Success'}
              </button>
            </div>

            {/* Retry Case */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Server Error (500)</h3>
              <button
                onClick={() => testFetch('retry', 'Retry', 'https://httpbin.org/status/500', RetryPresets.aggressive)}
                disabled={isLoading.retry}
                className="w-full px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {isLoading.retry ? 'Testing...' : 'Test Retries'}
              </button>
            </div>

            {/* Timeout Case */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Timeout</h3>
              <button
                onClick={() => testFetch('timeout', 'Timeout', 'https://httpbin.org/delay/10', {
                  ...RetryPresets.standard,
                  timeout: 2000
                })}
                disabled={isLoading.timeout}
                className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isLoading.timeout ? 'Testing...' : 'Test Timeout'}
              </button>
            </div>

            {/* Non-retryable Error */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">404 Error</h3>
              <button
                onClick={() => testFetch('404', '404', 'https://httpbin.org/status/404')}
                disabled={isLoading['404']}
                className="w-full px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {isLoading['404'] ? 'Testing...' : 'Test 404'}
              </button>
            </div>
          </div>

          {/* Legacy Function Test */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Legacy Function (Drop-in Replacement)</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => testSimpleFetch('simple')}
                disabled={isLoading.simple}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isLoading.simple ? 'Testing...' : 'Test fetchWithRetrySimple()'}
              </button>

              <button
                onClick={() => testJsonFetch('json')}
                disabled={isLoading.json}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isLoading.json ? 'Testing...' : 'Test fetchJsonWithRetry()'}
              </button>
            </div>
          </div>
        </div>

        {/* Retry Presets */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Available Presets</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(RetryPresets).map(([name, config]) => (
              <div key={name} className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2 capitalize">{name}</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div>Retries: {config.retries}</div>
                  <div>Base Delay: {config.baseDelay}ms</div>
                  <div>Max Delay: {config.maxDelay}ms</div>
                  <div>Timeout: {config.timeout}ms</div>
                  <div>Strategy: {config.backoffStrategy}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Test Results</h2>

            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        result.result.success
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {result.type}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {result.url}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-700 rounded p-3">
                    <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}