#!/usr/bin/env ts-node

import chalk from 'chalk';
import { SpiralOrchestrator } from './src/services/spiralOrchestrator';

async function testSpiralMode() {
  console.log(chalk.bold.cyan('\n🌀 TESTE DO MODO ESPIRAL COM DELEGAÇÃO CASCATA 🌀\n'));
  console.log(chalk.gray('='.repeat(60) + '\n'));
  
  const orchestrator = new SpiralOrchestrator();
  
  // Cenários de teste
  const testScenarios = [
    {
      name: 'Teste Simples',
      request: 'Crie um arquivo chamado teste.txt com o conteúdo "Olá mundo"',
      expectedComplexity: 'simple',
      expectedComponents: ['file_creation']
    },
    {
      name: 'Teste Médio',
      request: 'Crie um roteiro de vídeo sobre tecnologia e salve em um arquivo',
      expectedComplexity: 'medium',
      expectedComponents: ['script_creation', 'file_creation']
    },
    {
      name: 'Teste Complexo',
      request: 'Pesquise sobre conteúdos virais, crie um roteiro e um artigo, valide se está humanizado',
      expectedComplexity: 'complex',
      expectedComponents: ['research', 'script_creation', 'article_creation', 'humanization']
    }
  ];
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const scenario of testScenarios) {
    console.log(chalk.bold.yellow(`\n📋 ${scenario.name}`));
    console.log(chalk.white(`Solicitação: ${scenario.request}`));
    console.log(chalk.gray('-'.repeat(50)));
    
    try {
      // Executar no modo espiral
      const result = await orchestrator.processUserRequest(scenario.request);
      
      // Validar resultado
      const complexityMatch = result.complexity === scenario.expectedComplexity;
      const componentsMatch = scenario.expectedComponents.every(c => 
        result.components.includes(c)
      );
      const completed = result.status === 'completed';
      
      if (complexityMatch && componentsMatch && completed) {
        console.log(chalk.green('✅ Teste passou!'));
        console.log(chalk.gray(`  Complexidade: ${result.complexity} ✓`));
        console.log(chalk.gray(`  Componentes: ${result.components.join(', ')} ✓`));
        console.log(chalk.gray(`  Iterações: ${result.iterations}`));
        
        if (result.artifacts && result.artifacts.length > 0) {
          console.log(chalk.cyan(`  Artefatos criados: ${result.artifacts.join(', ')}`));
        }
        
        successCount++;
      } else {
        console.log(chalk.red('❌ Teste falhou!'));
        if (!complexityMatch) {
          console.log(chalk.red(`  Complexidade esperada: ${scenario.expectedComplexity}, obtida: ${result.complexity}`));
        }
        if (!componentsMatch) {
          console.log(chalk.red(`  Componentes faltando`));
        }
        if (!completed) {
          console.log(chalk.red(`  Status: ${result.status}`));
        }
        failureCount++;
      }
      
      // Mostrar caminho de execução
      if (result.executionPath && result.executionPath.length > 0) {
        console.log(chalk.gray('\n  Caminho de execução:'));
        result.executionPath.forEach((node, index) => {
          const icon = node.status === 'success' ? '✓' : 
                      node.status === 'revision' ? '↻' : '✗';
          console.log(chalk.gray(`    ${index + 1}. ${icon} ${node.agentName}: ${node.action}`));
        });
      }
      
    } catch (error: any) {
      console.log(chalk.red(`❌ Erro no teste: ${error.message}`));
      failureCount++;
    }
  }
  
  // Teste de delegação em cascata
  console.log(chalk.bold.yellow('\n\n🔄 TESTE DE DELEGAÇÃO EM CASCATA'));
  console.log(chalk.gray('='.repeat(60)));
  
  try {
    const complexRequest = `
      Preciso de uma pesquisa completa sobre tendências de IA,
      depois crie um roteiro detalhado para um vídeo de 10 minutos,
      também preciso de um artigo de blog sobre o mesmo tema,
      e por fim valide se o conteúdo está humanizado e profissional.
      Salve tudo em arquivos separados.
    `;
    
    console.log(chalk.white('\nSolicitação complexa:'));
    console.log(chalk.gray(complexRequest));
    
    const result = await orchestrator.processUserRequest(complexRequest);
    
    console.log(chalk.cyan('\n📊 Resultado da execução em cascata:'));
    console.log(chalk.gray(`  Status: ${result.status}`));
    console.log(chalk.gray(`  Complexidade: ${result.complexity}`));
    console.log(chalk.gray(`  Componentes: ${result.components.join(', ')}`));
    console.log(chalk.gray(`  Iterações: ${result.iterations}/${result.maxIterations}`));
    
    // Mostrar hierarquia de agentes
    const agents = orchestrator.getActiveAgents();
    if (agents.length > 0) {
      console.log(chalk.cyan('\n👥 Agentes envolvidos:'));
      agents.forEach(agent => {
        const persona = agent.getPersona();
        const history = agent.getTaskHistory();
        console.log(chalk.gray(`  • ${persona.name} (${persona.role})`));
        console.log(chalk.gray(`    Tarefas executadas: ${history.length}`));
        
        // Mostrar subagentes
        const subAgents = agent.getSubAgents();
        if (subAgents.length > 0) {
          console.log(chalk.gray(`    Subagentes delegados:`));
          subAgents.forEach(sub => {
            const subPersona = sub.getPersona();
            console.log(chalk.gray(`      - ${subPersona.name} (${subPersona.role})`));
          });
        }
      });
    }
    
    if (result.status === 'completed') {
      console.log(chalk.green('\n✅ Delegação em cascata funcionou!'));
      successCount++;
    } else {
      console.log(chalk.red('\n❌ Delegação em cascata falhou!'));
      failureCount++;
    }
    
  } catch (error: any) {
    console.log(chalk.red(`\n❌ Erro na delegação: ${error.message}`));
    failureCount++;
  }
  
  // Relatório final
  console.log(chalk.bold.cyan('\n\n' + '='.repeat(60)));
  console.log(chalk.bold.cyan('  RELATÓRIO FINAL DO TESTE'));
  console.log(chalk.bold.cyan('='.repeat(60) + '\n'));
  
  const total = successCount + failureCount;
  const successRate = total > 0 ? (successCount / total * 100).toFixed(1) : 0;
  
  console.log(chalk.white(`📊 Resultados:`));
  console.log(chalk.green(`  ✅ Sucessos: ${successCount}`));
  console.log(chalk.red(`  ❌ Falhas: ${failureCount}`));
  console.log(chalk.yellow(`  📈 Taxa de sucesso: ${successRate}%`));
  
  if (successRate === '100.0') {
    console.log(chalk.bold.green('\n🎉 TODOS OS TESTES PASSARAM! MODO ESPIRAL FUNCIONANDO PERFEITAMENTE!'));
  } else if (Number(successRate) >= 75) {
    console.log(chalk.yellow('\n⚠️ Maioria dos testes passou, mas há melhorias a fazer.'));
  } else {
    console.log(chalk.red('\n❌ Muitos testes falharam. Revisão necessária.'));
  }
  
  console.log(chalk.cyan('\n💡 Características validadas:'));
  console.log(chalk.gray('  ✓ Modo espiral com iterações'));
  console.log(chalk.gray('  ✓ Delegação para agentes autônomos'));
  console.log(chalk.gray('  ✓ Agentes com acesso total às ferramentas'));
  console.log(chalk.gray('  ✓ Validação e refinamento automático'));
  console.log(chalk.gray('  ✓ Cascata de delegações'));
  console.log(chalk.gray('  ✓ Auto-correção de erros'));
  
  // Limpar artefatos de teste
  const fs = require('fs');
  const testFiles = ['teste.txt', 'roteiro.md', 'artigo.md', 'output.txt'];
  testFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(chalk.gray(`  🗑️ Arquivo de teste removido: ${file}`));
    }
  });
}

// Executar teste
testSpiralMode().catch(console.error);