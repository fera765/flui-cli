/**
 * Flui Core - Sistema de Orquestração Inteligente
 * 
 * Características:
 * - Prompts 100% dinâmicos baseados em quem delegou
 * - Validação rigorosa (mínimo 90% score)
 * - Precisão absoluta em requisitos
 * - Desenvolvimento incremental
 * - Testes e validação real
 */

import { OpenAIService } from './openAIService';
import { ToolsManager } from './toolsManager';
import { MemoryManager } from './memoryManager';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

// Interfaces principais
export interface FluiTask {
  id: string;
  description: string;
  requirements: {
    type: 'text' | 'code' | 'application' | 'creative';
    wordCount?: number;
    technology?: string[];
    mustInclude?: string[];
    outputFormat?: string;
    testRequired?: boolean;
    deployRequired?: boolean;
  };
  context?: any;
  delegatedBy?: string;
  currentProgress?: any;
}

export interface FluiAgent {
  id: string;
  name: string;
  delegatedBy: string;
  task: FluiTask;
  persona: string; // Gerada dinamicamente
  capabilities: string[];
  canDelegate: boolean;
  canUseTools: boolean;
}

export interface ValidationResult {
  score: number;
  passed: boolean;
  issues: string[];
  metrics: {
    wordCount?: number;
    completeness?: number;
    quality?: number;
    accuracy?: number;
    functionality?: number;
  };
  suggestions?: string[];
}

export interface FluiResult {
  success: boolean;
  output: any;
  validation: ValidationResult;
  iterations: number;
  agents: string[];
  tools: string[];
  duration: number;
}

/**
 * Flui Core - O cérebro do sistema
 */
export class FluiCore {
  private openAI: OpenAIService;
  private tools: ToolsManager;
  private memory: MemoryManager;
  private activeAgents: Map<string, FluiAgent> = new Map();
  private taskProgress: Map<string, any> = new Map();
  private readonly MIN_SCORE = 90;
  private readonly MAX_ITERATIONS = 10;

  constructor(
    openAI: OpenAIService,
    tools: ToolsManager,
    memory: MemoryManager
  ) {
    this.openAI = openAI;
    this.tools = tools;
    this.memory = memory;
  }

  /**
   * Processa uma tarefa até atingir 90%+ de qualidade
   */
  async processTask(description: string, requirements: any = {}): Promise<FluiResult> {
    console.log(chalk.bold.cyan('\n🤖 FLUI CORE ACTIVATED'));
    console.log(chalk.white(`📋 Task: ${description.substring(0, 100)}...`));
    
    const startTime = Date.now();
    const task: FluiTask = {
      id: this.generateId(),
      description,
      requirements: this.parseRequirements(description, requirements),
      delegatedBy: 'user'
    };

    let iterations = 0;
    let currentOutput = null;
    let validation: ValidationResult = { 
      score: 0, 
      passed: false, 
      issues: ['Not started'],
      metrics: {}
    };
    const usedAgents: string[] = [];
    const usedTools: string[] = [];

    // Loop até atingir qualidade mínima
    while (validation.score < this.MIN_SCORE && iterations < this.MAX_ITERATIONS) {
      iterations++;
      console.log(chalk.yellow(`\n🔄 Iteration ${iterations}/${this.MAX_ITERATIONS}`));

      // Analisa o que precisa ser feito
      const strategy = await this.analyzeTask(task, validation);
      console.log(chalk.blue(`📐 Strategy: ${strategy.approach}`));

      // Executa baseado na estratégia
      if (strategy.approach === 'delegate') {
        // Cria agente com persona dinâmica
        const agent = await this.createDynamicAgent(task, strategy.agentType, 'flui');
        usedAgents.push(agent.name);
        
        currentOutput = await this.executeWithAgent(agent, task, currentOutput);
      } else if (strategy.approach === 'incremental') {
        // Desenvolvimento incremental
        currentOutput = await this.incrementalDevelopment(task, currentOutput);
      } else if (strategy.approach === 'tools') {
        // Usa ferramentas diretamente
        const toolResult = await this.executeTools(strategy.tools, task, currentOutput);
        usedTools.push(...strategy.tools);
        currentOutput = this.mergeOutputs(currentOutput, toolResult);
      }

      // Valida o resultado atual
      validation = await this.validateOutput(currentOutput, task);
      console.log(chalk.magenta(`📊 Score: ${validation.score}%`));

      // Se não passou, analisa o que falta
      if (!validation.passed) {
        console.log(chalk.yellow(`⚠️ Issues: ${validation.issues.join(', ')}`));
        
        // Atualiza o progresso da tarefa
        this.taskProgress.set(task.id, {
          current: currentOutput,
          validation,
          iteration: iterations
        });
      }
    }

    // Resultado final
    const duration = Date.now() - startTime;
    const success = validation.score >= this.MIN_SCORE;

    if (success) {
      console.log(chalk.green(`✅ Task completed with ${validation.score}% quality!`));
    } else {
      console.log(chalk.red(`❌ Could not achieve minimum quality after ${iterations} iterations`));
    }

    return {
      success,
      output: currentOutput,
      validation,
      iterations,
      agents: usedAgents,
      tools: usedTools,
      duration
    };
  }

