/**
 * Specialized Charts for OPAL Dashboard
 * Domain-specific visualizations for analytics insights
 */

import React, { useState, useEffect } from 'react';

// Funnel Chart Component
export interface FunnelStage {
  name: string;
  value: number;
  percentage: number;
  dropOff?: number;
  color?: string;
}

export interface FunnelChartProps {
  stages: FunnelStage[];
  height?: number;
  showPercentages?: boolean;
  showValues?: boolean;
  animated?: boolean;
  colorScheme?: 'blue' | 'green' | 'purple' | 'gradient';
}

export const InteractiveFunnelChart: React.FC<FunnelChartProps> = ({
  stages,
  height = 400,
  showPercentages = true,
  showValues = true,
  animated = true,
  colorScheme = 'blue'
}) => {
  const [animatedStages, setAnimatedStages] = useState(stages.map(s => ({ ...s, value: 0 })));
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedStages(stages);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setAnimatedStages(stages);
    }
  }, [stages, animated]);

  const maxValue = Math.max(...stages.map(s => s.value));
  const width = 400;
  const stageHeight = height / stages.length;

  const getColor = (index: number, isHovered: boolean) => {
    const schemes = {
      blue: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6'],
      green: ['#ECFDF5', '#D1FAE5', '#A7F3D0', '#6EE7B7', '#34D399', '#10B981'],
      purple: ['#F5F3FF', '#EDE9FE', '#DDD6FE', '#C4B5FD', '#A78BFA', '#8B5CF6'],
      gradient: [`hsl(${220 + index * 30}, 70%, ${90 - index * 10}%)`, `hsl(${220 + index * 30}, 70%, ${70 - index * 8}%)`]
    };

    if (stages[index].color) return stages[index].color;

    const colors = schemes[colorScheme];
    if (colorScheme === 'gradient') {
      return isHovered ? colors[1] : colors[0];
    }

    const colorIndex = Math.min(index, colors.length - 1);
    return isHovered ? colors[Math.min(colorIndex + 1, colors.length - 1)] : colors[colorIndex];
  };

  return (
    <div className="relative">
      <svg width={width} height={height} className="overflow-visible">
        {animatedStages.map((stage, index) => {
          const stageWidth = (stage.value / maxValue) * (width - 100);
          const y = index * stageHeight;
          const isHovered = hoveredStage === index;

          // Funnel shape points
          const topWidth = index === 0 ? stageWidth : (animatedStages[index - 1].value / maxValue) * (width - 100);
          const bottomWidth = stageWidth;

          const points = [
            [50, y + 5], // Top left
            [50 + topWidth, y + 5], // Top right
            [50 + bottomWidth, y + stageHeight - 5], // Bottom right
            [50, y + stageHeight - 5] // Bottom left
          ];

          return (
            <g key={index}>
              {/* Funnel segment */}
              <polygon
                points={points.map(p => p.join(',')).join(' ')}
                fill={getColor(index, isHovered)}
                stroke="#fff"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-300"
                onMouseEnter={() => setHoveredStage(index)}
                onMouseLeave={() => setHoveredStage(null)}
              />

              {/* Stage label */}
              <text
                x={25}
                y={y + stageHeight / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="12"
                fontWeight="600"
                fill="#374151"
              >
                {stage.name}
              </text>

              {/* Value and percentage */}
              <text
                x={50 + bottomWidth / 2}
                y={y + stageHeight / 2 - 5}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="14"
                fontWeight="bold"
                fill="#1F2937"
              >
                {showValues && stage.value.toLocaleString()}
              </text>

              {showPercentages && (
                <text
                  x={50 + bottomWidth / 2}
                  y={y + stageHeight / 2 + 12}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fill="#6B7280"
                >
                  {stage.percentage.toFixed(1)}%
                </text>
              )}

              {/* Drop-off indicator */}
              {stage.dropOff && stage.dropOff > 0 && index < animatedStages.length - 1 && (
                <g>
                  <line
                    x1={50 + bottomWidth + 10}
                    y1={y + stageHeight / 2}
                    x2={50 + bottomWidth + 30}
                    y2={y + stageHeight / 2}
                    stroke="#EF4444"
                    strokeWidth="2"
                    markerEnd="url(#dropoff-arrow)"
                  />
                  <text
                    x={50 + bottomWidth + 35}
                    y={y + stageHeight / 2}
                    dominantBaseline="middle"
                    fontSize="10"
                    fill="#EF4444"
                    fontWeight="600"
                  >
                    -{stage.dropOff}%
                  </text>
                </g>
              )}

              {/* Hover tooltip */}
              {isHovered && (
                <g>
                  <rect
                    x={50 + bottomWidth + 50}
                    y={y + 10}
                    width="140"
                    height="50"
                    rx="6"
                    fill="black"
                    fillOpacity="0.9"
                  />
                  <text
                    x={50 + bottomWidth + 60}
                    y={y + 25}
                    fontSize="11"
                    fontWeight="bold"
                    fill="white"
                  >
                    {stage.name}
                  </text>
                  <text
                    x={50 + bottomWidth + 60}
                    y={y + 40}
                    fontSize="10"
                    fill="#E5E7EB"
                  >
                    {stage.value.toLocaleString()} visitors ({stage.percentage.toFixed(1)}%)
                  </text>
                  {stage.dropOff && (
                    <text
                      x={50 + bottomWidth + 60}
                      y={y + 52}
                      fontSize="10"
                      fill="#FCA5A5"
                    >
                      Drop-off: {stage.dropOff}%
                    </text>
                  )}
                </g>
              )}
            </g>
          );
        })}

        {/* Arrow marker for drop-off */}
        <defs>
          <marker
            id="dropoff-arrow"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto"
          >
            <path
              d="M 0 0 L 10 5 L 0 10 z"
              fill="#EF4444"
            />
          </marker>
        </defs>
      </svg>
    </div>
  );
};

