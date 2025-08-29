#!/usr/bin/env node

/**
 * Test Flui Production with 5 different scenarios
 * 
 * Scenarios:
 * 1. Frontend with TypeScript (React + Vite + Tailwind)
 * 2. Backend with TypeScript (Node.js + Express + TDD)
 * 3. Python Full-stack Application
 * 4. Book about Monetization (10k words)
 * 5. Scientific Research about Hawks (17k words)
 */

const chalk = require('chalk');
const { FluiProduction } = require('./dist/services/fluiProduction');
const { OpenAIService } = require('./dist/services/openAIService');
const { ToolsManager } = require('./dist/services/toolsManager');
const { MemoryManager } = require('./dist/services/memoryManager');

// Initialize services
const openAI = new OpenAIService(process.env.OPENAI_API_KEY || 'test-key');
const tools = new ToolsManager();
const memory = new MemoryManager();
const flui = new FluiProduction(openAI, tools, memory);

// Test scenarios
const scenarios = [
  {
    id: 'frontend-typescript',
    task: {
      id: 'task-1',
      type: 'frontend',
      description: 'Develop a professional e-commerce frontend application with product catalog, shopping cart, checkout, user authentication, and admin panel',
      requirements: {
        language: 'typescript',
        framework: 'react',
        architecture: 'modular',
        testing: {
          unit: true,
          integration: true,
          e2e: true,
          coverage: 80,
          tdd: true
        },
        scalability: {
          containerized: true,
          loadBalancing: true,
          caching: true,
          monitoring: true,
          ci_cd: true
        },
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
      quality: {
        codeQuality: 90,
        testCoverage: 80,
        documentation: 85,
        performance: 90,
        security: 85,
        maintainability: 90
      }
    }
  },
  {
    id: 'backend-typescript',
    task: {
      id: 'task-2',
      type: 'backend',
      description: 'Develop a scalable REST API for a healthcare platform with patient management, appointment scheduling, medical records, billing, and analytics',
      requirements: {
        language: 'typescript',
        framework: 'express',
        architecture: 'microservices',
        testing: {
          unit: true,
          integration: true,
          e2e: true,
          coverage: 85,
          tdd: true
        },
        scalability: {
          containerized: true,
          loadBalancing: true,
          caching: true,
          monitoring: true,
          ci_cd: true
        },
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
      quality: {
        codeQuality: 90,
        testCoverage: 85,
        documentation: 90,
        performance: 85,
        security: 95,
        maintainability: 90
      }
    }
  },
  {
    id: 'python-fullstack',
    task: {
      id: 'task-3',
      type: 'fullstack',
      description: 'Develop a complete data analytics platform with Python backend (FastAPI) and React frontend for data visualization, machine learning model management, and real-time dashboards',
      requirements: {
        language: 'python',
        framework: 'fastapi',
        architecture: 'modular',
        testing: {
          unit: true,
          integration: true,
          e2e: true,
          coverage: 80,
          tdd: true
        },
        scalability: {
          containerized: true,
          loadBalancing: true,
          caching: true,
          monitoring: true,
          ci_cd: true
        },
        documentation: true,
        minQuality: 90
      },
      quality: {
        codeQuality: 90,
        testCoverage: 80,
        documentation: 85,
        performance: 85,
        security: 85,
        maintainability: 90
      }
    }
  },
  {
    id: 'book-monetization',
    task: {
      id: 'task-4',
      type: 'content',
      description: 'Write a comprehensive book about "Modern Monetization Strategies for Digital Products: From SaaS to NFTs" with practical examples, case studies, and actionable frameworks',
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
        wordCount: 10000,
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
    }
  },
  {
    id: 'research-hawks',
    task: {
      id: 'task-5',
      type: 'research',
      description: 'The Origins and Evolution of Hawks: A Comprehensive Scientific Analysis of Accipitridae Family Through Geological Time',
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
        wordCount: 17000,
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
    }
  }
];

// Additional test scenarios
const additionalScenarios = [
  {
    id: 'health-plan-copy',
    task: {
      id: 'task-6',
      type: 'content',
      description: 'Create professional sales copy for health insurance plans targeting families, with emotional appeal, benefits focus, and clear call-to-action',
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
        wordCount: 2000,
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
    }
  },
  {
    id: 'vsl-script',
    task: {
      id: 'task-7',
      type: 'content',
      description: 'Write a compelling 2000-word VSL (Video Sales Letter) script for an online course about passive income through digital products',
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
        wordCount: 2000,
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
    }
  }
];

// Run tests
async function runTests() {
  console.log(chalk.bold.cyan('\n🚀 FLUI PRODUCTION TEST SUITE'));
  console.log(chalk.gray('━'.repeat(60)));
  
  const results = [];
  
  // Run main scenarios
  for (const scenario of scenarios) {
    console.log(chalk.bold.white(`\n📋 Scenario: ${scenario.id}`));
    console.log(chalk.gray(`Description: ${scenario.task.description.substring(0, 80)}...`));
    
    try {
      const startTime = Date.now();
      const result = await flui.processProductionTask(scenario.task);
      const duration = Date.now() - startTime;
      
      results.push({
        scenario: scenario.id,
        success: result.success,
        score: result.score || 0,
        duration: duration / 1000,
        iterations: result.iterations,
        details: result
      });
      
      if (result.success) {
        console.log(chalk.green(`✅ Success! Score: ${result.score}% in ${(duration/1000).toFixed(1)}s`));
        
        // Validate word count for content tasks
        if (scenario.task.requirements.wordCount && result.output?.content) {
          const words = result.output.content.split(/\s+/).filter(w => w.length > 0).length;
          const accuracy = ((words / scenario.task.requirements.wordCount) * 100).toFixed(1);
          console.log(chalk.blue(`📊 Word Count: ${words}/${scenario.task.requirements.wordCount} (${accuracy}% accuracy)`));
        }
      } else {
        console.log(chalk.red(`❌ Failed: ${result.message}`));
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
      results.push({
        scenario: scenario.id,
        success: false,
        score: 0,
        error: error.message
      });
    }
    
    // Add delay between scenarios
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Run additional scenarios
  console.log(chalk.bold.yellow('\n\n📋 Additional Scenarios'));
  console.log(chalk.gray('━'.repeat(60)));
  
  for (const scenario of additionalScenarios) {
    console.log(chalk.bold.white(`\n📋 Scenario: ${scenario.id}`));
    console.log(chalk.gray(`Description: ${scenario.task.description.substring(0, 80)}...`));
    
    try {
      const startTime = Date.now();
      const result = await flui.processProductionTask(scenario.task);
      const duration = Date.now() - startTime;
      
      results.push({
        scenario: scenario.id,
        success: result.success,
        score: result.score || 0,
        duration: duration / 1000,
        iterations: result.iterations,
        details: result
      });
      
      if (result.success) {
        console.log(chalk.green(`✅ Success! Score: ${result.score}% in ${(duration/1000).toFixed(1)}s`));
        
        // Validate word count
        if (scenario.task.requirements.wordCount && result.output?.content) {
          const words = result.output.content.split(/\s+/).filter(w => w.length > 0).length;
          const accuracy = ((words / scenario.task.requirements.wordCount) * 100).toFixed(1);
          console.log(chalk.blue(`📊 Word Count: ${words}/${scenario.task.requirements.wordCount} (${accuracy}% accuracy)`));
        }
      } else {
        console.log(chalk.red(`❌ Failed: ${result.message}`));
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
      results.push({
        scenario: scenario.id,
        success: false,
        score: 0,
        error: error.message
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Final report
  console.log(chalk.bold.cyan('\n\n📊 FINAL REPORT'));
  console.log(chalk.gray('━'.repeat(60)));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgScore = results.filter(r => r.success).reduce((sum, r) => sum + r.score, 0) / successful || 0;
  const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;
  
  console.log(chalk.white('\n📈 Summary:'));
  console.log(chalk.green(`  ✅ Successful: ${successful}/${results.length}`));
  console.log(chalk.red(`  ❌ Failed: ${failed}/${results.length}`));
  console.log(chalk.blue(`  📊 Average Score: ${avgScore.toFixed(1)}%`));
  console.log(chalk.yellow(`  ⏱️ Average Duration: ${avgDuration.toFixed(1)}s`));
  
  console.log(chalk.white('\n📋 Detailed Results:'));
  console.table(results.map(r => ({
    Scenario: r.scenario,
    Success: r.success ? '✅' : '❌',
    Score: `${r.score}%`,
    Duration: `${r.duration?.toFixed(1)}s`,
    Iterations: r.iterations || '-'
  })));
  
  // Check if all passed with 90%+ score
  const allPassed = results.every(r => r.success && r.score >= 90);
  
  if (allPassed) {
    console.log(chalk.bold.green('\n🎉 ALL TESTS PASSED WITH 90%+ SCORE!'));
    console.log(chalk.green('✨ Flui Production is ready for deployment!'));
  } else {
    console.log(chalk.bold.yellow('\n⚠️ Some tests need improvement'));
    console.log(chalk.yellow('🔧 Refinement needed for production readiness'));
    
    // Show what needs improvement
    const needsWork = results.filter(r => !r.success || r.score < 90);
    if (needsWork.length > 0) {
      console.log(chalk.white('\n🔧 Needs Improvement:'));
      needsWork.forEach(r => {
        console.log(chalk.red(`  - ${r.scenario}: ${r.success ? `Score ${r.score}%` : 'Failed'}`));
      });
    }
  }
  
  // Save results to file
  const fs = require('fs').promises;
  const reportPath = `flui-production-report-${Date.now()}.json`;
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
  console.log(chalk.gray(`\n📄 Full report saved to: ${reportPath}`));
}

// Execute tests
runTests().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});