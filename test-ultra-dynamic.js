#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * Sistema de Teste Ultra Dinâmico
 * Analisa Flui em tempo real com 3 tarefas diferentes
 */
class UltraDynamicTester {
  constructor() {
    this.testResults = [];
    this.currentTest = null;
    this.fluiProcess = null;
    this.realTimeAnalysis = {
      dynamicBehavior: [],
      staticPatterns: [],
      agentActivity: [],
      errors: []
    };
  }
  
  /**
   * Analisa logs em tempo real
   */
  analyzeLog(data) {
    const log = data.toString();
    
    // Detecta uso de agentes
    if (log.includes('[DynamicAnalyzer]')) {
      this.realTimeAnalysis.agentActivity.push({
        time: new Date().toISOString(),
        agent: 'DynamicAnalyzer',
        action: log
      });
      console.log(chalk.green('✓ Agente DynamicAnalyzer ativo'));
    }
    
    if (log.includes('[ContentGenerator]')) {
      this.realTimeAnalysis.agentActivity.push({
        time: new Date().toISOString(),
        agent: 'ContentGenerator',
        action: log
      });
      console.log(chalk.green('✓ Agente ContentGenerator ativo'));
    }
    
    if (log.includes('[QualityValidator]')) {
      this.realTimeAnalysis.agentActivity.push({
        time: new Date().toISOString(),
        agent: 'QualityValidator',
        action: log
      });
      console.log(chalk.green('✓ Agente QualityValidator ativo'));
    }
    
    // Detecta comportamento dinâmico
    if (log.includes('Analyzing request') || 
        log.includes('Detecting intent') ||
        log.includes('Generating chunk')) {
      this.realTimeAnalysis.dynamicBehavior.push({
        time: new Date().toISOString(),
        behavior: log
      });
    }
    
    // Detecta padrões estáticos (não deveria ter!)
    const staticPatterns = [
      /if\s*\([^)]*includes\s*\(['"]/,
      /===\s*['"][^'"]+['"]/,
      /case\s*['"][^'"]+['"]/
    ];
    
    for (const pattern of staticPatterns) {
      if (pattern.test(log)) {
        this.realTimeAnalysis.staticPatterns.push({
          time: new Date().toISOString(),
          pattern: log
        });
        console.log(chalk.red('⚠️ Padrão estático detectado!'));
      }
    }
    
    // Detecta erros
    if (log.toLowerCase().includes('error') || log.includes('❌')) {
      this.realTimeAnalysis.errors.push({
        time: new Date().toISOString(),
        error: log
      });
      console.log(chalk.red('❌ Erro detectado:', log.substring(0, 100)));
    }
  }
  
  /**
   * Executa teste com uma tarefa
   */
  async runTest(testName, command) {
    console.log(chalk.cyan.bold(`\n${'='.repeat(70)}`));
    console.log(chalk.cyan.bold(`🧪 TESTE: ${testName}`));
    console.log(chalk.cyan.bold(`${'='.repeat(70)}`));
    console.log(chalk.yellow(`📝 Comando: ${command}`));
    console.log(chalk.gray(`⏰ Início: ${new Date().toISOString()}\n`));
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      let outputBuffer = '';
      let fileCreated = false;
      let wordCount = 0;
      
      // Inicia o Flui
      this.fluiProcess = spawn('npx', ['ts-node', 'src/index-ultra-dynamic.ts'], {
        cwd: '/workspace',
        env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' }
      });
      
      // Timeout para enviar comando
      setTimeout(() => {
        console.log(chalk.blue('📤 Enviando comando ao Flui...'));
        this.fluiProcess.stdin.write(command + '\n');
      }, 3000);
      
      // Analisa stdout
      this.fluiProcess.stdout.on('data', (data) => {
        outputBuffer += data.toString();
        this.analyzeLog(data);
        
        // Detecta criação de arquivo
        if (data.toString().includes('Arquivo:')) {
          fileCreated = true;
          console.log(chalk.green('✅ Arquivo criado detectado'));
        }
        
        // Detecta contagem de palavras
        const wordMatch = data.toString().match(/Palavras:\s*([\d,]+)/);
        if (wordMatch) {
          wordCount = parseInt(wordMatch[1].replace(/,/g, ''));
          console.log(chalk.blue(`📊 Palavras detectadas: ${wordCount}`));
        }
      });
      
      // Analisa stderr
      this.fluiProcess.stderr.on('data', (data) => {
        this.analyzeLog(data);
      });
      
      // Timeout para finalizar teste
      setTimeout(() => {
        const duration = (Date.now() - startTime) / 1000;
        
        // Verifica arquivos criados
        const files = fs.readdirSync('/workspace')
          .filter(f => f.endsWith('.md') && f.includes(Date.now().toString().substring(0, 7)));
        
        // Análise final
        const result = {
          name: testName,
          command: command,
          duration: duration,
          fileCreated: fileCreated || files.length > 0,
          wordCount: wordCount,
          agentActivity: this.realTimeAnalysis.agentActivity.length,
          dynamicBehaviors: this.realTimeAnalysis.dynamicBehavior.length,
          staticPatterns: this.realTimeAnalysis.staticPatterns.length,
          errors: this.realTimeAnalysis.errors.length,
          score: this.calculateScore(fileCreated, wordCount, this.realTimeAnalysis)
        };
        
        this.testResults.push(result);
        
        // Mata o processo
        if (this.fluiProcess) {
          this.fluiProcess.kill();
        }
        
        // Limpa análise para próximo teste
        this.realTimeAnalysis = {
          dynamicBehavior: [],
          staticPatterns: [],
          agentActivity: [],
          errors: []
        };
        
        resolve(result);
      }, 120000); // 2 minutos por teste
    });
  }
  
