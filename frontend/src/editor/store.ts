// ==========================================
// Editor Store - Zustand State Management
// ==========================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
  CanvasElement,
  EditorState,
  EditorTool,
  HistoryState,
  TextElement,
  ImageElement,
  ShapeElement,
  PlaceholderElement,
  GalleryImage,
  DEFAULT_TEXT_ELEMENT,
  DEFAULT_SHAPE_ELEMENT,
} from './types';

const MAX_HISTORY = 50;

interface EditorStore extends EditorState {
  // Tool
  currentTool: EditorTool;
  setTool: (tool: EditorTool) => void;

  // Selection
  selectElement: (id: string, addToSelection?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // Elements CRUD
  addElement: (element: Partial<CanvasElement>) => string;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  deleteSelected: () => void;
  duplicateElement: (id: string) => string;
  duplicateSelected: () => void;

  // Z-Index / Layers
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;

  // History
  undo: () => void;
  redo: () => void;
  saveToHistory: (action: string) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Canvas
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  resetView: () => void;
  setCanvasSize: (width: number, height: number) => void;

  // Grid & Snap
  toggleGrid: () => void;
  toggleSnap: () => void;
  toggleSnapToGuides: () => void;
  setGridSize: (size: number) => void;

  // Clipboard
  clipboard: CanvasElement[];
  copy: () => void;
  paste: () => void;
  cut: () => void;

  // Lock/Visibility
  toggleLock: (id: string) => void;
  toggleVisibility: (id: string) => void;
  
  // Stretch to Canvas
  stretchToCanvas: (id: string) => void;

  // Alignment
  alignSelected: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distributeSelected: (direction: 'horizontal' | 'vertical') => void;

  // Load/Save
  loadDesign: (elements: CanvasElement[], width: number, height: number) => void;
  getDesignJSON: () => { elements: CanvasElement[]; width: number; height: number };
  clearCanvas: () => void;

  // Canvas Background
  backgroundColor: string;
  backgroundType: 'none' | 'solid' | 'gradient' | 'image';
  gradientColors: { start: string; end: string; angle: number };
  backgroundImage: string | null;
  setBackgroundColor: (color: string) => void;
  setBackgroundType: (type: 'none' | 'solid' | 'gradient' | 'image') => void;
  setGradientColors: (colors: { start?: string; end?: string; angle?: number }) => void;
  setBackgroundImage: (image: string | null) => void;

  // Image Gallery
  galleryImages: GalleryImage[];
  addGalleryImage: (image: GalleryImage) => void;
  removeGalleryImage: (id: string) => void;
  clearGallery: () => void;
  
  // Placeholders
  assignImageToPlaceholder: (placeholderId: string, image: GalleryImage) => void;
  removeImageFromPlaceholder: (placeholderId: string) => void;
  adjustPlaceholderImage: (placeholderId: string, offsetX: number, offsetY: number, scale: number) => void;

  // Helpers
  getSelectedElements: () => CanvasElement[];
  getElementById: (id: string) => CanvasElement | undefined;
}

export const useEditorStore = create<EditorStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial State - Full resolution canvas (2500x1875 for landscape)
    elements: [],
    selectedIds: [],
    canvasWidth: 2500,
    canvasHeight: 1875,
    zoom: 1,
    panX: 0,
    panY: 0,
    showGrid: false,
    snapToGrid: true,
    snapToGuides: true,
    gridSize: 20, // Larger grid for larger canvas
    history: [],
    historyIndex: -1,
    currentTool: 'select',
    clipboard: [],

    // Canvas Background - Initial State (transparent by default)
    backgroundColor: 'transparent',
    backgroundType: 'none' as const,
    gradientColors: { start: '#6366f1', end: '#a855f7', angle: 45 },
    backgroundImage: null as string | null,

    // Tool
    setTool: (tool) => set({ currentTool: tool }),

