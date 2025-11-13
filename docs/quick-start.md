# OSA Quick Start Guide

Welcome to the Optimizely Strategy Assistant (OSA) - your AI-powered strategy optimization platform. This guide will get you up and running in under 10 minutes.

## What is OSA?

OSA is an intelligent strategy assistant that integrates with your Optimizely DXP tools to provide:
- **AI-Powered Analysis**: 6-agent OPAL workflow for comprehensive strategy insights
- **Real-Time Recommendations**: Data-driven optimization suggestions
- **Interactive Dashboard**: Visual strategy planning and execution tracking
- **Cross-Platform Intelligence**: Unified insights across Content Recs, CMS, ODP, WEBX, and CMP

## Prerequisites

Before you begin, ensure you have:
- [ ] Node.js 18+ installed
- [ ] Access to Optimizely DXP tools (Content Recs, CMS, ODP, etc.)
- [ ] OPAL API credentials and webhook configuration
- [ ] Basic familiarity with Next.js applications

## 5-Minute Setup

### 1. Environment Configuration
Copy the environment template and configure your settings:

```bash
cp .env.example .env.local
```

Configure these essential variables in `.env.local`:

```bash
# OPAL Integration (Required)
OPAL_API_BASE=https://api.opal.optimizely.com
OPAL_API_KEY=your_opal_api_key_here
OPAL_WORKSPACE_ID=your_workspace_id_here

# Webhook Security (Required)
OSA_WEBHOOK_SHARED_SECRET=your_secure_32_char_minimum_secret_here
OPAL_WEBHOOK_URL=https://your-domain.com/api/webhooks/opal-workflow

# Application URLs
BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000

# Database (Optional - uses local storage by default)
DATABASE_URL=your_supabase_or_postgres_url_here
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` - you should see the OSA dashboard.

### 4. Verify OPAL Connection
Navigate to `/engine/admin` and check the system status. All connections should show green checkmarks.

### 5. Run Your First Analysis
1. Go to the Strategy Dashboard (`/engine`)
2. Select an analysis type (Content, Audiences, CX, or Trends)
3. Click "Generate Insights" to trigger your first OPAL workflow

## Key Features Overview

### Strategy Dashboard (`/engine`)
Your main workspace for strategy analysis and planning:
- **Strategy Plans**: OSA recommendations, Quick Wins, Maturity assessment
- **DXP Tools**: Individual tool insights (Content Recs, CMS, ODP, WEBX, CMP)
- **Analytics Insights**: Cross-platform analysis with 7 detailed dimensions
- **Experience Optimization**: Content, experimentation, personalization guidance

### Admin Panel (`/engine/admin`)
System management and monitoring:
- **System Status**: Real-time health monitoring of all integrations
- **Workflow Management**: Trigger force sync, view processing status
- **API Documentation**: Interactive Swagger UI at `/docs`
- **Diagnostics**: Webhook logs and troubleshooting tools

### Real-Time Monitoring
Track your optimization efforts:
- **Live Workflow Status**: See OPAL agents working in real-time
- **Data Quality Metrics**: Understand confidence levels for recommendations
- **Performance Tracking**: Monitor processing times and success rates
- **Alert System**: Get notified of integration issues or opportunities

## Common Workflows

### Workflow 1: Content Performance Analysis
1. **Navigate**: Go to `/engine/results/insights` → Content
2. **Select Dimension**: Choose from Engagement, Topics, Popular, AI Visibility, etc.
3. **Review Insights**: Examine AI-generated recommendations
4. **Export Results**: Download findings for team collaboration

### Workflow 2: Audience Optimization
1. **Navigate**: Go to `/engine/results/dxptools` → ODP
2. **Analyze Segments**: Review current audience performance
3. **Generate Suggestions**: Trigger personalization recommendations
4. **Implement Changes**: Follow step-by-step implementation guides

### Workflow 3: Force Sync Integration Data
1. **Navigate**: Go to `/engine/admin`
2. **Check Status**: Verify all integrations are healthy
3. **Trigger Sync**: Click "Force Sync" for specific tools if needed
4. **Monitor Progress**: Watch real-time sync status updates

## Troubleshooting

### Connection Issues
**Problem**: OSA can't connect to OPAL services
**Solution**:
1. Verify `OPAL_API_KEY` and `OPAL_WORKSPACE_ID` in `.env.local`
2. Check network connectivity to `api.opal.optimizely.com`
3. Review logs in `/engine/admin` diagnostics panel

### Webhook Failures
**Problem**: Webhook signature verification failing
**Solution**:
1. Ensure `OSA_WEBHOOK_SHARED_SECRET` matches OPAL configuration
2. Verify webhook URL is publicly accessible
3. Check webhook logs at `/api/diagnostics/last-webhook`

### Performance Issues
**Problem**: Slow analysis generation
**Solution**:
1. Monitor system status at `/engine/admin`
2. Check individual agent performance in workflow logs
3. Consider upgrading compute resources for production

## Next Steps

### For Content Teams
- Explore `/engine/results/insights/content` for content optimization
- Set up automated content performance alerts
- Integrate findings with your content calendar

### For Marketing Teams
- Review `/engine/results/optimization/personalization` for campaign ideas
- Analyze audience segments in `/engine/results/dxptools/odp`
- Track experimentation ROI via `/engine/results/optimization/experimentation`

### For Technical Teams
- Configure production environment variables
- Set up monitoring and alerting systems
- Review API documentation at `/docs`
- Implement custom integrations using documented endpoints

## Advanced Configuration

### Production Deployment
For production deployment on Vercel:

```bash
# Set environment variables in Vercel dashboard
OPAL_API_BASE=https://api.opal.optimizely.com
OPAL_API_KEY=prod_api_key_here
BASE_URL=https://your-production-domain.com

# Deploy
npm run build
npx vercel --prod
```

### Custom Tool Integration
OSA supports custom tool integration via the OPAL enhanced tools API:

```typescript
// Example: Add custom analytics tool
const customTool = {
  name: "custom_analytics",
  endpoint: "/api/tools/custom-analytics",
  authentication: "bearer_token"
};
```

### Webhook Security
For production, ensure webhook security:

```bash
# Generate secure secret (minimum 32 characters)
openssl rand -hex 32

# Configure in both OSA and OPAL
OSA_WEBHOOK_SHARED_SECRET=your_generated_secret
```

## Support Resources

### Documentation
- **Architecture Overview**: See `OSA_ARCHITECTURE.md`
- **Admin Guide**: See `OSA_ADMIN.md`
- **OPAL Integration**: See `OPAL_MAPPING.md`
- **API Reference**: Interactive docs at `/docs`

### Monitoring and Diagnostics
- **System Health**: `/engine/admin`
- **Webhook Logs**: `/api/diagnostics/last-webhook`
- **API Status**: `/api/health`
- **Performance Metrics**: Built into admin dashboard

### Getting Help
- **System Status**: Check `/engine/admin` for real-time system health
- **Error Logs**: Review diagnostics panel for detailed error information
- **API Testing**: Use interactive documentation at `/docs` to test endpoints
- **Configuration Validation**: Admin panel validates all environment settings

---

**Ready to optimize your strategy?** Start with a content analysis at `/engine/results/insights/content` and watch OSA transform your optimization approach.

## See Also

- [OSA Architecture Overview](OSA_ARCHITECTURE.md) - Detailed system architecture
- [Admin Interface Guide](OSA_ADMIN.md) - Complete admin functionality reference
- [OPAL Integration Details](OPAL_MAPPING.md) - Deep dive into OPAL agent workflows
- [API Documentation](/docs) - Interactive API reference and testing