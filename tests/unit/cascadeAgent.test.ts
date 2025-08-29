import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CascadeAgent, CascadeTask, AgentScore, DelegationResult } from '../../src/services/cascadeAgent';
import { AutonomousAgent, AgentPersona, AgentCapabilities } from '../../src/services/autonomousAgent';
import { ToolsManager } from '../../src/services/toolsManager';
import { MemoryManager } from '../../src/services/memoryManager';
import { OpenAIService } from '../../src/services/openAIService';

describe('CascadeAgent', () => {
  let cascadeAgent: CascadeAgent;
  let mockToolsManager: jest.Mocked<ToolsManager>;
  let mockMemoryManager: jest.Mocked<MemoryManager>;
  let mockOpenAIService: jest.Mocked<OpenAIService>;

  beforeEach(() => {
    mockToolsManager = {
      executeTool: jest.fn(),
      getAvailableTools: jest.fn().mockReturnValue(['file_write', 'shell', 'file_read'])
    } as any;

    mockMemoryManager = {
      addPrimaryMessage: jest.fn(),
      getRecentMessages: jest.fn().mockReturnValue([])
    } as any;

    mockOpenAIService = {
      sendMessageWithTools: jest.fn()
    } as any;

    cascadeAgent = new CascadeAgent(
      {
        name: 'TestAgent',
        role: 'orchestrator',
        expertise: ['testing', 'validation'],
        style: 'analytical',
        goals: ['achieve 80% score'],
        constraints: ['must validate all responses']
      },
      {
        canUseTools: true,
        canDelegateToAgents: true,
        canMakeDecisions: true,
        canRequestRevision: true,
        canAccessMemory: true,
        availableTools: ['file_write', 'shell', 'file_read']
      },
      mockToolsManager,
      mockMemoryManager,
      mockOpenAIService
    );
  });

  describe('Cascade Delegation', () => {
    it('should allow delegated agents to delegate further', async () => {
      const task: CascadeTask = {
        id: 'test-1',
        type: 'create',
        description: 'Create a full application',
        status: 'pending',
        iterations: 0,
        maxIterations: 5,
        requiredScore: 80,
        maxDepth: 3,
        currentDepth: 0
      };

      const result = await cascadeAgent.executeWithCascade(task);
      
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.delegationChain).toBeDefined();
      expect(result.delegationChain.length).toBeGreaterThan(0);
    });

    it('should validate scores at each level', async () => {
      const task: CascadeTask = {
        id: 'test-2',
        type: 'research',
        description: 'Research AI topics',
        status: 'pending',
        iterations: 0,
        maxIterations: 5,
        requiredScore: 80,
        maxDepth: 2,
        currentDepth: 0
      };

      mockOpenAIService.sendMessageWithTools.mockResolvedValue({
        response: 'Research completed',
        score: 75 // Below threshold
      });

      const result = await cascadeAgent.executeWithCascade(task);
      
      expect(result.needsRevision).toBe(true);
      expect(result.revisionAttempts).toBeGreaterThan(0);
    });

    it('should allow delegated agents to use tools', async () => {
      const task: CascadeTask = {
        id: 'test-3',
        type: 'create',
        description: 'Create and save a file',
        status: 'pending',
        iterations: 0,
        maxIterations: 5,
        requiredScore: 80,
        maxDepth: 2,
        currentDepth: 0
      };

      const result = await cascadeAgent.executeWithCascade(task);
      
      expect(mockToolsManager.executeTool).toHaveBeenCalled();
      expect(result.toolsUsed).toContain('file_write');
    });

    it('should respect maximum delegation depth', async () => {
      const task: CascadeTask = {
        id: 'test-4',
        type: 'create',
        description: 'Complex nested task',
        status: 'pending',
        iterations: 0,
        maxIterations: 5,
        requiredScore: 80,
        maxDepth: 2,
        currentDepth: 2 // Already at max depth
      };

      const result = await cascadeAgent.executeWithCascade(task);
      
      expect(result.delegationChain.length).toBe(0);
      expect(result.executedDirectly).toBe(true);
    });

    it('should aggregate scores from sub-agents', async () => {
      const task: CascadeTask = {
        id: 'test-5',
        type: 'create',
        description: 'Task with multiple parts',
        status: 'pending',
        iterations: 0,
        maxIterations: 5,
        requiredScore: 80,
        maxDepth: 3,
        currentDepth: 0
      };

      const result = await cascadeAgent.executeWithCascade(task);
      
      expect(result.aggregatedScore).toBeDefined();
      expect(result.subAgentScores).toBeDefined();
      expect(result.subAgentScores.length).toBeGreaterThan(0);
    });
  });

  describe('Score Validation', () => {
    it('should calculate score based on multiple criteria', async () => {
      const response = {
        content: 'Test response',
        completeness: 90,
        accuracy: 85,
        relevance: 88
      };

      const score = await cascadeAgent.calculateScore(response);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should retry if score is below 80%', async () => {
      const task: CascadeTask = {
        id: 'test-6',
        type: 'validate',
        description: 'Task requiring high score',
        status: 'pending',
        iterations: 0,
        maxIterations: 5,
        requiredScore: 80,
        maxDepth: 1,
        currentDepth: 0
      };

      let attempts = 0;
      mockOpenAIService.sendMessageWithTools.mockImplementation(async () => {
        attempts++;
        return {
          response: 'Improved response',
          score: attempts < 3 ? 70 : 85
        };
      });

      const result = await cascadeAgent.executeWithCascade(task);
      
      expect(attempts).toBe(3);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.revisionAttempts).toBe(2);
    });
  });

  describe('Response Chain Validation', () => {
    it('should validate responses up the delegation chain', async () => {
      const task: CascadeTask = {
        id: 'test-7',
        type: 'validate',
        description: 'Task with validation chain',
        status: 'pending',
        iterations: 0,
        maxIterations: 5,
        requiredScore: 80,
        maxDepth: 3,
        currentDepth: 0
      };

      const result = await cascadeAgent.executeWithCascade(task);
      
      expect(result.validationChain).toBeDefined();
      result.validationChain.forEach(validation => {
        expect(validation.validated).toBe(true);
        expect(validation.score).toBeGreaterThanOrEqual(80);
      });
    });

    it('should propagate feedback up the chain', async () => {
      const task: CascadeTask = {
        id: 'test-8',
        type: 'refine',
        description: 'Task with feedback propagation',
        status: 'pending',
        iterations: 0,
        maxIterations: 5,
        requiredScore: 80,
        maxDepth: 2,
        currentDepth: 0
      };

      const result = await cascadeAgent.executeWithCascade(task);
      
      expect(result.feedbackChain).toBeDefined();
      expect(result.feedbackChain.length).toBeGreaterThan(0);
    });
  });

  describe('Tool Usage in Cascade', () => {
    it('should track tool usage across all agents', async () => {
      const task: CascadeTask = {
        id: 'test-9',
        type: 'execute',
        description: 'Task using multiple tools',
        status: 'pending',
        iterations: 0,
        maxIterations: 5,
        requiredScore: 80,
        maxDepth: 2,
        currentDepth: 0
      };

      mockToolsManager.executeTool
        .mockResolvedValueOnce({ status: 'success', output: 'file created' })
        .mockResolvedValueOnce({ status: 'success', output: 'command executed' });

      const result = await cascadeAgent.executeWithCascade(task);
      
      expect(result.toolExecutions).toBeDefined();
      expect(result.toolExecutions.length).toBeGreaterThan(0);
      expect(result.toolExecutions[0].agentId).toBeDefined();
      expect(result.toolExecutions[0].toolName).toBeDefined();
    });

    it('should handle tool failures gracefully', async () => {
      const task: CascadeTask = {
        id: 'test-10',
        type: 'execute',
        description: 'Task with tool failure',
        status: 'pending',
        iterations: 0,
        maxIterations: 5,
        requiredScore: 80,
        maxDepth: 1,
        currentDepth: 0
      };

      mockToolsManager.executeTool.mockRejectedValueOnce(new Error('Tool failed'));

      const result = await cascadeAgent.executeWithCascade(task);
      
      expect(result.toolFailures).toBeDefined();
      expect(result.toolFailures.length).toBeGreaterThan(0);
      expect(result.recovered).toBe(true);
    });
  });
});