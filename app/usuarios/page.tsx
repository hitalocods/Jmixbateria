'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import UserModal from '@/components/UserModal';
import { User } from '@/lib/db';
import { UserPlus, Shield, CheckCircle, XCircle, Search, Edit, Trash2, Users, AlertTriangle } from 'lucide-react';

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  // Exclusão
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchSessionAndUsers = async () => {
    try {
      const [resMe, resUsers] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/usuarios')
      ]);

      if (resMe.ok) {
        const dataMe = await resMe.json();
        setSessionUser(dataMe.user || dataMe);
      }

      if (resUsers.ok) {
        const dataUsers = await resUsers.json();
        if (Array.isArray(dataUsers)) {
          setUsers(dataUsers);
        } else if (Array.isArray(dataUsers.users)) {
          setUsers(dataUsers.users);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionAndUsers();
  }, []);

  const handleOpenCreate = () => {
    setUserToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch(`/api/usuarios?id=${userToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir funcionário');

      setUserToDelete(null);
      await fetchSessionAndUsers();
    } catch (err: any) {
      setDeleteError(err.message || 'Erro ao excluir.');
    } finally {
      setDeleting(false);
    }
  };

  const safeUsers = Array.isArray(users) ? users : [];
  const isAdmin = sessionUser?.role === 'ADMIN';

  const filteredUsers = safeUsers.filter(u =>
    (u.nome && u.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.matricula && u.matricula.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#060b14] text-slate-100 flex flex-col font-sans">
      <Navbar sessionUser={sessionUser} />

      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar user={sessionUser} activePath="/usuarios" />

        <main className="flex-1 p-4 md:p-8 space-y-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1e3256] pb-6">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-7 w-7 text-[#004b9a]" />
                <h1 className="text-2xl font-black text-white tracking-tight">Equipe & Controle de Funcionários</h1>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Cadastre, altere dados/senhas e gerencie a equipe de vendas do balcão.
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={handleOpenCreate}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004b9a] via-[#0262c7] to-[#004b9a] px-5 py-3 text-sm font-black text-white shadow-xl hover:brightness-110 active:scale-95 transition-all"
              >
                <UserPlus className="h-4 w-4" />
                <span>+ Novo Funcionário</span>
              </button>
            )}
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-3 bg-[#0a1120] border border-[#1e3256] rounded-2xl p-3 shadow-lg">
            <Search className="h-5 w-5 text-slate-400 ml-1" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou matrícula (ex: FUN001)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Lista de Usuários */}
          <div className="rounded-2xl border border-[#1e3256] bg-[#0a1120] overflow-hidden shadow-xl">
            
            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#004b9a] border-t-transparent mb-3"></div>
                <p className="text-xs font-semibold">Carregando equipe...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <p className="text-sm font-semibold">Nenhum funcionário encontrado.</p>
                <p className="text-xs text-slate-500 mt-1">Tente pesquisar com outro termo ou cadastre um novo funcionário.</p>
              </div>
            ) : (
              <div>
                {/* Visualização Desktop (Tabela) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#111d33] text-xs uppercase text-slate-300 font-bold border-b border-[#1e3256]">
                      <tr>
                        <th className="px-6 py-4">Colaborador</th>
                        <th className="px-6 py-4">Matrícula</th>
                        <th className="px-6 py-4">Perfil de Acesso</th>
                        <th className="px-6 py-4">Status</th>
                        {isAdmin && <th className="px-6 py-4 text-right">Ações</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e3256]/60">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-[#111d33]/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#004b9a]/20 border border-[#004b9a]/40 text-[#004b9a] font-black text-sm">
                                {u.nome ? u.nome.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm">{u.nome}</p>
                                <p className="text-xs text-slate-400">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs font-bold text-slate-300 bg-[#111d33] px-2.5 py-1 rounded-md border border-[#1e3256]">
                              {u.matricula}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {u.role === 'ADMIN' ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/30">
                                <Shield className="h-3.5 w-3.5" /> Dono / Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-400 border border-blue-500/30">
                                Funcionário (Balcão)
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {u.ativo !== false ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                                <CheckCircle className="h-4 w-4" /> Ativo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                                <XCircle className="h-4 w-4" /> Inativo
                              </span>
                            )}
                          </td>
                          {isAdmin && (
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenEdit(u)}
                                  className="flex items-center gap-1.5 rounded-lg border border-[#1e3256] bg-[#111d33] px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-[#1e3256] hover:text-white transition-all"
                                >
                                  <Edit className="h-3.5 w-3.5 text-blue-400" />
                                  <span>Editar</span>
                                </button>
                                
                                {u.id !== sessionUser?.id && (
                                  <button
                                    onClick={() => setUserToDelete(u)}
                                    className="flex items-center gap-1.5 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-900/70 hover:text-white transition-all"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                    <span>Excluir</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Visualização Mobile (Cards) */}
                <div className="block md:hidden divide-y divide-[#1e3256]">
                  {filteredUsers.map(u => (
                    <div key={u.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#004b9a]/20 border border-[#004b9a]/40 text-[#004b9a] font-bold">
                            {u.nome ? u.nome.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{u.nome}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>

                        <span className="font-mono text-xs font-bold text-slate-300 bg-[#111d33] px-2 py-0.5 rounded border border-[#1e3256]">
                          {u.matricula}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          {u.role === 'ADMIN' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30">
                              <Shield className="h-3 w-3" /> Dono
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/30">
                              Funcionário
                            </span>
                          )}
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="flex items-center gap-1 rounded-lg border border-[#1e3256] bg-[#111d33] px-3 py-1.5 text-xs font-semibold text-slate-200"
                            >
                              <Edit className="h-3.5 w-3.5 text-blue-400" />
                              <span>Editar</span>
                            </button>

                            {u.id !== sessionUser?.id && (
                              <button
                                onClick={() => setUserToDelete(u)}
                                className="flex items-center gap-1 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-1.5 text-xs font-semibold text-red-300"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                <span>Excluir</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </main>
      </div>

      {/* Modal de Criar / Editar Usuário */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userToEdit={userToEdit}
        onSaved={fetchSessionAndUsers}
      />

      {/* Modal de Confirmação de Exclusão */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-900/60 bg-[#0a1120] p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center gap-3 text-red-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-950 border border-red-800">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Excluir Funcionário</h3>
            </div>

            <p className="text-xs md:text-sm text-slate-300">
              Tem certeza que deseja remover o funcionário <strong className="text-white">{userToDelete.nome}</strong> ({userToDelete.email})? 
              Ele perderá o acesso ao sistema imediatamente.
            </p>

            {deleteError && (
              <div className="rounded-lg bg-red-950 border border-red-800 p-3 text-xs text-red-300">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="rounded-lg border border-[#1e3256] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-[#111d33]"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="rounded-lg bg-gradient-to-r from-red-600 to-rose-700 px-5 py-2 text-xs font-bold text-white shadow-lg hover:brightness-110"
              >
                {deleting ? 'EXCLUINDO...' : 'SIM, EXCLUIR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
