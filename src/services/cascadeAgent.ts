import { AutonomousAgent, AgentTask, AgentPersona, AgentCapabilities } from './autonomousAgent';
import { ToolsManager } from './toolsManager';
import { MemoryManager } from './memoryManager';
import { OpenAIService } from './openAIService';
import chalk from 'chalk';
import * as crypto from 'crypto';

export interface CascadeTask extends AgentTask {
  requiredScore: number;
  maxDepth: number;
  currentDepth: number;
  parentAgentId?: string;
  delegationChain?: string[];
}

export interface AgentScore {
  agentId: string;
  agentName: string;
  score: number;
  criteria: {
    completeness: number;
    accuracy: number;
    relevance: number;
    quality: number;
    creativity?: number;
  };
  timestamp: Date;
}

export interface DelegationResult {
  taskId: string;
  score: number;
  aggregatedScore?: number;
  subAgentScores?: AgentScore[];
  delegationChain: string[];
  executedDirectly: boolean;
  needsRevision: boolean;
  revisionAttempts: number;
  toolsUsed: string[];
  toolExecutions: ToolExecution[];
  validationChain: ValidationResult[];
  feedbackChain: string[];
  response: any;
  toolFailures?: ToolFailure[];
  recovered?: boolean;
}

export interface ToolExecution {
  agentId: string;
  agentName: string;
  toolName: string;
  params: any;
  result: any;
  timestamp: Date;
  success: boolean;
}

export interface ToolFailure {
  toolName: string;
  error: string;
  recoveryAttempt: boolean;
  recovered: boolean;
}

export interface ValidationResult {
  level: number;
  agentId: string;
  validated: boolean;
  score: number;
  feedback?: string;
}

export class CascadeAgent extends AutonomousAgent {
  private static readonly MIN_ACCEPTABLE_SCORE = 80;
  private static readonly MAX_REVISION_ATTEMPTS = 3;
  private cascadeSubAgents: Map<string, CascadeAgent> = new Map();
  private validationHistory: ValidationResult[] = [];
  private toolExecutionHistory: ToolExecution[] = [];

  constructor(
    persona: AgentPersona,
    capabilities: AgentCapabilities,
    toolsManager: ToolsManager,
    memoryManager: MemoryManager,
    openAIService: OpenAIService,
    parentAgent?: CascadeAgent
  ) {
    // Ensure cascade capabilities
    const enhancedCapabilities = {
      ...capabilities,
      canDelegateToAgents: true,
      canUseTools: true,
      canRequestRevision: true
    };

    super(persona, enhancedCapabilities, toolsManager, memoryManager, openAIService, parentAgent);
  }

  /**
   * Execute task with cascade delegation support
   */
  async executeWithCascade(task: CascadeTask): Promise<DelegationResult> {
    console.log(chalk.cyan(`\n🔄 [${this.getPersona().name}] Starting cascade execution`));
    console.log(chalk.gray(`  📊 Required Score: ${task.requiredScore}%`));
    console.log(chalk.gray(`  🔽 Current Depth: ${task.currentDepth}/${task.maxDepth}`));

    const result: DelegationResult = {
      taskId: task.id,
      score: 0,
      delegationChain: [],
      executedDirectly: false,
      needsRevision: false,
      revisionAttempts: 0,
      toolsUsed: [],
      toolExecutions: [],
      validationChain: [],
      feedbackChain: [],
      response: null
    };

    try {
      // Analyze if delegation is needed
      const strategy = await this.analyzeTaskComplexity(task);
      
      if (strategy.requiresDelegation && task.currentDepth < task.maxDepth) {
        // Delegate to sub-agents
        result.response = await this.delegateWithCascade(task, strategy, result);
      } else {
        // Execute directly
        result.executedDirectly = true;
        result.response = await this.executeDirectlyWithTools(task, result);
      }

      // Calculate and validate score
      result.score = await this.calculateScore(result.response);
      
      // Revision loop if score is below threshold
      while (result.score < task.requiredScore && result.revisionAttempts < CascadeAgent.MAX_REVISION_ATTEMPTS) {
        console.log(chalk.yellow(`  ⚠️ Score ${result.score}% below required ${task.requiredScore}%`));
        result.needsRevision = true;
        result.revisionAttempts++;
        
        const feedback = await this.generateRevisionFeedback(result.response, task, result.score);
        result.feedbackChain.push(feedback);
        
        // Re-execute with feedback
        if (strategy.requiresDelegation && task.currentDepth < task.maxDepth) {
          result.response = await this.delegateWithCascade(task, strategy, result, feedback);
        } else {
          result.response = await this.executeDirectlyWithTools(task, result, feedback);
        }
        
        result.score = await this.calculateScore(result.response);
      }

      // Validate result up the chain
      if (task.parentAgentId) {
        const validation = await this.validateForParent(result, task);
        result.validationChain.push(validation);
      }

      console.log(chalk.green(`  ✅ Final Score: ${result.score}%`));
      
    } catch (error: any) {
      console.log(chalk.red(`  ❌ Error in cascade: ${error.message}`));
      result.toolFailures = result.toolFailures || [];
      result.toolFailures.push({
        toolName: 'cascade_execution',
        error: error.message,
        recoveryAttempt: true,
        recovered: false
      });
      
      // Try to recover
      result.recovered = await this.attemptRecovery(task, error, result);
    }

    return result;
  }

