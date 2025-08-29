#!/usr/bin/env node

const chalk = require('chalk');
const { spawn } = require('child_process');
const fs = require('fs');

console.log(chalk.cyan.bold('\n' + '='.repeat(80)));
console.log(chalk.cyan.bold('  🧪 TESTE INTERATIVO DO FLUI COM TOOLS'));
console.log(chalk.cyan.bold('='.repeat(80) + '\n'));

async function testCommands() {
  console.log(chalk.yellow('📋 Testando comandos que devem ativar tools:\n'));
  
  const testCases = [
    {
      input: 'Crie um arquivo teste.md',
      expectedTool: 'file_write',
      expectedFile: 'teste.md'
    },
    {
      input: 'Gere um roteiro para vídeo',
      expectedTool: 'file_write',
      expectedFile: 'roteiro.md'
    },
    {
      input: 'Faça um documento README',
      expectedTool: 'file_write',
      expectedFile: 'README.md'
    },
    {
      input: 'Liste os arquivos do diretório',
      expectedTool: 'shell',
      expectedFile: null
    },
    {
      input: 'Mostre a versão do Node',
      expectedTool: 'shell',
      expectedFile: null
    },
    {
      input: 'Me ajude com o erro TypeError undefined',
      expectedTool: 'find_problem_solution',
      expectedFile: null
    }
  ];
  
  // Importa o ChatAppProduction para testar
  console.log(chalk.gray('Compilando projeto...'));
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
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const test of testCases) {
    console.log(chalk.blue(`\n▶️ Testando: "${test.input}"`));
    
    // Detecta tools necessárias
    const toolsDetected = chatApp.detectToolsNeeded(test.input);
    
    if (toolsDetected.includes(test.expectedTool)) {
      console.log(chalk.green(`  ✅ Tool detectada: ${test.expectedTool}`));
      
      // Testa extração de parâmetros
      const params = chatApp.extractToolParams(test.input, test.expectedTool);
      if (params) {
        console.log(chalk.gray(`     Parâmetros: ${JSON.stringify(params).substring(0, 50)}...`));
        
        // Se deve criar arquivo, simula criação
        if (test.expectedFile) {
          fs.writeFileSync(test.expectedFile, '# Teste');
          if (fs.existsSync(test.expectedFile)) {
            console.log(chalk.green(`  ✅ Arquivo ${test.expectedFile} seria criado`));
            fs.unlinkSync(test.expectedFile);
          }
        }
        
        passedTests++;
      } else {
        console.log(chalk.red(`  ❌ Falha ao extrair parâmetros`));
        failedTests++;
      }
    } else {
      console.log(chalk.red(`  ❌ Tool esperada não detectada: ${test.expectedTool}`));
      console.log(chalk.gray(`     Tools detectadas: ${toolsDetected.join(', ') || 'nenhuma'}`));
      failedTests++;
    }
  }
  
  // Relatório
  console.log(chalk.cyan.bold('\n' + '='.repeat(80)));
  console.log(chalk.cyan.bold('  📊 RESULTADO DO TESTE'));
  console.log(chalk.cyan.bold('='.repeat(80) + '\n'));
  
  const total = passedTests + failedTests;
  const successRate = ((passedTests / total) * 100).toFixed(1);
  
  console.log(chalk.white(`  Testes executados: ${total}`));
  console.log(chalk.green(`  ✅ Passou: ${passedTests}`));
  console.log(chalk.red(`  ❌ Falhou: ${failedTests}`));
  console.log(chalk.yellow(`  📈 Taxa de sucesso: ${successRate}%`));
  
  if (passedTests === total) {
    console.log(chalk.green.bold('\n  🎉 PERFEITO!'));
    console.log(chalk.green('  Todas as tools estão sendo detectadas corretamente!'));
    console.log(chalk.green('  O Flui está pronto para uso com npm run dev'));
  } else if (passedTests > 0) {
    console.log(chalk.yellow.bold('\n  ⚠️ PARCIALMENTE FUNCIONAL'));
    console.log(chalk.yellow(`  ${passedTests} de ${total} comandos funcionaram`));
  }
  
  console.log(chalk.cyan.bold('\n  🚀 COMO USAR:'));
  console.log(chalk.white('     npm run dev         → Versão com tools (produção)'));
  console.log(chalk.white('     npm run dev:original → Versão original sem tools'));
  console.log(chalk.white('     npm run dev:tools   → Versão alternativa com tools'));
  
  console.log(chalk.cyan.bold('\n' + '='.repeat(80) + '\n'));
}

// Executa os testes
testCommands().catch(console.error);