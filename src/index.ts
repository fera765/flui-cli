#!/usr/bin/env node

/**
 * Flui CLI - Versão Principal com Tools Integradas
 * Endpoint: https://api.llm7.io/v1 (sem API key necessária)
 */

import { ApiService } from './services/apiService';
import { ModelManager } from './services/modelManager';
import { ChatUI } from './ui/chatUI';
import { ChatAppProduction } from './chatAppProduction';
import chalk from 'chalk';

async function main() {
  // Mostra banner inicial
  console.clear();
  console.log(chalk.cyan.bold('=' .repeat(70)));
  console.log(chalk.cyan.bold('  🚀 FLUI CLI - Assistente IA com Tools'));
  console.log(chalk.green.bold('  Endpoint: https://api.llm7.io/v1'));
  console.log(chalk.yellow.bold('  Tools automáticas disponíveis!'));
  console.log(chalk.cyan.bold('=' .repeat(70)));
  console.log('');
  
  const apiService = new ApiService();
  const modelManager = new ModelManager(apiService);
  const chatUI = new ChatUI();
  
  // Usa a versão com tools integradas
  const chatApp = new ChatAppProduction(apiService, modelManager, chatUI);
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