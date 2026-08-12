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
  Sparkles,
  Plus,
  Search,
  Edit,
  Trash2,
  Zap,
  Shield,
  Activity,
  ShoppingCart
} from 'lucide-react';

export default function SemiNovasPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

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
      const res = await fetch('/api/produtos?tipo=SEMI_NOVA');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error('Erro ao buscar semi-novas:', err);
    }
  };

  const handleDelete = async (id: string, marca: string) => {
    if (!confirm(`Excluir bateria semi-nova ${marca}?`)) return;

    try {
      const res = await fetch(`/api/produtos/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Erro ao excluir');
        return;
      }
      await fetchProducts();
    } catch (err) {
      alert('Falha ao excluir');
    }
  };

  const filteredProducts = products.filter(p => {
    const term = search.toLowerCase();
    return (
      p.marca.toLowerCase().includes(term) ||
      p.modelo.toLowerCase().includes(term) ||
      p.amperagem.toString().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1120] text-slate-300 font-bold">
        <Zap className="h-6 w-6 text-[#f99b1c] animate-spin mr-2" />
        <span>Carregando Baterias Semi-Novas...</span>
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
          
          {/* TOPO */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e3256] pb-4">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-[#f99b1c]" />
                Aba de Baterias Semi-Novas / Recondicionadas
              </h1>
              <p className="text-xs text-slate-400">
                Opções econômicas testadas em analisador digital, com saúde garantida e garantia de balcão.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f99b1c] to-[#f36f21] px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>CADASTRAR SEMI-NOVA</span>
            </button>
          </div>

          {/* BUSCA */}
          <div className="bg-[#111d33] p-3 rounded-2xl border border-[#1e3256]">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por marca, modelo, amperagem..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[#1e3256] bg-[#0a1120] py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-[#f99b1c] focus:outline-none"
              />
            </div>
          </div>

          {/* GRID SEMI-NOVAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full p-12 text-center text-slate-500 text-sm">
                Nenhuma bateria semi-nova cadastrada.
              </div>
            ) : (
              filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="jmix-glass jmix-glass-hover rounded-2xl p-5 flex flex-col justify-between space-y-4 border-amber-500/30"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#f99b1c] to-[#f36f21] text-white font-black text-sm shadow-md">
                          {product.amperagem}Ah
                        </div>
                        <div>
                          <h3 className="font-extrabold text-white text-base">
                            {product.marca} <span className="text-[#f99b1c]">{product.modelo}</span>
                          </h3>
                          <span className="text-xs text-slate-400 font-medium">
                            {product.voltagem} • Polo {product.polo}
                          </span>
                        </div>
                      </div>

                      <span className="rounded-full bg-amber-950 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-400 border border-amber-800">
                        {product.estoque} em estoque
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {product.descricao || 'Bateria recondicionada testada.'}
                    </p>

                    {/* SAÚDE E GARANTIA */}
                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#1e3256] pt-3 text-[11px]">
                      <div>
                        <span className="text-slate-500 block flex items-center gap-0.5">
                          <Activity className="h-3 w-3 text-emerald-400" /> Saúde SOH
                        </span>
                        <strong className="text-emerald-400 font-bold">{product.saudePct}%</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">CCA Testado</span>
                        <strong className="text-white">{product.cca} A</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block flex items-center gap-0.5">
                          <Shield className="h-3 w-3 text-[#f99b1c]" /> Garantia
                        </span>
                        <strong className="text-[#f99b1c]">{product.garantiaMeses} Meses</strong>
                      </div>
                    </div>
                  </div>

                  {/* PREÇO E BOTÕES */}
                  <div className="flex items-center justify-between border-t border-[#1e3256] pt-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Preço Semi-Nova</span>
                      <div className="text-lg font-black text-amber-400">
                        R$ {product.precoVenda.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setIsProductModalOpen(true);
                        }}
                        className="rounded-lg border border-[#1e3256] bg-[#111d33] p-2 text-slate-300 hover:border-amber-500 hover:text-white"
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      {user?.role === 'ADMIN' && (
                        <button
                          onClick={() => handleDelete(product.id, product.marca)}
                          className="rounded-lg border border-[#1e3256] bg-[#111d33] p-2 text-slate-400 hover:border-red-600 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        onClick={() => setIsPOSOpen(true)}
                        className="flex items-center gap-1 rounded-lg bg-[#f99b1c] px-3 py-2 text-xs font-bold text-white hover:bg-amber-600"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        <span>VENDER</span>
                      </button>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>

        </main>
      </div>

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={editingProduct}
        defaultTipo="SEMI_NOVA"
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
