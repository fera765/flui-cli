#!/usr/bin/env node

/**
 * Script de execução do Flui Autonomous V2
 * Sistema completamente autônomo com observação em tempo real
 */

import { runAutonomousFlui } from './services/fluiAutonomousV2';
import chalk from 'chalk';

async function main() {
  console.clear();
  console.log(chalk.cyan.bold('╔══════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║                   FLUI AUTONOMOUS V2                          ║'));
  console.log(chalk.cyan.bold('║                                                                ║'));
  console.log(chalk.yellow.bold('║  🤖 Sistema 100% Autônomo e Dinâmico                         ║'));
  console.log(chalk.green.bold('║  ✅ Auto-validação e Auto-correção                           ║'));
  console.log(chalk.blue.bold('║  👁️  Observação em Tempo Real                                ║'));
  console.log(chalk.magenta.bold('║  🎯 Score Mínimo: 90%                                        ║'));
  console.log(chalk.cyan.bold('║                                                                ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════╝'));
  console.log('');
  
  try {
    await runAutonomousFlui();
  } catch (error) {
    console.error(chalk.red.bold('\n❌ Erro fatal:'), error);
    process.exit(1);
  }
}

// Tratamento de sinais
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n⚠️  Interrompido pelo usuário'));
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n❌ Erro não capturado:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('\n❌ Promise rejeitada:'), reason);
  process.exit(1);
});

// Executa
main().catch(console.error);