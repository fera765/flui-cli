"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatUI = void 0;
const chalk_1 = __importDefault(require("chalk"));
const themeManager_1 = require("./themeManager");
const cleanInputBox_1 = require("./cleanInputBox");
const messageTimeline_1 = require("./messageTimeline");
class ChatUI {
    constructor() {
        this.spinner = null;
        this.themeManager = new themeManager_1.ThemeManager();
        this.inputBox = new cleanInputBox_1.CleanInputBox(this.themeManager);
        this.timeline = new messageTimeline_1.MessageTimeline(this.themeManager);
        this.inputBox.initialize();
        // Connect Ctrl+L handler
        this.inputBox.onClearScreen = () => {
            this.timeline.clearVisible();
            this.timeline.display(true);
            this.inputBox.display();
        };
    }
    displayWelcome() {
        // Clear terminal completely
        process.stdout.write('\x1Bc'); // Clear screen and scrollback
        process.stdout.write('\x1B[3J'); // Clear scrollback buffer
        process.stdout.write('\x1B[H'); // Move cursor to home
        const primary = this.themeManager.formatPrimary('\n ╔════════════════════════════════════════╗ ');
        console.log(primary);
        console.log(this.themeManager.formatPrimary(' ║         Flui CLI v1.0.0                ║ '));
        console.log(this.themeManager.formatPrimary(' ╚════════════════════════════════════════╝ \n'));
        console.log(this.themeManager.formatInfo('Comandos disponíveis:'));
        console.log(this.themeManager.formatWarning('  /model [1-3]') + this.themeManager.formatBorder(' - Trocar modelo'));
        console.log(this.themeManager.formatWarning('  /theme') + this.themeManager.formatBorder(' - Trocar tema'));
        console.log(this.themeManager.formatWarning('  /exit') + this.themeManager.formatBorder(' - Sair do chat'));
        console.log(); // Just a blank line instead of border
    }
    displayDisclaimer() {
        console.log(chalk_1.default.bgRed.white('\n ⚠️  AVISO IMPORTANTE ⚠️ \n'));
        console.log(chalk_1.default.red('Este código foi desenvolvido exclusivamente para fins de estudo.'));
        console.log(chalk_1.default.red('O autor não se responsabiliza por qualquer uso ou ação realizada.'));
        console.log(chalk_1.default.red('@LLM7.io - Uso educacional apenas.\n'));
    }
    displayMessage(message, role) {
        // Simple display without cursor movement
        switch (role) {
            case 'user':
                // For user messages, show with > prefix
                console.log(this.themeManager.formatUserMessage(`> ${message}`));
                break;
            case 'assistant':
                // For assistant messages, print them directly
                console.log(this.themeManager.formatAssistantMessage(message));
                console.log(); // Add spacing
                break;
            case 'system':
                console.log(this.themeManager.formatSystemMessage(message));
                break;
        }
    }
    displayError(error) {
        console.log(chalk_1.default.red('\n❌ Error:'), chalk_1.default.red(error));
    }
    displayModels(modelList) {
        console.log(this.themeManager.formatInfo('\n📋 Available Models:\n'));
        console.log(modelList);
        console.log(this.themeManager.formatBorder('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
    }
    displayThemes(themeList) {
        console.log(this.themeManager.formatInfo('\n🎨 Available Themes:\n'));
        console.log(themeList);
        console.log(this.themeManager.formatBorder('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
    }
    getThemeManager() {
        return this.themeManager;
    }
    getTimeline() {
        return this.timeline;
    }
    getInputBox() {
        return this.inputBox;
    }
    destroy() {
        this.inputBox.destroy();
    }
    showThinking() {
        this.inputBox.showThinking();
    }
    hideThinking() {
        this.inputBox.hideThinking();
    }
    async getUserInput(prompt = '') {
        return this.inputBox.getInput();
    }
    clear() {
        console.clear();
    }
    displaySeparator() {
        console.log(chalk_1.default.gray('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
    }
}
exports.ChatUI = ChatUI;
//# sourceMappingURL=chatUI.js.map