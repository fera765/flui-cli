"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promises = void 0;
exports.promises = {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    access: jest.fn(),
    mkdir: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    unlink: jest.fn(),
    rmdir: jest.fn()
};
exports.default = {
    promises: exports.promises
};
//# sourceMappingURL=fs.js.map