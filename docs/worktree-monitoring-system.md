# Worktree Monitoring System

Comprehensive monitoring and health check system for the OSA 3-worktree development environment.

## Overview

The OSA project uses a 3-worktree Git setup for efficient parallel development:

- **Main Worktree** (`main` branch): Stable production-ready code
- **Bugfix Worktree** (`bugfix-lab` branch): Hotfix and bugfix development
- **Claude Worktree** (`claude-lab` branch): AI-assisted development and experimentation

The monitoring system ensures all worktrees stay synchronized, healthy, and productive.

## Components

### 1. Core Monitor Script (`worktree-monitor.sh`)

**Purpose**: Real-time monitoring and status reporting
**Location**: `scripts/worktree-monitor.sh`

#### Features
- Real-time health scoring (0-100)
- Worktree status checking (branches, commits, changes)
- Branch divergence analysis
- Automatic issue detection and classification
- JSON output for integration
- Optional auto-fixing of sync issues

#### Usage
```bash
# Basic monitoring report
./scripts/worktree-monitor.sh

# JSON output for automation
./scripts/worktree-monitor.sh --json

# Monitor with automatic fixes
./scripts/worktree-monitor.sh --fix-sync

# Show only alerts and issues
./scripts/worktree-monitor.sh --alerts
```

#### Health Scoring
- **100**: Perfect health, no issues
- **90-99**: Minor issues (uncommitted changes, small divergence)
- **70-89**: Moderate issues requiring attention
- **50-69**: Major issues affecting productivity
- **0-49**: Critical issues requiring immediate intervention

### 2. Health Check System (`worktree-health-check.sh`)

**Purpose**: Automated monitoring, alerting, and maintenance
**Location**: `scripts/worktree-health-check.sh`

#### Features
- Interactive and automated modes
- Desktop notifications (macOS)
- Historical health tracking
- Automated issue resolution
- Cron job setup for continuous monitoring
- Health trend analysis

#### Usage
```bash
# Interactive mode (menu-driven)
./scripts/worktree-health-check.sh

# One-time health check
./scripts/worktree-health-check.sh --schedule

# Health check with auto-fix
./scripts/worktree-health-check.sh --auto-fix

# Health check with notifications
./scripts/worktree-health-check.sh --notify

# Automated mode (for cron jobs)
./scripts/worktree-health-check.sh --schedule --auto-fix
```

## Monitoring Capabilities

### Issue Detection

#### Synchronization Issues
- **Behind Upstream**: Worktree not synced with remote branch
- **Behind Main**: Feature branches lagging behind main branch
- **Far Ahead**: Branches with too many unmerged commits (>10)
- **Far Behind**: Branches significantly out of sync (>5 commits)

#### Work State Issues
- **Uncommitted Changes**: Files modified but not committed
- **Unpushed Commits**: Local commits not pushed to remote
- **Stale Branches**: Branches not updated recently

#### Critical Issues
- **Missing Worktree**: Worktree directory not found
- **Invalid Repository**: Directory exists but not a valid Git repo
- **Rebase Failures**: Automatic synchronization conflicts

### Auto-Fix Capabilities

#### Automatic Fixes (when `--fix-sync` enabled)
- **Bugfix Branch Sync**: Auto-rebase bugfix-lab onto main
- **Configuration Commits**: Auto-commit safe config changes (tsconfig.json)
- **Stash Management**: Preserve uncommitted work during sync operations

#### Manual Intervention Required
- **Merge Conflicts**: Human decision needed for conflict resolution
- **Multiple File Changes**: Complex uncommitted changes
- **Branch Protection**: Important branches with protection rules

## Integration Examples

### 1. Continuous Monitoring (Cron Job)
```bash
# Setup automated monitoring every 30 minutes
./scripts/worktree-health-check.sh
# Select option 4: Setup automated monitoring

# Manual cron setup
*/30 * * * * /path/to/worktree-health-check.sh --schedule --auto-fix >> /tmp/worktree-monitor.log 2>&1
```

