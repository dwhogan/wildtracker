module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/src/**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 60,
      statements: 60
    }
  },
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  collectCoverage: true,
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/coverage/'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
}; 