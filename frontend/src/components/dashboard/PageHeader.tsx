import React, {ReactNode} from 'react';
import {cn} from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  titleClassName?: string;
}

export function PageHeader({
  title,
  description,
  children,
  className,
  titleClassName,
}: PageHeaderProps) {
  return (
    <header className={cn('flex justify-between items-center mb-8', className)}>
      <div>
        <h1
          className={cn(
            'text-3xl font-bold text-white mb-2 tracking-tight',
            titleClassName,
          )}>
          {title}
        </h1>
        {description && <p className="text-gray-400">{description}</p>}
      </div>
      {children && <div className="flex gap-4">{children}</div>}
    </header>
  );
}
