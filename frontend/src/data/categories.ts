// ==========================================
// Categories Data - נתוני קטגוריות
// ==========================================

import { Category } from '../types';

export const CATEGORIES: Category[] = [
  {
    id: 'wedding',
    name: 'חתונה',
    icon: '❤️',
    gradient: 'from-pink-500 to-rose-500',
    description: 'מסגרות לאירועי חתונה',
  },
  {
    id: 'bar-mitzvah',
    name: 'בר מצווה',
    icon: '✡️',
    gradient: 'from-blue-500 to-indigo-500',
    description: 'מסגרות לבר מצווה',
  },
  {
    id: 'bat-mitzvah',
    name: 'בת מצווה',
    icon: '🌸',
    gradient: 'from-purple-500 to-pink-500',
    description: 'מסגרות לבת מצווה',
  },
  {
    id: 'brit',
    name: 'ברית / בריתה',
    icon: '👶',
    gradient: 'from-cyan-500 to-blue-500',
    description: 'מסגרות לברית ובריתה',
  },
  {
    id: 'birthday',
    name: 'יום הולדת',
    icon: '🎂',
    gradient: 'from-yellow-500 to-orange-500',
    description: 'מסגרות ליום הולדת',
  },
  {
    id: 'business',
    name: 'אירוע עסקי',
    icon: '💼',
    gradient: 'from-gray-600 to-gray-800',
    description: 'מסגרות לאירועים עסקיים',
  },
  {
    id: 'henna',
    name: 'חינה',
    icon: '🪬',
    gradient: 'from-amber-500 to-orange-600',
    description: 'מסגרות לאירועי חינה',
  },
  {
    id: 'engagement',
    name: 'אירוסין',
    icon: '💍',
    gradient: 'from-rose-400 to-pink-600',
    description: 'מסגרות לאירועי אירוסין',
  },
  {
    id: 'sheva-brachot',
    name: 'שבע ברכות',
    icon: '🍷',
    gradient: 'from-purple-400 to-violet-600',
    description: 'מסגרות לשבע ברכות',
  },
  {
    id: 'other',
    name: 'אחר',
    icon: '✨',
    gradient: 'from-slate-400 to-slate-600',
    description: 'מסגרות לאירועים נוספים',
  },
];

// פונקציה למציאת קטגוריה לפי ID
export const getCategoryById = (id: string): Category | undefined => {
  return CATEGORIES.find(cat => cat.id === id);
};
