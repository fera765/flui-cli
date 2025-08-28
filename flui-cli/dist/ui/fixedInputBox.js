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
exports.FixedInputBox = void 0;
const readline = __importStar(require("readline"));
class FixedInputBox {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.spinnerInterval = null;
        this.spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        this.spinnerIndex = 0;
        this.isThinking = false;
        this.bottomRow = 0;
        this.bottomRow = process.stdout.rows || 24;
    }
    initialize() {
        // Calculate bottom position
        this.bottomRow = process.stdout.rows || 24;
    }
    moveToBottom() {
        // Move cursor to bottom of screen for input
        process.stdout.write(`\x1B[${this.bottomRow};1H`);
    }
    display() {
        if (!this.isThinking) {
            this.moveToBottom();
            // Clear the line and show prompt
            process.stdout.write('\x1B[2K'); // Clear entire line
            const prompt = this.themeManager.formatPrompt('💬 > ');
            process.stdout.write(prompt);
        }
    }
    async getInput() {
        this.moveToBottom();
        // Create readline interface with proper prompt
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true,
            prompt: this.themeManager.formatPrompt('💬 > ')
        });
        // Clear line and show prompt
        process.stdout.write('\x1B[2K'); // Clear line
        rl.prompt();
        return new Promise((resolve) => {
            rl.on('line', (input) => {
                rl.close();
                // Clear the input line after entering
                this.moveToBottom();
                process.stdout.write('\x1B[2K'); // Clear line
                // Move cursor up to show the message in timeline area
                process.stdout.write(`\x1B[${this.bottomRow - 2};1H`);
                resolve(input);
            });
        });
    }
    showThinking() {
        this.isThinking = true;
        this.spinnerIndex = 0;
        this.moveToBottom();
        process.stdout.write('\x1B[2K'); // Clear line
        if (this.spinnerInterval) {
            clearInterval(this.spinnerInterval);
        }
        this.spinnerInterval = setInterval(() => {
            this.moveToBottom();
            const spinner = this.spinnerFrames[this.spinnerIndex];
            const text = this.themeManager.formatInfo(`${spinner} Pensando...`);
            process.stdout.write('\x1B[2K' + text); // Clear and write
            this.spinnerIndex = (this.spinnerIndex + 1) % this.spinnerFrames.length;
        }, 100);
    }
    hideThinking() {
        this.isThinking = false;
        if (this.spinnerInterval) {
            clearInterval(this.spinnerInterval);
            this.spinnerInterval = null;
        }
        this.moveToBottom();
        process.stdout.write('\x1B[2K'); // Clear line
    }
    clear() {
        this.moveToBottom();
        process.stdout.write('\x1B[2K');
    }
    clearScreen() {
        process.stdout.write('\x1Bc\x1B[H');
        if (this.onClearScreen) {
            this.onClearScreen();
        }
    }
    pause() {
        // Nothing to pause
    }
    resume() {
        // Recalculate bottom position and display
        this.bottomRow = process.stdout.rows || 24;
        this.display();
    }
    destroy() {
        if (this.spinnerInterval) {
            clearInterval(this.spinnerInterval);
            this.spinnerInterval = null;
        }
    }
}
exports.FixedInputBox = FixedInputBox;
//# sourceMappingURL=fixedInputBox.js.map