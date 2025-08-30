import React from 'react';
import { motion } from 'framer-motion';
import FeatureCard from '@/components/cards/FeatureCard';

const Features: React.FC = () => {
  const features = [
    { title: 'Cobertura Completa', description: 'Atendimento em todo território nacional', icon: '🏥' },
    { title: 'Sem Carência', description: 'Para emergências e urgências', icon: '🚑' },
    { title: 'Telemedicina', description: 'Consultas online 24/7', icon: '💻' },
    { title: 'Rede Premium', description: 'Melhores hospitais e clínicas', icon: '⭐' },
    { title: 'Reembolso Rápido', description: 'Em até 48 horas', icon: '💰' },
    { title: 'App Exclusivo', description: 'Tudo na palma da mão', icon: '📱' },
  ];
  
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Por que escolher a HealthSure?</h2>
          <p className="text-xl text-gray-600">Benefícios exclusivos para você e sua família</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <FeatureCard {...feature} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;