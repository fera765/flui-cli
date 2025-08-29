#!/usr/bin/env node

const chalk = require('chalk');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log(chalk.cyan.bold('\n' + '='.repeat(80)));
console.log(chalk.cyan.bold('                     FLUI - SUITE COMPLETA DE TESTES'));
console.log(chalk.cyan.bold('='.repeat(80) + '\n'));

// Define os testes principais a serem executados
const mainTests = [
  // Testes simples e rápidos primeiro
  {
    name: 'Cascata Simples',
    file: 'test-cascade-simple.js',
    description: 'Teste básico da arquitetura em cascata'
  },
  {
    name: 'Ferramentas Simples',
    file: 'test-tools-simple.js',
    description: 'Teste básico das ferramentas'
  },
  {
    name: 'Validação Simples',
    file: 'test-validation-simple.js',
    description: 'Teste do sistema de validação'
  },
  // Testes mais complexos
  {
    name: 'Cascata Final',
    file: 'test-cascade-final.js',
    description: 'Teste completo da arquitetura em cascata'
  }
];

// Estatísticas
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let skippedTests = 0;
const testResults = [];

// Função para executar um teste
function runTest(testInfo) {
  return new Promise((resolve) => {
    const testPath = path.join(__dirname, testInfo.file);
    
    // Verifica se o arquivo existe
    if (!fs.existsSync(testPath)) {
      console.log(chalk.yellow(`⚠️ Teste não encontrado: ${testInfo.file}`));
      skippedTests++;
      resolve({ 
        name: testInfo.name, 
        status: 'skipped', 
        reason: 'Arquivo não encontrado' 
      });
      return;
    }
    
    console.log(chalk.blue(`\n▶️ Executando: ${testInfo.name}`));
    console.log(chalk.gray(`   ${testInfo.description}`));
    console.log(chalk.gray('   ' + '-'.repeat(60)));
    
    const startTime = Date.now();
    const testProcess = spawn('node', [testPath], {
      cwd: path.dirname(testPath),
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    let output = '';
    let errorOutput = '';
    
    testProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      // Mostra apenas linhas importantes
      const lines = text.split('\n');
      lines.forEach(line => {
        if (line.includes('✅') || line.includes('✓')) {
          process.stdout.write(chalk.green('   ' + line.trim() + '\n'));
        } else if (line.includes('❌') || line.includes('✗')) {
          process.stdout.write(chalk.red('   ' + line.trim() + '\n'));
        } else if (line.includes('⚠️')) {
          process.stdout.write(chalk.yellow('   ' + line.trim() + '\n'));
        }
      });
    });
    
    testProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    testProcess.on('close', (code) => {
      const duration = Date.now() - startTime;
      totalTests++;
      
      if (code === 0) {
        passedTests++;
        console.log(chalk.green(`   ✅ PASSOU (${duration}ms)`));
        resolve({ 
          name: testInfo.name, 
          status: 'passed', 
          duration,
          output: output.substring(0, 500)
        });
      } else {
        failedTests++;
        console.log(chalk.red(`   ❌ FALHOU (código: ${code}, ${duration}ms)`));
        if (errorOutput) {
          console.log(chalk.red('   Erro: ' + errorOutput.substring(0, 200)));
        }
        resolve({ 
          name: testInfo.name, 
          status: 'failed', 
          code, 
          duration,
          error: errorOutput.substring(0, 500)
        });
      }
    });
    
    // Timeout de 30 segundos por teste
    setTimeout(() => {
      testProcess.kill();
      failedTests++;
      console.log(chalk.red(`   ❌ TIMEOUT (30s)`));
      resolve({ 
        name: testInfo.name, 
        status: 'timeout' 
      });
    }, 30000);
  });
}

// Função principal
async function runAllTests() {
  console.log(chalk.yellow('\n🚀 Iniciando suite de testes...\n'));
  console.log(chalk.gray(`   Total de testes a executar: ${mainTests.length}`));
  console.log(chalk.gray(`   Timeout por teste: 30 segundos`));
  console.log(chalk.gray(`   Ambiente: ${process.env.NODE_ENV || 'production'}\n`));
  
  const startTime = Date.now();
  
  // Executa os testes sequencialmente
  for (const test of mainTests) {
    const result = await runTest(test);
    testResults.push(result);
  }
  
  const totalDuration = Date.now() - startTime;
  
  // Exibe resumo
  console.log(chalk.cyan.bold('\n' + '='.repeat(80)));
  console.log(chalk.cyan.bold('                           RESUMO DOS TESTES'));
  console.log(chalk.cyan.bold('='.repeat(80) + '\n'));
  
  // Detalhes por teste
  console.log(chalk.yellow('📊 Resultados por teste:\n'));
  testResults.forEach(result => {
    const statusIcon = 
      result.status === 'passed' ? '✅' :
      result.status === 'failed' ? '❌' :
      result.status === 'skipped' ? '⚠️' : '⏱️';
    
    const statusColor = 
      result.status === 'passed' ? chalk.green :
      result.status === 'failed' ? chalk.red :
      result.status === 'skipped' ? chalk.yellow : chalk.gray;
    
    console.log(`   ${statusIcon} ${result.name}: ${statusColor(result.status.toUpperCase())}`);
    if (result.duration) {
      console.log(chalk.gray(`      Tempo: ${result.duration}ms`));
    }
    if (result.reason) {
      console.log(chalk.gray(`      Razão: ${result.reason}`));
    }
  });
  
  // Estatísticas gerais
  console.log(chalk.cyan('\n📈 Estatísticas:\n'));
  console.log(chalk.gray(`   Total de testes: ${totalTests}`));
  console.log(chalk.green(`   ✅ Passou: ${passedTests}`));
  console.log(chalk.red(`   ❌ Falhou: ${failedTests}`));
  console.log(chalk.yellow(`   ⚠️ Pulados: ${skippedTests}`));
  console.log(chalk.gray(`   ⏱️ Tempo total: ${(totalDuration / 1000).toFixed(2)}s`));
  
  // Taxa de sucesso
  const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;
  console.log(chalk.cyan(`\n📊 Taxa de sucesso: ${successRate}%`));
  
  // Barra de progresso visual
  const barLength = 50;
  const filledLength = Math.round(barLength * passedTests / Math.max(totalTests, 1));
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  console.log(chalk.cyan(`   [${bar}]`));
  
  // Resultado final
  console.log(chalk.cyan.bold('\n' + '='.repeat(80)));
  if (failedTests === 0 && totalTests > 0) {
    console.log(chalk.green.bold('                    ✅ TODOS OS TESTES PASSARAM! 🎉'));
    console.log(chalk.green('              Sistema FLUI com Cascata 100% Funcional!'));
  } else if (failedTests > 0) {
    console.log(chalk.red.bold(`                    ❌ ${failedTests} TESTE(S) FALHARAM`));
    console.log(chalk.yellow('              Verifique os erros acima para correção'));
  } else {
    console.log(chalk.yellow.bold('                    ⚠️ NENHUM TESTE FOI EXECUTADO'));
  }
  console.log(chalk.cyan.bold('='.repeat(80) + '\n'));
  
  // Retorna código de saída apropriado
  process.exit(failedTests > 0 ? 1 : 0);
}

// Tratamento de erros
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('\n❌ Erro não tratado:'), error);
  process.exit(1);
});

// Executa os testes
runAllTests().catch(error => {
  console.error(chalk.red('\n❌ Erro fatal:'), error);
  process.exit(1);
});