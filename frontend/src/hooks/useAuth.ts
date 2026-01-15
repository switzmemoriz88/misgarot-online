import { useState, useEffect, useCallback } from 'react';
import { authService, type User } from '../lib/supabase';

/**
 * useAuth Hook
 * -------------
 * ניהול אימות משתמשים
 */

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        setState({ user, loading: false, error: null });
      } catch {
        setState({ user: null, loading: false, error: null });
      }
    };

    checkAuth();

    // Listen to auth changes
    const { data } = authService.onAuthStateChange((user) => {
      setState((prev) => ({ ...prev, user, loading: false }));
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const { data, error } = await authService.login({ email, password });

    if (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
      return false;
    }

    setState({ user: data, loading: false, error: null });
    return true;
  }, []);

  // Register
  const register = useCallback(async (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    business_name?: string;
  }) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const { data: user, error } = await authService.register(data);

    if (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
      return false;
    }

    setState({ user, loading: false, error: null });
    return true;
  }, []);

  // Logout
  const logout = useCallback(async () => {
    await authService.logout();
    setState({ user: null, loading: false, error: null });
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    const { error } = await authService.resetPassword(email);
    if (error) {
      setState((prev) => ({ ...prev, error: error.message }));
      return false;
    }
    return true;
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<User>) => {
    setState((prev) => ({ ...prev, loading: true }));
    
    const { data, error } = await authService.updateProfile(updates);
    
    if (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
      return false;
    }

    setState((prev) => ({ ...prev, user: data, loading: false }));
    return true;
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isLoggedIn: !!state.user,
    isAdmin: state.user?.role === 'admin',
    isPhotographer: state.user?.role === 'photographer',
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    clearError,
  };
};
