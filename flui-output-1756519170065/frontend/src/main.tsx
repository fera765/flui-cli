import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/main.css';

// Simple App component since we have the components
const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800">HealthCare Plus</h1>
          <p className="text-gray-600">Planos de Saúde Premium</p>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-12">
        <section className="text-center mb-12">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Cuide da sua saúde com os melhores planos
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Cobertura completa, atendimento 24h, rede credenciada premium
          </p>
          <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition">
            Conheça Nossos Planos
          </button>
        </section>
        
        <section className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-3">Plano Básico</h3>
            <p className="text-3xl font-bold text-blue-600 mb-4">R$ 199<span className="text-sm">/mês</span></p>
            <ul className="space-y-2 text-gray-600">
              <li>✓ Consultas ilimitadas</li>
              <li>✓ Exames básicos</li>
              <li>✓ Urgência 24h</li>
            </ul>
            <button className="w-full mt-6 bg-gray-200 py-2 rounded hover:bg-gray-300 transition">
              Selecionar
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-blue-600">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">Mais Popular</span>
            <h3 className="text-xl font-bold mb-3 mt-2">Plano Premium</h3>
            <p className="text-3xl font-bold text-blue-600 mb-4">R$ 399<span className="text-sm">/mês</span></p>
            <ul className="space-y-2 text-gray-600">
              <li>✓ Tudo do Básico</li>
              <li>✓ Especialistas</li>
              <li>✓ Internação</li>
              <li>✓ Cirurgias</li>
            </ul>
            <button className="w-full mt-6 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
              Selecionar
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-3">Plano Empresarial</h3>
            <p className="text-3xl font-bold text-blue-600 mb-4">R$ 599<span className="text-sm">/mês</span></p>
            <ul className="space-y-2 text-gray-600">
              <li>✓ Tudo do Premium</li>
              <li>✓ Cobertura internacional</li>
              <li>✓ Check-up executivo</li>
            </ul>
            <button className="w-full mt-6 bg-gray-200 py-2 rounded hover:bg-gray-300 transition">
              Selecionar
            </button>
          </div>
        </section>
        
        <section className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-8">Por que escolher nossos planos?</h2>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl mb-2">🏥</div>
              <h4 className="font-semibold">Rede Premium</h4>
              <p className="text-sm text-gray-600">Melhores hospitais</p>
            </div>
            <div>
              <div className="text-4xl mb-2">⏰</div>
              <h4 className="font-semibold">24 Horas</h4>
              <p className="text-sm text-gray-600">Atendimento sempre</p>
            </div>
            <div>
              <div className="text-4xl mb-2">🌍</div>
              <h4 className="font-semibold">Cobertura Total</h4>
              <p className="text-sm text-gray-600">Nacional e internacional</p>
            </div>
            <div>
              <div className="text-4xl mb-2">💰</div>
              <h4 className="font-semibold">Sem Surpresas</h4>
              <p className="text-sm text-gray-600">Preços transparentes</p>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 HealthCare Plus - Todos os direitos reservados</p>
          <p className="text-sm text-gray-400 mt-2">Desenvolvido pelo Flui Autonomous</p>
        </div>
      </footer>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);