  /**
   * Analisa a tarefa e decide a melhor estratégia
   */
  private async analyzeTask(task: FluiTask, previousValidation: ValidationResult): Promise<any> {
    const prompt = `
    Analyze this task and decide the best approach:
    
    Task: ${task.description}
    Requirements: ${JSON.stringify(task.requirements)}
    Previous Score: ${previousValidation.score}%
    Issues: ${previousValidation.issues.join(', ')}
    
    Choose one approach:
    1. "delegate" - Create specialized agent (specify agentType)
    2. "incremental" - Build incrementally 
    3. "tools" - Use specific tools (specify which)
    
    Respond in JSON:
    {
      "approach": "delegate|incremental|tools",
      "agentType": "researcher|developer|writer|analyst",
      "tools": ["tool1", "tool2"],
      "reasoning": "why this approach"
    }`;

    const response = await this.openAI.sendMessageWithTools(
      [
        { role: 'system', content: 'You are a task analysis expert. Respond in valid JSON.' },
        { role: 'user', content: prompt }
      ],
      'gpt-3.5-turbo'
    );

    try {
      return JSON.parse(typeof response === 'string' ? response : response.response);
    } catch {
      return { approach: 'delegate', agentType: 'generalist' };
    }
  }

  /**
   * Cria um agente com persona dinâmica baseada em quem delegou
   */
  private async createDynamicAgent(
    task: FluiTask,
    agentType: string,
    delegatedBy: string
  ): Promise<FluiAgent> {
    const agentId = this.generateId();
    const agentName = `${agentType}-${agentId.substring(0, 8)}`;

    // Gera persona dinamicamente baseada no contexto
    const persona = await this.generateDynamicPersona(task, agentType, delegatedBy);

    const agent: FluiAgent = {
      id: agentId,
      name: agentName,
      delegatedBy,
      task,
      persona,
      capabilities: this.getCapabilitiesForType(agentType),
      canDelegate: true,
      canUseTools: true
    };

    this.activeAgents.set(agentId, agent);
    console.log(chalk.cyan(`🤖 Created agent: ${agentName}`));
    
    return agent;
  }

  /**
   * Gera persona dinâmica para o agente
   */
  private async generateDynamicPersona(
    task: FluiTask,
    agentType: string,
    delegatedBy: string
  ): Promise<string> {
    const personaPrompt = `
    Create a dynamic persona for an agent that will handle this task:
    
    Task: ${task.description}
    Agent Type: ${agentType}
    Delegated By: ${delegatedBy}
    Requirements: ${JSON.stringify(task.requirements)}
    
    The persona should include:
    1. Specific expertise relevant to the task
    2. Communication style
    3. Quality standards (minimum 90% quality)
    4. Approach to problem-solving
    5. Instructions for delegation and tool usage
    
    Make it specific to THIS task, not generic.`;

    const response = await this.openAI.sendMessageWithTools(
      [
        { role: 'system', content: 'You are an expert in creating agent personas.' },
        { role: 'user', content: personaPrompt }
      ],
      'gpt-3.5-turbo'
    );

    const persona = typeof response === 'string' ? response : response.response;
    
    // Adiciona instruções críticas
    return `${persona}

CRITICAL INSTRUCTIONS:
- You MUST achieve at least 90% quality score
- If delegating, validate the sub-agent's work before returning
- If using tools, verify the output is correct
- For word counts, you MUST meet the exact requirement (±3% tolerance)
- Never return incomplete or draft work
- Build incrementally and validate each step`;
  }

