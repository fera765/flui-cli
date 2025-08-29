#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

console.log(chalk.cyan.bold('\n🧪 TESTE DE CRIAÇÃO DE ARQUIVOS COM CONTEÚDO\n'));

async function testFileCreation() {
  try {
    // Compila o projeto
    console.log(chalk.gray('Compilando...'));
    require('child_process').execSync('npm run build', { stdio: 'ignore' });
    
    const { ChatAppProduction } = require('./dist/chatAppProduction');
    const { ApiService } = require('./dist/services/apiService');
    const { ModelManager } = require('./dist/services/modelManager');
    const { ChatUI } = require('./dist/ui/chatUI');
    const { OpenAIService } = require('./dist/services/openAIService');
    
    // Cria instâncias
    const apiService = new ApiService();
    const modelManager = new ModelManager(apiService);
    const chatUI = new ChatUI();
    const chatApp = new ChatAppProduction(apiService, modelManager, chatUI);
    const openAIService = new OpenAIService();
    
    // Teste 1: Extrair parâmetros
    console.log(chalk.blue('\n📝 Teste 1: Extração de parâmetros'));
    const input1 = 'Crie um arquivo roteiro.md sobre tecnologia';
    const params1 = chatApp.extractToolParams(input1, 'file_write');
    console.log('Input:', input1);
    console.log('Filename:', params1.filename);
    console.log('Content length:', params1.content ? params1.content.length : 0);
    console.log('Content preview:', params1.content ? params1.content.substring(0, 100) + '...' : 'VAZIO!');
    
    // Teste 2: Executar tool diretamente
    console.log(chalk.blue('\n🔧 Teste 2: Executar tool file_write diretamente'));
    const tool = openAIService.tools.get('file_write');
    if (tool) {
      const testFile = 'test-direct-' + Date.now() + '.md';
      const result = await tool.execute({
        filename: testFile,
        content: '# Teste Direto\n\nEste é um teste direto da tool file_write.\n\nConteúdo de teste.'
      });
      
      console.log('Result:', result);
      
      if (fs.existsSync(testFile)) {
        const content = fs.readFileSync(testFile, 'utf8');
        console.log(chalk.green('✅ Arquivo criado com sucesso!'));
        console.log('Tamanho:', content.length, 'bytes');
        console.log('Conteúdo:', content.substring(0, 50) + '...');
        fs.unlinkSync(testFile);
      } else {
        console.log(chalk.red('❌ Arquivo não foi criado!'));
      }
    } else {
      console.log(chalk.red('❌ Tool file_write não encontrada!'));
    }
    
    // Teste 3: Testar fluxo completo
    console.log(chalk.blue('\n🚀 Teste 3: Fluxo completo'));
    const input3 = 'Crie um arquivo teste-completo.md com informações sobre IA';
    
    // Detecta tools
    const toolsNeeded = chatApp.detectToolsNeeded(input3);
    console.log('Tools detectadas:', toolsNeeded);
    
    if (toolsNeeded.includes('file_write')) {
      const params = chatApp.extractToolParams(input3, 'file_write');
      console.log('Parâmetros extraídos:');
      console.log('  Filename:', params.filename);
      console.log('  Content:', params.content ? `${params.content.length} caracteres` : 'VAZIO!');
      
      if (params.content) {
        // Cria o arquivo manualmente para testar
        fs.writeFileSync(params.filename, params.content, 'utf8');
        
        if (fs.existsSync(params.filename)) {
          const content = fs.readFileSync(params.filename, 'utf8');
          console.log(chalk.green('✅ Arquivo criado com sucesso no teste!'));
          console.log('  Tamanho:', content.length, 'bytes');
          console.log('  Preview:', content.substring(0, 100) + '...');
          fs.unlinkSync(params.filename);
        }
      } else {
        console.log(chalk.red('❌ PROBLEMA: Conteúdo está vazio!'));
      }
    }
    
    // Teste 4: Diferentes tipos de arquivo
    console.log(chalk.blue('\n📄 Teste 4: Diferentes tipos de arquivo'));
    const testCases = [
      'Crie um roteiro de vídeo',
      'Crie um arquivo README',
      'Crie um relatório do projeto',
      'Crie uma lista TODO',
      'Crie um documento teste.txt'
    ];
    
    for (const testInput of testCases) {
      const params = chatApp.extractToolParams(testInput, 'file_write');
      console.log(`\n"${testInput}"`);
      console.log(`  → Arquivo: ${params.filename}`);
      console.log(`  → Conteúdo: ${params.content ? params.content.length + ' chars' : '❌ VAZIO'}`);
      
      if (!params.content) {
        console.log(chalk.red('  ⚠️ ATENÇÃO: Conteúdo vazio detectado!'));
      }
    }
    
  } catch (error) {
    console.error(chalk.red('Erro no teste:'), error);
  }
}

testFileCreation();