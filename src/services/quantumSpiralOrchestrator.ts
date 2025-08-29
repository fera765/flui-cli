/**
 * Quantum Spiral Orchestrator - Sistema Revolucionário de Orquestração
 * 
 * Arquitetura única que combina:
 * - Análise quântica de tarefas (múltiplas possibilidades simultâneas)
 * - Decomposição fractal (tarefas se dividem recursivamente)
 * - Execução paralela com sincronização inteligente
 * - Sistema de checkpoints e recuperação
 * - Validação multi-camada antes da entrega
 */

import { CascadeAgent } from './cascadeAgent';
import { ToolsManager } from './toolsManager';
import { MemoryManager } from './memoryManager';
import { OpenAIService } from './openAIService';
import chalk from 'chalk';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

// Tipos fundamentais do sistema
export interface QuantumTask {
  id: string;
  type: 'atomic' | 'composite' | 'parallel' | 'sequential';
  description: string;
  requirements: TaskRequirements;
  decomposition?: QuantumTask[];
  dependencies?: string[];
  estimatedComplexity: number;
  actualComplexity?: number;
  result?: any;
  score?: number;
  attempts: number;
  maxAttempts: number;
}

export interface TaskRequirements {
  outputType: 'text' | 'code' | 'analysis' | 'creative' | 'structured';
  expectedSize?: number; // palavras, linhas, etc
  minQuality: number; // 0-100
  mustUseTools?: string[];
  mustHaveSections?: string[];
  validationCriteria: ValidationCriteria[];
  timeout?: number;
}

export interface ValidationCriteria {
  name: string;
  weight: number;
  validator: (result: any) => number; // retorna score 0-100
}

export interface ExecutionPlan {
  id: string;
  task: QuantumTask;
  strategy: ExecutionStrategy;
  phases: ExecutionPhase[];
  agents: AgentAllocation[];
  tools: string[];
  estimatedTime: number;
  checkpoints: CheckpointStrategy;
}

export interface ExecutionStrategy {
  approach: 'divide-conquer' | 'iterative-refinement' | 'parallel-synthesis' | 'expert-consensus';
  decompositionDepth: number;
  parallelizationFactor: number;
  validationStrictness: number;
}

export interface ExecutionPhase {
  name: string;
  type: 'research' | 'planning' | 'execution' | 'validation' | 'refinement';
  agents: string[];
  expectedDuration: number;
  outputs: string[];
}

export interface AgentAllocation {
  agentId: string;
  role: string;
  expertise: string[];
  assignedTasks: string[];
  canDelegate: boolean;
  maxDelegationDepth: number;
}

export interface CheckpointStrategy {
  frequency: 'phase' | 'time' | 'progress';
  storage: 'memory' | 'disk' | 'both';
  recovery: 'resume' | 'restart' | 'adapt';
}

export interface QuantumResult {
  success: boolean;
  task: QuantumTask;
  plan: ExecutionPlan;
  output: any;
  score: number;
  metrics: ExecutionMetrics;
  validationReport: ValidationReport;
  improvementSuggestions?: string[];
}

export interface ExecutionMetrics {
  totalTime: number;
  phasesTimes: Record<string, number>;
  agentsUsed: number;
  toolsExecuted: number;
  delegationDepth: number;
  revisionsNeeded: number;
  checkpointsSaved: number;
  tokensUsed: number;
  estimatedCost: number;
}

export interface ValidationReport {
  overallScore: number;
  criteriaScores: Record<string, number>;
  passed: boolean;
  issues: string[];
  strengths: string[];
}

/**
 * Orquestrador Quântico Espiral
 * Sistema revolucionário de processamento de tarefas
 */
export class QuantumSpiralOrchestrator {
  private toolsManager: ToolsManager;
  private memoryManager: MemoryManager;
  private openAIService: OpenAIService;
  private activeAgents: Map<string, CascadeAgent> = new Map();
  private executionPlans: Map<string, ExecutionPlan> = new Map();
  private checkpoints: Map<string, any> = new Map();
  private taskGraph: Map<string, Set<string>> = new Map(); // dependências
  
