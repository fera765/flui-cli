"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer = {
    createPromptModule: jest.fn(() => {
        return jest.fn(() => Promise.resolve({ theme: 'dark', modelIndex: 1 }));
    }),
    prompt: jest.fn(() => Promise.resolve({ theme: 'dark', modelIndex: 1 }))
};
exports.default = inquirer;
//# sourceMappingURL=inquirer.js.map