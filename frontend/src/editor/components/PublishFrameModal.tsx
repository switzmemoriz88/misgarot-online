// ==========================================
// 🖼️ Publish Frame Modal - פרסום מסגרת למערכת (Admin Only)
// ==========================================
// 
// מודאל לפרסום מסגרת חדשה למערכת.
// כולל תרגום אוטומטי משם עברי לאנגלי.
// תומך בשיוך מסגרות אורך/רוחב.
//
// ==========================================

import React, { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase/client';

interface Category {
  id: string;
  name: string;
  name_en: string;
}

interface PairedFrame {
  id: string;
  name: string;
  orientation: string;
  thumbnail_url: string | null;
}

interface PublishFrameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (data: PublishFrameData) => Promise<void>;
  currentOrientation: 'landscape' | 'portrait';
  previewImage?: string; // Base64 or URL of canvas preview
}

export interface PublishFrameData {
  name: string;
  nameEn: string;
  categoryId: string;
  isPremium: boolean;
  pairedFrameId?: string; // לשיוך עם מסגרת הפוכה
  orientation: 'landscape' | 'portrait';
}

// פונקציית תרגום משופרת (transliteration + common words)
const translateToEnglish = (hebrewText: string): string => {
  // מילון מילים נפוצות - מורחב
  const dictionary: Record<string, string> = {
    // קטגוריות
    'מסגרת': 'Frame',
    'חתונה': 'Wedding',
    'חינה': 'Henna',
    'בר מצווה': 'Bar Mitzvah',
    'בר-מצווה': 'Bar Mitzvah',
    'בת מצווה': 'Bat Mitzvah',
    'בת-מצווה': 'Bat Mitzvah',
    'ברית': 'Brit',
    'בריתה': 'Brit Bat',
    'יום הולדת': 'Birthday',
    'יום-הולדת': 'Birthday',
    'הולדת': 'Birthday',
    'אירועים': 'Events',
    'עסקיים': 'Business',
    'עסקי': 'Business',
    'חגים': 'Holidays',
    'חג': 'Holiday',
    'אחר': 'Other',
    // צבעים
    'זהב': 'Gold',
    'זהוב': 'Golden',
    'כסף': 'Silver',
    'כסוף': 'Silver',
    'לבן': 'White',
    'שחור': 'Black',
    'ורוד': 'Pink',
    'כחול': 'Blue',
    'ירוק': 'Green',
    'אדום': 'Red',
    'סגול': 'Purple',
    'תכלת': 'Light Blue',
    'כתום': 'Orange',
    'צהוב': 'Yellow',
    'חום': 'Brown',
    'בז\'': 'Beige',
    'קרם': 'Cream',
    'אפור': 'Gray',
    'טורקיז': 'Turquoise',
    'בורדו': 'Burgundy',
    'ניוד': 'Nude',
    // סגנונות
    'קלאסי': 'Classic',
    'קלאסית': 'Classic',
    'מודרני': 'Modern',
    'מודרנית': 'Modern',
    'וינטג': 'Vintage',
    'וינטאג\'': 'Vintage',
    'אלגנטי': 'Elegant',
    'אלגנטית': 'Elegant',
    'רומנטי': 'Romantic',
    'רומנטית': 'Romantic',
    'מינימליסטי': 'Minimalist',
    'מינימליסטית': 'Minimalist',
    'יוקרתי': 'Luxurious',
    'יוקרתית': 'Luxurious',
    'עדין': 'Delicate',
    'עדינה': 'Delicate',
    'עוצמתי': 'Bold',
    'עוצמתית': 'Bold',
    'נקי': 'Clean',
    'נקייה': 'Clean',
    'פשוט': 'Simple',
    'פשוטה': 'Simple',
    // אלמנטים
    'פרחים': 'Flowers',
    'פרח': 'Flower',
    'פרחוני': 'Floral',
    'פרחונית': 'Floral',
    'לב': 'Heart',
    'לבבות': 'Hearts',
    'כוכב': 'Star',
    'כוכבים': 'Stars',
    'נצנצים': 'Glitter',
    'נצנוץ': 'Sparkle',
    'עלים': 'Leaves',
    'עלה': 'Leaf',
    'ענף': 'Branch',
    'ענפים': 'Branches',
    'טבעת': 'Ring',
    'טבעות': 'Rings',
    'יהלום': 'Diamond',
    'יהלומים': 'Diamonds',
    'זר': 'Bouquet',
    'כתר': 'Crown',
    'נר': 'Candle',
    'נרות': 'Candles',
    'בלון': 'Balloon',
    'בלונים': 'Balloons',
    'קונפטי': 'Confetti',
    'סרט': 'Ribbon',
    'תחרה': 'Lace',
    'גבול': 'Border',
    // מספרים ותארים
    'מספר': 'Number',
    'ראשון': 'First',
    'שני': 'Second',
    'שלישי': 'Third',
    'חדש': 'New',
    'חדשה': 'New',
    'מיוחד': 'Special',
    'מיוחדת': 'Special',
    // אחר
    'אירוסין': 'Engagement',
    'הצעה': 'Proposal',
    'סיום': 'Graduation',
    'לידה': 'Birth',
    'תינוק': 'Baby',
    'תינוקת': 'Baby Girl',
    'שנה': 'Year',
    'חודש': 'Month',
    'גיל': 'Age',
    'משפחה': 'Family',
    'משפחתי': 'Family',
    'אהבה': 'Love',
    'מזל': 'Mazel',
    'טוב': 'Tov',
    'ברכה': 'Blessing',
    'ברכות': 'Blessings',
    'שמח': 'Happy',
    'שמחה': 'Happy',
  };

  let result = hebrewText;
  
  // מיון לפי אורך מילים (מהארוכות לקצרות) כדי להתאים ביטויים מורכבים קודם
  const sortedEntries = Object.entries(dictionary).sort((a, b) => b[0].length - a[0].length);
  
  // החלף מילים מהמילון
  sortedEntries.forEach(([heb, eng]) => {
    result = result.replace(new RegExp(heb, 'gi'), eng);
  });

  // אם עדיין יש עברית, תעשה transliteration בסיסי
  const hasHebrew = /[\u0590-\u05FF]/.test(result);
  if (hasHebrew) {
    // Transliteration map
    const translit: Record<string, string> = {
      'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h',
      'ו': 'v', 'ז': 'z', 'ח': 'ch', 'ט': 't', 'י': 'y',
      'כ': 'k', 'ך': 'k', 'ל': 'l', 'מ': 'm', 'ם': 'm',
      'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': 'a', 'פ': 'p',
      'ף': 'f', 'צ': 'ts', 'ץ': 'ts', 'ק': 'k', 'ר': 'r',
      'ש': 'sh', 'ת': 't',
    };

    result = result.split('').map(char => translit[char] || char).join('');
  }

  // נקה רווחים כפולים
  result = result.replace(/\s+/g, ' ').trim();

  // Capitalize first letter of each word
  result = result.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');

  return result;
};

