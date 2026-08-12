'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import POSModal from '@/components/POSModal';
import { Product, Sale, User } from '@/lib/db';
import { 
  DollarSign, 
  TrendingUp, 
  Battery, 
  ShoppingBag, 
  Users, 
  AlertTriangle, 
  ArrowUpRight, 
  ShieldCheck, 
  Wrench,
  BarChart2,
  Tag
} from 'lucide-react';

export default function DashboardPage() {
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPOSOpen, setIsPOSOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [resMe, resProds, resSales] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/produtos'),
        fetch('/api/vendas')
      ]);

      if (resMe.ok) setSessionUser(await resMe.json());
      if (resProds.ok) setProducts(await resProds.json());
      if (resSales.ok) setSales(await resSales.json());
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 3000);
    return () => clearInterval(interval);
  }, []);

  const isAdmin = sessionUser?.role === 'ADMIN';

  // Métricas de Estoque
  const totalBateriasNovas = products.filter(p => p.tipo === 'NOVA').reduce((acc, p) => acc + p.estoque, 0);
  const totalBateriasSemiNovas = products.filter(p => p.tipo === 'SEMI_NOVA').reduce((acc, p) => acc + p.estoque, 0);
  const estoquesCriticos = products.filter(p => p.estoque <= p.estoqueMinimo);

  // Estoque por Marca
  const marcasPrincipais = ['MOURA', 'HELIAR', 'BOSCH', 'KONDOR', 'ELETRAN', 'ZETTA', 'PIONEIRO', 'ONBAT'];
  const contagemPorMarca = marcasPrincipais.map(marca => {
    const total = products
      .filter(p => p.marca.toUpperCase().includes(marca))
      .reduce((acc, p) => acc + p.estoque, 0);
    return { marca, total };
  });

  // Métricas Financeiras para o DONO (ADMIN)
  const totalFaturamento = sales.reduce((acc, s) => acc + s.total, 0);
  const totalInstalacao = sales.reduce((acc, s) => acc + (s.valorInstalacao || 0), 0);
  
  // Lucro líquido estimado (Apenas ADMIN)
  let lucroTotal = 0;
  if (isAdmin) {
    sales.forEach(sale => {
      let custoVenda = 0;
      sale.itens.forEach(item => {
        const prod = products.find(p => p.id === item.produtoId);
        if (prod) {
          custoVenda += prod.precoCusto * item.quantidade;
        }
      });
      lucroTotal += (sale.total - custoVenda);
    });
  }

  return (
    <div className="min-h-screen bg-[#060b14] text-slate-100 flex flex-col font-sans">
      <Navbar sessionUser={sessionUser} onOpenPOS={() => setIsPOSOpen(true)} />

      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar user={sessionUser} activePath="/" />

        <main className="flex-1 p-4 md:p-8 space-y-6">
          
          {/* Banner de Boas Vindas */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-[#1e3256] bg-gradient-to-r from-[#0a1120] via-[#111d33] to-[#0a1120] p-6 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-[#004b9a]/30 px-2.5 py-1 text-xs font-black text-[#4491e0] border border-[#004b9a]/50 uppercase">
                  {isAdmin ? 'PAINEL DO DONO / ADMINISTRADOR' : 'PAINEL DO FUNCIONÁRIO / BALCÃO'}
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-2">
                Bem-vindo, {sessionUser?.nome || 'Colaborador'}!
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Controle de estoque, vendas em tempo real e faturamento da JMix Baterias 24h.
              </p>
            </div>

            <button
              onClick={() => setIsPOSOpen(true)}
              className="w-full md:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004b9a] via-[#0262c7] to-[#004b9a] px-6 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-[#004b9a]/40 hover:brightness-110 active:scale-95 transition-all"
            >
              <ShoppingBag className="h-5 w-5 text-amber-300" />
              <span>NOVA VENDA BALCÃO</span>
            </button>
          </div>

          {/* CARDS DE RESUMO DIRETO DE ESTOQUE E FINANÇAS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Baterias Novas */}
            <div className="rounded-2xl border border-[#1e3256] bg-[#0a1120] p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Baterias Novas</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                  <Battery className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-black text-white mt-3">{totalBateriasNovas} <span className="text-xs font-normal text-slate-400">unidades</span></p>
              <p className="text-[11px] text-slate-400 mt-1">Prontas para venda e instalação</p>
            </div>

            {/* Card 2: Semi-Novas */}
            <div className="rounded-2xl border border-[#1e3256] bg-[#0a1120] p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Semi-Novas</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                  <Tag className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-black text-white mt-3">{totalBateriasSemiNovas} <span className="text-xs font-normal text-slate-400">unidades</span></p>
              <p className="text-[11px] text-slate-400 mt-1">Recondicionadas / Com garantia</p>
            </div>

            {/* Card 3: Faturamento Bruto (Apenas DONO/ADMIN vê valor financeiro) */}
            <div className="rounded-2xl border border-[#1e3256] bg-[#0a1120] p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Faturamento Bruto</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              {isAdmin ? (
                <>
                  <p className="text-2xl md:text-3xl font-black text-emerald-400 mt-3">R$ {totalFaturamento.toFixed(2)}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{sales.length} vendas registradas</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-black text-slate-300 mt-3">{sales.length} <span className="text-xs font-normal text-slate-400">vendas</span></p>
                  <p className="text-[11px] text-[#004b9a] font-bold mt-1">Registradas no balcão</p>
                </>
              )}
            </div>

            {/* Card 4: Taxas de Instalação (Apenas DONO vê total de mão de obra) */}
            <div className="rounded-2xl border border-[#1e3256] bg-[#0a1120] p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Instalações</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                  <Wrench className="h-5 w-5" />
                </div>
              </div>
              {isAdmin ? (
                <>
                  <p className="text-2xl md:text-3xl font-black text-purple-400 mt-3">R$ {totalInstalacao.toFixed(2)}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Mão de obra acumulada</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-black text-purple-400 mt-3">
                    {sales.filter(s => (s.valorInstalacao || 0) > 0).length} <span className="text-xs font-normal text-slate-400">serviços</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Instalações em veículos</p>
                </>
              )}
            </div>

          </div>

          {/* DADOS EXCLUSIVOS FINANCEIROS DO DONO (ADMIN) */}
          {isAdmin && (
            <div className="rounded-2xl border border-emerald-900/60 bg-emerald-950/20 p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="h-6 w-6" />
                <h2 className="text-lg font-black text-white">Resumo Lucrativo & Margens (Exclusivo Dono)</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-emerald-800/60 bg-[#0a1120] p-4">
                  <p className="text-xs font-bold text-slate-400">Lucro Líquido Estimado</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">R$ {lucroTotal.toFixed(2)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Descontando preço de custo dos fornecedores</p>
                </div>

                <div className="rounded-xl border border-emerald-800/60 bg-[#0a1120] p-4">
                  <p className="text-xs font-bold text-slate-400">Margem Média da Loja</p>
                  <p className="text-2xl font-black text-teal-300 mt-1">
                    {totalFaturamento > 0 ? ((lucroTotal / totalFaturamento) * 100).toFixed(1) : '0'}%
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Retorno de margem bruta comercial</p>
                </div>

                <div className="rounded-xl border border-emerald-800/60 bg-[#0a1120] p-4">
                  <p className="text-xs font-bold text-slate-400">Total de Instalações Realizadas</p>
                  <p className="text-2xl font-black text-purple-400 mt-1">R$ {totalInstalacao.toFixed(2)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Entrada direta de serviços de rua/balcão</p>
                </div>
              </div>
            </div>
          )}

          {/* CONTAGEM DIRETA DE ESTOQUE POR MARCA */}
          <div className="rounded-2xl border border-[#1e3256] bg-[#0a1120] p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4">Estoque Atual por Marca Principal</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {contagemPorMarca.map(m => (
                <div key={m.marca} className="flex items-center justify-between rounded-xl border border-[#1e3256] bg-[#111d33] p-3.5">
                  <span className="font-extrabold text-sm text-slate-200">{m.marca}</span>
                  <span className="rounded-lg bg-[#004b9a] px-3 py-1 text-xs font-black text-white">
                    {m.total} un
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ÚLTIMAS VENDAS REGISTRADAS */}
          <div className="rounded-2xl border border-[#1e3256] bg-[#0a1120] p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#1e3256] pb-4 mb-4">
              <h2 className="text-lg font-bold text-white">Vendas Recentes no Balcão</h2>
              <span className="text-xs text-slate-400">Atualização em tempo real (3s)</span>
            </div>

            {sales.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Nenhuma venda registrada ainda hoje.</p>
            ) : (
              <div className="divide-y divide-[#1e3256]">
                {sales.slice(0, 5).map(venda => (
                  <div key={venda.id} className="py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{venda.codigoVenda}</span>
                        <span className="rounded bg-[#111d33] px-2 py-0.5 font-semibold text-slate-300 border border-[#1e3256]">
                          {venda.formaPagamento}
                        </span>
                        {venda.valorInstalacao > 0 && (
                          <span className="rounded bg-purple-950 px-2 py-0.5 font-bold text-purple-300 border border-purple-800">
                            + Instalação R$ {venda.valorInstalacao.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 mt-1">
                        Vendido por: <strong className="text-slate-200">{venda.usuarioNome}</strong> para {venda.clienteNome}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-400">R$ {venda.total.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(venda.dataVenda).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </main>
      </div>

      <POSModal
        isOpen={isPOSOpen}
        onClose={() => setIsPOSOpen(false)}
        usuario={sessionUser}
        onSaleSuccess={fetchDashboardData}
      />
    </div>
  );
}
