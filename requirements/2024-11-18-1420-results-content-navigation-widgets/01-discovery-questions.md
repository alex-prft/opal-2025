# Discovery Questions - Results Content Optimizer Architecture

## Question 1: OPAL Mapping Scope ✅ ANSWERED: YES
**Should the OPAL mapping review include changes to agent tool assignments and configurations beyond just determining page content?**

**User Answer: YES** - Include comprehensive OPAL agent and tool configuration changes

---

## Clarification Questions Before Starting Implementation

Before beginning the comprehensive results-content-optimizer architecture work, I need answers to these critical questions:

### Question A: Documentation Location ✅ ANSWERED
**Where should the canonical documentation live?**

**User Answer: Option 1 → `docs/results/`** as the canonical location for all Results + integration documentation (current and future).

*Implementation:*
- `docs/results/current-state-blueprint.md`
- `docs/results/dxp-data-flow.md`
- `docs/results/implementation-guides/`

---

### Question B: Scope Limitations ✅ ANSWERED
**Are there any OPAL agents or DXP tools that should be considered out of scope for this first iteration?**

**User Answer: Start with Content Recommendations only** (and its related OPAL agents + data flows) for the first iteration.

**Out of scope for Phase 1:**
- CMS
- ODP (Customer/Member data)
- WebX (experiments)
- CMP (campaign calendar & content)
- OSA/OPAL internal analytics

*Plan to support them in later phases following the same pattern.*

---

### Question C: Admin Integration ✅ ANSWERED
**Do you have existing admin views or dashboards you want me to reuse for the "Results Integration Health" monitoring?**

**User Answer: Reuse and replace the existing admin view at** `http://localhost:3002/engine/admin/governance`

*This URL should become the new "Results Integration Health" dashboard for this first iteration (focused on Content Recs).*

---

### Question D: Naming Conventions ✅ ANSWERED
**Are there naming conventions (for files, types, configs) I must respect?**

**User Answer: Use these names unless the repo has a very strong conflicting pattern:**
- Config file: `config/resultsMapping.ts`
- Types file: `types/resultsContent.ts`
- Logic/helpers namespace: `lib/results/` (subfolders as needed)
  - `lib/results/adapters/`
  - `lib/results/getResultsContentForRoute.ts`

**✅ ALL QUESTIONS ANSWERED - READY FOR IMPLEMENTATION PLANNING**

---

## Implementation Readiness Checklist

Once you answer the clarification questions, I will:

✅ **Phase 1**: Create comprehensive current-state documentation
✅ **Phase 2**: Build canonical mapping and schemas
✅ **Phase 3**: Fix OPAL agents and data pipelines
✅ **Phase 4**: Add validation, monitoring, and guardrails
✅ **Phase 5**: Implement testing and quality assurance
✅ **Phase 6**: Complete with documentation and Definition of Done

**Plus your original technical requirements:**
- Unique IDs for widget wrapper divs
- Console spam cleanup (guardrails, fast refresh messages)
- Remove guardrails notification overlay
- Fix broken links and URL slug optimization
- Performance improvements