import { ToolsManager } from './toolsManager';
import { MemoryManager } from './memoryManager';
import { OpenAIService } from './openAIService';
import chalk from 'chalk';
import * as crypto from 'crypto';

export interface AgentTask {
  id: string;
  type: 'research' | 'create' | 'validate' | 'refine' | 'execute';
  description: string;
  context?: any;
  parentAgentId?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'needs_revision' | 'failed';
  result?: any;
  feedback?: string;
  iterations: number;
  maxIterations: number;
  children?: AgentTask[];
}

export interface AgentCapabilities {
  canUseTools: boolean;
  canDelegateToAgents: boolean;
  canMakeDecisions: boolean;
  canRequestRevision: boolean;
  canAccessMemory: boolean;
  availableTools: string[];
}

export interface AgentPersona {
  name: string;
  role: string;
  expertise: string[];
  style: string;
  goals: string[];
  constraints: string[];
}

export class AutonomousAgent {
  private id: string;
  private persona: AgentPersona;
  private capabilities: AgentCapabilities;
  private toolsManager: ToolsManager;
  private memoryManager: MemoryManager;
  private openAIService: OpenAIService;
  private subAgents: Map<string, AutonomousAgent> = new Map();
  private taskHistory: AgentTask[] = [];
  private currentTask: AgentTask | null = null;
  private parentAgent: AutonomousAgent | null = null;
  private validationCriteria: string[] = [];
  
  constructor(
    persona: AgentPersona,
    capabilities: AgentCapabilities,
    toolsManager: ToolsManager,
    memoryManager: MemoryManager,
    openAIService: OpenAIService,
    parentAgent?: AutonomousAgent
  ) {
    this.id = crypto.randomBytes(8).toString('hex');
    this.persona = persona;
    this.capabilities = capabilities;
    this.toolsManager = toolsManager;
    this.memoryManager = memoryManager;
    this.openAIService = openAIService;
    this.parentAgent = parentAgent || null;
    
    // Define critérios de validação baseados no papel
    this.setupValidationCriteria();
  }
  
  private setupValidationCriteria(): void {
    switch (this.persona.role) {
      case 'researcher':
        this.validationCriteria = [
          'Informações precisas e verificadas',
          'Fontes confiáveis citadas',
          'Dados atualizados',
          'Análise completa do tema'
        ];
        break;
      case 'content_creator':
        this.validationCriteria = [
          'Conteúdo original e criativo',
          'Estrutura bem organizada',
          'Linguagem apropriada ao público',
          'Objetivo claro e alcançado'
        ];
        break;
      case 'validator':
        this.validationCriteria = [
          'Conformidade com requisitos',
          'Qualidade do conteúdo',
          'Ausência de erros',
          'Humanização adequada'
        ];
        break;
      case 'executor':
        this.validationCriteria = [
          'Tarefa executada com sucesso',
          'Resultados mensuráveis',
          'Sem efeitos colaterais',
          'Performance otimizada'
        ];
        break;
      default:
        this.validationCriteria = [
          'Tarefa concluída',
          'Qualidade aceitável',
          'Requisitos atendidos'
        ];
    }
  }
  
