# MERGE-WORKFLOW

This document is the **single source of truth** for how branches, sprints, hotfixes, and deployments flow to production.

If you are a human or an AI assistant working in this repo, you **must follow this process** for anything related to merges, releases, or deployments.

---

## 1. Branch Roles

We use a simple, opinionated branching model:

- **`main`**

  - Source of truth for production.
  - Only contains **production-ready** code.
  - Only updated via **Pull Requests** (PRs) from other branches.
  - Protected: no direct pushes, no force-pushes.

- **`claude-lab`**

  - Default lane for **AI-assisted development**, experiments, and normal sprint work.
  - This is where most day-to-day feature work happens.
  - May contain work-in-progress commits.
  - Regularly synced with `main`.

- **`bugfix-lab`**
  - Reserved for **urgent hotfixes** only.
  - Used when a production issue must be resolved quickly and safely.
  - Changes are merged into `main` as small and focused PRs.

---

## 2. Worktree Setup

This repository uses Git worktrees for parallel development:

- **Main Worktree**: `/Users/alexharris/Documents/AI-Dev/my-nextjs-app` (main branch)

  - Stable, production-ready code
  - Used for final merges and production deployments

- **Claude Worktree**: `/Users/alexharris/Documents/AI-Dev/my-nextjs-app-claude` (claude-lab branch)

  - **DEFAULT workspace for AI-assisted development**
  - Where Claude Code operates by default
  - Normal sprint work and experiments

- **Bugfix Worktree**: `/Users/alexharris/Documents/AI-Dev/my-nextjs-app-bugfix` (bugfix-lab branch)
  - Emergency hotfixes only
  - Used only when explicitly working on production issues

---

## 3. Tooling & Automation

- **GitHub CLI**: Available as `gh` for PR creation and review.
- **Existing automation**:
  - `npm run pre-deploy` – Runs comprehensive validation before release
  - `npm run validate:all` – Complete validation suite
  - `npm run validate:security` – Security checks (target: 34/35+)
  - `npm run build` – Production build verification
  - `npm run deploy:prod` – Production deployment script
  - **Vercel deployment**:
    - Production deploys are driven by changes to `main`.
    - Do not deploy from non-`main` branches unless explicitly documented.

Whenever you add or change automation (GitHub Actions, scripts, Vercel configuration), make sure it **respects this branch model**.

---

## 4. General Rules

1. **Do not commit directly to `main`.**

   - All changes must flow through a PR into `main`.

2. **No force pushes to `main`.**

   - `git push --force` or `--force-with-lease` is never allowed on `main`.

3. **Default development branch is `claude-lab`.**

   - For normal work, start from and work on `claude-lab` (or feature branches based on it).

4. **Hotfixes belong in `bugfix-lab`.**

   - Only use `bugfix-lab` when there is a production issue that must be fixed urgently.

5. **Keep branches up to date.**

   - Before opening a PR, ensure `claude-lab` or `bugfix-lab` is rebased/merged on top of the current `main`.

6. **Tests and validation are mandatory before merging to `main`.**
   - At minimum, run:
     - `npm test` (or equivalent)
     - `npm run lint` (if available)
     - `npm run build` (if applicable)
     - `npm run pre-deploy` before final release steps

---

## 5. Normal Sprint Workflow (claude-lab → main)

Use this flow at the end of each sprint or major feature cycle.

### 5.1. Develop on `claude-lab`

- Day-to-day feature work happens on `claude-lab` (or short-lived branches based on it).
- **Claude Code operates in the Claude worktree by default**:

```bash
# Claude Code works here by default:
cd /Users/alexharris/Documents/AI-Dev/my-nextjs-app-claude

# Normal development flow:
git status                          # Check current state
git pull origin claude-lab          # Get latest changes

# Development work...
git add .
git commit -m "Claude: Implement feature X"
git push origin claude-lab
```

### 5.2. Prepare for Sprint Merge

Before merging `claude-lab` into `main`, ensure code quality:

```bash
# In Claude worktree:
cd /Users/alexharris/Documents/AI-Dev/my-nextjs-app-claude

# 1. Sync with main
git fetch origin main
git rebase origin/main              # Clean up commit history

# 2. Run comprehensive validation
npm run pre-deploy                  # Must pass all checks
npm run build                       # Must build successfully

# 3. Push clean history
git push --force-with-lease origin claude-lab
```

### 5.3. Create Pull Request

```bash
# From Claude worktree:
gh pr create \
  --title "Sprint: [Sprint Name/Features]" \
  --body "## Summary
- Feature A: Description
- Feature B: Description

## Validation
- [x] npm run pre-deploy passed
- [x] Production build successful
- [x] Manual testing completed

## Deployment Notes
[Any special deployment considerations]

🤖 Generated with Claude Code" \
  --base main \
  --head claude-lab
```

### 5.4. Merge to Main

After PR approval:

