// ==========================================
// App Configuration - הגדרות מרכזיות לאפליקציה
// קל לשנות ולהרחיב - כל ההגדרות במקום אחד
// ==========================================

// ===== גדלי קנבס - ייצוא (רזולוציה גבוהה) =====
export const CANVAS_EXPORT_SIZES = {
  landscape: { width: 2500, height: 1875, label: 'מסגרת רוחב' },
  portrait: { width: 1875, height: 2500, label: 'מסגרת אורך' },
  square: { width: 2500, height: 2500, label: 'מסגרת ריבועית' },
} as const;

// ===== גדלי קנבס - הגדלים המקוריים (תצוגה בזום) =====
// הקנבס בגודל מלא - התצוגה מוקטנת ב-CSS
export const CANVAS_SIZES = {
  landscape: { width: 2500, height: 1875, label: 'מסגרת רוחב' },
  portrait: { width: 1875, height: 2500, label: 'מסגרת אורך' },
  square: { width: 2500, height: 2500, label: 'מסגרת ריבועית' },
} as const;

export type CanvasSizeKey = keyof typeof CANVAS_SIZES;

// ===== הגדרות העלאת קבצים =====
export const UPLOAD_CONFIG = {
  // גודל מקסימלי (4MB)
  maxFileSize: 4 * 1024 * 1024,
  maxFileSizeMB: 4,
  
  // פורמטים מותרים
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.svg'],
  
  // אופטימיזציה
  optimization: {
    enabled: true,
    maxWidth: 3000,
    maxHeight: 3000,
    quality: 0.92,
  },
};

// ===== הגדרות מסגרות =====
export const FRAME_CONFIG = {
  // מסגרת נעולה כברירת מחדל (לקוחות לא יכולים להזיז)
  defaultLocked: true,
  // התאמה אוטומטית לשוליים של הקנבס
  autoFitToCanvas: true,
  // שוליים
  margin: 0,
};

// ===== סוגי אלמנטים להעלאה =====
export const ELEMENT_TYPES = {
  frame: { id: 'frame', name: 'מסגרת', fitsCanvas: true, locked: true },
  logo: { id: 'logo', name: 'לוגו', fitsCanvas: false, locked: false },
  image: { id: 'image', name: 'תמונה', fitsCanvas: false, locked: false },
  decoration: { id: 'decoration', name: 'קישוט', fitsCanvas: false, locked: false },
} as const;

export type ElementTypeKey = keyof typeof ELEMENT_TYPES;

// ===== איכויות ייצוא =====
export const EXPORT_QUALITY = {
  low: { pixelRatio: 1, label: 'נמוכה', description: 'תצוגה מקדימה' },
  medium: { pixelRatio: 2, label: 'בינונית', description: 'שיתוף ברשתות' },
  high: { pixelRatio: 3, label: 'גבוהה', description: 'הדפסה ביתית' },
  print: { pixelRatio: 4, label: 'הדפסה', description: '300 DPI מקצועי' },
  // להוספה בעתיד:
  // ultra: { pixelRatio: 6, label: 'אולטרה', description: 'פוסטרים גדולים' },
} as const;

export type ExportQualityKey = keyof typeof EXPORT_QUALITY;

// ===== פורמטי ייצוא - PNG בלבד =====
export const EXPORT_FORMATS = {
  png: { mimeType: 'image/png', extension: 'png', label: 'PNG', icon: '🖼️', description: 'איכות גבוהה עם שקיפות' },
} as const;

// פורמט ברירת מחדל - PNG בלבד
export const DEFAULT_EXPORT_FORMAT = 'png' as const;

export type ExportFormatKey = keyof typeof EXPORT_FORMATS;

// ===== הגדרות Auto-Save =====
export const AUTO_SAVE_CONFIG = {
  interval: 30000, // 30 שניות
  storageKey: 'misgarot_autosave',
  maxBackups: 5,
  enabled: true,
};

// ===== הגדרות Session =====
export const SESSION_CONFIG = {
  storageKey: 'misgarot_design_session',
  landscapeKey: 'misgarot_landscape_design',
  portraitKey: 'misgarot_portrait_design',
};

// ===== צבעי ברירת מחדל =====
export const DEFAULT_COLORS = {
  background: '#ffffff',
  gradientStart: '#667eea',
  gradientEnd: '#764ba2',
  text: '#333333',
  accent: '#6366f1',
};

