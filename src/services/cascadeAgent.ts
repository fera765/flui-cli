import { EventEmitter } from 'events';
import chalk from 'chalk';
import * as crypto from 'crypto';

export interface ValidationResult {
  approved: boolean;
  confidence: number;
  feedback?: string;
  requiresUserInput?: boolean;
  suggestedAdjustments?: string[];
}

export interface ToolPermission {
  toolName: string;
  permission: 'allow_once' | 'allow_always' | 'deny' | 'pending';
  timestamp: Date;
}

export interface AgentExecution {
  agentId: string;
  agentLevel: number;
  input: any;
  output: any;
  validationResult: ValidationResult;
  toolPermissions: ToolPermission[];
  timestamp: Date;
  executionTime: number;
  retryCount: number;
}

export interface CascadeAgentConfig {
  id: string;
  name: string;
  level: number; // 1-6, onde 1 é o mais próximo do centro
  specialization: string;
  capabilities: string[];
  tools: string[];
  validationThreshold: number; // 0-1, nível mínimo de confiança
  maxRetries: number;
}

export class CascadeAgent extends EventEmitter {
  private config: CascadeAgentConfig;
  private executionHistory: AgentExecution[] = [];
  private toolPermissions: Map<string, ToolPermission> = new Map();
  private isExecuting: boolean = false;
  
  constructor(config: CascadeAgentConfig) {
    super();
    this.config = config;
    this.initializeTools();
  }
  
  private initializeTools(): void {
    // Inicializa permissões de ferramentas como pendentes
    this.config.tools.forEach(tool => {
      this.toolPermissions.set(tool, {
        toolName: tool,
        permission: 'pending',
        timestamp: new Date()
      });
    });
  }
  
  public async execute(input: any, previousValidation?: ValidationResult): Promise<AgentExecution> {
    const startTime = Date.now();
    this.isExecuting = true;
    
    console.log(chalk.cyan(`\n🤖 Agente ${this.config.level} (${this.config.name}) iniciando execução...`));
    
    let retryCount = 0;
    let output: any = null;
    let validationResult: ValidationResult | null = null;
    
    while (retryCount <= this.config.maxRetries) {
      try {
        // Processa entrada com base na validação anterior
        const processedInput = previousValidation?.suggestedAdjustments 
          ? this.applyAdjustments(input, previousValidation.suggestedAdjustments)
          : input;
        
        // Executa a lógica principal do agente
        output = await this.processTask(processedInput);
        
        // Valida o resultado
        validationResult = await this.validateOutput(output);
        
        // Se aprovado ou não requer mais tentativas, sai do loop
        if (validationResult.approved || retryCount >= this.config.maxRetries) {
          break;
        }
        
        // Emite evento de reexecução necessária
        this.emit('reexecution_required', {
          agent: this.config.name,
          level: this.config.level,
          attempt: retryCount + 1,
          feedback: validationResult.feedback
        });
        
        retryCount++;
        
        // Se requer input do usuário, solicita
        if (validationResult.requiresUserInput) {
          const userInput = await this.requestUserInput(validationResult.feedback);
          input = this.mergeUserInput(input, userInput);
        }
        
      } catch (error) {
        console.log(chalk.red(`❌ Erro no agente ${this.config.name}: ${error}`));
        validationResult = {
          approved: false,
          confidence: 0,
          feedback: `Erro na execução: ${error}`,
          requiresUserInput: true
        };
        retryCount++;
      }
    }
    
    const execution: AgentExecution = {
      agentId: this.config.id,
      agentLevel: this.config.level,
      input,
      output,
      validationResult: validationResult || { approved: false, confidence: 0 },
      toolPermissions: Array.from(this.toolPermissions.values()),
      timestamp: new Date(),
      executionTime: Date.now() - startTime,
      retryCount
    };
    
    this.executionHistory.push(execution);
    this.isExecuting = false;
    
    // Emite evento de conclusão
    this.emit('execution_complete', execution);
    
    return execution;
  }
  
  private async processTask(input: any): Promise<any> {
    // Lógica específica de processamento baseada na especialização
    console.log(chalk.gray(`  📝 Processando: ${this.config.specialization}`));
    
    const result = {
      agentLevel: this.config.level,
      agentName: this.config.name,
      specialization: this.config.specialization,
      processedData: input,
      metadata: {
        timestamp: new Date().toISOString(),
        capabilities: this.config.capabilities,
        tools: this.config.tools
      }
    };
    
    // Simula processamento baseado no nível do agente
    await this.simulateProcessing();
    
    return result;
  }
  
