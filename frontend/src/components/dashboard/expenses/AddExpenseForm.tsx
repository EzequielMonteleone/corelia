'use client';

import {Plus} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {Card} from '@/components/ui/Card';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import type {Unit} from '@/types/unit';

interface AddExpenseFormProps {
  availableUnits: Unit[];
  selectedUnitId: string;
  newAmount: string;
  onUnitChange: (id: string) => void;
  onAmountChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export const AddExpenseForm = ({
  availableUnits,
  selectedUnitId,
  newAmount,
  onUnitChange,
  onAmountChange,
  onSubmit,
  isPending,
}: AddExpenseFormProps) => {
  const t = useTranslations('Expenses');

  if (availableUnits.length === 0) return null;

  return (
    <Card className="p-4 max-w-4xl mb-4">
      <div className="flex gap-3">
        <select
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
          value={selectedUnitId}
          onChange={e => onUnitChange(e.target.value)}>
          <option value="" className="bg-[#121212]">
            {t('selectUnit')}
          </option>
          {availableUnits.map(u => (
            <option key={u.id} value={u.id} className="bg-[#121212]">
              {u.name}
              {u.floor ? ` (${u.floor})` : ''}
            </option>
          ))}
        </select>
        <Input
          type="number"
          placeholder={t('amountPlaceholder')}
          value={newAmount}
          onChange={e => onAmountChange(e.target.value)}
          min={0.01}
          step={0.01}
          className="w-36"
        />
        <Button
          onClick={onSubmit}
          disabled={
            !selectedUnitId || !newAmount || parseFloat(newAmount) <= 0 || isPending
          }>
          <Plus className="w-4 h-4 mr-2" />
          {t('addExpense')}
        </Button>
      </div>
    </Card>
  );
};
