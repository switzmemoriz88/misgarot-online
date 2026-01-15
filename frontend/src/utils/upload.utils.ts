// ==========================================
// Upload Utilities - שירותי העלאה ואופטימיזציה
// ==========================================

import { UPLOAD_CONFIG, CANVAS_SIZES, FRAME_CONFIG, ELEMENT_TYPES, ElementTypeKey } from '@/config/app.config';

// ===== Types =====
export interface UploadResult {
  success: boolean;
  dataUrl?: string;
  width?: number;
  height?: number;
  originalSize?: number;
  optimizedSize?: number;
  error?: string;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ElementPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  locked: boolean;
}

// ===== Validation Functions =====

/**
 * בדיקת גודל קובץ
 */
export const validateFileSize = (file: File): { valid: boolean; error?: string } => {
  if (file.size > UPLOAD_CONFIG.maxFileSize) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `הקובץ גדול מדי (${fileSizeMB}MB). גודל מקסימלי: ${UPLOAD_CONFIG.maxFileSizeMB}MB`,
    };
  }
  return { valid: true };
};

/**
 * בדיקת סוג קובץ
 */
export const validateFileType = (file: File): { valid: boolean; error?: string } => {
  if (!UPLOAD_CONFIG.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `סוג קובץ לא נתמך. פורמטים מותרים: ${UPLOAD_CONFIG.allowedExtensions.join(', ')}`,
    };
  }
  return { valid: true };
};

/**
 * בדיקת קובץ מלאה
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const typeCheck = validateFileType(file);
  if (!typeCheck.valid) return typeCheck;
  
  const sizeCheck = validateFileSize(file);
  if (!sizeCheck.valid) return sizeCheck;
  
  return { valid: true };
};

// ===== Image Processing Functions =====

/**
 * קבלת מימדי תמונה
 */
export const getImageDimensions = (dataUrl: string): Promise<ImageDimensions> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
};

/**
 * זיהוי כיוון תמונה
 */
export const detectOrientation = (width: number, height: number): 'landscape' | 'portrait' | 'square' => {
  const ratio = width / height;
  if (ratio > 1.1) return 'landscape';
  if (ratio < 0.9) return 'portrait';
  return 'square';
};

/**
 * אופטימיזציה של תמונה
 */
export const optimizeImage = async (file: File): Promise<UploadResult> => {
  const config = UPLOAD_CONFIG.optimization;
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const originalSize = file.size;
      
      // אם אופטימיזציה מכובה
      if (!config.enabled) {
        const dimensions = await getImageDimensions(dataUrl);
        resolve({
          success: true,
          dataUrl,
          width: dimensions.width,
          height: dimensions.height,
          originalSize,
          optimizedSize: originalSize,
        });
        return;
      }
      
      try {
        const img = new Image();
        img.src = dataUrl;
        
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = () => rej(new Error('Image load failed'));
        });
        
        let { width, height } = img;
        
        // בדיקה אם צריך להקטין
        if (width > config.maxWidth || height > config.maxHeight) {
          const ratio = Math.min(
            config.maxWidth / width,
            config.maxHeight / height
          );
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        // יצירת Canvas לאופטימיזציה
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ success: false, error: 'Failed to create canvas context' });
          return;
        }
        
        // ציור התמונה
        ctx.drawImage(img, 0, 0, width, height);
        
        // המרה ל-PNG (הפורמט היחיד שאנחנו משתמשים)
        const optimizedDataUrl = canvas.toDataURL('image/png', config.quality);
        
        // חישוב גודל מותאם (בערך)
        const optimizedSize = Math.round(optimizedDataUrl.length * 0.75);
        
        resolve({
          success: true,
          dataUrl: optimizedDataUrl,
          width,
          height,
          originalSize,
          optimizedSize,
        });
      } catch (error) {
        console.error('Optimization error:', error);
        resolve({
          success: false,
          error: 'שגיאה באופטימיזציה של התמונה',
        });
      }
    };
    
    reader.onerror = () => {
      resolve({ success: false, error: 'שגיאה בקריאת הקובץ' });
    };
    
    reader.readAsDataURL(file);
  });
};

