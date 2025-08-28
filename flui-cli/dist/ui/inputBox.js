"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputBox = void 0;
const readline = __importStar(require("readline"));
class InputBox {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.rl = null;
        this.isThinking = false;
        this.spinnerInterval = null;
        this.spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        this.spinnerIndex = 0;
        this.currentInput = '';
        this.cursorPosition = 0;
        this.inputHistory = [];
        this.historyIndex = -1;
    }
    initialize() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true
        });
        // Set up key bindings
        this.rl.on('line', (input) => {
            this.currentInput = input;
            this.inputHistory.push(input);
            this.historyIndex = this.inputHistory.length;
        });
        this.rl.on('keypress', (char, key) => {
            if (!key)
                return;
            switch (key.name) {
                case 'up':
                    if (this.historyIndex > 0) {
                        this.historyIndex--;
                        this.currentInput = this.inputHistory[this.historyIndex] || '';
                        this.updateDisplay();
                    }
                    break;
                case 'down':
                    if (this.historyIndex < this.inputHistory.length - 1) {
                        this.historyIndex++;
                        this.currentInput = this.inputHistory[this.historyIndex] || '';
                        this.updateDisplay();
                    }
                    break;
                case 'left':
                    if (this.cursorPosition > 0) {
                        this.cursorPosition--;
                        if (this.rl?.output?.moveCursor) {
                            this.rl.output.moveCursor(-1, 0);
                        }
                    }
                    break;
                case 'right':
                    if (this.cursorPosition < this.currentInput.length) {
                        this.cursorPosition++;
                        if (this.rl?.output?.moveCursor) {
                            this.rl.output.moveCursor(1, 0);
                        }
                    }
                    break;
            }
        });
    }
    updateDisplay() {
        if (!this.rl)
            return;
        // Clear current line
        if (this.rl.output?.clearLine) {
            this.rl.output.clearLine(0);
            this.rl.output.moveCursor(-1000, 0);
        }
        // Write updated input
        this.rl.write(this.currentInput);
        this.cursorPosition = this.currentInput.length;
    }
    display() {
        const border = this.themeManager.formatBorder('━'.repeat(process.stdout.columns || 80));
        // Move cursor to bottom of screen
        process.stdout.write('\x1B[999B'); // Move down
        process.stdout.write('\x1B[0G'); // Move to start of line
        // Draw border
        process.stdout.write(border + '\n');
        // Draw input prompt
        const prompt = this.themeManager.formatPrimary('💬 > ');
        process.stdout.write(prompt);
    }
    async getUserInput() {
        if (!this.rl) {
            this.initialize();
        }
        this.display();
        return new Promise((resolve) => {
            if (!this.rl)
                return resolve('');
            const handler = (input) => {
                this.currentInput = '';
                this.cursorPosition = 0;
                resolve(input.trim());
            };
            this.rl.once('line', handler);
        });
    }
    startInput() {
        if (!this.rl) {
            this.initialize();
        }
        this.display();
        this.rl?.resume();
    }
    showThinking() {
        this.isThinking = true;
        if (!this.rl)
            return;
        // Clear input area
        if (this.rl.output?.clearLine) {
            this.rl.output.clearLine(0);
            this.rl.output.moveCursor(-1000, 0);
        }
        // Start spinner animation
        this.spinnerInterval = setInterval(() => {
            if (!this.rl || !this.rl.output)
                return;
            if (this.rl.output.clearLine) {
                this.rl.output.clearLine(0);
                this.rl.output.moveCursor(-1000, 0);
            }
            const spinner = this.spinnerFrames[this.spinnerIndex];
            this.spinnerIndex = (this.spinnerIndex + 1) % this.spinnerFrames.length;
            const message = this.themeManager.formatInfo(`${spinner} Pensando...`);
            process.stdout.write(message);
        }, 80);
        // Show initial frame
        const spinner = this.spinnerFrames[0];
        const message = this.themeManager.formatInfo(`${spinner} Pensando...`);
        process.stdout.write(message);
    }
    hideThinking() {
        this.isThinking = false;
        if (this.spinnerInterval) {
            clearInterval(this.spinnerInterval);
            this.spinnerInterval = null;
        }
        if (!this.rl)
            return;
        // Clear spinner
        if (this.rl.output?.clearLine) {
            this.rl.output.clearLine(0);
            this.rl.output.moveCursor(-1000, 0);
        }
        // Restore input box
        this.display();
    }
    clear() {
        if (!this.rl)
            return;
        if (this.rl.output?.clearLine) {
            this.rl.output.clearLine(0);
        }
        this.rl.write('');
        this.currentInput = '';
        this.cursorPosition = 0;
    }
    resetCursor() {
        if (!this.rl)
            return;
        if (this.rl.output?.moveCursor) {
            this.rl.output.moveCursor(-1000, 0);
        }
        this.cursorPosition = 0;
    }
    destroy() {
        if (this.spinnerInterval) {
            clearInterval(this.spinnerInterval);
            this.spinnerInterval = null;
        }
        if (this.rl) {
            if (this.rl.output?.clearLine) {
                this.rl.output.clearLine(0);
            }
            this.rl.close();
            this.rl = null;
        }
    }
}
exports.InputBox = InputBox;
//# sourceMappingURL=inputBox.js.map