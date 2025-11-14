/**
 * Trend Chart Component
 * Shows engagement and performance trends over time
 */

'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface TrendChartProps {
  data: Array<{
    date: string;
    [key: string]: any;
  }>;
  dataKeys: Array<{
    key: string;
    name: string;
    color: string;
  }>;
  height?: number;
  className?: string;
}

export function TrendChart({ data, dataKeys, height = 300, className = '' }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-${height / 4} bg-gray-50 rounded-lg ${className}`}>
        <p className="text-gray-500">No trend data available</p>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <YAxis />
          <Tooltip
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
            formatter={(value: any, name: string) => [value, name]}
          />
          {dataKeys.map((dataKey, index) => (
            <Area
              key={index}
              type="monotone"
              dataKey={dataKey.key}
              stackId={1}
              stroke={dataKey.color}
              fill={dataKey.color}
              fillOpacity={0.3}
              name={dataKey.name}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}