# OPAL Custom Tools Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the OPAL Custom Tools integration system to production environments. The integration enables seamless communication between OPAL agents and OSA (Optimizely Strategy Assistant) with robust security, monitoring, and error handling.

## Prerequisites

### System Requirements
- Node.js 18.17.0 or later
- PostgreSQL 14.0 or later (or Supabase)
- SSL certificate for HTTPS endpoints
- Domain with DNS configuration

### Access Requirements
- Vercel account with deployment permissions
- Database access (Supabase/PostgreSQL)
- Environment variable management access
- OPAL agent configuration access

## Pre-Deployment Checklist

### 1. Environment Configuration
Ensure all required environment variables are configured:

```bash
# Core OPAL Configuration
OSA_WEBHOOK_URL="https://your-domain.com/api/webhooks/opal-workflow"
OSA_WEBHOOK_SECRET="your-secure-webhook-secret-minimum-32-characters"
OPAL_TOOLS_DISCOVERY_URL="https://your-domain.com/api/opal/enhanced-tools"

# External OPAL Webhook Configuration
OPAL_WEBHOOK_URL="https://webhook.opal.optimizely.com/webhooks/your-webhook-id/secret"
OPAL_STRATEGY_WORKFLOW_AUTH_KEY="your-opal-auth-key"

# Optional Configuration
DEFAULT_ENVIRONMENT="production"
DIAGNOSTICS_LIMIT_DEFAULT="25"
BASE_URL="https://your-domain.com"
```

### 2. Database Setup
Run the migration to create required tables:

```sql
-- Execute migrations/001_create_opal_webhook_events.sql
psql -h your-host -U your-user -d your-db -f migrations/001_create_opal_webhook_events.sql
```

### 3. SSL/TLS Configuration
Verify HTTPS is properly configured:
- SSL certificate is valid and not expired
- HTTPS redirects are in place
- Mixed content warnings are resolved

## Deployment Steps

### Step 1: Code Preparation

1. **Verify Branch Status**
   ```bash
   git status
   git diff main
   ```

2. **Run Tests**
   ```bash
   npm test
   npm run test:opal
   ```

3. **Build Verification**
   ```bash
   npm run build
   ```

### Step 2: Environment Variable Setup

1. **Vercel Environment Variables**
   ```bash
   # Set production environment variables
   vercel env add OSA_WEBHOOK_SECRET production
   vercel env add OPAL_STRATEGY_WORKFLOW_AUTH_KEY production
   vercel env add OSA_WEBHOOK_URL production
   # ... (add all required variables)
   ```

2. **Validate Configuration**
   ```bash
   # Test configuration loading
   npm run validate-config
   ```

### Step 3: Production Deployment

1. **Deploy to Vercel**
   ```bash
   # Deploy with environment variables
   vercel --prod
   ```

2. **Verify Deployment**
   ```bash
   # Check deployment status
   vercel inspect your-deployment-url
   ```

### Step 4: Post-Deployment Verification

1. **Health Check**
   ```bash
   curl -s https://your-domain.com/api/opal/health | jq '.overall_status'
   ```

2. **Discovery Endpoint Test**
   ```bash
   curl -s https://your-domain.com/api/opal/enhanced-tools | jq '.tools[].name'
   ```

3. **Webhook Receiver Test**
   ```bash
   # Generate test webhook with signature
   ./scripts/test-webhook-production.sh
   ```

## Environment-Specific Configurations

### Development Environment
```json
{
  "discovery_url": "http://localhost:3000/api/opal/enhanced-tools",
  "webhook_url": "http://localhost:3000/api/webhooks/opal-workflow",
  "debug_mode": true,
  "signature_validation": false,
  "ssl_required": false
}
```

### Staging Environment
```json
{
  "discovery_url": "https://staging-domain.com/api/opal/enhanced-tools",
  "webhook_url": "https://staging-domain.com/api/webhooks/opal-workflow",
  "debug_mode": true,
  "signature_validation": true,
  "ssl_required": true
}
```

### Production Environment
```json
{
  "discovery_url": "https://opal-2025.vercel.app/api/opal/enhanced-tools",
  "webhook_url": "https://opal-2025.vercel.app/api/webhooks/opal-workflow",
  "debug_mode": false,
  "signature_validation": true,
  "ssl_required": true,
  "rate_limiting": true,
  "monitoring": true
}
```

## Database Migration Guide

### Initial Setup
```sql
-- 1. Create database (if not exists)
CREATE DATABASE opal_integration;

-- 2. Create user with appropriate permissions
CREATE USER opal_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE opal_integration TO opal_user;

-- 3. Run migrations
\i migrations/001_create_opal_webhook_events.sql
```

### Migration Verification
```sql
-- Verify tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'opal_%';

-- Check indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename LIKE 'opal_%';

-- Verify triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_table LIKE 'opal_%';
```

## OPAL Agent Configuration

### Production Agent Setup
```json
{
  "agent_id": "production-opal-agent",
  "discovery_url": "https://opal-2025.vercel.app/api/opal/enhanced-tools",
  "discovery_interval_minutes": 5,
  "execution_timeout_seconds": 60,
  "retry_config": {
    "max_retries": 3,
    "base_delay_ms": 1000,
    "max_delay_ms": 10000
  },
  "webhook_configuration": {
    "target_url": "https://opal-2025.vercel.app/api/webhooks/opal-workflow",
    "signature_header": "X-OSA-Signature",
    "content_type": "application/json",
    "timeout_seconds": 30
  }
}
```