  async executeTask(task: AgentTask): Promise<AgentTask> {
    console.log(chalk.cyan(`\n🤖 [${this.persona.name}] Iniciando tarefa: ${task.description}`));
    this.currentTask = task;
    task.status = 'in_progress';
    task.iterations = 0;
    
    try {
      // Modo Espiral: Executar -> Validar -> Refinar -> Repetir
      while (task.iterations < task.maxIterations) {
        task.iterations++;
        console.log(chalk.gray(`  📍 Iteração ${task.iterations}/${task.maxIterations}`));
        
        // 1. Analisar tarefa e decidir estratégia
        const strategy = await this.analyzeTaskStrategy(task);
        console.log(chalk.blue(`  📋 Estratégia: ${strategy.approach}`));
        
        // 2. Executar baseado na estratégia
        let result;
        if (strategy.needsTools && this.capabilities.canUseTools) {
          result = await this.executeWithTools(task, strategy.tools);
        } else if (strategy.needsDelegation && this.capabilities.canDelegateToAgents) {
          result = await this.delegateToAgents(task, strategy.delegationPlan);
        } else {
          result = await this.executeDirectly(task);
        }
        
        // 3. Validar resultado
        const validation = await this.validateResult(result, task);
        console.log(chalk.yellow(`  ✓ Validação: ${validation.score}/100`));
        
        if (validation.isValid) {
          task.result = result;
          task.status = 'completed';
          console.log(chalk.green(`  ✅ Tarefa concluída com sucesso!`));
          break;
        } else if (validation.needsRevision && task.iterations < task.maxIterations) {
          console.log(chalk.yellow(`  🔄 Refinando resultado...`));
          task.feedback = validation.feedback;
          task.context = { ...task.context, previousResult: result, feedback: validation.feedback };
          // Continua no loop para refinar
        } else if (validation.needsHelp) {
          console.log(chalk.magenta(`  🆘 Solicitando ajuda de outro agente...`));
          const helperAgent = await this.createHelperAgent(validation.helpType);
          const helpTask: AgentTask = {
            id: crypto.randomBytes(8).toString('hex'),
            type: 'validate',
            description: `Ajudar com: ${validation.feedback}`,
            context: { originalTask: task, result },
            status: 'pending',
            iterations: 0,
            maxIterations: 3
          };
          const helpResult = await helperAgent.executeTask(helpTask);
          result = helpResult.result;
        }
      }
      
      // Se chegou ao limite de iterações sem sucesso
      if (task.status !== 'completed') {
        task.status = 'needs_revision';
        task.feedback = 'Limite de iterações atingido. Revisão manual necessária.';
        // IMPORTANTE: Garantir que sempre há um resultado, mesmo que parcial
        if (!task.result) {
          task.result = {
            partial: true,
            message: 'Resultado parcial - necessita revisão',
            iterations: task.iterations,
            feedback: task.feedback
          };
        }
      }
      
    } catch (error: any) {
      console.error(chalk.red(`  ❌ Erro na execução: ${error.message}`));
      task.status = 'failed';
      task.feedback = error.message;
      // IMPORTANTE: Garantir que sempre há um resultado, mesmo em erro
      task.result = {
        error: true,
        message: error.message,
        iterations: task.iterations
      };
    }
    
    // Armazenar na memória
    this.taskHistory.push(task);
    this.memoryManager.addPrimaryMessage({
      role: 'assistant',
      content: `[${this.persona.name}] Tarefa: ${task.description} - Status: ${task.status}`
    });
    
    return task;
  }
  
  private async analyzeTaskStrategy(task: AgentTask): Promise<any> {
    const prompt = `
    Como ${this.persona.role} especializado em ${this.persona.expertise.join(', ')},
    analise a seguinte tarefa e defina a melhor estratégia:
    
    Tarefa: ${task.description}
    Contexto: ${JSON.stringify(task.context || {})}
    
    Capacidades disponíveis:
    - Usar ferramentas: ${this.capabilities.canUseTools} (${this.capabilities.availableTools.join(', ')})
    - Delegar para outros agentes: ${this.capabilities.canDelegateToAgents}
    - Tomar decisões autônomas: ${this.capabilities.canMakeDecisions}
    
    Responda em JSON com:
    {
      "approach": "tools|delegation|direct|hybrid",
      "reasoning": "explicação da escolha",
      "needsTools": boolean,
      "tools": ["tool1", "tool2"],
      "needsDelegation": boolean,
      "delegationPlan": [
        {"agentType": "researcher", "task": "..."},
        {"agentType": "creator", "task": "..."}
      ]
    }`;
    
    const result = await this.openAIService.sendMessageWithTools(
      [
        { role: 'system', content: 'Você é um estrategista de IA. Responda sempre em JSON válido.' },
        { role: 'user', content: prompt }
      ],
      'gpt-3.5-turbo'
    );
    
    try {
      // result pode ser um objeto com response e toolCalls
      const response = typeof result === 'string' ? result : result.response;
      return JSON.parse(response);
    } catch {
      // Fallback para estratégia simples
      return {
        approach: 'direct',
        reasoning: 'Execução direta da tarefa',
        needsTools: false,
        tools: [],
        needsDelegation: false,
        delegationPlan: []
      };
    }
  }
  
