// ==========================================
// 🔒 Protected Route - הגנה על דפים
// ==========================================
//
// משתמש ב-AuthContext במקום בדיקה עצמאית
// מבטיח Single Source of Truth לאימות
//
// ==========================================

import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts';
import { paypalService } from '@/lib/paypal/paypal.service';
import { useState, useEffect } from 'react';

// 🔧 DEV MODE - לעקוף הגנות בפיתוח
const DEV_MODE = import.meta.env.DEV || localStorage.getItem('DEV_MODE') === 'true';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
  allowedRoles?: ('admin' | 'photographer' | 'client')[];
}

/**
 * ProtectedRoute - הגנה על דפים
 * 
 * @param requireSubscription - האם נדרש מנוי פעיל (ברירת מחדל: true)
 * @param allowedRoles - תפקידים מורשים (ברירת מחדל: admin, photographer)
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireSubscription = true,
  allowedRoles = ['admin', 'photographer']
}) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, profile } = useAuthContext();
  const [subscriptionStatus, setSubscriptionStatus] = useState<'loading' | 'active' | 'inactive'>('loading');

  // Check subscription separately
  useEffect(() => {
    const checkSubscription = async () => {
      if (DEV_MODE || !requireSubscription) {
        setSubscriptionStatus('active');
        return;
      }

      const hasSubscription = await paypalService.hasActiveSubscription();
      setSubscriptionStatus(hasSubscription ? 'active' : 'inactive');
    };

    if (isAuthenticated) {
      checkSubscription();
    }
  }, [isAuthenticated, requireSubscription]);

  console.log('🔒 ProtectedRoute:', { isAuthenticated, isLoading, subscriptionStatus });

  // Loading state
  if (isLoading || (isAuthenticated && requireSubscription && subscriptionStatus === 'loading')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">טוען...</p>
        </div>
      </div>
    );
  }

  // DEV MODE bypass
  if (DEV_MODE) {
    console.log('🔧 DEV MODE - Bypassing protection');
    return <>{children}</>;
  }

  // Not logged in - redirect to login
  if (!isAuthenticated) {
    console.log('🔒 ProtectedRoute: Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role - clients go to client portal
  if (profile?.role === 'client' && !allowedRoles.includes('client')) {
    console.log('🔒 ProtectedRoute: Client accessing photographer page, redirecting to portal');
    return <Navigate to="/client-portal" replace />;
  }

  // Check if role is allowed
  if (profile?.role && !allowedRoles.includes(profile.role as 'admin' | 'photographer' | 'client')) {
    console.log('🔒 ProtectedRoute: Role not allowed:', profile.role);
    return <Navigate to="/" replace />;
  }

  // No subscription - redirect to pricing
  if (requireSubscription && subscriptionStatus === 'inactive') {
    console.log('🔒 ProtectedRoute: No subscription, redirecting to pricing');
    return <Navigate to="/pricing" state={{ from: location }} replace />;
  }

  // Authenticated with subscription - show content
  return <>{children}</>;
};

export default ProtectedRoute;