  /**
   * Analyze task complexity to determine delegation strategy
   */
  private async analyzeTaskComplexity(task: CascadeTask): Promise<any> {
    const prompt = `
    Analyze this task and determine if it requires delegation to sub-agents:
    
    Task: ${task.description}
    Type: ${task.type}
    Current Depth: ${task.currentDepth}/${task.maxDepth}
    Required Score: ${task.requiredScore}%
    
    Consider:
    1. Task complexity
    2. Need for specialized expertise
    3. Potential for parallel execution
    4. Available delegation depth
    
    Respond in JSON:
    {
      "requiresDelegation": boolean,
      "reason": "explanation",
      "suggestedAgents": [
        {"type": "researcher|creator|validator", "task": "specific subtask"}
      ],
      "estimatedComplexity": "simple|medium|complex|expert",
      "parallelizable": boolean
    }`;

    const response = await this.openAIService.sendMessageWithTools(
      [
        { role: 'system', content: 'You are a task complexity analyzer. Respond in valid JSON.' },
        { role: 'user', content: prompt }
      ],
      'gpt-3.5-turbo'
    );

    try {
      const result = typeof response === 'string' ? response : response.response;
      return JSON.parse(result);
    } catch {
      return {
        requiresDelegation: false,
        reason: 'Default strategy based on task type',
        suggestedAgents: [],
        estimatedComplexity: 'medium',
        parallelizable: false
      };
    }
  }

  /**
   * Delegate task to sub-agents with cascade support
   */
  private async delegateWithCascade(
    task: CascadeTask,
    strategy: any,
    result: DelegationResult,
    feedback?: string
  ): Promise<any> {
    console.log(chalk.magenta(`  👥 Delegating to sub-agents (depth ${task.currentDepth + 1})`));
    
    const subResults: any[] = [];
    const subScores: AgentScore[] = [];

    for (const agentSpec of strategy.suggestedAgents) {
      // Create specialized sub-agent with cascade capabilities
      const subAgent = await this.createCascadeSubAgent(agentSpec.type);
      
      // Create sub-task
      const subTask: CascadeTask = {
        id: crypto.randomBytes(8).toString('hex'),
        type: agentSpec.type,
        description: agentSpec.task || task.description,
        context: { 
          ...task.context, 
          parentTask: task.description,
          feedback: feedback 
        },
        status: 'pending',
        iterations: 0,
        maxIterations: 5,
        requiredScore: task.requiredScore,
        maxDepth: task.maxDepth,
        currentDepth: task.currentDepth + 1,
        parentAgentId: this.getId(),
        delegationChain: [...(task.delegationChain || []), this.getId()]
      };

      console.log(chalk.blue(`    → Delegating to ${subAgent.getPersona().name}`));
      
      // Execute with cascade (sub-agent can delegate further)
      const subResult = await subAgent.executeWithCascade(subTask);
      
      // Track results
      subResults.push(subResult.response);
      result.delegationChain.push(subAgent.getId());
      result.toolsUsed.push(...subResult.toolsUsed);
      result.toolExecutions.push(...subResult.toolExecutions);
      result.validationChain.push(...subResult.validationChain);
      
      // Track score
      subScores.push({
        agentId: subAgent.getId(),
        agentName: subAgent.getPersona().name,
        score: subResult.score,
        criteria: {
          completeness: subResult.score,
          accuracy: subResult.score,
          relevance: subResult.score,
          quality: subResult.score
        },
        timestamp: new Date()
      });

      // Store sub-agent for potential reuse
      this.cascadeSubAgents.set(subAgent.getId(), subAgent);
    }

    // Aggregate results and scores
    result.subAgentScores = subScores;
    result.aggregatedScore = this.aggregateScores(subScores);
    
    return this.consolidateSubResults(subResults, task);
  }

