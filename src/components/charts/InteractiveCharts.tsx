/**
 * Interactive Charts Library
 * Advanced visualization components for OPAL dashboard analytics
 */

import React, { useState, useRef, useEffect } from 'react';

// Enhanced Gauge Chart Component
export interface GaugeChartProps {
  value: number;
  maxValue?: number;
  title?: string;
  subtitle?: string;
  size?: 'small' | 'medium' | 'large';
  colorScheme?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  showPercentage?: boolean;
  animated?: boolean;
  thresholds?: Array<{ value: number; color: string; label?: string }>;
}

export const InteractiveGaugeChart: React.FC<GaugeChartProps> = ({
  value,
  maxValue = 100,
  title,
  subtitle,
  size = 'medium',
  colorScheme = 'blue',
  showPercentage = true,
  animated = true,
  thresholds = []
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedValue(value);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setAnimatedValue(value);
    }
  }, [value, animated]);

  const sizeConfig = {
    small: { width: 120, height: 120, strokeWidth: 8, fontSize: '14px' },
    medium: { width: 160, height: 160, strokeWidth: 12, fontSize: '16px' },
    large: { width: 200, height: 200, strokeWidth: 16, fontSize: '20px' }
  };

  const config = sizeConfig[size];
  const center = config.width / 2;
  const radius = (config.width - config.strokeWidth) / 2 - 10;

  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min((animatedValue / maxValue) * 100, 100);
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorSchemes = {
    blue: { primary: '#3B82F6', secondary: '#E5F2FF', accent: '#1E40AF' },
    green: { primary: '#10B981', secondary: '#E6FFFA', accent: '#047857' },
    orange: { primary: '#F59E0B', secondary: '#FEF3C7', accent: '#D97706' },
    red: { primary: '#EF4444', secondary: '#FEE2E2', accent: '#DC2626' },
    purple: { primary: '#8B5CF6', secondary: '#F3E8FF', accent: '#7C3AED' }
  };

  const colors = colorSchemes[colorScheme];

  // Get threshold color if applicable
  const getValueColor = () => {
    for (const threshold of thresholds.sort((a, b) => b.value - a.value)) {
      if (animatedValue >= threshold.value) {
        return threshold.color;
      }
    }
    return colors.primary;
  };

  return (
    <div
      className={`relative flex flex-col items-center transition-all duration-300 ${
        isHovered ? 'transform scale-105' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <svg
          width={config.width}
          height={config.width}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.secondary}
            strokeWidth={config.strokeWidth}
            fill="transparent"
            className="opacity-30"
          />

          {/* Threshold markers */}
          {thresholds.map((threshold, index) => {
            const thresholdPercentage = (threshold.value / maxValue) * 100;
            const thresholdOffset = circumference - (thresholdPercentage / 100) * circumference;
            return (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                stroke={threshold.color}
                strokeWidth={2}
                fill="transparent"
                strokeDasharray={`2 ${circumference - 2}`}
                strokeDashoffset={thresholdOffset}
                className="opacity-60"
              />
            );
          })}

          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={getValueColor()}
            strokeWidth={config.strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`transition-all duration-1000 ease-out ${
              isHovered ? 'filter drop-shadow-lg' : ''
            }`}
          />

          {/* Center value */}
          <text
            x={center}
            y={center - 5}
            textAnchor="middle"
            dominantBaseline="middle"
            className="font-bold"
            style={{ fontSize: config.fontSize, fill: getValueColor() }}
          >
            {showPercentage ? `${Math.round(percentage)}%` : Math.round(animatedValue)}
          </text>

          {/* Subtitle */}
          {subtitle && (
            <text
              x={center}
              y={center + 20}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs text-gray-500"
              style={{ fontSize: `${parseInt(config.fontSize) - 4}px` }}
            >
              {subtitle}
            </text>
          )}
        </svg>

        {/* Pulse animation for high values */}
        {percentage > 90 && (
          <div className="absolute inset-0 rounded-full animate-pulse bg-green-200 opacity-20"></div>
        )}
      </div>

      {title && (
        <h3 className="mt-2 text-sm font-semibold text-gray-700 text-center">
          {title}
        </h3>
      )}

      {/* Threshold labels */}
      {thresholds.length > 0 && isHovered && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          Current: {animatedValue} / {maxValue}
        </div>
      )}
    </div>
  );
};

// Enhanced Radar Chart Component
export interface RadarChartProps {
  data: Array<{
    dimension: string;
    value: number;
    maxValue?: number;
    benchmark?: number;
  }>;
  size?: number;
  animated?: boolean;
  showBenchmark?: boolean;
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange';
}

export const InteractiveRadarChart: React.FC<RadarChartProps> = ({
  data,
  size = 300,
  animated = true,
  showBenchmark = true,
  colorScheme = 'blue'
}) => {
  const [animatedData, setAnimatedData] = useState(data.map(d => ({ ...d, value: 0, benchmark: 0 })));
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedData(data);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setAnimatedData(data);
    }
  }, [data, animated]);

  const center = size / 2;
  const radius = size * 0.35;
  const numPoints = data.length;

  const colorSchemes = {
    blue: { primary: '#3B82F6', secondary: '#93C5FD', background: '#EFF6FF' },
    green: { primary: '#10B981', secondary: '#6EE7B7', background: '#ECFDF5' },
    purple: { primary: '#8B5CF6', secondary: '#C4B5FD', background: '#F5F3FF' },
    orange: { primary: '#F59E0B', secondary: '#FCD34D', background: '#FFFBEB' }
  };

  const colors = colorSchemes[colorScheme];

  const getPoint = (index: number, value: number, maxValue: number = 100) => {
    const angle = (index * 2 * Math.PI) / numPoints - Math.PI / 2;
    const normalizedValue = Math.min(value / maxValue, 1);
    const pointRadius = radius * normalizedValue;

    return {
      x: center + pointRadius * Math.cos(angle),
      y: center + pointRadius * Math.sin(angle)
    };
  };

  const getLabelPoint = (index: number) => {
    const angle = (index * 2 * Math.PI) / numPoints - Math.PI / 2;
    const labelRadius = radius * 1.2;

    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle)
    };
  };

  // Generate concentric circles for scale
  const scaleCircles = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Generate data path
  const dataPath = animatedData.map((item, index) => {
    const point = getPoint(index, item.value, item.maxValue || 100);
    return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
  }).join(' ') + ' Z';

  // Generate benchmark path
  const benchmarkPath = showBenchmark ? animatedData.map((item, index) => {
    const point = getPoint(index, item.benchmark || 0, item.maxValue || 100);
    return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
  }).join(' ') + ' Z' : '';

  return (
    <div className="relative">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background circles */}
        {scaleCircles.map((scale, index) => (
          <circle
            key={index}
            cx={center}
            cy={center}
            r={radius * scale}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="1"
            strokeDasharray={index === scaleCircles.length - 1 ? "none" : "2,2"}
          />
        ))}

        {/* Axis lines */}
        {data.map((_, index) => {
          const endPoint = getPoint(index, 100, 100);
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={endPoint.x}
              y2={endPoint.y}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          );
        })}

        {/* Benchmark area */}
        {showBenchmark && benchmarkPath && (
          <path
            d={benchmarkPath}
            fill={colors.secondary}
            fillOpacity="0.2"
            stroke={colors.secondary}
            strokeWidth="2"
            strokeDasharray="4,4"
          />
        )}

        {/* Data area */}
        <path
          d={dataPath}
          fill={colors.primary}
          fillOpacity="0.2"
          stroke={colors.primary}
          strokeWidth="3"
          className={`transition-all duration-1000 ${animated ? 'animate-pulse' : ''}`}
        />

        {/* Data points */}
        {animatedData.map((item, index) => {
          const point = getPoint(index, item.value, item.maxValue || 100);
          const isHovered = hoveredPoint === index;

          return (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r={isHovered ? 8 : 6}
                fill={colors.primary}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredPoint(index)}
                onMouseLeave={() => setHoveredPoint(null)}
              />

              {/* Hover tooltip */}
              {isHovered && (
                <g>
                  <rect
                    x={point.x - 25}
                    y={point.y - 35}
                    width="50"
                    height="20"
                    rx="4"
                    fill="black"
                    fillOpacity="0.8"
                  />
                  <text
                    x={point.x}
                    y={point.y - 22}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {item.value}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Dimension labels */}
        {data.map((item, index) => {
          const labelPoint = getLabelPoint(index);
          const angle = (index * 2 * Math.PI) / numPoints - Math.PI / 2;
          const isRightSide = Math.cos(angle) > 0;

          return (
            <text
              key={index}
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor={isRightSide ? 'start' : 'end'}
              dominantBaseline="middle"
              fontSize="12"
              fontWeight="600"
              fill="#374151"
              className="pointer-events-none"
            >
              {item.dimension}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex justify-center mt-4 space-x-6 text-xs">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: colors.primary }}></div>
          <span>Current Score</span>
        </div>
        {showBenchmark && (
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full border-2 border-dashed`} style={{ borderColor: colors.secondary }}></div>
            <span>Benchmark</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Interactive Heatmap Component
export interface HeatmapProps {
  data: Array<Array<{ value: number; label?: string; metadata?: any }>>;
  xLabels: string[];
  yLabels: string[];
  colorScheme?: 'blue' | 'green' | 'red' | 'purple' | 'rainbow';
  cellSize?: number;
  showValues?: boolean;
  onCellClick?: (x: number, y: number, data: any) => void;
}

export const InteractiveHeatmap: React.FC<HeatmapProps> = ({
  data,
  xLabels,
  yLabels,
  colorScheme = 'blue',
  cellSize = 40,
  showValues = true,
  onCellClick
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

  // Find min and max values for normalization
  const allValues = data.flat().map(cell => cell.value);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  const getColorIntensity = (value: number) => {
    if (maxValue === minValue) return 0.5;
    return (value - minValue) / (maxValue - minValue);
  };

  const getColor = (intensity: number) => {
    const schemes = {
      blue: {
        light: 'rgba(59, 130, 246, 0.1)',
        dark: 'rgba(59, 130, 246, 1)'
      },
      green: {
        light: 'rgba(16, 185, 129, 0.1)',
        dark: 'rgba(16, 185, 129, 1)'
      },
      red: {
        light: 'rgba(239, 68, 68, 0.1)',
        dark: 'rgba(239, 68, 68, 1)'
      },
      purple: {
        light: 'rgba(139, 92, 246, 0.1)',
        dark: 'rgba(139, 92, 246, 1)'
      },
      rainbow: {
        light: `hsl(${120 * intensity}, 70%, 90%)`,
        dark: `hsl(${120 * intensity}, 70%, 50%)`
      }
    };

    const scheme = schemes[colorScheme];
    if (colorScheme === 'rainbow') {
      return `hsl(${240 - 120 * intensity}, 70%, ${90 - 40 * intensity}%)`;
    }

    // Linear interpolation between light and dark
    const r1 = parseInt(scheme.light.match(/\\d+/g)?.[0] || '0');
    const g1 = parseInt(scheme.light.match(/\\d+/g)?.[1] || '0');
    const b1 = parseInt(scheme.light.match(/\\d+/g)?.[2] || '0');
    const a1 = parseFloat(scheme.light.match(/[0-9.]+\\)$/)?.[0]?.replace(')', '') || '0.1');

    const r2 = parseInt(scheme.dark.match(/\\d+/g)?.[0] || '0');
    const g2 = parseInt(scheme.dark.match(/\\d+/g)?.[1] || '0');
    const b2 = parseInt(scheme.dark.match(/\\d+/g)?.[2] || '0');

    const r = Math.round(r1 + (r2 - r1) * intensity);
    const g = Math.round(g1 + (g2 - g1) * intensity);
    const b = Math.round(b1 + (b2 - b1) * intensity);
    const a = a1 + (1 - a1) * intensity;

    return `rgba(${r}, ${g}, ${b}, ${a})`;
  };

  const width = xLabels.length * cellSize + 60; // Extra space for labels
  const height = yLabels.length * cellSize + 60; // Extra space for labels

  return (
    <div className="relative">
      <svg width={width} height={height} className="overflow-visible">
        {/* Y-axis labels */}
        {yLabels.map((label, yIndex) => (
          <text
            key={`y-${yIndex}`}
            x={50}
            y={60 + yIndex * cellSize + cellSize / 2}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="500"
            fill="#374151"
          >
            {label}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map((label, xIndex) => (
          <text
            key={`x-${xIndex}`}
            x={60 + xIndex * cellSize + cellSize / 2}
            y={45}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="500"
            fill="#374151"
            transform={`rotate(-45, ${60 + xIndex * cellSize + cellSize / 2}, 45)`}
          >
            {label}
          </text>
        ))}

        {/* Heatmap cells */}
        {data.map((row, yIndex) =>
          row.map((cell, xIndex) => {
            const intensity = getColorIntensity(cell.value);
            const color = getColor(intensity);
            const isHovered = hoveredCell?.x === xIndex && hoveredCell?.y === yIndex;

            return (
              <g key={`cell-${xIndex}-${yIndex}`}>
                <rect
                  x={60 + xIndex * cellSize}
                  y={60 + yIndex * cellSize}
                  width={cellSize - 1}
                  height={cellSize - 1}
                  fill={color}
                  stroke={isHovered ? '#1F2937' : '#E5E7EB'}
                  strokeWidth={isHovered ? 2 : 1}
                  rx={2}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredCell({ x: xIndex, y: yIndex })}
                  onMouseLeave={() => setHoveredCell(null)}
                  onClick={() => onCellClick?.(xIndex, yIndex, cell)}
                />

                {/* Cell values */}
                {showValues && (
                  <text
                    x={60 + xIndex * cellSize + cellSize / 2}
                    y={60 + yIndex * cellSize + cellSize / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill={intensity > 0.5 ? 'white' : '#1F2937'}
                    className="pointer-events-none"
                  >
                    {cell.value}
                  </text>
                )}

                {/* Hover tooltip */}
                {isHovered && cell.label && (
                  <g>
                    <rect
                      x={60 + xIndex * cellSize + cellSize / 2 - 30}
                      y={60 + yIndex * cellSize - 25}
                      width="60"
                      height="18"
                      rx="4"
                      fill="black"
                      fillOpacity="0.8"
                    />
                    <text
                      x={60 + xIndex * cellSize + cellSize / 2}
                      y={60 + yIndex * cellSize - 13}
                      textAnchor="middle"
                      fill="white"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {cell.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })
        )}
      </svg>

      {/* Color legend */}
      <div className="flex items-center justify-center mt-4 space-x-4 text-xs">
        <span className="text-gray-500">Low</span>
        <div className="flex space-x-1">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className="w-4 h-4 border border-gray-200"
              style={{ backgroundColor: getColor(i / 9) }}
            />
          ))}
        </div>
        <span className="text-gray-500">High</span>
        <span className="ml-4 text-gray-600">
          Range: {minValue} - {maxValue}
        </span>
      </div>
    </div>
  );
};

// Interactive Timeline/Gantt Chart Component
export interface TimelineItem {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  progress?: number;
  status?: 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'at_risk';
  dependencies?: string[];
  assignee?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface GanttChartProps {
  items: TimelineItem[];
  startDate?: string;
  endDate?: string;
  onItemClick?: (item: TimelineItem) => void;
  showDependencies?: boolean;
  compactMode?: boolean;
}

export const InteractiveGanttChart: React.FC<GanttChartProps> = ({
  items,
  startDate,
  endDate,
  onItemClick,
  showDependencies = true,
  compactMode = false
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // Calculate date range
  const allDates = items.flatMap(item => [item.startDate, item.endDate]);
  const minDate = new Date(startDate || Math.min(...allDates.map(d => new Date(d).getTime())));
  const maxDate = new Date(endDate || Math.max(...allDates.map(d => new Date(d).getTime())));

  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  const dayWidth = compactMode ? 4 : 6;
  const itemHeight = compactMode ? 25 : 35;
  const chartWidth = Math.max(totalDays * dayWidth, 400);
  const chartHeight = items.length * (itemHeight + 5) + 100;

  const getDatePosition = (date: string) => {
    const dateObj = new Date(date);
    const daysDiff = Math.ceil((dateObj.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysDiff * dayWidth);
  };

  const getItemWidth = (item: TimelineItem) => {
    const startPos = getDatePosition(item.startDate);
    const endPos = getDatePosition(item.endDate);
    return Math.max(endPos - startPos, dayWidth);
  };

  const statusColors = {
    not_started: { bg: '#F3F4F6', border: '#9CA3AF', text: '#374151' },
    in_progress: { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
    completed: { bg: '#D1FAE5', border: '#10B981', text: '#047857' },
    delayed: { bg: '#FEE2E2', border: '#EF4444', text: '#DC2626' },
    at_risk: { bg: '#FEF3C7', border: '#F59E0B', text: '#D97706' }
  };

  const priorityColors = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
    critical: '#7C2D12'
  };

  return (
    <div className="w-full overflow-auto bg-white rounded-lg border border-gray-200">
      <div className="min-w-max">
        <svg width={chartWidth + 200} height={chartHeight} className="overflow-visible">
          {/* Month headers */}
          <g>
            {Array.from({ length: Math.ceil(totalDays / 30) }, (_, monthIndex) => {
              const monthStart = new Date(minDate);
              monthStart.setMonth(monthStart.getMonth() + monthIndex);
              const monthPosition = getDatePosition(monthStart.toISOString());

              return (
                <g key={monthIndex}>
                  <rect
                    x={monthPosition}
                    y={0}
                    width={30 * dayWidth}
                    height={30}
                    fill="#F9FAFB"
                    stroke="#E5E7EB"
                  />
                  <text
                    x={monthPosition + (30 * dayWidth) / 2}
                    y={20}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill="#374151"
                  >
                    {monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Timeline items */}
          {items.map((item, index) => {
            const yPosition = 40 + index * (itemHeight + 5);
            const xPosition = getDatePosition(item.startDate);
            const width = getItemWidth(item);
            const colors = statusColors[item.status || 'not_started'];
            const isHovered = hoveredItem === item.id;
            const isSelected = selectedItem === item.id;

            return (
              <g key={item.id}>
                {/* Task label */}
                <text
                  x={10}
                  y={yPosition + itemHeight / 2}
                  dominantBaseline="middle"
                  fontSize={compactMode ? "10" : "12"}
                  fontWeight="500"
                  fill="#374151"
                  className="max-w-32 truncate"
                >
                  {item.title}
                </text>

                {/* Priority indicator */}
                {item.priority && (
                  <rect
                    x={5}
                    y={yPosition + 2}
                    width={3}
                    height={itemHeight - 4}
                    fill={priorityColors[item.priority]}
                    rx={1}
                  />
                )}

                {/* Task bar background */}
                <rect
                  x={180 + xPosition}
                  y={yPosition}
                  width={width}
                  height={itemHeight}
                  fill={colors.bg}
                  stroke={colors.border}
                  strokeWidth={isHovered || isSelected ? 2 : 1}
                  rx={4}
                  className={`cursor-pointer transition-all duration-200 ${
                    isHovered ? 'filter drop-shadow-md' : ''
                  }`}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => {
                    setSelectedItem(selectedItem === item.id ? null : item.id);
                    onItemClick?.(item);
                  }}
                />

                {/* Progress bar */}
                {item.progress !== undefined && item.progress > 0 && (
                  <rect
                    x={180 + xPosition}
                    y={yPosition}
                    width={(width * item.progress) / 100}
                    height={itemHeight}
                    fill={colors.border}
                    opacity={0.7}
                    rx={4}
                  />
                )}

                {/* Progress text */}
                {item.progress !== undefined && width > 40 && (
                  <text
                    x={180 + xPosition + width / 2}
                    y={yPosition + itemHeight / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill={colors.text}
                  >
                    {item.progress}%
                  </text>
                )}

                {/* Hover tooltip */}
                {isHovered && (
                  <g>
                    <rect
                      x={180 + xPosition + width + 10}
                      y={yPosition - 10}
                      width="200"
                      height="60"
                      rx="6"
                      fill="black"
                      fillOpacity="0.9"
                    />
                    <text
                      x={180 + xPosition + width + 20}
                      y={yPosition + 5}
                      fontSize="11"
                      fontWeight="bold"
                      fill="white"
                    >
                      {item.title}
                    </text>
                    <text
                      x={180 + xPosition + width + 20}
                      y={yPosition + 20}
                      fontSize="10"
                      fill="#E5E7EB"
                    >
                      {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                    </text>
                    <text
                      x={180 + xPosition + width + 20}
                      y={yPosition + 35}
                      fontSize="10"
                      fill="#E5E7EB"
                    >
                      Status: {item.status?.replace('_', ' ') || 'Not started'}
                      {item.progress !== undefined && ` (${item.progress}%)`}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Dependencies */}
          {showDependencies && items.map((item, index) => {
            if (!item.dependencies) return null;

            return item.dependencies.map(depId => {
              const depItem = items.find(i => i.id === depId);
              if (!depItem) return null;

              const depIndex = items.findIndex(i => i.id === depId);
              const startY = 40 + depIndex * (itemHeight + 5) + itemHeight / 2;
              const endY = 40 + index * (itemHeight + 5) + itemHeight / 2;
              const startX = 180 + getDatePosition(depItem.endDate) + getItemWidth(depItem);
              const endX = 180 + getDatePosition(item.startDate);

              return (
                <g key={`${item.id}-${depId}`}>
                  <defs>
                    <marker
                      id={`arrowhead-${item.id}-${depId}`}
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#6B7280"
                      />
                    </marker>
                  </defs>
                  <path
                    d={`M ${startX} ${startY} Q ${startX + 20} ${startY} ${startX + 20} ${(startY + endY) / 2} Q ${endX - 20} ${(startY + endY) / 2} ${endX} ${endY}`}
                    stroke="#6B7280"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="4,4"
                    markerEnd={`url(#arrowhead-${item.id}-${depId})`}
                    opacity="0.6"
                  />
                </g>
              );
            });
          })}

          {/* Today line */}
          <line
            x1={180 + getDatePosition(new Date().toISOString())}
            y1={30}
            x2={180 + getDatePosition(new Date().toISOString())}
            y2={chartHeight - 10}
            stroke="#EF4444"
            strokeWidth="2"
            strokeDasharray="4,4"
          />
        </svg>
      </div>

      {/* Legend */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-200 border border-blue-400 rounded"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-200 border border-green-400 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-200 border border-red-400 rounded"></div>
            <span>Delayed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-200 border border-yellow-400 rounded"></div>
            <span>At Risk</span>
          </div>
          <div className="flex items-center space-x-2 ml-6">
            <div className="w-1 h-4 bg-red-500"></div>
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
};