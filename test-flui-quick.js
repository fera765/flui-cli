#!/usr/bin/env node

const { CascadeAgent } = require('./dist/services/cascadeAgent');
const { EnhancedSpiralOrchestrator } = require('./dist/services/enhancedSpiralOrchestrator');
const { ToolsManager } = require('./dist/services/toolsManager');
const { MemoryManager } = require('./dist/services/memoryManager');
const { OpenAIService } = require('./dist/services/openAIService');
const { ApiService } = require('./dist/services/apiService');
const { TimelineUI } = require('./dist/ui/timelineUI');
const chalk = require('chalk');

// Quick test with 3 scenarios
const quickTests = [
  {
    id: 'quick-1',
    name: 'Hello World Function',
    description: 'Write a simple hello world function in JavaScript',
    requiredScore: 80,
    category: 'Development'
  },
  {
    id: 'quick-2',
    name: 'Fibonacci Function',
    description: 'Create a function to calculate fibonacci numbers',
    requiredScore: 80,
    category: 'Development'
  },
  {
    id: 'quick-3',
    name: 'Simple README',
    description: 'Write a brief README file for a Node.js project',
    requiredScore: 80,
    category: 'Documentation'
  }
];

async function runQuickTests() {
  console.log(chalk.bold.cyan('\n🚀 FLUI Quick Test (3 scenarios)\n'));
  
  // Initialize services
  const apiService = new ApiService('https://api.llm7.io/v1', '');
  const openAIService = new OpenAIService();
  const memoryManager = new MemoryManager();
  const toolsManager = new ToolsManager(apiService, memoryManager, openAIService);
  const timelineUI = new TimelineUI(false);
  
  let passedTests = 0;
  const results = [];
  
  for (let i = 0; i < quickTests.length; i++) {
    const test = quickTests[i];
    console.log(chalk.yellow(`\n━━━ Test ${i + 1}/3: ${test.name} ━━━`));
    console.log(chalk.gray(test.description));
    
    const startTime = Date.now();
    
    try {
      // Create agent for test
      const agent = new CascadeAgent(
        {
          name: `QuickTest-${test.id}`,
          role: 'developer',
          expertise: ['coding', 'documentation'],
          style: 'efficient',
          goals: [`achieve ${test.requiredScore}% score`],
          constraints: ['complete quickly']
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
        id: test.id,
        type: 'create',
        description: test.description,
        status: 'pending',
        iterations: 0,
        maxIterations: 2,
        requiredScore: test.requiredScore,
        maxDepth: 1,
        currentDepth: 0
      };
      
      const result = await agent.executeWithCascade(task);
      const executionTime = Date.now() - startTime;
      
      const success = result.score >= test.requiredScore;
      if (success) passedTests++;
      
      results.push({
        test: test.name,
        score: result.score,
        success,
        time: (executionTime / 1000).toFixed(2)
      });
      
      const statusIcon = success ? '✅' : '❌';
      console.log(chalk[success ? 'green' : 'red'](`${statusIcon} Score: ${result.score}%`));
      console.log(chalk.gray(`Time: ${(executionTime / 1000).toFixed(2)}s`));
      
      // Small delay between tests
      if (i < quickTests.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
      results.push({
        test: test.name,
        score: 0,
        success: false,
        error: error.message
      });
    }
  }
  
  // Summary
  console.log(chalk.bold.cyan('\n━━━ QUICK TEST SUMMARY ━━━'));
  console.log(chalk.white(`Total: ${quickTests.length} tests`));
  console.log(chalk.green(`Passed: ${passedTests}`));
  console.log(chalk.red(`Failed: ${quickTests.length - passedTests}`));
  console.log(chalk.yellow(`Success Rate: ${((passedTests / quickTests.length) * 100).toFixed(0)}%`));
  
  console.log(chalk.white('\nResults:'));
  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    console.log(chalk.gray(`  ${icon} ${r.test}: ${r.score}% (${r.time}s)`));
  });
  
  if (passedTests === quickTests.length) {
    console.log(chalk.bold.green('\n🎉 All quick tests passed!'));
  }
}

// Run quick tests
runQuickTests().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});