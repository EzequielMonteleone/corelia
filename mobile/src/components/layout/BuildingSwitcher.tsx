import {StyleSheet, View} from 'react-native';
import {Select} from '@/components/ui/Select';
import type {Building} from '@/types/building';
import {spacing} from '@/theme';

export function BuildingSwitcher({
  buildings,
  value,
  onChange,
}: {
  buildings: Building[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  if (buildings.length <= 1) return null;

  return (
    <View style={styles.container}>
      <Select
        label="Edificio"
        value={value ?? ''}
        placeholder="Seleccionar edificio"
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
