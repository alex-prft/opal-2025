# Quick Wins Page Template & Guidelines

## Overview

The Quick Wins page (`/engine/results/strategy-plans/quick-wins`) is designed to display immediate optimization opportunities with impact analysis, implementation roadmaps, and success metrics.

## Page Requirements

Based on your specifications, the page should show:
1. **Top 3 Quick Wins**
2. **Impact vs Effort Matrix**
3. **Quick Wins Implementation Details & Next Steps**
   - Immediate Actions (Next 2 weeks)
   - Success Metrics & KPIs

## Architecture Overview

The page follows the established 3-tier routing pattern:
- **Tier 1**: Strategy Plans (`strategy-plans`)
- **Tier 2**: Quick Wins (`quick-wins`)
- **Tier 3**: Specific analysis areas (5 subcategories available)

### Available Tier 3 Routes

From the OPAL mapping, Quick Wins has these tier3 subcategories:
1. **Immediate Opportunities** (`/immediate-opportunities`)
2. **Implementation Roadmap (30-day)** (`/implementation-roadmap-(30-day)`)
3. **Resource Requirements** (`/resource-requirements`)
4. **Expected Impact** (`/expected-impact`)
5. **Success Metrics** (`/success-metrics`)

## Component Structure

### 1. Page Template (Tier 2 Level)

```typescript
// src/app/engine/results/strategy-plans/quick-wins/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Target, Clock, Users, DollarSign, BarChart3 } from 'lucide-react';
import { ContentRenderer } from '@/components/opal/ContentRenderer';
import { WidgetRenderer } from '@/components/widgets/WidgetRenderer';

// Import layout components
import ResultsSidebar from '@/components/ResultsSidebar';
import ServiceStatusFooter from '@/components/ServiceStatusFooter';
import { ServiceStatusProvider } from '@/components/ServiceStatusProvider';
import BreadcrumbSearchHeader from '@/components/shared/BreadcrumbSearchHeader';
import MegaMenuDropdown from '@/components/shared/MegaMenuDropdown';
import Tier2SubNavigation from '@/components/shared/Tier2SubNavigation';

export default function QuickWinsPage() {
  return (
    <ServiceStatusProvider>
      <QuickWinsPageContent />
    </ServiceStatusProvider>
  );
}

function QuickWinsPageContent() {
  // Page implementation here
  // ... (follows established tier2 page pattern)
}
```

### 2. Quick Wins Widget Component

```typescript
// src/components/widgets/QuickWinsWidget.tsx
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, Clock, Users, DollarSign, BarChart3 } from 'lucide-react';

interface QuickWin {
  id: string;
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  effort: 'Low' | 'Medium' | 'High';
  timeline: string;
  confidence: number;
  expectedROI?: string;
  resources?: string[];
  dependencies?: string[];
  successMetrics?: string[];
}

interface ImpactEffortMatrix {
  highImpactLowEffort: QuickWin[];
  highImpactMediumEffort: QuickWin[];
  mediumImpactLowEffort: QuickWin[];
  // ... other quadrants
}

interface QuickWinsData {
  topQuickWins: QuickWin[];
  impactEffortMatrix: ImpactEffortMatrix;
  immediateActions: Array<{
    action: string;
    owner: string;
    deadline: string;
    status: 'pending' | 'in-progress' | 'completed';
  }>;
  successKPIs: Array<{
    metric: string;
    current: string;
    target: string;
    timeframe: string;
  }>;
}

interface QuickWinsWidgetProps {
  data: QuickWinsData;
  className?: string;
}

export function QuickWinsWidget({ data, className = '' }: QuickWinsWidgetProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top 3 Quick Wins Section */}
      <TopQuickWinsSection quickWins={data.topQuickWins} />

      {/* Impact vs Effort Matrix Section */}
      <ImpactEffortMatrixSection matrix={data.impactEffortMatrix} />

      {/* Implementation Details Section */}
      <ImplementationDetailsSection
        immediateActions={data.immediateActions}
        successKPIs={data.successKPIs}
      />
    </div>
  );
}
```

