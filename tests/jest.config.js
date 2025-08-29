module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/*.test.ts',
    '**/*.test.js'
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: 'node',
        resolveJsonModule: true,
        strict: false
      }
    }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../src/$1'
  },
  collectCoverageFrom: [
    '../src/**/*.{ts,tsx}',
    '!../src/**/*.d.ts',
    '!../src/**/*.test.{ts,tsx}',
    '!../src/index*.ts',
    '!../src/demo*.ts',
    '!../src/test*.ts'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 120000, // 2 minutes for integration tests
  maxWorkers: 1, // Run tests sequentially for API calls
  setupFilesAfterEnv: ['<rootDir>/setup.js']
};