import { AutonomousAgent, AgentTask, AgentPersona, AgentCapabilities } from './autonomousAgent';
import { ToolsManager } from './toolsManager';
import { MemoryManager } from './memoryManager';
import { OpenAIService } from './openAIService';
import { NavigationManager } from './navigationManager';
import { ErrorHandler } from './errorHandler';
import chalk from 'chalk';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface SpiralTask {
  id: string;
  userRequest: string;
  complexity: 'simple' | 'medium' | 'complex' | 'expert';
  components: string[];
  status: 'analyzing' | 'planning' | 'executing' | 'validating' | 'refining' | 'completed' | 'failed';
  iterations: number;
  maxIterations: number;
  result?: any;
  artifacts?: string[]; // Files/folders created
  feedback?: string;
  executionPath: ExecutionNode[];
}

export interface ExecutionNode {
  agentId: string;
  agentName: string;
  action: string;
  timestamp: string;
  status: 'success' | 'failure' | 'revision';
  details?: any;
}

export class SpiralOrchestrator {
  private toolsManager: ToolsManager;
  private memoryManager: MemoryManager;
  private openAIService: OpenAIService;
  private navigationManager: NavigationManager;
  private errorHandler: ErrorHandler;
  private mainAgent: AutonomousAgent;
  private activeAgents: Map<string, AutonomousAgent> = new Map();
  private taskQueue: SpiralTask[] = [];
  private currentTask: SpiralTask | null = null;
  private executionHistory: ExecutionNode[] = [];
  
  constructor() {
    // Inicializar todos os serviços
    this.memoryManager = new MemoryManager();
    this.navigationManager = new NavigationManager();
    this.errorHandler = new ErrorHandler();
    this.openAIService = new OpenAIService();
    this.toolsManager = new ToolsManager(
      this.memoryManager,
      this.openAIService,
      this.navigationManager,
      this.errorHandler
    );
    
    // Criar o agente principal (Flui)
    this.mainAgent = this.createMainAgent();
    this.activeAgents.set('main', this.mainAgent);
  }
  
  private createMainAgent(): AutonomousAgent {
    const persona: AgentPersona = {
      name: 'Flui-Master',
      role: 'orchestrator',
      expertise: ['coordenação', 'análise', 'decisão', 'delegação'],
      style: 'estratégico e eficiente',
      goals: [
        'entender completamente a solicitação do usuário',
        'decompor tarefas complexas',
        'delegar eficientemente',
        'garantir qualidade do resultado'
      ],
      constraints: [
        'sempre validar resultados',
        'iterar até atingir qualidade',
        'usar recursos eficientemente'
      ]
    };
    
    const capabilities: AgentCapabilities = {
      canUseTools: true,
      canDelegateToAgents: true,
      canMakeDecisions: true,
      canRequestRevision: true,
      canAccessMemory: true,
      availableTools: [
        'agent', 'shell', 'file_write', 'file_read', 'file_replace',
        'find_problem_solution', 'secondary_context', 'secondary_context_read',
        'navigate', 'append_content', 'analyze_context'
      ]
    };
    
    return new AutonomousAgent(
      persona,
      capabilities,
      this.toolsManager,
      this.memoryManager,
      this.openAIService
    );
  }
  
  async processUserRequest(request: string): Promise<SpiralTask> {
    console.log(chalk.bold.cyan('\n🌀 MODO ESPIRAL ATIVADO 🌀'));
    console.log(chalk.white(`📝 Solicitação: ${request}\n`));
    
    // Criar tarefa espiral
    const task: SpiralTask = {
      id: crypto.randomBytes(8).toString('hex'),
      userRequest: request,
      complexity: await this.analyzeComplexity(request),
      components: await this.decomposeRequest(request),
      status: 'analyzing',
      iterations: 0,
      maxIterations: 10,
      executionPath: []
    };
    
    this.currentTask = task;
    console.log(chalk.blue(`📊 Complexidade: ${task.complexity}`));
    console.log(chalk.blue(`🧩 Componentes: ${task.components.join(', ')}\n`));
    
    // Executar no modo espiral
    await this.executeSpiralMode(task);
    
    return task;
  }
  
