#!/usr/bin/env node

/**
 * Flui CLI Enhanced - Com Sistema Completo de Tools
 * Este é o ponto de entrada principal com todas as tools integradas
 */

import { ApiService } from './services/apiService';
import { ModelManager } from './services/modelManager';
import { ChatUI } from './ui/chatUI';
import { ChatAppEnhanced } from './chatAppEnhanced';

async function main() {
  console.log('\n🚀 Iniciando Flui CLI Enhanced com Sistema de Tools...\n');
  
  const apiService = new ApiService();
  const modelManager = new ModelManager(apiService);
  const chatUI = new ChatUI();
  
  // Inicializa o ChatApp Enhanced com todas as tools
  const chatApp = new ChatAppEnhanced(apiService, modelManager, chatUI);

  console.log('📋 Sistema de Tools Disponível:');
  console.log('  • agent() - Delegação para agentes especializados');
  console.log('  • shell() - Execução segura de comandos');
  console.log('  • file_read() - Leitura de arquivos');
  console.log('  • file_replace() - Edição de arquivos');
  console.log('  • find_problem_solution() - Análise de erros');
  console.log('  • secondary_context() - Gerenciamento de contextos');
  console.log('  • secondary_context_read() - Leitura de contextos\n');

  await chatApp.run();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Encerrando Flui CLI Enhanced...');
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