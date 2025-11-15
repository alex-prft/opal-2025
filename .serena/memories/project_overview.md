# OSA Project Overview

## Purpose
OSA (Optimizely Strategy Assistant) is an AI-powered strategy assistant for Optimizely DXP customers built with Next.js 16. It provides personalized recommendations, strategy insights, and implementation roadmaps with comprehensive Optimizely ecosystem integration and Opal workflow automation.

## Key Features
- **AI-Powered Personalization Engine**: Maturity assessment, audience generation, idea creation, experiment blueprints, and plan composition
- **OPAL Integration**: Specialized agents, tool discovery, workflow orchestration, and governance rules
- **Comprehensive Optimizely Integration**: ODP, Experimentation, Content Recommendations, CMP, and Salesforce integration
- **Multi-phase Architecture**: Phase-specific schemas and incremental feature rollouts

## Technology Stack
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript with strict mode
- **UI**: React 19, Tailwind CSS, Radix UI components
- **Database**: Supabase (PostgreSQL), with phase-specific schemas
- **Caching**: Redis (ioredis)
- **Messaging**: Kafka with Confluent Schema Registry
- **Testing**: Jest, Vitest, Playwright
- **Deployment**: Vercel with environment-specific configurations

## Integration Points
- Optimizely Data Platform (ODP): Customer data and audience management
- Optimizely Experimentation: A/B testing and feature flags
- Optimizely Content Recommendations: Content recommendation engine
- Optimizely CMP: Campaign management platform
- Salesforce: CRM integration for lead management
- SendGrid: Email service for notifications