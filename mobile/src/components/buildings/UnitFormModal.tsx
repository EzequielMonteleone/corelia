import {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {ModalSheet} from '@/components/ui/ModalSheet';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import type {Unit} from '@/types/unit';
import {spacing} from '@/theme';

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
  const [name, setName] = useState(unit?.name ?? '');
  const [floor, setFloor] = useState(unit?.floor ?? '');
  const [coefficient, setCoefficient] = useState(
    unit?.coefficient != null ? String(unit.coefficient) : '',
  );
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Ingresá el nombre de la unidad.');
      return;
    }
    const parsed =
      coefficient.trim() === '' ? undefined : Number(coefficient.trim());
    if (parsed !== undefined && (!Number.isFinite(parsed) || parsed < 0)) {
      setError('El coeficiente debe ser un número válido.');
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
      title={unit ? 'Editar unidad' : 'Nueva unidad'}>
      <View style={styles.form}>
        <Input
          label="Nombre"
          placeholder="Ej: 4° B"
          value={name}
          onChangeText={setName}
          error={error ?? undefined}
        />
        <Input
          label="Piso"
          placeholder="Ej: 4"
          value={floor}
          onChangeText={setFloor}
        />
        <Input
          label="Coeficiente"
          placeholder="Ej: 0.0833"
          value={coefficient}
          onChangeText={setCoefficient}
          keyboardType="decimal-pad"
        />
        <Button
          title={unit ? 'Guardar cambios' : 'Agregar unidad'}
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
