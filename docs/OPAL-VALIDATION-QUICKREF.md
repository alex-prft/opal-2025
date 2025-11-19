# OPAL Validation Quick Reference Card

## Most Common Commands (Copy & Paste Ready)

### Quick Health Check (< 30s)
```bash
./scripts/opal-validation-unified.sh quick
```

### Current Status Dashboard
```bash
./scripts/opal-validation-unified.sh status
```

### Validate After Force Sync
```bash
# Replace <correlation_id> with actual ID from Force Sync response
./scripts/opal-validation-unified.sh force-sync <correlation_id>
```

### Full Comprehensive Validation
```bash
./scripts/opal-validation-unified.sh full
```

### Check and Refresh Stale Data
```bash
./scripts/opal-data-freshness-optimizer.sh check
./scripts/opal-data-freshness-optimizer.sh refresh
```

---

## Force Sync Complete Workflow

```bash
# 1. Trigger Force Sync
RESPONSE=$(curl -s -X POST http://localhost:3000/api/force-sync/trigger \
  -H "Content-Type: application/json" \
  -d '{"sync_scope":"quick","triggered_by":"validation"}')

# 2. Extract correlation ID
CORRELATION_ID=$(echo "$RESPONSE" | jq -r '.correlation_id')
echo "Correlation ID: $CORRELATION_ID"

# 3. Wait for workflow to complete (60-90 seconds)
sleep 90

# 4. Validate complete pipeline
./scripts/opal-validation-unified.sh force-sync "$CORRELATION_ID"

# 5. View results
echo "Validation complete. Check logs/unified-validation/ for detailed report."
```

---

## Individual System Commands

### Monitoring System
```bash
# Health dashboard
./scripts/opal-monitoring-system.sh dashboard

# Check specific agent
./scripts/opal-monitoring-system.sh check audience_suggester

# Performance trends
./scripts/opal-monitoring-system.sh trends 7
```

### Freshness Optimizer
```bash
# Check all agents
./scripts/opal-data-freshness-optimizer.sh check

# Refresh stale agents
./scripts/opal-data-freshness-optimizer.sh refresh

# Check specific agent
./scripts/opal-data-freshness-optimizer.sh agent audience_suggester
```

### Cross-Agent Validator
```bash
# Full validation
./scripts/opal-cross-agent-validator.sh full

# Quick check
./scripts/opal-cross-agent-validator.sh quick

# Specific validations
./scripts/opal-cross-agent-validator.sh consistency
./scripts/opal-cross-agent-validator.sh context
./scripts/opal-cross-agent-validator.sh alignment
```

---

## Continuous Monitoring

### Start Background Monitoring
```bash
# Monitor every 5 minutes
nohup ./scripts/opal-validation-unified.sh monitor 300 > monitoring.log 2>&1 &

# Check if running
ps aux | grep opal-validation-unified

# Stop monitoring
pkill -f opal-validation-unified
```

---

## Troubleshooting One-Liners

### Check Recent Force Sync Status
```bash
curl -s http://localhost:3000/api/admin/osa/recent-status | jq '.data | {lastForceSyncAt, lastAgentDataAt, lastWorkflowStatus}'
```

### Validate All Agents Quickly
```bash
for agent in audience_suggester geo_audit content_optimizer strategy_assistant performance_analyzer; do
    echo "=== $agent ===" && ./scripts/opal-monitoring-system.sh check "$agent"
done
```

### Check Data Freshness for All Agents
```bash
for agent in audience_suggester geo_audit content_optimizer strategy_assistant performance_analyzer; do
    curl -s "http://localhost:3000/api/opal/agent-data?agent=$agent" | jq '{agent: "'$agent'", lastUpdated, confidence: .hero.confidence}'
done
```

### View Today's Critical Alerts
```bash
grep "CRITICAL" ./logs/**/*_$(date +%Y%m%d).log
```

### View Latest Validation Report
```bash
ls -t ./logs/unified-validation/*.json | head -1 | xargs cat | jq
```

---

## Environment Setup (Optional)

```bash
# Quick setup with defaults
export OSA_BASE_URL="http://localhost:3000"
export OSA_LOG_DIR="./logs/unified-validation"
export VALIDATION_TIMEOUT="120"

# Production setup
export OSA_BASE_URL="https://osa-production.example.com"
export ALERT_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK"
export MAX_DATA_AGE_HOURS="12"
export QUALITY_THRESHOLD="70"
```

---

## Exit Codes

- **0**: Success / Healthy
- **1**: Warning / Degraded
- **2**: Error / Failed

---

## Log Locations

```bash
# Unified validation logs
./logs/unified-validation/

# Monitoring system logs
./logs/monitoring/

# Freshness optimizer logs
./logs/freshness/

# Cross-agent validator logs
./logs/cross-agent/
```

---

## Production Cron Jobs (Copy to crontab)

```cron
# Quick check every 5 minutes
*/5 * * * * cd /path/to/project && ./scripts/opal-validation-unified.sh quick >> /var/log/opal-quick.log 2>&1

# Full validation daily at 2 AM
0 2 * * * cd /path/to/project && ./scripts/opal-validation-unified.sh full >> /var/log/opal-full.log 2>&1

# Freshness refresh every hour
0 * * * * cd /path/to/project && ./scripts/opal-data-freshness-optimizer.sh refresh >> /var/log/opal-freshness.log 2>&1
```

---

## Help Commands

```bash
# Unified interface help
./scripts/opal-validation-unified.sh help

# Individual system help
./scripts/opal-monitoring-system.sh help
./scripts/opal-data-freshness-optimizer.sh help
./scripts/opal-cross-agent-validator.sh help
```

---

## Common Workflows

### Pre-Deployment Validation
```bash
#!/bin/bash
set -e

echo "Pre-deployment validation..."
./scripts/opal-validation-unified.sh full || exit 1
./scripts/opal-cross-agent-validator.sh full || exit 1
echo "✅ Validation PASSED"
```

### Daily Health Report
```bash
#!/bin/bash
# Run daily at 8 AM

REPORT=$(./scripts/opal-validation-unified.sh status)
echo "Daily OPAL Health Report - $(date)" | mail -s "OPAL Health" team@example.com
echo "$REPORT" | mail -s "OPAL Health Details" team@example.com
```

### Incident Response
```bash
#!/bin/bash
# Quick diagnostic for production issues

echo "1. Quick health check"
./scripts/opal-validation-unified.sh quick

echo "2. Recent status"
curl -s http://localhost:3000/api/admin/osa/recent-status | jq

echo "3. Agent validation"
for agent in audience_suggester geo_audit content_optimizer; do
    ./scripts/opal-monitoring-system.sh check "$agent"
done

echo "4. Data freshness"
./scripts/opal-data-freshness-optimizer.sh check
```

---

**Full Documentation**: See `docs/opal-validation-command-cheatsheet.md` for comprehensive guide.
