'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Shield, AlertCircle, Key, Mail, BadgeCheck } from 'lucide-react';
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
  const [ativo, setAtivo] = useState<boolean>(true);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (userToEdit) {
      setNome(userToEdit.nome || '');
      setEmail(userToEdit.email || '');
      setMatricula(userToEdit.matricula || '');
      setSenha(''); // Senha vazia no edit = mantém anterior
      setRole(userToEdit.role || 'FUNCIONARIO');
      setAtivo(userToEdit.ativo !== false);
    } else {
      setNome('');
      setEmail('');
      setMatricula('');
      setSenha('123456');
      setRole('FUNCIONARIO');
      setAtivo(true);
    }
    setErrorMsg('');
  }, [userToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email || !matricula) {
      setErrorMsg('Preencha o Nome, E-mail e a Matrícula/Código do funcionário.');
      return;
    }

    if (!userToEdit && (!senha || senha.length < 4)) {
      setErrorMsg('Informe uma senha válida com pelo menos 4 caracteres.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const payload: any = {
        id: userToEdit?.id,
        nome,
        email,
        matricula,
        role,
        ativo
      };

      if (senha && senha.trim().length > 0) {
        payload.senha = senha;
      }

      const url = '/api/usuarios';
      const method = userToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar funcionário');

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
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#1e3256] bg-[#0a1120] p-6 shadow-2xl">
        
        <div className="flex items-center justify-between border-b border-[#1e3256] pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#004b9a] text-white">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {userToEdit ? 'Editar Funcionário' : 'Novo Funcionário'}
              </h2>
              <p className="text-xs text-slate-400">Configure os acessos ao sistema de vendas.</p>
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
              placeholder="Ex: Carlos Eduardo (Balcão)"
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] p-2.5 text-white"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">E-mail de Acesso *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                placeholder="carlos@jmixbaterias.com.br"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] py-2.5 pl-9 pr-3 text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Matrícula / Código *</label>
              <div className="relative">
                <BadgeCheck className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="FUN003"
                  value={matricula}
                  onChange={e => setMatricula(e.target.value)}
                  className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] py-2.5 pl-9 pr-3 text-white uppercase font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Perfil de Acesso</label>
              <div className="relative">
                <Shield className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as Role)}
                  className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] py-2.5 pl-9 pr-3 text-white"
                >
                  <option value="FUNCIONARIO">Funcionário (Vendedor/Balcão)</option>
                  <option value="ADMIN">Dono / Administrador</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              {userToEdit ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha de Acesso *'}
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                placeholder={userToEdit ? '••••••••' : 'Digite a senha do funcionário'}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                className="w-full rounded-lg border border-[#1e3256] bg-[#111d33] py-2.5 pl-9 pr-3 text-white"
                required={!userToEdit}
              />
            </div>
          </div>

          {userToEdit && (
            <div className="flex items-center gap-2 rounded-lg bg-[#111d33] border border-[#1e3256] p-3">
              <input
                type="checkbox"
                id="ativoCheck"
                checked={ativo}
                onChange={e => setAtivo(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-[#004b9a]"
              />
              <label htmlFor="ativoCheck" className="text-xs font-medium text-slate-300 cursor-pointer">
                Conta ativa (permite fazer login no sistema)
              </label>
            </div>
          )}

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
              {saving ? 'SALVANDO...' : userToEdit ? 'SALVAR ALTERAÇÕES' : 'CRIAR FUNCIONÁRIO'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
