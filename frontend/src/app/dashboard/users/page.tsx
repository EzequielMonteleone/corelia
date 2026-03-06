'use client';

import {useMemo, useState} from 'react';
import {
  User,
  Plus,
  Shield,
  Mail,
  Search,
  Loader2,
  Trash2,
  Edit,
  Filter,
} from 'lucide-react';
import {cn} from '@/lib/utils';
import {useUsers, useUpdateUser} from '@/hooks/useUsers';

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const {data: users, isLoading} = useUsers();
  const updateMutation = useUpdateUser();

  const filteredUsers = useMemo(
    () =>
      users?.filter(
        u =>
          `${u.firstName} ${u.lastName}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery, users],
  );

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Usuarios</h1>
          <p className="text-gray-400">
            Administra el acceso global y roles de los usuarios.
          </p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl transition-all font-medium">
            <Filter className="w-5 h-5" />
            Filtros
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 font-medium">
            <Plus className="w-5 h-5" />
            Invitar Usuario
          </button>
        </div>
      </header>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-gray-400 font-medium">Cargando usuarios...</p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Rol Global
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers?.map(user => (
                <tr
                  key={user.id}
                  className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-gray-500 text-sm flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-indigo-400">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {user.globalRole}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() =>
                        updateMutation.mutate({
                          id: user.id,
                          isActive: !user.isActive,
                        })
                      }
                      className={cn(
                        'text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all',
                        user.isActive
                          ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20',
                      )}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-gray-400 hover:text-white transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filteredUsers?.length && (
            <div className="py-20 text-center">
              <p className="text-gray-500">No se encontraron usuarios.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
