<<<<<<< HEAD
# Requirements Current Command

Show details of the current active requirement and resume any pending work.

## Usage
`/requirements-current`

## Behavior

This command is similar to `/requirements-status` but provides more detailed information and automatically resumes any pending workflow steps.

1. **Check for Active Requirement**
   - Read `.current-requirement` file
   - If no active requirement, display: "No active requirement. Use /requirements-start to begin a new one."

2. **Display Detailed Status**
   - Show requirement metadata
   - Display progress through all phases
   - Show recent answers and decisions
   - List next steps

3. **Auto Resume Workflow**
   - If in DISCOVERY phase with unanswered questions: Ask the next question
   - If in ANALYSIS phase: Continue autonomous code analysis
   - If in DETAIL phase with unanswered questions: Ask the next technical question
   - If in SPEC phase: Offer to generate the final specification

## Detailed Display Format

```
📋 Current Requirement: user-profile-enhancement
ID: 2024-11-18-1430-user-profile-enhancement
Created: November 18, 2024 at 2:30 PM
Status: ACTIVE
Phase: DETAIL

📝 Original Request:
"Add user avatar upload functionality with image resizing and storage"

✅ Discovery Complete (5/5):
- Will users interact through OSA UI? YES
- Primary focus on content or analytics? content  
- Visible to non-admin users? YES
- Aware of DCI Orchestrator flows? NO
- Required for milestone or phased? phased

🔍 Analysis Complete:
- Found similar patterns in src/components/admin/
- Image handling exists in src/lib/storage/
- User management in src/lib/auth/

⚙️ Detail Questions (2/5):
- Reuse existing services? YES
- Appear in existing navigation? YES
- Next: Q3: Should this participate in DCI-based Results pipeline?

🎯 Next Action: Continue with detail question 3
```

## Auto-Resume Behavior
- Automatically continues the workflow where it left off
- No need for additional commands if questions are pending
- Provides context from previous answers to inform current question
=======
# View Current Requirement

**Purpose:** Display detailed information about the currently active requirement gathering session.

**Usage:** `/requirements-current`

## What This Shows

Provides comprehensive view of the active requirement including:
- **Metadata:** ID, name, description, timestamps
- **Progress:** Detailed phase and question status
- **Files:** All generated files and their purpose
- **Answers:** Summary of discovery and detail responses
- **Next Steps:** Specific action needed to continue

## Detailed Output Format

### Requirement Overview
```
📋 Current Requirement: enhanced-content-analytics
ID: req-20241118-enhanced-content-analytics
Status: ACTIVE
Phase: DISCOVERY
Created: 11/18/2024, 9:15:23 AM
```

### Progress Tracking
```
🔍 Discovery Phase: 3/5 completed
⚙️ Detail Phase: 0/5 (pending discovery completion)
📊 Overall Progress: 30%
```

### File Structure
Shows all generated files in `requirements/[id]/`:
- ✅ `00-initial-request.md` - Original description
- ✅ `01-discovery-questions.md` - Discovery questions
- ✅ `02-discovery-answers.md` - Discovery responses (partial)
- ✅ `03-context-findings.md` - Codebase analysis
- ⏳ `04-detail-questions.md` - Pending
- ⏳ `05-detail-answers.md` - Pending
- ⏳ `06-requirements-spec.md` - Pending
- ⏳ `07-implementation-next-steps.md` - Pending

### Answer Summary
```
Discovery Answers:
1. OSA UI involvement → YES
2. Non-admin user access → YES
3. Content/analytics focus → YES

Detail Answers: (None yet - complete discovery first)
```

### Next Action
```
🎯 Next: Answer Discovery Question 4/5

Q4: Will this feature need to integrate with or be aware of the DCI Orchestrator workflows?

*DCI integration affects Results page placement, OPAL agent involvement, and data flow patterns.*

*Answer with: yes/no/idk*
```

## No Active Requirement

If no requirement is active:
```
No active requirement found.

Use /requirements-start [description] to begin a new requirement gathering session.
```

## File Access

All requirement files are accessible at:
```
requirements/[requirement-id]/[filename]
```

You can review any file directly:
- Initial request and context
- All questions and answers
- Analysis and findings
- Generated specifications (when complete)

## Quality Control Integration

Current view includes quality control status:
- **CLAUDE.md Compliance:** Shows mandatory patterns integration
- **Quality Agents:** Lists which agents will be used at completion
- **Validation Steps:** Shows upcoming validation requirements

## Error Handling

If requirement data is corrupted:
- Shows what files are missing
- Indicates data integrity issues
- Suggests recovery actions
- Provides cleanup options via `/requirements-end`

## Related Commands

- `/requirements-status` - Quick status check
- `/requirements-list` - View all requirements
- `/requirements-end` - Complete or cancel current
- Answer directly with `yes/no/idk` to continue

## Implementation Notes

This command provides the most detailed view of requirement state:
- Reads all metadata and progress tracking
- Parses answer files for summary display
- Checks file existence and completeness
- Provides direct file paths for manual review
- Safe to use at any time (read-only operation)
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
