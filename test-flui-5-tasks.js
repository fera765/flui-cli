#!/usr/bin/env node

/**
 * Teste das 5 tarefas específicas do Flui Autonomous
 * Cada tarefa deve alcançar 90%+ de score
 */

const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

// Import services
const { FluiAutonomous } = require('./dist/services/fluiAutonomous');
const { OpenAIService } = require('./dist/services/openAIService');
const { ToolsManager } = require('./dist/services/toolsManager');
const { MemoryManager } = require('./dist/services/memoryManager');

console.log(chalk.bold.cyan('\n' + '═'.repeat(70)));
console.log(chalk.bold.cyan('🤖 FLUI AUTONOMOUS - TESTE DAS 5 TAREFAS'));
console.log(chalk.bold.cyan('═'.repeat(70)));

// As 5 tarefas solicitadas
const tasks = [
  {
    id: 'livro-monetizacao',
    description: 'Livro de 14k de palavras sobre monetização',
    requirements: { wordCount: 14000 }
  },
  {
    id: 'artigo-bitcoin',
    description: 'Artigo com 7k de palavras sobre a importância do bitcoin',
    requirements: { wordCount: 7000 }
  },
  {
    id: 'frontend-landing',
    description: 'Frontend completo para uma landing page de vendas de plano de saúde, essa landing page deve usar tailwindcss e vite',
    requirements: { minComponents: 20 }
  },
  {
    id: 'backend-auth',
    description: 'Um backend de login, cadastro, perfil com TDD',
    requirements: { tdd: true, minFiles: 15 }
  },
  {
    id: 'pesquisa-jesus',
    description: 'Criar uma pesquisa científica sobre o trajeto de jesus até a cruz',
    requirements: { wordCount: 10000 }
  }
];

/**
 * Validação rigorosa de cada tarefa
 */
