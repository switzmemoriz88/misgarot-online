// ==========================================
// ElementActions Component - כפתורי פעולה מסביב לאלמנט נבחר
// ==========================================

import React from 'react';
import { useEditorStore } from '../store';

interface ElementActionsProps {
  elementId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zoom: number;
}

export const ElementActions: React.FC<ElementActionsProps> = ({
  elementId,
  position,
  size,
  zoom,
}) => {
  const { 
    elements, 
    deleteElement, 
    updateElement,
    selectElement,
    addElement,
  } = useEditorStore();

  const element = elements.find(el => el.id === elementId);
  
  if (!element || element.isLocked) return null;

  // מחיקת אלמנט
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElement(elementId);
  };

  // שכפול אלמנט
  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const newElement = {
      ...element,
      id: `${element.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x: element.x + 50,
      y: element.y + 50,
      isLocked: false,
    };
    
    addElement(newElement);
    selectElement(newElement.id);
  };

  // סיבוב ב-90 מעלות
  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentRotation = element.rotation || 0;
    updateElement(elementId, { rotation: (currentRotation + 90) % 360 });
  };

  const currentZoom = zoom || 0.3;
  const scaledX = position.x * currentZoom;
  const scaledY = position.y * currentZoom;
  const scaledWidth = size.width * currentZoom;
  const scaledHeight = size.height * currentZoom;

  const buttonClass = "w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-50 rounded-lg shadow-lg border border-gray-200 text-gray-600 hover:text-indigo-600 transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer";
  const deleteButtonClass = "w-8 h-8 flex items-center justify-center bg-white hover:bg-red-50 rounded-lg shadow-lg border border-gray-200 text-gray-600 hover:text-red-500 transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer";

  return (
    <>
      {/* מחיקה - פינה ימנית עליונה */}
      <div
        className="absolute z-50 pointer-events-auto"
        style={{
          left: scaledX + scaledWidth + 8,
          top: scaledY - 12,
        }}
      >
        <button
          onClick={handleDelete}
          className={deleteButtonClass}
          title="מחיקה (Delete)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* שכפול - פינה שמאלית עליונה */}
      <div
        className="absolute z-50 pointer-events-auto"
        style={{
          left: scaledX - 40,
          top: scaledY - 12,
        }}
      >
        <button
          onClick={handleDuplicate}
          className={buttonClass}
          title="שכפול (Ctrl+D)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {/* סיבוב - פינה שמאלית תחתונה */}
      <div
        className="absolute z-50 pointer-events-auto"
        style={{
          left: scaledX - 40,
          top: scaledY + scaledHeight - 20,
        }}
      >
        <button
          onClick={handleRotate}
          className={buttonClass}
          title="סיבוב 90°"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* שינוי גודל - פינה ימנית תחתונה (כבר קיים ב-Transformer, רק אייקון ויזואלי) */}
      <div
        className="absolute z-50 pointer-events-none"
        style={{
          left: scaledX + scaledWidth + 8,
          top: scaledY + scaledHeight - 20,
        }}
      >
        <div
          className="w-8 h-8 flex items-center justify-center bg-white/80 rounded-lg shadow-sm border border-gray-100 text-gray-400"
          title="גרור לשינוי גודל"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </div>
      </div>
    </>
  );
};

export default ElementActions;