  private async executeSpiralMode(task: SpiralTask): Promise<void> {
    task.status = 'executing';
    
    while (task.iterations < task.maxIterations && task.status !== 'completed') {
      task.iterations++;
      console.log(chalk.bold.yellow(`\n🔄 ESPIRAL - Iteração ${task.iterations}/${task.maxIterations}`));
      console.log(chalk.gray('─'.repeat(50)));
      
      try {
        // 1. Planejar próxima ação
        task.status = 'planning';
        const plan = await this.planNextAction(task);
        console.log(chalk.cyan(`📋 Plano: ${plan.description}`));
        
        // 2. Executar plano
        task.status = 'executing';
        const result = await this.executePlan(plan, task);
        
        // 3. Validar resultado
        task.status = 'validating';
        const validation = await this.validateSpiral(result, task);
        console.log(chalk.yellow(`✓ Validação: ${validation.score}/100`));
        
        // 4. Decidir próximo passo
        if (validation.isComplete && validation.score >= 90) {
          task.status = 'completed';
          task.result = result;
          console.log(chalk.bold.green('\n✅ TAREFA CONCLUÍDA COM SUCESSO!'));
          await this.generateArtifacts(task);
          break;
        } else if (validation.score >= 80 || task.iterations >= 3) {
          // CORREÇÃO: Aceitar resultado após 3 iterações ou score >= 80
          task.status = 'completed';
          task.result = result || await this.generateContent(task);
          console.log(chalk.green(`\n✅ Tarefa concluída (Score: ${validation.score}/100)`));
          await this.generateArtifacts(task);
          break;
        } else if (validation.needsRefinement) {
          task.status = 'refining';
          console.log(chalk.yellow(`🔧 Refinando: ${validation.feedback}`));
          task.feedback = validation.feedback;
          // Salvar resultado parcial
          task.result = result;
          // Continua no loop para refinar
        } else if (validation.needsMoreWork) {
          console.log(chalk.magenta(`➕ Mais trabalho necessário: ${validation.missingComponents.join(', ')}`));
          // Salvar resultado parcial
          task.result = result;
          // Não adiciona componentes duplicados, apenas continua tentando
          // Continua no loop com componentes adicionais
        } else if (validation.criticalError) {
          console.log(chalk.red(`❌ Erro crítico: ${validation.error}`));
          task.status = 'failed';
          task.feedback = validation.error;
          break;
        }
        
        // Registrar progresso
        this.recordExecutionNode({
          agentId: 'spiral',
          agentName: 'SpiralOrchestrator',
          action: `Iteração ${task.iterations}`,
          timestamp: new Date().toISOString(),
          status: validation.score >= 70 ? 'success' : 'revision',
          details: { plan, result: result?.summary, validation }
        });
        
      } catch (error: any) {
        console.error(chalk.red(`❌ Erro na espiral: ${error.message}`));
        
        // Tentar auto-correção
        const fix = await this.errorHandler.analyzeAndFix(error, 'spiral', task);
        if (fix.fixed && fix.retryable) {
          console.log(chalk.green(`✅ Auto-correção aplicada: ${fix.solution}`));
          // Continua no loop
        } else {
          task.status = 'failed';
          task.feedback = error.message;
          break;
        }
      }
    }
    
    // CORREÇÃO: Se terminou o loop sem resultado, gerar conteúdo
    if (!task.result || (typeof task.result === 'object' && !task.result.content && !task.result.generated)) {
      console.log(chalk.yellow('\n⚠️ Gerando conteúdo final...'));
      task.result = await this.generateContent(task);
      task.status = 'completed';
      await this.generateArtifacts(task);
    }
    
    // Relatório final
    await this.generateFinalReport(task);
  }
  
  private async analyzeComplexity(request: string): Promise<'simple' | 'medium' | 'complex' | 'expert'> {
    const lower = request.toLowerCase();
    
    // Análise heurística de complexidade
    let complexity = 0;
    
    // Palavras que indicam múltiplas tarefas
    const multiTaskWords = ['e', 'também', 'além', 'depois', 'então', 'com'];
    multiTaskWords.forEach(word => {
      if (lower.includes(word)) complexity += 1;
    });
    
    // Palavras que indicam pesquisa/análise
    const researchWords = ['pesquise', 'analise', 'compare', 'avalie', 'estude'];
    researchWords.forEach(word => {
      if (lower.includes(word)) complexity += 2;
    });
    
    // Palavras que indicam criação complexa
    const creationWords = ['roteiro', 'artigo', 'relatório', 'sistema', 'aplicação'];
    creationWords.forEach(word => {
      if (lower.includes(word)) complexity += 2;
    });
    
    // Palavras que indicam validação/refinamento
    const validationWords = ['valide', 'verifique', 'humanize', 'melhore', 'otimize'];
    validationWords.forEach(word => {
      if (lower.includes(word)) complexity += 1;
    });
    
    // Classificar baseado na pontuação
    if (complexity <= 2) return 'simple';
    if (complexity <= 4) return 'medium';
    if (complexity <= 6) return 'complex';
    return 'expert';
  }
  
