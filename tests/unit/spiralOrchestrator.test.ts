import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EnhancedSpiralOrchestrator, SpiralLevel, SpiralResult, SpiralConfig } from '../../src/services/enhancedSpiralOrchestrator';
import { CascadeAgent } from '../../src/services/cascadeAgent';
import { ToolsManager } from '../../src/services/toolsManager';
import { MemoryManager } from '../../src/services/memoryManager';
import { OpenAIService } from '../../src/services/openAIService';

describe('EnhancedSpiralOrchestrator', () => {
  let orchestrator: EnhancedSpiralOrchestrator;
  let mockToolsManager: jest.Mocked<ToolsManager>;
  let mockMemoryManager: jest.Mocked<MemoryManager>;
  let mockOpenAIService: jest.Mocked<OpenAIService>;

  beforeEach(() => {
    mockToolsManager = {
      executeTool: jest.fn(),
      getAvailableTools: jest.fn().mockReturnValue(['file_write', 'shell'])
    } as any;

    mockMemoryManager = {
      addPrimaryMessage: jest.fn(),
      getRecentMessages: jest.fn().mockReturnValue([]),
      saveCheckpoint: jest.fn(),
      loadCheckpoint: jest.fn().mockReturnValue(null)
    } as any;

    mockOpenAIService = {
      sendMessageWithTools: jest.fn()
    } as any;

    orchestrator = new EnhancedSpiralOrchestrator(
      mockToolsManager,
      mockMemoryManager,
      mockOpenAIService
    );
  });

  describe('Multi-Level Spiral', () => {
    it('should advance through multiple spiral levels', async () => {
      const request = 'Create a complex application with testing';
      
      const result = await orchestrator.processInSpiral(request, {
        maxLevels: 5,
        minScore: 80,
        enableCascade: true
      });

      expect(result.levels).toBeDefined();
      expect(result.levels.length).toBeGreaterThan(0);
      expect(result.finalScore).toBeGreaterThanOrEqual(80);
    });

    it('should stop when desired score is achieved', async () => {
      const request = 'Simple task';
      
      mockOpenAIService.sendMessageWithTools.mockResolvedValue({
        response: 'Task completed',
        toolCalls: []
      });

      const result = await orchestrator.processInSpiral(request, {
        maxLevels: 10,
        minScore: 80,
        enableCascade: false
      });

      expect(result.levels.length).toBeLessThan(10);
      expect(result.earlyTermination).toBe(true);
      expect(result.terminationReason).toBe('score_achieved');
    });

    it('should track improvements across levels', async () => {
      const request = 'Optimize this code';
      
      let level = 0;
      mockOpenAIService.sendMessageWithTools.mockImplementation(async () => {
        level++;
        return {
          response: `Level ${level} response`,
          score: 60 + (level * 10) // Gradual improvement
        };
      });

      const result = await orchestrator.processInSpiral(request, {
        maxLevels: 5,
        minScore: 80,
        enableCascade: true
      });

      expect(result.scoreProgression).toBeDefined();
      expect(result.scoreProgression.length).toBeGreaterThan(1);
      expect(result.scoreProgression[result.scoreProgression.length - 1])
        .toBeGreaterThan(result.scoreProgression[0]);
    });

    it('should use different strategies at each level', async () => {
      const request = 'Build a feature';
      
      const result = await orchestrator.processInSpiral(request, {
        maxLevels: 3,
        minScore: 80,
        enableCascade: true
      });

      const strategies = result.levels.map(l => l.strategy);
      expect(new Set(strategies).size).toBeGreaterThan(1); // Different strategies used
    });
  });

  describe('Level Strategies', () => {
    it('should apply research strategy at level 1', async () => {
      const level: SpiralLevel = {
        number: 1,
        strategy: 'research',
        score: 0,
        result: null
      };

      const config: SpiralConfig = { maxLevels: 3, minScore: 80, enableCascade: true };
      const result = await orchestrator.executeLevel(level, 'Research AI', config);
      
      expect(result.agentsUsed).toContain('researcher');
      expect(result.approach).toBe('information_gathering');
    });

    it('should apply creation strategy at level 2', async () => {
      const level: SpiralLevel = {
        number: 2,
        strategy: 'create',
        score: 0,
        result: null,
        previousContext: { research: 'completed' }
      };

      const config: SpiralConfig = { maxLevels: 3, minScore: 80, enableCascade: true };
      const result = await orchestrator.executeLevel(level, 'Create content', config);
      
      expect(result.agentsUsed).toContain('creator');
      expect(result.approach).toBe('content_generation');
    });

    it('should apply refinement strategy at higher levels', async () => {
      const level: SpiralLevel = {
        number: 4,
        strategy: 'refine',
        score: 75,
        result: 'Initial content',
        previousContext: { iterations: 3 }
      };

      const config: SpiralConfig = { maxLevels: 3, minScore: 80, enableCascade: true };
      const result = await orchestrator.executeLevel(level, 'Refine content', config);
      
      expect(result.agentsUsed).toContain('validator');
      expect(result.agentsUsed).toContain('improver');
      expect(result.improvements).toBeDefined();
    });

    it('should apply expert strategy for complex tasks', async () => {
      const level: SpiralLevel = {
        number: 5,
        strategy: 'expert',
        score: 78,
        result: 'Almost complete',
        complexity: 'high'
      };

      const config: SpiralConfig = { maxLevels: 3, minScore: 80, enableCascade: true };
      const result = await orchestrator.executeLevel(level, 'Expert review', config);
      
      expect(result.agentsUsed).toContain('expert');
      expect(result.deepAnalysis).toBe(true);
      expect(result.recommendations).toBeDefined();
    });
  });

  describe('Score Calculation', () => {
    it('should aggregate scores from multiple agents', async () => {
      const scores = [85, 90, 75, 88];
      const aggregated = orchestrator.aggregateScores(scores, 'weighted');
      
      expect(aggregated).toBeGreaterThan(0);
      expect(aggregated).toBeLessThanOrEqual(100);
    });

    it('should apply different weighting strategies', async () => {
      const scores = [70, 80, 90];
      
      const avgScore = orchestrator.aggregateScores(scores, 'average');
      const weightedScore = orchestrator.aggregateScores(scores, 'weighted');
      const maxScore = orchestrator.aggregateScores(scores, 'maximum');
      
      expect(avgScore).toBe(80);
      expect(maxScore).toBe(90);
      expect(weightedScore).not.toBe(avgScore);
    });
  });

  describe('Cascade Integration', () => {
    it('should enable cascade delegation when configured', async () => {
      const result = await orchestrator.processInSpiral('Complex task', {
        maxLevels: 3,
        minScore: 80,
        enableCascade: true,
        maxCascadeDepth: 3
      });

      expect(result.cascadeEnabled).toBe(true);
      expect(result.totalAgentsUsed).toBeGreaterThan(1);
      expect(result.delegationDepth).toBeDefined();
    });

    it('should track cascade chains across levels', async () => {
      const result = await orchestrator.processInSpiral('Multi-agent task', {
        maxLevels: 2,
        minScore: 80,
        enableCascade: true,
        maxCascadeDepth: 2
      });

      expect(result.cascadeChains).toBeDefined();
      expect(result.cascadeChains.length).toBeGreaterThan(0);
      result.cascadeChains.forEach(chain => {
        expect(chain.level).toBeDefined();
        expect(chain.agents).toBeDefined();
      });
    });
  });

  describe('Checkpoint and Recovery', () => {
    it('should save checkpoints at each level', async () => {
      await orchestrator.processInSpiral('Long task', {
        maxLevels: 5,
        minScore: 80,
        enableCascade: true,
        enableCheckpoints: true
      });

      expect(mockMemoryManager.saveCheckpoint).toHaveBeenCalled();
      expect(mockMemoryManager.saveCheckpoint).toHaveBeenCalledTimes(5);
    });

    it('should recover from checkpoint on failure', async () => {
      mockOpenAIService.sendMessageWithTools
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({ response: 'Recovered', toolCalls: [] });

      mockMemoryManager.loadCheckpoint.mockReturnValue({
        level: 2,
        score: 70,
        context: {}
      });

      const result = await orchestrator.processInSpiral('Task with recovery', {
        maxLevels: 5,
        minScore: 80,
        enableCascade: true,
        enableCheckpoints: true
      });

      expect(result.recoveredFromCheckpoint).toBe(true);
      expect(result.recoveryLevel).toBe(2);
    });
  });

  describe('Performance Metrics', () => {
    it('should track execution time per level', async () => {
      const result = await orchestrator.processInSpiral('Timed task', {
        maxLevels: 3,
        minScore: 80,
        enableCascade: true,
        trackMetrics: true
      });

      expect(result.metrics).toBeDefined();
      expect(result.metrics.levelTimes).toBeDefined();
      expect(result.metrics.levelTimes.length).toBe(result.levels.length);
      result.metrics.levelTimes.forEach(time => {
        expect(time).toBeGreaterThan(0);
      });
    });

    it('should track token usage', async () => {
      const result = await orchestrator.processInSpiral('Token tracking', {
        maxLevels: 2,
        minScore: 80,
        enableCascade: true,
        trackMetrics: true
      });

      expect(result.metrics.totalTokens).toBeDefined();
      expect(result.metrics.tokensPerLevel).toBeDefined();
      expect(result.metrics.costEstimate).toBeDefined();
    });
  });
});