### 3. Top Quick Wins Component

```typescript
function TopQuickWinsSection({ quickWins }: { quickWins: QuickWin[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Top 3 Quick Wins
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {quickWins.slice(0, 3).map((win, index) => (
            <div
              key={win.id}
              className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                {index + 1}
              </div>

              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">{win.title}</h4>
                <p className="text-gray-600 text-sm mb-3">{win.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-gray-500" />
                    <span>Impact: </span>
                    <Badge variant={getImpactVariant(win.impact)}>{win.impact}</Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>Effort: </span>
                    <Badge variant={getEffortVariant(win.effort)}>{win.effort}</Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{win.timeline}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-gray-500" />
                    <span>Confidence: {win.confidence}%</span>
                  </div>
                </div>

                {win.expectedROI && (
                  <div className="mt-3 p-2 bg-green-100 rounded text-sm">
                    <DollarSign className="h-4 w-4 inline text-green-600" />
                    <span className="font-medium text-green-800">Expected ROI: {win.expectedROI}</span>
                  </div>
                )}
              </div>

              <Button variant="outline" size="sm">
                View Details
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 4. Impact vs Effort Matrix Component

```typescript
function ImpactEffortMatrixSection({ matrix }: { matrix: ImpactEffortMatrix }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Impact vs Effort Matrix
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 h-96">
          {/* High Impact Row */}
          <div className="col-span-3 grid grid-cols-3 gap-4 h-32">
            <MatrixQuadrant
              title="High Impact, Low Effort"
              subtitle="Quick Wins"
              items={matrix.highImpactLowEffort}
              color="green"
              priority="high"
            />
            <MatrixQuadrant
              title="High Impact, Medium Effort"
              subtitle="Major Projects"
              items={matrix.highImpactMediumEffort}
              color="blue"
              priority="medium"
            />
            <MatrixQuadrant
              title="High Impact, High Effort"
              subtitle="Strategic Initiatives"
              items={matrix.highImpactHighEffort}
              color="purple"
              priority="low"
            />
          </div>

          {/* Medium/Low Impact Rows */}
          {/* ... similar structure for other quadrants */}
        </div>
      </CardContent>
    </Card>
  );
}

