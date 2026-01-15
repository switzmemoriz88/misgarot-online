// ==========================================
// Font Loader Hook - טעינת פונטים דינמית מ-Google Fonts
// ==========================================

import { useEffect, useCallback, useState } from 'react';
import { HEBREW_FONTS, ENGLISH_FONTS, FontOption } from '../types';

// כל הפונטים הזמינים
export const ALL_FONTS = [...HEBREW_FONTS, ...ENGLISH_FONTS];

// פונטים שכבר נטענו
const loadedFonts = new Set<string>();

// יצירת URL פשוט של Google Fonts
const createSimpleFontsUrl = (fonts: FontOption[]): string => {
  const fontParams = fonts.map(font => {
    const weights = font.weights.join(';');
    return `family=${encodeURIComponent(font.family)}:wght@${weights}`;
  }).join('&');
  
  return `https://fonts.googleapis.com/css2?${fontParams}&display=swap`;
};

// טעינת פונט בודד
export const loadFont = async (fontFamily: string): Promise<void> => {
  if (loadedFonts.has(fontFamily)) return;
  
  const font = ALL_FONTS.find(f => f.family === fontFamily);
  if (!font) return;
  
  const url = createSimpleFontsUrl([font]);
  
  // בדיקה אם כבר קיים link לפונט זה
  const existingLink = document.querySelector(`link[href*="${encodeURIComponent(fontFamily)}"]`);
  if (existingLink) {
    loadedFonts.add(fontFamily);
    return;
  }
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
  
  loadedFonts.add(fontFamily);
};

// טעינת כל הפונטים הבסיסיים
export const loadBasicFonts = async (): Promise<void> => {
  // פונטים בסיסיים שנטענים בהתחלה
  const basicFonts = [
    'Heebo', 'Assistant', 'Rubik', 'Varela Round', 'Frank Ruhl Libre',
    'Roboto', 'Open Sans', 'Montserrat', 'Poppins', 'Playfair Display',
    'Dancing Script', 'Great Vibes', 'Pacifico'
  ];
  
  const fontsToLoad = ALL_FONTS.filter(f => basicFonts.includes(f.family));
  const url = createSimpleFontsUrl(fontsToLoad);
  
  const existingLink = document.querySelector('link[href*="fonts.googleapis.com/css2?family=Heebo"]');
  if (existingLink) return;
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
  
  fontsToLoad.forEach(f => loadedFonts.add(f.family));
};

// Hook לטעינת פונטים
export const useFontLoader = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedFontsList, setLoadedFontsList] = useState<string[]>([]);
  
  // טעינת פונטים בסיסיים בהתחלה
  useEffect(() => {
    const init = async () => {
      await loadBasicFonts();
      setIsLoading(false);
      setLoadedFontsList(Array.from(loadedFonts));
    };
    init();
  }, []);
  
  // פונקציה לטעינת פונט ספציפי
  const loadFontAsync = useCallback(async (fontFamily: string) => {
    if (!loadedFonts.has(fontFamily)) {
      await loadFont(fontFamily);
      setLoadedFontsList(Array.from(loadedFonts));
    }
  }, []);
  
  // טעינת כל הפונטים
  const loadAllFonts = useCallback(async () => {
    setIsLoading(true);
    
    // טעינה בקבוצות כדי לא להעמיס
    const chunkSize = 10;
    for (let i = 0; i < ALL_FONTS.length; i += chunkSize) {
      const chunk = ALL_FONTS.slice(i, i + chunkSize);
      const url = createSimpleFontsUrl(chunk);
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
      
      chunk.forEach(f => loadedFonts.add(f.family));
      
      // המתנה קצרה בין קבוצות
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsLoading(false);
    setLoadedFontsList(Array.from(loadedFonts));
  }, []);
  
  // בדיקה אם פונט נטען
  const isFontLoaded = useCallback((fontFamily: string) => {
    return loadedFonts.has(fontFamily);
  }, []);
  
  return {
    isLoading,
    loadedFonts: loadedFontsList,
    loadFont: loadFontAsync,
    loadAllFonts,
    isFontLoaded,
  };
};

// רשימת פונטים לפי קטגוריה
export const getFontsByCategory = (category: FontOption['category']) => {
  return ALL_FONTS.filter(f => f.category === category);
};

// רשימת פונטים לפי סגנון
export const getFontsByStyle = (style: FontOption['style']) => {
  return ALL_FONTS.filter(f => f.style === style);
};

// חיפוש פונט לפי שם
export const searchFonts = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return ALL_FONTS.filter(f => 
    f.family.toLowerCase().includes(lowerQuery) || 
    f.name.toLowerCase().includes(lowerQuery)
  );
};

export default useFontLoader;
