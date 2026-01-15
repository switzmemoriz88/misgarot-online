// ==========================================
// Toolbar Component - סרגל כלים
// ==========================================

import React, { useRef, useState, useEffect } from 'react';
import { useEditorStore } from '../store';
import { EditorTool, DEFAULT_SHAPE_ELEMENT, ShapeType } from '../types';
import { processUpload, validateFile } from '@/utils/upload.utils';
import { ELEMENT_TYPES, ElementTypeKey } from '@/config/app.config';
import { AddTextModal } from './AddTextModal';

// Icons - using inline SVG for simplicity
const icons = {
  select: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="M13 13l6 6" />
    </svg>
  ),
  text: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7V4h16v3" />
      <path d="M9 20h6" />
      <path d="M12 4v16" />
    </svg>
  ),
  rectangle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  circle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  triangle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 22h20L12 2z" />
    </svg>
  ),
  line: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="19" x2="19" y2="5" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  ),
  arrow: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  image: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  ),
  undo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7v6h6" />
      <path d="M3 13a9 9 0 1 0 3-7.7L3 7" />
    </svg>
  ),
  redo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 7v6h-6" />
      <path d="M21 13a9 9 0 1 1-3-7.7L21 7" />
    </svg>
  ),
  delete: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  duplicate: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  zoomIn: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  zoomOut: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  guides: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="2" x2="12" y2="22" strokeDasharray="4 2" />
      <line x1="2" y1="12" x2="22" y2="12" strokeDasharray="4 2" />
    </svg>
  ),
  templates: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  placeholder: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6 21v-1a6 6 0 0 1 12 0v1" />
    </svg>
  ),
  gallery: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <rect x="7" y="7" width="3" height="3" />
      <rect x="14" y="7" width="3" height="3" />
      <rect x="7" y="14" width="3" height="3" />
      <rect x="14" y="14" width="3" height="3" />
    </svg>
  ),
  save: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  saveTemplate: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  ),
  preview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
};

interface ToolbarProps {
  onExport?: () => void;
  onOpenTemplates?: () => void;
  onSave?: () => void;
  onSaveAsTemplate?: () => void;
  onPreview?: () => void;
  onPublishFrame?: () => void; // Admin only - publish as system frame
  onUpdateFrame?: () => void; // Admin only - update existing frame
  onOrder?: () => void; // Create order
  isAdmin?: boolean;
  isAdminEdit?: boolean; // Admin editing existing frame
}

