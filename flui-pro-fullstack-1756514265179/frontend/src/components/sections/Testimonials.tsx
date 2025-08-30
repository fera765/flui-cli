import React from 'react';
import TestimonialCard from '@/components/cards/TestimonialCard';

const Testimonials: React.FC = () => {
  const testimonials = [
    { name: 'Maria Silva', text: 'Excelente atendimento!', rating: 5 },
    { name: 'João Santos', text: 'Recomendo muito!', rating: 5 },
    { name: 'Ana Costa', text: 'Mudou minha vida!', rating: 5 },
  ];
  
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">O que dizem nossos clientes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.name} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;