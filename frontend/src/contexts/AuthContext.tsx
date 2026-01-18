// ==========================================
// 🔐 Auth Context - ניהול אימות מרכזי
// ==========================================
// 
// זהו ה-Single Source of Truth לאימות באפליקציה.
// כל קומפוננטה שצריכה מידע על משתמש תשתמש ב-useAuthContext
// במקום לעשות queries עצמאיים ל-Supabase.
//
// ==========================================

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// ==========================================
// Types
// ==========================================

export type UserRole = 'admin' | 'photographer' | 'client';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  business_name?: string;
  website?: string;
  is_active: boolean;
  is_starred?: boolean; // Starred photographers can publish directly
  subscription_tier?: string;
  subscription_status?: string;
  subscription_expires_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
  profile?: UserProfile | null;
}

interface AuthContextType {
  // State
  user: SupabaseUser | null;       // Supabase Auth user
  profile: UserProfile | null;      // User profile from DB
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStarred: boolean; // Can publish directly without admin approval
  
  // Actions
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ==========================================
// Context
// ==========================================

const AuthContext = createContext<AuthContextType | null>(null);

// ==========================================
// Provider
// ==========================================

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ==========================================
  // Fetch Profile from DB
  // ==========================================
  const fetchProfile = useCallback(async (authUser: SupabaseUser): Promise<UserProfile | null> => {
    const supabase = getSupabase();
    if (!supabase) return null;

    console.log('🔍 AuthContext: Fetching profile for user ID:', authUser.id);
    console.log('🔍 AuthContext: User email:', authUser.email);

    try {
      // Simple query - just get by email (more reliable)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profileData, error } = await (supabase as any)
        .from('users')
        .select('*')
        .eq('email', authUser.email || '')
        .single();

      if (error) {
        console.error('❌ AuthContext: Error fetching profile:', error.message);
        // Try to create profile if not found
        if (error.code === 'PGRST116') {
          console.log('⚠️ AuthContext: Profile not found, creating new one...');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: newProfile, error: createError } = await (supabase as any)
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email,
              name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
              role: 'photographer',
              subscription_plan: 'free',
              is_active: true,
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ AuthContext: Failed to create profile:', createError.message);
            return null;
          }

          console.log('✅ AuthContext: New profile created');
          return newProfile as UserProfile;
        }
        return null;
      }

      if (profileData) {
        console.log('✅ AuthContext: Profile loaded:', profileData.name, profileData.role);
        return profileData as UserProfile;
      }

      return null;
    } catch (err) {
      console.error('❌ AuthContext: fetchProfile error:', err);
      return null;
    }
  }, []);

  // ==========================================
  // Initialize - Check existing session
  // ==========================================
  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      const supabase = getSupabase();
      if (!supabase) {
        console.warn('⚠️ AuthContext: Supabase not configured');
        if (isMounted) setIsLoading(false);
        return;
      }

      console.log('🚀 AuthContext: Initializing...');

      try {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => {
            console.warn('⚠️ AuthContext: Session check timeout');
            resolve(null);
          }, 10000); // 10 second timeout
        });

        // Get current session
        const sessionPromise = supabase.auth.getSession();
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        
        // If timed out, result will be null
        const session = result && 'data' in result ? result.data.session : null;
        
        if (session?.user) {
          console.log('✅ AuthContext: Found existing session');
          if (isMounted) {
            setUser(session.user);
            const userProfile = await fetchProfile(session.user);
            setProfile(userProfile);
          }
        } else {
          console.log('ℹ️ AuthContext: No existing session');
        }
      } catch (error) {
        console.error('❌ AuthContext: Error during initialization:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }

      // Listen to auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 AuthContext: Auth state changed:', event);

        if (session?.user) {
          if (isMounted) setUser(session.user);
          if (event === 'SIGNED_IN') {
            const userProfile = await fetchProfile(session.user);
            if (isMounted) setProfile(userProfile);
          }
        } else {
          if (isMounted) {
            setUser(null);
            setProfile(null);
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    initAuth();
    
    return () => {
      isMounted = false;
    };
  }, [fetchProfile]);

  // ==========================================
  // Login
  // ==========================================
  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const supabase = getSupabase();
    if (!supabase) {
      console.error('❌ AuthContext: Supabase client is null');
      return { success: false, error: 'שגיאת חיבור למערכת' };
    }

    console.log('🔐 AuthContext: Login attempt for:', email);
    console.log('🔐 AuthContext: Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

    try {
      console.log('🔐 AuthContext: Calling signInWithPassword...');
      const startTime = Date.now();
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      console.log('🔐 AuthContext: Response received in', Date.now() - startTime, 'ms');

      if (error) {
        console.error('❌ AuthContext: Login error:', error.message);
        return { 
          success: false, 
          error: error.message === 'Invalid login credentials' 
            ? 'אימייל או סיסמה שגויים' 
            : error.message 
        };
      }

      if (data.user) {
        console.log('✅ AuthContext: Login successful');
        setUser(data.user);
        const userProfile = await fetchProfile(data.user);
        setProfile(userProfile);
        console.log('✅ AuthContext: Profile set, role:', userProfile?.role);
        return { success: true, profile: userProfile };
      }

      return { success: true };
    } catch (err) {
      console.error('❌ AuthContext: Login error:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'שגיאה בהתחברות' 
      };
    }
  }, [fetchProfile]);

  // ==========================================
  // Register
  // ==========================================
  const register = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, error: 'שגיאת חיבור למערכת' };
    }

    console.log('📝 AuthContext: Register attempt for:', email);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      console.error('❌ AuthContext: Register error:', error.message);
      return { success: false, error: error.message };
    }

    if (data.user) {
      // Create profile in users table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileError } = await (supabase as any)
        .from('users')
        .upsert({
          id: data.user.id,
          email: email,
          name: name,
          role: 'photographer',
          is_active: true,
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('❌ AuthContext: Profile creation error:', profileError);
        console.error('❌ Error details:', JSON.stringify(profileError));
        // Don't fail registration if profile creation fails - user can still login
        // The profile will be created on next login attempt
      } else {
        console.log('✅ AuthContext: Profile created successfully');
      }

      console.log('✅ AuthContext: Registration successful');
    }

    return { success: true };
  }, []);

  // ==========================================
  // Logout
  // ==========================================
  const logout = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    console.log('👋 AuthContext: User logged out');
  }, []);

  // ==========================================
  // Refresh Profile
  // ==========================================
  const refreshProfile = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    // Refresh user data from auth
    const { data: { user: refreshedUser } } = await supabase.auth.getUser();
    if (refreshedUser) {
      setUser(refreshedUser);
      const userProfile = await fetchProfile(refreshedUser);
      setProfile(userProfile);
    }
  }, [fetchProfile]);

  // ==========================================
  // Computed Values
  // ==========================================
  const isAuthenticated = !!user;
  const isAdmin = profile?.role === 'admin';
  const isStarred = profile?.is_starred === true || isAdmin; // Admins are always "starred"

  // ==========================================
  // Context Value
  // ==========================================
  const value: AuthContextType = {
    user,
    profile,
    isLoading,
    isAuthenticated,
    isAdmin,
    isStarred,
    login,
    register,
    logout,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ==========================================
// Hook
// ==========================================

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

// ==========================================
// Export
// ==========================================

export default AuthContext;
