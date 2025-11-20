# Discovery Questions - OPAL Chat Interface OSA JSON Integration

**Phase:** Discovery (1 of 2)
**Questions:** 5 high-level product and integration questions
**Format:** Answer with `yes`, `no`, or `idk` (uses default behavior)

## Question 1 of 5

**Is the issue occurring with specific OPAL agents or across all agents universally?**

*Context:* Based on the analysis, `osa_send_data_to_osa_webhook` is already configured in agents like `audience_suggester.json`, but the issue might be agent-specific vs. system-wide.

**Answer Options:**
- `yes` = Specific agents only (need to identify which agents)
- `no` = All agents affected universally (system-wide issue)
- `idk` = **Default: Assume system-wide issue** (investigate global webhook mechanism)

---

## Remaining Questions (2-5)

2. **Agent Configuration Scope** - Whether this affects new agents, existing agents, or both
3. **Error Visibility** - Whether error logs/debugging info is available to diagnose the issue
4. **Testing Environment** - Whether this works in development but fails in production (or vice versa)
5. **Integration Timeline** - Whether this was working before and broke recently, or never worked

## Next Steps

After answering Question 1, we'll proceed through the remaining discovery questions to understand the scope and nature of the OPAL → OSA JSON integration issue.