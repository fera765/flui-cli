#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs');

console.log(chalk.bold.cyan('\n🔍 TESTE DA CORREÇÃO DO RESULTADO VAZIO\n'));
console.log(chalk.gray('='.repeat(60) + '\n'));

async function testFix() {
  try {
    // Compilar
    console.log(chalk.gray('Compilando...'));
    require('child_process').execSync('npm run build', { stdio: 'ignore' });
    
    const { SpiralOrchestrator } = require('./dist/services/spiralOrchestrator');
    
    console.log(chalk.green('✅ Sistema compilado\n'));
    
    // TESTE 1: Roteiro simples
    console.log(chalk.yellow('📋 Teste 1: Roteiro sobre IA'));
    console.log(chalk.gray('-'.repeat(50)));
    
    const orchestrator = new SpiralOrchestrator();
    const result = await orchestrator.processUserRequest('Crie um roteiro sobre AI');
    
    console.log(chalk.cyan(`\nStatus: ${result.status}`));
    console.log(chalk.cyan(`Iterações: ${result.iterations}`));
    console.log(chalk.cyan(`Componentes: ${result.components.join(', ')}`));
    
    // Verificar se resultado não é vazio
    if (result.result) {
      const contentLength = typeof result.result === 'string' ? 
                           result.result.length : 
                           JSON.stringify(result.result).length;
      console.log(chalk.green(`✅ Resultado existe: ${contentLength} caracteres`));
      
      // Verificar tipo do resultado
      if (typeof result.result === 'string') {
        console.log(chalk.green('✅ Resultado é string (conteúdo direto)'));
        if (result.result.includes('Roteiro') || result.result.includes('roteiro')) {
          console.log(chalk.green('✅ Contém palavra "roteiro"'));
        }
      } else if (result.result.content) {
        console.log(chalk.green(`✅ Resultado tem content: ${result.result.content.length} caracteres`));
      }
    } else {
      console.log(chalk.red('❌ Resultado vazio!'));
    }
    
    // Verificar se arquivo foi criado
    const possibleFiles = ['roteiro.md', 'script.md', 'output.txt'];
    let fileFound = false;
    let foundFile = '';
    
    for (const file of possibleFiles) {
      if (fs.existsSync(file)) {
        fileFound = true;
        foundFile = file;
        break;
      }
    }
    
    if (fileFound) {
      const content = fs.readFileSync(foundFile, 'utf8');
      console.log(chalk.green(`✅ Arquivo criado: ${foundFile}`));
      console.log(chalk.green(`📏 Tamanho: ${content.length} caracteres`));
      
      if (content.length > 5000) {
        console.log(chalk.bold.green('✅ CONTEÚDO RICO CONFIRMADO!'));
      } else if (content.length > 1000) {
        console.log(chalk.yellow('⚠️ Conteúdo médio'));
      } else if (content.length === 0) {
        console.log(chalk.red('❌ ARQUIVO VAZIO!'));
      } else {
        console.log(chalk.red(`❌ Conteúdo muito pequeno: ${content.length}`));
      }
      
      // Preview
      if (content.length > 0) {
        console.log(chalk.gray('\nPreview do conteúdo:'));
        console.log(chalk.gray('-'.repeat(50)));
        console.log(chalk.gray(content.substring(0, 300) + '...'));
        console.log(chalk.gray('-'.repeat(50)));
      }
      
      // Limpar
      fs.unlinkSync(foundFile);
      console.log(chalk.gray(`\n🗑️ Arquivo ${foundFile} removido`));
    } else {
      console.log(chalk.red('❌ Nenhum arquivo criado'));
    }
    
    // TESTE 2: Verificar correções no código
    console.log(chalk.yellow('\n📋 Teste 2: Verificar Correções'));
    console.log(chalk.gray('-'.repeat(50)));
    
    const autonomousCode = fs.readFileSync('./dist/services/autonomousAgent.js', 'utf8');
    const spiralCode = fs.readFileSync('./dist/services/spiralOrchestrator.js', 'utf8');
    
    // Verificar se as correções estão presentes
    const hasPartialResult = autonomousCode.includes('partial: true') || 
                            autonomousCode.includes('Resultado parcial');
    const hasErrorResult = autonomousCode.includes('error: true') || 
                          autonomousCode.includes('iterations: task.iterations');
    const hasContentGeneration = spiralCode.includes('Gerando conteúdo...') || 
                                 spiralCode.includes('generateContent');
    const hasStringCheck = spiralCode.includes('typeof result === \'string\'');
    
    console.log(hasPartialResult ? chalk.green('✅ Correção de resultado parcial') : chalk.red('❌ Correção de resultado parcial'));
    console.log(hasErrorResult ? chalk.green('✅ Correção de resultado em erro') : chalk.red('❌ Correção de resultado em erro'));
    console.log(hasContentGeneration ? chalk.green('✅ Geração de conteúdo fallback') : chalk.red('❌ Geração de conteúdo fallback'));
    console.log(hasStringCheck ? chalk.green('✅ Verificação de tipo string') : chalk.red('❌ Verificação de tipo string'));
    
    // RESUMO
    console.log(chalk.bold.cyan('\n' + '='.repeat(60)));
    console.log(chalk.bold.cyan('  RESUMO DA CORREÇÃO'));
    console.log(chalk.bold.cyan('='.repeat(60) + '\n'));
    
    const fixes = [
      'Agente sempre retorna resultado (mesmo parcial)',
      'Fallback para geração de conteúdo se agente falha',
      'Validação aceita strings e objetos',
      'Score aumentado para conteúdo rico',
      'Arquivo sempre criado para roteiros/artigos'
    ];
    
    console.log(chalk.green('✅ Correções implementadas:'));
    fixes.forEach(fix => console.log(chalk.gray(`  • ${fix}`)));
    
    if (result.status === 'completed' && fileFound && fs.readFileSync(foundFile, 'utf8').length > 0) {
      console.log(chalk.bold.green('\n🎉 PROBLEMA RESOLVIDO! Não há mais resultados vazios!'));
    } else if (result.status === 'failed' && !result.result) {
      console.log(chalk.bold.red('\n❌ PROBLEMA PERSISTE! Ainda há resultados vazios!'));
    } else {
      console.log(chalk.bold.yellow('\n⚠️ Correção parcial. Precisa mais ajustes.'));
    }
    
  } catch (error) {
    console.error(chalk.red('\nErro no teste:'), error.message);
  }
}

testFix().catch(console.error);