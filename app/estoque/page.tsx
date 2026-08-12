'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import ProductModal from '@/components/ProductModal';
import POSModal from '@/components/POSModal';
import { Product } from '@/lib/db';
import { 
  Battery, 
  Search, 
  Plus, 
  Filter, 
  Edit, 
  Trash2, 
  AlertCircle, 
  CheckCircle,
  Eye
} from 'lucide-react';

export default function EstoquePage() {
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('TODAS');
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [isPOSOpen, setIsPOSOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [resMe, resProds] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/produtos')
      ]);

      if (resMe.ok) setSessionUser(await resMe.json());
      if (resProds.ok) {
        const dataProds = await resProds.json();
        if (Array.isArray(dataProds)) {
          setProducts(dataProds.filter(p => p.tipo === 'NOVA'));
        }
      }
    } catch (err) {
      console.error('Erro ao buscar baterias:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const safeProducts = Array.isArray(products) ? products : [];
  const isAdmin = sessionUser?.role === 'ADMIN';

  const marcasDisponiveis = ['TODAS', ...Array.from(new Set(safeProducts.map(p => p.marca.toUpperCase())))];

  const filteredProducts = safeProducts.filter(p => {
    const matchesSearch = p.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.amperagem.toString().includes(searchTerm) ||
                          (p.codigoSKU && p.codigoSKU.includes(searchTerm));
    
    const matchesBrand = brandFilter === 'TODAS' || p.marca.toUpperCase().includes(brandFilter);
    return matchesSearch && matchesBrand;
  });

  const handleDeleteProduct = async (id: string, modelo: string) => {
    if (!confirm(`Tem certeza que deseja excluir a bateria ${modelo}?`)) return;

    try {
      const res = await fetch(`/api/produtos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#060b14] text-slate-100 flex flex-col font-sans">
      <Navbar sessionUser={sessionUser} onOpenPOS={() => setIsPOSOpen(true)} />

      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar user={sessionUser} activePath="/estoque" />

        <main className="flex-1 p-4 md:p-8 space-y-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1e3256] pb-6">
            <div>
              <div className="flex items-center gap-2">
                <Battery className="h-7 w-7 text-[#004b9a]" />
                <h1 className="text-2xl font-black text-white tracking-tight">Catálogo & Estoque de Baterias Novas</h1>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                {safeProducts.length} modelos de baterias novas cadastradas.
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={() => {
                  setProductToEdit(null);
                  setIsProductModalOpen(true);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004b9a] to-[#0262c7] px-5 py-3 text-sm font-bold text-white shadow-lg hover:brightness-110 active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Cadastrar Nova Bateria</span>
              </button>
            )}
          </div>

          {/* Filtros e Busca */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-[#0a1120] border border-[#1e3256] rounded-2xl p-4 shadow-lg">
            
            <div className="sm:col-span-8 relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar por modelo (M60AD), marca (Moura), amperagem (60) ou SKU..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-[#1e3256] bg-[#111d33] py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-[#004b9a] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-4 relative">
              <Filter className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <select
                value={brandFilter}
                onChange={e => setBrandFilter(e.target.value)}
                className="w-full rounded-xl border border-[#1e3256] bg-[#111d33] py-2.5 pl-10 pr-4 text-xs text-white font-bold focus:border-[#004b9a] focus:outline-none"
              >
                {marcasDisponiveis.map(marca => (
                  <option key={marca} value={marca}>{marca}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Tabela de Produtos */}
          <div className="rounded-2xl border border-[#1e3256] bg-[#0a1120] overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-12 text-center text-slate-400">Carregando estoque...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center text-slate-400">Nenhuma bateria encontrada para o filtro selecionado.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#111d33] uppercase text-slate-300 font-bold border-b border-[#1e3256]">
                    <tr>
                      <th className="px-5 py-4">Bateria / Marca</th>
                      <th className="px-5 py-4">SKU / Modelo</th>
                      <th className="px-5 py-4">Amperagem</th>
                      <th className="px-5 py-4">Aplicação</th>
                      <th className="px-5 py-4">Garantia</th>
                      {isAdmin && <th className="px-5 py-4">Preço Custo</th>}
                      <th className="px-5 py-4">Preço Venda</th>
                      <th className="px-5 py-4">Estoque</th>
                      {isAdmin && <th className="px-5 py-4 text-right">Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e3256]/60">
                    {filteredProducts.map(prod => (
                      <tr key={prod.id} className="hover:bg-[#111d33]/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-white text-sm">{prod.marca}</p>
                          <p className="text-[11px] text-slate-400">{prod.descricao}</p>
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-300">
                          {prod.codigoSKU ? `${prod.codigoSKU} - ` : ''}{prod.modelo}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-blue-400">
                          {prod.amperagem} Ah ({prod.voltagem})
                        </td>
                        <td className="px-5 py-3.5 uppercase font-semibold text-slate-300">
                          {prod.aplicacao}
                        </td>
                        <td className="px-5 py-3.5 text-slate-300">
                          {prod.garantiaMeses} meses
                        </td>
                        {isAdmin && (
                          <td className="px-5 py-3.5 text-slate-400">
                            R$ {(prod.precoCusto || 0).toFixed(2)}
                          </td>
                        )}
                        <td className="px-5 py-3.5 font-black text-emerald-400 text-sm">
                          R$ {prod.precoVenda.toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-block rounded-lg px-2.5 py-1 font-extrabold text-xs ${
                            prod.estoque === 0
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : prod.estoque === 1
                              ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}>
                            {prod.estoque} un
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setProductToEdit(prod);
                                  setIsProductModalOpen(true);
                                }}
                                className="rounded-lg border border-[#1e3256] bg-[#111d33] p-1.5 text-slate-300 hover:text-white"
                              >
                                <Edit className="h-3.5 w-3.5 text-blue-400" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod.id, prod.modelo)}
                                className="rounded-lg border border-red-900/40 bg-red-950/40 p-1.5 text-red-300 hover:text-white"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-400" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </main>
      </div>

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={productToEdit}
        defaultTipo="NOVA"
        onSaved={fetchData}
      />

      <POSModal
        isOpen={isPOSOpen}
        onClose={() => setIsPOSOpen(false)}
        usuario={sessionUser}
        onSaleSuccess={fetchData}
      />
    </div>
  );
}