    // Selection
    selectElement: (id, addToSelection = false) => {
      set((state) => {
        if (addToSelection) {
          const isSelected = state.selectedIds.includes(id);
          return {
            selectedIds: isSelected
              ? state.selectedIds.filter((i) => i !== id)
              : [...state.selectedIds, id],
          };
        }
        return { selectedIds: [id] };
      });
    },

    selectAll: () => {
      set((state) => ({
        selectedIds: state.elements.filter((e) => !e.isLocked).map((e) => e.id),
      }));
    },

    clearSelection: () => set({ selectedIds: [] }),

    // Elements CRUD
    addElement: (elementData) => {
      const id = uuidv4();
      const zIndex = get().elements.length;
      
      let newElement: CanvasElement;
      
      if (elementData.type === 'text') {
        newElement = {
          ...DEFAULT_TEXT_ELEMENT,
          ...elementData,
          id,
          zIndex,
          name: `טקסט ${zIndex + 1}`,
        } as TextElement;
      } else if (elementData.type === 'shape') {
        newElement = {
          ...DEFAULT_SHAPE_ELEMENT,
          ...elementData,
          id,
          zIndex,
          name: `צורה ${zIndex + 1}`,
        } as ShapeElement;
      } else if (elementData.type === 'image') {
        newElement = {
          ...elementData,
          id,
          zIndex,
          opacity: 1,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          isLocked: false,
          isVisible: true,
          name: `תמונה ${zIndex + 1}`,
        } as ImageElement;
      } else if (elementData.type === 'placeholder') {
        newElement = {
          ...elementData,
          id,
          zIndex,
          name: elementData.name || `אזור תמונה ${zIndex + 1}`,
        } as CanvasElement;
      } else {
        newElement = {
          ...elementData,
          id,
          zIndex,
          name: elementData.name || `שכבה ${zIndex + 1}`,
        } as CanvasElement;
      }

      set((state) => ({
        elements: [...state.elements, newElement],
        selectedIds: [id],
      }));

      get().saveToHistory(`הוספת ${newElement.type}`);
      return id;
    },

    updateElement: (id, updates) => {
      set((state) => ({
        elements: state.elements.map((el) =>
          el.id === id ? { ...el, ...updates } as CanvasElement : el
        ),
      }));
    },

    deleteElement: (id) => {
      set((state) => ({
        elements: state.elements.filter((el) => el.id !== id),
        selectedIds: state.selectedIds.filter((i) => i !== id),
      }));
      get().saveToHistory('מחיקה');
    },

    deleteSelected: () => {
      const { selectedIds } = get();
      if (selectedIds.length === 0) return;
      
      set((state) => ({
        elements: state.elements.filter((el) => !selectedIds.includes(el.id)),
        selectedIds: [],
      }));
      get().saveToHistory('מחיקה');
    },

    duplicateElement: (id) => {
      const element = get().getElementById(id);
      if (!element) return '';

      const newId = uuidv4();
      const newElement = {
        ...element,
        id: newId,
        x: element.x + 20,
        y: element.y + 20,
        zIndex: get().elements.length,
        name: `${element.name} (עותק)`,
      };

      set((state) => ({
        elements: [...state.elements, newElement],
        selectedIds: [newId],
      }));

      get().saveToHistory('שכפול');
      return newId;
    },

    duplicateSelected: () => {
      const { selectedIds, elements } = get();
      if (selectedIds.length === 0) return;

      const newElements: CanvasElement[] = [];
      const newIds: string[] = [];

      selectedIds.forEach((id) => {
        const element = elements.find((e) => e.id === id);
        if (element) {
          const newId = uuidv4();
          newElements.push({
            ...element,
            id: newId,
            x: element.x + 20,
            y: element.y + 20,
            zIndex: elements.length + newElements.length,
            name: `${element.name} (עותק)`,
          });
          newIds.push(newId);
        }
      });

      set((state) => ({
        elements: [...state.elements, ...newElements],
        selectedIds: newIds,
      }));

      get().saveToHistory('שכפול');
    },

