#!/usr/bin/env node

const { CascadeAgent } = require('./dist/services/cascadeAgent');
const { ToolsManager } = require('./dist/services/toolsManager');
const { MemoryManager } = require('./dist/services/memoryManager');
const { OpenAIService } = require('./dist/services/openAIService');
const { ApiService } = require('./dist/services/apiService');
const { TimelineUI } = require('./dist/ui/timelineUI');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

// Demo test scenarios - 5 diverse tests
const demoTests = [
  {
    id: 'demo-1',
    name: 'Fibonacci Function',
    description: 'Create a recursive fibonacci function in Python with memoization',
    requiredScore: 80,
    category: 'Development'
  },
  {
    id: 'demo-2',
    name: 'API Documentation',
    description: 'Write REST API documentation for a user authentication endpoint',
    requiredScore: 80,
    category: 'Documentation'
  },
  {
    id: 'demo-3',
    name: 'Code Review',
    description: 'Review this code and suggest improvements: function add(a,b) { return a+b }',
    requiredScore: 80,
    category: 'Analysis'
  },
  {
    id: 'demo-4',
    name: 'Blog Article',
    description: 'Write a short blog post about the benefits of test-driven development',
    requiredScore: 80,
    category: 'Creative'
  },
  {
    id: 'demo-5',
    name: 'SQL Query',
    description: 'Write an SQL query to find the top 5 customers by total purchase amount',
    requiredScore: 80,
    category: 'Development'
  }
];

