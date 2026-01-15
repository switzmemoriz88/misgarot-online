// ==========================================
// כפתור החלפת שפה
// ==========================================

import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n';

export const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'he' ? 'en' : 'he';
    changeLanguage(newLang);
  };
  
  return (
    <button 
      onClick={toggleLanguage}
      className="language-toggle px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors text-sm font-medium"
      aria-label="Toggle language"
    >
      {i18n.language === 'he' ? 'English' : 'עברית'}
    </button>
  );
};
