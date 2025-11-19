# OPAL Validation Command Cheat Sheet

**Quick Reference**: Production-ready commands for OPAL integration validation across all layers.

**Last Updated**: November 2025
**Systems**: Monitoring, Freshness, Cross-Agent, Force Sync Validation

---

## Table of Contents

1. [Quick Start Commands](#quick-start-commands)
2. [Force Sync Validation Workflow](#force-sync-validation-workflow)
3. [Individual System Commands](#individual-system-commands)
4. [Combined Validation Workflows](#combined-validation-workflows)
5. [Continuous Monitoring](#continuous-monitoring)
6. [Troubleshooting Commands](#troubleshooting-commands)
7. [Production Integration](#production-integration)

---

## Quick Start Commands

### Fastest Health Check (< 30 seconds)
```bash
# Quick health check across all systems
./scripts/opal-validation-unified.sh quick

# Expected output:
# Quick Health Check Completed in 15s
#   Monitoring:   OK
#   Freshness:    OK
#   Cross-Agent:  OK
# Overall Status: HEALTHY
```

### Current Status Dashboard
```bash
# Display aggregated status from all systems
./scripts/opal-validation-unified.sh status

# Shows:
# - Agent Health: 95%
# - Data Freshness: 100%
# - Data Consistency: 85%
# - Context Sharing: 90%
# - Tier Alignment: 100%
```

### Full Comprehensive Validation
```bash
# Run all validation systems (3-5 minutes)
./scripts/opal-validation-unified.sh full

# Validates:
# - Monitoring system (all 5 agents)
# - Data freshness (stale detection)
# - Cross-agent integration (consistency, context, alignment)
# - Generates comprehensive JSON reports
```

---

## Force Sync Validation Workflow

### Complete 4-Layer Validation After Force Sync

**Use Case**: Validate the entire OPAL → OSA → Results pipeline after a Force Sync operation.

```bash
# 1. Trigger Force Sync (via API or UI)
curl -X POST http://localhost:3000/api/force-sync/trigger \
  -H "Content-Type: application/json" \
  -d '{"sync_scope":"quick","triggered_by":"validation_test"}'

# Returns: {"correlation_id": "force-sync-1731859200-abc123", ...}

# 2. Validate complete pipeline with correlation ID
./scripts/opal-validation-unified.sh force-sync force-sync-1731859200-abc123

# Validates all 4 layers:
# Layer 1: Force Sync orchestration
# Layer 2: OPAL agents execution (9 agents)
# Layer 3: OSA data ingestion (reception rate)
# Layer 4: Results generation
```

**Expected Output**:
```
Force Sync Validation Results
  Correlation ID:  force-sync-1731859200-abc123
  Duration:        45s
  Overall Status:  HEALTHY

  Layer 1 (Force Sync):    OK
  Layer 2 (OPAL Agents):   OK
  Layer 3 (OSA Ingestion): OK (100% reception)
  Layer 4 (Results):       OK
```

**Exit Codes**:
- `0`: HEALTHY - All layers validated successfully
- `1`: DEGRADED - Some layers have issues but system operational
- `2`: FAILED - Critical failures detected

---

## Individual System Commands

### 1. Monitoring System

**Purpose**: Validate OPAL agent health, data availability, and quality scores.

```bash
# Generate health dashboard for all agents
./scripts/opal-monitoring-system.sh dashboard

# Check specific agent health
./scripts/opal-monitoring-system.sh check audience_suggester

# Analyze performance trends (last 7 days)
./scripts/opal-monitoring-system.sh trends 7

# Start continuous monitoring (every 5 minutes)
./scripts/opal-monitoring-system.sh monitor
```

**Key Metrics**:
- Agent health percentage (target: > 95%)
- Data quality scores (0-100)
- Data age in hours
- Segments count and performance availability

**Output Location**: `./logs/monitoring/`

---

### 2. Data Freshness Optimizer

**Purpose**: Detect stale agent data and trigger automated refresh operations.

```bash
# Check freshness for all agents
./scripts/opal-data-freshness-optimizer.sh check

# Check specific agent freshness
./scripts/opal-data-freshness-optimizer.sh agent audience_suggester

# Refresh stale agents automatically
./scripts/opal-data-freshness-optimizer.sh refresh

# Start scheduled optimization (every 30 minutes)
./scripts/opal-data-freshness-optimizer.sh schedule 1800
```

**Freshness Thresholds**:
- **FRESH**: < 24 hours old (default threshold)
- **STALE**: 24-72 hours old (triggers refresh recommendation)
- **CRITICAL**: > 72 hours old (triggers immediate refresh)

**Refresh Methods** (tried in order):
1. Direct agent refresh endpoint
2. OPAL workflow trigger
3. Force Sync endpoint

**Output Location**: `./logs/freshness/`

---

### 3. Cross-Agent Validator

**Purpose**: Test data consistency, workflow context sharing, and Results tier alignment.

```bash
# Run comprehensive cross-agent validation
./scripts/opal-cross-agent-validator.sh full

# Quick validation (fast check)
./scripts/opal-cross-agent-validator.sh quick

# Test data consistency only
./scripts/opal-cross-agent-validator.sh consistency

# Validate workflow context sharing
./scripts/opal-cross-agent-validator.sh context

# Check Results tier alignment
./scripts/opal-cross-agent-validator.sh alignment

# Generate comprehensive report from latest results
./scripts/opal-cross-agent-validator.sh report
```

**Validation Types**:

1. **Data Consistency**: Validates agent data age, segments, quality scores
2. **Context Sharing**: Tests cross-references between agents, shared insights
3. **Tier Alignment**: Validates Results page tier assignments (strategy, insights, optimization, dxptools)

**Output Location**: `./logs/cross-agent/`

---

## Combined Validation Workflows

### Daily Health Check (Production)
```bash
#!/bin/bash
# Daily comprehensive validation
# Run: 0 2 * * * (2 AM daily)

echo "Starting daily OPAL validation..."

# 1. Quick health check
./scripts/opal-validation-unified.sh quick

# 2. Check and refresh stale data
./scripts/opal-data-freshness-optimizer.sh check
./scripts/opal-data-freshness-optimizer.sh refresh

# 3. Full validation once per day
./scripts/opal-validation-unified.sh full

# 4. Send summary report
./scripts/opal-validation-unified.sh status | mail -s "OPAL Daily Health Report" team@example.com
```

### Pre-Production Deployment Validation
```bash
#!/bin/bash
# Pre-deployment validation checklist
# Run before any production deployment

echo "Pre-deployment OPAL validation..."

# 1. Full comprehensive validation
if ! ./scripts/opal-validation-unified.sh full; then
    echo "ERROR: Full validation failed - BLOCKING DEPLOYMENT"
    exit 1
fi

# 2. Force Sync test (if applicable)
# Trigger test Force Sync and validate
CORRELATION_ID=$(curl -s -X POST http://localhost:3000/api/force-sync/trigger \
  -H "Content-Type: application/json" \
  -d '{"sync_scope":"quick"}' | jq -r '.correlation_id')

sleep 60  # Wait for workflow completion

if ! ./scripts/opal-validation-unified.sh force-sync "$CORRELATION_ID"; then
    echo "ERROR: Force Sync validation failed - BLOCKING DEPLOYMENT"
    exit 1
fi

# 3. Cross-agent integration test
if ! ./scripts/opal-cross-agent-validator.sh full; then
    echo "WARNING: Cross-agent validation issues detected"
    # Non-blocking but logged
fi

echo "✅ Pre-deployment validation PASSED"
exit 0
```

### Incident Response Validation
```bash
#!/bin/bash
# Quick incident response validation
# Use when investigating production issues

echo "Incident response validation..."

# 1. Quick health check
./scripts/opal-validation-unified.sh quick

# 2. Check recent Force Sync status
curl -s http://localhost:3000/api/admin/osa/recent-status | jq '.data'

# 3. Agent-by-agent validation
for agent in audience_suggester geo_audit content_optimizer strategy_assistant performance_analyzer; do
    echo "Checking $agent..."
    ./scripts/opal-monitoring-system.sh check "$agent"
done

# 4. Check data freshness
./scripts/opal-data-freshness-optimizer.sh check

# 5. Validate cross-agent consistency
./scripts/opal-cross-agent-validator.sh consistency
```

---

## Continuous Monitoring

### Start Continuous Monitoring (Production)
```bash
# Monitor every 5 minutes (300 seconds)
./scripts/opal-validation-unified.sh monitor 300

# Monitor every 10 minutes (600 seconds)
./scripts/opal-validation-unified.sh monitor 600

# Run in background with log file
nohup ./scripts/opal-validation-unified.sh monitor 300 > monitoring.log 2>&1 &
```

### Monitoring with Alerting (Slack/Teams)
```bash
# Set alert webhook for critical issues
export ALERT_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Start monitoring with alerting
./scripts/opal-monitoring-system.sh monitor

# Critical alerts will be sent to webhook:
# - Data freshness > 48 hours
# - Quality score < 50
# - Agent health failures
```

---

## Troubleshooting Commands

### Diagnose Force Sync Failures

**Problem**: Force Sync initiated but no data in OSA.

```bash
# 1. Check Force Sync orchestration
curl -s http://localhost:3000/api/admin/osa/recent-status | jq '.data.lastForceSyncAt'

# 2. Check OPAL agent execution
./scripts/opal-monitoring-system.sh dashboard

# 3. Check OSA ingestion rate
./scripts/opal-validation-unified.sh force-sync <correlation_id>

# 4. Validate Results generation
./scripts/opal-cross-agent-validator.sh quick
```

### Diagnose Stale Data Issues

**Problem**: Agent data is stale despite recent Force Sync.

```bash
# 1. Check all agents for staleness
./scripts/opal-data-freshness-optimizer.sh check

# 2. Identify which agents are stale
for agent in audience_suggester geo_audit content_optimizer strategy_assistant performance_analyzer; do
    echo "Checking $agent..."
    ./scripts/opal-data-freshness-optimizer.sh agent "$agent"
done

# 3. Attempt automated refresh
./scripts/opal-data-freshness-optimizer.sh refresh

# 4. Validate refresh success
sleep 60
./scripts/opal-data-freshness-optimizer.sh check
```

### Diagnose Cross-Agent Inconsistencies

**Problem**: Agents report conflicting data or misaligned tiers.

```bash
# 1. Test data consistency
./scripts/opal-cross-agent-validator.sh consistency

# 2. Validate workflow context sharing
./scripts/opal-cross-agent-validator.sh context

# 3. Check Results tier alignment
./scripts/opal-cross-agent-validator.sh alignment

# 4. Generate comprehensive diagnostic report
./scripts/opal-cross-agent-validator.sh full
./scripts/opal-cross-agent-validator.sh report
```

### Check Validation Logs

```bash
# View today's unified validation logs
tail -f ./logs/unified-validation/unified_$(date +%Y%m%d).log

# View monitoring system logs
tail -f ./logs/monitoring/monitoring_$(date +%Y%m%d).log

# View freshness optimizer logs
tail -f ./logs/freshness/freshness_$(date +%Y%m%d).log

# View cross-agent validator logs
tail -f ./logs/cross-agent/cross_validation_$(date +%Y%m%d).log

# View all critical alerts
grep "CRITICAL" ./logs/**/*_$(date +%Y%m%d).log
```

---

## Production Integration

### CI/CD Pipeline Integration

**GitHub Actions Example**:
```yaml
name: OPAL Validation

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Quick Health Check
        run: |
          ./scripts/opal-validation-unified.sh quick

      - name: Full Validation
        if: github.event_name == 'schedule'
        run: |
          ./scripts/opal-validation-unified.sh full

      - name: Upload Reports
        uses: actions/upload-artifact@v3
        with:
          name: validation-reports
          path: logs/**/*.json
```

### Vercel Deployment Hook

**Post-Deployment Validation**:
```bash
# vercel.json
{
  "hooks": {
    "post-deploy": "./scripts/post-deploy-validation.sh"
  }
}

# scripts/post-deploy-validation.sh
#!/bin/bash
set -e

echo "Post-deployment OPAL validation..."

# Wait for services to stabilize
sleep 30

# Run quick validation
./scripts/opal-validation-unified.sh quick

# If validation fails, alert team
if [ $? -ne 0 ]; then
    curl -X POST "$ALERT_WEBHOOK" \
      -H "Content-Type: application/json" \
      -d '{"text":"⚠️ Post-deployment OPAL validation FAILED"}'
fi
```

### Cron Job Setup

**Production Server Cron Jobs**:
```cron
# Edit crontab: crontab -e

# Quick health check every 5 minutes
*/5 * * * * /path/to/scripts/opal-validation-unified.sh quick >> /var/log/opal-quick.log 2>&1

# Full validation daily at 2 AM
0 2 * * * /path/to/scripts/opal-validation-unified.sh full >> /var/log/opal-full.log 2>&1

# Freshness check and refresh every hour
0 * * * * /path/to/scripts/opal-data-freshness-optimizer.sh check && /path/to/scripts/opal-data-freshness-optimizer.sh refresh >> /var/log/opal-freshness.log 2>&1

# Cross-agent validation every 6 hours
0 */6 * * * /path/to/scripts/opal-cross-agent-validator.sh full >> /var/log/opal-cross-agent.log 2>&1
```

---

## Environment Variables

### Global Configuration
```bash
# OSA base URL
export OSA_BASE_URL="http://localhost:3000"

# Log directory (creates if not exists)
export OSA_LOG_DIR="./logs/unified-validation"

# Validation timeout (seconds)
export VALIDATION_TIMEOUT="120"

# Monitoring interval (seconds)
export MONITOR_INTERVAL="300"

# Data freshness thresholds (hours)
export MAX_DATA_AGE_HOURS="24"
export CRITICAL_DATA_AGE_HOURS="72"

# Refresh settings
export REFRESH_TIMEOUT="300"
export CONCURRENT_REFRESHES="3"

# Alert webhook (optional)
export ALERT_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Quality thresholds
export QUALITY_THRESHOLD="50"
export DATA_FRESHNESS_THRESHOLD="48"
```

### Production Environment Variables (.env.production)
```bash
# Production OPAL validation settings
OSA_BASE_URL=https://osa-production.example.com
OSA_LOG_DIR=/var/log/opal-validation
ALERT_WEBHOOK=https://hooks.slack.com/services/PROD/ALERT/WEBHOOK
MAX_DATA_AGE_HOURS=12
CRITICAL_DATA_AGE_HOURS=24
QUALITY_THRESHOLD=70
```

---

## Performance & Resource Usage

### System Requirements

**Minimum**:
- CPU: 1 core
- Memory: 512 MB
- Disk: 1 GB for logs (rotated)
- Network: Stable connection to OSA endpoints

**Recommended**:
- CPU: 2 cores (for parallel validation)
- Memory: 1 GB
- Disk: 5 GB for logs (30-day retention)
- Network: Low-latency connection

### Performance Benchmarks

**Quick Health Check**: 15-30 seconds
- Parallel execution of 3 quick checks
- No disk writes (except logs)
- Minimal memory footprint

**Full Validation**: 3-5 minutes
- Sequential validation of all systems
- Generates JSON reports
- Memory: ~200 MB peak

**Force Sync Validation**: 45-90 seconds
- Waits for workflow completion
- 4-layer validation
- Network-dependent

**Continuous Monitoring**: Negligible overhead
- Runs quick checks at intervals
- No persistent processes
- Log rotation recommended

---

## Report Formats

### JSON Report Structure

**Unified Validation Report**:
```json
{
  "validation_metadata": {
    "timestamp": "2025-11-19T10:30:00Z",
    "validation_type": "full_comprehensive",
    "base_url": "http://localhost:3000"
  },
  "monitoring": {
    "health_percentage": 95,
    "agent_health": { /* per-agent status */ }
  },
  "freshness": {
    "fresh_percentage": 100,
    "agent_freshness": { /* per-agent age */ }
  },
  "cross_agent": {
    "consistency_percentage": 85,
    "integration_percentage": 90,
    "alignment_percentage": 100
  },
  "summary": {
    "overall_status": "HEALTHY",
    "duration_seconds": 180,
    "monitoring_passed": true,
    "freshness_passed": true,
    "cross_agent_passed": true
  }
}
```

**Force Sync Validation Report**:
```json
{
  "validation_metadata": {
    "correlation_id": "force-sync-1731859200-abc123",
    "timestamp": "2025-11-19T10:35:00Z",
    "duration_seconds": 45
  },
  "layer_validation": {
    "layer1_force_sync": "OK",
    "layer2_opal_agents": "OK",
    "layer3_osa_ingestion": {
      "status": "OK",
      "reception_rate": 100
    },
    "layer4_results": "OK"
  },
  "overall_status": "HEALTHY"
}
```

---

## Best Practices

### Frequency Recommendations

**Production**:
- Quick health check: Every 5 minutes
- Full validation: Daily at off-peak hours (2 AM)
- Freshness refresh: Every hour
- Cross-agent validation: Every 6 hours
- Force Sync validation: After every Force Sync operation

**Development**:
- Quick health check: Every 15 minutes
- Full validation: Before major commits
- Freshness refresh: Manual on-demand
- Cross-agent validation: Before PR merge

### Alert Thresholds

**Critical Alerts** (immediate action required):
- Agent health < 80%
- Data age > 72 hours
- OSA reception rate < 50%
- Force Sync failures

**Warning Alerts** (investigate within 24h):
- Agent health 80-95%
- Data age 24-72 hours
- OSA reception rate 50-80%
- Low confidence scores < 50

### Log Retention

**Production**:
- JSON reports: 90 days
- Log files: 30 days (with rotation)
- Critical alerts: 1 year

**Development**:
- JSON reports: 7 days
- Log files: 3 days
- Alerts: 30 days

---

## Troubleshooting FAQ

### Q: Validation times out frequently
**A**: Increase `VALIDATION_TIMEOUT` environment variable or check network connectivity to OSA endpoints.

### Q: Agent refresh fails with "all methods failed"
**A**: Verify that Force Sync endpoint is accessible and OPAL API URL is configured correctly.

### Q: Cross-agent validation shows low consistency
**A**: Check if agents have significantly different `lastUpdated` timestamps. May need Force Sync to synchronize data.

### Q: Reports show "No data" for some systems
**A**: Run individual system commands first to generate baseline reports before using unified interface.

### Q: High memory usage during full validation
**A**: This is expected behavior. Full validation processes large datasets. Consider increasing system memory or running validation during off-peak hours.

---

## Additional Resources

- **OPAL Integration Validator Patterns**: `docs/opal-integration-validator-patterns.md`
- **Quality Control Framework**: `docs/quality-control-framework-gotchas.md`
- **Comprehensive Results Architecture**: `docs/comprehensive-results-architecture-patterns.md`
- **Individual System Help**:
  - `./scripts/opal-monitoring-system.sh help`
  - `./scripts/opal-data-freshness-optimizer.sh help`
  - `./scripts/opal-cross-agent-validator.sh help`

---

*This cheat sheet is maintained alongside the unified validation system. Update commands and examples when system capabilities change.*
