// ==========================================
// 🔐 Login Page - דף התחברות
// ==========================================

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthContext } from '@/contexts';
import { getSupabase } from '@/lib/supabase/client';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register: authRegister, isAuthenticated, isLoading: authLoading, profile } = useAuthContext();
  
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated && profile) {
      console.log('🔄 LoginPage: User authenticated, role:', profile.role);
      
      // Route based on role
      if (profile.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (profile.role === 'client') {
        navigate('/client-portal', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [authLoading, isAuthenticated, profile, navigate]);

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError('');
    
    const supabase = getSupabase();
    if (!supabase) {
      setError('שגיאת חיבור למערכת');
      setIsGoogleLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setError(error.message);
        setIsGoogleLoading(false);
      }
      // If successful, user will be redirected to Google
    } catch (err) {
      console.error('Google sign in error:', err);
      setError('שגיאה בהתחברות עם Google');
      setIsGoogleLoading(false);
    }
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'login') {
        console.log('🔐 LoginPage: Attempting login for:', email);
        const result = await login(email, password);
        
        if (!result.success) {
          // Translate common error messages
          let errorMessage = result.error || 'שגיאה בהתחברות';
          if (result.error?.includes('Email not confirmed')) {
            errorMessage = 'האימייל טרם אומת. בדוק את תיבת הדואר שלך ולחץ על קישור האימות';
          } else if (result.error?.includes('Invalid login credentials')) {
            errorMessage = 'אימייל או סיסמה שגויים';
          }
          setError(errorMessage);
          setIsSubmitting(false);
          return;
        }
        console.log('✅ LoginPage: Login successful, waiting for redirect...');
        
      } else if (mode === 'register') {
        const result = await authRegister(email, password, name);
        
        if (!result.success) {
          setError(result.error || 'שגיאה בהרשמה');
          setIsSubmitting(false);
          return;
        }
        // Show email verification message
        setShowEmailVerification(true);
        setSuccess('');
        setIsSubmitting(false);
        
      } else if (mode === 'forgot') {
        const supabase = getSupabase();
        if (!supabase) {
          setError('שגיאת חיבור למערכת');
          setIsSubmitting(false);
          return;
        }
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
        if (resetError) {
          setError(resetError.message);
        } else {
          setSuccess('נשלח אימייל עם קישור לאיפוס סיסמה');
        }
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('❌ LoginPage: Unexpected error:', err);
      setError('אירעה שגיאה לא צפויה');
      setIsSubmitting(false);
    }
  };

  // Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  // Email Verification Screen
  if (showEmailVerification) {
    return (
      <div className="min-h-screen flex" dir="rtl">
        {/* Left Panel - Same as main */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-12 flex-col justify-center items-center text-white">
          <div className="max-w-md text-center">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="w-32 h-24 border-4 border-white/90 rounded-lg shadow-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <div className="w-24 h-16 bg-white/20 rounded flex items-center justify-center">
                    <span className="text-4xl">📸</span>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <span className="text-sm">🧲</span>
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">עיצוב מסגרות מגנט</h1>
            <h2 className="text-2xl font-light mb-6">בקלות ובמהירות</h2>
          </div>
        </div>

        {/* Right Panel - Email Verification */}
        <div className="flex-1 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md text-center">
            {/* Success Animation */}
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <span className="text-5xl">✉️</span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              כמעט סיימנו! 🎉
            </h2>
            
            <p className="text-gray-600 mb-6 text-lg">
              שלחנו לך אימייל אימות לכתובת:
            </p>
            
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
              <p className="text-indigo-700 font-semibold text-lg" dir="ltr">
                {email}
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div className="text-right">
                  <p className="text-amber-800 font-medium mb-1">מה עכשיו?</p>
                  <ul className="text-amber-700 text-sm space-y-1">
                    <li>• פתח את תיבת האימייל שלך</li>
                    <li>• לחץ על הקישור באימייל לאימות</li>
                    <li>• חזור לכאן והתחבר!</li>
                  </ul>
                </div>
              </div>
            </div>

            <p className="text-gray-500 text-sm mb-6">
              לא קיבלת? בדוק את תיקיית הספאם או המתן מספר דקות
            </p>

            <button
              onClick={() => {
                setShowEmailVerification(false);
                setMode('login');
              }}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              🔐 המשך להתחברות
            </button>

            <button
              onClick={() => setShowEmailVerification(false)}
              className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
            >
              ← חזרה להרשמה
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-12 flex-col justify-center items-center text-white">
        <div className="max-w-md text-center">
          {/* Custom Logo - Magnet Frame Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              {/* Outer frame */}
              <div className="w-32 h-24 border-4 border-white/90 rounded-lg shadow-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                {/* Inner photo area */}
                <div className="w-24 h-16 bg-white/20 rounded flex items-center justify-center">
                  <span className="text-4xl">📸</span>
                </div>
              </div>
              {/* Magnet indicator */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <span className="text-sm">🧲</span>
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">עיצוב מסגרות מגנט</h1>
          <h2 className="text-2xl font-light mb-6">בקלות ובמהירות</h2>
          <p className="text-lg opacity-90">הכלי המוביל לצלמי אירועים בישראל.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              {/* Small Logo */}
              <div className="w-10 h-8 border-2 border-indigo-600 rounded flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
                <span className="text-sm">📸</span>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Misgarot Online
              </h1>
            </Link>
            <p className="text-gray-500 mt-2">
              {mode === 'login' && 'ברוך הבא! התחבר לחשבונך'}
              {mode === 'register' && 'צור חשבון חדש'}
              {mode === 'forgot' && 'שחזר סיסמה'}
            </p>
          </div>

          {mode !== 'forgot' && (
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${mode === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'}`}
              >
                התחברות
              </button>
              <button
                onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${mode === 'register' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'}`}
              >
                הרשמה
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              ❌ {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              ✅ {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                  placeholder="השם שלך"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                placeholder="email@example.com"
                required
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">סיסמה</label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => setMode('forgot')} className="text-sm text-indigo-600">
                      שכחת סיסמה?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  מעבד...
                </>
              ) : (
                <>
                  {mode === 'login' && '🔐 התחבר'}
                  {mode === 'register' && '✨ צור חשבון'}
                  {mode === 'forgot' && '📧 שלח קישור'}
                </>
              )}
            </button>

            {mode === 'forgot' && (
              <button type="button" onClick={() => setMode('login')} className="w-full py-3 border rounded-lg">
                חזרה להתחברות
              </button>
            )}
          </form>

          {/* Google Sign In */}
          {mode !== 'forgot' && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">או התחבר עם</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full py-3 px-4 border border-gray-300 rounded-lg flex items-center justify-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                התחבר עם Google
              </button>
            </>
          )}

          <div className="mt-6">
            <Link to="/categories" className="w-full py-3 px-4 border rounded-lg flex items-center justify-center gap-2 text-gray-700">
              🎨 התחל עיצוב בלי הרשמה
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
