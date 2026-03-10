import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wider transition-colors',
  {
    variants: {
      intent: {
        success: 'bg-green-500/10 text-green-400',
        danger: 'bg-red-500/10 text-red-400',
        warning: 'bg-yellow-500/10 text-yellow-400',
        default: 'bg-white/10 text-gray-300',
        primary: 'bg-blue-500/10 text-blue-400',
      },
    },
    defaultVariants: {
      intent: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, intent, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ intent }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
