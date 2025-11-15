# Coding Style and Conventions

## TypeScript Configuration
- **Strict Mode**: Enabled with strict type checking
- **Target**: ES2017
- **Module Resolution**: Bundler
- **Path Mapping**: `@/*` maps to `./src/*`
- **Experimental Decorators**: Enabled
- **JSX**: React JSX transform

## Code Quality Tools
- **ESLint**: Next.js configuration with TypeScript support
- **Testing**: Jest + Vitest + Playwright for comprehensive testing
- **Type Safety**: Strict TypeScript with comprehensive type definitions

## File Naming Conventions
- **Components**: PascalCase (e.g., `ContentRenderer.tsx`)
- **Utilities**: kebab-case for files, camelCase for exports
- **Types**: Separate type files in `src/types/` or co-located with components
- **Tests**: `*.test.ts`, `*.test.tsx`, or `*.spec.ts`

## Architecture Patterns
- **Next.js App Router**: File-based routing with layout components
- **Component Structure**: Radix UI base components with custom styling
- **Service Layer**: Separation of concerns with service classes
- **Error Prevention**: Comprehensive validation and error boundary systems

## Import Organization
- External libraries first
- Internal imports with `@/` prefix
- Type imports clearly separated
- Consistent path mapping usage

## Environment Configuration
- Environment-specific validation
- Comprehensive .env templates
- Security-first configuration approach
- Phase-based feature toggles

## Testing Standards
- Unit tests for utilities and services
- Integration tests for API endpoints
- E2E tests for user workflows
- Component tests for UI interactions
- Coverage thresholds: 75% minimum, 85-90% for critical components

## Documentation Requirements
- JSDoc comments for public APIs
- Inline comments for complex business logic
- README files for major features
- Architecture decision records (ADRs) for significant changes

## Security Practices
- Input validation using Zod schemas
- Bearer token authentication
- Audit logging for sensitive operations
- Content Security Policy enforcement
- Zero-trust security framework