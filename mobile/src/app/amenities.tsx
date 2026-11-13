import {useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {AppHeader, IconButton} from '@/components/layout/AppHeader';
import {BuildingSwitcher} from '@/components/layout/BuildingSwitcher';
import {Section} from '@/components/layout/Section';
import {RequireAccess} from '@/components/layout/RequireAccess';
import {Badge} from '@/components/ui/Badge';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {ConfirmDialog} from '@/components/ui/ConfirmDialog';
import {Input} from '@/components/ui/Input';
import {Select} from '@/components/ui/Select';
import {EmptyState, ErrorState, LoadingState} from '@/components/ui/States';
import {Screen} from '@/components/ui/Screen';
import {useActiveBuilding} from '@/hooks/useActiveBuilding';
import {
  useBuildingAmenities,
  useBuildingUnits,
} from '@/hooks/queries/useBuildings';
import {
  useCancelReservation,
  useCreateReservation,
  useReservations,
} from '@/hooks/queries/useReservations';
import {
  APP_TIMEZONE,
  formatHm,
  shiftDateKey,
  todayKey,
  zonedClock,
  zonedDateTime,
} from '@/lib/zonedTime';
import {formatLongDate} from '@/lib/format';
import {errorMessage} from '@/lib/apiError';
import {toast} from '@/store/toastStore';
import type {AmenityReservation} from '@/types/amenity';
import {colors, radius, spacing, typography} from '@/theme';

export default function AmenitiesScreen() {
  const router = useRouter();
  const {
    buildings,
    activeBuilding,
    activeBuildingId,
    setSelectedBuildingId,
    isLoading: loadingBuildings,
    isRefetching: buildingsRefetching,
    isError: buildingsError,
    refetch: refetchBuildings,
  } = useActiveBuilding();
  const amenitiesQuery = useBuildingAmenities(activeBuildingId);
  const unitsQuery = useBuildingUnits(activeBuildingId);
  const createReservation = useCreateReservation();
  const cancelReservation = useCancelReservation();

  const [selectedAmenityId, setSelectedAmenityId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [day, setDay] = useState(todayKey);
  const [notes, setNotes] = useState('');
  const [cancelId, setCancelId] = useState<string | null>(null);

  const enabledAmenities = useMemo(
    () => (amenitiesQuery.data?.amenities ?? []).filter(item => item.isEnabled),
    [amenitiesQuery.data],
  );
  const amenity =
    enabledAmenities.find(item => item.id === selectedAmenityId) ??
    enabledAmenities[0];
  const units = unitsQuery.data ?? [];
  const unitId = selectedUnitId || (units.length === 1 ? units[0].id : '');
  const canManage = !!activeBuilding?.canManage;

  const range = useMemo(() => {
    if (!activeBuildingId) return null;
    return {
      from: zonedDateTime(day, '00:00').toISOString(),
      to: zonedDateTime(shiftDateKey(day, 1), '00:00').toISOString(),
    };
  }, [activeBuildingId, day]);

  const reservationsQuery = useReservations(
    activeBuildingId,
    range,
    amenity?.id ?? null,
  );
  const reservations = reservationsQuery.data?.reservations ?? [];
  const slots = reservationsQuery.data?.slots ?? [];

  const dayLabel = useMemo(() => {
    const label = formatLongDate(
      zonedDateTime(day, '12:00'),
      'es-AR',
      APP_TIMEZONE,
    );
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [day]);

  const reserve = (hm: string) => {
    if (!activeBuildingId || !amenity) return;
    if (!unitId) {
      toast.error('Seleccioná la unidad para la reserva.');
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
          toast.success('Reserva confirmada.');
          setNotes('');
        },
        onError: error => toast.error(errorMessage(error)),
      },
    );
  };

  const confirmCancel = () => {
    if (!cancelId) return;
    cancelReservation.mutate(cancelId, {
      onSuccess: () => {
        toast.success('Reserva cancelada.');
        setCancelId(null);
      },
      onError: error => toast.error(errorMessage(error)),
    });
  };

  const reservationClock = (reservation: AmenityReservation) => {
    const start = zonedClock(new Date(reservation.startsAt), APP_TIMEZONE);
    const end = zonedClock(new Date(reservation.endsAt), APP_TIMEZONE);
    return `${formatHm(start.minutes)}–${formatHm(end.minutes)}`;
  };

  const changeBuilding = (value: string) => {
    setSelectedBuildingId(value);
    setSelectedAmenityId('');
    setSelectedUnitId('');
  };

  if (loadingBuildings) {
    return (
      <RequireAccess path="/amenities">
        <Screen>
          <AppHeader
            title="Amenities"
            showBell={false}
            onBack={() => router.back()}
          />
          <LoadingState message="Cargando amenities..." />
        </Screen>
      </RequireAccess>
    );
  }

  if (buildingsError) {
    return (
      <RequireAccess path="/amenities">
        <Screen>
          <AppHeader
            title="Amenities"
            showBell={false}
            onBack={() => router.back()}
          />
          <ErrorState
            message="No pudimos cargar tus edificios."
            onRetry={() => refetchBuildings()}
          />
        </Screen>
      </RequireAccess>
    );
  }

  return (
    <RequireAccess path="/amenities">
      <Screen
        refreshing={buildingsRefetching || reservationsQuery.isRefetching}
        onRefresh={() => {
          refetchBuildings();
          amenitiesQuery.refetch();
          reservationsQuery.refetch();
        }}>
        <AppHeader
          title="Amenities"
          subtitle="Reservá los espacios comunes del edificio."
          showBell={false}
          onBack={() => router.back()}
        />

        <BuildingSwitcher
          buildings={buildings}
          value={activeBuildingId}
          onChange={changeBuilding}
        />

        {!activeBuildingId ? (
          <EmptyState
            icon="calendar-outline"
            title="Elegí un edificio"
            description="Seleccioná un edificio para ver sus amenities disponibles."
          />
        ) : amenitiesQuery.isLoading ? (
          <LoadingState message="Cargando amenities..." />
        ) : amenitiesQuery.isError ? (
          <ErrorState
            message="No pudimos cargar los amenities."
            onRetry={() => amenitiesQuery.refetch()}
          />
        ) : enabledAmenities.length === 0 ? (
          <EmptyState
            icon="sparkles-outline"
            title="Sin amenities habilitados"
            description="Un administrador del edificio todavía no habilitó espacios para reservar."
          />
        ) : (
          <View style={styles.content}>
            <View style={styles.amenityChips}>
              {enabledAmenities.map(item => {
                const active = item.id === amenity?.id;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityState={{selected: active}}
                    onPress={() => setSelectedAmenityId(item.id)}
                    style={[styles.chip, active && styles.chipActive]}>
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}>
                      {item.amenity.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {amenity?.rules ? (
              <Card style={styles.rulesCard}>
                <Text style={styles.rulesLabel}>Reglas de uso</Text>
                <Text style={styles.rulesText}>{amenity.rules}</Text>
              </Card>
            ) : null}

            <Card style={styles.bookingCard}>
              <View style={styles.dayRow}>
                <IconButton
                  icon="chevron-back"
                  label="Día anterior"
                  onPress={() => setDay(value => shiftDateKey(value, -1))}
                />
                <View style={styles.dayText}>
                  <Text style={styles.dayLabel}>{dayLabel}</Text>
                  <Text style={styles.dayMeta}>
                    {amenity.slotMinutes} min · {amenity.openTime}–{amenity.closeTime}
                  </Text>
                </View>
                <IconButton
                  icon="chevron-forward"
                  label="Día siguiente"
                  onPress={() => setDay(value => shiftDateKey(value, 1))}
                />
              </View>

              {day !== todayKey() ? (
                <Button
                  title="Volver a hoy"
                  variant="ghost"
                  size="sm"
                  onPress={() => setDay(todayKey())}
                  style={styles.todayButton}
                />
              ) : null}

              {units.length > 1 ? (
                <Select
                  label="Unidad"
                  value={unitId}
                  onChange={setSelectedUnitId}
                  placeholder="Seleccionar unidad"
                  options={units.map(unit => ({
                    label: unit.floor
                      ? `${unit.name} · Piso ${unit.floor}`
                      : unit.name,
                    value: unit.id,
                  }))}
                />
              ) : units.length === 1 ? (
                <View style={styles.singleUnit}>
                  <Ionicons
                    name="home-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.singleUnitText}>
                    Reservás para {units[0].name}
                  </Text>
                </View>
              ) : (
                <Text style={styles.muted}>
                  No hay unidades disponibles para reservar.
                </Text>
              )}

              <Input
                label="Notas (opcional)"
                value={notes}
                onChangeText={setNotes}
                multiline
                maxLength={500}
                placeholder="Ej: cumpleaños, cantidad de invitados..."
              />

              {reservationsQuery.isLoading ? (
                <LoadingState message="Cargando horarios..." />
              ) : slots.length === 0 ? (
                <Text style={styles.muted}>
                  No hay turnos configurados para este amenity.
                </Text>
              ) : (
                <View style={styles.slots}>
                  {slots.map(slot => {
                    const matches = reservations.filter(reservation => {
                      const clock = zonedClock(
                        new Date(reservation.startsAt),
                        APP_TIMEZONE,
                      );
                      return (
                        clock.day === day &&
                        formatHm(clock.minutes) === slot.time
                      );
                    });
                    const mine = matches.find(reservation => reservation.mine);
                    const disabled =
                      !mine &&
                      (slot.past ||
                        slot.full ||
                        !unitId ||
                        createReservation.isPending ||
                        cancelReservation.isPending);

                    return (
                      <Pressable
                        key={slot.time}
                        accessibilityRole="button"
                        accessibilityLabel={`Turno ${slot.time}`}
                        accessibilityState={{disabled}}
                        disabled={disabled}
                        onPress={() => {
                          if (mine) {
                            setCancelId(mine.id);
                          } else {
                            reserve(slot.time);
                          }
                        }}
                        style={[
                          styles.slot,
                          mine && styles.slotMine,
                          disabled && styles.slotDisabled,
                        ]}>
                        <Text
                          style={[
                            styles.slotTime,
                            disabled && styles.slotTimeDisabled,
                          ]}>
                          {slot.time}
                        </Text>
                        <Text style={styles.slotMeta} numberOfLines={1}>
                          {mine
                            ? 'Tu reserva'
                            : slot.past
                              ? 'Pasado'
                              : slot.full
                                ? 'Completo'
                                : `${matches.length}/${amenity.maxConcurrent}`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </Card>

            <Section title="Reservas del día">
              {reservations.length === 0 ? (
                <Text style={styles.muted}>
                  No hay reservas para {dayLabel.toLowerCase()}.
                </Text>
              ) : (
                <View style={styles.list}>
                  {reservations.map(reservation => (
                    <View key={reservation.id} style={styles.reservationRow}>
                      <View style={styles.reservationIcon}>
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.reservationText}>
                        <Text style={styles.reservationTitle}>
                          {reservationClock(reservation)} · {reservation.unit.name}
                        </Text>
                        {reservation.user ? (
                          <Text style={styles.reservationMeta}>
                            {reservation.user.firstName}{' '}
                            {reservation.user.lastName}
                          </Text>
                        ) : null}
                        {reservation.notes ? (
                          <Text style={styles.reservationNotes}>
                            {reservation.notes}
                          </Text>
                        ) : null}
                      </View>
                      {reservation.mine ? (
                        <Badge label="Tuya" intent="primary" />
                      ) : null}
                      {reservation.mine || canManage ? (
                        <Button
                          title="Cancelar"
                          size="sm"
                          variant="ghost"
                          disabled={cancelReservation.isPending}
                          onPress={() => setCancelId(reservation.id)}
                        />
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </Section>
          </View>
        )}

        <ConfirmDialog
          visible={!!cancelId}
          title="Cancelar reserva"
          description="¿Seguro que querés cancelar esta reserva?"
          confirmLabel="Cancelar reserva"
          cancelLabel="Volver"
          pending={cancelReservation.isPending}
          onCancel={() => setCancelId(null)}
          onConfirm={confirmCancel}
        />
      </Screen>
    </RequireAccess>
  );
}

const styles = StyleSheet.create({
  content: {gap: spacing.lg},
  amenityChips: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  chip: {
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: 'rgba(59,130,246,0.5)',
  },
  chipText: {color: colors.textSecondary, fontSize: typography.small},
  chipTextActive: {color: colors.primary, fontWeight: '700'},
  rulesCard: {gap: spacing.xs, padding: spacing.md},
  rulesLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  rulesText: {
    color: colors.textSecondary,
    fontSize: typography.small,
    lineHeight: 19,
  },
  bookingCard: {gap: spacing.md},
  dayRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  dayText: {alignItems: 'center', flex: 1, gap: 2},
  dayLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  dayMeta: {color: colors.textMuted, fontSize: typography.caption},
  todayButton: {alignSelf: 'center'},
  singleUnit: {alignItems: 'center', flexDirection: 'row', gap: spacing.xs},
  singleUnitText: {color: colors.textSecondary, fontSize: typography.small},
  muted: {color: colors.textMuted, fontSize: typography.small, lineHeight: 18},
  slots: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  slot: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexBasis: '30%',
    flexGrow: 1,
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  slotMine: {
    backgroundColor: colors.primarySoft,
    borderColor: 'rgba(59,130,246,0.55)',
  },
  slotDisabled: {opacity: 0.42},
  slotTime: {color: colors.text, fontSize: typography.small, fontWeight: '700'},
  slotTimeDisabled: {color: colors.textMuted},
  slotMeta: {color: colors.textMuted, fontSize: typography.caption},
  list: {gap: spacing.sm},
  reservationRow: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  reservationIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  reservationText: {flex: 1, gap: 2},
  reservationTitle: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '600',
  },
  reservationMeta: {color: colors.textMuted, fontSize: typography.caption},
  reservationNotes: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    lineHeight: 16,
  },
});
