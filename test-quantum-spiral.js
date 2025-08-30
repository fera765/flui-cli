#!/usr/bin/env node

const { QuantumSpiralOrchestrator } = require('./dist/services/quantumSpiralOrchestrator');
const { ToolsManager } = require('./dist/services/toolsManager');
const { MemoryManager } = require('./dist/services/memoryManager');
const { OpenAIService } = require('./dist/services/openAIService');
const { ApiService } = require('./dist/services/apiService');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

/**
 * 20 Tarefas Diversas para Teste Completo
 * Cada tarefa tem complexidade e requisitos diferentes
 */
const testTasks = [
  // Tarefas Simples (1-5)
  {
    id: 'simple-1',
    name: 'Hello World Function',
    request: 'Create a hello world function in JavaScript',
    expectedComplexity: 2,
    requirements: {
      outputType: 'code',
      minQuality: 80,
      expectedSize: 50
    }
  },
  {
    id: 'simple-2',
    name: 'Email Template',
    request: 'Write a professional email template for meeting invitation',
    expectedComplexity: 3,
    requirements: {
      outputType: 'text',
      minQuality: 85,
      expectedSize: 200
    }
  },
  {
    id: 'simple-3',
    name: 'Data Structure',
    request: 'Explain what is a binary tree with example',
    expectedComplexity: 3,
    requirements: {
      outputType: 'text',
      minQuality: 80,
      expectedSize: 300
    }
  },
  {
    id: 'simple-4',
    name: 'SQL Query',
    request: 'Write SQL query to find top 5 customers by sales',
    expectedComplexity: 2,
    requirements: {
      outputType: 'code',
      minQuality: 85,
      expectedSize: 100
    }
  },
  {
    id: 'simple-5',
    name: 'Product Description',
    request: 'Write a 100-word product description for a smartwatch',
    expectedComplexity: 3,
    requirements: {
      outputType: 'creative',
      minQuality: 80,
      expectedSize: 100
    }
  },
  
  // Tarefas Médias (6-10)
  {
    id: 'medium-1',
    name: 'API Documentation',
    request: 'Create REST API documentation for user authentication endpoints with examples',
    expectedComplexity: 5,
    requirements: {
      outputType: 'structured',
      minQuality: 85,
      expectedSize: 1000,
      mustHaveSections: ['endpoints', 'parameters', 'responses', 'examples']
    }
  },
  {
    id: 'medium-2',
    name: 'Algorithm Implementation',
    request: 'Implement quicksort algorithm in Python with comments and complexity analysis',
    expectedComplexity: 6,
    requirements: {
      outputType: 'code',
      minQuality: 90,
      expectedSize: 500
    }
  },
  {
    id: 'medium-3',
    name: 'Blog Article',
    request: 'Write a 500-word blog article about benefits of cloud computing for small businesses',
    expectedComplexity: 5,
    requirements: {
      outputType: 'creative',
      minQuality: 85,
      expectedSize: 500
    }
  },
  {
    id: 'medium-4',
    name: 'System Design',
    request: 'Design a URL shortener system with architecture diagram description',
    expectedComplexity: 7,
    requirements: {
      outputType: 'structured',
      minQuality: 85,
      expectedSize: 1500,
      mustHaveSections: ['requirements', 'architecture', 'database', 'api', 'scaling']
    }
  },
  {
    id: 'medium-5',
    name: 'Code Review',
    request: 'Review this code and suggest improvements: function calc(a,b) { return a+b*2/3-1 }',
    expectedComplexity: 4,
    requirements: {
      outputType: 'analysis',
      minQuality: 85,
      expectedSize: 400
    }
  },
  
  // Tarefas Complexas (11-15)
  {
    id: 'complex-1',
    name: 'Full Stack App',
    request: 'Create a complete todo list application with React frontend and Node.js backend code',
    expectedComplexity: 8,
    requirements: {
      outputType: 'code',
      minQuality: 85,
      expectedSize: 2000,
      mustUseTools: ['file_write'],
      mustHaveSections: ['frontend', 'backend', 'database', 'readme']
    }
  },
  {
    id: 'complex-2',
    name: 'Technical Report',
    request: 'Write a 2000-word technical report on machine learning applications in healthcare',
    expectedComplexity: 8,
    requirements: {
      outputType: 'structured',
      minQuality: 90,
      expectedSize: 2000,
      mustHaveSections: ['abstract', 'introduction', 'applications', 'challenges', 'future', 'conclusion']
    }
  },
  {
    id: 'complex-3',
    name: 'Data Analysis',
    request: 'Analyze e-commerce data trends and provide insights with visualization descriptions',
    expectedComplexity: 7,
    requirements: {
      outputType: 'analysis',
      minQuality: 85,
      expectedSize: 1500,
      mustHaveSections: ['summary', 'trends', 'insights', 'recommendations']
    }
  },
  {
    id: 'complex-4',
    name: 'Tutorial Series',
    request: 'Create a 3-part tutorial series on building REST APIs with Node.js',
    expectedComplexity: 9,
    requirements: {
      outputType: 'structured',
      minQuality: 85,
      expectedSize: 3000,
      mustHaveSections: ['part1', 'part2', 'part3'],
      mustUseTools: ['file_write']
    }
  },
  {
    id: 'complex-5',
    name: 'Business Plan',
    request: 'Draft a business plan outline for a SaaS startup in the AI space',
    expectedComplexity: 8,
    requirements: {
      outputType: 'structured',
      minQuality: 85,
      expectedSize: 2500,
      mustHaveSections: ['executive_summary', 'market_analysis', 'product', 'marketing', 'financials']
    }
  },
  
  // Tarefas Muito Complexas (16-20)
  {
    id: 'extreme-1',
    name: 'Complete Documentation',
    request: 'Create complete documentation for a microservices architecture with 10 services',
    expectedComplexity: 10,
    requirements: {
      outputType: 'structured',
      minQuality: 85,
      expectedSize: 5000,
      mustUseTools: ['file_write'],
      mustHaveSections: ['overview', 'services', 'apis', 'deployment', 'monitoring']
    }
  },
  {
    id: 'extreme-2',
    name: 'Research Paper',
    request: 'Write a 5000-word research paper on quantum computing applications',
    expectedComplexity: 10,
    requirements: {
      outputType: 'structured',
      minQuality: 90,
      expectedSize: 5000,
      mustHaveSections: ['abstract', 'introduction', 'methodology', 'results', 'discussion', 'conclusion', 'references']
    }
  },
  {
    id: 'extreme-3',
    name: 'Full Course Curriculum',
    request: 'Design a complete 12-week programming course curriculum with detailed lessons',
    expectedComplexity: 10,
    requirements: {
      outputType: 'structured',
      minQuality: 85,
      expectedSize: 8000,
      mustHaveSections: ['overview', 'objectives', 'weekly_plans', 'assignments', 'resources']
    }
  },
  {
    id: 'extreme-4',
    name: 'Enterprise Architecture',
    request: 'Design enterprise architecture for a global e-commerce platform handling millions of users',
    expectedComplexity: 10,
    requirements: {
      outputType: 'structured',
      minQuality: 90,
      expectedSize: 6000,
      mustHaveSections: ['requirements', 'architecture', 'infrastructure', 'security', 'scalability', 'disaster_recovery']
    }
  },
  {
    id: 'extreme-5',
    name: 'Complete Novel Chapter',
    request: 'Write the first chapter (10000 words) of a science fiction novel about AI consciousness',
    expectedComplexity: 10,
    requirements: {
      outputType: 'creative',
      minQuality: 85,
      expectedSize: 10000,
      mustUseTools: ['file_write']
    }
  }
];

