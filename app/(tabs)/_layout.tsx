import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@/i18n';
import { useTheme } from '@/components/ThemeProvider';
import { type ColorScheme } from '@/types/theme';

interface TabIconProps {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}

function TabIcon({ name, color }: TabIconProps) {
  return <MaterialCommunityIcons size={28} name={name} color={color} />;
}

export default function TabLayout() {
  const { theme } = useTheme();
  const colors = getColors(theme);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBackground,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.headerBackground,
        },
        headerTintColor: colors.headerText,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('tabs.search'),
          tabBarIcon: ({ color }) => <TabIcon name="magnify" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color }) => <TabIcon name="cog" color={color} />,
        }}
      />
    </Tabs>
  );
}

function getColors(theme: ColorScheme) {
  if (theme === 'dark') {
    return {
      tabActive: '#22D3EE', // Cyan
      tabInactive: '#6B7280', // Gray
      tabBackground: '#1F2937', // Dark Gray
      headerBackground: '#1F2937',
      headerText: '#F9FAFB', // White
      border: '#374151', // Gray
    };
  }
  return {
    tabActive: '#22D3EE', // Cyan
    tabInactive: '#9CA3AF', // Gray
    tabBackground: '#FFFFFF', // White
    headerBackground: '#FFFFFF',
    headerText: '#1F2937', // Dark Gray
    border: '#E5E7EB', // Light Gray
  };
}