// Network/Dependency Graph Component
export interface NetworkNode {
  id: string;
  label: string;
  size?: number;
  color?: string;
  group?: string;
  x?: number;
  y?: number;
  metadata?: any;
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight?: number;
  label?: string;
  color?: string;
}

export interface NetworkGraphProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  width?: number;
  height?: number;
  onNodeClick?: (node: NetworkNode) => void;
  showLabels?: boolean;
  animated?: boolean;
}

export const InteractiveNetworkGraph: React.FC<NetworkGraphProps> = ({
  nodes,
  edges,
  width = 500,
  height = 400,
  onNodeClick,
  showLabels = true,
  animated = true
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Simple force-directed layout simulation
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(
    new Map(nodes.map(node => [
      node.id,
      {
        x: node.x || Math.random() * (width - 100) + 50,
        y: node.y || Math.random() * (height - 100) + 50
      }
    ]))
  );

  useEffect(() => {
    if (!animated) return;

    let animationFrame: number;
    const simulate = () => {
      setNodePositions(prev => {
        const newPositions = new Map(prev);

        // Simple repulsion and attraction forces
        nodes.forEach(node => {
          const pos = newPositions.get(node.id)!;
          let fx = 0, fy = 0;

          // Repulsion from other nodes
          nodes.forEach(otherNode => {
            if (node.id === otherNode.id) return;
            const otherPos = newPositions.get(otherNode.id)!;
            const dx = pos.x - otherPos.x;
            const dy = pos.y - otherPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 1000 / (distance * distance);
            fx += (dx / distance) * force;
            fy += (dy / distance) * force;
          });

          // Attraction to connected nodes
          edges.forEach(edge => {
            if (edge.source === node.id || edge.target === node.id) {
              const targetId = edge.source === node.id ? edge.target : edge.source;
              const targetPos = newPositions.get(targetId);
              if (targetPos) {
                const dx = targetPos.x - pos.x;
                const dy = targetPos.y - pos.y;
                const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = distance * 0.01;
                fx += (dx / distance) * force;
                fy += (dy / distance) * force;
              }
            }
          });

          // Center attraction
          const centerX = width / 2;
          const centerY = height / 2;
          fx += (centerX - pos.x) * 0.001;
          fy += (centerY - pos.y) * 0.001;

          // Boundary constraints
          const newX = Math.max(30, Math.min(width - 30, pos.x + fx * 0.1));
          const newY = Math.max(30, Math.min(height - 30, pos.y + fy * 0.1));

          newPositions.set(node.id, { x: newX, y: newY });
        });

        return newPositions;
      });

      animationFrame = requestAnimationFrame(simulate);
    };

    // Run simulation for a short time
    const timeout = setTimeout(() => {
      cancelAnimationFrame(animationFrame);
    }, 3000);

    simulate();

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animationFrame);
    };
  }, [nodes, edges, width, height, animated]);

  const getNodeSize = (node: NetworkNode) => {
    const isHovered = hoveredNode === node.id;
    const isSelected = selectedNode === node.id;
    const baseSize = node.size || 8;
    return baseSize * (isHovered || isSelected ? 1.5 : 1);
  };

  const getNodeColor = (node: NetworkNode) => {
    if (selectedNode === node.id) return '#EF4444';
    if (hoveredNode === node.id) return '#F59E0B';
    return node.color || '#3B82F6';
  };

  return (
    <div className="relative border border-gray-200 rounded-lg bg-gray-50">
      <svg width={width} height={height} className="overflow-visible">
        {/* Edges */}
        {edges.map((edge, index) => {
          const sourcePos = nodePositions.get(edge.source);
          const targetPos = nodePositions.get(edge.target);

          if (!sourcePos || !targetPos) return null;

          const isHighlighted = selectedNode === edge.source || selectedNode === edge.target;

          return (
            <g key={`edge-${index}`}>
              <line
                x1={sourcePos.x}
                y1={sourcePos.y}
                x2={targetPos.x}
                y2={targetPos.y}
                stroke={edge.color || (isHighlighted ? '#F59E0B' : '#9CA3AF')}
                strokeWidth={edge.weight || (isHighlighted ? 3 : 1)}
                strokeOpacity={isHighlighted ? 1 : 0.6}
                className="transition-all duration-200"
              />

              {/* Edge label */}
              {edge.label && (
                <text
                  x={(sourcePos.x + targetPos.x) / 2}
                  y={(sourcePos.y + targetPos.y) / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="8"
                  fill="#6B7280"
                  className="pointer-events-none"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const pos = nodePositions.get(node.id);
          if (!pos) return null;

          const nodeSize = getNodeSize(node);
          const nodeColor = getNodeColor(node);
          const isSelected = selectedNode === node.id;

          return (
            <g key={node.id}>
              {/* Node circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={nodeSize}
                fill={nodeColor}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => {
                  setSelectedNode(selectedNode === node.id ? null : node.id);
                  onNodeClick?.(node);
                }}
              />

              {/* Node label */}
              {showLabels && (
                <text
                  x={pos.x}
                  y={pos.y + nodeSize + 12}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="500"
                  fill="#374151"
                  className="pointer-events-none"
                >
                  {node.label}
                </text>
              )}

              {/* Selection indicator */}
              {isSelected && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeSize + 6}
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  className="animate-pulse"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Node info panel */}
      {selectedNode && (
        <div className="absolute top-4 right-4 bg-white border border-gray-200 rounded-lg p-3 shadow-lg max-w-xs">
          {(() => {
            const node = nodes.find(n => n.id === selectedNode);
            if (!node) return null;

            return (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{node.label}</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>ID: {node.id}</div>
                  {node.group && <div>Group: {node.group}</div>}
                  {node.metadata && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        Additional Info:
                      </div>
                      {Object.entries(node.metadata).map(([key, value]) => (
                        <div key={key} className="text-xs">
                          {key}: {String(value)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  Close
                </button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

// Matrix/Grid Visualization Component
export interface MatrixCell {
  row: number;
  col: number;
  value: number;
  label?: string;
  color?: string;
  metadata?: any;
}

export interface MatrixVisualizationProps {
  data: MatrixCell[];
  rows: string[];
  columns: string[];
  cellSize?: number;
  colorScheme?: 'heatmap' | 'binary' | 'category';
  showGrid?: boolean;
  onCellClick?: (cell: MatrixCell) => void;
}

export const InteractiveMatrixVisualization: React.FC<MatrixVisualizationProps> = ({
  data,
  rows,
  columns,
  cellSize = 30,
  colorScheme = 'heatmap',
  showGrid = true,
  onCellClick
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  const width = columns.length * cellSize + 120;
  const height = rows.length * cellSize + 80;

  // Color schemes
  const getColor = (cell: MatrixCell) => {
    if (cell.color) return cell.color;

    switch (colorScheme) {
      case 'binary':
        return cell.value > 0 ? '#3B82F6' : '#E5E7EB';
      case 'category':
        const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
        return colors[Math.floor(cell.value) % colors.length];
      case 'heatmap':
      default:
        const maxValue = Math.max(...data.map(d => d.value));
        const minValue = Math.min(...data.map(d => d.value));
        const intensity = maxValue === minValue ? 0.5 : (cell.value - minValue) / (maxValue - minValue);
        return `rgba(59, 130, 246, ${0.1 + intensity * 0.9})`;
    }
  };

  return (
    <div className="relative">
      <svg width={width} height={height} className="overflow-visible">
        {/* Row labels */}
        {rows.map((row, rowIndex) => (
          <text
            key={`row-${rowIndex}`}
            x={80}
            y={60 + rowIndex * cellSize + cellSize / 2}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize="11"
            fontWeight="500"
            fill="#374151"
          >
            {row}
          </text>
        ))}

        {/* Column labels */}
        {columns.map((col, colIndex) => (
          <text
            key={`col-${colIndex}`}
            x={90 + colIndex * cellSize + cellSize / 2}
            y={50}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fontWeight="500"
            fill="#374151"
            transform={`rotate(-45, ${90 + colIndex * cellSize + cellSize / 2}, 50)`}
          >
            {col}
          </text>
        ))}

        {/* Matrix cells */}
        {data.map((cell, index) => {
          const x = 90 + cell.col * cellSize;
          const y = 60 + cell.row * cellSize;
          const isHovered = hoveredCell?.row === cell.row && hoveredCell?.col === cell.col;

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={cellSize - 1}
                height={cellSize - 1}
                fill={getColor(cell)}
                stroke={showGrid ? '#E5E7EB' : 'none'}
                strokeWidth={isHovered ? 2 : 1}
                rx={2}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredCell({ row: cell.row, col: cell.col })}
                onMouseLeave={() => setHoveredCell(null)}
                onClick={() => onCellClick?.(cell)}
              />

              {/* Cell value */}
              {cellSize > 20 && (
                <text
                  x={x + cellSize / 2}
                  y={y + cellSize / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={Math.min(cellSize / 3, 10)}
                  fontWeight="bold"
                  fill={colorScheme === 'heatmap' && cell.value > 0.5 ? 'white' : '#1F2937'}
                  className="pointer-events-none"
                >
                  {cell.label || cell.value}
                </text>
              )}

              {/* Hover tooltip */}
              {isHovered && (
                <g>
                  <rect
                    x={x + cellSize + 5}
                    y={y - 10}
                    width="100"
                    height="40"
                    rx="4"
                    fill="black"
                    fillOpacity="0.9"
                  />
                  <text
                    x={x + cellSize + 10}
                    y={y + 5}
                    fontSize="10"
                    fontWeight="bold"
                    fill="white"
                  >
                    {rows[cell.row]} × {columns[cell.col]}
                  </text>
                  <text
                    x={x + cellSize + 10}
                    y={y + 18}
                    fontSize="9"
                    fill="#E5E7EB"
                  >
                    Value: {cell.value}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Grid lines */}
        {showGrid && (
          <g>
            {/* Vertical lines */}
            {columns.map((_, colIndex) => (
              <line
                key={`vline-${colIndex}`}
                x1={90 + colIndex * cellSize}
                y1={60}
                x2={90 + colIndex * cellSize}
                y2={60 + rows.length * cellSize}
                stroke="#E5E7EB"
                strokeWidth="1"
              />
            ))}
            {/* Horizontal lines */}
            {rows.map((_, rowIndex) => (
              <line
                key={`hline-${rowIndex}`}
                x1={90}
                y1={60 + rowIndex * cellSize}
                x2={90 + columns.length * cellSize}
                y2={60 + rowIndex * cellSize}
                stroke="#E5E7EB"
                strokeWidth="1"
              />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
};