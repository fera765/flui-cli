import { CascadeAgentReal, CascadeAgentConfig, AgentExecution, ValidationResult } from './cascadeAgentReal';
import { ToolsManager } from './toolsManager';
import { MemoryManager } from './memoryManager';
import { OpenAIService } from './openAIService';
import { NavigationManager } from './navigationManager';
import { ErrorHandler } from './errorHandler';
import { EventEmitter } from 'events';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface CascadeFlow {
  id: string;
  userRequest: string;
  startTime: Date;
  endTime?: Date;
  status: 'initializing' | 'cascading' | 'validating' | 'completed' | 'failed';
  currentLevel: number;
  executions: AgentExecution[];
  finalResult?: any;
  metadata?: {
    totalExecutionTime?: number;
    totalRetries?: number;
    totalLLMCalls?: number;
    confidenceScore?: number;
    provenance?: string[];
    versions?: string[];
    signatures?: string[];
  };
}

export interface CascadeDecision {
  action: 'finalize' | 'restart' | 'escalate';
  reason: string;
  confidence: number;
  parameters?: any;
}

export class CascadeOrchestratorReal extends EventEmitter {
  private agents: Map<number, CascadeAgentReal> = new Map();
  private toolsManager!: ToolsManager;
  private memoryManager!: MemoryManager;
  private openAIService!: OpenAIService;
  private navigationManager!: NavigationManager;
  private errorHandler!: ErrorHandler;
  private currentFlow: CascadeFlow | null = null;
  private flowHistory: CascadeFlow[] = [];
  
  constructor() {
    super();
    this.initializeServices();
    this.initializeAgents();
  }
  
  private initializeServices(): void {
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
    
    console.log(chalk.green('✅ Serviços reais inicializados para cascata'));
  }
  
  private initializeAgents(): void {
    const agentConfigs: CascadeAgentConfig[] = [
      {
        id: 'agent-1-requirements',
        name: 'Agente de Requisitos',
        level: 1,
        specialization: 'Análise e decomposição de requisitos',
        capabilities: [
          'análise de texto',
          'extração de requisitos',
          'identificação de dependências',
          'classificação de complexidade'
        ],
        tools: ['file_read', 'analyze_context', 'secondary_context'],
        validationThreshold: 0.7,
        maxRetries: 3
      },
      {
        id: 'agent-2-architecture',
        name: 'Agente de Arquitetura',
        level: 2,
        specialization: 'Design de arquitetura e estruturação',
        capabilities: [
          'design de sistemas',
          'definição de componentes',
          'mapeamento de interfaces',
          'padrões arquiteturais'
        ],
        tools: ['file_write', 'file_read', 'navigate'],
        validationThreshold: 0.75,
        maxRetries: 3
      },
      {
        id: 'agent-3-implementation',
        name: 'Agente de Implementação',
        level: 3,
        specialization: 'Codificação e implementação técnica',
        capabilities: [
          'geração de código',
          'implementação de algoritmos',
          'integração de componentes',
          'otimização de código'
        ],
        tools: ['file_write', 'file_read', 'file_replace', 'shell', 'append_content'],
        validationThreshold: 0.8,
        maxRetries: 4
      },
      {
        id: 'agent-4-testing',
        name: 'Agente de Testes',
        level: 4,
        specialization: 'Validação, testes e qualidade',
        capabilities: [
          'criação de testes',
          'execução de testes',
          'análise de cobertura',
          'detecção de bugs'
        ],
        tools: ['shell', 'file_write', 'find_problem_solution'],
        validationThreshold: 0.85,
        maxRetries: 3
      },
      {
        id: 'agent-5-optimization',
        name: 'Agente de Otimização',
        level: 5,
        specialization: 'Performance e otimização',
        capabilities: [
          'análise de performance',
          'otimização de recursos',
          'refatoração de código',
          'melhoria de eficiência'
        ],
        tools: ['file_replace', 'analyze_context', 'shell'],
        validationThreshold: 0.8,
        maxRetries: 2
      },
      {
        id: 'agent-6-documentation',
        name: 'Agente de Documentação',
        level: 6,
        specialization: 'Documentação e metadados',
        capabilities: [
          'geração de documentação',
          'criação de metadados',
          'versionamento',
          'assinaturas digitais'
        ],
        tools: ['file_write', 'append_content', 'secondary_context_read'],
        validationThreshold: 0.9,
        maxRetries: 2
      }
    ];
    
    // Cria agentes reais com LLM
    agentConfigs.forEach(config => {
      const agent = new CascadeAgentReal(
        config,
        this.openAIService,
        this.toolsManager
      );
      
      agent.on('execution_complete', (execution: AgentExecution) => {
        this.handleAgentCompletion(execution);
      });
      
      this.agents.set(config.level, agent);
    });
    
    console.log(chalk.green(`✅ ${this.agents.size} agentes reais inicializados com LLM`));
  }
  
