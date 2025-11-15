# Important Dependencies and Configuration

## Core Framework Dependencies
- **next**: 16.0.1 - Next.js framework with App Router
- **react**: 19.2.0 - React UI library
- **typescript**: ^5 - TypeScript for type safety
- **tailwindcss**: ^3.4.18 - Utility-first CSS framework

## OPAL Integration
- **@optimizely-opal/opal-tools-sdk**: ^0.1.3-dev - Core OPAL SDK

## UI Components
- **@radix-ui/react-***: Comprehensive set of accessible UI primitives
- **lucide-react**: ^0.552.0 - Icon library
- **class-variance-authority**: ^0.7.1 - Component variant management

## Database and Caching
- **@supabase/supabase-js**: ^2.80.0 - Supabase client
- **ioredis**: ^5.8.2 - Redis client for caching
- **pg**: ^8.16.3 - PostgreSQL client

## Messaging and Events
- **kafkajs**: ^2.2.4 - Kafka client
- **@kafkajs/confluent-schema-registry**: ^3.9.0 - Schema registry integration

## Authentication and Security
- **jose**: ^6.1.0 - JWT handling
- **zod**: ^3.25.76 - Schema validation

## External Integrations
- **jsforce**: ^3.10.8 - Salesforce integration
- **googleapis**: ^164.1.0 - Google APIs integration
- **@google-analytics/data**: ^5.2.1 - Google Analytics integration

## Testing Framework
- **jest**: ^29.0.0 - Unit testing framework
- **vitest**: ^1.6.0 - Fast unit test runner
- **@playwright/test**: ^1.48.0 - E2E testing
- **@testing-library/react**: ^16.0.0 - React testing utilities

## Development Tools
- **eslint**: ^9 - Code linting
- **ts-jest**: ^29.0.0 - TypeScript Jest transformer
- **ts-node**: ^10.9.2 - TypeScript execution

## Configuration Files
- **next.config.js**: Next.js configuration with security headers
- **tailwind.config.ts**: Tailwind CSS configuration
- **jest.config.js**: Jest testing configuration with multiple projects
- **vitest.config.ts**: Vitest configuration
- **playwright.config.ts**: Playwright E2E test configuration
- **eslint.config.mjs**: ESLint configuration with Next.js rules
- **tsconfig.json**: TypeScript configuration with strict mode

## Environment Configuration
- Multiple environment templates (.env.*)
- Comprehensive validation for all environments
- Phase-specific configuration support
- Security-first approach with proper secret management