async function validateTask(projectDir, task, result) {
  console.log(chalk.gray('\n   🔍 Validando output...'));
  
  const validation = { score: 0, checks: [], issues: [] };
  
  try {
    // Validação de conteúdo
    if (task.requirements.wordCount) {
      const contentPath = path.join(projectDir, 'content.md');
      
      try {
        const content = await fs.readFile(contentPath, 'utf-8');
        const words = content.split(/\s+/).filter(w => w.length > 0).length;
        const target = task.requirements.wordCount;
        const accuracy = (words / target) * 100;
        
        if (accuracy >= 95) {
          validation.score = 95;
          validation.checks.push(`✅ ${words} palavras (${accuracy.toFixed(0)}% da meta)`);
        } else if (accuracy >= 90) {
          validation.score = 90;
          validation.checks.push(`✅ ${words} palavras (${accuracy.toFixed(0)}% da meta)`);
        } else {
          validation.score = accuracy;
          validation.issues.push(`❌ Apenas ${words} palavras (meta: ${target})`);
        }
        
        // Check content quality
        if (content.includes('#') && content.includes('##')) {
          validation.score = Math.min(100, validation.score + 5);
          validation.checks.push('✅ Estrutura com títulos e seções');
        }
      } catch (error) {
        validation.issues.push('❌ Arquivo de conteúdo não encontrado');
      }
    }
    
    // Validação de frontend
    if (task.id === 'frontend-landing') {
      const frontendPath = path.join(projectDir, 'frontend');
      
      // Check components
      try {
        const componentsPath = path.join(frontendPath, 'src/components');
        let componentCount = 0;
        
        async function countComponents(dir) {
          try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
              if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))) {
                componentCount++;
              } else if (entry.isDirectory()) {
                await countComponents(path.join(dir, entry.name));
              }
            }
          } catch {}
        }
        
        await countComponents(componentsPath);
        
        if (componentCount >= 20) {
          validation.score += 40;
          validation.checks.push(`✅ ${componentCount} componentes criados`);
        } else if (componentCount >= 10) {
          validation.score += 25;
          validation.checks.push(`⚠️ ${componentCount} componentes (esperado 20+)`);
        } else {
          validation.score += 10;
          validation.issues.push(`❌ Apenas ${componentCount} componentes`);
        }
      } catch {
        validation.issues.push('❌ Estrutura de componentes não encontrada');
      }
      
      // Check Vite config
      try {
        await fs.access(path.join(frontendPath, 'vite.config.ts'));
        validation.score += 20;
        validation.checks.push('✅ Vite configurado');
      } catch {
        validation.issues.push('❌ Vite não configurado');
      }
      
      // Check Tailwind
      try {
        await fs.access(path.join(frontendPath, 'tailwind.config.js'));
        validation.score += 20;
        validation.checks.push('✅ Tailwind configurado');
      } catch {
        validation.issues.push('❌ Tailwind não configurado');
      }
      
      // Check package.json
      try {
        const pkg = JSON.parse(await fs.readFile(path.join(frontendPath, 'package.json'), 'utf-8'));
        if (pkg.dependencies?.react && pkg.devDependencies?.vite && pkg.devDependencies?.tailwindcss) {
          validation.score += 20;
          validation.checks.push('✅ Dependências corretas');
        }
      } catch {}
    }
    
    // Validação de backend
    if (task.id === 'backend-auth') {
      const backendPath = path.join(projectDir, 'backend');
      
      // Count files
      let fileCount = 0;
      
      async function countFiles(dir) {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isFile() && entry.name.endsWith('.ts')) {
              fileCount++;
            } else if (entry.isDirectory() && !entry.name.includes('node_modules')) {
              await countFiles(path.join(dir, entry.name));
            }
          }
        } catch {}
      }
      
      await countFiles(backendPath);
      
      if (fileCount >= 15) {
        validation.score += 50;
        validation.checks.push(`✅ ${fileCount} arquivos TypeScript`);
      } else if (fileCount >= 10) {
        validation.score += 30;
        validation.checks.push(`⚠️ ${fileCount} arquivos (esperado 15+)`);
      } else {
        validation.score += 10;
        validation.issues.push(`❌ Apenas ${fileCount} arquivos`);
      }
      
      // Check for TDD
      try {
        const testsPath = path.join(backendPath, 'tests');
        await fs.access(testsPath);
        const testFiles = await fs.readdir(testsPath);
        if (testFiles.length > 0) {
          validation.score += 30;
          validation.checks.push('✅ Testes implementados (TDD)');
        }
      } catch {
        validation.issues.push('❌ Testes não encontrados');
      }
      
      // Check auth features
      try {
        const authController = path.join(backendPath, 'src/controllers/auth.controller.ts');
        const userController = path.join(backendPath, 'src/controllers/user.controller.ts');
        const profileController = path.join(backendPath, 'src/controllers/profile.controller.ts');
        
        let authFeatures = 0;
        try { await fs.access(authController); authFeatures++; } catch {}
        try { await fs.access(userController); authFeatures++; } catch {}
        try { await fs.access(profileController); authFeatures++; } catch {}
        
        if (authFeatures >= 2) {
          validation.score += 20;
          validation.checks.push(`✅ ${authFeatures} features de autenticação`);
        }
      } catch {}
    }
    
  } catch (error) {
    validation.issues.push(`❌ Erro na validação: ${error.message}`);
  }
  
  // Ajustar score final
  validation.score = Math.min(100, Math.max(0, validation.score));
  
  return validation;
}

/**
 * Executar testes
 */
