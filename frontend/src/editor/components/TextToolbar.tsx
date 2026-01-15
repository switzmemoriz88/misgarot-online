// ==========================================
// TextToolbar - סרגל כלים צף לעריכת טקסט
// בסגנון Canva - מופיע מעל האלמנט הנבחר
// ==========================================

import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../store';
import { TextElement, HEBREW_FONTS, ENGLISH_FONTS } from '../types';

// All fonts combined
const ALL_FONTS = [...HEBREW_FONTS, ...ENGLISH_FONTS];

// Font size presets
const FONT_SIZE_PRESETS = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96, 120, 144, 180, 200];

interface TextToolbarProps {
  element: TextElement;
  position: { x: number; y: number };
  zoom: number;
}

export const TextToolbar: React.FC<TextToolbarProps> = ({ element, position }) => {
  const { updateElement, saveToHistory } = useEditorStore();
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [editText, setEditText] = useState(element.text);
  const [fontSearch, setFontSearch] = useState('');
  const fontPickerRef = useRef<HTMLDivElement>(null);
  const sizePickerRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const textEditorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync edit text with element text
  useEffect(() => {
    setEditText(element.text);
  }, [element.text]);

  // Focus textarea when editor opens
  useEffect(() => {
    if (showTextEditor && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [showTextEditor]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fontPickerRef.current && !fontPickerRef.current.contains(e.target as Node)) {
        setShowFontPicker(false);
      }
      if (sizePickerRef.current && !sizePickerRef.current.contains(e.target as Node)) {
        setShowSizePicker(false);
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
      if (textEditorRef.current && !textEditorRef.current.contains(e.target as Node)) {
        // Save and close
        if (showTextEditor && editText !== element.text) {
          handleUpdateWithHistory({ text: editText }, 'עריכת טקסט');
        }
        setShowTextEditor(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTextEditor, editText, element.text]);

  const handleUpdate = (updates: Partial<TextElement>) => {
    updateElement(element.id, updates);
  };

  const handleUpdateWithHistory = (updates: Partial<TextElement>, action: string) => {
    updateElement(element.id, updates);
    saveToHistory(action);
  };

  // Filter fonts by search
  const filteredFonts = ALL_FONTS.filter(font => 
    font.name.toLowerCase().includes(fontSearch.toLowerCase()) ||
    font.family.toLowerCase().includes(fontSearch.toLowerCase())
  );

  // Quick colors
  const quickColors = [
    '#000000', '#FFFFFF', '#4B5563', '#EF4444', '#F97316', '#EAB308',
    '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#F43F5E',
  ];

  return (
    <div 
      className="fixed z-[9999] flex items-center gap-1 bg-white rounded-xl shadow-2xl border border-gray-200 p-1.5"
      style={{
        top: Math.max(10, position.y - 60),
        left: position.x,
        transform: 'translateX(-50%)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Font Family Picker */}
      <div className="relative" ref={fontPickerRef}>
        <button
          onClick={() => {
            setShowFontPicker(!showFontPicker);
            setShowSizePicker(false);
            setShowColorPicker(false);
          }}
          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[140px]"
          style={{ fontFamily: element.fontFamily }}
        >
          <span className="text-sm truncate max-w-[100px]">{element.fontFamily}</span>
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showFontPicker && (
          <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
            {/* Search */}
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                placeholder="חפש גופן..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                value={fontSearch}
                onChange={(e) => setFontSearch(e.target.value)}
                autoFocus
              />
            </div>
            
            {/* Font List */}
            <div className="max-h-64 overflow-y-auto">
              {/* Hebrew Fonts */}
              <div className="px-2 py-1 bg-gray-50 text-xs font-semibold text-gray-500 sticky top-0">
                🇮🇱 עברית
              </div>
              {filteredFonts.filter(f => f.category === 'hebrew').map(font => (
                <button
                  key={font.family}
                  onClick={() => {
                    handleUpdateWithHistory({ fontFamily: font.family }, 'שינוי גופן');
                    setShowFontPicker(false);
                    setFontSearch('');
                  }}
                  className={`w-full px-3 py-2.5 text-right hover:bg-indigo-50 transition-colors flex items-center justify-between ${
                    element.fontFamily === font.family ? 'bg-indigo-100 text-indigo-700' : ''
                  }`}
                  style={{ fontFamily: font.family }}
                >
                  <span className="text-base">{font.name}</span>
                  {element.fontFamily === font.family && (
                    <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}

              {/* English Fonts */}
              <div className="px-2 py-1 bg-gray-50 text-xs font-semibold text-gray-500 sticky top-0">
                🇺🇸 English
              </div>
              {filteredFonts.filter(f => f.category !== 'hebrew' && f.category !== 'handwriting').slice(0, 15).map(font => (
                <button
                  key={font.family}
                  onClick={() => {
                    handleUpdateWithHistory({ fontFamily: font.family }, 'שינוי גופן');
                    setShowFontPicker(false);
                    setFontSearch('');
                  }}
                  className={`w-full px-3 py-2.5 text-left hover:bg-indigo-50 transition-colors flex items-center justify-between ${
                    element.fontFamily === font.family ? 'bg-indigo-100 text-indigo-700' : ''
                  }`}
                  style={{ fontFamily: font.family }}
                >
                  <span className="text-base">{font.name}</span>
                  {element.fontFamily === font.family && (
                    <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}

              {/* Script/Handwriting */}
              <div className="px-2 py-1 bg-gray-50 text-xs font-semibold text-gray-500 sticky top-0">
                ✍️ כתב יד / Script
              </div>
              {filteredFonts.filter(f => f.category === 'handwriting').slice(0, 10).map(font => (
                <button
                  key={font.family}
                  onClick={() => {
                    handleUpdateWithHistory({ fontFamily: font.family }, 'שינוי גופן');
                    setShowFontPicker(false);
                    setFontSearch('');
                  }}
                  className={`w-full px-3 py-2.5 text-left hover:bg-indigo-50 transition-colors flex items-center justify-between ${
                    element.fontFamily === font.family ? 'bg-indigo-100 text-indigo-700' : ''
                  }`}
                  style={{ fontFamily: font.family }}
                >
                  <span className="text-base">{font.name}</span>
                  {element.fontFamily === font.family && (
                    <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200" />

      {/* Font Size Picker */}
      <div className="relative" ref={sizePickerRef}>
        <button
          onClick={() => {
            setShowSizePicker(!showSizePicker);
            setShowFontPicker(false);
            setShowColorPicker(false);
          }}
          className="flex items-center gap-1 px-2 py-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <span className="text-sm font-medium w-8 text-center">{element.fontSize}</span>
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showSizePicker && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
            <div className="max-h-48 overflow-y-auto w-20">
              {FONT_SIZE_PRESETS.map(size => (
                <button
                  key={size}
                  onClick={() => {
                    handleUpdateWithHistory({ fontSize: size }, 'שינוי גודל גופן');
                    setShowSizePicker(false);
                  }}
                  className={`w-full px-3 py-2 text-center hover:bg-indigo-50 transition-colors ${
                    element.fontSize === size ? 'bg-indigo-100 text-indigo-700 font-semibold' : ''
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Size +/- Buttons */}
      <div className="flex items-center">
        <button
          onClick={() => handleUpdateWithHistory({ fontSize: Math.max(8, element.fontSize - 4) }, 'הקטנת גופן')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="הקטן"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={() => handleUpdateWithHistory({ fontSize: Math.min(300, element.fontSize + 4) }, 'הגדלת גופן')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="הגדל"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200" />

      {/* Color Picker */}
      <div className="relative" ref={colorPickerRef}>
        <button
          onClick={() => {
            setShowColorPicker(!showColorPicker);
            setShowFontPicker(false);
            setShowSizePicker(false);
          }}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
          title="צבע טקסט"
        >
          <div 
            className="w-5 h-5 rounded border border-gray-300"
            style={{ backgroundColor: element.fill }}
          />
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showColorPicker && (
          <div className="absolute top-full right-0 mt-2 p-3 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
            {/* Quick Colors Grid */}
            <div className="grid grid-cols-6 gap-2 mb-3">
              {quickColors.map(color => (
                <button
                  key={color}
                  onClick={() => {
                    handleUpdateWithHistory({ fill: color }, 'שינוי צבע');
                    setShowColorPicker(false);
                  }}
                  className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${
                    element.fill === color ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            {/* Custom Color */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <input
                type="color"
                value={element.fill}
                onChange={(e) => handleUpdate({ fill: e.target.value })}
                onBlur={() => saveToHistory('שינוי צבע')}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={element.fill}
                onChange={(e) => handleUpdate({ fill: e.target.value })}
                onBlur={() => saveToHistory('שינוי צבע')}
                className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded text-left uppercase"
              />
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200" />

      {/* Bold */}
      <button
        onClick={() => handleUpdateWithHistory(
          { fontWeight: element.fontWeight >= 700 ? 400 : 700 },
          'שינוי עובי'
        )}
        className={`p-2 rounded-lg transition-colors ${
          element.fontWeight >= 700 ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'
        }`}
        title="עבה (Bold)"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
        </svg>
      </button>

      {/* Italic */}
      <button
        onClick={() => handleUpdateWithHistory(
          { fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' },
          'שינוי נטוי'
        )}
        className={`p-2 rounded-lg transition-colors ${
          element.fontStyle === 'italic' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'
        }`}
        title="נטוי (Italic)"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
        </svg>
      </button>

      {/* Underline */}
      <button
        onClick={() => handleUpdateWithHistory(
          { textDecoration: element.textDecoration === 'underline' ? 'none' : 'underline' },
          'קו תחתון'
        )}
        className={`p-2 rounded-lg transition-colors ${
          element.textDecoration === 'underline' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'
        }`}
        title="קו תחתון"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/>
        </svg>
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200" />

      {/* Text Alignment */}
      <div className="flex items-center">
        <button
          onClick={() => handleUpdateWithHistory({ textAlign: 'right' }, 'יישור לימין')}
          className={`p-2 rounded-lg transition-colors ${
            element.textAlign === 'right' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'
          }`}
          title="יישור לימין"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/>
          </svg>
        </button>
        <button
          onClick={() => handleUpdateWithHistory({ textAlign: 'center' }, 'יישור למרכז')}
          className={`p-2 rounded-lg transition-colors ${
            element.textAlign === 'center' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'
          }`}
          title="יישור למרכז"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/>
          </svg>
        </button>
        <button
          onClick={() => handleUpdateWithHistory({ textAlign: 'left' }, 'יישור לשמאל')}
          className={`p-2 rounded-lg transition-colors ${
            element.textAlign === 'left' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'
          }`}
          title="יישור לשמאל"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/>
          </svg>
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200" />

      {/* Edit Text Button & Inline Editor */}
      <div ref={textEditorRef} className="relative">
        <button
          onClick={() => setShowTextEditor(!showTextEditor)}
          className={`p-2 rounded-lg transition-colors ${
            showTextEditor ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'
          }`}
          title="ערוך טקסט"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        {/* Inline Text Editor Popup */}
        {showTextEditor && (
          <div 
            className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-3 z-[10000] min-w-[300px] max-w-[400px]"
            style={{ direction: 'rtl' }}
          >
            <div className="text-xs font-medium text-gray-500 mb-2">✏️ עריכת טקסט</div>
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleUpdateWithHistory({ text: editText }, 'עריכת טקסט');
                  setShowTextEditor(false);
                }
                if (e.key === 'Escape') {
                  setEditText(element.text);
                  setShowTextEditor(false);
                }
              }}
              className="w-full px-3 py-2 border-2 border-indigo-200 rounded-lg text-sm resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              rows={3}
              style={{ 
                fontFamily: element.fontFamily,
                fontSize: '14px',
                direction: element.direction || 'rtl'
              }}
              placeholder="הקלד טקסט..."
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">Enter לשמירה • Esc לביטול</span>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditText(element.text);
                    setShowTextEditor(false);
                  }}
                  className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={() => {
                    handleUpdateWithHistory({ text: editText }, 'עריכת טקסט');
                    setShowTextEditor(false);
                  }}
                  className="px-2 py-1 text-xs bg-indigo-500 text-white hover:bg-indigo-600 rounded transition-colors"
                >
                  שמור
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextToolbar;
