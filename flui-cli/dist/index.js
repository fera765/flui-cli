#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apiService_1 = require("./services/apiService");
const modelManager_1 = require("./services/modelManager");
const chatUI_1 = require("./ui/chatUI");
const chatApp_1 = require("./chatApp");
async function main() {
    const apiService = new apiService_1.ApiService();
    const modelManager = new modelManager_1.ModelManager(apiService);
    const chatUI = new chatUI_1.ChatUI();
    const chatApp = new chatApp_1.ChatApp(apiService, modelManager, chatUI);
    await chatApp.run();
}
// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\nEncerrando aplicação...');
    process.exit(0);
});
process.on('uncaughtException', (error) => {
    console.error('\n\nErro não capturado:', error);
    process.exit(1);
});
main().catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map