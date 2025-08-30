import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/common/Logo';
import SocialLinks from '@/components/common/SocialLinks';
import NewsletterForm from '@/components/forms/NewsletterForm';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = {
    Empresa: [
      { name: 'Sobre Nós', href: '/sobre' },
      { name: 'Equipe', href: '/equipe' },
      { name: 'Carreiras', href: '/carreiras' },
      { name: 'Contato', href: '/contato' },
    ],
    Produtos: [
      { name: 'Planos', href: '/planos' },
      { name: 'Benefícios', href: '/beneficios' },
      { name: 'Rede Credenciada', href: '/rede' },
      { name: 'App Mobile', href: '/app' },
    ],
    Suporte: [
      { name: 'Central de Ajuda', href: '/ajuda' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Documentos', href: '/documentos' },
      { name: 'Status', href: '/status' },
    ],
    Legal: [
      { name: 'Termos de Uso', href: '/termos' },
      { name: 'Privacidade', href: '/privacidade' },
      { name: 'Cookies', href: '/cookies' },
      { name: 'Compliance', href: '/compliance' },
    ],
  };
  
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          <div className="lg:col-span-2">
            <Logo className="mb-4" />
            <p className="text-gray-400 mb-4">
              Cuidando da sua saúde com excelência e dedicação desde 2010.
            </p>
            <SocialLinks />
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} HealthSure. Todos os direitos reservados.
            </p>
            <div className="mt-4 md:mt-0">
              <NewsletterForm />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;