  /**
   * Execute task directly with tool support
   */
  private async executeDirectlyWithTools(
    task: CascadeTask,
    result: DelegationResult,
    feedback?: string
  ): Promise<any> {
    console.log(chalk.green(`  🎯 Direct execution by ${this.getPersona().name}`));
    
    // Check if tools are needed
    const toolsNeeded = await this.identifyRequiredTools(task);
    
    if (toolsNeeded.length > 0 && this.getCapabilities().canUseTools) {
      console.log(chalk.blue(`  🔧 Using tools: ${toolsNeeded.join(', ')}`));
      
      for (const toolName of toolsNeeded) {
        try {
          const params = await this.prepareCascadeToolParams(toolName, task);
          const toolResult = await this.toolsManager.executeTool(toolName, params);
          
          // Track tool execution
          const execution: ToolExecution = {
            agentId: this.getId(),
            agentName: this.getPersona().name,
            toolName: toolName,
            params: params,
            result: toolResult,
            timestamp: new Date(),
            success: true
          };
          
          result.toolExecutions.push(execution);
          result.toolsUsed.push(toolName);
          this.toolExecutionHistory.push(execution);
          
          console.log(chalk.green(`    ✓ ${toolName} executed successfully`));
        } catch (error: any) {
          console.log(chalk.red(`    ✗ ${toolName} failed: ${error.message}`));
          
          result.toolFailures = result.toolFailures || [];
          result.toolFailures.push({
            toolName: toolName,
            error: error.message,
            recoveryAttempt: false,
            recovered: false
          });
        }
      }
    }

    // Generate response with context
    const prompt = `
    As ${this.getPersona().role} with expertise in ${this.getPersona().expertise.join(', ')},
    execute this task with excellence:
    
    Task: ${task.description}
    Required Score: ${task.requiredScore}%
    ${feedback ? `Previous Feedback: ${feedback}` : ''}
    ${result.toolExecutions.length > 0 ? `Tools Used: ${result.toolsUsed.join(', ')}` : ''}
    
    Style: ${this.getPersona().style}
    Goals: ${this.getPersona().goals.join(', ')}
    
    Deliver a complete, high-quality result that meets the score requirement.`;

    const response = await this.openAIService.sendMessageWithTools(
      [
        { role: 'system', content: `You are ${this.getPersona().name}, ${this.getPersona().role}.` },
        { role: 'user', content: prompt }
      ],
      'gpt-3.5-turbo'
    );

    return typeof response === 'string' ? response : response.response;
  }

