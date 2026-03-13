import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import * as Localization from 'expo-localization';

// Define supported locales as per CLAUDE.md
const locales = ['ja', 'en', 'zh', 'ko', 'es', 'fr', 'de', 'pt', 'ar', 'hi'];

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` is one of our configured `locales`.
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`./dictionaries/${locale}.json`)).default
  };
});

// Client-side message loading function
export async function getMessages(locale: string): Promise<Record<string, string | Record<string, string>>> {
  if (!locales.includes(locale as any)) {
    // Fallback to default locale if requested locale is not supported
    console.warn(`Unsupported locale: ${locale}. Falling back to 'ja'.`);
    locale = 'ja';
  }
  return (await import(`./dictionaries/${locale}.json`)).default;
}

// Function to get the device's preferred locale
export function getDeviceLocale(): string {
  const preferredLocale = Localization.getLocales()[0]?.languageCode;
  if (preferredLocale && locales.includes(preferredLocale)) {
    return preferredLocale;
  }
  return 'ja'; // Default to Japanese if device locale is not supported
}

// Export locales for use in other parts of the app
export { locales };

