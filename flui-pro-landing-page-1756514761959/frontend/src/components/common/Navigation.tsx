import React from 'react';
import { Link } from 'react-router-dom';

export default function Navigation({ className }: any) {
  const links = [
    { name: 'Início', href: '/' },
    { name: 'Planos', href: '/planos' },
    { name: 'Sobre', href: '/sobre' },
    { name: 'Contato', href: '/contato' },
  ];
  
  return (
    <nav className={className}>
      {links.map(link => (
        <Link key={link.name} to={link.href} className="px-3 py-2 hover:text-primary-600">
          {link.name}
        </Link>
      ))}
    </nav>
  );
}