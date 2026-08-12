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
  Zap
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
      const data = await res.json();
      if (!data.user) {
        router.push('/login');
        return;
      }
      setUser(data.user);
      await fetchSales();
    } catch (err) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      const res = await fetch('/api/vendas');
      const data = await res.json();
      setSales(data.sales || []);
    } catch (err) {
      console.error('Erro ao buscar vendas:', err);
    }
  };

  const filteredSales = sales.filter(s => {
    const term = search.toLowerCase();
    const matchesSearch = (
      s.codigoVenda.toLowerCase().includes(term) ||
      s.usuarioNome.toLowerCase().includes(term) ||
      (s.clienteNome && s.clienteNome.toLowerCase().includes(term))
    );
    const matchesForma = filtroForma === 'TODAS' || s.formaPagamento === filtroForma;
    return matchesSearch && matchesForma;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1120] text-slate-300 font-bold">
        <Zap className="h-6 w-6 text-[#f99b1c] animate-spin mr-2" />
        <span>Carregando Histórico de Vendas...</span>
      </div>
    );
  }

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
          
          {/* CABEÇALHO */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e3256] pb-4">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <ShoppingBag className="h-6 w-6 text-[#e51b24]" />
                Histórico de Vendas Realizadas
              </h1>
              <p className="text-xs text-slate-400">
                Consulta detalhada de quem vendeu, formas de pagamento, trocas de sucatas e comprovantes de balcão.
              </p>
            </div>

            <button
              onClick={() => setIsPOSOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e51b24] to-[#b81018] px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>NOVA VENDA (PDV)</span>
            </button>
          </div>

          {/* BUSCA E FILTROS */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#111d33] p-3 rounded-2xl border border-[#1e3256]">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por código #VND, funcionário ou cliente..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[#1e3256] bg-[#0a1120] py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-[#004b9a] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              <Filter className="h-4 w-4 text-slate-400 mr-1" />
              {['TODAS', 'PIX', 'CREDITO', 'DEBITO', 'DINHEIRO'].map(forma => (
                <button
                  key={forma}
                  onClick={() => setFiltroForma(forma)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    filtroForma === forma
                      ? 'bg-[#004b9a] text-white shadow'
                      : 'bg-[#0a1120] text-slate-400 hover:text-white border border-[#1e3256]'
                  }`}
                >
                  {forma}
                </button>
              ))}
            </div>
          </div>

          {/* LISTA DE VENDAS */}
          <div className="jmix-glass rounded-2xl p-5 space-y-3">
            {filteredSales.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                Nenhuma venda encontrada com os filtros aplicados.
              </div>
            ) : (
              filteredSales.map(sale => (
                <div
                  key={sale.id}
                  onClick={() => setSelectedSale(sale)}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-[#1e3256] bg-[#111d33] p-4 transition-all hover:bg-[#182846] cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#004b9a]/20 border border-[#004b9a]/40 text-blue-400 font-bold">
                      {sale.formaPagamento === 'PIX' && <QrCode className="h-6 w-6 text-emerald-400" />}
                      {sale.formaPagamento === 'CREDITO' && <CreditCard className="h-6 w-6 text-blue-400" />}
                      {sale.formaPagamento === 'DEBITO' && <CreditCard className="h-6 w-6 text-indigo-400" />}
                      {sale.formaPagamento === 'DINHEIRO' && <Banknote className="h-6 w-6 text-amber-400" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-base">{sale.codigoVenda}</span>
                        <span className="rounded bg-[#1e3256] px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          {sale.formaPagamento}
                        </span>
                        {sale.valorTrocaSucata > 0 && (
                          <span className="rounded bg-[#f99b1c]/20 px-2 py-0.5 text-[10px] font-bold text-[#f99b1c] flex items-center gap-1">
                            <Recycle className="h-3 w-3" /> com Troca
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span className="flex items-center gap-1 font-semibold text-white">
                          <User className="h-3.5 w-3.5 text-blue-400" />
                          Vendedor: {sale.usuarioNome}
                        </span>
                        <span>•</span>
                        <span>Cliente: {sale.clienteNome || 'Balcão'}</span>
                      </p>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {sale.itens.map(item => (
                          <span key={item.id} className="rounded bg-[#0a1120] px-2 py-0.5 text-[11px] text-slate-300 border border-[#1e3256]">
                            {item.quantidade}x {item.produtoNome} (R$ {item.precoUnitario.toFixed(2)})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-right border-t md:border-t-0 border-[#1e3256] pt-2 md:pt-0">
                    <span className="text-[10px] text-slate-400 block">Total Final Recebido</span>
                    <div className="text-xl font-black text-emerald-400">
                      R$ {sale.total.toFixed(2)}
                    </div>
                    {sale.valorTrocaSucata > 0 && (
                      <span className="text-[11px] text-[#f99b1c] font-semibold block">
                        Troca Bateria: -R$ {sale.valorTrocaSucata.toFixed(2)}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {new Date(sale.dataVenda).toLocaleString()}
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
          <div className="w-full max-w-lg rounded-2xl border border-[#1e3256] bg-[#0a1120] p-6 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e3256] pb-3">
              <h3 className="font-extrabold text-lg">Comprovante {selectedSale.codigoVenda}</h3>
              <button onClick={() => setSelectedSale(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <p><strong>Funcionário que vendeu:</strong> {selectedSale.usuarioNome}</p>
              <p><strong>Cliente:</strong> {selectedSale.clienteNome} {selectedSale.clienteContato && `(${selectedSale.clienteContato})`}</p>
              <p><strong>Forma de Pagamento:</strong> {selectedSale.formaPagamento}</p>
              <p><strong>Data/Hora:</strong> {new Date(selectedSale.dataVenda).toLocaleString()}</p>
              
              <div className="border-t border-[#1e3256] pt-2">
                <strong className="block mb-1">Itens Vendidos:</strong>
                {selectedSale.itens.map(item => (
                  <div key={item.id} className="flex justify-between py-1 border-b border-[#1e3256]/50">
                    <span>{item.quantidade}x {item.produtoNome}</span>
                    <span className="font-bold">R$ {item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-right space-y-1">
                <p>Subtotal: R$ {selectedSale.subtotal.toFixed(2)}</p>
                {selectedSale.valorTrocaSucata > 0 && (
                  <p className="text-[#f99b1c]">Desconto Troca Bateria: -R$ {selectedSale.valorTrocaSucata.toFixed(2)}</p>
                )}
                {selectedSale.desconto > 0 && (
                  <p className="text-amber-400">Desconto Extra: -R$ {selectedSale.desconto.toFixed(2)}</p>
                )}
                <p className="text-base font-black text-emerald-400 pt-1">Total Paga: R$ {selectedSale.total.toFixed(2)}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedSale(null)}
              className="w-full rounded-xl bg-[#004b9a] py-2.5 text-xs font-bold text-white hover:bg-[#0262c7]"
            >
              FECHAR
            </button>
          </div>
        </div>
      )}

      <POSModal
        isOpen={isPOSOpen}
        onClose={() => setIsPOSOpen(false)}
        user={user}
        onSaleCompleted={fetchSales}
      />
    </div>
  );
}
