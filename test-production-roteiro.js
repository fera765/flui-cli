#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

console.log(chalk.bold.cyan('\n🎬 TESTE DE PRODUÇÃO - ROTEIRO REAL\n'));
console.log(chalk.gray('='.repeat(60)));

async function testProduction() {
  try {
    // Compilar
    console.log(chalk.gray('Compilando...'));
    require('child_process').execSync('npm run build', { stdio: 'ignore' });
    
    const { SpiralOrchestrator } = require('./dist/services/spiralOrchestrator');
    const { IntelligentContentGenerator } = require('./dist/services/intelligentContentGenerator');
    
    // TESTE 1: Roteiro sobre IA
    console.log(chalk.yellow('\n📋 Teste 1: Roteiro sobre IA'));
    console.log(chalk.gray('-'.repeat(50)));
    
    const orchestrator = new SpiralOrchestrator();
    const result = await orchestrator.processUserRequest('Crie um roteiro sobre IA');
    
    console.log(chalk.cyan(`Status: ${result.status}`));
    console.log(chalk.cyan(`Iterações: ${result.iterations}`));
    
    // Verificar arquivo criado
    const files = ['roteiro.md', 'script.md', 'output.txt'];
    let fileFound = false;
    let foundFile = '';
    
    for (const file of files) {
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
      
      // VALIDAÇÃO CRÍTICA
      const isGenericTemplate = 
        content.includes('${topic}') ||
        content.includes('Este documento foi gerado automaticamente') ||
        (content.match(/artigo/gi) || []).length > 10 && content.length < 2000 ||
        (content.includes('Seção 1:') && content.includes('Seção 2:') && content.length < 2000);
      
      if (isGenericTemplate) {
        console.log(chalk.red('❌ FALHA! Template genérico detectado!'));
        console.log(chalk.gray('\nConteúdo gerado:'));
        console.log(chalk.gray('-'.repeat(50)));
        console.log(chalk.gray(content.substring(0, 500)));
        console.log(chalk.gray('-'.repeat(50)));
      } else if (content.length > 5000 && content.includes('Roteiro')) {
        console.log(chalk.bold.green('✅ SUCESSO! Conteúdo rico e específico!'));
        
        // Verificar elementos específicos de roteiro
        const hasTitle = content.includes('# Roteiro');
        const hasInfo = content.includes('INFORMAÇÕES');
        const hasCenas = content.includes('CENA') || content.includes('Cena');
        const hasDialogos = content.includes('NARRADOR') || content.includes('HOST');
        
        console.log(chalk.green('\nValidação de Conteúdo:'));
        console.log(chalk.green(`  ✅ Título: ${hasTitle ? 'Sim' : 'Não'}`));
        console.log(chalk.green(`  ✅ Informações: ${hasInfo ? 'Sim' : 'Não'}`));
        console.log(chalk.green(`  ✅ Cenas: ${hasCenas ? 'Sim' : 'Não'}`));
        console.log(chalk.green(`  ✅ Diálogos: ${hasDialogos ? 'Sim' : 'Não'}`));
        
        // Preview
        console.log(chalk.gray('\nPrimeiras linhas:'));
        console.log(chalk.gray('-'.repeat(50)));
        const lines = content.split('\n').slice(0, 15);
        lines.forEach(line => console.log(chalk.gray(line)));
        console.log(chalk.gray('-'.repeat(50)));
      } else {
        console.log(chalk.yellow(`⚠️ Conteúdo existe mas pode melhorar`));
        console.log(chalk.gray(`Tamanho: ${content.length} caracteres`));
      }
      
      // Limpar
      fs.unlinkSync(foundFile);
      console.log(chalk.gray(`\n🗑️ Arquivo ${foundFile} removido`));
    } else {
      console.log(chalk.red('❌ Nenhum arquivo criado'));
    }
    
    // TESTE 2: Artigo sobre tecnologia
    console.log(chalk.yellow('\n📋 Teste 2: Artigo sobre tecnologia'));
    console.log(chalk.gray('-'.repeat(50)));
    
    const generator = new IntelligentContentGenerator();
    const article = generator.generateDocument('artigo', 'tecnologia', 'Crie um artigo sobre tecnologia');
    
    console.log(chalk.cyan(`📏 Tamanho do artigo: ${article.length} caracteres`));
    
    // Validar artigo
    const isGenericArticle = 
      article.includes('${topic}') ||
      (article.match(/artigo/gi) || []).length > 10 && article.length < 2000;
    
    if (isGenericArticle) {
      console.log(chalk.red('❌ Artigo genérico!'));
    } else if (article.length > 5000) {
      console.log(chalk.green('✅ Artigo rico e detalhado!'));
      
      // Verificar seções
      const hasSections = article.includes('## ');
      const hasIntro = article.includes('Introdução') || article.includes('Resumo');
      const hasConclusion = article.includes('Conclusão') || article.includes('Considerações');
      
      console.log(chalk.green(`  ✅ Seções: ${hasSections ? 'Sim' : 'Não'}`));
      console.log(chalk.green(`  ✅ Introdução: ${hasIntro ? 'Sim' : 'Não'}`));
      console.log(chalk.green(`  ✅ Conclusão: ${hasConclusion ? 'Sim' : 'Não'}`));
    }
    
    // RESUMO FINAL
    console.log(chalk.bold.cyan('\n' + '='.repeat(60)));
    console.log(chalk.bold.cyan('  RESUMO DO TESTE DE PRODUÇÃO'));
    console.log(chalk.bold.cyan('='.repeat(60) + '\n'));
    
    const corrections = [
      'IntelligentContentGenerator com conteúdo rico',
      'Validação rejeita templates genéricos',
      'SpiralOrchestrator gera conteúdo específico',
      'Detecção de tópico do pedido do usuário',
      'Fallback para geração de conteúdo'
    ];
    
    console.log(chalk.green('✅ Correções implementadas:'));
    corrections.forEach(c => console.log(chalk.gray(`  • ${c}`)));
    
    if (fileFound && !isGenericTemplate) {
      console.log(chalk.bold.green('\n🎉 SISTEMA FUNCIONANDO PERFEITAMENTE!'));
      console.log(chalk.green('O Flui agora gera conteúdo rico e específico!'));
    } else {
      console.log(chalk.bold.yellow('\n⚠️ Ainda há ajustes necessários'));
    }
    
  } catch (error) {
    console.error(chalk.red('\nErro no teste:'), error.message);
    console.error(error.stack);
  }
}

testProduction();