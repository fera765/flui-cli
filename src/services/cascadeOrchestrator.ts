import { CascadeAgent, CascadeAgentConfig, AgentExecution, ValidationResult } from './cascadeAgent';
import { ToolsManager } from './toolsManager';
import { MemoryManager } from './memoryManager';
import { OpenAIService } from './openAIService';
import { NavigationManager } from './navigationManager';
import { ErrorHandler } from './errorHandler';
import { EventEmitter } from 'events';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

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
    confidenceScore?: number;
    provenance?: string[];
    versions?: string[];
    signatures?: string[];
  };
}

export interface CascadeDecision {
  action: 'finalize' | 'restart' | 'escalate';
  reason: string;
  parameters?: any;
}

export class CascadeOrchestrator extends EventEmitter {
  private agents: Map<number, CascadeAgent> = new Map();
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
    
    console.log(chalk.green('✅ Serviços inicializados para orquestração em cascata'));
  }
  
  private initializeAgents(): void {
    // Configuração dos 6 agentes especializados
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
    
    // Cria e registra cada agente
    agentConfigs.forEach(config => {
      const agent = new CascadeAgent(config);
      
      // Registra listeners para eventos do agente
      agent.on('execution_complete', (execution: AgentExecution) => {
        this.handleAgentCompletion(execution);
      });
      
      agent.on('reexecution_required', (data: any) => {
        this.handleReexecutionRequest(data);
      });
      
      this.agents.set(config.level, agent);
    });
    
    console.log(chalk.green(`✅ ${this.agents.size} agentes em cascata inicializados`));
  }
  
  public async processRequest(userRequest: string): Promise<CascadeFlow> {
    console.log(chalk.cyan.bold('\n🌀 Iniciando processamento em cascata...'));
    console.log(chalk.gray(`📝 Requisição: ${userRequest}`));
    
    // Cria novo fluxo
    this.currentFlow = {
      id: this.generateFlowId(),
      userRequest,
      startTime: new Date(),
      status: 'initializing',
      currentLevel: 6, // Começa do nível mais alto
      executions: []
    };
    
    try {
      // Inicia a cascata do nível 6 para o nível 1
      let currentInput = { request: userRequest };
      let previousValidation: ValidationResult | undefined;
      
      for (let level = 6; level >= 1; level--) {
        this.currentFlow.currentLevel = level;
        this.currentFlow.status = 'cascading';
        
        const agent = this.agents.get(level);
        if (!agent) {
          throw new Error(`Agente nível ${level} não encontrado`);
        }
        
        console.log(chalk.blue(`\n━━━ Nível ${level}: ${agent.getConfig().name} ━━━`));
        
        // Executa o agente
        const execution = await agent.execute(currentInput, previousValidation);
        this.currentFlow.executions.push(execution);
        
        // Verifica se precisa parar a cascata
        if (!execution.validationResult.approved && level > 1) {
          console.log(chalk.yellow(`⚠️ Validação falhou no nível ${level}. Reexecutando...`));
          // Pode tentar reexecutar ou escalar
          if (execution.retryCount >= agent.getConfig().maxRetries) {
            console.log(chalk.red(`❌ Máximo de tentativas atingido no nível ${level}`));
            this.currentFlow.status = 'failed';
            break;
          }
        }
        
        // Prepara input para o próximo nível
        currentInput = {
          ...currentInput,
          [`level${level}Output`]: execution.output,
          [`level${level}Validation`]: execution.validationResult
        };
        
        previousValidation = execution.validationResult;
      }
      
      // Validação final pelo agente principal (QA)
      this.currentFlow.status = 'validating';
      const finalDecision = await this.makeFinalDecision();
      
      if (finalDecision.action === 'finalize') {
        this.currentFlow.status = 'completed';
        this.currentFlow.finalResult = this.consolidateResults();
        this.currentFlow.metadata = this.generateMetadata();
      } else if (finalDecision.action === 'restart') {
        console.log(chalk.yellow('🔄 Reiniciando cascata com parâmetros revisados...'));
        // Reinicia com novos parâmetros
        return this.processRequest(userRequest);
      }
      
      this.currentFlow.endTime = new Date();
      this.flowHistory.push(this.currentFlow);
      
      // Emite evento de conclusão
      this.emit('cascade_complete', this.currentFlow);
      
      return this.currentFlow;
      
    } catch (error) {
      console.log(chalk.red(`❌ Erro na cascata: ${error}`));
      if (this.currentFlow) {
        this.currentFlow.status = 'failed';
        this.currentFlow.endTime = new Date();
        this.flowHistory.push(this.currentFlow);
      }
      throw error;
    }
  }
  
  private async makeFinalDecision(): Promise<CascadeDecision> {
    console.log(chalk.cyan.bold('\n🎯 FLUI (Centro) - Decisão Final'));
    
    if (!this.currentFlow) {
      return { action: 'restart', reason: 'Fluxo não inicializado' };
    }
    
    // Analisa todas as execuções
    const allApproved = this.currentFlow.executions.every(e => e.validationResult.approved);
    const avgConfidence = this.currentFlow.executions.reduce(
      (sum, e) => sum + e.validationResult.confidence, 0
    ) / this.currentFlow.executions.length;
    
    console.log(chalk.gray(`  📊 Aprovações: ${allApproved ? '✅ Todas' : '⚠️ Parcial'}`));
    console.log(chalk.gray(`  📈 Confiança média: ${(avgConfidence * 100).toFixed(1)}%`));
    
    // Checagens finais de integridade
    const integrityCheck = this.performIntegrityCheck();
    const complianceCheck = this.performComplianceCheck();
    
    console.log(chalk.gray(`  🔒 Integridade: ${integrityCheck ? '✅' : '❌'}`));
    console.log(chalk.gray(`  📋 Conformidade: ${complianceCheck ? '✅' : '❌'}`));
    
    if (allApproved && avgConfidence > 0.7 && integrityCheck && complianceCheck) {
      return {
        action: 'finalize',
        reason: 'Todos os critérios atendidos'
      };
    } else if (avgConfidence < 0.5) {
      return {
        action: 'restart',
        reason: 'Confiança muito baixa',
        parameters: { adjustConfidence: true }
      };
    } else {
      return {
        action: 'escalate',
        reason: 'Necessita revisão manual'
      };
    }
  }
  
  private consolidateResults(): any {
    if (!this.currentFlow) return null;
    
    const results = {
      request: this.currentFlow.userRequest,
      timestamp: new Date().toISOString(),
      executions: this.currentFlow.executions.map(e => ({
        agent: e.agentId,
        level: e.agentLevel,
        output: e.output,
        confidence: e.validationResult.confidence
      })),
      summary: 'Processamento em cascata concluído com sucesso'
    };
    
    return results;
  }
  
  private generateMetadata(): any {
    if (!this.currentFlow) return {};
    
    const totalTime = this.currentFlow.endTime 
      ? this.currentFlow.endTime.getTime() - this.currentFlow.startTime.getTime()
      : 0;
    
    const totalRetries = this.currentFlow.executions.reduce(
      (sum, e) => sum + e.retryCount, 0
    );
    
    const avgConfidence = this.currentFlow.executions.reduce(
      (sum, e) => sum + e.validationResult.confidence, 0
    ) / this.currentFlow.executions.length;
    
    return {
      totalExecutionTime: totalTime,
      totalRetries,
      confidenceScore: avgConfidence,
      provenance: this.generateProvenance(),
      versions: this.generateVersions(),
      signatures: this.generateSignatures()
    };
  }
  
  private generateProvenance(): string[] {
    if (!this.currentFlow) return [];
    
    return this.currentFlow.executions.map(e => 
      `${e.agentId}:${e.timestamp.toISOString()}`
    );
  }
  
  private generateVersions(): string[] {
    return [
      'cascade-orchestrator:1.0.0',
      'cascade-agent:1.0.0',
      'flui-core:2.0.0'
    ];
  }
  
  private generateSignatures(): string[] {
    if (!this.currentFlow) return [];
    
    // Gera assinaturas digitais simuladas
    return this.currentFlow.executions.map(e => {
      const data = JSON.stringify({
        agent: e.agentId,
        output: e.output,
        timestamp: e.timestamp
      });
      return `sig-${Buffer.from(data).toString('base64').substring(0, 16)}`;
    });
  }
  
  private performIntegrityCheck(): boolean {
    // Verifica integridade dos dados
    if (!this.currentFlow) return false;
    
    // Verifica se todos os agentes executaram
    const expectedLevels = 6;
    const executedLevels = new Set(this.currentFlow.executions.map(e => e.agentLevel)).size;
    
    return executedLevels === expectedLevels;
  }
  
  private performComplianceCheck(): boolean {
    // Verifica conformidade com regras de negócio
    if (!this.currentFlow) return false;
    
    // Verifica se todas as ferramentas têm permissões adequadas
    const allPermissionsValid = this.currentFlow.executions.every(e => 
      e.toolPermissions.every(p => p.permission !== 'deny')
    );
    
    return allPermissionsValid;
  }
  
  private handleAgentCompletion(execution: AgentExecution): void {
    console.log(chalk.green(`✅ Agente ${execution.agentId} concluído`));
    this.emit('agent_complete', execution);
  }
  
  private handleReexecutionRequest(data: any): void {
    console.log(chalk.yellow(`🔄 Reexecução solicitada: ${data.agent}`));
    this.emit('reexecution_request', data);
  }
  
  private generateFlowId(): string {
    return `flow-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
  
  public getAgents(): Map<number, CascadeAgent> {
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
      version: '1.0.0'
    };
    
    await fs.promises.writeFile(
      outputPath,
      JSON.stringify(report, null, 2),
      'utf-8'
    );
    
    console.log(chalk.green(`📄 Relatório exportado para: ${outputPath}`));
  }
}