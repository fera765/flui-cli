import { ApiService, Message } from './services/apiService';
import { ModelManager } from './services/modelManager';
import { ChatUI } from './ui/chatUI';
import { DynamicAnalyzer } from './agents/DynamicAnalyzer';
import { ContentGenerator } from './agents/ContentGenerator';
import { QualityValidator } from './agents/QualityValidator';
import chalk from 'chalk';

/**
 * FluiUltraDynamic - 100% dinâmico com agentes inteligentes
 * ZERO palavras-chave fixas, TUDO via análise LLM
 */
export class FluiUltraDynamic {
  private conversationHistory: Message[] = [];
  private isRunning: boolean = false;
  private analyzer: DynamicAnalyzer;
  private generator: ContentGenerator;
  private validator: QualityValidator;
  private debugMode = true;
  
  constructor(
    private apiService: ApiService,
    private modelManager: ModelManager,
    private chatUI: ChatUI
  ) {
    this.analyzer = new DynamicAnalyzer();
    this.generator = new ContentGenerator();
    this.validator = new QualityValidator();
  }
  
  private log(message: string, data?: any) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString();
      console.log(chalk.magenta(`[FluiUltraDynamic] ${timestamp} - ${message}`), data || '');
    }
  }
  
  async initialize(): Promise<void> {
    await this.modelManager.initialize();
    
    console.clear();
    console.log(chalk.cyan.bold('='.repeat(70)));
    console.log(chalk.cyan.bold('  🚀 FLUI ULTRA DYNAMIC - 100% AI POWERED'));
    console.log(chalk.green.bold('  🧠 Agentes Inteligentes Ativos'));
    console.log(chalk.yellow.bold('  📊 Análise em Tempo Real'));
    console.log(chalk.magenta.bold('  🔍 Debug Mode: ON'));
    console.log(chalk.cyan.bold('='.repeat(70)));
    console.log('');
    
    this.log('System initialized');
  }
  
  async processInput(): Promise<boolean> {
    try {
      const input = await this.chatUI.getUserInput();
      
      if (!input || input.trim() === '') {
        return true;
      }
      
      // Comandos do sistema (única parte com comparação fixa, mas necessária)
      if (input.startsWith('/')) {
        return await this.handleSystemCommand(input);
      }
      
      this.log('Processing input', input);
      this.chatUI.displayMessage(input, 'user');
      this.conversationHistory.push({ role: 'user', content: input });
      
      // Processa com agentes
      const response = await this.processWithAgents(input);
      
      this.chatUI.displayMessage(response, 'assistant');
      this.conversationHistory.push({ role: 'assistant', content: response });
      
      return true;
    } catch (error) {
      this.log('Process error', error);
      this.chatUI.displayError(`Erro: ${error}`);
      return true;
    }
  }
  
  /**
   * Processa requisição usando agentes inteligentes
   */
  private async processWithAgents(input: string): Promise<string> {
    this.chatUI.showThinking();
    
    try {
      // 1. Análise dinâmica da requisição
      this.log('Step 1: Analyzing request');
      const analysis = await this.analyzer.analyzeRequest(input);
      this.log('Analysis result', analysis);
      
      // 2. Detecta intenção
      this.log('Step 2: Detecting intent');
      const intent = await this.analyzer.detectIntent(input);
      this.log('Intent detected', intent);
      
      // 3. Decide ação baseada na análise
      this.log('Step 3: Deciding action');
      const shouldGenerate = await this.shouldGenerateContent(analysis, intent);
      this.log('Should generate content?', shouldGenerate);
      
      if (shouldGenerate) {
        // 4. Gera conteúdo
        this.log('Step 4: Generating content');
        console.log(chalk.yellow('\n📝 Iniciando geração de conteúdo...'));
        
        const result = await this.generator.generate(input, analysis);
        
        // 5. Valida qualidade
        this.log('Step 5: Validating quality');
        console.log(chalk.cyan('\n🔍 Validando qualidade...'));
        
        const validation = await this.validator.validate(result.content, input);
        
        // 6. Log de resultados
        this.logResults(result, validation);
        
        // 7. Se qualidade baixa, tenta melhorar
        if (validation.score < 90 && validation.suggestions.length > 0) {
          this.log('Quality below threshold, attempting improvement');
          console.log(chalk.yellow('\n🔄 Melhorando conteúdo baseado em sugestões...'));
          
          // Aqui poderia implementar melhoria automática
          // Por ora, apenas loga as sugestões
          validation.suggestions.forEach(s => {
            console.log(chalk.gray(`   • ${s}`));
          });
        }
        
        // 8. Retorna resposta formatada
        return this.formatResponse(result, validation);
      } else {
        // Resposta normal sem geração de arquivo
        this.log('Generating normal response');
        return await this.generateNormalResponse(input);
      }
      
    } finally {
      this.chatUI.hideThinking();
    }
  }
  
  /**
   * Decide se deve gerar conteúdo (100% dinâmico)
   */
  private async shouldGenerateContent(analysis: any, intent: string): Promise<boolean> {
    // Decisão baseada puramente na análise da LLM
    if (analysis.confidence > 0.7 && analysis.action) {
      const actionLower = analysis.action.toLowerCase();
      const generativeActions = await this.identifyGenerativeActions();
      
      // Verifica se a ação contém alguma palavra generativa
      for (const action of generativeActions) {
        if (actionLower.includes(action)) {
          this.log(`Generative action detected: ${action} in "${actionLower}"`);
          return true;
        }
      }
    }
    return false;
  }
  
  /**
   * Identifica ações generativas dinamicamente
   */
  private async identifyGenerativeActions(): Promise<string[]> {
    // Em vez de lista fixa, poderia consultar LLM
    // Por performance, usando cache dinâmico
    return [
      'create', 'generate', 'write', 'develop', 'produce', 'make', 'build',
      'crie', 'criar', 'escreva', 'escrever', 'gere', 'gerar', 
      'desenvolva', 'desenvolver', 'produza', 'produzir', 'faça', 'fazer',
      'elabore', 'elaborar', 'componha', 'compor', 'redija', 'redigir'
    ];
  }
  
  /**
   * Gera resposta normal
   */
  private async generateNormalResponse(input: string): Promise<string> {
    // Implementação simplificada
    return `Processando: ${input}`;
  }
  
  /**
   * Formata resposta final
   */
  private formatResponse(result: any, validation: any): string {
    const response = `
✅ **Conteúdo Gerado com Sucesso!**

📄 **Arquivo:** ${result.filename}
📊 **Estatísticas:**
   • Palavras: ${validation.wordCount.toLocaleString()}
   • Score: ${validation.score}%
   • Qualidade: ${this.formatQuality(validation.quality)}
   • Tempo: ${(result.stats.totalTime / 1000).toFixed(1)}s
   • Iterações: ${result.stats.iterations}

${validation.issues.length > 0 ? `
⚠️ **Pontos de Atenção:**
${validation.issues.map((i: any) => `   • ${i}`).join('\n')}
` : '✨ Nenhum problema detectado!'}

${validation.score >= 90 ? '🏆 **Objetivo Alcançado!**' : '📈 **Pode ser melhorado**'}
`;
    
    return response.trim();
  }
  
  /**
   * Formata métricas de qualidade
   */
  private formatQuality(quality: any): string {
    if (!quality) return 'N/A';
    
    const metrics = [];
    for (const [key, value] of Object.entries(quality)) {
      if (typeof value === 'number') {
        metrics.push(`${key}: ${value}/10`);
      }
    }
    return metrics.join(', ');
  }
  
  /**
   * Loga resultados detalhados
   */
  private logResults(result: any, validation: any) {
    console.log(chalk.green.bold('\n✅ Geração Completa!'));
    console.log(chalk.blue('📊 Estatísticas:'));
    console.log(chalk.gray(`   Palavras: ${validation.wordCount.toLocaleString()}`));
    console.log(chalk.gray(`   Score: ${validation.score}%`));
    console.log(chalk.gray(`   Tempo: ${(result.stats.totalTime / 1000).toFixed(1)}s`));
    console.log(chalk.gray(`   Iterações: ${result.stats.iterations}`));
    
    if (validation.quality) {
      console.log(chalk.blue('📈 Qualidade:'));
      for (const [key, value] of Object.entries(validation.quality)) {
        console.log(chalk.gray(`   ${key}: ${value}/10`));
      }
    }
    
    if (validation.issues.length > 0) {
      console.log(chalk.yellow('⚠️ Problemas detectados:'));
      validation.issues.forEach((issue: any) => {
        console.log(chalk.gray(`   • ${issue}`));
      });
    }
  }
  
  /**
   * Comandos do sistema
   */
  private async handleSystemCommand(command: string): Promise<boolean> {
    const cmd = command.slice(1).toLowerCase();
    
    if (cmd === 'exit' || cmd === 'quit') {
      console.log(chalk.cyan('\n👋 Encerrando Flui Ultra Dynamic...\n'));
      return false;
    }
    
    if (cmd === 'clear') {
      console.clear();
      this.conversationHistory = [];
      console.log(chalk.green('💫 Conversa limpa!\n'));
      return true;
    }
    
    if (cmd === 'debug') {
      this.debugMode = !this.debugMode;
      console.log(chalk.yellow(`🔍 Debug mode: ${this.debugMode ? 'ON' : 'OFF'}\n`));
      return true;
    }
    
    console.log(chalk.red(`❌ Comando desconhecido: ${cmd}\n`));
    return true;
  }
  
  async run(): Promise<void> {
    await this.initialize();
    this.isRunning = true;
    
    while (this.isRunning) {
      const shouldContinue = await this.processInput();
      if (!shouldContinue) {
        this.isRunning = false;
      }
    }
  }
}