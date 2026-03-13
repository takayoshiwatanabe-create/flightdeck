import * as Localization from "expo-localization";
import { translations, type Language } from "./translations";

const SUPPORTED: Language[] = ["ja", "en", "zh", "ko", "es", "fr", "de", "pt", "ar", "hi"];

function getLanguage(): Language {
  try {
    const locales = Localization.getLocales();
    const deviceLang = locales[0]?.languageCode ?? "ja";
    if (SUPPORTED.includes(deviceLang as Language)) return deviceLang as Language;
    return "ja";
  } catch (error: unknown) { // Use unknown for caught errors
    console.error("Error getting device language:", error); // Log the error
    return "ja";
  }
}

export const lang: Language = getLanguage();
export const isRTL: boolean = ["ar"].includes(lang);

export function t(key: string, vars?: Record<string, string | number>): string {
  const dict = translations[lang] ?? translations.ja;
  let text = dict[key] ?? translations.en[key] ?? key; // Fallback to English if not found in current or default
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`{{\\s*${k}\\s*}}`, "g"), String(v));
    }
  }
  return text;
}

