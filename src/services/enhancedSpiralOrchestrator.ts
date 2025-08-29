import { CascadeAgent, CascadeTask, DelegationResult, AgentScore } from './cascadeAgent';
import { AgentPersona, AgentCapabilities } from './autonomousAgent';
import { ToolsManager } from './toolsManager';
import { MemoryManager } from './memoryManager';
import { OpenAIService } from './openAIService';
import { NavigationManager } from './navigationManager';
import { ErrorHandler } from './errorHandler';
import chalk from 'chalk';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface SpiralLevel {
  number: number;
  strategy: 'research' | 'create' | 'validate' | 'refine' | 'expert';
  score: number;
  result: any;
  agentsUsed?: string[];
  approach?: string;
  improvements?: string[];
  deepAnalysis?: boolean;
  recommendations?: string[];
  previousContext?: any;
  complexity?: string;
}

export interface SpiralConfig {
  maxLevels: number;
  minScore: number;
  enableCascade: boolean;
  maxCascadeDepth?: number;
  enableCheckpoints?: boolean;
  trackMetrics?: boolean;
}

export interface SpiralResult {
  levels: SpiralLevel[];
  finalScore: number;
  earlyTermination?: boolean;
  terminationReason?: string;
  scoreProgression: number[];
  cascadeEnabled?: boolean;
  totalAgentsUsed?: number;
  delegationDepth?: number;
  cascadeChains?: CascadeChain[];
  recoveredFromCheckpoint?: boolean;
  recoveryLevel?: number;
  metrics?: SpiralMetrics;
}

export interface CascadeChain {
  level: number;
  agents: string[];
  depth: number;
}

export interface SpiralMetrics {
  levelTimes: number[];
  totalTokens: number;
  tokensPerLevel: number[];
  costEstimate: number;
  totalExecutionTime: number;
}

export class EnhancedSpiralOrchestrator {
  private toolsManager: ToolsManager;
  private memoryManager: MemoryManager;
  private openAIService: OpenAIService;
  private navigationManager: NavigationManager;
  private errorHandler: ErrorHandler;
  private mainAgent: CascadeAgent | null = null;
  private levelAgents: Map<number, CascadeAgent[]> = new Map();
  private checkpoints: Map<number, any> = new Map();
  private metrics: SpiralMetrics = {
    levelTimes: [],
    totalTokens: 0,
    tokensPerLevel: [],
    costEstimate: 0,
    totalExecutionTime: 0
  };

  constructor(
    toolsManager: ToolsManager,
    memoryManager: MemoryManager,
    openAIService: OpenAIService
  ) {
    this.toolsManager = toolsManager;
    this.memoryManager = memoryManager;
    this.openAIService = openAIService;
    this.navigationManager = new NavigationManager();
    this.errorHandler = new ErrorHandler();
  }

