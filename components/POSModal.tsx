'use client';

import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Search, Plus, Minus, Trash2, AlertCircle, Wrench } from 'lucide-react';
import { Product, FormaPagamento } from '@/lib/db';

interface CartItem {
  product: Product;
  quantidade: number;
}

interface POSModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  usuario?: any;
  onSaleSuccess?: () => void;
  onSaleCompleted?: () => void | Promise<void>;
}

export default function POSModal({ isOpen, onClose, user, usuario, onSaleSuccess, onSaleCompleted }: POSModalProps) {
  const sessionUser = usuario || user;
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [clienteNome, setClienteNome] = useState('');
  const [clienteContato, setClienteContato] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('PIX');
  const [desconto, setDesconto] = useState<number>(0);
  const [valorTrocaSucata, setValorTrocaSucata] = useState<number>(0);
  const [valorInstalacao, setValorInstalacao] = useState<number>(0);
  const [observacao, setObservacao] = useState('');

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      setCart([]);
      setClienteNome('');
      setClienteContato('');
      setFormaPagamento('PIX');
      setDesconto(0);
      setValorTrocaSucata(0);
      setValorInstalacao(0);
      setObservacao('');
      setErrorMsg('');
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch('/api/produtos');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.estoque > 0 &&
    (p.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.amperagem.toString().includes(searchTerm) ||
     p.aplicacao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id);
      if (existingIdx > -1) {
        const currentQty = prev[existingIdx].quantidade;
        if (currentQty >= product.estoque) {
          setErrorMsg(`Estoque máximo atingido (${product.estoque} un) para ${product.marca} ${product.modelo}.`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIdx].quantidade += 1;
        return updated;
      }
      return [...prev, { product, quantidade: 1 }];
    });
    setErrorMsg('');
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantidade + delta;
          if (newQty > item.product.estoque) {
            setErrorMsg(`Estoque máximo atingido (${item.product.estoque} un).`);
            return item;
          }
          return newQty > 0 ? { ...item, quantidade: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const subtotalCart = cart.reduce((acc, item) => acc + (item.product.precoVenda * item.quantidade), 0);
  const totalFinal = Math.max(0, subtotalCart + valorInstalacao - desconto - valorTrocaSucata);

  const handleFinishSale = async () => {
    if (cart.length === 0) {
      setErrorMsg('Adicione pelo menos 1 bateria ao carrinho antes de finalizar.');
      return;
    }

    if (!sessionUser) {
      setErrorMsg('Sessão expirada. Faça login novamente.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        usuarioId: sessionUser.id,
        usuarioNome: sessionUser.nome,
        clienteNome,
        clienteContato,
        formaPagamento,
        desconto,
        valorTrocaSucata,
        valorInstalacao,
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
      if (!res.ok) throw new Error(data.error || 'Erro ao registrar venda');

      if (onSaleCompleted) await onSaleCompleted();
      if (onSaleSuccess) onSaleSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao processar venda.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[95vh] w-full max-w-5xl flex-col rounded-2xl border border-[#1e3256] bg-[#0a1120] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e3256] bg-[#111d33] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#004b9a] to-[#0262c7] text-white shadow-md">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Caixa & Registrador de Vendas (Balcão)</h2>
              <p className="text-xs text-slate-400">
                Operador: <strong className="text-emerald-400">{sessionUser?.nome || 'Balcão'}</strong> ({sessionUser?.matricula})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-[#1e3256] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-950/80 border-b border-red-800 p-3 text-xs text-red-200 flex items-center gap-2 px-6">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* LADO ESQUERDO: Catálogo */}
          <div className="flex flex-col border-r border-[#1e3256] p-4 lg:col-span-7 overflow-y-auto max-h-[45vh] lg:max-h-full">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por Moura, Heliar, 60Ah, Start-Stop..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-[#1e3256] bg-[#111d33] py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#004b9a]"
              />
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {loadingProducts ? (
                <div className="py-8 text-center text-xs text-slate-400">Buscando estoque...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">Nenhuma bateria disponível para o termo.</div>
              ) : (
                filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="flex items-center justify-between rounded-xl border border-[#1e3256] bg-[#111d33]/60 p-3 cursor-pointer hover:border-[#004b9a] hover:bg-[#111d33] transition-all group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{product.marca} {product.modelo}</span>
                        <span className="rounded bg-[#004b9a]/30 px-2 py-0.5 text-[10px] font-bold text-[#4491e0] border border-[#004b9a]/50">
                          {product.amperagem}Ah
                        </span>
                        {product.tipo === 'SEMI_NOVA' && (
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-500/30">
                            SEMI-NOVA ({product.saudePct}% SOH)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{product.descricao}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-400">R$ {product.precoVenda.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-400 font-bold">Estoque: {product.estoque} un</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* LADO DIREITO: Carrinho, Adicional de Instalação e Totais */}
          <div className="flex flex-col p-4 lg:col-span-5 bg-[#080e1a] overflow-y-auto">
            
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Itens Selecionados</h3>
            
            <div className="flex-1 space-y-2 max-h-40 overflow-y-auto mb-3 border border-[#1e3256] rounded-xl p-2 bg-[#0d1629]">
              {cart.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  Clique nas baterias à esquerda para adicionar ao pedido.
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex items-center justify-between rounded-lg bg-[#111d33] p-2 text-xs">
                    <div>
                      <p className="font-bold text-white">{item.product.marca} {item.product.modelo}</p>
                      <p className="text-[10px] text-slate-400">R$ {item.product.precoVenda.toFixed(2)} un</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded bg-[#0a1120] p-1 border border-[#1e3256]">
                        <button onClick={() => updateQuantity(item.product.id, -1)} className="text-slate-400 hover:text-white p-0.5">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-bold text-white px-1">{item.quantidade}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} className="text-slate-400 hover:text-white p-0.5">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button onClick={() => updateQuantity(item.product.id, -item.quantidade)} className="text-slate-500 hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Formulário de Finalização */}
            <div className="space-y-2.5 text-xs">
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Nome do Cliente</label>
                  <input
                    type="text"
                    placeholder="Cliente de Balcão"
                    value={clienteNome}
                    onChange={e => setClienteNome(e.target.value)}
                    className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Forma de Pagamento</label>
                  <select
                    value={formaPagamento}
                    onChange={e => setFormaPagamento(e.target.value as FormaPagamento)}
                    className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2 text-white font-bold"
                  >
                    <option value="PIX">PIX</option>
                    <option value="CREDITO">Cartão de Crédito</option>
                    <option value="DEBITO">Cartão de Débito</option>
                    <option value="DINHEIRO">Dinheiro Espécie</option>
                  </select>
                </div>
              </div>

              {/* VALOR DE INSTALAÇÃO (OPCIONAL DO INSTALADOR/VENDEDOR) */}
              <div className="rounded-xl border border-blue-900/60 bg-blue-950/30 p-2.5 space-y-1">
                <div className="flex items-center gap-1.5 text-blue-400 font-bold text-[11px]">
                  <Wrench className="h-3.5 w-3.5" />
                  <span>Taxa de Instalação (Opcional)</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="R$ 0,00 (Defina o valor da mão de obra/instalação)"
                  value={valorInstalacao || ''}
                  onChange={e => setValorInstalacao(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-blue-800 bg-[#0d172a] p-2 text-blue-200 font-bold placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Desconto (R$)</label>
                  <input
                    type="number"
                    value={desconto || ''}
                    onChange={e => setDesconto(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Abatimento Sucata (R$)</label>
                  <input
                    type="number"
                    value={valorTrocaSucata || ''}
                    onChange={e => setValorTrocaSucata(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2 text-amber-400 font-bold"
                  />
                </div>
              </div>

              {/* Totalizador */}
              <div className="rounded-xl border border-[#1e3256] bg-[#111d33] p-3 text-right">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Baterias: R$ {subtotalCart.toFixed(2)}</span>
                  {valorInstalacao > 0 && <span className="text-blue-400">+ Instalação: R$ {valorInstalacao.toFixed(2)}</span>}
                </div>
                <p className="text-lg font-black text-emerald-400 mt-1">TOTAL: R$ {totalFinal.toFixed(2)}</p>
              </div>

              <button
                onClick={handleFinishSale}
                disabled={submitting || cart.length === 0}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-black text-white shadow-lg hover:brightness-110 disabled:opacity-50"
              >
                {submitting ? 'PROCESSANDO VENDA...' : 'CONFIRMAR & REGISTRAR VENDA'}
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
