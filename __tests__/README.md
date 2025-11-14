# OSA Admin Dashboard Test Suite

Comprehensive testing suite for the OSA Admin Dashboard with production-ready API and UI tests.

## Overview

This test suite provides comprehensive coverage for:

- **API Endpoints**: Force sync, health monitoring, and webhook processing
- **UI Workflows**: End-to-end user interactions and responsive design
- **Integration**: Cross-service communication and error handling
- **Performance**: Real-time monitoring and fallback mechanisms

## Test Structure

```
__tests__/
├── api/                    # API endpoint tests (Jest)
│   ├── force-sync.test.ts  # Force sync API comprehensive tests
│   └── health.test.ts      # Health monitoring API tests
├── e2e/                    # End-to-end UI tests (Playwright)
│   └── force-sync-workflow.spec.ts  # Complete UI workflows
└── README.md              # This documentation
```

## Running Tests

### API Tests (Jest)

Run all API tests:
```bash
npm test
```

Run specific API test files:
```bash
# Force sync API tests
npm test __tests__/api/force-sync.test.ts

# Health API tests
npm test __tests__/api/health.test.ts
```

Run tests with coverage:
```bash
npm test -- --coverage
```

Watch mode for development:
```bash
npm test -- --watch
```

### E2E Tests (Playwright)

Install Playwright browsers (first time only):
```bash
npx playwright install
```

Run all E2E tests:
```bash
npx playwright test
```

Run specific E2E tests:
```bash
# Force sync workflow tests
npx playwright test force-sync-workflow

# Health monitoring tests
npx playwright test --grep "Health Status"
```

Run tests in headed mode (see browser):
```bash
npx playwright test --headed
```

Run tests for specific browsers:
```bash
npx playwright test --project=chromium
npx playwright test --project="Mobile Chrome"
```

Debug mode (step through tests):
```bash
npx playwright test --debug
```

View test report:
```bash
npx playwright show-report
```

## Test Scenarios Covered

### Force Sync API Tests

1. **Successful Sync Triggering**
   - Validates complete sync initiation flow
   - Checks correlation ID and session management
   - Verifies polling URL generation

2. **Concurrent Sync Prevention**
   - Tests active sync detection
   - Validates 409 conflict responses
   - Ensures proper session management

3. **Authentication & Configuration**
   - Tests missing auth key handling
   - Validates configuration error responses
   - Checks environment setup requirements

4. **Error Handling**
   - Service failure scenarios
   - Network timeout handling
   - Graceful degradation testing

5. **Session Management**
   - Status polling functionality
   - Progress tracking accuracy
   - Session cancellation workflows

6. **Integration Workflows**
   - Complete sync lifecycle testing
   - Multi-step operation validation
   - Real-time status updates

### Health API Tests

1. **Live Health Monitoring**
   - Database connectivity checks
   - OPAL API availability testing
   - Webhook activity monitoring
   - Workflow engine status validation

2. **Degraded State Handling**
   - Partial service failure scenarios
   - Warning generation and display
   - Performance degradation detection

3. **Fallback Mechanisms**
   - Cached data utilization
   - Graceful service degradation
   - Cache age and TTL management

4. **Force Refresh Functionality**
   - Manual health data refresh
   - Cache invalidation testing
   - Real-time update validation

5. **Edge Cases**
   - Malformed response handling
   - Concurrent request management
   - Cache header validation

### E2E UI Workflow Tests

1. **Force Sync UI Interactions**
   - Trigger button functionality
   - Progress bar and status display
   - Real-time progress updates
   - Completion state handling

2. **Cancellation Workflows**
   - Cancel button availability
   - Cancellation confirmation
   - Status cleanup after cancellation

3. **Error State Management**
   - Error message display
   - Retry button functionality
   - User-friendly error communication

4. **Concurrent Operation Handling**
   - Active sync detection in UI
   - Warning message display
   - Link to existing operations

5. **Health Status Monitoring**
   - Health status card display
   - Service status indicators
   - Metric visualization (latency, response times)
   - Fallback data indication

6. **Agent Status Monitoring**
   - Agent status grid display
   - Error pattern visualization
   - Webhook event expansion
   - Real-time status updates

7. **Responsive Design**
   - Mobile viewport adaptation
   - Compact vs. full feature sets
   - Touch-friendly interactions
   - Cross-browser compatibility

## Test Configuration

### Jest Configuration

- **Coverage Thresholds**: 75% for core functionality, 85% for critical services
- **Test Environment**: Node.js for API tests
- **Module Mapping**: Path aliases (@/) properly configured
- **Parallel Execution**: 50% of available workers
- **Reporting**: JUnit XML for CI/CD integration

### Playwright Configuration

- **Cross-Browser Testing**: Chrome, Firefox, Safari, Edge
- **Mobile Testing**: Pixel 5, iPhone 12 viewports
- **Retry Strategy**: 2 retries on CI environments
- **Artifacts**: Screenshots, videos, traces on failure
- **Reporting**: HTML, JUnit XML, JSON for comprehensive analysis

## Environment Variables

Required for comprehensive testing:

```bash
# OPAL Integration
OPAL_API_BASE=https://api.opal.optimizely.com
OPAL_API_KEY=your_opal_api_key
OPAL_WORKSPACE_ID=your_workspace_id
OPAL_STRATEGY_WORKFLOW_AUTH_KEY=your_auth_key

# Webhook Configuration
OSA_WEBHOOK_SHARED_SECRET=your_webhook_secret

# Test Configuration
NODE_ENV=test
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run API Tests
  run: npm test -- --coverage --ci

- name: Run E2E Tests
  run: npx playwright test --reporter=github

- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results/
```

### Test Results

- **Jest Results**: `test-results/jest-results.xml`
- **Playwright Results**: `test-results/playwright-results.xml`
- **Coverage Reports**: `coverage/` directory
- **E2E Artifacts**: `test-results/playwright-artifacts/`

## Development Workflow

### Writing New Tests

1. **API Tests**: Add to `__tests__/api/` with comprehensive scenarios
2. **E2E Tests**: Add to `__tests__/e2e/` with user workflow focus
3. **Follow Patterns**: Use existing test structures as templates
4. **Mock External Services**: Use Jest mocks for API dependencies
5. **Test Data**: Use realistic data that matches production scenarios

### Test-Driven Development

1. Write failing tests first
2. Implement minimal functionality
3. Refactor with test coverage
4. Ensure production readiness with comprehensive scenarios

### Debugging Tests

1. **API Tests**: Use `console.log` and Jest's `--verbose` flag
2. **E2E Tests**: Use `--headed` and `--debug` flags
3. **Screenshots**: Automatic on failure, manual with `await page.screenshot()`
4. **Network Logs**: Enable in Playwright for API debugging

## Performance Considerations

- **Parallel Execution**: Tests run in parallel for faster feedback
- **Resource Management**: Proper cleanup in afterEach/afterAll hooks
- **Timeouts**: Reasonable timeouts for real-world conditions
- **Test Isolation**: Each test is independent and can run alone

## Coverage Goals

- **Critical APIs**: 90% line and branch coverage
- **UI Components**: 80% interaction coverage
- **Integration Workflows**: 100% happy path + major error scenarios
- **Error Handling**: All error states and fallback mechanisms tested

## Maintenance

- **Regular Updates**: Keep test dependencies current
- **Browser Updates**: Playwright browsers updated monthly
- **Test Data**: Refresh test data to match production patterns
- **Performance**: Monitor test execution times and optimize as needed