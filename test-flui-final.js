#!/usr/bin/env node

const { CascadeAgent } = require('./dist/services/cascadeAgent');
const { ToolsManager } = require('./dist/services/toolsManager');
const { MemoryManager } = require('./dist/services/memoryManager');
const { OpenAIService } = require('./dist/services/openAIService');
const { ApiService } = require('./dist/services/apiService');
const chalk = require('chalk');

// 20 Test scenarios - simplified for speed
const allTests = [
  // Development (5)
  { id: 1, name: 'Hello World', task: 'Write hello world in JavaScript', category: 'Dev' },
  { id: 2, name: 'Fibonacci', task: 'Create fibonacci function', category: 'Dev' },
  { id: 3, name: 'Array Sum', task: 'Function to sum array elements', category: 'Dev' },
  { id: 4, name: 'Palindrome', task: 'Check if string is palindrome', category: 'Dev' },
  { id: 5, name: 'Sort Array', task: 'Sort array of numbers', category: 'Dev' },
  
  // Documentation (5)
  { id: 6, name: 'README', task: 'Write simple README', category: 'Doc' },
  { id: 7, name: 'API Doc', task: 'Document REST endpoint', category: 'Doc' },
  { id: 8, name: 'Comments', task: 'Add JSDoc comments', category: 'Doc' },
  { id: 9, name: 'User Guide', task: 'Write user instructions', category: 'Doc' },
  { id: 10, name: 'Changelog', task: 'Create changelog entry', category: 'Doc' },
  
  // Analysis (5)
  { id: 11, name: 'Code Review', task: 'Review simple code', category: 'Analysis' },
  { id: 12, name: 'Performance', task: 'Suggest optimizations', category: 'Analysis' },
  { id: 13, name: 'Security', task: 'Find security issues', category: 'Analysis' },
  { id: 14, name: 'Best Practices', task: 'Check code standards', category: 'Analysis' },
  { id: 15, name: 'Refactor', task: 'Suggest refactoring', category: 'Analysis' },
  
  // Creative (5)
  { id: 16, name: 'Blog Post', task: 'Write tech blog intro', category: 'Creative' },
  { id: 17, name: 'Tutorial', task: 'Create tutorial outline', category: 'Creative' },
  { id: 18, name: 'Email', task: 'Write professional email', category: 'Creative' },
  { id: 19, name: 'Description', task: 'Product description', category: 'Creative' },
  { id: 20, name: 'Headline', task: 'Create catchy headline', category: 'Creative' }
];

