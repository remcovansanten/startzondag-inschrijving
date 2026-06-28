module.exports = {
  displayName: 'E2E Tests',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/e2e/**/*.spec.ts'],
  testTimeout: 30000,
  globalSetup: '<rootDir>/e2e/global-setup.ts',
  globalTeardown: '<rootDir>/e2e/global-teardown.ts',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  }
}