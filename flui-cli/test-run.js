const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testando Flui CLI...\n');

const cli = spawn('node', [path.join(__dirname, 'dist', 'index.js')], {
  env: { ...process.env, TERM: 'xterm-256color' }
});

let output = '';
let hasError = false;

cli.stdout.on('data', (data) => {
  output += data.toString();
  process.stdout.write(data);
  
  // Check for successful start
  if (output.includes('Flui CLI') && output.includes('💬 >')) {
    console.log('\n✅ CLI iniciou com sucesso!');
    
    // Send exit command
    setTimeout(() => {
      cli.stdin.write('/exit\n');
    }, 500);
  }
  
  if (output.includes('Encerrando')) {
    console.log('✅ Comando /exit funcionou!');
    setTimeout(() => {
      process.exit(0);
    }, 100);
  }
});

cli.stderr.on('data', (data) => {
  console.error('\n❌ Erro:', data.toString());
  hasError = true;
});

cli.on('error', (error) => {
  console.error('\n❌ Erro ao executar:', error);
  process.exit(1);
});

setTimeout(() => {
  if (!hasError && output.includes('Flui CLI')) {
    console.log('\n✅ Teste concluído com sucesso!');
  } else {
    console.log('\n⚠️ Timeout - verifique se há problemas');
  }
  cli.kill();
  process.exit(hasError ? 1 : 0);
}, 5000);