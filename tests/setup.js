// Test setup file
const chalk = require('chalk');

// Suppress console logs during tests unless DEBUG is set
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  };
}

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.FLUI_TEST = 'true';

// Increase timeout for API tests
jest.setTimeout(120000);

// Global test utilities
global.testUtils = {
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  mockApiResponse: (data) => {
    return Promise.resolve({
      response: data,
      score: 85,
      tokensUsed: 100
    });
  },
  
  createMockTask: (overrides = {}) => {
    return {
      id: 'test-task',
      type: 'create',
      description: 'Test task',
      status: 'pending',
      iterations: 0,
      maxIterations: 5,
      requiredScore: 80,
      maxDepth: 2,
      currentDepth: 0,
      ...overrides
    };
  }
};

console.log(chalk.cyan('🧪 Test environment initialized'));