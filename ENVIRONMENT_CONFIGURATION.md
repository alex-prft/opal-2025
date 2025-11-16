# OSA Environment Configuration for Supabase Guardrails

This document outlines the environment variables required to configure the Supabase guardrails system in OSA.

## Required Environment Variables

### Core Supabase Configuration

```bash
# Supabase Connection (Required)
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database Connection
POSTGRES_CONNECTION_STRING=postgresql://postgres:password@localhost:5432/database
```

### Guardrails System Configuration

```bash
# Enable/Disable Guardrails (Default: enabled)
SUPABASE_GUARDRAILS_ENABLED=true
NEXT_PUBLIC_SUPABASE_GUARDRAILS_ENABLED=true

# Data Governance Settings
DATA_GOVERNANCE_ENABLED=true
AUDIT_LOGGING_ENABLED=true
PII_SCANNING_ENABLED=true

# Audit System Configuration
AUDIT_BATCH_SIZE=100
AUDIT_FLUSH_INTERVAL=5000
AUDIT_RETENTION_DAYS=730

# Data Retention Configuration
DATA_RETENTION_ENABLED=true
SESSION_TOKEN_EXPIRY_HOURS=24
TEMP_DATA_RETENTION_DAYS=7
METADATA_RETENTION_DAYS=365
ANONYMOUS_METRICS_RETENTION_DAYS=365

# Security Settings
ENABLE_PII_DATABASE_TRIGGERS=true
ENABLE_SCHEMA_VALIDATION=true
ENABLE_AUTOMATIC_CLEANUP=true

# Performance Settings
GUARDRAILS_DEBUG=false
HEALTH_CHECK_INTERVAL_MINUTES=5
PERFORMANCE_MONITORING_ENABLED=true
```

### External Secret Management (Recommended)

```bash
# API Keys (Store in external secret management, NOT Supabase)
# Examples of what should NOT be in Supabase:
OPTIMIZELY_API_KEY=external_secret_manager
SENDGRID_API_KEY=external_secret_manager
GOOGLE_ANALYTICS_KEY=external_secret_manager
SALESFORCE_CLIENT_SECRET=external_secret_manager
```

## Environment-Specific Configurations

### Development Environment

```bash
NODE_ENV=development

# Development-specific settings
SUPABASE_GUARDRAILS_DEBUG=true
AUDIT_LOGGING_ENABLED=true
PII_SCANNING_ENABLED=true
ENABLE_DEV_GUARDRAILS_PANEL=true

# Relaxed settings for development
AUDIT_BATCH_SIZE=50
HEALTH_CHECK_INTERVAL_MINUTES=10
```

### Production Environment

```bash
NODE_ENV=production

# Production security settings
SUPABASE_GUARDRAILS_ENABLED=true
DATA_GOVERNANCE_ENABLED=true
AUDIT_LOGGING_ENABLED=true
PII_SCANNING_ENABLED=true
ENABLE_PII_DATABASE_TRIGGERS=true

# Strict production settings
AUDIT_RETENTION_DAYS=730
SESSION_TOKEN_EXPIRY_HOURS=24
ENABLE_AUTOMATIC_CLEANUP=true
PERFORMANCE_MONITORING_ENABLED=true

# No debug in production
SUPABASE_GUARDRAILS_DEBUG=false
ENABLE_DEV_GUARDRAILS_PANEL=false
```

### Testing Environment

```bash
NODE_ENV=test

# Testing-specific settings
SUPABASE_GUARDRAILS_ENABLED=true
DATA_GOVERNANCE_ENABLED=true
AUDIT_LOGGING_ENABLED=false  # Reduce noise in tests
PII_SCANNING_ENABLED=true

# Fast cleanup for tests
TEMP_DATA_RETENTION_DAYS=1
SESSION_TOKEN_EXPIRY_HOURS=1
```

## Vercel Deployment Configuration

When deploying to Vercel, add these environment variables in your project settings:

### Required for All Environments
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_GUARDRAILS_ENABLED`

### Production-Specific
- `DATA_GOVERNANCE_ENABLED=true`
- `AUDIT_LOGGING_ENABLED=true`
- `PII_SCANNING_ENABLED=true`
- `AUDIT_RETENTION_DAYS=730`

### Preview/Development
- `SUPABASE_GUARDRAILS_DEBUG=true`
- `ENABLE_DEV_GUARDRAILS_PANEL=true`

## Configuration Validation

The system will validate these settings on startup. Check the logs for:

```
✅ OSA Supabase Guardrails initialized successfully
✅ Schema validation policies created
✅ Audit system initialized
✅ Data retention policies loaded
```

If you see errors, verify:

1. Supabase connection credentials are correct
2. Service role key has appropriate permissions
3. Database migrations have been applied
4. Environment variables are properly set

## Health Check Endpoints

Once configured, you can monitor the system:

- Health Check: `GET /api/admin/guardrails-health`
- Detailed Status: `GET /api/admin/guardrails-health?detailed=true`
- Performance Metrics: `GET /api/admin/guardrails-health?metrics=true`

## Troubleshooting

### Common Issues

1. **Guardrails not initializing:**
   - Check `SUPABASE_GUARDRAILS_ENABLED=true`
   - Verify Supabase connection
   - Ensure database migrations are applied

2. **PII scanning errors:**
   - Verify `PII_SCANNING_ENABLED=true`
   - Check audit log table exists
   - Ensure proper permissions

3. **Performance issues:**
   - Adjust `AUDIT_BATCH_SIZE` (lower for less memory)
   - Increase `AUDIT_FLUSH_INTERVAL` for less frequent writes
   - Enable `PERFORMANCE_MONITORING_ENABLED` for insights

### Environment Variable Priority

1. System environment variables
2. `.env.local` (local development)
3. `.env.production` (production builds)
4. `.env` (fallback)
5. Default values in code

## Security Considerations

- **Never commit** `.env.local` or `.env.production` files
- Use **external secret management** for API keys
- Rotate service role keys regularly
- Monitor audit logs for suspicious activity
- Enable all security features in production

## Migration from Legacy Setup

If migrating from an existing OSA installation:

1. **Backup current environment variables**
2. **Apply database migrations**
3. **Add new guardrails variables**
4. **Test in development first**
5. **Deploy to production**
6. **Monitor health checks**

The system is designed to fail gracefully - existing functionality will continue to work even if guardrails fail to initialize.