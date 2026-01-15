// ==========================================
// 💳 PayPal Configuration
// ==========================================
// הגדרות PayPal למנויים

export const PAYPAL_CONFIG = {
  // Client ID - מ-PayPal Developer Portal (Misgarot Online App)
  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'ARQ5h_2sLfeysLKGDzrkxQQPhSxoOCfH5z6_UfrF1Zl5quluYmL4frR0bMbuKr5dG-Cdq4WqYbSu_3kC',
  
  // Plan IDs - מ-PayPal Subscriptions
  plans: {
    // מנוי Pro - 14 יום ניסיון + 98₪/חודש
    pro: 'P-1RA11865WR273030ENE2KT4Q',
  },
  
  // מצב - sandbox לבדיקות, live לייצור
  mode: (import.meta.env.VITE_PAYPAL_MODE || 'live') as 'sandbox' | 'live',
  
  // מטבע
  currency: 'ILS',
} as const;

// ==========================================
// 📦 Subscription Plans - תוכניות מנוי
// ==========================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  trialDays: number;
  features: string[];
  featuresEn: string[];
  popular?: boolean;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  pro: {
    id: PAYPAL_CONFIG.plans.pro,
    name: 'מנוי מקצועי',
    nameEn: 'Pro Plan',
    price: 98,
    currency: 'ILS',
    interval: 'month',
    trialDays: 14,
    popular: true,
    features: [
      '14 יום ניסיון חינם',
      'גישה לכל המסגרות',
      'עיצובים ללא הגבלה',
      'שליחה ישירה למייל',
      'תמיכה בעברית',
      'עדכונים שוטפים',
    ],
    featuresEn: [
      '14-day free trial',
      'Access to all frames',
      'Unlimited designs',
      'Direct email sending',
      'Hebrew support',
      'Regular updates',
    ],
  },
};

// ==========================================
// 🔧 Helper Functions
// ==========================================

/**
 * Get PayPal SDK URL
 */
export const getPayPalSdkUrl = (): string => {
  const params = new URLSearchParams({
    'client-id': PAYPAL_CONFIG.clientId,
    'vault': 'true',
    'intent': 'subscription',
    'currency': PAYPAL_CONFIG.currency,
  });
  
  return `https://www.paypal.com/sdk/js?${params.toString()}`;
};

/**
 * Check if PayPal is configured
 */
export const isPayPalConfigured = (): boolean => {
  return (
    PAYPAL_CONFIG.clientId.length > 10 &&
    PAYPAL_CONFIG.plans.pro.startsWith('P-')
  );
};