export const PublishFrameModal: React.FC<PublishFrameModalProps> = ({
  isOpen,
  onClose,
  onPublish,
  currentOrientation,
  previewImage,
}) => {
  // Form state
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [pairedFrameId, setPairedFrameId] = useState<string>('');
  
  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [unpairedFrames, setUnpairedFrames] = useState<PairedFrame[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showEnglishEdit, setShowEnglishEdit] = useState(false);

  // Load categories and unpaired frames
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Auto-translate when Hebrew name changes
  useEffect(() => {
    if (name.trim() && !showEnglishEdit) {
      setIsTranslating(true);
      const timer = setTimeout(() => {
        const translated = translateToEnglish(name);
        setNameEn(translated);
        setIsTranslating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [name, showEnglishEdit]);

  // Default categories if none exist
  const defaultCategories: Omit<Category, 'id'>[] = [
    { name: 'חתונה', name_en: 'Wedding' },
    { name: 'חינה', name_en: 'Henna' },
    { name: 'בר מצווה', name_en: 'Bar Mitzvah' },
    { name: 'בת מצווה', name_en: 'Bat Mitzvah' },
    { name: 'ברית', name_en: 'Brit' },
    { name: 'בריתה', name_en: 'Brit Bat' },
    { name: 'יום הולדת', name_en: 'Birthday' },
    { name: 'אירועים עסקיים', name_en: 'Business Events' },
    { name: 'חגים', name_en: 'Holidays' },
    { name: 'אחר', name_en: 'Other' },
  ];

  const loadData = async () => {
    console.log('📂 loadData called');
    const supabase = getSupabase();
    if (!supabase) {
      console.error('❌ Supabase not configured');
      return;
    }

    // Load categories
    const { data: categoriesData, error: catError } = await supabase
      .from('categories')
      .select('id, name, name_en')
      .eq('is_active', true)
      .order('sort_order');

    console.log('📁 Categories loaded:', categoriesData, 'Error:', catError);

    let cats = categoriesData as Category[] | null;
    
    // If no categories exist, create default ones
    if (!cats || cats.length === 0) {
      console.log('No categories found, creating defaults...');
      const icons = ['💍', '🎉', '✡️', '🌸', '👶', '🎀', '🎂', '💼', '🕎', '📁'];
      
      for (let i = 0; i < defaultCategories.length; i++) {
        const cat = defaultCategories[i];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('categories')
          .insert({
            name: cat.name,
            name_en: cat.name_en,
            icon: icons[i],
            sort_order: i + 1,
            is_active: true,
          });
      }
      
      // Reload categories
      const { data: newCats } = await supabase
        .from('categories')
        .select('id, name, name_en')
        .eq('is_active', true)
        .order('sort_order');
      
      cats = newCats as Category[] | null;
    }
    
    if (cats && cats.length > 0) {
      setCategories(cats);
      if (!categoryId) {
        console.log('✅ Setting default categoryId:', cats[0].id);
        setCategoryId(cats[0].id);
      }
    } else {
      console.warn('⚠️ No categories loaded');
    }

    // Load unpaired frames (frames without paired_frame_id that have opposite orientation)
    const oppositeOrientation = currentOrientation === 'landscape' ? 'portrait' : 'landscape';
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: framesData } = await (supabase as any)
      .from('frames')
      .select('id, name, orientation, thumbnail_url')
      .eq('orientation', oppositeOrientation)
      .is('paired_frame_id', null)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (framesData) {
      setUnpairedFrames(framesData as PairedFrame[]);
    }
  };

  const handlePublish = async () => {
    console.log('🚀 handlePublish called', { name, categoryId, currentOrientation });
    
    if (!name.trim()) {
      alert('❌ נא להזין שם למסגרת');
      return;
    }
    
    if (!categoryId) {
      alert('❌ נא לבחור קטגוריה');
      return;
    }

    setIsLoading(true);
    try {
      console.log('📤 Calling onPublish...');
      await onPublish({
        name: name.trim(),
        nameEn: nameEn.trim() || translateToEnglish(name.trim()),
        categoryId,
        isPremium,
        pairedFrameId: pairedFrameId || undefined,
        orientation: currentOrientation,
      });
      
      console.log('✅ onPublish completed successfully');
      
      // Reset form
      setName('');
      setNameEn('');
      setPairedFrameId('');
      setIsPremium(false);
      setShowEnglishEdit(false);
      onClose();
    } catch (error) {
      console.error('❌ Error in handlePublish:', error);
      alert(`❌ שגיאה בפרסום: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const oppositeOrientationLabel = currentOrientation === 'landscape' ? 'אורך' : 'רוחב';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-[600px] max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🖼️</span>
            <div>
              <h2 className="text-lg font-bold text-white">פרסום מסגרת למערכת</h2>
              <p className="text-indigo-200 text-sm">
                {currentOrientation === 'landscape' ? '📐 מסגרת רוחב' : '📏 מסגרת אורך'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Preview */}
          {previewImage && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-2">תצוגה מקדימה:</p>
              <img 
                src={previewImage} 
                alt="Preview" 
                className="max-h-32 mx-auto rounded-lg shadow"
              />
            </div>
          )}

          {/* Hebrew Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              שם המסגרת (עברית) *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמא: מסגרת זהב קלאסית"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right text-lg"
              autoFocus
            />
          </div>

          {/* English Name (Auto-translated) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                שם באנגלית (תורגם אוטומטית)
              </label>
              <button
                type="button"
                onClick={() => setShowEnglishEdit(!showEnglishEdit)}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                {showEnglishEdit ? '🔒 נעל' : '✏️ ערוך ידנית'}
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="English name..."
                disabled={!showEnglishEdit}
                dir="ltr"
                className={`w-full px-4 py-3 border rounded-xl text-left ${
                  showEnglishEdit 
                    ? 'border-indigo-300 bg-white focus:ring-2 focus:ring-indigo-500' 
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
              />
              {isTranslating && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              קטגוריה *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right"
            >
              <option value="">בחר קטגוריה</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pair with opposite orientation frame */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🔗</span>
              <label className="text-sm font-medium text-blue-800">
                שיוך עם מסגרת {oppositeOrientationLabel} (אופציונלי)
              </label>
            </div>
            
            {/* If publishing from landscape, portrait will be auto-created */}
            {currentOrientation === 'landscape' ? (
              <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                <p className="text-sm text-green-800 font-medium">
                  ✅ מסגרת אורך תיווצר אוטומטית!
                </p>
                <p className="text-xs text-green-600 mt-1">
                  האלמנטים הנעולים (המסגרת) יועברו אוטומטית לגרסת האורך.
                </p>
              </div>
            ) : unpairedFrames.length > 0 ? (
              <select
                value={pairedFrameId}
                onChange={(e) => setPairedFrameId(e.target.value)}
                className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-right"
              >
                <option value="">ללא שיוך - יצירת מסגרת עצמאית</option>
                {unpairedFrames.map(frame => (
                  <option key={frame.id} value={frame.id}>
                    {frame.name} ({frame.orientation === 'landscape' ? 'רוחב' : 'אורך'})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-blue-600">
                אין מסגרות {oppositeOrientationLabel} זמינות לשיוך. תוכל לשייך אחר כך.
              </p>
            )}
            
            <p className="text-xs text-blue-600 mt-2">
              💡 שיוך מסגרות אורך ורוחב יאפשר ללקוחות להחליף ביניהן בקלות
            </p>
          </div>

          {/* Premium Toggle */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💎</span>
              <div>
                <p className="font-medium text-gray-800">מסגרת פרימיום</p>
                <p className="text-sm text-gray-500">זמינה רק למנויים Pro+</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-yellow-400 peer-checked:to-amber-500"></div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
          >
            ביטול
          </button>
          
          <button
            onClick={handlePublish}
            disabled={isLoading || !name.trim() || !categoryId}
            className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                מפרסם...
              </>
            ) : (
              <>
                <span>🚀</span>
                פרסם למערכת
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishFrameModal;
