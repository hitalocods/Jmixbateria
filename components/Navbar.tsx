'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  LogOut, 
  ShoppingCart, 
  Download, 
  AlertTriangle,
  Smartphone,
  X,
  Share,
  PlusSquare
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
  const currentUser = sessionUser || user;

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
    if (onOpenPOS) onOpenPOS();
    else if (onPOSOpen) onPOSOpen();
    else setIsPOSOpen(true);
  };

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
          
          {/* Logo e Nome da Loja */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative h-9 w-9 md:h-10 md:w-10 overflow-hidden rounded-xl border border-[#1e3256] bg-[#111d33] p-1 shadow-md group-hover:scale-105 transition-transform">
              <Image
                src="/logo.png"
                alt="JMix Baterias 24h"
                fill
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

          {/* Ações Centrais & PWA */}
          <div className="flex items-center gap-2 md:gap-3">
            
            {/* BOTÃO VISÍVEL EM TODOS OS CELULARES E DESKTOPS PARA INSTALAR O APP */}
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
              <div className="flex items-center gap-2 pl-2 border-l border-[#1e3256]">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-bold text-white">{currentUser.nome}</span>
                  <span className="text-[10px] text-slate-400">
                    {currentUser.role === 'ADMIN' ? 'Dono (Admin)' : `Balcão (${currentUser.matricula || 'FUN'})`}
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
