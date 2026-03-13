import * as Localization from "expo-localization";
import { translations, type Language } from "./translations";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const SUPPORTED: Language[] = ["ja", "en", "zh", "ko", "es", "fr", "de", "pt", "ar", "hi"];
const LANGUAGE_KEY = "app_language";

function getDeviceLanguage(): Language {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const browserLang = navigator.language.split('-')[0];
      if (SUPPORTED.includes(browserLang as Language)) return browserLang as Language;
    } else if (Platform.OS !== 'web') { // Only use expo-localization on native
      const locales = Localization.getLocales();
      const deviceLang = locales[0]?.languageCode ?? "ja";
      if (SUPPORTED.includes(deviceLang as Language)) return deviceLang as Language;
    }
    return "ja"; // Default fallback
  } catch {
    return "ja";
  }
}

/** Current active language (mutable for runtime switching) */
export let lang: Language = getDeviceLanguage();

/** Get the current active language */
export function getLang(): Language {
  return lang;
}

export function isRTL(): boolean {
  return lang === "ar";
}

/** Load persisted language from AsyncStorage */
export async function loadPersistedLanguage(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (stored && SUPPORTED.includes(stored as Language)) {
      lang = stored as Language;
    }
  } catch {
    // keep device default
  }
}

/** Change language and persist */
export async function setLanguage(newLang: Language): Promise<void> {
  lang = newLang;
  await AsyncStorage.setItem(LANGUAGE_KEY, newLang);
  // For web, update the HTML lang attribute
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', newLang);
    document.documentElement.setAttribute('dir', isRTL() ? 'rtl' : 'ltr');
  }
}

/** Translation function - returns translated string for the given key */
export function t(key: string, vars?: Record<string, string>): string {
  const dict = translations[lang] ?? translations.ja;
  const fallback = translations.en;
  let text = dict[key] ?? fallback[key] ?? key;

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, v);
    }
  }
  return text;
}

export function getSupportedLanguages(): Array<{ code: Language; label: string }> {
  return SUPPORTED.map((code) => ({
    code,
    label: translations[code]["settings.currentLanguage"] ?? code,
  }));
}

export type { Language };

