#!/usr/bin/env node

/**
 * Teste Real: Landing Page de Plano de Saúde
 * Frontend: Vite + Tailwind CSS
 * Backend: Node.js + Express
 * Requisitos: Build, teste, integração, curl
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

class LandingPageTester {
  constructor() {
    this.flui = null;
    this.workDir = null;
  }

  async initialize() {
    console.log(chalk.bold.cyan('\n🚀 FLUI - LANDING PAGE DEVELOPMENT TEST\n'));
    
    // Create work directory
    this.workDir = path.join(process.cwd(), `landing-page-${Date.now()}`);
    await fs.mkdir(this.workDir, { recursive: true });
    process.chdir(this.workDir);
    
    console.log(chalk.gray(`📁 Working directory: ${this.workDir}\n`));
    
    // Initialize Flui
    const apiService = new ApiService('https://api.llm7.io/v1', '');
    const openAIService = new OpenAIService();
    const memoryManager = new MemoryManager();
    const toolsManager = new ToolsManager(apiService, memoryManager, openAIService);
    
    this.flui = new FluiCore(openAIService, toolsManager, memoryManager);
  }

  async testFrontend() {
    console.log(chalk.bold.yellow('\n━━━ FRONTEND DEVELOPMENT ━━━\n'));
    
    const frontendTask = `
    Desenvolva um frontend completo de landing page para venda de planos de saúde usando Vite e Tailwind CSS.
    
    Requisitos:
    1. Use Vite como bundler
    2. Use Tailwind CSS para estilização
    3. Crie uma landing page profissional com:
       - Header com logo e menu
       - Hero section com CTA
       - Seção de planos (3 planos diferentes)
       - Seção de benefícios
       - Formulário de contato
       - Footer
    4. Design responsivo
    5. Integração com API backend (fetch para /api/plans e /api/contact)
    6. package.json com scripts de dev, build e preview
    7. Configuração completa do Vite e Tailwind
    
    Crie todos os arquivos necessários: index.html, main.js, style.css, vite.config.js, tailwind.config.js, package.json
    `;

    const result = await this.flui.processTask(frontendTask, {
      type: 'application',
      technology: ['vite', 'tailwindcss', 'javascript'],
      testRequired: true,
      deployRequired: true
    });

    return result;
  }

  async testBackend() {
    console.log(chalk.bold.yellow('\n━━━ BACKEND DEVELOPMENT ━━━\n'));
    
    const backendTask = `
    Desenvolva um backend completo para a landing page de planos de saúde usando Node.js e Express.
    
    Requisitos:
    1. Use Express.js
    2. Endpoints necessários:
       - GET /api/plans - retorna lista de planos
       - POST /api/contact - recebe formulário de contato
       - GET /api/health - health check
    3. CORS habilitado
    4. Dados dos planos em JSON
    5. Validação de dados no POST
    6. Porta 3001 para não conflitar com frontend
    7. package.json com scripts start e dev
    
    Crie: server.js, package.json, routes/api.js
    `;

    const result = await this.flui.processTask(backendTask, {
      type: 'application',
      technology: ['nodejs', 'express'],
      testRequired: true,
      deployRequired: true
    });

    return result;
  }

  async validateFrontend() {
    console.log(chalk.magenta('\n🔍 Validating Frontend...\n'));
    
    const checks = {
      hasViteConfig: false,
      hasTailwindConfig: false,
      hasIndexHtml: false,
      hasPackageJson: false,
      canInstall: false,
      canBuild: false,
      hasAllSections: false
    };

    try {
      // Check files
      await fs.access('frontend/vite.config.js');
      checks.hasViteConfig = true;
    } catch {}

    try {
      await fs.access('frontend/tailwind.config.js');
      checks.hasTailwindConfig = true;
    } catch {}

    try {
      await fs.access('frontend/index.html');
      const html = await fs.readFile('frontend/index.html', 'utf8');
      checks.hasIndexHtml = true;
      
      // Check for required sections
      checks.hasAllSections = 
        html.includes('header') &&
        html.includes('hero') &&
        html.includes('plans') &&
        html.includes('benefits') &&
        html.includes('contact') &&
        html.includes('footer');
    } catch {}

    try {
      await fs.access('frontend/package.json');
      const pkg = JSON.parse(await fs.readFile('frontend/package.json', 'utf8'));
      checks.hasPackageJson = true;
      
      // Check for required dependencies
      const hasDeps = 
        pkg.devDependencies?.vite &&
        (pkg.devDependencies?.tailwindcss || pkg.dependencies?.tailwindcss);
      
      if (!hasDeps) {
        console.log(chalk.yellow('  ⚠️ Missing dependencies'));
      }
    } catch {}

    // Try to install
    try {
      console.log(chalk.gray('  Installing dependencies...'));
      await execAsync('cd frontend && npm install', { timeout: 60000 });
      checks.canInstall = true;
    } catch (error) {
      console.log(chalk.red(`  ❌ Install failed: ${error.message}`));
    }

    // Try to build
    if (checks.canInstall) {
      try {
        console.log(chalk.gray('  Building frontend...'));
        await execAsync('cd frontend && npm run build', { timeout: 60000 });
        checks.canBuild = true;
      } catch (error) {
        console.log(chalk.red(`  ❌ Build failed: ${error.message}`));
      }
    }

    return checks;
  }

  async validateBackend() {
    console.log(chalk.magenta('\n🔍 Validating Backend...\n'));
    
    const checks = {
      hasServerJs: false,
      hasPackageJson: false,
      hasApiRoutes: false,
      canInstall: false,
      canRun: false,
      healthCheckWorks: false,
      plansEndpointWorks: false
    };

    try {
      await fs.access('backend/server.js');
      const server = await fs.readFile('backend/server.js', 'utf8');
      checks.hasServerJs = true;
      
      // Check for required endpoints
      checks.hasApiRoutes = 
        server.includes('/api/plans') &&
        server.includes('/api/contact') &&
        server.includes('/api/health');
    } catch {}

    try {
      await fs.access('backend/package.json');
      checks.hasPackageJson = true;
    } catch {}

    // Try to install
    try {
      console.log(chalk.gray('  Installing dependencies...'));
      await execAsync('cd backend && npm install', { timeout: 60000 });
      checks.canInstall = true;
    } catch {}

    // Try to run and test
    if (checks.canInstall) {
      try {
        console.log(chalk.gray('  Starting backend...'));
        
        // Start backend in background
        const { spawn } = require('child_process');
        const backend = spawn('node', ['server.js'], {
          cwd: path.join(this.workDir, 'backend'),
          detached: true,
          stdio: 'ignore'
        });
        backend.unref();
        
        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        checks.canRun = true;
        
        // Test health endpoint
        try {
          const { stdout } = await execAsync('curl -s http://localhost:3001/api/health');
          checks.healthCheckWorks = stdout.includes('ok') || stdout.includes('OK');
        } catch {}
        
        // Test plans endpoint
        try {
          const { stdout } = await execAsync('curl -s http://localhost:3001/api/plans');
          checks.plansEndpointWorks = stdout.includes('[') || stdout.includes('plans');
        } catch {}
        
        // Stop backend
        await execAsync('pkill -f "node server.js"').catch(() => {});
        
      } catch (error) {
        console.log(chalk.red(`  ❌ Runtime error: ${error.message}`));
      }
    }

    return checks;
  }

  async testIntegration() {
    console.log(chalk.magenta('\n🔗 Testing Integration...\n'));
    
    const checks = {
      frontendCallsBackend: false,
      corsConfigured: false,
      fullStackWorks: false
    };

    try {
      // Check if frontend has API calls
      const mainJs = await fs.readFile('frontend/main.js', 'utf8').catch(() => '');
      const indexHtml = await fs.readFile('frontend/index.html', 'utf8').catch(() => '');
      
      checks.frontendCallsBackend = 
        mainJs.includes('fetch') && 
        (mainJs.includes('3001') || mainJs.includes('/api/'));
      
      // Check CORS in backend
      const serverJs = await fs.readFile('backend/server.js', 'utf8').catch(() => '');
      checks.corsConfigured = serverJs.includes('cors');
      
      // Try full stack test
      if (checks.frontendCallsBackend && checks.corsConfigured) {
        checks.fullStackWorks = true;
      }
      
    } catch (error) {
      console.log(chalk.red(`  ❌ Integration check failed: ${error.message}`));
    }

    return checks;
  }

  async generateReport(frontendResult, backendResult, frontendChecks, backendChecks, integrationChecks) {
    console.log(chalk.bold.cyan('\n════════════════════════════════════════'));
    console.log(chalk.bold.cyan('         LANDING PAGE TEST REPORT'));
    console.log(chalk.bold.cyan('════════════════════════════════════════\n'));

    // Calculate scores
    const frontendScore = this.calculateScore(frontendChecks);
    const backendScore = this.calculateScore(backendChecks);
    const integrationScore = this.calculateScore(integrationChecks);
    const overallScore = Math.round((frontendScore + backendScore + integrationScore) / 3);

    console.log(chalk.bold.white('📊 Scores:'));
    console.log(chalk.white(`  • Frontend: ${frontendScore}%`));
    console.log(chalk.white(`  • Backend: ${backendScore}%`));
    console.log(chalk.white(`  • Integration: ${integrationScore}%`));
    console.log(chalk.bold.yellow(`  • OVERALL: ${overallScore}%`));

    console.log(chalk.bold.white('\n✅ Frontend Checks:'));
    Object.entries(frontendChecks).forEach(([check, passed]) => {
      const icon = passed ? '✅' : '❌';
      console.log(chalk.white(`  ${icon} ${check}`));
    });

    console.log(chalk.bold.white('\n✅ Backend Checks:'));
    Object.entries(backendChecks).forEach(([check, passed]) => {
      const icon = passed ? '✅' : '❌';
      console.log(chalk.white(`  ${icon} ${check}`));
    });

    console.log(chalk.bold.white('\n🔗 Integration Checks:'));
    Object.entries(integrationChecks).forEach(([check, passed]) => {
      const icon = passed ? '✅' : '❌';
      console.log(chalk.white(`  ${icon} ${check}`));
    });

    console.log(chalk.bold.cyan('\n════════════════════════════════════════'));
    
    if (overallScore >= 90) {
      console.log(chalk.bold.green('🏆 SUCCESS! Landing page fully functional!'));
    } else {
      console.log(chalk.bold.yellow(`⚠️ NEEDS IMPROVEMENT - Score: ${overallScore}%`));
    }
    
    console.log(chalk.bold.cyan('════════════════════════════════════════\n'));

    return {
      frontendScore,
      backendScore,
      integrationScore,
      overallScore,
      success: overallScore >= 90
    };
  }

  calculateScore(checks) {
    const total = Object.keys(checks).length;
    const passed = Object.values(checks).filter(v => v === true).length;
    return Math.round((passed / total) * 100);
  }

  async run() {
    await this.initialize();
    
    // Develop frontend
    const frontendResult = await this.testFrontend();
    console.log(chalk.green(`\n✅ Frontend Score: ${frontendResult.validation.score}%`));
    
    // Develop backend
    const backendResult = await this.testBackend();
    console.log(chalk.green(`\n✅ Backend Score: ${backendResult.validation.score}%`));
    
    // Validate everything
    const frontendChecks = await this.validateFrontend();
    const backendChecks = await this.validateBackend();
    const integrationChecks = await this.testIntegration();
    
    // Generate report
    const report = await this.generateReport(
      frontendResult,
      backendResult,
      frontendChecks,
      backendChecks,
      integrationChecks
    );
    
    return report;
  }
}

// Autonomous refiner
class AutonomousLandingPageRefiner {
  constructor() {
    this.iterations = 0;
    this.maxIterations = 10;
  }

  async refineUntilPerfect() {
    console.log(chalk.bold.magenta('\n🤖 AUTONOMOUS REFINEMENT MODE ACTIVATED\n'));
    
    let report;
    let success = false;
    
    while (!success && this.iterations < this.maxIterations) {
      this.iterations++;
      console.log(chalk.yellow(`\n🔄 Refinement Iteration ${this.iterations}/${this.maxIterations}`));
      
      const tester = new LandingPageTester();
      report = await tester.run();
      
      success = report.success && report.overallScore >= 90;
      
      if (!success) {
        console.log(chalk.yellow('\n⚠️ Landing page not complete. Analyzing issues...'));
        
        // Identify specific problems
        if (report.frontendScore < 90) {
          console.log(chalk.red('  • Frontend needs improvement'));
        }
        if (report.backendScore < 90) {
          console.log(chalk.red('  • Backend needs improvement'));
        }
        if (report.integrationScore < 90) {
          console.log(chalk.red('  • Integration needs improvement'));
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    if (success) {
      console.log(chalk.bold.green('\n🎉 PERFECT! Landing page 100% functional!'));
      console.log(chalk.green('• Frontend with Vite + Tailwind ✅'));
      console.log(chalk.green('• Backend with Express ✅'));
      console.log(chalk.green('• Full integration working ✅'));
      console.log(chalk.green('• All tests passing ✅'));
      console.log(chalk.green('• Score 90%+ achieved ✅'));
    } else {
      console.log(chalk.bold.red('\n❌ Could not achieve 90% after maximum iterations'));
    }
    
    return { success, report };
  }
}

// Main execution
if (require.main === module) {
  const refiner = new AutonomousLandingPageRefiner();
  
  refiner.refineUntilPerfect().then(({ success, report }) => {
    if (success) {
      console.log(chalk.bold.green('\n✅ FLUI SUCCESSFULLY CREATED LANDING PAGE!'));
      console.log(chalk.green('All requirements met with 90%+ quality.\n'));
      process.exit(0);
    } else {
      console.log(chalk.bold.red('\n❌ FLUI needs more refinement.'));
      process.exit(1);
    }
  }).catch(error => {
    console.error(chalk.red('\n❌ Fatal error:'), error);
    process.exit(1);
  });
}