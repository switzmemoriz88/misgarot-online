// ==========================================
// Send Welcome Email - שליחת מייל ברוכים הבאים ללקוח חדש
// ==========================================
// Edge Function for Supabase
// Uses Resend for email delivery
// ==========================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@misgarot.co.il";
const SITE_URL = Deno.env.get("SITE_URL") || "https://misgarot.co.il";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  clientEmail: string;
  clientName: string;
  photographerName: string;
  photographerBusiness?: string;
  eventDate?: string;
  password: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      clientEmail,
      clientName,
      photographerName,
      photographerBusiness,
      eventDate,
      password,
    }: WelcomeEmailRequest = await req.json();

    // Validate required fields
    if (!clientEmail || !clientName || !password) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format event date if provided
    const formattedDate = eventDate 
      ? new Date(eventDate).toLocaleDateString('he-IL', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : null;

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ברוכים הבאים למערכת מסגרות</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; direction: rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🎨 מסגרות אונליין</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">עיצוב מסגרות למגנטים בקלות</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">שלום ${clientName}! 👋</h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                ${photographerBusiness || photographerName} יצר/ה עבורך חשבון במערכת מסגרות אונליין.
                עכשיו תוכל/י לעצב מסגרות מדהימות למגנטים של האירוע שלך!
              </p>
              
              ${formattedDate ? `
              <div style="background-color: #f0fdf4; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px;">
                <p style="color: #166534; margin: 0; font-size: 14px;">
                  📅 <strong>תאריך האירוע:</strong> ${formattedDate}
                </p>
              </div>
              ` : ''}
              
              <!-- Credentials Box -->
              <div style="background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e0e7ff;">
                <h3 style="color: #4338ca; margin: 0 0 16px; font-size: 18px;">🔐 פרטי ההתחברות שלך</h3>
                
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">שם משתמש (מייל):</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 0 16px;">
                      <code style="background-color: #ffffff; padding: 8px 16px; border-radius: 8px; font-size: 16px; color: #1f2937; display: inline-block; border: 1px solid #e5e7eb;">${clientEmail}</code>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">סיסמה:</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <code style="background-color: #ffffff; padding: 8px 16px; border-radius: 8px; font-size: 16px; color: #1f2937; display: inline-block; border: 1px solid #e5e7eb;">${password}</code>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${SITE_URL}/login" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                  התחבר/י ועצב/י מסגרת 🎨
                </a>
              </div>
              
              <!-- Steps -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-top: 24px;">
                <h4 style="color: #374151; margin: 0 0 16px; font-size: 16px;">📋 איך זה עובד?</h4>
                <ol style="color: #4b5563; font-size: 14px; line-height: 1.8; margin: 0; padding-right: 20px;">
                  <li>התחבר/י עם הפרטים למעלה</li>
                  <li>בחר/י מסגרת מתוך המאגר</li>
                  <li>הוסף/י טקסט ותמונות</li>
                  <li>שלח/י את העיצוב לצלם</li>
                </ol>
              </div>
              
              <!-- Video placeholder -->
              <div style="text-align: center; margin-top: 24px; padding: 20px; background-color: #fef3c7; border-radius: 12px;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  🎬 <strong>סרטון הדרכה</strong> - בקרוב!
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                מייל זה נשלח מ-${photographerBusiness || photographerName}
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0;">
                © ${new Date().getFullYear()} מסגרות אונליין. כל הזכויות שמורות.
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
שלום ${clientName}!

${photographerBusiness || photographerName} יצר/ה עבורך חשבון במערכת מסגרות אונליין.

פרטי ההתחברות שלך:
- שם משתמש (מייל): ${clientEmail}
- סיסמה: ${password}

${formattedDate ? `תאריך האירוע: ${formattedDate}` : ''}

התחבר/י כאן: ${SITE_URL}/login

איך זה עובד?
1. התחבר/י עם הפרטים למעלה
2. בחר/י מסגרת מתוך המאגר
3. הוסף/י טקסט ותמונות
4. שלח/י את העיצוב לצלם

בהצלחה!
    `;

    // Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `מסגרות אונליין <${FROM_EMAIL}>`,
        to: [clientEmail],
        subject: `🎨 ברוכים הבאים! פרטי ההתחברות שלך למערכת מסגרות`,
        html: emailHtml,
        text: emailText,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(
        JSON.stringify({ success: false, error: data }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, messageId: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error sending email:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