    // Z-Index / Layers
    bringForward: (id) => {
      set((state) => {
        const index = state.elements.findIndex((e) => e.id === id);
        if (index === state.elements.length - 1) return state;
        
        const newElements = [...state.elements];
        [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
        
        return {
          elements: newElements.map((e, i) => ({ ...e, zIndex: i })),
        };
      });
      get().saveToHistory('העברה קדימה');
    },

    sendBackward: (id) => {
      set((state) => {
        const index = state.elements.findIndex((e) => e.id === id);
        if (index === 0) return state;
        
        const newElements = [...state.elements];
        [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]];
        
        return {
          elements: newElements.map((e, i) => ({ ...e, zIndex: i })),
        };
      });
      get().saveToHistory('העברה אחורה');
    },

    bringToFront: (id) => {
      set((state) => {
        const element = state.elements.find((e) => e.id === id);
        if (!element) return state;
        
        const otherElements = state.elements.filter((e) => e.id !== id);
        return {
          elements: [...otherElements, element].map((e, i) => ({ ...e, zIndex: i })),
        };
      });
      get().saveToHistory('העברה לחזית');
    },

    sendToBack: (id) => {
      set((state) => {
        const element = state.elements.find((e) => e.id === id);
        if (!element) return state;
        
        const otherElements = state.elements.filter((e) => e.id !== id);
        return {
          elements: [element, ...otherElements].map((e, i) => ({ ...e, zIndex: i })),
        };
      });
      get().saveToHistory('העברה לרקע');
    },