### 2. Pre-Development Check
```bash
# Check system health before starting development
./scripts/worktree-monitor.sh
# Review health score and issues

# Auto-fix any sync issues
./scripts/worktree-monitor.sh --fix-sync
```

### 3. CI/CD Integration
```bash
# In your deployment pipeline
health_score=$(./scripts/worktree-health-check.sh --schedule; echo $?)
health_score=$((100 - health_score))

if [ $health_score -lt 80 ]; then
    echo "Worktree health too low for deployment: $health_score"
    exit 1
fi
```

### 4. Development Dashboard
```bash
# JSON output for dashboards
./scripts/worktree-monitor.sh --json | jq '{
    health: .health_score,
    main_status: .worktrees.main.branch + " (" + .worktrees.main.commit + ")",
    issues: .issues | length
}'
```

## Health History Tracking

The system maintains a health log at `.worktree-health.log` with:
- Timestamp of each check
- Health score (0-100)
- Number of issues detected
- Overall status (healthy/warning/critical)

### Viewing History
```bash
# Recent health checks
./scripts/worktree-health-check.sh
# Select option 3: Show health history

# Export health data
./scripts/worktree-health-check.sh
# Select option 5: Export health data
```

## Notification System

### Desktop Notifications (macOS)
```bash
# Enable notifications
./scripts/worktree-health-check.sh --notify

# Notification triggers:
# - Critical health score (<50)
# - Warning health score (<70)
# - Health improvements (>80 after being lower)
```

## Troubleshooting

### Common Issues

#### 1. "Worktree not found" Error
```bash
# Check worktree paths
git worktree list

# Update script paths if needed (edit worktree-monitor.sh)
BUGFIX_WORKTREE="$PROJECT_ROOT/../dev/my-nextjs-app-bugfix"
CLAUDE_WORKTREE="$PROJECT_ROOT/../dev/my-nextjs-app-claude"
```

#### 2. Permission Denied
```bash
# Make scripts executable
chmod +x scripts/worktree-monitor.sh
chmod +x scripts/worktree-health-check.sh
```

#### 3. Missing Dependencies
```bash
# Install jq for JSON processing (optional but recommended)
brew install jq    # macOS
apt install jq     # Ubuntu/Debian
```

#### 4. Bash Version Compatibility
```bash
# Check bash version
bash --version

# The scripts are compatible with Bash 3.2+ (default macOS)
# No special requirements needed
```

### Debug Mode
```bash
# Enable verbose output for debugging
bash -x ./scripts/worktree-monitor.sh
```

## Performance Considerations

- **Lightweight Operations**: Scripts use efficient Git commands
- **Minimal I/O**: JSON output cached, history limited to 100 entries
- **Safe Auto-fixes**: Only performs safe operations, preserves work
- **Resource Friendly**: Suitable for frequent automated execution

## Security Considerations

- **No Sensitive Data**: Scripts don't access or log sensitive information
- **Safe Commands**: Only uses read-only Git commands unless explicitly fixing
- **Preservation First**: Always preserves uncommitted work via stashing
- **User Control**: Auto-fixes require explicit `--fix-sync` flag

## Future Enhancements

### Planned Features
- **Integration Status**: Monitor OPAL integration health
- **Performance Metrics**: Track build times, test performance
- **Conflict Prediction**: Analyze potential merge conflicts
- **Smart Notifications**: Adaptive notification thresholds
- **Web Dashboard**: Browser-based monitoring interface

### Extension Points
- **Custom Hooks**: Add project-specific health checks
- **Integration APIs**: REST endpoints for external monitoring
- **Alerting Integrations**: Slack, email, PagerDuty notifications
- **Analytics**: Long-term health trend analysis

## Related Documentation

- [Git Worktree Documentation](https://git-scm.com/docs/git-worktree)
- [CLAUDE.md - Worktree Management](../CLAUDE.md#worktree--sprint-management)
- [OSA Development Workflow](../README.md#development-workflow)

---

For questions or improvements, please refer to the project's issue tracker or documentation.