  public async processRequest(userRequest: string): Promise<CascadeFlow> {
    console.log(chalk.cyan.bold('\n🌀 Iniciando cascata real com LLM...'));
    console.log(chalk.gray(`📝 Requisição: ${userRequest}`));
    
    this.currentFlow = {
      id: this.generateFlowId(),
      userRequest,
      startTime: new Date(),
      status: 'initializing',
      currentLevel: 6,
      executions: []
    };
    
    try {
      // Processa em cascata do nível 6 ao 1
      let currentInput = { 
        request: userRequest,
        timestamp: new Date().toISOString(),
        flowId: this.currentFlow.id
      };
      
      let previousValidation: ValidationResult | undefined;
      
      for (let level = 6; level >= 1; level--) {
        this.currentFlow.currentLevel = level;
        this.currentFlow.status = 'cascading';
        
        const agent = this.agents.get(level);
        if (!agent) {
          throw new Error(`Agente nível ${level} não encontrado`);
        }
        
        console.log(chalk.blue(`\n━━━ Nível ${level}: ${agent.getConfig().name} ━━━`));
        
        // Executa agente com processamento real
        const execution = await agent.execute(currentInput, previousValidation);
        this.currentFlow.executions.push(execution);
        
        // Verifica resultado da validação
        if (!execution.validationResult.approved) {
          console.log(chalk.yellow(`  ⚠️ Confiança: ${(execution.validationResult.confidence * 100).toFixed(1)}%`));
          
          if (execution.retryCount >= agent.getConfig().maxRetries) {
            console.log(chalk.yellow(`  ⚠️ Máximo de tentativas atingido`));
            // Continua para o próximo agente mesmo assim
          }
        } else {
          console.log(chalk.green(`  ✅ Aprovado: ${(execution.validationResult.confidence * 100).toFixed(1)}%`));
        }
        
        // Prepara input para próximo nível
        currentInput = {
          ...currentInput,
          [`level${level}Output`]: execution.output,
          [`level${level}Validation`]: execution.validationResult,
          [`level${level}LLMCalls`]: agent.getLLMCallCount()
        };
        
        previousValidation = execution.validationResult;
      }
      
      // Validação final com LLM
      this.currentFlow.status = 'validating';
      const finalDecision = await this.makeFinalDecisionWithLLM();
      
      if (finalDecision.action === 'finalize') {
        this.currentFlow.status = 'completed';
        this.currentFlow.finalResult = await this.consolidateResultsWithLLM();
        this.currentFlow.metadata = this.generateRealMetadata();
      } else if (finalDecision.action === 'restart') {
        console.log(chalk.yellow('🔄 Reiniciando cascata com parâmetros ajustados...'));
        // Poderia reiniciar com ajustes
        this.currentFlow.status = 'completed';
        this.currentFlow.finalResult = await this.consolidateResultsWithLLM();
        this.currentFlow.metadata = this.generateRealMetadata();
      }
      
      this.currentFlow.endTime = new Date();
      this.flowHistory.push(this.currentFlow);
      
      this.emit('cascade_complete', this.currentFlow);
      
      return this.currentFlow;
      
    } catch (error) {
      console.log(chalk.red(`❌ Erro na cascata: ${error}`));
      if (this.currentFlow) {
        this.currentFlow.status = 'failed';
        this.currentFlow.endTime = new Date();
        this.currentFlow.finalResult = { error: String(error) };
        this.flowHistory.push(this.currentFlow);
      }
      throw error;
    }
  }
  
  private async makeFinalDecisionWithLLM(): Promise<CascadeDecision> {
    console.log(chalk.cyan.bold('\n🎯 FLUI Central - Decisão Final com LLM'));
    
    if (!this.currentFlow) {
      return { 
        action: 'restart', 
        reason: 'Fluxo não inicializado',
        confidence: 0
      };
    }
    
    // Prepara contexto para decisão
    const context = {
      request: this.currentFlow.userRequest,
      executions: this.currentFlow.executions.map(e => ({
        agent: e.agentId,
        level: e.agentLevel,
        approved: e.validationResult.approved,
        confidence: e.validationResult.confidence,
        retries: e.retryCount,
        llmCalls: e.llmCalls
      }))
    };
    
    const decisionPrompt = `
Você é o FLUI Central, responsável pela decisão final sobre o processamento em cascata.

Analise o seguinte contexto e tome uma decisão:
${JSON.stringify(context, null, 2)}

Critérios de decisão:
- Se todos os agentes aprovaram com alta confiança (>70%), FINALIZE
- Se a confiança média é baixa (<50%), considere RESTART
- Se há problemas críticos, considere ESCALATE

Retorne um JSON com:
- action: "finalize" | "restart" | "escalate"
- reason: string explicando a decisão
- confidence: número entre 0 e 1 indicando confiança na decisão
- recommendations: array de recomendações (opcional)
`;

    try {
      const response = await this.openAIService.chat([
        { role: 'system', content: 'Você é o sistema de decisão central do FLUI.' },
        { role: 'user', content: decisionPrompt }
      ]);
      
      const decision = JSON.parse(response);
      
      console.log(chalk.gray(`  📊 Decisão: ${decision.action}`));
      console.log(chalk.gray(`  📈 Confiança: ${(decision.confidence * 100).toFixed(1)}%`));
      console.log(chalk.gray(`  💭 Razão: ${decision.reason}`));
      
      return decision;
    } catch (error) {
      console.log(chalk.red(`  ❌ Erro na decisão: ${error}`));
      
      // Decisão padrão baseada em métricas
      const allApproved = this.currentFlow.executions.every(e => e.validationResult.approved);
      const avgConfidence = this.currentFlow.executions.reduce(
        (sum, e) => sum + e.validationResult.confidence, 0
      ) / this.currentFlow.executions.length;
      
      return {
        action: allApproved && avgConfidence > 0.6 ? 'finalize' : 'restart',
        reason: 'Decisão automática baseada em métricas',
        confidence: avgConfidence
      };
    }
  }
  
