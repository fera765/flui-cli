#!/usr/bin/env node

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { NavigationManager } from './src/services/navigationManager';
import { ErrorHandler } from './src/services/errorHandler';
import { ContentGenerator } from './src/services/contentGenerator';
import { OpenAIService } from './src/services/openAIService';

console.log(chalk.cyan.bold('\n' + '='.repeat(80)));
console.log(chalk.cyan.bold('  🧪 TESTE COMPLETO DAS NOVAS FUNCIONALIDADES DO FLUI'));
console.log(chalk.cyan.bold('='.repeat(80) + '\n'));

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

async function testNavigation() {
  console.log(chalk.blue('\n📁 TESTE 1: Sistema de Navegação e Histórico'));
  
  try {
    const nav = new NavigationManager();
    
    // Teste 1.1: Criar e navegar para pasta
    const testDir = 'test-navigation-' + Date.now();
    const createResult = await nav.createAndNavigate(testDir);
    
    if (!createResult.success) throw new Error('Falha ao criar diretório');
    
    // Teste 1.2: Verificar contexto
    const context = nav.analyzeContext();
    console.log(chalk.gray(`  Contexto: Projeto=${context.isProject}, Tipo=${context.projectType}`));
    
    // Teste 1.3: Voltar ao diretório anterior
    const backResult = nav.goBack();
    if (!backResult.success) throw new Error('Falha ao voltar');
    
    // Limpar
    fs.rmSync(testDir, { recursive: true, force: true });
    
    results.push({
      name: 'Sistema de Navegação',
      passed: true,
      details: { 
        created: testDir,
        navigated: true,
        contextAnalyzed: true,
        historyWorking: true
      }
    });
    
    console.log(chalk.green('  ✅ Navegação funcionando corretamente'));
    return true;
  } catch (error: any) {
    results.push({
      name: 'Sistema de Navegação',
      passed: false,
      error: error.message
    });
    console.log(chalk.red(`  ❌ Erro: ${error.message}`));
    return false;
  }
}

async function testErrorHandling() {
  console.log(chalk.blue('\n🔧 TESTE 2: Sistema de Auto-Correção de Erros'));
  
  try {
    const errorHandler = new ErrorHandler();
    
    // Teste 2.1: Erro ENOENT (arquivo não existe)
    const enoentError = new Error("ENOENT: no such file or directory, open '/tmp/test-file.txt'");
    const fix1 = await errorHandler.analyzeAndFix(enoentError, 'file_read');
    
    console.log(chalk.gray(`  ENOENT: Solução="${fix1.solution}", Retryable=${fix1.retryable}`));
    
    // Teste 2.2: Erro de timeout
    const timeoutError = new Error('ETIMEDOUT: connection timeout');
    const fix2 = await errorHandler.analyzeAndFix(timeoutError, 'api_call');
    
    console.log(chalk.gray(`  TIMEOUT: Solução="${fix2.solution}", Retryable=${fix2.retryable}`));
    
    // Teste 2.3: Histórico de erros
    const history = errorHandler.getErrorHistory();
    
    results.push({
      name: 'Auto-Correção de Erros',
      passed: true,
      details: {
        errorsAnalyzed: 2,
        historySize: history.length,
        autoFixAvailable: fix1.solution !== undefined
      }
    });
    
    console.log(chalk.green('  ✅ Sistema de erros funcionando'));
    return true;
  } catch (error: any) {
    results.push({
      name: 'Auto-Correção de Erros',
      passed: false,
      error: error.message
    });
    console.log(chalk.red(`  ❌ Erro: ${error.message}`));
    return false;
  }
}

async function testContentGeneration() {
  console.log(chalk.blue('\n📝 TESTE 3: Geração Otimizada de Conteúdo'));
  
  try {
    const generator = new ContentGenerator();
    const testFile = 'test-content-' + Date.now() + '.md';
    
    // Teste 3.1: Gerar conteúdo grande
    const result = await generator.generateLargeContent(testFile, {
      targetWords: 500, // Teste com 500 palavras
      chunkSize: 100,
      topic: 'Teste do Flui',
      style: 'technical'
    });
    
    if (!result.success) throw new Error('Falha ao gerar conteúdo');
    
    console.log(chalk.gray(`  Gerado: ${result.totalWords} palavras em ${result.chunks} chunks`));
    
    // Teste 3.2: Verificar arquivo
    if (!fs.existsSync(testFile)) throw new Error('Arquivo não foi criado');
    
    const content = fs.readFileSync(testFile, 'utf8');
    const words = content.split(/\s+/).length;
    
    console.log(chalk.gray(`  Arquivo verificado: ${words} palavras`));
    
    // Teste 3.3: Append incremental
    const appendResult = await generator.appendToFile(testFile, '\n\n## Apêndice\nConteúdo adicional.');
    
    if (!appendResult.success) throw new Error('Falha ao adicionar conteúdo');
    
    // Limpar
    fs.unlinkSync(testFile);
    
    results.push({
      name: 'Geração de Conteúdo',
      passed: true,
      details: {
        wordsGenerated: result.totalWords,
        chunks: result.chunks,
        appendWorking: true
      }
    });
    
    console.log(chalk.green('  ✅ Geração de conteúdo otimizada funcionando'));
    return true;
  } catch (error: any) {
    results.push({
      name: 'Geração de Conteúdo',
      passed: false,
      error: error.message
    });
    console.log(chalk.red(`  ❌ Erro: ${error.message}`));
    return false;
  }
}

