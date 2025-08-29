#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs');

console.log(chalk.bold.cyan('\n🔬 TESTE DIRETO DE GERAÇÃO DE CONTEÚDO\n'));
console.log(chalk.gray('='.repeat(60)));

// Compilar
console.log(chalk.gray('Compilando...'));
require('child_process').execSync('npm run build', { stdio: 'ignore' });

const { IntelligentContentGenerator } = require('./dist/services/intelligentContentGenerator');

// Criar gerador
const generator = new IntelligentContentGenerator();

// TESTE 1: Roteiro sobre IA
console.log(chalk.yellow('\n📋 Teste 1: generateRoteiro("IA", "Crie um roteiro sobre IA")'));
console.log(chalk.gray('-'.repeat(50)));

const roteiro = generator.generateRoteiro('IA', 'Crie um roteiro sobre IA');

console.log(chalk.cyan(`Tamanho: ${roteiro.length} caracteres`));

// Verificar conteúdo
const hasTitle = roteiro.includes('# Roteiro');
const hasIA = roteiro.toLowerCase().includes('inteligência artificial') || roteiro.toLowerCase().includes(' ia ');
const hasCenas = roteiro.includes('CENA') || roteiro.includes('Cena');
const hasNarrador = roteiro.includes('NARRADOR') || roteiro.includes('HOST');

console.log(chalk.green('\nValidação:'));
console.log(`  ${hasTitle ? '✅' : '❌'} Título de roteiro`);
console.log(`  ${hasIA ? '✅' : '❌'} Conteúdo sobre IA`);
console.log(`  ${hasCenas ? '✅' : '❌'} Estrutura de cenas`);
console.log(`  ${hasNarrador ? '✅' : '❌'} Narrador/Host`);

// Preview
console.log(chalk.cyan('\nPrimeiras 500 caracteres:'));
console.log(chalk.gray('-'.repeat(50)));
console.log(chalk.gray(roteiro.substring(0, 500)));
console.log(chalk.gray('-'.repeat(50)));

// TESTE 2: Artigo sobre tecnologia
console.log(chalk.yellow('\n📋 Teste 2: generateDocument("artigo", "tecnologia", ...)'));
console.log(chalk.gray('-'.repeat(50)));

const artigo = generator.generateDocument('artigo', 'tecnologia', 'Crie um artigo sobre tecnologia');

console.log(chalk.cyan(`Tamanho: ${artigo.length} caracteres`));

// Verificar se é template
const isTemplate = artigo.includes('${topic}') || 
                  artigo.includes('Este documento foi gerado automaticamente');

console.log(chalk.green('\nValidação:'));
console.log(`  ${!isTemplate ? '✅' : '❌'} Não é template`);
console.log(`  ${artigo.length > 5000 ? '✅' : '❌'} Conteúdo rico (>5000 chars)`);

// Preview
console.log(chalk.cyan('\nPrimeiras 500 caracteres:'));
console.log(chalk.gray('-'.repeat(50)));
console.log(chalk.gray(artigo.substring(0, 500)));
console.log(chalk.gray('-'.repeat(50)));

// RESULTADO FINAL
console.log(chalk.bold.cyan('\n' + '='.repeat(60)));
console.log(chalk.bold.cyan('  RESULTADO DO TESTE DIRETO'));
console.log(chalk.bold.cyan('='.repeat(60) + '\n'));

if (roteiro.length > 5000 && artigo.length > 5000 && !isTemplate) {
  console.log(chalk.bold.green('✅ GERAÇÃO DE CONTEÚDO FUNCIONANDO!'));
  console.log(chalk.green('IntelligentContentGenerator está produzindo conteúdo rico!'));
  
  // Salvar exemplos
  fs.writeFileSync('exemplo-roteiro.md', roteiro);
  fs.writeFileSync('exemplo-artigo.md', artigo);
  console.log(chalk.green('\n📁 Arquivos de exemplo salvos:'));
  console.log(chalk.green('  • exemplo-roteiro.md'));
  console.log(chalk.green('  • exemplo-artigo.md'));
} else {
  console.log(chalk.red('❌ PROBLEMA NA GERAÇÃO DE CONTEÚDO!'));
  if (roteiro.length < 5000) console.log(chalk.red(`  • Roteiro muito curto: ${roteiro.length} chars`));
  if (artigo.length < 5000) console.log(chalk.red(`  • Artigo muito curto: ${artigo.length} chars`));
  if (isTemplate) console.log(chalk.red('  • Artigo é um template genérico'));
}