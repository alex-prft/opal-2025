/**
 * HeatMap Component
 * Visualizes user interaction data and click patterns
 */

'use client';

import React from 'react';

export interface HeatMapPoint {
  x: number;
  y: number;
  intensity: number;
}

export interface HeatMapProps {
  data: HeatMapPoint[];
  width?: number;
  height?: number;
  className?: string;
}

export function HeatMap({ data, width = 600, height = 400, className = '' }: HeatMapProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`} style={{ width, height }}>
        <p className="text-gray-500">No interaction data available</p>
      </div>
    );
  }

  const maxIntensity = Math.max(...data.map(point => point.intensity));

  return (
    <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`} style={{ width, height }}>
      {/* Base layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100" />

      {/* Heat points */}
      {data.map((point, index) => {
        const normalizedIntensity = point.intensity / maxIntensity;
        const size = Math.max(20, normalizedIntensity * 60);
        const opacity = Math.max(0.3, normalizedIntensity);

        return (
          <div
            key={index}
            className="absolute rounded-full"
            style={{
              left: `${(point.x / width) * 100}%`,
              top: `${(point.y / height) * 100}%`,
              width: size,
              height: size,
              backgroundColor: `rgba(239, 68, 68, ${opacity})`,
              transform: 'translate(-50%, -50%)',
              filter: 'blur(8px)',
              zIndex: Math.floor(normalizedIntensity * 10)
            }}
            title={`Intensity: ${point.intensity}`}
          />
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 rounded-lg p-3 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-200 rounded-full" />
          <span>Low</span>
          <div className="w-3 h-3 bg-red-400 rounded-full" />
          <span>Medium</span>
          <div className="w-3 h-3 bg-red-600 rounded-full" />
          <span>High</span>
        </div>
      </div>
    </div>
  );
}