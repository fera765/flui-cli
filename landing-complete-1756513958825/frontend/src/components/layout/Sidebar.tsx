import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const location = useLocation();
  
  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Meu Plano', href: '/dashboard/plano', icon: '📋' },
    { name: 'Carteirinha', href: '/dashboard/carteirinha', icon: '💳' },
    { name: 'Autorizações', href: '/dashboard/autorizacoes', icon: '✅' },
    { name: 'Reembolso', href: '/dashboard/reembolso', icon: '💰' },
    { name: 'Configurações', href: '/dashboard/configuracoes', icon: '⚙️' },
  ];
  
  return (
    <aside className={cn('w-64 bg-white shadow-lg', className)}>
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.href}
                className={cn(
                  'flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors',
                  location.pathname === item.href
                    ? 'bg-primary-100 text-primary-700'
                    : 'hover:bg-gray-100'
                )}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;