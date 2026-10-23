'use client';

import {FormEvent, useState} from 'react';
import {useTranslations} from 'next-intl';
import {toast} from 'sonner';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {useUpdateBuildingAmenity} from '@/hooks/useBuildings';
import {BuildingAmenity} from '@/types/amenity';

export function AmenityBookingForm({
  item,
  buildingId,
}: {
  item: BuildingAmenity;
  buildingId: string;
}) {
  const t = useTranslations('Buildings');
  const updateAmenity = useUpdateBuildingAmenity();
  const [slotMinutes, setSlotMinutes] = useState(String(item.slotMinutes ?? 60));
  const [maxConcurrent, setMaxConcurrent] = useState(String(item.maxConcurrent ?? 1));
  const [openTime, setOpenTime] = useState(item.openTime ?? '08:00');
  const [closeTime, setCloseTime] = useState(item.closeTime ?? '22:00');
  const [rules, setRules] = useState(item.rules ?? '');

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    updateAmenity.mutate(
      {
        id: item.id,
        buildingId,
        slotMinutes: Number(slotMinutes),
        maxConcurrent: Number(maxConcurrent),
        openTime,
        closeTime,
        rules,
      },
      {
        onSuccess: () => toast.success(t('bookingRulesSaved')),
        onError: () => toast.error(t('bookingRulesError')),
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="mt-3 grid gap-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-gray-400">
          {t('slotMinutes')}
          <Input
            type="number"
            min={15}
            max={480}
            value={slotMinutes}
            onChange={event => setSlotMinutes(event.target.value)}
            className="mt-1"
          />
        </label>
        <label className="text-xs text-gray-400">
          {t('maxConcurrent')}
          <Input
            type="number"
            min={1}
            max={50}
            value={maxConcurrent}
            onChange={event => setMaxConcurrent(event.target.value)}
            className="mt-1"
          />
        </label>
        <label className="text-xs text-gray-400">
          {t('openTime')}
          <Input
            type="time"
            value={openTime}
            onChange={event => setOpenTime(event.target.value.slice(0, 5))}
            className="mt-1"
          />
        </label>
        <label className="text-xs text-gray-400">
          {t('closeTime')}
          <Input
            type="time"
            value={closeTime}
            onChange={event => setCloseTime(event.target.value.slice(0, 5))}
            className="mt-1"
          />
        </label>
      </div>
      <label className="text-xs text-gray-400">
        {t('rules')}
        <textarea
          value={rules}
          onChange={event => setRules(event.target.value)}
          placeholder={t('rulesPlaceholder')}
          maxLength={1000}
          className="mt-1 w-full min-h-20 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
        />
      </label>
      <Button type="submit" size="sm" disabled={updateAmenity.isPending}>
        {t('saveBookingRules')}
      </Button>
    </form>
  );
}