  /**
   * Process request in spiral mode with multiple levels
   */
  async processInSpiral(request: string, config: SpiralConfig): Promise<SpiralResult> {
    const startTime = Date.now();
    
    console.log(chalk.bold.cyan('\n🌀 ENHANCED SPIRAL MODE ACTIVATED 🌀'));
    console.log(chalk.white(`📝 Request: ${request}`));
    console.log(chalk.gray(`⚙️ Config: ${JSON.stringify(config)}`));
    
    const result: SpiralResult = {
      levels: [],
      finalScore: 0,
      scoreProgression: [],
      cascadeEnabled: config.enableCascade
    };

    // Initialize main orchestrator agent
    this.mainAgent = this.createMainOrchestrator(config);
    
    let currentScore = 0;
    let levelCount = 0;
    let totalAgentsUsed = 1; // Start with main agent

    // Spiral through levels until score is achieved or max levels reached
    while (currentScore < config.minScore && levelCount < config.maxLevels) {
      levelCount++;
      const levelStartTime = Date.now();
      
      console.log(chalk.magenta(`\n━━━ LEVEL ${levelCount}/${config.maxLevels} ━━━`));
      
      // Determine strategy for this level
      const strategy = this.determineStrategy(levelCount, currentScore, config.minScore);
      
      // Create level configuration
      const level: SpiralLevel = {
        number: levelCount,
        strategy: strategy,
        score: currentScore,
        result: null,
        previousContext: levelCount > 1 ? result.levels[levelCount - 2].result : null
      };

      try {
        // Save checkpoint if enabled
        if (config.enableCheckpoints) {
          await this.saveCheckpoint(levelCount, level, result);
        }

        // Execute level with appropriate strategy
        const levelResult = await this.executeLevel(level, request, config);
        
        // Update level with results
        level.result = levelResult.response;
        level.score = levelResult.score;
        level.agentsUsed = levelResult.agentsUsed;
        level.approach = levelResult.approach;
        
        // Track agents used
        totalAgentsUsed += levelResult.agentsUsed?.length || 0;
        
        // Track cascade chains if enabled
        if (config.enableCascade && levelResult.cascadeChain) {
          result.cascadeChains = result.cascadeChains || [];
          result.cascadeChains.push({
            level: levelCount,
            agents: levelResult.cascadeChain,
            depth: levelResult.delegationDepth || 0
          });
        }

        // Update current score
        currentScore = level.score;
        result.scoreProgression.push(currentScore);
        result.levels.push(level);

        // Track metrics
        if (config.trackMetrics) {
          const levelTime = Date.now() - levelStartTime;
          this.metrics.levelTimes.push(levelTime);
          this.metrics.tokensPerLevel.push(levelResult.tokensUsed || 0);
          this.metrics.totalTokens += levelResult.tokensUsed || 0;
        }

        console.log(chalk.green(`  ✅ Level ${levelCount} Score: ${currentScore}%`));
        
        // Check for early termination
        if (currentScore >= config.minScore) {
          result.earlyTermination = true;
          result.terminationReason = 'score_achieved';
          console.log(chalk.bold.green(`\n🎯 Target score achieved at level ${levelCount}!`));
          break;
        }

      } catch (error: any) {
        console.log(chalk.red(`  ❌ Error at level ${levelCount}: ${error.message}`));
        
        // Try to recover from checkpoint
        if (config.enableCheckpoints && levelCount > 1) {
          const recovered = await this.recoverFromCheckpoint(levelCount - 1);
          if (recovered) {
            result.recoveredFromCheckpoint = true;
            result.recoveryLevel = levelCount - 1;
            currentScore = recovered.score;
            continue;
          }
        }
        
        throw error;
      }
    }

    // Finalize results
    result.finalScore = currentScore;
    result.totalAgentsUsed = totalAgentsUsed;
    
    if (config.trackMetrics) {
      this.metrics.totalExecutionTime = Date.now() - startTime;
      this.metrics.costEstimate = this.estimateCost(this.metrics.totalTokens);
      result.metrics = { ...this.metrics };
    }

    // Final summary
    this.printSpiralSummary(result, config);
    
    return result;
  }

