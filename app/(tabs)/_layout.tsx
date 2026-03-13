import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslations } from 'next-intl'; // Corrected import
import { useTheme } from '@/components/ThemeProvider';
import { type ColorScheme } from '@/types/theme';

interface TabIconProps {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}

function TabIcon({ name, color }: TabIconProps): JSX.Element {
  return <MaterialCommunityIcons size={28} name={name} color={color} />;
}

export default function TabLayout(): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const t = useTranslations('tabs'); // Use useTranslations hook

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
          title: t('home'),
          tabBarIcon: ({ color }: { color: string }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('search'),
          tabBarIcon: ({ color }: { color: string }) => <TabIcon name="magnify" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          tabBarIcon: ({ color }: { color: string }) => <TabIcon name="cog" color={color} />,
        }}
      />
    </Tabs>
  );
}

function getColors(theme: ColorScheme): {
  tabActive: string;
  tabInactive: string;
  tabBackground: string;
  headerBackground: string;
  headerText: string;
  border: string;
} {
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