/**
 * Sistema de Teste e Refinamento Automático
 */
class QuantumTestRunner {
  constructor() {
    this.orchestrator = null;
    this.results = [];
    this.refinements = [];
    this.outputDir = null;
  }

  async initialize() {
    console.log(chalk.bold.cyan('\n⚛️ QUANTUM SPIRAL TEST SUITE ⚛️'));
    console.log(chalk.white('Initializing revolutionary orchestration system...\n'));
    
    // Create output directory
    this.outputDir = path.join(process.cwd(), 'quantum-test-' + Date.now());
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Initialize services
    const apiService = new ApiService('https://api.llm7.io/v1', '');
    const openAIService = new OpenAIService();
    const memoryManager = new MemoryManager();
    const toolsManager = new ToolsManager(apiService, memoryManager, openAIService);
    
    // Create Quantum Orchestrator
    this.orchestrator = new QuantumSpiralOrchestrator(
      toolsManager,
      memoryManager,
      openAIService
    );
    
    console.log(chalk.green('✅ Quantum Spiral Orchestrator initialized\n'));
  }

  async runTest(task, index) {
    console.log(chalk.bold.yellow(`\n━━━ Test ${index + 1}/20: ${task.name} ━━━`));
    console.log(chalk.gray(`Complexity: ${task.expectedComplexity}/10`));
    console.log(chalk.gray(`Request: ${task.request.substring(0, 100)}...`));
    
    const startTime = Date.now();
    
    try {
      // Execute with Quantum Orchestrator
      const result = await this.orchestrator.processTask(task.request, task.requirements);
      
      const executionTime = Date.now() - startTime;
      
      // Analyze result
      const analysis = this.analyzeResult(result, task);
      
      // Store result
      this.results.push({
        task: task,
        result: result,
        analysis: analysis,
        executionTime: executionTime
      });
      
      // Display result
      this.displayResult(result, analysis, executionTime);
      
      // Check if refinement is needed
      if (analysis.needsRefinement) {
        await this.refineTask(task, result, analysis);
      }
      
      // Save output
      await this.saveTaskOutput(task, result, analysis);
      
      return analysis.success;
      
    } catch (error) {
      console.error(chalk.red(`❌ Test failed: ${error.message}`));
      
      this.results.push({
        task: task,
        error: error.message,
        executionTime: Date.now() - startTime
      });
      
      return false;
    }
  }

