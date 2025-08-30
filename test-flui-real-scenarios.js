#!/usr/bin/env node

const { CascadeAgent } = require('./dist/services/cascadeAgent');
const { EnhancedSpiralOrchestrator } = require('./dist/services/enhancedSpiralOrchestrator');
const { ToolsManager } = require('./dist/services/toolsManager');
const { MemoryManager } = require('./dist/services/memoryManager');
const { OpenAIService } = require('./dist/services/openAIService');
const { ApiService } = require('./dist/services/apiService');
const { TimelineUI } = require('./dist/ui/timelineUI');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

// Test scenarios - 20 real-world tests
const testScenarios = [
  // Development Tasks (5 tests)
  {
    id: 'dev-1',
    name: 'Create REST API',
    description: 'Create a simple REST API endpoint for user management with GET and POST methods',
    requiredScore: 80,
    category: 'Development'
  },
  {
    id: 'dev-2',
    name: 'JavaScript Function',
    description: 'Write a JavaScript function to validate email addresses with regex',
    requiredScore: 80,
    category: 'Development'
  },
  {
    id: 'dev-3',
    name: 'Python Script',
    description: 'Create a Python script to read CSV files and generate summary statistics',
    requiredScore: 80,
    category: 'Development'
  },
  {
    id: 'dev-4',
    name: 'HTML Form',
    description: 'Build an HTML contact form with CSS styling and JavaScript validation',
    requiredScore: 80,
    category: 'Development'
  },
  {
    id: 'dev-5',
    name: 'Database Schema',
    description: 'Design a database schema for an e-commerce application with users, products, and orders',
    requiredScore: 80,
    category: 'Development'
  },
  
  // Documentation Tasks (5 tests)
  {
    id: 'doc-1',
    name: 'API Documentation',
    description: 'Write comprehensive API documentation for a payment gateway integration',
    requiredScore: 80,
    category: 'Documentation'
  },
  {
    id: 'doc-2',
    name: 'README File',
    description: 'Create a professional README.md file for an open-source project',
    requiredScore: 80,
    category: 'Documentation'
  },
  {
    id: 'doc-3',
    name: 'User Guide',
    description: 'Write a user guide for a mobile application with screenshots placeholders',
    requiredScore: 80,
    category: 'Documentation'
  },
  {
    id: 'doc-4',
    name: 'Technical Spec',
    description: 'Create a technical specification document for a microservices architecture',
    requiredScore: 80,
    category: 'Documentation'
  },
  {
    id: 'doc-5',
    name: 'Code Comments',
    description: 'Add comprehensive JSDoc comments to a JavaScript class with methods',
    requiredScore: 80,
    category: 'Documentation'
  },
  
  // Analysis Tasks (5 tests)
  {
    id: 'analysis-1',
    name: 'Code Review',
    description: 'Perform a code review and suggest improvements for a React component',
    requiredScore: 80,
    category: 'Analysis'
  },
  {
    id: 'analysis-2',
    name: 'Performance Analysis',
    description: 'Analyze performance bottlenecks in a Node.js application and suggest optimizations',
    requiredScore: 80,
    category: 'Analysis'
  },
  {
    id: 'analysis-3',
    name: 'Security Audit',
    description: 'Conduct a basic security audit for a web application and list vulnerabilities',
    requiredScore: 80,
    category: 'Analysis'
  },
  {
    id: 'analysis-4',
    name: 'Architecture Review',
    description: 'Review a monolithic architecture and propose microservices migration strategy',
    requiredScore: 80,
    category: 'Analysis'
  },
  {
    id: 'analysis-5',
    name: 'Data Analysis',
    description: 'Analyze a dataset of user behavior and provide insights and recommendations',
    requiredScore: 80,
    category: 'Analysis'
  },
  
  // Creative Tasks (5 tests)
  {
    id: 'creative-1',
    name: 'Blog Article',
    description: 'Write a technical blog article about machine learning for beginners',
    requiredScore: 80,
    category: 'Creative'
  },
  {
    id: 'creative-2',
    name: 'Marketing Copy',
    description: 'Create marketing copy for a SaaS product landing page',
    requiredScore: 80,
    category: 'Creative'
  },
  {
    id: 'creative-3',
    name: 'Tutorial Script',
    description: 'Write a video tutorial script for teaching Git basics',
    requiredScore: 80,
    category: 'Creative'
  },
  {
    id: 'creative-4',
    name: 'Email Template',
    description: 'Design an HTML email template for a newsletter with responsive design',
    requiredScore: 80,
    category: 'Creative'
  },
  {
    id: 'creative-5',
    name: 'Product Description',
    description: 'Write compelling product descriptions for an e-commerce website',
    requiredScore: 80,
    category: 'Creative'
  }
];

