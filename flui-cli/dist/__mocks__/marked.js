"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marked = void 0;
exports.marked = jest.fn((text) => text);
exports.marked.setOptions = jest.fn();
exports.marked.parseInline = jest.fn((text) => text);
exports.default = exports.marked;
//# sourceMappingURL=marked.js.map