  analyzeResult(result, task) {
    const analysis = {
      success: false,
      efficiency: 0,
      needsRefinement: false,
      issues: [],
      strengths: []
    };
    
    // Check success
    analysis.success = result.success && result.score >= task.requirements.minQuality;
    
    // Calculate efficiency
    const expectedTime = task.expectedComplexity * 10 * 1000; // ms
    const actualTime = result.metrics.totalTime;
    analysis.efficiency = Math.max(0, Math.min(100, (expectedTime / actualTime) * 100));
    
    // Check for issues
    if (result.score < task.requirements.minQuality) {
      analysis.issues.push(`Score ${result.score}% below required ${task.requirements.minQuality}%`);
      analysis.needsRefinement = true;
    }
    
    if (result.metrics.revisionsNeeded > 2) {
      analysis.issues.push(`Too many revisions: ${result.metrics.revisionsNeeded}`);
    }
    
    if (result.metrics.agentsUsed > task.expectedComplexity) {
      analysis.issues.push(`Excessive agents: ${result.metrics.agentsUsed} (expected ≤${task.expectedComplexity})`);
    }
    
    // Identify strengths
    if (result.score >= 90) {
      analysis.strengths.push('High quality output');
    }
    
    if (analysis.efficiency >= 80) {
      analysis.strengths.push('Efficient execution');
    }
    
    if (result.metrics.toolsExecuted > 0) {
      analysis.strengths.push('Proper tool usage');
    }
    
    if (result.plan && result.plan.strategy.approach === 'divide-conquer' && task.expectedComplexity >= 7) {
      analysis.strengths.push('Good strategy selection');
    }
    
    return analysis;
  }

