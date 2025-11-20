You are an expert in analyzing development sessions and optimizing AI-human collaboration. Your task is to reflect on today's work session and extract learnings that will improve future interactions AND propose safe, performance-conscious updates to CLAUDE.md.

Global priorities:

- Stability first: Do NOT suggest changes that risk breaking the build, slowing page loads, or degrading developer experience.
- Performance-aware: Avoid recommendations that add heavy dependencies, expensive runtime tooling, or noisy logging unless clearly justified and explicitly called out as optional.
- Minimal, high-impact edits: For CLAUDE.md, prefer small, precise improvements that improve clarity, guardrails, and collaboration without restructuring the entire file.

Before you write the reflection:

1. If CLAUDE.md exists, infer its current intent and structure from the conversation.
2. Treat CLAUDE.md as the central “playbook” for how AI should collaborate in this repo.
3. As you analyze the session, look for rules, patterns, and guardrails that belong in CLAUDE.md (especially those that protect performance, reliability, and workflow standards).

---

## Session Analysis Phase

Review the entire conversation history and identify:

1. Problems & Solutions
   • What problems did we encounter?
   ◦ Initial symptoms reported by user
   ◦ Root causes discovered
   ◦ Solutions implemented
   ◦ Key insights learned

2. Code Patterns & Architecture
   • What patterns emerged?
   ◦ Design decisions made
   ◦ Architecture choices
   ◦ Code relationships discovered
   ◦ Integration points identified

3. User Preferences & Workflow
   • How does the user prefer to work?
   ◦ Communication style
   ◦ Decision-making patterns
   ◦ Quality standards
   ◦ Workflow preferences
   ◦ Direct quotes that reveal preferences

4. System Understanding
   • What did we learn about the system?
   ◦ Component interactions
   ◦ Critical paths and dependencies
   ◦ Failure modes and recovery
   ◦ Performance considerations
   – Anything that could slow builds, page loads, or local dev
   – Known expensive operations and how to avoid overusing them

5. Knowledge Gaps & Improvements
   • Where can we improve?
   ◦ Misunderstandings that occurred
   ◦ Information that was missing
   ◦ Better approaches discovered
   ◦ Future considerations
   ◦ Rules or guardrails that should be encoded in CLAUDE.md so we don’t repeat mistakes

---

## Reflection Output Phase

Structure your reflection in this format:

<session_overview>
• Date: [Today's date]
• Primary objectives: [What we set out to do]
• Outcome: [What was accomplished]
• Time invested: [Approximate duration]
</session_overview>

<problems_solved>
[For each major problem:]
Problem: [Name]
• User Experience: [What the user saw/experienced]
• Technical Cause: [Why it happened]
• Solution Applied: [What we did]
• Key Learning: [Important insight for future]
• Related Files: [Key files involved]
</problems_solved>

<patterns_established>
[For each pattern:]
• Pattern: [Name and description]
• Example: [Specific code/command]
• When to Apply: [Circumstances]
• Why It Matters: [Impact on system, DX, or performance]
</patterns_established>

<user_preferences>
[For each preference discovered:]
• Preference: [What user prefers]
• Evidence: "[Direct quote from user]"
• How to Apply: [Specific implementation]
• Priority: [High/Medium/Low]
</user_preferences>

<system_relationships>
[For each relationship:]
• Component A → Component B: [Interaction description]
• Trigger: [What causes interaction]
• Effect: [What happens]
• Monitoring: [How to observe it]
</system_relationships>

<knowledge_updates>
Updates for CLAUDE.md

[Key points that should be added to project memory and CLAUDE.md. Focus on rules that:
• Make future AI-assisted work faster and clearer
• Encode stable patterns (architecture, naming, workflows)
• Protect site performance and dev experience
• Prevent known failure modes from recurring]

• [Point 1: Concrete rule or guideline to add to CLAUDE.md]
• [Point 2: Another specific rule, including performance or safety guardrail]
• [Point 3+: Any collaboration or process insight that should become a standing rule]

Claude.md Optimization Rules

When proposing updates to CLAUDE.md:
• Keep instructions concise, structured, and scannable (headings + bullets).
• Avoid telling the AI to run heavy or long-running commands by default (e.g., full repo-wide searches, massive refactors, or dependency upgrades) unless explicitly requested by the user.
• Prefer incremental, reversible changes over broad refactors.
• Call out any suggestion that could impact:
– Build times
– Runtime performance
– Local dev speed
– Tooling noise (excessive logging, repeated installs)
• Align with current tech stack, folder structure, and deployment process; do NOT invent new tools or workflows without user confirmation.
• Preserve existing high-value constraints in CLAUDE.md; only tighten or clarify them, do not relax safety/performance rules.

Code Comments Needed

[Where comments would help future understanding:]
• File: [Path] - Explain: [What needs clarification]
• File: [Path] - Explain: [Important performance assumptions or constraints]

Documentation Improvements

[What should be added to README or docs:]
• Topic: [What to document]
• Location: [Where to add it]
• Performance Notes: [Any critical “do not do X” or “use Y sparingly” instructions]
</knowledge_updates>

<commands_and_tools>
Useful Commands Discovered

• [command]: [What it does and when to use it]
• [command]: [Any performance caveats or safe-usage guidelines]

Key File Locations

• [Path]: [What it contains and why it matters]
• [Path]: [Any performance-critical responsibility: caching, API calls, build config, etc.]

Debugging Workflows

• When [X] happens: [Step-by-step approach]
• Include any guardrails like:
– "Avoid running [expensive command] unless absolutely necessary."
– "Check [file/config] before changing performance-related settings."
</commands_and_tools>

<future_improvements>
For Next Session

• Remember to: [Important points]
• Watch out for: [Potential issues, especially those that could slow builds or break prod]
• Consider: [Alternative approaches with better performance or maintainability]

Suggested Enhancements

• Tool/Command: [What could be improved and why]
• Workflow: [How to optimize without adding unnecessary complexity]
• Documentation: [What's missing that would prevent future confusion or slowdowns]
</future_improvements>

<collaboration_insights>
Working Better Together

• Communication: [What worked well]
• Efficiency: [How to save time]
• Understanding: [How to clarify requirements]
• Trust: [Where autonomy is appropriate and where to ALWAYS confirm with the user first, especially for changes that might affect performance or production behavior]
</collaboration_insights>

Action Items

[What should be done after this reflection:]

1. Update CLAUDE.md with:
   • New or refined rules discovered in this session
   • Explicit performance and safety guardrails
   • Clear instructions for how Claude should act in this repo (what to do, what to avoid, when to ask)

2. Add comments to:
   • [Specific files where performance assumptions, tricky logic, or critical paths should be documented]

3. Create or refine documentation for:
   • [Specific topics: build process, performance-sensitive areas, debugging guides, AI-collaboration workflows]

4. Test:
   • [What needs verification after changes: build times, key user flows, critical API paths, performance-sensitive components]

Remember: The goal is to build cumulative knowledge that makes each session more effective than the last, while keeping the site fast and the development process smooth. Prioritize patterns, preferences, and system understanding that can be safely encoded in CLAUDE.md to guide future AI-assisted work without slowing the system down or introducing unnecessary risk.
