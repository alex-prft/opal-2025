# Task Completion Guidelines

## Pre-Deployment Checklist
Always run these commands before deployment:
1. `npm run validate:runtime-errors` - Check for runtime errors
2. `npm run error-check` - Run error prevention checks
3. `npm run validate:jsx-parsing` - JSX parsing validation
4. `npm run validate:all` - Run all validation checks
5. `npm run pre-deploy` - Complete pre-deployment validation suite

## Testing Requirements
Before marking any task complete:
1. Run relevant unit tests: `npm run test:unit`
2. Run integration tests if API changes: `npm run test:integration`
3. Run E2E tests for UI changes: `npm run test:e2e`
4. Verify no breaking changes with `npm run test`

## Code Quality Gates
1. ESLint must pass: `npm run lint`
2. TypeScript compilation must succeed: `npm run build`
3. All tests must pass with required coverage
4. Security validation must pass: `npm run validate:security`

## OPAL Integration Validation
For OPAL-related changes:
1. `npm run validate:opal` - Validate OPAL integration
2. `npm run start:opal-tools` - Test OPAL SDK functionality
3. Verify tool discovery endpoints are working

## SOP Compliance
The application has strict SOP (Standard Operating Procedure) compliance:
1. Run `npm run test:sop-compliance` - SOP compliance tests
2. Run `npm run validate:sop-all` - Complete SOP validation
3. Ensure no mock data in production code
4. Validate pageId requirements

## Documentation Updates
When completing tasks:
1. Update relevant README files
2. Update CLAUDE.md if new patterns are introduced
3. Document any new environment variables
4. Update API documentation if endpoints change

## Environment Considerations
- Always test in development environment first
- Validate environment variables are correctly set
- Ensure phase-specific features work as expected
- Test with production-like data when possible

## Security Validation
- Run PII scans: `npm run governance:pii-scan`
- Validate authentication flows
- Test input validation
- Verify audit logging is working

## Performance Checks
- Validate caching mechanisms
- Check database query performance
- Verify Redis connections are working
- Test Kafka message processing if applicable

## Never Skip
- Security validations are mandatory
- SOP compliance cannot be bypassed
- Always verify file paths and module names
- Test your code - no feature is complete without tests