  private async executeWithTools(task: AgentTask, tools: string[]): Promise<any> {
    console.log(chalk.blue(`  🔧 Usando ferramentas: ${tools.join(', ')}`));
    const results: any = {};
    
    for (const toolName of tools) {
      if (this.capabilities.availableTools.includes(toolName)) {
        try {
          console.log(chalk.gray(`    → Executando ${toolName}...`));
          
          // Preparar parâmetros baseados na tarefa
          const params = this.prepareToolParams(toolName, task);
          
          // Executar ferramenta
          const toolResult = await this.toolsManager.executeTool(toolName, params);
          results[toolName] = toolResult;
          
          console.log(chalk.green(`    ✓ ${toolName} executado com sucesso`));
        } catch (error: any) {
          console.log(chalk.red(`    ✗ Erro em ${toolName}: ${error.message}`));
          results[toolName] = { error: error.message };
        }
      }
    }
    
    return results;
  }
  
  private async delegateToAgents(task: AgentTask, delegationPlan: any[]): Promise<any> {
    console.log(chalk.magenta(`  👥 Delegando para ${delegationPlan.length} agente(s)`));
    const results: any[] = [];
    
    for (const plan of delegationPlan) {
      // Criar agente especializado
      const subAgent = await this.createSpecializedAgent(plan.agentType);
      
      // Criar subtarefa
      const subTask: AgentTask = {
        id: crypto.randomBytes(8).toString('hex'),
        type: plan.taskType || 'execute',
        description: plan.task,
        context: { ...task.context, parentTask: task.description },
        parentAgentId: this.id,
        status: 'pending',
        iterations: 0,
        maxIterations: 5
      };
      
      console.log(chalk.cyan(`    → Delegando para ${subAgent.persona.name}: ${plan.task}`));
      
      // Executar subtarefa
      const result = await subAgent.executeTask(subTask);
      
      // Validar resultado do subagente
      const validation = await this.validateSubAgentResult(result, plan);
      
      if (!validation.isValid && this.capabilities.canRequestRevision) {
        console.log(chalk.yellow(`    ⟲ Solicitando revisão...`));
        subTask.feedback = validation.feedback;
        subTask.status = 'needs_revision';
        const revisedResult = await subAgent.executeTask(subTask);
        results.push(revisedResult.result);
      } else {
        results.push(result.result);
      }
      
      // Armazenar subagente para possível uso futuro
      this.subAgents.set(subAgent.id, subAgent);
    }
    
    // Consolidar resultados dos subagentes
    return this.consolidateResults(results, task);
  }
  
  private async executeDirectly(task: AgentTask): Promise<any> {
    console.log(chalk.green(`  🎯 Execução direta da tarefa`));
    
    const prompt = `
    Como ${this.persona.role} com expertise em ${this.persona.expertise.join(', ')},
    execute a seguinte tarefa com excelência:
    
    Tarefa: ${task.description}
    Tipo: ${task.type}
    Contexto: ${JSON.stringify(task.context || {})}
    ${task.feedback ? `Feedback anterior: ${task.feedback}` : ''}
    
    Estilo: ${this.persona.style}
    Objetivos: ${this.persona.goals.join(', ')}
    Restrições: ${this.persona.constraints.join(', ')}
    
    Entregue um resultado completo, detalhado e de alta qualidade.`;
    
    const result = await this.openAIService.sendMessageWithTools(
      [
        { role: 'system', content: `Você é ${this.persona.name}, ${this.persona.role}.` },
        { role: 'user', content: prompt }
      ],
      'gpt-3.5-turbo'
    );
    
    // result pode ser um objeto com response e toolCalls
    const response = typeof result === 'string' ? result : result.response;
    
    return {
      content: response,
      metadata: {
        agent: this.persona.name,
        timestamp: new Date().toISOString(),
        iterations: task.iterations
      }
    };
  }
  