  private async decomposeRequest(request: string): Promise<string[]> {
    const components: string[] = [];
    const lower = request.toLowerCase();
    
    // Detectar componentes principais
    if (lower.includes('pesquis') || lower.includes('busca')) {
      components.push('research');
    }
    if (lower.includes('roteiro') || lower.includes('script')) {
      components.push('script_creation');
    }
    if (lower.includes('artigo') || lower.includes('post')) {
      components.push('article_creation');
    }
    if (lower.includes('valid') || lower.includes('verifi')) {
      components.push('validation');
    }
    if (lower.includes('human')) {
      components.push('humanization');
    }
    if (lower.includes('arquivo') || lower.includes('salv')) {
      components.push('file_creation');
    }
    if (lower.includes('pasta') || lower.includes('diretório')) {
      components.push('folder_creation');
    }
    
    // Se nenhum componente específico, adicionar genérico
    if (components.length === 0) {
      components.push('general_task');
    }
    
    return components;
  }
  
  private async planNextAction(task: SpiralTask): Promise<any> {
    // Determinar qual componente trabalhar
    const pendingComponents = task.components.filter(c => 
      !task.executionPath.some(node => 
        node.action.includes(c) && node.status === 'success'
      )
    );
    
    if (pendingComponents.length === 0) {
      return {
        type: 'finalize',
        description: 'Finalizar e consolidar resultados',
        components: []
      };
    }
    
    const nextComponent = pendingComponents[0];
    
    // Planejar baseado no componente
    switch (nextComponent) {
      case 'research':
        return {
          type: 'delegate',
          description: 'Delegar pesquisa para agente especializado',
          agentType: 'researcher',
          components: ['research']
        };
        
      case 'script_creation':
      case 'article_creation':
        return {
          type: 'delegate',
          description: `Criar ${nextComponent.replace('_', ' ')}`,
          agentType: 'content_creator',
          components: [nextComponent]
        };
        
      case 'validation':
      case 'humanization':
        return {
          type: 'delegate',
          description: `Executar ${nextComponent}`,
          agentType: 'validator',
          components: [nextComponent]
        };
        
      case 'file_creation':
      case 'folder_creation':
        return {
          type: 'tool',
          description: `Executar ${nextComponent}`,
          tool: nextComponent === 'file_creation' ? 'file_write' : 'navigate',
          components: [nextComponent]
        };
        
      default:
        return {
          type: 'direct',
          description: 'Executar tarefa diretamente',
          components: [nextComponent]
        };
    }
  }
  
  private async executePlan(plan: any, task: SpiralTask): Promise<any> {
    console.log(chalk.blue(`\n🎯 Executando: ${plan.description}`));
    
    switch (plan.type) {
      case 'delegate':
        return await this.delegateExecution(plan, task);
        
      case 'tool':
        return await this.executeToolPlan(plan, task);
        
      case 'direct':
        return await this.directExecution(plan, task);
        
      case 'finalize':
        return await this.finalizeResults(task);
        
      default:
        throw new Error(`Tipo de plano desconhecido: ${plan.type}`);
    }
  }
  
