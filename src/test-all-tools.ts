#!/usr/bin/env node

/**
 * Script de Teste Completo - Força uso de TODAS as tools
 * Este teste valida a integração completa do sistema de tools
 */

import { ApiService } from './services/apiService';
import { ModelManager } from './services/modelManager';
import { MemoryManager } from './services/memoryManager';
import { ToolsManager } from './services/toolsManager';
import { ChatUI } from './ui/chatUI';
import { ToolBox } from './ui/toolBox';
import chalk from 'chalk';

async function runCompleteTest() {
  console.log(chalk.cyan('\n' + '='.repeat(60)));
  console.log(chalk.cyan.bold('   🧪 TESTE COMPLETO DE INTEGRAÇÃO DAS TOOLS DO FLUI'));
  console.log(chalk.cyan('='.repeat(60) + '\n'));

  // Inicializa todos os componentes
  const memoryManager = new MemoryManager();
  const apiService = new ApiService();
  const modelManager = new ModelManager(apiService);
  const toolsManager = new ToolsManager(memoryManager, apiService);
  const chatUI = new ChatUI();
  const toolBox = new ToolBox(chatUI.getThemeManager());

  // Mock do ApiService para testes sem API real
  apiService.sendMessage = async (message: string) => {
    return `Mock response for: ${message}`;
  };

  let testsPassed = 0;
  let testsFailed = 0;

  console.log(chalk.yellow('📝 Iniciando bateria de testes...\n'));

  // TEST 1: Memory Manager
  console.log(chalk.blue('TEST 1: Sistema de Memória/Cérebro'));
  try {
    memoryManager.addToPrimary({
      id: 'test-1',
      timestamp: new Date(),
      type: 'user_message',
      content: 'Teste de memória primária'
    });
    
    memoryManager.createSecondaryContext('test_context', 'Dados de teste');
    const compressed = memoryManager.getCompressedContext('test_context');
    
    if (memoryManager.getPrimary('test-1') && compressed.data) {
      console.log(chalk.green('  ✅ Memória primária e secundária funcionando'));
      console.log(chalk.gray(`     Compressão: ${compressed.compressedSize}/${compressed.originalSize} bytes`));
      testsPassed++;
    } else {
      throw new Error('Falha no sistema de memória');
    }
  } catch (error) {
    console.log(chalk.red('  ❌ Falha no sistema de memória:', error));
    testsFailed++;
  }

  // TEST 2: Tool - Agent com Delegação
  console.log(chalk.blue('\nTEST 2: Tool Agent com Delegação'));
  try {
    const agentResult = await toolsManager.executeAgent([
      { role: 'system', content: 'You are a code reviewer' },
      { role: 'user', content: 'Review this TypeScript code: const x = 1;' }
    ]);
    
    if (agentResult.status === 'success') {
      console.log(chalk.green('  ✅ Agent executado com sucesso'));
      console.log(chalk.gray(`     Resposta: ${agentResult.output?.substring(0, 50)}...`));
      
      // Renderiza o tool box
      const display = toolBox.render(agentResult, 'success');
      console.log(chalk.dim('     Box:'), display.split('\n')[0]);
      testsPassed++;
    } else {
      throw new Error(agentResult.error);
    }
  } catch (error) {
    console.log(chalk.red('  ❌ Falha no Agent:', error));
    testsFailed++;
  }

  // TEST 3: Tool - Shell (comando seguro)
  console.log(chalk.blue('\nTEST 3: Tool Shell - Comando Seguro'));
  try {
    const shellResult = await toolsManager.executeShell('echo "Teste do Flui CLI"');
    
    if (shellResult.status === 'success') {
      console.log(chalk.green('  ✅ Shell executado com sucesso'));
      console.log(chalk.gray(`     Output: ${shellResult.output?.trim()}`));
      testsPassed++;
    } else {
      throw new Error(shellResult.error);
    }
  } catch (error) {
    console.log(chalk.red('  ❌ Falha no Shell:', error));
    testsFailed++;
  }

  // TEST 4: Tool - Shell (comando bloqueado)
  console.log(chalk.blue('\nTEST 4: Tool Shell - Bloqueio de Segurança'));
  try {
    const dangerousResult = await toolsManager.executeShell('sudo rm -rf /');
    
    if (dangerousResult.status === 'error' && dangerousResult.error?.includes('unsafe')) {
      console.log(chalk.green('  ✅ Comando perigoso bloqueado corretamente'));
      console.log(chalk.gray(`     Erro: ${dangerousResult.error}`));
      testsPassed++;
    } else {
      throw new Error('Comando perigoso não foi bloqueado!');
    }
  } catch (error) {
    console.log(chalk.red('  ❌ Falha na segurança:', error));
    testsFailed++;
  }

  // TEST 5: Tool - File Read
  console.log(chalk.blue('\nTEST 5: Tool File Read'));
  try {
    // Cria um arquivo temporário para teste
    await toolsManager.executeShell('echo "Conteúdo de teste" > test-file.txt');
    
    const fileResult = await toolsManager.fileRead('test-file.txt');
    
    if (fileResult.status === 'success') {
      console.log(chalk.green('  ✅ Arquivo lido com sucesso'));
      console.log(chalk.gray(`     Conteúdo: ${fileResult.output?.trim()}`));
      
      // Verifica se foi salvo na memória secundária
      const savedContent = memoryManager.getSecondaryContext('file:test-file.txt');
      if (savedContent) {
        console.log(chalk.gray('     ✓ Salvo na memória secundária'));
      }
      testsPassed++;
    } else {
      throw new Error(fileResult.error);
    }
  } catch (error) {
    console.log(chalk.red('  ❌ Falha na leitura de arquivo:', error));
    testsFailed++;
  }

  // TEST 6: Tool - File Replace
  console.log(chalk.blue('\nTEST 6: Tool File Replace'));
  try {
    const replaceResult = await toolsManager.fileReplace(
      'test-file.txt',
      'teste',
      'TESTE_MODIFICADO'
    );
    
    if (replaceResult.status === 'success') {
      console.log(chalk.green('  ✅ Arquivo modificado com sucesso'));
      
      // Verifica a modificação
      const verifyResult = await toolsManager.fileRead('test-file.txt');
      console.log(chalk.gray(`     Novo conteúdo: ${verifyResult.output?.trim()}`));
      testsPassed++;
    } else {
      throw new Error(replaceResult.error);
    }
  } catch (error) {
    console.log(chalk.red('  ❌ Falha na modificação de arquivo:', error));
    testsFailed++;
  }

  // TEST 7: Tool - Find Problem Solution
  console.log(chalk.blue('\nTEST 7: Tool Find Problem Solution'));
  try {
    const errorLog = `TypeError: Cannot read property 'x' of undefined
    at Object.<anonymous> (/app/index.js:10:15)
    at Module._compile (internal/modules/cjs/loader.js:1063:30)`;
    
    const solutionResult = await toolsManager.findProblemSolution(errorLog);
    
    if (solutionResult.status === 'success') {
      console.log(chalk.green('  ✅ Solução encontrada para o erro'));
      console.log(chalk.gray(`     Solução: ${solutionResult.output?.substring(0, 60)}...`));
      testsPassed++;
    } else {
      throw new Error(solutionResult.error);
    }
  } catch (error) {
    console.log(chalk.red('  ❌ Falha na análise de erro:', error));
    testsFailed++;
  }

  // TEST 8: Tool - Secondary Context Create
  console.log(chalk.blue('\nTEST 8: Tool Secondary Context - Criação'));
  try {
    const contextResult = await toolsManager.secondaryContext({
      name: 'project_info',
      content: 'Este é o contexto do projeto Flui CLI com tools avançadas'
    });
    
    if (contextResult.status === 'success') {
      console.log(chalk.green('  ✅ Contexto secundário criado'));
      testsPassed++;
    } else {
      throw new Error(contextResult.error);
    }
  } catch (error) {
    console.log(chalk.red('  ❌ Falha na criação de contexto:', error));
    testsFailed++;
  }

  // TEST 9: Tool - Secondary Context Read
  console.log(chalk.blue('\nTEST 9: Tool Secondary Context - Leitura'));
  try {
    const readResult = await toolsManager.secondaryContextRead('project_info');
    
    if (readResult.status === 'success' && Array.isArray(readResult.output)) {
      console.log(chalk.green('  ✅ Contexto lido em formato LLM'));
      console.log(chalk.gray(`     Formato: [{role: "${readResult.output[0].role}", content: "..."}]`));
      testsPassed++;
    } else {
      throw new Error(readResult.error || 'Formato inválido');
    }
  } catch (error) {
    console.log(chalk.red('  ❌ Falha na leitura de contexto:', error));
    testsFailed++;
  }

  // TEST 10: Tool Box Rendering
  console.log(chalk.blue('\nTEST 10: Tool Box - Renderização na Timeline'));
  try {
    // Simula diferentes estados
    const states: ('running' | 'success' | 'error')[] = ['running', 'success', 'error'];
    let allRendered = true;
    
    for (const status of states) {
      const mockResult = {
        toolName: 'shell',
        status: status as 'success' | 'error',
        output: 'Test output',
        displayLogs: '+50 lines\nLog line 1\nLog line 2',
        timestamp: new Date(),
        duration: 1234
      };
      
      const rendered = toolBox.render(mockResult, status);
      
      if (!rendered || !rendered.includes(
        status === 'running' ? '⠋' : 
        status === 'success' ? '✅' : '❌'
      )) {
        allRendered = false;
        break;
      }
    }
    
    if (allRendered) {
      console.log(chalk.green('  ✅ Tool boxes renderizando corretamente'));
      console.log(chalk.gray('     Estados: ⠋ Running | ✅ Success | ❌ Error'));
      testsPassed++;
    } else {
      throw new Error('Renderização incorreta');
    }
  } catch (error) {
    console.log(chalk.red('  ❌ Falha na renderização:', error));
    testsFailed++;
  }

  // TEST 11: Memory Statistics
  console.log(chalk.blue('\nTEST 11: Estatísticas de Memória'));
  try {
    const stats = memoryManager.getStatistics();
    
    console.log(chalk.green('  ✅ Estatísticas calculadas'));
    console.log(chalk.gray(`     Memória primária: ${stats.primaryCount} entradas (${stats.primarySize} bytes)`));
    console.log(chalk.gray(`     Memória secundária: ${stats.secondaryCount} contextos (${stats.secondarySize} bytes)`));
    console.log(chalk.gray(`     Total: ${stats.totalSize} bytes`));
    testsPassed++;
  } catch (error) {
    console.log(chalk.red('  ❌ Falha nas estatísticas:', error));
    testsFailed++;
  }

  // TEST 12: Tool Execution History
  console.log(chalk.blue('\nTEST 12: Histórico de Execução'));
  try {
    const history = toolsManager.getExecutionHistory();
    
    if (history.length > 0) {
      console.log(chalk.green('  ✅ Histórico mantido corretamente'));
      console.log(chalk.gray(`     Total de execuções: ${history.length}`));
      
      const toolCounts: Record<string, number> = {};
      history.forEach(h => {
        toolCounts[h.toolName] = (toolCounts[h.toolName] || 0) + 1;
      });
      
      Object.entries(toolCounts).forEach(([tool, count]) => {
        console.log(chalk.gray(`     - ${tool}: ${count} execuções`));
      });
      testsPassed++;
    } else {
      throw new Error('Histórico vazio');
    }
  } catch (error) {
    console.log(chalk.red('  ❌ Falha no histórico:', error));
    testsFailed++;
  }

  // Limpeza
  console.log(chalk.yellow('\n🧹 Limpando arquivos de teste...'));
  await toolsManager.executeShell('rm -f test-file.txt');

  // RESULTADO FINAL
  console.log(chalk.cyan('\n' + '='.repeat(60)));
  console.log(chalk.cyan.bold('   📊 RESULTADO FINAL DO TESTE'));
  console.log(chalk.cyan('='.repeat(60) + '\n'));

  const totalTests = testsPassed + testsFailed;
  const successRate = ((testsPassed / totalTests) * 100).toFixed(1);

  console.log(chalk.white(`  Total de testes: ${totalTests}`));
  console.log(chalk.green(`  ✅ Passou: ${testsPassed}`));
  console.log(chalk.red(`  ❌ Falhou: ${testsFailed}`));
  console.log(chalk.yellow(`  📈 Taxa de sucesso: ${successRate}%`));

  if (testsPassed === totalTests) {
    console.log(chalk.green.bold('\n  🎉 TODOS OS TESTES PASSARAM! O FLUI ESTÁ 100% INTEGRADO!'));
  } else if (testsPassed >= totalTests * 0.8) {
    console.log(chalk.yellow.bold('\n  ⚠️ MAIORIA DOS TESTES PASSOU! Integração parcialmente funcional.'));
  } else {
    console.log(chalk.red.bold('\n  ❌ MUITOS TESTES FALHARAM! Revisar integração.'));
  }

  console.log(chalk.cyan('\n' + '='.repeat(60) + '\n'));

  return {
    total: totalTests,
    passed: testsPassed,
    failed: testsFailed,
    successRate: parseFloat(successRate)
  };
}

// Executa o teste
if (require.main === module) {
  runCompleteTest()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error(chalk.red('Erro fatal no teste:'), error);
      process.exit(1);
    });
}

export { runCompleteTest };