// ==========================================
// Templates Panel - בוחר תבניות
// ==========================================

import React, { useState } from 'react';
import { useEditorStore } from '../store';
import { 
  TEMPLATE_CATEGORIES, 
  TemplateCategory,
  Template,
  getTemplatesByCategory 
} from '../templates';
import { useCustomTemplates, CustomTemplate } from '../hooks/useCustomTemplates';

interface TemplatesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'custom'>('blank');
  const { setCanvasSize, clearCanvas, setBackgroundColor, setBackgroundType, setGradientColors } = useEditorStore();
  const { templates: customTemplates, deleteTemplate } = useCustomTemplates();

  const filteredTemplates = selectedCategory === 'custom' ? [] : getTemplatesByCategory(selectedCategory);

  const handleSelectTemplate = (template: Template) => {
    // Clear existing elements
    clearCanvas();
    
    // Set canvas size
    setCanvasSize(template.canvasWidth, template.canvasHeight);
    
    // Add template elements
    const { addElement, saveToHistory } = useEditorStore.getState();
    
    // Clone elements with new IDs
    template.elements.forEach((element) => {
      const newId = `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      addElement({
        ...element,
        id: newId,
      });
    });

    saveToHistory(`טעינת תבנית: ${template.nameHe}`);
    onClose();
  };

  const handleSelectCustomTemplate = (template: CustomTemplate) => {
    // Clear existing elements
    clearCanvas();
    
    // Set canvas size
    setCanvasSize(template.canvasWidth, template.canvasHeight);
    
    // Set background
    if (template.backgroundColor) setBackgroundColor(template.backgroundColor);
    if (template.backgroundType) setBackgroundType(template.backgroundType);
    if (template.gradientColors) setGradientColors(template.gradientColors);
    
    // Add template elements
    const { addElement, saveToHistory } = useEditorStore.getState();
    
    // Clone elements with new IDs
    template.elements.forEach((element) => {
      const newId = `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      addElement({
        ...element,
        id: newId,
      });
    });

    saveToHistory(`טעינת תבנית: ${template.name}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-[900px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">בחר תבנית</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Categories Sidebar */}
          <div className="w-48 border-l border-gray-200 p-4 overflow-y-auto">
            <div className="space-y-1">
              {/* Custom Templates Category */}
              {customTemplates.length > 0 && (
                <>
                  <button
                    onClick={() => setSelectedCategory('custom')}
                    className={`
                      w-full text-right px-3 py-2 rounded-lg transition-colors flex items-center gap-2
                      ${selectedCategory === 'custom' 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'hover:bg-gray-100 text-gray-600'}
                    `}
                  >
                    <span>⭐</span>
                    <span>התבניות שלי ({customTemplates.length})</span>
                  </button>
                  <div className="border-b border-gray-200 my-2" />
                </>
              )}

              {TEMPLATE_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`
                    w-full text-right px-3 py-2 rounded-lg transition-colors flex items-center gap-2
                    ${selectedCategory === category.id 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'hover:bg-gray-100 text-gray-600'}
                  `}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Custom Templates */}
            {selectedCategory === 'custom' && (
              <div className="grid grid-cols-3 gap-4">
                {customTemplates.map((template) => (
                  <CustomTemplateCard
                    key={template.id}
                    template={template}
                    onClick={() => handleSelectCustomTemplate(template)}
                    onDelete={() => deleteTemplate(template.id)}
                  />
                ))}
              </div>
            )}

            {/* Built-in Templates */}
            {selectedCategory !== 'custom' && (
              <div className="grid grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onClick={() => handleSelectTemplate(template)}
                  />
                ))}
              </div>
            )}

            {selectedCategory !== 'custom' && filteredTemplates.length === 0 && (
              <div className="text-center text-gray-400 py-12">
                אין תבניות בקטגוריה זו
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Template Card Component
const TemplateCard: React.FC<{
  template: Template;
  onClick: () => void;
}> = ({ template, onClick }) => {
  // Generate preview - simple representation of template
  const aspectRatio = template.canvasHeight / template.canvasWidth;
  
  return (
    <button
      onClick={onClick}
      className="group relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all text-right"
    >
      {/* Preview Area */}
      <div 
        className="relative bg-white"
        style={{ paddingBottom: `${aspectRatio * 100}%` }}
      >
        <div className="absolute inset-2 border border-gray-200 rounded flex items-center justify-center">
          {/* Simple preview rendering */}
          <TemplatePreview template={template} />
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-gray-800 text-sm">{template.nameHe}</h3>
        <p className="text-xs text-gray-500 mt-1">{template.description}</p>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors flex items-center justify-center">
        <span className="opacity-0 group-hover:opacity-100 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-opacity">
          השתמש בתבנית
        </span>
      </div>
    </button>
  );
};

// Custom Template Card Component
const CustomTemplateCard: React.FC<{
  template: CustomTemplate;
  onClick: () => void;
  onDelete: () => void;
}> = ({ template, onClick, onDelete }) => {
  const aspectRatio = template.canvasHeight / template.canvasWidth;
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`האם למחוק את התבנית "${template.name}"?`)) {
      onDelete();
    }
  };
  
  return (
    <div className="group relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all text-right">
      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className="absolute top-2 left-2 z-10 p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        title="מחק תבנית"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      {/* Preview Area */}
      <button onClick={onClick} className="w-full text-right">
        <div 
          className="relative"
          style={{ 
            paddingBottom: `${aspectRatio * 100}%`,
            backgroundColor: template.backgroundColor || '#ffffff'
          }}
        >
          <div className="absolute inset-2 border border-gray-200 rounded flex items-center justify-center bg-white/80">
            <span className="text-gray-400 text-sm">{template.elements.length} אלמנטים</span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-medium text-gray-800 text-sm">{template.name}</h3>
          {template.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {new Date(template.createdAt).toLocaleDateString('he-IL')}
          </p>
        </div>
      </button>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors flex items-center justify-center pointer-events-none">
        <span className="opacity-0 group-hover:opacity-100 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-opacity">
          השתמש בתבנית
        </span>
      </div>
    </div>
  );
};

// Simple Template Preview
const TemplatePreview: React.FC<{ template: Template }> = ({ template }) => {
  const scale = 0.3; // Scale down for preview
  
  return (
    <div 
      className="relative overflow-hidden"
      style={{
        width: template.canvasWidth * scale,
        height: template.canvasHeight * scale,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      {template.elements.map((element) => {
        const style: React.CSSProperties = {
          position: 'absolute',
          left: element.x * scale,
          top: element.y * scale,
          width: element.width * scale,
          height: element.height * scale,
          opacity: element.opacity,
        };

        if (element.type === 'shape') {
          return (
            <div
              key={element.id}
              style={{
                ...style,
                backgroundColor: element.fill,
                border: element.strokeWidth ? `${element.strokeWidth * scale}px solid ${element.stroke}` : undefined,
                borderRadius: element.cornerRadius ? element.cornerRadius * scale : undefined,
              }}
            />
          );
        }

        if (element.type === 'text') {
          return (
            <div
              key={element.id}
              style={{
                ...style,
                fontSize: element.fontSize * scale * 0.8,
                color: element.fill,
                fontFamily: element.fontFamily,
                textAlign: element.textAlign,
                display: 'flex',
                alignItems: 'center',
                justifyContent: element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {element.text}
            </div>
          );
        }

        if (element.type === 'image') {
          return (
            <div
              key={element.id}
              style={{
                ...style,
                backgroundColor: '#f3f4f6',
                border: '1px dashed #d1d5db',
                borderRadius: element.borderRadius ? element.borderRadius * scale : undefined,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

export default TemplatesPanel;
