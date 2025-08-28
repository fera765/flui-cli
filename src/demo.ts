#!/usr/bin/env node

/**
 * Flui CLI Enhanced Demo
 * Demonstração das novas funcionalidades com tools e memória
 */

import { ApiService } from './services/apiService';
import { ModelManager } from './services/modelManager';
import { ChatUI } from './ui/chatUI';
import { ChatAppEnhanced } from './chatAppEnhanced';

async function main() {
  console.log('\n🚀 Iniciando Flui CLI Enhanced com Tools e Memória...\n');
  
  const apiService = new ApiService();
  const modelManager = new ModelManager(apiService);
  const chatUI = new ChatUI();
  const chatApp = new ChatAppEnhanced(apiService, modelManager, chatUI);

  // Exemplos de comandos que demonstram as tools:
  console.log('📝 Exemplos de comandos para testar as tools:\n');
  console.log('1. "Liste os arquivos do diretório src"');
  console.log('   -> Usará a tool shell() para executar ls');
  console.log('');
  console.log('2. "Analise este erro: TypeError: Cannot read property x of undefined"');
  console.log('   -> Usará a tool find_problem_solution()');
  console.log('');
  console.log('3. "Crie um agente para revisar código Python"');
  console.log('   -> Usará a tool agent() com delegação');
  console.log('');
  console.log('4. "Leia o arquivo package.json"');
  console.log('   -> Usará a tool file_read()');
  console.log('');
  console.log('5. "/memory" - Ver estatísticas de memória');
  console.log('6. "/tools" - Ver histórico de execução de tools');
  console.log('7. "/theme" - Mudar tema visual');
  console.log('');
  console.log('─'.repeat(50));
  console.log('');

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