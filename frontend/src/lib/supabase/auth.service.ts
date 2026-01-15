import { getSupabase } from './client';
import type { User, LoginCredentials, RegisterData, ApiResponse } from './types';

/**
 * Auth Service
 * -------------
 * שירות אימות משתמשים
 */

export const authService = {
  /**
   * התחברות עם אימייל וסיסמה
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<User>> {
    const supabase = getSupabase();
    if (!supabase) {
      console.log('Auth: Supabase not configured');
      return { data: null, error: { message: 'Supabase not configured' } };
    }

    console.log('Auth: Attempting login for', credentials.email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      console.log('Auth: Login error', error.message);
      return { data: null, error: { message: error.message, code: error.name } };
    }

    console.log('Auth: Login successful, user ID:', data.user.id);

    // Get user profile - with timeout
    try {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.log('Auth: Profile fetch error', profileError.message);
        // Return basic user data even if profile fetch fails
        return { 
          data: {
            id: data.user.id,
            email: data.user.email || credentials.email,
            name: data.user.user_metadata?.name || 'User',
            role: 'photographer',
          } as User, 
          error: null 
        };
      }

      console.log('Auth: Profile loaded', profile);
      return { data: profile, error: null };
    } catch (err) {
      console.log('Auth: Profile fetch exception', err);
      // Return basic user data on error
      return { 
        data: {
          id: data.user.id,
          email: data.user.email || credentials.email,
          name: 'User',
          role: 'photographer',
        } as User, 
        error: null 
      };
    }
  },

  /**
   * הרשמה - יצירת משתמש חדש
   */
  async register(userData: RegisterData): Promise<ApiResponse<User>> {
    const supabase = getSupabase();
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }

    // Create auth user
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
        },
      },
    });

    if (error) {
      return { data: null, error: { message: error.message, code: error.name } };
    }

    if (!data.user) {
      return { data: null, error: { message: 'Failed to create user' } };
    }

    // Create user profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile, error: profileError } = await (supabase as any)
      .from('users')
      .insert({
        id: data.user.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone || null,
        business_name: userData.business_name || null,
        role: 'photographer',
      })
      .select()
      .single();

    if (profileError) {
      return { data: null, error: { message: profileError.message } };
    }

    return { data: profile, error: null };
  },

  /**
   * התנתקות
   */
  async logout(): Promise<void> {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
  },

  /**
   * קבלת המשתמש הנוכחי
   */
  async getCurrentUser(): Promise<User | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return profile;
  },

  /**
   * בדיקה אם מחובר
   */
  async isLoggedIn(): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  /**
   * שליחת מייל לאיפוס סיסמה
   */
  async resetPassword(email: string): Promise<ApiResponse<null>> {
    const supabase = getSupabase();
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data: null, error: null };
  },

  /**
   * עדכון סיסמה
   */
  async updatePassword(newPassword: string): Promise<ApiResponse<null>> {
    const supabase = getSupabase();
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data: null, error: null };
  },

  /**
   * עדכון פרופיל
   */
  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    const supabase = getSupabase();
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: { message: 'Not logged in' } };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data, error: null };
  },

  /**
   * האזנה לשינויים באימות
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    const supabase = getSupabase();
    if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };

    return supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        callback(profile);
      } else {
        callback(null);
      }
    });
  },
};
