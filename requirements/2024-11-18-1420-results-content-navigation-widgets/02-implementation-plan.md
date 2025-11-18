# Implementation Plan - Results Content Optimizer Architecture

## Overview

**Scope**: Content Recommendations DXP tool integration (Phase 1)
**Target**: Fix DXP → OPAL → OSA Results pipeline for Content Recs pages
**Admin Dashboard**: Replace `http://localhost:3002/engine/admin/governance`

---

## Phase 1: Discovery & Audit

### 1.1 Files to Create - Documentation
```
docs/results/current-state-blueprint.md
docs/results/dxp-data-flow.md
docs/results/content-recommendations-mapping.md
```

### 1.2 Analysis Tasks
- Map current Content Recs Results pages routing structure
- Identify existing OPAL agents that should handle Content Recs data
- Trace data flow from Content Recs API → OPAL → OSA storage → Results pages
- Document current widget architecture for Content Recs pages

---

## Phase 2: Canonical Mapping & Schemas

### 2.1 Files to Create - Core Configuration
```
config/resultsMapping.ts              # Single source of truth for page mappings
types/resultsContent.ts               # Normalized content schemas
lib/results/adapters/contentRecs.ts  # Content Recs data normalization
lib/results/getResultsContentForRoute.ts  # Centralized content service
```

### 2.2 Content Recs Specific Types
```typescript
// Focus areas for Content Recommendations:
interface ContentRecsTopicPerformance {
  topicId: string;
  topicLabel: string;
  interactions: number;
  uniqueUsers: number;
  trendLabel: 'up' | 'flat' | 'down';
  exampleContent: ContentItem[];
}

interface ContentRecsPersonaSummary {
  personaId: string;
  personaLabel: string;
  topTopics: string[];
  recommendedContent: ContentItem[];
  performanceMetrics: PerformanceMetric[];
}
```

---

## Phase 3: OPAL Agents & Pipeline Fixes

### 3.1 Files to Modify - OPAL Configuration
```
opal-config/opal-agents/content_review.json          # Content analysis agent
opal-config/opal-agents/results_content_optimizer.json  # Enhanced for Content Recs
opal-config/opal-mapping/content-recs-tools.json    # Content Recs tool definitions
```

### 3.2 Results Pages Integration
```
src/app/engine/results/optimizely-dxp-tools/content-recs/**  # Content Recs Results pages
src/components/widgets/ContentRecsWidgets.tsx               # Content Recs specific widgets
```

---

## Phase 4: Admin Dashboard Replacement

### 4.1 Files to Modify - Admin Interface
```
src/app/engine/admin/governance/page.tsx             # Replace with Results Integration Health
src/components/admin/ResultsIntegrationHealth.tsx   # New dashboard component
src/lib/admin/resultsHealthMonitoring.ts            # Health check logic
```

### 4.2 Monitoring & Validation
```
lib/results/validation/contentRecsIntegrationHealth.ts  # Content Recs specific health checks
scripts/validate-results-integrations.ts               # CLI validation script (TypeScript)
```

**NPM Scripts Integration:**
- `npm run validate:results` - Run Results integration validation
- `npm run test:results-content` - Run content uniqueness validation

---

## Phase 5: Original Technical Requirements

### 5.1 Files to Modify - UI/UX Improvements
```
src/components/widgets/shared/ResultsPageBase.tsx    # Add unique IDs to widget wrappers
src/lib/compliance/GuardrailsContext.tsx            # Remove console spam
src/components/shared/GuardrailsNotification.tsx    # Remove overlay notification
```

### 5.2 Performance & SEO
```
src/lib/results/urlSlugOptimization.ts              # SEO-friendly URL generation
src/app/engine/results/[...slug]/route.ts           # URL redirect middleware
```

---

## Phase 6: Testing & Validation

### 6.1 Files to Create - Testing
```
__tests__/contentRecsIntegration.test.ts            # Content Recs integration tests
__tests__/resultsContentMapping.test.ts             # Results mapping and routing tests
scripts/test-content-uniqueness.ts                  # Content fingerprint validation (TypeScript)
```

### 6.2 Integration Health Monitoring
```
lib/results/monitoring/contentRecsHealthReporter.ts # Health metric aggregation
lib/results/monitoring/resultsIntegrationLogger.ts  # Logging + error surfacing
lib/results/monitoring/resultsIntegrationConfig.ts  # Config + thresholds (healthy/warning/failing)
src/components/admin/ContentRecsHealthIndicator.tsx # Real-time health status
```