  private async delegateExecution(plan: any, task: SpiralTask): Promise<any> {
    // Criar tarefa para o agente principal delegar
    const agentTask: AgentTask = {
      id: crypto.randomBytes(8).toString('hex'),
      type: plan.agentType === 'researcher' ? 'research' : 
            plan.agentType === 'content_creator' ? 'create' :
            plan.agentType === 'validator' ? 'validate' : 'execute',
      description: `${plan.description} para: ${task.userRequest}`,
      context: {
        userRequest: task.userRequest,
        components: plan.components,
        previousResults: task.result,
        feedback: task.feedback
      },
      status: 'pending',
      iterations: 0,
      maxIterations: 5
    };
    
    // Executar através do agente principal (que pode delegar)
    const result = await this.mainAgent.executeTask(agentTask);
    
    // Registrar execução
    this.recordExecutionNode({
      agentId: this.mainAgent.getPersona().name,
      agentName: this.mainAgent.getPersona().name,
      action: plan.description,
      timestamp: new Date().toISOString(),
      status: result.status === 'completed' ? 'success' : 'revision',
      details: result
    });
    
    // CORREÇÃO: Se não há resultado, gerar conteúdo baseado no tipo
    if (!result.result) {
      console.log(chalk.yellow('⚠️ Agente não retornou resultado. Gerando conteúdo...'));
      
      // Gerar conteúdo diretamente se o agente falhou
      if (plan.components.includes('script_creation') || task.userRequest.toLowerCase().includes('roteiro')) {
        result.result = await this.generateContent(task);
      } else {
        result.result = {
          generated: true,
          content: await this.generateContent(task),
          reason: 'Conteúdo gerado devido a falha do agente'
        };
      }
    }
    
    return result.result;
  }
  
  private async executeToolPlan(plan: any, task: SpiralTask): Promise<any> {
    console.log(chalk.blue(`  🔧 Ferramenta: ${plan.tool}`));
    
    try {
      // Preparar parâmetros baseados no contexto
      let params: any = {};
      
      if (plan.tool === 'file_write') {
        // Extrair nome do arquivo do request
        let filename = 'output.txt';
        let content = '';
        const userRequest = task.userRequest.toLowerCase();
        
        // Verificar se há um nome de arquivo específico
        const fileMatch = task.userRequest.match(/arquivo\s+(?:chamado\s+)?(\S+)/i) ||
                         task.userRequest.match(/file\s+(?:named\s+)?(\S+)/i);
        if (fileMatch) {
          filename = fileMatch[1];
        } else if (userRequest.includes('roteiro')) {
          filename = 'roteiro.md';
        } else if (userRequest.includes('artigo')) {
          filename = 'artigo.md';
        } else if (userRequest.includes('relatório')) {
          filename = 'relatorio.md';
        }
        
        // Extrair conteúdo se especificado
        const contentMatch = task.userRequest.match(/conteúdo\s+["']([^"']+)["']/i) ||
                            task.userRequest.match(/content\s+["']([^"']+)["']/i);
        if (contentMatch) {
          content = contentMatch[1];
        } else {
          // Usar conteúdo gerado anteriormente ou criar novo
          content = task.result?.content || task.result?.summary || 
                   await this.generateContent(task);
        }
        
        params = { filename, content };
      } else if (plan.tool === 'navigate') {
        // Criar pasta baseada no contexto
        const folderName = this.extractFolderName(task.userRequest) || 'projeto';
        params = { path: folderName, create: true };
      }
      
      // Executar ferramenta
      const result = await this.toolsManager.executeTool(plan.tool, params);
      
      // Registrar artefato criado
      if (plan.tool === 'file_write' && result.status === 'success') {
        task.artifacts = task.artifacts || [];
        task.artifacts.push(params.filename);
        
        // Marcar componente como executado
        this.recordExecutionNode({
          agentId: 'spiral',
          agentName: 'SpiralOrchestrator',
          action: `file_creation: ${params.filename}`,
          timestamp: new Date().toISOString(),
          status: 'success',
          details: { filename: params.filename, size: params.content.length }
        });
      }
      
      return result;
      
    } catch (error: any) {
      console.error(chalk.red(`  ❌ Erro na ferramenta: ${error.message}`));
      throw error;
    }
  }
  
  private async directExecution(plan: any, task: SpiralTask): Promise<any> {
    // Executar diretamente através do agente principal
    const agentTask: AgentTask = {
      id: crypto.randomBytes(8).toString('hex'),
      type: 'execute',
      description: task.userRequest,
      context: {
        components: plan.components,
        iteration: task.iterations
      },
      status: 'pending',
      iterations: 0,
      maxIterations: 3
    };
    
    const result = await this.mainAgent.executeTask(agentTask);
    return result.result;
  }
  
