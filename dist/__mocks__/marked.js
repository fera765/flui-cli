"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marked = void 0;
// Mock for marked v4
exports.marked = jest.fn((text) => text);
exports.marked.setOptions = jest.fn();
exports.marked.parseInline = jest.fn((text) => text);
exports.marked.use = jest.fn();
exports.default = exports.marked;
//# sourceMappingURL=marked.js.map