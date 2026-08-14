'use client';

import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Search, Plus, Minus, Trash2, AlertCircle, Wrench, Battery, Check } from 'lucide-react';
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
  const [activeTabMobile, setActiveTabMobile] = useState<'catalogo' | 'carrinho'>('catalogo');

  const [clienteNome, setClienteNome] = useState('');
  const [clienteContato, setClienteContato] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('PIX');
  const [desconto, setDesconto] = useState<number>(0);
  const [valorTrocaSucata, setValorTrocaSucata] = useState<number>(0);
  const [valorInstalacao, setValorInstalacao] = useState<number>(0);
  const [valorComissao, setValorComissao] = useState<number>(0);
  const [tipoComissao, setTipoComissao] = useState<string>('');
  const [observacao, setObservacao] = useState('');

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      setCart([]);
      setActiveTabMobile('catalogo');
      setClienteNome('');
      setClienteContato('');
      setFormaPagamento('PIX');
      setDesconto(0);
      setValorTrocaSucata(0);
      setValorInstalacao(0);
      setValorComissao(0);
      setTipoComissao('');
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
        const list = Array.isArray(data) ? data : (data.products || []);
        setProducts(list);
      }
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const safeProducts = Array.isArray(products) ? products : [];

  const filteredProducts = safeProducts.filter(p =>
    p.estoque > 0 &&
    ((p.marca && p.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
     (p.modelo && p.modelo.toLowerCase().includes(searchTerm.toLowerCase())) ||
     (p.amperagem && p.amperagem.toString().includes(searchTerm)) ||
     (p.aplicacao && p.aplicacao.toLowerCase().includes(searchTerm.toLowerCase())))
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

  const totalItensCarrinho = cart.reduce((acc, item) => acc + item.quantidade, 0);
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
        valorComissao,
        tipoComissao,
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
      <div className="relative flex h-[95vh] w-full max-w-5xl flex-col rounded-2xl border border-[#1e3256] bg-[#0a1120] shadow-2xl overflow-hidden font-sans">
        
        {/* Header com Informações do Vendedor */}
        <div className="flex items-center justify-between border-b border-[#1e3256] bg-[#111d33] px-4 md:px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#004b9a] to-[#0262c7] text-white shadow-md">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-white">Registrar Venda Balcão</h2>
              <p className="text-xs text-slate-400">
                Operador: <strong className="text-emerald-400">{sessionUser?.nome || 'Balcão'}</strong> ({sessionUser?.matricula || 'FUN'})
              </p>
            </div>
          </div>

          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-[#1e3256] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Abas para alternar facilmente no celular */}
        <div className="flex lg:hidden border-b border-[#1e3256] bg-[#0d1629]">
          <button
            onClick={() => setActiveTabMobile('catalogo')}
            className={`flex-1 py-3 text-xs font-black text-center transition-all border-b-2 ${
              activeTabMobile === 'catalogo'
                ? 'border-[#004b9a] text-white bg-[#111d33]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📦 1. ESCOLHER BATERIAS
          </button>
          <button
            onClick={() => setActiveTabMobile('carrinho')}
            className={`flex-1 py-3 text-xs font-black text-center transition-all border-b-2 relative ${
              activeTabMobile === 'carrinho'
                ? 'border-emerald-500 text-emerald-400 bg-[#111d33]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🛒 2. ITENS SELECIONADOS ({totalItensCarrinho})
            {totalItensCarrinho > 0 && (
              <span className="ml-1 rounded-full bg-emerald-500 px-1.5 py-0.2 text-[10px] font-black text-black">
                R$ {totalFinal.toFixed(0)}
              </span>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-950/90 border-b border-red-800 p-3 text-xs text-red-200 flex items-center gap-2 px-6">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* LADO ESQUERDO: Catálogo de Baterias (No Mobile, é visível se activeTabMobile === 'catalogo') */}
          <div className={`flex-col border-r border-[#1e3256] p-4 lg:col-span-7 overflow-y-auto ${
            activeTabMobile === 'catalogo' ? 'flex' : 'hidden lg:flex'
          }`}>
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar por Moura, Heliar, 60Ah, Start-Stop..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-[#1e3256] bg-[#111d33] py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#004b9a]"
              />
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {loadingProducts ? (
                <div className="py-12 text-center text-xs text-slate-400">Buscando baterias...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">Nenhuma bateria disponível com o filtro.</div>
              ) : (
                filteredProducts.map(product => {
                  const cartEntry = cart.find(c => c.product.id === product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className={`flex items-center justify-between rounded-xl border p-3.5 cursor-pointer transition-all ${
                        cartEntry
                          ? 'border-emerald-500/60 bg-[#004b9a]/20 shadow-md'
                          : 'border-[#1e3256] bg-[#111d33]/70 hover:border-[#004b9a] hover:bg-[#111d33]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-white text-sm">{product.marca} {product.modelo}</span>
                          <span className="rounded bg-[#004b9a] px-2 py-0.5 text-[10px] font-black text-white">
                            {product.amperagem}Ah
                          </span>
                          {product.tipo === 'SEMI_NOVA' && (
                            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-500/30">
                              SEMI-NOVA
                            </span>
                          )}
                          {cartEntry && (
                            <span className="rounded bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-black flex items-center gap-1">
                              <Check className="h-3 w-3" /> {cartEntry.quantidade} no pedido
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">{product.descricao}</p>
                      </div>

                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-base font-black text-emerald-400">R$ {product.precoVenda.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400 font-bold">Estoque: {product.estoque} un</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Banner fixo no mobile para ir pro carrinho */}
            {totalItensCarrinho > 0 && (
              <div className="lg:hidden mt-3 pt-2">
                <button
                  onClick={() => setActiveTabMobile('carrinho')}
                  className="w-full flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-xs font-black text-white shadow-xl"
                >
                  <span>VER {totalItensCarrinho} BATERIA(S) SELECIONADA(S)</span>
                  <span>AVANÇAR (R$ {totalFinal.toFixed(2)}) →</span>
                </button>
              </div>
            )}
          </div>

          {/* LADO DIREITO: Carrinho, Itens Selecionados e Totais (No Mobile, visível se activeTabMobile === 'carrinho') */}
          <div className={`flex-col p-4 lg:col-span-5 bg-[#080e1a] overflow-y-auto ${
            activeTabMobile === 'carrinho' ? 'flex' : 'hidden lg:flex'
          }`}>
            
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#4491e0]">
                🛒 Itens Selecionados no Pedido ({totalItensCarrinho})
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-[11px] font-bold text-red-400 hover:underline"
                >
                  Limpar todos
                </button>
              )}
            </div>
            
            {/* Lista dos Itens Selecionados com Destaque Máximo */}
            <div className="flex-1 space-y-2 min-h-[140px] max-h-[220px] overflow-y-auto mb-3 border border-[#1e3256] rounded-xl p-3 bg-[#0d1629] shadow-inner">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                  <Battery className="h-8 w-8 text-slate-600 mx-auto" />
                  <p>Nenhuma bateria selecionada ainda.</p>
                  <button
                    onClick={() => setActiveTabMobile('catalogo')}
                    className="inline-block rounded-lg bg-[#004b9a] px-3 py-1.5 text-xs font-bold text-white mt-1"
                  >
                    + Escolher Baterias
                  </button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex items-center justify-between rounded-xl bg-[#111d33] p-3 text-xs border border-[#1e3256] shadow-sm">
                    <div>
                      <p className="font-black text-white text-sm">{item.product.marca} {item.product.modelo}</p>
                      <p className="text-[11px] text-emerald-400 font-bold">R$ {item.product.precoVenda.toFixed(2)} un</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 rounded-lg bg-[#0a1120] p-1 border border-[#1e3256]">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="rounded bg-[#111d33] p-1 text-slate-300 hover:text-white"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="font-black text-white px-2 text-sm">{item.quantidade}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="rounded bg-[#111d33] p-1 text-slate-300 hover:text-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => updateQuantity(item.product.id, -item.quantidade)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-950 hover:text-red-400"
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Formulário de Finalização */}
            <div className="space-y-3 text-xs">
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Nome do Cliente</label>
                  <input
                    type="text"
                    placeholder="Cliente de Balcão"
                    value={clienteNome}
                    onChange={e => setClienteNome(e.target.value)}
                    className="w-full rounded-xl border border-[#1e3256] bg-[#111d33] p-2.5 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Forma de Pagamento</label>
                  <select
                    value={formaPagamento}
                    onChange={e => setFormaPagamento(e.target.value as FormaPagamento)}
                    className="w-full rounded-xl border border-[#1e3256] bg-[#111d33] p-2.5 text-white text-xs font-bold"
                  >
                    <option value="PIX">PIX</option>
                    <option value="CREDITO">Cartão de Crédito</option>
                    <option value="DEBITO">Cartão de Débito</option>
                    <option value="DINHEIRO">Dinheiro Espécie</option>
                  </select>
                </div>
              </div>

              {/* COMISSÃO DO FUNCIONÁRIO (MOTO 30, CARRO 35, CAMINHÃO 45) */}
              <div className="rounded-xl border border-purple-900/60 bg-purple-950/30 p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1">
                    💰 Comissão do Funcionário
                  </span>
                  {valorComissao > 0 && (
                    <span className="text-[10px] font-extrabold text-purple-300 bg-purple-900/80 px-2 py-0.5 rounded border border-purple-700">
                      R$ {valorComissao.toFixed(2)} ({tipoComissao})
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setValorComissao(30); setTipoComissao('Moto'); }}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-black transition-all border text-center ${
                      valorComissao === 30 && tipoComissao === 'Moto'
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md scale-105'
                        : 'bg-[#111d33] text-purple-200 border-[#1e3256] hover:bg-purple-900/40'
                    }`}
                  >
                    🛵 Moto<br/><span className="text-[9px] opacity-80">R$ 30</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setValorComissao(35); setTipoComissao('Carro'); }}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-black transition-all border text-center ${
                      valorComissao === 35 && tipoComissao === 'Carro'
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md scale-105'
                        : 'bg-[#111d33] text-purple-200 border-[#1e3256] hover:bg-purple-900/40'
                    }`}
                  >
                    🚗 Carro<br/><span className="text-[9px] opacity-80">R$ 35</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setValorComissao(45); setTipoComissao('Caminhão'); }}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-black transition-all border text-center ${
                      valorComissao === 45 && tipoComissao === 'Caminhão'
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md scale-105'
                        : 'bg-[#111d33] text-purple-200 border-[#1e3256] hover:bg-purple-900/40'
                    }`}
                  >
                    🚛 Caminhão<br/><span className="text-[9px] opacity-80">R$ 45</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setValorComissao(0); setTipoComissao(''); }}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-black transition-all border text-center ${
                      valorComissao === 0
                        ? 'bg-[#0d172a] text-slate-400 border-slate-700'
                        : 'bg-[#111d33] text-slate-400 border-[#1e3256] hover:bg-slate-800'
                    }`}
                  >
                    ❌ Nenhuma<br/><span className="text-[9px] opacity-80">R$ 0</span>
                  </button>
                </div>
                <p className="text-[9px] text-purple-300/60 italic text-center">
                  * Não altera o valor total cobrado do cliente. Vai direto pro painel do dono.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Desconto (R$)</label>
                  <input
                    type="number"
                    value={desconto || ''}
                    onChange={e => setDesconto(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-[#1e3256] bg-[#111d33] p-2 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Abatimento Sucata (R$)</label>
                  <input
                    type="number"
                    value={valorTrocaSucata || ''}
                    onChange={e => setValorTrocaSucata(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-[#1e3256] bg-[#111d33] p-2 text-amber-400 font-bold text-xs"
                  />
                </div>
              </div>

              {/* Totalizador */}
              <div className="rounded-xl border border-[#1e3256] bg-[#111d33] p-3 text-right shadow-md">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Baterias: R$ {subtotalCart.toFixed(2)}</span>
                  {valorInstalacao > 0 && <span className="text-blue-400">+ Instalação: R$ {valorInstalacao.toFixed(2)}</span>}
                </div>
                <p className="text-xl font-black text-emerald-400 mt-1">TOTAL PAGO: R$ {totalFinal.toFixed(2)}</p>
              </div>

              <button
                onClick={handleFinishSale}
                disabled={submitting || cart.length === 0}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-sm font-black text-white shadow-xl hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {submitting ? 'REGISTRANDO VENDA...' : 'CONFIRMAR & FINALIZAR VENDA'}
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
