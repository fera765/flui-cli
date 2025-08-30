#!/usr/bin/env node

/**
 * Flui CLI - 100% DINÂMICO E AUTÔNOMO
 * ZERO templates, ZERO dados estáticos, TUDO via LLM
 */

import { ApiService } from './services/apiService';
import { ModelManager } from './services/modelManager';
import { ChatUI } from './ui/chatUI';
import { ChatAppFullDynamic } from './chatAppFullDynamic';
import chalk from 'chalk';
import axios from 'axios';

async function generateDynamicBanner(): Promise<void> {
  try {
    const response = await axios.post('https://api.llm7.io/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Gere um banner ASCII art simples para "FLUI DYNAMIC" em 3 linhas'
        }
      ],
      temperature: 0.9,
      max_tokens: 100
    });
    
    console.log(chalk.cyan(response.data.choices[0].message.content));
  } catch (error) {
    // Se falhar, apenas continua sem banner
    console.log(chalk.cyan('FLUI CLI - 100% Dynamic'));
  }
}

async function main() {
  console.clear();
  
  // Banner dinâmico
  await generateDynamicBanner();
  
  const apiService = new ApiService();
  const modelManager = new ModelManager(apiService);
  const chatUI = new ChatUI();
  
  const chatApp = new ChatAppFullDynamic(apiService, modelManager, chatUI);
  await chatApp.run();
}

// Handlers dinâmicos
process.on('SIGINT', async () => {
  try {
    const response = await axios.post('https://api.llm7.io/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Gere uma mensagem de despedida criativa para um CLI'
        }
      ],
      temperature: 0.8,
      max_tokens: 50
    });
    console.log('\n' + chalk.cyan(response.data.choices[0].message.content));
  } catch (error) {
    console.log('\n');
  }
  process.exit(0);
});

process.on('uncaughtException', async (error) => {
  try {
    const response = await axios.post('https://api.llm7.io/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Gere uma mensagem de erro criativa para: ${error.message}`
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    });
    console.error(chalk.red(response.data.choices[0].message.content));
  } catch (e) {
    console.error(chalk.red('Error:', error));
  }
  process.exit(1);
});

main().catch(async (error) => {
  try {
    const response = await axios.post('https://api.llm7.io/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Explique este erro de forma simples: ${error.message}`
        }
      ],
      temperature: 0.6,
      max_tokens: 100
    });
    console.error(chalk.red(response.data.choices[0].message.content));
  } catch (e) {
    console.error(chalk.red('Fatal:', error));
  }
  process.exit(1);
});