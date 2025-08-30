import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EnhancedSpiralOrchestrator, SpiralLevel, SpiralResult, SpiralConfig } from '../../src/services/enhancedSpiralOrchestrator';
import { ToolsManager } from '../../src/services/toolsManager';
import { MemoryManager } from '../../src/services/memoryManager';
import { OpenAIService } from '../../src/services/openAIService';

// Mock dependencies
jest.mock('../../src/services/toolsManager');
jest.mock('../../src/services/memoryManager');
jest.mock('../../src/services/openAIService');
jest.mock('../../src/services/cascadeAgent');

describe('EnhancedSpiralOrchestrator', () => {
  let orchestrator: EnhancedSpiralOrchestrator;
  let mockToolsManager: jest.Mocked<ToolsManager>;
  let mockMemoryManager: jest.Mocked<MemoryManager>;
  let mockOpenAIService: jest.Mocked<OpenAIService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockToolsManager = new ToolsManager(null as any, null as any, null as any) as jest.Mocked<ToolsManager>;
    mockMemoryManager = new MemoryManager() as jest.Mocked<MemoryManager>;
    mockOpenAIService = new OpenAIService() as jest.Mocked<OpenAIService>;
    
    // Setup mocks
    mockToolsManager.executeTool = jest.fn().mockResolvedValue({
      toolName: 'test',
      status: 'success',
      output: 'test output'
    });
    mockToolsManager.getAvailableTools = jest.fn().mockReturnValue(['file_write', 'shell']);
    
    mockMemoryManager.addPrimaryMessage = jest.fn();
    mockMemoryManager.getRecentMessages = jest.fn().mockReturnValue([]);
    mockMemoryManager.saveCheckpoint = jest.fn();
    mockMemoryManager.loadCheckpoint = jest.fn().mockReturnValue(null);
    
    mockOpenAIService.sendMessageWithTools = jest.fn().mockResolvedValue({
      response: 'Test response',
      toolCalls: []
    });

    orchestrator = new EnhancedSpiralOrchestrator(
      mockToolsManager,
      mockMemoryManager,
      mockOpenAIService
    );
  });

  describe('Multi-Level Spiral', () => {
    it('should process through multiple spiral levels', async () => {
      const request = 'Create a complex application';
      
      // Mock responses for different levels
      let level = 0;
      mockOpenAIService.sendMessageWithTools = jest.fn().mockImplementation(async () => {
        level++;
        return {
          response: `Level ${level} response`,
          toolCalls: []
        };
      });
      
      // Mock score calculation in CascadeAgent
      const mockExecuteWithCascade = jest.fn().mockImplementation(async () => {
        return {
          response: 'Test response',
          score: level < 3 ? 70 + level * 5 : 85,
          delegationChain: [],
          toolsUsed: [],
          toolExecutions: [],
          validationChain: [],
          feedbackChain: [],
          executedDirectly: true,
          needsRevision: false,
          revisionAttempts: 0
        };
      });
      
      // Override the CascadeAgent mock
      jest.spyOn(orchestrator as any, 'createSpecializedAgent').mockResolvedValue({
        executeWithCascade: mockExecuteWithCascade,
        getPersona: () => ({ name: 'TestAgent' }),
        getId: () => 'test-id'
      });
      
      const result = await orchestrator.processInSpiral(request, {
        maxLevels: 5,
        minScore: 80,
        enableCascade: true,
        maxCascadeDepth: 3,
        trackMetrics: true
      });

      expect(result).toBeDefined();
      expect(result.levels.length).toBeGreaterThan(0);
      expect(result.finalScore).toBeGreaterThanOrEqual(80);
    });

    it('should stop early when target score is achieved', async () => {
      const request = 'Simple task';
      
      // Mock high score on first attempt
      jest.spyOn(orchestrator as any, 'createSpecializedAgent').mockResolvedValue({
        executeWithCascade: jest.fn().mockResolvedValue({
          response: 'Task completed',
          score: 90,
          delegationChain: [],
          toolsUsed: [],
          toolExecutions: [],
          validationChain: [],
          feedbackChain: [],
          executedDirectly: true,
          needsRevision: false,
          revisionAttempts: 0
        }),
        getPersona: () => ({ name: 'TestAgent' }),
        getId: () => 'test-id'
      });

      const result = await orchestrator.processInSpiral(request, {
        maxLevels: 10,
        minScore: 80,
        enableCascade: false,
        trackMetrics: false
      });

      expect(result.earlyTermination).toBe(true);
      expect(result.terminationReason).toBe('score_achieved');
      expect(result.levels.length).toBeLessThan(10);
    });
  });

  describe('Level Strategies', () => {
    it('should apply different strategies at each level', async () => {
      const config: SpiralConfig = { 
        maxLevels: 3, 
        minScore: 80, 
        enableCascade: true,
        maxCascadeDepth: 2
      };
      
      // Mock agent creation
      jest.spyOn(orchestrator as any, 'createSpecializedAgent').mockResolvedValue({
        executeWithCascade: jest.fn().mockResolvedValue({
          response: 'Test',
          score: 85,
          delegationChain: [],
          toolsUsed: [],
          toolExecutions: [],
          validationChain: [],
          feedbackChain: [],
          executedDirectly: true,
          needsRevision: false,
          revisionAttempts: 0
        }),
        getPersona: () => ({ name: 'TestAgent' }),
        getId: () => 'test-id'
      });
      
      const level1: SpiralLevel = {
        number: 1,
        strategy: 'research',
        score: 0,
        result: null
      };

      const result1 = await orchestrator.executeLevel(level1, 'Research AI', config);
      expect(result1.approach).toBe('information_gathering');
      expect(result1.agentsUsed).toContain('researcher');

      const level2: SpiralLevel = {
        number: 2,
        strategy: 'create',
        score: 0,
        result: null,
        previousContext: { research: 'completed' }
      };

      const result2 = await orchestrator.executeLevel(level2, 'Create content', config);
      expect(result2.approach).toBe('content_generation');
      expect(result2.agentsUsed).toContain('creator');
    });
  });

  describe('Score Aggregation', () => {
    it('should aggregate scores correctly', () => {
      const scores = [85, 90, 75, 88];
      
      const avgScore = orchestrator.aggregateScores(scores, 'average');
      expect(avgScore).toBe(85); // (85+90+75+88)/4 = 84.5 -> 85
      
      const maxScore = orchestrator.aggregateScores(scores, 'maximum');
      expect(maxScore).toBe(90);
      
      const weightedScore = orchestrator.aggregateScores(scores, 'weighted');
      expect(weightedScore).toBeGreaterThan(0);
      expect(weightedScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Checkpoints', () => {
    it('should save checkpoints at each level', async () => {
      jest.spyOn(orchestrator as any, 'createSpecializedAgent').mockResolvedValue({
        executeWithCascade: jest.fn().mockResolvedValue({
          response: 'Test',
          score: 85,
          delegationChain: [],
          toolsUsed: [],
          toolExecutions: [],
          validationChain: [],
          feedbackChain: [],
          executedDirectly: true,
          needsRevision: false,
          revisionAttempts: 0
        }),
        getPersona: () => ({ name: 'TestAgent' }),
        getId: () => 'test-id'
      });
      
      await orchestrator.processInSpiral('Test task', {
        maxLevels: 3,
        minScore: 80,
        enableCascade: true,
        enableCheckpoints: true
      });

      expect(mockMemoryManager.saveCheckpoint).toHaveBeenCalled();
    });
  });

  describe('Metrics Tracking', () => {
    it('should track execution metrics', async () => {
      jest.spyOn(orchestrator as any, 'createSpecializedAgent').mockResolvedValue({
        executeWithCascade: jest.fn().mockResolvedValue({
          response: 'Test',
          score: 85,
          delegationChain: [],
          toolsUsed: [],
          toolExecutions: [],
          validationChain: [],
          feedbackChain: [],
          executedDirectly: true,
          needsRevision: false,
          revisionAttempts: 0
        }),
        getPersona: () => ({ name: 'TestAgent' }),
        getId: () => 'test-id'
      });
      
      const result = await orchestrator.processInSpiral('Test task', {
        maxLevels: 2,
        minScore: 80,
        enableCascade: true,
        trackMetrics: true
      });

      expect(result.metrics).toBeDefined();
      expect(result.metrics!.totalExecutionTime).toBeGreaterThan(0);
      expect(result.metrics!.levelTimes).toBeDefined();
      expect(result.metrics!.costEstimate).toBeDefined();
    });
  });
});