# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OSA (Optimizely Strategy Assistant) is an AI-powered strategy assistant for Optimizely DXP customers built with Next.js 16. It provides personalized recommendations, strategy insights, and implementation roadmaps with comprehensive Optimizely ecosystem integration and Opal workflow automation.

## Development Commands

### Core Development

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Testing

- `npm run test` - Run Jest unit tests
- `npm run test:watch` - Run Jest in watch mode
- `npm run test:unit` - Run Vitest unit tests
- `npm run test:unit:watch` - Run Vitest in watch mode
- `npm run test:integration` - Run integration tests
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run test:e2e:ui` - Run Playwright with UI mode
- `npm run test:e2e:headed` - Run Playwright in headed mode
- `npm run test:e2e:debug` - Debug Playwright tests

### Validation & Quality Assurance

- `npm run validate:all` - Run all validation checks
- `npm run validate:runtime-errors` - Check for runtime errors
- `npm run validate:security` - Security validation
- `npm run validate:deployment` - Deployment validation
- `npm run validate:opal` - Validate OPAL integration
- `npm run validate:jsx-parsing` - JSX parsing validation
- `npm run error-check` - Run error prevention checks
- `npm run error-check:fix` - Auto-fix preventable errors

### Pre-deployment Hooks

- `npm run pre-commit` - Run pre-commit validations
- `npm run pre-deploy` - Complete pre-deployment validation suite

### OPAL & Production Tools

- `npm run start:opal-tools` - Start OPAL SDK tools
- `npm run start:production-tools` - Start production SDK tools
- `npm run deploy:prod` - Deploy to production via script

### Kafka & Messaging

- `npm run kafka:init` - Initialize Kafka setup
- `npm run kafka:test-producer` - Test Kafka producer
- `npm run kafka:start-diagnostics` - Start diagnostics consumer
- `npm run kafka:start-recommendations` - Start recommendations consumer

## Architecture Overview

### Technology Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript with strict mode
- **UI**: React 19, Tailwind CSS, Radix UI components
- **Database**: Supabase (PostgreSQL), with phase-specific schemas
- **Caching**: Redis (ioredis)
- **Messaging**: Kafka with Confluent Schema Registry
- **Testing**: Jest, Vitest, Playwright
- **Deployment**: Vercel with environment-specific configurations

### Key Directory Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # Backend API endpoints
│   │   ├── admin/         # Admin monitoring endpoints
│   │   ├── opal/          # OPAL integration endpoints
│   │   ├── phase1/        # Phase 1 implementation APIs
│   │   ├── phase2/        # Phase 2 implementation APIs
│   │   └── phase3/        # Phase 3 implementation APIs
│   └── engine/            # Core business logic engines
├── components/            # React UI components
│   ├── ui/               # Base UI components (Radix-based)
│   ├── opal/             # OPAL-specific components
│   └── widgets/          # Specialized dashboard widgets
├── lib/                  # Core utilities and services
│   ├── opal/             # OPAL integration utilities
│   ├── database/         # Database interaction layers
│   ├── security/         # Authentication and security
│   ├── validation/       # Data validation systems
│   ├── orchestration/    # Workflow management
│   ├── analytics/        # Analytics and tracking
│   ├── cache/            # Intelligent caching systems
│   ├── ml/               # Machine learning utilities
│   └── recommendations/  # Recommendation engines
└── types/                # TypeScript type definitions
```

### Core Integration Points

- **Optimizely Data Platform (ODP)**: Customer data and audience management
- **Optimizely Experimentation**: A/B testing and feature flags
- **Optimizely Content Recommendations**: Content recommendation engine
- **Optimizely CMP**: Campaign management platform
- **Salesforce**: CRM integration for lead management
- **SendGrid**: Email service for notifications

### Authentication & Security

- Bearer token authentication with audit logging
- Environment-aware CORS and security headers
- Comprehensive input validation using Zod schemas
- Content Security Policy enforcement
- Zero-trust security framework implementation

### OPAL Workflow System

The application features a sophisticated OPAL (Optimizely AI-Powered Automation Layer) integration:

- **Tool Discovery**: Complete registry for OPAL agent registration
- **Specialized Agents**: JSON configurations in `opal-config/opal-agents/`
- **Workflow Orchestration**: End-to-end personalization strategy generation
- **Instructions**: Governance rules for KPIs, data privacy, and brand consistency

### Database Architecture

- Multi-phase schema design with migration support
- Supabase integration with PostgreSQL backend
- Phase-specific database schemas (phase1, phase2, phase3)
- Intelligent caching layer with Redis

### Performance & Monitoring

- Prometheus metrics integration
- Comprehensive error tracking and prevention
- Intelligent caching mechanisms
- Kafka-based asynchronous processing
- Redis for high-performance caching

## Development Patterns

### Error Prevention System

The codebase implements a robust error prevention system with multiple validation layers:

- Runtime error prevention with automated checks
- JSX parsing validation to prevent rendering issues
- SOP (Standard Operating Procedure) compliance validation
- Comprehensive type safety with TypeScript

### Testing Strategy

- Unit tests with Jest and Vitest for utility functions
- Integration tests for API endpoints and database interactions
- E2E tests with Playwright for user workflows
- SOP compliance testing for governance adherence

### Environment Configuration

The application uses environment-specific configurations with validation:

- Development: Full debugging and validation enabled
- Production: Optimized builds with security hardening
- Comprehensive environment variable validation

## Key Files for Understanding

- `src/lib/simple-opal-data-service.ts` - Core OPAL integration service
- `src/lib/types/database.ts` - Database type definitions
- `src/components/opal/ContentRenderer.tsx` - OPAL content rendering
- `src/components/widgets/WidgetRenderer.tsx` - Widget system architecture
- `opal-config/opal-agents/` - OPAL agent configurations
- `src/lib/orchestration/` - Workflow management systems

## Important Notes

- Always run validation checks before deployment using `npm run pre-deploy`
- The application has strict SOP compliance requirements
- OPAL integration requires specific environment variables to be configured
- Phase-based implementation allows for incremental feature rollouts
- Security validations are mandatory and should not be bypassed
- NEVER ASSUME OR GUESS - When in doubt, ask for clarification
- Always verify file paths and module names before use
- Keep CLAUDE.md updated when adding new patterns or dependencies
- Test your code - No feature is complete without tests
- Document your decisions - Future developers (including yourself) will thank you
