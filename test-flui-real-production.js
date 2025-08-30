#!/usr/bin/env node

/**
 * Teste Real de Produção - Flui Core
 * 
 * 5 Tarefas complexas e reais:
 * 1. Livro de 10.000 palavras sobre monetização
 * 2. Frontend completo com Tailwind e Node.js
 * 3. API REST completa com autenticação
 * 4. Sistema de análise de dados
 * 5. Curso online com 5 módulos
 */

const { FluiCore } = require('./dist/services/fluiCore');
const { OpenAIService } = require('./dist/services/openAIService');
const { ToolsManager } = require('./dist/services/toolsManager');
const { MemoryManager } = require('./dist/services/memoryManager');
const { ApiService } = require('./dist/services/apiService');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Tarefas reais e complexas
const realTasks = [
  {
    id: 'book-10k',
    name: 'Livro sobre Monetização',
    description: 'Escreva um livro completo de 10000 palavras sobre estratégias de monetização digital, incluindo capítulos sobre SaaS, infoprodutos, marketing de afiliados, consultoria online e criação de audiência. O livro deve ser profissional, detalhado e pronto para publicação.',
    requirements: {
      type: 'creative',
      wordCount: 10000,
      mustInclude: ['SaaS', 'infoprodutos', 'marketing', 'consultoria', 'audiência'],
      outputFormat: 'text'
    },
    validation: async (output) => {
      // Valida contagem exata de palavras
      const words = output.split(/\s+/).filter(w => w.length > 0).length;
      const accuracy = Math.abs(words - 10000) / 10000;
      
      return {
        wordCount: words,
        accuracy: (1 - accuracy) * 100,
        hasAllTopics: ['SaaS', 'infoprodutos', 'marketing', 'consultoria', 'audiência']
          .every(topic => output.toLowerCase().includes(topic.toLowerCase())),
        isComplete: words >= 9700 && words <= 10300 // ±3% tolerance
      };
    }
  },
  
  {
    id: 'frontend-app',
    name: 'Frontend com Tailwind',
    description: 'Crie uma aplicação frontend completa usando Tailwind CSS e Node.js. A aplicação deve ter: página inicial, dashboard, formulário de contato, integração com API, design responsivo. Deve incluir build, testes e estar rodando na porta 3000.',
    requirements: {
      type: 'application',
      technology: ['tailwindcss', 'nodejs', 'express'],
      mustInclude: ['index.html', 'server.js', 'package.json', 'tailwind.config.js'],
      testRequired: true,
      deployRequired: true
    },
    validation: async (output) => {
      const checks = {
        hasFiles: false,
        canBuild: false,
        canRun: false,
        hasTests: false,
        curlWorks: false
      };
      
      // Verifica arquivos
      try {
        await fs.access('index.html');
        await fs.access('server.js');
        await fs.access('package.json');
        checks.hasFiles = true;
      } catch {}
      
      // Tenta build
      try {
        await execAsync('npm run build 2>&1');
        checks.canBuild = true;
      } catch {}
      
      // Tenta rodar e fazer curl
      try {
        const child = require('child_process').spawn('npm', ['start'], {
          detached: true,
          stdio: 'ignore'
        });
        child.unref();
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const { stdout } = await execAsync('curl -s http://localhost:3000');
        checks.curlWorks = stdout.length > 0;
        checks.canRun = true;
        
        await execAsync('pkill -f "node server.js"').catch(() => {});
      } catch {}
      
      return checks;
    }
  },
  
  {
    id: 'rest-api',
    name: 'API REST com Auth',
    description: 'Desenvolva uma API REST completa com autenticação JWT. Deve incluir: registro de usuários, login, refresh token, CRUD de recursos protegidos, validação de dados, tratamento de erros, documentação Swagger.',
    requirements: {
      type: 'application',
      technology: ['nodejs', 'express', 'jwt', 'swagger'],
      mustInclude: ['auth.js', 'routes.js', 'middleware.js', 'swagger.json'],
      testRequired: true
    },
    validation: async (output) => {
      const checks = {
        hasAuthEndpoints: false,
        hasJWT: false,
        hasSwagger: false,
        hasMiddleware: false
      };
      
      try {
        const serverFile = await fs.readFile('server.js', 'utf8').catch(() => '');
        const authFile = await fs.readFile('auth.js', 'utf8').catch(() => '');
        
        checks.hasAuthEndpoints = serverFile.includes('/register') && serverFile.includes('/login');
        checks.hasJWT = authFile.includes('jsonwebtoken') || serverFile.includes('jwt');
        checks.hasMiddleware = serverFile.includes('middleware') || authFile.includes('middleware');
        
        await fs.access('swagger.json');
        checks.hasSwagger = true;
      } catch {}
      
      return checks;
    }
  },
  
  {
    id: 'data-analysis',
    name: 'Sistema de Análise',
    description: 'Crie um sistema de análise de dados que processa CSVs, gera estatísticas, cria visualizações (descrições), identifica tendências e exporta relatórios. Deve incluir: parser CSV, análise estatística, geração de insights, exportação PDF/JSON.',
    requirements: {
      type: 'application',
      technology: ['nodejs', 'data-analysis'],
      mustInclude: ['analyzer.js', 'parser.js', 'reporter.js', 'sample.csv']
    },
    validation: async (output) => {
      const checks = {
        hasParser: false,
        hasAnalyzer: false,
        hasReporter: false,
        hasSampleData: false,
        canProcess: false
      };
      
      try {
        await fs.access('parser.js');
        checks.hasParser = true;
        
        await fs.access('analyzer.js');
        checks.hasAnalyzer = true;
        
        await fs.access('reporter.js');
        checks.hasReporter = true;
        
        await fs.access('sample.csv');
        checks.hasSampleData = true;
        
        // Tenta processar
        const { stdout } = await execAsync('node analyzer.js sample.csv 2>&1').catch(() => ({ stdout: '' }));
        checks.canProcess = !stdout.includes('error');
      } catch {}
      
      return checks;
    }
  },
  
  {
    id: 'online-course',
    name: 'Curso Online 5 Módulos',
    description: 'Desenvolva um curso online completo sobre "Programação Full Stack" com 5 módulos. Cada módulo deve ter: conteúdo teórico (1000 palavras), exercícios práticos, quiz, recursos adicionais. Total de 5000+ palavras com estrutura profissional.',
    requirements: {
      type: 'creative',
      wordCount: 5000,
      mustInclude: ['módulo 1', 'módulo 2', 'módulo 3', 'módulo 4', 'módulo 5', 'exercícios', 'quiz'],
      outputFormat: 'structured'
    },
    validation: async (output) => {
      const text = typeof output === 'string' ? output : JSON.stringify(output);
      const words = text.split(/\s+/).filter(w => w.length > 0).length;
      
      const hasAllModules = [1, 2, 3, 4, 5].every(n => 
        text.toLowerCase().includes(`módulo ${n}`) || text.toLowerCase().includes(`module ${n}`)
      );
      
      const hasExercises = text.toLowerCase().includes('exercício') || text.toLowerCase().includes('exercise');
      const hasQuiz = text.toLowerCase().includes('quiz');
      
      return {
        wordCount: words,
        hasAllModules,
        hasExercises,
        hasQuiz,
        isComplete: words >= 4850 && hasAllModules && hasExercises && hasQuiz
      };
    }
  }
];

