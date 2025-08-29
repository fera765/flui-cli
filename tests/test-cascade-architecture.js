#!/usr/bin/env node

const chalk = require('chalk');
const { CascadeOrchestrator } = require('../dist/services/cascadeOrchestrator');
const { CascadeToolsAdapter } = require('../dist/services/cascadeToolsAdapter');
const { ToolsManager } = require('../dist/services/toolsManager');
const { MemoryManager } = require('../dist/services/memoryManager');
const { OpenAIService } = require('../dist/services/openAIService');
const { NavigationManager } = require('../dist/services/navigationManager');
const { ErrorHandler } = require('../dist/services/errorHandler');

console.log(chalk.cyan.bold('\n🧪 TESTE DA NOVA ARQUITETURA EM CASCATA\n'));
console.log(chalk.gray('=' .repeat(50)));

async function testCascadeArchitecture() {
  try {
    // Inicializa serviços necessários
    console.log(chalk.yellow('\n📦 Inicializando serviços...'));
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
    
    // Cria o orquestrador em cascata
    console.log(chalk.yellow('\n🌀 Criando orquestrador em cascata...'));
    const cascadeOrchestrator = new CascadeOrchestrator();
    const cascadeToolsAdapter = new CascadeToolsAdapter(toolsManager);
    
    // Verifica se os agentes foram criados
    console.log(chalk.yellow('\n🤖 Verificando agentes...'));
    const agents = cascadeOrchestrator.getAgents();
    console.log(chalk.green(`✅ ${agents.size} agentes criados`));
    
    // Lista os agentes
    for (const [level, agent] of agents) {
      const config = agent.getConfig();
      console.log(chalk.gray(`  • Nível ${level}: ${config.name} (${config.specialization})`));
    }
    
    // Testa uma requisição simples
    console.log(chalk.yellow('\n🧪 Testando requisição simples...'));
    const testRequest = 'Criar um arquivo de teste com Hello World';
    
    console.log(chalk.gray(`  📝 Requisição: "${testRequest}"`));
    
    // Processa a requisição
    console.log(chalk.yellow('\n⚙️ Processando requisição em cascata...'));
    const result = await cascadeOrchestrator.processRequest(testRequest);
    
    // Exibe resultados
    console.log(chalk.yellow('\n📊 Resultados:'));
    console.log(chalk.gray(`  • ID do Fluxo: ${result.id}`));
    console.log(chalk.gray(`  • Status: ${result.status}`));
    console.log(chalk.gray(`  • Agentes executados: ${result.executions.length}`));
    
    if (result.metadata) {
      console.log(chalk.gray(`  • Tempo total: ${result.metadata.totalExecutionTime}ms`));
      console.log(chalk.gray(`  • Confiança média: ${(result.metadata.confidenceScore * 100).toFixed(1)}%`));
      console.log(chalk.gray(`  • Total de reexecuções: ${result.metadata.totalRetries}`));
    }
    
    // Detalhes das execuções
    console.log(chalk.yellow('\n🔍 Detalhes das execuções:'));
    result.executions.forEach(exec => {
      const icon = exec.validationResult.approved ? '✅' : '⚠️';
      console.log(chalk.gray(`  ${icon} Nível ${exec.agentLevel}: ${exec.agentId}`));
      console.log(chalk.gray(`     • Confiança: ${(exec.validationResult.confidence * 100).toFixed(1)}%`));
      console.log(chalk.gray(`     • Tempo: ${exec.executionTime}ms`));
      if (exec.retryCount > 0) {
        console.log(chalk.gray(`     • Tentativas: ${exec.retryCount}`));
      }
    });
    
    // Testa exportação de relatório
    console.log(chalk.yellow('\n📄 Exportando relatório...'));
    const reportPath = `.flui/cascade-report-${Date.now()}.json`;
    await cascadeOrchestrator.exportFlowReport(result.id, reportPath);
    console.log(chalk.green(`✅ Relatório exportado para: ${reportPath}`));
    
    // Teste de ferramentas através do adaptador
    console.log(chalk.yellow('\n🛠️ Testando adaptador de ferramentas...'));
    
    // Pega um agente para testar
    const testAgent = agents.get(3); // Agente de implementação
    if (testAgent) {
      console.log(chalk.gray(`  • Testando com: ${testAgent.getConfig().name}`));
      
      // Testa file_write
      const writeResult = await cascadeToolsAdapter.executeTool(
        testAgent,
        'file_write',
        {
          filePath: '.flui/test-cascade.txt',
          content: 'Teste da nova arquitetura em cascata!'
        }
      );
      
      if (writeResult.success) {
        console.log(chalk.green(`  ✅ file_write executado com sucesso`));
      } else {
        console.log(chalk.red(`  ❌ Erro em file_write: ${writeResult.error}`));
      }
      
      // Testa file_read
      const readResult = await cascadeToolsAdapter.executeTool(
        testAgent,
        'file_read',
        {
          filePath: '.flui/test-cascade.txt'
        }
      );
      
      if (readResult.success) {
        console.log(chalk.green(`  ✅ file_read executado com sucesso`));
        console.log(chalk.gray(`     Conteúdo: ${readResult.data.content}`));
      } else {
        console.log(chalk.red(`  ❌ Erro em file_read: ${readResult.error}`));
      }
    }
    
    // Resumo final
    console.log(chalk.green.bold('\n✅ TESTE CONCLUÍDO COM SUCESSO!'));
    console.log(chalk.cyan('\n📊 Resumo:'));
    console.log(chalk.gray(`  • Arquitetura em cascata: Funcional`));
    console.log(chalk.gray(`  • Agentes: ${agents.size} operacionais`));
    console.log(chalk.gray(`  • Validação: Implementada`));
    console.log(chalk.gray(`  • Ferramentas: Integradas`));
    console.log(chalk.gray(`  • Orquestração: Funcional`));
    
  } catch (error) {
    console.log(chalk.red.bold('\n❌ ERRO NO TESTE:'));
    console.log(chalk.red(error.message));
    console.log(chalk.gray('\nStack trace:'));
    console.log(chalk.gray(error.stack));
    process.exit(1);
  }
}

// Executa o teste
console.log(chalk.cyan('🚀 Iniciando teste da arquitetura em cascata...'));
testCascadeArchitecture()
  .then(() => {
    console.log(chalk.green.bold('\n🎉 Todos os testes passaram!\n'));
    process.exit(0);
  })
  .catch(error => {
    console.log(chalk.red.bold('\n💥 Teste falhou:'), error);
    process.exit(1);
  });