import { getRequestConfig } from 'next-intl/server';
import { getLocales } from 'expo-localization';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  const locales = ['en', 'ja', 'zh', 'ko', 'es', 'fr', 'de', 'pt', 'ar', 'hi'];
  const baseLocale = locales.includes(locale) ? locale : 'en';

  return {
    messages: (await import(`./i18n/dictionaries/${baseLocale}.json`)).default,
  };
});

// Helper to get the initial locale for client-side
export function getInitialLocale(): string {
  const locales = getLocales();
  const deviceLocale = locales[0]?.languageCode || 'en';
  const supportedLocales = ['en', 'ja', 'zh', 'ko', 'es', 'fr', 'de', 'pt', 'ar', 'hi'];
  return supportedLocales.includes(deviceLocale) ? deviceLocale : 'en';
}
