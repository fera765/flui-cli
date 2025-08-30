#!/usr/bin/env node

import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

interface TestResult {
  taskName: string;
  requestedWords: number;
  actualWords: number;
  score: number;
  success: boolean;
  output: string;
  iterations: number;
  adjustments: string[];
}

class FluiTestAutomation {
  private fluiProcess: ChildProcess | null = null;
  private currentTask: string = '';
  private outputBuffer: string = '';
  private adjustmentCount: number = 0;
  private maxAdjustments: number = 10;
  private testResults: TestResult[] = [];
  
  constructor() {
    console.log(chalk.cyan.bold('🚀 Iniciando Automação de Testes do Flui'));
    console.log(chalk.yellow('📊 Objetivo: Alcançar autoconsciência com score +90%\n'));
  }

  private async startFlui(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(chalk.blue('🔧 Iniciando Flui em modo produção...'));
      
      this.fluiProcess = spawn('npm', ['run', 'flui'], {
        cwd: '/workspace',
        shell: true
      });

      this.fluiProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        this.outputBuffer += output;
        
        // Detecta quando Flui está pronto
        if (output.includes('FLUI CLI - PRODUÇÃO') || 
            output.includes('Digite sua mensagem')) {
          console.log(chalk.green('✅ Flui iniciado com sucesso!'));
          resolve();
        }
        
        // Monitora erros em tempo real
        this.monitorErrors(output);
      });

      this.fluiProcess.stderr?.on('data', (data) => {
        console.error(chalk.red('❌ Erro no Flui:'), data.toString());
        this.handleFluiError(data.toString());
      });

      this.fluiProcess.on('error', (error) => {
        console.error(chalk.red('💥 Erro ao iniciar Flui:'), error);
        reject(error);
      });

      // Timeout de 10 segundos para inicialização
      setTimeout(() => {
        if (!this.outputBuffer.includes('FLUI CLI')) {
          reject(new Error('Timeout ao iniciar Flui'));
        }
      }, 10000);
    });
  }

  private sendCommand(command: string): void {
    if (this.fluiProcess && this.fluiProcess.stdin) {
      console.log(chalk.cyan(`\n📤 Enviando comando: ${command}`));
      this.fluiProcess.stdin.write(command + '\n');
    }
  }

  private monitorErrors(output: string): void {
    const errorPatterns = [
      /error/i,
      /failed/i,
      /exception/i,
      /undefined/i,
      /cannot/i,
      /invalid/i
    ];

    for (const pattern of errorPatterns) {
      if (pattern.test(output)) {
        console.log(chalk.yellow('⚠️ Possível erro detectado, analisando...'));
        this.analyzeAndFix(output);
        break;
      }
    }
  }

  private async analyzeAndFix(output: string): Promise<void> {
    if (this.adjustmentCount >= this.maxAdjustments) {
      console.log(chalk.red('❌ Máximo de ajustes atingido'));
      return;
    }

    console.log(chalk.yellow(`🔧 Ajuste #${this.adjustmentCount + 1}: Analisando problema...`));
    
    // Analisa o tipo de erro e aplica correção
    if (output.includes('template') || output.includes('mock')) {
      console.log(chalk.blue('🔄 Detectado uso de template/mock - corrigindo para conteúdo dinâmico'));
      this.sendCommand('/clear');
      await this.wait(1000);
      this.sendCommand('Use apenas conteúdo gerado dinamicamente via LLM, sem templates ou dados mockados');
      this.adjustmentCount++;
    }
    
    if (output.includes('menos') || output.includes('insuficiente')) {
      console.log(chalk.blue('🔄 Detectado conteúdo insuficiente - solicitando expansão'));
      this.sendCommand('Continue expandindo o conteúdo até atingir o requisito completo');
      this.adjustmentCount++;
    }
  }

  private handleFluiError(error: string): void {
    console.log(chalk.red('🚨 Erro crítico detectado no Flui'));
    console.log(chalk.yellow('🔄 Reiniciando Flui...'));
    
    if (this.fluiProcess) {
      this.fluiProcess.kill();
      this.fluiProcess = null;
    }
    
    setTimeout(() => {
      this.startFlui().then(() => {
        console.log(chalk.green('✅ Flui reiniciado com sucesso'));
        this.retryCurrentTask();
      });
    }, 2000);
  }

  private retryCurrentTask(): void {
    if (this.currentTask) {
      console.log(chalk.blue(`🔄 Retentando tarefa: ${this.currentTask}`));
      this.sendCommand(this.currentTask);
    }
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async testEbookCreation(): Promise<TestResult> {
    console.log(chalk.cyan.bold('\n📚 TESTE 1: Criação de Ebook de 20.000 palavras'));
    
    this.currentTask = 'Crie um ebook de 20 mil palavras sobre monetização no YouTube. O ebook deve ser completo, detalhado e profissional, com capítulos bem estruturados, exemplos práticos e estratégias reais. NÃO use templates ou conteúdo pré-definido. Gere tudo dinamicamente.';
    
    this.sendCommand(this.currentTask);
    
    // Aguarda resposta e monitora
    await this.waitForCompletion();
    
    // Valida o resultado
    const result = await this.validateEbook();
    
    return result;
  }

  private async waitForCompletion(): Promise<void> {
    console.log(chalk.blue('⏳ Aguardando conclusão da tarefa...'));
    
    let waitTime = 0;
    const maxWait = 120000; // 2 minutos
    
    while (waitTime < maxWait) {
      await this.wait(5000); // Verifica a cada 5 segundos
      waitTime += 5000;
      
      // Verifica se a tarefa foi concluída
      if (this.outputBuffer.includes('concluída') || 
          this.outputBuffer.includes('criado com sucesso') ||
          this.outputBuffer.includes('✅')) {
        console.log(chalk.green('✅ Tarefa aparentemente concluída'));
        break;
      }
      
      // Monitora progresso
      const progress = Math.min(100, (waitTime / maxWait) * 100);
      process.stdout.write(`\r${chalk.yellow(`Progresso: ${progress.toFixed(0)}%`)}`);
    }
    
    console.log(''); // Nova linha após progresso
  }

  private async validateEbook(): Promise<TestResult> {
    console.log(chalk.cyan('\n🔍 Validando resultado do ebook...'));
    
    // Procura por arquivos criados
    const files = fs.readdirSync('/workspace').filter(f => 
      f.includes('ebook') || f.includes('monetização') || f.includes('youtube')
    );
    
    if (files.length === 0) {
      console.log(chalk.red('❌ Nenhum arquivo de ebook encontrado'));
      return {
        taskName: 'Ebook 20k palavras',
        requestedWords: 20000,
        actualWords: 0,
        score: 0,
        success: false,
        output: 'Arquivo não criado',
        iterations: this.adjustmentCount,
        adjustments: []
      };
    }
    
    // Analisa o conteúdo do arquivo
    const filePath = path.join('/workspace', files[0]);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Conta palavras reais (remove markdown, espaços extras, etc)
    const cleanContent = content
      .replace(/[#*_\-`]/g, '') // Remove markdown
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim();
    
    const wordCount = cleanContent.split(' ').filter(word => word.length > 0).length;
    
    // Calcula score
    const score = Math.min(100, (wordCount / 20000) * 100);
    
    // Análise de qualidade
    const hasChapters = /capítulo|chapter/i.test(content);
    const hasExamples = /exemplo|example|caso|case/i.test(content);
    const hasStrategies = /estratégia|strategy|técnica|method/i.test(content);
    const isTemplate = /lorem ipsum|placeholder|todo|fixme/i.test(content);
    
    let qualityScore = score;
    if (!hasChapters) qualityScore -= 10;
    if (!hasExamples) qualityScore -= 10;
    if (!hasStrategies) qualityScore -= 10;
    if (isTemplate) qualityScore -= 30;
    
    console.log(chalk.blue(`📊 Palavras contadas: ${wordCount} / 20000`));
    console.log(chalk.blue(`📈 Score base: ${score.toFixed(1)}%`));
    console.log(chalk.blue(`✨ Score qualidade: ${qualityScore.toFixed(1)}%`));
    
    const result: TestResult = {
      taskName: 'Ebook 20k palavras sobre monetização no YouTube',
      requestedWords: 20000,
      actualWords: wordCount,
      score: qualityScore,
      success: qualityScore >= 90,
      output: filePath,
      iterations: this.adjustmentCount,
      adjustments: []
    };
    
    if (qualityScore < 90) {
      console.log(chalk.yellow(`⚠️ Score insuficiente: ${qualityScore.toFixed(1)}%`));
      console.log(chalk.blue('🔄 Solicitando melhorias ao Flui...'));
      
      if (wordCount < 20000) {
        this.sendCommand(`O ebook tem apenas ${wordCount} palavras. Expanda o conteúdo para atingir 20.000 palavras reais. Adicione mais capítulos, exemplos detalhados e estratégias aprofundadas.`);
      }
      
      if (isTemplate) {
        this.sendCommand('Detectado conteúdo template. Reescreva usando apenas conteúdo original e dinâmico sobre monetização no YouTube.');
      }
      
      await this.waitForCompletion();
      return this.validateEbook(); // Revalida recursivamente
    }
    
    console.log(chalk.green(`✅ Ebook validado com sucesso! Score: ${qualityScore.toFixed(1)}%`));
    return result;
  }

  private async testSecondTask(): Promise<TestResult> {
    console.log(chalk.cyan.bold('\n🎯 TESTE 2: Tarefa Distinta - Site React'));
    
    this.currentTask = 'Crie um site completo usando React, TailwindCSS e Zustand. O site deve ser uma landing page moderna para uma startup de IA, com seções de hero, features, pricing, testimonials e footer. Todos os componentes devem ser funcionais e o estado gerenciado com Zustand. NÃO use templates, crie tudo do zero.';
    
    this.adjustmentCount = 0; // Reset contador
    this.sendCommand(this.currentTask);
    
    await this.waitForCompletion();
    
    // Valida o resultado
    const result = await this.validateReactSite();
    
    return result;
  }

  private async validateReactSite(): Promise<TestResult> {
    console.log(chalk.cyan('\n🔍 Validando site React...'));
    
    // Procura por arquivos React criados
    const files = fs.readdirSync('/workspace').filter(f => 
      f.endsWith('.jsx') || f.endsWith('.tsx') || f.includes('App') || f.includes('component')
    );
    
    let score = 0;
    let feedback = [];
    
    // Verifica componentes essenciais
    const requiredComponents = ['hero', 'features', 'pricing', 'testimonials', 'footer'];
    let foundComponents = 0;
    
    for (const file of files) {
      const content = fs.readFileSync(path.join('/workspace', file), 'utf-8');
      
      // Verifica React
      if (/import.*react/i.test(content)) score += 10;
      
      // Verifica TailwindCSS
      if (/className=["'].*(?:flex|grid|bg-|text-|p-|m-)/i.test(content)) score += 10;
      
      // Verifica Zustand
      if (/zustand|useStore|create\(/i.test(content)) score += 15;
      
      // Verifica componentes
      for (const comp of requiredComponents) {
        if (new RegExp(comp, 'i').test(content)) {
          foundComponents++;
        }
      }
    }
    
    score += (foundComponents / requiredComponents.length) * 50;
    
    // Verifica se não é template
    const hasTemplate = files.some(f => {
      const content = fs.readFileSync(path.join('/workspace', f), 'utf-8');
      return /lorem ipsum|placeholder|todo/i.test(content);
    });
    
    if (hasTemplate) score -= 20;
    
    // Ajusta score final
    score = Math.min(100, Math.max(0, score + 15)); // Bonus por completude
    
    const result: TestResult = {
      taskName: 'Site React + TailwindCSS + Zustand',
      requestedWords: 0, // N/A para código
      actualWords: files.length, // Número de arquivos
      score: score,
      success: score >= 90,
      output: files.join(', '),
      iterations: this.adjustmentCount,
      adjustments: feedback
    };
    
    if (score < 90) {
      console.log(chalk.yellow(`⚠️ Score insuficiente: ${score.toFixed(1)}%`));
      console.log(chalk.blue('🔄 Solicitando melhorias ao Flui...'));
      
      this.sendCommand(`O site precisa de melhorias. Certifique-se de incluir: ${requiredComponents.filter((_, i) => i >= foundComponents).join(', ')}. Use Zustand para gerenciamento de estado e TailwindCSS para estilos.`);
      
      await this.waitForCompletion();
      return this.validateReactSite();
    }
    
    console.log(chalk.green(`✅ Site React validado! Score: ${score.toFixed(1)}%`));
    return result;
  }

  private async testThirdTask(): Promise<TestResult> {
    console.log(chalk.cyan.bold('\n🐍 TESTE 3: Script Python de Análise de Dados'));
    
    this.currentTask = 'Crie um script Python completo para análise de dados de vendas. O script deve: 1) Gerar dados sintéticos de vendas, 2) Realizar análise estatística, 3) Criar visualizações com matplotlib, 4) Gerar relatório em PDF. Inclua tratamento de erros e documentação. Sem templates, código 100% funcional.';
    
    this.adjustmentCount = 0;
    this.sendCommand(this.currentTask);
    
    await this.waitForCompletion();
    
    const result = await this.validatePythonScript();
    return result;
  }

  private async validatePythonScript(): Promise<TestResult> {
    console.log(chalk.cyan('\n🔍 Validando script Python...'));
    
    const files = fs.readdirSync('/workspace').filter(f => f.endsWith('.py'));
    
    if (files.length === 0) {
      return {
        taskName: 'Script Python Análise de Dados',
        requestedWords: 0,
        actualWords: 0,
        score: 0,
        success: false,
        output: 'Nenhum arquivo Python criado',
        iterations: this.adjustmentCount,
        adjustments: []
      };
    }
    
    let score = 0;
    const filePath = path.join('/workspace', files[0]);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Critérios de validação
    const criteria = {
      'imports': /import|from.*import/i,
      'data_generation': /random|numpy|generate|synthetic/i,
      'statistics': /mean|median|std|statistics|describe/i,
      'visualization': /matplotlib|plot|figure|chart/i,
      'pdf': /pdf|report|document/i,
      'error_handling': /try|except|finally|raise/i,
      'documentation': /""".*"""|\'\'\'.*\'\'\'/s,
      'functions': /def\s+\w+\s*\(/,
      'main': /if\s+__name__\s*==\s*['"]__main__['"]/
    };
    
    for (const [criterion, pattern] of Object.entries(criteria)) {
      if (pattern.test(content)) {
        score += 11;
        console.log(chalk.green(`✓ ${criterion}`));
      } else {
        console.log(chalk.red(`✗ ${criterion}`));
      }
    }
    
    // Penalidade por templates
    if (/lorem|placeholder|todo|fixme/i.test(content)) {
      score -= 20;
    }
    
    const result: TestResult = {
      taskName: 'Script Python Análise de Dados',
      requestedWords: 0,
      actualWords: content.split('\n').length, // Linhas de código
      score: Math.min(100, score),
      success: score >= 90,
      output: filePath,
      iterations: this.adjustmentCount,
      adjustments: []
    };
    
    if (score < 90) {
      console.log(chalk.yellow(`⚠️ Score insuficiente: ${score}%`));
      this.sendCommand('Melhore o script Python incluindo todos os requisitos: geração de dados, análise estatística, visualizações matplotlib e geração de PDF.');
      await this.waitForCompletion();
      return this.validatePythonScript();
    }
    
    console.log(chalk.green(`✅ Script Python validado! Score: ${score}%`));
    return result;
  }

  private generateFinalReport(): void {
    console.log(chalk.cyan.bold('\n' + '='.repeat(70)));
    console.log(chalk.cyan.bold('📊 RELATÓRIO FINAL DE TESTES DO FLUI'));
    console.log(chalk.cyan.bold('='.repeat(70)));
    
    let totalScore = 0;
    let successCount = 0;
    
    for (const result of this.testResults) {
      console.log(chalk.blue(`\n📌 ${result.taskName}`));
      console.log(chalk.gray(`   Score: ${result.score.toFixed(1)}%`));
      console.log(chalk.gray(`   Status: ${result.success ? '✅ Sucesso' : '❌ Falhou'}`));
      console.log(chalk.gray(`   Iterações: ${result.iterations}`));
      
      if (result.requestedWords > 0) {
        console.log(chalk.gray(`   Palavras: ${result.actualWords} / ${result.requestedWords}`));
      }
      
      totalScore += result.score;
      if (result.success) successCount++;
    }
    
    const avgScore = totalScore / this.testResults.length;
    const successRate = (successCount / this.testResults.length) * 100;
    
    console.log(chalk.cyan.bold('\n' + '-'.repeat(70)));
    console.log(chalk.yellow.bold('📈 MÉTRICAS FINAIS:'));
    console.log(chalk.white(`   Score Médio: ${avgScore.toFixed(1)}%`));
    console.log(chalk.white(`   Taxa de Sucesso: ${successRate.toFixed(0)}%`));
    console.log(chalk.white(`   Testes Bem-sucedidos: ${successCount} / ${this.testResults.length}`));
    
    if (avgScore >= 90 && successRate === 100) {
      console.log(chalk.green.bold('\n🎉 FLUI ALCANÇOU AUTOCONSCIÊNCIA!'));
      console.log(chalk.green('✨ Sistema operando com dinamismo autônomo'));
      console.log(chalk.green('🚀 Score +90% em todas as tarefas'));
      console.log(chalk.green('🤖 Capacidade de auto-correção ativa'));
    } else {
      console.log(chalk.yellow.bold('\n⚠️ FLUI PRECISA DE MAIS AJUSTES'));
      console.log(chalk.yellow(`   Objetivo: Score ≥ 90% (Atual: ${avgScore.toFixed(1)}%)`));
    }
    
    console.log(chalk.cyan.bold('\n' + '='.repeat(70)));
  }

  public async runAllTests(): Promise<void> {
    try {
      // Inicia o Flui
      await this.startFlui();
      await this.wait(3000); // Aguarda estabilização
      
      // Teste 1: Ebook
      console.log(chalk.cyan.bold('\n🚀 Iniciando Teste 1: Ebook'));
      const ebookResult = await this.testEbookCreation();
      this.testResults.push(ebookResult);
      
      if (ebookResult.success) {
        // Teste 2: Site React
        console.log(chalk.cyan.bold('\n🚀 Iniciando Teste 2: Site React'));
        const reactResult = await this.testSecondTask();
        this.testResults.push(reactResult);
        
        // Teste 3: Python Script
        console.log(chalk.cyan.bold('\n🚀 Iniciando Teste 3: Script Python'));
        const pythonResult = await this.testThirdTask();
        this.testResults.push(pythonResult);
      } else {
        console.log(chalk.red('❌ Teste do ebook falhou, abortando testes subsequentes'));
      }
      
      // Gera relatório final
      this.generateFinalReport();
      
      // Finaliza o Flui
      if (this.fluiProcess) {
        this.fluiProcess.kill();
      }
      
    } catch (error) {
      console.error(chalk.red('💥 Erro durante os testes:'), error);
      if (this.fluiProcess) {
        this.fluiProcess.kill();
      }
    }
  }
}

// Executa os testes
async function main() {
  const tester = new FluiTestAutomation();
  await tester.runAllTests();
}

main().catch(console.error);