  /**
   * Calculate score based on multiple criteria
   */
  async calculateScore(response: any): Promise<number> {
    if (!response) return 0;

    const prompt = `
    Evaluate this response and provide scores (0-100) for each criterion:
    
    Response: ${JSON.stringify(response).substring(0, 1000)}
    
    Criteria:
    1. Completeness - Does it fully address the task?
    2. Accuracy - Is the information correct?
    3. Relevance - Is it relevant to the request?
    4. Quality - Overall quality of the response
    5. Creativity - Innovation and originality (if applicable)
    
    Respond in JSON:
    {
      "completeness": number,
      "accuracy": number,
      "relevance": number,
      "quality": number,
      "creativity": number,
      "overall": number
    }`;

    try {
      const evaluation = await this.openAIService.sendMessageWithTools(
        [
          { role: 'system', content: 'You are a response evaluator. Provide objective scores.' },
          { role: 'user', content: prompt }
        ],
        'gpt-3.5-turbo'
      );

      const scores = JSON.parse(typeof evaluation === 'string' ? evaluation : evaluation.response);
      return scores.overall || Math.round((scores.completeness + scores.accuracy + scores.relevance + scores.quality) / 4);
    } catch {
      // Fallback scoring
      return response ? 75 : 0;
    }
  }

  /**
   * Generate revision feedback
   */
  private async generateRevisionFeedback(response: any, task: CascadeTask, currentScore: number): Promise<string> {
    const gap = task.requiredScore - currentScore;
    
    return `The current response scored ${currentScore}%, which is ${gap}% below the required ${task.requiredScore}%. 
    Please improve the following aspects:
    ${gap > 20 ? '- Significantly enhance completeness and detail' : ''}
    ${gap > 10 ? '- Improve accuracy and relevance' : ''}
    ${gap > 5 ? '- Refine quality and presentation' : ''}
    - Ensure all requirements are fully met`;
  }

  /**
   * Validate result for parent agent
   */
  private async validateForParent(result: DelegationResult, task: CascadeTask): Promise<ValidationResult> {
    return {
      level: task.currentDepth,
      agentId: this.getId(),
      validated: result.score >= task.requiredScore,
      score: result.score,
      feedback: result.score < task.requiredScore 
        ? `Score ${result.score}% below required ${task.requiredScore}%`
        : 'Validation passed'
    };
  }

  /**
   * Create cascade-enabled sub-agent
   */
  private async createCascadeSubAgent(type: string): Promise<CascadeAgent> {
    const persona = this.generatePersonaForType(type);
    
    const capabilities: AgentCapabilities = {
      canUseTools: true,
      canDelegateToAgents: true, // Sub-agents can also delegate
      canMakeDecisions: true,
      canRequestRevision: true,
      canAccessMemory: true,
      availableTools: this.getCapabilities().availableTools
    };

    return new CascadeAgent(
      persona,
      capabilities,
      this.toolsManager,
      this.memoryManager,
      this.openAIService,
      this
    );
  }

  /**
   * Generate persona based on agent type
   */
  private generatePersonaForType(type: string): AgentPersona {
    const basePersonas: Record<string, AgentPersona> = {
      researcher: {
        name: `Researcher-${crypto.randomBytes(4).toString('hex')}`,
        role: 'researcher',
        expertise: ['research', 'analysis', 'data gathering', 'fact-checking'],
        style: 'analytical and thorough',
        goals: ['find accurate information', 'verify sources', 'provide comprehensive analysis'],
        constraints: ['use reliable sources', 'maintain objectivity']
      },
      creator: {
        name: `Creator-${crypto.randomBytes(4).toString('hex')}`,
        role: 'content_creator',
        expertise: ['writing', 'creativity', 'content generation', 'storytelling'],
        style: 'creative and engaging',
        goals: ['create original content', 'engage audience', 'deliver value'],
        constraints: ['maintain quality', 'be original']
      },
      validator: {
        name: `Validator-${crypto.randomBytes(4).toString('hex')}`,
        role: 'validator',
        expertise: ['review', 'quality assurance', 'testing', 'verification'],
        style: 'critical and meticulous',
        goals: ['ensure quality', 'identify issues', 'validate requirements'],
        constraints: ['be objective', 'provide constructive feedback']
      },
      improver: {
        name: `Improver-${crypto.randomBytes(4).toString('hex')}`,
        role: 'improver',
        expertise: ['optimization', 'refinement', 'enhancement', 'polishing'],
        style: 'detail-oriented and perfectionist',
        goals: ['enhance quality', 'optimize performance', 'refine details'],
        constraints: ['preserve core functionality', 'maintain compatibility']
      },
      expert: {
        name: `Expert-${crypto.randomBytes(4).toString('hex')}`,
        role: 'expert',
        expertise: ['deep knowledge', 'problem-solving', 'advanced techniques', 'best practices'],
        style: 'authoritative and insightful',
        goals: ['provide expert guidance', 'solve complex problems', 'share best practices'],
        constraints: ['maintain accuracy', 'provide practical solutions']
      }
    };

    return basePersonas[type] || basePersonas.creator;
  }

