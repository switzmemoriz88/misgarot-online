// ==========================================
// 💳 PayPal Service - ניהול מנויים
// ==========================================

import { getSupabase } from '@/lib/supabase/client';
import { SUBSCRIPTION_PLANS } from '@/config/paypal.config';

// ==========================================
// Types
// ==========================================

export interface PayPalSubscription {
  subscriptionId: string;
  planId: string;
  status: 'APPROVAL_PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
  startTime?: string;
  nextBillingTime?: string;
}

export interface SubscriptionStatus {
  isActive: boolean;
  plan: string | null;
  expiresAt: string | null;
  isTrial: boolean;
  daysLeft: number;
}

// ==========================================
// PayPal Service
// ==========================================

export const paypalService = {
  /**
   * Save subscription to database after PayPal approval
   */
  async saveSubscription(subscriptionId: string, planId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) {
      console.error('Supabase not configured');
      return false;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not logged in');
        return false;
      }

      // Find plan details
      const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === planId);
      const planName = plan ? 'pro' : 'free';

      // Calculate trial end date
      const now = new Date();

      // Save to subscriptions table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: subError } = await (supabase as any)
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          paypal_subscription_id: subscriptionId,
          paypal_plan_id: planId,
          plan: planName,
          status: 'active',
          price: plan?.price || 98,
          currency: 'ILS',
          starts_at: now.toISOString(),
          expires_at: null, // Recurring subscription - no expiry
        }, {
          onConflict: 'user_id',
        });

      if (subError) {
        console.error('Error saving subscription:', subError);
        return false;
      }

      // Update user's subscription status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: userError } = await (supabase as any)
        .from('users')
        .update({
          subscription_plan: planName,
          subscription_expires_at: null, // Recurring - no expiry
        })
        .eq('id', user.id);

      if (userError) {
        console.error('Error updating user:', userError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in saveSubscription:', error);
      return false;
    }
  },

  /**
   * Get current user's subscription status
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const supabase = getSupabase();
    if (!supabase) {
      return { isActive: false, plan: null, expiresAt: null, isTrial: false, daysLeft: 0 };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { isActive: false, plan: null, expiresAt: null, isTrial: false, daysLeft: 0 };
      }

      // Get subscription
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: subscription } = await (supabase as any)
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (!subscription) {
        return { isActive: false, plan: null, expiresAt: null, isTrial: false, daysLeft: 0 };
      }

      // Calculate if in trial period
      const startDate = new Date(subscription.starts_at);
      const now = new Date();
      const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      const isTrial = daysSinceStart < 14;
      const daysLeft = isTrial ? 14 - daysSinceStart : 0;

      return {
        isActive: subscription.status === 'active',
        plan: subscription.plan,
        expiresAt: subscription.expires_at,
        isTrial,
        daysLeft,
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return { isActive: false, plan: null, expiresAt: null, isTrial: false, daysLeft: 0 };
    }
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error cancelling subscription:', error);
        return false;
      }

      // Update user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('users')
        .update({ subscription_plan: 'free' })
        .eq('id', user.id);

      return true;
    } catch (error) {
      console.error('Error in cancelSubscription:', error);
      return false;
    }
  },

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    const status = await this.getSubscriptionStatus();
    return status.isActive;
  },
};

export default paypalService;
