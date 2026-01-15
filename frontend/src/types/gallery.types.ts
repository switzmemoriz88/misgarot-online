// ==========================================
// Gallery Types - טיפוסים לגלריה ולמסגרות
// ==========================================

// קטגוריה של אירוע
export interface Category {
  id: string;
  name: string;
  icon: string;
  gradient: string;
  description: string;
}

// תבנית מסגרת
export interface FrameTemplate {
  id: string;
  name: string;
  categoryId: string;
  colors: [string, string, string]; // 3 צבעים עיקריים
  previewImage?: string;
  orientation: 'landscape' | 'portrait';
}

// מצב העורך
export type EditorMode = 'landscape' | 'portrait' | 'custom';
