// ==========================================
// Send Order Confirmation Email - Edge Function
// שליחת אימייל אישור הזמנה
// ==========================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@misgarot.co.il';
const APP_URL = Deno.env.get('APP_URL') || 'https://misgarot.co.il';

interface OrderConfirmationPayload {
  toEmail: string;
  toName: string;
  orderNumber: string;
  designThumbnail?: string;
  photographerName: string;
  photographerBusiness?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const payload: OrderConfirmationPayload = await req.json();
    const { toEmail, toName, orderNumber, designThumbnail, photographerName, photographerBusiness } = payload;

    // Validate required fields
    if (!toEmail || !orderNumber) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const businessName = photographerBusiness || photographerName || 'מסגרות';

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>אישור הזמנה - ${orderNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                ✅ הזמנתך התקבלה!
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                ${businessName}
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; color: #333; margin: 0 0 20px 0;">
                שלום <strong>${toName}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #555; line-height: 1.8; margin: 0 0 30px 0;">
                תודה על הזמנתך! קיבלנו את בקשתך ונטפל בה בהקדם.
              </p>
              
              <!-- Order Number Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; border: 2px solid #93c5fd; margin: 0 0 30px 0;">
                <tr>
                  <td style="padding: 25px; text-align: center;">
                    <p style="font-size: 14px; color: #1e40af; margin: 0 0 8px 0; font-weight: 600;">
                      🔢 מספר הזמנה
                    </p>
                    <p style="font-size: 32px; color: #1e40af; margin: 0; font-weight: bold; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                      ${orderNumber}
                    </p>
                  </td>
                </tr>
              </table>
              
              ${designThumbnail ? `
              <!-- Design Preview -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <p style="font-size: 14px; color: #666; margin: 0 0 10px 0;">תצוגה מקדימה של העיצוב:</p>
                    <img src="${designThumbnail}" alt="תצוגה מקדימה" style="max-width: 300px; border-radius: 8px; border: 1px solid #e5e7eb;" />
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-radius: 12px; border-right: 4px solid #f59e0b; margin: 0 0 30px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="font-size: 14px; color: #92400e; margin: 0; line-height: 1.6;">
                      💡 <strong>מה קורה עכשיו?</strong><br/>
                      הצוות שלנו יבדוק את ההזמנה ויעדכן אותך כשהמסגרת תהיה מוכנה להורדה.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${APP_URL}/my-orders" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">
                      📋 צפייה בהזמנות שלי
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 13px; color: #64748b; margin: 0 0 10px 0;">
                המייל הזה נשלח מ-${businessName}
              </p>
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                © ${new Date().getFullYear()} כל הזכויות שמורות
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Plain text version
    const emailText = `
שלום ${toName},

תודה על הזמנתך!

מספר הזמנה: ${orderNumber}

קיבלנו את בקשתך ונטפל בה בהקדם.

לצפייה בהזמנות שלך: ${APP_URL}/my-orders

בברכה,
${businessName}
    `.trim();

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${businessName} <${FROM_EMAIL}>`,
        to: [toEmail],
        subject: `✅ אישור הזמנה #${orderNumber}`,
        html: emailHtml,
        text: emailText,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', result);
      return new Response(
        JSON.stringify({ success: false, error: result.message || 'Failed to send email' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Order confirmation email sent successfully:', result.id);

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-order-confirmation:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
