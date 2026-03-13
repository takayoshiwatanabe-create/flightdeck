import { StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router"; // Import Link
import { t } from "@/i18n"; // Import t for translation
import { useTheme } from "@/components/ThemeProvider"; // Import useTheme
import { type ColorScheme } from "@/types/theme"; // Import ColorScheme

export default function HomeScreen(): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t("app.title")}</Text>
      <Text style={[styles.subtitle, { color: colors.secondaryText }]}>{t("app.tagline")}</Text>
      <Link href="/(auth)/login" style={[styles.link, { color: colors.link }]}>
        <Text style={styles.linkText}>{t("app.loginPrompt")}</Text>
      </Link>
      <Link href="/(auth)/signup" style={[styles.link, { color: colors.link }]}>
        <Text style={styles.linkText}>{t("app.signupPrompt")}</Text>
      </Link>
      <Link href="/(tabs)" style={[styles.link, { color: colors.link }]}>
        <Text style={styles.linkText}>{t("app.guestPrompt")}</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  subtitle: {
    marginTop: 16,
    fontSize: 18,
    marginBottom: 32, // Add margin bottom for spacing
  },
  link: {
    marginTop: 15,
    paddingVertical: 10,
  },
  linkText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

function getColors(theme: ColorScheme): { background: string; text: string; secondaryText: string; link: string } {
  if (theme === 'dark') {
    return {
      background: '#121212',
      text: '#F9FAFB',
      secondaryText: '#D1D5DB',
      link: '#22D3EE',
    };
  }
  return {
    background: '#FFFFFF',
    text: '#1F2937',
    secondaryText: '#6B7280',
    link: '#007AFF',
  };
}