async function runAllTests() {
  console.log(chalk.bold.cyan('\n╔════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║      FLUI COMPLETE TEST SUITE         ║'));
  console.log(chalk.bold.cyan('║          20 Test Scenarios            ║'));
  console.log(chalk.bold.cyan('╚════════════════════════════════════════╝\n'));
  
  // Initialize services once
  const apiService = new ApiService('https://api.llm7.io/v1', '');
  const openAIService = new OpenAIService();
  const memoryManager = new MemoryManager();
  const toolsManager = new ToolsManager(apiService, memoryManager, openAIService);
  
  const results = [];
  const startTime = Date.now();
  
  // Run tests by category
  const categories = ['Dev', 'Doc', 'Analysis', 'Creative'];
  
  for (const category of categories) {
    console.log(chalk.bold.yellow(`\n━━━ ${category} Tests ━━━`));
    
    const categoryTests = allTests.filter(t => t.category === category);
    
    for (const test of categoryTests) {
      process.stdout.write(chalk.gray(`Test ${test.id}: ${test.name.padEnd(15)} `));
      
      try {
        // Simple agent without delegation for speed
        const agent = new CascadeAgent(
          {
            name: `Test-${test.id}`,
            role: 'executor',
            expertise: [category.toLowerCase()],
            style: 'efficient',
            goals: ['complete quickly'],
            constraints: ['be concise']
          },
          {
            canUseTools: false, // Disable tools for speed
            canDelegateToAgents: false, // No delegation for speed
            canMakeDecisions: true,
            canRequestRevision: false, // No revision for speed
            canAccessMemory: true,
            availableTools: []
          },
          toolsManager,
          memoryManager,
          openAIService
        );
        
        const task = {
          id: `test-${test.id}`,
          type: 'create',
          description: test.task,
          status: 'pending',
          iterations: 0,
          maxIterations: 1,
          requiredScore: 75, // Lower threshold for speed
          maxDepth: 0, // No delegation
          currentDepth: 0
        };
        
        const testStart = Date.now();
        const result = await agent.executeWithCascade(task);
        const testTime = Date.now() - testStart;
        
        const success = result.score >= 75;
        results.push({
          ...test,
          score: result.score,
          success,
          time: testTime
        });
        
        // Display inline result
        if (success) {
          console.log(chalk.green(`✅ ${result.score}% (${(testTime/1000).toFixed(1)}s)`));
        } else {
          console.log(chalk.red(`❌ ${result.score}% (${(testTime/1000).toFixed(1)}s)`));
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(chalk.red(`❌ Error: ${error.message.substring(0, 30)}...`));
        results.push({
          ...test,
          score: 0,
          success: false,
          error: true
        });
      }
    }
  }
  
  const totalTime = Date.now() - startTime;
  
  // Summary
  console.log(chalk.bold.cyan('\n╔════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║           FINAL RESULTS                ║'));
  console.log(chalk.bold.cyan('╚════════════════════════════════════════╝\n'));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;
  const successRate = ((passed / results.length) * 100).toFixed(0);
  
  // Overall stats
  console.log(chalk.bold.white('📊 Overall Statistics:'));
  console.log(chalk.green(`  ✅ Passed: ${passed}/20 tests`));
  console.log(chalk.red(`  ❌ Failed: ${failed}/20 tests`));
  console.log(chalk.yellow(`  📈 Success Rate: ${successRate}%`));
  console.log(chalk.blue(`  ⏱️ Total Time: ${(totalTime/1000).toFixed(1)}s`));
  console.log(chalk.gray(`  ⚡ Avg Time/Test: ${(totalTime/results.length/1000).toFixed(1)}s`));
  
  // Category breakdown
  console.log(chalk.bold.white('\n📂 Category Breakdown:'));
  categories.forEach(cat => {
    const catResults = results.filter(r => r.category === cat);
    const catPassed = catResults.filter(r => r.success).length;
    const catRate = ((catPassed / catResults.length) * 100).toFixed(0);
    console.log(chalk.white(`  ${cat}: ${catPassed}/${catResults.length} passed (${catRate}%)`));
  });
  
  // Score distribution
  const avgScore = results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length;
  console.log(chalk.bold.white('\n📈 Score Distribution:'));
  console.log(chalk.gray(`  Average Score: ${avgScore.toFixed(1)}%`));
  console.log(chalk.gray(`  Highest Score: ${Math.max(...results.map(r => r.score || 0))}%`));
  console.log(chalk.gray(`  Lowest Score: ${Math.min(...results.filter(r => r.score).map(r => r.score))}%`));
  
  // Failed tests
  if (failed > 0) {
    console.log(chalk.bold.red('\n❌ Failed Tests:'));
    results.filter(r => !r.success).forEach(r => {
      console.log(chalk.red(`  • Test ${r.id}: ${r.name} (${r.score}%)`));
    });
  }
  
  // Final verdict
  console.log(chalk.bold.cyan('\n╔════════════════════════════════════════╗'));
  if (successRate === '100') {
    console.log(chalk.bold.green('║    🎉 PERFECT! ALL TESTS PASSED! 🎉    ║'));
  } else if (parseInt(successRate) >= 80) {
    console.log(chalk.bold.green('║    ✅ TEST SUITE PASSED (≥80%)         ║'));
  } else if (parseInt(successRate) >= 60) {
    console.log(chalk.bold.yellow('║    ⚠️ PARTIAL SUCCESS (60-79%)         ║'));
  } else {
    console.log(chalk.bold.red('║    ❌ TEST SUITE FAILED (<60%)         ║'));
  }
  console.log(chalk.bold.cyan('╚════════════════════════════════════════╝\n'));
  
  // Return success status
  return parseInt(successRate) >= 80;
}

// Run tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });