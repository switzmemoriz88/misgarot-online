// ==========================================
// הגדרת i18n - תמיכה בעברית ואנגלית
// ==========================================

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import he from './he.json';
import en from './en.json';

const resources = {
  he: { translation: he },
  en: { translation: en },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('i18nextLng') || 'he', // עברית כברירת מחדל
    fallbackLng: 'he', // עברית כברירת מחדל
    supportedLngs: ['he', 'en'],
    
    detection: {
      order: ['localStorage'], // רק localStorage, לא navigator
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    
    interpolation: {
      escapeValue: false,
    },
  });

// Set initial direction
const currentLang = i18n.language || 'he';
document.documentElement.dir = currentLang === 'he' ? 'rtl' : 'ltr';
document.documentElement.lang = currentLang;

export default i18n;

// פונקציה לקביעת כיוון הטקסט
export const getDirection = (language: string): 'rtl' | 'ltr' => {
  return language === 'he' ? 'rtl' : 'ltr';
};

// פונקציה להחלפת שפה
export const changeLanguage = (lang: 'he' | 'en') => {
  i18n.changeLanguage(lang);
  document.documentElement.dir = getDirection(lang);
  document.documentElement.lang = lang;
  localStorage.setItem('i18nextLng', lang);
};

// אתחול כיוון הדף בטעינה
export const initDirection = () => {
  const lang = i18n.language || 'he';
  document.documentElement.dir = getDirection(lang);
  document.documentElement.lang = lang;
};
