'use client';

import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

const presetRanges = [
  {
    label: 'Last 7 days',
    value: 'last_7_days',
    getDates: () => ({
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      to: new Date()
    })
  },
  {
    label: 'Last 30 days',
    value: 'last_30_days',
    getDates: () => ({
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date()
    })
  },
  {
    label: 'Last 90 days',
    value: 'last_90_days',
    getDates: () => ({
      from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      to: new Date()
    })
  },
  {
    label: 'Last 6 months',
    value: 'last_6_months',
    getDates: () => ({
      from: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      to: new Date()
    })
  },
  {
    label: 'Last 12 months',
    value: 'last_12_months',
    getDates: () => ({
      from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      to: new Date()
    })
  }
];

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [showCustom, setShowCustom] = useState(false);

  const handlePresetChange = (value: string) => {
    if (value === 'custom') {
      setShowCustom(true);
      return;
    }

    const preset = presetRanges.find(p => p.value === value);
    if (preset) {
      onDateRangeChange(preset.getDates());
      setShowCustom(false);
    }
  };

  const getCurrentPreset = () => {
    const current = presetRanges.find(preset => {
      const dates = preset.getDates();
      const diffFrom = Math.abs(dateRange.from.getTime() - dates.from.getTime());
      const diffTo = Math.abs(dateRange.to.getTime() - dates.to.getTime());
      return diffFrom < 24 * 60 * 60 * 1000 && diffTo < 24 * 60 * 60 * 1000; // Within 1 day
    });

    return current?.value || 'custom';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-gray-500" />

      <Select value={getCurrentPreset()} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-48">
          <SelectValue>
            {getCurrentPreset() === 'custom'
              ? `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`
              : presetRanges.find(p => p.value === getCurrentPreset())?.label
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {presetRanges.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      {showCustom && (
        <Card className="absolute top-12 right-0 z-50 w-80">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <input
                type="date"
                value={dateRange.from.toISOString().split('T')[0]}
                onChange={(e) => onDateRangeChange({
                  ...dateRange,
                  from: new Date(e.target.value)
                })}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <input
                type="date"
                value={dateRange.to.toISOString().split('T')[0]}
                onChange={(e) => onDateRangeChange({
                  ...dateRange,
                  to: new Date(e.target.value)
                })}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCustom(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => setShowCustom(false)}>
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}