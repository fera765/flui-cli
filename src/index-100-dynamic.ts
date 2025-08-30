#!/usr/bin/env node

/**
 * Flui CLI - 100% Dinâmico
 * ABSOLUTAMENTE ZERO palavras-chave estáticas
 */

import { FluiUltraDynamic } from './core/FluiUltraDynamic';
import chalk from 'chalk';
import * as readline from 'readline';

class Flui100Dynamic {
  private flui: FluiUltraDynamic;
  private rl: readline.Interface;
  
  constructor() {
    this.flui = new FluiUltraDynamic();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  
  async start() {
    console.clear();
    console.log(chalk.cyan.bold('='.repeat(70)));
    console.log(chalk.cyan.bold('  🚀 FLUI 100% DINÂMICO'));
    console.log(chalk.green.bold('  ✅ ZERO palavras-chave estáticas'));
    console.log(chalk.yellow.bold('  ✅ ZERO comparações hardcoded'));
    console.log(chalk.magenta.bold('  ✅ 100% decisões via LLM'));
    console.log(chalk.cyan.bold('='.repeat(70)));
    console.log('');
    
    this.promptUser();
  }
  
  private promptUser() {
    this.rl.question(chalk.cyan('💬 > '), async (input) => {
      // Processa TUDO via LLM, sem nenhuma comparação
      const result = await this.flui.processInput(input);
      
      // Mostra resultado
      if (result.response) {
        console.log(chalk.white('\n' + result.response + '\n'));
      }
      
      // Continua ou sai baseado na resposta da LLM
      if (result.shouldExit) {
        console.log(chalk.cyan('\n👋 Encerrando...\n'));
        this.rl.close();
        process.exit(0);
      }
      
      this.promptUser();
    });
  }
}

// Inicia
async function main() {
  const flui = new Flui100Dynamic();
  await flui.start();
}

main().catch(console.error);