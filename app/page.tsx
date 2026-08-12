'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import POSModal from '@/components/POSModal';
import { SessionUser } from '@/lib/auth';
import { Product, Sale } from '@/lib/db';
import {
  Battery,
  AlertTriangle,
  ShoppingCart,
  Zap,
  TrendingUp,
  DollarSign,
  User,
  Sparkles,
  ShieldCheck,
  PackageCheck,
  Flame
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isPOSOpen, setIsPOSOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!data.user) {
        router.push('/login');
        return;
      }
      setUser(data.user);
      await loadDashboardData();
    } catch (err) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const [prodRes, saleRes] = await Promise.all([
        fetch('/api/produtos'),
        fetch('/api/vendas')
      ]);

      const prodData = await prodRes.json();
      const saleData = await saleRes.json();

      setProducts(prodData.products || []);
      setSales(saleData.sales || []);
    } catch (err) {
      console.error('Erro ao carregar dados do painel:', err);
    }
  };

  // POLLING EM TEMPO REAL A CADA 3 SEGUNDOS PARA TODA A EQUIPE
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(loadDashboardData, 3000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1120] text-slate-300 font-bold">
        <Zap className="h-6 w-6 text-[#f99b1c] animate-spin mr-2" />
        <span>Carregando Sistema JMix Baterias 24h...</span>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  // Contagens diretas
  const bateriasNovas = products.filter(p => p.tipo === 'NOVA');
  const bateriasSemiNovas = products.filter(p => p.tipo === 'SEMI_NOVA');

  const totalQtdNovas = bateriasNovas.reduce((acc, p) => acc + p.estoque, 0);
  const totalQtdSemiNovas = bateriasSemiNovas.reduce((acc, p) => acc + p.estoque, 0);

  const hojeStr = new Date().toISOString().split('T')[0];
  const vendasHoje = sales.filter(s => s.dataVenda.startsWith(hojeStr));
  const faturamentoHoje = vendasHoje.reduce((acc, s) => acc + s.total, 0);

  // Alerta de 1 unidade (Crítico)
  const produtosApenas1Un = products.filter(p => p.estoque === 1);
  const produtosEsgotados = products.filter(p => p.estoque === 0);

  // Agrupamento Direto por Marca
  const marcasResumo: { [marca: string]: number } = {};
  bateriasNovas.forEach(p => {
    marcasResumo[p.marca] = (marcasResumo[p.marca] || 0) + p.estoque;
  });

  return (
    <div className="min-h-screen bg-[#0a1120] flex flex-col">
      <Navbar
        user={user}
        onOpenPOS={() => setIsPOSOpen(true)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar user={user} />

        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
          
          {/* TOPO: AVISO TEMPO REAL E BOTÃO DE VENDA */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e3256] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Painel Principal & Estoque em Tempo Real
                </h1>
                {isAdmin ? (
                  <span className="rounded-full bg-[#f99b1c]/20 px-2.5 py-0.5 text-[10px] font-black text-[#f99b1c] border border-[#f99b1c]/40 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> MODO DONO
                  </span>
                ) : (
                  <span className="rounded-full bg-blue-950 px-2.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-800">
                    BALCÃO FUNCIONÁRIO
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Atualização instantânea de vendas e alertas para toda a equipe a cada 3 segundos.
              </p>
            </div>

            <button
              onClick={() => setIsPOSOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e51b24] to-[#b81018] px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-950/50 hover:brightness-110 active:scale-95 transition-all"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>REGISTRAR VENDA RÁPIDA (PDV)</span>
            </button>
          </div>

          {/* PAINEL DE ALERTA DE 1 UNIDADE EM ESTOQUE (PARA TODA A EQUIPE) */}
          {produtosApenas1Un.length > 0 && (
            <div className="rounded-2xl border-2 border-red-600 bg-red-950/50 p-4 text-white shadow-xl animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-black text-red-400">
                  <Flame className="h-5 w-5 fill-current" />
                  <span>ALERTA PARA TODA A EQUIPE: BATERIAS COM APENAS 1 UNIDADE NO ESTOQUE!</span>
                </div>
                <span className="text-xs font-bold bg-red-800 px-2.5 py-1 rounded-lg">CUIDADO NO BALCÃO</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {produtosApenas1Un.map(p => (
                  <div key={p.id} className="rounded-xl border border-red-700 bg-[#0a1120] px-3 py-2 text-xs font-bold flex items-center gap-2">
                    <span className="text-white">{p.marca} {p.modelo} ({p.amperagem}Ah)</span>
                    <span className="text-red-400 font-black">APENAS 1 UN</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MÉTRICAS DE ESTOQUE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* NOVAS */}
            <div className="jmix-glass rounded-2xl p-4 border-[#004b9a]/50 bg-gradient-to-br from-[#111d33] to-[#0a192f]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-blue-400 tracking-wider">Baterias Novas</span>
                <Battery className="h-5 w-5 text-blue-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{totalQtdNovas}</span>
                <span className="text-xs font-semibold text-slate-400">unidades</span>
              </div>
            </div>

            {/* SEMI-NOVAS */}
            <div className="jmix-glass rounded-2xl p-4 border-amber-500/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-[#f99b1c] tracking-wider">Semi-Novas</span>
                <Sparkles className="h-5 w-5 text-[#f99b1c]" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#f99b1c]">{totalQtdSemiNovas}</span>
                <span className="text-xs font-semibold text-slate-400">unidades</span>
              </div>
            </div>

            {/* ALERTAS CRÍTICOS */}
            <div className="jmix-glass rounded-2xl p-4 border-red-500/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-red-400 tracking-wider">Apenas 1 Unidade</span>
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-red-400">{produtosApenas1Un.length}</span>
                <span className="text-xs font-semibold text-slate-400">modelo(s) em risco</span>
              </div>
            </div>

            {/* VENDAS HOJE */}
            <div className="jmix-glass rounded-2xl p-4 border-emerald-500/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                  {isAdmin ? 'Faturamento Hoje' : 'Vendas Hoje'}
                </span>
                <DollarSign className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">
                  R$ {faturamentoHoje.toFixed(2)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {vendasHoje.length} venda(s) efetuada(s)
              </p>
            </div>

          </div>

          {/* TOTAL POR MARCA */}
          <div className="jmix-glass rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#1e3256] pb-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-[#f99b1c]" />
                Estoque por Marca (Novas)
              </h2>
              <span className="text-[11px] font-bold text-slate-400">Total: {totalQtdNovas} un</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {Object.entries(marcasResumo).map(([marca, qtd]) => (
                <div key={marca} className="rounded-xl border border-[#1e3256] bg-[#111d33] p-3 text-center">
                  <span className="text-xs font-bold text-slate-400 block">{marca}</span>
                  <span className="text-xl font-black text-white mt-1 block">{qtd} un</span>
                </div>
              ))}
            </div>
          </div>

          {/* TABELA DE CONSULTA DE ESTOQUE EM TEMPO REAL */}
          <div className="jmix-glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e3256] pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Battery className="h-5 w-5 text-[#004b9a]" />
                Consulta de Estoque em Tempo Real
              </h2>
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                Ao Vivo
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1e3256] text-slate-400 uppercase font-bold text-[10px]">
                    <th className="pb-3 px-2">Tipo</th>
                    <th className="pb-3 px-2">Marca / Modelo</th>
                    <th className="pb-3 px-2">Amperagem</th>
                    <th className="pb-3 px-2">Polo / CCA</th>
                    <th className="pb-3 px-2 text-center">Qtd Estoque</th>
                    <th className="pb-3 px-2">Preço Venda</th>
                    {isAdmin && <th className="pb-3 px-2 text-[#f99b1c]">Preço Custo (Dono)</th>}
                    <th className="pb-3 px-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e3256]/60">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-[#182846]/40 transition-colors">
                      <td className="py-3 px-2">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${
                          p.tipo === 'NOVA'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {p.tipo}
                        </span>
                      </td>

                      <td className="py-3 px-2 font-bold text-white">
                        {p.marca} <span className="text-[#f99b1c]">{p.modelo}</span>
                        <span className="block text-[10px] text-slate-400 font-normal">{p.aplicacao}</span>
                      </td>

                      <td className="py-3 px-2 font-black text-slate-200">
                        {p.amperagem}Ah ({p.voltagem})
                      </td>

                      <td className="py-3 px-2 text-slate-400">
                        {p.polo} • CCA {p.cca}
                      </td>

                      <td className="py-3 px-2 text-center">
                        <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-black ${
                          p.estoque === 1
                            ? 'bg-red-950 text-red-400 border-2 border-red-600 animate-bounce'
                            : p.estoque === 0
                            ? 'bg-slate-800 text-slate-500 border border-slate-700'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}>
                          {p.estoque === 1 ? '🔥 APENAS 1 UN' : p.estoque === 0 ? 'ESGOTADO' : `${p.estoque} un`}
                        </span>
                      </td>

                      <td className="py-3 px-2 font-black text-emerald-400 text-sm">
                        R$ {p.precoVenda.toFixed(2)}
                      </td>

                      {isAdmin && (
                        <td className="py-3 px-2 font-bold text-[#f99b1c]">
                          R$ {p.precoCusto.toFixed(2)}
                        </td>
                      )}

                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => setIsPOSOpen(true)}
                          disabled={p.estoque <= 0}
                          className="rounded-lg bg-[#e51b24] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-red-700 disabled:bg-slate-700 shadow-sm"
                        >
                          VENDER
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </main>
      </div>

      <POSModal
        isOpen={isPOSOpen}
        onClose={() => setIsPOSOpen(false)}
        user={user}
        onSaleCompleted={loadDashboardData}
      />
    </div>
  );
}
