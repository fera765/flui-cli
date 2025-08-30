#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Teste Direto do Flui - Diagnóstico');

// Função para executar comando no Flui
function testFluiDirect() {
  return new Promise((resolve, reject) => {
    console.log('📋 Iniciando Flui...');
    
    const fluiProcess = spawn('npm', ['run', 'flui'], {
      cwd: '/workspace',
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let outputBuffer = '';
    let errorBuffer = '';
    let commandSent = false;

    fluiProcess.stdout.on('data', (data) => {
      const output = data.toString();
      outputBuffer += output;
      console.log('STDOUT:', output);
      
      // Quando Flui estiver pronto, enviar comando
      if (!commandSent && (output.includes('Digite') || output.includes('FLUI') || output.includes('>'))) {
        commandSent = true;
        console.log('✅ Flui pronto! Enviando comando de teste...');
        
        // Comando simples de teste
        const testCommand = 'Crie um arquivo chamado teste-ebook.md com o título "# Teste de Criação de Arquivo" e um parágrafo sobre monetização no YouTube.\n';
        fluiProcess.stdin.write(testCommand);
        
        // Aguarda resposta
        setTimeout(() => {
          console.log('\n📊 Análise do Output:');
          console.log('Output total recebido:', outputBuffer.length, 'caracteres');
          
          // Verifica se arquivo foi criado
          const files = fs.readdirSync('/workspace').filter(f => 
            f.includes('teste') || f.includes('ebook') || f.endsWith('.md')
          );
          
          console.log('Arquivos encontrados:', files);
          
          // Encerra o processo
          fluiProcess.kill();
          resolve({
            success: files.length > 1, // Mais de 1 porque README.md já existe
            files: files,
            output: outputBuffer
          });
        }, 15000); // Aguarda 15 segundos
      }
    });

    fluiProcess.stderr.on('data', (data) => {
      errorBuffer += data.toString();
      console.error('STDERR:', data.toString());
    });

    fluiProcess.on('error', (error) => {
      console.error('❌ Erro ao executar Flui:', error);
      reject(error);
    });

    // Timeout de 30 segundos
    setTimeout(() => {
      fluiProcess.kill();
      reject(new Error('Timeout - Flui não respondeu'));
    }, 30000);
  });
}

// Executar teste
testFluiDirect()
  .then(result => {
    console.log('\n✅ Teste concluído!');
    console.log('Resultado:', result.success ? 'SUCESSO' : 'FALHA');
    console.log('Arquivos criados:', result.files);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Teste falhou:', error.message);
    process.exit(1);
  });