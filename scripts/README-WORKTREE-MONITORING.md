# Worktree Monitoring Quick Reference

## 📊 Current Status

```bash
# Quick health check
npm run worktree:monitor

# JSON output (for automation)
npm run worktree:monitor:json

# Check and auto-fix issues
npm run worktree:monitor:fix
```

## 🏥 Health Management

```bash
# Interactive health system
npm run worktree:health

# Auto-fix detected issues
npm run worktree:health:auto

# Enable desktop notifications
npm run worktree:health:notify

# Silent mode (for cron jobs)
npm run worktree:health:schedule
```

## 🚨 What Gets Monitored

### ✅ Health Indicators (95/100 = Current Status)
- **Worktree Existence**: All 3 worktrees present and valid
- **Sync Status**: Branches in sync with upstream
- **Work State**: Clean working directories
- **Branch Divergence**: Feature branches not too far from main

### ⚠️ Current Issues Detected
- Main worktree has 2 uncommitted changes (tsconfig.json changes)
- Bugfix-lab is 5 commits behind main

### 🔧 Auto-Fix Capabilities
- **Sync bugfix-lab** with main (rebase)
- **Commit safe config changes** (tsconfig.json)
- **Stash work** before sync operations

## 📈 Health Scoring

| Score | Status | Action Needed |
|-------|--------|--------------|
| 90-100 | 🟢 Healthy | Continue development |
| 70-89 | 🟡 Warning | Review issues, plan fixes |
| 50-69 | 🟠 Major Issues | Address before deployment |
| 0-49 | 🔴 Critical | Immediate attention required |

## 🔄 Automated Monitoring Setup

```bash
# Setup continuous monitoring (every 30 minutes)
npm run worktree:health
# Select option 4: Setup automated monitoring

# Manual cron job
*/30 * * * * cd /path/to/project && npm run worktree:health:schedule >> /tmp/worktree.log 2>&1
```

## 🎯 Common Use Cases

### Pre-Development Check
```bash
# Before starting work
npm run worktree:monitor
# Review any issues, then:
npm run worktree:monitor:fix
```

### Pre-Deployment Validation
```bash
# Check system health before deployment
health_score=$(npm run worktree:health:schedule; echo $?)
if [ $((100 - $health_score)) -lt 80 ]; then
  echo "Worktree health too low for deployment"
  exit 1
fi
```

### CI/CD Integration
```bash
# In your deployment pipeline
npm run worktree:monitor:json | jq '.health_score'
```

### Development Dashboard
```bash
# Get current status for dashboards
npm run worktree:monitor:json | jq '{
  health: .health_score,
  main: .worktrees.main.branch + " (" + .worktrees.main.commit + ")",
  bugfix: .worktrees.bugfix.branch + " (behind: " + (.worktrees.bugfix.behind_main | tostring) + ")",
  claude: .worktrees.claude.branch + " (" + .worktrees.claude.commit + ")",
  issues: .issues | length
}'
```

## 🛠️ Troubleshooting

### "Worktree not found" Error
```bash
# Check actual worktree paths
git worktree list

# Update script if needed (edit scripts/worktree-monitor.sh)
```

### Health Score Suddenly Low
```bash
# Get detailed issues
npm run worktree:monitor

# Auto-fix what's possible
npm run worktree:monitor:fix

# Manual review for complex issues
git status  # in each worktree
```

### Automated Monitoring Not Working
```bash
# Check cron jobs
crontab -l | grep worktree

# Check logs
tail -f /tmp/worktree-monitor.log
```

## 📱 Desktop Notifications (macOS)

Enable notifications to get alerts when health drops below threshold:
```bash
npm run worktree:health:notify
```

Notification triggers:
- Critical health (<50): Immediate alert
- Warning health (<70): Standard alert
- Health improved (>80): Positive notification

## 🔗 Related Commands

```bash
# Git worktree management
git worktree list          # View all worktrees
git worktree prune         # Clean up invalid worktrees

# Health history
npm run worktree:health    # Interactive mode -> option 3

# Export health data
npm run worktree:health    # Interactive mode -> option 5
```

---

**Current System Status**: 95/100 Health Score
**Last Updated**: $(date)
**Issues**: 1 (uncommitted changes in main)
**Recommendation**: Run `npm run worktree:monitor:fix` to auto-commit safe config changes