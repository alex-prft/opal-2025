# Results Content Optimizer Scheduling System

## Overview

The Results Content Optimizer Scheduling System provides automated, configurable content optimization across all 88+ Results pages with comprehensive preview/apply modes, detailed logging, and administrative controls.

## Architecture Components

### 1. Schedule Definition
**File**: `results-content-optimizer.schedule.json`
- Cron-based scheduling (daily at 2 AM UTC by default)
- Comprehensive execution configuration with preview/apply modes
- Performance monitoring and error handling specifications
- Notification and rollback configurations

### 2. Admin Configuration
**File**: `results-content-optimizer.config.json`
- Runtime toggles for enable/disable without code changes
- Mode switching between preview and apply
- Execution parameters and safety controls
- Feature flags and maintenance windows

### 3. Enhanced Workflow Integration
**File**: `../opal-workflows/results-content-optimizer.workflow.json`
- Mode detection and configuration loading
- Comprehensive logging integration
- Schedule-aware parameter handling
- Emergency stop and safety mechanisms

## Execution Modes

### Preview Mode (Safe Default)
**Purpose**: Dry-run analysis without making changes

#### What It Does:
- ✅ Scans all 88+ Results pages systematically
- ✅ Analyzes content for language rule violations
- ✅ Identifies Never Blank improvements needed
- ✅ Generates comprehensive diff reports
- ✅ Validates tier-specific content patterns
- ❌ **Does NOT apply changes to live content**
- ❌ **Does NOT update JSON structures**
- ❌ **Does NOT send production notifications**

#### Logging Output:
```json
{
  "execution_id": "preview_2024_11_16_02_00_001",
  "mode": "preview",
  "pages_scanned": 88,
  "pages_requiring_changes": 23,
  "language_violations_found": 15,
  "confidence_improvements_identified": 31,
  "diff_reports_generated": 23,
  "changes_applied": 0,
  "safe_mode": true
}
```

### Apply Mode (Production Updates)
**Purpose**: Live content optimization with real updates

#### What It Does:
- ✅ Scans all 88+ Results pages systematically
- ✅ Analyzes content for optimization opportunities
- ✅ Applies language rule compliance fixes
- ✅ Implements Never Blank improvements
- ✅ Updates ResultsPageContent JSON structures
- ✅ Sends OSA dashboard notifications
- ✅ Generates completion reports

#### Safety Features:
- Pre-execution content backups
- Rollback capability on high error rates
- Confidence validation before applying changes
- Emergency stop functionality

#### Logging Output:
```json
{
  "execution_id": "apply_2024_11_16_02_00_001",
  "mode": "apply",
  "pages_scanned": 88,
  "pages_successfully_optimized": 19,
  "pages_skipped": 4,
  "language_violations_fixed": 12,
  "confidence_improvements_applied": 27,
  "changes_applied": 19,
  "backup_created": true
}
```

## Configuration Management

### Enable/Disable Scheduling
```bash
# Enable automatic daily optimization (starts in preview mode)
curl -X POST "admin-api/schedules/results-optimizer/enable" \
  -H "Authorization: Bearer admin-token"

# Disable automatic scheduling
curl -X POST "admin-api/schedules/results-optimizer/disable" \
  -H "Authorization: Bearer admin-token"
```

### Mode Switching
```bash
# Switch to preview mode (safe for testing)
curl -X PUT "admin-api/schedules/results-optimizer/config" \
  -H "Content-Type: application/json" \
  -d '{"resultsContentOptimizer": {"mode": "preview"}}'

# Switch to apply mode (live updates)
curl -X PUT "admin-api/schedules/results-optimizer/config" \
  -H "Content-Type: application/json" \
  -d '{"resultsContentOptimizer": {"mode": "apply"}}'
```

### Configuration File Toggles
```json
{
  "resultsContentOptimizer": {
    "enabled": true,           // Enable/disable scheduling
    "mode": "preview",         // "preview" or "apply"
    "schedule_settings": {
      "auto_schedule_enabled": true,
      "cron_expression": "0 2 * * *"  // Daily at 2 AM UTC
    }
  }
}
```

## Comprehensive Logging System

### Log Categories

