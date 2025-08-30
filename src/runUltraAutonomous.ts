#!/usr/bin/env node

/**
 * Script de execução do Flui Ultra Autonomous
 * Sistema completamente autônomo com monitoramento e correção em tempo real
 */

import { runUltraAutonomous } from './services/fluiUltraAutonomous';
import chalk from 'chalk';

async function main() {
  try {
    await runUltraAutonomous();
  } catch (error) {
    console.error(chalk.red.bold('\n❌ Erro durante execução:'), error);
    process.exit(1);
  }
}

// Tratamento de sinais
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n⚠️  Execução interrompida pelo usuário'));
  console.log(chalk.gray('Finalizando processos...'));
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n❌ Erro não capturado:'), error);
  // Não encerra, tenta continuar
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('\n❌ Promise rejeitada:'), reason);
  // Não encerra, tenta continuar
});

// Executa
main().catch(console.error);