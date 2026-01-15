// ==========================================
// Keyboard Shortcuts Hook
// ==========================================

import { useEffect, useCallback } from 'react';
import { useEditorStore } from './store';

export const useKeyboardShortcuts = () => {
  const {
    selectedIds,
    elements,
    deleteSelected,
    duplicateSelected,
    selectAll,
    clearSelection,
    undo,
    redo,
    copy,
    paste,
    cut,
    updateElement,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    setTool,
    saveToHistory,
  } = useEditorStore();

  // Nudge selected elements
  const nudgeElements = useCallback((dx: number, dy: number) => {
    selectedIds.forEach(id => {
      const element = elements.find(e => e.id === id);
      if (element && !element.isLocked) {
        updateElement(id, {
          x: element.x + dx,
          y: element.y + dy,
        });
      }
    });
    if (selectedIds.length > 0) {
      saveToHistory('הזזה');
    }
  }, [selectedIds, elements, updateElement, saveToHistory]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
    const shiftKey = e.shiftKey;

    // Tool shortcuts
    if (!ctrlKey && !shiftKey) {
      switch (e.key.toLowerCase()) {
        case 'v':
          setTool('select');
          e.preventDefault();
          return;
        case 't':
          // Dispatch event to open text modal
          window.dispatchEvent(new CustomEvent('openTextModal'));
          e.preventDefault();
          return;
        case 'r':
          setTool('rectangle');
          e.preventDefault();
          return;
        case 'c':
          if (!ctrlKey) {
            setTool('circle');
            e.preventDefault();
            return;
          }
          break;
        case 'l':
          setTool('line');
          e.preventDefault();
          return;
        case 'i':
          setTool('image');
          e.preventDefault();
          return;
      }
    }

    // Delete / Backspace
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedIds.length > 0) {
        deleteSelected();
        saveToHistory('מחיקה');
        e.preventDefault();
      }
      return;
    }

    // Escape - clear selection
    if (e.key === 'Escape') {
      clearSelection();
      e.preventDefault();
      return;
    }

    // Ctrl/Cmd shortcuts
    if (ctrlKey) {
      switch (e.key.toLowerCase()) {
        case 'z':
          if (shiftKey) {
            redo();
          } else {
            undo();
          }
          e.preventDefault();
          break;

        case 'y':
          redo();
          e.preventDefault();
          break;

        case 'c':
          copy();
          e.preventDefault();
          break;

        case 'v':
          paste();
          e.preventDefault();
          break;

        case 'x':
          cut();
          e.preventDefault();
          break;

        case 'd':
          duplicateSelected();
          e.preventDefault();
          break;

        case 'a':
          selectAll();
          e.preventDefault();
          break;

        case 's':
          // Dispatch custom save event
          window.dispatchEvent(new CustomEvent('editor-save'));
          e.preventDefault();
          break;

        case ']':
          if (shiftKey) {
            selectedIds.forEach(id => bringToFront(id));
            saveToHistory('העברה לחזית');
          } else {
            selectedIds.forEach(id => bringForward(id));
            saveToHistory('העברה קדימה');
          }
          e.preventDefault();
          break;

        case '[':
          if (shiftKey) {
            selectedIds.forEach(id => sendToBack(id));
            saveToHistory('העברה לרקע');
          } else {
            selectedIds.forEach(id => sendBackward(id));
            saveToHistory('העברה אחורה');
          }
          e.preventDefault();
          break;
      }
      return;
    }

    // Arrow keys - nudge
    const nudgeAmount = shiftKey ? 10 : 1;
    switch (e.key) {
      case 'ArrowUp':
        nudgeElements(0, -nudgeAmount);
        e.preventDefault();
        break;
      case 'ArrowDown':
        nudgeElements(0, nudgeAmount);
        e.preventDefault();
        break;
      case 'ArrowLeft':
        nudgeElements(-nudgeAmount, 0);
        e.preventDefault();
        break;
      case 'ArrowRight':
        nudgeElements(nudgeAmount, 0);
        e.preventDefault();
        break;
    }
  }, [
    selectedIds,
    deleteSelected,
    duplicateSelected,
    selectAll,
    clearSelection,
    undo,
    redo,
    copy,
    paste,
    cut,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    setTool,
    saveToHistory,
    nudgeElements,
  ]);

  // Attach event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};