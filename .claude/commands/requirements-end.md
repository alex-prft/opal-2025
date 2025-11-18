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