#### 1. Execution Summary Logs
**Location**: `opal-logs/results-content-optimizer/summary/`
**Format**: JSON with execution metadata
```json
{
  "execution_start_time": "2024-11-16T02:00:00Z",
  "execution_end_time": "2024-11-16T02:47:23Z",
  "execution_duration_ms": 2843000,
  "mode": "preview",
  "total_pages_scanned": 88,
  "pages_requiring_changes": 23,
  "language_rule_violations_found": 15,
  "confidence_improvements": 31
}
```

#### 2. Page Scan Detail Logs
**Location**: `opal-logs/results-content-optimizer/pages/`
**Format**: Per-page analysis results
```json
{
  "page_id": "Strategy Plans/OSA/Overview Dashboard",
  "tier": "strategy",
  "scan_timestamp": "2024-11-16T02:03:15Z",
  "current_content_confidence": 35,
  "optimization_required": true,
  "language_violations_detected": ["revenue", "synergy"],
  "never_blank_violations_detected": ["empty_metrics"],
  "tier_alignment_score": 85
}
```

#### 3. Change Detection Logs
**Location**: `opal-logs/results-content-optimizer/changes/`
**Format**: Before/after content diffs
```json
{
  "page_id": "Analytics Insights/Content/Topics",
  "change_type": "language_compliance",
  "change_category": "forbidden_metric_removal",
  "before_content": "Increase revenue by optimizing...",
  "after_content": "Increase performance impact by optimizing...",
  "change_reason": "Removed forbidden metric term: revenue",
  "confidence_before": 45,
  "confidence_after": 72
}
```

#### 4. Error Detail Logs
**Location**: `opal-logs/results-content-optimizer/errors/`
**Format**: Comprehensive error tracking
```json
{
  "page_id": "DXP Tools/CMP/Campaign Performance",
  "error_type": "agent_unavailable",
  "error_message": "cmp_organizer agent not responding",
  "error_timestamp": "2024-11-16T02:15:33Z",
  "retry_count": 2,
  "fallback_applied": true,
  "manual_intervention_required": false
}
```

#### 5. Diff Reports
**Location**: `opal-logs/results-content-optimizer/diffs/`
**Format**: Unified diff format with HTML reports
```diff
--- Strategy Plans/Maturity/Current State Assessment (before)
+++ Strategy Plans/Maturity/Current State Assessment (after)
@@ -15,7 +15,7 @@
   "hero": {
     "title": "Current State Assessment",
-    "promise": "Evaluate your current state to increase revenue potential",
+    "promise": "Evaluate your current state to increase performance impact",
     "metrics": [
```

### Log Analysis & Monitoring

#### Daily Execution Summary
```bash
# View last execution summary
cat opal-logs/results-content-optimizer/summary/latest.json | jq

# Check pages that were changed
cat opal-logs/results-content-optimizer/changes/latest.json | jq '.pages_changed[]'

# Review error patterns
cat opal-logs/results-content-optimizer/errors/latest.json | jq '.error_type' | sort | uniq -c
```

#### Performance Monitoring
```bash
# Execution time trends
grep "execution_duration_ms" opal-logs/results-content-optimizer/summary/*.json | \
  awk -F: '{print $2}' | sort -n

# Success rate analysis
grep "pages_successfully_optimized\|pages_failed" opal-logs/results-content-optimizer/summary/*.json
```

## Administrative Controls

### Emergency Stop
```bash
# Create emergency stop file (halts current and future executions)
touch opal-config/emergency-stop.flag

# Remove emergency stop (resume normal operations)
rm opal-config/emergency-stop.flag
```

### Manual Execution
```bash
# Trigger manual preview run
curl -X POST "opal-api/workflows/results-content-optimizer/trigger" \
  -H "Authorization: Bearer results-content-optimizer-workflow-2025" \
  -d '{"mode": "preview", "scope": "all_results_pages"}'

# Trigger manual apply run (use with caution)
curl -X POST "opal-api/workflows/results-content-optimizer/trigger" \
  -H "Authorization: Bearer results-content-optimizer-workflow-2025" \
  -d '{"mode": "apply", "scope": "all_results_pages"}'
```

### Partial Execution
```bash
# Run optimization for specific tier only
curl -X POST "opal-api/workflows/results-content-optimizer/trigger" \
  -d '{"mode": "preview", "scope": "strategy_plans_only"}'

# Run optimization for specific pages
curl -X POST "opal-api/workflows/results-content-optimizer/trigger" \
  -d '{"mode": "preview", "pages": ["Strategy Plans/OSA/Overview Dashboard"]}'
```

## Safety & Rollback Features