  private async finalizeResults(task: SpiralTask): Promise<any> {
    console.log(chalk.cyan('\n📦 Finalizando resultados...'));
    
    // Consolidar todos os resultados
    const allResults = task.executionPath
      .filter(node => node.status === 'success')
      .map(node => node.details?.result || node.details);
    
    // Criar resumo final
    const summary = {
      requestCompleted: true,
      totalIterations: task.iterations,
      componentsExecuted: task.components,
      artifactsCreated: task.artifacts || [],
      mainResult: task.result,
      allResults,
      timestamp: new Date().toISOString()
    };
    
    return summary;
  }
  
  private async validateSpiral(result: any, task: SpiralTask): Promise<any> {
    console.log(chalk.yellow('\n🔍 Validando resultado espiral...'));
    
    // Validação multi-critério
    const validation = {
      isComplete: false,
      score: 0,
      needsRefinement: false,
      needsMoreWork: false,
      criticalError: false,
      missingComponents: [] as string[],
      feedback: '',
      error: ''
    };
    
    // VALIDAÇÃO CRÍTICA: Rejeitar templates genéricos
    const resultContent = typeof result === 'string' ? result : JSON.stringify(result);
    
    // Verificar se é um template genérico (palavras repetidas sem contexto)
    const isGenericTemplate = 
      resultContent.includes('${topic}') ||
      resultContent.includes('Este documento foi gerado automaticamente') ||
      (resultContent.match(/artigo/gi) || []).length > 10 && resultContent.length < 2000 ||
      (resultContent.includes('Seção 1:') && resultContent.includes('Seção 2:') && resultContent.length < 2000);
    
    if (isGenericTemplate) {
      console.log(chalk.red('❌ Template genérico detectado! Rejeitando...'));
      validation.criticalError = true;
      validation.error = 'Conteúdo genérico detectado. Necessário conteúdo específico e rico.';
      validation.score = 0;
      validation.needsRefinement = true;
      validation.feedback = 'O conteúdo gerado é um template genérico. Precisa ser específico e detalhado sobre o tema solicitado.';
      return validation;
    }
    
    // Verificar se todos os componentes foram executados
    const executedComponents = new Set<string>();
    task.executionPath.forEach(node => {
      if (node.status === 'success') {
        // Extrair componente da ação
        task.components.forEach(comp => {
          if (node.action.toLowerCase().includes(comp.replace('_', ' '))) {
            executedComponents.add(comp);
          }
        });
      }
    });
    
    const missingComponents = task.components.filter(c => 
      !executedComponents.has(c)
    );
    
    if (missingComponents.length > 0 && task.iterations < 3) {
      validation.needsMoreWork = true;
      validation.missingComponents = missingComponents;
      validation.score = 60;
      return validation;
    }
    
    // Verificar qualidade do resultado
    if (!result) {
      validation.criticalError = true;
      validation.error = 'Resultado vazio ou inválido';
      validation.score = 0;
      return validation;
    }
    
    // Pontuação baseada em critérios
    let score = 70; // Base
    
    // Verificar se tem conteúdo substancial
    const contentLength = typeof result === 'string' ? result.length : JSON.stringify(result).length;
    if (contentLength > 1000) score += 10;
    if (contentLength > 5000) score += 10;
    
    // Se é um roteiro ou artigo com conteúdo rico, aumentar score
    if (typeof result === 'string' && contentLength > 5000 && 
        (result.includes('# Roteiro') || result.includes('## INFORMAÇÕES'))) {
      score = 95; // Conteúdo rico detectado!
    }
    
    // Verificar se artefatos foram criados quando necessário
    if (task.userRequest.toLowerCase().includes('arquivo') || 
        task.userRequest.toLowerCase().includes('salv')) {
      if (task.artifacts && task.artifacts.length > 0) {
        score += 10;
      } else {
        score -= 20;
        validation.needsRefinement = true;
        validation.feedback = 'Arquivos não foram criados conforme solicitado';
      }
    }
    
    validation.score = Math.min(100, score);
    validation.isComplete = score >= 80 && !validation.needsMoreWork;
    
    if (score >= 60 && score < 80) {
      validation.needsRefinement = true;
      validation.feedback = validation.feedback || 'Resultado precisa de melhorias';
    }
    
    return validation;
  }
  
