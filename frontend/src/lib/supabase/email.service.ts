// ==========================================
// Email Service - שירות שליחת מיילים
// ==========================================

import { supabaseClient } from './client';

export interface WelcomeEmailData {
  clientEmail: string;
  clientName: string;
  photographerName: string;
  photographerBusiness?: string;
  eventDate?: string;
  password: string;
}

export interface OrderConfirmationData {
  toEmail: string;
  toName: string;
  orderNumber: string;
  designThumbnail?: string;
  photographerName: string;
  photographerBusiness?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send welcome email to new client with login credentials
 */
export const sendWelcomeEmail = async (data: WelcomeEmailData): Promise<EmailResult> => {
  try {
    const supabase = supabaseClient;
    if (!supabase) {
      console.warn('Supabase not configured, skipping email');
      return { success: false, error: 'Supabase not configured' };
    }

    const { data: result, error } = await supabase.functions.invoke('send-welcome-email', {
      body: data,
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }

    return result as EmailResult;
  } catch (err) {
    console.error('Failed to send welcome email:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = async (data: OrderConfirmationData): Promise<EmailResult> => {
  try {
    const supabase = supabaseClient;
    if (!supabase) {
      console.warn('Supabase not configured, skipping email');
      return { success: false, error: 'Supabase not configured' };
    }

    const { data: result, error } = await supabase.functions.invoke('send-order-confirmation', {
      body: data,
    });

    if (error) {
      console.error('Error sending order confirmation:', error);
      return { success: false, error: error.message };
    }

    return result as EmailResult;
  } catch (err) {
    console.error('Failed to send order confirmation:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};

export const emailService = {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
};

export default emailService;
