'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Settings } from 'lucide-react';

interface MaturityWeights {
  analytics: number;
  personalization: number;
  testing: number;
  optimization: number;
}

export default function MaturityScoringPage() {
  const [config, setConfig] = useState<{ maturityWeights: MaturityWeights }>({
    maturityWeights: {
      analytics: 25,
      personalization: 30,
      testing: 25,
      optimization: 20
    }
  });

  const updateConfig = (category: keyof MaturityWeights, value: number) => {
    setConfig(prev => ({
      ...prev,
      maturityWeights: {
        ...prev.maturityWeights,
        [category]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Settings className="h-8 w-8 text-blue-600" />
          Maturity Assessment Configuration
        </h1>
        <p className="text-gray-600 mt-1">
          Configure how different factors contribute to personalization maturity scoring
        </p>
      </div>

      {/* Maturity Weights */}
      <Card>
        <CardHeader>
          <CardTitle>Maturity Assessment Weights</CardTitle>
          <p className="text-sm text-gray-600">
            Adjust how different factors contribute to the overall maturity score
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(config.maturityWeights).map(([category, weight]) => (
            <div key={category} className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="capitalize font-medium">{category}</Label>
                <span className="text-sm font-medium">{weight}%</span>
              </div>
              <Slider
                value={[weight]}
                onValueChange={(value) => updateConfig(category as keyof MaturityWeights, value[0])}
                max={50}
                min={5}
                step={5}
                className="w-full"
              />
              <div className="text-xs text-gray-500">
                Weight: {weight}% - {category === 'analytics' ? 'Data collection and measurement capabilities' :
                        category === 'personalization' ? 'Content and experience customization' :
                        category === 'testing' ? 'A/B testing and experimentation processes' :
                        'Conversion rate and performance optimization'}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t">
            <div className="text-sm text-gray-600">
              Total: {Object.values(config.maturityWeights).reduce((a, b) => a + b, 0)}%
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}