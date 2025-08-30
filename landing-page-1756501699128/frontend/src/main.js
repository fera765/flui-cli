// Landing Page - Planos de Saúde
document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <!-- Header -->
    <header class="bg-blue-600 text-white">
      <nav class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="text-2xl font-bold">SaúdePlus</div>
        <ul class="flex space-x-6">
          <li><a href="#hero" class="hover:text-blue-200">Início</a></li>
          <li><a href="#plans" class="hover:text-blue-200">Planos</a></li>
          <li><a href="#benefits" class="hover:text-blue-200">Benefícios</a></li>
          <li><a href="#contact" class="hover:text-blue-200">Contato</a></li>
        </ul>
      </nav>
    </header>

    <!-- Hero Section -->
    <section id="hero" class="bg-gradient-to-r from-blue-500 to-blue-700 text-white py-20">
      <div class="container mx-auto px-4 text-center">
        <h1 class="text-5xl font-bold mb-4">Cuide da Sua Saúde com os Melhores Planos</h1>
        <p class="text-xl mb-8">Cobertura completa, preços acessíveis e atendimento de qualidade</p>
        <button onclick="scrollToPlans()" class="bg-white text-blue-600 px-8 py-3 rounded-full font-bold hover:bg-blue-50 transition">
          Ver Planos
        </button>
      </div>
    </section>

    <!-- Plans Section -->
    <section id="plans" class="py-16 bg-gray-50">
      <div class="container mx-auto px-4">
        <h2 class="text-4xl font-bold text-center mb-12">Nossos Planos</h2>
        <div id="plans-container" class="grid md:grid-cols-3 gap-8">
          <!-- Plans will be loaded here -->
        </div>
      </div>
    </section>

    <!-- Benefits Section -->
    <section id="benefits" class="py-16">
      <div class="container mx-auto px-4">
        <h2 class="text-4xl font-bold text-center mb-12">Por Que Escolher a SaúdePlus?</h2>
        <div class="grid md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="text-5xl mb-4">🏥</div>
            <h3 class="text-xl font-bold mb-2">Rede Ampla</h3>
            <p>Mais de 1000 hospitais e clínicas credenciados</p>
          </div>
          <div class="text-center">
            <div class="text-5xl mb-4">⚡</div>
            <h3 class="text-xl font-bold mb-2">Atendimento Rápido</h3>
            <p>Agendamento online e atendimento em até 24h</p>
          </div>
          <div class="text-center">
            <div class="text-5xl mb-4">💰</div>
            <h3 class="text-xl font-bold mb-2">Melhor Custo-Benefício</h3>
            <p>Planos a partir de R$ 199,90 mensais</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Form -->
    <section id="contact" class="py-16 bg-gray-50">
      <div class="container mx-auto px-4 max-w-2xl">
        <h2 class="text-4xl font-bold text-center mb-12">Entre em Contato</h2>
        <form id="contact-form" class="space-y-4">
          <input type="text" id="name" placeholder="Nome" class="w-full p-3 border rounded" required>
          <input type="email" id="email" placeholder="Email" class="w-full p-3 border rounded" required>
          <input type="tel" id="phone" placeholder="Telefone" class="w-full p-3 border rounded">
          <select id="plan" class="w-full p-3 border rounded">
            <option value="">Selecione um plano</option>
            <option value="basico">Básico</option>
            <option value="premium">Premium</option>
            <option value="empresarial">Empresarial</option>
          </select>
          <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 transition">
            Enviar Contato
          </button>
        </form>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-8">
      <div class="container mx-auto px-4 text-center">
        <p>&copy; 2024 SaúdePlus. Todos os direitos reservados.</p>
      </div>
    </footer>
  `;

  // Load plans from API
  loadPlans();
  
  // Setup form handler
  document.getElementById('contact-form').addEventListener('submit', handleContactForm);
});

// Functions
function scrollToPlans() {
  document.getElementById('plans').scrollIntoView({ behavior: 'smooth' });
}

async function loadPlans() {
  try {
    const response = await fetch('http://localhost:3001/api/plans');
    const plans = await response.json();
    
    const container = document.getElementById('plans-container');
    container.innerHTML = plans.map(plan => `
      <div class="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition">
        <h3 class="text-2xl font-bold mb-4">${plan.name}</h3>
        <p class="text-4xl font-bold text-blue-600 mb-6">R$ ${plan.price}</p>
        <ul class="space-y-2 mb-6">
          ${plan.features.map(f => `<li>✓ ${f}</li>`).join('')}
        </ul>
        <button onclick="selectPlan('${plan.name}')" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
          Escolher Plano
        </button>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading plans:', error);
  }
}

function selectPlan(planName) {
  document.getElementById('plan').value = planName.toLowerCase();
  document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
}

async function handleContactForm(e) {
  e.preventDefault();
  
  const formData = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    plan: document.getElementById('plan').value
  };
  
  try {
    const response = await fetch('http://localhost:3001/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Contato enviado com sucesso! Entraremos em contato em breve.');
      document.getElementById('contact-form').reset();
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    alert('Erro ao enviar contato. Tente novamente.');
  }
}