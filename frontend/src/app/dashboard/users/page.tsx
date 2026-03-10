'use client';

import {useMemo, useState} from 'react';
import {
  User,
  Plus,
  Shield,
  Mail,
  Search,
  Trash2,
  Edit,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { PageHeader } from '@/components/dashboard/PageHeader';
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
      <PageHeader 
        title="Usuarios" 
        description="Administra el acceso global y roles de los usuarios."
      >
        <Button intent="outline" className="gap-2">
          <Filter className="w-5 h-5" />
          Filtros
        </Button>
        <Button className="gap-2 bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20">
          <Plus className="w-5 h-5" />
          Invitar Usuario
        </Button>
      </PageHeader>

      <div className="mb-6 max-w-md">
        <Input
          type="text"
          placeholder="Buscar por nombre o email..."
          icon={<Search className="w-5 h-5" />}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <LoadingState message="Cargando usuarios..." iconClassName="text-indigo-500" />
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
                      className="cursor-pointer border-0 p-0 m-0 bg-transparent transform transition-transform hover:scale-105"
                    >
                      <Badge intent={user.isActive ? 'success' : 'danger'}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button intent="ghost" size="icon" className="w-8 h-8 rounded-full">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button intent="ghost" size="icon" className="w-8 h-8 rounded-full hover:bg-red-500/10 hover:text-red-400 text-gray-400">
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
