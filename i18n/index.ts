import { getRequestConfig } from 'next-intl/server';
import { getLocales } from 'expo-localization';

// Define the type for messages
type Messages = Record<string, string | Record<string, string>>;

// Function to dynamically import messages
export async function getMessages(locale: string): Promise<Messages> {
  try {
    return (await import(`./dictionaries/${locale}.json`)) as Messages;
  } catch (error: unknown) {
    console.error(`Could not load messages for locale ${locale}, falling back to 'en'.`, error);
    return (await import('./dictionaries/en.json')) as Messages;
  }
}

export default getRequestConfig(async () => {
  // Get the preferred locale from expo-localization
  const locales = getLocales();
  const locale = locales[0]?.languageCode ?? 'en';

  return {
    locale,
    messages: await getMessages(locale),
  };
});

