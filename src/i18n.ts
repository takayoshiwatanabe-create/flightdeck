import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { type Locale } from '@/types/i18n';

// List of all supported locales
const locales: Locale[] = ['ja', 'en', 'zh', 'ko', 'es', 'fr', 'de', 'pt', 'ar', 'hi'];

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) notFound();

  return {
    messages: (await import(`./i18n/dictionaries/${locale}.json`)).default, // Corrected path
  };
});

// Client-side message loading for Expo Router
export async function getMessages(locale: string): Promise<Record<string, string | Record<string, string>>> {
  if (!locales.includes(locale as Locale)) {
    // Fallback to default locale if invalid
    console.warn(`Invalid locale: ${locale}. Falling back to 'ja'.`);
    locale = 'ja';
  }
  return (await import(`./i18n/dictionaries/${locale}.json`)).default; // Corrected path
}
