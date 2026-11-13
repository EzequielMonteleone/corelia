import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {ModalSheet} from '@/components/ui/ModalSheet';
import {spacing} from '@/theme';
import type {Unit} from '@/types/unit';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {StyleSheet, View} from 'react-native';

export type UnitFormValues = {
  name: string;
  floor?: string;
  coefficient?: number;
};

export function UnitFormModal({
  visible,
  unit,
  pending,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  unit: Unit | null;
  pending: boolean;
  onClose: () => void;
  onSubmit: (values: UnitFormValues) => void;
}) {
  const {t} = useTranslation();
  const [name, setName] = useState(unit?.name ?? '');
  const [floor, setFloor] = useState(unit?.floor ?? '');
  const [coefficient, setCoefficient] = useState(
    unit?.coefficient != null ? String(unit.coefficient) : '',
  );
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('Buildings.unitNameError'));
      return;
    }
    const parsed =
      coefficient.trim() === '' ? undefined : Number(coefficient.trim());
    if (parsed !== undefined && (!Number.isFinite(parsed) || parsed < 0)) {
      setError(t('Buildings.unitCoefficientError'));
      return;
    }
    setError(null);
    onSubmit({
      name: trimmed,
      ...(floor.trim() ? {floor: floor.trim()} : {}),
      ...(parsed !== undefined ? {coefficient: parsed} : {}),
    });
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title={unit ? t('Buildings.unitEditTitle') : t('Buildings.unitNewTitle')}>
      <View style={styles.form}>
        <Input
          label={t('Buildings.unitName')}
          placeholder={t('Buildings.unitNameExample')}
          value={name}
          onChangeText={setName}
          error={error ?? undefined}
        />
        <Input
          label={t('Buildings.unitFloorLabel')}
          placeholder={t('Buildings.unitFloorExample')}
          value={floor}
          onChangeText={setFloor}
        />
        <Input
          label={t('Buildings.unitCoefficientLabel')}
          placeholder={t('Buildings.unitCoefficientExample')}
          value={coefficient}
          onChangeText={setCoefficient}
          keyboardType="decimal-pad"
        />
        <Button
          title={unit ? t('Buildings.saveChanges') : t('Buildings.addUnit')}
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
});
