#!/usr/bin/env node

/**
 * Simple test for Flui Production
 */

const chalk = require('chalk');

// Import compiled JavaScript
const { FluiProduction } = require('./dist/services/fluiProduction');
const { OpenAIService } = require('./dist/services/openAIService');
const { ToolsManager } = require('./dist/services/toolsManager');
const { MemoryManager } = require('./dist/services/memoryManager');

async function testSimple() {
  console.log(chalk.bold.cyan('\n🧪 FLUI PRODUCTION SIMPLE TEST'));
  console.log(chalk.gray('━'.repeat(50)));
  
  try {
    // Initialize services
    const openAI = new OpenAIService(process.env.OPENAI_API_KEY || 'test-key');
    const tools = new ToolsManager();
    const memory = new MemoryManager();
    const flui = new FluiProduction(openAI, tools, memory);
    
    // Test 1: Simple content generation
    console.log(chalk.white('\n📝 Test 1: Generate 1000-word article'));
    
    const task = {
      id: 'test-1',
      type: 'content',
      description: 'Write an article about the benefits of TypeScript for enterprise applications',
      requirements: {
        language: 'typescript',
        architecture: 'modular',
        testing: {
          unit: false,
          integration: false,
          e2e: false,
          coverage: 0,
          tdd: false
        },
        scalability: {
          containerized: false,
          loadBalancing: false,
          caching: false,
          monitoring: false,
          ci_cd: false
        },
        documentation: false,
        wordCount: 1000,
        minQuality: 90
      },
      quality: {
        codeQuality: 0,
        testCoverage: 0,
        documentation: 0,
        performance: 0,
        security: 0,
        maintainability: 0
      }
    };
    
    const result = await flui.processProductionTask(task);
    
    if (result.success) {
      console.log(chalk.green(`✅ Success! Score: ${result.score}%`));
      
      if (result.output?.content) {
        const words = result.output.content.split(/\s+/).filter(w => w.length > 0).length;
        console.log(chalk.blue(`📊 Word count: ${words}/1000`));
      }
    } else {
      console.log(chalk.red(`❌ Failed: ${result.message}`));
    }
    
    console.log(chalk.green('\n✨ Test completed!'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    console.error(error.stack);
  }
}

// Run test
testSimple().catch(console.error);