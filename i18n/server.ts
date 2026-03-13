import { createGetMessages } from 'next-intl/server';
import { translations, type Language } from '@/src/i18n/translations'; // Adjust path as necessary

// This file is specifically for Next.js server-side message fetching.
// It uses `next-intl/server` to provide messages to `NextIntlClientProvider`.

export const getMessages = createGetMessages<typeof translations, Language>(async (locale: Language) => {
  // In a real application, you might load messages from a file system or database.
  // For this project, we directly use the `translations` object.
  // Ensure the locale exists in your translations.
  return translations[locale] ?? translations.en; // Fallback to English if locale not found
});
