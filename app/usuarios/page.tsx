'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import UserModal from '@/components/UserModal';
import POSModal from '@/components/POSModal';
import { SessionUser } from '@/lib/auth';
import { User as UserType } from '@/lib/db';
import {
  Users,
  UserPlus,
  Edit,
  Shield,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  Zap
} from 'lucide-react';

export default function UsuariosPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [usersList, setUsersList] = useState<UserType[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
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
      if (data.user.role !== 'ADMIN') {
        alert('Acesso exclusivo a administradores.');
        router.push('/');
        return;
      }
      setUser(data.user);
      await fetchUsers();
    } catch (err) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/usuarios');
      const data = await res.json();
      setUsersList(data.users || []);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1120] text-slate-300 font-bold">
        <Zap className="h-6 w-6 text-[#f99b1c] animate-spin mr-2" />
        <span>Carregando Cadastro de Funcionários...</span>
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
                <Users className="h-6 w-6 text-[#004b9a]" />
                Gestão da Equipe & Funcionários
              </h1>
              <p className="text-xs text-slate-400">
                Cadastre a equipe de balcão, defina senhas de acesso e atribua cargos (Admin / Funcionário).
              </p>
            </div>

            <button
              onClick={() => {
                setEditingUser(null);
                setIsUserModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004b9a] to-[#0262c7] px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              <UserPlus className="h-4 w-4" />
              <span>CADASTRAR FUNCIONÁRIO</span>
            </button>
          </div>

          {/* TABELA DE FUNCIONÁRIOS */}
          <div className="jmix-glass rounded-2xl p-5 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1e3256] text-slate-400 uppercase font-bold text-[10px]">
                    <th className="pb-3 px-2">Funcionário</th>
                    <th className="pb-3 px-2">Matrícula / E-mail</th>
                    <th className="pb-3 px-2">Cargo / Permissão</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e3256]/60">
                  {usersList.map(u => (
                    <tr key={u.id} className="hover:bg-[#182846]/40 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#004b9a] text-white font-bold">
                            {u.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm block">{u.nome}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-2">
                        <span className="font-mono text-slate-200 font-bold block">{u.matricula}</span>
                        <span className="text-slate-400 text-[11px]">{u.email}</span>
                      </td>

                      <td className="py-3 px-2">
                        {u.role === 'ADMIN' ? (
                          <span className="inline-flex items-center gap-1 rounded bg-[#f99b1c]/20 px-2 py-0.5 text-[10px] font-bold text-[#f99b1c]">
                            <Shield className="h-3 w-3" /> ADMIN (Gerente)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-blue-950 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-800">
                            <UserIcon className="h-3 w-3" /> FUNCIONÁRIO (Vendas)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-2">
                        {u.ativo ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-400 font-bold text-[11px]">
                            <XCircle className="h-3.5 w-3.5" /> Inativo
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setIsUserModalOpen(true);
                          }}
                          className="rounded-lg border border-[#1e3256] bg-[#111d33] p-1.5 text-slate-300 hover:text-white hover:border-blue-500"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        userToEdit={editingUser}
        onSaved={fetchUsers}
      />

      <POSModal
        isOpen={isPOSOpen}
        onClose={() => setIsPOSOpen(false)}
        user={user}
        onSaleCompleted={fetchUsers}
      />
    </div>
  );
}
