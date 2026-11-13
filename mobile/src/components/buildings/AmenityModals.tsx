import {useMemo, useState} from 'react';
import {Pressable, StyleSheet, Switch, Text, View} from 'react-native';
import {ModalSheet} from '@/components/ui/ModalSheet';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {Select} from '@/components/ui/Select';
import {parseHm} from '@/lib/zonedTime';
import type {Amenity, BuildingAmenity} from '@/types/amenity';
import {colors, radius, spacing, typography} from '@/theme';

type CreateMode = 'catalog' | 'custom';

export function AmenityCreateModal({
  visible,
  catalog,
  existingIds,
  pending,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  catalog: Amenity[];
  existingIds: Set<string>;
  pending: boolean;
  onClose: () => void;
  onSubmit: (input: {amenityId?: string; customAmenityName?: string}) => void;
}) {
  const [mode, setMode] = useState<CreateMode>('catalog');
  const [catalogId, setCatalogId] = useState('');
  const [customName, setCustomName] = useState('');

  const available = useMemo(
    () => catalog.filter(item => !existingIds.has(item.id)),
    [catalog, existingIds],
  );
  const effectiveCatalogId = available.some(item => item.id === catalogId)
    ? catalogId
    : (available[0]?.id ?? '');

  const submit = () => {
    if (mode === 'catalog') {
      if (!effectiveCatalogId) return;
      onSubmit({amenityId: effectiveCatalogId});
      return;
    }
    const trimmed = customName.trim();
    if (!trimmed) return;
    onSubmit({customAmenityName: trimmed});
  };

  const canSubmit =
    mode === 'catalog' ? !!effectiveCatalogId : !!customName.trim();

  return (
    <ModalSheet visible={visible} onClose={onClose} title="Agregar amenity">
      <View style={styles.form}>
        <View style={styles.segment}>
          <Segment
            label="Del catálogo"
            active={mode === 'catalog'}
            onPress={() => setMode('catalog')}
          />
          <Segment
            label="Personalizado"
            active={mode === 'custom'}
            onPress={() => setMode('custom')}
          />
        </View>

        {mode === 'catalog' ? (
          available.length === 0 ? (
            <Text style={styles.muted}>
              Todos los amenities del catálogo ya están agregados.
            </Text>
          ) : (
            <Select
              label="Amenity"
              value={effectiveCatalogId}
              onChange={setCatalogId}
              options={available.map(item => ({
                label: item.name,
                value: item.id,
              }))}
            />
          )
        ) : (
          <Input
            label="Nombre"
            placeholder="Ej: SUM, Parrilla, Gimnasio"
            value={customName}
            onChangeText={setCustomName}
          />
        )}

        <Button
          title="Agregar amenity"
          loading={pending}
          disabled={!canSubmit}
          fullWidth
          onPress={submit}
        />
      </View>
    </ModalSheet>
  );
}

function Segment({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{selected: active}}
      onPress={onPress}
      style={[styles.segmentItem, active && styles.segmentItemActive]}>
      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function AmenitySettingsModal({
  visible,
  item,
  pending,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  item: BuildingAmenity | null;
  pending: boolean;
  onClose: () => void;
  onSubmit: (input: {
    isEnabled?: boolean;
    customName?: string;
    slotMinutes?: number;
    maxConcurrent?: number;
    openTime?: string;
    closeTime?: string;
    rules?: string | null;
  }) => void;
}) {
  const [name, setName] = useState(item?.amenity.name ?? '');
  const [enabled, setEnabled] = useState(item?.isEnabled ?? true);
  const [slotMinutes, setSlotMinutes] = useState(
    String(item?.slotMinutes ?? 60),
  );
  const [maxConcurrent, setMaxConcurrent] = useState(
    String(item?.maxConcurrent ?? 1),
  );
  const [openTime, setOpenTime] = useState(item?.openTime ?? '08:00');
  const [closeTime, setCloseTime] = useState(item?.closeTime ?? '22:00');
  const [rules, setRules] = useState(item?.rules ?? '');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const open = parseHm(openTime);
    const close = parseHm(closeTime);
    if (open === null || close === null || open >= close) {
      setError('El horario debe ser válido y la apertura anterior al cierre.');
      return;
    }
    const slot = Number(slotMinutes);
    const max = Number(maxConcurrent);
    if (!Number.isFinite(slot) || slot <= 0) {
      setError('La duración del turno debe ser mayor a cero.');
      return;
    }
    if (!Number.isFinite(max) || max <= 0) {
      setError('La capacidad debe ser mayor a cero.');
      return;
    }
    setError(null);
    onSubmit({
      isEnabled: enabled,
      slotMinutes: slot,
      maxConcurrent: max,
      openTime,
      closeTime,
      rules: rules.trim() || null,
      ...(!item?.amenity.isSystem && name.trim() ? {customName: name.trim()} : {}),
    });
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title={item ? item.amenity.name : 'Configuración'}>
      <View style={styles.form}>
        {!item?.amenity.isSystem ? (
          <Input label="Nombre" value={name} onChangeText={setName} />
        ) : null}

        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text style={styles.switchLabel}>Habilitado</Text>
            <Text style={styles.muted}>
              Los vecinos solo pueden reservar amenities habilitados.
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{false: colors.borderStrong, true: colors.primaryDark}}
            thumbColor={colors.white}
          />
        </View>

        <View style={styles.row}>
          <Input
            label="Duración (min)"
            value={slotMinutes}
            onChangeText={setSlotMinutes}
            keyboardType="number-pad"
            containerStyle={styles.half}
          />
          <Input
            label="Capacidad"
            value={maxConcurrent}
            onChangeText={setMaxConcurrent}
            keyboardType="number-pad"
            containerStyle={styles.half}
          />
        </View>
        <View style={styles.row}>
          <Input
            label="Apertura"
            value={openTime}
            onChangeText={setOpenTime}
            placeholder="08:00"
            containerStyle={styles.half}
          />
          <Input
            label="Cierre"
            value={closeTime}
            onChangeText={setCloseTime}
            placeholder="22:00"
            containerStyle={styles.half}
          />
        </View>
        <Input
          label="Reglas de uso"
          value={rules}
          onChangeText={setRules}
          multiline
          placeholder="Instrucciones para los vecinos..."
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          title="Guardar configuración"
          loading={pending}
          fullWidth
          onPress={submit}
        />
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  form: {gap: spacing.lg, paddingTop: spacing.sm},
  segment: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    flexDirection: 'row',
    padding: 4,
  },
  segmentItem: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  segmentItemActive: {backgroundColor: colors.surfaceElevated},
  segmentLabel: {color: colors.textMuted, fontSize: typography.small},
  segmentLabelActive: {color: colors.text, fontWeight: '700'},
  muted: {color: colors.textMuted, fontSize: typography.small, lineHeight: 18},
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  switchText: {flex: 1, gap: 2},
  switchLabel: {color: colors.text, fontSize: typography.body, fontWeight: '600'},
  row: {flexDirection: 'row', gap: spacing.md},
  half: {flex: 1},
  error: {color: colors.danger, fontSize: typography.caption},
});
