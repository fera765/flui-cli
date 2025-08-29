#!/usr/bin/env node
"use strict";
/**
 * Flui CLI - Versão Principal com Tools Integradas
 * Endpoint: https://api.llm7.io/v1 (sem API key necessária)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apiService_1 = require("./services/apiService");
const modelManager_1 = require("./services/modelManager");
const chatUI_1 = require("./ui/chatUI");
const chatAppProduction_1 = require("./chatAppProduction");
const chalk_1 = __importDefault(require("chalk"));
async function main() {
    // Mostra banner inicial
    console.clear();
    console.log(chalk_1.default.cyan.bold('='.repeat(70)));
    console.log(chalk_1.default.cyan.bold('  🚀 FLUI CLI - Assistente IA com Tools'));
    console.log(chalk_1.default.green.bold('  Endpoint: https://api.llm7.io/v1'));
    console.log(chalk_1.default.yellow.bold('  Tools automáticas disponíveis!'));
    console.log(chalk_1.default.cyan.bold('='.repeat(70)));
    console.log('');
    const apiService = new apiService_1.ApiService();
    const modelManager = new modelManager_1.ModelManager(apiService);
    const chatUI = new chatUI_1.ChatUI();
    // Usa a versão com tools integradas
    const chatApp = new chatAppProduction_1.ChatAppProduction(apiService, modelManager, chatUI);
    await chatApp.run();
}
// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Encerrando Flui CLI...');
    process.exit(0);
});
process.on('uncaughtException', (error) => {
    console.error('\n\n❌ Erro não capturado:', error);
    process.exit(1);
});
main().catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map