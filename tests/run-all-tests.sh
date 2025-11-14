#!/bin/bash

# OPAL Admin Dashboard - Complete Test Suite Runner
# This script runs all tests in the proper sequence and reports results

set -e  # Exit on any error

echo ">ê OPAL Admin Dashboard - Complete Test Suite"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN} $1${NC}"
}

print_error() {
    echo -e "${RED}L $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}   $1${NC}"
}

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0
START_TIME=$(date +%s)

# Function to run a test suite
run_test_suite() {
    local test_name="$1"
    local test_command="$2"
    local description="$3"

    print_status "Running $test_name: $description"

    if eval "$test_command"; then
        print_success "$test_name passed"
        ((TESTS_PASSED++))
    else
        print_error "$test_name failed"
        ((TESTS_FAILED++))

        # Don't exit immediately for individual test failures
        # Continue running other tests to get a complete picture
    fi

    echo ""
}

# Check if required dependencies are installed
print_status "Checking dependencies..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

print_success "Dependencies check passed"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
    echo ""
fi

# Run test suites in order
print_status "Starting comprehensive test suite..."
echo ""

# 1. Unit Tests
run_test_suite \
    "Unit Tests" \
    "npm test -- --testPathPattern=tests/unit --passWithNoTests" \
    "Testing utility functions and core logic"

# 2. Component Tests
run_test_suite \
    "Component Tests" \
    "npm test -- --testPathPattern=tests/components --passWithNoTests" \
    "Testing React components and UI interactions"

# 3. API Tests
run_test_suite \
    "API Tests" \
    "npm test -- --testPathPattern=tests/api --passWithNoTests" \
    "Testing API endpoints and routes"

# 4. Build Test (ensure everything compiles)
run_test_suite \
    "Build Test" \
    "npm run build" \
    "Verifying TypeScript compilation and build process"

# 5. E2E Tests (optional - requires server to be running)
print_status "Checking if development server is running..."

if curl -s http://localhost:3000 >/dev/null 2>&1; then
    print_success "Development server is running"

    run_test_suite \
        "E2E Tests" \
        "npm run test:e2e" \
        "End-to-end testing with Playwright"
else
    print_warning "Development server is not running - skipping E2E tests"
    print_warning "To run E2E tests, start the server with: npm run dev"
fi

# Calculate total time
END_TIME=$(date +%s)
TOTAL_TIME=$((END_TIME - START_TIME))
MINUTES=$((TOTAL_TIME / 60))
SECONDS=$((TOTAL_TIME % 60))

# Print final results
echo ""
echo "<Á Test Suite Complete"
echo "====================="
echo ""
print_success "Tests Passed: $TESTS_PASSED"
if [ $TESTS_FAILED -gt 0 ]; then
    print_error "Tests Failed: $TESTS_FAILED"
else
    print_success "Tests Failed: $TESTS_FAILED"
fi
echo ""
echo "ñ  Total time: ${MINUTES}m ${SECONDS}s"
echo ""

# Coverage report (if available)
if [ -d "coverage" ]; then
    print_status "Test coverage report available in: coverage/"

    # Try to open coverage report in browser (optional)
    if command -v open &> /dev/null; then
        echo "=Ê Opening coverage report..."
        open coverage/lcov-report/index.html 2>/dev/null || true
    fi
fi

# Exit with appropriate code
if [ $TESTS_FAILED -gt 0 ]; then
    print_error "Some tests failed. Please check the output above."
    exit 1
else
    print_success "All tests passed! <‰"
    exit 0
fi