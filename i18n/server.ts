import { createIntl } from 'next-intl';
import { translations, type Language } from './translations';

// This file is a placeholder for server-side i18n message fetching in a Next.js app.
// In a real Next.js App Router setup, you would typically have a `messages` object
// that is loaded dynamically based on the locale.

// For the current Expo-only context, we'll just return the client-side translations.
// When integrating with Next.js, this function would be used in server components
// to load messages for `NextIntlClientProvider`.

export function getMessages(locale: Language): Record<string, string> {
  // In a Next.js server component, you might load messages from a file system
  // or a database based on the locale.
  // For now, we return the pre-defined translations.
  return translations[locale] ?? translations.ja; // Fallback to Japanese
}

// You can also create a server-side translator if needed, e.g., for API routes
export async function getTranslator(locale: Language) {
  const messages = getMessages(locale);
  return createIntl({ locale, messages, defaultLocale: 'en' }).formatMessage;
}
