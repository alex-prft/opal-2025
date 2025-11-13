# OPAL Force Sync Production Runbook

## Overview

This runbook provides comprehensive operational guidance for the OPAL Force Sync system, including deployment procedures, monitoring, troubleshooting, and maintenance tasks.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Environment Setup](#environment-setup)
3. [API Endpoints](#api-endpoints)
4. [Deployment Procedures](#deployment-procedures)
5. [Monitoring & Alerting](#monitoring--alerting)
6. [Troubleshooting Guide](#troubleshooting-guide)
7. [Maintenance Procedures](#maintenance-procedures)
8. [Security Considerations](#security-considerations)
9. [Performance Optimization](#performance-optimization)
10. [Emergency Procedures](#emergency-procedures)

---

## System Architecture

### Core Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client Apps   │───▶│  Force Sync API  │───▶│  OPAL Platform  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │                          │
                              ▼                          ▼
                      ┌──────────────────┐    ┌─────────────────┐
                      │    Database      │    │   Webhook       │
                      │   (Events &      │    │   Events        │
                      │   Workflows)     │    │                 │
                      └──────────────────┘    └─────────────────┘
```

### Key Components

- **Force Sync API**: `/api/opal/sync` - Main entry point for triggering OPAL workflows
- **Orchestration Trigger**: `/api/orchestrations/trigger` - Direct workflow triggering
- **Webhook Receiver**: `/api/webhooks/opal-workflow` - Receives OPAL event callbacks
- **Diagnostics**: `/api/diagnostics/last-webhook` - Monitoring and troubleshooting
- **Replay System**: `/api/orchestrations/replay` - Event replay for recovery

---

## Environment Setup

### Required Environment Variables

#### Production Environment
```bash
# OPAL Configuration
OPAL_WEBHOOK_URL="https://webhook.opal.optimizely.com/webhooks/d3e181a30acf493bb65a5c7792cfeced/ba71d62d-aa74-4bbf-9ab8-a1a11ed4bf14"
OPAL_STRATEGY_WORKFLOW_AUTH_KEY="your-32-character-production-auth-key"
OPAL_WORKSPACE_ID="your-production-workspace-id"

# Security
OSA_WEBHOOK_SHARED_SECRET="your-32-character-hmac-secret"

# Application
NODE_ENV="production"
BASE_URL="https://opal-2025.vercel.app"

# Database (if using Supabase)
DATABASE_URL="postgresql://..."
SUPABASE_SERVICE_KEY="your-service-key"
```

#### Development Environment
```bash
# OPAL Configuration (can use placeholders)
OPAL_WEBHOOK_URL="https://webhook.opal.optimizely.com/webhooks/d3e181a30acf493bb65a5c7792cfeced/ba71d62d-aa74-4bbf-9ab8-a1a11ed4bf14"
OPAL_STRATEGY_WORKFLOW_AUTH_KEY="dev-auth-key-32-characters-minimum"
OPAL_WORKSPACE_ID="default-workspace"

# Security (development)
OSA_WEBHOOK_SHARED_SECRET="dev-webhook-secret-32-characters-min"

# Application
NODE_ENV="development"
BASE_URL="http://localhost:3000"
OPAL_DEBUG_MODE="true"
```

### Environment Validation

Use the built-in validation endpoint:
```bash
curl -X GET http://localhost:3000/api/opal/sync
```

Expected response for valid configuration:
```json
{
  "workflow_security": {
    "allowed_workflow": "strategy_workflow",
    "account_validation": true,
    "security_note": "ONLY strategy_workflow is permitted"
  }
}
```

---

## API Endpoints

### 1. Force Sync (`/api/opal/sync`)

**Primary endpoint for triggering OPAL workflows**

#### Request
```bash
curl -X POST http://localhost:3000/api/opal/sync \
  -H "Content-Type: application/json" \
  -d '{
    "sync_scope": "priority_platforms",
    "client_context": {
      "client_name": "Test Client",
      "industry": "Technology"
    }
  }'
```

#### Success Response
```json
{
  "success": true,
  "sync_id": "internal-workflow-123",
  "correlation_id": "force-sync-1699123456-abc123",
  "message": "Force sync completed successfully",
  "sync_details": {
    "internal_workflow": {
      "enabled": true,
      "workflow_id": "internal-workflow-123"
    },
    "external_opal": {
      "triggered": true,
      "workflow_id": "strategy_workflow_456",
      "ai_agents_count": 9
    }
  }
}
```

### 2. Orchestration Trigger (`/api/orchestrations/trigger`)

**Direct workflow triggering with enhanced control**

#### Request
```bash
curl -X POST http://localhost:3000/api/orchestrations/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_name": "strategy_workflow",
    "session_id": "session_123",
    "client_name": "ACME Corp"
  }'
```

### 3. Webhook Receiver (`/api/webhooks/opal-workflow`)

**Receives callbacks from OPAL platform**

- Handles HMAC signature verification
- Processes workflow events (started, agent_completed, completed, failed)
- Updates database with event information
- Provides fallback/simulation mode for development

### 4. Diagnostics (`/api/diagnostics/last-webhook`)

**Monitoring and troubleshooting endpoint**

#### Usage
```bash
curl -X GET "http://localhost:3000/api/diagnostics/last-webhook?limit=10&status=failed"
```

#### Response
```json
{
  "events": [...],
  "system_health": {
    "webhook_status": "healthy",
    "recent_failure_rate": 2.5,
    "avg_processing_time": 150
  }
}
```

### 5. Replay System (`/api/orchestrations/replay`)

**Event replay for debugging and recovery**

#### Dry Run
```bash
curl -X POST http://localhost:3000/api/orchestrations/replay \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "wf_123",
    "dry_run": true
  }'
```

---

## Deployment Procedures

### Pre-Deployment Checklist

1. **Environment Variables**
   - [ ] All required variables set
   - [ ] Production auth keys configured
   - [ ] Webhook URLs pointing to correct environment
   - [ ] Database connections tested

2. **Configuration Validation**
   ```bash
   npm run test:config
   curl -X GET https://your-app.vercel.app/api/opal/sync
   ```

3. **Security Validation**
   - [ ] HMAC secrets are 32+ characters
   - [ ] Auth keys don't contain placeholder values
   - [ ] HTTPS enforced in production

### Deployment Steps

#### 1. Vercel Deployment
```bash
# Set environment variables
vercel env add OPAL_WEBHOOK_URL
vercel env add OPAL_STRATEGY_WORKFLOW_AUTH_KEY
vercel env add OSA_WEBHOOK_SHARED_SECRET
vercel env add OPAL_WORKSPACE_ID

# Deploy
npx vercel --prod
```

#### 2. Post-Deployment Validation
```bash
# Test Force Sync endpoint
curl -X POST https://your-app.vercel.app/api/opal/sync \
  -H "Content-Type: application/json" \
  -d '{"sync_scope": "priority_platforms"}'

# Check diagnostics
curl https://your-app.vercel.app/api/diagnostics/last-webhook
```

#### 3. Smoke Tests
```bash
# Test webhook receiver
curl -X GET https://your-app.vercel.app/api/webhooks/opal-workflow

# Test orchestration
curl -X GET https://your-app.vercel.app/api/orchestrations/trigger
```

### Rollback Procedures

1. **Immediate Rollback**
   ```bash
   vercel rollback https://your-app.vercel.app --yes
   ```

2. **Environment Variable Rollback**
   ```bash
   vercel env rm PROBLEMATIC_VAR
   vercel env add PREVIOUS_VALUE
   ```

---

## Monitoring & Alerting

### Key Metrics

#### Application Metrics
- **Force Sync Success Rate**: Target >95%
- **OPAL Webhook Response Time**: Target <2000ms
- **Database Connection Health**: Target 100% uptime
- **Event Processing Rate**: Target >99%

#### Business Metrics
- **Workflow Completion Rate**: Target >90%
- **Agent Success Rate**: Target >95%
- **End-to-End Processing Time**: Target <8 minutes

### Monitoring Endpoints

#### Health Check
```bash
curl https://your-app.vercel.app/api/diagnostics/last-webhook
```

#### Performance Metrics
```bash
curl "https://your-app.vercel.app/api/diagnostics/last-webhook?limit=100" | \
  jq '.system_health.avg_processing_time'
```

### Alerting Rules

#### Critical Alerts
- Force Sync success rate <90% over 15 minutes
- No webhook events received in 1 hour
- Database connection failures
- Authentication failures >5 in 10 minutes

#### Warning Alerts
- Force Sync response time >5 seconds
- Event processing backlog >100 events
- Signature verification failures >10%

### Monitoring Dashboard

Create dashboards tracking:
1. **Request Volume**: Force Sync requests per hour
2. **Success Rates**: By endpoint and time period
3. **Response Times**: P50, P95, P99 percentiles
4. **Error Rates**: By error type and status code
5. **Workflow Status**: Active workflows and completion rates

---

## Troubleshooting Guide

### Common Issues

#### 1. Force Sync Returns 500 Error

**Symptoms:**
```json
{
  "success": false,
  "error": "Configuration Error",
  "message": "Environment validation failed"
}
```

**Diagnosis:**
```bash
curl -X GET https://your-app.vercel.app/api/opal/sync
```

**Solutions:**
1. Check environment variables are set correctly
2. Verify OPAL auth key is valid and not expired
3. Confirm workspace ID is configured

#### 2. Webhooks Not Received

**Symptoms:**
- OPAL workflows triggered but no callback events
- Diagnostics show no recent webhook attempts

**Diagnosis:**
```bash
curl "https://your-app.vercel.app/api/diagnostics/last-webhook?limit=50"
```

**Solutions:**
1. Verify OPAL webhook URL is correct
2. Check firewall/network connectivity
3. Validate HMAC signature configuration
4. Review OPAL platform webhook settings

#### 3. Authentication Failures

**Symptoms:**
```json
{
  "error": "Authentication failed",
  "message": "Invalid or missing authentication key"
}
```

**Solutions:**
1. Regenerate OPAL auth key
2. Update environment variables
3. Verify auth key format (32+ characters)
4. Check for special characters in keys

#### 4. Database Connection Issues

**Symptoms:**
- Events not being stored
- Force Sync using file fallbacks

**Diagnosis:**
```bash
# Check database connectivity
curl -X POST https://your-app.vercel.app/api/diagnostics/last-webhook \
  -d '{"action": "test_configuration"}'
```

**Solutions:**
1. Verify DATABASE_URL is correct
2. Check database service status
3. Validate connection pool settings
4. Review database logs for connection errors

### Debugging Tools

#### 1. Enable Debug Mode
```bash
# Set environment variable
OPAL_DEBUG_MODE="true"
```

#### 2. Correlation Tracking
- All requests generate correlation IDs
- Use correlation IDs to trace requests across logs
- Format: `force-sync-{timestamp}-{random}`

#### 3. Event Replay for Testing
```bash
curl -X POST https://your-app.vercel.app/api/orchestrations/replay \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "problematic-workflow-id",
    "dry_run": true
  }'
```

---

## Maintenance Procedures

### Daily Tasks

1. **Health Monitoring**
   ```bash
   curl https://your-app.vercel.app/api/diagnostics/last-webhook | \
     jq '.system_health'
   ```

2. **Event Processing Review**
   - Check for failed events in last 24 hours
   - Review processing times and identify bottlenecks
   - Validate webhook signature success rates

### Weekly Tasks

1. **Database Maintenance**
   ```bash
   # Clean up old webhook events (retention policy)
   curl -X POST https://your-app.vercel.app/api/diagnostics/last-webhook \
     -d '{"action": "cleanup_old_events", "retention_days": 30}'
   ```

2. **Performance Review**
   - Analyze response time trends
   - Review error rate patterns
   - Check for any configuration drift

### Monthly Tasks

1. **Security Audit**
   - Rotate HMAC secrets
   - Review auth key expiration
   - Validate access controls
   - Update dependencies

2. **Capacity Planning**
   - Review request volume trends
   - Plan for scaling needs
   - Optimize database performance

### Quarterly Tasks

1. **Full System Review**
   - Update documentation
   - Review and update monitoring thresholds
   - Conduct disaster recovery tests
   - Plan feature enhancements

---

## Security Considerations

### Authentication & Authorization

1. **OPAL Authentication**
   - Use strong, unique auth keys (32+ characters)
   - Rotate keys quarterly
   - Store securely in environment variables
   - Never commit keys to version control

2. **Webhook Security**
   - Implement HMAC signature verification
   - Use timing-safe comparison for signatures
   - Validate timestamp to prevent replay attacks
   - Rate limit webhook endpoints

3. **Network Security**
   - Enforce HTTPS in production
   - Implement proper CORS policies
   - Use secure headers (HSTS, CSP, etc.)
   - Monitor for suspicious activity

### Data Protection

1. **Sensitive Data Handling**
   - Mask auth tokens in logs
   - Sanitize webhook payloads
   - Implement data retention policies
   - Use encrypted database connections

2. **Audit Logging**
   - Log all authentication attempts
   - Track configuration changes
   - Monitor webhook signature failures
   - Maintain correlation ID trails

### Security Monitoring

1. **Alert on:**
   - Multiple authentication failures
   - Signature verification failures
   - Unusual request patterns
   - Configuration changes

2. **Regular Security Tasks:**
   - Review access logs
   - Update security patches
   - Audit environment variables
   - Test incident response procedures

---

## Performance Optimization

### Response Time Optimization

1. **Database Optimization**
   - Index frequently queried fields
   - Implement connection pooling
   - Use read replicas for analytics
   - Optimize query patterns

2. **API Optimization**
   - Implement request caching
   - Use compression for large payloads
   - Optimize serialization
   - Implement circuit breakers

3. **Network Optimization**
   - Use CDN for static assets
   - Implement request deduplication
   - Optimize payload sizes
   - Use HTTP/2 where possible

### Scalability Considerations

1. **Horizontal Scaling**
   - Design for stateless operation
   - Use external session storage
   - Implement load balancing
   - Plan for multi-region deployment

2. **Vertical Scaling**
   - Monitor CPU and memory usage
   - Optimize memory footprint
   - Use efficient data structures
   - Profile application performance

### Performance Monitoring

1. **Key Metrics:**
   - Response time percentiles (P50, P95, P99)
   - Throughput (requests per second)
   - Error rates by endpoint
   - Database query performance

2. **Performance Testing:**
   - Load testing with realistic data
   - Stress testing for peak loads
   - Endurance testing for memory leaks
   - Chaos engineering for resilience

---

## Emergency Procedures

### Incident Response

#### 1. Service Degradation

**Assessment:**
```bash
# Check system health
curl https://your-app.vercel.app/api/diagnostics/last-webhook

# Check recent errors
curl "https://your-app.vercel.app/api/diagnostics/last-webhook?status=failed&limit=50"
```

**Immediate Actions:**
1. Check Vercel deployment status
2. Verify environment variables
3. Review application logs
4. Check external service status (OPAL platform)

#### 2. Complete Service Outage

**Assessment:**
```bash
# Basic connectivity
curl -I https://your-app.vercel.app

# Health check
curl https://your-app.vercel.app/api/health
```

**Immediate Actions:**
1. Check Vercel dashboard for incidents
2. Verify DNS resolution
3. Check for configuration changes
4. Consider immediate rollback

#### 3. Data Corruption

**Assessment:**
- Review recent database changes
- Check for failed migrations
- Validate data integrity

**Recovery Actions:**
1. Stop write operations
2. Identify corruption scope
3. Restore from backup
4. Replay missing events using replay system

### Communication Procedures

#### Internal Communication

1. **Incident Declaration:**
   - Notify development team
   - Create incident channel
   - Assign incident commander
   - Begin status updates

2. **Stakeholder Updates:**
   - Update status page
   - Notify business stakeholders
   - Provide estimated resolution time
   - Document impact assessment

#### External Communication

1. **Customer Notification:**
   - Update public status page
   - Send notification emails
   - Post social media updates
   - Provide regular progress updates

### Recovery Procedures

#### 1. Service Recovery

```bash
# Verify environment
curl -X GET https://your-app.vercel.app/api/opal/sync

# Test Force Sync
curl -X POST https://your-app.vercel.app/api/opal/sync \
  -H "Content-Type: application/json" \
  -d '{"sync_scope": "priority_platforms"}'

# Check diagnostics
curl https://your-app.vercel.app/api/diagnostics/last-webhook
```

#### 2. Data Recovery

```bash
# Identify missing events
curl "https://your-app.vercel.app/api/diagnostics/last-webhook?start_date=2024-01-15T00:00:00Z&end_date=2024-01-15T23:59:59Z"

# Replay events if needed
curl -X POST https://your-app.vercel.app/api/orchestrations/replay \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "affected-workflow-id",
    "from_offset": 0,
    "replay_options": {
      "force_reprocess": true
    }
  }'
```

#### 3. Post-Incident Tasks

1. **Immediate:**
   - Validate full service restoration
   - Clear any backlogged events
   - Verify monitoring systems

2. **Short-term:**
   - Conduct post-mortem meeting
   - Document lessons learned
   - Update runbooks
   - Implement preventive measures

3. **Long-term:**
   - Review and update monitoring
   - Improve automation
   - Update disaster recovery plans
   - Share learnings with team

---

## Contacts & Escalation

### Development Team
- **Primary:** Development Team Lead
- **Secondary:** Senior Developer
- **Emergency:** On-call engineer

### Operations Team
- **Primary:** DevOps Engineer
- **Secondary:** Site Reliability Engineer
- **Emergency:** Operations Manager

### Business Stakeholders
- **Product Owner:** [Contact Info]
- **Business Lead:** [Contact Info]
- **Executive Sponsor:** [Contact Info]

### External Services
- **Vercel Support:** support@vercel.com
- **OPAL Platform:** [Support Contact]
- **Database Provider:** [Support Contact]

---

## Appendix

### Environment Variable Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OPAL_WEBHOOK_URL` | Yes | OPAL webhook endpoint | `https://webhook.opal...` |
| `OPAL_STRATEGY_WORKFLOW_AUTH_KEY` | Yes | OPAL authentication key | `32+ character string` |
| `OPAL_WORKSPACE_ID` | Yes | OPAL workspace identifier | `workspace-id-123` |
| `OSA_WEBHOOK_SHARED_SECRET` | Yes | HMAC secret for webhooks | `32+ character string` |
| `NODE_ENV` | Yes | Environment type | `production` |
| `BASE_URL` | Yes | Application base URL | `https://app.vercel.app` |
| `DATABASE_URL` | No | Database connection string | `postgresql://...` |
| `SUPABASE_SERVICE_KEY` | No | Supabase service key | `service key string` |
| `OPAL_DEBUG_MODE` | No | Enable debug logging | `true` |

### API Response Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | Success | Request completed successfully |
| 202 | Accepted | Event queued for processing |
| 400 | Bad Request | Invalid payload or parameters |
| 401 | Unauthorized | Invalid or missing authentication |
| 404 | Not Found | Workflow or resource not found |
| 409 | Conflict | Duplicate event (idempotency) |
| 429 | Rate Limited | Too many requests |
| 500 | Server Error | Internal system error |

### Useful Commands

```bash
# Quick health check
curl https://your-app.vercel.app/api/diagnostics/last-webhook | jq '.system_health'

# Test Force Sync
curl -X POST https://your-app.vercel.app/api/opal/sync -H "Content-Type: application/json" -d '{"sync_scope":"priority_platforms"}'

# Check recent failures
curl "https://your-app.vercel.app/api/diagnostics/last-webhook?status=failed&limit=10" | jq '.events[].error_message'

# Replay workflow events
curl -X POST https://your-app.vercel.app/api/orchestrations/replay -H "Content-Type: application/json" -d '{"workflow_id":"wf_123","dry_run":true}'
```

---

**Document Version:** 1.0
**Last Updated:** November 2024
**Next Review:** December 2024