  private async validateResult(result: any, task: AgentTask): Promise<any> {
    console.log(chalk.yellow(`  🔍 Validando resultado...`));
    
    // Validação baseada em critérios do agente
    const scores: number[] = [];
    const feedback: string[] = [];
    
    for (const criterion of this.validationCriteria) {
      const score = await this.evaluateCriterion(result, criterion, task);
      scores.push(score);
      if (score < 80) {
        feedback.push(`${criterion}: ${score}/100`);
      }
    }
    
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    return {
      isValid: averageScore >= 80,
      score: Math.round(averageScore),
      needsRevision: averageScore >= 60 && averageScore < 80,
      needsHelp: averageScore < 60,
      helpType: averageScore < 40 ? 'expert' : 'reviewer',
      feedback: feedback.join('; '),
      details: {
        criteria: this.validationCriteria,
        scores
      }
    };
  }
  
  private async evaluateCriterion(result: any, criterion: string, task: AgentTask): Promise<number> {
    // Avaliação simplificada - em produção, seria mais sofisticada
    const content = typeof result === 'string' ? result : JSON.stringify(result);
    
    // Verificações básicas
    if (!content || content.length < 10) return 0;
    
    // Pontuação baseada em heurísticas
    let score = 70; // Base
    
    // Ajustar baseado no critério
    if (criterion.includes('completa') && content.length > 500) score += 10;
    if (criterion.includes('organizada') && content.includes('#')) score += 10;
    if (criterion.includes('verificada') && content.includes('fonte')) score += 10;
    if (criterion.includes('original') && !content.includes('Lorem')) score += 10;
    
    return Math.min(100, score);
  }
  
  private async validateSubAgentResult(result: AgentTask, plan: any): Promise<any> {
    // Validação específica para resultados de subagentes
    if (result.status === 'completed') {
      return { isValid: true, score: 100 };
    } else if (result.status === 'needs_revision') {
      return { 
        isValid: false, 
        score: 60, 
        feedback: result.feedback || 'Resultado precisa de melhorias'
      };
    } else {
      return { 
        isValid: false, 
        score: 0, 
        feedback: 'Tarefa falhou ou não foi concluída'
      };
    }
  }
  
  private async createSpecializedAgent(type: string): Promise<AutonomousAgent> {
    let persona: AgentPersona;
    
    switch (type) {
      case 'researcher':
        persona = {
          name: `Pesquisador-${crypto.randomBytes(4).toString('hex')}`,
          role: 'researcher',
          expertise: ['pesquisa', 'análise', 'coleta de dados'],
          style: 'analítico e detalhado',
          goals: ['encontrar informações precisas', 'verificar fontes'],
          constraints: ['apenas fontes confiáveis', 'dados atualizados']
        };
        break;
        
      case 'creator':
        persona = {
          name: `Criador-${crypto.randomBytes(4).toString('hex')}`,
          role: 'content_creator',
          expertise: ['escrita', 'criatividade', 'storytelling'],
          style: 'criativo e envolvente',
          goals: ['criar conteúdo original', 'engajar audiência'],
          constraints: ['manter qualidade', 'respeitar diretrizes']
        };
        break;
        
      case 'validator':
        persona = {
          name: `Validador-${crypto.randomBytes(4).toString('hex')}`,
          role: 'validator',
          expertise: ['revisão', 'qualidade', 'conformidade'],
          style: 'crítico e minucioso',
          goals: ['garantir qualidade', 'identificar problemas'],
          constraints: ['ser objetivo', 'fornecer feedback construtivo']
        };
        break;
        
      default:
        persona = {
          name: `Agente-${crypto.randomBytes(4).toString('hex')}`,
          role: 'executor',
          expertise: ['execução', 'implementação'],
          style: 'eficiente e direto',
          goals: ['completar tarefas', 'otimizar processos'],
          constraints: ['seguir instruções', 'manter eficiência']
        };
    }
    
    // Todos os subagentes têm acesso total às ferramentas
    const capabilities: AgentCapabilities = {
      canUseTools: true,
      canDelegateToAgents: true,
      canMakeDecisions: true,
      canRequestRevision: true,
      canAccessMemory: true,
      availableTools: this.capabilities.availableTools
    };
    
    return new AutonomousAgent(
      persona,
      capabilities,
      this.toolsManager,
      this.memoryManager,
      this.openAIService,
      this // Este agente é o pai
    );
  }
  
