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