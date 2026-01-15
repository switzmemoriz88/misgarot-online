// ==========================================
// 🎉 Client Welcome Page - עמוד ברוכים הבאים ללקוח
// ==========================================

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSupabase } from '@/lib/supabase/client';

interface PhotographerInfo {
  name: string;
  business_name?: string;
  business_logo?: string;
}

const ClientWelcomePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [clientName, setClientName] = useState('');
  const [photographer, setPhotographer] = useState<PhotographerInfo | null>(null);

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setError('קישור לא תקין');
      setIsLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    const supabase = getSupabase();
    if (!supabase || !token) {
      setError('שגיאת חיבור');
      setIsLoading(false);
      return;
    }

    try {
      // Find client by magic link token
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: client, error: clientError } = await (supabase as any)
        .from('users')
        .select('*, photographer:photographer_id(name, business_name, business_logo)')
        .eq('magic_link_token', token)
        .gt('magic_link_expires_at', new Date().toISOString())
        .single();

      if (clientError || !client) {
        setError('הקישור פג תוקף או לא תקין. בקש מהצלם שלך קישור חדש.');
        setIsLoading(false);
        return;
      }

      setClientName(client.name);
      setPhotographer(client.photographer as PhotographerInfo);
      
      // Store client info in session
      sessionStorage.setItem('client_id', client.id);
      sessionStorage.setItem('client_name', client.name);
      sessionStorage.setItem('photographer_id', client.photographer_id);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error verifying token:', err);
      setError('שגיאה באימות הקישור');
      setIsLoading(false);
    }
  };

  const handleStart = () => {
    navigate('/categories');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">מאמת את הקישור...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-pink-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl">😕</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">אופס!</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            חזרה לדף הבית
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50" dir="rtl">
      {/* Photographer Badge - Always visible */}
      <div className="fixed top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-4 py-2 flex items-center gap-3 z-50">
        {photographer?.business_logo ? (
          <img 
            src={photographer.business_logo} 
            alt={photographer.business_name || photographer.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
            📷
          </div>
        )}
        <div className="text-right">
          <p className="text-xs text-gray-500">הצלם שלך</p>
          <p className="font-medium text-gray-800">{photographer?.business_name || photographer?.name}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Welcome Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 p-8 text-center text-white">
              <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                <span className="text-5xl">💍</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">שלום {clientName}!</h1>
              <p className="text-white/90 text-lg">ברוכים הבאים לעיצוב מסגרת המגנט שלכם</p>
            </div>

            {/* Content */}
            <div className="p-8">
              <h2 className="text-xl font-semibold text-gray-800 text-center mb-6">
                איך זה עובד? 🎨
              </h2>

              {/* Steps */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4 p-4 bg-pink-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">בחרו קטגוריה ומסגרת</h3>
                    <p className="text-gray-600 text-sm">עברו על מגוון המסגרות ובחרו את הסגנון שמתאים לכם</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">עצבו רוחב ואורך</h3>
                    <p className="text-gray-600 text-sm">הוסיפו טקסט, תמונות ואלמנטים לשני המצבים - רוחב ואורך</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-rose-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">שלחו לצלם</h3>
                    <p className="text-gray-600 text-sm">מלאו את פרטי האירוע ושלחו - הצלם יקבל את העיצוב שלכם</p>
                  </div>
                </div>
              </div>

              {/* Important Note */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
                <p className="text-amber-800 text-sm text-center">
                  <span className="font-semibold">💡 חשוב:</span> יש לעצב את שני המצבים (רוחב ואורך) כדי לשלוח את ההזמנה
                </p>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleStart}
                className="w-full py-4 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 text-white text-lg font-bold rounded-xl hover:shadow-lg transition-all transform hover:scale-[1.02]"
              >
                🎨 בואו נתחיל!
              </button>

              <p className="text-center text-gray-400 text-sm mt-4">
                העיצוב יישמר אוטומטית ותוכלו לחזור אליו בכל עת
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-400 text-xs mt-6">
            מסגרות מגנט מעוצבות • Misgarot Online
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientWelcomePage;
