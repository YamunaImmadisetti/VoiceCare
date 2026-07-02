import { Colors, Font } from '@/constants/theme';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  )
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="💊" label="Meds" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="sos"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🚨" label="SOS" focused={focused} />,
        }}
      />
      <Tabs.Screen
  name="family"
  options={{
    tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Overview" focused={focused} />,
  }}
/>
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.sageDark,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 85 : 68,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 8,
    paddingHorizontal: 6,
    elevation: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    minWidth: 56,
  },
  tabItemActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  tabEmoji: {
    fontSize: 22,
  },
  tabLabel: {
    fontFamily: Font.sans,
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
  },
  tabLabelActive: {
    color: '#fff',
    fontFamily: Font.sansBold,
  },
})