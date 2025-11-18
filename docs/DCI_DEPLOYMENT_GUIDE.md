# DCI Orchestrator Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Dynamic Context Integration (DCI) Orchestrator system to production. The DCI system enhances OSA Results generation through progressive context integration, quality scoring loops, and intelligent fallback mechanisms.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Deployment Process](#deployment-process)
4. [A/B Testing Setup](#ab-testing-setup)
5. [Monitoring and Alerting](#monitoring-and-alerting)
6. [Rollback Procedures](#rollback-procedures)
7. [Troubleshooting](#troubleshooting)
8. [Post-Deployment Validation](#post-deployment-validation)

## Pre-Deployment Checklist

### ✅ Code Validation
- [ ] All DCI tests pass (`npm run test`)
- [ ] Integration tests complete successfully
- [ ] TypeScript compilation successful (`npm run build`)
- [ ] ESLint validation passes (`npm run lint`)
- [ ] Security scan completed (`npm run validate:security`)

### ✅ Configuration Validation
- [ ] Environment variables configured for production
- [ ] LLM API keys validated and working
- [ ] Supabase connection tested
- [ ] OPAL integration validated
- [ ] Feature flags properly configured

### ✅ Infrastructure Readiness
- [ ] Production database migrations applied
- [ ] Redis cache configured and accessible
- [ ] Monitoring systems operational
- [ ] Alerting channels configured
- [ ] Backup systems validated

### ✅ Team Readiness
- [ ] Deployment runbook reviewed with team
- [ ] Rollback procedures tested
- [ ] On-call schedules updated
- [ ] Escalation procedures documented

## Environment Configuration

### Required Environment Variables

```bash
# Core DCI Configuration
NEXT_PUBLIC_ENABLE_DCI_ORCHESTRATOR=true
DCI_LLM_PROVIDER=openai  # or anthropic
DCI_LLM_API_KEY=sk-...
DCI_LLM_MODEL=gpt-4
DCI_MAX_PASSES=3
DCI_QUALITY_THRESHOLD=4.0
DCI_TIMEOUT_MS=120000

# Data Source Integration
NEXT_PUBLIC_ENABLE_DCI_SUPABASE=true
NEXT_PUBLIC_ENABLE_DCI_OPAL=true
NEXT_PUBLIC_ENABLE_DCI_DXP_TOOLS=true
NEXT_PUBLIC_ENABLE_DCI_ANALYTICS=true

# Caching Configuration
DCI_CACHE_EXPIRY_MINUTES=30
DCI_DATA_FRESHNESS_HOURS=24
DCI_MAX_ITEMS_PER_CATEGORY=10

# A/B Testing
NEXT_PUBLIC_ENABLE_DCI_AB_TEST=true
DCI_AB_TEST_TRAFFIC_PERCENTAGE=10  # Start with 10%

# Monitoring
DCI_MONITORING_ENABLED=true
DCI_ALERTING_ENABLED=true
DCI_METRICS_RETENTION_DAYS=30
```

### Optional Environment Variables

```bash
# Performance Tuning
DCI_LLM_TEMPERATURE=0.1
DCI_LLM_MAX_TOKENS=4000
DCI_LLM_RETRY_ATTEMPTS=3
DCI_LLM_RETRY_DELAY_MS=2000

# Security
DCI_RATE_LIMIT_REQUESTS_PER_MINUTE=10
DCI_RATE_LIMIT_REQUESTS_PER_HOUR=100

# Development/Debug (disable in production)
DCI_DETAILED_LOGGING=false
DCI_DEBUG_MODE=false
```

## Deployment Process

### Phase 1: Staging Deployment

1. **Deploy to Staging Environment**
   ```bash
   # Set staging environment
   export NODE_ENV=production
   export VERCEL_ENV=preview
   export STAGING_ENVIRONMENT=true

   # Deploy to staging
   npm run build
   npm run validate:all
   vercel deploy --target=preview
   ```

2. **Run Staging Validation Tests**
   ```bash
   # Test DCI functionality
   curl -X POST https://staging-url/api/dci/test \
     -H "Content-Type: application/json" \
     -d '{"testScenario": "basic_dci_flow"}'

   # Validate A/B testing
   curl -X POST https://staging-url/api/dci/ab-test \
     -H "Content-Type: application/json" \
     -d '{"userId": "test-user", "orgId": "test-org"}'

   # Check monitoring dashboard
   curl https://staging-url/api/dci/health
   ```

3. **Performance Testing**
   ```bash
   # Load testing (using your preferred tool)
   # Example with curl for basic testing:
   for i in {1..10}; do
     curl -X POST https://staging-url/api/results/generate \
       -H "Content-Type: application/json" \
       -d '{"tier": "strategy", "baseMeta": {...}}' &
   done
   wait
   ```

### Phase 2: Production Deployment with A/B Testing

1. **Enable A/B Testing with Low Traffic**
   ```bash
   # Set production environment variables
   export NEXT_PUBLIC_ENABLE_DCI_AB_TEST=true
   export DCI_AB_TEST_TRAFFIC_PERCENTAGE=5  # Start with 5%
   ```

2. **Deploy to Production**
   ```bash
   # Production deployment
   npm run build
   npm run validate:production-deployment
   vercel deploy --prod
   ```

3. **Validate Production Deployment**
   ```bash
   # Test production endpoints
   curl -I https://production-url/api/health
   curl -I https://production-url/api/dci/health

   # Verify A/B testing is working
   curl -X POST https://production-url/api/dci/assign-variant \
     -H "Content-Type: application/json" \
     -d '{"userId": "test-user", "orgId": "test-org"}'
   ```

### Phase 3: Gradual Traffic Increase

Monitor performance for 24-48 hours at each level:

1. **5% Traffic** - Initial rollout
   - Monitor error rates and performance
   - Validate A/B test metrics collection
   - Check user feedback

2. **10% Traffic** - Expand if stable
   ```bash
   # Update traffic allocation
   # Via admin API or environment variable update
   ```

3. **25% Traffic** - Broader validation
   - Monitor business metrics impact
   - Validate quality improvements
   - Check system resource usage

4. **50% Traffic** - Major milestone
   - Full performance validation
   - Business impact assessment
   - User satisfaction metrics

5. **100% Traffic** - Full rollout
   - Complete migration
   - Disable A/B testing
   - Update monitoring baselines

## A/B Testing Setup

### Configuration

```typescript
// A/B test configuration
const abTestConfig = {
  testId: 'dci-rollout-2024-q4',
  enabled: true,
  trafficAllocation: {
    control: 90,    // Existing system
    treatment: 10   // DCI system
  },
  targetAudience: {
    maturityPhases: ['walk', 'run', 'fly'], // Exclude 'crawl'
    excludedOrgIds: ['problematic-org-1']
  },
  successCriteria: {
    primaryMetricImprovement: 15, // 15% improvement required
    statisticalSignificance: 0.05 // 95% confidence
  }
};
```

### Monitoring A/B Test

```bash
# Get A/B test status
curl https://production-url/api/dci/ab-test/status

# Get test metrics
curl https://production-url/api/dci/ab-test/metrics

# Emergency disable if needed
curl -X POST https://production-url/api/dci/ab-test/disable \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"reason": "High error rate detected"}'
```

## Monitoring and Alerting

### Key Metrics to Monitor

1. **Performance Metrics**
   - Request duration (target: <2 minutes)
   - Context build time (target: <45 seconds)
   - LLM response time (target: <60 seconds)
   - Cache hit rate (target: >70%)

2. **Quality Metrics**
   - Quality score distribution (target: >4.0 average)
   - Success rate (target: >95%)
   - User satisfaction (target: >85%)

3. **System Metrics**
   - Error rate (target: <5%)
   - Memory usage (alert: >85%)
   - CPU usage (alert: >80%)

### Alert Thresholds

```yaml
# Critical Alerts (immediate response)
- High error rate: >10% for 5 minutes
- High latency: >3 minutes for 5 requests
- System unavailable: health check fails 3 times

# Warning Alerts (investigate within 1 hour)
- Moderate error rate: >5% for 15 minutes
- Quality degradation: <3.5 average for 30 minutes
- High resource usage: >80% for 30 minutes

# Info Alerts (daily review)
- A/B test metrics update
- Performance trends
- Usage statistics
```

### Monitoring Dashboard URLs

- Production Health: `https://production-url/api/dci/health`
- Metrics Dashboard: `https://production-url/admin/dci/dashboard`
- A/B Test Status: `https://production-url/admin/dci/ab-test`

## Rollback Procedures

### Automatic Rollback Triggers

The system will automatically disable DCI if:
- Error rate exceeds 10% for 5 minutes
- Average response time exceeds 3 minutes
- Quality score drops below 2.0
- System resources exceed 90% usage

### Manual Rollback Steps

#### Emergency Rollback (< 5 minutes)

1. **Disable DCI via Feature Flag**
   ```bash
   # Update environment variable
   vercel env add NEXT_PUBLIC_ENABLE_DCI_ORCHESTRATOR false --scope production

   # Or via admin API
   curl -X POST https://production-url/api/admin/feature-flags \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -d '{"ENABLE_DCI_ORCHESTRATOR": false}'
   ```

2. **Verify Traffic Returns to Control**
   ```bash
   # Check that requests are using original system
   curl https://production-url/api/results/generate \
     -H "X-Test-Header: rollback-validation"
   ```

#### Partial Rollback

1. **Reduce A/B Test Traffic**
   ```bash
   # Reduce to 1% traffic
   curl -X POST https://production-url/api/dci/ab-test/update \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -d '{"trafficAllocation": {"control": 99, "treatment": 1}}'
   ```

2. **Monitor for Stabilization**
   - Watch error rates normalize
   - Verify performance returns to baseline
   - Check user impact metrics

#### Full Rollback to Previous Version

1. **Revert to Previous Deployment**
   ```bash
   # Get previous deployment ID
   vercel deployments list --scope production

   # Promote previous deployment
   vercel promote $PREVIOUS_DEPLOYMENT_ID --scope production
   ```

2. **Validate Rollback**
   ```bash
   # Test critical functionality
   curl -I https://production-url/api/health
   curl -I https://production-url/api/results/generate
   ```

## Troubleshooting

### Common Issues

#### High Error Rates

**Symptoms:** Error rate >5%, failed requests in logs
**Investigation:**
```bash
# Check error logs
vercel logs --follow --scope production | grep ERROR

# Check DCI health
curl https://production-url/api/dci/health

# Review recent deployments
vercel deployments list --scope production
```

**Solutions:**
1. Check LLM API key validity and rate limits
2. Verify Supabase connection and query performance
3. Review recent code changes for bugs
4. Consider reducing traffic allocation

#### High Latency

**Symptoms:** Response times >2 minutes, timeout errors
**Investigation:**
```bash
# Check performance metrics
curl https://production-url/api/dci/metrics

# Monitor system resources
curl https://production-url/api/system/resources

# Check LLM provider status
curl https://status.openai.com/  # or anthropic status page
```

**Solutions:**
1. Optimize LLM request timeout settings
2. Increase cache TTL to reduce data fetching
3. Review context building performance
4. Consider reducing quality threshold temporarily

#### Quality Degradation

**Symptoms:** Average quality score <3.5, user complaints
**Investigation:**
```bash
# Review quality score trends
curl https://production-url/api/dci/quality-trends

# Check context bucket coverage
curl https://production-url/api/dci/context-coverage

# Review recent LLM responses
curl https://production-url/api/dci/recent-generations
```

**Solutions:**
1. Verify data source freshness and quality
2. Review LLM prompt effectiveness
3. Check context bucket completeness
4. Validate stack alignment accuracy

### Emergency Contacts

- **DCI System Owner:** [Name] - [Email] - [Phone]
- **Infrastructure Team:** [Name] - [Email] - [Phone]
- **On-Call Engineer:** [Rotation] - [Email] - [Phone]
- **Product Manager:** [Name] - [Email] - [Phone]

### Escalation Procedures

1. **Level 1 (0-15 minutes):** Engineering team investigation
2. **Level 2 (15-30 minutes):** Escalate to senior engineer and product manager
3. **Level 3 (30+ minutes):** Escalate to engineering manager and executive team

## Post-Deployment Validation

### 24-Hour Post-Deployment Checklist

- [ ] Error rates within acceptable thresholds (<5%)
- [ ] Performance metrics meeting targets
- [ ] A/B test metrics collection working
- [ ] No critical alerts triggered
- [ ] User feedback monitoring active

### Weekly Review Checklist

- [ ] A/B test statistical significance achieved
- [ ] Business metrics impact assessment
- [ ] User satisfaction survey results
- [ ] System resource usage trends
- [ ] Quality score distribution analysis

### Success Criteria for Full Rollout

1. **Technical Success**
   - Error rate <3% for 7 consecutive days
   - Average response time <90 seconds
   - Quality score improvement >15%
   - 99.5% uptime maintained

2. **Business Success**
   - User engagement metrics improved
   - Implementation rate of recommendations increased
   - Customer satisfaction scores maintained or improved
   - No negative business impact measured

3. **Operational Success**
   - Team comfortable with new system
   - Monitoring and alerting effective
   - Rollback procedures validated
   - Documentation complete and accurate

## Conclusion

This deployment guide provides a comprehensive framework for safely rolling out the DCI Orchestrator system. The phased approach with A/B testing, comprehensive monitoring, and clear rollback procedures ensures minimal risk while maximizing the benefits of the enhanced Results generation system.

For questions or issues not covered in this guide, contact the DCI development team or refer to the troubleshooting section above.

---

**Document Version:** 1.0
**Last Updated:** [Current Date]
**Next Review:** [Date + 3 months]