### Automatic Rollback Triggers
- **High Error Rate**: >20% page failures triggers automatic rollback
- **Confidence Degradation**: >15% confidence decrease triggers rollback
- **Structural Integrity Violation**: Any architectural constraint violation

### Backup & Recovery
- **Pre-execution Snapshots**: Complete content backup before apply mode
- **Incremental Backups**: Content changes tracked with restore points
- **Retention Policy**: 7 pre-execution snapshots, 30 incremental backups

### Rollback Procedure
```bash
# View available backups
ls -la opal-logs/results-content-optimizer/backups/

# Restore from specific backup
curl -X POST "admin-api/schedules/results-optimizer/rollback" \
  -d '{"backup_id": "backup_2024_11_16_02_00_pre_execution"}'
```

## Recommended Workflow

### Phase 1: Initial Setup (Preview Mode)
1. **Enable Scheduling**: Set `enabled: true, mode: "preview"`
2. **Monitor Preview Runs**: Review diff reports for 3-5 days
3. **Validate Changes**: Ensure language fixes and improvements are appropriate
4. **Adjust Configuration**: Fine-tune confidence thresholds and parameters

### Phase 2: Gradual Production Rollout
1. **Switch to Apply Mode**: Set `mode: "apply"` after preview validation
2. **Monitor Initial Runs**: Watch first 2-3 apply executions closely
3. **Validate Results**: Confirm content improvements are applied correctly
4. **Full Automation**: Enable auto-scheduling for daily optimization

### Phase 3: Ongoing Operations
1. **Daily Monitoring**: Review execution summaries and error rates
2. **Weekly Analysis**: Analyze trends in confidence improvements and changes
3. **Monthly Optimization**: Adjust parameters based on performance data
4. **Quarterly Review**: Evaluate overall impact and system improvements

## Troubleshooting

### Common Issues

#### High Error Rate (>10%)
```bash
# Check agent health
curl -s "admin-api/opal/agents/health" | jq '.unhealthy_agents[]'

# Review error patterns
grep "error_type" opal-logs/results-content-optimizer/errors/latest.json | sort | uniq -c

# Adjust batch size if timeout issues
# Edit config: "execution_parameters.batch_size": 15
```

#### Low Success Rate (<90%)
```bash
# Check confidence thresholds
grep "confidence_before\|confidence_after" opal-logs/results-content-optimizer/changes/*.json

# Review skipped pages
jq '.pages_skipped[]' opal-logs/results-content-optimizer/summary/latest.json

# Consider lowering confidence_threshold in config
```

#### Performance Issues (>2 hours execution)
```bash
# Monitor memory and CPU usage
grep "memory_usage_peak\|cpu_usage_average" opal-logs/results-content-optimizer/summary/*.json

# Reduce parallel processing
# Edit config: "max_concurrent_optimizations": 2

# Increase timeout limits
# Edit config: "timeout_per_batch_minutes": 90
```

### Emergency Procedures

#### Critical Error During Execution
1. **Immediate Stop**: `touch opal-config/emergency-stop.flag`
2. **Assess Impact**: Check which pages were modified
3. **Rollback if Needed**: Restore from pre-execution backup
4. **Investigate**: Review error logs and agent status
5. **Fix Issues**: Address root cause before re-enabling

#### Unexpected Content Changes
1. **Document Changes**: Export current content state
2. **Compare with Backup**: Identify specific modifications
3. **Selective Rollback**: Restore only problematic pages
4. **Update Rules**: Adjust language rules or validation if needed

## Success Metrics

### Content Quality Improvements
- **Language Compliance**: Target 100% (no forbidden terms)
- **Never Blank Coverage**: Target 100% (all sections provide value)
- **Tier Alignment**: Target 95%+ (content matches tier patterns)
- **Confidence Improvements**: Average +15 points per optimized page

### Operational Excellence
- **Execution Success Rate**: Target 95%+ pages optimized successfully
- **Performance**: Target <2 hours total execution time
- **Error Rate**: Target <5% pages requiring manual intervention
- **Availability**: Target 99%+ scheduled execution success rate

### User Experience Impact
- **Content Clarity**: Improved readability and actionable insights
- **Consistency**: Uniform presentation across all Results tiers
- **Value Delivery**: Every section provides meaningful user value
- **Confidence Context**: Appropriate messaging for data quality levels

This scheduling system provides enterprise-grade automation for Results content optimization while maintaining safety, transparency, and administrative control.