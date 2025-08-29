import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { CascadeAgent, CascadeTask } from '../../src/services/cascadeAgent';
import { EnhancedSpiralOrchestrator } from '../../src/services/enhancedSpiralOrchestrator';
import { ToolsManager } from '../../src/services/toolsManager';
import { MemoryManager } from '../../src/services/memoryManager';
import { OpenAIService } from '../../src/services/openAIService';
import { ApiService } from '../../src/services/apiService';
import { TimelineUI } from '../../src/ui/timelineUI';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Cascade Integration Tests', () => {
  let orchestrator: EnhancedSpiralOrchestrator;
  let toolsManager: ToolsManager;
  let memoryManager: MemoryManager;
  let openAIService: OpenAIService;
  let apiService: ApiService;
  let timelineUI: TimelineUI;
  let testDir: string;

  beforeAll(async () => {
    // Setup test directory
    testDir = path.join(process.cwd(), 'test-output', Date.now().toString());
    await fs.mkdir(testDir, { recursive: true });
    process.chdir(testDir);

    // Initialize services with production endpoint
    apiService = new ApiService('https://api.llm7.io/v1', ''); // LLM7 doesn't need API key
    openAIService = new OpenAIService(); // Will use LLM7 production
    memoryManager = new MemoryManager();
    toolsManager = new ToolsManager(apiService, memoryManager, openAIService);
    timelineUI = new TimelineUI(true); // Realtime mode

    orchestrator = new EnhancedSpiralOrchestrator(
      toolsManager,
      memoryManager,
      openAIService
    );
  });

  afterAll(async () => {
    // Cleanup
    process.chdir('..');
    // Keep test output for review
  });

  describe('Basic Cascade Functionality', () => {
    it('should execute simple task with cascade delegation', async () => {
      const agent = new CascadeAgent(
        {
          name: 'Test-Main',
          role: 'orchestrator',
          expertise: ['coordination', 'testing'],
          style: 'efficient',
          goals: ['complete test successfully'],
          constraints: ['use minimal resources']
        },
        {
          canUseTools: true,
          canDelegateToAgents: true,
          canMakeDecisions: true,
          canRequestRevision: true,
          canAccessMemory: true,
          availableTools: ['file_write', 'file_read']
        },
        toolsManager,
        memoryManager,
        openAIService
      );

      const task: CascadeTask = {
        id: 'test-cascade-1',
        type: 'create',
        description: 'Create a simple markdown file with project information',
        status: 'pending',
        iterations: 0,
        maxIterations: 3,
        requiredScore: 80,
        maxDepth: 2,
        currentDepth: 0
      };

      const result = await agent.executeWithCascade(task);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(75); // Allow some flexibility
      expect(result.taskId).toBe('test-cascade-1');
      
      // Check if file was created
      if (result.toolsUsed.includes('file_write')) {
        const files = await fs.readdir('.');
        expect(files.length).toBeGreaterThan(0);
      }

      // Add to timeline
      result.toolExecutions.forEach(exec => {
        timelineUI.addToolExecution(exec);
      });
      timelineUI.addScoreUpdate(result.score, 1, 'Test-Main');
    }, 30000); // 30 second timeout for API calls

    it('should handle multi-level delegation', async () => {
      const task: CascadeTask = {
        id: 'test-cascade-2',
        type: 'complex',
        description: 'Research AI trends and create a summary report',
        status: 'pending',
        iterations: 0,
        maxIterations: 5,
        requiredScore: 80,
        maxDepth: 3,
        currentDepth: 0
      };

      const agent = new CascadeAgent(
        {
          name: 'Multi-Level-Test',
          role: 'orchestrator',
          expertise: ['delegation', 'coordination'],
          style: 'strategic',
          goals: ['achieve high quality through delegation'],
          constraints: ['ensure score above 80%']
        },
        {
          canUseTools: true,
          canDelegateToAgents: true,
          canMakeDecisions: true,
          canRequestRevision: true,
          canAccessMemory: true,
          availableTools: toolsManager.getAvailableTools()
        },
        toolsManager,
        memoryManager,
        openAIService
      );

      const result = await agent.executeWithCascade(task);

      expect(result.delegationChain).toBeDefined();
      expect(result.delegationChain.length).toBeGreaterThan(0);
      expect(result.subAgentScores).toBeDefined();
      
      if (result.subAgentScores && result.subAgentScores.length > 0) {
        expect(result.aggregatedScore).toBeDefined();
        expect(result.aggregatedScore).toBeGreaterThan(0);
      }

      // Timeline tracking
      result.delegationChain.forEach((agentId, index) => {
        timelineUI.addDelegation('Multi-Level-Test', `Agent-${agentId}`, task.description, index + 1);
      });
    }, 60000); // 60 second timeout

    it('should retry when score is below threshold', async () => {
      const task: CascadeTask = {
        id: 'test-cascade-3',
        type: 'validate',
        description: 'Create a high-quality technical documentation',
        status: 'pending',
        iterations: 0,
        maxIterations: 5,
        requiredScore: 85, // High threshold to trigger retries
        maxDepth: 2,
        currentDepth: 0
      };

      const agent = new CascadeAgent(
        {
          name: 'Retry-Test',
          role: 'creator',
          expertise: ['documentation', 'technical writing'],
          style: 'detailed',
          goals: ['achieve 85% quality score'],
          constraints: ['maximum 3 revision attempts']
        },
        {
          canUseTools: true,
          canDelegateToAgents: true,
          canMakeDecisions: true,
          canRequestRevision: true,
          canAccessMemory: true,
          availableTools: ['file_write']
        },
        toolsManager,
        memoryManager,
        openAIService
      );

      const result = await agent.executeWithCascade(task);

      expect(result.needsRevision).toBeDefined();
      if (result.score < 85) {
        expect(result.revisionAttempts).toBeGreaterThan(0);
        expect(result.feedbackChain).toBeDefined();
        expect(result.feedbackChain.length).toBeGreaterThan(0);
      }

      // Track revisions in timeline
      result.feedbackChain.forEach((feedback, index) => {
        timelineUI.addLog(`Revision ${index + 1}: ${feedback}`, 1, 'Retry-Test');
      });
    }, 60000);
  });

  describe('Spiral Mode Integration', () => {
    it('should process request through multiple spiral levels', async () => {
      const request = 'Create a simple calculator function in JavaScript';
      
      timelineUI.clear();
      const result = await orchestrator.processInSpiral(request, {
        maxLevels: 3,
        minScore: 80,
        enableCascade: true,
        maxCascadeDepth: 2,
        trackMetrics: true
      });

      expect(result).toBeDefined();
      expect(result.levels).toBeDefined();
      expect(result.levels.length).toBeGreaterThan(0);
      expect(result.finalScore).toBeDefined();
      
      // Check score progression
      expect(result.scoreProgression).toBeDefined();
      if (result.scoreProgression.length > 1) {
        // Score should generally improve
        const firstScore = result.scoreProgression[0];
        const lastScore = result.scoreProgression[result.scoreProgression.length - 1];
        expect(lastScore).toBeGreaterThanOrEqual(firstScore);
      }

      // Track levels in timeline
      result.levels.forEach(level => {
        timelineUI.addLevelChange(level);
        timelineUI.addScoreUpdate(level.score, level.number);
      });

      // Check metrics
      if (result.metrics) {
        expect(result.metrics.totalExecutionTime).toBeGreaterThan(0);
        expect(result.metrics.levelTimes).toBeDefined();
        expect(result.metrics.levelTimes.length).toBe(result.levels.length);
      }
    }, 90000); // 90 second timeout

    it('should stop early when target score is achieved', async () => {
      const request = 'Write a hello world function';
      
      const result = await orchestrator.processInSpiral(request, {
        maxLevels: 5,
        minScore: 80,
        enableCascade: false, // Simpler without cascade
        trackMetrics: true
      });

      expect(result.earlyTermination).toBeDefined();
      if (result.finalScore >= 80) {
        expect(result.earlyTermination).toBe(true);
        expect(result.terminationReason).toBe('score_achieved');
        expect(result.levels.length).toBeLessThanOrEqual(5);
      }
    }, 60000);

    it('should use different strategies across levels', async () => {
      const request = 'Build a REST API endpoint for user management';
      
      const result = await orchestrator.processInSpiral(request, {
        maxLevels: 4,
        minScore: 80,
        enableCascade: true,
        maxCascadeDepth: 2
      });

      const strategies = result.levels.map(l => l.strategy);
      const uniqueStrategies = new Set(strategies);
      
      expect(uniqueStrategies.size).toBeGreaterThan(1);
      
      // First level should be research
      if (result.levels.length > 0) {
        expect(result.levels[0].strategy).toBe('research');
      }
      
      // Should have creation phase
      expect(strategies).toContain('create');
    }, 90000);
  });

  describe('Tool Integration', () => {
    it('should use tools effectively in cascade', async () => {
      const task: CascadeTask = {
        id: 'test-tools-1',
        type: 'create',
        description: 'Create a Python script that reads a CSV file and generates a summary',
        status: 'pending',
        iterations: 0,
        maxIterations: 5,
        requiredScore: 80,
        maxDepth: 2,
        currentDepth: 0
      };

      const agent = new CascadeAgent(
        {
          name: 'Tool-Test',
          role: 'developer',
          expertise: ['programming', 'data analysis'],
          style: 'practical',
          goals: ['create working code'],
          constraints: ['use appropriate tools']
        },
        {
          canUseTools: true,
          canDelegateToAgents: true,
          canMakeDecisions: true,
          canRequestRevision: true,
          canAccessMemory: true,
          availableTools: ['file_write', 'shell', 'file_read']
        },
        toolsManager,
        memoryManager,
        openAIService
      );

      const result = await agent.executeWithCascade(task);

      expect(result.toolsUsed).toBeDefined();
      expect(result.toolsUsed.length).toBeGreaterThan(0);
      expect(result.toolExecutions).toBeDefined();
      
      // Should have created a file
      expect(result.toolsUsed).toContain('file_write');
      
      // Check tool execution success
      const successfulTools = result.toolExecutions.filter(e => e.success);
      expect(successfulTools.length).toBeGreaterThan(0);

      // Track tools in timeline
      result.toolExecutions.forEach(exec => {
        timelineUI.addToolExecution(exec, 1);
      });
    }, 60000);

    it('should handle tool failures gracefully', async () => {
      const task: CascadeTask = {
        id: 'test-tools-2',
        type: 'execute',
        description: 'Try to read a non-existent file and recover',
        status: 'pending',
        iterations: 0,
        maxIterations: 3,
        requiredScore: 75,
        maxDepth: 1,
        currentDepth: 0,
        context: {
          filename: 'non_existent_file_12345.txt'
        }
      };

      const agent = new CascadeAgent(
        {
          name: 'Error-Recovery',
          role: 'handler',
          expertise: ['error handling', 'recovery'],
          style: 'resilient',
          goals: ['handle errors gracefully'],
          constraints: ['always provide alternative solution']
        },
        {
          canUseTools: true,
          canDelegateToAgents: false,
          canMakeDecisions: true,
          canRequestRevision: true,
          canAccessMemory: true,
          availableTools: ['file_read', 'file_write']
        },
        toolsManager,
        memoryManager,
        openAIService
      );

      const result = await agent.executeWithCascade(task);

      expect(result).toBeDefined();
      
      // Should have attempted recovery
      if (result.toolFailures && result.toolFailures.length > 0) {
        expect(result.recovered).toBeDefined();
        
        // Even with failure, should provide some result
        expect(result.response).toBeDefined();
      }
    }, 45000);
  });

  describe('Timeline and Reporting', () => {
    it('should generate comprehensive timeline', async () => {
      const request = 'Create a simple web page with HTML and CSS';
      
      timelineUI.clear();
      
      const result = await orchestrator.processInSpiral(request, {
        maxLevels: 2,
        minScore: 75,
        enableCascade: true,
        maxCascadeDepth: 2,
        trackMetrics: true
      });

      // Get timeline summary
      const summary = timelineUI.getSummary();
      
      expect(summary.totalEvents).toBeGreaterThan(0);
      expect(summary.levels).toBeGreaterThan(0);
      
      // Export timeline
      const timelinePath = path.join(testDir, 'timeline.json');
      await timelineUI.exportToFile(timelinePath);
      
      // Verify export
      const timelineData = await fs.readFile(timelinePath, 'utf8');
      const timeline = JSON.parse(timelineData);
      
      expect(timeline.summary).toBeDefined();
      expect(timeline.events).toBeDefined();
      expect(timeline.events.length).toBe(summary.totalEvents);
    }, 60000);

    it('should track score progression accurately', async () => {
      const request = 'Write a function to validate email addresses';
      
      const result = await orchestrator.processInSpiral(request, {
        maxLevels: 3,
        minScore: 80,
        enableCascade: false,
        trackMetrics: true
      });

      expect(result.scoreProgression).toBeDefined();
      expect(result.scoreProgression.length).toBe(result.levels.length);
      
      // Each level should have a score
      result.levels.forEach((level, index) => {
        expect(level.score).toBeDefined();
        expect(level.score).toBe(result.scoreProgression[index]);
      });
      
      // Final score should match last progression
      if (result.scoreProgression.length > 0) {
        const lastProgressionScore = result.scoreProgression[result.scoreProgression.length - 1];
        expect(result.finalScore).toBe(lastProgressionScore);
      }
    }, 60000);
  });
});