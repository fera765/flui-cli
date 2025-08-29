#!/usr/bin/env node

const { QuantumSpiralOrchestrator } = require('./dist/services/quantumSpiralOrchestrator');
const { ToolsManager } = require('./dist/services/toolsManager');
const { MemoryManager } = require('./dist/services/memoryManager');
const { OpenAIService } = require('./dist/services/openAIService');
const { ApiService } = require('./dist/services/apiService');
const chalk = require('chalk');

async function quickTest() {
  console.log(chalk.bold.cyan('\n⚛️ QUANTUM SPIRAL - QUICK VALIDATION TEST ⚛️\n'));
  
  // Initialize services
  const apiService = new ApiService('https://api.llm7.io/v1', '');
  const openAIService = new OpenAIService();
  const memoryManager = new MemoryManager();
  const toolsManager = new ToolsManager(apiService, memoryManager, openAIService);
  
  const orchestrator = new QuantumSpiralOrchestrator(
    toolsManager,
    memoryManager,
    openAIService
  );
  
  // Test 1: Simple task
  console.log(chalk.yellow('Test 1: Simple Task'));
  console.log(chalk.gray('Request: Create a hello world function\n'));
  
  try {
    const result1 = await orchestrator.processTask(
      'Create a hello world function in Python',
      {
        outputType: 'code',
        minQuality: 80,
        expectedSize: 50
      }
    );
    
    console.log(chalk.green(`✅ Success: ${result1.success}`));
    console.log(chalk.white(`   Score: ${result1.score}%`));
    console.log(chalk.white(`   Strategy: ${result1.plan?.strategy?.approach || 'N/A'}`));
    console.log(chalk.white(`   Phases: ${result1.plan?.phases?.length || 0}`));
    console.log(chalk.white(`   Time: ${(result1.metrics.totalTime / 1000).toFixed(2)}s\n`));
    
  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error.message}\n`));
  }
  
  // Test 2: Medium complexity
  console.log(chalk.yellow('Test 2: Medium Complexity'));
  console.log(chalk.gray('Request: Write a 500-word blog article\n'));
  
  try {
    const result2 = await orchestrator.processTask(
      'Write a 500-word blog article about the benefits of meditation',
      {
        outputType: 'creative',
        minQuality: 85,
        expectedSize: 500
      }
    );
    
    console.log(chalk.green(`✅ Success: ${result2.success}`));
    console.log(chalk.white(`   Score: ${result2.score}%`));
    console.log(chalk.white(`   Strategy: ${result2.plan?.strategy?.approach || 'N/A'}`));
    console.log(chalk.white(`   Validation: ${result2.validationReport.passed ? 'Passed' : 'Failed'}`));
    console.log(chalk.white(`   Time: ${(result2.metrics.totalTime / 1000).toFixed(2)}s\n`));
    
    // Check word count if output is string
    if (typeof result2.output === 'string') {
      const wordCount = result2.output.split(/\s+/).length;
      console.log(chalk.gray(`   Word Count: ${wordCount}`));
    }
    
  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error.message}\n`));
  }
  
  // Test 3: Complex task with tools
  console.log(chalk.yellow('Test 3: Complex Task with Tools'));
  console.log(chalk.gray('Request: Create API documentation\n'));
  
  try {
    const result3 = await orchestrator.processTask(
      'Create REST API documentation for user authentication with examples',
      {
        outputType: 'structured',
        minQuality: 85,
        expectedSize: 1000,
        mustUseTools: ['file_write'],
        mustHaveSections: ['endpoints', 'parameters', 'responses']
      }
    );
    
    console.log(chalk.green(`✅ Success: ${result3.success}`));
    console.log(chalk.white(`   Score: ${result3.score}%`));
    console.log(chalk.white(`   Strategy: ${result3.plan?.strategy?.approach || 'N/A'}`));
    console.log(chalk.white(`   Agents Used: ${result3.metrics.agentsUsed}`));
    console.log(chalk.white(`   Tools Executed: ${result3.metrics.toolsExecuted}`));
    console.log(chalk.white(`   Checkpoints: ${result3.metrics.checkpointsSaved}`));
    console.log(chalk.white(`   Time: ${(result3.metrics.totalTime / 1000).toFixed(2)}s\n`));
    
    // Show validation details
    if (result3.validationReport.strengths.length > 0) {
      console.log(chalk.green(`   Strengths: ${result3.validationReport.strengths.join(', ')}`));
    }
    if (result3.validationReport.issues.length > 0) {
      console.log(chalk.yellow(`   Issues: ${result3.validationReport.issues.join(', ')}`));
    }
    
  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error.message}\n`));
  }
  
  console.log(chalk.bold.cyan('\n⚛️ QUICK TEST COMPLETED ⚛️\n'));
}

// Run quick test
quickTest().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});