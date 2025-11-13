/**
 * Personalization Rules Editor Component
 * UI for creating/editing personalization rules with inline validation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  PlayCircle,
  PauseCircle,
  AlertCircle,
  CheckCircle,
  Settings,
  BarChart3,
  Clock
} from 'lucide-react';
import {
  PersonalizationRule,
  PersonalizationRuleSchema,
  MappingType
} from '@/lib/schemas/consolidated-mapping-schema';

interface RuleWithStats extends PersonalizationRule {
  id: string;
  mapping_type: MappingType;
  created_at: string;
  updated_at: string;
  performance_metrics?: {
    total_executions: number;
    success_rate: number;
    avg_processing_time: number;
    last_execution: string;
  };
}

export function PersonalizationRulesEditor() {
  const [rules, setRules] = useState<RuleWithStats[]>([]);
  const [selectedRule, setSelectedRule] = useState<RuleWithStats | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<Partial<PersonalizationRule>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Load rules on component mount
  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setIsLoading(true);
    try {
      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockRules: RuleWithStats[] = [
        {
          id: '1',
          rule_name: 'Analytics Maturity Adaptation',
          rule_type: 'conditional',
          priority: 1,
          trigger_conditions: [
            'analytics_maturity_level',
            'technical_proficiency',
            'business_complexity'
          ],
          data_sources: [
            'user_interaction_patterns',
            'feature_usage_analytics',
            'success_metrics'
          ],
          description: 'Adapts analytics complexity and recommendations based on organizational analytics maturity',
          affected_domains: ['all_7_dimensions'],
          execution_count: 245,
          success_rate: 0.92,
          is_active: true,
          mapping_type: 'analytics-insights',
          created_at: '2025-11-10T10:00:00Z',
          updated_at: '2025-11-12T09:30:00Z',
          performance_metrics: {
            total_executions: 245,
            success_rate: 0.92,
            avg_processing_time: 45,
            last_execution: '2025-11-12T11:45:00Z'
          }
        },
        {
          id: '2',
          rule_name: 'DXP Tool Usage Optimization',
          rule_type: 'conditional',
          priority: 1,
          trigger_conditions: [
            'current_dxp_tool_adoption_level',
            'user_technical_proficiency',
            'business_objectives_alignment'
          ],
          data_sources: [
            'dxp_usage_analytics',
            'user_interaction_patterns',
            'business_goal_tracking'
          ],
          description: 'Optimizes DXP tool recommendations based on current usage patterns and technical capability',
          affected_domains: ['all_dxp_tools'],
          execution_count: 156,
          success_rate: 0.88,
          is_active: true,
          mapping_type: 'dxp-tools',
          created_at: '2025-11-10T14:30:00Z',
          updated_at: '2025-11-12T08:15:00Z',
          performance_metrics: {
            total_executions: 156,
            success_rate: 0.88,
            avg_processing_time: 38,
            last_execution: '2025-11-12T10:22:00Z'
          }
        },
        {
          id: '3',
          rule_name: 'Optimization Maturity Adaptation',
          rule_type: 'conditional',
          priority: 1,
          trigger_conditions: [
            'organizational_optimization_maturity',
            'technical_capability_assessment',
            'resource_availability_analysis'
          ],
          data_sources: [
            'optimization_maturity_assessment',
            'technical_infrastructure_evaluation',
            'resource_allocation_tracking'
          ],
          description: 'Adapts optimization recommendations based on organizational optimization maturity and capability',
          affected_domains: ['all_domains'],
          execution_count: 89,
          success_rate: 0.95,
          is_active: true,
          mapping_type: 'experience-optimization',
          created_at: '2025-11-11T16:00:00Z',
          updated_at: '2025-11-12T07:45:00Z',
          performance_metrics: {
            total_executions: 89,
            success_rate: 0.95,
            avg_processing_time: 52,
            last_execution: '2025-11-12T11:20:00Z'
          }
        },
        {
          id: '4',
          rule_name: 'Resource Constraint Optimization',
          rule_type: 'conditional',
          priority: 2,
          trigger_conditions: [
            'available_budget',
            'team_capacity_analysis',
            'timeline_constraint_assessment'
          ],
          data_sources: [
            'budget_allocation_tracking',
            'team_capacity_management',
            'project_timeline_data'
          ],
          description: 'Filters recommendations based on resource availability and constraints',
          affected_domains: ['all_planning_areas'],
          execution_count: 67,
          success_rate: 0.91,
          is_active: false,
          mapping_type: 'strategy-plans',
          created_at: '2025-11-09T11:20:00Z',
          updated_at: '2025-11-11T15:30:00Z',
          performance_metrics: {
            total_executions: 67,
            success_rate: 0.91,
            avg_processing_time: 41,
            last_execution: '2025-11-11T18:45:00Z'
          }
        }
      ];

      setRules(mockRules);
    } catch (error) {
      console.error('Failed to load rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateRule = (rule: Partial<PersonalizationRule>): string[] => {
    const errors: string[] = [];

    if (!rule.rule_name || rule.rule_name.trim().length === 0) {
      errors.push('Rule name is required');
    }

    if (!rule.trigger_conditions || rule.trigger_conditions.length === 0) {
      errors.push('At least one trigger condition is required');
    }

    if (!rule.data_sources || rule.data_sources.length === 0) {
      errors.push('At least one data source is required');
    }

    if (rule.priority && (rule.priority < 1 || rule.priority > 10)) {
      errors.push('Priority must be between 1 and 10');
    }

    return errors;
  };

  const openRuleEditor = (rule?: RuleWithStats) => {
    if (rule) {
      setEditingRule({ ...rule });
      setSelectedRule(rule);
    } else {
      setEditingRule({
        rule_name: '',
        rule_type: 'conditional',
        priority: 1,
        trigger_conditions: [''],
        data_sources: [''],
        description: '',
        affected_domains: [''],
        is_active: true
      });
      setSelectedRule(null);
    }
    setValidationErrors([]);
    setIsDialogOpen(true);
  };

  const saveRule = async () => {
    const errors = validateRule(editingRule);
    setValidationErrors(errors);

    if (errors.length > 0) {
      return;
    }

    try {
      // Mock API call to save rule
      await new Promise(resolve => setTimeout(resolve, 500));

      if (selectedRule) {
        // Update existing rule
        setRules(prev => prev.map(rule =>
          rule.id === selectedRule.id
            ? { ...rule, ...editingRule, updated_at: new Date().toISOString() }
            : rule
        ));
      } else {
        // Create new rule
        const newRule: RuleWithStats = {
          ...editingRule as PersonalizationRule,
          id: Date.now().toString(),
          mapping_type: 'strategy-plans', // Default mapping type
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          execution_count: 0,
          success_rate: 0,
          performance_metrics: {
            total_executions: 0,
            success_rate: 0,
            avg_processing_time: 0,
            last_execution: ''
          }
        };
        setRules(prev => [...prev, newRule]);
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const toggleRuleStatus = async (ruleId: string) => {
    try {
      setRules(prev => prev.map(rule =>
        rule.id === ruleId
          ? { ...rule, is_active: !rule.is_active, updated_at: new Date().toISOString() }
          : rule
      ));
    } catch (error) {
      console.error('Failed to toggle rule status:', error);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) {
      return;
    }

    try {
      // Mock API call to delete rule
      await new Promise(resolve => setTimeout(resolve, 300));
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const updateEditingRuleField = (field: keyof PersonalizationRule, value: any) => {
    setEditingRule(prev => ({ ...prev, [field]: value }));

    // Clear validation errors when user starts fixing them
    if (validationErrors.length > 0) {
      const errors = validateRule({ ...editingRule, [field]: value });
      setValidationErrors(errors);
    }
  };

  const updateArrayField = (field: 'trigger_conditions' | 'data_sources' | 'affected_domains', index: number, value: string) => {
    const currentArray = editingRule[field] || [];
    const newArray = [...currentArray];
    newArray[index] = value;
    updateEditingRuleField(field, newArray);
  };

  const addArrayItem = (field: 'trigger_conditions' | 'data_sources' | 'affected_domains') => {
    const currentArray = editingRule[field] || [];
    updateEditingRuleField(field, [...currentArray, '']);
  };

  const removeArrayItem = (field: 'trigger_conditions' | 'data_sources' | 'affected_domains', index: number) => {
    const currentArray = editingRule[field] || [];
    const newArray = currentArray.filter((_, i) => i !== index);
    updateEditingRuleField(field, newArray);
  };

  const getMappingTypeColor = (mappingType: MappingType) => {
    const colors = {
      'strategy-plans': 'bg-blue-100 text-blue-800',
      'dxp-tools': 'bg-green-100 text-green-800',
      'analytics-insights': 'bg-purple-100 text-purple-800',
      'experience-optimization': 'bg-orange-100 text-orange-800'
    };
    return colors[mappingType];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Settings className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Loading personalization rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Personalization Rules</h2>
          <p className="text-gray-600 mt-1">
            Manage dynamic personalization rules with trigger conditions and data sources
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openRuleEditor()}>
              <Plus className="h-4 w-4 mr-2" />
              New Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedRule ? 'Edit Personalization Rule' : 'Create New Personalization Rule'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rule_name">Rule Name *</Label>
                  <Input
                    id="rule_name"
                    value={editingRule.rule_name || ''}
                    onChange={(e) => updateEditingRuleField('rule_name', e.target.value)}
                    placeholder="Enter rule name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority (1-10)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    max="10"
                    value={editingRule.priority || 1}
                    onChange={(e) => updateEditingRuleField('priority', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingRule.description || ''}
                  onChange={(e) => updateEditingRuleField('description', e.target.value)}
                  placeholder="Describe what this rule does and when it should be applied"
                  rows={3}
                />
              </div>

              {/* Trigger Conditions */}
              <div className="space-y-2">
                <Label>Trigger Conditions *</Label>
                {(editingRule.trigger_conditions || ['']).map((condition, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={condition}
                      onChange={(e) => updateArrayField('trigger_conditions', index, e.target.value)}
                      placeholder="e.g., user_engagement > 0.8"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem('trigger_conditions', index)}
                      disabled={(editingRule.trigger_conditions || []).length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('trigger_conditions')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Condition
                </Button>
              </div>

              {/* Data Sources */}
              <div className="space-y-2">
                <Label>Data Sources *</Label>
                {(editingRule.data_sources || ['']).map((source, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={source}
                      onChange={(e) => updateArrayField('data_sources', index, e.target.value)}
                      placeholder="e.g., user_analytics, performance_metrics"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem('data_sources', index)}
                      disabled={(editingRule.data_sources || []).length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('data_sources')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Data Source
                </Button>
              </div>

              {/* Affected Domains */}
              <div className="space-y-2">
                <Label>Affected Domains</Label>
                {(editingRule.affected_domains || ['']).map((domain, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={domain}
                      onChange={(e) => updateArrayField('affected_domains', index, e.target.value)}
                      placeholder="e.g., content, personalization, ux"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem('affected_domains', index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('affected_domains')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Domain
                </Button>
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={editingRule.is_active ?? true}
                  onCheckedChange={(checked) => updateEditingRuleField('is_active', checked)}
                />
                <Label htmlFor="is_active">Rule is active</Label>
              </div>

              {/* Save/Cancel Actions */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveRule} disabled={validationErrors.length > 0}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Rule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-lg">{rule.rule_name}</h3>
                    <Badge className={getMappingTypeColor(rule.mapping_type)}>
                      {rule.mapping_type}
                    </Badge>
                    <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                      Priority {rule.priority}
                    </Badge>
                    {rule.is_active ? (
                      <Badge className="bg-green-100 text-green-800">
                        <PlayCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <PauseCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </div>

                  {rule.description && (
                    <p className="text-gray-600">{rule.description}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700 mb-1">Trigger Conditions:</p>
                      <ul className="text-gray-600 space-y-1">
                        {rule.trigger_conditions.slice(0, 2).map((condition, index) => (
                          <li key={index}>• {condition}</li>
                        ))}
                        {rule.trigger_conditions.length > 2 && (
                          <li>• ... and {rule.trigger_conditions.length - 2} more</li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <p className="font-medium text-gray-700 mb-1">Data Sources:</p>
                      <ul className="text-gray-600 space-y-1">
                        {rule.data_sources.slice(0, 2).map((source, index) => (
                          <li key={index}>• {source}</li>
                        ))}
                        {rule.data_sources.length > 2 && (
                          <li>• ... and {rule.data_sources.length - 2} more</li>
                        )}
                      </ul>
                    </div>

                    {rule.performance_metrics && (
                      <div>
                        <p className="font-medium text-gray-700 mb-1">Performance:</p>
                        <div className="text-gray-600 space-y-1">
                          <div className="flex items-center space-x-2">
                            <BarChart3 className="h-3 w-3" />
                            <span>{(rule.performance_metrics.success_rate * 100).toFixed(1)}% success rate</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-3 w-3" />
                            <span>{rule.performance_metrics.total_executions} executions</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleRuleStatus(rule.id)}
                  >
                    {rule.is_active ? (
                      <PauseCircle className="h-4 w-4" />
                    ) : (
                      <PlayCircle className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openRuleEditor(rule)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteRule(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {rules.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No personalization rules configured</h3>
                <p className="text-gray-600 mb-4">
                  Create your first personalization rule to start customizing the OPAL experience.
                </p>
                <Button onClick={() => openRuleEditor()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}