  private async validateOutput(output: any): Promise<ValidationResult> {
    // Validação baseada em critérios específicos do agente
    const confidence = this.calculateConfidence(output);
    const approved = confidence >= this.config.validationThreshold;
    
    const result: ValidationResult = {
      approved,
      confidence,
      feedback: approved 
        ? `✅ Validação aprovada com ${(confidence * 100).toFixed(1)}% de confiança`
        : `⚠️ Validação falhou. Confiança: ${(confidence * 100).toFixed(1)}% (mínimo: ${(this.config.validationThreshold * 100).toFixed(1)}%)`
    };
    
    if (!approved) {
      result.requiresUserInput = confidence < 0.3;
      result.suggestedAdjustments = this.generateAdjustments(output);
    }
    
    return result;
  }
  
  private calculateConfidence(output: any): number {
    // Cálculo de confiança baseado em múltiplos fatores
    let confidence = 0.5; // Base
    
    // Aumenta confiança se tem dados processados
    if (output?.processedData) confidence += 0.2;
    
    // Aumenta confiança baseado no nível do agente (agentes mais altos têm mais confiança base)
    confidence += (7 - this.config.level) * 0.05;
    
    // Adiciona variação aleatória pequena para simular incerteza
    confidence += (Math.random() - 0.5) * 0.1;
    
    // Garante que está entre 0 e 1
    return Math.max(0, Math.min(1, confidence));
  }
  
  private generateAdjustments(output: any): string[] {
    const adjustments: string[] = [];
    
    // Gera sugestões baseadas no tipo de agente
    switch (this.config.level) {
      case 1:
        adjustments.push('Refinar análise de requisitos');
        adjustments.push('Adicionar validações de entrada');
        break;
      case 2:
        adjustments.push('Otimizar estrutura de dados');
        adjustments.push('Melhorar tratamento de erros');
        break;
      case 3:
        adjustments.push('Implementar cache de resultados');
        adjustments.push('Adicionar logs detalhados');
        break;
      case 4:
        adjustments.push('Melhorar performance');
        adjustments.push('Adicionar testes unitários');
        break;
      case 5:
        adjustments.push('Implementar fallback strategies');
        adjustments.push('Adicionar métricas de monitoramento');
        break;
      case 6:
        adjustments.push('Documentar decisões arquiteturais');
        adjustments.push('Adicionar análise de segurança');
        break;
    }
    
    return adjustments;
  }
  
  private applyAdjustments(input: any, adjustments: string[]): any {
    // Aplica ajustes sugeridos ao input
    return {
      ...input,
      adjustments: adjustments,
      adjustedAt: new Date().toISOString()
    };
  }
  
  private async requestUserInput(feedback?: string): Promise<any> {
    console.log(chalk.yellow(`\n⚠️ Input do usuário necessário para ${this.config.name}`));
    if (feedback) {
      console.log(chalk.gray(`  Motivo: ${feedback}`));
    }
    
    // Em produção real, isso seria uma interação real com o usuário
    // Por agora, retorna dados mock
    return {
      userResponse: 'continue',
      additionalData: {},
      timestamp: new Date().toISOString()
    };
  }
  
  private mergeUserInput(originalInput: any, userInput: any): any {
    return {
      ...originalInput,
      userInput,
      mergedAt: new Date().toISOString()
    };
  }
  
  private async simulateProcessing(): Promise<void> {
    // Simula tempo de processamento baseado no nível do agente
    const processingTime = (this.config.level * 100) + Math.random() * 200;
    await new Promise(resolve => setTimeout(resolve, processingTime));
  }
  
  public async requestToolPermission(toolName: string): Promise<ToolPermission> {
    console.log(chalk.yellow(`\n🔧 Solicitando permissão para ferramenta: ${toolName}`));
    console.log(chalk.gray('  [1] Permitir uma vez'));
    console.log(chalk.gray('  [2] Permitir sempre'));
    console.log(chalk.gray('  [3] Não permitir agora'));
    
    // Em produção, isso seria uma interação real
    // Por agora, simula aprovação automática
    const permission: ToolPermission = {
      toolName,
      permission: 'allow_once',
      timestamp: new Date()
    };
    
    this.toolPermissions.set(toolName, permission);
    return permission;
  }
  
  public getConfig(): CascadeAgentConfig {
    return this.config;
  }
  
  public getExecutionHistory(): AgentExecution[] {
    return this.executionHistory;
  }
  
  public isActive(): boolean {
    return this.isExecuting;
  }
  
  public getLastExecution(): AgentExecution | undefined {
    return this.executionHistory[this.executionHistory.length - 1];
  }
}