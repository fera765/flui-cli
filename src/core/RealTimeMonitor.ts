import chalk from 'chalk';
import * as fs from 'fs/promises';

/**
 * Monitor em Tempo Real para análise contínua do Flui
 */
export class RealTimeMonitor {
  private metrics = {
    requestsProcessed: 0,
    successRate: 100,
    averageWords: 0,
    averageTime: 0,
    dynamicScore: 100,
    errors: []
  };
  
  private startTime: number = 0;
  private currentRequest: any = null;
  
  /**
   * Inicia monitoramento de uma requisição
   */
  startRequest(request: string) {
    this.startTime = Date.now();
    this.currentRequest = {
      request,
      startTime: this.startTime,
      steps: [],
      errors: []
    };
    
    console.log(chalk.cyan('\n' + '='.repeat(70)));
    console.log(chalk.cyan('📊 MONITORAMENTO EM TEMPO REAL INICIADO'));
    console.log(chalk.gray(`⏰ ${new Date().toISOString()}`));
    console.log(chalk.yellow(`📝 Requisição: ${request.substring(0, 100)}...`));
    console.log(chalk.cyan('='.repeat(70)));
  }
  
  /**
   * Registra um passo do processo
   */
  logStep(step: string, data?: any) {
    if (this.currentRequest) {
      this.currentRequest.steps.push({
        time: Date.now() - this.startTime,
        step,
        data
      });
    }
    
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    console.log(chalk.blue(`[${elapsed}s] ${step}`));
    if (data) {
      console.log(chalk.gray('   Data:', JSON.stringify(data).substring(0, 100)));
    }
  }
  
  /**
   * Registra erro
   */
  logError(error: string) {
    if (this.currentRequest) {
      this.currentRequest.errors.push(error);
    }
    this.metrics.errors.push(error);
    
    console.log(chalk.red(`❌ ERRO: ${error}`));
  }
  
  /**
   * Analisa dinamismo
   */
  analyzeDynamism(codeAnalysis: any): number {
    let score = 100;
    
    // Verifica se há palavras-chave estáticas
    if (codeAnalysis.staticKeywords > 0) {
      score -= codeAnalysis.staticKeywords * 5;
      console.log(chalk.yellow(`⚠️ Detectadas ${codeAnalysis.staticKeywords} palavras-chave estáticas`));
    }
    
    // Verifica se usa LLM para decisões
    if (!codeAnalysis.usesLLMForDecisions) {
      score -= 30;
      console.log(chalk.yellow('⚠️ Nem todas as decisões são via LLM'));
    }
    
    // Verifica se tem templates
    if (codeAnalysis.hasTemplates) {
      score -= 20;
      console.log(chalk.yellow('⚠️ Templates detectados'));
    }
    
    this.metrics.dynamicScore = Math.max(0, score);
    return this.metrics.dynamicScore;
  }
  
  /**
   * Finaliza monitoramento e gera relatório
   */
  async finishRequest(result: any) {
    const duration = (Date.now() - this.startTime) / 1000;
    
    this.metrics.requestsProcessed++;
    this.metrics.averageTime = 
      (this.metrics.averageTime * (this.metrics.requestsProcessed - 1) + duration) / 
      this.metrics.requestsProcessed;
    
    if (result.words) {
      this.metrics.averageWords = 
        (this.metrics.averageWords * (this.metrics.requestsProcessed - 1) + result.words) / 
        this.metrics.requestsProcessed;
    }
    
    if (this.currentRequest.errors.length > 0) {
      this.metrics.successRate = 
        ((this.metrics.requestsProcessed - this.currentRequest.errors.length) / 
         this.metrics.requestsProcessed) * 100;
    }
    
    // Gera relatório
    console.log(chalk.cyan('\n' + '='.repeat(70)));
    console.log(chalk.cyan('📊 RELATÓRIO DE MONITORAMENTO'));
    console.log(chalk.cyan('='.repeat(70)));
    
    console.log(chalk.white('\n📈 MÉTRICAS:'));
    console.log(chalk.gray(`   Requisições processadas: ${this.metrics.requestsProcessed}`));
    console.log(chalk.gray(`   Taxa de sucesso: ${this.metrics.successRate.toFixed(1)}%`));
    console.log(chalk.gray(`   Palavras médias: ${Math.round(this.metrics.averageWords).toLocaleString()}`));
    console.log(chalk.gray(`   Tempo médio: ${this.metrics.averageTime.toFixed(1)}s`));
    console.log(chalk.gray(`   Score dinâmico: ${this.metrics.dynamicScore}%`));
    
    console.log(chalk.white('\n⏱️ TIMELINE:'));
    this.currentRequest.steps.forEach(step => {
      console.log(chalk.gray(`   [${step.time}ms] ${step.step}`));
    });
    
    if (this.currentRequest.errors.length > 0) {
      console.log(chalk.red('\n❌ ERROS:'));
      this.currentRequest.errors.forEach(err => {
        console.log(chalk.red(`   • ${err}`));
      });
    }
    
    // Análise de qualidade
    const qualityScore = this.calculateQualityScore(result);
    console.log(chalk.white('\n🎯 QUALIDADE:'));
    console.log(chalk.gray(`   Score geral: ${qualityScore}%`));
    
    if (qualityScore >= 90 && this.metrics.dynamicScore >= 90) {
      console.log(chalk.green.bold('\n✅ SISTEMA 100% DINÂMICO E FUNCIONAL!'));
    } else {
      console.log(chalk.yellow.bold('\n⚠️ AJUSTES NECESSÁRIOS'));
      this.suggestImprovements();
    }
    
    console.log(chalk.cyan('='.repeat(70) + '\n'));
    
    // Salva log
    await this.saveLog();
  }
  
  /**
   * Calcula score de qualidade
   */
  private calculateQualityScore(result: any): number {
    let score = 0;
    
    if (result.words >= result.targetWords * 0.95) score += 30;
    if (result.fileCreated) score += 20;
    if (this.currentRequest.errors.length === 0) score += 20;
    if (this.metrics.dynamicScore >= 90) score += 30;
    
    return score;
  }
  
  /**
   * Sugere melhorias
   */
  private suggestImprovements() {
    console.log(chalk.yellow('\n💡 SUGESTÕES DE MELHORIA:'));
    
    if (this.metrics.dynamicScore < 90) {
      console.log(chalk.gray('   • Remover todas as palavras-chave estáticas'));
      console.log(chalk.gray('   • Usar LLM para todas as decisões'));
      console.log(chalk.gray('   • Eliminar templates hardcoded'));
    }
    
    if (this.metrics.successRate < 100) {
      console.log(chalk.gray('   • Implementar retry automático'));
      console.log(chalk.gray('   • Melhorar tratamento de erros'));
    }
    
    if (this.metrics.averageWords < 15000) {
      console.log(chalk.gray('   • Otimizar geração de conteúdo longo'));
      console.log(chalk.gray('   • Aumentar max_tokens nas requisições'));
    }
  }
  
  /**
   * Salva log de monitoramento
   */
  private async saveLog() {
    const logFile = `monitor-log-${Date.now()}.json`;
    const logData = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      lastRequest: this.currentRequest
    };
    
    await fs.writeFile(logFile, JSON.stringify(logData, null, 2));
    console.log(chalk.gray(`📁 Log salvo: ${logFile}`));
  }
}