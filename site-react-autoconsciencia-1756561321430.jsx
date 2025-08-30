```jsx
// App.jsx - Arquivo principal completo
import React from 'react';
import { create } from 'zustand';

// Zustand Store
const useStore = create((set) => ({
  user: null,
  theme: 'light',
  cart: [],
  setUser: (user) => set({ user }),
  setTheme: (theme) => set({ theme }),
  addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
  removeFromCart: (id) => set((state) => ({ 
    cart: state.cart.filter(item => item.id !== id) 
  })),
}));

// Componente Hero
const Hero = () => {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">Revolucione seu Negócio com IA</h1>
          <p className="text-xl mb-8">
            Soluções de inteligência artificial de ponta para empresas modernas
          </p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
            Começar Agora
          </button>
        </div>
      </div>
    </section>
  );
};

// Componente Features
const Features = () => {
  const features = [
    { title: 'Análise de Dados', description: 'Transforme dados complexos em insights acionáveis.' },
    { title: 'Automação', description: 'Otimize processos com automações inteligentes.' },
    { title: 'Personalização', description: 'Ofereça experiências personalizadas aos seus clientes.' },
  ];
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Nossas Funcionalidades</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Componente Pricing
const Pricing = () => {
  const plans = [
    { name: 'Básico', price: 29, features: ['Análise básica', 'Suporte via email', 'Limite de usuários: 10'] },
    { name: 'Profissional', price: 59, features: ['Análise avançada', 'Suporte prioritário', 'Limite de usuários: 50'] },
    { name: 'Enterprise', price: 149, features: ['Customizações', 'Suporte dedicado', 'Usuários ilimitados'] },
  ];
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Planos de Preços</h2>
        <div className="flex flex-col md:flex-row md:justify-center gap-8">
          {plans.map((plan, index) => (
            <div key={index} className="border rounded-lg p-8 flex-1 max-w-sm mx-auto hover:scale-105 transition transform bg-gray-50">
              <h3 className="text-2xl font-semibold mb-4 text-center">{plan.name}</h3>
              <p className="text-4xl font-bold mb-4 text-center">${plan.price}/mês</p>
              <ul className="mb-6">
                {plan.features.map((feat, i) => (
                  <li key={i} className="mb-2 flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.704 5.292a1 1 0 00-1.408 0L8 13.586 4.704 10.292a1 1 0 00-1.408 1.416l4 4.001a1 1 0 001.415-.089l8-10a1 1 0 00-.007-1.328z" clipRule="evenodd" />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition">
                Escolha {plan.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Componente Testimonials
const Testimonials = () => {
  const testimonials = [
    { name: 'Ana Silva', feedback: 'A solução com IA transformou nossa empresa, aumentamos a eficiência!' },
    { name: 'Carlos Pereira', feedback: 'Equipe incrível e suporte excelente. Recomendo a todos!' },
    { name: 'Laura Santos', feedback: 'Soluções personalizadas que atendem às nossas necessidades.' },
  ];
  return (
    <section className="py-16 bg-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Depoimentos</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition">
              <p className="mb-4 italic">“{t.feedback}”</p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
                <div>
                  <h4 className="font-semibold">{t.name}</h4>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Componente Footer
const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-200 py-8">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <h3 className="text-xl font-semibold mb-2">MinhaEmpresa AI</h3>
          <p className="text-sm">Transformando negócios com inteligência artificial</p>
        </div>
        <div className="flex space-x-4">
          <a href="#" className="hover:text-white">Sobre</a>
          <a href="#" className="hover:text-white">Serviços</a>
          <a href="#" className="hover:text-white">Contato</a>
          <a href="#" className="hover:text-white">Política de Privacidade</a>
        </div>
      </div>
    </footer>
  );
};

// Componente Principal App
const App = () => {
  const { cart, addToCart, removeFromCart } = useStore();

  // Exemplo de item do carrinho
  const exampleItem = { id: 1, name: 'Plano Profissional', price: 59 };

  return (
    <div className="font-sans">
      <Hero />
      <Features />
      <Pricing />
      <Testimonials />
      {/* Se desejar, pode incluir um componente de carrinho ou botões para testar */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-4">Carrinho de Compras</h2>
          <button
            onClick={() => addToCart(exampleItem)}
            className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Adicionar "{exampleItem.name}" ao Carrinho
          </button>
          {cart.length > 0 ? (
            <ul className="w-full max-w-2xl bg-white rounded-lg shadow p-4">
              {cart.map((item) => (
                <li key={item.id} className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-600">${item.price}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:underline"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">Carrinho vazio.</p>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default App;
```