// ==========================================
// useAutoSave Hook - שמירה אוטומטית
// ==========================================

import { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '../store';

interface AutoSaveOptions {
  interval?: number;        // Interval in milliseconds (default: 30000 = 30 seconds)
  storageKey?: string;      // LocalStorage key (default: 'misgarot_autosave')
  enabled?: boolean;        // Enable/disable auto-save (default: true)
  onSave?: () => void;      // Callback when save occurs
  onRestore?: () => void;   // Callback when restore occurs
}

export function useAutoSave(options: AutoSaveOptions = {}) {
  const {
    interval = 30000,
    storageKey = 'misgarot_autosave',
    enabled = true,
    onSave,
    onRestore,
  } = options;

  const {
    elements,
    canvasWidth,
    canvasHeight,
    backgroundColor,
    backgroundType,
    gradientColors,
    loadDesign,
    setBackgroundColor,
    setBackgroundType,
    setGradientColors,
  } = useEditorStore();

  const lastSaveRef = useRef<number>(Date.now());
  const hasUnsavedChangesRef = useRef<boolean>(false);

  // Mark as having unsaved changes when elements change
  useEffect(() => {
    hasUnsavedChangesRef.current = true;
  }, [elements, backgroundColor, backgroundType, gradientColors]);

  // Save to localStorage
  const save = useCallback(() => {
    if (!enabled) return;

    try {
      const saveData = {
        elements,
        canvasWidth,
        canvasHeight,
        backgroundColor,
        backgroundType,
        gradientColors,
        savedAt: Date.now(),
        version: '1.0',
      };

      localStorage.setItem(storageKey, JSON.stringify(saveData));
      lastSaveRef.current = Date.now();
      hasUnsavedChangesRef.current = false;
      
      onSave?.();
      
      console.log('[AutoSave] Design saved at', new Date().toLocaleTimeString('he-IL'));
    } catch (error) {
      console.error('[AutoSave] Failed to save:', error);
    }
  }, [elements, canvasWidth, canvasHeight, backgroundColor, backgroundType, gradientColors, storageKey, enabled, onSave]);

  // Restore from localStorage
  const restore = useCallback(() => {
    try {
      const savedData = localStorage.getItem(storageKey);
      if (!savedData) return false;

      const data = JSON.parse(savedData);
      
      // Validate data structure
      if (!data.elements || !Array.isArray(data.elements)) {
        console.warn('[AutoSave] Invalid save data structure');
        return false;
      }

      // Restore design
      loadDesign(data.elements, data.canvasWidth || 600, data.canvasHeight || 400);
      
      // Restore background settings
      if (data.backgroundColor) setBackgroundColor(data.backgroundColor);
      if (data.backgroundType) setBackgroundType(data.backgroundType);
      if (data.gradientColors) setGradientColors(data.gradientColors);

      hasUnsavedChangesRef.current = false;
      
      onRestore?.();
      
      console.log('[AutoSave] Design restored from', new Date(data.savedAt).toLocaleTimeString('he-IL'));
      return true;
    } catch (error) {
      console.error('[AutoSave] Failed to restore:', error);
      return false;
    }
  }, [storageKey, loadDesign, setBackgroundColor, setBackgroundType, setGradientColors, onRestore]);

  // Clear saved data
  const clear = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      console.log('[AutoSave] Saved data cleared');
    } catch (error) {
      console.error('[AutoSave] Failed to clear:', error);
    }
  }, [storageKey]);

  // Check if there's saved data
  const hasSavedData = useCallback(() => {
    try {
      return !!localStorage.getItem(storageKey);
    } catch {
      return false;
    }
  }, [storageKey]);

  // Get saved data info
  const getSavedInfo = useCallback(() => {
    try {
      const savedData = localStorage.getItem(storageKey);
      if (!savedData) return null;

      const data = JSON.parse(savedData);
      return {
        savedAt: data.savedAt,
        elementCount: data.elements?.length || 0,
        canvasSize: `${data.canvasWidth}×${data.canvasHeight}`,
      };
    } catch {
      return null;
    }
  }, [storageKey]);

  // Auto-save interval
  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      if (hasUnsavedChangesRef.current && elements.length > 0) {
        save();
      }
    }, interval);

    return () => clearInterval(intervalId);
  }, [enabled, interval, save, elements.length]);

  // Save before page unload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current && elements.length > 0) {
        save();
        // Show browser's default warning
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled, save, elements.length]);

  return {
    save,
    restore,
    clear,
    hasSavedData,
    getSavedInfo,
    hasUnsavedChanges: () => hasUnsavedChangesRef.current,
    lastSaveTime: () => lastSaveRef.current,
  };
}

export default useAutoSave;