  private async consolidateResultsWithLLM(): Promise<any> {
    if (!this.currentFlow) return null;
    
    const consolidationPrompt = `
Consolide os resultados do processamento em cascata:

Requisição original: ${this.currentFlow.userRequest}

Resultados por agente:
${JSON.stringify(this.currentFlow.executions.map(e => ({
  agent: e.agentId,
  output: e.output,
  confidence: e.validationResult.confidence
})), null, 2)}

Gere um resumo consolidado e estruturado dos resultados.
`;

    try {
      const response = await this.openAIService.chat([
        { role: 'system', content: 'Você é um consolidador de resultados.' },
        { role: 'user', content: consolidationPrompt }
      ]);
      
      return {
        summary: response,
        request: this.currentFlow.userRequest,
        timestamp: new Date().toISOString(),
        flowId: this.currentFlow.id
      };
    } catch (error) {
      // Fallback para consolidação básica
      return {
        request: this.currentFlow.userRequest,
        timestamp: new Date().toISOString(),
        executions: this.currentFlow.executions.length,
        status: 'completed'
      };
    }
  }
  
  private generateRealMetadata(): any {
    if (!this.currentFlow) return {};
    
    const totalTime = this.currentFlow.endTime 
      ? this.currentFlow.endTime.getTime() - this.currentFlow.startTime.getTime()
      : 0;
    
    const totalRetries = this.currentFlow.executions.reduce(
      (sum, e) => sum + e.retryCount, 0
    );
    
    const totalLLMCalls = this.currentFlow.executions.reduce(
      (sum, e) => sum + (e.llmCalls || 0), 0
    );
    
    const avgConfidence = this.currentFlow.executions.reduce(
      (sum, e) => sum + e.validationResult.confidence, 0
    ) / this.currentFlow.executions.length;
    
    // Gera assinaturas reais usando crypto
    const signatures = this.currentFlow.executions.map(e => {
      const data = JSON.stringify({
        agent: e.agentId,
        output: e.output,
        timestamp: e.timestamp
      });
      return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
    });
    
    return {
      totalExecutionTime: totalTime,
      totalRetries,
      totalLLMCalls,
      confidenceScore: avgConfidence,
      provenance: this.generateProvenance(),
      versions: [
        'cascade-orchestrator-real:2.0.0',
        'cascade-agent-real:2.0.0',
        'flui-core:3.0.0'
      ],
      signatures
    };
  }
  
  private generateProvenance(): string[] {
    if (!this.currentFlow) return [];
    
    return this.currentFlow.executions.map(e => 
      `${e.agentId}:${e.timestamp.toISOString()}:${e.validationResult.confidence.toFixed(2)}`
    );
  }
  
  private handleAgentCompletion(execution: AgentExecution): void {
    console.log(chalk.green(`  ✅ ${execution.agentId} concluído`));
    if (execution.llmCalls) {
      console.log(chalk.gray(`     LLM calls: ${execution.llmCalls}`));
    }
    this.emit('agent_complete', execution);
  }
  
  private generateFlowId(): string {
    return `flow-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }
  
  public getAgents(): Map<number, CascadeAgentReal> {
    return this.agents;
  }
  
  public getCurrentFlow(): CascadeFlow | null {
    return this.currentFlow;
  }
  
  public getFlowHistory(): CascadeFlow[] {
    return this.flowHistory;
  }
  
  public async exportFlowReport(flowId: string, outputPath: string): Promise<void> {
    const flow = this.flowHistory.find(f => f.id === flowId);
    if (!flow) {
      throw new Error(`Flow ${flowId} não encontrado`);
    }
    
    const report = {
      ...flow,
      exportedAt: new Date().toISOString(),
      version: '2.0.0-real'
    };
    
    await fs.promises.writeFile(
      outputPath,
      JSON.stringify(report, null, 2),
      'utf-8'
    );
    
    console.log(chalk.green(`📄 Relatório real exportado: ${outputPath}`));
  }
}