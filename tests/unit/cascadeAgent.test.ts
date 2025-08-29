import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CascadeAgent, CascadeTask, AgentScore, DelegationResult } from '../../src/services/cascadeAgent';
import { AutonomousAgent, AgentPersona, AgentCapabilities } from '../../src/services/autonomousAgent';
import { ToolsManager } from '../../src/services/toolsManager';
import { MemoryManager } from '../../src/services/memoryManager';
import { OpenAIService } from '../../src/services/openAIService';

// Mock all dependencies
jest.mock('../../src/services/toolsManager');
jest.mock('../../src/services/memoryManager');
jest.mock('../../src/services/openAIService');

describe('CascadeAgent', () => {
  let cascadeAgent: CascadeAgent;
  let mockToolsManager: jest.Mocked<ToolsManager>;
  let mockMemoryManager: jest.Mocked<MemoryManager>;
  let mockOpenAIService: jest.Mocked<OpenAIService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockToolsManager = new ToolsManager(null as any, null as any, null as any) as jest.Mocked<ToolsManager>;
    mockMemoryManager = new MemoryManager() as jest.Mocked<MemoryManager>;
    mockOpenAIService = new OpenAIService() as jest.Mocked<OpenAIService>;
    
    // Setup default mock implementations
    mockToolsManager.executeTool = jest.fn().mockResolvedValue({
      toolName: 'test',
      status: 'success',
      output: 'test output'
    });
    
    mockToolsManager.getAvailableTools = jest.fn().mockReturnValue(['file_write', 'shell', 'file_read']);
    
    mockMemoryManager.addPrimaryMessage = jest.fn();
    mockMemoryManager.getRecentMessages = jest.fn().mockReturnValue([]);
    
    mockOpenAIService.sendMessageWithTools = jest.fn().mockResolvedValue({
      response: 'Test response',
      toolCalls: []
    });

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
    it('should execute task with cascade successfully', async () => {
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

      // Mock score calculation to return high score
      mockOpenAIService.sendMessageWithTools = jest.fn()
        .mockResolvedValueOnce({ response: 'Strategy analysis', toolCalls: [] })
        .mockResolvedValueOnce({ response: 'Task completed successfully', toolCalls: [] })
        .mockResolvedValueOnce({ response: JSON.stringify({ overall: 85 }), toolCalls: [] });

      const result = await cascadeAgent.executeWithCascade(task);
      
      expect(result).toBeDefined();
      expect(result.taskId).toBe('test-1');
      expect(result.score).toBeGreaterThanOrEqual(75);
    });

    it('should handle delegation to sub-agents', async () => {
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

      // Mock to trigger delegation
      mockOpenAIService.sendMessageWithTools = jest.fn()
        .mockResolvedValueOnce({ 
          response: JSON.stringify({
            requiresDelegation: true,
            suggestedAgents: [{ type: 'researcher', task: 'Research AI' }]
          }), 
          toolCalls: [] 
        })
        .mockResolvedValue({ response: JSON.stringify({ overall: 85 }), toolCalls: [] });

      const result = await cascadeAgent.executeWithCascade(task);
      
      expect(result).toBeDefined();
      expect(result.executedDirectly).toBe(false);
    });

    it('should retry when score is below threshold', async () => {
      const task: CascadeTask = {
        id: 'test-3',
        type: 'validate',
        description: 'Task requiring high score',
        status: 'pending',
        iterations: 0,
        maxIterations: 5,
        requiredScore: 80,
        maxDepth: 1,
        currentDepth: 0
      };

      let callCount = 0;
      mockOpenAIService.sendMessageWithTools = jest.fn().mockImplementation(async () => {
        callCount++;
        if (callCount <= 2) {
          return { response: JSON.stringify({ overall: 70 }), toolCalls: [] };
        } else if (callCount <= 4) {
          return { response: 'Improved response', toolCalls: [] };
        } else {
          return { response: JSON.stringify({ overall: 85 }), toolCalls: [] };
        }
      });

      const result = await cascadeAgent.executeWithCascade(task);
      
      expect(result.revisionAttempts).toBeGreaterThan(0);
      expect(result.score).toBeGreaterThanOrEqual(75);
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

      mockOpenAIService.sendMessageWithTools = jest.fn()
        .mockResolvedValue({ response: JSON.stringify({ overall: 85 }), toolCalls: [] });

      const result = await cascadeAgent.executeWithCascade(task);
      
      expect(result.executedDirectly).toBe(true);
      expect(result.delegationChain.length).toBe(0);
    });
  });

  describe('Tool Usage', () => {
    it('should use tools when needed', async () => {
      const task: CascadeTask = {
        id: 'test-5',
        type: 'execute',
        description: 'Create and save a file',
        status: 'pending',
        iterations: 0,
        maxIterations: 5,
        requiredScore: 80,
        maxDepth: 2,
        currentDepth: 0
      };

      mockOpenAIService.sendMessageWithTools = jest.fn()
        .mockResolvedValue({ response: JSON.stringify({ overall: 85 }), toolCalls: [] });

      mockToolsManager.executeTool = jest.fn().mockResolvedValue({
        toolName: 'file_write',
        status: 'success',
        output: 'File created'
      });

      const result = await cascadeAgent.executeWithCascade(task);
      
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(75);
    });

    it('should handle tool failures gracefully', async () => {
      const task: CascadeTask = {
        id: 'test-6',
        type: 'execute',
        description: 'Task with tool failure',
        status: 'pending',
        iterations: 0,
        maxIterations: 5,
        requiredScore: 80,
        maxDepth: 1,
        currentDepth: 0
      };

      mockToolsManager.executeTool = jest.fn().mockRejectedValueOnce(new Error('Tool failed'));
      
      mockOpenAIService.sendMessageWithTools = jest.fn()
        .mockResolvedValue({ response: JSON.stringify({ overall: 75 }), toolCalls: [] });

      const result = await cascadeAgent.executeWithCascade(task);
      
      expect(result).toBeDefined();
      expect(result.toolFailures).toBeDefined();
    });
  });

  describe('Score Calculation', () => {
    it('should calculate score correctly', async () => {
      const response = {
        content: 'Test response',
        completeness: 90,
        accuracy: 85,
        relevance: 88
      };

      mockOpenAIService.sendMessageWithTools = jest.fn()
        .mockResolvedValueOnce({ 
          response: JSON.stringify({
            completeness: 90,
            accuracy: 85,
            relevance: 88,
            quality: 87,
            overall: 87
          }), 
          toolCalls: [] 
        });

      const score = await cascadeAgent.calculateScore(response);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});