---

## Files Summary

### ✅ Files to CREATE (22 new files):
```
docs/results/current-state-blueprint.md
docs/results/dxp-data-flow.md
docs/results/content-recommendations-mapping.md
config/resultsMapping.ts
types/resultsContent.ts
lib/results/adapters/contentRecs.ts
lib/results/getResultsContentForRoute.ts
lib/results/validation/contentRecsIntegrationHealth.ts
lib/results/urlSlugOptimization.ts
lib/results/monitoring/contentRecsHealthReporter.ts
lib/results/monitoring/resultsIntegrationLogger.ts
lib/results/monitoring/resultsIntegrationConfig.ts
lib/admin/resultsHealthMonitoring.ts
src/components/admin/ResultsIntegrationHealth.tsx
src/components/admin/ContentRecsHealthIndicator.tsx
src/components/widgets/ContentRecsWidgets.tsx
scripts/validate-results-integrations.ts
scripts/test-content-uniqueness.ts
__tests__/contentRecsIntegration.test.ts
__tests__/resultsContentMapping.test.ts
src/app/engine/results/[...slug]/route.ts
```

### ✅ Files to MODIFY (8 existing files):
```
opal-config/opal-agents/content_review.json
opal-config/opal-agents/results_content_optimizer.json
opal-config/opal-mapping/content-recs-tools.json
src/app/engine/admin/governance/page.tsx              # FULLY REPLACED with Results Integration Health
src/components/widgets/shared/ResultsPageBase.tsx
src/lib/compliance/GuardrailsContext.tsx
src/components/shared/GuardrailsNotification.tsx
src/app/engine/results/optimizely-dxp-tools/content-recs/**
```

### ✅ NPM Scripts to ADD:
```
package.json:
  "validate:results": "ts-node scripts/validate-results-integrations.ts"
  "test:results-content": "ts-node scripts/test-content-uniqueness.ts"
```

### 🎯 Governance Replacement Details:
**Target Route**: `src/app/engine/admin/governance/page.tsx`
- **Current**: Old governance UI functionality
- **After Phase 4**: Dedicated "Results Integration Health" experience for Content Recs
- **URL**: `http://localhost:3002/engine/admin/governance` becomes the Results Integration Health dashboard
- **Note**: This route should no longer surface old governance UI – it becomes the dedicated "Results Integration Health" experience for Content Recs in Phase 1.

---

## Implementation Order

1. **Discovery Phase**: Create documentation, analyze current state
2. **Schema Phase**: Define types and mapping configuration
3. **OPAL Phase**: Update agents and create data adapters
4. **Admin Phase**: Replace governance dashboard with Results Integration Health
5. **UI Phase**: Fix console spam, add widget IDs, remove notifications
6. **Validation Phase**: Add monitoring, testing, and health checks

---

## Success Criteria

### Content Recommendations Specific:
- ✅ All Content Recs Results pages show unique, contextual content
- ✅ Content Recs OPAL agents produce normalized, structured data
- ✅ Admin dashboard shows Content Recs integration health in real-time
- ✅ Content uniqueness validation prevents generic/duplicate content

### Technical Requirements:
- ✅ Widget wrapper divs have unique IDs in tier2/tier3 content areas
- ✅ Console clean of guardrails spam and fast refresh messages
- ✅ Guardrails notification overlay removed
- ✅ URL slugs optimized for SEO (no special characters)
- ✅ All Results pages load quickly with performance optimizations

### Future Extensibility:
- ✅ Architecture supports adding CMS, ODP, WebX, CMP following same patterns
- ✅ Clear documentation for adding new Results pages and DXP integrations
- ✅ Monitoring system scales to additional DXP tools

---

## Ready for Confirmation

**Do you approve this implementation plan?**

This covers:
- ✅ Content Recommendations focus (as requested)
- ✅ All original technical requirements
- ✅ Admin dashboard replacement at specified URL
- ✅ Proper file naming conventions
- ✅ Documentation in `docs/results/`
- ✅ Extensible architecture for future DXP tools

**If approved, I will begin with Phase 1 (Discovery & Audit) by creating the documentation and analyzing the current codebase.**