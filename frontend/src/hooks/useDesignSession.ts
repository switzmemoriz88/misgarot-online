// ==========================================
// useDesignSession Hook - ניהול עיצוב דו-כיווני (רוחב/אורך)
// ==========================================
// 
// מערכת שמירה מקצועית:
// - כל אלמנט שומר מיקום נפרד לרוחב ולאורך
// - סגנון ותוכן משותפים בין הכיוונים
// - מסגרות נעולות נשארות בכיוון המקורי בלבד
// - הוספה/מחיקה משפיעה על שני הכיוונים
// - הזזה/סיבוב משפיעה רק על הכיוון הנוכחי
//
// ==========================================

import { useCallback } from 'react';

// ==========================================
// Types
// ==========================================

export interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export interface DesignStyle {
  backgroundType: 'solid' | 'gradient' | 'none';
  backgroundColor: string;
  gradientStart: string;
  gradientEnd: string;
  gradientAngle: number;
  frameId?: string;
}

export interface DesignSession {
  style: DesignStyle;
  landscapeSize: { width: number; height: number };
  portraitSize: { width: number; height: number };
  landscapeModified: boolean;
  portraitModified: boolean;
  lastUpdated: number;
}

// ==========================================
// Storage Keys
// ==========================================

const STORAGE_KEY = 'misgarot_design_session';
const LANDSCAPE_ELEMENTS_KEY = 'misgarot_landscape_elements';
const PORTRAIT_ELEMENTS_KEY = 'misgarot_portrait_elements';

// ==========================================
// Helper Functions
// ==========================================

/**
 * חישוב מיקום אוטומטי לאורך מרוחב
 */
export const calculatePortraitPosition = (
  landscapePos: ElementPosition,
  landscapeSize: { width: number; height: number },
  portraitSize: { width: number; height: number }
): ElementPosition => {
  // יחסי המרה
  const scaleX = portraitSize.width / landscapeSize.width;
  const scaleY = portraitSize.height / landscapeSize.height;
  
  // שמירה על יחס גובה-רוחב של האלמנט
  const avgScale = (scaleX + scaleY) / 2;
  
  return {
    x: landscapePos.x * scaleX,
    y: landscapePos.y * scaleY,
    width: landscapePos.width * avgScale,
    height: landscapePos.height * avgScale,
    rotation: landscapePos.rotation,
    scaleX: landscapePos.scaleX,
    scaleY: landscapePos.scaleY,
  };
};

// ==========================================
// Hook
// ==========================================

