#!/usr/bin/env node

/**
 * REAL Production Test with LLM Integration
 * Tests 5 scenarios with actual execution and validation
 */

const chalk = require('chalk');
const { FluiProduction } = require('./dist/services/fluiProduction');
const { OpenAIService } = require('./dist/services/openAIService');
const { ToolsManager } = require('./dist/services/toolsManager');
const { MemoryManager } = require('./dist/services/memoryManager');

// Use real API key if available, otherwise use test mode
const API_KEY = process.env.OPENAI_API_KEY || 'sk-test-mode';
const USE_REAL_LLM = API_KEY && API_KEY !== 'sk-test-mode';

console.log(chalk.bold.cyan('\n🚀 FLUI PRODUCTION - REAL TEST WITH LLM'));
console.log(chalk.gray('━'.repeat(60)));
console.log(chalk.yellow(`Mode: ${USE_REAL_LLM ? 'REAL LLM (Production)' : 'TEST MODE (Fallback)'}`));

// Test scenarios
const scenarios = [
  {
    name: '📝 Article Generation (10,000 words)',
    task: {
      id: 'article-10k',
      type: 'content',
      description: 'Write a comprehensive guide on "Modern Monetization Strategies for Digital Products: From SaaS to NFTs" with practical examples and case studies',
      requirements: {
        language: 'typescript',
        architecture: 'modular',
        testing: { unit: false, integration: false, e2e: false, coverage: 0, tdd: false },
        scalability: { containerized: false, loadBalancing: false, caching: false, monitoring: false, ci_cd: false },
        documentation: false,
        wordCount: 10000,
        minQuality: 90
      },
      quality: { codeQuality: 0, testCoverage: 0, documentation: 0, performance: 0, security: 0, maintainability: 0 }
    },
    validate: (result) => {
      if (!result.output?.content) return { pass: false, reason: 'No content generated' };
      
      const words = result.output.content.split(/\s+/).filter(w => w.length > 0).length;
      const accuracy = (words / 10000) * 100;
      
      if (accuracy < 90) {
        return { pass: false, reason: `Word count ${words} (${accuracy.toFixed(1)}% of target)` };
      }
      
      if (!result.output.content.includes('#')) {
        return { pass: false, reason: 'No structured sections found' };
      }
      
      return { pass: true, details: `${words} words (${accuracy.toFixed(1)}% accuracy)` };
    }
  },
  {
    name: '🔬 Research Paper (17,000 words)',
    task: {
      id: 'research-17k',
      type: 'research',
      description: 'The Origins and Evolution of Hawks: A Comprehensive Scientific Analysis of Accipitridae Family Through Geological Time',
      requirements: {
        language: 'typescript',
        architecture: 'modular',
        testing: { unit: false, integration: false, e2e: false, coverage: 0, tdd: false },
        scalability: { containerized: false, loadBalancing: false, caching: false, monitoring: false, ci_cd: false },
        documentation: false,
        wordCount: 17000,
        minQuality: 90
      },
      quality: { codeQuality: 0, testCoverage: 0, documentation: 0, performance: 0, security: 0, maintainability: 0 }
    },
    validate: (result) => {
      if (!result.output?.content) return { pass: false, reason: 'No content generated' };
      
      const words = result.output.content.split(/\s+/).filter(w => w.length > 0).length;
      const accuracy = (words / 17000) * 100;
      
      if (accuracy < 90) {
        return { pass: false, reason: `Word count ${words} (${accuracy.toFixed(1)}% of target)` };
      }
      
      const requiredSections = ['Abstract', 'Introduction', 'Methodology', 'Results', 'Discussion', 'Conclusion'];
      const missingSections = requiredSections.filter(s => !result.output.content.includes(s));
      
      if (missingSections.length > 0) {
        return { pass: false, reason: `Missing sections: ${missingSections.join(', ')}` };
      }
      
      return { pass: true, details: `${words} words with all academic sections` };
    }
  },
  {
    name: '💼 Sales Copy (2,000 words)',
    task: {
      id: 'sales-copy',
      type: 'content',
      description: 'Create compelling sales copy for health insurance plans targeting families, with emotional appeal, benefits, testimonials, and clear call-to-action',
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
    },
    validate: (result) => {
      if (!result.output?.content) return { pass: false, reason: 'No content generated' };
      
      const words = result.output.content.split(/\s+/).filter(w => w.length > 0).length;
      const accuracy = (words / 2000) * 100;
      
      if (accuracy < 90) {
        return { pass: false, reason: `Word count ${words} (${accuracy.toFixed(1)}% of target)` };
      }
      
      return { pass: true, details: `${words} words of compelling copy` };
    }
  },
  {
    name: '🎨 Frontend Application (TypeScript + React)',
    task: {
      id: 'frontend-app',
      type: 'frontend',
      description: 'Develop a complete health insurance landing page with TypeScript, React, Vite, and Tailwind CSS. Include hero section, plans comparison, testimonials, and contact form',
      requirements: {
        language: 'typescript',
        framework: 'react',
        architecture: 'modular',
        testing: { unit: true, integration: true, e2e: false, coverage: 80, tdd: true },
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
    },
    validate: (result) => {
      if (!result.output?.structure?.created) {
        return { pass: false, reason: 'Project structure not created' };
      }
      
      // Check if key files were created
      const fs = require('fs');
      const path = require('path');
      const projectPath = result.projectDir;
      
      if (!projectPath) {
        return { pass: false, reason: 'No project directory' };
      }
      
      const requiredFiles = [
        'frontend/package.json',
        'frontend/tsconfig.json',
        'frontend/vite.config.ts'
      ];
      
      const missingFiles = [];
      for (const file of requiredFiles) {
        const filePath = path.join(projectPath, file);
        if (!fs.existsSync(filePath)) {
          missingFiles.push(file);
        }
      }
      
      if (missingFiles.length > 0) {
        return { pass: false, reason: `Missing files: ${missingFiles.join(', ')}` };
      }
      
      // Check if tests were written
      if (!result.testResults || Object.keys(result.testResults).length === 0) {
        return { pass: false, reason: 'No tests executed' };
      }
      
      return { pass: true, details: 'Complete TypeScript React app with tests' };
    }
  },
  {
    name: '⚙️ Backend API (TypeScript + Express)',
    task: {
      id: 'backend-api',
      type: 'backend',
      description: 'Develop a complete REST API for health insurance management with TypeScript, Express, authentication, database models, and comprehensive tests',
      requirements: {
        language: 'typescript',
        framework: 'express',
        architecture: 'modular',
        testing: { unit: true, integration: true, e2e: false, coverage: 80, tdd: true },
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
    },
    validate: (result) => {
      if (!result.output?.structure?.created) {
        return { pass: false, reason: 'Project structure not created' };
      }
      
      const fs = require('fs');
      const path = require('path');
      const projectPath = result.projectDir;
      
      if (!projectPath) {
        return { pass: false, reason: 'No project directory' };
      }
      
      const requiredFiles = [
        'backend/package.json',
        'backend/tsconfig.json',
        'backend/jest.config.js'
      ];
      
      const missingFiles = [];
      for (const file of requiredFiles) {
        const filePath = path.join(projectPath, file);
        if (!fs.existsSync(filePath)) {
          missingFiles.push(file);
        }
      }
      
      if (missingFiles.length > 0) {
        return { pass: false, reason: `Missing files: ${missingFiles.join(', ')}` };
      }
      
      // Check if API endpoints were created
      const serverFile = path.join(projectPath, 'backend/src/server.ts');
      if (!fs.existsSync(serverFile)) {
        return { pass: false, reason: 'No server.ts file created' };
      }
      
      return { pass: true, details: 'Complete TypeScript Express API with tests' };
    }
  }
];

// Main test execution
async function runProductionTests() {
  const results = [];
  let passedCount = 0;
  let totalScore = 0;
  
  // Initialize services
  const openAI = new OpenAIService(API_KEY);
  const tools = new ToolsManager();
  const memory = new MemoryManager();
  const flui = new FluiProduction(openAI, tools, memory);
  
  console.log(chalk.bold.white('\n📋 Starting Production Tests...\n'));
  
  for (const scenario of scenarios) {
    console.log(chalk.bold.white(`\n${scenario.name}`));
    console.log(chalk.gray('─'.repeat(50)));
    
    const startTime = Date.now();
    
    try {
      // Execute task
      const result = await flui.processProductionTask(scenario.task);
      const duration = (Date.now() - startTime) / 1000;
      
      // Validate result
      const validation = scenario.validate(result);
      
      if (result.success && result.score >= 90 && validation.pass) {
        console.log(chalk.green(`✅ PASSED - Score: ${result.score}%`));
        if (validation.details) {
          console.log(chalk.gray(`   ${validation.details}`));
        }
        console.log(chalk.gray(`   Duration: ${duration.toFixed(1)}s`));
        passedCount++;
        totalScore += result.score;
        
        results.push({
          scenario: scenario.name,
          passed: true,
          score: result.score,
          duration,
          details: validation.details
        });
      } else {
        const reason = !result.success ? 'Task failed' : 
                      result.score < 90 ? `Score ${result.score}% < 90%` :
                      validation.reason || 'Validation failed';
        
        console.log(chalk.red(`❌ FAILED - ${reason}`));
        console.log(chalk.gray(`   Duration: ${duration.toFixed(1)}s`));
        
        results.push({
          scenario: scenario.name,
          passed: false,
          score: result.score || 0,
          duration,
          reason
        });
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ ERROR - ${error.message}`));
      
      results.push({
        scenario: scenario.name,
        passed: false,
        score: 0,
        error: error.message
      });
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Final Report
  console.log(chalk.bold.cyan('\n\n' + '═'.repeat(60)));
  console.log(chalk.bold.cyan('📊 FINAL PRODUCTION TEST REPORT'));
  console.log(chalk.bold.cyan('═'.repeat(60)));
  
  const avgScore = passedCount > 0 ? (totalScore / passedCount).toFixed(1) : 0;
  const passRate = ((passedCount / scenarios.length) * 100).toFixed(1);
  
  console.log(chalk.white('\n📈 Overall Results:'));
  console.log(chalk.white(`   Total Tests: ${scenarios.length}`));
  console.log(chalk.green(`   Passed: ${passedCount}`));
  console.log(chalk.red(`   Failed: ${scenarios.length - passedCount}`));
  console.log(chalk.blue(`   Pass Rate: ${passRate}%`));
  console.log(chalk.yellow(`   Average Score: ${avgScore}%`));
  
  console.log(chalk.white('\n📋 Detailed Results:'));
  console.table(results.map(r => ({
    Test: r.scenario.replace(/[^\w\s]/g, '').trim(),
    Status: r.passed ? '✅ PASS' : '❌ FAIL',
    Score: `${r.score}%`,
    Duration: r.duration ? `${r.duration.toFixed(1)}s` : '-',
    Details: r.details || r.reason || r.error || '-'
  })));
  
  // Final verdict
  const allPassed = passedCount === scenarios.length;
  const avgScoreNum = parseFloat(avgScore);
  
  console.log(chalk.bold.white('\n🎯 FINAL VERDICT:'));
  
  if (allPassed && avgScoreNum >= 90) {
    console.log(chalk.bold.green('✨ EXCELLENT! All tests passed with 90%+ score!'));
    console.log(chalk.green('🚀 Flui Production is READY FOR DEPLOYMENT!'));
    console.log(chalk.green('💯 Quality Score: ' + avgScore + '%'));
  } else if (passedCount >= scenarios.length * 0.8 && avgScoreNum >= 85) {
    console.log(chalk.bold.yellow('⚠️ GOOD - Most tests passed but needs minor improvements'));
    console.log(chalk.yellow(`📊 ${passedCount}/${scenarios.length} tests passed`));
    console.log(chalk.yellow(`📈 Average score: ${avgScore}%`));
  } else {
    console.log(chalk.bold.red('❌ NEEDS WORK - Significant improvements required'));
    console.log(chalk.red(`📊 Only ${passedCount}/${scenarios.length} tests passed`));
    console.log(chalk.red(`📉 Average score: ${avgScore}%`));
    
    // Show what needs fixing
    const failed = results.filter(r => !r.passed);
    if (failed.length > 0) {
      console.log(chalk.white('\n🔧 Areas needing improvement:'));
      failed.forEach(f => {
        console.log(chalk.red(`   • ${f.scenario}: ${f.reason || f.error || 'Failed'}`));
      });
    }
  }
  
  // Save detailed report
  const fs = require('fs').promises;
  const reportPath = `flui-production-report-${Date.now()}.json`;
  await fs.writeFile(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    mode: USE_REAL_LLM ? 'production' : 'test',
    summary: {
      total: scenarios.length,
      passed: passedCount,
      failed: scenarios.length - passedCount,
      passRate: passRate + '%',
      averageScore: avgScore + '%'
    },
    results
  }, null, 2));
  
  console.log(chalk.gray(`\n📄 Detailed report saved to: ${reportPath}`));
  
  return allPassed && avgScoreNum >= 90;
}

// Execute tests
runProductionTests()
  .then(success => {
    if (success) {
      console.log(chalk.bold.green('\n✅ SUCCESS - Flui Production achieved 90%+ score!'));
      process.exit(0);
    } else {
      console.log(chalk.bold.yellow('\n⚠️ Tests completed but not all achieved 90%+ score'));
      process.exit(1);
    }
  })
  .catch(error => {
    console.error(chalk.red('\n❌ Fatal error:'), error);
    process.exit(1);
  });