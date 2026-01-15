// ==========================================
// 💳 Pricing Page - דף תמחור והרשמה
// ==========================================

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PAYPAL_CONFIG, SUBSCRIPTION_PLANS, getPayPalSdkUrl } from '@/config/paypal.config';
import { paypalService } from '@/lib/paypal/paypal.service';
import { getSupabase } from '@/lib/supabase/client';

// ==========================================
// PayPal Button Component
// ==========================================

interface PayPalButtonProps {
  planId: string;
  onSuccess: (subscriptionId: string) => void;
  onError: (error: Error) => void;
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        style?: Record<string, string>;
        createSubscription: (data: unknown, actions: { subscription: { create: (config: { plan_id: string }) => Promise<string> } }) => Promise<string>;
        onApprove: (data: { subscriptionID: string }) => void;
        onError?: (error: Error) => void;
      }) => { render: (selector: string) => void };
    };
  }
}

const PayPalButton: React.FC<PayPalButtonProps> = ({ planId, onSuccess, onError }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerId = `paypal-button-${planId}`;

  useEffect(() => {
    // Check if PayPal SDK is already loaded
    if (window.paypal) {
      setIsLoaded(true);
      return;
    }

    // Load PayPal SDK
    const script = document.createElement('script');
    script.src = getPayPalSdkUrl();
    script.setAttribute('data-sdk-integration-source', 'button-factory');
    script.async = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => onError(new Error('Failed to load PayPal SDK'));
    document.body.appendChild(script);

    return () => {
      // Cleanup
      const existingScript = document.querySelector(`script[src="${getPayPalSdkUrl()}"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [onError]);

  useEffect(() => {
    if (!isLoaded || !window.paypal) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear any existing buttons
    container.innerHTML = '';

    // Render PayPal button
    window.paypal.Buttons({
      style: {
        shape: 'rect',
        color: 'gold',
        layout: 'vertical',
        label: 'subscribe',
      },
      createSubscription: (_data, actions) => {
        return actions.subscription.create({
          plan_id: planId,
        });
      },
      onApprove: (data) => {
        onSuccess(data.subscriptionID);
      },
      onError: (error) => {
        onError(error);
      },
    }).render(`#${containerId}`);
  }, [isLoaded, planId, containerId, onSuccess, onError]);

  return (
    <div id={containerId} className="min-h-[150px] flex items-center justify-center">
      {!isLoaded && (
        <div className="animate-pulse text-gray-400">טוען...</div>
      )}
    </div>
  );
};

// ==========================================
// Main Pricing Page
// ==========================================

const PricingPage = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'he';
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabase();
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      setIsLoading(false);

      // If logged in, check if already has subscription
      if (user) {
        const hasSubscription = await paypalService.hasActiveSubscription();
        if (hasSubscription) {
          navigate('/dashboard');
        }
      }
    };

    checkAuth();
  }, [navigate]);

  // Handle successful subscription
  const handleSuccess = useCallback(async (subscriptionId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const saved = await paypalService.saveSubscription(
        subscriptionId,
        PAYPAL_CONFIG.plans.pro
      );

      if (saved) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError('שגיאה בשמירת המנוי. אנא פנה לתמיכה.');
      }
    } catch (err) {
      setError('שגיאה בעיבוד התשלום. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Handle error
  const handleError = useCallback((err: Error) => {
    console.error('PayPal error:', err);
    setError('שגיאה בתהליך התשלום. אנא נסה שוב.');
  }, []);

  const plan = SUBSCRIPTION_PLANS.pro;

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ברוך הבא! 🎉</h2>
          <p className="text-gray-600 mb-4">
            המנוי שלך הופעל בהצלחה!<br />
            14 ימי ניסיון חינם התחילו.
          </p>
          <p className="text-gray-400 text-sm">מעביר אותך לדשבורד...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
          >
            🎨 Misgarot Online
          </button>
          
          {!isLoggedIn && (
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              {isRTL ? 'התחברות' : 'Login'}
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            {isRTL ? 'התחל לעצב מסגרות מקצועיות' : 'Start Designing Professional Frames'}
          </h1>
          <p className="text-xl text-gray-600">
            {isRTL ? '14 יום ניסיון חינם • ללא התחייבות • בטל בכל עת' : '14-day free trial • No commitment • Cancel anytime'}
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-indigo-500">
            {/* Popular Badge */}
            <div className="bg-indigo-500 text-white text-center py-2 text-sm font-medium">
              ⭐ {isRTL ? 'הכי פופולרי' : 'Most Popular'}
            </div>

            <div className="p-8">
              {/* Plan Name */}
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {isRTL ? plan.name : plan.nameEn}
              </h2>

              {/* Price */}
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-800">₪{plan.price}</span>
                <span className="text-gray-500">/{isRTL ? 'חודש' : 'month'}</span>
              </div>

              {/* Trial Notice */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-green-700">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">
                    {isRTL ? '14 יום ניסיון חינם!' : '14-day free trial!'}
                  </span>
                </div>
                <p className="text-green-600 text-sm mt-1">
                  {isRTL ? 'החיוב יתחיל רק אחרי תקופת הניסיון' : 'Billing starts after trial period'}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {(isRTL ? plan.features : plan.featuresEn).map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-indigo-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {/* PayPal Button or Login Prompt */}
              {isLoggedIn ? (
                <PayPalButton
                  planId={plan.id}
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              ) : (
                <div className="text-center">
                  <button
                    onClick={() => navigate('/login', { state: { returnTo: '/pricing' } })}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium text-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
                  >
                    {isRTL ? 'התחבר כדי להתחיל' : 'Login to Start'}
                  </button>
                  <p className="text-gray-500 text-sm mt-3">
                    {isRTL ? 'אין לך חשבון?' : "Don't have an account?"}{' '}
                    <button 
                      onClick={() => navigate('/login')}
                      className="text-indigo-600 hover:underline"
                    >
                      {isRTL ? 'הירשם עכשיו' : 'Sign up now'}
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center text-gray-500 text-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              {isRTL ? 'תשלום מאובטח באמצעות PayPal' : 'Secure payment via PayPal'}
            </div>
            <p>
              {isRTL ? 'ביטול בכל עת • ללא התחייבות' : 'Cancel anytime • No commitment'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PricingPage;
