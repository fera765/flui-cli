"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatUI = void 0;
const chalk_1 = __importDefault(require("chalk"));
const themeManager_1 = require("./themeManager");
const inputBox_1 = require("./inputBox");
const messageTimeline_1 = require("./messageTimeline");
class ChatUI {
    constructor() {
        this.spinner = null;
        this.themeManager = new themeManager_1.ThemeManager();
        this.inputBox = new inputBox_1.InputBox(this.themeManager);
        this.timeline = new messageTimeline_1.MessageTimeline(this.themeManager);
        this.inputBox.initialize();
    }
    displayWelcome() {
        console.clear();
        const primary = this.themeManager.formatPrimary('\n ╔════════════════════════════════════════╗ ');
        console.log(primary);
        console.log(this.themeManager.formatPrimary(' ║         Flui CLI v1.0.0                ║ '));
        console.log(this.themeManager.formatPrimary(' ╚════════════════════════════════════════╝ \n'));
        console.log(this.themeManager.formatInfo('Comandos disponíveis:'));
        console.log(this.themeManager.formatWarning('  /model [1-3]') + this.themeManager.formatBorder(' - Trocar modelo'));
        console.log(this.themeManager.formatWarning('  /theme') + this.themeManager.formatBorder(' - Trocar tema'));
        console.log(this.themeManager.formatWarning('  /exit') + this.themeManager.formatBorder(' - Sair do chat'));
        console.log(this.themeManager.formatBorder('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
    }
    displayDisclaimer() {
        console.log(chalk_1.default.bgRed.white('\n ⚠️  AVISO IMPORTANTE ⚠️ \n'));
        console.log(chalk_1.default.red('Este código foi desenvolvido exclusivamente para fins de estudo.'));
        console.log(chalk_1.default.red('O autor não se responsabiliza por qualquer uso ou ação realizada.'));
        console.log(chalk_1.default.red('@LLM7.io - Uso educacional apenas.\n'));
        console.log(chalk_1.default.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
    }
    displayMessage(message, role) {
        switch (role) {
            case 'user':
                this.timeline.addUserMessage(message);
                break;
            case 'assistant':
                this.timeline.addAssistantMessage(message);
                break;
            case 'system':
                this.timeline.addSystemMessage(message);
                break;
        }
        this.timeline.display(true);
        this.inputBox.display();
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
        return this.inputBox.getUserInput();
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