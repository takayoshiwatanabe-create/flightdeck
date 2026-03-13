import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { type AbstractIntlMessages } from 'react-intl';
import * as Localization from 'expo-localization';

// Can be imported from a shared config
const locales = ['ja', 'en', 'zh', 'ko', 'es', 'fr', 'de', 'pt', 'ar', 'hi'];

// Function to get messages for a given locale
export function getMessages(locale: string): AbstractIntlMessages {
  switch (locale) {
    case 'ja':
      return require('./dictionaries/ja.json');
    case 'en':
      return require('./dictionaries/en.json');
    case 'zh':
      return require('./dictionaries/zh.json');
    case 'ko':
      return require('./dictionaries/ko.json');
    case 'es':
      return require('./dictionaries/es.json');
    case 'fr':
      return require('./dictionaries/fr.json');
    case 'de':
      return require('./dictionaries/de.json');
    case 'pt':
      return require('./dictionaries/pt.json');
    case 'ar':
      return require('./dictionaries/ar.json');
    case 'hi':
      return require('./dictionaries/hi.json');
    default:
      // Fallback to English if locale is not found
      return require('./dictionaries/en.json');
  }
}

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: getMessages(locale),
  };
});

// Helper to get the device's preferred locale
export function getDeviceLocale(): string {
  const deviceLocale = Localization.getLocales()[0]?.languageCode;
  if (deviceLocale && locales.includes(deviceLocale)) {
    return deviceLocale;
  }
  return 'en'; // Default to English if device locale is not supported
}
