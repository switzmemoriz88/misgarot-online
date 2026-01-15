// ==========================================
// AddTextModal - מודאל מקצועי להוספת טקסט
// בסגנון Canva עם תבניות מוכנות
// ==========================================

import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../store';
import { DEFAULT_TEXT_ELEMENT } from '../types';

interface AddTextModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Text style presets
const TEXT_PRESETS = [
  {
    id: 'heading',
    name: 'כותרת ראשית',
    icon: '📝',
    preview: 'כותרת',
    style: {
      fontSize: 120,
      fontFamily: 'Heebo',
      fontWeight: 700,
      text: 'הכותרת שלך',
    }
  },
  {
    id: 'subheading',
    name: 'כותרת משנה',
    icon: '📋',
    preview: 'כותרת משנה',
    style: {
      fontSize: 72,
      fontFamily: 'Assistant',
      fontWeight: 500,
      text: 'כותרת משנה',
    }
  },
  {
    id: 'names',
    name: 'שמות (חתן וכלה)',
    icon: '💒',
    preview: 'דני & מיכל',
    style: {
      fontSize: 96,
      fontFamily: 'Frank Ruhl Libre',
      fontWeight: 400,
      text: 'דני & מיכל',
    }
  },
  {
    id: 'date',
    name: 'תאריך',
    icon: '📅',
    preview: '25.12.2025',
    style: {
      fontSize: 64,
      fontFamily: 'Heebo',
      fontWeight: 300,
      text: '25.12.2025',
    }
  },
  {
    id: 'location',
    name: 'מיקום',
    icon: '📍',
    preview: 'אולמי השרון',
    style: {
      fontSize: 56,
      fontFamily: 'Rubik',
      fontWeight: 400,
      text: 'אולמי השרון, הרצליה',
    }
  },
  {
    id: 'time',
    name: 'שעה',
    icon: '🕐',
    preview: '19:00',
    style: {
      fontSize: 48,
      fontFamily: 'Heebo',
      fontWeight: 400,
      text: 'קבלת פנים: 19:00',
    }
  },
  {
    id: 'invitation',
    name: 'הזמנה',
    icon: '💌',
    preview: 'מזמינים אתכם...',
    style: {
      fontSize: 48,
      fontFamily: 'Assistant',
      fontWeight: 400,
      text: 'שמחים להזמינכם לחגוג איתנו',
    }
  },
  {
    id: 'english-elegant',
    name: 'אנגלית אלגנטית',
    icon: '✨',
    preview: 'Save the Date',
    style: {
      fontSize: 72,
      fontFamily: 'Great Vibes',
      fontWeight: 400,
      text: 'Save the Date',
      direction: 'ltr',
      textAlign: 'center',
    }
  },
  {
    id: 'body',
    name: 'טקסט גוף',
    icon: '📄',
    preview: 'טקסט רגיל',
    style: {
      fontSize: 36,
      fontFamily: 'Heebo',
      fontWeight: 400,
      text: 'הקלד את הטקסט שלך כאן',
    }
  },
  {
    id: 'custom',
    name: 'טקסט מותאם',
    icon: '✏️',
    preview: 'טקסט חופשי',
    style: {
      fontSize: 48,
      fontFamily: 'Heebo',
      fontWeight: 400,
      text: '',
    }
  },
];

// Quick fonts for custom text
const QUICK_FONTS = [
  { family: 'Heebo', name: 'היבו', category: 'hebrew' },
  { family: 'Assistant', name: 'אסיסטנט', category: 'hebrew' },
  { family: 'Rubik', name: 'רוביק', category: 'hebrew' },
  { family: 'Frank Ruhl Libre', name: 'פרנק רוהל', category: 'hebrew' },
  { family: 'Playfair Display', name: 'Playfair', category: 'english' },
  { family: 'Great Vibes', name: 'Great Vibes', category: 'english' },
  { family: 'Dancing Script', name: 'Dancing Script', category: 'english' },
  { family: 'Montserrat', name: 'Montserrat', category: 'english' },
];

