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
exports.SimpleInputBox = void 0;
const readline = __importStar(require("readline"));
class SimpleInputBox {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.rl = null;
        this.isThinking = false;
        this.spinnerInterval = null;
        this.spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        this.spinnerIndex = 0;
        this.inputHistory = [];
        this.historyIndex = -1;
        this.isWaitingForInput = false;
    }
    initialize() {
        // Setup is done when needed
    }
    display() {
        if (!this.isThinking && !this.isWaitingForInput) {
            const prompt = this.themeManager.formatPrompt('💬 > ');
            process.stdout.write(prompt);
        }
    }
    async getInput() {
        if (this.isWaitingForInput) {
            return ''; // Prevent multiple simultaneous inputs
        }
        this.isWaitingForInput = true;
        // Create a fresh readline interface for each input
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true,
            prompt: ''
        });
        return new Promise((resolve) => {
            if (!this.rl) {
                this.isWaitingForInput = false;
                resolve('');
                return;
            }
            // Handle line input
            this.rl.once('line', (input) => {
                if (this.rl) {
                    this.rl.close();
                    this.rl = null;
                }
                this.isWaitingForInput = false;
                // Save to history if not empty
                const trimmed = input.trim();
                if (trimmed && trimmed !== '/exit') {
                    this.inputHistory.push(trimmed);
                    this.historyIndex = this.inputHistory.length;
                }
                resolve(input);
            });
            // Handle history navigation with arrow keys
            if (process.stdin.isTTY) {
                readline.emitKeypressEvents(process.stdin, this.rl);
                if (process.stdin.setRawMode) {
                    process.stdin.setRawMode(true);
                }
                const keypressHandler = (str, key) => {
                    if (!key || !this.rl)
                        return;
                    if (key.name === 'up') {
                        // Navigate history up
                        if (this.historyIndex > 0) {
                            this.historyIndex--;
                            const historicInput = this.inputHistory[this.historyIndex];
                            // Clear current line and write historic input
                            if (this.rl.line) {
                                process.stdout.write('\r' + ' '.repeat(this.rl.line.length + 10) + '\r');
                            }
                            process.stdout.write(this.themeManager.formatPrompt('💬 > ') + historicInput);
                            this.rl.line = historicInput;
                            this.rl.cursor = historicInput.length;
                        }
                    }
                    else if (key.name === 'down') {
                        // Navigate history down
                        if (this.historyIndex < this.inputHistory.length - 1) {
                            this.historyIndex++;
                            const historicInput = this.inputHistory[this.historyIndex];
                            // Clear current line and write historic input
                            if (this.rl.line) {
                                process.stdout.write('\r' + ' '.repeat(this.rl.line.length + 10) + '\r');
                            }
                            process.stdout.write(this.themeManager.formatPrompt('💬 > ') + historicInput);
                            this.rl.line = historicInput;
                            this.rl.cursor = historicInput.length;
                        }
                        else if (this.historyIndex === this.inputHistory.length - 1) {
                            // Clear input when at the end of history
                            this.historyIndex = this.inputHistory.length;
                            if (this.rl.line) {
                                process.stdout.write('\r' + ' '.repeat(this.rl.line.length + 10) + '\r');
                            }
                            process.stdout.write(this.themeManager.formatPrompt('💬 > '));
                            this.rl.line = '';
                            this.rl.cursor = 0;
                        }
                    }
                };
                process.stdin.on('keypress', keypressHandler);
                // Cleanup on close
                this.rl.once('close', () => {
                    process.stdin.removeListener('keypress', keypressHandler);
                    if (process.stdin.setRawMode && process.stdin.isTTY) {
                        process.stdin.setRawMode(false);
                    }
                });
            }
        });
    }
    showThinking() {
        this.isThinking = true;
        this.spinnerIndex = 0;
        // Clear current line
        process.stdout.write('\r' + ' '.repeat(50) + '\r');
        if (this.spinnerInterval) {
            clearInterval(this.spinnerInterval);
        }
        this.spinnerInterval = setInterval(() => {
            if (this.isThinking) {
                this.spinnerIndex = (this.spinnerIndex + 1) % this.spinnerFrames.length;
                const spinner = this.spinnerFrames[this.spinnerIndex];
                const text = this.themeManager.formatInfo(`${spinner} Pensando...`);
                process.stdout.write('\r' + text);
            }
        }, 100);
    }
    hideThinking() {
        this.isThinking = false;
        if (this.spinnerInterval) {
            clearInterval(this.spinnerInterval);
            this.spinnerInterval = null;
        }
        // Clear the spinner line
        process.stdout.write('\r' + ' '.repeat(50) + '\r');
    }
    clearScreen() {
        process.stdout.write('\x1Bc');
        process.stdout.write('\x1B[H');
        if (this.onClearScreen) {
            this.onClearScreen();
        }
    }
    clear() {
        // Just clear the current line
        process.stdout.write('\r' + ' '.repeat(80) + '\r');
    }
    pause() {
        if (this.rl) {
            this.rl.pause();
        }
    }
    resume() {
        if (this.rl) {
            this.rl.resume();
        }
    }
    destroy() {
        if (this.spinnerInterval) {
            clearInterval(this.spinnerInterval);
            this.spinnerInterval = null;
        }
        if (this.rl) {
            this.rl.close();
            this.rl = null;
        }
        this.isWaitingForInput = false;
    }
}
exports.SimpleInputBox = SimpleInputBox;
//# sourceMappingURL=simpleInputBox.js.map