  /**
   * Execute a single spiral level
   */
  async executeLevel(level: SpiralLevel, request: string, config: SpiralConfig): Promise<any> {
    console.log(chalk.blue(`  📋 Strategy: ${level.strategy.toUpperCase()}`));
    
    const agents: CascadeAgent[] = [];
    const results: any = {
      response: null,
      score: 0,
      agentsUsed: [],
      approach: level.strategy,
      tokensUsed: 0
    };

    switch (level.strategy) {
      case 'research':
        results.approach = 'information_gathering';
        const researchAgent = await this.createSpecializedAgent('researcher', config);
        agents.push(researchAgent);
        results.agentsUsed.push('researcher');
        
        const researchTask = this.createTask(request, 'research', level, config);
        const researchResult = await researchAgent.executeWithCascade(researchTask);
        
        results.response = researchResult.response;
        results.score = researchResult.score;
        results.cascadeChain = researchResult.delegationChain;
        results.delegationDepth = researchTask.maxDepth;
        break;

      case 'create':
        results.approach = 'content_generation';
        const creatorAgent = await this.createSpecializedAgent('creator', config);
        agents.push(creatorAgent);
        results.agentsUsed.push('creator');
        
        const createTask = this.createTask(request, 'create', level, config);
        createTask.context = { previousResearch: level.previousContext };
        
        const createResult = await creatorAgent.executeWithCascade(createTask);
        results.response = createResult.response;
        results.score = createResult.score;
        results.cascadeChain = createResult.delegationChain;
        break;

      case 'validate':
        results.approach = 'quality_assurance';
        const validatorAgent = await this.createSpecializedAgent('validator', config);
        agents.push(validatorAgent);
        results.agentsUsed.push('validator');
        
        const validateTask = this.createTask(request, 'validate', level, config);
        validateTask.context = { contentToValidate: level.previousContext };
        
        const validateResult = await validatorAgent.executeWithCascade(validateTask);
        results.response = validateResult.response;
        results.score = validateResult.score;
        results.cascadeChain = validateResult.delegationChain;
        break;

      case 'refine':
        results.approach = 'iterative_improvement';
        const improverAgent = await this.createSpecializedAgent('improver', config);
        const validatorAgent2 = await this.createSpecializedAgent('validator', config);
        agents.push(improverAgent, validatorAgent2);
        results.agentsUsed.push('validator', 'improver');
        
        // First improve
        const improveTask = this.createTask(request, 'refine', level, config);
        improveTask.context = { 
          currentContent: level.previousContext,
          currentScore: level.score,
          targetScore: config.minScore
        };
        
        const improveResult = await improverAgent.executeWithCascade(improveTask);
        
        // Then validate improvements
        const revalidateTask = this.createTask(request, 'validate', level, config);
        revalidateTask.context = { contentToValidate: improveResult.response };
        
        const revalidateResult = await validatorAgent2.executeWithCascade(revalidateTask);
        
        results.response = improveResult.response;
        results.score = revalidateResult.score;
        results.improvements = [
          'Enhanced completeness',
          'Improved accuracy',
          'Refined presentation'
        ];
        break;

      case 'expert':
        results.approach = 'expert_analysis';
        results.deepAnalysis = true;
        const expertAgent = await this.createSpecializedAgent('expert', config);
        agents.push(expertAgent);
        results.agentsUsed.push('expert');
        
        const expertTask = this.createTask(request, 'expert', level, config);
        expertTask.context = {
          allPreviousWork: level.previousContext,
          currentScore: level.score,
          criticalAnalysis: true
        };
        
        const expertResult = await expertAgent.executeWithCascade(expertTask);
        results.response = expertResult.response;
        results.score = expertResult.score;
        results.recommendations = [
          'Apply best practices',
          'Optimize for performance',
          'Ensure scalability'
        ];
        results.cascadeChain = expertResult.delegationChain;
        break;
    }

    // Store agents for this level
    this.levelAgents.set(level.number, agents);
    
    return results;
  }

  /**
   * Determine strategy based on level and current score
   */
  private determineStrategy(level: number, currentScore: number, targetScore: number): SpiralLevel['strategy'] {
    const scoreGap = targetScore - currentScore;
    
    // Level-based strategy with score consideration
    if (level === 1) {
      return 'research';
    } else if (level === 2) {
      return 'create';
    } else if (level === 3) {
      return 'validate';
    } else if (scoreGap > 20) {
      return 'refine';
    } else if (scoreGap > 10) {
      return 'expert';
    } else {
      // Alternate between refine and expert for final improvements
      return level % 2 === 0 ? 'refine' : 'expert';
    }
  }