export const AddTextModal: React.FC<AddTextModalProps> = ({ isOpen, onClose }) => {
  const { addElement, selectElement, canvasWidth, canvasHeight } = useEditorStore();
  const [customText, setCustomText] = useState('');
  const [customFont, setCustomFont] = useState('Heebo');
  const [customSize, setCustomSize] = useState(48);
  const [step, setStep] = useState<'presets' | 'custom'>('presets');
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomText('');
      setStep('presets');
    }
  }, [isOpen]);

  // Focus text input when on custom step
  useEffect(() => {
    if (step === 'custom' && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [step]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const generateId = () => `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleAddText = (preset: typeof TEXT_PRESETS[0]) => {
    if (preset.id === 'custom') {
      setStep('custom');
      return;
    }

    const id = generateId();
    const textWidth = Math.min(preset.style.fontSize * 10, canvasWidth * 0.8);
    const textHeight = preset.style.fontSize * 1.5;

    addElement({
      ...DEFAULT_TEXT_ELEMENT,
      id,
      x: canvasWidth / 2 - textWidth / 2,
      y: canvasHeight / 2 - textHeight / 2,
      width: textWidth,
      height: textHeight,
      zIndex: Date.now(),
      ...preset.style,
    } as any);

    // Select the new element and trigger edit mode
    setTimeout(() => {
      selectElement(id, false);
      // Trigger inline edit
      window.dispatchEvent(new CustomEvent('startTextEdit', { detail: { id } }));
    }, 100);

    onClose();
  };

  const handleAddCustomText = () => {
    if (!customText.trim()) {
      textInputRef.current?.focus();
      return;
    }

    const id = generateId();
    const textWidth = Math.min(customSize * 12, canvasWidth * 0.8);
    const textHeight = customSize * 2;

    addElement({
      ...DEFAULT_TEXT_ELEMENT,
      id,
      x: canvasWidth / 2 - textWidth / 2,
      y: canvasHeight / 2 - textHeight / 2,
      width: textWidth,
      height: textHeight,
      zIndex: Date.now(),
      text: customText,
      fontFamily: customFont,
      fontSize: customSize,
      fontWeight: 400,
    } as any);

    setTimeout(() => {
      selectElement(id, false);
    }, 100);

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-[600px] max-w-[95vw] max-h-[85vh] overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-3">
            {step === 'custom' && (
              <button
                onClick={() => setStep('presets')}
                className="p-1.5 hover:bg-white/60 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {step === 'presets' ? '➕ הוספת טקסט' : '✏️ טקסט מותאם אישית'}
              </h2>
              <p className="text-sm text-gray-500">
                {step === 'presets' ? 'בחר סגנון או צור טקסט מותאם' : 'הקלד את הטקסט ובחר גופן'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/60 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          {step === 'presets' ? (
            <>
              {/* Preset Grid */}
              <div className="grid grid-cols-2 gap-3">
                {TEXT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleAddText(preset)}
                    className={`group relative p-4 rounded-xl border-2 transition-all duration-200 text-right hover:shadow-lg hover:scale-[1.02] ${
                      preset.id === 'custom' 
                        ? 'border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50' 
                        : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{preset.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 mb-1">{preset.name}</div>
                        <div 
                          className="text-gray-500 truncate"
                          style={{ 
                            fontFamily: preset.style.fontFamily,
                            fontSize: '14px',
                            direction: (preset.style as any).direction || 'rtl',
                          }}
                        >
                          {preset.preview}
                        </div>
                      </div>
                    </div>
                    
                    {/* Hover indicator */}
                    <div className="absolute inset-0 rounded-xl bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </button>
                ))}
              </div>

              {/* Quick tip */}
              <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div className="text-sm text-amber-800">
                    <strong>טיפ:</strong> לחץ פעמיים על טקסט בקנבס לעריכה מהירה, או השתמש בסרגל הכלים הצף לשינוי גופן וסגנון.
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Custom Text Step */
            <div className="space-y-5">
              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">הקלד את הטקסט:</label>
                <textarea
                  ref={textInputRef}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="הקלד כאן..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all resize-none text-lg"
                  style={{ fontFamily: customFont, minHeight: '100px' }}
                  dir="auto"
                />
              </div>

              {/* Font Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">בחר גופן:</label>
                <div className="grid grid-cols-4 gap-2">
                  {QUICK_FONTS.map((font) => (
                    <button
                      key={font.family}
                      onClick={() => setCustomFont(font.family)}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        customFont === font.family
                          ? 'border-indigo-500 bg-indigo-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      style={{ fontFamily: font.family }}
                    >
                      <div className="text-lg mb-1" style={{ fontFamily: font.family }}>אבג</div>
                      <div className="text-xs text-gray-500">{font.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Slider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  גודל: <span className="text-indigo-600 font-bold">{customSize}px</span>
                </label>
                <input
                  type="range"
                  min="24"
                  max="200"
                  value={customSize}
                  onChange={(e) => setCustomSize(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>קטן</span>
                  <span>גדול</span>
                </div>
              </div>

              {/* Preview */}
              <div className="p-6 bg-gray-100 rounded-xl text-center">
                <div 
                  className="text-gray-800 break-words"
                  style={{ 
                    fontFamily: customFont, 
                    fontSize: `${Math.min(customSize, 48)}px`,
                    lineHeight: 1.3,
                  }}
                  dir="auto"
                >
                  {customText || 'תצוגה מקדימה...'}
                </div>
              </div>

              {/* Add Button */}
              <button
                onClick={handleAddCustomText}
                disabled={!customText.trim()}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  customText.trim()
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-lg hover:shadow-xl'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                ✨ הוסף לקנבס
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(20px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
