'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import POSModal from '@/components/POSModal';
import { SessionUser } from '@/lib/auth';
import { Sale } from '@/lib/db';
import {
  ShoppingBag,
  Search,
  Filter,
  User,
  QrCode,
  CreditCard,
  Banknote,
  Recycle,
  Calendar,
  Zap,
  Wrench
} from 'lucide-react';

export default function VendasPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [filtroForma, setFiltroForma] = useState('TODAS');
  
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isPOSOpen, setIsPOSOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      const currentUser = data.user || data;
      if (!currentUser || !currentUser.id) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      await fetchSales();
    } catch (err) {
      console.error('Erro ao verificar autenticação:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      const res = await fetch('/api/vendas');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSales(data);
        } else if (Array.isArray(data.sales)) {
          setSales(data.sales);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar vendas:', err);
    }
  };

  const safeSales = Array.isArray(sales) ? sales : [];

  const filteredSales = safeSales.filter(s => {
    const term = search.toLowerCase();
    const matchesSearch = (
      (s.codigoVenda && s.codigoVenda.toLowerCase().includes(term)) ||
      (s.usuarioNome && s.usuarioNome.toLowerCase().includes(term)) ||
      (s.clienteNome && s.clienteNome.toLowerCase().includes(term))
    );
    const matchesForma = filtroForma === 'TODAS' || s.formaPagamento === filtroForma;
    return matchesSearch && matchesForma;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060b14] text-slate-300 font-bold">
        <Zap className="h-6 w-6 text-[#f99b1c] animate-spin mr-2" />
        <span>Carregando Histórico de Vendas...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b14] text-slate-100 flex flex-col font-sans">
      <Navbar
        sessionUser={user}
        onOpenPOS={() => setIsPOSOpen(true)}
      />

      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar user={user} activePath="/vendas" />

        <main className="flex-1 p-4 md:p-8 space-y-6">
          
          {/* CABEÇALHO */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e3256] pb-6">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <ShoppingBag className="h-7 w-7 text-[#004b9a]" />
                Histórico de Vendas Realizadas
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Consulta detalhada de vendas, instaladores, pagamento e trocas de sucata.
              </p>
            </div>

            <button
              onClick={() => setIsPOSOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004b9a] via-[#0262c7] to-[#004b9a] px-5 py-3 text-sm font-bold text-white shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>NOVA VENDA BALCÃO</span>
            </button>
          </div>

          {/* BUSCA E FILTROS */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#0a1120] p-4 rounded-2xl border border-[#1e3256] shadow-lg">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por código #VND, funcionário ou cliente..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[#1e3256] bg-[#111d33] py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-[#004b9a] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              <Filter className="h-4 w-4 text-slate-400 mr-1" />
              {['TODAS', 'PIX', 'CREDITO', 'DEBITO', 'DINHEIRO'].map(forma => (
                <button
                  key={forma}
                  onClick={() => setFiltroForma(forma)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                    filtroForma === forma
                      ? 'bg-[#004b9a] text-white shadow-md'
                      : 'bg-[#111d33] text-slate-400 hover:text-white border border-[#1e3256]'
                  }`}
                >
                  {forma}
                </button>
              ))}
            </div>
          </div>

          {/* LISTA DE VENDAS */}
          <div className="rounded-2xl border border-[#1e3256] bg-[#0a1120] p-4 space-y-3 shadow-xl">
            {filteredSales.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Nenhuma venda encontrada com os filtros aplicados.
              </div>
            ) : (
              filteredSales.map(sale => (
                <div
                  key={sale.id}
                  onClick={() => setSelectedSale(sale)}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-[#1e3256] bg-[#111d33]/80 p-4 transition-all hover:bg-[#111d33] cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#004b9a]/20 border border-[#004b9a]/40 text-blue-400 font-bold flex-shrink-0">
                      {sale.formaPagamento === 'PIX' && <QrCode className="h-6 w-6 text-emerald-400" />}
                      {sale.formaPagamento === 'CREDITO' && <CreditCard className="h-6 w-6 text-blue-400" />}
                      {sale.formaPagamento === 'DEBITO' && <CreditCard className="h-6 w-6 text-indigo-400" />}
                      {sale.formaPagamento === 'DINHEIRO' && <Banknote className="h-6 w-6 text-amber-400" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-white text-base">{sale.codigoVenda}</span>
                        <span className="rounded bg-[#0a1120] px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-[#1e3256]">
                          {sale.formaPagamento}
                        </span>
                        {(sale.valorComissao || 0) > 0 && (
                          <span className="rounded bg-purple-950 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-800 flex items-center gap-1">
                            💰 Comissão ({sale.tipoComissao || 'Outro'}: R$ {sale.valorComissao?.toFixed(2)})
                          </span>
                        )}
                        {(sale.valorInstalacao || 0) > 0 && (
                          <span className="rounded bg-blue-950 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-800 flex items-center gap-1">
                            <Wrench className="h-3 w-3" /> + Instalação (R$ {sale.valorInstalacao.toFixed(2)})
                          </span>
                        )}
                        {sale.valorTrocaSucata > 0 && (
                          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Recycle className="h-3 w-3" /> com Troca
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-white">
                          <User className="h-3.5 w-3.5 text-blue-400" />
                          Vendedor: {sale.usuarioNome}
                        </span>
                        <span>•</span>
                        <span>Cliente: {sale.clienteNome || 'Balcão'}</span>
                      </p>

                      {Array.isArray(sale.itens) && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {sale.itens.map(item => (
                            <span key={item.id} className="rounded bg-[#0a1120] px-2 py-0.5 text-[11px] text-slate-300 border border-[#1e3256]">
                              {item.quantidade}x {item.produtoNome} (R$ {item.precoUnitario.toFixed(2)})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right border-t md:border-t-0 border-[#1e3256] pt-2 md:pt-0">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total da Venda</span>
                    <div className="text-xl font-black text-emerald-400">
                      R$ {sale.total.toFixed(2)}
                    </div>
                    {sale.valorTrocaSucata > 0 && (
                      <span className="text-[11px] text-amber-400 font-semibold block">
                        Troca Bateria: -R$ {sale.valorTrocaSucata.toFixed(2)}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {new Date(sale.dataVenda).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

        </main>
      </div>

      {/* MODAL DETALHES DA VENDA */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[#1e3256] bg-[#0a1120] p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1e3256] pb-3">
              <h3 className="font-extrabold text-lg">Comprovante {selectedSale.codigoVenda}</h3>
              <button onClick={() => setSelectedSale(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <p><strong>Vendedor / Colaborador:</strong> {selectedSale.usuarioNome}</p>
              <p><strong>Cliente:</strong> {selectedSale.clienteNome} {selectedSale.clienteContato && `(${selectedSale.clienteContato})`}</p>
              <p><strong>Forma de Pagamento:</strong> {selectedSale.formaPagamento}</p>
              <p><strong>Data/Hora:</strong> {new Date(selectedSale.dataVenda).toLocaleString('pt-BR')}</p>
              {(selectedSale.valorComissao || 0) > 0 && (
                <p className="text-purple-300 font-bold bg-purple-950/60 p-2 rounded border border-purple-800">
                  💰 Comissão do Funcionário: R$ {selectedSale.valorComissao?.toFixed(2)} ({selectedSale.tipoComissao || 'Outro'})
                  <span className="block text-[10px] text-slate-400 font-normal mt-0.5">* Apenas informativa (não afeta o total cobrado do cliente)</span>
                </p>
              )}
              
              <div className="border-t border-[#1e3256] pt-2">
                <strong className="block mb-1">Itens Vendidos:</strong>
                {Array.isArray(selectedSale.itens) && selectedSale.itens.map(item => (
                  <div key={item.id} className="flex justify-between py-1 border-b border-[#1e3256]/50">
                    <span>{item.quantidade}x {item.produtoNome}</span>
                    <span className="font-bold">R$ {item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-right space-y-1">
                <p>Subtotal Baterias: R$ {selectedSale.subtotal.toFixed(2)}</p>
                {(selectedSale.valorInstalacao || 0) > 0 && (
                  <p className="text-blue-400">+ Taxa de Instalação: R$ {selectedSale.valorInstalacao.toFixed(2)}</p>
                )}
                {selectedSale.valorTrocaSucata > 0 && (
                  <p className="text-amber-400">Abatimento Troca Bateria: -R$ {selectedSale.valorTrocaSucata.toFixed(2)}</p>
                )}
                {selectedSale.desconto > 0 && (
                  <p className="text-slate-400">Desconto Extra: -R$ {selectedSale.desconto.toFixed(2)}</p>
                )}
                <p className="text-base font-black text-emerald-400 pt-1">Total PAGO: R$ {selectedSale.total.toFixed(2)}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedSale(null)}
              className="w-full rounded-xl bg-[#004b9a] py-2.5 text-xs font-bold text-white hover:bg-[#0262c7]"
            >
              FECHAR COMPROVANTE
            </button>
          </div>
        </div>
      )}

      <POSModal
        isOpen={isPOSOpen}
        onClose={() => setIsPOSOpen(false)}
        usuario={user}
        onSaleCompleted={fetchSales}
      />
    </div>
  );
}
