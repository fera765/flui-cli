#!/usr/bin/env node

const chalk = require('chalk');

console.log(chalk.cyan.bold('\n🧪 TESTE SIMPLES - ARQUITETURA EM CASCATA\n'));

async function testSimpleCascade() {
  try {
    // Teste 1: Verificar se os módulos existem
    console.log(chalk.yellow('1️⃣ Verificando módulos...'));
    
    const modules = [
      '../dist/services/cascadeOrchestrator',
      '../dist/services/cascadeOrchestratorReal',
      '../dist/services/cascadeAgent',
      '../dist/services/cascadeAgentReal',
      '../dist/services/cascadeToolsAdapter'
    ];
    
    for (const module of modules) {
      try {
        require(module);
        console.log(chalk.green(`  ✅ ${module.split('/').pop()}`));
      } catch (e) {
        console.log(chalk.red(`  ❌ ${module.split('/').pop()}: ${e.message}`));
        throw e;
      }
    }
    
    // Teste 2: Criar instância do orquestrador
    console.log(chalk.yellow('\n2️⃣ Criando orquestrador...'));
    const { CascadeOrchestrator } = require('../dist/services/cascadeOrchestrator');
    const orchestrator = new CascadeOrchestrator();
    console.log(chalk.green('  ✅ Orquestrador criado'));
    
    // Teste 3: Verificar agentes
    console.log(chalk.yellow('\n3️⃣ Verificando agentes...'));
    const agents = orchestrator.getAgents();
    
    if (agents.size === 6) {
      console.log(chalk.green(`  ✅ 6 agentes criados`));
      
      for (let i = 1; i <= 6; i++) {
        const agent = agents.get(i);
        if (agent) {
          const config = agent.getConfig();
          console.log(chalk.gray(`     • Nível ${i}: ${config.name}`));
        }
      }
    } else {
      throw new Error(`Esperado 6 agentes, encontrado ${agents.size}`);
    }
    
    // Teste 4: Verificar configurações
    console.log(chalk.yellow('\n4️⃣ Verificando configurações...'));
    
    const agent1 = agents.get(1);
    const config1 = agent1.getConfig();
    
    if (config1.validationThreshold >= 0 && config1.validationThreshold <= 1) {
      console.log(chalk.green(`  ✅ Threshold válido: ${config1.validationThreshold}`));
    } else {
      throw new Error('Threshold de validação inválido');
    }
    
    if (config1.maxRetries > 0) {
      console.log(chalk.green(`  ✅ Max retries válido: ${config1.maxRetries}`));
    } else {
      throw new Error('Max retries inválido');
    }
    
    if (Array.isArray(config1.tools) && config1.tools.length > 0) {
      console.log(chalk.green(`  ✅ Ferramentas configuradas: ${config1.tools.length}`));
    } else {
      throw new Error('Ferramentas não configuradas');
    }
    
    // Teste 5: Criar instância do orquestrador real
    console.log(chalk.yellow('\n5️⃣ Testando orquestrador real...'));
    const { CascadeOrchestratorReal } = require('../dist/services/cascadeOrchestratorReal');
    const realOrchestrator = new CascadeOrchestratorReal();
    console.log(chalk.green('  ✅ Orquestrador real criado'));
    
    const realAgents = realOrchestrator.getAgents();
    if (realAgents.size === 6) {
      console.log(chalk.green(`  ✅ 6 agentes reais criados`));
    } else {
      throw new Error(`Esperado 6 agentes reais, encontrado ${realAgents.size}`);
    }
    
    console.log(chalk.green.bold('\n✅ TODOS OS TESTES SIMPLES PASSARAM!\n'));
    return true;
    
  } catch (error) {
    console.log(chalk.red.bold('\n❌ TESTE FALHOU:'));
    console.log(chalk.red(error.message));
    throw error;
  }
}

// Executa o teste
testSimpleCascade()
  .then(() => {
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });