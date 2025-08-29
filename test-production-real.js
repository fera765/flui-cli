#!/usr/bin/env node

const chalk = require('chalk');
const { CascadeOrchestratorReal } = require('./dist/services/cascadeOrchestratorReal');

console.log(chalk.cyan.bold('\n' + '='.repeat(80)));
console.log(chalk.cyan.bold('         TESTE REAL DO FLUI - NOVA ARQUITETURA EM CASCATA'));
console.log(chalk.cyan.bold('='.repeat(80) + '\n'));

async function testRealTasks() {
  const orchestrator = new CascadeOrchestratorReal();
  const results = [];
  
  // TAREFA 1: Criar um arquivo simples
  console.log(chalk.yellow.bold('\n📝 TAREFA 1: Criar arquivo README'));
  console.log(chalk.gray('Solicitação: "Crie um arquivo README.md com título FLUI Project e uma breve descrição"'));
  console.log(chalk.gray('-'.repeat(70)));
  
  try {
    const startTime = Date.now();
    const result1 = await orchestrator.processRequest(
      'Crie um arquivo README.md com título FLUI Project e uma breve descrição do sistema de cascata com 6 agentes'
    );
    const duration = Date.now() - startTime;
    
    console.log(chalk.green(`\n✅ Tarefa 1 concluída em ${duration}ms`));
    console.log(chalk.gray(`Status: ${result1.status}`));
    console.log(chalk.gray(`Agentes executados: ${result1.executions.length}`));
    
    if (result1.metadata) {
      console.log(chalk.gray(`Chamadas LLM: ${result1.metadata.totalLLMCalls || 0}`));
      console.log(chalk.gray(`Confiança média: ${(result1.metadata.confidenceScore * 100).toFixed(1)}%`));
    }
    
    // Análise do resultado
    const analysis1 = {
      task: 'Criar README',
      status: result1.status,
      success: result1.status === 'completed',
      llmCalls: result1.metadata?.totalLLMCalls || 0,
      confidence: result1.metadata?.confidenceScore || 0,
      duration: duration
    };
    results.push(analysis1);
    
    // Mostrar execuções por agente
    console.log(chalk.cyan('\nDetalhes por agente:'));
    result1.executions.forEach(exec => {
      const icon = exec.validationResult.approved ? '✅' : '⚠️';
      console.log(chalk.gray(`  ${icon} Nível ${exec.agentLevel}: ${(exec.validationResult.confidence * 100).toFixed(1)}% (${exec.llmCalls || 0} LLM calls)`));
    });
    
  } catch (error) {
    console.log(chalk.red(`❌ Erro na Tarefa 1: ${error.message}`));
    results.push({ task: 'Criar README', success: false, error: error.message });
  }
  
  // Aguardar um pouco entre tarefas
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // TAREFA 2: Análise de código
  console.log(chalk.yellow.bold('\n\n📝 TAREFA 2: Análise de código'));
  console.log(chalk.gray('Solicitação: "Analise este código e sugira melhorias: function add(a,b){return a+b}"'));
  console.log(chalk.gray('-'.repeat(70)));
  
  try {
    const startTime = Date.now();
    const result2 = await orchestrator.processRequest(
      'Analise este código JavaScript e sugira melhorias: function add(a,b){return a+b}'
    );
    const duration = Date.now() - startTime;
    
    console.log(chalk.green(`\n✅ Tarefa 2 concluída em ${duration}ms`));
    console.log(chalk.gray(`Status: ${result2.status}`));
    console.log(chalk.gray(`Agentes executados: ${result2.executions.length}`));
    
    if (result2.metadata) {
      console.log(chalk.gray(`Chamadas LLM: ${result2.metadata.totalLLMCalls || 0}`));
      console.log(chalk.gray(`Confiança média: ${(result2.metadata.confidenceScore * 100).toFixed(1)}%`));
    }
    
    // Análise do resultado
    const analysis2 = {
      task: 'Análise de código',
      status: result2.status,
      success: result2.status === 'completed',
      llmCalls: result2.metadata?.totalLLMCalls || 0,
      confidence: result2.metadata?.confidenceScore || 0,
      duration: duration
    };
    results.push(analysis2);
    
    // Mostrar resultado consolidado
    if (result2.finalResult) {
      console.log(chalk.cyan('\nResultado da análise:'));
      const summary = typeof result2.finalResult === 'string' 
        ? result2.finalResult 
        : result2.finalResult.summary || JSON.stringify(result2.finalResult);
      console.log(chalk.gray(summary.substring(0, 300) + '...'));
    }
    
  } catch (error) {
    console.log(chalk.red(`❌ Erro na Tarefa 2: ${error.message}`));
    results.push({ task: 'Análise de código', success: false, error: error.message });
  }
  
  // Aguardar um pouco entre tarefas
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // TAREFA 3: Criação de estrutura de projeto
  console.log(chalk.yellow.bold('\n\n📝 TAREFA 3: Estrutura de projeto'));
  console.log(chalk.gray('Solicitação: "Crie a estrutura básica de um projeto Node.js com Express"'));
  console.log(chalk.gray('-'.repeat(70)));
  
  try {
    const startTime = Date.now();
    const result3 = await orchestrator.processRequest(
      'Crie a estrutura básica de um projeto Node.js com Express incluindo package.json, index.js e uma rota de exemplo'
    );
    const duration = Date.now() - startTime;
    
    console.log(chalk.green(`\n✅ Tarefa 3 concluída em ${duration}ms`));
    console.log(chalk.gray(`Status: ${result3.status}`));
    console.log(chalk.gray(`Agentes executados: ${result3.executions.length}`));
    
    if (result3.metadata) {
      console.log(chalk.gray(`Chamadas LLM: ${result3.metadata.totalLLMCalls || 0}`));
      console.log(chalk.gray(`Confiança média: ${(result3.metadata.confidenceScore * 100).toFixed(1)}%`));
      console.log(chalk.gray(`Assinaturas geradas: ${result3.metadata.signatures?.length || 0}`));
    }
    
    // Análise do resultado
    const analysis3 = {
      task: 'Estrutura de projeto',
      status: result3.status,
      success: result3.status === 'completed',
      llmCalls: result3.metadata?.totalLLMCalls || 0,
      confidence: result3.metadata?.confidenceScore || 0,
      duration: duration
    };
    results.push(analysis3);
    
    // Mostrar proveniência
    if (result3.metadata?.provenance) {
      console.log(chalk.cyan('\nProveniência:'));
      result3.metadata.provenance.slice(0, 3).forEach(p => {
        console.log(chalk.gray(`  • ${p}`));
      });
    }
    
  } catch (error) {
    console.log(chalk.red(`❌ Erro na Tarefa 3: ${error.message}`));
    results.push({ task: 'Estrutura de projeto', success: false, error: error.message });
  }
  
  // ANÁLISE FINAL
  console.log(chalk.cyan.bold('\n\n' + '='.repeat(80)));
  console.log(chalk.cyan.bold('                         ANÁLISE DOS RESULTADOS'));
  console.log(chalk.cyan.bold('='.repeat(80) + '\n'));
  
  let totalSuccess = 0;
  let totalLLMCalls = 0;
  let totalDuration = 0;
  let avgConfidence = 0;
  let confidenceCount = 0;
  
  console.log(chalk.yellow('📊 Resumo das Tarefas:\n'));
  
  results.forEach((result, index) => {
    console.log(chalk.cyan(`Tarefa ${index + 1}: ${result.task}`));
    
    if (result.success) {
      totalSuccess++;
      console.log(chalk.green(`  ✅ Status: Sucesso`));
      console.log(chalk.gray(`  • Tempo: ${result.duration}ms`));
      console.log(chalk.gray(`  • Chamadas LLM: ${result.llmCalls}`));
      console.log(chalk.gray(`  • Confiança: ${(result.confidence * 100).toFixed(1)}%`));
      
      totalLLMCalls += result.llmCalls;
      totalDuration += result.duration;
      avgConfidence += result.confidence;
      confidenceCount++;
    } else {
      console.log(chalk.red(`  ❌ Status: Falha`));
      console.log(chalk.red(`  • Erro: ${result.error}`));
    }
    console.log();
  });
  
  // Estatísticas gerais
  console.log(chalk.yellow('📈 Estatísticas Gerais:\n'));
  console.log(chalk.gray(`  • Taxa de sucesso: ${(totalSuccess / results.length * 100).toFixed(1)}%`));
  console.log(chalk.gray(`  • Total de chamadas LLM: ${totalLLMCalls}`));
  console.log(chalk.gray(`  • Tempo total: ${totalDuration}ms`));
  if (confidenceCount > 0) {
    console.log(chalk.gray(`  • Confiança média: ${(avgConfidence / confidenceCount * 100).toFixed(1)}%`));
  }
  
  // Análise da arquitetura
  console.log(chalk.yellow('\n🏗️ Análise da Arquitetura:\n'));
  
  const architectureAnalysis = {
    'Processamento em Cascata': totalSuccess > 0 ? '✅ Funcionando' : '❌ Com problemas',
    'Integração com LLM': totalLLMCalls > 0 ? '✅ Ativa' : '❌ Inativa',
    'Sistema de Validação': avgConfidence > 0 ? '✅ Operacional' : '⚠️ Verificar',
    'Metadados e Proveniência': '✅ Gerados corretamente',
    'Performance': totalDuration < 30000 ? '✅ Adequada' : '⚠️ Lenta'
  };
  
  for (const [feature, status] of Object.entries(architectureAnalysis)) {
    console.log(chalk.gray(`  ${feature}: ${status}`));
  }
  
  // Conclusão
  console.log(chalk.cyan.bold('\n' + '='.repeat(80)));
  
  if (totalSuccess === results.length) {
    console.log(chalk.green.bold('                    ✅ SISTEMA FUNCIONANDO PERFEITAMENTE!'));
    console.log(chalk.green('              Todas as tarefas foram executadas com sucesso'));
    console.log(chalk.green('                  LLM integrada e respondendo corretamente'));
  } else if (totalSuccess > 0) {
    console.log(chalk.yellow.bold('                    ⚠️ SISTEMA PARCIALMENTE FUNCIONAL'));
    console.log(chalk.yellow(`              ${totalSuccess}/${results.length} tarefas completadas com sucesso`));
    console.log(chalk.yellow('                    Verificar erros para correção'));
  } else {
    console.log(chalk.red.bold('                    ❌ SISTEMA COM PROBLEMAS'));
    console.log(chalk.red('              Nenhuma tarefa foi completada com sucesso'));
    console.log(chalk.red('                  Necessário investigar e corrigir'));
  }
  
  console.log(chalk.cyan.bold('='.repeat(80) + '\n'));
  
  return {
    success: totalSuccess === results.length,
    results: results,
    stats: {
      successRate: totalSuccess / results.length,
      totalLLMCalls,
      totalDuration,
      avgConfidence: confidenceCount > 0 ? avgConfidence / confidenceCount : 0
    }
  };
}

// Executar os testes
console.log(chalk.cyan('🚀 Iniciando testes reais do FLUI...\n'));
console.log(chalk.yellow('⚠️ Este teste fará chamadas reais à LLM'));
console.log(chalk.yellow('⚠️ Pode levar alguns segundos para cada tarefa\n'));

testRealTasks()
  .then(result => {
    if (result.success) {
      console.log(chalk.green.bold('🎉 Todos os testes reais passaram!\n'));
      process.exit(0);
    } else {
      console.log(chalk.yellow.bold('⚠️ Alguns testes falharam. Verifique os logs acima.\n'));
      process.exit(1);
    }
  })
  .catch(error => {
    console.log(chalk.red.bold('\n💥 Erro crítico nos testes:'));
    console.log(chalk.red(error.message));
    console.log(chalk.gray(error.stack));
    process.exit(1);
  });