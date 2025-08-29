#!/usr/bin/env node

/**
 * Teste simplificado do Flui Core
 */

const { FluiCore } = require('./dist/services/fluiCore');
const { OpenAIService } = require('./dist/services/openAIService');
const { ToolsManager } = require('./dist/services/toolsManager');
const { MemoryManager } = require('./dist/services/memoryManager');
const { ApiService } = require('./dist/services/apiService');
const chalk = require('chalk');

async function testFlui() {
  console.log(chalk.bold.cyan('\n🚀 FLUI CORE - SIMPLE TEST\n'));
  
  // Initialize
  const apiService = new ApiService('https://api.llm7.io/v1', '');
  const openAIService = new OpenAIService();
  const memoryManager = new MemoryManager();
  const toolsManager = new ToolsManager(apiService, memoryManager, openAIService);
  
  const flui = new FluiCore(openAIService, toolsManager, memoryManager);
  
  // Test 1: Small text
  console.log(chalk.yellow('Test 1: Generate 100 words'));
  try {
    const result1 = await flui.processTask(
      'Write exactly 100 words about AI',
      { type: 'text', wordCount: 100 }
    );
    
    console.log(chalk.green(`✅ Score: ${result1.validation.score}%`));
    console.log(chalk.gray(`   Word count: ${result1.validation.metrics.wordCount || 'N/A'}`));
    console.log(chalk.gray(`   Iterations: ${result1.iterations}`));
  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error.message}`));
  }
  
  // Test 2: Larger text
  console.log(chalk.yellow('\nTest 2: Generate 500 words'));
  try {
    const result2 = await flui.processTask(
      'Write exactly 500 words about the future of technology',
      { type: 'text', wordCount: 500 }
    );
    
    console.log(chalk.green(`✅ Score: ${result2.validation.score}%`));
    
    // Count actual words
    if (typeof result2.output === 'string') {
      const words = result2.output.split(/\s+/).filter(w => w.length > 0).length;
      console.log(chalk.gray(`   Actual words: ${words}`));
      console.log(chalk.gray(`   Accuracy: ${Math.round((1 - Math.abs(words - 500) / 500) * 100)}%`));
    }
    console.log(chalk.gray(`   Iterations: ${result2.iterations}`));
  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error.message}`));
  }
  
  console.log(chalk.bold.cyan('\n✅ Test completed\n'));
}

testFlui().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});