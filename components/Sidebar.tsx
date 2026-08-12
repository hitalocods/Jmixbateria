'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Battery,
  Sparkles,
  ShoppingBag,
  BarChart3,
  Users,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { SessionUser } from '@/lib/auth';

interface SidebarProps {
  user: SessionUser | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = user?.role === 'ADMIN';

  const navItems = [
    {
      label: 'Visão Geral & Estoque',
      href: '/',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'FUNCIONARIO']
    },
    {
      label: 'Baterias Novas',
      href: '/estoque',
      icon: Battery,
      badge: 'Novas',
      roles: ['ADMIN', 'FUNCIONARIO']
    },
    {
      label: 'Semi-Novas',
      href: '/semi-novas',
      icon: Sparkles,
      badge: 'Usadas',
      roles: ['ADMIN', 'FUNCIONARIO']
    },
    {
      label: 'Histórico de Vendas',
      href: '/vendas',
      icon: ShoppingBag,
      roles: ['ADMIN', 'FUNCIONARIO']
    },
    {
      label: 'Faturamento & Margem',
      href: '/relatorios',
      icon: BarChart3,
      adminOnly: true,
      roles: ['ADMIN']
    },
    {
      label: 'Gestão da Equipe',
      href: '/usuarios',
      icon: Users,
      adminOnly: true,
      roles: ['ADMIN']
    }
  ];

  const filteredItems = navItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <aside className="w-full md:w-64 flex-shrink-0 bg-[#0a1120] border-r border-[#1e3256] p-4 flex flex-col justify-between">
      <div className="space-y-5">
        
        {/* MENU DE NAVEGAÇÃO */}
        <div>
          <h2 className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Navegação do Sistema
          </h2>

          <nav className="mt-2 space-y-1">
            {filteredItems.map(item => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#004b9a] to-[#0262c7] text-white shadow-md shadow-blue-950/40'
                      : 'text-slate-300 hover:bg-[#111d33] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4.5 w-4.5 transition-colors ${
                        isActive
                          ? 'text-[#f99b1c]'
                          : 'text-slate-400 group-hover:text-[#f99b1c]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#1e3256] text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {item.adminOnly && (
                    <span className="rounded bg-[#f99b1c]/20 px-1.5 py-0.5 text-[9px] font-black text-[#f99b1c] border border-[#f99b1c]/40">
                      DONO
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* BOX EXPLICATIVO DE NÍVEIS DE ACESSO */}
        <div className={`rounded-2xl border p-3.5 space-y-2 ${
          isAdmin
            ? 'border-[#f99b1c]/40 bg-gradient-to-br from-[#111d33] to-[#1a1400]/40'
            : 'border-[#1e3256] bg-[#111d33]'
        }`}>
          <div className="flex items-center gap-2 text-xs font-black">
            {isAdmin ? (
              <>
                <ShieldCheck className="h-4 w-4 text-[#f99b1c]" />
                <span className="text-[#f99b1c]">Perfil: Dono / Gerente</span>
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 text-blue-400" />
                <span className="text-blue-400">Perfil: Funcionário</span>
              </>
            )}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isAdmin ? (
              'Você possui acesso gerencial a preços de custo, margens de lucro, relatórios de vendas da equipe e cadastro de funcionários.'
            ) : (
              'Você possui acesso operacional ao balcão de vendas, consulta de estoque em tempo real e alerta de 1 unidade restante.'
            )}
          </p>
        </div>

      </div>

      <div className="pt-4 border-t border-[#1e3256] text-center text-[10px] text-slate-500 font-semibold">
        JMix Baterias 24h &copy; {new Date().getFullYear()}
      </div>
    </aside>
  );
}
