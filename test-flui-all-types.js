#!/usr/bin/env node

/**
 * Test all Flui Production task types
 */

const chalk = require('chalk');
const { FluiProduction } = require('./dist/services/fluiProduction');
const { OpenAIService } = require('./dist/services/openAIService');
const { ToolsManager } = require('./dist/services/toolsManager');
const { MemoryManager } = require('./dist/services/memoryManager');

async function testAllTypes() {
  console.log(chalk.bold.cyan('\n🧪 FLUI PRODUCTION - ALL TYPES TEST'));
  console.log(chalk.gray('━'.repeat(50)));
  
  // Initialize services
  const openAI = new OpenAIService(process.env.OPENAI_API_KEY || 'test-key');
  const tools = new ToolsManager();
  const memory = new MemoryManager();
  const flui = new FluiProduction(openAI, tools, memory);
  
  const tests = [
    {
      name: '📝 Content (1000 words)',
      task: {
        id: 'test-content',
        type: 'content',
        description: 'Benefits of TypeScript',
        requirements: {
          language: 'typescript',
          architecture: 'modular',
          testing: { unit: false, integration: false, e2e: false, coverage: 0, tdd: false },
          scalability: { containerized: false, loadBalancing: false, caching: false, monitoring: false, ci_cd: false },
          documentation: false,
          wordCount: 1000,
          minQuality: 90
        },
        quality: { codeQuality: 0, testCoverage: 0, documentation: 0, performance: 0, security: 0, maintainability: 0 }
      }
    },
    {
      name: '🔬 Research (2000 words)',
      task: {
        id: 'test-research',
        type: 'research',
        description: 'AI Impact on Healthcare',
        requirements: {
          language: 'typescript',
          architecture: 'modular',
          testing: { unit: false, integration: false, e2e: false, coverage: 0, tdd: false },
          scalability: { containerized: false, loadBalancing: false, caching: false, monitoring: false, ci_cd: false },
          documentation: false,
          wordCount: 2000,
          minQuality: 90
        },
        quality: { codeQuality: 0, testCoverage: 0, documentation: 0, performance: 0, security: 0, maintainability: 0 }
      }
    },
    {
      name: '🎨 Frontend (TypeScript)',
      task: {
        id: 'test-frontend',
        type: 'frontend',
        description: 'Simple dashboard app',
        requirements: {
          language: 'typescript',
          framework: 'react',
          architecture: 'modular',
          testing: { unit: true, integration: false, e2e: false, coverage: 80, tdd: true },
          scalability: { containerized: false, loadBalancing: false, caching: false, monitoring: false, ci_cd: false },
          documentation: true,
          minQuality: 90
        },
        technology: {
          frontend: {
            framework: 'react',
            ui: 'tailwind',
            state: 'redux',
            testing: 'vitest',
            bundler: 'vite'
          }
        },
        quality: { codeQuality: 90, testCoverage: 80, documentation: 85, performance: 90, security: 85, maintainability: 90 }
      }
    },
    {
      name: '⚙️ Backend (TypeScript)',
      task: {
        id: 'test-backend',
        type: 'backend',
        description: 'REST API for user management',
        requirements: {
          language: 'typescript',
          framework: 'express',
          architecture: 'modular',
          testing: { unit: true, integration: false, e2e: false, coverage: 80, tdd: true },
          scalability: { containerized: false, loadBalancing: false, caching: false, monitoring: false, ci_cd: false },
          documentation: true,
          minQuality: 90
        },
        technology: {
          backend: {
            framework: 'express',
            database: 'postgres',
            orm: 'prisma',
            testing: 'jest',
            authentication: 'jwt'
          }
        },
        quality: { codeQuality: 90, testCoverage: 80, documentation: 90, performance: 85, security: 95, maintainability: 90 }
      }
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(chalk.bold.white(`\n${test.name}`));
    
    try {
      const startTime = Date.now();
      const result = await flui.processProductionTask(test.task);
      const duration = Date.now() - startTime;
      
      if (result.success) {
        console.log(chalk.green(`✅ Success! Score: ${result.score}%`));
        
        // Check word count for content/research
        if ((test.task.type === 'content' || test.task.type === 'research') && result.output?.content) {
          const words = result.output.content.split(/\s+/).filter(w => w.length > 0).length;
          const accuracy = ((words / test.task.requirements.wordCount) * 100).toFixed(1);
          console.log(chalk.blue(`   Word count: ${words}/${test.task.requirements.wordCount} (${accuracy}%)`));
        }
        
        // Check structure for code tasks
        if ((test.task.type === 'frontend' || test.task.type === 'backend') && result.output?.structure) {
          console.log(chalk.blue(`   Structure created: ${result.output.structure.created ? 'Yes' : 'No'}`));
        }
      } else {
        console.log(chalk.red(`❌ Failed: ${result.message || 'Unknown error'}`));
      }
      
      results.push({
        name: test.name,
        success: result.success,
        score: result.score || 0,
        duration: duration / 1000
      });
      
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
      results.push({
        name: test.name,
        success: false,
        score: 0,
        error: error.message
      });
    }
  }
  
  // Summary
  console.log(chalk.bold.cyan('\n\n📊 SUMMARY'));
  console.log(chalk.gray('━'.repeat(50)));
  
  const passed = results.filter(r => r.success && r.score >= 90).length;
  const total = results.length;
  
  console.table(results.map(r => ({
    Test: r.name.replace(/[^\w\s]/g, '').trim(),
    Success: r.success ? '✅' : '❌',
    Score: `${r.score}%`,
    Duration: r.duration ? `${r.duration.toFixed(1)}s` : '-'
  })));
  
  if (passed === total) {
    console.log(chalk.bold.green(`\n✨ ALL TESTS PASSED! (${passed}/${total})`));
    console.log(chalk.green('🎉 Flui Production is working perfectly!'));
  } else {
    console.log(chalk.bold.yellow(`\n⚠️ Some tests need work (${passed}/${total} passed)`));
  }
}

// Run tests
testAllTypes().catch(console.error);