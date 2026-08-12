'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { User, Role } from '@/lib/db';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: User | null;
  onSaved: () => void;
}

export default function UserModal({
  isOpen,
  onClose,
  userToEdit,
  onSaved
}: UserModalProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState<Role>('FUNCIONARIO');
  const [ativo, setAtivo] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (userToEdit) {
      setNome(userToEdit.nome);
      setEmail(userToEdit.email);
      setMatricula(userToEdit.matricula);
      setSenha('');
      setRole(userToEdit.role);
      setAtivo(userToEdit.ativo);
    } else {
      setNome('');
      setEmail('');
      setMatricula(`FUN${Math.floor(100 + Math.random() * 900)}`);
      setSenha('');
      setRole('FUNCIONARIO');
      setAtivo(true);
    }
    setErrorMsg('');
  }, [userToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email) {
      setErrorMsg('Nome e E-mail são obrigatórios.');
      return;
    }

    if (!userToEdit && !senha) {
      setErrorMsg('Defina uma senha inicial para o novo funcionário.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        id: userToEdit?.id,
        nome,
        email,
        matricula,
        senha: senha || undefined,
        role,
        ativo
      };

      const method = userToEdit ? 'PUT' : 'POST';
      const res = await fetch('/api/usuarios', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar usuário');

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#1e3256] bg-[#0a1120] p-6 shadow-2xl">
        
        <div className="flex items-center justify-between border-b border-[#1e3256] pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#004b9a] text-white">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {userToEdit ? 'Editar Funcionário' : 'Cadastrar Novo Funcionário'}
              </h2>
              <p className="text-xs text-slate-400">Gerenciar acesso de balcão e administração.</p>
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
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Nome Completo *</label>
            <input
              type="text"
              placeholder="Ex: Carlos Eduardo"
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2.5 text-white"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">E-mail Corporativo *</label>
            <input
              type="email"
              placeholder="carlos@jmixbaterias.com.br"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2.5 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Matrícula</label>
              <input
                type="text"
                value={matricula}
                onChange={e => setMatricula(e.target.value)}
                className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Cargo / Função</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as Role)}
                className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2.5 text-white font-bold"
              >
                <option value="FUNCIONARIO">Funcionário / Vendedor</option>
                <option value="ADMIN">Administrador / Gerente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              {userToEdit ? 'Nova Senha (deixe em branco se não for alterar)' : 'Senha Inicial *'}
            </label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2.5 text-white"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="user-ativo"
              checked={ativo}
              onChange={e => setAtivo(e.target.checked)}
              className="h-4 w-4 rounded accent-[#004b9a]"
            />
            <label htmlFor="user-ativo" className="font-semibold text-slate-300 cursor-pointer">
              Conta ativa (Permite efetuar login no sistema)
            </label>
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
              {saving ? 'SALVANDO...' : 'SALVAR FUNCIONÁRIO'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
