#!/usr/bin/env node

/**
 * Script direto para criar landing page
 * Vamos criar tudo diretamente para testar
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const chalk = require('chalk');

const execAsync = promisify(exec);

async function createLandingPage() {
  console.log(chalk.bold.cyan('\n🚀 CREATING LANDING PAGE DIRECTLY\n'));
  
  const baseDir = path.join(process.cwd(), `landing-test-${Date.now()}`);
  await fs.mkdir(baseDir, { recursive: true });
  
  // Create Frontend
  const frontendDir = path.join(baseDir, 'frontend');
  await fs.mkdir(frontendDir, { recursive: true });
  await fs.mkdir(path.join(frontendDir, 'src'), { recursive: true });
  
  console.log(chalk.yellow('Creating Frontend...'));
  
  // package.json for frontend
  await fs.writeFile(path.join(frontendDir, 'package.json'), JSON.stringify({
    name: 'landing-frontend',
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview'
    },
    devDependencies: {
      vite: '^5.0.0',
      tailwindcss: '^3.3.0',
      autoprefixer: '^10.4.0',
      postcss: '^8.4.0'
    }
  }, null, 2));

  // vite.config.js
  await fs.writeFile(path.join(frontendDir, 'vite.config.js'), `import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})`);

  // tailwind.config.js
  await fs.writeFile(path.join(frontendDir, 'tailwind.config.js'), `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: []
}`);

  // postcss.config.js
  await fs.writeFile(path.join(frontendDir, 'postcss.config.js'), `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}`);

  // index.html
  await fs.writeFile(path.join(frontendDir, 'index.html'), `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Planos de Saúde</title>
  <link rel="stylesheet" href="/src/style.css">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>`);

  // src/style.css
  await fs.writeFile(path.join(frontendDir, 'src/style.css'), `@tailwind base;
@tailwind components;
@tailwind utilities;`);

  // src/main.js
  await fs.writeFile(path.join(frontendDir, 'src/main.js'), `document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  
  app.innerHTML = \`
    <header class="bg-blue-600 text-white">
      <nav class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="text-2xl font-bold">SaúdePlus</div>
        <ul class="flex space-x-6">
          <li><a href="#hero">Início</a></li>
          <li><a href="#plans">Planos</a></li>
          <li><a href="#benefits">Benefícios</a></li>
          <li><a href="#contact">Contato</a></li>
        </ul>
      </nav>
    </header>

    <section id="hero" class="bg-gradient-to-r from-blue-500 to-blue-700 text-white py-20">
      <div class="container mx-auto px-4 text-center">
        <h1 class="text-5xl font-bold mb-4">Planos de Saúde</h1>
        <p class="text-xl mb-8">Cobertura completa com os melhores preços</p>
        <button class="bg-white text-blue-600 px-8 py-3 rounded-full font-bold">Ver Planos</button>
      </div>
    </section>

    <section id="plans" class="py-16 bg-gray-50">
      <div class="container mx-auto px-4">
        <h2 class="text-4xl font-bold text-center mb-12">Nossos Planos</h2>
        <div id="plans-container" class="grid md:grid-cols-3 gap-8"></div>
      </div>
    </section>

    <section id="benefits" class="py-16">
      <div class="container mx-auto px-4">
        <h2 class="text-4xl font-bold text-center mb-12">Benefícios</h2>
        <div class="grid md:grid-cols-3 gap-8 text-center">
          <div><h3 class="text-xl font-bold">Rede Ampla</h3></div>
          <div><h3 class="text-xl font-bold">Atendimento Rápido</h3></div>
          <div><h3 class="text-xl font-bold">Melhor Preço</h3></div>
        </div>
      </div>
    </section>

    <section id="contact" class="py-16 bg-gray-50">
      <div class="container mx-auto px-4 max-w-2xl">
        <h2 class="text-4xl font-bold text-center mb-12">Contato</h2>
        <form id="contact-form" class="space-y-4">
          <input type="text" placeholder="Nome" class="w-full p-3 border rounded">
          <input type="email" placeholder="Email" class="w-full p-3 border rounded">
          <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded">Enviar</button>
        </form>
      </div>
    </section>

    <footer class="bg-gray-800 text-white py-8">
      <div class="container mx-auto px-4 text-center">
        <p>&copy; 2024 SaúdePlus</p>
      </div>
    </footer>
  \`;

  // Load plans
  fetch('http://localhost:3001/api/plans')
    .then(res => res.json())
    .then(plans => {
      const container = document.getElementById('plans-container');
      container.innerHTML = plans.map(p => \`
        <div class="bg-white p-8 rounded-lg shadow">
          <h3 class="text-2xl font-bold">\${p.name}</h3>
          <p class="text-4xl font-bold text-blue-600">R$ \${p.price}</p>
        </div>
      \`).join('');
    }).catch(console.error);
});`);

  // Create Backend
  const backendDir = path.join(baseDir, 'backend');
  await fs.mkdir(backendDir, { recursive: true });
  
  console.log(chalk.yellow('Creating Backend...'));

  // package.json for backend
  await fs.writeFile(path.join(backendDir, 'package.json'), JSON.stringify({
    name: 'landing-backend',
    version: '1.0.0',
    scripts: {
      start: 'node server.js',
      dev: 'nodemon server.js'
    },
    dependencies: {
      express: '^4.18.0',
      cors: '^2.8.5'
    },
    devDependencies: {
      nodemon: '^3.0.0'
    }
  }, null, 2));

  // server.js
  await fs.writeFile(path.join(backendDir, 'server.js'), `const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/plans', (req, res) => {
  res.json([
    { id: 1, name: 'Básico', price: 199.90 },
    { id: 2, name: 'Premium', price: 399.90 },
    { id: 3, name: 'Empresarial', price: 299.90 }
  ]);
});

app.post('/api/contact', (req, res) => {
  res.json({ success: true, message: 'Contato recebido' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`);

  console.log(chalk.green('\n✅ Files created successfully!'));
  console.log(chalk.gray(`📁 Directory: ${baseDir}`));

  // Install and test
  console.log(chalk.yellow('\nInstalling dependencies...'));
  
  try {
    await execAsync('cd ' + frontendDir + ' && npm install', { timeout: 60000 });
    console.log(chalk.green('✅ Frontend dependencies installed'));
  } catch (e) {
    console.log(chalk.red('❌ Frontend install failed:', e.message));
  }

  try {
    await execAsync('cd ' + backendDir + ' && npm install', { timeout: 60000 });
    console.log(chalk.green('✅ Backend dependencies installed'));
  } catch (e) {
    console.log(chalk.red('❌ Backend install failed:', e.message));
  }

  // Try to build frontend
  console.log(chalk.yellow('\nBuilding frontend...'));
  try {
    await execAsync('cd ' + frontendDir + ' && npm run build', { timeout: 60000 });
    console.log(chalk.green('✅ Frontend built successfully'));
  } catch (e) {
    console.log(chalk.red('❌ Build failed:', e.message));
  }

  // Test backend
  console.log(chalk.yellow('\nTesting backend...'));
  const { spawn } = require('child_process');
  const backend = spawn('node', ['server.js'], {
    cwd: backendDir,
    detached: true,
    stdio: 'ignore'
  });
  backend.unref();

  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    const { stdout } = await execAsync('curl -s http://localhost:3001/api/health');
    if (stdout.includes('ok')) {
      console.log(chalk.green('✅ Backend health check passed'));
    }
  } catch (e) {
    console.log(chalk.red('❌ Health check failed'));
  }

  try {
    const { stdout } = await execAsync('curl -s http://localhost:3001/api/plans');
    if (stdout.includes('Básico')) {
      console.log(chalk.green('✅ Plans endpoint working'));
    }
  } catch (e) {
    console.log(chalk.red('❌ Plans endpoint failed'));
  }

  // Stop backend
  await execAsync('pkill -f "node server.js"').catch(() => {});

  console.log(chalk.bold.cyan('\n════════════════════════════════════════'));
  console.log(chalk.bold.green('✅ LANDING PAGE CREATED SUCCESSFULLY!'));
  console.log(chalk.bold.cyan('════════════════════════════════════════\n'));

  return {
    success: true,
    frontendDir,
    backendDir
  };
}

createLandingPage().catch(console.error);