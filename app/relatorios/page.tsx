'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import POSModal from '@/components/POSModal';
import { SessionUser } from '@/lib/auth';
import { Sale, AuditLog } from '@/lib/db';
import {
  BarChart3,
  TrendingUp,
  Users,
  ShieldCheck,
  Zap,
  DollarSign,
  History,
  Lock
} from 'lucide-react';

export default function RelatoriosPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [sales, setSales] = useState<Sale[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
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
      if (data.user.role !== 'ADMIN') {
        alert('Acesso restrito a administradores.');
        router.push('/');
        return;
      }
      setUser(data.user);
      await loadReports();
    } catch (err) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      const resSales = await fetch('/api/vendas');
      const dataSales = await resSales.json();
      setSales(dataSales.sales || []);

      // Simulação de busca de logs
      setLogs([
        {
          id: 'log-101',
          usuarioId: 'usr-admin-1',
          usuarioNome: 'Gerente JMix',
          acao: 'CONSULTA_RELATORIO',
          detalhes: 'Acesso ao painel gerencial de relatórios.',
          dataHora: new Date().toISOString()
        }
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1120] text-slate-300 font-bold">
        <Zap className="h-6 w-6 text-[#f99b1c] animate-spin mr-2" />
        <span>Carregando Relatórios Gerenciais...</span>
      </div>
    );
  }

  // Faturamento e Ranking
  const faturamentoTotal = sales.reduce((a, c) => a + c.total, 0);
  const totalTrocas = sales.reduce((a, c) => a + c.valorTrocaSucata, 0);

  // Vendas por Funcionário
  const vendasPorFuncionario: { [key: string]: { nome: string; total: number; qtd: number } } = {};
  sales.forEach(s => {
    if (!vendasPorFuncionario[s.usuarioId]) {
      vendasPorFuncionario[s.usuarioId] = { nome: s.usuarioNome, total: 0, qtd: 0 };
    }
    vendasPorFuncionario[s.usuarioId].total += s.total;
    vendasPorFuncionario[s.usuarioId].qtd += 1;
  });

  const rankingFuncionarios = Object.values(vendasPorFuncionario).sort((a, b) => b.total - a.total);

  return (
    <div className="min-h-screen bg-[#0a1120] flex flex-col">
      <Navbar
        user={user}
        onOpenPOS={() => setIsPOSOpen(true)}
        onLogout={async () => {
          await fetch('/api/auth/logout', { method: 'POST' });
          router.push('/login');
        }}
      />

      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar user={user} />

        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
          
          {/* TOPO */}
          <div className="flex items-center justify-between border-b border-[#1e3256] pb-4">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-[#f99b1c]" />
                Relatórios Financeiros & Auditoria
              </h1>
              <p className="text-xs text-slate-400">
                Acesso Exclusivo da Administração (Gerente / Admin).
              </p>
            </div>
            <span className="rounded-full bg-[#f99b1c]/20 px-3 py-1 text-xs font-bold text-[#f99b1c] border border-[#f99b1c]/40 flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" /> ÁREA ADMINISTRATIVA
            </span>
          </div>

          {/* MÉTRICAS CHAVE */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="jmix-glass rounded-2xl p-5 border-emerald-500/30">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Faturamento Bruto Geral</span>
              <div className="text-3xl font-black text-emerald-400 mt-2">
                R$ {faturamentoTotal.toFixed(2)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Total acumulado de vendas</span>
            </div>

            <div className="jmix-glass rounded-2xl p-5 border-amber-500/30">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Créditos em Trocas de Sucata</span>
              <div className="text-3xl font-black text-[#f99b1c] mt-2">
                R$ {totalTrocas.toFixed(2)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Valor concedido aos clientes por baterias velhas</span>
            </div>

            <div className="jmix-glass rounded-2xl p-5 border-blue-500/30">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total de Transações</span>
              <div className="text-3xl font-black text-white mt-2">
                {sales.length} vendas
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Vendas efetuadas no balcão</span>
            </div>
          </div>

          {/* RANKING DE VENDAS POR FUNCIONÁRIO */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div className="jmix-glass rounded-2xl p-5 lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1e3256] pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Desempenho por Funcionário
                </h2>
                <span className="text-xs text-slate-400">Total Vendido</span>
              </div>

              <div className="space-y-3">
                {rankingFuncionarios.map((func, idx) => (
                  <div key={func.nome} className="flex items-center justify-between rounded-xl border border-[#1e3256] bg-[#111d33] p-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full font-black text-xs ${
                        idx === 0 ? 'bg-[#f99b1c] text-slate-950' : 'bg-[#1e3256] text-white'
                      }`}>
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{func.nome}</p>
                        <p className="text-xs text-slate-400">{func.qtd} venda(s) registrada(s)</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-400 block">
                        R$ {func.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AUDIT LOG / REGISTRO AUDITÁVEL DO SISTEMA */}
            <div className="jmix-glass rounded-2xl p-5 lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1e3256] pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-slate-400" />
                  Histórico Auditável do Sistema
                </h2>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 text-xs">
                {sales.map(s => (
                  <div key={s.id} className="rounded-lg border border-[#1e3256] bg-[#0a1120] p-2.5">
                    <div className="flex justify-between font-semibold text-slate-300">
                      <span className="text-[#f99b1c]">VENDA_REGISTRADA</span>
                      <span className="text-slate-500">{new Date(s.dataVenda).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-400 mt-1">
                      Venda {s.codigoVenda} no valor de R$ {s.total.toFixed(2)} por <strong className="text-white">{s.usuarioNome}</strong> ({s.formaPagamento}).
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </main>
      </div>

      <POSModal
        isOpen={isPOSOpen}
        onClose={() => setIsPOSOpen(false)}
        user={user}
        onSaleCompleted={loadReports}
      />
    </div>
  );
}
