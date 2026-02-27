import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from '../public/locales/fr/translation.json';
import ar from '../public/locales/ar/translation.json';
import en from '../public/locales/en/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      ar: { translation: ar },
      en: { translation: en },
    },
    fallbackLng: 'fr',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'medicom-lang',
    },
  });

/**
 * Set the document direction for RTL languages.
 * Called on language change.
 */
export function applyLanguageDirection(lang: string) {
  const isRTL = lang === 'ar';
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
}

// Apply direction on init
applyLanguageDirection(i18n.language || 'fr');

// Listen for language changes
i18n.on('languageChanged', (lang) => {
  applyLanguageDirection(lang);
});

export default i18n;
