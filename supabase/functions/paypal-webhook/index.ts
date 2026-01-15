// ==========================================
// 💳 PayPal Webhook Handler - Edge Function
// ==========================================
// מקבל עדכונים מ-PayPal על מנויים
// Deploy: supabase functions deploy paypal-webhook

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// PayPal Webhook Event Types
type PayPalEventType = 
  | 'BILLING.SUBSCRIPTION.CREATED'
  | 'BILLING.SUBSCRIPTION.ACTIVATED'
  | 'BILLING.SUBSCRIPTION.UPDATED'
  | 'BILLING.SUBSCRIPTION.EXPIRED'
  | 'BILLING.SUBSCRIPTION.CANCELLED'
  | 'BILLING.SUBSCRIPTION.SUSPENDED'
  | 'BILLING.SUBSCRIPTION.PAYMENT.FAILED'
  | 'PAYMENT.SALE.COMPLETED';

interface PayPalWebhookEvent {
  id: string;
  event_type: PayPalEventType;
  resource: {
    id: string;
    plan_id?: string;
    status?: string;
    subscriber?: {
      email_address?: string;
    };
    billing_info?: {
      next_billing_time?: string;
    };
  };
  create_time: string;
}

// Main handler
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse webhook event
    const event: PayPalWebhookEvent = await req.json();
    console.log("Received PayPal webhook:", event.event_type, event.resource.id);

    const subscriptionId = event.resource.id;
    const eventType = event.event_type;

    // Handle different event types
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.CREATED': {
        // Subscription activated - update status
        const { error } = await supabase
          .from('subscriptions')
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('paypal_subscription_id', subscriptionId);

        if (error) {
          console.error('Error updating subscription:', error);
        } else {
          console.log('Subscription activated:', subscriptionId);
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        // Subscription cancelled
        const { error } = await supabase
          .from('subscriptions')
          .update({ 
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('paypal_subscription_id', subscriptionId);

        if (error) {
          console.error('Error cancelling subscription:', error);
        } else {
          console.log('Subscription cancelled:', subscriptionId);

          // Update user's subscription plan to free
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('paypal_subscription_id', subscriptionId)
            .single();

          if (sub?.user_id) {
            await supabase
              .from('users')
              .update({ subscription_plan: 'free' })
              .eq('id', sub.user_id);
          }
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        // Subscription expired
        const { error } = await supabase
          .from('subscriptions')
          .update({ 
            status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('paypal_subscription_id', subscriptionId);

        if (error) {
          console.error('Error expiring subscription:', error);
        } else {
          console.log('Subscription expired:', subscriptionId);
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        // Subscription suspended (payment failed)
        const { error } = await supabase
          .from('subscriptions')
          .update({ 
            status: 'pending',
            updated_at: new Date().toISOString(),
          })
          .eq('paypal_subscription_id', subscriptionId);

        if (error) {
          console.error('Error suspending subscription:', error);
        } else {
          console.log('Subscription suspended:', subscriptionId);
        }
        break;
      }

      case 'PAYMENT.SALE.COMPLETED': {
        // Payment received - extend subscription
        console.log('Payment completed for subscription:', subscriptionId);
        
        // Update next billing time if available
        if (event.resource.billing_info?.next_billing_time) {
          await supabase
            .from('subscriptions')
            .update({ 
              status: 'active',
              expires_at: event.resource.billing_info.next_billing_time,
              updated_at: new Date().toISOString(),
            })
            .eq('paypal_subscription_id', subscriptionId);
        }
        break;
      }

      default:
        console.log('Unhandled event type:', eventType);
    }

    // Return success
    return new Response(
      JSON.stringify({ received: true, event_type: eventType }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Webhook error:", error);
    
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
