// ==========================================
// Properties Panel - פאנל מאפיינים מעוצב
// ==========================================

import React, { useState, useEffect, useRef } from 'react';
import { useEditorStore } from '../store';
import { CanvasElement, TextElement, ShapeElement, ImageElement, HEBREW_FONTS, ENGLISH_FONTS } from '../types';

// Text Input Field with local state to prevent focus loss
interface TextInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  fontFamily?: string;
  direction?: 'rtl' | 'ltr';
  elementId: string;
}

const TextInputField: React.FC<TextInputFieldProps> = React.memo(({ value, onChange, onBlur, fontFamily, direction, elementId }) => {
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastElementIdRef = useRef(elementId);
  const isTypingRef = useRef(false);
  
  // Sync when element changes OR when value changes externally (not from our typing)
  useEffect(() => {
    if (elementId !== lastElementIdRef.current) {
      setLocalValue(value);
      lastElementIdRef.current = elementId;
    } else if (!isTypingRef.current) {
      // External change (e.g., from inline editing on canvas)
      setLocalValue(value);
    }
  }, [elementId, value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    isTypingRef.current = true;
    setLocalValue(newValue);
    onChange(newValue);
    // Reset typing flag after a short delay
    setTimeout(() => {
      isTypingRef.current = false;
    }, 100);
  };

  const handleBlur = () => {
    isTypingRef.current = false;
    onBlur();
  };

  return (
    <textarea
      ref={textareaRef}
      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm resize-y focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all overflow-auto"
      rows={5}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      dir={direction || 'auto'}
      style={{ 
        fontFamily: fontFamily,
        minHeight: '100px',
        maxHeight: '200px',
      }}
      placeholder="הקלד טקסט כאן..."
    />
  );
}, (prevProps, nextProps) => {
  // Re-render when element changes, font changes, or value changes from outside
  if (prevProps.elementId !== nextProps.elementId) return false;
  if (prevProps.fontFamily !== nextProps.fontFamily) return false;
  if (prevProps.direction !== nextProps.direction) return false;
  // Allow value updates to sync from inline editing
  if (prevProps.value !== nextProps.value) return false;
  return true;
});

// Collapsible Section Component
const CollapsibleSection: React.FC<{ 
  title: string; 
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode 
}> = ({ title, icon, defaultOpen = true, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="mb-2 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-400">{icon}</span>}
          <span className="text-sm font-semibold text-gray-700">{title}</span>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-1">
          {children}
        </div>
      )}
    </div>
  );
};

