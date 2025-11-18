<<<<<<< HEAD
# Requirements End Command

End the current active requirement with options for completion or cleanup.

## Usage
`/requirements-end`

## Behavior

When this command is invoked:

1. **Check for Active Requirement**
   - If no active requirement, display: "No active requirement to end."
   - Exit gracefully if nothing to do

2. **Determine Current Phase and Offer Options**

   **If in DISCOVERY or DETAIL phases (incomplete):**
   ```
   The current requirement is not complete. What would you like to do?
   
   1. Generate partial spec with current info (mark as INCOMPLETE)
   2. Mark as INCOMPLETE and stop (no spec generated)
   3. Cancel and delete this requirement folder (only if explicitly chosen)
   
   Choose option (1/2/3):
   ```

   **If in SPEC phase (complete):**
   - Confirm completion
   - Ensure status is marked as "COMPLETE"
   - Show final summary

3. **Execute Chosen Action**

   **Option 1 - Generate Partial Spec:**
   - Create `06-requirements-spec.md` with available information
   - Mark missing sections clearly
   - Set status to "INCOMPLETE"
   - Clear current requirement

   **Option 2 - Mark Incomplete:**
   - Set status to "INCOMPLETE" in metadata
   - Add timestamp of when it was marked incomplete
   - Clear current requirement
   - No spec generation

   **Option 3 - Cancel and Delete:**
   - Only available if explicitly chosen
   - Remove entire requirement folder
   - Clear current requirement
   - Update requirements index

4. **Clean Up**
   - Clear `.current-requirement` file
   - Update `requirements/index.md`
   - Show final status message

## Example Interactions

**Ending Complete Requirement:**
```
✅ Requirement 'user-avatar-upload' is COMPLETE
Final specification saved to: requirements/2024-11-18-1430-user-avatar-upload/06-requirements-spec.md
Status: COMPLETE - Ready for implementation
```

**Ending Incomplete Requirement:**
```
⚠️ Requirement 'dark-mode-toggle' ended as INCOMPLETE
Phase: DISCOVERY (3/5 questions answered)
Partial data preserved in: requirements/2024-11-18-1445-dark-mode-toggle/
You can resume later with /requirements-start and the same description.
```

**Canceled Requirement:**
```
❌ Requirement 'export-feature' has been CANCELED and removed
All files deleted from: requirements/2024-11-18-1500-export-feature/
```

## Safety Features
- Always confirms destructive actions (delete)
- Preserves partial work by default
- Updates all index files and tracking
- Fails safely if file operations encounter errors
=======
# End Requirements Session

**Purpose:** Complete, cancel, or clean up the currently active requirement gathering session.

**Usage:** `/requirements-end [reason]`

## Actions Performed

### For Complete Requirements
If requirement has finished all phases:
- Marks status as COMPLETE
- Sets completion timestamp
- Clears active requirement
- Updates requirements index
- Preserves all files for reference

### For Incomplete Requirements
If requirement is not finished:
- Marks status as CANCELLED
- Sets completion timestamp with cancellation reason
- Clears active requirement
- Updates requirements index
- Preserves existing files (no data loss)

### Cleanup Actions
- Clears `claude-requirements/current-requirement.json`
- Updates `requirements/index.md`
- Validates requirement data integrity
- Provides summary of actions taken

## Reason Parameter

Optional reason for ending requirement:
```
/requirements-end Project requirements changed
/requirements-end Completed via different approach
/requirements-end Duplicate of existing feature
```

If no reason provided:
- Complete requirements: "Completed successfully"
- Incomplete requirements: "Cancelled by user"

## Sample Outputs

### Successful Completion
```
✅ Requirement Completed Successfully!

Requirement: enhanced-content-analytics (req-20241118-enhanced-content-analytics)
Status: COMPLETE
Completed: 11/18/2024, 9:45:12 AM
Files Generated: 8 files in requirements/req-20241118-enhanced-content-analytics/

📋 Final Specification: requirements/req-20241118-enhanced-content-analytics/06-requirements-spec.md
🎯 Next Steps: requirements/req-20241118-enhanced-content-analytics/07-implementation-next-steps.md

Ready for implementation following CLAUDE.md patterns!
```

### Cancellation
```
⚠️ Requirement Cancelled

Requirement: enhanced-content-analytics (req-20241118-enhanced-content-analytics)
Status: CANCELLED
Reason: Project requirements changed
Cancelled: 11/18/2024, 9:45:12 AM
Progress: Discovery 3/5, Detail 0/5

Files preserved in requirements/req-20241118-enhanced-content-analytics/ for reference.
```

### No Active Requirement
```
No active requirement to end.

Use /requirements-list to view all requirements.
```

## Data Preservation

**Important:** This command never deletes data
- All files are preserved in requirements directory
- Metadata includes completion/cancellation reason
- Can review cancelled requirements for future reference
- Can extract partial work for other requirements

## Quality Control Integration

For completed requirements:
- Validates all required files exist
- Confirms quality control integration present
- Verifies CLAUDE.md compliance patterns
- Includes mandatory next steps file

## Error Handling

### Corrupted Requirement Data
If requirement data is inconsistent:
```
⚠️ Data Integrity Issues Detected

Problems found:
- Missing metadata.json
- Incomplete answer files
- Phase/progress mismatch

Actions taken:
- Marked as CANCELLED
- Preserved existing files
- Cleared active requirement
- Updated requirements index

Manual review recommended: requirements/req-20241118-enhanced-content-analytics/
```

### Safe Recovery
Command is designed to always succeed:
- Handles missing files gracefully
- Recovers from corrupted metadata
- Clears active requirement even with errors
- Provides clear status of actions taken

## After Ending Requirement

### Next Actions Available
- `/requirements-start` - Begin new requirement
- `/requirements-list` - View all requirements
- Review generated files for implementation
- Use completed specifications for development

### Implementation Ready
Complete requirements include:
- Full specification document
- Mandatory quality control requirements
- Implementation next steps with TodoWrite patterns
- Technical and functional requirements
- Acceptance criteria and testing guidance

## Related Commands

- `/requirements-start` - Begin new requirement after ending current
- `/requirements-list` - View all requirements including just completed
- `/requirements-current` - Check what will be ended (run before ending)
- `/requirements-status` - Quick check of completion status

## Implementation Notes

This command:
- Always succeeds (graceful error handling)
- Preserves all data (no destructive actions)
- Updates all tracking files consistently
- Provides clear feedback on actions taken
- Safe to run multiple times (idempotent)
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
