# AI Agent Factory

## Overview

The AI Agent Factory is a sophisticated 6-phase workflow system for creating specialized Claude API agents within the OSA (Optimizely Strategy Assistant) ecosystem. It provides an automated, interactive approach to agent development with enterprise-grade compliance and validation.

## Architecture

### 6-Phase Workflow System

1. **Phase 0: Clarification** - Main agent gathers detailed requirements through targeted questioning
2. **Phase 1: Requirements Documentation** - Planner subagent creates comprehensive specifications
3. **Phase 2: Parallel Component Development** - Three specialized subagents work simultaneously:
   - **Prompt Engineer**: Designs optimal system prompts
   - **Tool Integrator**: Plans tool implementations and API integrations
   - **Dependency Manager**: Configures environment and dependencies
4. **Phase 3: Implementation** - Main agent builds the complete agent using specifications
5. **Phase 4: Validation** - Validator subagent creates tests and verifies functionality
6. **Phase 5: Delivery** - Documentation and final packaging

### Service Architecture

```
services/ai-agent-factory/
├── src/
│   ├── phases/                    # Phase-specific implementations
│   ├── orchestrator/              # Workflow coordination
│   ├── subagents/                 # Specialized subagent implementations
│   ├── integration/               # OSA ecosystem integrations
│   ├── utils/                     # Shared utilities
│   └── types/                     # TypeScript type definitions
├── config/                        # Configuration files
├── tests/                         # Test suites
└── docs/                          # Documentation
```

## Key Features

- **Interactive Workflow**: User approval gates between phases
- **Enterprise Compliance**: Supabase guardrails and PII protection
- **Comprehensive Logging**: Full audit trail for all operations
- **Security Validation**: Integrated security checks and compliance
- **OSA Integration**: Leverages existing Claude API and OPAL infrastructure

## Dependencies

### Core Dependencies
- `@anthropic-ai/sdk` - Claude API integration
- `@supabase/supabase-js` - Database and compliance
- `zod` - Runtime type validation
- `uuid` - Unique identifier generation
- `date-fns` - Date manipulation utilities

### OSA Ecosystem Integration
- Leverages existing Claude API integration (`/src/lib/claude/`)
- Integrates with Supabase guardrails (`/src/lib/database/`)
- Uses Results content model validation patterns (`/src/types/results-content.ts`)

## Development

### Setup
```bash
cd services/ai-agent-factory
npm install
npm run build
```

### Development Server
```bash
npm run dev
```

### Testing
```bash
npm run test              # Run all tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:watch        # Watch mode
```

### Building
```bash
npm run build             # Build TypeScript
npm run build:watch       # Build with watch mode
```

## Configuration

### Environment Variables
The service uses the parent OSA application's environment configuration:
- Claude API credentials
- Supabase configuration
- OPAL workflow settings

### Service Configuration
Configuration files in `/config/` directory:
- `phase-definitions.json` - Phase workflow definitions
- `subagent-configurations.json` - Subagent specifications

## Integration Points

### Claude API
Reuses OSA's existing Claude API integration for subagent execution with:
- Lifecycle tracking
- Error handling and retries
- Audit logging
- Enterprise guardrails

### Supabase Database
Stores agent specifications and workflow state using:
- PII protection scanning
- Comprehensive audit trails
- Data retention policies
- GDPR compliance

### OPAL Workflow System
Integrates with OSA's OPAL workflow engine for:
- Agent registration
- Workflow orchestration
- Status monitoring
- Tool discovery

## Security & Compliance

- **Enterprise Guardrails**: Mandatory PII protection on all data
- **Audit Logging**: Complete trail of all agent creation activities
- **Security Validation**: 34/35+ security checks before deployment
- **Data Protection**: GDPR compliance with right to erasure

## Monitoring & Operations

### Health Checks
- Service health endpoint
- Database connectivity
- Claude API status
- Workflow engine status

### Metrics
- Agent creation success rate
- Average creation time per phase
- Error rates and failure analysis
- User satisfaction tracking

## Usage

### Basic Agent Creation
```typescript
import { FactoryWorkflowEngine } from '@/services/ai-agent-factory';

const factory = new FactoryWorkflowEngine();

const agent = await factory.createAgent({
  name: 'Content Optimizer Agent',
  purpose: 'Optimize content performance for specific audiences',
  domain: 'content_optimization',
  complexity: 'medium'
});
```

### Interactive Mode
The factory supports interactive mode with user approval at each phase:
1. Review clarification results
2. Approve documentation specifications
3. Validate parallel development outputs
4. Confirm implementation approach
5. Review validation results
6. Approve final delivery

## Development Roadmap

### Phase 1: Core Infrastructure ✅
- Service structure and configuration
- Database schema and migrations
- Core orchestrator implementation

### Phase 2: Workflow Engine (In Progress)
- Phase 0-1 implementation
- Interactive approval system
- API endpoint creation

### Phase 3: Parallel Development System
- Phase 2 parallel execution
- Subagent coordination
- Validation integration

### Phase 4: Implementation & Validation
- Phase 3-5 completion
- Testing suite
- Security validation

### Phase 5: Integration & Testing
- OPAL workflow integration
- Background job system
- Performance optimization

### Phase 6: Production Deployment
- Documentation completion
- Security compliance
- Go-live preparation

## Support & Contributing

This service is part of the OSA ecosystem. For support or contributions:
- Follow OSA development patterns
- Maintain enterprise compliance standards
- Ensure comprehensive testing
- Document all architectural decisions

## License

Internal OSA service - UNLICENSED