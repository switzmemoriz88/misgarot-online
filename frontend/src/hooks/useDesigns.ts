import { useState, useCallback } from 'react';
import { designsService, storageService, type Design, type DesignData } from '../lib/supabase';

/**
 * useDesigns Hook
 * ----------------
 * ניהול עיצובים
 */

interface DesignsState {
  designs: Design[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
}

export const useDesigns = (pageSize = 20) => {
  const [state, setState] = useState<DesignsState>({
    designs: [],
    loading: false,
    error: null,
    page: 1,
    totalPages: 0,
    total: 0,
  });

  // Load designs
  const loadDesigns = useCallback(async (page = 1) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const response = await designsService.getMyDesigns(page, pageSize);

    setState({
      designs: response.data,
      loading: false,
      error: null,
      page: response.page,
      totalPages: response.totalPages,
      total: response.count,
    });
  }, [pageSize]);

  // Create design
  const createDesign = useCallback(async (data: {
    name: string;
    frame_id?: string;
    category_id?: string;
    design_data: DesignData;
    orientation?: 'landscape' | 'portrait' | 'both';
  }) => {
    setState((prev) => ({ ...prev, loading: true }));

    const { data: design, error } = await designsService.create(data);

    if (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
      return null;
    }

    setState((prev) => ({
      ...prev,
      loading: false,
      designs: [design!, ...prev.designs],
    }));

    return design;
  }, []);

  // Update design
  const updateDesign = useCallback(async (id: string, updates: Partial<Design>) => {
    const { data, error } = await designsService.update(id, updates);

    if (error) {
      setState((prev) => ({ ...prev, error: error.message }));
      return null;
    }

    setState((prev) => ({
      ...prev,
      designs: prev.designs.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    }));

    return data;
  }, []);

  // Delete design
  const deleteDesign = useCallback(async (id: string) => {
    const { error } = await designsService.delete(id);

    if (error) {
      setState((prev) => ({ ...prev, error: error.message }));
      return false;
    }

    setState((prev) => ({
      ...prev,
      designs: prev.designs.filter((d) => d.id !== id),
      total: prev.total - 1,
    }));

    return true;
  }, []);

  // Save as template
  const saveAsTemplate = useCallback(async (id: string, name: string) => {
    const { data, error } = await designsService.saveAsTemplate(id, name);

    if (error) {
      setState((prev) => ({ ...prev, error: error.message }));
      return null;
    }

    setState((prev) => ({
      ...prev,
      designs: prev.designs.map((d) =>
        d.id === id ? { ...d, is_template: true, name } : d
      ),
    }));

    return data;
  }, []);

  // Upload thumbnail
  const uploadThumbnail = useCallback(async (designId: string, blob: Blob) => {
    const url = await storageService.uploadDesignThumbnail(designId, blob);
    
    if (url) {
      await updateDesign(designId, { thumbnail_url: url });
    }
    
    return url;
  }, [updateDesign]);

  // Get templates
  const getTemplates = useCallback(async () => {
    return await designsService.getTemplates();
  }, []);

  // Go to page
  const goToPage = useCallback((page: number) => {
    loadDesigns(page);
  }, [loadDesigns]);

  return {
    designs: state.designs,
    loading: state.loading,
    error: state.error,
    page: state.page,
    totalPages: state.totalPages,
    total: state.total,
    loadDesigns,
    createDesign,
    updateDesign,
    deleteDesign,
    saveAsTemplate,
    uploadThumbnail,
    getTemplates,
    goToPage,
    nextPage: () => goToPage(state.page + 1),
    prevPage: () => goToPage(state.page - 1),
    refresh: () => loadDesigns(state.page),
  };
};

/**
 * useDesign Hook
 * ---------------
 * טעינת עיצוב בודד
 */

export const useDesign = (designId: string | undefined) => {
  const [design, setDesign] = useState<Design | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDesign = useCallback(async () => {
    if (!designId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const data = await designsService.getById(designId);

    if (!data) {
      setError('Design not found');
    } else {
      setDesign(data);
    }

    setLoading(false);
  }, [designId]);

  // Load on mount
  useState(() => {
    loadDesign();
  });

  return { design, loading, error, refresh: loadDesign };
};
