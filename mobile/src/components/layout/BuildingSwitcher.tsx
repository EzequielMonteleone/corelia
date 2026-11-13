import {Select} from '@/components/ui/Select';
import {spacing} from '@/theme';
import type {Building} from '@/types/building';
import {useTranslation} from 'react-i18next';
import {StyleSheet, View} from 'react-native';

export function BuildingSwitcher({
  buildings,
  value,
  onChange,
}: {
  buildings: Building[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  const {t} = useTranslation();

  if (buildings.length <= 1) return null;

  return (
    <View style={styles.container}>
      <Select
        label={t('Common.building')}
        value={value ?? ''}
        placeholder={t('Common.selectBuilding')}
        options={buildings.map(building => ({
          label: building.name,
          value: building.id,
          description: building.address,
        }))}
        onChange={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {marginBottom: spacing.lg},
});