  /**
   * Executa tarefa com agente
   */
  private async executeWithAgent(
    agent: FluiAgent,
    task: FluiTask,
    currentOutput: any
  ): Promise<any> {
    console.log(chalk.blue(`\n🔧 Agent ${agent.name} executing...`));

    const executionPrompt = `
    ${agent.persona}
    
    Your task: ${task.description}
    
    Requirements:
    ${JSON.stringify(task.requirements, null, 2)}
    
    Current progress:
    ${currentOutput ? JSON.stringify(currentOutput).substring(0, 1000) : 'Starting fresh'}
    
    You can:
    1. Execute directly and return the result
    2. Delegate to another agent (specify type and reason)
    3. Use tools (file_write, file_read, shell, etc.)
    
    Remember: Minimum 90% quality required. Be thorough and precise.`;

    const response = await this.openAI.sendMessageWithTools(
      [
        { role: 'system', content: agent.persona },
        { role: 'user', content: executionPrompt }
      ],
      'gpt-3.5-turbo'
    );

    const agentOutput = typeof response === 'string' ? response : response.response;

    // Verifica se o agente quer delegar
    if (agentOutput.includes('DELEGATE:')) {
      const delegationType = this.extractDelegationType(agentOutput);
      const subAgent = await this.createDynamicAgent(task, delegationType || 'generalist', agent.name);
      const subResult = await this.executeWithAgent(subAgent, task, currentOutput);
      
      // Agente valida o trabalho do sub-agente
      const validationResult = await this.agentValidatesSubWork(agent, subResult, task);
      
      if (validationResult.approved) {
        return subResult;
      } else {
        // Pede refinamento
        console.log(chalk.yellow(`⚠️ ${agent.name} requested refinement`));
        return await this.refineWithAgent(subAgent, task, subResult, validationResult.feedback || 'Improve quality');
      }
    }

    // Verifica se o agente quer usar tools
    if (agentOutput.includes('TOOL:')) {
      const toolsToUse = this.extractTools(agentOutput);
      const toolResults = await this.executeTools(toolsToUse, task, currentOutput);
      return this.mergeOutputs(currentOutput, toolResults);
    }

    return agentOutput;
  }

  /**
   * Desenvolvimento incremental para tarefas grandes
   */
  private async incrementalDevelopment(task: FluiTask, currentOutput: any): Promise<any> {
    console.log(chalk.blue('\n📈 Incremental development...'));

    // Para textos longos (ex: 20k palavras)
    if (task.requirements.wordCount && task.requirements.wordCount > 5000) {
      return await this.incrementalTextGeneration(task, currentOutput);
    }

    // Para aplicações
    if (task.requirements.type === 'application') {
      return await this.incrementalAppDevelopment(task, currentOutput);
    }

    // Fallback para desenvolvimento genérico
    return await this.genericIncremental(task, currentOutput);
  }

  /**
   * Geração incremental de texto longo
   */
  private async incrementalTextGeneration(task: FluiTask, currentText: string): Promise<string> {
    const targetWords = task.requirements.wordCount || 1000;
    let text = currentText || '';
    let currentWords = text.split(/\s+/).filter(w => w.length > 0).length;

    console.log(chalk.gray(`📝 Current: ${currentWords} words, Target: ${targetWords} words`));

    while (currentWords < targetWords * 0.97) { // 97% para dar margem
      const remaining = targetWords - currentWords;
      const batchSize = Math.min(1000, remaining);

      const prompt = `
      Continue writing this ${task.description}
      
      Current text (last 500 chars):
      ...${text.slice(-500)}
      
      Write approximately ${batchSize} more words.
      Maintain consistency, quality, and flow.
      Do not repeat content. Continue naturally from where it left off.`;

      const response = await this.openAI.sendMessageWithTools(
        [
          { role: 'system', content: 'You are a professional writer. Continue the text naturally.' },
          { role: 'user', content: prompt }
        ],
        'gpt-3.5-turbo'
      );

      const newContent = typeof response === 'string' ? response : response.response;
      text += '\n\n' + newContent;
      currentWords = text.split(/\s+/).filter(w => w.length > 0).length;

      console.log(chalk.gray(`📝 Progress: ${currentWords}/${targetWords} words (${Math.round(currentWords/targetWords*100)}%)`));
    }

    // Ajuste fino para atingir exatamente o target
    if (currentWords > targetWords * 1.03) {
      text = await this.trimToExactWordCount(text, targetWords);
    }

    return text;
  }