function MatrixQuadrant({
  title,
  subtitle,
  items,
  color,
  priority
}: {
  title: string;
  subtitle: string;
  items: QuickWin[];
  color: 'green' | 'blue' | 'purple' | 'yellow' | 'gray';
  priority: 'high' | 'medium' | 'low';
}) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    gray: 'bg-gray-50 border-gray-200'
  };

  return (
    <div className={`p-3 rounded-lg border-2 ${colorClasses[color]} relative`}>
      <div className="mb-2">
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-xs text-gray-600">{subtitle}</p>
      </div>

      <div className="space-y-1">
        {items.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="text-xs p-1 bg-white rounded border cursor-pointer hover:shadow-sm"
            title={item.description}
          >
            {item.title}
          </div>
        ))}

        {items.length > 3 && (
          <div className="text-xs text-gray-500">
            +{items.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}
```

### 5. Implementation Details Component

```typescript
function ImplementationDetailsSection({
  immediateActions,
  successKPIs
}: {
  immediateActions: Array<{
    action: string;
    owner: string;
    deadline: string;
    status: 'pending' | 'in-progress' | 'completed';
  }>;
  successKPIs: Array<{
    metric: string;
    current: string;
    target: string;
    timeframe: string;
  }>;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Immediate Actions (Next 2 weeks) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Immediate Actions (Next 2 weeks)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {immediateActions.map((action, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-3 h-3 rounded-full mt-1 ${
                  action.status === 'completed' ? 'bg-green-500' :
                  action.status === 'in-progress' ? 'bg-yellow-500' : 'bg-gray-400'
                }`} />

                <div className="flex-1">
                  <p className="font-medium text-gray-900">{action.action}</p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span>Owner: {action.owner}</span>
                    <span>Due: {action.deadline}</span>
                  </div>
                </div>

                <Badge variant={
                  action.status === 'completed' ? 'success' :
                  action.status === 'in-progress' ? 'warning' : 'secondary'
                }>
                  {action.status.replace('-', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Success Metrics & KPIs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            Success Metrics & KPIs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {successKPIs.map((kpi, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{kpi.metric}</h4>
                  <span className="text-sm text-gray-500">{kpi.timeframe}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Current: </span>
                    <span className="font-medium">{kpi.current}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Target: </span>
                    <span className="font-medium text-green-600">{kpi.target}</span>
                  </div>
                </div>

                {/* Progress bar if numeric values */}
                {isNumeric(kpi.current) && isNumeric(kpi.target) && (
                  <div className="mt-2">
                    <Progress
                      value={calculateProgress(kpi.current, kpi.target)}
                      className="h-2"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## TypeScript Interfaces

```typescript
// src/lib/types/quick-wins.ts

export interface QuickWin {
  id: string;
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  effort: 'Low' | 'Medium' | 'High';
  timeline: string;
  confidence: number; // 0-100
  expectedROI?: string;
  resources?: string[];
  dependencies?: string[];
  successMetrics?: string[];
  category?: string;
  priority?: number;
}

export interface ImpactEffortMatrix {
  highImpactLowEffort: QuickWin[];
  highImpactMediumEffort: QuickWin[];
  highImpactHighEffort: QuickWin[];
  mediumImpactLowEffort: QuickWin[];
  mediumImpactMediumEffort: QuickWin[];
  mediumImpactHighEffort: QuickWin[];
  lowImpactLowEffort: QuickWin[];
  lowImpactMediumEffort: QuickWin[];
  lowImpactHighEffort: QuickWin[];
}

export interface ImmediateAction {
  id: string;
  action: string;
  owner: string;
  deadline: string;
  status: 'pending' | 'in-progress' | 'completed';
  description?: string;
  blockers?: string[];
}

export interface SuccessKPI {
  id: string;
  metric: string;
  current: string;
  target: string;
  timeframe: string;
  unit?: string;
  description?: string;
}

export interface QuickWinsPageData {
  topQuickWins: QuickWin[];
  impactEffortMatrix: ImpactEffortMatrix;
  immediateActions: ImmediateAction[];
  successKPIs: SuccessKPI[];
  summary?: {
    totalOpportunities: number;
    estimatedROI: string;
    implementationTimeline: string;
    confidenceScore: number;
  };
}

// OPAL API Response Types
export interface QuickWinsOPALResponse {
  quick_wins?: QuickWin[];
  impact_matrix?: ImpactEffortMatrix;
  immediate_actions?: ImmediateAction[];
  success_metrics?: SuccessKPI[];
  summary?: string;
  confidence_score?: number;
  timestamp?: string;
}
```

## Styling Guidelines

### 1. Color Palette

```css
/* Impact Colors */
.impact-high { @apply text-green-600 bg-green-50 border-green-200; }
.impact-medium { @apply text-yellow-600 bg-yellow-50 border-yellow-200; }
.impact-low { @apply text-gray-600 bg-gray-50 border-gray-200; }

/* Effort Colors */
.effort-low { @apply text-green-600 bg-green-100; }
.effort-medium { @apply text-yellow-600 bg-yellow-100; }
.effort-high { @apply text-red-600 bg-red-100; }

/* Status Colors */
.status-pending { @apply text-gray-600 bg-gray-100; }
.status-in-progress { @apply text-yellow-600 bg-yellow-100; }
.status-completed { @apply text-green-600 bg-green-100; }
```

### 2. Component Spacing

```css
/* Standard spacing for Quick Wins components */
.quick-wins-container { @apply space-y-6; }
.quick-wins-card { @apply p-6 bg-white rounded-lg shadow-sm border; }
.quick-wins-section { @apply mb-8; }
.quick-wins-grid { @apply grid gap-4 md:gap-6; }
```

### 3. Interactive States

```css
/* Hover effects for matrix items */
.matrix-item {
  @apply cursor-pointer transition-all duration-200;
}
.matrix-item:hover {
  @apply shadow-md transform -translate-y-1 bg-white;
}

/* Click states for action items */
.action-item {
  @apply transition-colors duration-150;
}
.action-item:hover {
  @apply bg-gray-100;
}
```

## Data Integration Patterns

### 1. OPAL Data Fetching

```typescript
// Hook for fetching Quick Wins data
export function useQuickWinsData(tier2?: string, tier3?: string) {
  return useSimpleMultiTierData(
    'strategy-plans',
    tier2 || 'quick-wins',
    tier3,
    {
      enableAutoRefresh: true,
      refreshInterval: 60000,
      prefetchTiers: true,
      retryAttempts: 3
    }
  );
}
```

### 2. Data Transformation

```typescript
// Transform OPAL response to component props
export function transformQuickWinsData(
  opalResponse: QuickWinsOPALResponse
): QuickWinsPageData {
  return {
    topQuickWins: opalResponse.quick_wins?.slice(0, 3) || [],
    impactEffortMatrix: opalResponse.impact_matrix || getDefaultMatrix(),
    immediateActions: opalResponse.immediate_actions || [],
    successKPIs: opalResponse.success_metrics || [],
    summary: {
      totalOpportunities: opalResponse.quick_wins?.length || 0,
      estimatedROI: calculateTotalROI(opalResponse.quick_wins),
      implementationTimeline: calculateTimeline(opalResponse.quick_wins),
      confidenceScore: opalResponse.confidence_score || 0.75
    }
  };
}
```

## Implementation Checklist

### Page Setup
- [ ] Create tier2 page component following established pattern
- [ ] Implement proper routing and navigation
- [ ] Add breadcrumb and mega menu support
- [ ] Include ServiceStatusProvider wrapper

### Widget Implementation
- [ ] Create QuickWinsWidget component
- [ ] Implement TopQuickWinsSection
- [ ] Build ImpactEffortMatrix visualization
- [ ] Add ImplementationDetails section
- [ ] Integrate with OPAL data hooks

### Data & Types
- [ ] Define TypeScript interfaces
- [ ] Implement data transformation utilities
- [ ] Add OPAL integration hooks
- [ ] Create fallback/loading states

### Styling & UX
- [ ] Apply consistent color scheme
- [ ] Add hover and interactive states
- [ ] Implement responsive design
- [ ] Add loading and error states

### Testing & Validation
- [ ] Test with mock OPAL data
- [ ] Verify responsive behavior
- [ ] Test error handling
- [ ] Validate accessibility

## File Structure

```
src/
├── app/engine/results/strategy-plans/quick-wins/
│   └── page.tsx                          # Main Quick Wins page
├── components/
│   ├── widgets/
│   │   ├── QuickWinsWidget.tsx          # Main widget component
│   │   ├── TopQuickWinsSection.tsx      # Top 3 quick wins
│   │   ├── ImpactEffortMatrix.tsx       # Matrix visualization
│   │   └── ImplementationDetails.tsx     # Actions & KPIs
│   └── ui/
│       └── quick-wins/                   # Quick wins specific UI components
├── lib/
│   ├── types/
│   │   └── quick-wins.ts                # TypeScript interfaces
│   └── utils/
│       └── quick-wins.ts                # Utility functions
└── hooks/
    └── useQuickWinsData.ts              # Data fetching hook
```

This template provides a comprehensive foundation for implementing the Quick Wins page while following the established patterns and architecture of the OSA application.