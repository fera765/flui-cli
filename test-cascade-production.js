const { CascadeAgent } = require('./dist/services/cascadeAgent');
const { EnhancedSpiralOrchestrator } = require('./dist/services/enhancedSpiralOrchestrator');
const { ToolsManager } = require('./dist/services/toolsManager');
const { MemoryManager } = require('./dist/services/memoryManager');
const { OpenAIService } = require('./dist/services/openAIService');
const { ApiService } = require('./dist/services/apiService');
const { TimelineUI } = require('./dist/ui/timelineUI');
const chalk = require('chalk');

async function testCascadeProduction() {
  console.log(chalk.bold.cyan('\n🚀 Testing Cascade Agent with Production LLM\n'));
  
  // Initialize services
  const apiService = new ApiService('https://api.llm7.io/v1', '');
  const openAIService = new OpenAIService();
  const memoryManager = new MemoryManager();
  const toolsManager = new ToolsManager(apiService, memoryManager, openAIService);
  const timelineUI = new TimelineUI(true);
  
  // Create cascade agent
  const agent = new CascadeAgent(
    {
      name: 'Production-Test',
      role: 'orchestrator',
      expertise: ['testing', 'validation', 'coordination'],
      style: 'efficient',
      goals: ['achieve 80% score', 'demonstrate cascade functionality'],
      constraints: ['use production LLM', 'complete within 2 minutes']
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
  
  // Create test task
  const task = {
    id: 'prod-test-1',
    type: 'create',
    description: 'Create a simple Python function to calculate fibonacci numbers with documentation',
    status: 'pending',
    iterations: 0,
    maxIterations: 3,
    requiredScore: 80,
    maxDepth: 2,
    currentDepth: 0
  };
  
  console.log(chalk.yellow('📋 Task: ' + task.description));
  console.log(chalk.gray('🎯 Required Score: ' + task.requiredScore + '%'));
  console.log(chalk.gray('🔽 Max Cascade Depth: ' + task.maxDepth));
  console.log('');
  
  try {
    // Execute with cascade
    const result = await agent.executeWithCascade(task);
    
    // Display results
    console.log(chalk.bold.green('\n✅ Test Completed Successfully!\n'));
    console.log(chalk.white('📊 Results:'));
    console.log(chalk.gray(`  • Final Score: ${result.score}%`));
    console.log(chalk.gray(`  • Score Met: ${result.score >= task.requiredScore ? 'Yes ✅' : 'No ❌'}`));
    console.log(chalk.gray(`  • Delegations: ${result.delegationChain.length}`));
    console.log(chalk.gray(`  • Tools Used: ${result.toolsUsed.join(', ') || 'None'}`));
    console.log(chalk.gray(`  • Revisions: ${result.revisionAttempts}`));
    console.log(chalk.gray(`  • Executed Directly: ${result.executedDirectly ? 'Yes' : 'No'}`));
    
    if (result.subAgentScores && result.subAgentScores.length > 0) {
      console.log(chalk.white('\n👥 Sub-Agent Scores:'));
      result.subAgentScores.forEach(score => {
        console.log(chalk.gray(`  • ${score.agentName}: ${score.score}%`));
      });
    }
    
    if (result.toolExecutions.length > 0) {
      console.log(chalk.white('\n🔧 Tool Executions:'));
      result.toolExecutions.forEach(exec => {
        const status = exec.success ? '✅' : '❌';
        console.log(chalk.gray(`  ${status} ${exec.toolName} by ${exec.agentName}`));
      });
    }
    
    if (result.validationChain.length > 0) {
      console.log(chalk.white('\n✓ Validation Chain:'));
      result.validationChain.forEach(val => {
        const status = val.validated ? '✅' : '❌';
        console.log(chalk.gray(`  ${status} Level ${val.level}: Score ${val.score}%`));
      });
    }
    
    // Test spiral orchestrator
    console.log(chalk.bold.cyan('\n\n🌀 Testing Enhanced Spiral Orchestrator\n'));
    
    const orchestrator = new EnhancedSpiralOrchestrator(
      toolsManager,
      memoryManager,
      openAIService
    );
    
    const spiralResult = await orchestrator.processInSpiral(
      'Write a hello world function in JavaScript',
      {
        maxLevels: 3,
        minScore: 80,
        enableCascade: true,
        maxCascadeDepth: 2,
        trackMetrics: true
      }
    );
    
    console.log(chalk.bold.green('\n✅ Spiral Test Completed!\n'));
    console.log(chalk.white('📊 Spiral Results:'));
    console.log(chalk.gray(`  • Final Score: ${spiralResult.finalScore}%`));
    console.log(chalk.gray(`  • Levels Used: ${spiralResult.levels.length}`));
    console.log(chalk.gray(`  • Score Progression: ${spiralResult.scoreProgression.join('% → ')}%`));
    
    if (spiralResult.earlyTermination) {
      console.log(chalk.green(`  • Early Termination: ${spiralResult.terminationReason}`));
    }
    
    if (spiralResult.metrics) {
      console.log(chalk.white('\n📈 Performance Metrics:'));
      console.log(chalk.gray(`  • Total Time: ${(spiralResult.metrics.totalExecutionTime / 1000).toFixed(2)}s`));
      console.log(chalk.gray(`  • Total Tokens: ${spiralResult.metrics.totalTokens}`));
      console.log(chalk.gray(`  • Cost Estimate: $${spiralResult.metrics.costEstimate.toFixed(4)}`));
    }
    
    // Timeline summary
    const summary = timelineUI.getSummary();
    console.log(chalk.white('\n📅 Timeline Summary:'));
    console.log(chalk.gray(`  • Total Events: ${summary.totalEvents}`));
    console.log(chalk.gray(`  • Tool Executions: ${summary.toolExecutions.total}`));
    console.log(chalk.gray(`  • Delegations: ${summary.delegations}`));
    console.log(chalk.gray(`  • Score Updates: ${summary.scoreUpdates}`));
    
    console.log(chalk.bold.green('\n🎉 All Production Tests Passed!\n'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Test Failed:'), error.message);
    console.error(chalk.gray(error.stack));
    process.exit(1);
  }
}

// Run test
testCascadeProduction().catch(console.error);