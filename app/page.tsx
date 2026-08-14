'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import POSModal from '@/components/POSModal';
import { Product, Sale } from '@/lib/db';
import { 
  DollarSign, 
  Battery, 
  ShoppingBag, 
  Wrench,
  ShieldCheck, 
  Tag,
  Download,
  Printer,
  Calendar,
  User,
  QrCode,
  CreditCard,
  Banknote,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

export default function DashboardPage() {
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPOSOpen, setIsPOSOpen] = useState(false);
  const [periodoFilter, setPeriodoFilter] = useState<'HOJE' | '7DIAS' | 'MES' | 'TODOS'>('TODOS');

  const fetchDashboardData = async () => {
    try {
      const [resMe, resProds, resSales] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/produtos'),
        fetch('/api/vendas')
      ]);

      if (resMe.ok) {
        const dataMe = await resMe.json();
        setSessionUser(dataMe.user || dataMe);
      }
      
      if (resProds.ok) {
        const dataProds = await resProds.json();
        if (Array.isArray(dataProds)) setProducts(dataProds);
        else if (Array.isArray(dataProds.products)) setProducts(dataProds.products);
      }
      
      if (resSales.ok) {
        const dataSales = await resSales.json();
        if (Array.isArray(dataSales)) setSales(dataSales);
        else if (Array.isArray(dataSales.sales)) setSales(dataSales.sales);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 3000);

    const handleFocus = () => fetchDashboardData();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const isAdmin = sessionUser?.role === 'ADMIN';

  // Garantir que prods e sales sejam arrays defensivos
  const safeProducts = Array.isArray(products) ? products : [];
  const safeSales = Array.isArray(sales) ? sales : [];

  // Filtragem de Vendas por Período
  const now = new Date();
  const salesFiltradas = safeSales.filter(s => {
    const saleDate = new Date(s.dataVenda);
    if (periodoFilter === 'HOJE') {
      return saleDate.toDateString() === now.toDateString();
    }
    if (periodoFilter === '7DIAS') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return saleDate >= sevenDaysAgo;
    }
    if (periodoFilter === 'MES') {
      return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // Métricas de Estoque
  const totalBateriasNovas = safeProducts.filter(p => p.tipo === 'NOVA').reduce((acc, p) => acc + (p.estoque || 0), 0);
  const totalBateriasSemiNovas = safeProducts.filter(p => p.tipo === 'SEMI_NOVA').reduce((acc, p) => acc + (p.estoque || 0), 0);

  // Estoque por Marca
  const marcasPrincipais = ['MOURA', 'HELIAR', 'BOSCH', 'KONDOR', 'ELETRAN', 'ZETTA', 'PIONEIRO', 'ONBAT'];
  const contagemPorMarca = marcasPrincipais.map(marca => {
    const total = safeProducts
      .filter(p => p.marca && p.marca.toUpperCase().includes(marca))
      .reduce((acc, p) => acc + (p.estoque || 0), 0);
    return { marca, total };
  });

  // Métricas Financeiras
  const totalFaturamento = salesFiltradas.reduce((acc, s) => acc + (s.total || 0), 0);
  const totalInstalacao = salesFiltradas.reduce((acc, s) => acc + (s.valorInstalacao || 0), 0);
  const totalComissoes = salesFiltradas.reduce((acc, s) => acc + (s.valorComissao || 0), 0);
  
  // Agrupamento de Comissões por Funcionário para o Painel do Dono
  const comissoesPorFuncionarioMap = new Map<string, {
    nome: string;
    totalVendas: number;
    totalComissao: number;
    motosCount: number;
    carrosCount: number;
    caminhoesCount: number;
    outrosCount: number;
  }>();

  salesFiltradas.forEach(s => {
    const nome = s.usuarioNome || 'Balcão';
    if (!comissoesPorFuncionarioMap.has(nome)) {
      comissoesPorFuncionarioMap.set(nome, {
        nome,
        totalVendas: 0,
        totalComissao: 0,
        motosCount: 0,
        carrosCount: 0,
        caminhoesCount: 0,
        outrosCount: 0
      });
    }
    const info = comissoesPorFuncionarioMap.get(nome)!;
    info.totalVendas += 1;
    const val = s.valorComissao || 0;
    if (val > 0) {
      info.totalComissao += val;
      const tipo = (s.tipoComissao || '').toLowerCase();
      if (tipo.includes('moto')) info.motosCount += 1;
      else if (tipo.includes('carro')) info.carrosCount += 1;
      else if (tipo.includes('caminhão') || tipo.includes('caminhao')) info.caminhoesCount += 1;
      else info.outrosCount += 1;
    }
  });

  const resumoComissoes = Array.from(comissoesPorFuncionarioMap.values());

  // Lucro líquido estimado (Apenas ADMIN)
  let lucroTotal = 0;
  salesFiltradas.forEach(sale => {
    let custoVenda = 0;
    if (Array.isArray(sale.itens)) {
      sale.itens.forEach(item => {
        const prod = safeProducts.find(p => p.id === item.produtoId);
        if (prod) {
          custoVenda += (prod.precoCusto || 0) * item.quantidade;
        }
      });
    }
    lucroTotal += ((sale.total || 0) - custoVenda);
  });

  // Função para baixar o relatório em Excel / CSV
  const handleExportCSV = () => {
    if (salesFiltradas.length === 0) {
      alert('Nenhuma venda para exportar no período selecionado.');
      return;
    }

    const headers = ['Codigo Venda', 'Data Hora', 'Vendedor', 'Cliente', 'Forma Pagamento', 'Subtotal', 'Comissao Funcionario', 'Tipo Comissao', 'Desconto', 'Total Pago', 'Lucro Estimado'];
    
    const rows = salesFiltradas.map(s => {
      let custoVenda = 0;
      if (Array.isArray(s.itens)) {
        s.itens.forEach(item => {
          const prod = safeProducts.find(p => p.id === item.produtoId);
          if (prod) custoVenda += (prod.precoCusto || 0) * item.quantidade;
        });
      }
      const lucro = (s.total || 0) - custoVenda;

      return [
        s.codigoVenda,
        new Date(s.dataVenda).toLocaleString('pt-BR'),
        `"${s.usuarioNome}"`,
        `"${s.clienteNome || 'Balcao'}"`,
        s.formaPagamento,
        (s.subtotal || 0).toFixed(2),
        (s.valorComissao || 0).toFixed(2),
        `"${s.tipoComissao || 'Nenhuma'}"`,
        (s.desconto || 0).toFixed(2),
        (s.total || 0).toFixed(2),
        lucro.toFixed(2)
      ].join(';');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_vendas_jmix_${periodoFilter.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#060b14] text-slate-100 flex flex-col font-sans">
      <Navbar sessionUser={sessionUser} onOpenPOS={() => setIsPOSOpen(true)} />

      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar user={sessionUser} activePath="/" />

        <main className="flex-1 p-4 md:p-8 space-y-6">
          
          {/* Banner de Boas Vindas e Ações Rápida */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-[#1e3256] bg-gradient-to-r from-[#0a1120] via-[#111d33] to-[#0a1120] p-6 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-[#004b9a]/30 px-2.5 py-1 text-xs font-black text-[#4491e0] border border-[#004b9a]/50 uppercase">
                  {isAdmin ? 'PAINEL EXECUÇÃO DO DONO (ADMIN)' : 'PAINEL DO FUNCIONÁRIO / BALCÃO'}
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-2">
                JMix Baterias 24h
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Acompanhamento em tempo real de vendas, relatórios financeiros e estoque da loja.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setIsPOSOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004b9a] via-[#0262c7] to-[#004b9a] px-5 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-[#004b9a]/40 hover:brightness-110 active:scale-95 transition-all"
              >
                <ShoppingBag className="h-5 w-5 text-amber-300" />
                <span>+ NOVA VENDA</span>
              </button>
            </div>
          </div>

          {/* BARRA DE FILTRO POR PERÍODO E BOTÕES DE DOWNLOAD DE RELATÓRIO */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0a1120] p-4 rounded-2xl border border-[#1e3256] shadow-lg">
            
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <Calendar className="h-4 w-4 text-slate-400 mr-1" />
              <span className="text-xs font-bold text-slate-300 mr-2">Filtrar:</span>
              {[
                { key: 'HOJE', label: 'Hoje' },
                { key: '7DIAS', label: 'Últimos 7 dias' },
                { key: 'MES', label: 'Este Mês' },
                { key: 'TODOS', label: 'Tudo (Geral)' }
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setPeriodoFilter(item.key as any)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all ${
                    periodoFilter === item.key
                      ? 'bg-[#004b9a] text-white shadow-md'
                      : 'bg-[#111d33] text-slate-400 hover:text-white border border-[#1e3256]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl border border-emerald-600/40 bg-emerald-950/40 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-900/60 transition-all"
                title="Exportar Vendas para Planilha Excel CSV"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>BAIXAR EXCEL</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl border border-[#1e3256] bg-[#111d33] px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-all"
                title="Imprimir Relatório ou Salvar em PDF"
              >
                <Printer className="h-4 w-4" />
                <span>IMPRIMIR / PDF</span>
              </button>
            </div>

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
              <p className="text-[11px] text-slate-400 mt-1">Prontas no estoque</p>
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
              <p className="text-[11px] text-slate-400 mt-1">Com garantia de balcão</p>
            </div>

            {/* Card 3: Faturamento Bruto */}
            <div className="rounded-2xl border border-[#1e3256] bg-[#0a1120] p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Faturamento ({periodoFilter})</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              {isAdmin ? (
                <>
                  <p className="text-2xl md:text-3xl font-black text-emerald-400 mt-3">R$ {totalFaturamento.toFixed(2)}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{salesFiltradas.length} vendas registradas</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-black text-slate-300 mt-3">{salesFiltradas.length} <span className="text-xs font-normal text-slate-400">vendas</span></p>
                  <p className="text-[11px] text-[#004b9a] font-bold mt-1">Registradas no balcão</p>
                </>
              )}
            </div>

            {/* Card 4: Comissões a Pagar aos Funcionários */}
            <div className="rounded-2xl border border-[#1e3256] bg-[#0a1120] p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Comissões a Pagar</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 font-bold">
                  💰
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-black text-purple-400 mt-3">R$ {totalComissoes.toFixed(2)}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                {salesFiltradas.filter(s => (s.valorComissao || 0) > 0).length} comissões no período
              </p>
            </div>

          </div>

          {/* DADOS EXCLUSIVOS FINANCEIROS DO DONO (ADMIN) */}
          {isAdmin && (
            <div className="rounded-2xl border border-emerald-900/60 bg-emerald-950/20 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ShieldCheck className="h-6 w-6" />
                  <h2 className="text-lg font-black text-white">Relatório de Lucratividade & Margens (Exclusivo Dono)</h2>
                </div>
                <span className="text-xs text-slate-400 font-bold uppercase">Período: {periodoFilter}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-emerald-800/60 bg-[#0a1120] p-4">
                  <p className="text-xs font-bold text-slate-400">Lucro Líquido Estimado</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">R$ {lucroTotal.toFixed(2)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Descontando preço de custo dos fornecedores</p>
                </div>

                <div className="rounded-xl border border-emerald-800/60 bg-[#0a1120] p-4">
                  <p className="text-xs font-bold text-slate-400">Margem Média Bruta da Loja</p>
                  <p className="text-2xl font-black text-teal-300 mt-1">
                    {totalFaturamento > 0 ? ((lucroTotal / totalFaturamento) * 100).toFixed(1) : '0'}%
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Retorno comercial de margem</p>
                </div>

                <div className="rounded-xl border border-emerald-800/60 bg-[#0a1120] p-4">
                  <p className="text-xs font-bold text-slate-400">Serviços de Mão de Obra</p>
                  <p className="text-2xl font-black text-purple-400 mt-1">R$ {totalInstalacao.toFixed(2)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Entrada direta de serviços de rua/balcão</p>
                </div>
              </div>
            </div>
          )}

          {/* PAINEL DE COMISSÕES DOS FUNCIONÁRIOS (ACERTO DO DONO) */}
          <div className="rounded-2xl border border-purple-900/60 bg-purple-950/20 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-purple-900/40 pb-3 gap-2">
              <div className="flex items-center gap-2 text-purple-300">
                <span className="text-xl">💰</span>
                <div>
                  <h2 className="text-lg font-black text-white">Relatório de Comissões dos Funcionários</h2>
                  <p className="text-xs text-slate-400">Acerto do dono com colaboradores (Moto R$ 30, Carro R$ 35, Caminhão R$ 45)</p>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-300 bg-purple-950/80 border border-purple-800 px-3 py-1 rounded-xl">
                Total a Pagar: R$ {totalComissoes.toFixed(2)}
              </span>
            </div>

            {resumoComissoes.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Nenhuma venda registrada com comissão neste período.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resumoComissoes.map(f => (
                  <div key={f.nome} className="rounded-xl border border-purple-900/50 bg-[#0a1120] p-4 space-y-2 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-sm">{f.nome}</span>
                      <span className="rounded bg-purple-900/60 px-2.5 py-1 text-xs font-black text-purple-300 border border-purple-700">
                        R$ {f.totalComissao.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 space-y-1.5 pt-2 border-t border-[#1e3256]">
                      <p>Vendas Realizadas: <strong className="text-white">{f.totalVendas}</strong></p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {f.motosCount > 0 && (
                          <span className="bg-[#111d33] px-2 py-0.5 rounded text-[10px] font-bold text-purple-300 border border-purple-900">
                            🛵 {f.motosCount}x Moto (R$ {f.motosCount * 30})
                          </span>
                        )}
                        {f.carrosCount > 0 && (
                          <span className="bg-[#111d33] px-2 py-0.5 rounded text-[10px] font-bold text-purple-300 border border-purple-900">
                            🚗 {f.carrosCount}x Carro (R$ {f.carrosCount * 35})
                          </span>
                        )}
                        {f.caminhoesCount > 0 && (
                          <span className="bg-[#111d33] px-2 py-0.5 rounded text-[10px] font-bold text-purple-300 border border-purple-900">
                            🚛 {f.caminhoesCount}x Caminhão (R$ {f.caminhoesCount * 45})
                          </span>
                        )}
                        {f.outrosCount > 0 && (
                          <span className="bg-[#111d33] px-2 py-0.5 rounded text-[10px] font-bold text-purple-300 border border-purple-900">
                            🏷️ {f.outrosCount}x Outras
                          </span>
                        )}
                        {f.motosCount === 0 && f.carrosCount === 0 && f.caminhoesCount === 0 && f.outrosCount === 0 && (
                          <span className="text-[10px] text-slate-500 italic">Sem comissões acumuladas</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CONTAGEM DIRETA DE ESTOQUE POR MARCA */}
          <div className="rounded-2xl border border-[#1e3256] bg-[#0a1120] p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4">Estoque Atual em Tempo Real por Marca</h2>
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

          {/* RELATÓRIO DE VENDAS COMPLETO */}
          <div className="rounded-2xl border border-[#1e3256] bg-[#0a1120] p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1e3256] pb-4 gap-2">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  Relatório de Vendas ({salesFiltradas.length} vendas encontradas)
                </h2>
                <p className="text-xs text-slate-400">Atualização em tempo real ativada ao focar o app.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="rounded-xl border border-emerald-700 bg-emerald-950/60 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900 transition-all flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>BAIXAR RELATÓRIO CSV</span>
                </button>
              </div>
            </div>

            {salesFiltradas.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">Nenhuma venda registrada neste período.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#111d33] uppercase text-slate-300 font-bold border-b border-[#1e3256]">
                    <tr>
                      <th className="px-4 py-3">Código</th>
                      <th className="px-4 py-3">Data / Hora</th>
                      <th className="px-4 py-3">Vendedor</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Pagamento</th>
                      <th className="px-4 py-3">Comissão Func.</th>
                      <th className="px-4 py-3 text-right">Total Pago</th>
                      {isAdmin && <th className="px-4 py-3 text-right">Lucro Estimado</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e3256]/60">
                    {salesFiltradas.map(venda => {
                      let custoVenda = 0;
                      if (Array.isArray(venda.itens)) {
                        venda.itens.forEach(item => {
                          const prod = safeProducts.find(p => p.id === item.produtoId);
                          if (prod) custoVenda += (prod.precoCusto || 0) * item.quantidade;
                        });
                      }
                      const lucroVenda = (venda.total || 0) - custoVenda;

                      return (
                        <tr key={venda.id} className="hover:bg-[#111d33]/50 transition-colors">
                          <td className="px-4 py-3 font-extrabold text-white">{venda.codigoVenda}</td>
                          <td className="px-4 py-3 text-slate-400">
                            {new Date(venda.dataVenda).toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-200">{venda.usuarioNome}</td>
                          <td className="px-4 py-3 text-slate-300">{venda.clienteNome || 'Balcão'}</td>
                          <td className="px-4 py-3">
                            <span className="rounded bg-[#111d33] px-2 py-0.5 font-bold text-emerald-400 border border-[#1e3256]">
                              {venda.formaPagamento}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-purple-400 font-semibold">
                            {(venda.valorComissao || 0) > 0 ? (
                              <span className="rounded bg-purple-950 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-800">
                                R$ {venda.valorComissao?.toFixed(2)} ({venda.tipoComissao || 'Outro'})
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-black text-emerald-400 text-sm">
                            R$ {(venda.total || 0).toFixed(2)}
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-3 text-right font-black text-teal-300">
                              R$ {lucroVenda.toFixed(2)}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