export const Toolbar: React.FC<ToolbarProps> = ({ onExport, onOpenTemplates, onSave: _onSave, onSaveAsTemplate: _onSaveAsTemplate, onPreview, onPublishFrame, onUpdateFrame, onOrder, isAdmin, isAdminEdit }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const frameInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const uploadButtonRef = useRef<HTMLDivElement>(null);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Listen for keyboard shortcut (T) to open text modal
  useEffect(() => {
    const handleOpenTextModal = () => setShowTextModal(true);
    window.addEventListener('openTextModal', handleOpenTextModal);
    return () => window.removeEventListener('openTextModal', handleOpenTextModal);
  }, []);
  
  // Calculate menu position when opening
  const handleToggleUploadMenu = () => {
    if (!showUploadMenu && uploadButtonRef.current) {
      const rect = uploadButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2 - 110, // center the 220px menu
      });
    }
    setShowUploadMenu(!showUploadMenu);
  };
  
  const {
    currentTool,
    setTool,
    selectedIds,
    addElement,
    deleteSelected,
    duplicateSelected,
    undo,
    redo,
    canUndo,
    canRedo,
    // zoom and setZoom - kept for future use but currently hidden
    // zoom,
    // setZoom,
    showGrid,
    toggleGrid,
    snapToGuides,
    toggleSnapToGuides,
  } = useEditorStore();

  // Generate unique ID
  const generateId = () => `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add shape element - larger sizes for 2500px canvas
  const handleAddShape = (shapeType: ShapeType) => {
    const id = generateId();
    const { canvasWidth, canvasHeight } = useEditorStore.getState();
    const size = shapeType === 'line' ? 400 : 250;
    addElement({
      ...DEFAULT_SHAPE_ELEMENT,
      id,
      shapeType,
      // name will be auto-generated in store
      x: canvasWidth / 2 - size / 2,
      y: canvasHeight / 2 - (shapeType === 'line' ? 2 : size / 2),
      width: size,
      height: shapeType === 'line' ? 4 : size,
      zIndex: Date.now(),
    } as any);
    setTool('select');
  };

  // Add placeholder element - larger for 2500px canvas
  const handleAddPlaceholder = () => {
    const id = generateId();
    const { canvasWidth, canvasHeight } = useEditorStore.getState();
    addElement({
      id,
      type: 'placeholder',
      // name will be auto-generated in store
      x: canvasWidth / 2 - 250,
      y: canvasHeight / 2 - 250,
      width: 500,
      height: 500,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      zIndex: Date.now(),
      isLocked: false,
      isVisible: true,
      shape: 'rectangle',
      fill: '#f3f4f6',
      stroke: '#9ca3af',
      strokeWidth: 3,
      cornerRadius: 12,
      label: 'גרור תמונה לכאן',
    } as any);
    setTool('select');
  };

  // Handle image upload - with element type support
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    elementType: ElementTypeKey = 'image'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'קובץ לא תקין');
      alert(validation.error);
      return;
    }

    try {
      // Get canvas size from store
      const { canvasWidth, canvasHeight } = useEditorStore.getState();
      
      // Process upload with optimization and placement calculation
      const result = await processUpload(file, elementType, canvasWidth, canvasHeight);

      if (!result.success || !result.dataUrl) {
        setUploadError(result.error || 'שגיאה בהעלאה');
        alert(result.error || 'שגיאה בהעלאה');
        return;
      }

      const id = generateId();
      const elementConfig = ELEMENT_TYPES[elementType];
      
      addElement({
        id,
        type: 'image',
        name: elementConfig.name,
        src: result.dataUrl,
        originalWidth: result.width,
        originalHeight: result.height,
        x: result.placement.x,
        y: result.placement.y,
        width: result.placement.width,
        height: result.placement.height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        zIndex: Date.now(),
        isLocked: result.placement.locked, // מסגרות נעולות כברירת מחדל!
        isVisible: true,
        objectFit: 'cover',
      });
      
      setTool('select');
      setShowUploadMenu(false);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('שגיאה בהעלאת הקובץ');
      alert('שגיאה בהעלאת הקובץ');
    }

    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (frameInputRef.current) frameInputRef.current.value = '';
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  // Zoom handlers - kept for future use but currently hidden
  // const handleZoomIn = () => setZoom(Math.min(zoom + 0.1, 3));
  // const handleZoomOut = () => setZoom(Math.max(zoom - 0.1, 0.1));

  // Tool button component
  const ToolButton: React.FC<{
    tool?: EditorTool;
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    isActive?: boolean;
    disabled?: boolean;
  }> = ({ tool, icon, label, onClick, isActive, disabled }) => (
    <button
      className={`
        toolbar-btn w-8 h-8 flex items-center justify-center rounded-lg
        transition-all duration-150 relative group
        ${isActive || (tool && currentTool === tool)
          ? 'bg-indigo-100 text-indigo-600'
          : 'hover:bg-gray-100 text-gray-600'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onClick={onClick || (tool ? () => setTool(tool) : undefined)}
      disabled={disabled}
      title={label}
    >
      <span className="w-4 h-4">{icon}</span>
      {/* Tooltip - positioned above button */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-[100] pointer-events-none shadow-lg">
        {label}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
      </div>
    </button>
  );

  // Section with label
  const ToolSection: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-0.5 bg-gray-50 rounded-lg p-0.5">
        {children}
      </div>
      <span className="text-[9px] text-gray-400 mt-0.5 hidden lg:block">{label}</span>
    </div>
  );

  // Divider
  const Divider = () => <div className="hidden sm:block w-px h-8 bg-gradient-to-b from-transparent via-gray-200 to-transparent mx-1" />;

  return (
    <div className="toolbar bg-gradient-to-b from-white to-gray-50 border-b border-gray-200 px-3 md:px-4 py-2 shadow-sm relative z-40 overflow-visible">
      {/* Hidden file inputs - outside of scrollable container */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          console.log('File input changed:', e.target.files);
          handleImageUpload(e, 'image');
        }}
      />
      <input
        ref={frameInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          console.log('Frame input changed:', e.target.files);
          handleImageUpload(e, 'frame');
        }}
      />
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          console.log('Logo input changed:', e.target.files);
          handleImageUpload(e, 'logo');
        }}
      />
      
      {/* Scrollable container for tools */}
      <div className="flex items-center gap-1.5 overflow-x-auto overflow-y-visible scrollbar-hide">
      {/* Templates Button - Special Style */}
      <button
        onClick={onOpenTemplates}
        className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-medium text-sm transition-all shadow-md hover:shadow-lg"
      >
        <span className="w-5 h-5">{icons.templates}</span>
        <span className="hidden sm:inline">תבניות</span>
      </button>
      
      <Divider />

      {/* Selection Tools */}
      <ToolSection label="בחירה">
        <ToolButton tool="select" icon={icons.select} label="בחירה (V)" />
      </ToolSection>
      
      <Divider />
      
      {/* Text */}
      <ToolSection label="טקסט">
        <ToolButton 
          icon={icons.text} 
          label="הוסף טקסט (T)" 
          onClick={() => setShowTextModal(true)}
        />
      </ToolSection>
      
      <Divider />
      
      {/* Shapes */}
      <ToolSection label="צורות">
        <ToolButton 
          icon={icons.rectangle} 
          label="מלבן (R)" 
          onClick={() => handleAddShape('rectangle')}
        />
        <ToolButton 
          icon={icons.circle} 
          label="עיגול (C)" 
          onClick={() => handleAddShape('circle')}
        />
        <div className="hidden md:flex">
          <ToolButton 
            icon={icons.triangle} 
            label="משולש" 
            onClick={() => handleAddShape('triangle')}
          />
          <ToolButton 
            icon={icons.star} 
            label="כוכב" 
            onClick={() => handleAddShape('star')}
          />
          <ToolButton 
            icon={icons.line} 
            label="קו (L)" 
            onClick={() => handleAddShape('line')}
          />
        </div>
      </ToolSection>
      
      <Divider />
      
      {/* Images - Upload Menu */}
      <ToolSection label="תמונות">
        {/* Upload Menu Toggle */}
        <div className="relative" ref={uploadButtonRef}>
          <ToolButton 
            icon={icons.image} 
            label="העלאת קובץ" 
            onClick={handleToggleUploadMenu}
            isActive={showUploadMenu}
          />
          
          {/* Upload Dropdown Menu - Fixed Position */}
          {showUploadMenu && (
            <>
              {/* Backdrop to close menu */}
              <div 
                className="fixed inset-0 z-[9998]" 
                onClick={() => setShowUploadMenu(false)}
              />
              <div 
                className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 py-2 w-[220px] z-[9999]"
                style={{
                  top: `${menuPosition.top}px`,
                  left: `${menuPosition.left}px`,
                }}
              >
                {/* Arrow pointing up */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45"></div>
                
                {/* Frame - fits to canvas */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Frame button clicked');
                    setShowUploadMenu(false);
                    // Small delay to ensure menu closes before file dialog opens
                    setTimeout(() => {
                      frameInputRef.current?.click();
                    }, 50);
                  }}
                  className="w-full px-4 py-3 text-right hover:bg-indigo-50 flex items-center gap-3 transition-colors relative z-10"
                >
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <span className="text-indigo-600">🖼️</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">מסגרת</div>
                    <div className="text-xs text-gray-500">תתאים לגודל הקנבס • נעולה</div>
                  </div>
                </button>
                
                {/* Logo - centered, smaller */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Logo button clicked');
                    setShowUploadMenu(false);
                    setTimeout(() => {
                      logoInputRef.current?.click();
                    }, 50);
                  }}
                  className="w-full px-4 py-3 text-right hover:bg-purple-50 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600">✨</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">לוגו / קישוט</div>
                    <div className="text-xs text-gray-500">מרכז הקנבס • ניתן להזיז</div>
                  </div>
                </button>
                
                {/* Regular image */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Image button clicked');
                    setShowUploadMenu(false);
                    setTimeout(() => {
                      fileInputRef.current?.click();
                    }, 50);
                  }}
                  className="w-full px-4 py-3 text-right hover:bg-green-50 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600">📷</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">תמונה רגילה</div>
                    <div className="text-xs text-gray-500">מרכז הקנבס • ניתן להזיז</div>
                  </div>
                </button>
                
                <div className="border-t border-gray-100 mt-2 pt-2 px-4">
                  <div className="text-xs text-gray-400 text-center">
                    מקסימום 4MB • PNG, JPG, WebP
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="hidden md:block">
          <ToolButton 
            icon={icons.placeholder} 
            label="אזור תמונה (P)" 
            onClick={handleAddPlaceholder}
          />
        </div>
      </ToolSection>
      
      <Divider />
      
      {/* History */}
      <ToolSection label="היסטוריה">
        <ToolButton 
          icon={icons.undo} 
          label="בטל (Ctrl+Z)" 
          onClick={undo}
          disabled={!canUndo()}
        />
        <ToolButton 
          icon={icons.redo} 
          label="חזור (Ctrl+Y)" 
          onClick={redo}
          disabled={!canRedo()}
        />
      </ToolSection>
      
      <Divider />
      
      {/* Element Actions */}
      <ToolSection label="פעולות">
        <ToolButton 
          icon={icons.duplicate} 
          label="שכפל (Ctrl+D)" 
          onClick={duplicateSelected}
          disabled={selectedIds.length === 0}
        />
        <ToolButton 
          icon={icons.delete} 
          label="מחק (Delete)" 
          onClick={deleteSelected}
          disabled={selectedIds.length === 0}
        />
      </ToolSection>
      
      {/* Spacer */}
      <div className="flex-1 min-w-[20px]" />
      
      {/* Right side actions - fixed positioning */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Zoom Control - Hidden for cleaner UI
        <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-xl px-2 py-1">
          <button 
            onClick={handleZoomOut}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <span className="w-4 h-4">{icons.zoomOut}</span>
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[50px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button 
            onClick={handleZoomIn}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <span className="w-4 h-4">{icons.zoomIn}</span>
          </button>
        </div>
        
        <Divider />
        */}
        
        {/* View Options - hidden on mobile */}
        <div className="hidden md:flex items-center gap-1">
          <ToolButton 
            icon={icons.grid} 
            label="הצג רשת" 
            onClick={toggleGrid}
            isActive={showGrid}
          />
          <ToolButton 
            icon={icons.guides} 
            label="קווי עזר חכמים" 
            onClick={toggleSnapToGuides}
            isActive={snapToGuides}
          />
        </div>
        
        <Divider />
        
        {/* Actions Group - Primary buttons */}
        <div className="flex items-center gap-2">
          {/* Preview */}
          <button
            onClick={onPreview}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="תצוגה מקדימה"
          >
            <span className="w-5 h-5">{icons.preview}</span>
          </button>

          {/* Admin: Update Existing Frame */}
          {isAdmin && isAdminEdit && onUpdateFrame && (
            <button
              onClick={onUpdateFrame}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-medium text-sm transition-all shadow-md hover:shadow-lg"
              title="עדכון מסגרת קיימת"
            >
              <span className="text-base">💾</span>
              <span className="hidden lg:inline">עדכן מסגרת</span>
            </button>
          )}

          {/* Admin: Publish Frame to System (only for new frames) */}
          {isAdmin && !isAdminEdit && onPublishFrame && (
            <button
              onClick={onPublishFrame}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-medium text-sm transition-all shadow-md hover:shadow-lg"
              title="פרסום מסגרת למערכת"
            >
              <span className="text-base">🖼️</span>
              <span className="hidden lg:inline">פרסם</span>
            </button>
          )}

          {/* Order Button */}
          {onOrder && (
            <button
              onClick={onOrder}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl font-medium text-sm transition-all shadow-md hover:shadow-lg"
              title="הזמנת המסגרת"
            >
              <span className="text-base">🛒</span>
              <span className="hidden sm:inline">הזמנה</span>
            </button>
          )}

          {/* Send / Export - Primary Action */}
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-medium text-sm transition-all shadow-md hover:shadow-lg"
          >
            <span className="w-5 h-5">{icons.download}</span>
            <span className="hidden sm:inline">שליחה</span>
          </button>
        </div>
      </div>
      </div>

      {/* Upload Error Toast */}
      {uploadError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          {uploadError}
        </div>
      )}

      {/* Add Text Modal */}
      <AddTextModal 
        isOpen={showTextModal} 
        onClose={() => setShowTextModal(false)} 
      />
    </div>
  );
};
