'use client';

import { useState, useEffect } from 'react';
import React from 'react';

interface DeploymentInfo {
  timestamp: string;
  source: string;
  success: boolean;
  deploymentUrl?: string;
  error?: string;
}

export default function Footer() {
  // CRITICAL: Check for React availability during static generation
  if (typeof window === 'undefined' && (!React || !useState)) {
    // Return safe fallback during build
    return (
      <footer className="bg-gray-50 border-t border-gray-200 py-4 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="text-sm text-gray-500">
            Footer loading...
          </div>
        </div>
      </footer>
    );
  }

  const [deploymentInfo, setDeploymentInfo] = useState<DeploymentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeploymentInfo = async () => {
      try {
        const response = await fetch('/api/deployment-info');
        const data = await response.json();
        setDeploymentInfo(data);
      } catch (error) {
        console.error('Failed to fetch deployment info:', error);
        setDeploymentInfo({
          timestamp: new Date().toISOString(),
          source: 'error-fallback',
          success: false,
          error: 'Failed to fetch deployment info'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDeploymentInfo();
  }, []);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      })
    };
  };

  if (loading) {
    return (
      <footer className="bg-gray-50 border-t border-gray-200 py-4 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="text-sm text-gray-500">
            Loading deployment information...
          </div>
        </div>
      </footer>
    );
  }

  if (!deploymentInfo) {
    return (
      <footer className="bg-gray-50 border-t border-gray-200 py-4 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="text-sm text-gray-500">
            Deployment information unavailable
          </div>
        </div>
      </footer>
    );
  }

  const { date, time } = formatTimestamp(deploymentInfo.timestamp);

  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-4 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
          <div className="flex items-center space-x-2 mb-2 sm:mb-0">
            <span className={`inline-block w-2 h-2 rounded-full ${
              deploymentInfo.success ? 'bg-green-500' : 'bg-yellow-500'
            }`}></span>
            <span>
              Last Production Deploy:
              <span className="font-medium ml-1">{date} at {time}</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://opal-2025.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              opal-2025.vercel.app
            </a>
            {deploymentInfo.source && (
              <span className="text-xs text-gray-400">
                ({deploymentInfo.source})
              </span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}