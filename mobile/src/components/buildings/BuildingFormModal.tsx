import {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {flattenError} from 'zod';
import {ModalSheet} from '@/components/ui/ModalSheet';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {buildingSchema, type BuildingFormValues} from '@/schemas/building';
import {spacing} from '@/theme';

const emptyValues: BuildingFormValues = {
  name: '',
  address: '',
  city: '',
  country: '',
};

type FieldErrors = Partial<Record<keyof BuildingFormValues, string>>;

export function BuildingFormModal({
  visible,
  editing,
  pending,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  editing: {id: string} & BuildingFormValues | null;
  pending: boolean;
  onClose: () => void;
  onSubmit: (values: BuildingFormValues) => void;
}) {
  const [values, setValues] = useState<BuildingFormValues>(() =>
    editing
      ? {
          name: editing.name,
          address: editing.address,
          city: editing.city,
          country: editing.country,
        }
      : emptyValues,
  );
  const [errors, setErrors] = useState<FieldErrors>({});

  const submit = () => {
    const result = buildingSchema.safeParse(values);
    if (!result.success) {
      const flattened = flattenError(result.error).fieldErrors;
      setErrors({
        name: flattened.name?.[0],
        address: flattened.address?.[0],
        city: flattened.city?.[0],
        country: flattened.country?.[0],
      });
      return;
    }
    setErrors({});
    onSubmit(result.data);
  };

  const update = (key: keyof BuildingFormValues, value: string) => {
    setValues(current => ({...current, [key]: value}));
    if (errors[key]) setErrors(current => ({...current, [key]: undefined}));
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title={editing ? 'Editar edificio' : 'Nuevo edificio'}>
      <View style={styles.form}>
        <Input
          label="Nombre"
          placeholder="Nombre del edificio"
          value={values.name}
          onChangeText={value => update('name', value)}
          error={errors.name}
        />
        <Input
          label="Dirección"
          placeholder="Dirección completa"
          value={values.address}
          onChangeText={value => update('address', value)}
          error={errors.address}
        />
        <Input
          label="Ciudad"
          placeholder="Ciudad"
          value={values.city}
          onChangeText={value => update('city', value)}
          error={errors.city}
        />
        <Input
          label="País"
          placeholder="País"
          value={values.country}
          onChangeText={value => update('country', value)}
          error={errors.country}
        />
        <Button
          title={editing ? 'Guardar cambios' : 'Registrar edificio'}
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
