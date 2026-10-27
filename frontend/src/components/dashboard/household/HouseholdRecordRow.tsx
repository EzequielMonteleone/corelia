'use client';

import {Pencil, Trash2} from 'lucide-react';
import {Badge} from '@/components/ui/Badge';
import {Button} from '@/components/ui/Button';

export function HouseholdRecordRow({
  title,
  meta,
  badge,
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
}: {
  title: string;
  meta: string;
  badge?: string;
  editLabel: string;
  deleteLabel: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-white">{title}</p>
          {badge && <Badge intent="primary">{badge}</Badge>}
        </div>
        {meta && <p className="truncate text-sm text-gray-400">{meta}</p>}
      </div>
      <div className="flex shrink-0 gap-1">
        <Button intent="ghost" size="icon" aria-label={editLabel} onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button intent="ghost" size="icon" aria-label={deleteLabel} onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}
