// This file serves as the server-side entry point for next-intl.
// It provides the `getMessages` function required by `next-intl` for server components.
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Define the supported locales as per CLAUDE.md
const locales = ['ja', 'en', 'zh', 'ko', 'es', 'fr', 'de', 'pt', 'ar', 'hi'];

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` is among the supported ones
  if (!locales.includes(locale)) notFound();

  return {
    messages: (await import(`./dictionaries/${locale}.json`)).default,
  };
});