class FluiRealTestRunner {
  constructor() {
    this.apiService = null;
    this.openAIService = null;
    this.memoryManager = null;
    this.toolsManager = null;
    this.timelineUI = null;
    this.orchestrator = null;
    this.results = [];
    this.testDir = null;
  }

  async initialize() {
    console.log(chalk.bold.cyan('\n🚀 Initializing Flui Real Test Runner\n'));
    
    // Create test output directory
    this.testDir = path.join(process.cwd(), 'flui-test-results', Date.now().toString());
    await fs.mkdir(this.testDir, { recursive: true });
    
    // Initialize services
    this.apiService = new ApiService('https://api.llm7.io/v1', '');
    this.openAIService = new OpenAIService();
    this.memoryManager = new MemoryManager();
    this.toolsManager = new ToolsManager(this.apiService, this.memoryManager, this.openAIService);
    this.timelineUI = new TimelineUI(false);
    this.orchestrator = new EnhancedSpiralOrchestrator(
      this.toolsManager,
      this.memoryManager,
      this.openAIService
    );
    
    console.log(chalk.green('✅ Services initialized'));
    console.log(chalk.gray(`📁 Test results will be saved to: ${this.testDir}\n`));
  }

  async runTest(scenario, index) {
    console.log(chalk.bold.yellow(`\n━━━ Test ${index + 1}/20: ${scenario.name} ━━━`));
    console.log(chalk.gray(`Category: ${scenario.category}`));
    console.log(chalk.gray(`Description: ${scenario.description}`));
    console.log(chalk.gray(`Required Score: ${scenario.requiredScore}%`));
    
    const startTime = Date.now();
    
    try {
      // Clear timeline for this test
      this.timelineUI.clear();
      
      // Determine strategy based on category
      const useSpiral = scenario.category === 'Development' || scenario.category === 'Analysis';
      let result;
      
      if (useSpiral) {
        // Use spiral orchestrator for complex tasks
        result = await this.orchestrator.processInSpiral(scenario.description, {
          maxLevels: 3,
          minScore: scenario.requiredScore,
          enableCascade: true,
          maxCascadeDepth: 2,
          trackMetrics: true
        });
        
        // Extract result data
        result = {
          score: result.finalScore,
          levels: result.levels.length,
          scoreProgression: result.scoreProgression,
          earlyTermination: result.earlyTermination,
          metrics: result.metrics,
          success: result.finalScore >= scenario.requiredScore
        };
      } else {
        // Use cascade agent for simpler tasks
        const agent = new CascadeAgent(
          {
            name: `Test-Agent-${scenario.id}`,
            role: 'executor',
            expertise: [scenario.category.toLowerCase()],
            style: 'professional',
            goals: [`achieve ${scenario.requiredScore}% score`],
            constraints: ['complete within 30 seconds']
          },
          {
            canUseTools: true,
            canDelegateToAgents: true,
            canMakeDecisions: true,
            canRequestRevision: true,
            canAccessMemory: true,
            availableTools: ['file_write', 'file_read']
          },
          this.toolsManager,
          this.memoryManager,
          this.openAIService
        );
        
        const task = {
          id: scenario.id,
          type: 'create',
          description: scenario.description,
          status: 'pending',
          iterations: 0,
          maxIterations: 3,
          requiredScore: scenario.requiredScore,
          maxDepth: 2,
          currentDepth: 0
        };
        
        const cascadeResult = await agent.executeWithCascade(task);
        
        result = {
          score: cascadeResult.score,
          delegations: cascadeResult.delegationChain.length,
          revisions: cascadeResult.revisionAttempts,
          toolsUsed: cascadeResult.toolsUsed,
          success: cascadeResult.score >= scenario.requiredScore
        };
      }
      
      const executionTime = Date.now() - startTime;
      
      // Store result
      this.results.push({
        ...scenario,
        ...result,
        executionTime: executionTime,
        timestamp: new Date().toISOString()
      });
      
      // Display result
      const statusIcon = result.success ? '✅' : '❌';
      const statusText = result.success ? 'PASSED' : 'FAILED';
      const statusColor = result.success ? chalk.green : chalk.red;
      
      console.log(statusColor(`\n${statusIcon} Test ${statusText}`));
      console.log(chalk.white(`  • Score: ${result.score}%`));
      console.log(chalk.white(`  • Time: ${(executionTime / 1000).toFixed(2)}s`));
      
      if (result.levels) {
        console.log(chalk.white(`  • Spiral Levels: ${result.levels}`));
      }
      if (result.delegations !== undefined) {
        console.log(chalk.white(`  • Delegations: ${result.delegations}`));
      }
      if (result.revisions !== undefined) {
        console.log(chalk.white(`  • Revisions: ${result.revisions}`));
      }
      
      // Save individual test result
      const testResultPath = path.join(this.testDir, `${scenario.id}.json`);
      await fs.writeFile(testResultPath, JSON.stringify({
        scenario,
        result,
        executionTime,
        timeline: this.timelineUI.getSummary()
      }, null, 2));
      
      return result.success;
      
    } catch (error) {
      console.error(chalk.red(`\n❌ Test FAILED with error: ${error.message}`));
      
      this.results.push({
        ...scenario,
        score: 0,
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
      
      return false;
    }
  }

  async runAllTests() {
    console.log(chalk.bold.cyan('\n════════════════════════════════════════'));
    console.log(chalk.bold.cyan('     FLUI REAL-WORLD TEST SUITE'));
    console.log(chalk.bold.cyan('         20 Test Scenarios'));
    console.log(chalk.bold.cyan('════════════════════════════════════════\n'));
    
    await this.initialize();
    
    let passedTests = 0;
    let failedTests = 0;
    const categoryResults = {};
    
    // Run all tests
    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i];
      
      // Add delay between tests to avoid rate limiting
      if (i > 0) {
        console.log(chalk.gray('\n⏳ Waiting 2 seconds before next test...'));
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const success = await this.runTest(scenario, i);
      
      if (success) {
        passedTests++;
      } else {
        failedTests++;
      }
      
      // Track category results
      if (!categoryResults[scenario.category]) {
        categoryResults[scenario.category] = { passed: 0, failed: 0 };
      }
      categoryResults[scenario.category][success ? 'passed' : 'failed']++;
    }
    
    // Generate summary report
    await this.generateSummaryReport(passedTests, failedTests, categoryResults);
  }

  async generateSummaryReport(passedTests, failedTests, categoryResults) {
    console.log(chalk.bold.cyan('\n════════════════════════════════════════'));
    console.log(chalk.bold.cyan('           TEST SUITE SUMMARY'));
    console.log(chalk.bold.cyan('════════════════════════════════════════\n'));
    
    const totalTests = passedTests + failedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    // Overall results
    console.log(chalk.bold.white('📊 Overall Results:'));
    console.log(chalk.green(`  ✅ Passed: ${passedTests}/${totalTests}`));
    console.log(chalk.red(`  ❌ Failed: ${failedTests}/${totalTests}`));
    console.log(chalk.yellow(`  📈 Success Rate: ${successRate}%`));
    
    // Category breakdown
    console.log(chalk.bold.white('\n📂 Results by Category:'));
    for (const [category, results] of Object.entries(categoryResults)) {
      const catTotal = results.passed + results.failed;
      const catRate = ((results.passed / catTotal) * 100).toFixed(0);
      console.log(chalk.white(`  ${category}:`));
      console.log(chalk.gray(`    • Passed: ${results.passed}/${catTotal} (${catRate}%)`));
    }
    
    // Performance metrics
    const avgTime = this.results.reduce((sum, r) => sum + r.executionTime, 0) / this.results.length;
    const avgScore = this.results.reduce((sum, r) => sum + (r.score || 0), 0) / this.results.length;
    
    console.log(chalk.bold.white('\n⚡ Performance Metrics:'));
    console.log(chalk.gray(`  • Average Execution Time: ${(avgTime / 1000).toFixed(2)}s`));
    console.log(chalk.gray(`  • Average Score: ${avgScore.toFixed(1)}%`));
    
    // Failed tests details
    if (failedTests > 0) {
      console.log(chalk.bold.red('\n❌ Failed Tests:'));
      this.results.filter(r => !r.success).forEach(r => {
        console.log(chalk.red(`  • ${r.name} (Score: ${r.score}%)`));
        if (r.error) {
          console.log(chalk.gray(`    Error: ${r.error}`));
        }
      });
    }
    
    // Save full report
    const reportPath = path.join(this.testDir, 'test-report.json');
    await fs.writeFile(reportPath, JSON.stringify({
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate: parseFloat(successRate),
        averageTime: avgTime,
        averageScore: avgScore
      },
      categoryResults,
      tests: this.results,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    console.log(chalk.bold.green(`\n✅ Full report saved to: ${reportPath}`));
    
    // Final status
    if (successRate === '100.0') {
      console.log(chalk.bold.green('\n🎉 PERFECT SCORE! All tests passed!'));
    } else if (parseFloat(successRate) >= 80) {
      console.log(chalk.bold.green(`\n✅ TEST SUITE PASSED (${successRate}% success rate)`));
    } else {
      console.log(chalk.bold.red(`\n❌ TEST SUITE FAILED (${successRate}% success rate)`));
    }
    
    console.log(chalk.bold.cyan('\n════════════════════════════════════════\n'));
  }
}

// Run tests if executed directly
if (require.main === module) {
  const runner = new FluiRealTestRunner();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n⚠️ Test suite interrupted by user'));
    process.exit(1);
  });
  
  // Run all tests
  runner.runAllTests().catch(error => {
    console.error(chalk.red('\n❌ Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = { FluiRealTestRunner, testScenarios };