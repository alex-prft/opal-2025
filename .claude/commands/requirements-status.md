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