import {canAccessPath} from '@/lib/navAccess';
import {useAuthStore} from '@/store/authStore';
import {colors, typography} from '@/theme';
import {Ionicons} from '@expo/vector-icons';
import {Tabs} from 'expo-router';
import {useTranslation} from 'react-i18next';
import type {ColorValue} from 'react-native';

function tabIcon(
  name: keyof typeof Ionicons.glyphMap,
  focusedName: keyof typeof Ionicons.glyphMap,
) {
  return function TabBarIcon({
    color,
    focused,
  }: {
    color: ColorValue;
    focused: boolean;
  }) {
    return (
      <Ionicons
        name={focused ? focusedName : name}
        size={23}
        color={color == null || typeof color === 'number' ? undefined : color}
      />
    );
  };
}

export default function TabsLayout() {
  const {t} = useTranslation();
  const user = useAuthStore(state => state.user);
  const canSeeBuildings = canAccessPath(user, '/buildings');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.backgroundAlt,
          borderTopColor: colors.border,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: typography.caption,
          fontWeight: '600',
        },
        sceneStyle: {backgroundColor: colors.background},
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('Tabs.home'),
          tabBarIcon: tabIcon('home-outline', 'home'),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: t('Tabs.expenses'),
          tabBarIcon: tabIcon('receipt-outline', 'receipt'),
        }}
      />
      <Tabs.Screen
        name="buildings"
        options={{
          title: t('Tabs.buildings'),
          href: canSeeBuildings ? undefined : null,
          tabBarIcon: tabIcon('business-outline', 'business'),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: t('Tabs.menu'),
          tabBarIcon: tabIcon('grid-outline', 'grid'),
        }}
      />
    </Tabs>
  );
}
