import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {ModalSheet} from '@/components/ui/ModalSheet';
import {validationMessage} from '@/lib/validation';
import {buildingSchema, type BuildingFormValues} from '@/schemas/building';
import {spacing} from '@/theme';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {StyleSheet, View} from 'react-native';
import {flattenError} from 'zod';

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
  editing: ({id: string} & BuildingFormValues) | null;
  pending: boolean;
  onClose: () => void;
  onSubmit: (values: BuildingFormValues) => void;
}) {
  const {t} = useTranslation();
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
        name: validationMessage(t, flattened.name?.[0]),
        address: validationMessage(t, flattened.address?.[0]),
        city: validationMessage(t, flattened.city?.[0]),
        country: validationMessage(t, flattened.country?.[0]),
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
      title={
        editing ? t('Buildings.modalEditTitle') : t('Buildings.modalTitle')
      }>
      <View style={styles.form}>
        <Input
          label={t('Buildings.name')}
          placeholder={t('Buildings.namePlaceholder')}
          value={values.name}
          onChangeText={value => update('name', value)}
          error={errors.name}
        />
        <Input
          label={t('Buildings.address')}
          placeholder={t('Buildings.addressPlaceholder')}
          value={values.address}
          onChangeText={value => update('address', value)}
          error={errors.address}
        />
        <Input
          label={t('Buildings.city')}
          placeholder={t('Buildings.cityPlaceholder')}
          value={values.city}
          onChangeText={value => update('city', value)}
          error={errors.city}
        />
        <Input
          label={t('Buildings.country')}
          placeholder={t('Buildings.countryPlaceholder')}
          value={values.country}
          onChangeText={value => update('country', value)}
          error={errors.country}
        />
        <Button
          title={
            editing
              ? t('Buildings.saveChanges')
              : t('Buildings.registerBuilding')
          }
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
