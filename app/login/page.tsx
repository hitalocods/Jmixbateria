'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      setErrorMsg('Por favor, informe o e-mail e a senha.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Credenciais inválidas.');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#060b14] p-4 text-slate-100 font-sans overflow-hidden">
      
      {/* Luzes de Fundo Estilizadas */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#004b9a]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#e51b24]/10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6">
        
        {/* Card Principal de Login */}
        <div className="rounded-3xl border border-[#1e3256] bg-[#0a1120]/90 p-8 shadow-2xl backdrop-blur-xl">
          
          {/* Header com Logo */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 relative h-20 w-44">
              <Image
                src="/logo.png"
                alt="JMix Baterias 24h"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">JMix Baterias 24h</h1>
            <p className="text-xs text-slate-400 mt-1">Acesso ao sistema de estoque e balcão</p>
          </div>

          {/* Erro ao tentar logar */}
          {errorMsg && (
            <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-950/80 border border-red-800 p-3.5 text-xs text-red-200 shadow-md">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Formulário de Login Único */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1.5">E-mail de acesso</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="seuemail@jmixbaterias.com.br"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#1e3256] bg-[#111d33] py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-[#004b9a] focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  className="w-full rounded-xl border border-[#1e3256] bg-[#111d33] py-3 pl-10 pr-11 text-sm text-white placeholder-slate-500 focus:border-[#004b9a] focus:outline-none transition-colors"
                  required
                />
                
                {/* Botão de Ver / Ocultar Senha */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-white p-1"
                  title={showPassword ? "Ocultar Senha" : "Ver Senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004b9a] via-[#0262c7] to-[#004b9a] py-3.5 text-sm font-black text-white shadow-xl shadow-[#004b9a]/30 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>VERIFICANDO CREDENCIAIS...</span>
              ) : (
                <>
                  <span>ENTRAR NO SISTEMA</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Rodapé Seguro */}
        <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-500">
          <ShieldCheck className="h-4 w-4 text-[#004b9a]" />
          <span>Sistema Seguro JMix Baterias 24h</span>
        </div>

      </div>
    </div>
  );
}
