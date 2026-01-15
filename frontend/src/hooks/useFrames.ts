import { useState, useEffect, useCallback } from 'react';
import { framesService, categoriesService, type Frame, type Category } from '../lib/supabase';

/**
 * useFrames Hook
 * ---------------
 * ניהול מסגרות מהשרת
 */

interface FramesState {
  frames: Frame[];
  categories: Category[];
  loading: boolean;
  error: string | null;
}

export const useFrames = () => {
  const [state, setState] = useState<FramesState>({
    frames: [],
    categories: [],
    loading: true,
    error: null,
  });

  // Load all data
  const loadData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [frames, categories] = await Promise.all([
        framesService.getAll(),
        categoriesService.getAll(),
      ]);

      setState({
        frames,
        categories,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Failed to load frames',
      }));
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get frames by category
  const getFramesByCategory = useCallback((categoryId: string) => {
    return state.frames.filter((f) => f.category_id === categoryId);
  }, [state.frames]);

  // Get frame by ID
  const getFrameById = useCallback((id: string) => {
    return state.frames.find((f) => f.id === id) || null;
  }, [state.frames]);

  // Get category by ID
  const getCategoryById = useCallback((id: string) => {
    return state.categories.find((c) => c.id === id) || null;
  }, [state.categories]);

  // Get premium frames
  const getPremiumFrames = useCallback(() => {
    return state.frames.filter((f) => f.is_premium);
  }, [state.frames]);

  return {
    frames: state.frames,
    categories: state.categories,
    loading: state.loading,
    error: state.error,
    getFramesByCategory,
    getFrameById,
    getCategoryById,
    getPremiumFrames,
    refresh: loadData,
  };
};

/**
 * useFramesByCategory Hook
 * -------------------------
 * טעינת מסגרות לפי קטגוריה ספציפית
 */

export const useFramesByCategory = (categoryId: string | undefined) => {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [framesData, categoryData] = await Promise.all([
          framesService.getByCategory(categoryId),
          categoriesService.getById(categoryId),
        ]);

        setFrames(framesData);
        setCategory(categoryData);
      } catch {
        setError('Failed to load frames');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [categoryId]);

  return { frames, category, loading, error };
};
