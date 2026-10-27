'use client';

import {ReactNode} from 'react';
import {Plus} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/Card';
import {Button} from '@/components/ui/Button';

export function HouseholdSection({
  icon,
  title,
  addLabel,
  adding,
  onAdd,
  children,
}: {
  icon: ReactNode;
  title: string;
  addLabel: string;
  adding: boolean;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
        <Button intent="outline" size="sm" onClick={onAdd} disabled={adding}>
          <Plus className="mr-1 h-4 w-4" />
          {addLabel}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
