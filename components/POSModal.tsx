'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingCart,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  QrCode,
  Banknote,
  UserCheck
} from 'lucide-react';
import { Product, FormaPagamento } from '@/lib/db';
import { SessionUser } from '@/lib/auth';

interface POSModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: SessionUser | null;
  onSaleCompleted: () => void;
}

interface CartItem {
  product: Product;
  quantidade: number;
}

export default function POSModal({ isOpen, onClose, user, onSaleCompleted }: POSModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [search, setSearch] = useState('');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteContato, setClienteContato] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('PIX');
  const [desconto, setDesconto] = useState<number>(0);
  const [valorTrocaSucata, setValorTrocaSucata] = useState<number>(0);
  const [observacao, setObservacao] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      setCart([]);
      setClienteNome('');
      setClienteContato('');
      setFormaPagamento('PIX');
      setDesconto(0);
      setValorTrocaSucata(0);
      setObservacao('');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch('/api/produtos');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error('Erro ao buscar produtos para o PDV:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const term = search.toLowerCase();
    return (
      p.marca.toLowerCase().includes(term) ||
      p.modelo.toLowerCase().includes(term) ||
      p.amperagem.toString().includes(term) ||
      p.aplicacao.toLowerCase().includes(term)
    );
  });

  const addToCart = (product: Product) => {
    if (product.estoque <= 0) {
      setErrorMsg(`A bateria ${product.marca} ${product.modelo} está ESGOTADA!`);
      return;
    }

    const existingIdx = cart.findIndex(c => c.product.id === product.id);
    if (existingIdx > -1) {
      const currentQty = cart[existingIdx].quantidade;
      if (currentQty + 1 > product.estoque) {
        setErrorMsg(`Estoque limite atingido (${product.estoque} unidades disponíveis).`);
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIdx].quantidade += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, { product, quantidade: 1 }]);
    }
    setErrorMsg('');
  };

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    const item = cart.find(c => c.product.id === productId);
    if (item && qty > item.product.estoque) {
      setErrorMsg(`Estoque máximo atingido (${item.product.estoque} unidades).`);
      return;
    }
    setCart(cart.map(c => c.product.id === productId ? { ...c, quantidade: qty } : c));
    setErrorMsg('');
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(c => c.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.precoVenda * item.quantidade), 0);
  const totalFinal = Math.max(0, subtotal - desconto - valorTrocaSucata);

  const handleConfirmSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setErrorMsg('Adicione pelo menos uma bateria ao carrinho.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        clienteNome: clienteNome.trim() || 'Cliente de Balcão',
        clienteContato: clienteContato.trim(),
        formaPagamento,
        desconto,
        valorTrocaSucata,
        observacao,
        itens: cart.map(item => ({
          produtoId: item.product.id,
          quantidade: item.quantidade
        }))
      };

      const res = await fetch('/api/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao registrar venda');
      }

      setSuccessMsg(`Venda ${data.sale.codigoVenda} registrada com sucesso! Baixa no estoque efetuada.`);
      setTimeout(() => {
        onSaleCompleted();
        onClose();
      }, 1400);

    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado ao registrar venda');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#1e3256] bg-[#0a1120] shadow-2xl">
        
        {/* CABEÇALHO MODAL */}
        <div className="flex items-center justify-between border-b border-[#1e3256] bg-gradient-to-r from-[#004b9a] to-[#0a192f] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e51b24] text-white shadow-md">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                PDV Balcão - Registrar Venda em Tempo Real
              </h2>
              <p className="text-xs text-blue-200">
                Atendido por: <span className="font-semibold text-white">{user?.nome}</span> ({user?.role})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* SELEÇÃO DE BATERIAS (COLUNA ESQUERDA) */}
          <div className="flex flex-col border-r border-[#1e3256] lg:col-span-7 p-4 bg-[#0d1627] overflow-hidden">
            <div className="mb-3">
              <input
                type="text"
                placeholder="Buscar por marca (Moura, Heliar...), amperagem (60Ah)..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[#1e3256] bg-[#111d33] px-3.5 py-2.5 text-sm text-white placeholder-slate-400 focus:border-[#004b9a] focus:outline-none"
              />
            </div>

            {loadingProducts ? (
              <div className="flex flex-1 items-center justify-center text-slate-400 text-sm">
                Carregando catálogo de baterias...
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredProducts.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    Nenhuma bateria encontrada.
                  </div>
                ) : (
                  filteredProducts.map(product => (
                    <div
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className={`group flex items-center justify-between rounded-xl border border-[#1e3256] bg-[#111d33] p-3 transition-all cursor-pointer hover:border-[#004b9a] hover:bg-[#182846] ${
                        product.estoque <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#004b9a]/20 border border-[#004b9a]/40 text-[#f99b1c] font-black text-xs">
                          {product.amperagem}Ah
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white group-hover:text-[#f99b1c] transition-colors">
                              {product.marca} {product.modelo}
                            </span>
                            <span className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                              product.tipo === 'NOVA' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}>
                              {product.tipo}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            CCA: {product.cca} | Polo: {product.polo} | Garantia: {product.garantiaMeses}m
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-black text-emerald-400">
                            R$ {product.precoVenda.toFixed(2)}
                          </div>
                          <div className={`text-[11px] font-bold ${
                            product.estoque === 1 
                              ? 'text-red-400 animate-pulse font-extrabold' 
                              : product.estoque <= product.estoqueMinimo ? 'text-amber-400' : 'text-slate-400'
                          }`}>
                            {product.estoque === 1 ? '🔥 APENAS 1 UN' : `Estoque: ${product.estoque} un`}
                          </div>
                        </div>

                        <button
                          disabled={product.estoque <= 0}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#004b9a] text-white hover:bg-[#0262c7] disabled:bg-slate-700 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* FORMULÁRIO DE CONFIRMAÇÃO (COLUNA DIREITA) */}
          <form onSubmit={handleConfirmSale} className="flex flex-col lg:col-span-5 p-4 bg-[#0a1120] overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Itens no Carrinho ({cart.reduce((a, c) => a + c.quantidade, 0)})
            </h3>

            {/* LISTA CARRINHO */}
            <div className="max-h-40 min-h-[90px] overflow-y-auto space-y-2 mb-3 pr-1">
              {cart.length === 0 ? (
                <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-[#1e3256] text-xs text-slate-500">
                  Selecione as baterias ao lado para vender.
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex items-center justify-between rounded-lg border border-[#1e3256] bg-[#111d33] p-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs font-bold text-white truncate">
                        {item.product.marca} {item.product.modelo}
                      </p>
                      <p className="text-[11px] text-emerald-400 font-semibold">
                        R$ {item.product.precoVenda.toFixed(2)} cada
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max={item.product.estoque}
                        value={item.quantidade}
                        onChange={e => updateCartQty(item.product.id, parseInt(e.target.value) || 0)}
                        className="w-12 rounded border border-[#1e3256] bg-[#0a1120] px-2 py-1 text-center text-xs font-bold text-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* OPÇÕES */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Cliente (Opcional)</label>
                <input
                  type="text"
                  placeholder="Nome do cliente"
                  value={clienteNome}
                  onChange={e => setClienteNome(e.target.value)}
                  className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] px-3 py-1.5 text-white placeholder-slate-500"
                />
              </div>

              {/* FORMA DE PAGAMENTO */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'PIX', label: 'Pix / Inst.', icon: QrCode, color: 'text-emerald-400' },
                    { id: 'CREDITO', label: 'Cartão Crédito', icon: CreditCard, color: 'text-blue-400' },
                    { id: 'DEBITO', label: 'Cartão Débito', icon: CreditCard, color: 'text-indigo-400' },
                    { id: 'DINHEIRO', label: 'Dinheiro', icon: Banknote, color: 'text-amber-400' }
                  ].map(method => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setFormaPagamento(method.id as FormaPagamento)}
                        className={`flex items-center gap-1.5 rounded-lg border p-2 text-left transition-all ${
                          formaPagamento === method.id
                            ? 'border-[#004b9a] bg-[#004b9a]/20 text-white font-bold'
                            : 'border-[#1e3256] bg-[#111d33] text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${method.color}`} />
                        <span>{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DESCONTO BATERIA USADA (TROCA) */}
              <div className="flex items-center justify-between border-t border-[#1e3256] pt-2">
                <span className="text-slate-400 font-semibold">Desconto Bateria Usada (R$):</span>
                <input
                  type="number"
                  min="0"
                  value={valorTrocaSucata}
                  onChange={e => setValorTrocaSucata(parseFloat(e.target.value) || 0)}
                  className="w-24 rounded border border-[#1e3256] bg-[#111d33] px-2 py-1 text-right text-white font-bold"
                />
              </div>

              {/* DESCONTO EXTRA */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Desconto Extra (R$):</span>
                <input
                  type="number"
                  min="0"
                  value={desconto}
                  onChange={e => setDesconto(parseFloat(e.target.value) || 0)}
                  className="w-24 rounded border border-[#1e3256] bg-[#111d33] px-2 py-1 text-right text-white font-bold"
                />
              </div>

              {/* MENSAGENS */}
              {errorMsg && (
                <div className="rounded-lg border border-red-800 bg-red-950/60 p-2.5 text-xs text-red-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="rounded-lg border border-emerald-800 bg-emerald-950/60 p-2.5 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* TOTAL */}
              <div className="space-y-1 border-t border-[#1e3256] pt-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {valorTrocaSucata > 0 && (
                  <div className="flex justify-between text-[#f99b1c]">
                    <span>Desconto Troca:</span>
                    <span>- R$ {valorTrocaSucata.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-white pt-1">
                  <span>Total Final:</span>
                  <span className="text-emerald-400">R$ {totalFinal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* BOTÃO */}
            <button
              type="submit"
              disabled={submitting || cart.length === 0}
              className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#e51b24] to-[#b81018] py-3 text-sm font-bold text-white shadow-lg shadow-red-950/50 hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <UserCheck className="h-4 w-4" />
              <span>{submitting ? 'EFETUANDO VENDA...' : 'FINALIZAR VENDA EM TEMPO REAL'}</span>
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
