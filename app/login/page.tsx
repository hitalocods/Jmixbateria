'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Zap, AlertCircle, ArrowRight, ShieldCheck, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login || !senha) {
      setErrorMsg('Preencha seu e-mail/matrícula e senha.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, senha })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Credenciais inválidas');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao efetuar login.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillQuickDemo = (userEmail: string) => {
    setLogin(userEmail);
    setSenha('123456');
    setErrorMsg('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a1120] p-4 bg-jmix-gradient relative overflow-hidden">
      
      {/* GLOW DECORATIVO DE BATERIA / RAIO */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#004b9a]/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-[#f99b1c]/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#1e3256] bg-[#0d1627]/90 p-8 shadow-2xl backdrop-blur-xl">
        
        {/* LOGO E TÍTULO */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-3 h-20 w-20 overflow-hidden rounded-2xl border-2 border-[#004b9a] p-2 bg-[#0f2744] shadow-xl">
            <Image
              src="/logo.png"
              alt="JMix Baterias 24h"
              fill
              className="object-contain p-1"
              priority
            />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            JMIX <span className="text-[#f99b1c]">BATERIAS</span>
            <span className="rounded-full bg-[#e51b24] px-2 py-0.5 text-xs font-black text-white shadow-sm flex items-center gap-0.5">
              <Zap className="h-3 w-3 fill-current" /> 24H
            </span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Acesso Restrito ao Sistema Interno de Estoque e Vendas
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-800 bg-red-950/70 p-3.5 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">E-mail ou Matrícula</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="ex: admin@jmixbaterias.com.br ou FUN001"
                value={login}
                onChange={e => setLogin(e.target.value)}
                className="w-full rounded-xl border border-[#1e3256] bg-[#111d33] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-[#004b9a] focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Senha de Acesso</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                className="w-full rounded-xl border border-[#1e3256] bg-[#111d33] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-[#004b9a] focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-[#004b9a] via-[#0262c7] to-[#004b9a] py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/50 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <span>{submitting ? 'ENTRANDO...' : 'ENTRAR NO SISTEMA'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* DEMO DE ACESSO RÁPIDO PARA O TESTADOR */}
        <div className="mt-8 border-t border-[#1e3256] pt-6">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
            Acesso Rápido para Teste
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillQuickDemo('admin@jmixbaterias.com.br')}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-[#1e3256] bg-[#111d33] py-2 px-3 text-xs font-semibold text-slate-300 hover:border-[#f99b1c] hover:text-[#f99b1c] transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#f99b1c]" />
              <span>Gerente (Admin)</span>
            </button>

            <button
              type="button"
              onClick={() => fillQuickDemo('carlos@jmixbaterias.com.br')}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-[#1e3256] bg-[#111d33] py-2 px-3 text-xs font-semibold text-slate-300 hover:border-[#004b9a] hover:text-blue-400 transition-colors"
            >
              <User className="h-3.5 w-3.5 text-blue-400" />
              <span>Funcionário</span>
            </button>
          </div>
          <p className="mt-2 text-[10px] text-slate-500 text-center">
            Senha padrão de demonstração: <code className="text-white bg-[#111d33] px-1 rounded">123456</code>
          </p>
        </div>

      </div>
    </div>
  );
}