```bash
# Switch to main worktree for merge:
cd /Users/alexharris/Documents/AI-Dev/my-nextjs-app

# Update main and merge
git pull origin main
git merge claude-lab                # Fast-forward merge preferred

# Final validation in main worktree
npm run pre-deploy
npm run build

# Push to trigger production deployment
git push origin main
```

### 5.5. Deploy to Production

```bash
# In main worktree:
cd /Users/alexharris/Documents/AI-Dev/my-nextjs-app

# Deploy to production
npm run deploy:prod

# Or manual Vercel deployment:
export VERCEL_TOKEN="your_token"
export NEXT_PUBLIC_BASE_URL="https://your-domain.vercel.app"
npx vercel --prod --yes

# Verify deployment
curl -I https://your-production-url
```

---

## 6. Hotfix Workflow (bugfix-lab → main)

Use this flow **only** for urgent production issues.

### 6.1. Identify Production Issue

Before starting hotfix:

1. Confirm the issue exists in production
2. Determine if it requires immediate fix (can't wait for next sprint)
3. Switch to bugfix workflow

### 6.2. Develop Hotfix

**Note**: Only use bugfix worktree when explicitly working on production issues.

```bash
# Switch to bugfix worktree:
cd /Users/alexharris/Documents/AI-Dev/my-nextjs-app-bugfix

# Start from latest main
git checkout bugfix-lab
git pull origin main
git reset --hard origin/main        # Ensure clean start

# Apply minimal fix
git add .
git commit -m "HOTFIX: Brief description of fix"

# Critical validation (faster subset of full validation)
npm run validate:security           # Security check
npm run build                      # Ensure it builds
npm test                          # Run tests

git push origin bugfix-lab
```

### 6.3. Emergency PR Creation

```bash
# From bugfix worktree:
gh pr create \
  --title "HOTFIX: [Brief Issue Description]" \
  --body "## Critical Issue
**Problem**: Brief description of production issue
**Impact**: Who/what is affected
**Root Cause**: What caused the issue

## Solution
**Fix**: What was changed
**Validation**: Tests/checks performed

## Deployment
- [x] npm run validate:security passed
- [x] Production build successful
- [x] Critical tests passed

**Priority**: URGENT - Production impact

🚨 Emergency hotfix" \
  --base main \
  --head bugfix-lab
```

### 6.4. Emergency Merge and Deploy

After expedited review:

```bash
# Switch to main worktree:
cd /Users/alexharris/Documents/AI-Dev/my-nextjs-app

# Fast-track merge
git pull origin main
git merge bugfix-lab

# Minimal validation (time-critical)
npm run build
npm run validate:security

# Emergency deploy
git push origin main
npm run deploy:prod

# Verify fix in production
curl -I https://your-production-url
```

### 6.5. Post-Hotfix Cleanup

After hotfix is deployed and verified:

```bash
# Sync claude-lab with hotfix
cd /Users/alexharris/Documents/AI-Dev/my-nextjs-app-claude
git pull origin main
git rebase origin/main

# Clean up bugfix branch
git checkout bugfix-lab
git pull origin main
git reset --hard origin/main
```

---

## 7. Feature Branch Workflow (Optional)

For larger features that need isolation from `claude-lab`:

### 7.1. Create Feature Branch

```bash
# From Claude worktree:
cd /Users/alexharris/Documents/AI-Dev/my-nextjs-app-claude

# Create feature branch from claude-lab
git checkout claude-lab
git pull origin claude-lab
git checkout -b claude/feature-name

# Develop feature...
git add .
git commit -m "Claude: Feature work"
git push -u origin claude/feature-name
```

### 7.2. Merge Feature to claude-lab

```bash
# When feature is complete:
git checkout claude-lab
git pull origin claude-lab
git merge claude/feature-name

# Clean up feature branch
git push origin claude-lab
git branch -d claude/feature-name
git push origin --delete claude/feature-name
```

---

## 8. Automation Requirements

All automation (GitHub Actions, scripts, CI/CD) must respect this workflow:

### 8.1. Branch Protection Rules

- **main**:
  - Require PR reviews
  - Require status checks
  - No direct pushes
  - No force pushes
  - Delete head branches after merge

### 8.2. CI/CD Integration

- **Pull Requests**: Run `npm run pre-deploy` on PR creation/updates
- **Main Branch**: Trigger production deployment on push to main
- **Security Scanning**: Run `npm run validate:security` on all branches

### 8.3. Deployment Automation

```yaml
# Example GitHub Actions workflow
name: Production Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run pre-deploy
      - run: npm run build
      - run: npm run deploy:prod
```

---

## 9. Emergency Procedures

### 9.1. Rollback Production

If production deployment fails:

```bash
# In main worktree:
cd /Users/alexharris/Documents/AI-Dev/my-nextjs-app

# Revert to last known good commit
git log --oneline -10              # Find last good commit
git revert HEAD                    # Or specific commit hash
git push origin main               # Trigger rollback deployment
```

### 9.2. Emergency Branch Recovery

If `main` or critical branches are corrupted:

```bash
# Reset from GitHub remote:
git fetch origin
git reset --hard origin/main       # DANGER: Loses local changes

# Or create new branch from known good state:
git checkout -b emergency-recovery origin/main
```

### 9.3. Worktree Corruption Recovery

If worktrees become inconsistent:

```bash
# Save work first (if possible):
git stash

# Remove corrupted worktree:
git worktree remove /Users/alexharris/Documents/AI-Dev/corrupted-worktree

# Recreate worktree:
git worktree add /Users/alexharris/Documents/AI-Dev/new-worktree branch-name

# Restore work:
git stash pop
```

---

## 10. Validation Checklist

Before any merge to `main`, ensure:

### 10.1. Code Quality

- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] `npm run pre-deploy` passes

