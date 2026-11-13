import type {ReactNode} from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors, spacing} from '@/theme';

export function Screen({
  children,
  scroll = true,
  padded = true,
  refreshing = false,
  onRefresh,
  contentContainerStyle,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SafeAreaView edges={['top']} style={[styles.safe, style]}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            padded && styles.padded,
            contentContainerStyle,
          ]}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.textSecondary}
                colors={[colors.primary]}
              />
            ) : undefined
          }>
          {children}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.flex,
            padded && styles.padded,
            contentContainerStyle,
          ]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {backgroundColor: colors.background, flex: 1},
  flex: {flex: 1},
  padded: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
});
