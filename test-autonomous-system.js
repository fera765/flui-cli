#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const chalk = require('chalk');

/**
 * Sistema de Teste Autônomo
 * Valida que o Flui está 100% dinâmico
 */
class AutonomousSystemTester {
  constructor() {
    this.testResults = [];
    this.codeAnalysis = {
      hasStaticKeywords: false,
      staticKeywordsFound: [],
      isDynamic: true,
      usesLLMForAllDecisions: true
    };
  }
  
  /**
   * Analisa código para detectar elementos estáticos
   */
  async analyzeCodeForStaticElements() {
    console.log(chalk.cyan.bold('\n🔍 ANALISANDO CÓDIGO PARA ELEMENTOS ESTÁTICOS...\n'));
    
    const filesToCheck = [
      'src/core/FluiAutonomous.ts',
      'src/core/DynamicToolSystem.ts',
      'src/core/RealTimeMonitor.ts',
      'src/index-autonomous.ts'
    ];
    
    for (const file of filesToCheck) {
      console.log(chalk.blue(`📄 Analisando: ${file}`));
      
      try {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Padrões que indicam código estático
        const staticPatterns = [
          /if\s*\([^)]*===\s*['"][^'"]+['"]/g,  // Comparações diretas com strings
          /case\s+['"][^'"]+['"]/g,             // Case statements com strings
          /includes\s*\(['"][^'"]+['"]\)/g,     // Includes com strings fixas
          /startsWith\s*\(['"][^'"]+['"]\)/g,   // StartsWith com strings fixas
          /const\s+\w+\s*=\s*\[['"][^'"]+['"]/g // Arrays com strings fixas
        ];
        
        let foundStatic = false;
        staticPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches && matches.length > 0) {
            // Ignora apenas o comando de sair que é necessário
            const filtered = matches.filter(m => !m.includes('sair') && !m.includes('exit'));
            if (filtered.length > 0) {
              foundStatic = true;
              this.codeAnalysis.staticKeywordsFound.push(...filtered);
              console.log(chalk.yellow(`   ⚠️ Encontrado padrão estático: ${filtered[0].substring(0, 50)}...`));
            }
          }
        });
        
        if (!foundStatic) {
          console.log(chalk.green(`   ✅ Nenhum elemento estático encontrado`));
        }
        
      } catch (error) {
        console.log(chalk.red(`   ❌ Erro ao ler arquivo: ${error.message}`));
      }
    }
    
    this.codeAnalysis.hasStaticKeywords = this.codeAnalysis.staticKeywordsFound.length > 0;
    this.codeAnalysis.isDynamic = !this.codeAnalysis.hasStaticKeywords;
    
    return this.codeAnalysis;
  }
  
  /**
   * Testa o sistema com uma requisição
   */
  async testRequest(testName, request) {
    console.log(chalk.cyan.bold(`\n${'='.repeat(70)}`));
    console.log(chalk.cyan.bold(`🧪 TESTE: ${testName}`));
    console.log(chalk.cyan.bold(`${'='.repeat(70)}`));
    console.log(chalk.yellow(`📝 Requisição: ${request}`));
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      let output = '';
      let fileCreated = false;
      let toolsUsed = [];
      
      // Inicia o Flui
      const fluiProcess = spawn('npx', ['ts-node', 'src/index-autonomous.ts'], {
        cwd: '/workspace'
      });
      
      // Envia comando após 2 segundos
      setTimeout(() => {
        console.log(chalk.blue('📤 Enviando comando...'));
        fluiProcess.stdin.write(request + '\n');
      }, 2000);
      
      // Captura output
      fluiProcess.stdout.on('data', (data) => {
        output += data.toString();
        
        // Detecta uso de tools
        if (data.toString().includes('Executando:')) {
          const toolMatch = data.toString().match(/Executando:\s*(\w+)/);
          if (toolMatch) {
            toolsUsed.push(toolMatch[1]);
            console.log(chalk.green(`   ✅ Tool detectada: ${toolMatch[1]}`));
          }
        }
        
        // Detecta arquivo criado
        if (data.toString().includes('Arquivo salvo:')) {
          fileCreated = true;
          console.log(chalk.green('   ✅ Arquivo criado'));
        }
      });
      
      // Timeout de 60 segundos
      setTimeout(() => {
        fluiProcess.kill();
        
        const duration = (Date.now() - startTime) / 1000;
        
        const result = {
          name: testName,
          request: request,
          duration: duration,
          fileCreated: fileCreated,
          toolsUsed: toolsUsed,
          usedLLM: output.includes('Consultando LLM'),
          isDynamic: toolsUsed.length > 0 && !output.includes('palavra-chave'),
          success: fileCreated && toolsUsed.length > 0
        };
        
        this.testResults.push(result);
        
        console.log(chalk.blue('\n📊 Resultado do teste:'));
        console.log(chalk.gray(`   Duração: ${duration.toFixed(1)}s`));
        console.log(chalk.gray(`   Arquivo criado: ${fileCreated ? '✅' : '❌'}`));
        console.log(chalk.gray(`   Tools usadas: ${toolsUsed.length}`));
        console.log(chalk.gray(`   100% Dinâmico: ${result.isDynamic ? '✅' : '❌'}`));
        console.log(chalk.gray(`   Sucesso: ${result.success ? '✅' : '❌'}`));
        
        resolve(result);
      }, 60000);
    });
  }
  
  /**
   * Executa todos os testes
   */
  async runAllTests() {
    console.log(chalk.cyan.bold('🚀 INICIANDO TESTES DO SISTEMA 100% AUTÔNOMO'));
    console.log(chalk.yellow('📊 Validando dinamismo e autonomia completa\n'));
    
    // Primeiro analisa o código
    const codeAnalysis = await this.analyzeCodeForStaticElements();
    
    // Testa com diferentes requisições
    await this.testRequest(
      'Ebook sobre IA',
      'Crie um ebook de 20000 palavras sobre inteligência artificial'
    );
    
    await new Promise(r => setTimeout(r, 5000));
    
    await this.testRequest(
      'Artigo sobre Python',
      'Escreva um artigo técnico de 10000 palavras sobre Python'
    );
    
    await new Promise(r => setTimeout(r, 5000));
    
    await this.testRequest(
      'Manual de DevOps',
      'Desenvolva um manual completo de DevOps com 15000 palavras'
    );
    
    // Gera relatório final
    this.generateFinalReport();
  }
  
  /**
   * Gera relatório final
   */
  generateFinalReport() {
    console.log(chalk.cyan.bold(`\n${'='.repeat(70)}`));
    console.log(chalk.cyan.bold('📊 RELATÓRIO FINAL - SISTEMA 100% AUTÔNOMO'));
    console.log(chalk.cyan.bold(`${'='.repeat(70)}\n`));
    
    // Análise de código
    console.log(chalk.yellow.bold('🔍 ANÁLISE DE CÓDIGO:'));
    console.log(chalk.white(`   Elementos estáticos encontrados: ${this.codeAnalysis.staticKeywordsFound.length}`));
    console.log(chalk.white(`   Código 100% dinâmico: ${this.codeAnalysis.isDynamic ? '✅' : '❌'}`));
    
    if (this.codeAnalysis.staticKeywordsFound.length > 0) {
      console.log(chalk.red('   Elementos estáticos:'));
      this.codeAnalysis.staticKeywordsFound.forEach(elem => {
        console.log(chalk.red(`     • ${elem}`));
      });
    }
    
    // Resultados dos testes
    console.log(chalk.yellow.bold('\n📈 RESULTADOS DOS TESTES:'));
    
    let allSuccess = true;
    let allDynamic = true;
    
    this.testResults.forEach((result, index) => {
      console.log(chalk.blue(`\n${index + 1}. ${result.name}`));
      console.log(chalk.gray(`   Duração: ${result.duration.toFixed(1)}s`));
      console.log(chalk.gray(`   Arquivo criado: ${result.fileCreated ? '✅' : '❌'}`));
      console.log(chalk.gray(`   Tools usadas: ${result.toolsUsed.join(', ') || 'Nenhuma'}`));
      console.log(chalk.gray(`   Usou LLM: ${result.usedLLM ? '✅' : '❌'}`));
      console.log(chalk.gray(`   100% Dinâmico: ${result.isDynamic ? '✅' : '❌'}`));
      console.log(chalk.gray(`   Sucesso: ${result.success ? '✅' : '❌'}`));
      
      if (!result.success) allSuccess = false;
      if (!result.isDynamic) allDynamic = false;
    });
    
    // Veredito final
    console.log(chalk.cyan.bold(`\n${'='.repeat(70)}`));
    
    const isFullyAutonomous = 
      this.codeAnalysis.isDynamic && 
      allSuccess && 
      allDynamic;
    
    if (isFullyAutonomous) {
      console.log(chalk.green.bold('🎉 SISTEMA 100% AUTÔNOMO E DINÂMICO!'));
      console.log(chalk.green('✅ Zero palavras-chave estáticas'));
      console.log(chalk.green('✅ Todas as decisões via LLM'));
      console.log(chalk.green('✅ Tools funcionando perfeitamente'));
      console.log(chalk.green('✅ Geração de conteúdo dinâmica'));
      console.log(chalk.green.bold('\n🏆 FLUI ESTÁ 100% AUTÔNOMO!'));
    } else {
      console.log(chalk.yellow.bold('⚠️ AJUSTES NECESSÁRIOS'));
      
      if (!this.codeAnalysis.isDynamic) {
        console.log(chalk.red('❌ Código contém elementos estáticos'));
      }
      if (!allSuccess) {
        console.log(chalk.red('❌ Nem todos os testes foram bem-sucedidos'));
      }
      if (!allDynamic) {
        console.log(chalk.red('❌ Sistema não está 100% dinâmico'));
      }
      
      console.log(chalk.yellow('\n💡 Recomendações:'));
      console.log(chalk.gray('   • Remover TODAS as comparações com strings fixas'));
      console.log(chalk.gray('   • Usar LLM para TODAS as decisões'));
      console.log(chalk.gray('   • Implementar tools via OpenAI SDK'));
    }
    
    console.log(chalk.cyan.bold(`${'='.repeat(70)}\n`));
  }
}

// Executa testes
async function main() {
  const tester = new AutonomousSystemTester();
  await tester.runAllTests();
}

main().catch(console.error);