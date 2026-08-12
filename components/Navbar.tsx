'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LogOut, User as UserIcon, Zap, ShoppingCart, Crown, Download, AlertTriangle } from 'lucide-react';
import { SessionUser } from '@/lib/auth';
import { Product } from '@/lib/db';

interface NavbarProps {
  user: SessionUser | null;
  onOpenPOS?: () => void;
  onLogout?: () => void;
}

export default function Navbar({ user, onOpenPOS, onLogout }: NavbarProps) {
  const isAdmin = user?.role === 'ADMIN';

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstallPWA, setCanInstallPWA] = useState(false);

  // Real-time Critical Stock Alert (1 unit)
  const [criticalProducts, setCriticalProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Handler para instalação do PWA no celular/desktop
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPWA(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Polling em tempo real (a cada 4 segundos) para verificar estoque crítico de 1 unidade!
    const checkStockAlerts = async () => {
      try {
        const res = await fetch('/api/produtos');
        const data = await res.json();
        const prods: Product[] = data.products || [];
        const critical = prods.filter(p => p.estoque === 1 || p.estoque === 0);
        setCriticalProducts(critical);
      } catch (err) {
        // silencioso
      }
    };

    checkStockAlerts();
    const interval = setInterval(checkStockAlerts, 4000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      clearInterval(interval);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setCanInstallPWA(false);
      }
      setDeferredPrompt(null);
    } else {
      alert('Para instalar na sua tela inicial:\n1. Clique nos três pontinhos ou ícone de compartilhar do seu navegador.\n2. Escolha "Adicionar à tela inicial" ou "Instalar Aplicativo".');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1e3256] bg-[#0a1120]/95 backdrop-blur-md px-4 py-2.5">
      <div className="mx-auto flex max-w-7xl flex-col gap-2">
        
        {/* BANNER SUPERIOR DE ALERTA DE ESTOQUE CRÍTICO DE 1 UNIDADE (TEMPO REAL) */}
        {criticalProducts.length > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-red-950 via-amber-950 to-red-950 border border-red-700/60 px-3 py-1.5 text-xs font-bold text-red-200 shadow-md animate-pulse">
            <div className="flex items-center gap-2 overflow-hidden truncate">
              <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <span>
                🚨 <strong>ALERTA DE ESTOQUE CRÍTICO PARA A EQUIPE:</strong>{' '}
                {criticalProducts.map(p => (
                  <span key={p.id} className="mr-2 underline">
                    {p.marca} {p.modelo} ({p.estoque === 0 ? 'ESGOTADA!' : 'RESTANDO APENAS 1 UNIDADE!'})
                  </span>
                ))}
              </span>
            </div>
            <span className="text-[10px] bg-red-900 px-2 py-0.5 rounded text-white font-black flex-shrink-0">
              AVISO TEMPO REAL
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          
          {/* LOGO JMIX BATERIAS 24H */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-[#004b9a]/60 p-1 bg-[#0f2744] shadow-md group-hover:border-[#f99b1c] transition-all">
              <Image
                src="/logo.png"
                alt="JMix Baterias 24h"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white group-hover:text-[#f99b1c] transition-colors">
                  JMIX <span className="text-[#f99b1c]">BATERIAS</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e51b24] px-2 py-0.5 text-[10px] font-black uppercase text-white shadow-sm">
                  <Zap className="h-3 w-3 fill-current" /> 24H
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-400">
                Sistema Interno • Tempo Real
              </span>
            </div>
          </Link>

          {/* CONTROLES: BOTÃO INSTALAR PWA, PDV E PERFIL */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* BOTÃO INSTALAR PWA */}
            <button
              onClick={handleInstallPWA}
              title="Instalar aplicativo na tela inicial do celular/computador"
              className="flex items-center gap-1.5 rounded-xl border border-[#f99b1c]/40 bg-[#f99b1c]/10 px-3 py-1.5 text-xs font-bold text-[#f99b1c] hover:bg-[#f99b1c]/20 transition-all"
            >
              <Download className="h-4 w-4" />
              <span className="hidden md:inline">INSTALAR NA TELA</span>
              <span className="md:hidden">APP</span>
            </button>

            {user && (
              <>
                {/* Botão de Venda Rápida (PDV) */}
                {onOpenPOS && (
                  <button
                    onClick={onOpenPOS}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#e51b24] to-[#b81018] px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-red-950/40 hover:brightness-110 active:scale-95 transition-all"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span className="hidden sm:inline">VENDER (PDV)</span>
                    <span className="sm:hidden">PDV</span>
                  </button>
                )}

                {/* CARD DE PERFIL */}
                <div className={`hidden sm:flex items-center gap-2 rounded-xl border px-2.5 py-1 text-xs ${
                  isAdmin 
                    ? 'border-[#f99b1c]/40 bg-[#f99b1c]/10 text-white' 
                    : 'border-[#1e3256] bg-[#111d33] text-slate-300'
                }`}>
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full font-black text-xs ${
                    isAdmin ? 'bg-[#f99b1c] text-slate-950' : 'bg-[#004b9a] text-white'
                  }`}>
                    {isAdmin ? <Crown className="h-3.5 w-3.5" /> : user.nome.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex flex-col">
                    <span className="font-bold text-white max-w-[110px] truncate leading-tight">
                      {user.nome}
                    </span>
                    <span className={`text-[9px] font-bold ${
                      isAdmin ? 'text-[#f99b1c]' : 'text-blue-400'
                    }`}>
                      {isAdmin ? 'DONO' : 'FUNCIONÁRIO'}
                    </span>
                  </div>
                </div>

                {/* SAIR */}
                <button
                  onClick={onLogout}
                  title="Sair da conta"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#1e3256] bg-[#111d33] text-slate-400 hover:border-red-600/60 hover:bg-red-950/40 hover:text-red-400 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
