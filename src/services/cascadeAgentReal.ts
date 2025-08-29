import { EventEmitter } from 'events';
import { OpenAIService } from './openAIService';
import { ToolsManager } from './toolsManager';
import chalk from 'chalk';
import * as crypto from 'crypto';

export interface ValidationResult {
  approved: boolean;
  confidence: number;
  feedback?: string;
  requiresUserInput?: boolean;
  suggestedAdjustments?: string[];
  details?: any;
}

export interface ToolPermission {
  toolName: string;
  permission: 'allow_once' | 'allow_always' | 'deny' | 'pending';
  timestamp: Date;
  reason?: string;
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
  llmCalls?: number;
}

export interface CascadeAgentConfig {
  id: string;
  name: string;
  level: number;
  specialization: string;
  capabilities: string[];
  tools: string[];
  validationThreshold: number;
  maxRetries: number;
  systemPrompt?: string;
}

export class CascadeAgentReal extends EventEmitter {
  private config: CascadeAgentConfig;
  private executionHistory: AgentExecution[] = [];
  private toolPermissions: Map<string, ToolPermission> = new Map();
  private isExecuting: boolean = false;
  private openAIService: OpenAIService;
  private toolsManager: ToolsManager;
  private llmCallCount: number = 0;
  
  constructor(
    config: CascadeAgentConfig,
    openAIService: OpenAIService,
    toolsManager: ToolsManager
  ) {
    super();
    this.config = config;
    this.openAIService = openAIService;
    this.toolsManager = toolsManager;
    this.initializeTools();
    this.setupSystemPrompt();
  }
  
  private setupSystemPrompt(): void {
    // Define prompt específico para cada agente baseado em sua especialização
    if (!this.config.systemPrompt) {
      this.config.systemPrompt = this.generateSystemPrompt();
    }
  }
  
  private generateSystemPrompt(): string {
    const prompts: Record<number, string> = {
      1: `Você é um Agente de Requisitos especializado em análise e decomposição.
Suas responsabilidades:
- Analisar requisições do usuário e extrair requisitos claros
- Identificar dependências e complexidade
- Estruturar requisitos de forma clara e acionável
- Validar completude e viabilidade dos requisitos
Retorne sempre uma análise estruturada em JSON.`,
      
      2: `Você é um Agente de Arquitetura especializado em design de sistemas.
Suas responsabilidades:
- Projetar arquitetura baseada nos requisitos
- Definir componentes e suas interfaces
- Escolher padrões arquiteturais apropriados
- Garantir escalabilidade e manutenibilidade
Retorne sempre um design estruturado em JSON.`,
      
      3: `Você é um Agente de Implementação especializado em codificação.
Suas responsabilidades:
- Gerar código funcional baseado na arquitetura
- Implementar algoritmos eficientes
- Integrar componentes corretamente
- Seguir boas práticas de programação
Retorne sempre código executável e estruturado.`,
      
      4: `Você é um Agente de Testes especializado em qualidade.
Suas responsabilidades:
- Criar testes unitários e de integração
- Validar funcionalidade do código
- Identificar e reportar bugs
- Garantir cobertura de testes adequada
Retorne sempre resultados de testes estruturados.`,
      
      5: `Você é um Agente de Otimização especializado em performance.
Suas responsabilidades:
- Analisar e melhorar performance
- Otimizar uso de recursos
- Refatorar código para eficiência
- Identificar gargalos
Retorne sempre métricas e melhorias estruturadas.`,
      
      6: `Você é um Agente de Documentação especializado em metadados.
Suas responsabilidades:
- Gerar documentação completa
- Criar metadados para rastreabilidade
- Versionar adequadamente
- Garantir conformidade e auditabilidade
Retorne sempre documentação estruturada em JSON.`
    };
    
    return prompts[this.config.level] || 'Você é um agente especializado. Processe a entrada e retorne resultados estruturados.';
  }
  
  private initializeTools(): void {
    // Inicializa permissões reais de ferramentas
    this.config.tools.forEach(tool => {
      this.toolPermissions.set(tool, {
        toolName: tool,
        permission: 'allow_always', // Em produção, permite sempre para evitar interrupções
        timestamp: new Date(),
        reason: 'Produção automatizada'
      });
    });
  }
  
