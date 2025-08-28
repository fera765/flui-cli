"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createChalkMock = () => {
    const chainable = {};
    const colors = [
        'cyan', 'bold', 'gray', 'white', 'green',
        'yellow', 'red', 'blue', 'magenta', 'dim',
        'black', 'bgGreen', 'bgRed', 'bgBlue',
        'cyanBright', 'blueBright', 'greenBright', 'yellowBright',
        'redBright', 'magentaBright', 'blackBright', 'whiteBright'
    ];
    colors.forEach(color => {
        chainable[color] = jest.fn((text) => text);
        // Make each color chainable
        colors.forEach(innerColor => {
            chainable[color][innerColor] = jest.fn((text) => text);
        });
    });
    return chainable;
};
const chalk = createChalkMock();
exports.default = chalk;
//# sourceMappingURL=chalk.js.map