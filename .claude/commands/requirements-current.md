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