export const useDesignSession = () => {
  
  // ==========================================
  // שמירת עיצוב רוחב
  // ==========================================
  const saveLandscapeDesign = useCallback((
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    elements: any[],
    style: Partial<DesignStyle>,
    canvasSize?: { width: number; height: number }
  ) => {
    // שמור אלמנטים של רוחב
    sessionStorage.setItem(LANDSCAPE_ELEMENTS_KEY, JSON.stringify(elements));
    
    // שמור את הסשן הכללי
    const existingSession = sessionStorage.getItem(STORAGE_KEY);
    let session: Partial<DesignSession> = existingSession ? JSON.parse(existingSession) : {};
    
    session.style = { ...session.style, ...style } as DesignStyle;
    session.landscapeModified = true;
    session.lastUpdated = Date.now();
    if (canvasSize) {
      session.landscapeSize = canvasSize;
    }
    
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    
    console.log('💾 Saved landscape design:', elements.length, 'elements');
  }, []);

  // ==========================================
  // שמירת עיצוב אורך
  // ==========================================
  const savePortraitDesign = useCallback((
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    elements: any[],
    style?: Partial<DesignStyle>,
    canvasSize?: { width: number; height: number }
  ) => {
    // שמור אלמנטים של אורך
    sessionStorage.setItem(PORTRAIT_ELEMENTS_KEY, JSON.stringify(elements));
    
    // עדכן את הסשן
    const existingSession = sessionStorage.getItem(STORAGE_KEY);
    let session: Partial<DesignSession> = existingSession ? JSON.parse(existingSession) : {};
    
    if (style) {
      session.style = { ...session.style, ...style } as DesignStyle;
    }
    session.portraitModified = true;
    session.lastUpdated = Date.now();
    if (canvasSize) {
      session.portraitSize = canvasSize;
    }
    
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    
    console.log('💾 Saved portrait design:', elements.length, 'elements');
  }, []);

  // ==========================================
  // טעינת עיצוב רוחב
  // ==========================================
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getLandscapeDesign = useCallback((): { elements: any[]; style: DesignStyle } | null => {
    const elementsData = sessionStorage.getItem(LANDSCAPE_ELEMENTS_KEY);
    const sessionData = sessionStorage.getItem(STORAGE_KEY);
    
    if (!elementsData && !sessionData) return null;
    
    const elements = elementsData ? JSON.parse(elementsData) : [];
    const session = sessionData ? JSON.parse(sessionData) : {};
    
    return {
      elements,
      style: session.style || {
        backgroundType: 'solid',
        backgroundColor: '#ffffff',
        gradientStart: '#6366f1',
        gradientEnd: '#a855f7',
        gradientAngle: 45,
      },
    };
  }, []);

  // ==========================================
  // טעינת עיצוב אורך
  // ==========================================
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getPortraitDesign = useCallback((): { elements: any[]; style: DesignStyle } | null => {
    const elementsData = sessionStorage.getItem(PORTRAIT_ELEMENTS_KEY);
    const sessionData = sessionStorage.getItem(STORAGE_KEY);
    
    if (!elementsData && !sessionData) return null;
    
    const elements = elementsData ? JSON.parse(elementsData) : [];
    const session = sessionData ? JSON.parse(sessionData) : {};
    
    return {
      elements,
      style: session.style || {
        backgroundType: 'solid',
        backgroundColor: '#ffffff',
        gradientStart: '#6366f1',
        gradientEnd: '#a855f7',
        gradientAngle: 45,
      },
    };
  }, []);

  // ==========================================
  // בדיקה אם יש עיצוב אורך שמור
  // ==========================================
  const hasPortraitDesign = useCallback((): boolean => {
    const data = sessionStorage.getItem(PORTRAIT_ELEMENTS_KEY);
    if (!data) return false;
    try {
      const elements = JSON.parse(data);
      return Array.isArray(elements) && elements.length > 0;
    } catch {
      return false;
    }
  }, []);

  // ==========================================
  // קבלת הסגנון
  // ==========================================
  const getDesignStyle = useCallback((): DesignStyle | null => {
    const sessionData = sessionStorage.getItem(STORAGE_KEY);
    if (!sessionData) return null;
    
    try {
      const session = JSON.parse(sessionData);
      return session.style || null;
    } catch {
      return null;
    }
  }, []);

  // ==========================================
  // ניקוי מלא
  // ==========================================
  const clearSession = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(LANDSCAPE_ELEMENTS_KEY);
    sessionStorage.removeItem(PORTRAIT_ELEMENTS_KEY);
    sessionStorage.removeItem('landscapeDesignForPublish');
    sessionStorage.removeItem('portraitDesignForReturn');
    console.log('🧹 Cleared design session');
  }, []);

  // ==========================================
  // חישוב מיקומים לאורך מרוחב
  // ==========================================
  const calculatePortraitFromLandscape = useCallback((
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    landscapeElements: any[],
    landscapeSize: { width: number; height: number },
    portraitSize: { width: number; height: number }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any[] => {
    return landscapeElements
      .filter(el => !(el.isLocked)) // מסגרות נעולות לא עוברות
      .map(el => {
        const landscapePos: ElementPosition = {
          x: (el.x as number) || 0,
          y: (el.y as number) || 0,
          width: (el.width as number) || 100,
          height: (el.height as number) || 100,
          rotation: (el.rotation as number) || 0,
          scaleX: (el.scaleX as number) || 1,
          scaleY: (el.scaleY as number) || 1,
        };

        const portraitPos = calculatePortraitPosition(landscapePos, landscapeSize, portraitSize);

        return {
          ...el,
          x: portraitPos.x,
          y: portraitPos.y,
          width: portraitPos.width,
          height: portraitPos.height,
          rotation: portraitPos.rotation,
          scaleX: portraitPos.scaleX,
          scaleY: portraitPos.scaleY,
        };
      });
  }, []);

  return {
    // שמירה
    saveLandscapeDesign,
    savePortraitDesign,
    
    // טעינה
    getLandscapeDesign,
    getPortraitDesign,
    hasPortraitDesign,
    getDesignStyle,
    
    // עזר
    calculatePortraitFromLandscape,
    clearSession,
  };
};