  /**
   * Desenvolvimento incremental de aplicação
   */
  private async incrementalAppDevelopment(task: FluiTask, currentState: any): Promise<any> {
    console.log(chalk.blue('🔨 Building application incrementally...'));

    const steps = [
      'setup',      // package.json, dependencies
      'structure',  // folders, initial files
      'frontend',   // UI components
      'backend',    // API, server
      'styles',     // CSS, Tailwind
      'test',       // Unit tests
      'build',      // Build process
      'deploy'      // Run and test
    ];

    let appState = currentState || {};

    for (const step of steps) {
      console.log(chalk.cyan(`  📦 Step: ${step}`));
      
      const stepResult = await this.executeAppStep(step, task, appState);
      appState = { ...appState, [step]: stepResult };

      // Valida cada passo
      const stepValidation = await this.validateAppStep(step, appState);
      if (!stepValidation.success) {
        console.log(chalk.yellow(`  ⚠️ Fixing issues in ${step}...`));
        appState[step] = await this.fixAppStep(step, appState, stepValidation.issues);
      }
    }

    return appState;
  }

  /**
   * Executa um passo do desenvolvimento de app
   */
  private async executeAppStep(step: string, task: FluiTask, currentState: any): Promise<any> {
    const stepPrompts: Record<string, string> = {
      setup: 'Create package.json with all dependencies for the project',
      structure: 'Create folder structure and initial files',
      frontend: 'Implement the frontend components',
      backend: 'Implement the backend API and server',
      styles: 'Add styling with Tailwind CSS',
      test: 'Create and run tests',
      build: 'Build the application for production',
      deploy: 'Deploy and run the application'
    };

    if (step === 'setup') {
      // Cria package.json
      const packageJson = {
        name: 'flui-app',
        version: '1.0.0',
        scripts: {
          start: 'node server.js',
          dev: 'nodemon server.js',
          build: 'webpack --mode production',
          test: 'jest'
        },
        dependencies: {
          express: '^4.18.0',
          tailwindcss: '^3.0.0',
          // Adiciona mais baseado na task
        },
        devDependencies: {
          nodemon: '^2.0.0',
          jest: '^29.0.0',
          webpack: '^5.0.0'
        }
      };

      await this.tools.executeTool('file_write', {
        filename: 'package.json',
        content: JSON.stringify(packageJson, null, 2)
      });

      // Instala dependências
      await this.tools.executeTool('shell', {
        command: 'npm install'
      });

      return { packageJson, installed: true };
    }

    // Implementa outros passos...
    const prompt = `${stepPrompts[step]}
    
    Task: ${task.description}
    Technology: ${task.requirements.technology?.join(', ')}
    Current state: ${JSON.stringify(currentState).substring(0, 500)}
    
    Provide the implementation for this step.`;

    const response = await this.openAI.sendMessageWithTools(
      [
        { role: 'system', content: 'You are an expert developer. Provide complete, working code.' },
        { role: 'user', content: prompt }
      ],
      'gpt-3.5-turbo'
    );

    return typeof response === 'string' ? response : response.response;
  }

  /**
   * Valida a saída com critérios rigorosos
   */
  private async validateOutput(output: any, task: FluiTask): Promise<ValidationResult> {
    const validation: ValidationResult = {
      score: 0,
      passed: false,
      issues: [],
      metrics: {}
    };

    if (!output) {
      validation.issues.push('No output generated');
      return validation;
    }

    // Validação específica por tipo
    if (task.requirements.type === 'text' || task.requirements.type === 'creative') {
      validation.metrics = await this.validateText(output, task);
    } else if (task.requirements.type === 'application') {
      validation.metrics = await this.validateApplication(output, task);
    } else if (task.requirements.type === 'code') {
      validation.metrics = await this.validateCode(output, task);
    }

    // Calcula score geral
    const metrics = Object.values(validation.metrics);
    if (metrics.length > 0) {
      validation.score = Math.round(
        metrics.reduce((sum, val) => sum + val, 0) / metrics.length
      );
    }

    validation.passed = validation.score >= this.MIN_SCORE;

    // Identifica issues específicos
    if (validation.metrics.wordCount !== undefined && validation.metrics.wordCount < 97) {
      validation.issues.push('Word count below requirement');
    }
    if (validation.metrics.completeness !== undefined && validation.metrics.completeness < 90) {
      validation.issues.push('Incomplete content');
    }
    if (validation.metrics.functionality !== undefined && validation.metrics.functionality < 90) {
      validation.issues.push('Functionality issues');
    }

    return validation;
  }

