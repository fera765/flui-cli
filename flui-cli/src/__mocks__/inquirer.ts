const inquirer = {
  createPromptModule: jest.fn(() => {
    return jest.fn(() => Promise.resolve({ theme: 'dark', modelIndex: 1 }));
  }),
  prompt: jest.fn(() => Promise.resolve({ theme: 'dark', modelIndex: 1 }))
};

export default inquirer;