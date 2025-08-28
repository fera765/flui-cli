"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mockOra = jest.fn((options) => {
    return {
        start: jest.fn().mockReturnThis(),
        stop: jest.fn().mockReturnThis(),
        succeed: jest.fn().mockReturnThis(),
        fail: jest.fn().mockReturnThis(),
        warn: jest.fn().mockReturnThis(),
        info: jest.fn().mockReturnThis(),
        text: '',
        color: 'cyan',
        spinner: 'dots',
    };
});
exports.default = mockOra;
//# sourceMappingURL=ora.js.map