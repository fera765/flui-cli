import React from 'react';
import PlanCard from '@/components/cards/PlanCard';

const Pricing: React.FC = () => {
  const plans = [
    { name: 'Básico', price: 199, features: ['Consultas', 'Exames básicos', 'Urgência'] },
    { name: 'Plus', price: 399, features: ['Tudo do Básico', 'Especialistas', 'Internação'] },
    { name: 'Premium', price: 799, features: ['Tudo do Plus', 'Cirurgias', 'Internacional'] },
  ];
  
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Escolha seu plano</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <PlanCard key={plan.name} {...plan} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;