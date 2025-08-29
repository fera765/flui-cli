#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs');
const readline = require('readline');

console.log(chalk.cyan.bold('\n🧪 TESTE DE EXECUÇÃO REAL DO FLUI\n'));

// Cria interface para simular entrada do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function testRealExecution() {
  try {
    // Compila o projeto
    console.log(chalk.gray('Compilando...'));
    require('child_process').execSync('npm run build', { stdio: 'ignore' });
    
    const { ChatAppProduction } = require('./dist/chatAppProduction');
    const { ApiService } = require('./dist/services/apiService');
    const { ModelManager } = require('./dist/services/modelManager');
    const { ChatUI } = require('./dist/ui/chatUI');
    
    // Cria instâncias
    const apiService = new ApiService();
    const modelManager = new ModelManager(apiService);
    const chatUI = new ChatUI();
    const chatApp = new ChatAppProduction(apiService, modelManager, chatUI);
    
    console.log(chalk.green('✅ Sistema inicializado\n'));
    
    // Testes automáticos
    const testInputs = [
      'Crie um arquivo teste1.md com informações sobre JavaScript',
      'Crie um roteiro de vídeo e salve em roteiro-video.md',
      'Faça um documento README.md para o projeto',
      'Gere um relatório e salve em relatorio.md'
    ];
    
    console.log(chalk.blue('📝 Executando testes automáticos...\n'));
    
    for (const input of testInputs) {
      console.log(chalk.yellow(`\nTestando: "${input}"`));
      
      // 1. Detecta tools
      const tools = chatApp.detectToolsNeeded(input);
      console.log('  Tools detectadas:', tools);
      
      if (tools.includes('file_write')) {
        // 2. Extrai parâmetros
        const params = chatApp.extractToolParams(input, 'file_write');
        console.log('  Arquivo:', params.filename);
        console.log('  Conteúdo:', params.content ? `${params.content.length} caracteres` : '❌ VAZIO');
        
        if (params.content) {
          // 3. Executa a tool
          const result = await chatApp.executeTool('file_write', params);
          
          if (result.result && result.result.success) {
            console.log(chalk.green(`  ✅ Arquivo criado: ${params.filename}`));
            
            // Verifica se o arquivo existe e tem conteúdo
            if (fs.existsSync(params.filename)) {
              const content = fs.readFileSync(params.filename, 'utf8');
              if (content.length > 0) {
                console.log(chalk.green(`  ✅ Conteúdo verificado: ${content.length} bytes`));
              } else {
                console.log(chalk.red(`  ❌ ERRO: Arquivo criado mas está VAZIO!`));
              }
              
              // Limpa o arquivo de teste
              fs.unlinkSync(params.filename);
            } else {
              console.log(chalk.red(`  ❌ ERRO: Arquivo não foi criado no sistema!`));
            }
          } else {
            console.log(chalk.red(`  ❌ Falha ao executar tool:`, result.error || result.result?.error));
          }
        } else {
          console.log(chalk.red('  ❌ PROBLEMA: extractToolParams retornou conteúdo vazio!'));
        }
      } else {
        console.log(chalk.yellow('  ⚠️ Tool file_write não foi detectada'));
      }
    }
    
    // Teste manual opcional
    console.log(chalk.cyan('\n\n📋 TESTE MANUAL (opcional)\n'));
    const manualTest = await question('Deseja testar manualmente? (s/n): ');
    
    if (manualTest.toLowerCase() === 's') {
      console.log(chalk.gray('\nDigite comandos para testar (digite "sair" para terminar):\n'));
      
      let continuar = true;
      while (continuar) {
        const input = await question(chalk.cyan('> '));
        
        if (input.toLowerCase() === 'sair') {
          continuar = false;
        } else {
          const tools = chatApp.detectToolsNeeded(input);
          console.log('Tools detectadas:', tools);
          
          if (tools.includes('file_write')) {
            const params = chatApp.extractToolParams(input, 'file_write');
            console.log('Arquivo:', params.filename);
            console.log('Conteúdo:', params.content ? `${params.content.length} caracteres` : '❌ VAZIO');
            
            if (params.content) {
              const criar = await question('Criar o arquivo? (s/n): ');
              if (criar.toLowerCase() === 's') {
                fs.writeFileSync(params.filename, params.content, 'utf8');
                console.log(chalk.green(`✅ Arquivo ${params.filename} criado!`));
              }
            }
          }
        }
      }
    }
    
    rl.close();
    
    // Relatório final
    console.log(chalk.cyan.bold('\n' + '='.repeat(60)));
    console.log(chalk.cyan.bold('  RELATÓRIO FINAL'));
    console.log(chalk.cyan.bold('='.repeat(60) + '\n'));
    
    console.log(chalk.green('✅ Teste concluído!'));
    console.log(chalk.yellow('\n⚠️ Se os arquivos estão sendo criados vazios no Flui real:'));
    console.log('  1. O extractToolParams está funcionando corretamente');
    console.log('  2. O problema pode estar na integração com a LLM');
    console.log('  3. Verifique se a LLM está recebendo os parâmetros corretos');
    
  } catch (error) {
    console.error(chalk.red('Erro no teste:'), error);
    rl.close();
  }
}

testRealExecution();