import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  const benefits = [
    'Cobertura nacional completa',
    'Atendimento 24 horas',
    'Sem carência para emergências',
    'Rede credenciada premium'
  ];
  
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Sua saúde merece o
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600"> melhor cuidado</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Planos de saúde completos com cobertura nacional, atendimento premium e 
              os melhores hospitais. Proteja sua família com quem entende de saúde.
            </p>
            <div className="space-y-3 mb-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-center"
                >
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </motion.div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/planos">
                <Button size="lg" className="group">
                  Ver Planos
                  <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/simulacao">
                <Button variant="outline" size="lg">
                  Fazer Simulação
                </Button>
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative w-full h-[500px] lg:h-[600px]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-200 to-secondary-200 rounded-3xl transform rotate-3"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 h-full flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800"
                  alt="Healthcare Professional"
                  className="rounded-2xl object-cover w-full h-full"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;