// ===== פונטים זמינים =====
export const AVAILABLE_FONTS = [
  { id: 'assistant', name: 'Assistant', family: 'Assistant, sans-serif', rtl: true },
  { id: 'heebo', name: 'Heebo', family: 'Heebo, sans-serif', rtl: true },
  { id: 'rubik', name: 'Rubik', family: 'Rubik, sans-serif', rtl: true },
  { id: 'arial', name: 'Arial', family: 'Arial, sans-serif', rtl: true },
  { id: 'david', name: 'David', family: 'David, serif', rtl: true },
  // להוספה בעתיד:
  // { id: 'playfair', name: 'Playfair Display', family: 'Playfair Display, serif', rtl: false },
  // { id: 'dancing', name: 'Dancing Script', family: 'Dancing Script, cursive', rtl: false },
];

// ===== צורות זמינות =====
export const AVAILABLE_SHAPES = [
  { id: 'rectangle', name: 'מלבן', icon: '⬜' },
  { id: 'circle', name: 'עיגול', icon: '⭕' },
  { id: 'triangle', name: 'משולש', icon: '🔺' },
  { id: 'star', name: 'כוכב', icon: '⭐' },
  { id: 'heart', name: 'לב', icon: '❤️' },
  { id: 'hexagon', name: 'משושה', icon: '⬡' },
  // להוספה בעתיד:
  // { id: 'arrow', name: 'חץ', icon: '➡️' },
  // { id: 'diamond', name: 'יהלום', icon: '💎' },
];

// ===== פילטרים לתמונות =====
export const IMAGE_FILTERS = {
  none: { name: 'ללא', adjustments: {} },
  vintage: { name: 'וינטג\'', adjustments: { brightness: 0.1, contrast: -0.1, saturation: -0.3 } },
  warm: { name: 'חם', adjustments: { brightness: 0.05, saturation: 0.1 } },
  cold: { name: 'קר', adjustments: { brightness: 0.05, saturation: -0.1 } },
  dramatic: { name: 'דרמטי', adjustments: { contrast: 0.3, brightness: -0.1 } },
  bw: { name: 'שחור לבן', adjustments: { saturation: -1 } },
  sepia: { name: 'ספיה', adjustments: { saturation: -0.5 } },
  vivid: { name: 'חי', adjustments: { saturation: 0.3, contrast: 0.1 } },
  // להוספה בעתיד:
  // hdr: { name: 'HDR', adjustments: { contrast: 0.4, saturation: 0.2 } },
  // matte: { name: 'מאט', adjustments: { contrast: -0.2, brightness: 0.1 } },
};

export type ImageFilterKey = keyof typeof IMAGE_FILTERS;

// ===== הגדרות UI =====
export const UI_CONFIG = {
  // Breakpoints
  breakpoints: {
    mobile: 640,
    tablet: 1024,
    desktop: 1280,
  },
  // Animation durations (ms)
  animations: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  // Panel widths
  panels: {
    layers: 256,    // w-64
    properties: 320, // w-80
    toolbar: 48,
  },
};

// ===== API Endpoints (לשימוש עתידי) =====
export const API_CONFIG = {
  baseUrl: '/api',
  endpoints: {
    auth: '/auth',
    designs: '/designs',
    templates: '/templates',
    clients: '/clients',
    export: '/export',
  },
  timeout: 30000,
};

// ===== Feature Flags - הפעלה/כיבוי פיצ'רים =====
export const FEATURES = {
  autoSave: true,
  cloudSync: false,        // לפיתוח עתידי
  collaboration: false,    // לפיתוח עתידי
  aiSuggestions: false,    // לפיתוח עתידי
  customFonts: false,      // לפיתוח עתידי
  watermark: false,        // לפיתוח עתידי
  analytics: false,        // לפיתוח עתידי
  multiLanguage: true,
  darkMode: false,         // לפיתוח עתידי
  templates: true,
  imageFilters: true,
  smartGuides: true,
  keyboardShortcuts: true,
};

// ===== הגדרות שליחת מייל =====
export const EMAIL_CONFIG = {
  // האם לשלוח מייל בסיום
  sendOnComplete: true,
  // שליחה ללקוח
  sendToClient: true,
  // שליחה לצלם
  sendToPhotographer: true,
  // פורמט הקובץ המצורף
  attachmentFormat: 'png' as const,
  // נושא המייל ללקוח
  clientSubject: 'העיצובים שלך מוכנים! 🎉',
  // נושא המייל לצלם
  photographerSubject: 'עיצוב חדש הושלם',
};

// ===== Limits =====
export const LIMITS = {
  maxElements: 100,
  maxImageSize: UPLOAD_CONFIG.maxFileSize,
  maxUndoSteps: 50,
  maxTemplates: 50,
  maxLayers: 30,
};