async function runDemoTests() {
  console.log(chalk.bold.cyan('\n════════════════════════════════════════'));
  console.log(chalk.bold.cyan('       FLUI DEMO TEST SUITE'));
  console.log(chalk.bold.cyan('         5 Test Scenarios'));
  console.log(chalk.bold.cyan('════════════════════════════════════════\n'));
  
  // Create output directory
  const testDir = path.join(process.cwd(), 'flui-demo-results', Date.now().toString());
  await fs.mkdir(testDir, { recursive: true });
  
  // Initialize services
  console.log(chalk.gray('Initializing services...'));
  const apiService = new ApiService('https://api.llm7.io/v1', '');
  const openAIService = new OpenAIService();
  const memoryManager = new MemoryManager();
  const toolsManager = new ToolsManager(apiService, memoryManager, openAIService);
  const timelineUI = new TimelineUI(false);
  
  console.log(chalk.green('✅ Services initialized\n'));
  
  const results = [];
  let passedTests = 0;
  
  // Run each test
  for (let i = 0; i < demoTests.length; i++) {
    const test = demoTests[i];
    console.log(chalk.bold.yellow(`━━━ Test ${i + 1}/5: ${test.name} ━━━`));
    console.log(chalk.gray(`Category: ${test.category}`));
    console.log(chalk.gray(`Task: ${test.description}`));
    console.log(chalk.gray(`Required Score: ${test.requiredScore}%`));
    
    const startTime = Date.now();
    
    try {
      // Create agent for test
      const agent = new CascadeAgent(
        {
          name: `Demo-${test.id}`,
          role: test.category === 'Development' ? 'developer' : 
                test.category === 'Documentation' ? 'technical_writer' :
                test.category === 'Analysis' ? 'analyst' : 'creator',
          expertise: [test.category.toLowerCase(), 'quality assurance'],
          style: 'professional and efficient',
          goals: [`achieve ${test.requiredScore}% score`, 'deliver high-quality output'],
          constraints: ['complete within 30 seconds', 'be concise but thorough']
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
      
      // Create task
      const task = {
        id: test.id,
        type: test.category === 'Analysis' ? 'validate' : 'create',
        description: test.description,
        status: 'pending',
        iterations: 0,
        maxIterations: 2,
        requiredScore: test.requiredScore,
        maxDepth: 1,
        currentDepth: 0
      };
      
      // Execute with cascade
      const result = await agent.executeWithCascade(task);
      const executionTime = Date.now() - startTime;
      
      // Check success
      const success = result.score >= test.requiredScore;
      if (success) passedTests++;
      
      // Store result
      results.push({
        ...test,
        score: result.score,
        success,
        executionTime,
        delegations: result.delegationChain.length,
        revisions: result.revisionAttempts,
        toolsUsed: result.toolsUsed.length
      });
      
      // Display result
      const statusIcon = success ? '✅' : '❌';
      const statusColor = success ? chalk.green : chalk.red;
      
      console.log(statusColor(`\n${statusIcon} Test ${success ? 'PASSED' : 'FAILED'}`));
      console.log(chalk.white(`  • Score: ${result.score}%`));
      console.log(chalk.white(`  • Time: ${(executionTime / 1000).toFixed(2)}s`));
      console.log(chalk.white(`  • Delegations: ${result.delegationChain.length}`));
      console.log(chalk.white(`  • Revisions: ${result.revisionAttempts}`));
      
      // Save test output
      if (result.toolsUsed.includes('file_write')) {
        console.log(chalk.gray(`  • Output saved to: ${testDir}`));
      }
      
      // Delay between tests
      if (i < demoTests.length - 1) {
        console.log(chalk.gray('\n⏳ Waiting 2 seconds...\n'));
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error) {
      console.log(chalk.red(`\n❌ Test FAILED with error: ${error.message}`));
      results.push({
        ...test,
        score: 0,
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime
      });
    }
  }
  
  // Generate summary
  console.log(chalk.bold.cyan('\n════════════════════════════════════════'));
  console.log(chalk.bold.cyan('           TEST SUMMARY'));
  console.log(chalk.bold.cyan('════════════════════════════════════════\n'));
  
  const totalTests = demoTests.length;
  const successRate = ((passedTests / totalTests) * 100).toFixed(0);
  
  console.log(chalk.bold.white('📊 Overall Results:'));
  console.log(chalk.green(`  ✅ Passed: ${passedTests}/${totalTests}`));
  console.log(chalk.red(`  ❌ Failed: ${totalTests - passedTests}/${totalTests}`));
  console.log(chalk.yellow(`  📈 Success Rate: ${successRate}%`));
  
  // Category breakdown
  const categories = {};
  results.forEach(r => {
    if (!categories[r.category]) {
      categories[r.category] = { passed: 0, total: 0 };
    }
    categories[r.category].total++;
    if (r.success) categories[r.category].passed++;
  });
  
  console.log(chalk.bold.white('\n📂 Results by Category:'));
  Object.entries(categories).forEach(([cat, stats]) => {
    const rate = ((stats.passed / stats.total) * 100).toFixed(0);
    console.log(chalk.white(`  ${cat}: ${stats.passed}/${stats.total} (${rate}%)`));
  });
  
  // Performance metrics
  const avgTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;
  const avgScore = results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length;
  
  console.log(chalk.bold.white('\n⚡ Performance Metrics:'));
  console.log(chalk.gray(`  • Average Time: ${(avgTime / 1000).toFixed(2)}s`));
  console.log(chalk.gray(`  • Average Score: ${avgScore.toFixed(1)}%`));
  
  // Detailed results
  console.log(chalk.bold.white('\n📋 Detailed Results:'));
  results.forEach((r, i) => {
    const icon = r.success ? '✅' : '❌';
    console.log(chalk.white(`\n  Test ${i + 1}: ${r.name}`));
    console.log(chalk.gray(`    ${icon} Score: ${r.score}% | Time: ${(r.executionTime / 1000).toFixed(2)}s`));
    if (r.delegations !== undefined) {
      console.log(chalk.gray(`    Delegations: ${r.delegations} | Revisions: ${r.revisions} | Tools: ${r.toolsUsed}`));
    }
    if (r.error) {
      console.log(chalk.red(`    Error: ${r.error}`));
    }
  });
  
  // Save report
  const reportPath = path.join(testDir, 'test-report.json');
  await fs.writeFile(reportPath, JSON.stringify({
    summary: {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      successRate: parseFloat(successRate),
      averageTime: avgTime,
      averageScore: avgScore
    },
    categories,
    tests: results,
    timestamp: new Date().toISOString()
  }, null, 2));
  
  console.log(chalk.bold.green(`\n✅ Report saved to: ${reportPath}`));
  
  // Final status
  if (successRate === '100') {
    console.log(chalk.bold.green('\n🎉 PERFECT SCORE! All tests passed!'));
  } else if (parseFloat(successRate) >= 80) {
    console.log(chalk.bold.green(`\n✅ TEST SUITE PASSED (${successRate}% success rate)`));
  } else {
    console.log(chalk.bold.yellow(`\n⚠️ TEST SUITE NEEDS IMPROVEMENT (${successRate}% success rate)`));
  }
  
  console.log(chalk.bold.cyan('\n════════════════════════════════════════\n'));
}

// Run demo tests
runDemoTests().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});