// ==========================================
// Frame Templates Data - תבניות מסגרות
// ==========================================

import { FrameTemplate } from '../types';

export const FRAME_TEMPLATES: FrameTemplate[] = [
  // ===== חתונה =====
  {
    id: 'wedding-gold',
    name: 'זהב אלגנטי',
    categoryId: 'wedding',
    colors: ['#D4AF37', '#FFFFFF', '#1a1a1a'],
    orientation: 'landscape',
  },
  {
    id: 'wedding-white',
    name: 'לבן קלאסי',
    categoryId: 'wedding',
    colors: ['#FFFFFF', '#F5F5F5', '#333333'],
    orientation: 'landscape',
  },
  {
    id: 'wedding-rosegold',
    name: 'רוז גולד',
    categoryId: 'wedding',
    colors: ['#B76E79', '#FFFFFF', '#2C2C2C'],
    orientation: 'landscape',
  },
  {
    id: 'wedding-modern',
    name: 'מודרני',
    categoryId: 'wedding',
    colors: ['#2C3E50', '#FFFFFF', '#E74C3C'],
    orientation: 'landscape',
  },

  // ===== בר מצווה =====
  {
    id: 'bar-blue',
    name: 'כחול מודרני',
    categoryId: 'bar-mitzvah',
    colors: ['#1E88E5', '#FFFFFF', '#212121'],
    orientation: 'landscape',
  },
  {
    id: 'bar-sport',
    name: 'ספורטיבי',
    categoryId: 'bar-mitzvah',
    colors: ['#4CAF50', '#FFFFFF', '#FF5722'],
    orientation: 'landscape',
  },
  {
    id: 'bar-tech',
    name: 'טכנולוגי',
    categoryId: 'bar-mitzvah',
    colors: ['#00BCD4', '#1a1a1a', '#FFFFFF'],
    orientation: 'landscape',
  },
  {
    id: 'bar-dark',
    name: 'כהה אלגנטי',
    categoryId: 'bar-mitzvah',
    colors: ['#1a237e', '#FFFFFF', '#FFD700'],
    orientation: 'landscape',
  },

  // ===== בת מצווה =====
  {
    id: 'bat-pink',
    name: 'ורוד',
    categoryId: 'bat-mitzvah',
    colors: ['#FF69B4', '#FFFFFF', '#FFD700'],
    orientation: 'landscape',
  },
  {
    id: 'bat-purple',
    name: 'סגול',
    categoryId: 'bat-mitzvah',
    colors: ['#9C27B0', '#E1BEE7', '#FFFFFF'],
    orientation: 'landscape',
  },
  {
    id: 'bat-teal',
    name: 'טורקיז',
    categoryId: 'bat-mitzvah',
    colors: ['#009688', '#FFFFFF', '#FF4081'],
    orientation: 'landscape',
  },
  {
    id: 'bat-gold',
    name: 'זהב ורוד',
    categoryId: 'bat-mitzvah',
    colors: ['#FFD700', '#FFC0CB', '#FFFFFF'],
    orientation: 'landscape',
  },

  // ===== ברית =====
  {
    id: 'brit-blue',
    name: 'כחול שמיימי',
    categoryId: 'brit',
    colors: ['#87CEEB', '#FFFFFF', '#4169E1'],
    orientation: 'landscape',
  },
  {
    id: 'brit-pastel',
    name: 'פסטל',
    categoryId: 'brit',
    colors: ['#B0E0E6', '#FFFACD', '#FFB6C1'],
    orientation: 'landscape',
  },
  {
    id: 'brit-white',
    name: 'לבן וזהב',
    categoryId: 'brit',
    colors: ['#FFFFFF', '#FFD700', '#87CEEB'],
    orientation: 'landscape',
  },

  // ===== יום הולדת =====
  {
    id: 'bday-colorful',
    name: 'צבעוני',
    categoryId: 'birthday',
    colors: ['#FF6B6B', '#4ECDC4', '#FFE66D'],
    orientation: 'landscape',
  },
  {
    id: 'bday-balloons',
    name: 'בלונים',
    categoryId: 'birthday',
    colors: ['#E91E63', '#2196F3', '#FFEB3B'],
    orientation: 'landscape',
  },
  {
    id: 'bday-gold',
    name: 'זהב חגיגי',
    categoryId: 'birthday',
    colors: ['#FFD700', '#000000', '#FFFFFF'],
    orientation: 'landscape',
  },
  {
    id: 'bday-rainbow',
    name: 'קשת בענן',
    categoryId: 'birthday',
    colors: ['#FF0000', '#00FF00', '#0000FF'],
    orientation: 'landscape',
  },

  // ===== עסקי =====
  {
    id: 'biz-corporate',
    name: 'תאגידי',
    categoryId: 'business',
    colors: ['#1a237e', '#FFFFFF', '#C0C0C0'],
    orientation: 'landscape',
  },
  {
    id: 'biz-modern',
    name: 'עסקי מודרני',
    categoryId: 'business',
    colors: ['#37474F', '#FFFFFF', '#00BCD4'],
    orientation: 'landscape',
  },
  {
    id: 'biz-minimal',
    name: 'מינימלי',
    categoryId: 'business',
    colors: ['#FFFFFF', '#000000', '#808080'],
    orientation: 'landscape',
  },
];

// פונקציה לקבלת מסגרות לפי קטגוריה
export const getFramesByCategory = (categoryId: string): FrameTemplate[] => {
  return FRAME_TEMPLATES.filter(frame => frame.categoryId === categoryId);
};

// פונקציה לקבלת מסגרת לפי ID
export const getFrameById = (id: string): FrameTemplate | undefined => {
  return FRAME_TEMPLATES.find(frame => frame.id === id);
};
