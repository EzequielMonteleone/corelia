import {Loader2} from 'lucide-react';
import {cn} from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  iconClassName?: string;
  className?: string;
}

export function LoadingState({
  message = 'Cargando...',
  iconClassName,
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-20',
        className,
      )}>
      <Loader2
        className={cn(
          'w-10 h-10 text-blue-500 animate-spin mb-4',
          iconClassName,
        )}
      />
      <p className="text-gray-400 font-medium">{message}</p>
    </div>
  );
}