  private async createHelperAgent(helpType: string): Promise<AutonomousAgent> {
    const persona: AgentPersona = {
      name: `Helper-${helpType}-${crypto.randomBytes(4).toString('hex')}`,
      role: helpType === 'expert' ? 'expert' : 'reviewer',
      expertise: helpType === 'expert' ? 
        ['resolução de problemas', 'expertise técnica', 'soluções avançadas'] :
        ['revisão', 'melhoria de conteúdo', 'humanização'],
      style: 'colaborativo e solucionador',
      goals: ['ajudar a resolver problemas', 'melhorar resultados'],
      constraints: ['manter foco na solução', 'ser construtivo']
    };
    
    const capabilities: AgentCapabilities = {
      canUseTools: true,
      canDelegateToAgents: false, // Helpers não delegam para evitar loops
      canMakeDecisions: true,
      canRequestRevision: false,
      canAccessMemory: true,
      availableTools: this.capabilities.availableTools
    };
    
    return new AutonomousAgent(
      persona,
      capabilities,
      this.toolsManager,
      this.memoryManager,
      this.openAIService,
      this
    );
  }
  
  private prepareToolParams(toolName: string, task: AgentTask): any {
    // Preparar parâmetros específicos para cada ferramenta
    const baseParams = {
      context: task.context,
      description: task.description
    };
    
    switch (toolName) {
      case 'file_write':
        return {
          filename: task.context?.filename || 'output.txt',
          content: task.context?.content || task.result || ''
        };
        
      case 'shell':
        return {
          command: task.context?.command || 'echo "Task executed"'
        };
        
      case 'file_read':
        return {
          path: task.context?.filepath || './README.md'
        };
        
      case 'secondary_context':
        return {
          name: `context-${task.id}`,
          content: JSON.stringify(task)
        };
        
      default:
        return baseParams;
    }
  }
  
  private async consolidateResults(results: any[], task: AgentTask): Promise<any> {
    console.log(chalk.cyan(`  📊 Consolidando ${results.length} resultado(s)`));
    
    // Se houver apenas um resultado, retorná-lo
    if (results.length === 1) {
      return results[0];
    }
    
    // Consolidar múltiplos resultados
    const consolidated = {
      summary: `Tarefa "${task.description}" concluída com ${results.length} componentes`,
      components: results,
      metadata: {
        totalAgents: results.length,
        timestamp: new Date().toISOString(),
        taskId: task.id
      }
    };
    
    // Se for conteúdo textual, tentar combinar
    if (results.every(r => typeof r === 'string' || r.content)) {
      const contents = results.map(r => typeof r === 'string' ? r : r.content);
      consolidated.summary = contents.join('\n\n---\n\n');
    }
    
    return consolidated;
  }
  
  // Métodos públicos para interação
  public getPersona(): AgentPersona {
    return this.persona;
  }
  
  public getCapabilities(): AgentCapabilities {
    return this.capabilities;
  }
  
  public getTaskHistory(): AgentTask[] {
    return this.taskHistory;
  }
  
  public getSubAgents(): AutonomousAgent[] {
    return Array.from(this.subAgents.values());
  }
  
  public async requestRevision(taskId: string, feedback: string): Promise<AgentTask> {
    const task = this.taskHistory.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    task.status = 'needs_revision';
    task.feedback = feedback;
    task.iterations = 0; // Reset iterations for revision
    
    return await this.executeTask(task);
  }
}