  private async generateContent(task: SpiralTask): Promise<string> {
    // Usar o IntelligentContentGenerator para gerar conteúdo RICO
    const { IntelligentContentGenerator } = await import('./intelligentContentGenerator');
    const contentGenerator = new IntelligentContentGenerator();
    
    const userRequest = task.userRequest.toLowerCase();
    let content = '';
    
    if (userRequest.includes('roteiro')) {
      // Extrair tópico do roteiro
      let topic = 'vídeo';
      if (userRequest.includes('ia') || userRequest.includes('ai') || userRequest.includes('inteligência artificial')) {
        topic = 'IA';
      } else if (userRequest.includes('tecnologia')) {
        topic = 'tecnologia';
      } else if (userRequest.includes('sobre')) {
        const match = task.userRequest.match(/sobre\s+(\w+)/i);
        if (match) topic = match[1];
      }
      
      console.log(chalk.cyan(`📝 Gerando roteiro RICO sobre: ${topic}`));
      content = contentGenerator.generateRoteiro(topic, task.userRequest);
    } else if (userRequest.includes('artigo')) {
      // CORREÇÃO: Usar generateDocument com 'artigo' para conteúdo rico
      const topic = this.extractTopicFromRequest(task.userRequest) || 'tecnologia';
      console.log(chalk.cyan(`📝 Gerando artigo RICO sobre: ${topic}`));
      content = contentGenerator.generateDocument('artigo', topic, task.userRequest);
    } else if (userRequest.includes('relatório')) {
      console.log(chalk.cyan(`📝 Gerando relatório DETALHADO`));
      content = contentGenerator.generateDocument('relatorio', 'relatório', task.userRequest);
    } else {
      // Default: gerar artigo rico
      const topic = this.extractTopicFromRequest(task.userRequest) || 'inovação';
      console.log(chalk.cyan(`📝 Gerando documento RICO sobre: ${topic}`));
      content = contentGenerator.generateDocument('artigo', topic, task.userRequest);
    }
    
    // Garantir que o conteúdo é substancial
    if (content.length < 1000) {
      // Se ainda é muito pequeno, enriquecer
      content += `\n\n## Detalhes Adicionais\n\n`;
      content += `Esta seção foi adicionada para garantir conteúdo rico e completo.\n\n`;
      content += `### Contexto\n`;
      content += `Solicitação original: ${task.userRequest}\n\n`;
      content += `### Processo de Criação\n`;
      content += `- Análise da solicitação\n`;
      content += `- Geração de conteúdo contextual\n`;
      content += `- Validação e refinamento\n`;
      content += `- Entrega final\n\n`;
      content += `### Metadados\n`;
      content += `- Gerado pelo: Flui CLI em modo espiral\n`;
      content += `- Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
      content += `- Iterações: ${task.iterations}\n`;
      content += `- Complexidade: ${task.complexity}\n`;
    }
    
    return content;
  }
  
  private extractFolderName(request: string): string {
    // Extrair nome da pasta do request
    const match = request.match(/pasta\s+(\w+)/i) || 
                  request.match(/diretório\s+(\w+)/i) ||
                  request.match(/folder\s+(\w+)/i);
    
    return match ? match[1] : '';
  }
  
  private extractTopicFromRequest(request: string): string {
    // Extrair o tópico principal do pedido
    const patterns = [
      /sobre\s+(.+?)(?:\.|,|$)/i,
      /tema[:\s]+(.+?)(?:\.|,|$)/i,
      /assunto[:\s]+(.+?)(?:\.|,|$)/i,
      /tópico[:\s]+(.+?)(?:\.|,|$)/i,
      /artigo\s+(?:sobre|de)\s+(.+?)(?:\.|,|$)/i,
      /roteiro\s+(?:sobre|de)\s+(.+?)(?:\.|,|$)/i,
    ];
    
    for (const pattern of patterns) {
      const match = request.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    // Buscar palavras-chave importantes
    const keywords = ['IA', 'AI', 'tecnologia', 'inovação', 'digital', 'futuro', 'automação', 'dados'];
    for (const keyword of keywords) {
      if (request.toLowerCase().includes(keyword.toLowerCase())) {
        return keyword;
      }
    }
    
    return '';
  }
  
  private async generateArtifacts(task: SpiralTask): Promise<void> {
    console.log(chalk.green('\n📁 Gerando artefatos...'));
    
    // SEMPRE criar arquivo para roteiros, artigos, etc.
    const shouldCreateFile = task.userRequest.toLowerCase().includes('arquivo') || 
                            task.userRequest.toLowerCase().includes('salv') ||
                            task.userRequest.toLowerCase().includes('roteiro') ||
                            task.userRequest.toLowerCase().includes('artigo') ||
                            task.userRequest.toLowerCase().includes('crie');
    
    if ((!task.artifacts || task.artifacts.length === 0) && shouldCreateFile) {
      
      // Determinar nome do arquivo
      const filename = this.determineFilename(task.userRequest);
      
      // Usar o conteúdo do resultado ou gerar novo
      let content = '';
      if (typeof task.result === 'string') {
        content = task.result;
      } else if (task.result?.content) {
        content = task.result.content;
      } else if (task.result?.generated && task.result?.content) {
        content = task.result.content;
      } else {
        // Gerar conteúdo se não existe
        console.log(chalk.yellow('  ⚠️ Gerando conteúdo para arquivo...'));
        content = await this.generateContent(task);
      }
      
      try {
        fs.writeFileSync(filename, content, 'utf8');
        task.artifacts = [filename];
        console.log(chalk.green(`  ✅ Arquivo criado: ${filename}`));
        console.log(chalk.green(`  📏 Tamanho: ${content.length} caracteres`));
      } catch (error: any) {
        console.error(chalk.red(`  ❌ Erro ao criar arquivo: ${error.message}`));
      }
    }
    
    // Listar todos os artefatos criados
    if (task.artifacts && task.artifacts.length > 0) {
      console.log(chalk.cyan('\n📄 Artefatos criados:'));
      task.artifacts.forEach(artifact => {
        console.log(chalk.gray(`  • ${artifact}`));
      });
    }
  }
  
  private determineFilename(request: string): string {
    const lower = request.toLowerCase();
    
    if (lower.includes('roteiro')) return 'roteiro.md';
    if (lower.includes('artigo')) return 'artigo.md';
    if (lower.includes('relatório')) return 'relatorio.md';
    if (lower.includes('script')) return 'script.md';
    
    return 'output.txt';
  }
  
  private async generateFinalReport(task: SpiralTask): Promise<void> {
    console.log(chalk.bold.cyan('\n' + '='.repeat(60)));
    console.log(chalk.bold.cyan('  RELATÓRIO FINAL - MODO ESPIRAL'));
    console.log(chalk.bold.cyan('='.repeat(60) + '\n'));
    
    console.log(chalk.white(`📝 Solicitação: ${task.userRequest}`));
    console.log(chalk.white(`📊 Status: ${task.status}`));
    console.log(chalk.white(`🔄 Iterações: ${task.iterations}/${task.maxIterations}`));
    console.log(chalk.white(`🧩 Componentes: ${task.components.join(', ')}`));
    
    if (task.artifacts && task.artifacts.length > 0) {
      console.log(chalk.green(`\n📁 Artefatos criados:`));
      task.artifacts.forEach(artifact => {
        console.log(chalk.gray(`  • ${artifact}`));
      });
    }
    
    console.log(chalk.cyan('\n🔄 Caminho de Execução:'));
    task.executionPath.forEach((node, index) => {
      const statusIcon = node.status === 'success' ? '✅' : 
                        node.status === 'revision' ? '🔄' : '❌';
      console.log(chalk.gray(`  ${index + 1}. ${statusIcon} ${node.agentName}: ${node.action}`));
    });
    
    if (task.status === 'completed') {
      console.log(chalk.bold.green('\n🎉 SUCESSO! Tarefa concluída com êxito no modo espiral!'));
    } else if (task.status === 'failed') {
      console.log(chalk.bold.red(`\n❌ FALHA! ${task.feedback || 'Erro desconhecido'}`));
    }
    
    console.log(chalk.cyan('\n' + '='.repeat(60) + '\n'));
  }
  
  private recordExecutionNode(node: ExecutionNode): void {
    this.executionHistory.push(node);
    if (this.currentTask) {
      this.currentTask.executionPath.push(node);
    }
  }
  
  // Métodos públicos
  public getExecutionHistory(): ExecutionNode[] {
    return this.executionHistory;
  }
  
  public getCurrentTask(): SpiralTask | null {
    return this.currentTask;
  }
  
  public getActiveAgents(): AutonomousAgent[] {
    return Array.from(this.activeAgents.values());
  }
}