// ==========================================
// Layers Panel - פאנל שכבות
// ==========================================

import React from 'react';
import { useEditorStore } from '../store';
import { CanvasElement } from '../types';

// Icons
const icons = {
  visible: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  hidden: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  locked: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  unlocked: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  ),
  stretch: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M21 3H3v18h18V3z" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
      <path d="M3 3l6 6M21 3l-6 6M3 21l6-6M21 21l-6-6" />
    </svg>
  ),
  text: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M4 7V4h16v3M9 20h6M12 4v16" />
    </svg>
  ),
  image: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  ),
  shape: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  frame: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <rect x="3" y="3" width="18" height="18" />
      <rect x="7" y="7" width="10" height="10" />
    </svg>
  ),
  moveUp: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  moveDown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  delete: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
};

export const LayersPanel: React.FC = () => {
  const {
    elements,
    selectedIds,
    selectElement,
    updateElement,
    deleteElement,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    saveToHistory,
    stretchToCanvas,
  } = useEditorStore();

  // Sort elements by zIndex (highest first for display)
  const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  // Get element type icon
  const getTypeIcon = (type: CanvasElement['type']) => {
    switch (type) {
      case 'text': return icons.text;
      case 'image': return icons.image;
      case 'shape': return icons.shape;
      case 'frame': return icons.frame;
      default: return icons.shape;
    }
  };

  // Handle stretch to canvas
  const handleStretchToCanvas = (e: React.MouseEvent, element: CanvasElement) => {
    e.stopPropagation();
    stretchToCanvas(element.id);
    saveToHistory('מתיחה לקצוות');
  };

  // Handle layer selection
  const handleSelect = (id: string, e: React.MouseEvent) => {
    const multiSelect = e.shiftKey || e.metaKey || e.ctrlKey;
    selectElement(id, multiSelect);
  };

  // Toggle visibility
  const handleToggleVisibility = (e: React.MouseEvent, element: CanvasElement) => {
    e.stopPropagation();
    updateElement(element.id, { isVisible: !element.isVisible });
    saveToHistory(element.isVisible ? 'הסתרה' : 'הצגה');
  };

  // Toggle lock
  const handleToggleLock = (e: React.MouseEvent, element: CanvasElement) => {
    e.stopPropagation();
    updateElement(element.id, { isLocked: !element.isLocked });
    saveToHistory(element.isLocked ? 'ביטול נעילה' : 'נעילה');
  };

  // Delete element
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteElement(id);
    saveToHistory('מחיקה');
  };

  // Layer item component - Modern Design
  const LayerItem: React.FC<{ element: CanvasElement }> = ({ element }) => {
    const isSelected = selectedIds.includes(element.id);
    
    return (
      <div
        className={`
          relative flex items-center gap-2.5 px-3 py-2.5 cursor-pointer
          rounded-xl group transition-all duration-200
          ${isSelected 
            ? 'bg-gradient-to-r from-indigo-100 to-purple-100 border-2 border-indigo-300 shadow-sm' 
            : 'bg-white border-2 border-transparent hover:bg-gray-50 hover:border-gray-200'}
          ${!element.isVisible ? 'opacity-50' : ''}
          ${element.isLocked ? 'border-l-4 border-l-amber-400' : ''}
        `}
        onClick={(e) => handleSelect(element.id, e)}
      >
        {/* Type Icon with Background */}
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
          ${element.type === 'text' ? 'bg-blue-100 text-blue-600' :
            element.type === 'image' ? 'bg-green-100 text-green-600' :
            element.type === 'shape' ? 'bg-purple-100 text-purple-600' :
            'bg-amber-100 text-amber-600'}
        `}>
          {getTypeIcon(element.type)}
        </div>

        {/* Name */}
        <span className={`flex-1 text-sm truncate ${isSelected ? 'text-indigo-700 font-semibold' : 'text-gray-700'}`}>
          {element.name}
        </span>

        {/* Actions - Modern Hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-lg px-1 py-0.5">
          {/* Move Up */}
          <button
            className="p-1.5 hover:bg-indigo-100 rounded-lg text-gray-400 hover:text-indigo-600 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              bringForward(element.id);
              saveToHistory('העברה קדימה');
            }}
            title="העבר קדימה"
          >
            {icons.moveUp}
          </button>

          {/* Move Down */}
          <button
            className="p-1.5 hover:bg-indigo-100 rounded-lg text-gray-400 hover:text-indigo-600 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              sendBackward(element.id);
              saveToHistory('העברה אחורה');
            }}
            title="העבר אחורה"
          >
            {icons.moveDown}
          </button>

          {/* Delete */}
          <button
            className="p-1.5 hover:bg-red-100 rounded-lg text-gray-400 hover:text-red-600 transition-all"
            onClick={(e) => handleDelete(e, element.id)}
            title="מחק"
          >
            {icons.delete}
          </button>
        </div>

        {/* Visibility Toggle - Modern */}
        <button
          className={`p-1.5 rounded-lg transition-all ${
            element.isVisible 
              ? 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50' 
              : 'text-gray-300 bg-gray-100'
          }`}
          onClick={(e) => handleToggleVisibility(e, element)}
          title={element.isVisible ? 'הסתר' : 'הצג'}
        >
          {element.isVisible ? icons.visible : icons.hidden}
        </button>

        {/* Stretch to Canvas - Only for images */}
        {element.type === 'image' && (
          <button
            className="p-1.5 rounded-lg transition-all text-gray-300 hover:text-blue-500 hover:bg-blue-50"
            onClick={(e) => handleStretchToCanvas(e, element)}
            title="מתח לקצוות הקנבס"
          >
            {icons.stretch}
          </button>
        )}

        {/* Lock Toggle - Modern */}
        <button
          className={`p-1.5 rounded-lg transition-all ${
            element.isLocked 
              ? 'text-amber-500 bg-amber-50' 
              : 'text-gray-300 hover:text-amber-500 hover:bg-amber-50'
          }`}
          onClick={(e) => handleToggleLock(e, element)}
          title={element.isLocked ? 'בטל נעילה' : 'נעל'}
        >
          {element.isLocked ? icons.locked : icons.unlocked}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-gray-50">
      {/* Header - Modern */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
            {elements.length} אלמנטים
          </span>
        </div>
      </div>

      {/* Layer Actions - Modern Pill Buttons */}
      {selectedIds.length > 0 && (
        <div className="px-3 py-2.5 border-b border-gray-100 bg-indigo-50/50">
          <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm">
            <button
              className="flex-1 px-2 py-1.5 text-xs font-medium bg-white hover:bg-indigo-100 text-gray-600 hover:text-indigo-700 rounded-md transition-all"
              onClick={() => {
                selectedIds.forEach(id => bringToFront(id));
                saveToHistory('העברה לחזית');
              }}
              title="העבר לקדמת הבמה"
            >
              ⬆️ חזית
            </button>
            <button
              className="flex-1 px-2 py-1.5 text-xs font-medium bg-white hover:bg-indigo-100 text-gray-600 hover:text-indigo-700 rounded-md transition-all"
              onClick={() => {
                selectedIds.forEach(id => bringForward(id));
                saveToHistory('קדימה');
              }}
              title="העבר שכבה אחת קדימה"
            >
              ↑ קדימה
            </button>
            <button
              className="flex-1 px-2 py-1.5 text-xs font-medium bg-white hover:bg-indigo-100 text-gray-600 hover:text-indigo-700 rounded-md transition-all"
              onClick={() => {
                selectedIds.forEach(id => sendBackward(id));
                saveToHistory('אחורה');
              }}
              title="העבר שכבה אחת אחורה"
            >
              ↓ אחורה
            </button>
            <button
              className="flex-1 px-2 py-1.5 text-xs font-medium bg-white hover:bg-indigo-100 text-gray-600 hover:text-indigo-700 rounded-md transition-all"
              onClick={() => {
                selectedIds.forEach(id => sendToBack(id));
                saveToHistory('לרקע');
              }}
              title="העבר לאחרי הכל"
            >
              ⬇️ רקע
            </button>
          </div>
        </div>
      )}

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-2">
        {sortedElements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-3xl opacity-50">📑</span>
            </div>
            <p className="text-gray-400 text-sm mb-1">אין אלמנטים בקנבס</p>
            <p className="text-gray-300 text-xs">הוסף טקסט, תמונה או צורה</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sortedElements.map(element => (
              <LayerItem key={element.id} element={element} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