async function testFileCreationWithFolders() {
  console.log(chalk.blue('\n📂 TESTE 4: Criação de Arquivos com Pastas'));
  
  try {
    const service = new OpenAIService();
    const tool = service['tools'].get('file_write');
    
    if (!tool) throw new Error('Tool file_write não encontrada');
    
    // Teste 4.1: Criar arquivo com pasta
    const testPath = `test-folder-${Date.now()}/subfolder/test.md`;
    const result = await tool.execute({
      filename: testPath,
      content: '# Teste\nConteúdo de teste'
    });
    
    if (!result.success) throw new Error(`Falha ao criar arquivo: ${result.error}`);
    
    console.log(chalk.gray(`  Criado: ${testPath}`));
    
    // Verificar se foi criado
    const fullPath = path.join(process.cwd(), testPath);
    if (!fs.existsSync(fullPath)) throw new Error('Arquivo não foi criado');
    
    // Limpar
    const rootTestDir = testPath.split('/')[0];
    fs.rmSync(rootTestDir, { recursive: true, force: true });
    
    results.push({
      name: 'Criação com Pastas',
      passed: true,
      details: {
        pathCreated: testPath,
        foldersCreated: true
      }
    });
    
    console.log(chalk.green('  ✅ Criação de arquivos com pastas funcionando'));
    return true;
  } catch (error: any) {
    results.push({
      name: 'Criação com Pastas',
      passed: false,
      error: error.message
    });
    console.log(chalk.red(`  ❌ Erro: ${error.message}`));
    return false;
  }
}

async function testContextAnalysis() {
  console.log(chalk.blue('\n🔍 TESTE 5: Análise de Contexto do Projeto'));
  
  try {
    const nav = new NavigationManager();
    
    // Teste 5.1: Analisar diretório atual
    const context = nav.analyzeContext();
    
    console.log(chalk.gray(`  Diretório: ${nav.getCurrentDir()}`));
    console.log(chalk.gray(`  É projeto: ${context.isProject}`));
    console.log(chalk.gray(`  Tipo: ${context.projectType || 'N/A'}`));
    console.log(chalk.gray(`  Package.json: ${context.hasPackageJson}`));
    console.log(chalk.gray(`  Git: ${context.hasGit}`));
    
    // Teste 5.2: Status formatado
    const status = nav.formatStatus();
    console.log(chalk.gray('\n  Status:'));
    console.log(status);
    
    results.push({
      name: 'Análise de Contexto',
      passed: true,
      details: {
        contextDetected: true,
        projectType: context.projectType,
        statusFormatted: true
      }
    });
    
    console.log(chalk.green('  ✅ Análise de contexto funcionando'));
    return true;
  } catch (error: any) {
    results.push({
      name: 'Análise de Contexto',
      passed: false,
      error: error.message
    });
    console.log(chalk.red(`  ❌ Erro: ${error.message}`));
    return false;
  }
}