// ===== Placement Calculation Functions =====

/**
 * חישוב מיקום מסגרת - התאמה לשוליים הקנבס
 */
export const calculateFramePlacement = (
  canvasMode: 'landscape' | 'portrait'
): ElementPlacement => {
  const canvasSize = CANVAS_SIZES[canvasMode];
  
  return {
    x: FRAME_CONFIG.margin,
    y: FRAME_CONFIG.margin,
    width: canvasSize.width - (FRAME_CONFIG.margin * 2),
    height: canvasSize.height - (FRAME_CONFIG.margin * 2),
    locked: FRAME_CONFIG.defaultLocked,
  };
};

/**
 * חישוב מיקום אלמנט רגיל (לוגו/תמונה) - מרכז הקנבס
 */
export const calculateElementPlacement = (
  imageWidth: number,
  imageHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  maxSize: number = 500 // Larger default for 2500px canvas
): ElementPlacement => {
  // שמירה על פרופורציות
  const ratio = Math.min(maxSize / imageWidth, maxSize / imageHeight);
  const width = Math.round(imageWidth * ratio);
  const height = Math.round(imageHeight * ratio);
  
  return {
    x: Math.round((canvasWidth - width) / 2),
    y: Math.round((canvasHeight - height) / 2),
    width,
    height,
    locked: false,
  };
};

/**
 * חישוב מיקום לפי סוג אלמנט
 */
export const calculatePlacementByType = (
  elementType: ElementTypeKey,
  imageWidth: number,
  imageHeight: number,
  canvasWidth: number,
  canvasHeight: number
): ElementPlacement => {
  const typeConfig = ELEMENT_TYPES[elementType];
  const canvasMode = canvasWidth > canvasHeight ? 'landscape' : 'portrait';
  
  if (typeConfig.fitsCanvas) {
    // מסגרת - התאמה לקנבס
    return calculateFramePlacement(canvasMode);
  } else {
    // לוגו/תמונה - מרכז הקנבס
    // Larger sizes for 2500px canvas
    return calculateElementPlacement(
      imageWidth,
      imageHeight,
      canvasWidth,
      canvasHeight,
      elementType === 'logo' ? 400 : 500
    );
  }
};

// ===== Main Upload Function =====

export interface ProcessedUpload extends UploadResult {
  elementType: ElementTypeKey;
  placement: ElementPlacement;
}

/**
 * העלאת קובץ מלאה עם כל הבדיקות והאופטימיזציה
 */
export const processUpload = async (
  file: File,
  elementType: ElementTypeKey,
  canvasWidth: number,
  canvasHeight: number
): Promise<ProcessedUpload> => {
  // בדיקת קובץ
  const validation = validateFile(file);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      elementType,
      placement: { x: 0, y: 0, width: 0, height: 0, locked: false },
    };
  }
  
  // אופטימיזציה
  const result = await optimizeImage(file);
  
  if (!result.success || !result.dataUrl || !result.width || !result.height) {
    return {
      ...result,
      success: false,
      elementType,
      placement: { x: 0, y: 0, width: 0, height: 0, locked: false },
    };
  }
  
  // חישוב מיקום
  const placement = calculatePlacementByType(
    elementType,
    result.width,
    result.height,
    canvasWidth,
    canvasHeight
  );
  
  return {
    ...result,
    elementType,
    placement,
  };
};

/**
 * המרת DataURL ל-Blob
 */
export const dataUrlToBlob = (dataUrl: string): Blob => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

/**
 * יצירת שם קובץ לייצוא
 */
export const generateExportFilename = (
  prefix: string,
  orientation: 'landscape' | 'portrait',
  extension: string = 'png'
): string => {
  const date = new Date().toISOString().split('T')[0];
  const orientationHe = orientation === 'landscape' ? 'רוחב' : 'אורך';
  return `${prefix}_${orientationHe}_${date}.${extension}`;
};