  displayResult(result, analysis, executionTime) {
    const statusIcon = analysis.success ? '✅' : '❌';
    const statusColor = analysis.success ? chalk.green : chalk.red;
    
    console.log(statusColor(`\n${statusIcon} Test ${analysis.success ? 'PASSED' : 'FAILED'}`));
    console.log(chalk.white(`  • Score: ${result.score}%`));
    console.log(chalk.white(`  • Efficiency: ${analysis.efficiency.toFixed(1)}%`));
    console.log(chalk.white(`  • Time: ${(executionTime / 1000).toFixed(2)}s`));
    console.log(chalk.white(`  • Strategy: ${result.plan?.strategy.approach || 'N/A'}`));
    console.log(chalk.white(`  • Phases: ${result.plan?.phases.length || 0}`));
    console.log(chalk.white(`  • Agents: ${result.metrics.agentsUsed}`));
    console.log(chalk.white(`  • Tools: ${result.metrics.toolsExecuted}`));
    
    if (analysis.strengths.length > 0) {
      console.log(chalk.green(`  ✓ Strengths: ${analysis.strengths.join(', ')}`));
    }
    
    if (analysis.issues.length > 0) {
      console.log(chalk.yellow(`  ⚠ Issues: ${analysis.issues.join(', ')}`));
    }
  }

  async refineTask(task, result, analysis) {
    console.log(chalk.cyan('\n  🔄 Initiating automatic refinement...'));
    
    const refinementRequest = `
      The previous attempt had these issues: ${analysis.issues.join(', ')}
      
      Please improve the following aspects:
      - Increase quality score from ${result.score}% to at least ${task.requirements.minQuality}%
      - Address validation issues: ${result.validationReport.issues.join(', ')}
      
      Original request: ${task.request}
    `;
    
    try {
      const refinedResult = await this.orchestrator.processTask(refinementRequest, {
        ...task.requirements,
        minQuality: task.requirements.minQuality * 0.95 // Slightly relaxed
      });
      
      const refinedAnalysis = this.analyzeResult(refinedResult, task);
      
      this.refinements.push({
        task: task,
        original: result,
        refined: refinedResult,
        improvement: refinedResult.score - result.score
      });
      
      if (refinedAnalysis.success) {
        console.log(chalk.green(`  ✅ Refinement successful! Score improved: ${result.score}% → ${refinedResult.score}%`));
      } else {
        console.log(chalk.yellow(`  ⚠️ Refinement attempted. Score: ${result.score}% → ${refinedResult.score}%`));
      }
      
    } catch (error) {
      console.log(chalk.red(`  ❌ Refinement failed: ${error.message}`));
    }
  }

  async saveTaskOutput(task, result, analysis) {
    const outputPath = path.join(this.outputDir, `${task.id}.json`);
    
    await fs.writeFile(outputPath, JSON.stringify({
      task: task,
      result: {
        success: result.success,
        score: result.score,
        metrics: result.metrics,
        validationReport: result.validationReport,
        plan: {
          strategy: result.plan?.strategy,
          phases: result.plan?.phases.map(p => p.name)
        }
      },
      analysis: analysis,
      output: typeof result.output === 'string' && result.output.length > 1000 
        ? result.output.substring(0, 1000) + '...' 
        : result.output
    }, null, 2));
  }

