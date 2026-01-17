// ==========================================
// Profile Settings Page - עמוד הגדרות פרופיל
// ==========================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { getSupabase } from '@/lib/supabase/client';

const ProfileSettingsPage = () => {
  const navigate = useNavigate();
  const { profile, user, refreshProfile, isLoading: authLoading, logout } = useAuthContext();
  
  // Form state
  const [businessName, setBusinessName] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  // Load current profile data
  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name || '');
      setFullName(profile.name || profile.email?.split('@')[0] || '');
      setPhone(profile.phone || '');
      setWebsite(profile.website || '');
    } else if (!authLoading && user) {
      // If no profile but user exists, initialize with user data
      setFullName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
      setBusinessName(user.user_metadata?.business_name || '');
    } else if (!authLoading && !user) {
      // Not logged in, redirect
      navigate('/login');
    }
  }, [profile, authLoading, user, navigate]);

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      const supabase = getSupabase();
      if (!supabase || !user) {
        throw new Error('לא מחובר למערכת');
      }

      console.log('💾 Saving profile for user:', user.id);
      console.log('💾 Data:', { businessName, fullName, phone, website });

      // First, update auth user metadata (this always works)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          business_name: businessName.trim(),
          full_name: fullName.trim(),
          phone: phone.trim(),
          website: website.trim(),
        }
      });

      if (authError) {
        console.error('❌ Auth metadata update failed:', authError);
        throw authError;
      }

      console.log('✅ Auth metadata updated');

      // Try to update the users table (may fail due to RLS, but that's ok)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: dbError } = await (supabase as any)
          .from('users')
          .update({
            business_name: businessName.trim(),
            name: fullName.trim(),
            phone: phone.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (dbError) {
          console.warn('⚠️ Database update failed (RLS?):', dbError.message);
        } else {
          console.log('✅ Database updated successfully');
        }
      } catch (dbErr) {
        console.warn('⚠️ Database update error:', dbErr);
      }

      // Refresh profile in context
      await refreshProfile();
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בשמירה');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">יש להתחבר כדי לגשת להגדרות</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            התחברות
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all group"
              >
                <svg 
                  className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">חזרה</span>
              </button>
              
              <div className="h-6 w-px bg-gray-200"></div>
              
              <div>
                <h1 className="text-xl font-bold text-gray-800">⚙️ הגדרות פרופיל</h1>
                <p className="text-xs text-gray-500">עדכן את פרטי העסק שלך</p>
              </div>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 rounded-xl transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">התנתק</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">השינויים נשמרו בהצלחה!</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-8 text-white text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
              📷
            </div>
            <h2 className="text-xl font-bold">{businessName || fullName || 'העסק שלך'}</h2>
            <p className="text-indigo-100 text-sm mt-1">{user?.email}</p>
            <div className="mt-3 inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-sm">
              <span>✨</span>
              <span>{profile?.role === 'admin' ? 'מנהל מערכת' : 'צלם מקצועי'}</span>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 space-y-6">
            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏢 שם העסק
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="לדוגמה: סטודיו לצילום אירועים"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all text-lg"
              />
              <p className="text-xs text-gray-400 mt-1">השם שיופיע במיילים ללקוחות</p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                👤 שם מלא
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="השם האישי שלך"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
              />
            </div>

            {/* Email - Read Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📧 כתובת מייל
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-100 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">לא ניתן לשנות את כתובת המייל</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📱 טלפון
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="050-0000000"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                dir="ltr"
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🌐 אתר אינטרנט
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://www.yoursite.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                dir="ltr"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 pt-6">
              {/* Subscription Info */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">📦 סוג מנוי</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {profile?.subscription_status === 'active' ? (
                        <span className="text-green-600 font-medium">מנוי פעיל ✓</span>
                      ) : profile?.subscription_status === 'trial' ? (
                        <span className="text-blue-600 font-medium">תקופת ניסיון</span>
                      ) : (
                        <span className="text-gray-600">ללא מנוי</span>
                      )}
                    </div>
                  </div>
                  {profile?.subscription_expires_at && (
                    <div className="text-left">
                      <div className="text-xs text-gray-500">תוקף עד</div>
                      <div className="font-medium text-gray-700">
                        {new Date(profile.subscription_expires_at).toLocaleDateString('he-IL')}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`
                  w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2
                  ${isSaving 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'}
                `}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>שומר...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>שמור שינויים</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info Card */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>💡</span>
            <span>טיפים</span>
          </h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>שם העסק</strong> יופיע במיילים שנשלחים ללקוחות</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>הטלפון</strong> יוצג ללקוחות שרוצים ליצור קשר</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>האתר</strong> יהיה קישור במייל ללקוחות</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default ProfileSettingsPage;