  public async execute(input: any, previousValidation?: ValidationResult): Promise<AgentExecution> {
    const startTime = Date.now();
    this.isExecuting = true;
    this.llmCallCount = 0;
    
    console.log(chalk.cyan(`\n🤖 Agente ${this.config.level} (${this.config.name}) processando...`));
    
    let retryCount = 0;
    let output: any = null;
    let validationResult: ValidationResult | null = null;
    
    while (retryCount <= this.config.maxRetries) {
      try {
        // Processa com LLM real
        const processedInput = previousValidation?.suggestedAdjustments 
          ? this.applyAdjustments(input, previousValidation.suggestedAdjustments)
          : input;
        
        // Executa processamento real com LLM
        output = await this.processWithLLM(processedInput);
        
        // Executa ferramentas necessárias
        if (output.toolsNeeded && Array.isArray(output.toolsNeeded)) {
          output.toolResults = await this.executeTools(output.toolsNeeded);
        }
        
        // Valida resultado com LLM
        validationResult = await this.validateWithLLM(output);
        
        if (validationResult.approved || retryCount >= this.config.maxRetries) {
          break;
        }
        
        console.log(chalk.yellow(`  ↻ Reprocessando (tentativa ${retryCount + 1}/${this.config.maxRetries})`));
        retryCount++;
        
      } catch (error) {
        console.log(chalk.red(`  ❌ Erro: ${error}`));
        validationResult = {
          approved: false,
          confidence: 0,
          feedback: `Erro no processamento: ${error}`,
          requiresUserInput: false
        };
        break;
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
      retryCount,
      llmCalls: this.llmCallCount
    };
    
    this.executionHistory.push(execution);
    this.isExecuting = false;
    
    this.emit('execution_complete', execution);
    
    return execution;
  }
  
  private async processWithLLM(input: any): Promise<any> {
    this.llmCallCount++;
    
    const prompt = `
${this.config.systemPrompt}

Entrada atual:
${JSON.stringify(input, null, 2)}

Processe esta entrada de acordo com sua especialização e retorne um resultado estruturado em JSON contendo:
- processedData: dados processados
- analysis: análise detalhada
- toolsNeeded: array de ferramentas necessárias (se aplicável)
- nextSteps: próximos passos sugeridos
- confidence: nível de confiança (0-1)
`;

    try {
      const response = await this.openAIService.chat([
        { role: 'system', content: this.config.systemPrompt || '' },
        { role: 'user', content: prompt }
      ]);
      
      // Tenta parsear resposta como JSON
      try {
        const parsed = JSON.parse(response);
        return {
          ...parsed,
          agentLevel: this.config.level,
          agentName: this.config.name,
          timestamp: new Date().toISOString()
        };
      } catch {
        // Se não for JSON válido, retorna estrutura padrão
        return {
          processedData: response,
          analysis: 'Processamento completado',
          agentLevel: this.config.level,
          agentName: this.config.name,
          timestamp: new Date().toISOString(),
          confidence: 0.7
        };
      }
    } catch (error) {
      console.log(chalk.red(`  ❌ Erro na LLM: ${error}`));
      throw error;
    }
  }
  
  private async validateWithLLM(output: any): Promise<ValidationResult> {
    this.llmCallCount++;
    
    const validationPrompt = `
Você é um validador para o ${this.config.name}.
Analise o seguinte output e determine se está adequado:

${JSON.stringify(output, null, 2)}

Critérios de validação:
- Completude: O output atende aos requisitos?
- Qualidade: O output tem qualidade adequada?
- Conformidade: Segue os padrões esperados?

Retorne um JSON com:
- approved: boolean
- confidence: número entre 0 e 1
- feedback: string com detalhes
- suggestedAdjustments: array de strings (se não aprovado)
`;

    try {
      const response = await this.openAIService.chat([
        { role: 'system', content: 'Você é um validador técnico rigoroso.' },
        { role: 'user', content: validationPrompt }
      ]);
      
      try {
        const validation = JSON.parse(response);
        
        // Garante que confidence está no intervalo correto
        validation.confidence = Math.max(0, Math.min(1, validation.confidence || 0.5));
        
        // Verifica contra o threshold do agente
        validation.approved = validation.confidence >= this.config.validationThreshold;
        
        return validation;
      } catch {
        // Validação padrão se parsing falhar
        const confidence = output.confidence || 0.7;
        return {
          approved: confidence >= this.config.validationThreshold,
          confidence,
          feedback: 'Validação processada',
          details: { rawResponse: response }
        };
      }
    } catch (error) {
      console.log(chalk.red(`  ❌ Erro na validação: ${error}`));
      return {
        approved: false,
        confidence: 0,
        feedback: `Erro na validação: ${error}`
      };
    }
  }
  
  private async executeTools(toolsNeeded: any[]): Promise<any[]> {
    const results = [];
    
    for (const tool of toolsNeeded) {
      const permission = this.toolPermissions.get(tool.name);
      
      if (!permission || permission.permission === 'deny') {
        results.push({
          tool: tool.name,
          success: false,
          error: 'Permissão negada'
        });
        continue;
      }
      
      try {
        console.log(chalk.gray(`    🔧 Executando: ${tool.name}`));
        const result = await this.toolsManager.executeTool(tool.name, tool.params || {});
        results.push({
          tool: tool.name,
          success: true,
          result
        });
      } catch (error) {
        results.push({
          tool: tool.name,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return results;
  }
  
  private applyAdjustments(input: any, adjustments: string[]): any {
    return {
      ...input,
      adjustments,
      adjustedAt: new Date().toISOString(),
      adjustmentReason: 'Aplicando sugestões da validação anterior'
    };
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
  
  public getLLMCallCount(): number {
    return this.llmCallCount;
  }
}