    // History
    saveToHistory: (action) => {
      set((state) => {
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        const historyState: HistoryState = {
          elements: JSON.parse(JSON.stringify(state.elements)),
          timestamp: Date.now(),
          action,
        };
        
        newHistory.push(historyState);
        
        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
        }
        
        return {
          history: newHistory,
          historyIndex: newHistory.length - 1,
        };
      });
    },

    undo: () => {
      const { historyIndex, history } = get();
      if (historyIndex <= 0) return;
      
      const prevState = history[historyIndex - 1];
      set({
        elements: JSON.parse(JSON.stringify(prevState.elements)),
        historyIndex: historyIndex - 1,
        selectedIds: [],
      });
    },

    redo: () => {
      const { historyIndex, history } = get();
      if (historyIndex >= history.length - 1) return;
      
      const nextState = history[historyIndex + 1];
      set({
        elements: JSON.parse(JSON.stringify(nextState.elements)),
        historyIndex: historyIndex + 1,
        selectedIds: [],
      });
    },

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,

    // Canvas
    setZoom: (zoom) => set({ zoom: Math.min(Math.max(zoom, 0.1), 5) }),
    
    setPan: (x, y) => set({ panX: x, panY: y }),
    
    resetView: () => set({ zoom: 1, panX: 0, panY: 0 }),
    
    setCanvasSize: (width, height) => set({ canvasWidth: width, canvasHeight: height }),

    // Grid & Snap
    toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
    toggleSnap: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
    toggleSnapToGuides: () => set((state) => ({ snapToGuides: !state.snapToGuides })),
    setGridSize: (size) => set({ gridSize: size }),

    // Clipboard
    copy: () => {
      const selected = get().getSelectedElements();
      if (selected.length === 0) return;
      set({ clipboard: JSON.parse(JSON.stringify(selected)) });
    },

    paste: () => {
      const { clipboard, elements } = get();
      if (clipboard.length === 0) return;

      const newElements: CanvasElement[] = [];
      const newIds: string[] = [];

      clipboard.forEach((element) => {
        const newId = uuidv4();
        newElements.push({
          ...element,
          id: newId,
          x: element.x + 20,
          y: element.y + 20,
          zIndex: elements.length + newElements.length,
        });
        newIds.push(newId);
      });

      set((state) => ({
        elements: [...state.elements, ...newElements],
        selectedIds: newIds,
      }));

      get().saveToHistory('הדבקה');
    },

    cut: () => {
      get().copy();
      get().deleteSelected();
    },

    // Lock/Visibility
    toggleLock: (id) => {
      set((state) => ({
        elements: state.elements.map((el) =>
          el.id === id ? { ...el, isLocked: !el.isLocked } : el
        ),
      }));
    },

    toggleVisibility: (id) => {
      set((state) => ({
        elements: state.elements.map((el) =>
          el.id === id ? { ...el, isVisible: !el.isVisible } : el
        ),
      }));
    },

    // Stretch element to fill entire canvas
    stretchToCanvas: (id) => {
      const { canvasWidth, canvasHeight } = get();
      
      set((state) => ({
        elements: state.elements.map((el) => {
          if (el.id === id) {
            return { 
              ...el, 
              x: 0, 
              y: 0, 
              width: canvasWidth, 
              height: canvasHeight,
              scaleX: 1,
              scaleY: 1,
              rotation: 0,
              // For images - change to fill mode so it stretches
              objectFit: 'fill' as const,
            };
          }
          return el;
        }),
      }));
    },

    // Alignment
    alignSelected: (alignment) => {
      const { selectedIds, elements, canvasWidth, canvasHeight } = get();
      if (selectedIds.length === 0) return;

      const selectedElements = elements.filter((e) => selectedIds.includes(e.id));
      
      let updates: { id: string; x?: number; y?: number }[] = [];

      switch (alignment) {
        case 'left':
          const minX = Math.min(...selectedElements.map((e) => e.x));
          updates = selectedElements.map((e) => ({ id: e.id, x: minX }));
          break;
        case 'center':
          const centerX = canvasWidth / 2;
          updates = selectedElements.map((e) => ({ id: e.id, x: centerX - e.width / 2 }));
          break;
        case 'right':
          const maxX = Math.max(...selectedElements.map((e) => e.x + e.width));
          updates = selectedElements.map((e) => ({ id: e.id, x: maxX - e.width }));
          break;
        case 'top':
          const minY = Math.min(...selectedElements.map((e) => e.y));
          updates = selectedElements.map((e) => ({ id: e.id, y: minY }));
          break;
        case 'middle':
          const centerY = canvasHeight / 2;
          updates = selectedElements.map((e) => ({ id: e.id, y: centerY - e.height / 2 }));
          break;
        case 'bottom':
          const maxY = Math.max(...selectedElements.map((e) => e.y + e.height));
          updates = selectedElements.map((e) => ({ id: e.id, y: maxY - e.height }));
          break;
      }

      set((state) => ({
        elements: state.elements.map((el) => {
          const update = updates.find((u) => u.id === el.id);
          return update ? { ...el, ...update } : el;
        }),
      }));

      get().saveToHistory('יישור');
    },

    distributeSelected: (direction) => {
      const { selectedIds, elements } = get();
      if (selectedIds.length < 3) return;

      const selectedElements = elements
        .filter((e) => selectedIds.includes(e.id))
        .sort((a, b) => (direction === 'horizontal' ? a.x - b.x : a.y - b.y));

      const first = selectedElements[0];
      const last = selectedElements[selectedElements.length - 1];
      
      const totalSpace = direction === 'horizontal'
        ? last.x + last.width - first.x
        : last.y + last.height - first.y;
      
      const totalElementSize = selectedElements.reduce(
        (sum, e) => sum + (direction === 'horizontal' ? e.width : e.height),
        0
      );
      
      const gap = (totalSpace - totalElementSize) / (selectedElements.length - 1);
      
      let currentPos = direction === 'horizontal' ? first.x : first.y;

      const updates = selectedElements.map((e) => {
        const update = {
          id: e.id,
          [direction === 'horizontal' ? 'x' : 'y']: currentPos,
        };
        currentPos += (direction === 'horizontal' ? e.width : e.height) + gap;
        return update;
      });

      set((state) => ({
        elements: state.elements.map((el) => {
          const update = updates.find((u) => u.id === el.id);
          return update ? { ...el, ...update } : el;
        }),
      }));

      get().saveToHistory('חלוקה שווה');
    },

    // Load/Save
    loadDesign: (elements, width, height) => {
      set({
        elements,
        canvasWidth: width,
        canvasHeight: height,
        selectedIds: [],
        zoom: 1,
        panX: 0,
        panY: 0,
        history: [],
        historyIndex: -1,
      });
      get().saveToHistory('טעינת עיצוב');
    },

    getDesignJSON: () => ({
      elements: get().elements,
      width: get().canvasWidth,
      height: get().canvasHeight,
    }),

    clearCanvas: () => {
      set({
        elements: [],
        selectedIds: [],
        history: [],
        historyIndex: -1,
      });
    },

    // ==========================================
    // Canvas Background
    // ==========================================
    setBackgroundColor: (color: string) => {
      set({ backgroundColor: color });
      get().saveToHistory('שינוי צבע רקע');
    },

    setBackgroundType: (type: 'none' | 'solid' | 'gradient' | 'image') => {
      set({ backgroundType: type });
      get().saveToHistory('שינוי סוג רקע');
    },

    setGradientColors: (colors: { start?: string; end?: string; angle?: number }) => {
      set((state) => ({
        gradientColors: {
          ...state.gradientColors,
          ...colors,
        },
      }));
      get().saveToHistory('שינוי גרדיאנט');
    },

    setBackgroundImage: (image: string | null) => {
      set({ backgroundImage: image });
      get().saveToHistory('שינוי תמונת רקע');
    },

    // ==========================================
    // Image Gallery
    // ==========================================
    galleryImages: [],

    addGalleryImage: (image: GalleryImage) => {
      set((state) => ({
        galleryImages: [...state.galleryImages, image],
      }));
    },

    removeGalleryImage: (id: string) => {
      set((state) => ({
        galleryImages: state.galleryImages.filter((img) => img.id !== id),
      }));
    },

    clearGallery: () => {
      set({ galleryImages: [] });
    },

    // ==========================================
    // Placeholders
    // ==========================================
    assignImageToPlaceholder: (placeholderId: string, image: GalleryImage) => {
      set((state) => ({
        elements: state.elements.map((el) => {
          if (el.id === placeholderId && el.type === 'placeholder') {
            return {
              ...el,
              imageData: {
                src: image.src,
                assetId: image.id,
                offsetX: 0,
                offsetY: 0,
                scale: 1,
              },
            } as PlaceholderElement;
          }
          return el;
        }),
      }));
      get().saveToHistory('הכנסת תמונה ל-Placeholder');
    },

    removeImageFromPlaceholder: (placeholderId: string) => {
      set((state) => ({
        elements: state.elements.map((el) => {
          if (el.id === placeholderId && el.type === 'placeholder') {
            const { imageData, ...rest } = el as PlaceholderElement;
            return rest as PlaceholderElement;
          }
          return el;
        }),
      }));
      get().saveToHistory('הסרת תמונה מ-Placeholder');
    },

    adjustPlaceholderImage: (placeholderId: string, offsetX: number, offsetY: number, scale: number) => {
      set((state) => ({
        elements: state.elements.map((el) => {
          if (el.id === placeholderId && el.type === 'placeholder') {
            const placeholder = el as PlaceholderElement;
            if (placeholder.imageData) {
              return {
                ...placeholder,
                imageData: {
                  ...placeholder.imageData,
                  offsetX,
                  offsetY,
                  scale,
                },
              };
            }
          }
          return el;
        }),
      }));
    },

    // Helpers
    getSelectedElements: () => {
      const { selectedIds, elements } = get();
      return elements.filter((e) => selectedIds.includes(e.id));
    },

    getElementById: (id) => get().elements.find((e) => e.id === id),
  }))
);

// Custom hooks
export const useSelectedElements = () => {
  const elements = useEditorStore((state) => state.elements);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  return elements.filter((e) => selectedIds.includes(e.id));
};

export const useCanUndo = () => useEditorStore((state) => state.historyIndex > 0);
export const useCanRedo = () => useEditorStore((state) => state.historyIndex < state.history.length - 1);
