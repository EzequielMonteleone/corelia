'use client';

import {useAuthStore} from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

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
              Bienvenido de nuevo,{' '}
              {user ? `${user.firstName} ${user.lastName}` : ''}
            </p>
          </div>
          <Button
            intent="destructive"
            onClick={logout}
          >
            Cerrar Sesión
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 hover:border-blue-500/50 cursor-pointer">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-400">
              Edificios
            </h3>
            <p className="text-gray-400 text-sm">
              Gestiona las propiedades y unidades registradas.
            </p>
          </Card>
          <Card className="p-6 hover:border-indigo-500/50 cursor-pointer">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-indigo-400">
              Usuarios
            </h3>
            <p className="text-gray-400 text-sm">
              Administra inquilinos, propietarios y administradores.
            </p>
          </Card>
          <Card className="p-6 hover:border-purple-500/50 cursor-pointer">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-400">
              Pagos
            </h3>
            <p className="text-gray-400 text-sm">
              Control de expensas y estados de cuenta.
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}
