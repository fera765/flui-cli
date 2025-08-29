#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

console.log(chalk.cyan.bold('\n🧪 TESTE SIMPLES - FERRAMENTAS\n'));

async function testTools() {
  try {
    // Teste 1: CascadeToolsAdapter
    console.log(chalk.yellow('1️⃣ Testando CascadeToolsAdapter...'));
    
    const { CascadeToolsAdapter } = require('../dist/services/cascadeToolsAdapter');
    const { ToolsManager } = require('../dist/services/toolsManager');
    const { MemoryManager } = require('../dist/services/memoryManager');
    const { OpenAIService } = require('../dist/services/openAIService');
    const { NavigationManager } = require('../dist/services/navigationManager');
    const { ErrorHandler } = require('../dist/services/errorHandler');
    
    const memoryManager = new MemoryManager();
    const navigationManager = new NavigationManager();
    const errorHandler = new ErrorHandler();
    const openAIService = new OpenAIService();
    const toolsManager = new ToolsManager(
      memoryManager,
      openAIService,
      navigationManager,
      errorHandler
    );
    
    const adapter = new CascadeToolsAdapter(toolsManager);
    console.log(chalk.green('  ✅ Adapter criado'));
    
    // Teste 2: Executar file_write
    console.log(chalk.yellow('\n2️⃣ Testando file_write...'));
    
    const testDir = path.join(__dirname, 'test-output');
    await fs.mkdir(testDir, { recursive: true });
    
    const { CascadeAgent } = require('../dist/services/cascadeAgent');
    const testAgent = new CascadeAgent({
      id: 'test-agent',
      name: 'Test Agent',
      level: 1,
      specialization: 'Testing',
      capabilities: ['test'],
      tools: ['file_write', 'file_read'],
      validationThreshold: 0.7,
      maxRetries: 1
    });
    
    const writeResult = await adapter.executeTool(
      testAgent,
      'file_write',
      {
        filePath: path.join(testDir, 'test.txt'),
        content: 'Test content from cascade tools'
      }
    );
    
    if (writeResult.success) {
      console.log(chalk.green('  ✅ file_write executado'));
      
      // Verifica se arquivo foi criado
      const exists = await fs.access(path.join(testDir, 'test.txt'))
        .then(() => true)
        .catch(() => false);
      
      if (exists) {
        console.log(chalk.green('  ✅ Arquivo criado com sucesso'));
      } else {
        throw new Error('Arquivo não foi criado');
      }
    } else {
      throw new Error(`file_write falhou: ${writeResult.error}`);
    }
    
    // Teste 3: Executar file_read
    console.log(chalk.yellow('\n3️⃣ Testando file_read...'));
    
    const readResult = await adapter.executeTool(
      testAgent,
      'file_read',
      {
        filePath: path.join(testDir, 'test.txt')
      }
    );
    
    if (readResult.success) {
      console.log(chalk.green('  ✅ file_read executado'));
      
      if (readResult.data.content === 'Test content from cascade tools') {
        console.log(chalk.green('  ✅ Conteúdo correto'));
      } else {
        throw new Error('Conteúdo incorreto');
      }
    } else {
      throw new Error(`file_read falhou: ${readResult.error}`);
    }
    
    // Teste 4: Verificar permissões
    console.log(chalk.yellow('\n4️⃣ Verificando sistema de permissões...'));
    
    const permissions = adapter.getPermissionCache();
    console.log(chalk.green(`  ✅ Cache de permissões: ${permissions.size} entradas`));
    
    // Teste 5: Verificar log de execução
    console.log(chalk.yellow('\n5️⃣ Verificando log de execução...'));
    
    const log = adapter.getExecutionLog();
    if (log.length >= 2) {
      console.log(chalk.green(`  ✅ Log de execução: ${log.length} entradas`));
      log.forEach((entry, i) => {
        console.log(chalk.gray(`     ${i + 1}. ${entry.toolName} (${entry.agentId})`));
      });
    } else {
      throw new Error('Log de execução incompleto');
    }
    
    // Limpar arquivos de teste
    await fs.rm(testDir, { recursive: true, force: true });
    console.log(chalk.gray('\n  🧹 Arquivos de teste removidos'));
    
    console.log(chalk.green.bold('\n✅ TODOS OS TESTES DE FERRAMENTAS PASSARAM!\n'));
    return true;
    
  } catch (error) {
    console.log(chalk.red.bold('\n❌ TESTE FALHOU:'));
    console.log(chalk.red(error.message));
    throw error;
  }
}

// Executa o teste
testTools()
  .then(() => {
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });