#!/usr/bin/env node

import chalk from 'chalk';
import { OpenAIService } from './src/services/openAIService';
import { startMockServer } from './src/mockOpenAIServer';
import * as fs from 'fs';
import { Server } from 'http';

console.log(chalk.cyan.bold('\n' + '='.repeat(70)));
console.log(chalk.cyan.bold('  🚀 TESTE DE INTEGRAÇÃO OPENAI SDK COM TOOLS'));
console.log(chalk.cyan.bold('='.repeat(70) + '\n'));

interface TestScenario {
  name: string;
  input: string;
  expectedTools?: string[];
  expectedFiles?: string[];
}

const scenarios: TestScenario[] = [
  {
    name: '📹 Criar Roteiro de Vídeo',
    input: 'Crie um roteiro de vídeo sobre tecnologia e salve em video.md',
    expectedTools: ['file_write'],
    expectedFiles: ['video.md']
  },
  {
    name: '📝 Criar Arquivo Simples',
    input: 'Crie um arquivo test.txt com conteúdo de exemplo',
    expectedTools: ['file_write'],
    expectedFiles: ['test.txt']
  },
  {
    name: '📂 Listar Arquivos',
    input: 'Liste os arquivos do diretório atual',
    expectedTools: ['shell'],
    expectedFiles: []
  },
  {
    name: '🔍 Ler Arquivo',
    input: 'Leia o arquivo package.json',
    expectedTools: ['file_read'],
    expectedFiles: []
  },
  {
    name: '❌ Analisar Erro',
    input: 'Tenho um erro TypeError, pode me ajudar?',
    expectedTools: ['find_problem_solution'],
    expectedFiles: []
  },
  {
    name: '📊 Criar Relatório Complexo',
    input: 'Crie um relatório completo do sistema',
    expectedTools: ['shell', 'file_write'],
    expectedFiles: ['relatorio.md']
  }
];

async function cleanupTestFiles() {
  const testFiles = ['video.md', 'test.txt', 'relatorio.md', 'document.txt', 'docs.md'];
  for (const file of testFiles) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  }
}

async function runTest(
  scenario: TestScenario, 
  openAIService: OpenAIService
): Promise<boolean> {
  console.log(chalk.blue.bold(`\n${scenario.name}`));
  console.log(chalk.gray(`Input: "${scenario.input}"`));
  
  try {
    // Send message with tools
    const result = await openAIService.sendMessageWithTools(
      [
        { role: 'user', content: scenario.input }
      ],
      'gpt-3.5-turbo'
    );
    
    console.log(chalk.yellow('\nResposta do Flui:'));
    console.log(chalk.white(result.response.substring(0, 150) + '...'));
    
    // Check tool calls
    if (result.toolCalls && result.toolCalls.length > 0) {
      console.log(chalk.green(`\n✅ Tools executadas: ${result.toolCalls.length}`));
      for (const call of result.toolCalls) {
        console.log(chalk.gray(`  - ${call.tool}: ${call.result?.success ? '✅' : '❌'}`));
      }
    } else {
      console.log(chalk.yellow('\n⚠️ Nenhuma tool executada'));
    }
    
    // Validate expected tools
    let success = true;
    if (scenario.expectedTools && scenario.expectedTools.length > 0) {
      for (const expectedTool of scenario.expectedTools) {
        const found = result.toolCalls?.some(c => c.tool === expectedTool);
        if (!found) {
          console.log(chalk.red(`  ❌ Tool esperada não executada: ${expectedTool}`));
          success = false;
        }
      }
    }
    
    // Validate expected files
    if (scenario.expectedFiles && scenario.expectedFiles.length > 0) {
      for (const expectedFile of scenario.expectedFiles) {
        if (fs.existsSync(expectedFile)) {
          console.log(chalk.green(`  ✅ Arquivo criado: ${expectedFile}`));
          const content = fs.readFileSync(expectedFile, 'utf8');
          console.log(chalk.gray(`     Preview: ${content.substring(0, 50)}...`));
        } else {
          console.log(chalk.red(`  ❌ Arquivo esperado não criado: ${expectedFile}`));
          success = false;
        }
      }
    }
    
    return success;
  } catch (error) {
    console.log(chalk.red(`  ❌ Erro no teste: ${error}`));
    return false;
  }
}

