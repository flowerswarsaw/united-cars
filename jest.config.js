/** @type {import('jest').Config} */
const config = {
  // Test environment
  testEnvironment: 'node',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/__tests__/setup/test-setup.ts'
  ],

  // Test file patterns
  testMatch: [
    '<rootDir>/__tests__/**/*.test.ts',
    '<rootDir>/__tests__/**/*.test.tsx'
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/__tests__/e2e/',
    '<rootDir>/__tests__/performance/'
  ],

  // Module name mapping for path aliases
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/apps/web/src/$1',
    '^@united-cars/(.*)$': '<rootDir>/packages/$1/src'
  },

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    },
    // Specific thresholds for CRM core
    '<rootDir>/packages/crm-core/src/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    // Specific thresholds for CRM repositories
    '<rootDir>/packages/crm-mocks/src/repositories/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },

  // Files to collect coverage from
  collectCoverageFrom: [
    'packages/crm-core/src/**/*.{ts,tsx}',
    'packages/crm-mocks/src/**/*.{ts,tsx}',
    'apps/web/src/app/api/crm/**/*.{ts,tsx}',
    'apps/web/src/components/crm/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/*.stories.{ts,tsx}',
    '!**/*.test.{ts,tsx}',
    '!**/node_modules/**',
    '!**/.next/**'
  ],

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  },

  // Module file extensions
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json'
  ],

  // Global setup and teardown
  globalSetup: '<rootDir>/__tests__/setup/global-setup.ts',
  globalTeardown: '<rootDir>/__tests__/setup/global-teardown.ts',

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '<rootDir>/test-results',
      outputName: 'jest-results.xml',
      suiteName: 'CRM Test Suite'
    }],
    ['jest-html-reporters', {
      publicPath: '<rootDir>/test-results/html',
      filename: 'jest-report.html',
      pageTitle: 'CRM Test Report',
      includeFailureMsg: true,
      includeSuiteFailure: true
    }]
  ],

  // Projects for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/__tests__/unit/**/*.test.ts',
        '<rootDir>/__tests__/unit/**/*.test.tsx'
      ],
      testEnvironment: 'node'
    },
    {
      displayName: 'integration',
      testMatch: [
        '<rootDir>/__tests__/integration/**/*.test.ts',
        '<rootDir>/__tests__/integration/**/*.test.tsx'
      ],
      testEnvironment: 'node',
      setupFilesAfterEnv: [
        '<rootDir>/__tests__/setup/test-setup.ts'
      ]
    },
    {
      displayName: 'security',
      testMatch: [
        '<rootDir>/__tests__/security/**/*.test.ts'
      ],
      testEnvironment: 'node',
      setupFilesAfterEnv: [
        '<rootDir>/__tests__/setup/test-setup.ts'
      ]
    }
  ],

  // Error handling
  errorOnDeprecated: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,

  // Maximum worker pools
  maxWorkers: '50%',

  // Cache directory
  cacheDirectory: '<rootDir>/.jest-cache',

  // Watch mode configuration
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/coverage/',
    '<rootDir>/test-results/'
  ],

  // Performance monitoring
  detectOpenHandles: true,
  forceExit: false,

  // Extensions to treat as ESM
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  // Custom test sequences
  testSequencer: '<rootDir>/__tests__/setup/test-sequencer.js'
};

module.exports = config;