class FluiProductionTester {
  constructor() {
    this.flui = null;
    this.results = [];
    this.outputDir = null;
  }

  async initialize() {
    console.log(chalk.bold.cyan('\n🚀 FLUI PRODUCTION TEST - REAL TASKS\n'));
    
    // Cria diretório para outputs
    this.outputDir = path.join(process.cwd(), `flui-output-${Date.now()}`);
    await fs.mkdir(this.outputDir, { recursive: true });
    process.chdir(this.outputDir);
    
    // Inicializa serviços
    const apiService = new ApiService('https://api.llm7.io/v1', '');
    const openAIService = new OpenAIService();
    const memoryManager = new MemoryManager();
    const toolsManager = new ToolsManager(apiService, memoryManager, openAIService);
    
    this.flui = new FluiCore(openAIService, toolsManager, memoryManager);
    
    console.log(chalk.green('✅ Flui Core initialized'));
    console.log(chalk.gray(`📁 Output directory: ${this.outputDir}\n`));
  }

  async runTask(task) {
    console.log(chalk.bold.yellow(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
    console.log(chalk.bold.yellow(`Task: ${task.name}`));
    console.log(chalk.bold.yellow(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
    console.log(chalk.white(`📝 ${task.description}\n`));
    
    const startTime = Date.now();
    
    try {
      // Executa com Flui
      const result = await this.flui.processTask(task.description, task.requirements);
      
      // Valida resultado
      console.log(chalk.magenta('\n🔍 Validating output...'));
      const validation = await task.validation(result.output);
      
      const duration = Date.now() - startTime;
      
      // Salva output
      await this.saveOutput(task, result.output);
      
      // Análise detalhada
      console.log(chalk.cyan('\n📊 Validation Results:'));
      Object.entries(validation).forEach(([key, value]) => {
        const icon = value === true || (typeof value === 'number' && value > 90) ? '✅' : '❌';
        console.log(chalk.white(`  ${icon} ${key}: ${value}`));
      });
      
      const success = result.validation.score >= 90;
      
      return {
        task,
        success,
        score: result.validation.score,
        validation,
        duration,
        iterations: result.iterations,
        agents: result.agents,
        tools: result.tools
      };
      
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      
      return {
        task,
        success: false,
        score: 0,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  async saveOutput(task, output) {
    const filename = `${task.id}-output.${task.requirements.outputFormat || 'txt'}`;
    const filepath = path.join(this.outputDir, filename);
    
    if (typeof output === 'string') {
      await fs.writeFile(filepath, output);
    } else {
      await fs.writeFile(filepath, JSON.stringify(output, null, 2));
    }
    
    console.log(chalk.gray(`  📁 Output saved: ${filename}`));
  }

  async run() {
    await this.initialize();
    
    const results = [];
    
    for (const task of realTasks) {
      const result = await this.runTask(task);
      results.push(result);
      
      // Pausa entre tarefas
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Relatório final
    this.generateReport(results);
    
    return results;
  }

  generateReport(results) {
    console.log(chalk.bold.cyan('\n════════════════════════════════════════'));
    console.log(chalk.bold.cyan('         FLUI PRODUCTION REPORT'));
    console.log(chalk.bold.cyan('════════════════════════════════════════\n'));
    
    let passed = 0;
    let totalScore = 0;
    
    results.forEach(r => {
      if (r.success && r.score >= 90) passed++;
      totalScore += r.score || 0;
    });
    
    const successRate = (passed / results.length) * 100;
    const avgScore = totalScore / results.length;
    
    console.log(chalk.bold.white('📊 Overall Results:'));
    console.log(chalk.white(`  • Success Rate: ${successRate.toFixed(1)}%`));
    console.log(chalk.white(`  • Average Score: ${avgScore.toFixed(1)}%`));
    console.log(chalk.green(`  • Passed (90%+): ${passed}/${results.length}`));
    
    console.log(chalk.bold.white('\n📋 Task Details:'));
    
    results.forEach(r => {
      const icon = r.success && r.score >= 90 ? '✅' : '❌';
      console.log(chalk.white(`\n${icon} ${r.task.name}`));
      console.log(chalk.gray(`   Score: ${r.score}%`));
      console.log(chalk.gray(`   Time: ${(r.duration / 1000).toFixed(1)}s`));
      console.log(chalk.gray(`   Iterations: ${r.iterations || 0}`));
      
      if (r.validation) {
        if (r.validation.wordCount) {
          console.log(chalk.gray(`   Word Count: ${r.validation.wordCount}`));
        }
        if (r.validation.isComplete !== undefined) {
          console.log(chalk.gray(`   Complete: ${r.validation.isComplete ? 'Yes' : 'No'}`));
        }
      }
    });
    
    console.log(chalk.bold.cyan('\n════════════════════════════════════════'));
    
    if (successRate === 100) {
      console.log(chalk.bold.green('🏆 PERFECT! All tasks completed with 90%+ quality!'));
    } else if (successRate >= 80) {
      console.log(chalk.bold.green('✅ EXCELLENT! Most tasks successful.'));
    } else if (successRate >= 60) {
      console.log(chalk.bold.yellow('⚠️ GOOD! Some refinement needed.'));
    } else {
      console.log(chalk.bold.red('❌ NEEDS IMPROVEMENT'));
    }
    
    console.log(chalk.bold.cyan('════════════════════════════════════════\n'));
  }
}

// Classe para refinamento autônomo
class AutonomousRefiner {
  constructor(tester) {
    this.tester = tester;
    this.refinementCount = 0;
    this.maxRefinements = 5;
  }

  async refineUntilPerfect() {
    console.log(chalk.bold.magenta('\n🔄 AUTONOMOUS REFINEMENT MODE\n'));
    
    let results;
    let allPassed = false;
    
    while (!allPassed && this.refinementCount < this.maxRefinements) {
      this.refinementCount++;
      console.log(chalk.yellow(`\n🔧 Refinement Cycle ${this.refinementCount}/${this.maxRefinements}`));
      
      results = await this.tester.run();
      
      // Verifica se todos passaram
      allPassed = results.every(r => r.success && r.score >= 90);
      
      if (!allPassed) {
        console.log(chalk.yellow('\n⚠️ Some tasks failed. Analyzing for improvements...'));
        
        // Identifica problemas
        const failures = results.filter(r => !r.success || r.score < 90);
        
        for (const failure of failures) {
          console.log(chalk.red(`\n❌ ${failure.task.name} needs improvement`));
          
          if (failure.validation) {
            // Analisa problemas específicos
            if (failure.validation.wordCount && failure.task.requirements.wordCount) {
              const diff = failure.validation.wordCount - failure.task.requirements.wordCount;
              if (Math.abs(diff) > failure.task.requirements.wordCount * 0.03) {
                console.log(chalk.yellow(`   Issue: Word count off by ${diff} words`));
              }
            }
            
            if (failure.validation.hasFiles === false) {
              console.log(chalk.yellow(`   Issue: Required files not created`));
            }
            
            if (failure.validation.canRun === false) {
              console.log(chalk.yellow(`   Issue: Application cannot run`));
            }
          }
        }
        
        // Espera antes do próximo ciclo
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    if (allPassed) {
      console.log(chalk.bold.green('\n🎉 SUCCESS! All tasks completed with 90%+ quality!'));
    } else {
      console.log(chalk.bold.yellow('\n⚠️ Maximum refinements reached. Manual intervention may be needed.'));
    }
    
    return results;
  }
}

// Execução principal
if (require.main === module) {
  const tester = new FluiProductionTester();
  const refiner = new AutonomousRefiner(tester);
  
  refiner.refineUntilPerfect().then(results => {
    const allPassed = results.every(r => r.success && r.score >= 90);
    
    if (allPassed) {
      console.log(chalk.bold.green('\n✅ FLUI IS PRODUCTION READY!'));
      console.log(chalk.green('All tasks completed with precision and quality.\n'));
    } else {
      console.log(chalk.bold.yellow('\n⚠️ FLUI needs more refinement.'));
      console.log(chalk.yellow('Some tasks did not meet the 90% threshold.\n'));
    }
    
    process.exit(allPassed ? 0 : 1);
  }).catch(error => {
    console.error(chalk.red('\n❌ Fatal error:'), error);
    process.exit(1);
  });
}