  /**
   * Identify required tools for task
   */
  private async identifyRequiredTools(task: CascadeTask): Promise<string[]> {
    const taskLower = task.description.toLowerCase();
    const tools: string[] = [];

    if (taskLower.includes('file') || taskLower.includes('save') || taskLower.includes('create')) {
      tools.push('file_write');
    }
    if (taskLower.includes('read') || taskLower.includes('analyze') || taskLower.includes('load')) {
      tools.push('file_read');
    }
    if (taskLower.includes('command') || taskLower.includes('execute') || taskLower.includes('run')) {
      tools.push('shell');
    }
    if (taskLower.includes('error') || taskLower.includes('debug') || taskLower.includes('fix')) {
      tools.push('find_problem_solution');
    }

    return tools;
  }

  /**
   * Prepare parameters for tool execution
   */
  protected async prepareCascadeToolParams(toolName: string, task: CascadeTask): Promise<any> {
    // Generate appropriate parameters based on tool and task
    switch (toolName) {
      case 'file_write':
        return {
          filename: `output_${task.id}.md`,
          content: task.context?.content || 'Generated content'
        };
      case 'file_read':
        return {
          filename: task.context?.filename || 'input.txt'
        };
      case 'shell':
        return {
          command: task.context?.command || 'echo "Task executed"'
        };
      default:
        return task.context || {};
    }
  }

  /**
   * Aggregate scores from sub-agents
   */
  private aggregateScores(scores: AgentScore[]): number {
    if (scores.length === 0) return 0;
    
    // Weighted average based on agent expertise
    let totalWeight = 0;
    let weightedSum = 0;

    scores.forEach(score => {
      const weight = score.agentName.includes('Expert') ? 2.0 :
                    score.agentName.includes('Validator') ? 1.5 :
                    1.0;
      
      weightedSum += score.score * weight;
      totalWeight += weight;
    });

    return Math.round(weightedSum / totalWeight);
  }

  /**
   * Consolidate results from sub-agents
   */
  private consolidateSubResults(results: any[], task: CascadeTask): any {
    if (results.length === 0) return null;
    if (results.length === 1) return results[0];

    // Combine results intelligently
    return {
      combined: true,
      task: task.description,
      results: results,
      summary: `Consolidated output from ${results.length} sub-agents`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Attempt to recover from errors
   */
  private async attemptRecovery(task: CascadeTask, error: Error, result: DelegationResult): Promise<boolean> {
    console.log(chalk.yellow(`  🔄 Attempting recovery from: ${error.message}`));
    
    try {
      // Simple recovery: retry with reduced complexity
      const simplifiedTask = {
        ...task,
        type: 'simple' as any,
        maxDepth: 1
      };
      
      const recoveryResult = await this.executeDirectlyWithTools(simplifiedTask, result);
      result.response = recoveryResult;
      result.score = await this.calculateScore(recoveryResult);
      
      return result.score >= task.requiredScore * 0.8; // Accept 80% of required score in recovery
    } catch {
      return false;
    }
  }

  // Getters
  getId(): string {
    return (this as any).id;
  }

  getValidationHistory(): ValidationResult[] {
    return this.validationHistory;
  }

  getToolExecutionHistory(): ToolExecution[] {
    return this.toolExecutionHistory;
  }
}