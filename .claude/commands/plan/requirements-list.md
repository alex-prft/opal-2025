<<<<<<< HEAD
# Requirements List Command

List all requirements in the project with their current status.

## Usage
`/requirements-list`

## Behavior

When this command is invoked:

1. **Scan Requirements Directory**
   - Read all requirement folders from `requirements/`
   - Load metadata from each `metadata.json` file
   - Sort by creation date (newest first)

2. **Display Formatted List**
   ```
   📋 OSA Requirements Summary
   
   ✅ COMPLETE: user-avatar-upload (Ready for implementation)
      Created: Nov 18, 2024 | ID: 2024-11-18-1430-user-avatar-upload
      
   🟢 ACTIVE: dark-mode-toggle (DETAIL 2/5)
      Created: Nov 18, 2024 | ID: 2024-11-18-1445-dark-mode-toggle
      
   ⚠️ INCOMPLETE: dashboard-performance (paused 3 days ago)
      Created: Nov 15, 2024 | ID: 2024-11-15-0930-dashboard-performance
      
   ❌ CANCELED: old-export-feature (canceled 1 week ago)
      Created: Nov 11, 2024 | ID: 2024-11-11-1200-old-export-feature
   ```

3. **Show Summary Statistics**
   ```
   📊 Summary:
   - Total Requirements: 4
   - Complete: 1 (25%)
   - Active: 1 (25%)
   - Incomplete: 1 (25%)
   - Canceled: 1 (25%)
   ```

4. **Update Index File**
   - Automatically update `requirements/index.md` with current list
   - Maintain markdown table format for easy viewing

## Status Legend
- ✅ **COMPLETE**: Requirements specification is complete and ready for implementation
- 🟢 **ACTIVE**: Currently being defined (only one can be active at a time)
- ⚠️ **INCOMPLETE**: Started but not finished (paused or partial)
- ❌ **CANCELED**: Explicitly canceled or no longer relevant

## Additional Information
- Shows time since last activity for non-active requirements
- Displays current phase and progress for active requirements
- Links to requirement folders for easy access
- Groups by status for better organization

## Quick Actions
After listing, suggests relevant next actions:
- If no active requirement: "Use /requirements-start to begin a new requirement"
- If active requirement exists: "Use /requirements-current to continue working on [name]"
- If incomplete requirements exist: "Use /requirements-start with the same description to resume incomplete work"
=======
# List All Requirements

**Purpose:** Display a comprehensive list of all requirements (active, complete, and cancelled) in the project.

**Usage:** `/requirements-list`

## What This Shows

Provides overview of all requirements with:
- **Summary Statistics:** Total counts by status
- **Requirements Table:** All requirements with key details
- **Quick Access:** Direct paths to requirement files
- **Status Indicators:** Clear visual status for each requirement

## Sample Output Format

### Summary Statistics
```
📊 Requirements Summary (Last Updated: 11/18/2024, 9:30:15 AM)

Total Requirements: 5
• Active: 1
• Complete: 3
• Cancelled: 1
```

### Requirements Table
```
| ID | Name | Status | Phase | Progress | Created |
|---|---|---|---|---|---|
| req-20241118-enhanced-content-analytics | enhanced-content-analytics | ACTIVE | DISCOVERY | D:3/5 T:0/5 | 11/18/2024 |
| req-20241117-user-dashboard-widgets | user-dashboard-widgets | COMPLETE | SPEC | D:5/5 T:5/5 | 11/17/2024 |
| req-20241116-opal-integration-health | opal-integration-health | COMPLETE | SPEC | D:5/5 T:5/5 | 11/16/2024 |
| req-20241115-performance-monitoring | performance-monitoring | COMPLETE | SPEC | D:5/5 T:5/5 | 11/15/2024 |
| req-20241114-analytics-export | analytics-export | CANCELLED | DISCOVERY | D:2/5 T:0/5 | 11/14/2024 |
```

### Progress Legend
- **D:X/5** - Discovery questions answered
- **T:X/5** - Technical detail questions answered
- **Status** - Current requirement state
- **Phase** - Current workflow phase

## Status Types

### ACTIVE
- Currently being worked on
- Only one active requirement allowed at a time
- Can be resumed using `/requirements-current`

### COMPLETE
- Fully processed through all phases
- Has complete specification and next steps
- Ready for implementation

### CANCELLED
- Stopped before completion
- Metadata preserved for reference
- Can be reviewed but not resumed

## File Access

Each requirement creates a directory structure:
```
requirements/
├── index.md (this list in markdown format)
├── req-20241118-enhanced-content-analytics/
│   ├── metadata.json
│   ├── 00-initial-request.md
│   ├── 01-discovery-questions.md
│   ├── 02-discovery-answers.md
│   └── ... (additional files as process continues)
```

## Empty Repository

If no requirements exist:
```
📊 Requirements Summary

No requirements found.

Use /requirements-start [description] to create your first requirement.
```

## Usage Patterns

### Find Specific Requirement
Look for requirements by name or date created

### Check Implementation Status
Review completed requirements for implementation ideas

### Resume Work
Identify active requirement to continue

### Clean Up
Identify cancelled requirements that might need cleanup

## Quality Control Integration

List shows quality control compliance:
- **Complete Requirements:** Include mandatory next steps
- **CLAUDE.md Patterns:** Show validation requirements
- **Implementation Ready:** Clear indicators for ready specifications

## Implementation Notes

This command:
- Reads from `requirements/index.md` (auto-generated)
- Scans all requirement directories for metadata
- Sorts by creation date (newest first)
- Updates index file with current information
- Safe to run frequently (read-only with index update)

## Related Commands

- `/requirements-start` - Create new requirement
- `/requirements-current` - View active requirement details
- `/requirements-status` - Quick status of active requirement
- `/requirements-end` - Complete or cancel active requirement

## Maintenance

The requirements list is automatically maintained:
- Updated when requirements are created
- Updated when requirements are completed
- Updated when requirements are cancelled
- Manual refresh available via this command
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
