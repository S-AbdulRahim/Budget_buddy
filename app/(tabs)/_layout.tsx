import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="debt"
        options={{
          title: 'Debt',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-down" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="invest"
        options={{
          title: 'Invest',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="annual"
        options={{
          title: 'Annual',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 65,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.sm,
    ...Shadows.elevated,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tabItem: {
    gap: Spacing.xs,
  },
});
