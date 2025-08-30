import React, { useState } from 'react';
import Accordion from '@/components/ui/Accordion';

const FAQ: React.FC = () => {
  const faqs = [
    { question: 'Qual o prazo de carência?', answer: 'Não há carência para emergências.' },
    { question: 'Como funciona o reembolso?', answer: 'Reembolso em até 48 horas úteis.' },
    { question: 'Posso incluir dependentes?', answer: 'Sim, com desconto progressivo.' },
  ];
  
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-4xl font-bold text-center mb-12">Perguntas Frequentes</h2>
        <Accordion items={faqs} />
      </div>
    </section>
  );
};

export default FAQ;