export const PropertiesPanel: React.FC = () => {
  const {
    elements,
    selectedIds,
    updateElement,
    saveToHistory,
    canvasWidth,
    canvasHeight,
    setCanvasSize,
    backgroundColor,
    backgroundType,
    gradientColors,
    setBackgroundColor,
    setBackgroundType,
    setGradientColors,
  } = useEditorStore();

  // Get selected element (only single selection for now)
  const selectedElement = selectedIds.length === 1
    ? elements.find(e => e.id === selectedIds[0])
    : null;

  // Section component - defined early so it can be used in canvas properties
  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{title}</h3>
      {children}
    </div>
  );

  // Input row component
  const InputRow: React.FC<{
    label: string;
    children: React.ReactNode;
  }> = ({ label, children }) => (
    <div className="flex items-center justify-between mb-3">
      <label className="text-sm text-gray-600">{label}</label>
      {children}
    </div>
  );

  // Color input component - Modern Design
  const ColorInput: React.FC<{
    value: string;
    onChange: (value: string) => void;
  }> = ({ value, onChange }) => (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="color"
          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200 shadow-sm hover:border-indigo-400 transition-colors"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ padding: '2px' }}
        />
      </div>
      <input
        type="text"
        className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-left uppercase bg-gray-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );

  // Canvas properties when nothing selected
  if (!selectedElement) {
    return (
      <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-white to-gray-50">
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-gray-800">הגדרות קנבס</h2>
              <p className="text-xs text-gray-400">עריכת הרקע והגודל</p>
            </div>
          </div>
        </div>

        {/* Canvas Size - Card Style */}
        <CollapsibleSection 
          title="גודל קנבס" 
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">רוחב</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                value={canvasWidth}
                onChange={(e) => setCanvasSize(parseInt(e.target.value) || 600, canvasHeight)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">גובה</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                value={canvasHeight}
                onChange={(e) => setCanvasSize(canvasWidth, parseInt(e.target.value) || 400)}
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Background Type - Card Style */}
        <CollapsibleSection 
          title="רקע" 
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>}
        >
          {/* Type Toggle */}
          <div className="flex gap-1.5 mb-4 bg-gray-100 rounded-xl p-1">
            {(['none', 'solid', 'gradient'] as const).map(type => (
              <button
                key={type}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                  backgroundType === type 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setBackgroundType(type)}
              >
                {type === 'none' ? '🚫 ללא' : type === 'solid' ? '🎨 צבע' : '🌈 גרדיאנט'}
              </button>
            ))}
          </div>

          {/* Solid Color */}
          {backgroundType === 'solid' && (
            <div className="space-y-3">
              <InputRow label="צבע">
                <ColorInput
                  value={backgroundColor}
                  onChange={setBackgroundColor}
                />
              </InputRow>
            </div>
          )}

          {/* Gradient */}
          {backgroundType === 'gradient' && (
            <div className="space-y-3">
              <InputRow label="צבע התחלה">
                <ColorInput
                  value={gradientColors.start}
                  onChange={(start) => setGradientColors({ start })}
                />
              </InputRow>
              <InputRow label="צבע סיום">
                <ColorInput
                  value={gradientColors.end}
                  onChange={(end) => setGradientColors({ end })}
                />
              </InputRow>
              <div>
                <label className="text-sm text-gray-600 block mb-2">זווית: {gradientColors.angle}°</label>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  min={0}
                  max={360}
                  value={gradientColors.angle}
                  onChange={(e) => setGradientColors({ angle: parseInt(e.target.value) })}
                />
              </div>
            </div>
          )}
        </CollapsibleSection>

        {/* Quick Colors - Card Style */}
        <CollapsibleSection 
          title="צבעים מהירים" 
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>}
          defaultOpen={false}
        >
          <div className="grid grid-cols-6 gap-2">
            {[
              '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0',
              '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24',
              '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399',
              '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa',
              '#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa',
              '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6',
            ].map(color => (
              <button
                key={color}
                className="w-9 h-9 rounded-lg border-2 border-gray-200 hover:scale-110 hover:border-indigo-400 transition-all shadow-sm"
                style={{ backgroundColor: color }}
                onClick={() => {
                  if (backgroundType === 'solid') {
                    setBackgroundColor(color);
                  } else {
                    setGradientColors({ start: color });
                  }
                }}
                title={color}
              />
            ))}
          </div>
        </CollapsibleSection>

        {/* Empty State */}
        <div className="text-center py-8 mt-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="text-4xl mb-3">👆</div>
          <p className="text-gray-500 text-sm">בחר אלמנט לעריכת המאפיינים שלו</p>
        </div>
      </div>
    );
  }

  // Update handler with history
  const handleUpdate = (updates: Partial<CanvasElement>) => {
    updateElement(selectedElement.id, updates);
  };

  const handleUpdateWithHistory = (updates: Partial<CanvasElement>, action: string) => {
    updateElement(selectedElement.id, updates);
    saveToHistory(action);
  };

  // Number input component
  const NumberInput: React.FC<{
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
  }> = ({ value, onChange, min, max, step = 1, suffix }) => (
    <div className="flex items-center">
      <input
        type="number"
        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
        value={Math.round(value * 100) / 100}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        onBlur={() => saveToHistory('שינוי מאפיין')}
      />
      {suffix && <span className="text-xs text-gray-400 mr-1">{suffix}</span>}
    </div>
  );

  // Slider input component
  const SliderInput: React.FC<{
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
  }> = ({ value, onChange, min, max, step = 1 }) => (
    <div className="flex items-center gap-2 flex-1">
      <input
        type="range"
        className="flex-1 accent-indigo-600"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onMouseUp={() => saveToHistory('שינוי מאפיין')}
      />
      <span className="text-xs text-gray-500 w-8 text-left">
        {Math.round(value * 100) / 100}
      </span>
    </div>
  );

  // Position & Size (common to all)
  const renderPositionSize = () => (
    <Section title="מיקום וגודל">
      <div className="grid grid-cols-2 gap-2">
        <InputRow label="X">
          <NumberInput
            value={selectedElement.x}
            onChange={(x) => handleUpdate({ x })}
          />
        </InputRow>
        <InputRow label="Y">
          <NumberInput
            value={selectedElement.y}
            onChange={(y) => handleUpdate({ y })}
          />
        </InputRow>
        <InputRow label="רוחב">
          <NumberInput
            value={selectedElement.width}
            onChange={(width) => handleUpdate({ width })}
            min={1}
          />
        </InputRow>
        <InputRow label="גובה">
          <NumberInput
            value={selectedElement.height}
            onChange={(height) => handleUpdate({ height })}
            min={1}
          />
        </InputRow>
      </div>
      <InputRow label="סיבוב">
        <NumberInput
          value={selectedElement.rotation}
          onChange={(rotation) => handleUpdate({ rotation })}
          min={-360}
          max={360}
          suffix="°"
        />
      </InputRow>
      <InputRow label="שקיפות">
        <SliderInput
          value={selectedElement.opacity}
          onChange={(opacity) => handleUpdate({ opacity })}
          min={0}
          max={1}
          step={0.01}
        />
      </InputRow>
    </Section>
  );

  // Text properties - Simplified and Clean Design
  const renderTextProperties = (element: TextElement) => (
    <>
      {/* Text Content */}
      <div className="mb-4">
        <label className="text-xs font-medium text-gray-500 mb-2 block">טקסט</label>
        <TextInputField
          elementId={element.id}
          value={element.text}
          onChange={(text: string) => handleUpdate({ text } as Partial<TextElement>)}
          onBlur={() => saveToHistory('שינוי טקסט')}
          fontFamily={element.fontFamily}
          direction={element.direction}
        />
      </div>

      {/* Font Selection - Clean Card */}
      <div className="mb-4 p-3 bg-gray-50 rounded-xl">
        <label className="text-xs font-medium text-gray-500 mb-2 block">גופן</label>
        <select
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
          value={element.fontFamily}
          onChange={(e) => handleUpdateWithHistory(
            { fontFamily: e.target.value } as Partial<TextElement>,
            'שינוי גופן'
          )}
          style={{ fontFamily: element.fontFamily }}
        >
          <optgroup label="🇮🇱 עברית">
            {HEBREW_FONTS.map(font => (
              <option key={font.family} value={font.family} style={{ fontFamily: font.family }}>
                {font.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="�� English">
            {ENGLISH_FONTS.map(font => (
              <option key={font.family} value={font.family} style={{ fontFamily: font.family }}>
                {font.name}
              </option>
            ))}
          </optgroup>
        </select>
        
        {/* Size & Weight Row */}
        <div className="flex gap-2 mt-3">
          <div className="flex-1">
            <label className="text-xs text-gray-400 mb-1 block">גודל</label>
            <input
              type="number"
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center"
              value={element.fontSize}
              min={8}
              max={200}
              onChange={(e) => handleUpdate({ fontSize: parseInt(e.target.value) || 24 } as Partial<TextElement>)}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-400 mb-1 block">משקל</label>
            <select
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm"
              value={element.fontWeight}
              onChange={(e) => handleUpdateWithHistory(
                { fontWeight: parseInt(e.target.value) } as Partial<TextElement>,
                'שינוי משקל'
              )}
            >
              <option value="400">רגיל</option>
              <option value="700">עבה</option>
            </select>
          </div>
        </div>
        
        {/* Style Toggles */}
        <div className="flex gap-2 mt-3">
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              element.fontStyle === 'italic' 
                ? 'bg-indigo-100 text-indigo-600 border border-indigo-200' 
                : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-200'
            }`}
            onClick={() => handleUpdateWithHistory(
              { fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' } as Partial<TextElement>,
              'נטוי'
            )}
          >
            <i>נטוי</i>
          </button>
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              element.textDecoration === 'underline' 
                ? 'bg-indigo-100 text-indigo-600 border border-indigo-200' 
                : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-200'
            }`}
            onClick={() => handleUpdateWithHistory(
              { textDecoration: element.textDecoration === 'underline' ? 'none' : 'underline' } as Partial<TextElement>,
              'קו תחתון'
            )}
          >
            <u>קו תחתון</u>
          </button>
        </div>
        
        {/* Alignment */}
        <div className="mt-3">
          <label className="text-xs text-gray-400 mb-1 block">יישור</label>
          <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
            {[
              { value: 'right', icon: '→', label: 'ימין' },
              { value: 'center', icon: '↔', label: 'מרכז' },
              { value: 'left', icon: '←', label: 'שמאל' },
            ].map(({ value, icon }) => (
              <button
                key={value}
                className={`flex-1 py-1.5 rounded-md text-sm transition-all ${
                  element.textAlign === value 
                    ? 'bg-indigo-100 text-indigo-600' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
                onClick={() => handleUpdateWithHistory(
                  { textAlign: value } as Partial<TextElement>,
                  'יישור'
                )}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Color */}
      <div className="mb-4 p-3 bg-gray-50 rounded-xl">
        <label className="text-xs font-medium text-gray-500 mb-2 block">צבע טקסט</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
            value={element.fill}
            onChange={(e) => handleUpdate({ fill: e.target.value } as Partial<TextElement>)}
          />
          <input
            type="text"
            className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm uppercase"
            value={element.fill}
            onChange={(e) => handleUpdate({ fill: e.target.value } as Partial<TextElement>)}
          />
        </div>
      </div>

      {/* Effects - Stroke & Shadow */}
      <div className="mb-4 p-3 bg-gray-50 rounded-xl">
        <label className="text-xs font-medium text-gray-500 mb-3 block">אפקטים</label>
        
        {/* Stroke Toggle */}
        <div 
          className={`mb-2 p-3 rounded-lg cursor-pointer transition-all ${
            element.strokeWidth && element.strokeWidth > 0 
              ? 'bg-indigo-50 border border-indigo-200' 
              : 'bg-white border border-gray-200 hover:border-indigo-200'
          }`}
          onClick={() => handleUpdate({
            strokeWidth: element.strokeWidth && element.strokeWidth > 0 ? 0 : 2,
            stroke: element.stroke || '#000000'
          } as Partial<TextElement>)}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">קו מתאר</span>
            <div className={`w-10 h-6 rounded-full transition-all ${
              element.strokeWidth && element.strokeWidth > 0 ? 'bg-indigo-500' : 'bg-gray-300'
            } relative`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${
                element.strokeWidth && element.strokeWidth > 0 ? 'right-1' : 'left-1'
              }`} />
            </div>
          </div>
        </div>
        
        {/* Stroke Options */}
        {element.strokeWidth && element.strokeWidth > 0 && (
          <div className="mb-3 p-2 bg-white rounded-lg border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="color"
                className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                value={element.stroke || '#000000'}
                onChange={(e) => handleUpdate({ stroke: e.target.value } as Partial<TextElement>)}
              />
              <input
                type="number"
                className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center"
                value={element.strokeWidth || 0}
                min={0.5}
                max={10}
                step={0.5}
                onChange={(e) => handleUpdate({ strokeWidth: parseFloat(e.target.value) || 0 } as Partial<TextElement>)}
              />
              <span className="text-xs text-gray-400">עובי</span>
            </div>
          </div>
        )}

        {/* Shadow Toggle */}
        <div 
          className={`p-3 rounded-lg cursor-pointer transition-all ${
            element.shadow?.enabled 
              ? 'bg-indigo-50 border border-indigo-200' 
              : 'bg-white border border-gray-200 hover:border-indigo-200'
          }`}
          onClick={() => handleUpdate({
            shadow: {
              enabled: !element.shadow?.enabled,
              color: element.shadow?.color || '#000000',
              blur: element.shadow?.blur || 4,
              offsetX: element.shadow?.offsetX || 2,
              offsetY: element.shadow?.offsetY || 2,
            }
          } as Partial<TextElement>)}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">צל</span>
            <div className={`w-10 h-6 rounded-full transition-all ${
              element.shadow?.enabled ? 'bg-indigo-500' : 'bg-gray-300'
            } relative`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${
                element.shadow?.enabled ? 'right-1' : 'left-1'
              }`} />
            </div>
          </div>
        </div>
        
        {/* Shadow Options */}
        {element.shadow?.enabled && (
          <div className="mt-2 p-3 bg-white rounded-lg border border-gray-100 space-y-3">
            {/* Shadow Presets */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block">סגנון צל</label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { name: 'רך', blur: 8, offset: 2 },
                  { name: 'בינוני', blur: 4, offset: 3 },
                  { name: 'חד', blur: 1, offset: 2 },
                  { name: 'עבה', blur: 15, offset: 5 },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    className={`px-2 py-1.5 text-xs rounded transition-all ${
                      element.shadow?.blur === preset.blur
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => handleUpdate({
                      shadow: { 
                        ...element.shadow, 
                        blur: preset.blur, 
                        offsetX: preset.offset, 
                        offsetY: preset.offset 
                      }
                    } as Partial<TextElement>)}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Shadow Color */}
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                value={element.shadow.color}
                onChange={(e) => handleUpdate({
                  shadow: { ...element.shadow, color: e.target.value }
                } as Partial<TextElement>)}
              />
              <span className="text-xs text-gray-500">צבע צל</span>
            </div>

            {/* Shadow Blur Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-500">עובי/טשטוש</label>
                <span className="text-xs text-gray-400">{element.shadow.blur}px</span>
              </div>
              <input
                type="range"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                min={0}
                max={30}
                value={element.shadow.blur}
                onChange={(e) => handleUpdate({
                  shadow: { ...element.shadow, blur: parseInt(e.target.value) }
                } as Partial<TextElement>)}
              />
            </div>

            {/* Shadow Distance Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-500">מרחק</label>
                <span className="text-xs text-gray-400">{element.shadow.offsetX}px</span>
              </div>
              <input
                type="range"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                min={0}
                max={20}
                value={element.shadow.offsetX}
                onChange={(e) => {
                  const offset = parseInt(e.target.value);
                  handleUpdate({
                    shadow: { ...element.shadow, offsetX: offset, offsetY: offset }
                  } as Partial<TextElement>);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Opacity */}
      <div className="mb-4 p-3 bg-gray-50 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-500">שקיפות</label>
          <span className="text-xs text-gray-400">{Math.round((element.opacity || 1) * 100)}%</span>
        </div>
        <input
          type="range"
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          min={0}
          max={1}
          step={0.01}
          value={element.opacity || 1}
          onChange={(e) => handleUpdate({ opacity: parseFloat(e.target.value) } as Partial<TextElement>)}
        />
      </div>

      {/* Position & Rotation - Compact */}
      <div className="mb-4 p-3 bg-gray-50 rounded-xl">
        <label className="text-xs font-medium text-gray-500 mb-2 block">מיקום וגודל</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">X</label>
            <input
              type="number"
              className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-center"
              value={Math.round(element.x)}
              onChange={(e) => handleUpdate({ x: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Y</label>
            <input
              type="number"
              className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-center"
              value={Math.round(element.y)}
              onChange={(e) => handleUpdate({ y: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">רוחב</label>
            <input
              type="number"
              className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-center"
              value={Math.round(element.width || 100)}
              onChange={(e) => handleUpdate({ width: parseInt(e.target.value) || 100 })}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">סיבוב</label>
            <input
              type="number"
              className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-center"
              value={Math.round(element.rotation || 0)}
              min={-360}
              max={360}
              onChange={(e) => handleUpdate({ rotation: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>
      </div>
    </>
  );

  // Shape properties
  const renderShapeProperties = (element: ShapeElement) => (
    <>
      <Section title="צורה">
        <InputRow label="סוג">
          <select
            className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
            value={element.shapeType}
            onChange={(e) => handleUpdateWithHistory(
              { shapeType: e.target.value as ShapeElement['shapeType'] } as Partial<ShapeElement>,
              'שינוי צורה'
            )}
          >
            <option value="rectangle">מלבן</option>
            <option value="circle">עיגול</option>
            <option value="triangle">משולש</option>
            <option value="star">כוכב</option>
            <option value="polygon">מצולע</option>
            <option value="line">קו</option>
          </select>
        </InputRow>

        {element.shapeType === 'rectangle' && (
          <InputRow label="פינות מעוגלות">
            <NumberInput
              value={element.cornerRadius || 0}
              onChange={(cornerRadius) => handleUpdate({ cornerRadius } as Partial<ShapeElement>)}
              min={0}
              max={100}
            />
          </InputRow>
        )}

        {element.shapeType === 'polygon' && (
          <InputRow label="צלעות">
            <NumberInput
              value={element.sides || 6}
              onChange={(sides) => handleUpdate({ sides } as Partial<ShapeElement>)}
              min={3}
              max={12}
            />
          </InputRow>
        )}
      </Section>

      <Section title="מילוי וקו">
        <InputRow label="צבע מילוי">
          <ColorInput
            value={element.fill}
            onChange={(fill) => handleUpdate({ fill } as Partial<ShapeElement>)}
          />
        </InputRow>
        <InputRow label="צבע קו">
          <ColorInput
            value={element.stroke}
            onChange={(stroke) => handleUpdate({ stroke } as Partial<ShapeElement>)}
          />
        </InputRow>
        <InputRow label="עובי קו">
          <NumberInput
            value={element.strokeWidth}
            onChange={(strokeWidth) => handleUpdate({ strokeWidth } as Partial<ShapeElement>)}
            min={0}
            max={20}
          />
        </InputRow>
      </Section>
    </>
  );

  // Image properties
  const renderImageProperties = (element: ImageElement) => (
    <>
      <Section title="תמונה">
        <InputRow label="התאמה">
          <select
            className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
            value={element.objectFit}
            onChange={(e) => handleUpdateWithHistory(
              { objectFit: e.target.value as ImageElement['objectFit'] } as Partial<ImageElement>,
              'שינוי התאמה'
            )}
          >
            <option value="cover">מילוי (חיתוך)</option>
            <option value="contain">התאמה</option>
            <option value="fill">מתיחה</option>
          </select>
        </InputRow>

        <InputRow label="פינות מעוגלות">
          <NumberInput
            value={element.borderRadius || 0}
            onChange={(borderRadius) => handleUpdate({ borderRadius } as Partial<ImageElement>)}
            min={0}
            max={200}
          />
        </InputRow>
      </Section>

      <Section title="מסגרת">
        <InputRow label="עובי">
          <NumberInput
            value={element.borderWidth || 0}
            onChange={(borderWidth) => handleUpdate({ borderWidth } as Partial<ImageElement>)}
            min={0}
            max={20}
          />
        </InputRow>
        {element.borderWidth && element.borderWidth > 0 && (
          <InputRow label="צבע">
            <ColorInput
              value={element.borderColor || '#000000'}
              onChange={(borderColor) => handleUpdate({ borderColor } as Partial<ImageElement>)}
            />
          </InputRow>
        )}
      </Section>

      <Section title="פילטרים">
        {/* Filter Presets */}
        <div className="mb-3">
          <label className="text-sm text-gray-600 block mb-2">פריסטים מהירים</label>
          <div className="grid grid-cols-4 gap-1">
            {[
              { name: 'מקורי', filters: { brightness: 0, contrast: 0, saturation: 0, blur: 0, grayscale: false } },
              { name: 'בהיר', filters: { brightness: 20, contrast: 10, saturation: 0, blur: 0, grayscale: false } },
              { name: 'וינטג׳', filters: { brightness: 5, contrast: -10, saturation: -30, blur: 0, grayscale: false } },
              { name: 'חם', filters: { brightness: 10, contrast: 10, saturation: 20, blur: 0, grayscale: false } },
              { name: 'קר', filters: { brightness: 0, contrast: 10, saturation: -20, blur: 0, grayscale: false } },
              { name: 'דרמטי', filters: { brightness: -10, contrast: 30, saturation: 10, blur: 0, grayscale: false } },
              { name: 'רך', filters: { brightness: 10, contrast: -10, saturation: 0, blur: 2, grayscale: false } },
              { name: 'שחור-לבן', filters: { brightness: 0, contrast: 10, saturation: 0, blur: 0, grayscale: true } },
            ].map((preset) => (
              <button
                key={preset.name}
                className={`
                  px-2 py-1 text-xs rounded border transition-colors
                  ${JSON.stringify(element.filters) === JSON.stringify(preset.filters)
                    ? 'bg-indigo-100 border-indigo-400 text-indigo-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }
                `}
                onClick={() => handleUpdateWithHistory(
                  { filters: preset.filters } as Partial<ImageElement>,
                  `פילטר: ${preset.name}`
                )}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Grayscale Toggle */}
        <InputRow label="שחור-לבן">
          <button
            className={`
              px-3 py-1 text-xs rounded transition-colors
              ${element.filters?.grayscale
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }
            `}
            onClick={() => handleUpdate({
              filters: { ...element.filters, grayscale: !element.filters?.grayscale }
            } as Partial<ImageElement>)}
          >
            {element.filters?.grayscale ? 'פעיל' : 'כבוי'}
          </button>
        </InputRow>

        <InputRow label="בהירות">
          <SliderInput
            value={element.filters?.brightness || 0}
            onChange={(brightness) => handleUpdate({
              filters: { ...element.filters, brightness }
            } as Partial<ImageElement>)}
            min={-100}
            max={100}
          />
        </InputRow>
        <InputRow label="ניגודיות">
          <SliderInput
            value={element.filters?.contrast || 0}
            onChange={(contrast) => handleUpdate({
              filters: { ...element.filters, contrast }
            } as Partial<ImageElement>)}
            min={-100}
            max={100}
          />
        </InputRow>
        <InputRow label="רוויה">
          <SliderInput
            value={element.filters?.saturation || 0}
            onChange={(saturation) => handleUpdate({
              filters: { ...element.filters, saturation }
            } as Partial<ImageElement>)}
            min={-100}
            max={100}
          />
        </InputRow>
        <InputRow label="טשטוש">
          <SliderInput
            value={element.filters?.blur || 0}
            onChange={(blur) => handleUpdate({
              filters: { ...element.filters, blur }
            } as Partial<ImageElement>)}
            min={0}
            max={20}
          />
        </InputRow>

        {/* Reset Filters Button */}
        <button
          className="w-full mt-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          onClick={() => handleUpdateWithHistory(
            { filters: { brightness: 0, contrast: 0, saturation: 0, blur: 0, grayscale: false } } as Partial<ImageElement>,
            'איפוס פילטרים'
          )}
        >
          איפוס פילטרים
        </button>
      </Section>
    </>
  );

  return (
    <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-white to-gray-50">
      {/* Element Header - Modern Card */}
      <div className="mb-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            selectedElement.type === 'text' ? 'bg-gradient-to-br from-blue-500 to-indigo-500' :
            selectedElement.type === 'image' ? 'bg-gradient-to-br from-green-500 to-emerald-500' :
            selectedElement.type === 'shape' ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
            'bg-gradient-to-br from-amber-500 to-orange-500'
          }`}>
            <span className="text-xl">
              {selectedElement.type === 'text' ? '📝' :
               selectedElement.type === 'image' ? '🖼️' :
               selectedElement.type === 'shape' ? '⬟' : '🖼️'}
            </span>
          </div>
          <div className="flex-1">
            <input
              type="text"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-medium text-right focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              value={selectedElement.name}
              onChange={(e) => handleUpdate({ name: e.target.value })}
              onBlur={() => saveToHistory('שינוי שם')}
            />
            <p className="text-xs text-gray-400 mt-1">
              {selectedElement.type === 'text' ? '🔤 טקסט' : 
               selectedElement.type === 'image' ? '🖼️ תמונה' : 
               selectedElement.type === 'shape' ? '⬟ צורה' : '🖼️ מסגרת'}
            </p>
          </div>
        </div>
      </div>

      {/* Position & Size */}
      {renderPositionSize()}

      {/* Type-specific properties */}
      {selectedElement.type === 'text' && renderTextProperties(selectedElement as TextElement)}
      {selectedElement.type === 'shape' && renderShapeProperties(selectedElement as ShapeElement)}
      {selectedElement.type === 'image' && renderImageProperties(selectedElement as ImageElement)}
    </div>
  );
};