### Agent Deployment Verification
```bash
# Test OPAL agent discovery
curl -X GET https://opal-2025.vercel.app/api/opal/enhanced-tools

# Test OPAL agent execution
curl -X POST https://opal-2025.vercel.app/api/opal/enhanced-tools \
  -H "Content-Type: application/json" \
  -d @examples/test-payload.json
```

## Security Configuration

### HTTPS Setup
- Ensure SSL certificate is valid
- Configure HSTS headers
- Enable HTTPS redirects
- Verify no mixed content warnings

### Webhook Security
```bash
# Generate secure webhook secret (minimum 32 characters)
openssl rand -hex 32

# Verify HMAC implementation
node -e "
const crypto = require('crypto');
const payload = 'test';
const secret = process.env.OSA_WEBHOOK_SECRET;
const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
console.log('Test signature:', signature);
"
```

### Access Control
- Configure CORS policies
- Implement rate limiting
- Set up IP allowlisting (if required)
- Configure API key validation

## Monitoring and Alerting Setup

### Health Check Monitoring
```bash
# Set up health check monitoring
curl -s https://opal-2025.vercel.app/api/opal/health | jq '{
  status: .overall_status,
  last_webhook_minutes: .last_webhook_minutes_ago,
  signature_rate: .signature_valid_rate,
  error_rate: .error_rate_24h
}'
```

### Alert Thresholds
- **Response Time**: > 5 seconds
- **Error Rate**: > 5%
- **Signature Failure Rate**: > 2%
- **No Events**: > 15 minutes
- **Health Status**: Red for > 5 minutes

### Log Monitoring
```bash
# Monitor webhook events
curl -s "https://opal-2025.vercel.app/api/diagnostics/last-webhook?limit=10" | \
  jq '.events[] | {time: .received_at, status: .http_status, valid: .signature_valid}'
```

## Troubleshooting

### Common Issues

#### 1. 401 Unauthorized Errors
**Symptoms**: OPAL agent requests failing with 401
**Solutions**:
- Verify webhook secret configuration
- Check signature generation/verification
- Validate timestamp synchronization

#### 2. CORS Issues
**Symptoms**: Browser-based OPAL tools failing
**Solutions**:
- Configure CORS headers
- Verify allowed origins
- Check preflight request handling

#### 3. High Latency
**Symptoms**: Slow response times
**Solutions**:
- Check database connection pool
- Review webhook processing logic
- Monitor server resources

#### 4. Signature Validation Failures
**Symptoms**: High signature failure rate
**Solutions**:
- Verify raw body is used for HMAC
- Check time synchronization
- Validate secret configuration

### Diagnostic Commands
```bash
# Health check
curl -s https://opal-2025.vercel.app/api/opal/health

# Recent webhooks
curl -s "https://opal-2025.vercel.app/api/diagnostics/last-webhook?limit=5"

# Configuration validation
curl -s https://opal-2025.vercel.app/api/opal/health | jq '.config_checks'

# Performance metrics
curl -w "Time: %{time_total}s\n" -o /dev/null -s https://opal-2025.vercel.app/api/opal/health
```

## Rollback Procedures

### Emergency Rollback
```bash
# 1. Identify last known good deployment
vercel ls

# 2. Promote previous deployment
vercel promote DEPLOYMENT_ID

# 3. Verify rollback
curl -s https://opal-2025.vercel.app/api/opal/health
```

### Configuration Rollback
```bash
# 1. Backup current configuration
vercel env ls production > config-backup.txt

# 2. Restore previous configuration
vercel env rm VARIABLE_NAME production
vercel env add VARIABLE_NAME production

# 3. Redeploy
vercel --prod
```

## Performance Optimization

### Database Optimization
```sql
-- Monitor query performance
SELECT query, mean_time, calls
FROM pg_stat_statements
WHERE query LIKE '%opal_webhook_events%'
ORDER BY mean_time DESC;

-- Index usage analysis
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename = 'opal_webhook_events';
```

### Application Optimization
- Enable response caching where appropriate
- Implement connection pooling
- Configure request timeout limits
- Optimize JSON parsing/validation

## Maintenance Tasks

### Regular Maintenance
```bash
# Weekly health check report
./scripts/weekly-health-report.sh

# Monthly webhook cleanup
./scripts/cleanup-old-webhooks.sh

# Quarterly security audit
./scripts/security-audit.sh
```

### Database Maintenance
```sql
-- Clean up old webhook events (monthly)
DELETE FROM opal_webhook_events
WHERE received_at < NOW() - INTERVAL '30 days';

-- Update table statistics
ANALYZE opal_webhook_events;

-- Reindex if needed
REINDEX TABLE opal_webhook_events;
```

## Support and Escalation

### Contact Information
- **Primary**: Development Team
- **Secondary**: Infrastructure Team
- **Emergency**: On-call Engineer

### Escalation Process
1. **Level 1**: Check health status and recent events
2. **Level 2**: Review logs and configuration
3. **Level 3**: Database and infrastructure analysis
4. **Level 4**: Code review and hotfix deployment

### Documentation Links
- [OPAL Integration Runbook](./OPAL_INTEGRATION_RUNBOOK.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Security Guidelines](./SECURITY_GUIDELINES.md)
- [Monitoring Playbook](./MONITORING_PLAYBOOK.md)