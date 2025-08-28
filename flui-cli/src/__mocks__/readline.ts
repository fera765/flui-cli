export const createInterface = jest.fn(() => ({
  question: jest.fn((prompt, callback) => callback('user input')),
  close: jest.fn(),
  on: jest.fn(),
  once: jest.fn((event, handler) => {
    if (event === 'line') {
      setTimeout(() => handler('user input'), 0);
    }
  }),
  write: jest.fn(),
  clearLine: jest.fn(),
  moveCursor: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  setPrompt: jest.fn(),
  prompt: jest.fn(),
  removeListener: jest.fn()
}));