### 10.2. Security & Compliance

- [ ] `npm run validate:security` achieves 34/35+ score
- [ ] No hardcoded secrets or test data
- [ ] CLAUDE.md patterns followed

### 10.3. Documentation

- [ ] README updated if needed
- [ ] API documentation current
- [ ] Migration notes added if required

### 10.4. Deployment

- [ ] Environment variables configured
- [ ] Database migrations ready (if applicable)
- [ ] Rollback plan documented

---

## 11. Common Scenarios

### 11.1. "I'm working on a feature in claude-lab, but a hotfix is needed"

1. **Save current work**: Commit WIP in claude-lab
2. **Switch to bugfix workflow**: Use bugfix worktree
3. **Complete hotfix**: Follow hotfix workflow
4. **Resume feature work**: Sync claude-lab with main, continue work

### 11.2. "Claude-lab has conflicts with main"

```bash
# In Claude worktree:
cd /Users/alexharris/Documents/AI-Dev/my-nextjs-app-claude

# Rebase approach (preferred):
git fetch origin main
git rebase origin/main
# Resolve conflicts, then:
git add .
git rebase --continue
git push --force-with-lease origin claude-lab

# Or merge approach:
git merge origin/main
# Resolve conflicts, commit merge
git push origin claude-lab
```

### 11.3. "Need to deploy a specific feature quickly"

1. **Create feature branch** from claude-lab
2. **Complete feature** in isolation
3. **Merge to claude-lab** when ready
4. **Follow normal sprint workflow** to main
5. **Deploy from main** (never deploy feature branches directly)

---

## 12. Tools Integration

### 12.1. GitHub CLI Usage

```bash
# View PRs
gh pr list
gh pr view [number]

# Review PR
gh pr review [number] --approve
gh pr review [number] --request-changes -b "Comments"

# Merge PR
gh pr merge [number] --squash
gh pr merge [number] --rebase
```

### 12.2. Vercel Integration

```bash
# Preview deployments (automatically created for PRs)
gh pr view [number]  # Contains preview URL

# Production deployment (only from main)
git checkout main
git pull origin main
npx vercel --prod --yes
```

### 12.3. Development Server

```bash
# Each worktree can run dev server independently:

# Claude worktree (default port 3000):
cd /Users/alexharris/Documents/AI-Dev/my-nextjs-app-claude
npm run dev

# Main worktree (different port):
cd /Users/alexharris/Documents/AI-Dev/my-nextjs-app
npm run dev -- --port 3001

# Bugfix worktree (different port):
cd /Users/alexharris/Documents/AI-Dev/my-nextjs-app-bugfix
npm run dev -- --port 3002
```

---

## 13. Success Indicators

✅ **Workflow is working correctly when:**

- All production deployments come from `main` branch
- PRs are used for all changes to `main`
- Hotfixes are small, focused, and use `bugfix-lab`
- `claude-lab` stays reasonably current with `main`
- `npm run pre-deploy` passes before all merges
- Production issues can be fixed quickly via hotfix workflow

❌ **Warning signs that workflow is breaking down:**

- Direct commits to `main`
- Force pushes to `main`
- Large/complex hotfixes
- Broken production builds
- Merge conflicts on routine updates
- Skipping validation steps

---

## 14. Disaster Recovery: “Oh no, I touched all 3 branches”

If you accidentally made changes in **all three branches** (`main`, `claude-lab`, and `bugfix-lab`) and things feel messy, use this quick recovery flow to get back to a clean, sane state.

### 14.1 High-level goal

End state:

- `main` = final, production-ready truth
- `claude-lab` = fresh copy of `main` for the next sprint
- `bugfix-lab` = fresh copy of `main` on standby for future emergencies

### 14.2 Recovery steps

From the repo root in each worktree:

1. **Commit everything in all three worktrees**

   In **main worktree**:

   ```bash
   git checkout main
   git status
   git add .
   git commit -m "Main: local changes before recovery"   # if there are changes
   git fetch origin
   git pull origin main
   git push origin main
   ```

---

_This workflow prioritizes production stability while enabling rapid development and emergency response capabilities._
