# Sprint Reset - New Sprint Worktree Sync

Sync this current worktree to the latest `origin/main` and start a fresh sprint base.

## Safety Guarantees & Rollback Procedures

**This command is designed with multiple safety layers:**

1. **Work Preservation**: All uncommitted changes are automatically staged and committed with a timestamped message before any destructive operations
2. **Verification Steps**: Git status checks confirm clean state before and after operations
3. **Error Handling**: Each command includes `|| true` fallbacks to prevent script failure
4. **Rollback Capability**: The pre-reset commit can be recovered using `git reflog` if needed

**Emergency Rollback Process:**
```bash
# If you need to recover work after reset:
git reflog                          # Find the "End of sprint" commit hash
git checkout <commit-hash>          # Recover the work
git checkout -b recovery-branch     # Create new branch with recovered work
```

## Command Execution

Assume:
- You are already in the correct project root (this worktree).
- This worktree's current branch is the sprint branch (e.g. `claude-lab`).
- GitHub is already authenticated. Do NOT ask me any questions or for any approvals.

Do the following NOW, without asking for confirmation:

1. **Preserve Work**: If there are uncommitted changes, stage and commit them with a generic end-of-sprint message.
2. **Sync Branch**: Sync the current branch to match `origin/main` exactly.
3. **Update Remote**: Force-push this branch to remote so it becomes a clean copy of `origin/main`.
4. **Verify State**: Verify that the branch is clean and in sync.

## Implementation

Use a single, ready-to-run command sequence like this (adapt it only as needed for this repo):

```bash
git status
git add . || true
git commit -m "End of sprint – snapshot before reset" || true
git fetch origin
CURRENT_BRANCH="$(git branch --show-current)"
git reset --hard origin/main
git push --force-with-lease origin "$CURRENT_BRANCH"
git status
git log -5 --oneline
```

## Performance & Safety Notes

- **Lightweight Operation**: Uses standard Git commands with minimal system impact
- **Port Management**: No port conflicts - this is a pure Git workflow
- **Build Safety**: No build processes affected - only Git state management
- **Rollback Available**: All work is preserved in Git history and can be recovered

## When to Use

- Beginning of new development sprints
- When you need a clean base from `origin/main`
- After completing feature branches that have been merged
- When switching development focus and need fresh environment

Do not ask me anything; just execute the logic above (or a slightly improved version if needed), then briefly summarize what you did and confirm this worktree is now a fresh sprint base from `origin/main`.