import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';

import en from './en.json';
import es from './es.json';

export const LANGUAGE_STORAGE_KEY = '@autoclean_language';
export type SupportedLanguage = 'es' | 'en';

function getDeviceLanguage(): SupportedLanguage {
  try {
    const locales = getLocales();
    const deviceCode = locales?.[0]?.languageCode?.toLowerCase();
    if (deviceCode === 'es' || deviceCode === 'en') {
      return deviceCode;
    }
  } catch {
    // Fallback to Spanish if device locale detection fails
  }
  return 'es';
}

const initialLanguage: SupportedLanguage = getDeviceLanguage();

void i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: initialLanguage,
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

async function loadSavedLanguage(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'es' || saved === 'en') {
      if (i18n.language !== saved) {
        await i18n.changeLanguage(saved);
      }
      return;
    }
    const detected = getDeviceLanguage();
    if (i18n.language !== detected) {
      await i18n.changeLanguage(detected);
    }
  } catch {
    // Keep default language on storage read error
  }
}

void loadSavedLanguage();

export async function setAppLanguage(lang: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Ignore storage write error
  }
}

export { i18n, useTranslation };
export default i18n;
