'use client';

import React from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Battery, 
  Zap, 
  ShoppingBag, 
  BarChart3, 
  Users, 
  ShieldCheck, 
  UserCheck 
} from 'lucide-react';
import { Role } from '@/lib/db';

interface SidebarProps {
  role?: Role;
  user?: any;
  activePath?: string;
}

export default function Sidebar({ role, user, activePath = '' }: SidebarProps) {
  const currentRole = role || user?.role || 'FUNCIONARIO';
  const isAdmin = currentRole === 'ADMIN';

  const navItems = [
    { label: 'Painel Geral', href: '/', icon: LayoutDashboard, role: 'ALL' },
    { label: 'Baterias Novas', href: '/estoque', icon: Battery, role: 'ALL' },
    { label: 'Semi-Novas', href: '/semi-novas', icon: Zap, role: 'ALL' },
    { label: 'Histórico de Vendas', href: '/vendas', icon: ShoppingBag, role: 'ALL' },
    { label: 'Relatórios & Caixa', href: '/relatorios', icon: BarChart3, role: 'ADMIN' },
    { label: 'Equipe & Funcionários', href: '/usuarios', icon: Users, role: 'ADMIN' },
  ];

  const visibleItems = navItems.filter(item => item.role === 'ALL' || (item.role === 'ADMIN' && isAdmin));

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-[#1e3256] bg-[#0a1120] p-4 text-slate-300 min-h-[calc(100vh-65px)]">
      
      {/* Badge do Perfil Logado */}
      <div className="mb-6 rounded-xl border border-[#1e3256] bg-[#111d33]/80 p-3.5 shadow-md">
        <div className="flex items-center gap-2.5">
          {isAdmin ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400">
              <UserCheck className="h-5 w-5" />
            </div>
          )}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Perfil Ativo</p>
            <p className="text-sm font-black text-white">
              {isAdmin ? 'Dono / Administrador' : 'Funcionário Balcão'}
            </p>
          </div>
        </div>
      </div>

      {/* Menu de Navegação Desktop */}
      <nav className="flex-1 space-y-1">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = activePath === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#004b9a] to-[#0262c7] text-white shadow-lg shadow-[#004b9a]/30 scale-[1.02]'
                  : 'text-slate-400 hover:bg-[#111d33] hover:text-white'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Rodapé Informativo */}
      <div className="mt-auto border-t border-[#1e3256] pt-4 text-center">
        <p className="text-[11px] font-bold text-slate-400">JMix Baterias 24h</p>
        <p className="text-[10px] text-slate-500">Sistema Interno v2.0</p>
      </div>
    </aside>
  );
}
