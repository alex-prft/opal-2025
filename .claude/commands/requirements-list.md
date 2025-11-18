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