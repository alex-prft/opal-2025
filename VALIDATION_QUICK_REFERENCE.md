# OPAL Integration Validator - Quick Reference Card

## Validation Status: ws_abc123

**Overall:** 🔴 RED | **Confidence:** 0/100 | **Validated:** 2025-11-17 14:25:00 UTC

---

## Quick Commands

### Run Validation
```bash
npx tsx scripts/validate-force-sync-workflow.ts ws_abc123
```

### Seed Test Data
```bash
npx tsx scripts/seed-test-force-sync.ts
```

### Check Integration Status
```bash
curl -s http://localhost:3000/api/admin/osa/integration-status?forceSyncWorkflowId=ws_abc123 | jq
```

### View Recent OSA Status
```bash
curl -s http://localhost:3000/api/admin/osa/recent-status | jq
```

---

## Layer Status Summary

| Layer | Status | Confidence | Issue |
|-------|--------|------------|-------|
| 1️⃣ Force Sync | ❌ FAIL | 0% | No database record found |
| 2️⃣ OPAL Agents | ⚠️ UNKNOWN | N/A | Pending Layer 1 data |
| 3️⃣ OSA Ingestion | ⚠️ UNKNOWN | N/A | Pending Layer 1-2 data |
| 4️⃣ Results Layer | ⚠️ UNKNOWN | N/A | Pending Layer 1-3 data |

---

## Critical Issue

**Force Sync workflow record NOT FOUND in database**

- Table: `force_sync_runs`
- Workflow ID: `ws_abc123`
- Root Cause: Webhook not persisting data

---

## Immediate Actions

### 1. Verify Webhook Endpoint Exists
```bash
# Check if endpoint is implemented
curl -X POST http://localhost:3000/api/webhooks/force-sync-completed \
  -H "Content-Type: application/json" \
  -d '{"workflowId":"ws_abc123","status":"completed"}'
```

### 2. Seed Test Data
```bash
npx tsx scripts/seed-test-force-sync.ts
```

### 3. Re-run Validation
```bash
npx tsx scripts/validate-force-sync-workflow.ts ws_abc123
```

### 4. Verify Database Records
```sql
SELECT * FROM force_sync_runs 
WHERE force_sync_workflow_id = 'ws_abc123';
```

---

## Expected Green Status

### Layer 1: Force Sync
- ✅ Workflow record exists in `force_sync_runs`
- ✅ Status: `completed`
- ✅ Agent count: `9`
- ✅ Execution time: `< 90 seconds`

### Layer 2: OPAL Agents
- ✅ All 9 agents responded
- ✅ `agentResponseCount: 9`
- ✅ All agent statuses: `success`
- ✅ No repeated errors

### Layer 3: OSA Ingestion
- ✅ Reception rate: `≥80%`
- ✅ Signature validation rate: `≥90%`
- ✅ Recent webhook activity: `< 10 minutes`
- ✅ 9/9 agents received by OSA

### Layer 4: Results
- ✅ Overall status: `healthy`
- ✅ Error rate: `< 10%`
- ✅ Signature valid rate: `> 90%`
- ✅ Recommendations generated

---

## Confidence Scoring

| Score | Status | Meaning |
|-------|--------|---------|
| 80-100 | 🟢 GREEN | All layers healthy |
| 50-79 | 🟡 YELLOW | Partial failures |
| 0-49 | 🔴 RED | Critical issues |

**Current Score:** 0/100 (Cannot validate without database records)

---

## Key Files

### Validation System
- `/src/lib/opal/integration-validator.ts` - Core validation logic
- `/src/lib/webhook/force-sync-validator.ts` - Event handler
- `/src/app/api/admin/osa/integration-status/route.ts` - API endpoint

### Database
- `/supabase/migrations/20241117000007_opal_integration_validation.sql` - Schema

### Scripts
- `/scripts/validate-force-sync-workflow.ts` - Validation script
- `/scripts/seed-test-force-sync.ts` - Test data seeding

### Documentation
- `/VALIDATION_REPORT_ws_abc123.md` - Detailed analysis
- `/VALIDATION_FLOW_DIAGRAM.txt` - Visual flow diagram
- `/VALIDATION_SUMMARY.txt` - Executive summary

---

## Database Queries

### Get Latest Validation
```sql
SELECT * FROM opal_integration_validation
WHERE force_sync_workflow_id = 'ws_abc123'
ORDER BY validated_at DESC
LIMIT 1;
```

### Get Pending Workflows
```sql
SELECT * FROM force_sync_runs
WHERE status = 'completed'
  AND validation_status = 'pending'
ORDER BY completed_at DESC;
```

### Get Recent Validations
```sql
SELECT
  force_sync_workflow_id,
  overall_status,
  summary,
  validated_at
FROM opal_integration_validation
ORDER BY validated_at DESC
LIMIT 10;
```

---

## Required Agents (9)

1. `integration_health` - System health
2. `content_review` - Content audit
3. `geo_audit` - Geographic targeting
4. `experimentation_strategy` - A/B testing
5. `personalization_roadmap` - Personalization
6. `content_optimization` - Content performance
7. `audience_segmentation` - Audience analysis
8. `tech_stack_assessment` - Technology review
9. `quick_wins_identification` - Quick wins

---

## Troubleshooting

### No Database Record
1. Check webhook delivery logs
2. Verify `ForceSyncValidator.recordForceSyncRun()` executes
3. Check database RLS policies
4. Verify correct workflow ID

### Low Reception Rate
1. Review webhook signature validation
2. Check network connectivity
3. Verify OSA ingestion endpoint health
4. Review `send_data_to_osa_enhanced` tool calls

### High Error Rate
1. Check application logs for failures
2. Review Results layer error patterns
3. Verify OPAL health status
4. Check database connection health

---

## Next Steps

### Today
- [ ] Verify webhook endpoint implementation
- [ ] Seed test data
- [ ] Re-run validation
- [ ] Confirm database records

### This Week
- [ ] Deploy webhook endpoint to production
- [ ] Configure cron job fallback
- [ ] Add admin dashboard integration
- [ ] Monitor validation metrics

### This Month
- [ ] Establish SLA monitoring (>95% green)
- [ ] Implement alerting for red status
- [ ] Create analytics dashboard
- [ ] Optimize validation performance (<5s)

---

**Generated:** 2025-11-17 14:25:00 UTC  
**Workflow:** ws_abc123  
**Status:** 🔴 RED (Critical - No Database Record)  
**Action Required:** Implement Force Sync webhook persistence
