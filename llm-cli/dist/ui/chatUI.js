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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatUI = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const readline = __importStar(require("readline"));
class ChatUI {
    constructor() {
        this.spinner = null;
    }
    displayWelcome() {
        console.clear();
        console.log(chalk_1.default.bgGreen.black('\n ╔════════════════════════════════════════╗ '));
        console.log(chalk_1.default.bgGreen.black(' ║         LLM Chat CLI v1.0.0            ║ '));
        console.log(chalk_1.default.bgGreen.black(' ╚════════════════════════════════════════╝ \n'));
        console.log(chalk_1.default.cyan('Comandos disponíveis:'));
        console.log(chalk_1.default.yellow('  /model [1-3]') + chalk_1.default.gray(' - Trocar modelo'));
        console.log(chalk_1.default.yellow('  /exit') + chalk_1.default.gray(' - Sair do chat'));
        console.log(chalk_1.default.gray('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
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
                console.log(chalk_1.default.blue('\n👤 You:'));
                console.log(chalk_1.default.white(message));
                break;
            case 'assistant':
                console.log(chalk_1.default.green('\n🤖 Assistant:'));
                console.log(chalk_1.default.white(message));
                break;
            case 'system':
                console.log(chalk_1.default.yellow('\n⚙️  System:'));
                console.log(chalk_1.default.yellow(message));
                break;
        }
    }
    displayError(error) {
        console.log(chalk_1.default.red('\n❌ Error:'), chalk_1.default.red(error));
    }
    displayModels(modelList) {
        console.log(chalk_1.default.cyan('\n📋 Available Models:\n'));
        console.log(modelList);
        console.log(chalk_1.default.gray('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
    }
    showThinking() {
        this.spinner = (0, ora_1.default)({
            text: 'Pensando...',
            spinner: 'dots',
            color: 'cyan'
        }).start();
    }
    hideThinking() {
        if (this.spinner) {
            this.spinner.stop();
            this.spinner = null;
        }
    }
    async getUserInput(prompt = '') {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        return new Promise((resolve) => {
            const displayPrompt = prompt || chalk_1.default.cyan('\n💬 > ');
            rl.question(displayPrompt, (answer) => {
                rl.close();
                resolve(answer.trim());
            });
        });
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