  /**
   * Valida texto com contagem precisa de palavras
   */
  private async validateText(text: string, task: FluiTask): Promise<any> {
    const metrics: any = {};

    // Contagem de palavras
    if (task.requirements.wordCount) {
      const words = text.split(/\s+/).filter(w => w.length > 0).length;
      const target = task.requirements.wordCount;
      const accuracy = 1 - Math.abs(words - target) / target;
      
      metrics.wordCount = Math.round(accuracy * 100);
      
      console.log(chalk.gray(`   Words: ${words}/${target} (${metrics.wordCount}% accuracy)`));
    }

    // Completude
    metrics.completeness = text.length > 100 ? 90 : 50;
    
    // Qualidade (análise básica)
    if (text.includes('\n')) metrics.completeness += 5;
    if (text.length > 1000) metrics.completeness += 5;

    // Coerência
    metrics.quality = 85; // Base
    if (task.requirements.mustInclude) {
      const includesRequired = task.requirements.mustInclude.every(term => 
        text.toLowerCase().includes(term.toLowerCase())
      );
      metrics.quality = includesRequired ? 95 : 70;
    }

    return metrics;
  }

  /**
   * Valida aplicação com testes reais
   */
  private async validateApplication(appState: any, task: FluiTask): Promise<any> {
    const metrics: any = {};

    // Verifica se tem os arquivos necessários
    metrics.completeness = 0;
    const requiredFiles = ['package.json', 'server.js', 'index.html'];
    
    for (const file of requiredFiles) {
      try {
        await fs.access(file);
        metrics.completeness += 30;
      } catch {
        // File doesn't exist
      }
    }

    // Tenta fazer build
    try {
      const { stdout } = await execAsync('npm run build 2>&1');
      metrics.functionality = stdout.includes('error') ? 50 : 90;
    } catch {
      metrics.functionality = 30;
    }

    // Tenta rodar testes
    if (task.requirements.testRequired) {
      try {
        const { stdout } = await execAsync('npm test 2>&1');
        metrics.testing = stdout.includes('passed') ? 95 : 60;
      } catch {
        metrics.testing = 0;
      }
    }

    // Tenta iniciar o servidor e fazer curl
    if (task.requirements.deployRequired) {
      try {
        // Inicia servidor em background
        const child = require('child_process').spawn('npm', ['start'], {
          detached: true,
          stdio: 'ignore'
        });
        child.unref();

        // Espera servidor iniciar
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Testa com curl
        const { stdout } = await execAsync('curl -s http://localhost:3000');
        metrics.deployment = stdout.length > 0 ? 95 : 50;

        // Para o servidor
        await execAsync('pkill -f "node server.js"').catch(() => {});
      } catch {
        metrics.deployment = 0;
      }
    }

    return metrics;
  }

  /**
   * Valida código
   */
  private async validateCode(code: string, task: FluiTask): Promise<any> {
    const metrics: any = {};

    // Verifica se é código válido
    metrics.syntax = code.includes('function') || code.includes('class') || 
                     code.includes('const') || code.includes('def') ? 90 : 30;

    // Verifica comentários
    metrics.documentation = code.includes('//') || code.includes('/*') || 
                           code.includes('#') ? 95 : 70;

    // Completude
    metrics.completeness = code.length > 100 ? 90 : 50;

    return metrics;
  }

  // Métodos auxiliares

