'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Eye, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

// TypeScript interfaces for API responses
interface PayloadValidationResult {
  success: boolean;
  payload?: any;
  validation_errors?: string[];
  agent_id?: string;
  timestamp: string;
}

interface ValidatePayloadPanelProps {
  agentId: string;
  className?: string;
}

export function ValidatePayloadPanel({ agentId, className = '' }: ValidatePayloadPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payloadResult, setPayloadResult] = useState<PayloadValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validate payload function
  const validatePayload = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/opal/test-payload?agent=${agentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      setPayloadResult({
        success: data.success || false,
        payload: data.payload,
        validation_errors: data.validation_errors || [],
        agent_id: agentId,
        timestamp: new Date().toISOString()
      });

      setIsModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate payload');
      setPayloadResult({
        success: false,
        validation_errors: [`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`],
        agent_id: agentId,
        timestamp: new Date().toISOString()
      });
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Validate Payload Panel */}
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle className="text-lg">Validate Payload</CardTitle>
                <CardDescription>
                  Test and validate the payload that would be sent to OSA for this agent
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Validate the JSON payload structure and content for <code className="bg-gray-100 px-2 py-1 rounded text-xs">{agentId}</code>
                </div>
                <Button
                  onClick={validatePayload}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {isLoading ? 'Validating...' : 'Validate Payload'}
                </Button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Error:</span>
                  </div>
                  <div className="text-sm text-red-600 mt-1">{error}</div>
                </div>
              )}

              <div className="text-xs text-gray-500">
                This will call <code>/api/opal/test-payload?agent={agentId}</code> to generate and validate the payload structure.
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Payload Validation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Payload Validation Result</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {payloadResult && (
                <>
                  {/* Validation Status */}
                  <div className="flex items-center gap-2 mb-4">
                    {payloadResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`font-semibold ${
                      payloadResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {payloadResult.success ? 'Payload Valid' : 'Payload Invalid'}
                    </span>
                    <Badge variant="outline" className="text-xs ml-auto">
                      {payloadResult.agent_id}
                    </Badge>
                  </div>

                  {/* Validation Errors */}
                  {payloadResult.validation_errors && payloadResult.validation_errors.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-red-800 mb-2">Validation Errors:</h4>
                      <ul className="text-xs text-red-700 space-y-1">
                        {payloadResult.validation_errors.map((error, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-red-500">•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* JSON Payload */}
                  {payloadResult.payload && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Payload Preview:</h4>
                      <pre className="text-xs bg-gray-100 p-4 rounded border overflow-x-auto max-h-96">
                        {JSON.stringify(payloadResult.payload, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Validated at: {new Date(payloadResult.timestamp).toLocaleString()}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ValidatePayloadPanel;