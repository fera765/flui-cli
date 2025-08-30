#!/usr/bin/env node

/**
 * Flui CLI - Enhanced Version
 * Detecção aprimorada e criação automática de arquivos
 */

import { ApiService } from './services/apiService';
import { ModelManager } from './services/modelManager';
import { ChatUI } from './ui/chatUI';
import { ChatAppEnhanced } from './chatAppEnhanced';

async function main() {
  const apiService = new ApiService();
  const modelManager = new ModelManager(apiService);
  const chatUI = new ChatUI();
  
  const chatApp = new ChatAppEnhanced(apiService, modelManager, chatUI);
  await chatApp.run();
}

// Handlers
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