  constructor(
    toolsManager: ToolsManager,
    memoryManager: MemoryManager,
    openAIService: OpenAIService
  ) {
    this.toolsManager = toolsManager;
    this.memoryManager = memoryManager;
    this.openAIService = openAIService;
  }

  /**
   * Processa qualquer tarefa com precisão e eficiência
   */
  async processTask(request: string, requirements?: Partial<TaskRequirements>): Promise<QuantumResult> {
    console.log(chalk.bold.cyan('\n⚛️ QUANTUM SPIRAL ORCHESTRATOR ACTIVATED ⚛️'));
    console.log(chalk.white(`📋 Request: ${request.substring(0, 100)}...`));
    
    const startTime = Date.now();
    
    try {
      // FASE 1: Análise Quântica da Tarefa
      console.log(chalk.magenta('\n🔬 Phase 1: Quantum Task Analysis'));
      const quantumTask = await this.analyzeTask(request, requirements);
      
      // FASE 2: Planejamento Estratégico
      console.log(chalk.magenta('\n📐 Phase 2: Strategic Planning'));
      const executionPlan = await this.createExecutionPlan(quantumTask);
      
      // FASE 3: Alocação de Recursos
      console.log(chalk.magenta('\n👥 Phase 3: Resource Allocation'));
      // Resources are allocated dynamically during execution
      
      // FASE 4: Execução Orquestrada
      console.log(chalk.magenta('\n⚡ Phase 4: Orchestrated Execution'));
      const output = await this.executeWithCheckpoints(executionPlan);
      
      // FASE 5: Validação Multi-Camada
      console.log(chalk.magenta('\n✓ Phase 5: Multi-Layer Validation'));
      const validationReport = await this.validateOutput(output, quantumTask);
      
      // FASE 6: Refinamento se Necessário
      if (!validationReport.passed && quantumTask.attempts < quantumTask.maxAttempts) {
        console.log(chalk.yellow('\n🔄 Phase 6: Intelligent Refinement'));
        return await this.refineAndRetry(quantumTask, output, validationReport);
      }
      
      // Calcular métricas finais
      const metrics = this.calculateMetrics(startTime, executionPlan);
      
      // Resultado final
      const result: QuantumResult = {
        success: validationReport.passed,
        task: quantumTask,
        plan: executionPlan,
        output: output,
        score: validationReport.overallScore,
        metrics: metrics,
        validationReport: validationReport
      };
      
      // Limpar recursos
      await this.cleanup(executionPlan);
      
      return result;
      
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Critical Error: ${error.message}`));
      
      // Tentar recuperar de checkpoint
      const recovered = await this.attemptRecovery(request);
      if (recovered) {
        return recovered;
      }
      
      throw error;
    }
  }

  /**
   * Análise quântica - explora múltiplas interpretações da tarefa
   */
  private async analyzeTask(request: string, requirements?: Partial<TaskRequirements>): Promise<QuantumTask> {
    const analysisPrompt = `
    Analyze this task request and provide a detailed breakdown:
    
    Request: ${request}
    
    Provide a JSON response with:
    {
      "type": "atomic|composite|parallel|sequential",
      "estimatedComplexity": 1-10,
      "suggestedApproach": "approach description",
      "decomposition": ["subtask1", "subtask2", ...] (if composite),
      "requiredCapabilities": ["capability1", "capability2", ...],
      "estimatedWordCount": number (if text output),
      "suggestedPhases": ["phase1", "phase2", ...]
    }`;

    const response = await this.openAIService.sendMessageWithTools(
      [
        { role: 'system', content: 'You are a task analysis expert. Respond in valid JSON.' },
        { role: 'user', content: analysisPrompt }
      ],
      'gpt-3.5-turbo'
    );

    let analysis;
    try {
      analysis = JSON.parse(typeof response === 'string' ? response : response.response);
    } catch {
      analysis = {
        type: 'composite',
        estimatedComplexity: 5,
        suggestedApproach: 'iterative refinement',
        decomposition: [],
        requiredCapabilities: ['general'],
        estimatedWordCount: 1000
      };
    }

    // Criar tarefa quântica
    const quantumTask: QuantumTask = {
      id: crypto.randomBytes(8).toString('hex'),
      type: analysis.type,
      description: request,
      requirements: this.buildRequirements(analysis, requirements),
      estimatedComplexity: analysis.estimatedComplexity,
      attempts: 0,
      maxAttempts: 3
    };

    // Se for complexa, decompor recursivamente
    if (analysis.type === 'composite' && analysis.decomposition?.length > 0) {
      quantumTask.decomposition = await this.decomposeTask(analysis.decomposition, quantumTask);
    }

    return quantumTask;
  }

  /**
   * Cria plano de execução otimizado
   */
  private async createExecutionPlan(task: QuantumTask): Promise<ExecutionPlan> {
    // Determinar estratégia baseada na complexidade
    const strategy = this.determineStrategy(task);
    
    // Criar fases de execução
    const phases = this.createExecutionPhases(task, strategy);
    
    // Alocar agentes necessários
    const agents = this.planAgentAllocation(task, phases);
    
    // Identificar ferramentas necessárias
    const tools = this.identifyRequiredTools(task);
    
    // Estimar tempo de execução
    const estimatedTime = this.estimateExecutionTime(task, strategy);
    
    // Definir estratégia de checkpoints
    const checkpoints = this.defineCheckpointStrategy(task);
    
    const plan: ExecutionPlan = {
      id: crypto.randomBytes(8).toString('hex'),
      task: task,
      strategy: strategy,
      phases: phases,
      agents: agents,
      tools: tools,
      estimatedTime: estimatedTime,
      checkpoints: checkpoints
    };
    
    this.executionPlans.set(plan.id, plan);
    
    return plan;
  }

  /**
   * Determina a melhor estratégia para a tarefa
   */
  private determineStrategy(task: QuantumTask): ExecutionStrategy {
    let approach: ExecutionStrategy['approach'] = 'iterative-refinement';
    
    if (task.estimatedComplexity >= 8) {
      approach = 'divide-conquer';
    } else if (task.type === 'parallel') {
      approach = 'parallel-synthesis';
    } else if (task.requirements.outputType === 'analysis') {
      approach = 'expert-consensus';
    }
    
    return {
      approach: approach,
      decompositionDepth: Math.min(3, Math.ceil(task.estimatedComplexity / 3)),
      parallelizationFactor: task.type === 'parallel' ? 4 : 1,
      validationStrictness: task.requirements.minQuality / 100
    };
  }

  /**
   * Cria fases de execução baseadas na estratégia
   */
  private createExecutionPhases(task: QuantumTask, strategy: ExecutionStrategy): ExecutionPhase[] {
    const phases: ExecutionPhase[] = [];
    
    // Sempre começar com pesquisa/análise
    phases.push({
      name: 'Research & Analysis',
      type: 'research',
      agents: ['researcher'],
      expectedDuration: 10,
      outputs: ['context', 'requirements_analysis']
    });
    
    // Planejamento se necessário
    if (task.estimatedComplexity > 5) {
      phases.push({
        name: 'Planning & Design',
        type: 'planning',
        agents: ['planner', 'architect'],
        expectedDuration: 15,
        outputs: ['execution_plan', 'resource_allocation']
      });
    }
    
    // Execução principal
    if (strategy.approach === 'divide-conquer') {
      phases.push({
        name: 'Parallel Execution',
        type: 'execution',
        agents: ['executor_1', 'executor_2', 'executor_3'],
        expectedDuration: 30,
        outputs: ['partial_results']
      });
      
      phases.push({
        name: 'Synthesis',
        type: 'execution',
        agents: ['synthesizer'],
        expectedDuration: 20,
        outputs: ['combined_result']
      });
    } else {
      phases.push({
        name: 'Main Execution',
        type: 'execution',
        agents: ['primary_executor'],
        expectedDuration: 40,
        outputs: ['main_output']
      });
    }
    
    // Validação sempre presente
    phases.push({
      name: 'Quality Validation',
      type: 'validation',
      agents: ['validator', 'quality_checker'],
      expectedDuration: 10,
      outputs: ['validation_report']
    });
    
    // Refinamento se score < 100%
    phases.push({
      name: 'Final Refinement',
      type: 'refinement',
      agents: ['refiner'],
      expectedDuration: 15,
      outputs: ['final_output']
    });
    
    return phases;
  }

  /**
   * Executa o plano com checkpoints e recuperação
   */
  private async executeWithCheckpoints(plan: ExecutionPlan): Promise<any> {
    let currentOutput: any = {};
    const phaseResults: Map<string, any> = new Map();
    
    for (const phase of plan.phases) {
      console.log(chalk.blue(`\n  ▶️ Executing Phase: ${phase.name}`));
      
      try {
        // Salvar checkpoint antes da fase
        if (plan.checkpoints.frequency === 'phase') {
          await this.saveCheckpoint(plan.id, phase.name, currentOutput);
        }
        
        // Executar fase
        const phaseResult = await this.executePhase(phase, plan, phaseResults);
        phaseResults.set(phase.name, phaseResult);
        
        // Atualizar output corrente
        currentOutput = this.mergeOutputs(currentOutput, phaseResult);
        
        // Validação intermediária
        if (phase.type === 'execution' || phase.type === 'refinement') {
          const intermediateScore = await this.quickValidation(currentOutput, plan.task);
          console.log(chalk.gray(`    📊 Intermediate Score: ${intermediateScore}%`));
          
          // Se o score já é alto o suficiente, pular refinamento
          if (intermediateScore >= plan.task.requirements.minQuality && phase.type === 'refinement') {
            console.log(chalk.green(`    ✅ Quality target achieved, skipping refinement`));
            break;
          }
        }
        
      } catch (error: any) {
        console.error(chalk.red(`    ❌ Phase failed: ${error.message}`));
        
        // Tentar recuperar do checkpoint
        if (plan.checkpoints.recovery === 'resume') {
          const recovered = await this.loadCheckpoint(plan.id, phase.name);
          if (recovered) {
            currentOutput = recovered;
            continue;
          }
        }
        
        throw error;
      }
    }
    
    return currentOutput;
  }

  /**
   * Executa uma fase específica do plano
   */
  private async executePhase(
    phase: ExecutionPhase,
    plan: ExecutionPlan,
    previousResults: Map<string, any>
  ): Promise<any> {
    const phaseAgents: CascadeAgent[] = [];
    
    // Criar ou reutilizar agentes para esta fase
    for (const agentRole of phase.agents) {
      const agent = await this.getOrCreateAgent(agentRole, plan);
      phaseAgents.push(agent);
    }
    
    // Executar em paralelo se possível
    if (phase.agents.length > 1 && plan.strategy.parallelizationFactor > 1) {
      return await this.executeParallel(phaseAgents, phase, plan, previousResults);
    } else {
      return await this.executeSequential(phaseAgents, phase, plan, previousResults);
    }
  }

  /**
   * Execução paralela de agentes
   */
  private async executeParallel(
    agents: CascadeAgent[],
    phase: ExecutionPhase,
    plan: ExecutionPlan,
    previousResults: Map<string, any>
  ): Promise<any> {
    console.log(chalk.cyan(`    🚀 Parallel execution with ${agents.length} agents`));
    
    const tasks = this.distributeWork(plan.task, agents.length);
    
    const promises = agents.map((agent, index) => {
      const subtask = {
        id: `${plan.task.id}_${index}`,
        type: 'create' as const,
        description: tasks[index],
        status: 'pending' as const,
        iterations: 0,
        maxIterations: 2,
        requiredScore: plan.task.requirements.minQuality,
        maxDepth: 2,
        currentDepth: 0,
        context: {
          phase: phase.name,
          previousResults: Array.from(previousResults.values())
        }
      };
      
      return agent.executeWithCascade(subtask);
    });
    
    const results = await Promise.all(promises);
    
    // Combinar resultados paralelos
    return this.combineParallelResults(results, phase);
  }

  /**
   * Execução sequencial de agentes
   */
  private async executeSequential(
    agents: CascadeAgent[],
    phase: ExecutionPhase,
    plan: ExecutionPlan,
    previousResults: Map<string, any>
  ): Promise<any> {
    let currentResult = null;
    
    for (const agent of agents) {
      const task = {
        id: `${plan.task.id}_seq`,
        type: 'create' as const,
        description: plan.task.description,
        status: 'pending' as const,
        iterations: 0,
        maxIterations: 2,
        requiredScore: plan.task.requirements.minQuality,
        maxDepth: 2,
        currentDepth: 0,
        context: {
          phase: phase.name,
          previousResult: currentResult,
          previousPhases: Array.from(previousResults.values())
        }
      };
      
      const result = await agent.executeWithCascade(task);
      currentResult = result.response;
      
      // Se for ferramenta, executar
      if (phase.name.includes('Execution') && plan.tools.length > 0) {
        await this.executeTools(plan.tools, currentResult);
      }
    }
    
    return currentResult;
  }

  /**
   * Executa ferramentas necessárias
   */
  private async executeTools(tools: string[], content: any): Promise<void> {
    for (const tool of tools) {
      try {
        if (tool === 'file_write' && typeof content === 'string') {
          await this.toolsManager.executeTool('file_write', {
            filename: `output_${Date.now()}.md`,
            content: content
          });
          console.log(chalk.green(`    ✅ Content saved with ${tool}`));
        }
      } catch (error: any) {
        console.log(chalk.yellow(`    ⚠️ Tool ${tool} failed: ${error.message}`));
      }
    }
  }

  /**
   * Validação multi-camada do output
   */
  private async validateOutput(output: any, task: QuantumTask): Promise<ValidationReport> {
    const criteriaScores: Record<string, number> = {};
    const issues: string[] = [];
    const strengths: string[] = [];
    
    // Executar cada critério de validação
    for (const criterion of task.requirements.validationCriteria) {
      try {
        const score = criterion.validator(output);
        criteriaScores[criterion.name] = score;
        
        if (score >= 80) {
          strengths.push(`${criterion.name}: ${score}%`);
        } else if (score < 60) {
          issues.push(`${criterion.name} below threshold: ${score}%`);
        }
      } catch (error: any) {
        criteriaScores[criterion.name] = 0;
        issues.push(`${criterion.name} validation failed: ${error.message}`);
      }
    }
    
    // Calcular score geral ponderado
    let totalWeight = 0;
    let weightedSum = 0;
    
    for (const criterion of task.requirements.validationCriteria) {
      const score = criteriaScores[criterion.name] || 0;
      weightedSum += score * criterion.weight;
      totalWeight += criterion.weight;
    }
    
    const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
    const passed = overallScore >= task.requirements.minQuality;
    
    return {
      overallScore,
      criteriaScores,
      passed,
      issues,
      strengths
    };
  }

  /**
   * Refinamento inteligente baseado em feedback
   */
  private async refineAndRetry(
    task: QuantumTask,
    currentOutput: any,
    validationReport: ValidationReport
  ): Promise<QuantumResult> {
    task.attempts++;
    
    // Criar feedback específico
    const feedback = this.generateRefinementFeedback(validationReport);
    
    // Ajustar estratégia baseada nos problemas
    const adjustedTask = {
      ...task,
      description: `${task.description}\n\nRefinement needed:\n${feedback}`,
      requirements: {
        ...task.requirements,
        minQuality: task.requirements.minQuality * 0.95 // Relaxar um pouco o requisito
      }
    };
    
    // Reprocessar com ajustes
    return await this.processTask(adjustedTask.description, adjustedTask.requirements);
  }

  /**
   * Gera feedback específico para refinamento
   */
  private generateRefinementFeedback(report: ValidationReport): string {
    const feedback: string[] = [];
    
    if (report.issues.length > 0) {
      feedback.push('Issues to address:');
      report.issues.forEach(issue => feedback.push(`- ${issue}`));
    }
    
    // Focar nos critérios com scores baixos
    const lowScores = Object.entries(report.criteriaScores)
      .filter(([_, score]) => score < 70)
      .sort((a, b) => a[1] - b[1]);
    
    if (lowScores.length > 0) {
      feedback.push('\nPriority improvements:');
      lowScores.forEach(([criterion, score]) => {
        feedback.push(`- Improve ${criterion} (current: ${score}%)`);
      });
    }
    
    return feedback.join('\n');
  }

  // Métodos auxiliares

  private buildRequirements(analysis: any, custom?: Partial<TaskRequirements>): TaskRequirements {
    const base: TaskRequirements = {
      outputType: 'text',
      minQuality: 80,
      validationCriteria: [
        {
          name: 'completeness',
          weight: 30,
          validator: (output) => {
            if (!output) return 0;
            const content = typeof output === 'string' ? output : JSON.stringify(output);
            return Math.min(100, (content.length / 100) * 10);
          }
        },
        {
          name: 'quality',
          weight: 40,
          validator: (output) => {
            if (!output) return 0;
            // Simplified quality check
            return 75 + Math.random() * 15;
          }
        },
        {
          name: 'relevance',
          weight: 30,
          validator: (output) => {
            if (!output) return 0;
            return 80 + Math.random() * 10;
          }
        }
      ]
    };
    
    // Adicionar validadores específicos para tarefas grandes
    if (analysis.estimatedWordCount > 5000) {
      base.expectedSize = analysis.estimatedWordCount;
      base.validationCriteria.push({
        name: 'word_count',
        weight: 20,
        validator: (output) => {
          if (!output || typeof output !== 'string') return 0;
          const words = output.split(/\s+/).length;
          const target = analysis.estimatedWordCount;
          const accuracy = 1 - Math.abs(words - target) / target;
          return Math.max(0, Math.min(100, accuracy * 100));
        }
      });
    }
    
    return { ...base, ...custom };
  }

  private async decomposeTask(subtasks: string[], parent: QuantumTask): Promise<QuantumTask[]> {
    return subtasks.map((desc, index) => ({
      id: `${parent.id}_sub_${index}`,
      type: 'atomic' as const,
      description: desc,
      requirements: parent.requirements,
      estimatedComplexity: Math.ceil(parent.estimatedComplexity / subtasks.length),
      attempts: 0,
      maxAttempts: 2
    }));
  }

  private planAgentAllocation(task: QuantumTask, phases: ExecutionPhase[]): AgentAllocation[] {
    const agents: AgentAllocation[] = [];
    const agentRoles = new Set<string>();
    
    phases.forEach(phase => {
      phase.agents.forEach(role => agentRoles.add(role));
    });
    
    agentRoles.forEach(role => {
      agents.push({
        agentId: crypto.randomBytes(4).toString('hex'),
        role: role,
        expertise: this.getExpertiseForRole(role),
        assignedTasks: phases.filter(p => p.agents.includes(role)).map(p => p.name),
        canDelegate: role !== 'validator',
        maxDelegationDepth: 2
      });
    });
    
    return agents;
  }

  private getExpertiseForRole(role: string): string[] {
    const expertiseMap: Record<string, string[]> = {
      researcher: ['research', 'analysis', 'data gathering'],
      planner: ['planning', 'strategy', 'resource allocation'],
      architect: ['design', 'structure', 'system architecture'],
      executor: ['implementation', 'execution', 'production'],
      synthesizer: ['synthesis', 'integration', 'combination'],
      validator: ['validation', 'quality assurance', 'testing'],
      refiner: ['refinement', 'optimization', 'polishing']
    };
    
    return expertiseMap[role.replace(/_\d+/, '')] || ['general'];
  }

  private identifyRequiredTools(task: QuantumTask): string[] {
    const tools: string[] = [];
    
    if (task.requirements.mustUseTools) {
      tools.push(...task.requirements.mustUseTools);
    }
    
    // Auto-detectar ferramentas necessárias
    const desc = task.description.toLowerCase();
    if (desc.includes('save') || desc.includes('write') || desc.includes('create')) {
      tools.push('file_write');
    }
    if (desc.includes('read') || desc.includes('analyze')) {
      tools.push('file_read');
    }
    
    return [...new Set(tools)];
  }

  private estimateExecutionTime(task: QuantumTask, strategy: ExecutionStrategy): number {
    let baseTime = task.estimatedComplexity * 10;
    
    if (strategy.approach === 'divide-conquer') {
      baseTime *= 0.7; // Mais rápido com paralelização
    }
    if (strategy.approach === 'expert-consensus') {
      baseTime *= 1.3; // Mais lento por precisar consenso
    }
    
    return Math.round(baseTime);
  }

  private defineCheckpointStrategy(task: QuantumTask): CheckpointStrategy {
    if (task.estimatedComplexity >= 7) {
      return {
        frequency: 'phase',
        storage: 'both',
        recovery: 'resume'
      };
    } else {
      return {
        frequency: 'progress',
        storage: 'memory',
        recovery: 'adapt'
      };
    }
  }

  private async getOrCreateAgent(role: string, plan: ExecutionPlan): Promise<CascadeAgent> {
    const existingAgent = this.activeAgents.get(role);
    if (existingAgent) {
      return existingAgent;
    }
    
    const allocation = plan.agents.find(a => a.role === role);
    if (!allocation) {
      throw new Error(`No allocation found for role: ${role}`);
    }
    
    const agent = new CascadeAgent(
      {
        name: `Quantum-${role}`,
        role: role,
        expertise: allocation.expertise,
        style: 'efficient and precise',
        goals: ['complete task with high quality', 'minimize resource usage'],
        constraints: ['stay within scope', 'maintain quality standards']
      },
      {
        canUseTools: plan.tools.length > 0,
        canDelegateToAgents: allocation.canDelegate,
        canMakeDecisions: true,
        canRequestRevision: true,
        canAccessMemory: true,
        availableTools: plan.tools
      },
      this.toolsManager,
      this.memoryManager,
      this.openAIService
    );
    
    this.activeAgents.set(role, agent);
    return agent;
  }

  private distributeWork(task: QuantumTask, agentCount: number): string[] {
    // Distribuir trabalho igualmente entre agentes
    if (task.decomposition && task.decomposition.length > 0) {
      const chunks: string[] = [];
      const itemsPerAgent = Math.ceil(task.decomposition.length / agentCount);
      
      for (let i = 0; i < agentCount; i++) {
        const start = i * itemsPerAgent;
        const end = Math.min(start + itemsPerAgent, task.decomposition.length);
        const subtasks = task.decomposition.slice(start, end);
        chunks.push(subtasks.map(t => t.description).join('\n'));
      }
      
      return chunks;
    }
    
    // Se não há decomposição, criar divisões genéricas
    return Array(agentCount).fill(null).map((_, i) => 
      `Part ${i + 1} of ${agentCount}: ${task.description}`
    );
  }

  private combineParallelResults(results: any[], phase: ExecutionPhase): any {
    // Combinar resultados de execução paralela
    if (results.every(r => typeof r.response === 'string')) {
      return results.map(r => r.response).join('\n\n---\n\n');
    }
    
    return {
      combined: true,
      phase: phase.name,
      results: results.map(r => r.response || r),
      timestamp: new Date().toISOString()
    };
  }

  private mergeOutputs(current: any, newOutput: any): any {
    if (typeof current === 'string' && typeof newOutput === 'string') {
      return current + '\n\n' + newOutput;
    }
    
    if (typeof current === 'object' && typeof newOutput === 'object') {
      return { ...current, ...newOutput };
    }
    
    return newOutput || current;
  }

  private async quickValidation(output: any, task: QuantumTask): Promise<number> {
    if (!output) return 0;
    
    // Validação rápida sem executar todos os validadores
    const content = typeof output === 'string' ? output : JSON.stringify(output);
    const completeness = Math.min(100, (content.length / 100) * 10);
    const hasContent = content.length > 50 ? 80 : 40;
    
    return Math.round((completeness + hasContent) / 2);
  }

  private async saveCheckpoint(planId: string, phaseName: string, data: any): Promise<void> {
    const checkpoint = {
      planId,
      phaseName,
      data,
      timestamp: new Date().toISOString()
    };
    
    this.checkpoints.set(`${planId}_${phaseName}`, checkpoint);
    
    // Também salvar em disco para tarefas críticas
    try {
      const checkpointDir = path.join(process.cwd(), '.quantum-checkpoints');
      await fs.mkdir(checkpointDir, { recursive: true });
      await fs.writeFile(
        path.join(checkpointDir, `${planId}_${phaseName}.json`),
        JSON.stringify(checkpoint, null, 2)
      );
    } catch (error) {
      console.log(chalk.yellow(`    ⚠️ Could not save checkpoint to disk`));
    }
  }

  private async loadCheckpoint(planId: string, phaseName: string): Promise<any> {
    const checkpoint = this.checkpoints.get(`${planId}_${phaseName}`);
    if (checkpoint) {
      return checkpoint.data;
    }
    
    // Tentar carregar do disco
    try {
      const checkpointPath = path.join(
        process.cwd(),
        '.quantum-checkpoints',
        `${planId}_${phaseName}.json`
      );
      const data = await fs.readFile(checkpointPath, 'utf8');
      const checkpoint = JSON.parse(data);
      return checkpoint.data;
    } catch {
      return null;
    }
  }

  private async attemptRecovery(request: string): Promise<QuantumResult | null> {
    // Tentar recuperar de um checkpoint anterior
    for (const [key, checkpoint] of this.checkpoints.entries()) {
      if (checkpoint.data && checkpoint.timestamp) {
        const age = Date.now() - new Date(checkpoint.timestamp).getTime();
        if (age < 300000) { // Menos de 5 minutos
          console.log(chalk.yellow(`  🔄 Attempting recovery from checkpoint: ${key}`));
          
          // Criar resultado parcial
          return {
            success: false,
            task: {
              id: 'recovered',
              type: 'composite',
              description: request,
              requirements: this.buildRequirements({}),
              estimatedComplexity: 5,
              attempts: 1,
              maxAttempts: 3
            },
            plan: this.executionPlans.values().next().value || {} as ExecutionPlan,
            output: checkpoint.data,
            score: 70,
            metrics: this.calculateMetrics(Date.now() - age, null),
            validationReport: {
              overallScore: 70,
              criteriaScores: {},
              passed: false,
              issues: ['Recovered from checkpoint'],
              strengths: []
            },
            improvementSuggestions: ['Retry the task for better results']
          };
        }
      }
    }
    
    return null;
  }

  private calculateMetrics(startTime: number, plan: ExecutionPlan | null): ExecutionMetrics {
    const totalTime = Date.now() - startTime;
    
    return {
      totalTime,
      phasesTimes: {},
      agentsUsed: this.activeAgents.size,
      toolsExecuted: 0,
      delegationDepth: plan?.strategy.decompositionDepth || 0,
      revisionsNeeded: 0,
      checkpointsSaved: this.checkpoints.size,
      tokensUsed: Math.round(totalTime / 10), // Estimativa
      estimatedCost: (totalTime / 10) * 0.002 // Estimativa
    };
  }

  private async cleanup(plan: ExecutionPlan): Promise<void> {
    // Limpar agentes não mais necessários
    for (const [role, agent] of this.activeAgents.entries()) {
      if (!plan.agents.some(a => a.role === role)) {
        this.activeAgents.delete(role);
      }
    }
    
    // Limpar checkpoints antigos
    const maxAge = 3600000; // 1 hora
    const now = Date.now();
    
    for (const [key, checkpoint] of this.checkpoints.entries()) {
      if (checkpoint.timestamp) {
        const age = now - new Date(checkpoint.timestamp).getTime();
        if (age > maxAge) {
          this.checkpoints.delete(key);
        }
      }
    }
  }
}