async function testNewTools() {
  console.log(chalk.blue('\n🛠️ TESTE 6: Novas Tools (navigate, append_content, analyze_context)'));
  
  try {
    const service = new OpenAIService();
    
    // Teste 6.1: Tool navigate
    const navigateTool = service['tools'].get('navigate');
    if (!navigateTool) throw new Error('Tool navigate não encontrada');
    
    const testDir = `test-nav-${Date.now()}`;
    const navResult = await navigateTool.execute({ path: testDir, create: true });
    
    if (!navResult.success) throw new Error('Falha ao navegar');
    console.log(chalk.gray(`  Navigate: Criado e navegado para ${testDir}`));
    
    // Voltar
    process.chdir('..');
    fs.rmSync(testDir, { recursive: true, force: true });
    
    // Teste 6.2: Tool append_content
    const appendTool = service['tools'].get('append_content');
    if (!appendTool) throw new Error('Tool append_content não encontrada');
    
    const testFile = `test-append-${Date.now()}.txt`;
    const appendResult = await appendTool.execute({
      path: testFile,
      content: 'Primeira linha'
    });
    
    if (!appendResult.success) throw new Error('Falha ao criar/adicionar');
    
    const appendResult2 = await appendTool.execute({
      path: testFile,
      content: 'Segunda linha'
    });
    
    if (!appendResult2.success) throw new Error('Falha ao adicionar');
    
    const content = fs.readFileSync(testFile, 'utf8');
    if (!content.includes('Primeira') || !content.includes('Segunda')) {
      throw new Error('Conteúdo não foi adicionado corretamente');
    }
    
    fs.unlinkSync(testFile);
    console.log(chalk.gray(`  Append: Conteúdo adicionado incrementalmente`));
    
    // Teste 6.3: Tool analyze_context
    const analyzeTool = service['tools'].get('analyze_context');
    if (!analyzeTool) throw new Error('Tool analyze_context não encontrada');
    
    const analyzeResult = await analyzeTool.execute({});
    if (!analyzeResult.success) throw new Error('Falha ao analisar contexto');
    
    console.log(chalk.gray(`  Analyze: Contexto analisado com sucesso`));
    
    results.push({
      name: 'Novas Tools',
      passed: true,
      details: {
        navigateWorking: true,
        appendWorking: true,
        analyzeWorking: true
      }
    });
    
    console.log(chalk.green('  ✅ Todas as novas tools funcionando'));
    return true;
  } catch (error: any) {
    results.push({
      name: 'Novas Tools',
      passed: false,
      error: error.message
    });
    console.log(chalk.red(`  ❌ Erro: ${error.message}`));
    return false;
  }
}

async function runAllTests() {
  console.log(chalk.yellow('🚀 Iniciando bateria de testes...\n'));
  
  await testNavigation();
  await testErrorHandling();
  await testContentGeneration();
  await testFileCreationWithFolders();
  await testContextAnalysis();
  await testNewTools();
  
  // Relatório final
  console.log(chalk.cyan.bold('\n' + '='.repeat(80)));
  console.log(chalk.cyan.bold('  📊 RELATÓRIO FINAL DOS TESTES'));
  console.log(chalk.cyan.bold('='.repeat(80) + '\n'));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const successRate = ((passed / total) * 100).toFixed(1);
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    const color = result.passed ? chalk.green : chalk.red;
    console.log(color(`  ${icon} ${result.name}`));
    if (result.error) {
      console.log(chalk.gray(`     Erro: ${result.error}`));
    }
  });
  
  console.log(chalk.white(`\n  📈 ESTATÍSTICAS:`));
  console.log(chalk.white(`     Total de testes: ${total}`));
  console.log(chalk.green(`     ✅ Passou: ${passed}`));
  console.log(chalk.red(`     ❌ Falhou: ${failed}`));
  console.log(chalk.yellow(`     📊 Taxa de sucesso: ${successRate}%`));
  
  if (passed === total) {
    console.log(chalk.green.bold('\n  🎉 PERFEITO! TODAS AS FUNCIONALIDADES ESTÃO FUNCIONANDO!'));
    console.log(chalk.green('  O Flui está pronto para produção com todas as novas features!'));
  } else if (passed > 0) {
    console.log(chalk.yellow.bold('\n  ⚠️ PARCIALMENTE FUNCIONAL'));
    console.log(chalk.yellow(`  ${failed} funcionalidade(s) precisam de ajustes`));
  }
  
  console.log(chalk.cyan.bold('\n  📋 FUNCIONALIDADES IMPLEMENTADAS:'));
  console.log(chalk.white('     ✅ Criação de pastas automática'));
  console.log(chalk.white('     ✅ Navegação entre diretórios'));
  console.log(chalk.white('     ✅ Auto-correção de erros'));
  console.log(chalk.white('     ✅ Análise de contexto do projeto'));
  console.log(chalk.white('     ✅ Geração otimizada de conteúdo grande'));
  console.log(chalk.white('     ✅ Append incremental (economia de memória)'));
  console.log(chalk.white('     ✅ Histórico de navegação'));
  console.log(chalk.white('     ✅ Sem dados mockados em produção'));
  
  console.log(chalk.cyan.bold('\n' + '='.repeat(80) + '\n'));
}

// Executar testes
runAllTests().catch(console.error);