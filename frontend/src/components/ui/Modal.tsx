import * as React from 'react';
import {X} from 'lucide-react';
import {cn} from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
}: ModalProps) {
  // Evitamos renderizar si no está abierto
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm -z-10 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Contenedor del Modal */}
      <div
        className={cn(
          'w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200',
          className,
        )}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-white/5 rounded-full hover:text-white transition-colors"
            aria-label="Cerrar modal">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido */}
        <div>{children}</div>
      </div>
    </div>
  );
}
