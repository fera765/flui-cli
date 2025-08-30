#!/usr/bin/env node

import { ApiService } from './services/apiService';
import { ModelManager } from './services/modelManager';
import { ChatUI } from './ui/chatUI';
import { ChatApp } from './chatApp';

async function main() {
  const apiService = new ApiService();
  const modelManager = new ModelManager(apiService);
  const chatUI = new ChatUI();
  const chatApp = new ChatApp(apiService, modelManager, chatUI);

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