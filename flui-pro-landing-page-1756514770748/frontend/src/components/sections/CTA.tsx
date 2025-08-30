import React from 'react';
import Button from '@/components/ui/Button';

const CTA: React.FC = () => {
  return (
    <section className="py-20 bg-primary-600 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-4">Comece hoje mesmo!</h2>
        <p className="text-xl mb-8">Proteja sua família com o melhor plano de saúde</p>
        <Button size="lg" variant="secondary">Fazer Cotação Grátis</Button>
      </div>
    </section>
  );
};

export default CTA;