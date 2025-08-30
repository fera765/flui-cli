#!/usr/bin/env node

/**
 * Teste DEFINITIVO do Flui Ultimate
 * Objetivo: 100% das tarefas com score 90%+
 */

const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

// Import services
const { FluiUltimate } = require('./dist/services/fluiUltimate');
const { OpenAIService } = require('./dist/services/openAIService');
const { ToolsManager } = require('./dist/services/toolsManager');
const { MemoryManager } = require('./dist/services/memoryManager');

console.log(chalk.bold.cyan('\n' + '═'.repeat(70)));
console.log(chalk.bold.cyan('🚀 FLUI ULTIMATE - TESTE DEFINITIVO'));
console.log(chalk.bold.cyan('═'.repeat(70)));

const tasks = [
  {
    id: 'landing-professional',
    type: 'landing-page',
    description: 'Landing page profissional para planos de saúde',
    requirements: { minComponents: 40, minPages: 10 }
  },
  {
    id: 'api-complete',
    type: 'backend',
    description: 'API REST completa com 25+ endpoints',
    requirements: { minEndpoints: 25, minServices: 10 }
  },
  {
    id: 'fullstack-app',
    type: 'fullstack',
    description: 'Aplicação fullstack completa',
    requirements: { minComponents: 40, minEndpoints: 25 }
  }
];

async function validateProject(projectDir, task) {
  const validation = { score: 0, checks: [] };
  
  try {
    if (task.type === 'landing-page' || task.type === 'fullstack') {
      // Check frontend
      const frontendPath = path.join(projectDir, 'frontend');
      const componentsPath = path.join(frontendPath, 'src/components');
      
      // Count components
      let componentCount = 0;
      async function countFiles(dir) {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              await countFiles(fullPath);
            } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx')) {
              componentCount++;
            }
          }
        } catch {}
      }
      
      await countFiles(componentsPath);
      
      if (componentCount >= 40) {
        validation.score += 40;
        validation.checks.push(`✅ ${componentCount} componentes (excelente!)`);
      } else if (componentCount >= 20) {
        validation.score += 25;
        validation.checks.push(`⚠️ ${componentCount} componentes (esperado 40+)`);
      } else {
        validation.score += 10;
        validation.checks.push(`❌ Apenas ${componentCount} componentes`);
      }
      
      // Check package.json
      try {
        const pkg = JSON.parse(await fs.readFile(path.join(frontendPath, 'package.json'), 'utf-8'));
        if (pkg.dependencies?.react && pkg.dependencies?.['react-router-dom']) {
          validation.score += 10;
          validation.checks.push('✅ Dependências corretas');
        }
      } catch {}
    }
    
    if (task.type === 'backend' || task.type === 'fullstack') {
      // Check backend
      const backendPath = path.join(projectDir, 'backend');
      
      // Count routes
      let routeCount = 0;
      try {
        const routesPath = path.join(backendPath, 'src/routes');
        const routes = await fs.readdir(routesPath);
        routeCount = routes.filter(f => f.endsWith('.ts')).length;
      } catch {}
      
      if (routeCount >= 5) {
        validation.score += 30;
        validation.checks.push(`✅ ${routeCount} arquivos de rotas`);
      } else {
        validation.score += 10;
        validation.checks.push(`❌ Apenas ${routeCount} rotas`);
      }
      
      // Check services
      let serviceCount = 0;
      try {
        const servicesPath = path.join(backendPath, 'src/services');
        const services = await fs.readdir(servicesPath);
        serviceCount = services.filter(f => f.endsWith('.ts')).length;
      } catch {}
      
      if (serviceCount >= 5) {
        validation.score += 20;
        validation.checks.push(`✅ ${serviceCount} serviços`);
      }
    }
    
  } catch (error) {
    validation.checks.push(`❌ Erro: ${error.message}`);
  }
  
  validation.score = Math.min(100, validation.score);
  return validation;
}

async function runTests() {
  const results = [];
  let passedCount = 0;
  
  const openAI = new OpenAIService(process.env.OPENAI_API_KEY || 'test');
  const tools = new ToolsManager();
  const memory = new MemoryManager();
  const flui = new FluiUltimate(openAI, tools, memory);
  
  for (const task of tasks) {
    console.log(chalk.bold.white(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
    console.log(chalk.bold.white(`📦 ${task.id}`));
    console.log(chalk.gray(task.description));
    console.log(chalk.bold.white(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
    
    try {
      const result = await flui.processTask(task);
      const validation = await validateProject(result.projectDir, task);
      
      const finalScore = Math.round((result.score + validation.score) / 2);
      
      console.log(chalk.white('\n📊 Resultados:'));
      validation.checks.forEach(check => console.log(`   ${check}`));
      
      if (finalScore >= 90) {
        console.log(chalk.green(`\n✅ APROVADO - Score: ${finalScore}%`));
        passedCount++;
      } else {
        console.log(chalk.red(`\n❌ REPROVADO - Score: ${finalScore}%`));
      }
      
      results.push({
        task: task.id,
        passed: finalScore >= 90,
        score: finalScore
      });
      
    } catch (error) {
      console.log(chalk.red(`\n❌ ERRO: ${error.message}`));
      results.push({
        task: task.id,
        passed: false,
        score: 0
      });
    }
  }
  
  // Final Report
  console.log(chalk.bold.cyan('\n\n' + '═'.repeat(70)));
  console.log(chalk.bold.cyan('📊 RELATÓRIO FINAL - FLUI ULTIMATE'));
  console.log(chalk.bold.cyan('═'.repeat(70)));
  
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const passRate = (passedCount / tasks.length) * 100;
  
  console.log(chalk.white('\n📈 Resumo:'));
  console.log(chalk.white(`   Total: ${tasks.length} tarefas`));
  console.log(chalk.green(`   Aprovadas: ${passedCount}`));
  console.log(chalk.red(`   Reprovadas: ${tasks.length - passedCount}`));
  console.log(chalk.blue(`   Taxa: ${passRate.toFixed(0)}%`));
  console.log(chalk.yellow(`   Score médio: ${avgScore.toFixed(0)}%`));
  
  console.log(chalk.white('\n📋 Detalhes:'));
  console.table(results.map(r => ({
    Tarefa: r.task,
    Status: r.passed ? '✅' : '❌',
    Score: `${r.score}%`
  })));
  
  if (passedCount === tasks.length && avgScore >= 90) {
    console.log(chalk.bold.green('\n✨ PERFEITO! FLUI ULTIMATE APROVADO!'));
    console.log(chalk.green('🚀 100% das tarefas com score 90%+'));
    console.log(chalk.green('💯 Sistema pronto para produção!'));
  } else {
    console.log(chalk.bold.yellow('\n⚠️ REFINAMENTO NECESSÁRIO'));
    console.log(chalk.yellow(`📊 ${passedCount}/${tasks.length} aprovadas`));
  }
  
  console.log(chalk.bold.white('═'.repeat(70)));
  
  return { passedCount, avgScore };
}

// Execute
runTests()
  .then(({ passedCount, avgScore }) => {
    if (passedCount === tasks.length && avgScore >= 90) {
      console.log(chalk.bold.green('\n✅ SUCESSO TOTAL!'));
      process.exit(0);
    } else {
      console.log(chalk.bold.yellow('\n⚠️ Refinamento necessário'));
      process.exit(1);
    }
  })
  .catch(error => {
    console.error(chalk.red('\n❌ Erro:'), error);
    process.exit(1);
  });