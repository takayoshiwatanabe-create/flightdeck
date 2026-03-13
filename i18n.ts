import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { type AbstractIntlMessages } from 'next-intl';

// Can be imported from a shared config
export const locales = ['ja', 'en', 'zh', 'ko', 'es', 'fr', 'de', 'pt', 'ar', 'hi'];
export const defaultLocale = 'ja';

export const getMessages = async (locale: string): Promise<AbstractIntlMessages> => {
  if (!locales.includes(locale)) notFound();

  // Dynamically import messages based on the locale
  // This assumes your messages are structured like:
  // messages/en.json, messages/ja.json, etc.
  // For simplicity, we'll use a single messages.json for now
  // and expand this if actual separate message files are created.
  // In a real app, you'd have actual JSON files per locale.
  const messages = (await import(`./messages/${locale}.json`)).default;
  return messages;
};

export default getRequestConfig(async ({ locale }) => {
  return {
    messages: await getMessages(locale)
  };
});
