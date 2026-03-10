import * as React from 'react';
import {cva, type VariantProps} from 'class-variance-authority';
import {Loader2} from 'lucide-react';
import {cn} from '@/lib/utils';
import {ButtonHTMLAttributes, forwardRef} from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      intent: {
        primary:
          'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20 focus-visible:ring-blue-500',
        destructive:
          'bg-red-500/10 text-red-400 hover:bg-red-500/20 focus-visible:ring-red-500',
        ghost: 'text-gray-400 hover:bg-white/5 hover:text-white',
        outline:
          'border border-white/10 bg-transparent hover:bg-white/5 text-white',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-11 rounded-xl px-8',
        icon: 'h-10 w-10 p-2', // Ideal para íconos solos
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      intent: 'primary',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      intent,
      size,
      fullWidth,
      isLoading,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        className={cn(buttonVariants({intent, size, fullWidth, className}))}
        ref={ref}
        disabled={isLoading || disabled}
        {...props}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isLoading && children}
        {isLoading && (children ? children : 'Cargando...')}
      </button>
    );
  },
);
Button.displayName = 'Button';

export {Button, buttonVariants};
