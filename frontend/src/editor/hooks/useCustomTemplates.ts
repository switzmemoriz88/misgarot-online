// ==========================================
// Custom Templates Hook - תבניות מותאמות אישית
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import { CanvasElement } from '../types';

export interface CustomTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  canvasWidth: number;
  canvasHeight: number;
  elements: CanvasElement[];
  backgroundColor?: string;
  backgroundType?: 'none' | 'solid' | 'gradient' | 'image';
  gradientColors?: { start: string; end: string; angle: number };
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'misgarot_custom_templates';

export const useCustomTemplates = () => {
  const [templates, setTemplates] = useState<CustomTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load templates from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CustomTemplate[];
        setTemplates(parsed);
      }
    } catch (error) {
      console.error('Error loading custom templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save templates to localStorage
  const saveTemplates = useCallback((newTemplates: CustomTemplate[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTemplates));
      setTemplates(newTemplates);
    } catch (error) {
      console.error('Error saving custom templates:', error);
    }
  }, []);

  // Add new template
  const addTemplate = useCallback((
    name: string,
    description: string,
    elements: CanvasElement[],
    canvasWidth: number,
    canvasHeight: number,
    backgroundColor?: string,
    backgroundType?: 'none' | 'solid' | 'gradient' | 'image',
    gradientColors?: { start: string; end: string; angle: number }
  ): CustomTemplate => {
    const newTemplate: CustomTemplate = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      canvasWidth,
      canvasHeight,
      elements: JSON.parse(JSON.stringify(elements)), // Deep clone
      backgroundColor,
      backgroundType,
      gradientColors,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveTemplates([...templates, newTemplate]);
    return newTemplate;
  }, [templates, saveTemplates]);

  // Update template
  const updateTemplate = useCallback((id: string, updates: Partial<CustomTemplate>) => {
    const updated = templates.map(t => 
      t.id === id 
        ? { ...t, ...updates, updatedAt: Date.now() } 
        : t
    );
    saveTemplates(updated);
  }, [templates, saveTemplates]);

  // Delete template
  const deleteTemplate = useCallback((id: string) => {
    const filtered = templates.filter(t => t.id !== id);
    saveTemplates(filtered);
  }, [templates, saveTemplates]);

  // Duplicate template
  const duplicateTemplate = useCallback((id: string): CustomTemplate | null => {
    const original = templates.find(t => t.id === id);
    if (!original) return null;

    const duplicate: CustomTemplate = {
      ...original,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${original.name} (עותק)`,
      elements: JSON.parse(JSON.stringify(original.elements)),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveTemplates([...templates, duplicate]);
    return duplicate;
  }, [templates, saveTemplates]);

  // Get template by ID
  const getTemplate = useCallback((id: string): CustomTemplate | undefined => {
    return templates.find(t => t.id === id);
  }, [templates]);

  return {
    templates,
    isLoading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    getTemplate,
    hasTemplates: templates.length > 0,
  };
};