  /**
   * Create main orchestrator agent
   */
  private createMainOrchestrator(config: SpiralConfig): CascadeAgent {
    const persona: AgentPersona = {
      name: 'Spiral-Master',
      role: 'orchestrator',
      expertise: ['coordination', 'analysis', 'decision-making', 'quality-control'],
      style: 'strategic and adaptive',
      goals: [
        `achieve minimum score of ${config.minScore}%`,
        'optimize for quality and efficiency',
        'coordinate multi-level execution',
        'ensure continuous improvement'
      ],
      constraints: [
        `maximum ${config.maxLevels} levels`,
        'validate all results',
        'maintain context across levels'
      ]
    };

    const capabilities: AgentCapabilities = {
      canUseTools: true,
      canDelegateToAgents: true,
      canMakeDecisions: true,
      canRequestRevision: true,
      canAccessMemory: true,
      availableTools: this.toolsManager.getAvailableTools()
    };

    return new CascadeAgent(
      persona,
      capabilities,
      this.toolsManager,
      this.memoryManager,
      this.openAIService
    );
  }

  /**
   * Create specialized agent for level execution
   */
  private async createSpecializedAgent(type: string, config: SpiralConfig): Promise<CascadeAgent> {
    const personas: Record<string, AgentPersona> = {
      researcher: {
        name: `Spiral-Researcher-${crypto.randomBytes(4).toString('hex')}`,
        role: 'researcher',
        expertise: ['deep research', 'information synthesis', 'fact verification'],
        style: 'thorough and analytical',
        goals: [`achieve ${config.minScore}% accuracy`, 'comprehensive coverage'],
        constraints: ['verified sources only', 'maintain objectivity']
      },
      creator: {
        name: `Spiral-Creator-${crypto.randomBytes(4).toString('hex')}`,
        role: 'creator',
        expertise: ['content creation', 'creative writing', 'technical documentation'],
        style: 'creative and professional',
        goals: [`achieve ${config.minScore}% quality`, 'engaging content'],
        constraints: ['original work only', 'maintain consistency']
      },
      validator: {
        name: `Spiral-Validator-${crypto.randomBytes(4).toString('hex')}`,
        role: 'validator',
        expertise: ['quality assurance', 'requirement validation', 'scoring'],
        style: 'critical and precise',
        goals: [`ensure ${config.minScore}% compliance`, 'identify improvements'],
        constraints: ['objective assessment', 'constructive feedback']
      },
      improver: {
        name: `Spiral-Improver-${crypto.randomBytes(4).toString('hex')}`,
        role: 'improver',
        expertise: ['optimization', 'enhancement', 'refinement'],
        style: 'perfectionist and detail-oriented',
        goals: [`reach ${config.minScore}% score`, 'maximize quality'],
        constraints: ['preserve core value', 'incremental improvements']
      },
      expert: {
        name: `Spiral-Expert-${crypto.randomBytes(4).toString('hex')}`,
        role: 'expert',
        expertise: ['advanced techniques', 'best practices', 'deep analysis'],
        style: 'authoritative and insightful',
        goals: [`exceed ${config.minScore}% excellence`, 'provide expert insights'],
        constraints: ['evidence-based recommendations', 'practical solutions']
      }
    };

    const capabilities: AgentCapabilities = {
      canUseTools: true,
      canDelegateToAgents: config.enableCascade,
      canMakeDecisions: true,
      canRequestRevision: true,
      canAccessMemory: true,
      availableTools: this.toolsManager.getAvailableTools()
    };

    return new CascadeAgent(
      personas[type] || personas.creator,
      capabilities,
      this.toolsManager,
      this.memoryManager,
      this.openAIService,
      this.mainAgent || undefined
    );
  }

  /**
   * Create task for level execution
   */
  private createTask(request: string, type: string, level: SpiralLevel, config: SpiralConfig): CascadeTask {
    return {
      id: `spiral-${level.number}-${type}-${crypto.randomBytes(4).toString('hex')}`,
      type: type as any,
      description: request,
      status: 'pending',
      iterations: 0,
      maxIterations: 5,
      requiredScore: config.minScore,
      maxDepth: config.maxCascadeDepth || 3,
      currentDepth: 0,
      context: {
        spiralLevel: level.number,
        previousScore: level.score,
        strategy: level.strategy
      }
    };
  }

