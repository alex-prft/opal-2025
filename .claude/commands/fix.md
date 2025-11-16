# plan for a fix on feature or process

Debug this issue systematically:
View recent errors
Context:

Investigation Protocol:

1. Analyze stack trace - identify actual problem, not just error symptom
2. Trace execution path across files that leads to this error
3. Identify root cause (logic bug, race condition, missing validation, etc.)
4. Explain WHY the bug occurred (architecture gap, edge case, etc.)
5. Propose fix that addresses the root cause
6. Suggest prevention strategy (tests, type guards, updated documentation)
7. Update CLAUDE.md with learnings to prevent similar issues
   Do NOT suggest quick fixes. I need root cause analysis.
