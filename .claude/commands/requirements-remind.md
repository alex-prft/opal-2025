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