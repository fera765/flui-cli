#!/usr/bin/env node

/**
 * Flui CLI - Ultra Dynamic Version
 * 100% dinâmico com agentes inteligentes
 */

import { ApiService } from './services/apiService';
import { ModelManager } from './services/modelManager';
import { ChatUI } from './ui/chatUI';
import { FluiUltraDynamic } from './FluiUltraDynamic';

async function main() {
  const apiService = new ApiService();
  const modelManager = new ModelManager(apiService);
  const chatUI = new ChatUI();
  
  const flui = new FluiUltraDynamic(apiService, modelManager, chatUI);
  await flui.run();
}

// Handlers
process.on('SIGINT', () => {
  console.log('\n\n🛑 Encerrando Flui Ultra Dynamic...');
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