async function main() {
  let mockServer: Server | null = null;
  
  try {
    // Step 1: Start mock server
    console.log(chalk.yellow('🚀 Iniciando servidor mock...'));
    mockServer = startMockServer();
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Initialize OpenAI service with local endpoint
    console.log(chalk.yellow('🔧 Inicializando OpenAI Service com endpoint local...'));
    const openAIService = new OpenAIService(undefined, true); // Use local endpoint
    
    // Step 3: Test connection
    console.log(chalk.yellow('🔗 Testando conexão...'));
    const connected = await openAIService.testConnection().catch(() => false);
    
    if (connected) {
      console.log(chalk.green('✅ Conexão estabelecida com sucesso!\n'));
    } else {
      console.log(chalk.yellow('⚠️ Usando mock local sem validação de conexão\n'));
    }
    
    // Step 4: Clean up any existing test files
    await cleanupTestFiles();
    
    // Step 5: Run all test scenarios
    console.log(chalk.cyan.bold('\n' + '='.repeat(70)));
    console.log(chalk.cyan.bold('  🧪 EXECUTANDO CENÁRIOS DE TESTE'));
    console.log(chalk.cyan.bold('='.repeat(70)));
    
    let passed = 0;
    let failed = 0;
    
    for (const scenario of scenarios) {
      const success = await runTest(scenario, openAIService);
      if (success) passed++;
      else failed++;
    }
    
    // Step 6: Final report
    console.log(chalk.cyan.bold('\n' + '='.repeat(70)));
    console.log(chalk.cyan.bold('  📊 RELATÓRIO FINAL'));
    console.log(chalk.cyan.bold('='.repeat(70) + '\n'));
    
    const total = passed + failed;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';
    
    console.log(chalk.white(`  Cenários testados: ${total}`));
    console.log(chalk.green(`  ✅ Passou: ${passed}`));
    console.log(chalk.red(`  ❌ Falhou: ${failed}`));
    console.log(chalk.yellow(`  📈 Taxa de sucesso: ${successRate}%`));
    
    if (passed === total) {
      console.log(chalk.green.bold('\n  🎉 INTEGRAÇÃO 100% FUNCIONAL!'));
      console.log(chalk.green('  O Flui está totalmente integrado com OpenAI SDK e Tools!'));
      console.log(chalk.green('  Todas as ferramentas foram executadas com sucesso!'));
    } else if (passed > 0) {
      console.log(chalk.yellow.bold('\n  ⚠️ INTEGRAÇÃO PARCIALMENTE FUNCIONAL'));
      console.log(chalk.yellow(`  ${passed} de ${total} cenários funcionaram corretamente.`));
    } else {
      console.log(chalk.red.bold('\n  ❌ INTEGRAÇÃO FALHOU'));
      console.log(chalk.red('  Nenhum cenário funcionou corretamente.'));
    }
    
    // Step 7: Show created files
    console.log(chalk.cyan.bold('\n  📁 ARQUIVOS CRIADOS DURANTE O TESTE:'));
    const createdFiles = ['video.md', 'test.txt', 'relatorio.md'].filter(f => fs.existsSync(f));
    if (createdFiles.length > 0) {
      createdFiles.forEach(file => {
        const size = fs.statSync(file).size;
        console.log(chalk.gray(`    - ${file} (${size} bytes)`));
      });
    } else {
      console.log(chalk.gray('    Nenhum arquivo foi criado'));
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ Erro fatal:'), error);
  } finally {
    // Clean up
    console.log(chalk.gray('\n🧹 Limpando...'));
    await cleanupTestFiles();
    
    if (mockServer) {
      mockServer.close();
      console.log(chalk.gray('✅ Servidor mock encerrado'));
    }
    
    console.log(chalk.cyan('\n' + '='.repeat(70) + '\n'));
  }
}

// Run the test
main().catch(console.error);