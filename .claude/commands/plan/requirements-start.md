<<<<<<< HEAD
# Requirements Start Command

Start a new requirement for a feature or change in the OSA project.

## Usage
`/requirements-start [description]`

## Behavior

When this command is invoked:

1. **Check for Active Requirements**
   - If another requirement is ACTIVE, show message: "There is already an ACTIVE requirement: [id]. Use /requirements-end to finalize or /requirements-current to resume."
   - Do NOT start a new requirement if one is already active.

2. **Create New Requirement Structure**
   - Generate a unique requirement ID: `YYYY-MM-DD-HHMM-slug` from the description
   - Create requirement folder under `requirements/`
   - Initialize `metadata.json` with initial state
   - Write user's full input to `00-initial-request.md`
   - Set as current active requirement in `.current-requirement`

3. **Phase 1: Quick Codebase Analysis**
   - Scan relevant OSA folders: `src/app`, `src/components`, `src/lib`, `opal-config`
   - Understand:
     - Tech stack patterns
     - Where similar features exist
     - Relevant architectural patterns
   - Write concise summary to `03-context-findings.md`

4. **Phase 2: Discovery Questions**
   - Generate 5 high-level YES/NO questions focused on:
     - OSA feature categories (Strategy Plans, Optimizely DXP Tools, Analytics Insights, Experience Optimization)
     - Priority areas: Content Improvements → Analytics Insights → Experience Tactics → Strategy Plans
   - Each question must:
     - Be answerable with `yes`, `no`, or `idk`
     - Include clearly stated default behavior for `idk` answers
   - Write questions to `01-discovery-questions.md`
   - Present first question and wait for answer

## Example Questions
- "Will users interact with this feature through the OSA UI? (default: YES)"
- "Does this feature primarily affect content recommendations or analytics insights? (default: content)"
- "Does this change need to be visible to non-admin users? (default: NO)"
- "Should this feature be aware of the DCI Orchestrator / results-content-optimizer flows? (default: YES when related to Results)"
- "Is this required for the current milestone or can it be phased? (default: phased)"

## Important Notes
- This system is **project-scoped** and **optional** - only activated when explicitly called
- Does NOT refactor existing OSA logic or break current workflows
- Uses utilities in `claude-requirements/utils.ts` for state management
- Follows OSA priority order: Content → Analytics → Experience → Strategy

## Next Steps
After starting, the system will guide you through:
1. Discovery questions (5 high-level)
2. Code analysis (autonomous)
3. Detail questions (5 technical)
4. Requirements specification generation
=======
# Start Requirements Gathering

**Purpose:** Launch the Claude Requirements Gathering System to collect structured requirements through two-phase questioning.

**Usage:** `/requirements-start [description]`

## System Overview

The Claude Requirements Gathering System uses a two-phase approach:
1. **Discovery Phase** (5 questions) - High-level product and user experience questions
2. **Detail Phase** (5 questions) - Technical implementation and architecture questions

All questions use YES/NO format with smart defaults (answer 'idk' to use defaults).

## Process Flow

1. **Initialize** - Create requirement directory and metadata
2. **Discovery Questions** - 5 product-focused questions about OSA integration
3. **Analysis** - Automated codebase context analysis
4. **Detail Questions** - 5 technical questions based on discovery insights
5. **Specification Generation** - Complete requirements document with quality control

## Quality Control Integration

**MANDATORY:** This system follows CLAUDE.md compliance patterns:
- All development work tracked with TodoWrite
- Quality control agents at major milestones
- results-content-optimizer for Results page alignment
- opal-integration-validator for OPAL integration validation
- general-purpose (CLAUDE.md checker) for final validation

## Example Usage

```
/requirements-start Enhanced content analytics dashboard for OSA insights
```

This will:
- Generate unique requirement ID (e.g., `req-20241118-enhanced-content-analytics`)
- Create structured directory in `requirements/`
- Begin discovery phase with first question
- Track progress through completion

## OSA Priority Alignment

Questions are designed around OSA Results architecture:
- **4 Equal Results Tiers:** Strategy Plans, DXP Tools, Analytics Insights, Experience Optimization
- OSA UI integration patterns
- DCI Orchestrator workflow awareness
- OPAL agent integration considerations
- Results tier placement strategies

## Output Structure

Complete requirements package includes:
- `00-initial-request.md` - Original description
- `01-discovery-questions.md` - Discovery phase questions
- `02-discovery-answers.md` - Discovery responses
- `03-context-findings.md` - Codebase analysis
- `04-detail-questions.md` - Technical detail questions
- `05-detail-answers.md` - Technical responses
- `06-requirements-spec.md` - Final specification
- `07-implementation-next-steps.md` - Mandatory quality control steps

## Requirements

- Must be project-scoped (non-global)
- Optional and non-blocking (only via command)
- Will NOT refactor existing OSA logic
- Focuses on clear, reproducible requirements
- Integrates with OSA architectural patterns

## Related Commands

- `/requirements-status` - Check current progress
- `/requirements-current` - View active requirement
- `/requirements-list` - List all requirements
- `/requirements-end` - Complete current requirement

## Implementation Notes

The system creates requirements that follow OSA patterns:
- TypeScript strict mode compliance
- React 19 + Next.js 16 compatibility
- Supabase integration with guardrails
- OPAL workflow system awareness
- Enterprise security patterns
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
