#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs');
const { spawn } = require('child_process');

console.log(chalk.bold.cyan('\n🚀 TESTE REAL DO FLUI EM PRODUÇÃO\n'));
console.log(chalk.gray('='.repeat(60)));

// Primeiro, compilar
console.log(chalk.gray('Compilando...'));
require('child_process').execSync('npm run build', { stdio: 'ignore' });

// Criar input para o Flui
const input = 'Crie um roteiro sobre IA\nexit\n';

// Executar o Flui
console.log(chalk.yellow('\n📝 Executando Flui com: "Crie um roteiro sobre IA"'));
console.log(chalk.gray('-'.repeat(50)));

const flui = spawn('npm', ['run', 'dev'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, NO_COLOR: '1' }
});

let output = '';
let errorOutput = '';

flui.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  // Mostrar apenas linhas importantes
  if (text.includes('✅') || text.includes('❌') || text.includes('📁') || 
      text.includes('Arquivo') || text.includes('criado') || text.includes('Tamanho')) {
    process.stdout.write(chalk.green(text));
  }
});

flui.stderr.on('data', (data) => {
  errorOutput += data.toString();
});

// Enviar comando
setTimeout(() => {
  flui.stdin.write('Crie um roteiro sobre IA\n');
  
  // Aguardar processamento
  setTimeout(() => {
    flui.stdin.write('exit\n');
  }, 10000);
}, 2000);

flui.on('close', (code) => {
  console.log(chalk.gray('\n' + '-'.repeat(50)));
  
  // Verificar se arquivo foi criado
  const files = ['roteiro.md', 'script.md', 'output.txt', 'artigo.md'];
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
    console.log(chalk.bold.green(`\n✅ ARQUIVO CRIADO: ${foundFile}`));
    console.log(chalk.green(`📏 Tamanho: ${content.length} caracteres`));
    
    // Análise do conteúdo
    console.log(chalk.cyan('\n📊 ANÁLISE DO CONTEÚDO:'));
    console.log(chalk.gray('='.repeat(50)));
    
    // Verificar se é template genérico
    const templatePhrases = [
      'Este documento foi gerado automaticamente',
      '${topic}',
      'Seção 1:',
      'Seção 2:',
      'Seção 3:'
    ];
    
    let isTemplate = false;
    for (const phrase of templatePhrases) {
      if (content.includes(phrase)) {
        console.log(chalk.red(`❌ Template detectado: "${phrase}"`));
        isTemplate = true;
      }
    }
    
    // Contar repetições da palavra "artigo"
    const artigoCount = (content.match(/artigo/gi) || []).length;
    if (artigoCount > 10 && content.length < 2000) {
      console.log(chalk.red(`❌ Palavra "artigo" repetida ${artigoCount} vezes (template)`));
      isTemplate = true;
    }
    
    // Verificar elementos de roteiro
    if (foundFile.includes('roteiro')) {
      const hasTitle = content.includes('# Roteiro');
      const hasIA = content.toLowerCase().includes('ia') || content.toLowerCase().includes('inteligência artificial');
      const hasCenas = content.includes('CENA') || content.includes('Cena');
      const hasNarrador = content.includes('NARRADOR') || content.includes('HOST');
      
      console.log(chalk.cyan('\nElementos de Roteiro:'));
      console.log(`  ${hasTitle ? '✅' : '❌'} Título de roteiro`);
      console.log(`  ${hasIA ? '✅' : '❌'} Conteúdo sobre IA`);
      console.log(`  ${hasCenas ? '✅' : '❌'} Estrutura de cenas`);
      console.log(`  ${hasNarrador ? '✅' : '❌'} Narrador/Host`);
      
      if (hasTitle && hasIA && (hasCenas || hasNarrador)) {
        console.log(chalk.bold.green('\n🎉 ROTEIRO ESPECÍFICO E RICO SOBRE IA!'));
      }
    }
    
    // Preview do conteúdo
    console.log(chalk.cyan('\n📄 PREVIEW DO CONTEÚDO:'));
    console.log(chalk.gray('='.repeat(50)));
    const lines = content.split('\n').slice(0, 20);
    lines.forEach(line => {
      if (line.startsWith('#')) {
        console.log(chalk.bold.yellow(line));
      } else if (line.includes('CENA') || line.includes('NARRADOR')) {
        console.log(chalk.cyan(line));
      } else {
        console.log(chalk.gray(line));
      }
    });
    console.log(chalk.gray('='.repeat(50)));
    
    // Resultado final
    if (!isTemplate && content.length > 3000) {
      console.log(chalk.bold.green('\n✅✅✅ SUCESSO TOTAL! ✅✅✅'));
      console.log(chalk.green('O Flui gerou conteúdo rico e específico!'));
      console.log(chalk.green('NÃO é um template genérico!'));
    } else if (isTemplate) {
      console.log(chalk.bold.red('\n❌❌❌ FALHA! ❌❌❌'));
      console.log(chalk.red('O Flui ainda está gerando templates genéricos!'));
    } else {
      console.log(chalk.yellow('\n⚠️ RESULTADO PARCIAL'));
      console.log(chalk.yellow('Conteúdo gerado mas precisa melhorias'));
    }
    
  } else {
    console.log(chalk.red('\n❌ NENHUM ARQUIVO FOI CRIADO!'));
  }
  
  console.log(chalk.gray('\n' + '='.repeat(60)));
  process.exit(code);
});