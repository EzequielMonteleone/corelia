import {colors, spacing, typography} from '@/theme';
import type {ReactNode} from 'react';
import {StyleSheet, Text, View} from 'react-native';

export function Section({
  title,
  action,
  children,
  style,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  style?: object;
}) {
  return (
    <View style={[styles.section, style]}>
      {title ? (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {gap: spacing.md},
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
