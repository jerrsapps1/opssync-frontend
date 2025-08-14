module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@assets/(.*)$': '<rootDir>/attached_assets/$1',
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.tsx'
  ],
  collectCoverageFrom: [
    'client/src/**/*.{ts,tsx}',
    'server/**/*.ts',
    '!client/src/**/*.d.ts',
    '!server/**/*.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testTimeout: 10000,
  maxWorkers: 4,
  
  // Environment setup for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/components/**/*.test.tsx'],
      testEnvironment: 'jsdom',
    },
    {
      displayName: 'api',
      testMatch: ['<rootDir>/tests/api/**/*.test.ts'],
      testEnvironment: 'node',
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      testEnvironment: 'node',
    }
  ],

  // Global setup and teardown
  globalSetup: '<rootDir>/tests/setup/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/setup/globalTeardown.ts',

  // Mock configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Verbose output for debugging
  verbose: true,

  // Bail after first test suite failure in CI
  bail: process.env.CI ? 1 : 0,

  // Enable watch mode optimizations
  watchman: true,
  
  // Error reporting
  errorOnDeprecated: true,
  
  // Custom reporters for different environments
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml',
    }],
    ['jest-html-reporter', {
      outputPath: 'test-results/test-report.html',
      pageTitle: 'StaffTrak MVP Addons Test Report'
    }]
  ]
};