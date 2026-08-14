'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LogOut, 
  ShoppingCart, 
  Download, 
  AlertTriangle,
  Smartphone,
  X,
  Share,
  PlusSquare,
  Menu,
  LayoutDashboard,
  Battery,
  Zap,
  ShoppingBag,
  BarChart3,
  Users,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import POSModal from './POSModal';
import { Product } from '@/lib/db';

interface NavbarProps {
  user?: any;
  sessionUser?: any;
  onPOSOpen?: () => void;
  onOpenPOS?: () => void;
  onLogout?: () => Promise<void>;
}

export default function Navbar({ user, sessionUser, onPOSOpen, onOpenPOS, onLogout }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentUser = sessionUser || user;
  const isAdmin = currentUser?.role === 'ADMIN';

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPOSOpen, setIsPOSOpen] = useState(false);
  const [criticalProducts, setCriticalProducts] = useState<Product[]>([]);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const checkCriticalStock = async () => {
    try {
      const res = await fetch('/api/produtos');
      if (res.ok) {
        const prods = await res.json();
        const list = Array.isArray(prods) ? prods : (prods.products || []);
        if (Array.isArray(list)) {
          const critical = list.filter((p: any) => p.estoque === 1);
          setCriticalProducts(critical);
        }
      }
    } catch (err) {}
  };

  useEffect(() => {
    checkCriticalStock();
    const interval = setInterval(checkCriticalStock, 3000);

    const handleFocus = () => checkCriticalStock();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      try {
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
          setInstallPrompt(null);
        }
      } catch (err) {
        setShowPwaModal(true);
      }
    } else {
      setShowPwaModal(true);
    }
  };

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
      return;
    }
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Erro ao sair:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleOpenPOSAction = () => {
    setIsMobileMenuOpen(false);
    if (onOpenPOS) onOpenPOS();
    else if (onPOSOpen) onPOSOpen();
    else setIsPOSOpen(true);
  };

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
    <>
      {/* BANNER DE ALERTA EM TEMPO REAL PARA ESTOQUE CRÍTICO (1 UNIDADE) */}
      {criticalProducts.length > 0 && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-4 py-2 text-white shadow-lg animate-pulse">
          <div className="mx-auto flex max-w-7xl items-center justify-between text-xs font-bold md:text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-300 flex-shrink-0 animate-bounce" />
              <span>
                <strong>ALERTA DE ESTOQUE CRÍTICO (1 UNIDADE RESTANTE):</strong>{' '}
                {criticalProducts.map(p => `${p.marca} ${p.modelo} (${p.amperagem}Ah)`).join(', ')}
              </span>
            </div>
            <span className="hidden sm:inline-block rounded bg-black/30 px-2 py-0.5 text-[11px] uppercase">
              Venda Urgente Balcão
            </span>
          </div>
        </div>
      )}

      {/* HEADER DE NAVEGAÇÃO PRINCIPAL */}
      <header className="sticky top-0 z-40 border-b border-[#1e3256] bg-[#0a1120]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 md:px-4 py-2.5">
          
          {/* Botão Hambúrguer Mobile + Logo */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* BOTÃO HAMBÚRGUER (Apenas telas pequenas) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex md:hidden items-center justify-center rounded-xl border border-[#1e3256] bg-[#111d33] p-2 text-slate-300 hover:text-white transition-all"
              aria-label="Abrir Menu de Navegação"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5 text-amber-400" /> : <Menu className="h-5 w-5 text-white" />}
            </button>

            {/* Logo e Nome da Loja */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative h-9 w-9 md:h-10 md:w-10 overflow-hidden rounded-xl border border-[#1e3256] bg-[#111d33] p-1 shadow-md group-hover:scale-105 transition-transform">
                <Image
                  src="/logo.png"
                  alt="JMix Baterias 24h"
                  fill
                  sizes="40px"
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-base md:text-lg font-black tracking-tight text-white">JMIX</span>
                  <span className="rounded bg-[#e51b24] px-1.5 py-0.2 text-[10px] font-black text-white">24H</span>
                </div>
                <p className="text-[10px] font-semibold text-slate-400 hidden xs:block">Sistema de Estoque & Balcão</p>
              </div>
            </Link>
          </div>

          {/* Ações Centrais & PWA */}
          <div className="flex items-center gap-2 md:gap-3">
            
            {/* BOTÃO VISÍVEL PARA INSTALAR O APP */}
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-2.5 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/20 active:scale-95 transition-all"
              title="Adicionar Atalho à Tela Inicial do Celular"
            >
              <Smartphone className="h-4 w-4 text-amber-400" />
              <span className="hidden sm:inline">INSTALAR NA TELA</span>
              <span className="sm:hidden text-[11px]">INSTALAR</span>
            </button>

            {/* BOTÃO PRINCIPAL DE VENDER (ABRE O POS) */}
            <button
              onClick={handleOpenPOSAction}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#004b9a] via-[#0262c7] to-[#004b9a] px-3.5 md:px-4 py-2 text-xs font-extrabold text-white shadow-lg shadow-[#004b9a]/40 hover:brightness-110 active:scale-95 transition-all"
            >
              <ShoppingCart className="h-4 w-4 text-amber-300" />
              <span className="hidden xs:inline">+ REGISTRAR VENDA</span>
              <span className="xs:hidden">VENDER</span>
            </button>

            {/* Perfil do Usuário Logado */}
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#1e3256]">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-white">{currentUser.nome}</span>
                  <span className="text-[10px] text-slate-400">
                    {isAdmin ? 'Dono (Admin)' : `Balcão (${currentUser.matricula || 'FUN'})`}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  title="Sair do Sistema"
                  className="rounded-xl border border-[#1e3256] bg-[#111d33] p-2 text-slate-400 hover:border-red-800 hover:bg-red-950/50 hover:text-red-400 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* DRAWER / MENU HAMBÚRGUER DESLIZANTE PARA DISPOSITIVOS MÓVEIS */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Overlay escuro de fundo */}
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
          />

          {/* Painel do Menu Hambúrguer */}
          <div className="relative flex w-4/5 max-w-xs flex-col bg-[#0a1120] border-r border-[#1e3256] p-5 text-slate-200 shadow-2xl z-10 font-sans">
            
            {/* Header do Menu Mobile */}
            <div className="flex items-center justify-between border-b border-[#1e3256] pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="relative h-9 w-9 rounded-xl border border-[#1e3256] bg-[#111d33] p-1">
                  <Image src="/logo.png" alt="JMix Logo" fill sizes="36px" className="object-contain" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">JMix Baterias</h3>
                  <p className="text-[10px] text-slate-400">Menu Principal</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Badge do Usuário Logado */}
            {currentUser && (
              <div className="mb-4 rounded-xl border border-[#1e3256] bg-[#111d33] p-3">
                <div className="flex items-center gap-2.5">
                  {isAdmin ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 font-bold">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 font-bold">
                      <UserCheck className="h-4 w-4" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-white">{currentUser.nome}</p>
                    <p className="text-[10px] text-slate-400">
                      {isAdmin ? 'Dono / Administrador' : `Funcionário (${currentUser.matricula || 'Balcão'})`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Links de Navegação no Mobile */}
            <nav className="flex-1 space-y-1.5 overflow-y-auto">
              {visibleItems.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-[#004b9a] to-[#0262c7] text-white shadow-lg shadow-[#004b9a]/40'
                        : 'text-slate-300 hover:bg-[#111d33] hover:text-white border border-[#1e3256]/50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Ações Inferiores no Menu Hambúrguer */}
            <div className="mt-auto border-t border-[#1e3256] pt-4 space-y-2">
              <button
                onClick={handleOpenPOSAction}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004b9a] to-[#0262c7] py-3 text-xs font-extrabold text-white shadow-md"
              >
                <ShoppingCart className="h-4 w-4 text-amber-300" />
                <span>+ NOVA VENDA BALCÃO</span>
              </button>

              {currentUser && (
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-900/50 bg-red-950/40 py-2.5 text-xs font-bold text-red-300 hover:bg-red-900/60"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair da Conta</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL INSTRUÇÕES DE INSTALAÇÃO NO CELULAR */}
      {showPwaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-amber-500/40 bg-[#0a1120] p-6 text-white space-y-4 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-[#1e3256] pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Smartphone className="h-5 w-5" />
                <h3 className="font-bold text-base">Instalar App na Tela do Celular</h3>
              </div>
              <button onClick={() => setShowPwaModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Para ter o ícone do sistema JMix Baterias 24h na tela inicial do seu celular, siga o passo a passo:
            </p>

            <div className="space-y-3 text-xs bg-[#111d33] p-4 rounded-xl border border-[#1e3256]">
              <div className="flex items-start gap-2.5">
                <div className="rounded bg-[#004b9a] px-2 py-0.5 font-bold text-white text-[10px]">1</div>
                <p>No navegador (Chrome/Safari), toque no botão de <strong>Opções / Compartilhar</strong> (<Share className="inline h-3.5 w-3.5 text-blue-400" />).</p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="rounded bg-[#004b9a] px-2 py-0.5 font-bold text-white text-[10px]">2</div>
                <p>Selecione a opção <strong className="text-amber-400 font-bold flex items-center gap-1 mt-0.5"><PlusSquare className="h-3.5 w-3.5" /> Adicionar à Tela de Início / Adicionar à Tela Inicial</strong>.</p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="rounded bg-[#004b9a] px-2 py-0.5 font-bold text-white text-[10px]">3</div>
                <p>Confirme clicando em <strong>Adicionar</strong>. O ícone da JMix Baterias estará na tela do seu telefone!</p>
              </div>
            </div>

            <button
              onClick={() => setShowPwaModal(false)}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-xs font-black text-black hover:brightness-110 shadow-lg"
            >
              ENTENDI
            </button>
          </div>
        </div>
      )}

      {/* Modal PDV de Venda Rápida */}
      <POSModal
        isOpen={isPOSOpen}
        onClose={() => setIsPOSOpen(false)}
        usuario={currentUser}
        user={currentUser}
        onSaleSuccess={() => {
          setIsPOSOpen(false);
          window.location.reload();
        }}
      />
    </>
  );
}
