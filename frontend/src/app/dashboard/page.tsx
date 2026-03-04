'use client';

import {useAuthStore} from '@/store/authStore';

export default function DashboardPage() {
  const {user, logout} = useAuthStore();

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
              Corelia Dashboard
            </h1>
            <p className="text-gray-400 mt-2">
              Bienvenido de nuevo, {user?.name || user?.email}
            </p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg transition-all">
            Cerrar Sesión
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-blue-500/50 transition-all cursor-pointer group">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-400">
              Edificios
            </h3>
            <p className="text-gray-400 text-sm">
              Gestiona las propiedades y unidades registradas.
            </p>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-indigo-500/50 transition-all cursor-pointer group">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-indigo-400">
              Usuarios
            </h3>
            <p className="text-gray-400 text-sm">
              Administra inquilinos, propietarios y administradores.
            </p>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-purple-500/50 transition-all cursor-pointer group">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-400">
              Pagos
            </h3>
            <p className="text-gray-400 text-sm">
              Control de expensas y estados de cuenta.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
