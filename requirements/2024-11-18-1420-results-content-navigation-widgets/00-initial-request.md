# Initial Request

**User Request:** Work on the result content, navigation and additon / removal of widgets

## Role Assignment: Results-Content-Optimizer Architect

You are **results-content-optimizer architect** for the OSA Results section.

**Mission:** Fix the entire path from **Optimizely DXP tools → Opal agents → OSA results pages** so that:
- Every results page shows **unique, context-appropriate content**
- Each page is powered by the **correct DXP tool data + Opal agent(s)**
- The system is **observable, testable, and hard to silently break**

## Core Requirements (Phase 1)

### Initial Technical Tasks:
- Review OPAL mapping and determine what content should be on all the pages with /engine/results
- Add a unique id to divs inside #tier3-main-content and #tier2-main-content that wrap widgets like `<div class="text-sm [&amp;_p]:leading-relaxed">`
- Fix any broken links or pages that are not loading
- Ensure all URL slugs are SEO / loading friendly - don't use special characters like ( or )
- Ensure the console is not spammed with messages or errors like widget notifications or:
  - `GuardrailsContext.tsx:80 ✅ Guardrails initialized successfully`
  - `forward-logs-shared.ts:95 [Fast Refresh] done in 3326ms`
- Ensure each of the results pages loads quickly
- Remove the guardrails notification overlay that has styling:
  ```html
  <div style="position: fixed; bottom: 20px; right: 20px; background-color: rgba(0, 0, 0, 0.9); color: white; padding: 10px; border-radius: 8px; font-size: 12px; font-family: monospace; z-index: 9999; border: 2px solid green; min-width: 200px; max-width: 400px;">
    <div style="cursor: pointer; display: flex; justify-content: space-between;">
      <span>🛡️ Guardrails: HEALTHY</span>
      <span>▶</span>
    </div>
  </div>
  ```

## Comprehensive Architecture Requirements (Phase 2)

### High-Level Context
- **Results URLs grouped into 4 Tier 1 sections:**
  1. Strategy Plans
  2. Optimizely DXP Tools
  3. Analytics Insights
  4. Experience Optimization

- **DXP tools integration priorities:**
  - Content Recommendations
  - CMS
  - ODP (Customer/Member data)
  - WebX (experiments)
  - CMP (campaign calendar & content)
  - OSA/OPAL internal analytics

### Current Problems to Solve
- Many results pages showing **generic/duplicated content**
- Lack of confidence that **OPAL agents are reliably collecting and pushing data** from each DXP tool into OSA
- Uncertainty that **widgets on each results page** know which agent output to use

### Six-Phase Execution Plan

#### 1. Discovery & Audit
- **1.1 Codebase scan**: Map results routing tree, widgets, OPAL agents, integration validators
- **1.2 Data flow tracing**: Track DXP tool → OPAL → OSA data pipelines

**Deliverables:**
- `docs/results/current-state-blueprint.md` - routes → components mapping
- `docs/results/dxp-data-flow.md` - data flow per DXP tool

#### 2. Canonical Mapping & Schemas
- **2.1 Route → Section → Topic → Agents mapping**: TypeScript config as single source of truth
- **2.2 Normalized content schemas**: Define standardized data shapes for widgets

**Deliverables:**
- `config/resultsMapping.ts` - authoritative page-to-agent mappings
- `types/resultsContent.ts` - normalized content models
- `lib/results/adapters/**` - DXP data normalization adapters

#### 3. OPAL Agents & Pipelines Fixes
- **3.1 Audit and refactor OPAL agents**: Update to produce normalized, context-aware content
- **3.2 Wire agents to OSA results**: Centralized results content service

**Deliverables:**
- Updated OPAL agent configurations with clear instructions
- `lib/results/getResultsContent.ts` - centralized content service
- Enhanced `results-content-optimizer` sub-agent

#### 4. Guardrails, Validation & Monitoring
- **4.1 Integration validation**: Verify DXP → OPAL → OSA pipeline health
- **4.2 "Never Blank / Never Generic" checks**: Ensure unique content per page
- **4.3 Logging**: Structured monitoring and debugging

**Deliverables:**
- `npm run validate:results-integrations` script
- Admin "Results Integration Health" view
- Content uniqueness validation system

#### 5. Testing & Quality Assurance
- Unit/integration tests for data adapters
- Content fingerprint checks for uniqueness
- End-to-end pipeline validation

#### 6. Documentation & Definition of Done
- How to add new results pages
- How to debug data issues
- Definition of Done checklist for results pages

### Critical Success Criteria
- **Unique content**: No identical content across different Results URLs
- **Correct data routing**: Each page powered by appropriate DXP tools + agents
- **Observable system**: Clear monitoring and validation of data flows
- **Testable pipeline**: Automated validation prevents silent breakage

## User Questions to Answer Before Starting:
1. Where should canonical docs live? (e.g. docs/results vs another path)
2. Any OPAL agents or DXP tools to consider out of scope for first iteration?
3. Existing admin views/dashboards to reuse for "Results Integration Health"?
4. Naming conventions to respect for files, types, configs?