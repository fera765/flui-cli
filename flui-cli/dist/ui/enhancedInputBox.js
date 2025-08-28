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
exports.EnhancedInputBox = void 0;
const readline = __importStar(require("readline"));
const readlineLib = readline; // Keep reference for later use
class EnhancedInputBox {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.rl = null;
        this.currentText = '';
        this.cursorRow = 0;
        this.cursorCol = 0;
        this.lines = [''];
        this.inputHistory = [];
        this.historyIndex = -1;
        this.isThinking = false;
        this.spinnerInterval = null;
        this.spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        this.spinnerIndex = 0;
        this.resolveInput = null;
        this.maxWidth = process.stdout.columns || 80;
    }
    initialize() {
        if (this.rl)
            return;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true,
            prompt: ''
        });
        // Enable keypress events
        if (process.stdin.setRawMode) {
            readline.emitKeypressEvents(process.stdin, this.rl);
            process.stdin.setRawMode(true);
        }
        // Handle keypress events
        process.stdin.on('keypress', (str, key) => {
            if (!key || this.isThinking)
                return;
            // Special keys
            if (key.ctrl && key.name === 'c') {
                process.exit(0);
            }
            else if (key.ctrl && key.name === 'l') {
                this.clearScreen();
            }
            else if (key.name === 'return') {
                this.handleEnter();
            }
            else if (key.name === 'backspace') {
                this.handleBackspace();
            }
            else if (key.name === 'delete') {
                this.handleDelete();
            }
            else if (key.name === 'left') {
                this.moveCursorLeft();
            }
            else if (key.name === 'right') {
                this.moveCursorRight();
            }
            else if (key.name === 'up') {
                this.moveCursorUp();
            }
            else if (key.name === 'down') {
                this.moveCursorDown();
            }
            else if (key.name === 'home') {
                this.moveCursorHome();
            }
            else if (key.name === 'end') {
                this.moveCursorEnd();
            }
            else if (key.ctrl && key.name === 'a') {
                this.moveCursorHome();
            }
            else if (key.ctrl && key.name === 'e') {
                this.moveCursorEnd();
            }
            else if (key.shift && key.name === 'return') {
                // Shift+Enter for new line
                this.insertNewLine();
            }
            else if (str && !key.ctrl && !key.meta) {
                // Regular character input
                this.insertChar(str);
            }
            this.redraw();
        });
    }
    insertChar(char) {
        const line = this.lines[this.cursorRow];
        this.lines[this.cursorRow] =
            line.slice(0, this.cursorCol) + char + line.slice(this.cursorCol);
        this.cursorCol++;
        // Word wrap if needed
        if (this.lines[this.cursorRow].length > this.maxWidth - 10) {
            this.wrapLine(this.cursorRow);
        }
    }
    insertNewLine() {
        const currentLine = this.lines[this.cursorRow];
        const beforeCursor = currentLine.slice(0, this.cursorCol);
        const afterCursor = currentLine.slice(this.cursorCol);
        this.lines[this.cursorRow] = beforeCursor;
        this.lines.splice(this.cursorRow + 1, 0, afterCursor);
        this.cursorRow++;
        this.cursorCol = 0;
    }
    handleBackspace() {
        if (this.cursorCol > 0) {
            const line = this.lines[this.cursorRow];
            this.lines[this.cursorRow] =
                line.slice(0, this.cursorCol - 1) + line.slice(this.cursorCol);
            this.cursorCol--;
        }
        else if (this.cursorRow > 0) {
            // Join with previous line
            const prevLine = this.lines[this.cursorRow - 1];
            const currentLine = this.lines[this.cursorRow];
            this.cursorCol = prevLine.length;
            this.lines[this.cursorRow - 1] = prevLine + currentLine;
            this.lines.splice(this.cursorRow, 1);
            this.cursorRow--;
        }
    }
    handleDelete() {
        const line = this.lines[this.cursorRow];
        if (this.cursorCol < line.length) {
            this.lines[this.cursorRow] =
                line.slice(0, this.cursorCol) + line.slice(this.cursorCol + 1);
        }
        else if (this.cursorRow < this.lines.length - 1) {
            // Join with next line
            this.lines[this.cursorRow] += this.lines[this.cursorRow + 1];
            this.lines.splice(this.cursorRow + 1, 1);
        }
    }
    handleEnter() {
        if (this.resolveInput) {
            const text = this.lines.join('\n').trim();
            if (text) {
                this.inputHistory.push(text);
                this.historyIndex = this.inputHistory.length;
            }
            this.lines = [''];
            this.cursorRow = 0;
            this.cursorCol = 0;
            const resolve = this.resolveInput;
            this.resolveInput = null;
            resolve(text);
        }
    }
    moveCursorLeft() {
        if (this.cursorCol > 0) {
            this.cursorCol--;
        }
        else if (this.cursorRow > 0) {
            this.cursorRow--;
            this.cursorCol = this.lines[this.cursorRow].length;
        }
    }
    moveCursorRight() {
        const lineLength = this.lines[this.cursorRow].length;
        if (this.cursorCol < lineLength) {
            this.cursorCol++;
        }
        else if (this.cursorRow < this.lines.length - 1) {
            this.cursorRow++;
            this.cursorCol = 0;
        }
    }
    moveCursorUp() {
        if (this.cursorRow > 0) {
            this.cursorRow--;
            this.cursorCol = Math.min(this.cursorCol, this.lines[this.cursorRow].length);
        }
        else if (this.historyIndex > 0) {
            // Navigate history
            this.historyIndex--;
            this.loadFromHistory();
        }
    }
    moveCursorDown() {
        if (this.cursorRow < this.lines.length - 1) {
            this.cursorRow++;
            this.cursorCol = Math.min(this.cursorCol, this.lines[this.cursorRow].length);
        }
        else if (this.historyIndex < this.inputHistory.length - 1) {
            // Navigate history
            this.historyIndex++;
            this.loadFromHistory();
        }
        else if (this.historyIndex === this.inputHistory.length - 1) {
            // Clear to new input
            this.historyIndex = this.inputHistory.length;
            this.lines = [''];
            this.cursorRow = 0;
            this.cursorCol = 0;
        }
    }
    moveCursorHome() {
        this.cursorCol = 0;
    }
    moveCursorEnd() {
        this.cursorCol = this.lines[this.cursorRow].length;
    }
    loadFromHistory() {
        if (this.historyIndex >= 0 && this.historyIndex < this.inputHistory.length) {
            const text = this.inputHistory[this.historyIndex];
            this.lines = text.split('\n');
            this.cursorRow = this.lines.length - 1;
            this.cursorCol = this.lines[this.cursorRow].length;
        }
    }
    wrapLine(lineIndex) {
        const line = this.lines[lineIndex];
        if (line.length <= this.maxWidth - 10)
            return;
        // Find last space before max width
        let wrapPoint = this.maxWidth - 10;
        for (let i = wrapPoint; i > 0; i--) {
            if (line[i] === ' ') {
                wrapPoint = i;
                break;
            }
        }
        const beforeWrap = line.slice(0, wrapPoint);
        const afterWrap = line.slice(wrapPoint).trim();
        this.lines[lineIndex] = beforeWrap;
        if (lineIndex < this.lines.length - 1) {
            this.lines[lineIndex + 1] = afterWrap + ' ' + this.lines[lineIndex + 1];
        }
        else {
            this.lines.push(afterWrap);
        }
        // Adjust cursor if needed
        if (this.cursorRow === lineIndex && this.cursorCol > wrapPoint) {
            this.cursorRow++;
            this.cursorCol = this.cursorCol - wrapPoint;
        }
    }
    redraw() {
        if (!this.rl || this.isThinking)
            return;
        // Move cursor to bottom of screen
        const rows = process.stdout.rows || 24;
        process.stdout.write(`\x1B[${rows};1H`); // Move to bottom row
        // Clear from cursor to end of screen
        process.stdout.write('\x1B[J');
        // Draw border
        const border = this.themeManager.formatBorder('━'.repeat(this.maxWidth));
        process.stdout.write(border + '\n');
        // Draw input with prompt
        const prompt = this.themeManager.formatPrompt('💬 > ');
        const text = this.lines.join(' ');
        process.stdout.write(prompt + text);
        // Position cursor correctly
        const promptLength = 5; // "💬 > " is 5 chars
        const targetCol = promptLength + this.cursorCol + 1;
        process.stdout.write(`\x1B[${rows + 1};${targetCol}H`);
    }
    display() {
        // Only show prompt, no border spam
        const prompt = this.themeManager.formatPrompt('💬 > ');
        process.stdout.write(prompt);
    }
    async getInput() {
        // Don't display here, it's already shown
        // Use simple readline
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false // Prevent readline from managing the prompt
        });
        return new Promise((resolve) => {
            rl.once('line', (answer) => {
                rl.close();
                if (answer.trim()) {
                    this.inputHistory.push(answer);
                    this.historyIndex = this.inputHistory.length;
                }
                resolve(answer);
            });
        });
    }
    showThinking() {
        this.isThinking = true;
        this.spinnerIndex = 0;
        if (this.spinnerInterval) {
            clearInterval(this.spinnerInterval);
        }
        this.spinnerInterval = setInterval(() => {
            this.spinnerIndex = (this.spinnerIndex + 1) % this.spinnerFrames.length;
            this.drawSpinner();
        }, 100);
    }
    hideThinking() {
        this.isThinking = false;
        if (this.spinnerInterval) {
            clearInterval(this.spinnerInterval);
            this.spinnerInterval = null;
        }
        this.redraw();
    }
    drawSpinner() {
        process.stdout.write('\x1B[2K\r'); // Clear line and return
        const spinner = this.spinnerFrames[this.spinnerIndex];
        const text = this.themeManager.formatInfo(`${spinner} Pensando...`);
        process.stdout.write(text);
    }
    clearScreen() {
        process.stdout.write('\x1Bc');
        process.stdout.write('\x1B[H');
        if (this.onClearScreen) {
            this.onClearScreen();
        }
        this.redraw();
    }
    clear() {
        this.lines = [''];
        this.cursorRow = 0;
        this.cursorCol = 0;
        this.redraw();
    }
    pause() {
        if (process.stdin.setRawMode) {
            process.stdin.setRawMode(false);
        }
    }
    resume() {
        if (process.stdin.setRawMode) {
            process.stdin.setRawMode(true);
        }
        this.redraw();
    }
    destroy() {
        if (this.spinnerInterval) {
            clearInterval(this.spinnerInterval);
        }
        if (this.rl) {
            this.rl.close();
            this.rl = null;
        }
    }
}
exports.EnhancedInputBox = EnhancedInputBox;
//# sourceMappingURL=enhancedInputBox.js.map