  /**
   * Calcula score do teste
   */
  calculateScore(fileCreated, wordCount, analysis) {
    let score = 0;
    
    // Arquivo criado: 20 pontos
    if (fileCreated) score += 20;
    
    // Palavras (para 20k): 30 pontos
    if (wordCount >= 20000) score += 30;
    else if (wordCount >= 15000) score += 25;
    else if (wordCount >= 10000) score += 20;
    else if (wordCount >= 5000) score += 15;
    else if (wordCount > 0) score += 10;
    
    // Agentes ativos: 20 pontos
    if (analysis.agentActivity.length >= 10) score += 20;
    else if (analysis.agentActivity.length >= 5) score += 15;
    else if (analysis.agentActivity.length > 0) score += 10;
    
    // Comportamento dinâmico: 20 pontos
    if (analysis.dynamicBehavior.length >= 10) score += 20;
    else if (analysis.dynamicBehavior.length >= 5) score += 15;
    else if (analysis.dynamicBehavior.length > 0) score += 10;
    
    // Sem padrões estáticos: 10 pontos
    if (analysis.staticPatterns.length === 0) score += 10;
    else score -= analysis.staticPatterns.length * 2;
    
    // Sem erros: bonus
    if (analysis.errors.length === 0) score += 5;
    else score -= analysis.errors.length;
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Executa todos os testes
   */
  async runAllTests() {
    console.log(chalk.cyan.bold('🚀 INICIANDO TESTES ULTRA DINÂMICOS DO FLUI'));
    console.log(chalk.yellow('📊 Análise em tempo real ativada'));
    console.log(chalk.green('🧠 Monitorando agentes inteligentes\n'));
    
    // Teste 1: Ebook de 20k palavras
    const test1 = await this.runTest(
      'Ebook 20k palavras sobre IA',
      'Crie um ebook completo de 20000 palavras sobre inteligência artificial e o futuro da tecnologia'
    );
    
    await new Promise(r => setTimeout(r, 5000)); // Pausa entre testes
    
    // Teste 2: Artigo técnico de 20k palavras
    const test2 = await this.runTest(
      'Artigo técnico 20k palavras sobre blockchain',
      'Escreva um artigo técnico detalhado de 20000 palavras sobre blockchain e criptomoedas'
    );
    
    await new Promise(r => setTimeout(r, 5000));
    
    // Teste 3: Manual de programação de 20k palavras
    const test3 = await this.runTest(
      'Manual Python 20k palavras',
      'Desenvolva um manual completo de programação Python com 20000 palavras incluindo exemplos práticos'
    );
    
    // Gera relatório final
    this.generateFinalReport();
  }
  
  /**
   * Gera relatório final detalhado
   */
  generateFinalReport() {
    console.log(chalk.cyan.bold(`\n${'='.repeat(70)}`));
    console.log(chalk.cyan.bold('📊 RELATÓRIO FINAL - ANÁLISE ULTRA DINÂMICA'));
    console.log(chalk.cyan.bold(`${'='.repeat(70)}\n`));
    
    let totalScore = 0;
    let allDynamic = true;
    let allAgentsActive = true;
    
    this.testResults.forEach((result, index) => {
      console.log(chalk.blue.bold(`${index + 1}. ${result.name}`));
      console.log(chalk.gray(`   Comando: ${result.command.substring(0, 50)}...`));
      console.log(chalk.gray(`   Duração: ${result.duration.toFixed(1)}s`));
      console.log(chalk.gray(`   Arquivo criado: ${result.fileCreated ? '✅' : '❌'}`));
      console.log(chalk.gray(`   Palavras: ${result.wordCount.toLocaleString()}`));
      console.log(chalk.gray(`   Atividade de agentes: ${result.agentActivity}`));
      console.log(chalk.gray(`   Comportamentos dinâmicos: ${result.dynamicBehaviors}`));
      console.log(chalk.gray(`   Padrões estáticos: ${result.staticPatterns}`));
      console.log(chalk.gray(`   Erros: ${result.errors}`));
      console.log(chalk.yellow(`   Score: ${result.score}%\n`));
      
      totalScore += result.score;
      if (result.staticPatterns > 0) allDynamic = false;
      if (result.agentActivity < 5) allAgentsActive = false;
    });
    
    const avgScore = totalScore / this.testResults.length;
    
    console.log(chalk.yellow.bold('📈 MÉTRICAS CONSOLIDADAS:'));
    console.log(chalk.white(`   Score médio: ${avgScore.toFixed(1)}%`));
    console.log(chalk.white(`   100% Dinâmico: ${allDynamic ? '✅ SIM' : '❌ NÃO'}`));
    console.log(chalk.white(`   Agentes ativos: ${allAgentsActive ? '✅ SIM' : '⚠️ PARCIAL'}`));
    
    // Análise de dinamismo
    console.log(chalk.cyan.bold('\n🔍 ANÁLISE DE DINAMISMO:'));
    
    const totalAgentCalls = this.testResults.reduce((sum, r) => sum + r.agentActivity, 0);
    const totalDynamicBehaviors = this.testResults.reduce((sum, r) => sum + r.dynamicBehaviors, 0);
    const totalStaticPatterns = this.testResults.reduce((sum, r) => sum + r.staticPatterns, 0);
    
    console.log(chalk.white(`   Total de chamadas de agentes: ${totalAgentCalls}`));
    console.log(chalk.white(`   Total de comportamentos dinâmicos: ${totalDynamicBehaviors}`));
    console.log(chalk.white(`   Total de padrões estáticos: ${totalStaticPatterns}`));
    
    // Veredito final
    console.log(chalk.cyan.bold(`\n${'='.repeat(70)}`));
    
    if (avgScore >= 90 && allDynamic && allAgentsActive) {
      console.log(chalk.green.bold('🎉 FLUI ULTRA DINÂMICO - 100% APROVADO!'));
      console.log(chalk.green('✅ Sistema completamente dinâmico'));
      console.log(chalk.green('✅ Agentes inteligentes funcionando'));
      console.log(chalk.green('✅ Sem padrões estáticos'));
      console.log(chalk.green('✅ Score perfeito em todas as tarefas'));
    } else {
      console.log(chalk.yellow.bold('⚠️ FLUI PRECISA DE AJUSTES'));
      if (!allDynamic) console.log(chalk.red('❌ Padrões estáticos detectados'));
      if (!allAgentsActive) console.log(chalk.red('❌ Agentes não totalmente ativos'));
      if (avgScore < 90) console.log(chalk.red(`❌ Score abaixo do esperado: ${avgScore.toFixed(1)}%`));
    }
    
    console.log(chalk.cyan.bold(`${'='.repeat(70)}\n`));
  }
}

// Executa os testes
async function main() {
  const tester = new UltraDynamicTester();
  await tester.runAllTests();
}

main().catch(console.error);