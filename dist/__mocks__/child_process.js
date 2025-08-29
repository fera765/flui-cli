"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fork = exports.spawn = exports.execSync = exports.exec = void 0;
exports.exec = jest.fn();
exports.execSync = jest.fn();
exports.spawn = jest.fn();
exports.fork = jest.fn();
exports.default = {
    exec: exports.exec,
    execSync: exports.execSync,
    spawn: exports.spawn,
    fork: exports.fork
};
//# sourceMappingURL=child_process.js.map