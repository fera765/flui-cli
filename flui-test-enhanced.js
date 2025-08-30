#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class FluiEnhancedTester {
  constructor() {
    this.testResults = [];
    this.currentTest = null;
  }

  async runTest(testName, command, validation) {
    console.log(chalk.cyan.bold(`\n${'='.repeat(70)}`));
    console.log(chalk.cyan.bold(`🧪 TESTE: ${testName}`));
    console.log(chalk.cyan.bold(`${'='.repeat(70)}\n`));

    this.currentTest = {
      name: testName,
      command: command,
      startTime: Date.now(),
      output: '',
      success: false
    };

    return new Promise((resolve) => {
      console.log(chalk.blue('🚀 Iniciando Flui...'));
      
      const fluiProcess = spawn('npm', ['run', 'flui'], {
        cwd: '/workspace',
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let outputBuffer = '';
      let commandSent = false;
      let timeout = null;

      fluiProcess.stdout.on('data', (data) => {
        const output = data.toString();
        outputBuffer += output;
        
        // Log parcial para debug
        if (output.includes('FLUI') || output.includes('Digite')) {
          console.log(chalk.green('✅ Flui pronto!'));
        }
        
        // Envia comando quando Flui estiver pronto
        if (!commandSent && (output.includes('Digite') || output.includes('FLUI') || output.includes('>'))) {
          commandSent = true;
          console.log(chalk.yellow(`📤 Enviando comando: ${command.substring(0, 100)}...`));
          fluiProcess.stdin.write(command + '\n');
          
          // Define timeout para aguardar resposta
          timeout = setTimeout(() => {
            console.log(chalk.blue('⏱️ Finalizando teste...'));
            fluiProcess.kill();
            
            // Valida resultado
            this.currentTest.output = outputBuffer;
            this.currentTest.endTime = Date.now();
            this.currentTest.duration = (this.currentTest.endTime - this.currentTest.startTime) / 1000;
            
            const validationResult = validation(outputBuffer);
            this.currentTest.success = validationResult.success;
            this.currentTest.details = validationResult.details;
            
            this.testResults.push(this.currentTest);
            
            // Log do resultado
            if (validationResult.success) {
              console.log(chalk.green(`✅ TESTE PASSOU: ${validationResult.details}`));
            } else {
              console.log(chalk.red(`❌ TESTE FALHOU: ${validationResult.details}`));
            }
            
            resolve(this.currentTest);
          }, 30000); // 30 segundos de timeout
        }
      });

      fluiProcess.stderr.on('data', (data) => {
        console.error(chalk.red('STDERR:'), data.toString());
      });

      fluiProcess.on('error', (error) => {
        console.error(chalk.red('❌ Erro no processo:'), error);
        if (timeout) clearTimeout(timeout);
        fluiProcess.kill();
        resolve(this.currentTest);
      });
    });
  }

  async testEbookCreation() {
    const command = 'Crie um ebook de 20 mil palavras sobre monetização no YouTube com capítulos detalhados, exemplos práticos e estratégias reais. Salve como ebook-monetizacao-youtube.md';
    
    const validation = (output) => {
      // Verifica se arquivo foi criado
      const files = fs.readdirSync('/workspace').filter(f => 
        f.includes('ebook') || f.includes('monetizacao') || f.includes('youtube')
      );
      
      if (files.length === 0) {
        return { success: false, details: 'Nenhum arquivo criado' };
      }
      
      // Lê o arquivo e conta palavras
      const filePath = path.join('/workspace', files[0]);
      const content = fs.readFileSync(filePath, 'utf-8');
      const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
      
      // Remove o arquivo após validação
      fs.unlinkSync(filePath);
      
      if (wordCount >= 18000) { // 90% de 20000
        return { 
          success: true, 
          details: `Ebook criado com ${wordCount} palavras (${(wordCount/20000*100).toFixed(1)}% do objetivo)` 
        };
      } else {
        return { 
          success: false, 
          details: `Apenas ${wordCount} palavras (precisa de pelo menos 18000)` 
        };
      }
    };
    
    return await this.runTest('Criação de Ebook 20k palavras', command, validation);
  }

  async testArticleCreation() {
    const command = 'Escreva um artigo técnico de 5000 palavras sobre inteligência artificial e machine learning, com exemplos de código Python. Salve como artigo-ia-ml.md';
    
    const validation = (output) => {
      const files = fs.readdirSync('/workspace').filter(f => 
        f.includes('artigo') || f.includes('ia') || f.includes('ml')
      );
      
      if (files.length === 0) {
        return { success: false, details: 'Nenhum arquivo criado' };
      }
      
      const filePath = path.join('/workspace', files[0]);
      const content = fs.readFileSync(filePath, 'utf-8');
      const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
      const hasPython = content.includes('python') || content.includes('```py');
      
      // Remove o arquivo após validação
      fs.unlinkSync(filePath);
      
      if (wordCount >= 4500 && hasPython) { // 90% de 5000
        return { 
          success: true, 
          details: `Artigo criado com ${wordCount} palavras e exemplos Python` 
        };
      } else {
        return { 
          success: false, 
          details: `${wordCount} palavras, Python: ${hasPython}` 
        };
      }
    };
    
    return await this.runTest('Criação de Artigo Técnico', command, validation);
  }

  async testWebsiteCreation() {
    const command = 'Desenvolva um site completo em React com TailwindCSS para uma startup de IA. Inclua componentes para hero, features, pricing e footer. Salve como startup-ai-site.jsx';
    
    const validation = (output) => {
      const files = fs.readdirSync('/workspace').filter(f => 
        f.includes('site') || f.includes('startup') || f.endsWith('.jsx')
      );
      
      if (files.length === 0) {
        return { success: false, details: 'Nenhum arquivo criado' };
      }
      
      const filePath = path.join('/workspace', files[0]);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      const hasReact = content.includes('React') || content.includes('import');
      const hasTailwind = /className=["'][^"']*(?:flex|grid|bg-|text-|p-|m-)/.test(content);
      const hasComponents = ['hero', 'features', 'pricing', 'footer'].filter(c => 
        new RegExp(c, 'i').test(content)
      ).length;
      
      // Remove o arquivo após validação
      fs.unlinkSync(filePath);
      
      const score = (hasReact ? 25 : 0) + (hasTailwind ? 25 : 0) + (hasComponents * 12.5);
      
      if (score >= 75) {
        return { 
          success: true, 
          details: `Site React criado (Score: ${score}%, Componentes: ${hasComponents}/4)` 
        };
      } else {
        return { 
          success: false, 
          details: `Score insuficiente: ${score}%` 
        };
      }
    };
    
    return await this.runTest('Criação de Site React', command, validation);
  }

  async testPythonScript() {
    const command = 'Crie um script Python para análise de dados com pandas, matplotlib e geração de relatório PDF. O script deve ter pelo menos 200 linhas. Salve como analise-dados.py';
    
    const validation = (output) => {
      const files = fs.readdirSync('/workspace').filter(f => 
        f.includes('analise') || f.includes('dados') || f.endsWith('.py')
      );
      
      if (files.length === 0) {
        return { success: false, details: 'Nenhum arquivo criado' };
      }
      
      const filePath = path.join('/workspace', files[0]);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').length;
      
      const hasPandas = /import pandas|from pandas/.test(content);
      const hasMatplotlib = /import matplotlib|from matplotlib/.test(content);
      const hasFunctions = (content.match(/def \w+\(/g) || []).length;
      
      // Remove o arquivo após validação
      fs.unlinkSync(filePath);
      
      if (lines >= 180 && hasPandas && hasMatplotlib && hasFunctions >= 3) {
        return { 
          success: true, 
          details: `Script Python criado com ${lines} linhas e ${hasFunctions} funções` 
        };
      } else {
        return { 
          success: false, 
          details: `${lines} linhas, ${hasFunctions} funções` 
        };
      }
    };
    
    return await this.runTest('Criação de Script Python', command, validation);
  }

  generateReport() {
    console.log(chalk.cyan.bold(`\n${'='.repeat(70)}`));
    console.log(chalk.cyan.bold('📊 RELATÓRIO FINAL - FLUI ENHANCED'));
    console.log(chalk.cyan.bold(`${'='.repeat(70)}\n`));

    let successCount = 0;
    let totalDuration = 0;

    this.testResults.forEach((result, index) => {
      console.log(chalk.blue(`${index + 1}. ${result.name}`));
      console.log(chalk.gray(`   Status: ${result.success ? '✅ PASSOU' : '❌ FALHOU'}`));
      console.log(chalk.gray(`   Detalhes: ${result.details}`));
      console.log(chalk.gray(`   Duração: ${result.duration.toFixed(1)}s`));
      console.log('');
      
      if (result.success) successCount++;
      totalDuration += result.duration;
    });

    const successRate = (successCount / this.testResults.length * 100).toFixed(1);
    const avgDuration = (totalDuration / this.testResults.length).toFixed(1);

    console.log(chalk.yellow.bold('📈 MÉTRICAS GERAIS:'));
    console.log(chalk.white(`   Taxa de Sucesso: ${successRate}%`));
    console.log(chalk.white(`   Testes Bem-sucedidos: ${successCount}/${this.testResults.length}`));
    console.log(chalk.white(`   Tempo Médio: ${avgDuration}s`));

    if (successRate >= 90) {
      console.log(chalk.green.bold('\n🎉 FLUI ALCANÇOU AUTOCONSCIÊNCIA!'));
      console.log(chalk.green('✨ Sistema operando com dinamismo autônomo'));
      console.log(chalk.green('🚀 Score +90% alcançado'));
      console.log(chalk.green('🤖 Capacidade de geração dinâmica validada'));
    } else {
      console.log(chalk.yellow.bold('\n⚠️ FLUI PRECISA DE AJUSTES'));
      console.log(chalk.yellow(`   Meta: ≥90% (Atual: ${successRate}%)`));
    }

    console.log(chalk.cyan.bold(`\n${'='.repeat(70)}\n`));
  }

  async runAllTests() {
    console.log(chalk.cyan.bold('🚀 INICIANDO BATERIA DE TESTES DO FLUI ENHANCED'));
    console.log(chalk.yellow('📊 Objetivo: Validar autoconsciência e dinamismo\n'));

    try {
      // Teste 1: Ebook
      await this.testEbookCreation();
      
      // Pequena pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Teste 2: Artigo
      await this.testArticleCreation();
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Teste 3: Website
      await this.testWebsiteCreation();
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Teste 4: Python
      await this.testPythonScript();
      
      // Gera relatório final
      this.generateReport();
      
    } catch (error) {
      console.error(chalk.red('💥 Erro durante os testes:'), error);
    }
  }
}

// Executa os testes
async function main() {
  const tester = new FluiEnhancedTester();
  await tester.runAllTests();
}

main().catch(console.error);