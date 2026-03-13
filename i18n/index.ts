import * as Localization from "expo-localization";
import { translations, type Language } from "./translations";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SUPPORTED: Language[] = ["ja", "en", "zh", "ko", "es", "fr", "de", "pt", "ar", "hi"];
const LANGUAGE_KEY = "app_language";

function getDeviceLanguage(): Language {
  try {
    const locales = Localization.getLocales();
    const deviceLang = locales[0]?.languageCode ?? "ja";
    if (SUPPORTED.includes(deviceLang as Language)) return deviceLang as Language;
    return "ja";
  } catch {
    return "ja";
  }
}

/** Current active language (mutable for runtime switching) */
let currentLang: Language = getDeviceLanguage();

export function getLang(): Language {
  return currentLang;
}

export function isRTL(): boolean {
  return currentLang === "ar";
}

/** Load persisted language from AsyncStorage */
export async function loadPersistedLanguage(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (stored && SUPPORTED.includes(stored as Language)) {
      currentLang = stored as Language;
    }
  } catch {
    // keep device default
  }
}

/** Change language and persist */
export async function setLanguage(lang: Language): Promise<void> {
  currentLang = lang;
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
}

/** Translation function - returns translated string for the given key */
export function t(key: string, vars?: Record<string, string>): string {
  const dict = translations[currentLang] ?? translations.ja;
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