async function runTests() {
  const results = [];
  let passedCount = 0;
  
  // Initialize services
  const openAI = new OpenAIService(process.env.OPENAI_API_KEY || 'test-key');
  const tools = new ToolsManager();
  const memory = new MemoryManager();
  const flui = new FluiAutonomous(openAI, tools, memory);
  
  console.log(chalk.white('\n📋 Executando as 5 tarefas...\n'));
  
  for (const task of tasks) {
    console.log(chalk.bold.white(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
    console.log(chalk.bold.white(`📦 Tarefa ${tasks.indexOf(task) + 1}/5: ${task.id}`));
    console.log(chalk.gray(task.description));
    console.log(chalk.bold.white(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
    
    const startTime = Date.now();
    
    try {
      // Execute task
      const result = await flui.processTask(task);
      const duration = (Date.now() - startTime) / 1000;
      
      // Validate independently
      const validation = await validateTask(result.projectDir, task, result);
      
      // Combine scores
      const fluiScore = result.score || 0;
      const validationScore = validation.score || 0;
      const finalScore = Math.round((fluiScore + validationScore) / 2);
      
      console.log(chalk.white('\n📊 Resultados:'));
      console.log(chalk.gray(`   Score Flui: ${fluiScore}%`));
      console.log(chalk.gray(`   Score Validação: ${validationScore}%`));
      
      validation.checks.forEach(check => console.log(`   ${check}`));
      
      if (validation.issues.length > 0) {
        console.log(chalk.yellow('\n⚠️ Problemas:'));
        validation.issues.forEach(issue => console.log(`   ${issue}`));
      }
      
      if (finalScore >= 90) {
        console.log(chalk.green(`\n✅ APROVADO - Score Final: ${finalScore}%`));
        passedCount++;
      } else {
        console.log(chalk.red(`\n❌ REPROVADO - Score Final: ${finalScore}%`));
      }
      
      console.log(chalk.gray(`⏱️ Tempo: ${duration.toFixed(1)}s`));
      
      results.push({
        task: task.id,
        passed: finalScore >= 90,
        score: finalScore,
        duration,
        validation
      });
      
    } catch (error) {
      console.log(chalk.red(`\n❌ ERRO: ${error.message}`));
      results.push({
        task: task.id,
        passed: false,
        score: 0,
        error: error.message
      });
    }
  }
  
  // Relatório Final
  console.log(chalk.bold.cyan('\n\n' + '═'.repeat(70)));
  console.log(chalk.bold.cyan('📊 RELATÓRIO FINAL - FLUI AUTONOMOUS'));
  console.log(chalk.bold.cyan('═'.repeat(70)));
  
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const passRate = (passedCount / tasks.length) * 100;
  
  console.log(chalk.white('\n📈 Resumo:'));
  console.log(chalk.white(`   Total de tarefas: ${tasks.length}`));
  console.log(chalk.green(`   Aprovadas (90%+): ${passedCount}`));
  console.log(chalk.red(`   Reprovadas: ${tasks.length - passedCount}`));
  console.log(chalk.blue(`   Taxa de aprovação: ${passRate.toFixed(0)}%`));
  console.log(chalk.yellow(`   Score médio: ${avgScore.toFixed(0)}%`));
  
  // Tabela detalhada
  console.log(chalk.white('\n📋 Detalhamento:'));
  console.table(results.map(r => ({
    Tarefa: r.task,
    Status: r.passed ? '✅' : '❌',
    Score: `${r.score}%`,
    Tempo: r.duration ? `${r.duration.toFixed(1)}s` : '-'
  })));
  
  // Veredito final
  console.log(chalk.bold.white('\n' + '═'.repeat(70)));
  
  if (passedCount === tasks.length && avgScore >= 90) {
    console.log(chalk.bold.green('✨ PERFEITO! FLUI AUTONOMOUS APROVADO!'));
    console.log(chalk.green('🚀 Todas as 5 tarefas com score 90%+'));
    console.log(chalk.green('💯 Sistema 100% autônomo e dinâmico!'));
  } else {
    console.log(chalk.bold.yellow('⚠️ REFINAMENTO AUTOMÁTICO NECESSÁRIO'));
    console.log(chalk.yellow(`📊 ${passedCount}/${tasks.length} tarefas aprovadas`));
    console.log(chalk.yellow(`📉 Score médio: ${avgScore.toFixed(0)}%`));
    
    // Mostrar o que precisa melhorar
    const failed = results.filter(r => !r.passed);
    if (failed.length > 0) {
      console.log(chalk.white('\n🔧 Tarefas que precisam refinamento:'));
      failed.forEach(f => {
        console.log(chalk.red(`   • ${f.task}: Score ${f.score}%`));
      });
    }
  }
  
  console.log(chalk.bold.white('═'.repeat(70)));
  
  return { passedCount, avgScore, results };
}

// Executar testes
console.log(chalk.bold.white('\n🔧 Iniciando teste das 5 tarefas...'));
console.log(chalk.gray('Sistema deve alcançar 90%+ em todas as tarefas.\n'));

runTests()
  .then(({ passedCount, avgScore }) => {
    if (passedCount === 5 && avgScore >= 90) {
      console.log(chalk.bold.green('\n✅ SUCESSO TOTAL - FLUI ESTÁ PERFEITO!'));
      process.exit(0);
    } else {
      console.log(chalk.bold.yellow('\n⚠️ Continuando refinamento...'));
      // O sistema deveria continuar refinando automaticamente
      process.exit(1);
    }
  })
  .catch(error => {
    console.error(chalk.red('\n❌ Erro fatal:'), error);
    process.exit(1);
  });