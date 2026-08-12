'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import ProductModal from '@/components/ProductModal';
import POSModal from '@/components/POSModal';
import { SessionUser } from '@/lib/auth';
import { Product } from '@/lib/db';
import {
  Battery,
  Plus,
  Search,
  Edit,
  Trash2,
  Zap,
  ShoppingCart,
  LayoutGrid,
  List,
  ShieldCheck
} from 'lucide-react';

export default function EstoquePage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [filtroAplicacao, setFiltroAplicacao] = useState<string>('TODAS');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABELA'>('TABELA');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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
      await fetchProducts();
    } catch (err) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/produtos?tipo=NOVA');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
    }
  };

  const handleDelete = async (id: string, marca: string, modelo: string) => {
    if (!confirm(`Excluir a bateria ${marca} ${modelo}?`)) return;

    try {
      const res = await fetch(`/api/produtos/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Erro ao excluir');
        return;
      }
      await fetchProducts();
    } catch (err) {
      alert('Falha ao excluir produto');
    }
  };

  const filteredProducts = products.filter(p => {
    const term = search.toLowerCase();
    const matchesSearch = (
      p.marca.toLowerCase().includes(term) ||
      p.modelo.toLowerCase().includes(term) ||
      p.amperagem.toString().includes(term)
    );
    const matchesAplicacao = filtroAplicacao === 'TODAS' || p.aplicacao === filtroAplicacao;
    return matchesSearch && matchesAplicacao;
  });

  const isAdmin = user?.role === 'ADMIN';
  const totalGeralEstoque = products.reduce((acc, p) => acc + p.estoque, 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1120] text-slate-300 font-bold">
        <Zap className="h-6 w-6 text-[#f99b1c] animate-spin mr-2" />
        <span>Carregando Estoque de Baterias Novas...</span>
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
          
          {/* BANNER DIRETO DE CONTAGEM */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e3256] pb-4">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Battery className="h-6 w-6 text-[#004b9a]" />
                Estoque de Baterias Novas ({totalGeralEstoque} un)
              </h1>
              <p className="text-xs text-slate-400">
                Consulta direta da quantidade de baterias novas disponíveis para venda rápida no balcão.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004b9a] to-[#0262c7] px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>CADASTRAR BATERIA</span>
            </button>
          </div>

          {/* CONTROLES: BUSCA, FILTROS E MODO DE VISUALIZAÇÃO */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#111d33] p-3 rounded-2xl border border-[#1e3256]">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por marca, modelo, Ah..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[#1e3256] bg-[#0a1120] py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-[#004b9a] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Filtro:</span>
              {['TODAS', 'CARRO', 'MOTO', 'CAMINHAO', 'SOM'].map(app => (
                <button
                  key={app}
                  onClick={() => setFiltroAplicacao(app)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    filtroAplicacao === app
                      ? 'bg-[#004b9a] text-white shadow'
                      : 'bg-[#0a1120] text-slate-400 hover:text-white border border-[#1e3256]'
                  }`}
                >
                  {app}
                </button>
              ))}

              <div className="ml-2 border-l border-[#1e3256] pl-2 flex items-center gap-1">
                <button
                  onClick={() => setViewMode('TABELA')}
                  title="Visão em Tabela Limpa"
                  className={`p-2 rounded-lg border ${
                    viewMode === 'TABELA' ? 'border-[#004b9a] bg-[#004b9a]/20 text-white' : 'border-[#1e3256] text-slate-400'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('CARDS')}
                  title="Visão em Cards"
                  className={`p-2 rounded-lg border ${
                    viewMode === 'CARDS' ? 'border-[#004b9a] bg-[#004b9a]/20 text-white' : 'border-[#1e3256] text-slate-400'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* CONTEÚDO: MODO TABELA LIMPA */}
          {viewMode === 'TABELA' ? (
            <div className="jmix-glass rounded-2xl p-5 space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1e3256] text-slate-400 uppercase font-bold text-[10px]">
                      <th className="pb-3 px-2">Marca / Modelo</th>
                      <th className="pb-3 px-2">Amperagem</th>
                      <th className="pb-3 px-2">Polo / CCA</th>
                      <th className="pb-3 px-2">Garantia</th>
                      <th className="pb-3 px-2 text-center">Quantidade Estoque</th>
                      <th className="pb-3 px-2">Preço Venda</th>
                      {isAdmin && <th className="pb-3 px-2 text-[#f99b1c]">Preço Custo (Dono)</th>}
                      <th className="pb-3 px-2 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e3256]/60">
                    {filteredProducts.map(p => (
                      <tr key={p.id} className="hover:bg-[#182846]/40 transition-colors">
                        <td className="py-3 px-2 font-extrabold text-white">
                          {p.marca} <span className="text-[#f99b1c]">{p.modelo}</span>
                          <span className="block text-[10px] text-slate-400 font-normal">{p.aplicacao}</span>
                        </td>

                        <td className="py-3 px-2 font-black text-white text-sm">
                          {p.amperagem}Ah ({p.voltagem})
                        </td>

                        <td className="py-3 px-2 text-slate-300">
                          {p.polo} • {p.cca} A
                        </td>

                        <td className="py-3 px-2 text-emerald-400 font-bold">
                          {p.garantiaMeses} Meses
                        </td>

                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block rounded-full px-3 py-1 text-xs font-black ${
                            p.estoque > p.estoqueMinimo
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                          }`}>
                            {p.estoque} un
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
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setIsProductModalOpen(true);
                              }}
                              className="rounded-lg border border-[#1e3256] bg-[#111d33] p-1.5 text-slate-300 hover:text-white"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(p.id, p.marca, p.modelo)}
                                className="rounded-lg border border-[#1e3256] bg-[#111d33] p-1.5 text-slate-400 hover:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}

                            <button
                              onClick={() => setIsPOSOpen(true)}
                              className="rounded-lg bg-[#e51b24] px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                            >
                              VENDER
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* MODO CARDS */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="jmix-glass jmix-glass-hover rounded-2xl p-5 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#004b9a] text-white font-black text-sm shadow-md">
                          {product.amperagem}Ah
                        </div>
                        <div>
                          <h3 className="font-extrabold text-white text-base">
                            {product.marca} <span className="text-[#f99b1c]">{product.modelo}</span>
                          </h3>
                          <span className="text-xs text-slate-400">
                            {product.voltagem} • Polo {product.polo}
                          </span>
                        </div>
                      </div>

                      <span className="rounded-full bg-emerald-950 px-2.5 py-0.5 text-[11px] font-black text-emerald-400 border border-emerald-800">
                        {product.estoque} un
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-[#1e3256] pt-2">
                      <div><span className="text-slate-500">CCA:</span> <strong className="text-white">{product.cca} A</strong></div>
                      <div><span className="text-slate-500">Garantia:</span> <strong className="text-emerald-400">{product.garantiaMeses}m</strong></div>
                      {isAdmin && (
                        <div className="col-span-2 text-[#f99b1c]">
                          <span>Preço Custo (Dono): R$ {product.precoCusto.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#1e3256] pt-3">
                    <div className="text-lg font-black text-emerald-400">
                      R$ {product.precoVenda.toFixed(2)}
                    </div>

                    <button
                      onClick={() => setIsPOSOpen(true)}
                      className="rounded-lg bg-[#e51b24] px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
                    >
                      VENDER
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={editingProduct}
        defaultTipo="NOVA"
        onSaved={fetchProducts}
      />

      <POSModal
        isOpen={isPOSOpen}
        onClose={() => setIsPOSOpen(false)}
        user={user}
        onSaleCompleted={fetchProducts}
      />
    </div>
  );
}
