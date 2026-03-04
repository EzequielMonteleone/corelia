'use client';

import Link from 'next/link';
import {useAuthStore} from '@/store/authStore';
import {ArrowRight, Building2, ShieldCheck, Zap} from 'lucide-react';

export default function Home() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-blue-500/30 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse"
        style={{animationDelay: '2s'}}
      />

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Corelia</span>
        </div>
        <Link
          href={isAuthenticated ? '/dashboard' : '/login'}
          className="px-5 py-2 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all duration-200">
          {isAuthenticated ? 'Dashboard' : 'Iniciar Sesión'}
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center pt-24 pb-32 px-4 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-8 animate-fade-in">
          <Zap className="w-3 h-3" />
          <span>ESTADO DEL ARTE EN GESTIÓN</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 leading-tight">
          La nueva era en <br />
          <span className="text-blue-500">administración</span> de edificios.
        </h1>

        <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Centraliza gastos, unidades y comunidad en una plataforma diseñada
          para la excelencia visual y operativa.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link
            href={isAuthenticated ? '/dashboard' : '/login'}
            className="group relative flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-semibold transition-all duration-300 shadow-xl shadow-blue-600/20 hover:scale-105">
            Comenzar Ahora
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl font-semibold transition-all duration-300">
            Ver Demo
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 w-full text-left">
          <div className="p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl hover:border-blue-500/50 transition-colors group">
            <Building2 className="w-10 h-10 text-blue-500 mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold mb-3">Gestión de Unidades</h3>
            <p className="text-gray-400 leading-relaxed text-sm">
              Control total sobre cada propiedad con perfiles detallados de
              inquilinos y propietarios.
            </p>
          </div>
          <div className="p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl hover:border-indigo-500/50 transition-colors group">
            <ShieldCheck className="w-10 h-10 text-indigo-500 mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold mb-3">Seguridad Avanzada</h3>
            <p className="text-gray-400 leading-relaxed text-sm">
              Acceso basado en roles y protección de datos con los estándares
              más altos de la industria.
            </p>
          </div>
          <div className="p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl hover:border-blue-400/50 transition-colors group">
            <Zap className="w-10 h-10 text-blue-400 mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold mb-3">Pagos Digitales</h3>
            <p className="text-gray-400 leading-relaxed text-sm">
              Automatización de expensas y conciliación de pagos en tiempo real
              sin fricciones.
            </p>
          </div>
        </div>
      </main>

      {/* Footer Decoration */}
      <footer className="relative z-10 py-12 border-t border-white/5 text-center text-gray-500 text-sm">
        <p>© 2026 Corelia Platform. Built for Excellence.</p>
      </footer>
    </div>
  );
}
