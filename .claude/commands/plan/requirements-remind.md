<<<<<<< HEAD
# Requirements Remind Command

Remind about the requirements system behavior and current context.

## Usage
`/requirements-remind` or `/remind`

## Behavior

When this command is invoked, provide a clear reminder of:

1. **System Purpose**
   ```
   🎯 Claude Requirements Gathering System for OSA
   
   This system helps gather clear, reproducible requirements for new features
   in the OSA (Optimizely Strategy Assistant) project.
   ```

2. **Key Principles**
   ```
   ✅ Only asks YES/NO questions with smart defaults
   ✅ You can always answer 'idk' to use defaults
   ✅ This phase is requirements gathering only - no implementation
   ✅ Optional and non-blocking - only used when you call /requirements-start
   ✅ Project-scoped and safe - won't break existing OSA functionality
   ```

3. **Question Format**
   ```
   All questions follow this pattern:
   
   "Should this feature do X? (default: YES)"
   
   You can answer:
   - 'yes' or 'y' - Explicitly choose yes
   - 'no' or 'n' - Explicitly choose no  
   - 'idk' or 'default' - Use the default behavior (YES in this example)
   ```

4. **OSA Focus Areas**
   ```
   Features are prioritized in this order:
   1. Content Improvements (highest priority)
   2. Actionable Analytics Insights
   3. Tactics and use cases to improve experience
   4. Strategy Plans, phases, and roadmaps
   
   Features fit into these OSA categories:
   - Strategy Plans
   - Optimizely DXP Tools  
   - Analytics Insights
   - Experience Optimization
   ```

5. **Two-Phase Process**
   ```
   Phase 1: Discovery (5 high-level questions)
   - Understand the feature's purpose and context
   - Determine where it fits in the OSA ecosystem
   
   Phase 2: Detail (5 technical questions)  
   - Technical implementation approach
   - Integration with existing systems
   - Deployment and rollout strategy
   ```

6. **Available Commands**
   ```
   /requirements-start [description] - Begin new requirement
   /requirements-status - Check current progress
   /requirements-current - Resume current work
   /requirements-end - Finish or cleanup current requirement
   /requirements-list - See all requirements
   /requirements-remind - Show this reminder
   ```

7. **Current Context**
   - Check if there's an active requirement and show its status
   - If active, remind about next steps
   - If no active requirement, suggest starting one

## When to Use This Command
- When conversations have drifted from requirements gathering
- To get back on track during the questioning process
- To understand the system behavior before starting
- To remember available commands and options
=======
# Remind Current Question

**Purpose:** Display the current question that needs to be answered without changing any state or progress.

**Usage:** `/requirements-remind`

## What This Does

Simple reminder command that shows:
- Current active requirement name
- Current phase (Discovery or Detail)
- Current question number and progress
- The actual question text with context
- How to answer (yes/no/idk)

## When To Use

- **Forgot the question:** When you want to see the current question again
- **Context reminder:** Need to see the question context and help text
- **Progress check:** Quick check of where you are without full status
- **Answer formatting:** Reminder of how to format your answer

## Sample Output

### During Discovery Phase
```
🔍 Current Question - Discovery Phase (3/5)

Requirement: enhanced-content-analytics

**Q3:** Is this feature primarily focused on content recommendations or analytics insights?

*OSA has 4 equal Results tiers: Strategy Plans, DXP Tools, Analytics Insights, Experience Optimization*

*Answer with: yes/no/idk*

Progress: Discovery 2/5 completed, Detail 0/5 pending
```

### During Detail Phase
```
⚙️ Current Question - Detail Phase (2/5)

Requirement: enhanced-content-analytics

**Q2:** Will this feature require new API endpoints in src/app/api/?

*This affects backend implementation requirements and data flow architecture.*

*Answer with: yes/no/idk*

Progress: Discovery 5/5 completed, Detail 1/5 completed
```

## No Active Requirement

If no requirement is active:
```
No active requirement found.

Use /requirements-start [description] to begin a new requirement gathering session.
```

## Between Phases

If requirement is in analysis phase:
```
📊 Analysis Phase In Progress

Requirement: enhanced-content-analytics

Currently analyzing codebase patterns and generating technical detail questions based on your discovery answers.

This usually completes within a few seconds. The next detail question will appear automatically.

Use /requirements-status for more detailed progress information.
```

## Already Complete

If requirement is complete:
```
✅ Requirement Complete

Requirement: enhanced-content-analytics

All questions have been answered and the final specification has been generated.

📋 Specification: requirements/req-20241118-enhanced-content-analytics/06-requirements-spec.md
🎯 Next Steps: requirements/req-20241118-enhanced-content-analytics/07-implementation-next-steps.md

Use /requirements-end to finalize and start a new requirement.
```

## Answer Directly

After seeing the reminder, answer directly with:
- `yes` or `y` → YES
- `no` or `n` → NO
- `idk` → Uses the smart default for that question

## Quality Control Context

Reminder includes quality control information:
- Shows which phase feeds into mandatory validation
- Indicates upcoming quality control agent usage
- References CLAUDE.md compliance requirements

## Related Commands

- `/requirements-status` - Full status with next actions
- `/requirements-current` - Detailed current requirement view
- Direct answer (yes/no/idk) - Continue with next question
- `/requirements-end` - Complete or cancel requirement

## Implementation Notes

This command:
- Read-only operation (no state changes)
- Safe to run multiple times
- Lightweight alternative to full status
- Focuses purely on current question context
- Perfect for resuming work after interruption

## Use Cases

### Resume After Break
```
# After coming back to work
/requirements-remind
# See current question
yes
# Continue with process
```

### Clarify Question Context
```
# If unsure about question meaning
/requirements-remind
# Re-read context and help text
# Make informed decision
```

### Check Answer Format
```
# If unsure how to answer
/requirements-remind
# See "Answer with: yes/no/idk" reminder
# Answer in correct format
```
>>>>>>> 9752af8 (Claude: Sprint N - Add requirements management framework and slash commands for development workflow automation)
