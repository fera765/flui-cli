#!/usr/bin/env node

const chalk = require('chalk');

console.log(chalk.cyan.bold('\n🧪 TESTE SIMPLES - SISTEMA DE VALIDAÇÃO\n'));

async function testValidation() {
  try {
    // Teste 1: Criar agente e testar validação
    console.log(chalk.yellow('1️⃣ Testando sistema de validação...'));
    
    const { CascadeAgent } = require('../dist/services/cascadeAgent');
    
    const agent = new CascadeAgent({
      id: 'validation-test',
      name: 'Validation Test Agent',
      level: 1,
      specialization: 'Testing validation',
      capabilities: ['validate'],
      tools: [],
      validationThreshold: 0.75,
      maxRetries: 2
    });
    
    console.log(chalk.green('  ✅ Agente de teste criado'));
    
    // Teste 2: Executar com input simples
    console.log(chalk.yellow('\n2️⃣ Executando processamento...'));
    
    const input = {
      test: true,
      data: 'Test data for validation'
    };
    
    const execution = await agent.execute(input);
    
    if (execution.agentId === 'validation-test') {
      console.log(chalk.green('  ✅ Execução completada'));
    } else {
      throw new Error('ID do agente incorreto');
    }
    
    // Teste 3: Verificar resultado da validação
    console.log(chalk.yellow('\n3️⃣ Verificando validação...'));
    
    const validation = execution.validationResult;
    
    if (typeof validation.confidence === 'number' && 
        validation.confidence >= 0 && 
        validation.confidence <= 1) {
      console.log(chalk.green(`  ✅ Confiança válida: ${(validation.confidence * 100).toFixed(1)}%`));
    } else {
      throw new Error('Confiança inválida');
    }
    
    if (typeof validation.approved === 'boolean') {
      console.log(chalk.green(`  ✅ Status de aprovação: ${validation.approved ? 'Aprovado' : 'Não aprovado'}`));
    } else {
      throw new Error('Status de aprovação inválido');
    }
    
    if (validation.feedback) {
      console.log(chalk.green(`  ✅ Feedback presente: "${validation.feedback.substring(0, 50)}..."`));
    }
    
    // Teste 4: Verificar metadados da execução
    console.log(chalk.yellow('\n4️⃣ Verificando metadados...'));
    
    if (execution.timestamp instanceof Date) {
      console.log(chalk.green(`  ✅ Timestamp válido: ${execution.timestamp.toISOString()}`));
    } else {
      throw new Error('Timestamp inválido');
    }
    
    if (typeof execution.executionTime === 'number' && execution.executionTime > 0) {
      console.log(chalk.green(`  ✅ Tempo de execução: ${execution.executionTime}ms`));
    } else {
      throw new Error('Tempo de execução inválido');
    }
    
    if (typeof execution.retryCount === 'number' && execution.retryCount >= 0) {
      console.log(chalk.green(`  ✅ Contador de retry: ${execution.retryCount}`));
    } else {
      throw new Error('Contador de retry inválido');
    }
    
    // Teste 5: Verificar histórico
    console.log(chalk.yellow('\n5️⃣ Verificando histórico...'));
    
    const history = agent.getExecutionHistory();
    
    if (Array.isArray(history) && history.length > 0) {
      console.log(chalk.green(`  ✅ Histórico presente: ${history.length} execuções`));
    } else {
      throw new Error('Histórico vazio');
    }
    
    const lastExecution = agent.getLastExecution();
    if (lastExecution && lastExecution.agentId === 'validation-test') {
      console.log(chalk.green('  ✅ Última execução acessível'));
    } else {
      throw new Error('Última execução não acessível');
    }
    
    console.log(chalk.green.bold('\n✅ TODOS OS TESTES DE VALIDAÇÃO PASSARAM!\n'));
    return true;
    
  } catch (error) {
    console.log(chalk.red.bold('\n❌ TESTE FALHOU:'));
    console.log(chalk.red(error.message));
    throw error;
  }
}

// Executa o teste
testValidation()
  .then(() => {
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });