/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  rootDir: '.',
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,ts,tsx}',
    '<rootDir>/src/**/*.test.{js,ts,tsx}',
    '<rootDir>/__tests__/**/*.test.{js,ts,tsx}' // Added our new test directory
  ],
  // Use different environments for different test types
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  projects: [
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/tests/unit/**/*.test.{js,ts,tsx}',
        '<rootDir>/src/components/**/*.test.{js,ts,tsx}',
        '<rootDir>/src/hooks/**/*.test.{js,ts,tsx}'
      ],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
    },
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/tests/unit/**/opal-*.test.{js,ts}',
        '<rootDir>/tests/unit/**/api-*.test.{js,ts}',
        '<rootDir>/src/app/api/**/*.test.{js,ts}'
      ],
      setupFilesAfterEnv: ['<rootDir>/tests/setup-node.ts']
    }
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  verbose: true,
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,ts,tsx}',
    '!src/**/*.spec.{js,ts,tsx}',
    '!src/**/node_modules/**',
    // Exclude specific files
    '!src/app/layout.tsx',
    '!src/app/globals.css'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75
    },
    // Stricter thresholds for critical components
    './src/lib/force-sync/': {
      branches: 85,
      functions: 90,
      lines: 85,
      statements: 85
    },
    './src/lib/health/': {
      branches: 85,
      functions: 90,
      lines: 85,
      statements: 85
    },
    './src/app/api/': {
      branches: 80,
      functions: 85,
      lines: 80,
      statements: 80
    }
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/__tests__/e2e/' // Exclude E2E tests from Jest (run with Playwright)
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  // Enhanced configuration for production readiness
  clearMocks: true,
  restoreMocks: true,
  maxWorkers: '50%',
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'jest-results.xml',
      suiteName: 'OSA Admin Dashboard API Tests'
    }]
  ]
};

module.exports = config;