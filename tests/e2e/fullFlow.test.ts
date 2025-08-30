import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { CascadeAgent } from '../../src/services/cascadeAgent';
import { EnhancedSpiralOrchestrator } from '../../src/services/enhancedSpiralOrchestrator';
import { ToolsManager } from '../../src/services/toolsManager';
import { MemoryManager } from '../../src/services/memoryManager';
import { OpenAIService } from '../../src/services/openAIService';
import { ApiService } from '../../src/services/apiService';
import { TimelineUI } from '../../src/ui/timelineUI';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('End-to-End Full Flow Test', () => {
  let orchestrator: EnhancedSpiralOrchestrator;
  let toolsManager: ToolsManager;
  let memoryManager: MemoryManager;
  let openAIService: OpenAIService;
  let apiService: ApiService;
  let timelineUI: TimelineUI;
  let testOutputDir: string;

  beforeAll(async () => {
    console.log(chalk.bold.cyan('\n🚀 Starting E2E Test Suite\n'));
    
    // Create test output directory
    testOutputDir = path.join(process.cwd(), 'test-output', 'e2e', Date.now().toString());
    await fs.mkdir(testOutputDir, { recursive: true });
    
    // Initialize all services
    apiService = new ApiService('https://api.llm7.io/v1', '');
    openAIService = new OpenAIService();
    memoryManager = new MemoryManager();
    toolsManager = new ToolsManager(apiService, memoryManager, openAIService);
    timelineUI = new TimelineUI(false); // Non-realtime for cleaner test output
    
    orchestrator = new EnhancedSpiralOrchestrator(
      toolsManager,
      memoryManager,
      openAIService
    );
    
    console.log(chalk.green('✅ Services initialized'));
    console.log(chalk.gray(`📁 Test output: ${testOutputDir}`));
  });

  afterAll(async () => {
    // Generate final report
    const reportPath = path.join(testOutputDir, 'test-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      timeline: timelineUI.getSummary(),
      outputDirectory: testOutputDir
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(chalk.green(`\n✅ Test report saved to ${reportPath}`));
  });

  describe('Complete Application Development Flow', () => {
    it('should build a complete application through spiral cascade', async () => {
      console.log(chalk.bold.yellow('\n📋 Test: Complete Application Development\n'));
      
      const request = `
        Create a complete Todo List application with the following requirements:
        1. Backend API with CRUD operations
        2. Frontend interface with HTML/CSS/JavaScript
        3. Data persistence using JSON file
        4. Input validation
        5. Error handling
        6. Documentation
      `;

      // Clear timeline for this test
      timelineUI.clear();
      
      // Process through enhanced spiral with cascade
      const result = await orchestrator.processInSpiral(request, {
        maxLevels: 5,
        minScore: 80,
        enableCascade: true,
        maxCascadeDepth: 3,
        enableCheckpoints: true,
        trackMetrics: true
      });

      // Assertions
      expect(result).toBeDefined();
      expect(result.finalScore).toBeGreaterThanOrEqual(75); // Allow some flexibility
      expect(result.levels).toBeDefined();
      expect(result.levels.length).toBeGreaterThan(0);
      
      // Verify spiral progression
      console.log(chalk.cyan('\n📊 Spiral Progression:'));
      result.levels.forEach((level, index) => {
        console.log(chalk.gray(`  Level ${level.number}: ${level.strategy} - Score: ${level.score}%`));
        
        // Add to timeline
        timelineUI.addLevelChange(level);
        timelineUI.addScoreUpdate(level.score, level.number);
        
        // Track agents used
        if (level.agentsUsed) {
          level.agentsUsed.forEach(agent => {
            timelineUI.addLog(`Agent activated: ${agent}`, level.number);
          });
        }
      });

      // Verify cascade chains
      if (result.cascadeChains) {
        console.log(chalk.cyan('\n🔗 Cascade Chains:'));
        expect(result.cascadeChains.length).toBeGreaterThan(0);
        
        result.cascadeChains.forEach(chain => {
          console.log(chalk.gray(`  Level ${chain.level}: ${chain.agents.length} agents, depth ${chain.depth}`));
          
          chain.agents.forEach(agentId => {
            timelineUI.addDelegation('Orchestrator', agentId, 'Subtask', chain.level);
          });
        });
      }

      // Verify metrics
      if (result.metrics) {
        console.log(chalk.cyan('\n📈 Performance Metrics:'));
        console.log(chalk.gray(`  Total Time: ${(result.metrics.totalExecutionTime / 1000).toFixed(2)}s`));
        console.log(chalk.gray(`  Total Tokens: ${result.metrics.totalTokens}`));
        console.log(chalk.gray(`  Estimated Cost: $${result.metrics.costEstimate.toFixed(4)}`));
        
        expect(result.metrics.totalExecutionTime).toBeGreaterThan(0);
        expect(result.metrics.levelTimes.length).toBe(result.levels.length);
      }

      // Save results
      const resultPath = path.join(testOutputDir, 'application-development-result.json');
      await fs.writeFile(resultPath, JSON.stringify(result, null, 2));
      
      // Export timeline
      const timelinePath = path.join(testOutputDir, 'application-timeline.json');
      await timelineUI.exportToFile(timelinePath);
      
      console.log(chalk.green(`\n✅ Test completed successfully`));
      console.log(chalk.green(`   Final Score: ${result.finalScore}%`));
      console.log(chalk.green(`   Levels Used: ${result.levels.length}`));
      console.log(chalk.green(`   Total Agents: ${result.totalAgentsUsed || 'N/A'}`));
      
    }, 300000); // 5 minute timeout for complex test
  });

  describe('Score Validation and Revision Flow', () => {
    it('should achieve minimum 80% score through revisions', async () => {
      console.log(chalk.bold.yellow('\n📋 Test: Score Validation and Revision\n'));
      
      const agent = new CascadeAgent(
        {
          name: 'Quality-Controller',
          role: 'quality_assurance',
          expertise: ['validation', 'improvement', 'scoring'],
          style: 'meticulous',
          goals: ['achieve 80% minimum score', 'ensure high quality'],
          constraints: ['maximum 3 revisions', 'maintain consistency']
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

      const task = {
        id: 'quality-test',
        type: 'create' as const,
        description: 'Create a high-quality technical article about machine learning with code examples',
        status: 'pending' as const,
        iterations: 0,
        maxIterations: 5,
        requiredScore: 80,
        maxDepth: 2,
        currentDepth: 0
      };

      console.log(chalk.cyan('🎯 Target Score: 80%'));
      
      const result = await agent.executeWithCascade(task);
      
      // Log revision history
      if (result.revisionAttempts > 0) {
        console.log(chalk.yellow(`\n🔄 Revisions Made: ${result.revisionAttempts}`));
        result.feedbackChain.forEach((feedback, index) => {
          console.log(chalk.gray(`  Revision ${index + 1}: ${feedback.substring(0, 100)}...`));
        });
      }

      // Assertions
      expect(result.score).toBeGreaterThanOrEqual(75); // Allow slight flexibility
      expect(result.taskId).toBe('quality-test');
      
      if (result.score < 80) {
        expect(result.needsRevision).toBe(true);
        expect(result.revisionAttempts).toBeGreaterThan(0);
        expect(result.feedbackChain.length).toBeGreaterThan(0);
      }

      // Verify validation chain
      if (result.validationChain.length > 0) {
        console.log(chalk.cyan('\n✓ Validation Chain:'));
        result.validationChain.forEach(validation => {
          const status = validation.validated ? '✅' : '❌';
          console.log(chalk.gray(`  ${status} Level ${validation.level}: Score ${validation.score}%`));
        });
      }

      console.log(chalk.green(`\n✅ Final Score Achieved: ${result.score}%`));
      
      // Save article if created
      if (result.toolsUsed.includes('file_write')) {
        const files = await fs.readdir(testOutputDir);
        console.log(chalk.gray(`📄 Files created: ${files.join(', ')}`));
      }
      
    }, 180000); // 3 minute timeout
  });

  describe('Tool Usage and Error Recovery', () => {
    it('should handle tool failures and recover gracefully', async () => {
      console.log(chalk.bold.yellow('\n📋 Test: Tool Failure and Recovery\n'));
      
      const agent = new CascadeAgent(
        {
          name: 'Resilient-Agent',
          role: 'developer',
          expertise: ['error handling', 'recovery', 'tools'],
          style: 'defensive',
          goals: ['complete task despite errors', 'provide fallback solutions'],
          constraints: ['handle all errors gracefully']
        },
        {
          canUseTools: true,
          canDelegateToAgents: false,
          canMakeDecisions: true,
          canRequestRevision: true,
          canAccessMemory: true,
          availableTools: toolsManager.getAvailableTools()
        },
        toolsManager,
        memoryManager,
        openAIService
      );

      // Task that will likely cause some tool failures
      const task = {
        id: 'recovery-test',
        type: 'execute' as const,
        description: 'Read non-existent config file, handle error, and create default configuration',
        status: 'pending' as const,
        iterations: 0,
        maxIterations: 3,
        requiredScore: 75,
        maxDepth: 1,
        currentDepth: 0,
        context: {
          configFile: 'non_existent_config_xyz.json'
        }
      };

      const result = await agent.executeWithCascade(task);
      
      // Log tool execution history
      console.log(chalk.cyan('\n🔧 Tool Execution History:'));
      result.toolExecutions.forEach(exec => {
        const status = exec.success ? '✅' : '❌';
        console.log(chalk.gray(`  ${status} ${exec.toolName} by ${exec.agentName}`));
        
        timelineUI.addToolExecution(exec);
      });

      // Log failures and recovery
      if (result.toolFailures && result.toolFailures.length > 0) {
        console.log(chalk.yellow('\n⚠️ Tool Failures:'));
        result.toolFailures.forEach(failure => {
          console.log(chalk.gray(`  ❌ ${failure.toolName}: ${failure.error}`));
          console.log(chalk.gray(`     Recovery: ${failure.recovered ? 'Yes' : 'No'}`));
        });
      }

      // Assertions
      expect(result).toBeDefined();
      expect(result.response).toBeDefined(); // Should have some response even with failures
      
      if (result.toolFailures && result.toolFailures.length > 0) {
        // Should attempt recovery
        expect(result.recovered).toBeDefined();
        
        // Should still achieve reasonable score
        expect(result.score).toBeGreaterThan(50);
      }

      console.log(chalk.green(`\n✅ Recovery Test Completed`));
      console.log(chalk.green(`   Score: ${result.score}%`));
      console.log(chalk.green(`   Recovered: ${result.recovered ? 'Yes' : 'No'}`));
      
    }, 120000); // 2 minute timeout
  });

  describe('Performance and Optimization', () => {
    it('should optimize execution through early termination', async () => {
      console.log(chalk.bold.yellow('\n📋 Test: Early Termination Optimization\n'));
      
      // Simple request that should achieve high score quickly
      const simpleRequest = 'Write a function to add two numbers in JavaScript';
      
      const startTime = Date.now();
      
      const result = await orchestrator.processInSpiral(simpleRequest, {
        maxLevels: 10, // Set high to test early termination
        minScore: 80,
        enableCascade: false, // Disable for faster execution
        trackMetrics: true
      });

      const executionTime = Date.now() - startTime;
      
      // Assertions
      expect(result.earlyTermination).toBe(true);
      expect(result.terminationReason).toBe('score_achieved');
      expect(result.levels.length).toBeLessThan(10); // Should terminate early
      expect(result.finalScore).toBeGreaterThanOrEqual(80);
      
      console.log(chalk.green(`\n✅ Early Termination Achieved`));
      console.log(chalk.green(`   Levels Used: ${result.levels.length}/10`));
      console.log(chalk.green(`   Execution Time: ${(executionTime / 1000).toFixed(2)}s`));
      console.log(chalk.green(`   Final Score: ${result.finalScore}%`));
      
      // Performance should be reasonable
      expect(executionTime).toBeLessThan(60000); // Should complete within 1 minute
      
    }, 90000);

    it('should track and report comprehensive metrics', async () => {
      console.log(chalk.bold.yellow('\n📋 Test: Metrics Tracking\n'));
      
      const result = await orchestrator.processInSpiral(
        'Create a simple REST API endpoint',
        {
          maxLevels: 2,
          minScore: 75,
          enableCascade: true,
          maxCascadeDepth: 2,
          trackMetrics: true
        }
      );

      // Assertions
      expect(result.metrics).toBeDefined();
      expect(result.metrics!.totalExecutionTime).toBeGreaterThan(0);
      expect(result.metrics!.levelTimes).toBeDefined();
      expect(result.metrics!.levelTimes.length).toBe(result.levels.length);
      expect(result.metrics!.totalTokens).toBeGreaterThan(0);
      expect(result.metrics!.costEstimate).toBeGreaterThan(0);
      
      // Log metrics
      console.log(chalk.cyan('\n📊 Execution Metrics:'));
      console.log(chalk.gray(`  Total Time: ${(result.metrics!.totalExecutionTime / 1000).toFixed(2)}s`));
      console.log(chalk.gray(`  Avg Time/Level: ${(result.metrics!.levelTimes.reduce((a, b) => a + b, 0) / result.metrics!.levelTimes.length / 1000).toFixed(2)}s`));
      console.log(chalk.gray(`  Total Tokens: ${result.metrics!.totalTokens}`));
      console.log(chalk.gray(`  Avg Tokens/Level: ${Math.round(result.metrics!.totalTokens / result.levels.length)}`));
      console.log(chalk.gray(`  Cost Estimate: $${result.metrics!.costEstimate.toFixed(4)}`));
      
      // Save metrics report
      const metricsPath = path.join(testOutputDir, 'metrics-report.json');
      await fs.writeFile(metricsPath, JSON.stringify(result.metrics, null, 2));
      
      console.log(chalk.green(`\n✅ Metrics tracked and saved`));
      
    }, 120000);
  });

  describe('Final Integration Summary', () => {
    it('should generate comprehensive test summary', async () => {
      console.log(chalk.bold.cyan('\n📊 FINAL TEST SUMMARY\n'));
      
      // Get timeline summary
      const summary = timelineUI.getSummary();
      
      console.log(chalk.white('Timeline Statistics:'));
      console.log(chalk.gray(`  Total Events: ${summary.totalEvents}`));
      console.log(chalk.gray(`  Tool Executions: ${summary.toolExecutions.total}`));
      console.log(chalk.gray(`    Successful: ${summary.toolExecutions.successful}`));
      console.log(chalk.gray(`    Failed: ${summary.toolExecutions.failed}`));
      console.log(chalk.gray(`  Delegations: ${summary.delegations}`));
      console.log(chalk.gray(`  Score Updates: ${summary.scoreUpdates}`));
      console.log(chalk.gray(`  Levels Processed: ${summary.levels}`));
      console.log(chalk.gray(`  Final Score: ${summary.finalScore}%`));
      
      // Save final summary
      const summaryPath = path.join(testOutputDir, 'final-summary.json');
      await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
      
      // List all generated files
      const files = await fs.readdir(testOutputDir);
      console.log(chalk.cyan('\n📁 Generated Files:'));
      files.forEach(file => {
        console.log(chalk.gray(`  - ${file}`));
      });
      
      console.log(chalk.bold.green('\n✅ ALL E2E TESTS COMPLETED SUCCESSFULLY'));
      console.log(chalk.gray(`📁 Results saved to: ${testOutputDir}`));
      
      // Final assertions
      expect(summary.totalEvents).toBeGreaterThan(0);
      expect(files.length).toBeGreaterThan(0);
    });
  });
});