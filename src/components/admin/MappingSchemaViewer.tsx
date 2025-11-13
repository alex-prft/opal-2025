/**
 * Mapping Schema Viewer Component
 * JSON preview with validation status and interactive editing
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Save,
  Download,
  Upload,
  RefreshCw,
  Code,
  FileJson
} from 'lucide-react';
import {
  MappingType,
  ConsolidatedOpalMapping,
  validateMappingConfiguration,
  validatePartialMapping
} from '@/lib/schemas/consolidated-mapping-schema';

interface MappingSchemaViewerProps {
  selectedMapping: MappingType | null;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function MappingSchemaViewer({ selectedMapping }: MappingSchemaViewerProps) {
  const [currentMapping, setCurrentMapping] = useState<MappingType>('strategy-plans');
  const [schema, setSchema] = useState<ConsolidatedOpalMapping | null>(null);
  const [editedSchema, setEditedSchema] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, errors: [], warnings: [] });
  const [isLoading, setIsLoading] = useState(false);

  // Update current mapping when prop changes
  useEffect(() => {
    if (selectedMapping) {
      setCurrentMapping(selectedMapping);
    }
  }, [selectedMapping]);

  // Load schema when mapping changes
  useEffect(() => {
    loadSchema(currentMapping);
  }, [currentMapping]);

  const loadSchema = async (mappingType: MappingType) => {
    setIsLoading(true);
    try {
      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 500));

      // Load the schema based on mapping type
      const mockSchema: Partial<ConsolidatedOpalMapping> = {
        title: `OPAL Mapping Configuration - ${mappingType}`,
        category: `${mappingType} Navigation`,
        version: '1.0.0',
        last_updated: '2025-11-12',
        mapping_type: mappingType,
        strategy_dashboard_area: mappingType.charAt(0).toUpperCase() + mappingType.slice(1),
        sub_sections: [
          {
            name: 'Example Section',
            tier3_views: [
              {
                view_name: 'Example View',
                recommended_content: ['Example content item 1', 'Example content item 2'],
                primary_agent: 'content_review',
                supporting_agents: ['audience_suggester'],
                kpi_alignment: ['engagement_rate', 'conversion_rate']
              }
            ]
          }
        ],
        opal_instructions: ['kpi_experimentation', 'marketing_strategy'],
        opal_agents: ['content_review', 'audience_suggester'],
        dxp_tools: ['CMS', 'CMP'],
        personalization_rules: [
          {
            rule_name: 'example_rule',
            trigger_conditions: ['user_engagement > 0.8'],
            data_sources: ['user_analytics', 'performance_metrics'],
            priority: 1
          }
        ],
        confidence_metrics: {
          confidence_interval: 0.95,
          success_probability: 0.88,
          data_quality_score: 0.92
        },
        integration_health: {
          api_status: 'connected',
          last_refresh: new Date().toISOString(),
          data_freshness: 'real-time'
        },
        recommendation_metadata: {
          aligned_kpis: ['engagement_rate', 'conversion_rate'],
          business_strategy: 'data_driven_optimization',
          marketing_calendar_sync: true
        },
        validation_rules: {
          required_fields: ['view_name', 'primary_agent', 'recommended_content']
        }
      };

      const validated = validateMappingConfiguration(mockSchema);
      if (validated.success && validated.data) {
        setSchema(validated.data);
        setEditedSchema(JSON.stringify(validated.data, null, 2));
        validateSchema(JSON.stringify(validated.data, null, 2));
      }
    } catch (error) {
      console.error('Failed to load schema:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateSchema = (schemaJson: string) => {
    try {
      const parsed = JSON.parse(schemaJson);
      const result = validateMappingConfiguration(parsed);

      if (result.success) {
        setValidation({ isValid: true, errors: [], warnings: [] });
      } else {
        const errors = result.errors?.map(err => `${err.path.join('.')}: ${err.message}`) || [];
        setValidation({ isValid: false, errors, warnings: [] });
      }
    } catch (error) {
      setValidation({
        isValid: false,
        errors: ['Invalid JSON format'],
        warnings: []
      });
    }
  };

  const handleSchemaEdit = (value: string) => {
    setEditedSchema(value);
    validateSchema(value);
  };

  const saveSchema = async () => {
    if (!validation.isValid) {
      return;
    }

    try {
      setIsLoading(true);
      const parsed = JSON.parse(editedSchema);

      // Mock API call to save schema
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSchema(parsed);
      setIsEditing(false);

      // Show success message (you could use a toast here)
      console.log('Schema saved successfully');
    } catch (error) {
      console.error('Failed to save schema:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportSchema = () => {
    if (!schema) return;

    const dataStr = JSON.stringify(schema, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `${currentMapping}-mapping-config.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importSchema = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setEditedSchema(content);
      validateSchema(content);
      setIsEditing(true);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Schema Viewer & Editor</h2>
          <p className="text-gray-600">
            View and edit OPAL mapping configurations with real-time validation
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Select value={currentMapping} onValueChange={(value: MappingType) => setCurrentMapping(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strategy-plans">Strategy Plans</SelectItem>
              <SelectItem value="dxp-tools">DXP Tools</SelectItem>
              <SelectItem value="analytics-insights">Analytics Insights</SelectItem>
              <SelectItem value="experience-optimization">Experience Optimization</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={() => loadSchema(currentMapping)} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Validation Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {validation.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <CardTitle className="text-lg">
                Validation Status
              </CardTitle>
            </div>

            <Badge variant={validation.isValid ? 'default' : 'destructive'}>
              {validation.isValid ? 'Valid' : `${validation.errors.length} Error(s)`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {validation.errors.length > 0 && (
            <Alert variant="destructive" className="mb-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {validation.errors.map((error, index) => (
                    <div key={index} className="text-sm">{error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {validation.warnings.length > 0 && (
            <Alert className="mb-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <div key={index} className="text-sm">{warning}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {validation.isValid && validation.errors.length === 0 && (
            <p className="text-green-600 text-sm">Schema is valid and ready for use.</p>
          )}
        </CardContent>
      </Card>

      {/* Schema Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileJson className="h-5 w-5" />
                <span>Schema Configuration</span>
              </CardTitle>
              <CardDescription>
                {isEditing ? 'Editing schema configuration' : 'Viewing schema configuration'}
              </CardDescription>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={exportSchema} disabled={!schema}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={importSchema}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </div>

              {isEditing ? (
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setIsEditing(false);
                    if (schema) {
                      setEditedSchema(JSON.stringify(schema, null, 2));
                    }
                  }}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveSchema}
                    disabled={!validation.isValid || isLoading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => setIsEditing(true)} disabled={!schema}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editedSchema}
                onChange={(e) => handleSchemaEdit(e.target.value)}
                className="font-mono text-sm min-h-[600px]"
                placeholder="Enter valid JSON schema configuration..."
              />
            </div>
          ) : (
            <div className="relative">
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[600px] text-sm">
                <code>{schema ? JSON.stringify(schema, null, 2) : 'Loading schema...'}</code>
              </pre>
              {!schema && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schema Metadata */}
      {schema && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{schema.version}</p>
                <p className="text-sm text-gray-600">Version</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{schema.sub_sections.length}</p>
                <p className="text-sm text-gray-600">Sub-sections</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{schema.personalization_rules.length}</p>
                <p className="text-sm text-gray-600">Active Rules</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}