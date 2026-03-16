'use client';

import {QueryClientProvider} from '@tanstack/react-query';
import {ReactNode} from 'react';
import {queryClient} from '@/lib/queryClient';
import {Toaster} from 'sonner';

export default function QueryProvider({children}: {children: ReactNode}) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
