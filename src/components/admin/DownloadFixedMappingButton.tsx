'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

interface DownloadFixedMappingButtonProps {
  hasIssues?: boolean;
  onFixApplied?: () => void;
}

export default function DownloadFixedMappingButton({
  hasIssues = false,
  onFixApplied
}: DownloadFixedMappingButtonProps) {
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<{
    success: boolean;
    message: string;
    summary?: any;
  } | null>(null);

  const handleFixMapping = async () => {
    setIsFixing(true);
    setFixResult(null);

    try {
      const response = await fetch('/api/admin/fix-mapping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        setFixResult({
          success: true,
          message: result.message,
          summary: result.summary
        });

        // Trigger parent component refresh
        if (onFixApplied) {
          onFixApplied();
        }

        // Auto-download if fixes were applied
        if (result.summary?.missing_tier3_fixed > 0 || result.summary?.agent_gaps_fixed > 0) {
          handleDownload();
        }
      } else {
        setFixResult({
          success: false,
          message: result.message || 'Failed to fix mapping issues'
        });
      }
    } catch (error) {
      console.error('Fix mapping error:', error);
      setFixResult({
        success: false,
        message: 'Network error occurred while fixing mapping'
      });
    } finally {
      setIsFixing(false);
    }
  };

  const handleDownload = () => {
    // Create download link for fixed mapping file
    const link = document.createElement('a');
    link.href = '/opal-config/opal-mapping/opal_mapping_fixed.json';
    link.download = 'opal_mapping_fixed.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = async () => {
    try {
      const response = await fetch('/api/admin/fix-mapping', {
        method: 'GET'
      });

      const result = await response.json();

      if (result.preview) {
        // Show preview in new window or modal
        const previewWindow = window.open('', '_blank', 'width=800,height=600');
        if (previewWindow) {
          previewWindow.document.write(`
            <html>
              <head><title>Mapping Fix Preview</title></head>
              <body style="font-family: monospace; padding: 20px;">
                <h2>Mapping Fix Preview</h2>
                <pre>${JSON.stringify(result, null, 2)}</pre>
              </body>
            </html>
          `);
        }
      }
    } catch (error) {
      console.error('Preview error:', error);
    }
  };

  return (
    <div className="mb-6 space-y-3">
      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {hasIssues ? (
          <>
            <Button
              onClick={handleFixMapping}
              disabled={isFixing}
              className="flex items-center gap-2"
            >
              {isFixing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {isFixing ? 'Applying Fixes...' : 'Apply Auto-Fixes'}
            </Button>

            <Button
              onClick={handlePreview}
              variant="outline"
              disabled={isFixing}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Preview Changes
            </Button>
          </>
        ) : (
          <Button
            onClick={handleDownload}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Current Mapping
          </Button>
        )}
      </div>

      {/* Fix Result Display */}
      {fixResult && (
        <div className={`p-4 rounded-lg border ${
          fixResult.success
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-2">
            {fixResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                fixResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {fixResult.success ? 'Fixes Applied Successfully!' : 'Fix Failed'}
              </p>
              <p className={`text-xs mt-1 ${
                fixResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {fixResult.message}
              </p>

              {/* Fix Summary */}
              {fixResult.success && fixResult.summary && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-4 text-xs text-green-700">
                    {fixResult.summary.missing_tier3_fixed > 0 && (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        {fixResult.summary.missing_tier3_fixed} Tier3 Fixed
                      </Badge>
                    )}
                    {fixResult.summary.agent_gaps_fixed > 0 && (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        {fixResult.summary.agent_gaps_fixed} Agent Gaps Fixed
                      </Badge>
                    )}
                  </div>

                  <Button
                    onClick={handleDownload}
                    size="sm"
                    variant="outline"
                    className="mt-2 h-7 text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download Fixed File
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}