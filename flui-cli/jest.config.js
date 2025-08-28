module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^chalk$': '<rootDir>/src/__mocks__/chalk.ts',
    '^ora$': '<rootDir>/src/__mocks__/ora.ts',
    '^readline$': '<rootDir>/src/__mocks__/readline.ts',
    '^marked$': '<rootDir>/src/__mocks__/marked.ts',
    '^inquirer$': '<rootDir>/src/__mocks__/inquirer.ts',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};