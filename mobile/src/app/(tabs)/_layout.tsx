import {Ionicons} from '@expo/vector-icons';
import {Tabs} from 'expo-router';
import type {ColorValue} from 'react-native';
import {useAuthStore} from '@/store/authStore';
import {canAccessPath} from '@/lib/navAccess';
import {colors, typography} from '@/theme';

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
          title: 'Inicio',
          tabBarIcon: tabIcon('home-outline', 'home'),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expensas',
          tabBarIcon: tabIcon('receipt-outline', 'receipt'),
        }}
      />
      <Tabs.Screen
        name="buildings"
        options={{
          title: 'Edificios',
          href: canSeeBuildings ? undefined : null,
          tabBarIcon: tabIcon('business-outline', 'business'),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menú',
          tabBarIcon: tabIcon('grid-outline', 'grid'),
        }}
      />
    </Tabs>
  );
}
