import * as React from 'react';
import {cn} from '@/lib/utils';
import {forwardRef} from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({className, type, error, icon, ...props}, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex w-full bg-white/5 border rounded-xl p-3 text-white focus:outline-none transition-all',
            // Variantes para icono
            icon && 'pl-11',
            // Variantes para error
            error
              ? 'border-red-500/50 focus:border-red-500'
              : 'border-white/10 focus:border-blue-500/50',
            // Deshabilitado
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

export {Input};
