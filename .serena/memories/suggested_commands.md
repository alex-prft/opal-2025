# Suggested Development Commands

## Core Development
- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Testing Commands
- `npm run test` - Run Jest unit tests
- `npm run test:watch` - Run Jest in watch mode
- `npm run test:unit` - Run Vitest unit tests
- `npm run test:unit:watch` - Run Vitest in watch mode
- `npm run test:integration` - Run integration tests
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run test:e2e:ui` - Run Playwright with UI mode
- `npm run test:e2e:headed` - Run Playwright in headed mode
- `npm run test:e2e:debug` - Debug Playwright tests

## Validation & Quality Assurance
- `npm run validate:all` - Run all validation checks
- `npm run validate:runtime-errors` - Check for runtime errors
- `npm run validate:security` - Security validation
- `npm run validate:deployment` - Deployment validation
- `npm run validate:opal` - Validate OPAL integration
- `npm run validate:jsx-parsing` - JSX parsing validation
- `npm run error-check` - Run error prevention checks
- `npm run error-check:fix` - Auto-fix preventable errors

## Pre-deployment Hooks
- `npm run pre-commit` - Run pre-commit validations
- `npm run pre-deploy` - Complete pre-deployment validation suite

## OPAL & Production Tools
- `npm run start:opal-tools` - Start OPAL SDK tools
- `npm run start:production-tools` - Start production SDK tools
- `npm run deploy:prod` - Deploy to production via script

## Kafka & Messaging
- `npm run kafka:init` - Initialize Kafka setup
- `npm run kafka:test-producer` - Test Kafka producer
- `npm run kafka:start-diagnostics` - Start diagnostics consumer
- `npm run kafka:start-recommendations` - Start recommendations consumer

## Governance & Compliance
- `npm run governance:deploy` - Deploy Supabase governance
- `npm run governance:health` - Check governance health
- `npm run governance:status` - Check governance status
- `npm run governance:pii-scan` - Run PII scan
- `npm run governance:purge-check` - Check purge status
- `npm run governance:validate-all` - Validate all governance aspects

## System Commands for macOS (Darwin)
- `find` - Search for files and directories
- `grep` - Search text patterns
- `ls` - List directory contents
- `cd` - Change directory
- `git` - Git version control
- `curl` - HTTP requests
- `jq` - JSON processor