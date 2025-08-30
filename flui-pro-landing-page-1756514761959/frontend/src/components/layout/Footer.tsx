import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/common/Logo';
import SocialLinks from '@/components/common/SocialLinks';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Logo className="mb-4" />
            <p className="text-gray-400">Cuidando da sua saúde com excelência.</p>
            <SocialLinks className="mt-4" />
          </div>
          <div>
            <h3 className="font-semibold mb-4">Empresa</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/sobre" className="hover:text-white">Sobre</Link></li>
              <li><Link to="/equipe" className="hover:text-white">Equipe</Link></li>
              <li><Link to="/carreiras" className="hover:text-white">Carreiras</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Produtos</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/planos" className="hover:text-white">Planos</Link></li>
              <li><Link to="/beneficios" className="hover:text-white">Benefícios</Link></li>
              <li><Link to="/rede" className="hover:text-white">Rede</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Suporte</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/ajuda" className="hover:text-white">Ajuda</Link></li>
              <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
              <li><Link to="/contato" className="hover:text-white">Contato</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>© {currentYear} HealthSure. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;