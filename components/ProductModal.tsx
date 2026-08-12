'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, Battery, AlertCircle } from 'lucide-react';
import { Product, TipoProduto, PoloBateria, AplicacaoBateria, TecnologiaBateria } from '@/lib/db';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  defaultTipo?: TipoProduto;
  onSaved: () => void;
}

export default function ProductModal({
  isOpen,
  onClose,
  productToEdit,
  defaultTipo = 'NOVA',
  onSaved
}: ProductModalProps) {
  const [tipo, setTipo] = useState<TipoProduto>(defaultTipo);
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [amperagem, setAmperagem] = useState<number>(60);
  const [voltagem, setVoltagem] = useState('12V');
  const [cca, setCca] = useState<number>(460);
  const [polo, setPolo] = useState<PoloBateria>('DIREITO');
  const [aplicacao, setAplicacao] = useState<AplicacaoBateria>('CARRO');
  const [tecnologia, setTecnologia] = useState<TecnologiaBateria>('SLI');
  const [saudePct, setSaudePct] = useState<number>(100);
  const [garantiaMeses, setGarantiaMeses] = useState<number>(24);
  const [precoCusto, setPrecoCusto] = useState<number>(0);
  const [precoVenda, setPrecoVenda] = useState<number>(0);
  const [estoque, setEstoque] = useState<number>(5);
  const [estoqueMinimo, setEstoqueMinimo] = useState<number>(2);
  const [imagemUrl, setImagemUrl] = useState('/logo.png');
  const [descricao, setDescricao] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setTipo(productToEdit.tipo);
      setMarca(productToEdit.marca);
      setModelo(productToEdit.modelo);
      setAmperagem(productToEdit.amperagem);
      setVoltagem(productToEdit.voltagem);
      setCca(productToEdit.cca);
      setPolo(productToEdit.polo);
      setAplicacao(productToEdit.aplicacao);
      setTecnologia(productToEdit.tecnologia);
      setSaudePct(productToEdit.saudePct);
      setGarantiaMeses(productToEdit.garantiaMeses);
      setPrecoCusto(productToEdit.precoCusto);
      setPrecoVenda(productToEdit.precoVenda);
      setEstoque(productToEdit.estoque);
      setEstoqueMinimo(productToEdit.estoqueMinimo);
      setImagemUrl(productToEdit.imagemUrl || '/logo.png');
      setDescricao(productToEdit.descricao || '');
    } else {
      setTipo(defaultTipo);
      setMarca('');
      setModelo('');
      setAmperagem(60);
      setVoltagem('12V');
      setCca(460);
      setPolo('DIREITO');
      setAplicacao('CARRO');
      setTecnologia('SLI');
      setSaudePct(defaultTipo === 'SEMI_NOVA' ? 85 : 100);
      setGarantiaMeses(defaultTipo === 'SEMI_NOVA' ? 3 : 24);
      setPrecoCusto(0);
      setPrecoVenda(0);
      setEstoque(5);
      setEstoqueMinimo(2);
      setImagemUrl('/logo.png');
      setDescricao('');
    }
    setErrorMsg('');
  }, [productToEdit, defaultTipo, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marca || !modelo || precoVenda <= 0) {
      setErrorMsg('Preencha a Marca, Modelo e um Preço de Venda válido.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        tipo,
        marca,
        modelo,
        amperagem,
        voltagem,
        cca,
        polo,
        aplicacao,
        tecnologia,
        saudePct,
        garantiaMeses,
        precoCusto,
        precoVenda,
        estoque,
        estoqueMinimo,
        imagemUrl,
        descricao
      };

      const url = productToEdit ? `/api/produtos/${productToEdit.id}` : '/api/produtos';
      const method = productToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar produto');

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#1e3256] bg-[#0a1120] p-6 shadow-2xl">
        
        <div className="flex items-center justify-between border-b border-[#1e3256] pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#004b9a] text-white">
              <Battery className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {productToEdit ? 'Editar Bateria' : `Cadastrar Bateria ${tipo === 'NOVA' ? 'Nova' : 'Semi-Nova'}`}
              </h2>
              <p className="text-xs text-slate-400">Preencha as especificações técnicas e quantidade.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-950/60 border border-red-800 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Tipo da Bateria</label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value as TipoProduto)}
                className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2.5 text-white"
              >
                <option value="NOVA">Nova (Lacrada com Garantia)</option>
                <option value="SEMI_NOVA">Semi-Nova (Testada / Recondicionada)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Marca *</label>
              <input
                type="text"
                placeholder="Ex: MOURA, HELIAR, BOSCH, KONDOR"
                value={marca}
                onChange={e => setMarca(e.target.value)}
                className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2.5 text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Modelo *</label>
              <input
                type="text"
                placeholder="Ex: M60AD, H60HD"
                value={modelo}
                onChange={e => setModelo(e.target.value)}
                className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2.5 text-white"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Amperagem (Ah) *</label>
              <input
                type="number"
                value={amperagem}
                onChange={e => setAmperagem(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2.5 text-white"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">CCA (Partida a frio)</label>
              <input
                type="number"
                value={cca}
                onChange={e => setCca(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2.5 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Voltagem</label>
              <select
                value={voltagem}
                onChange={e => setVoltagem(e.target.value)}
                className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2.5 text-white"
              >
                <option value="12V">12V</option>
                <option value="24V">24V</option>
                <option value="6V">6V</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Lado do Polo</label>
              <select
                value={polo}
                onChange={e => setPolo(e.target.value as PoloBateria)}
                className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2.5 text-white"
              >
                <option value="DIREITO">Direito (+ Direita)</option>
                <option value="ESQUERDO">Esquerdo (+ Esquerda)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Aplicação</label>
              <select
                value={aplicacao}
                onChange={e => setAplicacao(e.target.value as AplicacaoBateria)}
                className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2.5 text-white"
              >
                <option value="CARRO">Carro de Passeio / SUV</option>
                <option value="MOTO">Moto / Quadriciclo</option>
                <option value="CAMINHAO">Caminhão / Pesado</option>
                <option value="ESTACIONARIA">Estacionária / Nobreak</option>
                <option value="SOM">Som Automotivo</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Tecnologia</label>
              <select
                value={tecnologia}
                onChange={e => setTecnologia(e.target.value as TecnologiaBateria)}
                className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2.5 text-white"
              >
                <option value="SLI">SLI (Padrão Alagada)</option>
                <option value="EFB">EFB (Start-Stop Básico)</option>
                <option value="AGM">AGM (Start-Stop Avançado)</option>
                <option value="GEL">GEL / Lítio</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Garantia (Meses)</label>
              <input
                type="number"
                value={garantiaMeses}
                onChange={e => setGarantiaMeses(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2.5 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Saúde (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={saudePct}
                onChange={e => setSaudePct(parseInt(e.target.value) || 100)}
                className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2.5 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Preço Custo (R$)</label>
              <input
                type="number"
                step="0.01"
                value={precoCusto}
                onChange={e => setPrecoCusto(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2.5 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Preço Venda (R$) *</label>
              <input
                type="number"
                step="0.01"
                value={precoVenda}
                onChange={e => setPrecoVenda(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2.5 text-emerald-400 font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Estoque Atual (Unidades)</label>
              <input
                type="number"
                value={estoque}
                onChange={e => setEstoque(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2.5 text-white font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Estoque Mínimo (Alerta)</label>
              <input
                type="number"
                value={estoqueMinimo}
                onChange={e => setEstoqueMinimo(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2.5 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Observações / Descrição</label>
            <textarea
              rows={2}
              placeholder="Detalhes adicionais de uso, tabela de aplicação em carros..."
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2.5 text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1e3256]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#1e3256] px-4 py-2 text-slate-300 hover:bg-[#111d33]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gradient-to-r from-[#004b9a] to-[#0262c7] px-5 py-2 font-bold text-white shadow-md hover:brightness-110"
            >
              {saving ? 'SALVANDO...' : 'SALVAR BATERIA'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
