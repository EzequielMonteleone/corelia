import {ChevronDown} from 'lucide-react';
import {forwardRef, SelectHTMLAttributes} from 'react';
import {cn} from '@/lib/utils';

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({className, children, ...props}, ref) => {
  return (
    <div className={cn('relative w-full', className)}>
      <select
        ref={ref}
        className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-white/5 py-2 pl-3 pr-9 text-sm text-white focus:border-blue-500/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
});
Select.displayName = 'Select';