  async runAllTests() {
    await this.initialize();
    
    const categories = {
      simple: { total: 0, passed: 0 },
      medium: { total: 0, passed: 0 },
      complex: { total: 0, passed: 0 },
      extreme: { total: 0, passed: 0 }
    };
    
    // Run all tests
    for (let i = 0; i < testTasks.length; i++) {
      const task = testTasks[i];
      const category = task.id.split('-')[0];
      
      categories[category].total++;
      
      const success = await this.runTest(task, i);
      
      if (success) {
        categories[category].passed++;
      }
      
      // Small delay between tests
      if (i < testTasks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Generate final report
    await this.generateFinalReport(categories);
  }

  async generateFinalReport(categories) {
    console.log(chalk.bold.cyan('\n════════════════════════════════════════'));
    console.log(chalk.bold.cyan('         QUANTUM TEST SUITE REPORT'));
    console.log(chalk.bold.cyan('════════════════════════════════════════\n'));
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.analysis?.success).length;
    const successRate = (passedTests / totalTests * 100).toFixed(1);
    
    // Overall Results
    console.log(chalk.bold.white('📊 Overall Results:'));
    console.log(chalk.green(`  ✅ Passed: ${passedTests}/${totalTests} (${successRate}%)`));
    console.log(chalk.red(`  ❌ Failed: ${totalTests - passedTests}/${totalTests}`));
    
    // Category Breakdown
    console.log(chalk.bold.white('\n📂 Results by Complexity:'));
    Object.entries(categories).forEach(([cat, stats]) => {
      const rate = stats.total > 0 ? (stats.passed / stats.total * 100).toFixed(0) : 0;
      const icon = rate >= 80 ? '✅' : rate >= 60 ? '⚠️' : '❌';
      console.log(chalk.white(`  ${icon} ${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${stats.passed}/${stats.total} (${rate}%)`));
    });
    
    // Efficiency Analysis
    const avgEfficiency = this.results
      .filter(r => r.analysis)
      .reduce((sum, r) => sum + r.analysis.efficiency, 0) / passedTests || 0;
    
    console.log(chalk.bold.white('\n⚡ Performance Metrics:'));
    console.log(chalk.white(`  • Average Efficiency: ${avgEfficiency.toFixed(1)}%`));
    console.log(chalk.white(`  • Average Score: ${this.calculateAverageScore()}%`));
    console.log(chalk.white(`  • Total Refinements: ${this.refinements.length}`));
    
    // Strategy Usage
    const strategies = {};
    this.results.forEach(r => {
      if (r.result?.plan?.strategy.approach) {
        strategies[r.result.plan.strategy.approach] = (strategies[r.result.plan.strategy.approach] || 0) + 1;
      }
    });
    
    console.log(chalk.bold.white('\n🎯 Strategy Distribution:'));
    Object.entries(strategies).forEach(([strategy, count]) => {
      console.log(chalk.white(`  • ${strategy}: ${count} times`));
    });
    
    // Common Issues
    const allIssues = {};
    this.results.forEach(r => {
      if (r.analysis?.issues) {
        r.analysis.issues.forEach(issue => {
          const key = issue.split(':')[0];
          allIssues[key] = (allIssues[key] || 0) + 1;
        });
      }
    });
    
    if (Object.keys(allIssues).length > 0) {
      console.log(chalk.bold.yellow('\n⚠️ Common Issues:'));
      Object.entries(allIssues)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .forEach(([issue, count]) => {
          console.log(chalk.yellow(`  • ${issue}: ${count} occurrences`));
        });
    }
    
    // Final Verdict
    console.log(chalk.bold.cyan('\n════════════════════════════════════════'));
    
    if (successRate >= 90) {
      console.log(chalk.bold.green('🎉 EXCELLENT! Quantum Orchestrator performing exceptionally!'));
    } else if (successRate >= 75) {
      console.log(chalk.bold.green('✅ GOOD! System working well with minor improvements needed.'));
    } else if (successRate >= 60) {
      console.log(chalk.bold.yellow('⚠️ ACCEPTABLE. System needs optimization for complex tasks.'));
    } else {
      console.log(chalk.bold.red('❌ NEEDS IMPROVEMENT. Major refinements required.'));
    }
    
    console.log(chalk.bold.cyan('════════════════════════════════════════\n'));
    
    // Save full report
    const reportPath = path.join(this.outputDir, 'final-report.json');
    await fs.writeFile(reportPath, JSON.stringify({
      summary: {
        totalTests,
        passedTests,
        successRate: parseFloat(successRate),
        avgEfficiency,
        avgScore: this.calculateAverageScore()
      },
      categories,
      strategies,
      commonIssues: allIssues,
      refinements: this.refinements.map(r => ({
        task: r.task.name,
        originalScore: r.original.score,
        refinedScore: r.refined.score,
        improvement: r.improvement
      })),
      timestamp: new Date().toISOString()
    }, null, 2));
    
    console.log(chalk.gray(`📁 Full report saved to: ${reportPath}`));
  }

  calculateAverageScore() {
    const scores = this.results
      .filter(r => r.result?.score)
      .map(r => r.result.score);
    
    if (scores.length === 0) return 0;
    
    return (scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(1);
  }
}

// Run the test suite
if (require.main === module) {
  const runner = new QuantumTestRunner();
  
  runner.runAllTests().catch(error => {
    console.error(chalk.red('\n❌ Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = { QuantumTestRunner, testTasks };