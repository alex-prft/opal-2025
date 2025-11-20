<<<<<<< HEAD
# Requirements Status Command

Check the status of the current active requirement.

## Usage
`/requirements-status`

## Behavior

When this command is invoked:

1. **Check for Active Requirement**
   - Read `.current-requirement` file
   - If no active requirement, display: "No active requirement. Use /requirements-start to begin a new one."

2. **Display Current Status**
   - Load requirement metadata from `metadata.json`
   - Show formatted status information:
     ```
     📋 Active Requirement: [feature-name]
     Phase: [DISCOVERY/ANALYSIS/DETAIL/SPEC]
     Progress: Discovery [answered]/5, Detail [answered]/5
     Next: [Next action or question]
     ```

3. **Resume Flow if Needed**
   - If there are unanswered discovery questions, resume asking them
   - If there are unanswered detail questions, resume asking them
   - If analysis phase is incomplete, continue autonomous analysis
   - If ready for spec generation, prompt to generate final specification

## Status Display Examples

**Discovery Phase:**
```
📋 Active Requirement: user-avatar-upload
Phase: DISCOVERY
Progress: Discovery 3/5, Detail 0/5
Next: Q4: Should this feature be aware of the DCI Orchestrator flows?
```

**Analysis Phase:**
```
📋 Active Requirement: dark-mode-toggle
Phase: ANALYSIS
Progress: Discovery 5/5, Detail 0/5
Next: Analyzing codebase patterns and generating technical questions
```

**Detail Phase:**
```
📋 Active Requirement: export-results-pdf
Phase: DETAIL
Progress: Discovery 5/5, Detail 2/5
Next: Q3: Should this feature participate in the DCI-based Results pipeline?
```

**Spec Phase:**
```
📋 Active Requirement: content-recommendation-widget
Phase: SPEC
Progress: Discovery 5/5, Detail 5/5
Next: Ready to generate final requirements specification
```

## Error Handling
- If metadata file is corrupted, show error and suggest using `/requirements-end` to clean up
- If requirement folder is missing, clear the current requirement and notify user
- Always fail safely without breaking other OSA functionality
=======
# Requirements Status

**Purpose:** Check the current status of the active requirement gathering process.

**Usage:** `/requirements-status`

## What This Shows

- **Active Requirement:** Name and ID of current requirement
- **Phase:** Current phase (DISCOVERY, ANALYSIS, DETAIL, SPEC)
- **Progress:** Questions answered in each phase
- **Next Action:** What to do next or next question to answer

## Status Phases

### Discovery Phase
- **Progress:** Shows "Discovery X/5"
- **Next:** Displays the next discovery question
- **Action:** Answer with yes/no/idk

### Analysis Phase
- **Status:** "Analyzing codebase patterns and generating technical questions"
- **Duration:** Usually completes automatically in seconds
- **Next:** Moves to Detail phase

### Detail Phase
- **Progress:** Shows "Detail X/5"
- **Next:** Displays the next technical detail question
- **Action:** Answer with yes/no/idk

### Spec Phase
- **Status:** "Ready to generate final requirements specification"
- **Action:** System automatically generates final documents
- **Result:** Requirement marked COMPLETE

## Sample Output

```
📋 Active Requirement: enhanced-content-analytics
Phase: DISCOVERY
Progress: Discovery 2/5, Detail 0/5
Next: Q3: Is this feature primarily focused on content recommendations or analytics insights?

*This helps determine OSA category placement and integration patterns.*

*Answer with: yes/no/idk*
```

## No Active Requirement

If no requirement is active:
```
No active requirement. Use /requirements-start to begin a new one.
```

## Error States

- **Corrupted Metadata:** Suggests using `/requirements-end` to clean up
- **Missing Files:** Indicates data integrity issues
- **Phase Mismatch:** Shows inconsistent state information

## Quality Control Integration

Status includes quality control checkpoints:
- Discovery completion triggers codebase analysis
- Detail completion triggers specification generation
- Final completion includes mandatory next steps file
- All phases tracked for CLAUDE.md compliance

## Related Commands

- `/requirements-start` - Begin new requirement if none active
- `/requirements-current` - View detailed current requirement info
- `/requirements-list` - See all requirements (active and complete)
- `/requirements-end` - Complete or cancel current requirement

## Implementation Notes

Status is read-only and safe to use anytime. It reads from:
- `claude-requirements/current-requirement.json` - Active requirement tracking
- `requirements/[id]/metadata.json` - Requirement state and progress
- Generated question files for next action determination
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
