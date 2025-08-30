document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  
  app.innerHTML = `
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
  `;

  // Load plans
  fetch('http://localhost:3001/api/plans')
    .then(res => res.json())
    .then(plans => {
      const container = document.getElementById('plans-container');
      container.innerHTML = plans.map(p => `
        <div class="bg-white p-8 rounded-lg shadow">
          <h3 class="text-2xl font-bold">${p.name}</h3>
          <p class="text-4xl font-bold text-blue-600">R$ ${p.price}</p>
        </div>
      `).join('');
    }).catch(console.error);
});