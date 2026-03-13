import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}', // Ensure src is included if you use it
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors based on the design spec
        primary: '#22D3EE', // Cyan for active/primary actions
        secondary: '#6B7280', // Gray for secondary text/icons
        background: {
          light: '#FFFFFF',
          dark: '#121212',
        },
        card: {
          light: '#FFFFFF',
          dark: '#1F2937',
        },
        text: {
          light: '#1F2937',
          dark: '#F9FAFB',
        },
        'secondary-text': {
          light: '#6B7280',
          dark: '#D1D5DB',
        },
        border: {
          light: '#E5E7EB',
          dark: '#374151',
        },
        status: {
          scheduled: '#22D3EE', // Cyan
          active: '#34D399', // Emerald
          landed: '#6B7280', // Gray
          delayed: '#F59E0B', // Amber
          cancelled: '#6B7280', // Gray (not red)
        },
        error: '#EF4444', // Red for errors
        warning: '#F59E0B', // Amber for warnings
        success: '#34D399', // Emerald for success
      },
    },
  },
  plugins: [],
  // Important: Tailwind CSS v4 uses a different approach for dark mode.
  // For Expo/React Native, we typically manage dark mode via StyleSheet
  // and `useColorScheme`, not directly via Tailwind's `darkMode` config.
  // If this were a pure Next.js web project, `darkMode: 'class'` would be used.
  // For this project, the `ThemeProvider` handles theme switching.
};

export default config;
