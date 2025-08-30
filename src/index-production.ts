#!/usr/bin/env node

/**
 * Flui CLI - Versão de Produção com LLM7.io
 * Endpoint: https://api.llm7.io/v1 (sem API key necessária)
 */

import { ApiService } from './services/apiService';
import { ModelManager } from './services/modelManager';
import { ChatUI } from './ui/chatUI';
import { ChatAppProductionFixed } from './chatAppProductionFixed';
import chalk from 'chalk';

async function main() {
  console.clear();
  console.log(chalk.cyan.bold('=' .repeat(70)));
  console.log(chalk.cyan.bold('  🚀 FLUI CLI - PRODUÇÃO ENHANCED'));
  console.log(chalk.green.bold('  Endpoint: https://api.llm7.io/v1'));
  console.log(chalk.yellow.bold('  Geração 100% Dinâmica via LLM!'));
  console.log(chalk.cyan.bold('=' .repeat(70)));
  console.log('');
  
  const apiService = new ApiService();
  const modelManager = new ModelManager(apiService);
  const chatUI = new ChatUI();
  
  const chatApp = new ChatAppProductionFixed(apiService, modelManager, chatUI);
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