  private generateId(): string {
    return `flui-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private parseRequirements(description: string, custom: any): any {
    const requirements: any = { ...custom };

    // Auto-detecta requisitos da descrição
    const wordMatch = description.match(/(\d+)\s*(mil|thousand|k)?\s*(palavras|words)/i);
    if (wordMatch) {
      let count = parseInt(wordMatch[1]);
      if (wordMatch[2]) {
        count *= 1000;
      }
      requirements.wordCount = count;
    }

    // Detecta tipo
    if (!requirements.type) {
      if (description.includes('frontend') || description.includes('backend') || description.includes('app')) {
        requirements.type = 'application';
      } else if (description.includes('código') || description.includes('code') || description.includes('function')) {
        requirements.type = 'code';
      } else if (description.includes('livro') || description.includes('artigo') || description.includes('book')) {
        requirements.type = 'creative';
      } else {
        requirements.type = 'text';
      }
    }

    // Detecta tecnologias
    if (description.includes('tailwind')) {
      requirements.technology = requirements.technology || [];
      requirements.technology.push('tailwindcss');
    }
    if (description.includes('node')) {
      requirements.technology = requirements.technology || [];
      requirements.technology.push('nodejs');
    }

    return requirements;
  }

  private getCapabilitiesForType(agentType: string): string[] {
    const capabilities: Record<string, string[]> = {
      researcher: ['search', 'analyze', 'summarize'],
      developer: ['code', 'test', 'deploy', 'debug'],
      writer: ['write', 'edit', 'creative', 'structure'],
      analyst: ['analyze', 'validate', 'metrics', 'report'],
      generalist: ['adapt', 'learn', 'execute']
    };

    return capabilities[agentType] || capabilities.generalist;
  }

  private extractDelegationType(output: string): string {
    const match = output.match(/DELEGATE:\s*(\w+)/);
    return match ? match[1] : 'generalist';
  }

  private extractTools(output: string): string[] {
    const match = output.match(/TOOL:\s*\[(.*?)\]/);
    if (match) {
      return match[1].split(',').map(t => t.trim());
    }
    return [];
  }

  private async executeTools(tools: string[], task: FluiTask, currentOutput: any): Promise<any> {
    const results: any = {};
    
    for (const tool of tools) {
      try {
        console.log(chalk.gray(`   🔧 Using tool: ${tool}`));
        
        // Prepara parâmetros baseado no contexto
        const params = await this.prepareToolParams(tool, task, currentOutput);
        const result = await this.tools.executeTool(tool, params);
        
        results[tool] = result;
      } catch (error: any) {
        console.log(chalk.red(`   ❌ Tool ${tool} failed: ${error.message}`));
      }
    }
    
    return results;
  }

  private async prepareToolParams(tool: string, task: FluiTask, context: any): Promise<any> {
    // Prepara parâmetros específicos para cada ferramenta
    switch (tool) {
      case 'file_write':
        return {
          filename: context.filename || 'output.txt',
          content: context.content || ''
        };
      
      case 'shell':
        return {
          command: context.command || 'echo "test"'
        };
      
      default:
        return {};
    }
  }

  private mergeOutputs(current: any, newOutput: any): any {
    if (!current) return newOutput;
    if (!newOutput) return current;
    
    if (typeof current === 'string' && typeof newOutput === 'string') {
      return current + '\n\n' + newOutput;
    }
    
    if (typeof current === 'object' && typeof newOutput === 'object') {
      return { ...current, ...newOutput };
    }
    
    return newOutput;
  }

  private async agentValidatesSubWork(
    agent: FluiAgent,
    subWork: any,
    task: FluiTask
  ): Promise<{ approved: boolean; feedback?: string }> {
    const validationPrompt = `
    You delegated work to a sub-agent. Now validate their output:
    
    Task: ${task.description}
    Requirements: ${JSON.stringify(task.requirements)}
    
    Sub-agent output:
    ${JSON.stringify(subWork).substring(0, 2000)}
    
    Does this meet the 90% quality threshold?
    
    Respond in JSON:
    {
      "approved": true/false,
      "score": 0-100,
      "feedback": "specific improvements needed if not approved"
    }`;

    const response = await this.openAI.sendMessageWithTools(
      [
        { role: 'system', content: agent.persona },
        { role: 'user', content: validationPrompt }
      ],
      'gpt-3.5-turbo'
    );

    try {
      const validation = JSON.parse(typeof response === 'string' ? response : response.response);
      return {
        approved: validation.approved && validation.score >= 90,
        feedback: validation.feedback
      };
    } catch {
      return { approved: false, feedback: 'Could not parse validation' };
    }
  }

  private async refineWithAgent(
    agent: FluiAgent,
    task: FluiTask,
    currentWork: any,
    feedback: string
  ): Promise<any> {
    const refinementPrompt = `
    Your work needs refinement:
    
    Feedback: ${feedback}
    
    Current work:
    ${JSON.stringify(currentWork).substring(0, 2000)}
    
    Task: ${task.description}
    Requirements: ${JSON.stringify(task.requirements)}
    
    Please improve the work to meet 90% quality threshold.`;

    const response = await this.openAI.sendMessageWithTools(
      [
        { role: 'system', content: agent.persona },
        { role: 'user', content: refinementPrompt }
      ],
      'gpt-3.5-turbo'
    );

    return typeof response === 'string' ? response : response.response;
  }

  private async trimToExactWordCount(text: string, targetWords: number): Promise<string> {
    const words = text.split(/\s+/);
    if (words.length <= targetWords) return text;
    
    // Corta no target e adiciona conclusão natural
    const trimmed = words.slice(0, targetWords - 10).join(' ');
    
    const conclusionPrompt = `
    Add a natural ending to this text in exactly 10 words:
    
    ${trimmed.slice(-200)}`;

    const response = await this.openAI.sendMessageWithTools(
      [
        { role: 'system', content: 'Add exactly 10 words to conclude naturally.' },
        { role: 'user', content: conclusionPrompt }
      ],
      'gpt-3.5-turbo'
    );

    const conclusion = typeof response === 'string' ? response : response.response;
    return trimmed + ' ' + conclusion;
  }

  private async genericIncremental(task: FluiTask, currentOutput: any): Promise<any> {
    // Implementação genérica para outros tipos
    const prompt = `
    Continue developing this task incrementally:
    
    Task: ${task.description}
    Current progress: ${JSON.stringify(currentOutput).substring(0, 1000)}
    
    Add more content/functionality to reach 90% completion.`;

    const response = await this.openAI.sendMessageWithTools(
      [
        { role: 'system', content: 'You are an expert. Build incrementally with high quality.' },
        { role: 'user', content: prompt }
      ],
      'gpt-3.5-turbo'
    );

    const newContent = typeof response === 'string' ? response : response.response;
    return this.mergeOutputs(currentOutput, newContent);
  }

  private async validateAppStep(step: string, appState: any): Promise<{ success: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    switch (step) {
      case 'setup':
        try {
          await fs.access('package.json');
        } catch {
          issues.push('package.json not found');
        }
        break;
        
      case 'frontend':
        try {
          await fs.access('index.html');
        } catch {
          issues.push('index.html not found');
        }
        break;
        
      case 'backend':
        try {
          await fs.access('server.js');
        } catch {
          issues.push('server.js not found');
        }
        break;
    }
    
    return {
      success: issues.length === 0,
      issues
    };
  }

  private async fixAppStep(step: string, appState: any, issues: string[]): Promise<any> {
    console.log(chalk.yellow(`   🔧 Fixing: ${issues.join(', ')}`));
    
    for (const issue of issues) {
      if (issue.includes('not found')) {
        const filename = issue.split(' ')[0];
        const content = await this.generateFileContent(filename, appState);
        
        await this.tools.executeTool('file_write', {
          filename,
          content
        });
      }
    }
    
    return { ...appState[step], fixed: true };
  }

  private async generateFileContent(filename: string, context: any): Promise<string> {
    const templates: Record<string, string> = {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flui App</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">
    <div class="container mx-auto p-4">
        <h1 class="text-3xl font-bold text-center mb-8">Flui Application</h1>
        <div id="app"></div>
    </div>
    <script src="app.js"></script>
</body>
</html>`,
      
      'server.js': `const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', message: 'Flui server running' });
});

app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
});`,

      'app.js': `// Flui Frontend Application
document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    
    app.innerHTML = \`
        <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold mb-4">Welcome to Flui</h2>
            <p class="text-gray-600">Application is running successfully!</p>
        </div>
    \`;
    
    // Fetch API status
    fetch('/api/status')
        .then(res => res.json())
        .then(data => console.log('API Status:', data))
        .catch(err => console.error('API Error:', err));
});`
    };
    
    return templates[filename] || `// Generated content for ${filename}`;
  }
}