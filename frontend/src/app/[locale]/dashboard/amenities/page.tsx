'use client';

import {useEffect, useMemo, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {CalendarDays, ChevronLeft, ChevronRight} from 'lucide-react';
import {toast} from 'sonner';
import {isAxiosError} from 'axios';
import {PageHeader} from '@/components/dashboard/PageHeader';
import {Card} from '@/components/ui/Card';
import {Button} from '@/components/ui/Button';
import {Badge} from '@/components/ui/Badge';
import {LoadingState} from '@/components/ui/LoadingState';
import {Select} from '@/components/ui/Select';
import {ConfirmDialog} from '@/components/ui/ConfirmDialog';
import {useAuthStore} from '@/store/authStore';
import {useBuildingAmenities, useBuildingUnits, useBuildings} from '@/hooks/useBuildings';
import {
  useCancelReservation,
  useCreateReservation,
  useReservations,
} from '@/hooks/useReservations';
import {
  APP_TIMEZONE,
  formatHm,
  shiftDateKey,
  slotsForWindow,
  todayKey,
  zonedClock,
  zonedDateTime,
} from '@/lib/zonedTime';
import {cn} from '@/lib/utils';

function errorCode(error: unknown) {
  if (isAxiosError(error)) {
    const code = error.response?.data?.error;
    if (typeof code === 'string') return code;
  }
  return 'UNKNOWN';
}

export default function AmenitiesPage() {
  const t = useTranslations('Amenities');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const user = useAuthStore(state => state.user);
  const isSuperAdmin = user?.globalRole === 'SUPERADMIN';

  const {data: buildings = [], isLoading: loadingBuildings} = useBuildings();
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedAmenityId, setSelectedAmenityId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [day, setDay] = useState(todayKey);
  const [now, setNow] = useState(() => Date.now());
  const [notes, setNotes] = useState('');
  const [cancelReservationId, setCancelReservationId] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const activeBuildingId = useMemo(
    () => selectedBuildingId || (buildings.length === 1 ? buildings[0].id : ''),
    [buildings, selectedBuildingId],
  );

  const canManage = useMemo(
    () =>
      isSuperAdmin ||
      (!!activeBuildingId &&
        user?.buildingUsers?.some(
          bu => bu.buildingId === activeBuildingId && bu.role?.name === 'Admin',
        )),
    [activeBuildingId, isSuperAdmin, user?.buildingUsers],
  );

  const {data: amenitiesData, isLoading: loadingAmenities} = useBuildingAmenities(
    activeBuildingId || null,
  );
  const {data: units = []} = useBuildingUnits(activeBuildingId || null);
  const enabledAmenities = (amenitiesData?.amenities ?? []).filter(item => item.isEnabled);
  const amenity =
    enabledAmenities.find(item => item.id === selectedAmenityId) ?? enabledAmenities[0];

  const range = useMemo(() => {
    const from = zonedDateTime(day, '00:00');
    const to = zonedDateTime(shiftDateKey(day, 1), '00:00');
    return {from: from.toISOString(), to: to.toISOString()};
  }, [day]);

  const {data: reservations = [], isLoading: loadingReservations} = useReservations(
    activeBuildingId || null,
    activeBuildingId ? range : null,
    amenity?.id ?? null,
  );
  const createReservation = useCreateReservation();
  const cancelReservation = useCancelReservation();

  const slots = amenity
    ? slotsForWindow(amenity.openTime, amenity.closeTime, amenity.slotMinutes)
    : [];

  const unitId = selectedUnitId || (units.length === 1 ? units[0].id : '');

  const reserve = (hm: string) => {
    if (!activeBuildingId || !amenity) return;
    if (!unitId) {
      toast.error(t('selectUnit'));
      return;
    }
    createReservation.mutate(
      {
        buildingId: activeBuildingId,
        buildingAmenityId: amenity.id,
        unitId,
        startsAt: zonedDateTime(day, hm).toISOString(),
        ...(notes.trim() ? {notes: notes.trim()} : {}),
      },
      {
        onSuccess: () => {
          toast.success(t('reserveSuccess'));
          setNotes('');
        },
        onError: error => {
          const code = errorCode(error);
          if (code === 'SLOT_UNAVAILABLE') toast.error(t('slotUnavailable'));
          else if (code === 'SLOT_OUTSIDE_HOURS') toast.error(t('slotOutsideHours'));
          else if (code === 'SLOT_IN_PAST') toast.error(t('slotInPast'));
          else if (code === 'SLOT_TOO_FAR') toast.error(t('slotTooFar'));
          else if (code === 'AMENITY_DISABLED') toast.error(t('amenityDisabled'));
          else if (code === 'UNIT_NOT_LINKED') toast.error(t('unitNotLinked'));
          else if (code === 'UNIT_ALREADY_BOOKED') toast.error(t('unitAlreadyBooked'));
          else toast.error(t('reserveError'));
        },
      },
    );
  };

  const requestCancel = (id: string) => setCancelReservationId(id);

  const confirmCancel = () => {
    if (!cancelReservationId) return;
    cancelReservation.mutate(cancelReservationId, {
      onSuccess: () => {
        toast.success(t('cancelSuccess'));
        setCancelReservationId(null);
      },
      onError: () => toast.error(t('cancelError')),
    });
  };

  const dayLabel = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: APP_TIMEZONE,
  }).format(zonedDateTime(day, '12:00'));

  const isLoading = loadingBuildings || (!!activeBuildingId && loadingAmenities);
  const isToday = day === todayKey();

  return (
    <div className="p-8">
      <PageHeader title={t('title')} description={t('description')}>
        {(isSuperAdmin || buildings.length > 1) && (
          <Select
            className="w-56 shrink-0"
            value={activeBuildingId}
            onChange={event => {
              setSelectedBuildingId(event.target.value);
              setSelectedAmenityId('');
              setSelectedUnitId('');
            }}>
            <option value="">{t('selectBuilding')}</option>
            {buildings.map(building => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </Select>
        )}
      </PageHeader>

      {isLoading ? (
        <LoadingState message={t('loading')} />
      ) : !activeBuildingId ? (
        <Card className="p-8 text-center">
          <CalendarDays className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">{t('selectBuilding')}</p>
        </Card>
      ) : enabledAmenities.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-400">{t('empty')}</p>
        </Card>
      ) : (
        <div className="max-w-3xl space-y-4">
          <div className="flex flex-wrap gap-2">
            {enabledAmenities.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedAmenityId(item.id)}
                className={cn(
                  'px-4 py-2 rounded-xl border text-sm',
                  item.id === amenity?.id
                    ? 'border-blue-500/50 bg-blue-500/10 text-blue-300'
                    : 'border-white/10 text-gray-300 hover:bg-white/5',
                )}>
                {item.amenity.name}
              </button>
            ))}
          </div>

          {amenity?.rules && (
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                {t('rules')}
              </p>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{amenity.rules}</p>
            </Card>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                intent="ghost"
                size="icon"
                onClick={() => setDay(value => shiftDateKey(value, -1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <p className="text-white font-medium capitalize min-w-48 text-center">
                {dayLabel}
              </p>
              <Button
                intent="ghost"
                size="icon"
                onClick={() => setDay(value => shiftDateKey(value, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              {!isToday && (
                <Button intent="ghost" size="sm" onClick={() => setDay(todayKey())}>
                  {t('goToToday')}
                </Button>
              )}
            </div>
            {units.length > 1 && (
              <Select
                className="w-48 shrink-0"
                value={unitId}
                onChange={event => setSelectedUnitId(event.target.value)}>
                <option value="">{t('selectUnit')}</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </Select>
            )}
          </div>

          <label className="block text-xs text-gray-400">
            {t('notes')}
            <textarea
              value={notes}
              onChange={event => setNotes(event.target.value)}
              placeholder={t('notesPlaceholder')}
              maxLength={500}
              rows={2}
              className="mt-1 w-full min-h-16 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50"
            />
          </label>

          {loadingReservations ? (
            <LoadingState message={t('loadingSlots')} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {slots.map(hm => {
                const matches = reservations.filter(reservation => {
                  const clock = zonedClock(new Date(reservation.startsAt));
                  return clock.day === day && formatHm(clock.minutes) === hm;
                });
                const mineReservation = matches.find(reservation => reservation.mine);
                const slotStart = zonedDateTime(day, hm);
                const past = slotStart.getTime() < now - 60_000;
                const full = matches.length >= (amenity?.maxConcurrent ?? 1);
                const mine = !!mineReservation;
                return (
                  <button
                    key={hm}
                    type="button"
                    disabled={
                      (!mine && (past || full)) ||
                      createReservation.isPending ||
                      cancelReservation.isPending
                    }
                    onClick={() => {
                      if (mineReservation) {
                        requestCancel(mineReservation.id);
                        return;
                      }
                      reserve(hm);
                    }}
                    className={cn(
                      'rounded-xl border px-3 py-3 text-left transition-colors',
                      mine
                        ? 'border-blue-500/50 bg-blue-500/10 hover:border-red-500/40'
                        : full
                          ? 'border-white/5 bg-white/[0.02] text-gray-500 cursor-not-allowed'
                          : past
                            ? 'border-white/5 bg-white/[0.02] text-gray-500 cursor-not-allowed'
                            : 'border-white/10 hover:border-blue-500/40 hover:bg-white/5',
                    )}>
                    <p
                      className={cn(
                        'font-medium',
                        full && !mine ? 'text-gray-500' : 'text-white',
                      )}>
                      {hm}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {mine
                        ? t('yourReservation')
                        : past
                          ? t('past')
                          : full
                            ? t('full')
                            : t('available', {
                                taken: matches.length,
                                capacity: amenity?.maxConcurrent ?? 1,
                              })}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          <Card className="p-4">
            <h2 className="text-sm font-semibold text-white mb-3">{t('dayReservations')}</h2>
            {reservations.length === 0 ? (
              <p className="text-sm text-gray-500">{t('noReservations')}</p>
            ) : (
              <div className="space-y-2">
                {reservations.map(reservation => {
                  const start = zonedClock(new Date(reservation.startsAt));
                  const end = zonedClock(new Date(reservation.endsAt));
                  return (
                    <div
                      key={reservation.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2">
                      <div>
                        <p className="text-white text-sm">
                          {formatHm(start.minutes)} – {formatHm(end.minutes)} ·{' '}
                          {reservation.unit.name}
                        </p>
                        {reservation.user && (
                          <p className="text-xs text-gray-500">
                            {reservation.user.firstName} {reservation.user.lastName}
                          </p>
                        )}
                        {reservation.notes && (
                          <p className="text-xs text-gray-400 mt-1 whitespace-pre-wrap">
                            {reservation.notes}
                          </p>
                        )}
                      </div>
                      {(reservation.mine || canManage) && (
                        <div className="flex items-center gap-2">
                          {reservation.mine && <Badge intent="primary">{t('yours')}</Badge>}
                          <Button
                            intent="ghost"
                            size="sm"
                            disabled={cancelReservation.isPending}
                            onClick={() => requestCancel(reservation.id)}>
                            {t('cancel')}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!cancelReservationId}
        title={t('cancelConfirmTitle')}
        description={t('cancelConfirmDescription')}
        confirmLabel={tCommon('confirm')}
        cancelLabel={tCommon('cancel')}
        isPending={cancelReservation.isPending}
        onCancel={() => setCancelReservationId(null)}
        onConfirm={confirmCancel}
      />
    </div>
  );
}
