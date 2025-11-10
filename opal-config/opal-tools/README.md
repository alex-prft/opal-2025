# OPAL Custom Tools - Configuration

This directory contains all custom OPAL tools created for the **OPAL Connector - Agents** service that enables Optimizely Opal to send data to OSA (Optimizely Strategy Assistant).

## 📋 Overview

The OPAL Connector enables seamless integration between Optimizely Opal's 9 agents and the OSA platform, providing:

- **Tool Discovery**: Automatic registration with Optimizely Opal
- **Data Reception**: Structured endpoint for receiving `osa_workflow_data`
- **Validation**: Comprehensive validation for all agent data types
- **Real-time Monitoring**: Live agent status tracking and updates
- **Testing Infrastructure**: Complete simulation and testing capabilities

## 🗂️ Files in this Directory

### Core OPAL Tools

1. **`opal-tools-service.ts`**
   - Main OPAL Connector service implementation
   - Integrates with @optimizely-opal/opal-tools-sdk
   - Handles OSA workflow data processing and validation
   - **Tool Name**: `osa_workflow_data`

2. **`opal-discovery-endpoint.ts`**
   - Discovery endpoint: `/api/opal/discovery`
   - Tool manifest for Opal registration
   - Defines the `osa_workflow_data` tool specification

3. **`osa-workflow-endpoint.ts`**
   - Data reception endpoint: `/api/opal/osa-workflow`
   - Receives and processes workflow data from all 9 OPAL agents
   - Authentication and validation handling

### Supporting Infrastructure

4. **`opal-types.ts`**
   - Comprehensive TypeScript interfaces for all 9 OPAL agents
   - Agent-specific execution result types
   - Workflow data structures and validation schemas

5. **`opal-validation.ts`**
   - Complete validation functions for OSA workflow data
   - Agent-specific validation rules
   - Business logic and data integrity checks

6. **`opal-webhook-simulator.ts`**
   - Comprehensive testing simulator for OPAL webhooks
   - Realistic mock data generation for all 9 agents
   - Performance testing and failure scenario simulation

7. **`test-opal-simulator.ts`**
   - CLI testing script for running OPAL simulations
   - Multiple testing scenarios and performance benchmarks

## 🔧 OPAL Tool Configuration

### Tool Registration

The OPAL Connector registers the following custom tool with Optimizely Opal:

```typescript
@tool({
  name: 'osa_workflow_data',
  description: 'Receives and processes workflow data from Opal agents for OSA (Optimizely Strategy Assistant)'
})
```

### Tool Discovery

Optimizely Opal discovers this tool via:
- **Discovery URL**: `https://ifpa-strategy.vercel.app/api/opal/discovery`
- **Method**: GET
- **Response**: Tool manifest with complete specification

### Tool Execution

When Opal executes the tool, it sends data to:
- **Execution URL**: `https://ifpa-strategy.vercel.app/api/opal/osa-workflow`
- **Method**: POST
- **Content-Type**: application/json

## 🤖 Supported OPAL Agents

The OPAL Connector supports all 9 Optimizely Opal agents:

1. **Content Review Agent** (`content_review`)
   - Analyzes experiment content and variations
   - Estimated runtime: 45 seconds

2. **Geographic Audit Agent** (`geo_audit`)
   - Evaluates geographic performance distribution
   - Estimated runtime: 60 seconds

3. **Audience Suggester Agent** (`audience_suggester`)
   - Analyzes audience segment performance
   - Estimated runtime: 50 seconds

4. **Experiment Blueprinter Agent** (`experiment_blueprinter`)
   - Creates detailed experiment plans
   - Estimated runtime: 70 seconds

5. **Personalization Idea Generator** (`personalization_idea_generator`)
   - Generates personalization strategies
   - Estimated runtime: 55 seconds

6. **Roadmap Generator Agent** (`roadmap_generator`)
   - Generates implementation roadmaps and timelines
   - Estimated runtime: 65 seconds

7. **Integration Health Agent** (`integration_health`)
   - Monitors DXP integration status and health metrics
   - Estimated runtime: 40 seconds

8. **CMP Organizer Agent** (`cmp_organizer`)
   - Organizes campaign management platform workflows
   - Estimated runtime: 50 seconds

9. **Customer Journey Agent** (`customer_journey`)
   - Maps customer journey touchpoints and optimization opportunities
   - Estimated runtime: 70 seconds

## 📊 Data Flow

1. **Opal Workflow Execution**: Optimizely Opal executes agents and collects results
2. **Tool Invocation**: Opal calls the `osa_workflow_data` tool with agent results
3. **Data Reception**: OSA workflow endpoint receives and validates data
4. **Processing**: Comprehensive validation and processing of agent data
5. **Integration**: Data forwarded to existing webhook infrastructure
6. **Monitoring**: Real-time status updates and monitoring dashboard
7. **Storage**: Processed data stored for analysis and reporting

## 🧪 Testing

### Using the Simulator

```bash
# Single workflow simulation
npx tsx test-opal-simulator.ts workflow

# Multiple workflows for performance testing
npx tsx test-opal-simulator.ts multiple 5

# Test individual agent
npx tsx test-opal-simulator.ts agent content_review

# Comprehensive demo scenario
npx tsx test-opal-simulator.ts demo

# Failure scenario testing
npx tsx test-opal-simulator.ts failures
```

### Manual Testing

You can also test the endpoints directly:

```bash
# Test discovery endpoint
curl https://ifpa-strategy.vercel.app/api/opal/discovery

# Test workflow endpoint (requires authentication)
curl -X POST https://ifpa-strategy.vercel.app/api/opal/osa-workflow \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @sample-workflow-data.json
```

## 🔐 Authentication

The OPAL Connector uses Bearer token authentication:
- **Header**: `Authorization: Bearer <token>`
- **Token**: Uses `OPAL_WEBHOOK_AUTH_KEY` environment variable
- **Development Mode**: Authentication bypassed for testing

## 📈 Monitoring

Access the comprehensive admin dashboard at:
- **URL**: `https://ifpa-strategy.vercel.app/admin/opal-monitoring`
- **Features**: Real-time agent status, webhook events, performance metrics, testing tools

## 🔄 Updates and Maintenance

When updating OPAL tools:

1. **Modify Source Files**: Update files in the main codebase (`src/lib/opal-connector/`, etc.)
2. **Copy to Configuration**: Run this command to sync changes:
   ```bash
   # Copy updated files to opal-config
   cp src/lib/opal-connector/opal-tools-service.ts opal-config/opal-tools/
   cp src/app/api/opal/discovery/route.ts opal-config/opal-tools/opal-discovery-endpoint.ts
   cp src/app/api/opal/osa-workflow/route.ts opal-config/opal-tools/osa-workflow-endpoint.ts
   # ... etc for other files
   ```
3. **Update Documentation**: Ensure this README reflects any changes
4. **Test Changes**: Use the simulator to verify functionality

## 📚 Documentation Links

- **OPAL Tools SDK**: [TypeScript SDK Documentation](https://www.npmjs.com/package/@optimizely-opal/opal-tools-sdk)
- **OSA Integration**: Internal documentation for OSA webhook handling
- **Admin Dashboard**: `/admin/opal-monitoring` for comprehensive monitoring

## 🆘 Support

For issues or questions regarding OPAL tools:
1. Check the admin dashboard for system status
2. Review logs in the monitoring interface
3. Use the testing simulator to diagnose issues
4. Consult the comprehensive validation error messages

---

**Last Updated**: ${new Date().toISOString()}
**Version**: 1.0.0
**OPAL Connector Status**: Production Ready ✅