  /**
   * Aggregate scores with different strategies
   */
  aggregateScores(scores: number[], strategy: 'average' | 'weighted' | 'maximum' = 'weighted'): number {
    if (scores.length === 0) return 0;

    switch (strategy) {
      case 'average':
        return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      
      case 'maximum':
        return Math.max(...scores);
      
      case 'weighted':
        // Later scores have more weight
        let weightedSum = 0;
        let totalWeight = 0;
        scores.forEach((score, index) => {
          const weight = index + 1;
          weightedSum += score * weight;
          totalWeight += weight;
        });
        return Math.round(weightedSum / totalWeight);
      
      default:
        return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
  }

  /**
   * Save checkpoint for recovery
   */
  private async saveCheckpoint(level: number, levelData: SpiralLevel, result: SpiralResult): Promise<void> {
    const checkpoint = {
      level: level,
      levelData: levelData,
      result: result,
      timestamp: new Date().toISOString()
    };

    this.checkpoints.set(level, checkpoint);
    
    if (this.memoryManager.saveCheckpoint) {
      await this.memoryManager.saveCheckpoint(checkpoint);
    }

    // Also save to file for persistence
    const checkpointPath = path.join('.flui', 'checkpoints', `spiral_${level}.json`);
    try {
      await fs.promises.mkdir(path.dirname(checkpointPath), { recursive: true });
      await fs.promises.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2));
    } catch (error) {
      console.log(chalk.yellow(`  ⚠️ Could not save checkpoint to file: ${error}`));
    }
  }

  /**
   * Recover from checkpoint
   */
  private async recoverFromCheckpoint(level: number): Promise<any> {
    const checkpoint = this.checkpoints.get(level);
    
    if (checkpoint) {
      console.log(chalk.green(`  ✅ Recovered from checkpoint at level ${level}`));
      return checkpoint.levelData;
    }

    // Try to load from file
    const checkpointPath = path.join('.flui', 'checkpoints', `spiral_${level}.json`);
    try {
      const data = await fs.promises.readFile(checkpointPath, 'utf8');
      const checkpoint = JSON.parse(data);
      console.log(chalk.green(`  ✅ Recovered from file checkpoint at level ${level}`));
      return checkpoint.levelData;
    } catch {
      return null;
    }
  }

  /**
   * Estimate cost based on token usage
   */
  private estimateCost(tokens: number): number {
    // Rough estimate: $0.002 per 1K tokens for GPT-3.5
    return (tokens / 1000) * 0.002;
  }

  /**
   * Print spiral execution summary
   */
  private printSpiralSummary(result: SpiralResult, config: SpiralConfig): void {
    console.log(chalk.bold.cyan('\n━━━ SPIRAL EXECUTION SUMMARY ━━━'));
    console.log(chalk.white(`📊 Final Score: ${result.finalScore}% (Target: ${config.minScore}%)`));
    console.log(chalk.white(`📈 Levels Executed: ${result.levels.length}/${config.maxLevels}`));
    
    if (result.scoreProgression.length > 0) {
      console.log(chalk.white(`📉 Score Progression: ${result.scoreProgression.join('% → ')}%`));
    }
    
    if (result.totalAgentsUsed) {
      console.log(chalk.white(`👥 Total Agents Used: ${result.totalAgentsUsed}`));
    }
    
    if (result.cascadeChains) {
      console.log(chalk.white(`🔗 Cascade Chains: ${result.cascadeChains.length}`));
    }
    
    if (result.metrics) {
      console.log(chalk.white(`⏱️ Total Time: ${(result.metrics.totalExecutionTime / 1000).toFixed(2)}s`));
      console.log(chalk.white(`🎯 Tokens Used: ${result.metrics.totalTokens}`));
      console.log(chalk.white(`💰 Estimated Cost: $${result.metrics.costEstimate.toFixed(4)}`));
    }
    
    if (result.earlyTermination) {
      console.log(chalk.green(`✨ Early Termination: ${result.terminationReason}`));
    }
    
    console.log(chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  }
}